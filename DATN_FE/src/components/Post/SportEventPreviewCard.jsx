import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import moment from 'moment'
import {
    FaCalendarAlt,
    FaMapMarkerAlt,
    FaUsers,
    FaTrophy,
    FaRunning,
    FaArrowRight
} from 'react-icons/fa'
import { MdVideocam } from 'react-icons/md'
import { getSportEvent } from '../../apis/sportEventApi'
import { getImageUrl } from '../../utils/imageUrl'

/**
 * Extracts sport event ID from a special marker embedded in post content.
 * Marker format: [sport-event:OBJECTID]
 */
export function extractSportEventId(content) {
    if (!content) return null
    const match = content.match(/\[sport-event:([a-f0-9]{24})\]/i)
    return match ? match[1] : null
}

/**
 * Returns the post content with the sport event marker removed.
 */
export function cleanSportEventMarker(content) {
    if (!content) return content
    return content.replace(/\n?\[sport-event:[a-f0-9]{24}\]/gi, '').trim()
}

/**
 * Component that renders in PostCard when a shared sport event is detected.
 * Clicking it navigates to the sport event detail page.
 */
export default function SportEventPreviewCard({ eventId }) {
    const navigate = useNavigate()

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['sportEvent-preview', eventId],
        queryFn: () => getSportEvent(eventId),
        enabled: Boolean(eventId),
        staleTime: 1000,
        retry: false
    })

    if (!eventId) return null

    if (isLoading) {
        return (
            <div className="mt-3 mx-4 md:mx-0 p-4 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 animate-pulse">
                <div className="flex gap-3">
                    <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                        <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                        <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                    </div>
                </div>
            </div>
        )
    }

    if (isError) {
        // Check if it's a 404/410 (deleted or not found) - show a subtle placeholder instead of crashing
        const status = error?.response?.status
        const isDeletedOrGone = status === 404 || status === 410
        return (
            <div className="mt-3 mx-4 md:mx-0 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-200 dark:border-gray-700 flex items-center gap-2">
                <span className="text-xl opacity-40">🏃</span>
                <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                    {isDeletedOrGone
                        ? 'Sự kiện thể thao này đã không còn khả dụng'
                        : 'Không thể tải thông tin sự kiện thể thao'}
                </span>
            </div>
        )
    }

    const event = data?.data?.result || data?.result
    if (!event) return null


    const isOnline = event.eventType === 'Trong nhà'
    const startDate = moment(event.startDate)
    const endDate = moment(event.endDate)
    const now = moment()
    const isEnded = now.isAfter(endDate)
    const isNotStarted = now.isBefore(startDate)
    const isFull = event.maxParticipants > 0 && event.participants >= event.maxParticipants

    const statusLabel = isEnded
        ? { text: 'Đã kết thúc', color: 'bg-gray-500' }
        : isNotStarted
            ? { text: 'Sắp diễn ra', color: 'bg-yellow-500' }
            : isFull
                ? { text: 'Đã đầy chỗ', color: 'bg-orange-500' }
                : { text: 'Đang diễn ra', color: 'bg-green-500' }

    const participantRatio = event.maxParticipants > 0
        ? Math.min((event.participants / event.maxParticipants) * 100, 100)
        : 0

    return (
        <div
            onClick={() => navigate(`/sport-event/${eventId}`)}
            className="mt-3 mx-4 md:mx-0 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700
        hover:border-red-400 dark:hover:border-red-600 cursor-pointer transition-all duration-200
        hover:shadow-lg hover:shadow-red-100 dark:hover:shadow-red-900/20
        bg-white dark:bg-gray-800 group"
            title="Nhấn để xem chi tiết sự kiện"
        >
            {/* Banner image */}
            <div className="relative h-28 overflow-hidden">
                <img
                    src={getImageUrl(event.image)}
                    alt={event.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                        e.target.style.display = 'none'
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

                {/* Badges overlay */}
                <div className="absolute top-2 left-2 flex gap-1.5">
                    <span className={`text-white text-xs px-2 py-0.5 rounded-full font-semibold ${statusLabel.color}`}>
                        {statusLabel.text}
                    </span>
                    <span className={`text-white text-xs px-2 py-0.5 rounded-full font-medium ${isOnline ? 'bg-blue-600' : 'bg-green-600'}`}>
                        {isOnline ? '🏠 Trong nhà' : '🌿 Ngoài trời'}
                    </span>
                </div>

                {/* Sport event label */}
                <div className="absolute top-2 right-2 flex items-center gap-1 text-white/80 text-xs bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">
                    <FaRunning size={9} />
                    <span>Sự kiện thể thao</span>
                </div>

                {/* Event name on banner */}
                <div className="absolute bottom-0 left-0 right-0 px-3 pb-2">
                    <div className="flex items-center gap-1.5">
                        {event.category && (
                            <span className="text-white/80 text-xs bg-red-500/80 px-2 py-0.5 rounded-full font-medium">
                                {event.category}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Info section */}
            <div className="p-3">
                <h3 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-2 leading-tight mb-2 group-hover:text-red-500 transition-colors">
                    {event.name}
                </h3>

                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-3">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <FaCalendarAlt size={10} className="text-red-400 shrink-0" />
                        <span className="truncate">{startDate.format('DD/MM')} – {endDate.format('DD/MM/YYYY')}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <FaUsers size={10} className="text-purple-400 shrink-0" />
                        <span>{event.participants}/{event.maxParticipants} người</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 col-span-2">
                        {isOnline
                            ? <MdVideocam size={11} className="text-blue-400 shrink-0" />
                            : <FaMapMarkerAlt size={10} className="text-green-400 shrink-0" />
                        }
                        <span className="truncate">{event.location}</span>
                    </div>
                </div>

                {/* Participant progress bar */}
                <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <span>Số người tham gia</span>
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                            {Math.round(participantRatio)}%
                        </span>
                    </div>
                    <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-red-400 to-orange-400 transition-all duration-500"
                            style={{ width: `${participantRatio}%` }}
                        />
                    </div>
                </div>

                {/* Target & CTA */}
                <div className="flex items-center justify-between">
                    {event.targetValue ? (
                        <div className="flex items-center gap-1.5 text-xs text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 px-2.5 py-1 rounded-full">
                            <FaTrophy size={10} />
                            <span className="font-medium">Mục tiêu: {event.targetValue} {event.targetUnit}</span>
                        </div>
                    ) : <div />}

                    <div className="flex items-center gap-1 text-red-500 text-xs font-semibold group-hover:gap-2 transition-all">
                        <span>Xem chi tiết</span>
                        <FaArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                </div>
            </div>
        </div>
    )
}
