// c:\DATN\fedacn\DATN_FE\src\components\Post\IndoorPreviewCard.jsx
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import moment from 'moment'
import {
    FaVideo,
    FaClock,
    FaFire,
    FaTrophy,
    FaCamera,
    FaRobot
} from 'react-icons/fa'
import { MdVideocam } from 'react-icons/md'
import { getSportEvent, getIndoorSession } from '../../apis/sportEventApi'

function formatDuration(seconds) {
    if (!seconds) return '0:00'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * Extracts session ID and event ID from marker [indoor-session:SESSION_ID:EVENT_ID]
 * Returns { sessionId, eventId } or null
 */
export function extractIndoorSessionIds(content) {
    if (!content) return null
    const match = content.match(/\[indoor-session:([a-f0-9]{24}):([a-f0-9]{24})\]/i)
    if (!match) return null
    return { sessionId: match[1], eventId: match[2] }
}

/**
 * Returns content with the indoor session marker removed.
 */
export function cleanIndoorSessionMarker(content) {
    if (!content) return content
    return content.replace(/\n?\[indoor-session:[a-f0-9]{24}:[a-f0-9]{24}\]/gi, '').trim()
}

/**
 * Shown in PostCard when a post contains an indoor-session share marker.
 * Clicking navigates to the sport event detail page.
 */
export default function IndoorPreviewCard({ sessionId, eventId }) {
    const navigate = useNavigate()

    // 1. Fetch Event Info
    const { data: eventData } = useQuery({
        queryKey: ['sportEvent-preview', eventId],
        queryFn: () => getSportEvent(eventId),
        enabled: Boolean(eventId),
        staleTime: 5 * 60 * 1000,
        retry: false
    })
    
    const event = eventData?.data?.result || eventData?.result

    // 2. Fetch Session Info
    const { data: sessionData, isLoading: isLoadingSession } = useQuery({
        queryKey: ['indoorSessionDetail', eventId, sessionId],
        queryFn: () => getIndoorSession(eventId, sessionId),
        enabled: Boolean(eventId && sessionId),
        staleTime: 60000,
        retry: false
    })

    const session = sessionData?.data?.result || sessionData?.result

    // Loading State
    if (isLoadingSession) {
        return (
            <div className="mt-3 mx-4 md:mx-0 p-4 rounded-xl border border-dashed border-indigo-200 dark:border-gray-700 animate-pulse bg-white dark:bg-gray-800">
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

    if (!session) {
        return (
            <div className="mt-3 mx-4 md:mx-0 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs text-center">
                Không thể tải thông tin buổi học
            </div>
        )
    }

    const {
        activeSeconds = 0,
        totalSeconds = 0,
        caloriesBurned = 0,
        screenshots = []
    } = session

    const aiAccuracy = totalSeconds > 0 ? Math.round((activeSeconds / totalSeconds) * 100) : 0
    const sessionDate = moment(session.joinedAt).format('HH:mm - DD/MM/YYYY')

    const getAiLabel = (pct) => {
        if (pct >= 90) return 'Xuất sắc'
        if (pct >= 70) return 'Tốt'
        if (pct >= 50) return 'Trung bình'
        return 'Thấp'
    }

    const stats = [
        { icon: <FaVideo className="text-blue-500" />, label: 'Tổng thời gian', value: formatDuration(totalSeconds) },
        { icon: <FaClock className="text-indigo-500" />, label: 'AI xác nhận', value: formatDuration(activeSeconds) },
        { icon: <FaFire className="text-orange-500" />, label: 'Calories', value: `${caloriesBurned} kcal` },
        { icon: <FaRobot className="text-emerald-500" />, label: `AI (${getAiLabel(aiAccuracy)})`, value: `${aiAccuracy}%` },
    ]

    const firstScreenshot = screenshots.length > 0 ? screenshots[0] : null

    return (
        <div
            onClick={() => eventId && navigate(`/sport-event/${eventId}`)}
            className="mt-3 mx-4 md:mx-0 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-600 cursor-pointer transition-all duration-200 bg-white dark:bg-gray-800 group"
            title="Nhấn để xem chi tiết sự kiện"
        >
            {/* Top gradient banner */}
            <div className="bg-gradient-to-r from-indigo-500 to-blue-500 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <MdVideocam className="text-white" size={16} />
                    <span className="text-white text-xs font-semibold uppercase tracking-wide">
                        Video Call
                    </span>
                </div>
                <span className="text-white/80 text-xs">{sessionDate}</span>
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

            {/* Screenshot section */}
            {firstScreenshot && (
                <div className="mx-3 mb-2">
                    <div className="flex items-center gap-1.5 mb-1.5 mt-1">
                        <FaCamera className="text-indigo-500" size={10} />
                        <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase">
                            Ảnh chụp buổi học
                        </span>
                    </div>
                    <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 aspect-video">
                        <img
                            src={firstScreenshot}
                            alt="Screenshot buổi học"
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.style.display = 'none' }}
                        />
                    </div>
                </div>
            )}

            {/* Event info fallback footer */}
            {event && (
                <div className="mx-3 mb-3 mt-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-2 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2">
                        <FaTrophy className="text-yellow-500 shrink-0" size={12} />
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">{event.name}</span>
                    </div>
                </div>
            )}
        </div>
    )
}
