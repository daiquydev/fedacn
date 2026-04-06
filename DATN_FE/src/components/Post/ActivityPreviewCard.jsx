import { roundKcal } from '../../utils/mathUtils'
// c:\DATN\fedacn\DATN_FE\src\components\Post\ActivityPreviewCard.jsx
// Handles SPORT EVENT activity shares only: [activity:ACT_ID:EVENT_ID]
// For challenge activity shares, see ChallengeActivityPreviewCard.jsx
import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import moment from 'moment'
import {
    FaRoad,
    FaFire,
    FaClock,
    FaTrophy,
    FaRunning,
    FaRoute,
    FaBolt,
    FaTimesCircle
} from 'react-icons/fa'
import { getActivity, getSportEvent } from '../../apis/sportEventApi'
import goongjs from '@goongmaps/goong-js'
import '@goongmaps/goong-js/dist/goong-js.css'

goongjs.accessToken = import.meta.env.VITE_GOONG_MAPTILES_KEY

function formatDuration(seconds) {
    if (!seconds) return '0:00'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * Extracts activity IDs from both marker formats.
 * [activity:ACT_ID:EVENT_ID] — Sport Event activity
 * [challenge-activity:ACT_ID:CHALL_ID] — Challenge activity (handled by ChallengeActivityPreviewCard)
 * Returns { activityId, eventId } for event markers, or { activityId, challengeId } for challenge markers.
 */
export function extractActivityIds(content) {
    if (!content) return null
    const eventMatch = content.match(/\[activity:([a-f0-9]{24}):([a-f0-9]{24})\]/i)
    if (eventMatch) return { activityId: eventMatch[1], eventId: eventMatch[2] }

    const challengeMatch = content.match(/\[challenge-activity:([a-f0-9]{24}):([a-f0-9]{24})\]/i)
    if (challengeMatch) return { activityId: challengeMatch[1], challengeId: challengeMatch[2] }

    return null
}

/**
 * Removes activity markers from post content for display.
 */
export function cleanActivityMarker(content) {
    if (!content) return content
    return content
        .replace(/\n?\[activity:[a-f0-9]{24}:[a-f0-9]{24}\]/gi, '')
        .replace(/\n?\[challenge-activity:[a-f0-9]{24}:[a-f0-9]{24}\]/gi, '')
        .trim()
}

/**
 * Shown in PostCard when a post contains a [activity:ACT_ID:EVENT_ID] marker.
 * Clicking navigates to the sport event detail page.
 */
export default function ActivityPreviewCard({ activityId, eventId }) {
    const navigate = useNavigate()
    const mapContainerRef = useRef(null)
    const mapRef = useRef(null)

    // Fetch event info (for banner label)
    const { data: eventData } = useQuery({
        queryKey: ['sportEvent-preview', eventId],
        queryFn: () => getSportEvent(eventId),
        enabled: Boolean(eventId),
        staleTime: 5 * 60 * 1000,
        retry: false
    })

    const event = eventData?.data?.result || eventData?.result

    // Fetch activity detail (distance, duration, gpsRoute)
    const { data: activityDetailData, isLoading, isError } = useQuery({
        queryKey: ['activityDetail', 'event', eventId, activityId],
        queryFn: () => getActivity(eventId, activityId),
        enabled: !!activityId && !!eventId,
        staleTime: 60000,
        retry: false
    })

    const activity = activityDetailData?.data?.result
    const gpsRoute = activity?.gpsRoute || []
    const hasRoute = gpsRoute.length > 1

    // Initialize Goong Map when gpsRoute is loaded
    useEffect(() => {
        if (!hasRoute || !mapContainerRef.current || mapRef.current) return

        const routePositions = gpsRoute.map((p) => [p.lng, p.lat])
        const lngs = routePositions.map((p) => p[0])
        const lats = routePositions.map((p) => p[1])
        const center = [
            (Math.min(...lngs) + Math.max(...lngs)) / 2,
            (Math.min(...lats) + Math.max(...lats)) / 2
        ]

        const map = new goongjs.Map({
            container: mapContainerRef.current,
            style: 'https://tiles.goong.io/assets/goong_map_web.json',
            center,
            zoom: 14,
            attributionControl: false,
            interactive: false
        })

        map.on('load', () => {
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
                paint: { 'line-color': '#ef4444', 'line-width': 4, 'line-opacity': 0.9 }
            })

            const bounds = routePositions.reduce(
                (b, c) => b.extend(c),
                new goongjs.LngLatBounds(routePositions[0], routePositions[0])
            )
            map.fitBounds(bounds, { padding: 30 })

            const startEl = document.createElement('div')
            startEl.style.cssText = 'width:12px;height:12px;border-radius:50%;background:#4caf50;border:2px solid #fff;box-shadow:0 0 6px rgba(76,175,80,0.5);'
            new goongjs.Marker(startEl).setLngLat(routePositions[0]).addTo(map)

            const endEl = document.createElement('div')
            endEl.style.cssText = 'width:12px;height:12px;border-radius:50%;background:#e74c3c;border:2px solid #fff;box-shadow:0 0 6px rgba(231,76,60,0.5);'
            new goongjs.Marker(endEl).setLngLat(routePositions[routePositions.length - 1]).addTo(map)
        })

        mapRef.current = map
        return () => {
            if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
        }
    }, [hasRoute, gpsRoute])

    if (!activityId || !eventId) return null

    // Loading State
    if (isLoading) {
        return (
            <div className="mt-3 mx-4 md:mx-0 p-4 rounded-xl border border-dashed border-red-200 dark:border-gray-700 animate-pulse bg-white dark:bg-gray-800">
                <div className="flex gap-3">
                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                        <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                        <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                    </div>
                </div>
            </div>
        )
    }

    // Error / deleted state
    if (isError || !activity) {
        return (
            <div className="mt-3 mx-4 md:mx-0 rounded-xl overflow-hidden border border-red-200 dark:border-red-900 bg-white dark:bg-gray-800/50">
                <div className="bg-gradient-to-r from-red-500 to-orange-500 px-4 py-2 opacity-50 flex items-center gap-2">
                    <FaRunning className="text-white" size={13} />
                    <span className="text-white text-xs font-semibold uppercase">Hoạt động thể thao</span>
                </div>
                <div className="px-4 py-5 flex items-center gap-3">
                    <FaTimesCircle className="text-gray-300 dark:text-gray-600" size={28} />
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Hoạt động này hoặc sự kiện thể thao đã không còn tồn tại
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                            Sự kiện có thể đã bị xóa hoặc hoạt động không còn khả dụng
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    const distanceKm = (activity.totalDistance / 1000).toFixed(2)
    const duration = formatDuration(activity.totalDuration)
    const calories = roundKcal(activity.calories || 0)
    const actDate = moment(activity.startTime).format('HH:mm - DD/MM/YYYY')

    const stats = [
        { icon: <FaRoad className="text-blue-500" />, label: 'Quãng đường', value: `${distanceKm} km` },
        { icon: <FaClock className="text-purple-500" />, label: 'Thời gian', value: duration },
        { icon: <FaFire className="text-orange-500" />, label: 'Calo', value: `${calories} kcal` },
    ]

    if (activity.totalDistance && activity.totalDuration) {
        const speedKmh = ((activity.totalDistance / 1000) / (activity.totalDuration / 3600)).toFixed(2)
        stats.push({ icon: <FaBolt className="text-yellow-500" />, label: 'Tốc độ TB', value: `${speedKmh} km/h` })
    }

    return (
        <div
            onClick={() => navigate(`/sport-event/${eventId}`)}
            className="mt-3 mx-4 md:mx-0 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-red-400 dark:hover:border-red-600 cursor-pointer transition-all duration-200 bg-white dark:bg-gray-800 group hover:shadow-lg hover:shadow-red-100 dark:hover:shadow-red-900/20"
            title="Nhấn để xem chi tiết sự kiện"
        >
            {/* Top gradient banner */}
            <div className="bg-gradient-to-r from-red-500 to-orange-500 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FaRunning className="text-white" size={14} />
                    <span className="text-white text-xs font-semibold uppercase tracking-wide">
                        {event?.category || activity.activityType || 'Hoạt động thể thao'}
                    </span>
                </div>
                <span className="text-white/80 text-xs">{actDate}</span>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-2 p-3">
                {stats.map((s, i) => (
                    <div key={i} className="flex items-center gap-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2 border border-gray-100 dark:border-gray-600/50">
                        <div className="text-base shrink-0">{s.icon}</div>
                        <div className="min-w-0">
                            <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-medium">{s.label}</div>
                            <div className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">{s.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* GPS Route Map */}
            <div className="mx-3 mb-2">
                <div className="flex items-center gap-1.5 mb-1.5 mt-1">
                    <FaRoute className="text-red-500" size={10} />
                    <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase">Lộ trình GPS</span>
                </div>
                <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700" style={{ height: '160px' }}>
                    {hasRoute ? (
                        <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 text-gray-400">
                            <div className="text-center">
                                <FaRoute className="mx-auto mb-1 text-lg opacity-40" />
                                <p className="text-[10px]">Đang tải bản đồ...</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Event info footer */}
            {event && (
                <div className="mx-3 mb-3 mt-2 bg-red-50 dark:bg-red-900/10 rounded-lg px-3 py-2 border border-red-200 dark:border-red-900/30">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                            <FaTrophy className="text-yellow-500 shrink-0" size={11} />
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">{event.name}</span>
                        </div>
                        <div className="flex items-center gap-1 text-red-500 text-xs font-semibold group-hover:gap-2 transition-all shrink-0 ml-2">
                            <span>Xem sự kiện</span>
                            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
