import { roundKcal } from '../../../utils/mathUtils'
import { useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import goongjs from '@goongmaps/goong-js'
import { getActivity, getSportEvent } from '../../../apis/sportEventApi'
import { formatDuration, formatPace } from '../../../hooks/useActivityTracking'
import '@goongmaps/goong-js/dist/goong-js.css'
import './ActivityTracking.css'

goongjs.accessToken = import.meta.env.VITE_GOONG_MAPTILES_KEY

export default function ActivityResult() {
    const { eventId, activityId } = useParams()
    const navigate = useNavigate()
    const mapContainerRef = useRef(null)
    const mapRef = useRef(null)

    const { data, isLoading } = useQuery({
        queryKey: ['activity', eventId, activityId],
        queryFn: () => getActivity(eventId, activityId),
        enabled: !!activityId,
        staleTime: 30000,
        retry: false
    })

    const { data: eventData } = useQuery({
        queryKey: ['sportEvent', eventId],
        queryFn: () => getSportEvent(eventId)
    })
    const event = eventData?.data?.result
    const activity = data?.data?.result

    useEffect(() => {
        if (!activity || !mapContainerRef.current || mapRef.current) return

        const routePositions = (activity.gpsRoute || []).map(p => [p.lng, p.lat])
        if (routePositions.length === 0) return

        const lngs = routePositions.map(p => p[0])
        const lats = routePositions.map(p => p[1])
        const center = [(Math.min(...lngs) + Math.max(...lngs)) / 2, (Math.min(...lats) + Math.max(...lats)) / 2]

        const map = new goongjs.Map({
            container: mapContainerRef.current,
            style: 'https://tiles.goong.io/assets/goong_map_web.json',
            center, zoom: 15, attributionControl: false
        })

        map.on('load', () => {
            if (routePositions.length > 1) {
                map.addSource('route', {
                    type: 'geojson',
                    data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: routePositions } }
                })
                map.addLayer({
                    id: 'route-line', type: 'line', source: 'route',
                    layout: { 'line-join': 'round', 'line-cap': 'round' },
                    paint: { 'line-color': '#4A90D9', 'line-width': 5, 'line-opacity': 0.85 }
                })
                const bounds = routePositions.reduce((b, c) => b.extend(c), new goongjs.LngLatBounds(routePositions[0], routePositions[0]))
                map.fitBounds(bounds, { padding: 40 })
            }

            const startEl = document.createElement('div')
            startEl.style.cssText = 'width:14px;height:14px;border-radius:50%;background:#4caf50;border:3px solid #fff;box-shadow:0 0 6px rgba(76,175,80,0.5);'
            new goongjs.Marker(startEl).setLngLat(routePositions[0]).addTo(map)

            if (routePositions.length > 1) {
                const endEl = document.createElement('div')
                endEl.style.cssText = 'width:14px;height:14px;border-radius:50%;background:#e74c3c;border:3px solid #fff;box-shadow:0 0 6px rgba(231,76,60,0.5);'
                new goongjs.Marker(endEl).setLngLat(routePositions[routePositions.length - 1]).addTo(map)
            }
        })

        mapRef.current = map
        return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null } }
    }, [activity])

    if (isLoading) {
        return (
            <div className='tracking-loading'>
                <div className='tracking-loading-spinner' />
                <p>Đang tải kết quả...</p>
            </div>
        )
    }

    if (!activity) {
        return (
            <div className='tracking-loading'>
                <p>Không tìm thấy hoạt động</p>
                <button className='result-btn-back' onClick={() => navigate(`/sport-event/${eventId}`)}>Quay lại</button>
            </div>
        )
    }

    const distanceKm = (activity.totalDistance / 1000).toFixed(2)
    const activityTypeLabel = event?.category || activity.activityType || 'Hoạt động'
    const dateStr = new Date(activity.startTime).toLocaleDateString('vi-VN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })
    const hasRoute = (activity.gpsRoute || []).length > 0

    return (
        <div className='result-popup-page'>
            {/* Compact popup card — inspired by video call completion */}
            <div className='result-popup-card'>
                {/* Success header */}
                <div className='result-popup-header'>
                    <div className='result-popup-check'>✓</div>
                    <h2>Hoàn thành! 🎉</h2>
                    <p>{activityTypeLabel} • {dateStr}</p>
                </div>

                {/* Distance highlight */}
                <div className='result-popup-distance'>
                    <span className='result-popup-km'>{distanceKm}</span>
                    <span className='result-popup-unit'>km</span>
                </div>

                {/* Stats 2x2 grid */}
                <div className='result-popup-stats'>
                    <div className='result-popup-stat'>
                        <span className='result-popup-stat-icon'>⏱</span>
                        <div>
                            <p className='result-popup-stat-val'>{formatDuration(Math.round(activity.totalDuration))}</p>
                            <p className='result-popup-stat-lbl'>Thời gian</p>
                        </div>
                    </div>
                    <div className='result-popup-stat'>
                        <span className='result-popup-stat-icon'>⚡</span>
                        <div>
                            <p className='result-popup-stat-val'>{formatPace(activity.avgPace)}</p>
                            <p className='result-popup-stat-lbl'>Tốc độ trung bình</p>
                        </div>
                    </div>
                    <div className='result-popup-stat'>
                        <span className='result-popup-stat-icon'>🔥</span>
                        <div>
                            <p className='result-popup-stat-val'>{roundKcal(activity.calories)}</p>
                            <p className='result-popup-stat-lbl'>Kcal</p>
                        </div>
                    </div>
                    <div className='result-popup-stat'>
                        <span className='result-popup-stat-icon'>🚀</span>
                        <div>
                            <p className='result-popup-stat-val'>{activity.maxSpeed ? `${(activity.maxSpeed * 3.6).toFixed(2)}` : '0'}</p>
                            <p className='result-popup-stat-lbl'>Max km/h</p>
                        </div>
                    </div>
                </div>

                {/* Map (if route exists) */}
                {hasRoute && (
                    <div className='result-popup-map'>
                        <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
                    </div>
                )}

                {/* Action */}
                <button className='result-popup-btn' onClick={() => navigate(`/sport-event/${eventId}`)}>
                    Quay lại sự kiện
                </button>
            </div>
        </div>
    )
}
