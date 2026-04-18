import { roundKcal } from '../../utils/mathUtils'
import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import moment from 'moment'
import {
    FaFire, FaClock, FaTrophy, FaRunning, FaRoute, FaBolt,
    FaUtensils, FaDumbbell, FaRoad, FaCheckCircle, FaTimesCircle, FaLeaf
} from 'react-icons/fa'
import { MdFitnessCenter, MdOutdoorGrill } from 'react-icons/md'
import { getChallenge, getChallengeActivity, getChallengeProgressEntry } from '../../apis/challengeApi'
import { getImageUrl } from '../../utils/imageUrl'
import goongjs from '@goongmaps/goong-js'
import '@goongmaps/goong-js/dist/goong-js.css'

goongjs.accessToken = import.meta.env.VITE_GOONG_MAPTILES_KEY

// ── Type UI config ─────────────────────────────────────────────────────────
const TYPE_CONFIG = {
    nutrition: {
        label: 'Ăn uống',
        icon: <FaUtensils />,
        gradient: 'from-emerald-500 to-teal-600',
        bannerBg: 'bg-gradient-to-r from-emerald-500 to-teal-600',
        borderColor: 'border-emerald-200 dark:border-emerald-900',
        hoverBorder: 'hover:border-emerald-400 dark:hover:border-emerald-600',
        hoverShadow: 'hover:shadow-emerald-100 dark:hover:shadow-emerald-900/20',
        ctaColor: 'text-emerald-500',
        progressColors: 'from-emerald-400 to-teal-500',
        accentBg: 'bg-emerald-50 dark:bg-emerald-900/20',
        accentBorder: 'border-emerald-200 dark:border-emerald-800'
    },
    outdoor_activity: {
        label: 'Ngoài trời',
        icon: <FaRunning />,
        gradient: 'from-blue-500 to-cyan-600',
        bannerBg: 'bg-gradient-to-r from-blue-500 to-cyan-600',
        borderColor: 'border-blue-200 dark:border-blue-900',
        hoverBorder: 'hover:border-blue-400 dark:hover:border-blue-600',
        hoverShadow: 'hover:shadow-blue-100 dark:hover:shadow-blue-900/20',
        ctaColor: 'text-blue-500',
        progressColors: 'from-blue-400 to-cyan-500',
        accentBg: 'bg-blue-50 dark:bg-blue-900/20',
        accentBorder: 'border-blue-200 dark:border-blue-800'
    },
    fitness: {
        label: 'Thể dục',
        icon: <FaDumbbell />,
        gradient: 'from-orange-500 to-amber-600',
        bannerBg: 'bg-gradient-to-r from-orange-500 to-amber-600',
        borderColor: 'border-orange-200 dark:border-orange-900',
        hoverBorder: 'hover:border-orange-400 dark:hover:border-orange-600',
        hoverShadow: 'hover:shadow-orange-100 dark:hover:shadow-orange-900/20',
        ctaColor: 'text-orange-500',
        progressColors: 'from-orange-400 to-amber-500',
        accentBg: 'bg-amber-50 dark:bg-amber-900/20',
        accentBorder: 'border-amber-200 dark:border-amber-800'
    }
}

// ── Challenge Progress marker utilities (nutrition / fitness) ───────────────

/**
 * Extracts progress ID and challenge ID from marker:
 * [challenge-progress:PROGRESS_ID:CHALL_ID]
 */
export function extractChallengeProgressIds(content) {
    if (!content) return null
    const match = content.match(/\[challenge-progress:([a-f0-9]{24}):([a-f0-9]{24})\]/i)
    if (match) return { progressId: match[1], challengeId: match[2] }
    return null
}

/**
 * Returns content with [challenge-progress:...] marker removed.
 */
export function cleanChallengeProgressMarker(content) {
    if (!content) return content
    return content.replace(/\n?\[challenge-progress:[a-f0-9]{24}:[a-f0-9]{24}\]/gi, '').trim()
}

/**
 * Shown in PostCard when a post contains a [challenge-progress:...] marker.
 * Used for nutrition & fitness challenge shares (no GPS/ActivityTracking).
 */
export function ChallengeProgressPreviewCard({ progressId, challengeId }) {
    const navigate = useNavigate()

    const { data: challengeData, isError: isChallengeError } = useQuery({
        queryKey: ['challenge-preview', challengeId],
        queryFn: () => getChallenge(challengeId),
        enabled: Boolean(challengeId),
        staleTime: 5 * 60 * 1000,
        retry: false
    })

    const { data: progressData, isLoading, isError: isProgressError } = useQuery({
        queryKey: ['challengeProgressEntry', challengeId, progressId],
        queryFn: () => getChallengeProgressEntry(challengeId, progressId),
        enabled: Boolean(progressId) && Boolean(challengeId),
        staleTime: 60_000,
        retry: false
    })

    const challenge = challengeData?.data?.result
    const activity = progressData?.data?.result

    const challengeType = challenge?.challenge_type || activity?.challenge_type || 'fitness'
    const config = TYPE_CONFIG[challengeType] || TYPE_CONFIG.fitness

    const handleNavigate = () => {
        if (challengeId) navigate(`/challenge/${challengeId}`)
    }

    if (!progressId || !challengeId) return null

    if (isLoading) {
        return (
            <div className="mt-3 mx-4 md:mx-0 p-4 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 animate-pulse bg-white dark:bg-gray-800">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
                <div className="grid grid-cols-2 gap-2">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-14 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                    ))}
                </div>
            </div>
        )
    }

    if (isProgressError || isChallengeError || !activity) {
        return (
            <div className={`mt-3 mx-4 md:mx-0 rounded-xl overflow-hidden border ${config.borderColor} bg-white dark:bg-gray-800/50`}>
                <div className={`${config.bannerBg} px-4 py-2 flex items-center gap-2 opacity-50`}>
                    {config.icon}
                    <span className="text-white text-xs font-semibold uppercase tracking-wide">
                        Hoạt động {config.label}
                    </span>
                </div>
                <div className="px-4 py-5 flex items-center gap-3">
                    <FaTimesCircle className="text-gray-300 dark:text-gray-600" size={28} />
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Hoạt động này hoặc thử thách đã không còn tồn tại
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                            Thử thách có thể đã bị xóa hoặc bạn không có quyền truy cập
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div
            onClick={handleNavigate}
            className={`mt-3 mx-4 md:mx-0 rounded-xl overflow-hidden border ${config.borderColor}
                ${config.hoverBorder} cursor-pointer transition-all duration-200
                hover:shadow-lg ${config.hoverShadow} bg-white dark:bg-gray-800 group`}
            title="Nhấn để xem chi tiết thử thách"
        >
            {/* Banner */}
            <div className={`${config.bannerBg} px-4 py-2.5 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                    <span className="text-white text-sm">{config.icon}</span>
                    <span className="text-white text-xs font-semibold uppercase tracking-wide">
                        {config.label}
                    </span>
                    <span className="text-white/60 text-[10px]">• Hoạt động thử thách</span>
                </div>
                <span className="text-white/80 text-xs">
                    {moment(activity.date || activity.createdAt).format('HH:mm - DD/MM/YYYY')}
                </span>
            </div>

            {/* Type-specific content */}
            {challengeType === 'nutrition' && (
                <NutritionActivityContent activity={activity} challenge={challenge} config={config} />
            )}
            {challengeType === 'fitness' && (
                <FitnessActivityContent activity={activity} challenge={challenge} config={config} />
            )}

            {/* Challenge footer */}
            {challenge && (
                <div className={`mx-3 mb-3 ${config.accentBg} rounded-lg px-3 py-2 border ${config.accentBorder}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                            <FaTrophy className="text-amber-500 shrink-0" size={11} />
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">
                                {challenge.title}
                            </span>
                        </div>
                        <div className={`flex items-center gap-1 ${config.ctaColor} text-xs font-semibold group-hover:gap-2 transition-all shrink-0 ml-2`}>
                            <span>Xem chi tiết</span>
                            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function formatDuration(minutes) {
    if (!minutes) return '0 phút'
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    if (h > 0) return `${h}g ${m}p`
    return `${m} phút`
}

// ── Utility exports ────────────────────────────────────────────────────────

/**
 * Extracts challenge activity ID and challenge ID from marker:
 * [challenge-activity:ACT_ID:CHALL_ID]
 */
export function extractChallengeActivityIds(content) {
    if (!content) return null
    const match = content.match(/\[challenge-activity:([a-f0-9]{24}):([a-f0-9]{24})\]/i)
    if (match) return { activityId: match[1], challengeId: match[2] }
    return null
}

/**
 * Returns content with [challenge-activity:...] marker removed.
 */
export function cleanChallengeActivityMarker(content) {
    if (!content) return content
    return content.replace(/\n?\[challenge-activity:[a-f0-9]{24}:[a-f0-9]{24}\]/gi, '').trim()
}

// ── Main Component ─────────────────────────────────────────────────────────

/**
 * Shown in PostCard when a post contains a [challenge-activity:...] marker.
 * Clicking navigates to the challenge detail page.
 * Supports all 3 challenge types: nutrition, outdoor_activity, fitness.
 */
export default function ChallengeActivityPreviewCard({ activityId, challengeId }) {
    const navigate = useNavigate()

    // Fetch challenge info
    const { data: challengeData, isError: isChallengeError } = useQuery({
        queryKey: ['challenge-preview', challengeId],
        queryFn: () => getChallenge(challengeId),
        enabled: Boolean(challengeId),
        staleTime: 5 * 60 * 1000,
        retry: false
    })

    // Fetch challenge progress/activity detail
    const { data: activityData, isLoading, isError: isActivityError } = useQuery({
        queryKey: ['challengeActivity', challengeId, activityId],
        queryFn: () => getChallengeActivity(challengeId, activityId),
        enabled: Boolean(activityId) && Boolean(challengeId),
        staleTime: 60_000,
        retry: false
    })

    const challenge = challengeData?.data?.result
    const activity = activityData?.data?.result

    const challengeType = challenge?.challenge_type || activity?.challenge_type || 'fitness'
    const config = TYPE_CONFIG[challengeType] || TYPE_CONFIG.fitness

    const handleNavigate = () => {
        if (challengeId) navigate(`/challenge/${challengeId}`)
    }

    if (!activityId || !challengeId) return null

    // Loading skeleton
    if (isLoading) {
        return (
            <div className="mt-3 mx-4 md:mx-0 p-4 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 animate-pulse bg-white dark:bg-gray-800">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
                <div className="grid grid-cols-2 gap-2">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-14 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                    ))}
                </div>
            </div>
        )
    }

    // Deleted / error state
    if (isActivityError || isChallengeError || !activity) {
        return (
            <div className={`mt-3 mx-4 md:mx-0 rounded-xl overflow-hidden border ${config.borderColor} bg-white dark:bg-gray-800/50`}>
                <div className={`${config.bannerBg} px-4 py-2 flex items-center gap-2 opacity-50`}>
                    {config.icon}
                    <span className="text-white text-xs font-semibold uppercase tracking-wide">
                        Hoạt động {config.label}
                    </span>
                </div>
                <div className="px-4 py-5 flex items-center gap-3">
                    <FaTimesCircle className="text-gray-300 dark:text-gray-600" size={28} />
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Hoạt động này hoặc thử thách đã không còn tồn tại
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                            Thử thách có thể đã bị xóa hoặc bạn không có quyền truy cập
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div
            onClick={handleNavigate}
            className={`mt-3 mx-4 md:mx-0 rounded-xl overflow-hidden border ${config.borderColor}
                ${config.hoverBorder} cursor-pointer transition-all duration-200
                hover:shadow-lg ${config.hoverShadow} bg-white dark:bg-gray-800 group`}
            title="Nhấn để xem chi tiết thử thách"
        >
            {/* Banner */}
            <div className={`${config.bannerBg} px-4 py-2.5 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                    <span className="text-white text-sm">{config.icon}</span>
                    <span className="text-white text-xs font-semibold uppercase tracking-wide">
                        {challenge?.category && challengeType === 'outdoor_activity'
                            ? challenge.category
                            : config.label}
                    </span>
                    <span className="text-white/60 text-[10px]">• Hoạt động thử thách</span>
                </div>
                <span className="text-white/80 text-xs">
                    {moment(activity.date || activity.startTime || activity.createdAt).format('HH:mm - DD/MM/YYYY')}
                </span>
            </div>

            {/* Type-specific content */}
            {challengeType === 'nutrition' && (
                <NutritionActivityContent activity={activity} challenge={challenge} config={config} />
            )}
            {challengeType === 'outdoor_activity' && (
                <OutdoorActivityContent activity={activity} challenge={challenge} config={config} />
            )}
            {challengeType === 'fitness' && (
                <FitnessActivityContent activity={activity} challenge={challenge} config={config} />
            )}

            {/* Challenge footer */}
            {challenge && (
                <div className={`mx-3 mb-3 ${config.accentBg} rounded-lg px-3 py-2 border ${config.accentBorder}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                            <FaTrophy className="text-amber-500 shrink-0" size={11} />
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">
                                {challenge.title}
                            </span>
                        </div>
                        <div className={`flex items-center gap-1 ${config.ctaColor} text-xs font-semibold group-hover:gap-2 transition-all shrink-0 ml-2`}>
                            <span>Xem chi tiết</span>
                            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// ── Nutrition content ───────────────────────────────────────────────────────
function NutritionActivityContent({ activity, challenge, config }) {
    const isValid = activity.ai_review_valid === true
    const isPending = activity.ai_review_valid === null
    const isInvalid = activity.ai_review_valid === false
    const isLate = activity.validation_status === 'invalid_time'
    const goalValue = challenge?.goal_value
    const goalUnit = challenge?.goal_unit || 'kcal'
    const imageUrl = activity.proof_image ? getImageUrl(activity.proof_image) : null

    return (
        <div>
            {/* ── Hero food image ── */}
            {imageUrl ? (
                <div className="relative">
                    <img
                        src={imageUrl}
                        alt="Ảnh bữa ăn"
                        className={`w-full h-44 object-cover ${isLate ? 'grayscale opacity-80' : ''}`}
                        onError={(e) => { e.target.parentElement.style.display = 'none' }}
                    />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                    {/* AI badge overlay */}
                    {isLate ? (
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-1 rounded-lg backdrop-blur-md text-[10px] font-bold bg-amber-500/90 text-white shadow-lg">
                            <FaClock size={8} /> Trễ giờ
                        </div>
                    ) : !isPending && (
                        <div className={`absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-1 rounded-lg backdrop-blur-md text-[10px] font-bold ${
                            isValid
                                ? 'bg-emerald-500/80 text-white'
                                : 'bg-red-500/80 text-white'
                        }`}>
                            {isValid ? <><FaCheckCircle size={8} /> AI Verified</> : <><FaTimesCircle size={8} /> Lỗi AI / Không hợp lệ</>}
                        </div>
                    )}

                    {/* Food name overlay */}
                    <div className="absolute bottom-2.5 left-3 right-3">
                        {activity.food_name && (
                            <p className="text-white font-bold text-sm drop-shadow line-clamp-1">
                                🍽️ {activity.food_name}
                            </p>
                        )}
                    </div>
                </div>
            ) : (
                /* No image fallback */
                <div className="px-3 pt-3">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 flex items-center justify-center">
                        <FaLeaf className="text-emerald-400 text-3xl opacity-50" />
                    </div>
                </div>
            )}

            {/* ── Info section ── */}
            <div className="p-3 space-y-2">
                {/* Value + Calories row */}
                <div className="flex items-center gap-2">
                    <div className={`rounded-full px-3 py-1 ${isLate || isInvalid ? 'bg-gray-100 dark:bg-gray-800' : 'bg-emerald-100 dark:bg-emerald-900/30'}`}>
                        <span className={`font-bold text-sm ${isLate || isInvalid ? 'text-gray-500 line-through decoration-gray-400' : 'text-emerald-700 dark:text-emerald-300'}`}>
                            {isLate || isInvalid ? 0 : activity.value} {activity.unit || goalUnit}
                        </span>
                    </div>
                    {goalValue && (
                        <span className="text-xs text-gray-400">/ {goalValue} {goalUnit} mục tiêu</span>
                    )}
                    {activity.calories > 0 && (
                        <span className="ml-auto flex items-center gap-1 text-xs font-bold text-orange-600 dark:text-orange-400">
                            <FaFire size={9} /> {roundKcal(activity.calories)} kcal
                        </span>
                    )}
                </div>

                {/* Notes */}
                {activity.notes && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic line-clamp-2">
                        "{activity.notes}"
                    </p>
                )}

                {/* AI review reason */}
                {isInvalid && activity.ai_review_reason && !isLate && (
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg px-3 py-1.5">
                        <p className="text-xs text-red-600 dark:text-red-400 line-clamp-2">
                            💬 {activity.ai_review_reason}
                        </p>
                    </div>
                )}
                {isLate && (
                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-1.5">
                        <p className="text-xs text-amber-700 dark:text-amber-400 line-clamp-2">
                            ⏰ Hoạt động này được check-in ngoài khung giờ quy định, không cộng dồn vào tiến độ tổng.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

/** Chuẩn hóa outdoor: API /challenges/.../activity/:id trả ActivityTracking (totalDistance m, totalDuration s, avgSpeed m/s); tiến độ thử thách dùng distance (km), duration_minutes, avg_speed (km/h). */
function getOutdoorDisplayStats(activity) {
    let distanceKm = '0'
    if (activity.totalDistance != null && Number(activity.totalDistance) > 0) {
        distanceKm = (Number(activity.totalDistance) / 1000).toFixed(2)
    } else if (activity.distance != null && Number(activity.distance) > 0) {
        const d = Number(activity.distance)
        distanceKm = d > 200 ? (d / 1000).toFixed(2) : d.toFixed(2)
    } else if (activity.value != null && Number(activity.value) > 0) {
        distanceKm = Number(activity.value).toFixed(2)
    }

    let durationLabel = '0 phút'
    if (activity.totalDuration != null && Number(activity.totalDuration) > 0) {
        durationLabel = formatDuration(Math.round(Number(activity.totalDuration) / 60))
    } else if (activity.duration_minutes != null && Number(activity.duration_minutes) > 0) {
        durationLabel = formatDuration(Number(activity.duration_minutes))
    }

    let speedKmh = null
    if (activity.avgSpeed != null && Number(activity.avgSpeed) > 0) {
        speedKmh = (Number(activity.avgSpeed) * 3.6).toFixed(1)
    } else if (activity.avg_speed != null && Number(activity.avg_speed) > 0) {
        speedKmh = Number(activity.avg_speed).toFixed(1)
    } else if (Number(activity.totalDistance) > 0 && Number(activity.totalDuration) > 0) {
        const km = Number(activity.totalDistance) / 1000
        const h = Number(activity.totalDuration) / 3600
        speedKmh = (km / h).toFixed(2)
    }

    return { distanceKm, durationLabel, speedKmh }
}

// ── Outdoor Activity content ────────────────────────────────────────────────
function OutdoorActivityContent({ activity, challenge, config }) {
    const mapContainerRef = useRef(null)
    const mapRef = useRef(null)

    const gpsRoute = Array.isArray(activity?.gpsRoute) ? activity.gpsRoute : []
    const hasRoute = gpsRoute.length > 1

    useEffect(() => {
        if (!hasRoute || !mapContainerRef.current || mapRef.current) return

        const routePositions = gpsRoute.map((p) => [p.lng, p.lat])
        const lngs = routePositions.map(p => p[0])
        const lats = routePositions.map(p => p[1])
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
                paint: { 'line-color': '#06b6d4', 'line-width': 4, 'line-opacity': 0.9 }
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
            endEl.style.cssText = 'width:12px;height:12px;border-radius:50%;background:#06b6d4;border:2px solid #fff;box-shadow:0 0 6px rgba(6,182,212,0.5);'
            new goongjs.Marker(endEl).setLngLat(routePositions[routePositions.length - 1]).addTo(map)
        })

        mapRef.current = map
        return () => {
            if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
        }
    }, [hasRoute, gpsRoute])

    const { distanceKm, durationLabel, speedKmh } = getOutdoorDisplayStats(activity)

    const stats = [
        { icon: <FaRoad className="text-blue-500" />, label: 'Quãng đường', value: `${distanceKm} km` },
        { icon: <FaClock className="text-cyan-500" />, label: 'Thời gian', value: durationLabel },
    ]

    if (activity.calories) {
        stats.push({ icon: <FaFire className="text-orange-500" />, label: 'Calo', value: `${roundKcal(activity.calories)} kcal` })
    }
    if (speedKmh) {
        stats.push({ icon: <FaBolt className="text-yellow-500" />, label: 'Tốc độ TB', value: `${speedKmh} km/h` })
    }

    return (
        <div className="p-3">
            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-2 mb-3">
                {stats.map((s, i) => (
                    <div key={i} className="flex items-center gap-2.5 bg-blue-50/60 dark:bg-blue-900/10 rounded-lg px-3 py-2 border border-blue-100 dark:border-blue-900/30">
                        <div className="text-base shrink-0">{s.icon}</div>
                        <div className="min-w-0">
                            <div className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-medium">{s.label}</div>
                            <div className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">{s.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* GPS Route Map — dữ liệu từ ActivityTracking.gpsRoute */}
            {hasRoute && (
                <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <FaRoute className="text-cyan-500" size={10} />
                        <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase">Lộ trình đã ghi</span>
                    </div>
                    <div className="rounded-xl overflow-hidden border border-blue-200 dark:border-blue-900/30" style={{ height: '150px' }}>
                        {hasRoute ? (
                            <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-blue-50/50 dark:bg-gray-800/50 text-gray-400">
                                <div className="text-center">
                                    <FaRoute className="mx-auto mb-1 text-lg opacity-40" />
                                    <p className="text-[10px]">Đang tải bản đồ...</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Notes */}
            {activity.notes && (
                <p className="mt-2.5 text-xs text-gray-500 dark:text-gray-400 italic line-clamp-2">
                    "{activity.notes}"
                </p>
            )}
        </div>
    )
}

// ── Fitness content ────────────────────────────────────────────────────────
function FitnessActivityContent({ activity, challenge, config }) {
    const goalValue = challenge?.goal_value
    const goalUnit = challenge?.goal_unit || 'phút'

    // Workout session data (populated from backend)
    const session = activity.workout_session_id && typeof activity.workout_session_id === 'object'
        ? activity.workout_session_id
        : null
    const exercises = session?.exercises || []
    const musclesTargeted = session?.muscles_targeted || []

    const stats = []

    // value stat
    stats.push({
        icon: <FaDumbbell className="text-orange-500" />,
        label: challenge?.goal_unit || 'Buổi',
        value: `${activity.value} ${activity.unit || goalUnit}`
    })
    if (activity.duration_minutes) {
        stats.push({ icon: <FaClock className="text-amber-500" />, label: 'Thời gian', value: formatDuration(activity.duration_minutes) })
    }
    if (activity.exercises_count || exercises.length) {
        stats.push({ icon: <MdFitnessCenter className="text-orange-500" />, label: 'Bài tập', value: `${activity.exercises_count || exercises.length} bài` })
    }
    if (activity.calories) {
        stats.push({ icon: <FaFire className="text-red-500" />, label: 'Calo', value: `${roundKcal(activity.calories)} kcal` })
    }

    const displayStats = stats.slice(0, 4)

    const progressPct = goalValue > 0
        ? Math.min(Math.round((activity.value / goalValue) * 100), 100)
        : null

    return (
        <div className="p-3">
            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-2 mb-2.5">
                {displayStats.map((s, i) => (
                    <div key={i} className="flex items-center gap-2.5 bg-orange-50/60 dark:bg-orange-900/10 rounded-lg px-3 py-2 border border-orange-100 dark:border-orange-900/30">
                        <div className="text-base shrink-0">{s.icon}</div>
                        <div className="min-w-0">
                            <div className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-medium">{s.label}</div>
                            <div className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">{s.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Exercise list (from workout session) ── */}
            {exercises.length > 0 && (
                <div className="mb-2.5 bg-orange-50/40 dark:bg-orange-900/10 rounded-lg border border-orange-100 dark:border-orange-900/30 p-2.5">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold mb-1.5">📋 Bài tập ({exercises.length})</p>
                    <div className="space-y-1">
                        {exercises.slice(0, 4).map((ex, idx) => {
                            const completedSets = (ex.sets || []).filter(s => s.completed && !s.skipped).length
                            const totalSets = (ex.sets || []).length
                            const maxWeight = Math.max(0, ...(ex.sets || []).map(s => s.weight || 0))
                            return (
                                <div key={idx} className="flex items-center gap-2 text-xs">
                                    <span className="w-4 h-4 rounded bg-orange-200 dark:bg-orange-800/40 flex items-center justify-center text-[9px] font-bold text-orange-700 dark:text-orange-300 shrink-0">{idx + 1}</span>
                                    <span className="text-gray-700 dark:text-gray-300 font-medium truncate flex-1">{ex.exercise_name}</span>
                                    <span className="text-gray-400 dark:text-gray-500 shrink-0">
                                        {completedSets}/{totalSets}set{maxWeight > 0 ? ` • ${maxWeight}kg` : ''}
                                    </span>
                                </div>
                            )
                        })}
                        {exercises.length > 4 && (
                            <p className="text-[10px] text-gray-400 mt-0.5">+{exercises.length - 4} bài tập khác</p>
                        )}
                    </div>
                </div>
            )}

            {/* ── Muscle group tags ── */}
            {musclesTargeted.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2.5">
                    {musclesTargeted.slice(0, 5).map((muscle, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-[10px] font-medium">
                            {muscle}
                        </span>
                    ))}
                </div>
            )}

            {/* Daily progress bar */}
            {progressPct !== null && (
                <div className="mb-2">
                    <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400 mb-1">
                        <span>Tiến độ hôm nay</span>
                        <span className={`font-semibold ${progressPct >= 100 ? 'text-green-500' : 'text-orange-500'}`}>
                            {progressPct}%
                        </span>
                    </div>
                    <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full bg-gradient-to-r ${config.progressColors} transition-all duration-500`}
                            style={{ width: `${progressPct}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Notes */}
            {activity.notes && (
                <p className="text-xs text-gray-500 dark:text-gray-400 italic line-clamp-2">
                    "{activity.notes}"
                </p>
            )}
        </div>
    )
}
