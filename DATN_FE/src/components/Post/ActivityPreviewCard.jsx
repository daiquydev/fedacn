import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import moment from 'moment'
import {
    FaRoad,
    FaFire,
    FaClock,
    FaTrophy,
    FaRunning,
    FaArrowRight,
    FaBolt
} from 'react-icons/fa'
import { getSportEvent } from '../../apis/sportEventApi'
import { getImageUrl } from '../../utils/imageUrl'

/**
 * Extracts activity ID and event ID from marker [activity:ACT_ID:EVENT_ID]
 * Returns { activityId, eventId } or null
 */
export function extractActivityIds(content) {
    if (!content) return null
    const match = content.match(/\[activity:([a-f0-9]{24}):([a-f0-9]{24})\]/i)
    if (!match) return null
    return { activityId: match[1], eventId: match[2] }
}

/**
 * Returns content with the activity marker removed.
 */
export function cleanActivityMarker(content) {
    if (!content) return content
    return content.replace(/\n?\[activity:[a-f0-9]{24}:[a-f0-9]{24}\]/gi, '').trim()
}

function formatDuration(seconds) {
    if (!seconds) return '0:00'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * Shown in PostCard when a post contains an activity share marker.
 * Clicking navigates to the sport event detail page.
 */
export default function ActivityPreviewCard({ activityId, eventId }) {
    const navigate = useNavigate()

    const { data, isLoading, isError } = useQuery({
        queryKey: ['sportEvent-preview', eventId],
        queryFn: () => getSportEvent(eventId),
        enabled: Boolean(eventId),
        staleTime: 1000,
        retry: 1
    })

    if (!eventId) return null

    if (isLoading) {
        return (
            <div className="mt-3 mx-4 md:mx-0 p-4 rounded-xl border border-dashed border-orange-200 dark:border-orange-900 animate-pulse">
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

    if (isError) {
        return (
            <div className="mt-3 mx-4 md:mx-0 p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 text-xs text-center">
                Không thể tải thông tin hoạt động
            </div>
        )
    }

    const event = data?.data?.result || data?.result

    return (
        <div
            onClick={() => navigate(`/sport-event/${eventId}`)}
            className="mt-3 mx-4 md:mx-0 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700
        hover:border-orange-400 dark:hover:border-orange-600 cursor-pointer transition-all duration-200
        hover:shadow-lg hover:shadow-orange-100 dark:hover:shadow-orange-900/20
        bg-white dark:bg-gray-800 group"
            title="Nhấn để xem chi tiết sự kiện"
        >
            {/* Gradient header */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2.5 flex items-center gap-2">
                <FaRunning className="text-white" size={13} />
                <span className="text-white text-xs font-bold uppercase tracking-wide">
                    {event?.category || 'Hoạt động thể thao'}
                </span>
                {event && (
                    <span className="ml-auto text-white/80 text-xs truncate max-w-[150px]">
                        {event.name}
                    </span>
                )}
            </div>

            {/* Body */}
            <div className="p-3">
                {/* Activity ID info hint (activity data must come from parent post content — we only store event id) */}
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-500 shrink-0">
                        <FaRunning size={14} />
                    </div>
                    <div>
                        <div className="text-xs font-semibold text-gray-800 dark:text-white">
                            Đã hoàn thành một buổi {event?.category || 'tập luyện'}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                            Nhấn để xem chi tiết sự kiện
                        </div>
                    </div>
                </div>

                {/* Event detail */}
                {event && (
                    <div className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg px-3 py-2 border border-yellow-200 dark:border-yellow-800 mb-3">
                        <FaTrophy className="text-yellow-500 shrink-0" size={12} />
                        <div className="flex-1 min-w-0">
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate block">
                                {event.name}
                            </span>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                {moment(event.startDate).format('DD/MM')} – {moment(event.endDate).format('DD/MM/YYYY')} •{' '}
                                {event.participants}/{event.maxParticipants} người tham gia
                            </span>
                        </div>
                    </div>
                )}

                {/* CTA */}
                <div className="flex items-center justify-end">
                    <div className="flex items-center gap-1 text-orange-500 text-xs font-semibold group-hover:gap-2 transition-all">
                        <span>Xem chi tiết sự kiện</span>
                        <FaArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                </div>
            </div>
        </div>
    )
}
