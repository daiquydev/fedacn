import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import goongjs from '@goongmaps/goong-js'
import { startActivity, updateActivity, completeActivity, discardActivity, getSportEvent } from '../../../apis/sportEventApi'
import sportCategoryApi from '../../../apis/sportCategoryApi'
import useActivityTracking, { formatDuration, formatPace } from '../../../hooks/useActivityTracking'
import toast from 'react-hot-toast'
import '@goongmaps/goong-js/dist/goong-js.css'
import './ActivityTracking.css'

// Set Goong Maptiles key from env
goongjs.accessToken = import.meta.env.VITE_GOONG_MAPTILES_KEY

export default function ActivityTracking() {
    const { eventId } = useParams()
    const navigate = useNavigate()
    const [activityId, setActivityId] = useState(null)
    const [showConfirmDiscard, setShowConfirmDiscard] = useState(false)
    const [showConfirmComplete, setShowConfirmComplete] = useState(false)
    const autoSaveTimerRef = useRef(null)
    const startedRef = useRef(false)

    // Goong Map refs
    const mapContainerRef = useRef(null)
    const mapRef = useRef(null)
    const markerRef = useRef(null)
    const routeSourceAdded = useRef(false)

    const tracker = useActivityTracking()

    // Fetch event info
    const { data: eventData } = useQuery({
        queryKey: ['sportEvent', eventId],
        queryFn: () => getSportEvent(eventId)
    })
    const event = eventData?.data?.result

    // Use event.category directly as label (from database)
    const activityLabel = event?.category || 'Hoạt động'

    // Fetch sport categories to get kcal_per_unit
    const { data: categoriesData } = useQuery({
        queryKey: ['sportCategories'],
        queryFn: () => sportCategoryApi.getAll(),
        staleTime: 60000
    })

    // Lookup kcal_per_unit by event's category name
    const kcalPerKm = (() => {
        const categories = categoriesData?.data?.result || []
        const matched = categories.find(c => c.name === event?.category)
        return matched?.kcal_per_unit || 0
    })()

    // Start activity mutation
    const startMutation = useMutation({
        mutationFn: (data) => startActivity(eventId, data),
        onSuccess: (res) => {
            const activity = res.data.result
            setActivityId(activity._id)
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Không thể bắt đầu hoạt động')
        }
    })

    // Update activity mutation (auto-save)
    const updateMutation = useMutation({
        mutationFn: (data) => updateActivity(eventId, activityId, data)
    })

    // Complete mutation
    const completeMutation = useMutation({
        mutationFn: (data) => completeActivity(eventId, activityId, data),
        onSuccess: () => {
            toast.success('Hoàn thành hoạt động! Tiến độ đã được ghi nhận.')
            navigate(`/sport-event/${eventId}/activity/${activityId}`)
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Lỗi khi hoàn thành')
        }
    })

    // Discard mutation
    const discardMutation = useMutation({
        mutationFn: () => discardActivity(eventId, activityId),
        onSuccess: () => {
            toast.success('Đã huỷ hoạt động')
            navigate(`/sport-event/${eventId}`)
        }
    })

    // Initialize Goong Map
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return

        const map = new goongjs.Map({
            container: mapContainerRef.current,
            style: 'https://tiles.goong.io/assets/goong_map_web.json',
            center: [106.660172, 10.762622], // [lng, lat] for Goong
            zoom: 16,
            attributionControl: false
        })

        map.on('load', () => {
            // Add route source and layer
            map.addSource('route', {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    properties: {},
                    geometry: { type: 'LineString', coordinates: [] }
                }
            })

            map.addLayer({
                id: 'route-line',
                type: 'line',
                source: 'route',
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: { 'line-color': '#4A90D9', 'line-width': 5, 'line-opacity': 0.85 }
            })

            routeSourceAdded.current = true
        })

        // Current position marker
        const el = document.createElement('div')
        el.className = 'tracking-current-marker'
        markerRef.current = new goongjs.Marker(el)
            .setLngLat([106.660172, 10.762622])
            .addTo(map)

        mapRef.current = map

        return () => {
            if (mapRef.current) {
                mapRef.current.remove()
                mapRef.current = null
            }
        }
    }, [])

    // Initialize - start tracking when event data is ready
    useEffect(() => {
        if (startedRef.current || !event) return
        startedRef.current = true

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords
                    startMutation.mutate({
                        activityType: 'running',
                        startLat: latitude,
                        startLng: longitude
                    })
                    tracker.start('running', { kcalPerKm })
                    // Center map on actual position
                    if (mapRef.current) {
                        mapRef.current.setCenter([longitude, latitude])
                        if (markerRef.current) markerRef.current.setLngLat([longitude, latitude])
                    }
                },
                () => {
                    toast.error('Không thể truy cập GPS. Vui lòng cho phép quyền truy cập vị trí.')
                    startMutation.mutate({ activityType: 'running' })
                    tracker.start('running', { kcalPerKm })
                },
                { enableHighAccuracy: true, timeout: 10000 }
            )
        } else {
            startMutation.mutate({ activityType: 'running' })
            tracker.start('running', { kcalPerKm })
        }

        return () => {
            if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [event])

    // Update map when position changes
    useEffect(() => {
        if (!tracker.currentPosition || !mapRef.current) return

        const { lat, lng } = tracker.currentPosition

        // Update marker
        if (markerRef.current) {
            markerRef.current.setLngLat([lng, lat])
        }

        // Pan map
        mapRef.current.easeTo({ center: [lng, lat], duration: 500 })

        // Update route polyline
        if (routeSourceAdded.current && tracker.gpsPoints.length > 1) {
            const coordinates = tracker.gpsPoints.map(p => [p.lng, p.lat])
            const source = mapRef.current.getSource('route')
            if (source) {
                source.setData({
                    type: 'Feature',
                    properties: {},
                    geometry: { type: 'LineString', coordinates }
                })
            }
        }
    }, [tracker.currentPosition, tracker.gpsPoints])

    // Auto-save every 30 seconds
    useEffect(() => {
        if (activityId && tracker.isTracking) {
            autoSaveTimerRef.current = setInterval(() => {
                if (activityId) {
                    const snapshot = tracker.getSnapshot()
                    updateMutation.mutate({
                        ...snapshot,
                        status: tracker.isPaused ? 'paused' : 'active'
                    })
                }
            }, 30000)
        }

        return () => {
            if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activityId, tracker.isTracking])

    // Handlers
    const handlePause = () => {
        tracker.pause()
        if (activityId) {
            const snapshot = tracker.getSnapshot()
            updateMutation.mutate({ ...snapshot, status: 'paused' })
        }
    }

    const handleResume = () => tracker.resume()
    const handleComplete = () => setShowConfirmComplete(true)

    const confirmComplete = () => {
        tracker.stop()
        const snapshot = tracker.getSnapshot()
        completeMutation.mutate(snapshot)
        setShowConfirmComplete(false)
    }

    const handleDiscard = () => setShowConfirmDiscard(true)

    const confirmDiscard = () => {
        tracker.discard()
        discardMutation.mutate()
        setShowConfirmDiscard(false)
    }

    const handleClose = () => {
        if (tracker.isTracking) {
            handlePause()
            setShowConfirmDiscard(true)
        } else {
            navigate(`/sport-event/${eventId}`)
        }
    }

    const distanceKm = (tracker.distance / 1000).toFixed(2)
    const currentPace = tracker.currentSpeed > 0 ? 1000 / tracker.currentSpeed : 0
    const speedKmH = (tracker.currentSpeed * 3.6).toFixed(1)
    const avgSpeedKmH = (tracker.avgSpeed * 3.6).toFixed(1)
    const targetValue = event?.targetValue || 0
    const targetUnit = event?.targetUnit || 'km'
    const progressPercent = targetValue > 0 ? Math.min(Math.round((parseFloat(distanceKm) / targetValue) * 100), 100) : 0

    return (
        <div className='activity-tracking-page'>
            {/* Header */}
            <div className='tracking-header'>
                <button className='tracking-close-btn' onClick={handleClose}>
                    <svg width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                        <line x1='18' y1='6' x2='6' y2='18'></line>
                        <line x1='6' y1='6' x2='18' y2='18'></line>
                    </svg>
                </button>
                <h2 className='tracking-title'>{activityLabel}</h2>
                <div style={{ width: 24 }}></div>
            </div>

            {/* Progress toward target */}
            {targetValue > 0 && (
                <div className='tracking-progress-bar-wrap'>
                    <div className='tracking-progress-info'>
                        <span>Tiến độ mục tiêu</span>
                        <span>{distanceKm} / {targetValue} {targetUnit} ({progressPercent}%)</span>
                    </div>
                    <div className='tracking-progress-bar'>
                        <div className='tracking-progress-fill' style={{ width: `${progressPercent}%` }}></div>
                    </div>
                </div>
            )}

            {/* Stats Panel */}
            <div className='tracking-stats'>
                <div className='tracking-stat-row tracking-stat-primary'>
                    <div className='tracking-stat'>
                        <div className='tracking-stat-value tracking-distance'>{distanceKm}</div>
                        <div className='tracking-stat-label'>Quãng đường (km)</div>
                    </div>
                    <div className='tracking-stat-divider'></div>
                    <div className='tracking-stat'>
                        <div className='tracking-stat-value tracking-time'>{formatDuration(tracker.duration)}</div>
                        <div className='tracking-stat-label'>Tổng thời gian</div>
                    </div>
                </div>
                <div className='tracking-stat-row tracking-stat-secondary'>
                    <div className='tracking-stat'>
                        <div className='tracking-stat-value'>{formatPace(currentPace)}</div>
                        <div className='tracking-stat-label'>Pace hiện tại (/km)</div>
                    </div>
                    <div className='tracking-stat-divider'></div>
                    <div className='tracking-stat'>
                        <div className='tracking-stat-value'>{formatPace(tracker.avgPace)}</div>
                        <div className='tracking-stat-label'>Pace TB (/km)</div>
                    </div>
                </div>
                <div className='tracking-stat-row tracking-stat-secondary'>
                    <div className='tracking-stat'>
                        <div className='tracking-stat-value'>{speedKmH}</div>
                        <div className='tracking-stat-label'>Vận tốc (km/h)</div>
                    </div>
                    <div className='tracking-stat-divider'></div>
                    <div className='tracking-stat'>
                        <div className='tracking-stat-value'>{avgSpeedKmH}</div>
                        <div className='tracking-stat-label'>V.tốc TB (km/h)</div>
                    </div>
                </div>
                <div className='tracking-stat-row tracking-stat-extra'>
                    <div className='tracking-stat'>
                        <div className='tracking-stat-value tracking-calories'>{tracker.calories}</div>
                        <div className='tracking-stat-label'>kcal tiêu thụ</div>
                    </div>
                </div>
            </div>

            {/* Goong Map */}
            <div className='tracking-map-container'>
                <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }}></div>
            </div>

            {/* GPS Status */}
            <div className='tracking-gps-status'>
                <span className={`gps-dot ${tracker.gpsError ? 'gps-error' : tracker.gpsAccuracy && tracker.gpsAccuracy < 20 ? 'gps-good' : 'gps-medium'}`}></span>
                <span className='gps-text'>
                    GPS {tracker.gpsError ? 'Lỗi' : tracker.gpsAccuracy ? `${Math.round(tracker.gpsAccuracy)}m` : 'Đang tìm...'}
                </span>
            </div>

            {/* Controls */}
            <div className='tracking-controls'>
                {!tracker.isPaused ? (
                    <button className='tracking-btn tracking-btn-pause' onClick={handlePause}>
                        <svg width='32' height='32' viewBox='0 0 24 24' fill='currentColor'>
                            <rect x='6' y='4' width='4' height='16' rx='1'></rect>
                            <rect x='14' y='4' width='4' height='16' rx='1'></rect>
                        </svg>
                    </button>
                ) : (
                    <div className='tracking-paused-controls'>
                        <button className='tracking-btn tracking-btn-discard' onClick={handleDiscard}>
                            <svg width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                                <line x1='18' y1='6' x2='6' y2='18'></line>
                                <line x1='6' y1='6' x2='18' y2='18'></line>
                            </svg>
                            <span>Huỷ</span>
                        </button>
                        <button className='tracking-btn tracking-btn-resume' onClick={handleResume}>
                            <svg width='32' height='32' viewBox='0 0 24 24' fill='currentColor'>
                                <polygon points='5,3 19,12 5,21'></polygon>
                            </svg>
                        </button>
                        <button className='tracking-btn tracking-btn-complete' onClick={handleComplete}>
                            <svg width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                                <polyline points='20,6 9,17 4,12'></polyline>
                            </svg>
                            <span>Hoàn thành</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Confirm Discard Modal */}
            {showConfirmDiscard && (
                <div className='tracking-modal-overlay'>
                    <div className='tracking-modal'>
                        <h3>Huỷ hoạt động?</h3>
                        <p>Hoạt động này sẽ bị huỷ và không được tính vào tiến độ.</p>
                        <div className='tracking-modal-buttons'>
                            <button className='modal-btn modal-btn-cancel' onClick={() => setShowConfirmDiscard(false)}>Quay lại</button>
                            <button className='modal-btn modal-btn-confirm' onClick={confirmDiscard}>Huỷ hoạt động</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Complete Modal */}
            {showConfirmComplete && (
                <div className='tracking-modal-overlay'>
                    <div className='tracking-modal'>
                        <h3>Hoàn thành hoạt động?</h3>
                        <p>Kết quả: <strong>{distanceKm} km</strong> trong <strong>{formatDuration(tracker.duration)}</strong></p>
                        <p style={{ marginTop: 4, fontSize: 13 }}>🔥 {tracker.calories} kcal • ⚡ V.tốc TB {avgSpeedKmH} km/h</p>
                        <div className='tracking-modal-buttons'>
                            <button className='modal-btn modal-btn-cancel' onClick={() => setShowConfirmComplete(false)}>Quay lại</button>
                            <button className='modal-btn modal-btn-success' onClick={confirmComplete}>Xác nhận</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
