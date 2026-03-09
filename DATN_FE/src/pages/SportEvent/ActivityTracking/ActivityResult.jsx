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
        enabled: !!activityId
    })

    // Fetch event info for category label
    const { data: eventData } = useQuery({
        queryKey: ['sportEvent', eventId],
        queryFn: () => getSportEvent(eventId)
    })
    const event = eventData?.data?.result
    const activity = data?.data?.result

    // Initialize Goong map when activity data is ready
    useEffect(() => {
        if (!activity || !mapContainerRef.current || mapRef.current) return

        const routePositions = (activity.gpsRoute || []).map(p => [p.lng, p.lat]) // [lng, lat] for Goong

        if (routePositions.length === 0) return

        const lngs = routePositions.map(p => p[0])
        const lats = routePositions.map(p => p[1])
        const center = [(Math.min(...lngs) + Math.max(...lngs)) / 2, (Math.min(...lats) + Math.max(...lats)) / 2]

        const map = new goongjs.Map({
            container: mapContainerRef.current,
            style: 'https://tiles.goong.io/assets/goong_map_web.json',
            center: center,
            zoom: 15,
            attributionControl: false
        })

        map.on('load', () => {
            // Route polyline
            if (routePositions.length > 1) {
                map.addSource('route', {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        properties: {},
                        geometry: { type: 'LineString', coordinates: routePositions }
                    }
                })

                map.addLayer({
                    id: 'route-line',
                    type: 'line',
                    source: 'route',
                    layout: { 'line-join': 'round', 'line-cap': 'round' },
                    paint: { 'line-color': '#4A90D9', 'line-width': 5, 'line-opacity': 0.85 }
                })

                // Fit bounds
                const bounds = routePositions.reduce(
                    (b, coord) => b.extend(coord),
                    new goongjs.LngLatBounds(routePositions[0], routePositions[0])
                )
                map.fitBounds(bounds, { padding: 40 })
            }

            // Start marker (green)
            const startEl = document.createElement('div')
            startEl.style.cssText = 'width:16px;height:16px;border-radius:50%;background:#4caf50;border:3px solid #fff;box-shadow:0 0 8px rgba(76,175,80,0.5);'
            new goongjs.Marker(startEl).setLngLat(routePositions[0]).addTo(map)

            // End marker (red)
            if (routePositions.length > 1) {
                const endEl = document.createElement('div')
                endEl.style.cssText = 'width:16px;height:16px;border-radius:50%;background:#e74c3c;border:3px solid #fff;box-shadow:0 0 8px rgba(231,76,60,0.5);'
                new goongjs.Marker(endEl).setLngLat(routePositions[routePositions.length - 1]).addTo(map)
            }
        })

        mapRef.current = map

        return () => {
            if (mapRef.current) {
                mapRef.current.remove()
                mapRef.current = null
            }
        }
    }, [activity])

    if (isLoading) {
        return (
            <div className='activity-result-page'>
                <div className='tracking-loading'>
                    <div className='tracking-loading-spinner'></div>
                    <p>Đang tải kết quả...</p>
                </div>
            </div>
        )
    }

    if (!activity) {
        return (
            <div className='activity-result-page'>
                <div className='tracking-loading'>
                    <p>Không tìm thấy hoạt động</p>
                    <button className='result-btn-back' onClick={() => navigate(`/sport-event/${eventId}`)}>
                        Quay lại
                    </button>
                </div>
            </div>
        )
    }

    const distanceKm = (activity.totalDistance / 1000).toFixed(2)
    // Use event category from database, fallback to activity type
    const activityTypeLabel = event?.category || activity.activityType || 'Hoạt động'
    const dateStr = new Date(activity.startTime).toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })

    const hasRoute = (activity.gpsRoute || []).length > 0

    return (
        <div className='activity-result-page'>
            {/* Header */}
            <div className='result-header'>
                <button className='result-back-btn' onClick={() => navigate(`/sport-event/${eventId}`)}>
                    <svg width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                        <polyline points='15,18 9,12 15,6'></polyline>
                    </svg>
                </button>
                <h2>Kết quả hoạt động</h2>
                <div style={{ width: 24 }}></div>
            </div>

            {/* Summary */}
            <div className='result-summary'>
                <div className='result-activity-type'>{activityTypeLabel}</div>
                <div className='result-date'>{dateStr}</div>
                <div className='result-distance-big'>{distanceKm}</div>
                <div className='result-distance-unit'>Kilômét</div>
            </div>

            {/* Stats Grid */}
            <div className='result-stats-grid'>
                <div className='result-stat-card'>
                    <div className='result-stat-icon'>⏱️</div>
                    <div className='result-stat-value'>{formatDuration(Math.round(activity.totalDuration))}</div>
                    <div className='result-stat-label'>Thời gian</div>
                </div>
                <div className='result-stat-card'>
                    <div className='result-stat-icon'>⚡</div>
                    <div className='result-stat-value'>{formatPace(activity.avgPace)}</div>
                    <div className='result-stat-label'>Tốc độ TB (/km)</div>
                </div>
                <div className='result-stat-card'>
                    <div className='result-stat-icon'>🔥</div>
                    <div className='result-stat-value'>{Math.round(activity.calories)}</div>
                    <div className='result-stat-label'>kcal</div>
                </div>
                <div className='result-stat-card'>
                    <div className='result-stat-icon'>🚀</div>
                    <div className='result-stat-value'>
                        {activity.maxSpeed ? `${(activity.maxSpeed * 3.6).toFixed(1)}` : '0'}
                    </div>
                    <div className='result-stat-label'>Tốc độ max (km/h)</div>
                </div>
            </div>

            {/* Goong Map */}
            {hasRoute && (
                <div className='result-map-container'>
                    <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }}></div>
                </div>
            )}

            {/* Actions */}
            <div className='result-actions'>
                <button className='result-btn-back' onClick={() => navigate(`/sport-event/${eventId}`)}>
                    Quay lại sự kiện
                </button>
            </div>
        </div>
    )
}
