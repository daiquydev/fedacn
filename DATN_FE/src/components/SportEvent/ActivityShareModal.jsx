import { roundKcal } from '../../utils/mathUtils'
import { useSafeMutation } from '../../hooks/useSafeMutation'
import { useState, useContext, useRef, useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import moment from 'moment'
import toast from 'react-hot-toast'
import goongjs from '@goongmaps/goong-js'
import '@goongmaps/goong-js/dist/goong-js.css'
import {
    FaTimes,
    FaShare,
    FaRunning,
    FaRoad,
    FaFire,
    FaClock,
    FaTrophy,
    FaGlobeAsia,
    FaBolt,
    FaRoute
} from 'react-icons/fa'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import { BsLockFill, BsPeopleFill } from 'react-icons/bs'
import { MdEmojiEmotions } from 'react-icons/md'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import useSound from 'use-sound'

import { AppContext } from '../../contexts/app.context'
import { createPost } from '../../apis/postApi'
import { getActivity } from '../../apis/sportEventApi'
import { getChallengeActivity } from '../../apis/challengeApi'
import { getImageUrl } from '../../utils/imageUrl'
import useravatar from '../../assets/images/useravatar.jpg'
import postSound from '../../assets/sounds/post.mp3'

goongjs.accessToken = import.meta.env.VITE_GOONG_MAPTILES_KEY

const PRIVACY_OPTIONS = [
    { value: 0, label: 'Công khai', icon: <FaGlobeAsia className="text-green-500" /> },
    { value: 1, label: 'Người theo dõi', icon: <BsPeopleFill className="text-blue-500" /> },
    { value: 2, label: 'Chỉ mình tôi', icon: <BsLockFill className="text-gray-500" /> }
]

function formatDuration(seconds) {
    if (!seconds) return '0:00'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * Modal chia sẻ tiến độ GPS activity lên cộng đồng.
 * Supports both Sport Events (eventId) and Challenges (challengeId).
 * Marker format: [activity:ACTIVITY_ID:EVENT_ID] or [challenge-activity:ACTIVITY_ID:CHALLENGE_ID]
 */
export default function ActivityShareModal({ activity, event, eventId, challengeId, challengeVisibility, userProgress, onClose }) {
    const { profile } = useContext(AppContext)
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [play] = useSound(postSound)
    const theme = localStorage.getItem('theme')

    // Map challenge visibility to privacy value
    const visibilityToPrivacy = { 'public': 0, 'friends': 1, 'private': 2 }
    const isChallenge = !!challengeId && !eventId
    const defaultPrivacy = isChallenge && challengeVisibility
        ? (visibilityToPrivacy[challengeVisibility] ?? 0)
        : 0

    const [content, setContent] = useState('')
    const [privacy, setPrivacy] = useState(defaultPrivacy)
    const [showPrivacyDropdown, setShowPrivacyDropdown] = useState(false)
    const [showEmoji, setShowEmoji] = useState(false)
    const textareaRef = useRef(null)
    const dropdownRef = useRef(null)

    useEffect(() => {
        if (textareaRef.current) textareaRef.current.focus()
    }, [])

    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowPrivacyDropdown(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const addEmoji = (e) => {
        const sym = e.unified.split('-')
        const codeArray = sym.map((el) => '0x' + el)
        const emoji = String.fromCodePoint(...codeArray)
        setContent((prev) => prev + emoji)
        setShowEmoji(false)
    }

    const createPostMutation = useSafeMutation({
        mutationFn: (body) => createPost(body)
    })

    const handleShare = () => {
        const sourceId = eventId || challengeId
        const markerType = isChallenge ? 'challenge-activity' : 'activity'
        const marker = `[${markerType}:${activity._id}:${sourceId}]`
        const fullContent = content.trim()
            ? `${content.trim()}\n${marker}`
            : marker

        const formData = new FormData()
        formData.append('content', fullContent)
        formData.append('privacy', String(privacy))

        createPostMutation.mutate(formData, {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['newFeeds'] })
                toast.success('🏃 Đã chia sẻ tiến độ lên cộng đồng!')
                play()
                onClose()
                navigate('/home')
            },
            onError: (err) => {
                toast.error(err?.response?.data?.message || 'Không thể chia sẻ bài viết')
            }
        })
    }

    const selectedPrivacy = PRIVACY_OPTIONS.find((o) => o.value === privacy)
    const distanceKm = activity ? (activity.totalDistance / 1000).toFixed(2) : '0'

    // Tính progress tích lũy từ userProgress thay vì 1 activity
    const progressPercent = useMemo(() => {
        if (!event?.targetValue || !userProgress) return null
        const maxP = event.maxParticipants > 0 ? event.maxParticipants : 1
        const perPerson = event.targetValue / maxP
        if (perPerson <= 0) return null
        return Math.round((userProgress.totalProgress / perPerson) * 100)
    }, [event, userProgress])

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden"
                style={{ maxHeight: '90vh' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* ── Header ── */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <FaRunning className="text-orange-500" />
                        Chia sẻ tiến độ
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-500 dark:text-gray-400"
                    >
                        <FaTimes size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {/* ── Author row ── */}
                    <div className="flex items-center gap-3 px-5 pt-4 pb-2">
                        <img
                            src={profile?.avatar ? getImageUrl(profile.avatar) : useravatar}
                            alt={profile?.name}
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-orange-400"
                        />
                        <div className="flex flex-col">
                            <span className="font-semibold text-sm text-gray-900 dark:text-white">
                                {profile?.name}
                            </span>

                            {/* Privacy dropdown — locked for challenges */}
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => !isChallenge && setShowPrivacyDropdown((v) => !v)}
                                    className={`flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full mt-0.5 transition ${isChallenge ? 'cursor-default opacity-80' : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                                        }`}
                                    title={isChallenge ? `Chia sẻ theo quyền riêng tư của thử thách (${selectedPrivacy?.label})` : undefined}
                                >
                                    {selectedPrivacy?.icon}
                                    {selectedPrivacy?.label}
                                    {!isChallenge && (
                                        <svg className="w-3 h-3 opacity-60" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </button>
                                {showPrivacyDropdown && !isChallenge && (
                                    <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden min-w-[160px]">
                                        {PRIVACY_OPTIONS.map((opt) => (
                                            <button
                                                key={opt.value}
                                                onClick={() => { setPrivacy(opt.value); setShowPrivacyDropdown(false) }}
                                                className={`flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm transition hover:bg-gray-50 dark:hover:bg-gray-700
                          ${privacy === opt.value ? 'text-orange-500 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}
                                            >
                                                {opt.icon}
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Textarea ── */}
                    <div className="px-5 pb-2">
                        <textarea
                            ref={textareaRef}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder={`${profile?.name?.split(' ').slice(-1)[0] || 'Bạn'} ơi, bạn cảm thấy thế nào sau buổi tập?`}
                            rows={3}
                            className="w-full resize-none outline-none text-sm text-gray-800 dark:text-gray-100 bg-transparent placeholder-gray-400 dark:placeholder-gray-500 leading-relaxed"
                        />

                        {/* Emoji toggle */}
                        <div className="flex justify-end mt-1 relative">
                            <button
                                onClick={() => setShowEmoji((v) => !v)}
                                className="text-gray-400 hover:text-yellow-400 transition p-1 rounded-full"
                                title="Thêm emoji"
                            >
                                <MdEmojiEmotions size={22} />
                            </button>
                            {showEmoji && (
                                <div className="absolute right-0 bottom-8 z-50">
                                    <Picker
                                        data={data}
                                        emojiSize={18}
                                        emojiButtonSize={25}
                                        onEmojiSelect={addEmoji}
                                        maxFrequentRows={0}
                                        previewPosition="none"
                                        locale="vi"
                                        theme={theme === 'dark' ? 'dark' : 'light'}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Activity Preview Card ── */}
                    <div className="mx-5 mb-4">
                        <ActivityPreviewCardInModal
                            activity={activity}
                            event={event}
                            eventId={eventId}
                            challengeId={challengeId}
                            distanceKm={distanceKm}
                            progressPercent={progressPercent}
                        />
                    </div>
                </div>

                {/* ── Footer / Submit ── */}
                <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                    <button
                        onClick={handleShare}
                        disabled={createPostMutation.isPending}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-sm
              bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600
              disabled:opacity-60 disabled:cursor-not-allowed transition shadow-lg shadow-orange-500/20"
                    >
                        {createPostMutation.isPending
                            ? <><AiOutlineLoading3Quarters className="animate-spin" size={16} /> Đang chia sẻ...</>
                            : <><FaShare size={14} /> Chia sẻ lên cộng đồng</>
                        }
                    </button>
                </div>
            </div>
        </div>
    )
}

/**
 * Preview card bên trong modal — hiển thị stats + bản đồ route GPS.
 */
function ActivityPreviewCardInModal({ activity, event, eventId, challengeId, distanceKm, progressPercent }) {
    if (!activity) return null

    const mapContainerRef = useRef(null)
    const mapRef = useRef(null)

    // Determine which API to use for fetching activity detail
    const sourceId = eventId || challengeId
    const isChallenge = !!challengeId && !eventId
    const canFetchRoute = activity.hasGpsRoute !== false && !!sourceId

    // Fetch full activity data (includes gpsRoute) for the map
    const { data: activityDetailData } = useQuery({
        queryKey: ['activityDetail', isChallenge ? 'challenge' : 'event', sourceId, activity._id],
        queryFn: () => isChallenge
            ? getChallengeActivity(challengeId, activity._id)
            : getActivity(eventId, activity._id),
        enabled: !!activity._id && canFetchRoute,
        staleTime: 60000,
        retry: false
    })

    const activityDetail = activityDetailData?.data?.result
    const gpsRoute = activityDetail?.gpsRoute || []
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
            interactive: false // non-interactive for preview
        })

        map.on('load', () => {
            // Route polyline
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
                paint: {
                    'line-color': '#3b82f6',
                    'line-width': 4,
                    'line-opacity': 0.9
                }
            })

            // Fit bounds to show full route
            const bounds = routePositions.reduce(
                (b, c) => b.extend(c),
                new goongjs.LngLatBounds(routePositions[0], routePositions[0])
            )
            map.fitBounds(bounds, { padding: 30 })

            // Start marker (green)
            const startEl = document.createElement('div')
            startEl.style.cssText =
                'width:12px;height:12px;border-radius:50%;background:#4caf50;border:2px solid #fff;box-shadow:0 0 6px rgba(76,175,80,0.5);'
            new goongjs.Marker(startEl).setLngLat(routePositions[0]).addTo(map)

            // End marker (red)
            const endEl = document.createElement('div')
            endEl.style.cssText =
                'width:12px;height:12px;border-radius:50%;background:#e74c3c;border:2px solid #fff;box-shadow:0 0 6px rgba(231,76,60,0.5);'
            new goongjs.Marker(endEl).setLngLat(routePositions[routePositions.length - 1]).addTo(map)
        })

        mapRef.current = map

        return () => {
            if (mapRef.current) {
                mapRef.current.remove()
                mapRef.current = null
            }
        }
    }, [hasRoute, gpsRoute])

    const duration = formatDuration(activity.totalDuration)
    const calories = roundKcal(activity.calories || 0)
    const actDate = moment(activity.startTime).format('HH:mm - DD/MM/YYYY')

    const stats = [
        { icon: <FaRoad className="text-blue-500" />, label: 'Quãng đường', value: `${distanceKm} km` },
        { icon: <FaClock className="text-purple-500" />, label: 'Thời gian', value: duration },
        { icon: <FaFire className="text-orange-500" />, label: 'Calo', value: `${calories} kcal` },
    ]

    // Add speed if available
    if (activity.totalDistance && activity.totalDuration) {
        const speedKmh = ((activity.totalDistance / 1000) / (activity.totalDuration / 3600)).toFixed(2)
        stats.push({ icon: <FaBolt className="text-yellow-500" />, label: 'Tốc độ TB', value: `${speedKmh} km/h` })
    }

    return (
        <div className="rounded-xl overflow-hidden border-2 border-dashed border-orange-200 dark:border-orange-900 bg-gradient-to-br from-white to-orange-50/50 dark:from-gray-800 dark:to-gray-900">
            {/* Top gradient banner */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FaRunning className="text-white" size={14} />
                    <span className="text-white text-xs font-semibold uppercase tracking-wide">
                        {event?.category || 'Hoạt động thể thao'}
                    </span>
                </div>
                <span className="text-white/80 text-xs">{actDate}</span>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-2 p-3">
                {stats.map((s, i) => (
                    <div key={i} className="flex items-center gap-2.5 bg-white dark:bg-gray-700/50 rounded-lg px-3 py-2 shadow-sm">
                        <div className="text-base shrink-0">{s.icon}</div>
                        <div className="min-w-0">
                            <div className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-medium">{s.label}</div>
                            <div className="text-sm font-bold text-gray-800 dark:text-white truncate">{s.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Bản đồ lộ trình đã ghi */}
            <div className="mx-3 mb-2">
                <div className="flex items-center gap-1.5 mb-1.5">
                    <FaRoute className="text-blue-500" size={10} />
                    <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase">Lộ trình đã ghi</span>
                </div>
                <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700" style={{ height: '160px' }}>
                    {hasRoute ? (
                        <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 text-gray-400">
                            <div className="text-center">
                                <FaRoute className="mx-auto mb-1 text-lg opacity-40" />
                                <p className="text-[10px]">{canFetchRoute ? 'Đang tải bản đồ...' : 'Không có dữ liệu lộ trình'}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Event info + progress */}
            {event && (
                <div className="mx-3 mb-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg px-3 py-2 border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-center gap-2 mb-1.5">
                        <FaTrophy className="text-yellow-500 shrink-0" size={12} />
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">{event.name}</span>
                    </div>
                    {progressPercent !== null && (
                        <>
                            <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400 mb-1">
                                <span>Tiến độ so với mục tiêu</span>
                                <span className={`font-semibold ${progressPercent >= 100 ? 'text-green-500' : ''}`}>
                                    {progressPercent}%
                                </span>
                            </div>
                            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${progressPercent >= 100
                                        ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                                        : 'bg-gradient-to-r from-orange-400 to-red-400'
                                        }`}
                                    style={{ width: `${Math.min(progressPercent, 100)}%` }}
                                />
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Hint */}
            <div className="px-3 pb-3 text-xs text-center text-gray-400 dark:text-gray-500 italic">
                💡 Người xem nhấn vào bài viết để xem chi tiết sự kiện
            </div>
        </div>
    )
}
