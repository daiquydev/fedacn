import { useSafeMutation } from '../../../hooks/useSafeMutation'
import { useState, useEffect, useRef } from 'react'
import { FaChevronDown, FaChevronUp } from 'react-icons/fa'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
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
    const [mapCollapsed, setMapCollapsed] = useState(false)
    const autoSaveTimerRef = useRef(null)
    const startedRef = useRef(false)
    const activityIdRef = useRef(null)

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
        queryFn: () => sportCategoryApi.getAll()
    })

    // Lookup kcal_per_unit by event's category name
    const kcalPerKm = (() => {
        const categories = categoriesData?.data?.result || []
        const matched = categories.find(c => c.name === event?.category)
        return matched?.kcal_per_unit || 0
    })()

    // Start activity mutation
    const startMutation = useSafeMutation({
        mutationFn: (data) => startActivity(eventId, data),
        onSuccess: (res) => {
            const activity = res.data.result
            setActivityId(activity._id)
            activityIdRef.current = activity._id
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Không thể bắt đầu hoạt động')
        }
    })

    // Update activity mutation (auto-save)
    const updateMutation = useSafeMutation({
        mutationFn: (data) => updateActivity(eventId, activityId, data)
    })

    // Complete mutation
    const completeMutation = useSafeMutation({
        mutationFn: (data) => completeActivity(eventId, activityId, data),
        onSuccess: () => {
            toast.success('Hoàn thành hoạt động! Tiến độ đã được ghi nhận.')
            navigate(`/sport-event/${eventId}?tab=progress&completed=${activityId}`)
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Lỗi khi hoàn thành')
        }
    })

    // Discard mutation
    const discardMutation = useSafeMutation({
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

    useEffect(() => {
        const map = mapRef.current
        if (!map) return
        const onResize = () => {
            try {
                map.resize()
            } catch { /* ignore */ }
        }
        window.addEventListener('resize', onResize)
        return () => window.removeEventListener('resize', onResize)
    }, [])

    useEffect(() => {
        const t = window.setTimeout(() => {
            try {
                mapRef.current?.resize()
            } catch { /* ignore */ }
        }, 200)
        return () => window.clearTimeout(t)
    }, [mapCollapsed])

    // Initialize - start tracking when event data is ready
    useEffect(() => {
        if (startedRef.current || !event) return
        startedRef.current = true

        // Use event category as activity type (fallback to 'running')
        const actType = event?.category || 'Chạy bộ'

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords
                    startMutation.mutate({
                        activityType: actType,
                        startLat: latitude,
                        startLng: longitude
                    })
                    tracker.start(actType, { kcalPerKm })
                    // Center map on actual position
                    if (mapRef.current) {
                        mapRef.current.setCenter([longitude, latitude])
                        if (markerRef.current) markerRef.current.setLngLat([longitude, latitude])
                    }
                },
                () => {
                    toast.error('Không thể bật ghi vị trí. Vui lòng cho phép quyền truy cập vị trí.')
                    startMutation.mutate({ activityType: actType })
                    tracker.start(actType, { kcalPerKm })
                },
                { enableHighAccuracy: true, timeout: 10000 }
            )
        } else {
            startMutation.mutate({ activityType: actType })
            tracker.start(actType, { kcalPerKm })
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
                if (activityIdRef.current) {
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
        if (activityIdRef.current) {
            const snapshot = tracker.getSnapshot()
            completeMutation.mutate(snapshot)
        } else {
            toast.error('Chưa khởi tạo được hoạt động. Vui lòng thử lại.')
            navigate(`/sport-event/${eventId}`)
        }
        setShowConfirmComplete(false)
    }

    const handleDiscard = () => setShowConfirmDiscard(true)

    const confirmDiscard = () => {
        tracker.discard()
        if (activityIdRef.current) {
            discardMutation.mutate()
        } else {
            navigate(`/sport-event/${eventId}`)
        }
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
    const speedKmH = (tracker.currentSpeed * 3.6).toFixed(2)
    const avgSpeedKmH = (tracker.avgSpeed * 3.6).toFixed(2)
    const maxParticipants = event?.maxParticipants > 0 ? event.maxParticipants : 1
    const targetValue = event?.targetValue || 0
    const perPersonTarget = targetValue > 0 ? targetValue / maxParticipants : 0
    const targetUnit = event?.targetUnit || 'km'
    const progressPercent = perPersonTarget > 0 ? Math.min(Math.round((parseFloat(distanceKm) / perPersonTarget) * 100), 100) : 0

    return (
        <div className={`tracking-hud${mapCollapsed ? ' tracking-hud--map-collapsed' : ''}`}>
            {/* ═══ MAP FILLS ABOVE THE BOTTOM SHEET ═══ */}
            <div className='tracking-map-area'>
                <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

                {/* Header overlay (transparent, on top of map) */}
                <div className='hud-header'>
                    <button className='hud-close' onClick={handleClose}>✕</button>
                    <div className='hud-header-center'>
                        <span className='hud-event-name'>{event?.name || activityLabel}</span>
                    </div>
                    <div className='hud-gps-badge'>
                        <span className={`hud-gps-dot ${tracker.gpsError ? 'err' : tracker.gpsAccuracy && tracker.gpsAccuracy < 20 ? 'good' : 'mid'}`} />
                        <span>Vị trí {tracker.gpsError ? '— lỗi' : tracker.gpsAccuracy ? `±${Math.round(tracker.gpsAccuracy)}m` : '— đang tìm...'}</span>
                    </div>
                </div>

            </div>

            {/* ═══ GLASS OVERLAY — stats + progress + controls ═══ */}
            <div className='hud-glass-panel'>
                <button
                    type='button'
                    className='hud-map-toggle'
                    onClick={() => setMapCollapsed((c) => !c)}
                    aria-expanded={!mapCollapsed}
                >
                    {mapCollapsed ? (
                        <>
                            <FaChevronUp aria-hidden /> Mở rộng bản đồ
                        </>
                    ) : (
                        <>
                            <FaChevronDown aria-hidden /> Thu gọn bản đồ
                        </>
                    )}
                </button>
                {/* Hero distance */}
                <div className='hud-hero-distance'>
                    <span className='hud-hero-val'>{distanceKm}</span>
                    <span className='hud-hero-unit'>km</span>
                </div>

                {/* Stats row — 3 metrics */}
                <div className='hud-glass-stats'>
                    <div className='hud-glass-stat'>
                        <span className='hud-glass-val'>{formatDuration(tracker.duration)}</span>
                        <span className='hud-glass-lbl'>Thời gian</span>
                    </div>
                    <div className='hud-glass-divider' />
                    <div className='hud-glass-stat'>
                        <span className='hud-glass-val'>{speedKmH}</span>
                        <span className='hud-glass-lbl'>km/h</span>
                    </div>
                    <div className='hud-glass-divider' />
                    <div className='hud-glass-stat accent'>
                        <span className='hud-glass-val'>{tracker.calories}</span>
                        <span className='hud-glass-lbl'>🔥 kcal</span>
                    </div>
                </div>

                {/* Progress bar — only if event has target */}
                {perPersonTarget > 0 && (
                    <div className='hud-glass-progress'>
                        <div className='hud-glass-progress-track'>
                            <div className='hud-glass-progress-fill' style={{ width: `${progressPercent}%` }} />
                        </div>
                        <span className='hud-glass-progress-text'>{distanceKm}/{Number(perPersonTarget.toFixed(2))} {targetUnit}</span>
                    </div>
                )}

                {/* Controls */}
                <div className='hud-glass-controls'>
                    {!tracker.isPaused ? (
                        <button className='hud-btn-pause' onClick={handlePause}>
                            <svg width='28' height='28' viewBox='0 0 24 24' fill='currentColor'>
                                <rect x='6' y='4' width='4' height='16' rx='1' />
                                <rect x='14' y='4' width='4' height='16' rx='1' />
                            </svg>
                        </button>
                    ) : (
                        <div className='hud-paused-row'>
                            <button className='hud-btn-side discard' onClick={handleDiscard}>
                                <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5'>
                                    <line x1='18' y1='6' x2='6' y2='18' /><line x1='6' y1='6' x2='18' y2='18' />
                                </svg>
                                <span>Huỷ bỏ</span>
                            </button>
                            <button className='hud-btn-pause resume' onClick={handleResume}>
                                <svg width='28' height='28' viewBox='0 0 24 24' fill='currentColor'>
                                    <polygon points='5,3 19,12 5,21' />
                                </svg>
                            </button>
                            <button className='hud-btn-side complete' onClick={handleComplete}>
                                <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5'>
                                    <polyline points='20,6 9,17 4,12' />
                                </svg>
                                <span>Hoàn thành</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ═══ CONFIRM DISCARD MODAL ═══ */}
            {showConfirmDiscard && (
                <div className='hud-modal-overlay'>
                    <div className='hud-modal'>
                        <div className='hud-modal-icon'>🗑️</div>
                        <h3>Huỷ hoạt động?</h3>
                        <p>Hoạt động sẽ bị huỷ và không tính vào tiến độ.</p>
                        <div className='hud-modal-stats'>
                            <div><strong>{distanceKm}</strong> km</div>
                            <div><strong>{formatDuration(tracker.duration)}</strong></div>
                            <div><strong>{tracker.calories}</strong> kcal</div>
                        </div>
                        <div className='hud-modal-btns'>
                            <button className='hud-modal-btn cancel' onClick={() => setShowConfirmDiscard(false)}>Quay lại</button>
                            <button className='hud-modal-btn danger' onClick={confirmDiscard}>Huỷ hoạt động</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ CONFIRM COMPLETE MODAL ═══ */}
            {showConfirmComplete && (
                <div className='hud-modal-overlay'>
                    <div className='hud-modal'>
                        <div className='hud-modal-icon'>🎉</div>
                        <h3>Hoàn thành hoạt động?</h3>
                        <div className='hud-modal-stats'>
                            <div><strong>{distanceKm}</strong> km</div>
                            <div><strong>{formatDuration(tracker.duration)}</strong></div>
                            <div>🔥 <strong>{tracker.calories}</strong> kcal</div>
                        </div>
                        <div className='hud-modal-btns'>
                            <button className='hud-modal-btn cancel' onClick={() => setShowConfirmComplete(false)}>Quay lại</button>
                            <button className='hud-modal-btn success' onClick={confirmComplete}>Xác nhận</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
