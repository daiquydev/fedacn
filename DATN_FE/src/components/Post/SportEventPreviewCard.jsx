import { useContext, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import moment from 'moment'

// Custom Vietnamese relative time (bypasses moment locale issues)
function fromNowVi(targetMoment) {
    const now = moment()
    const diffMs = targetMoment.diff(now)
    const absSec = Math.abs(diffMs) / 1000
    const absMin = absSec / 60
    const absHour = absMin / 60
    const absDay = absHour / 24
    const absMonth = absDay / 30
    const absYear = absDay / 365

    const future = diffMs > 0
    let str
    if (absSec < 45) str = 'vài giây'
    else if (absSec < 90) str = '1 phút'
    else if (absMin < 45) str = `${Math.round(absMin)} phút`
    else if (absMin < 90) str = '1 giờ'
    else if (absHour < 22) str = `${Math.round(absHour)} giờ`
    else if (absHour < 36) str = '1 ngày'
    else if (absDay < 25) str = `${Math.round(absDay)} ngày`
    else if (absDay < 45) str = '1 tháng'
    else if (absDay < 345) str = `${Math.round(absMonth)} tháng`
    else if (absDay < 545) str = '1 năm'
    else str = `${Math.round(absYear)} năm`

    return future ? `trong ${str}` : `${str} trước`
}
import {
    FaCalendarAlt,
    FaMapMarkerAlt,
    FaUsers,
    FaTrophy,
    FaRunning,
    FaArrowRight,
    FaClock,
    FaCheck
} from 'react-icons/fa'
import { MdVideocam } from 'react-icons/md'
import { getSportEvent, getLeaderboard } from '../../apis/sportEventApi'
import { currentAccount } from '../../apis/userApi'
import { getImageUrl } from '../../utils/imageUrl'
import useravatar from '../../assets/images/useravatar.jpg'
import { AppContext } from '../../contexts/app.context'

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

// ── Participant avatar strip (max 5 + overflow count) ──────────────────────
function ParticipantAvatars({ participants, friendIds, connectedIds }) {
    if (!participants || participants.length === 0) return null

    // Sort: friends first → followers/connected → others; then by join order (original index)
    const sorted = [...participants].map((p, idx) => ({ ...p, _origIdx: idx })).sort((a, b) => {
        const aId = String(a._id || a.id || '')
        const bId = String(b._id || b.id || '')
        const aFriend = friendIds.has(aId)
        const bFriend = friendIds.has(bId)
        const aConn = connectedIds.has(aId)
        const bConn = connectedIds.has(bId)

        if (aFriend && !bFriend) return -1
        if (!aFriend && bFriend) return 1
        if (aConn && !bConn) return -1
        if (!aConn && bConn) return 1
        return a._origIdx - b._origIdx // preserve join-time order within same tier
    })

    const MAX = 5
    const visible = sorted.slice(0, MAX)
    const remaining = sorted.length - MAX

    return (
        <div className="flex items-center">
            <div className="flex">
                {visible.map((p, idx) => {
                    const uid = String(p._id || p.id || '')
                    const isFriend = friendIds.has(uid)
                    const isConn = connectedIds.has(uid)

                    let ringStyle = {}
                    if (isFriend) {
                        ringStyle = { boxShadow: '0 0 0 2px #22c55e, 0 0 0 3.5px rgba(34,197,94,0.25)' }
                    } else if (isConn) {
                        ringStyle = { boxShadow: '0 0 0 2px #60a5fa, 0 0 0 3.5px rgba(96,165,250,0.2)' }
                    } else {
                        ringStyle = { border: '2px solid #e5e7eb' }
                    }

                    const avatar = p.avatar ? getImageUrl(p.avatar) : useravatar

                    return (
                        <div
                            key={uid || idx}
                            className="relative flex-shrink-0"
                            style={{ marginLeft: idx > 0 ? '-8px' : 0, zIndex: MAX - idx }}
                            title={`${p.name || 'Người dùng'}${isFriend ? ' • Bạn bè' : isConn ? ' • Theo dõi' : ''}`}
                        >
                            <img
                                src={avatar}
                                alt={p.name}
                                className="w-6 h-6 rounded-full object-cover"
                                style={ringStyle}
                                onError={(e) => { e.target.onerror = null; e.target.src = useravatar }}
                            />
                            {isFriend && (
                                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border border-white rounded-full flex items-center justify-center">
                                    <FaCheck style={{ fontSize: 5, color: 'white' }} />
                                </span>
                            )}
                        </div>
                    )
                })}

                {remaining > 0 && (
                    <div
                        className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center text-[9px] font-bold text-gray-600 dark:text-gray-300 flex-shrink-0"
                        style={{ marginLeft: '-8px', zIndex: 0, border: '2px solid #e5e7eb' }}
                    >
                        +{remaining}
                    </div>
                )}
            </div>
        </div>
    )
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
        staleTime: 60_000,
        retry: false
    })

    // Fetch leaderboard to compute overall event progress
    const { data: leaderboardData } = useQuery({
        queryKey: ['sportEvent-leaderboard-preview', eventId],
        queryFn: () => getLeaderboard(eventId),
        enabled: Boolean(eventId),
        staleTime: 60_000,
        retry: false
    })

    // Fetch current user's social graph for participant ring colors
    const { data: meData } = useQuery({
        queryKey: ['me'],
        queryFn: currentAccount,
        staleTime: 30_000
    })

    const me = meData?.data?.result?.[0]
    const myFollowers = useMemo(() => me?.followers || [], [me])
    const myFollowings = useMemo(() => me?.followings || [], [me])
    const followingIds = useMemo(() => new Set(myFollowings.map(p => String(p._id))), [myFollowings])
    const followerIds = useMemo(() => new Set(myFollowers.map(p => String(p._id))), [myFollowers])
    const friendIds = useMemo(
        () => new Set(myFollowers.filter(p => followingIds.has(String(p._id))).map(p => String(p._id))),
        [myFollowers, followingIds]
    )
    const connectedIds = useMemo(() => new Set([...followerIds, ...followingIds]), [followerIds, followingIds])

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
        return (
            <div className="mt-3 mx-4 md:mx-0 rounded-xl overflow-hidden border border-red-200 dark:border-red-900/40 bg-white dark:bg-gray-800/50">
                <div className="bg-gradient-to-r from-red-500 to-orange-500 px-4 py-2 opacity-50 flex items-center gap-2">
                    <FaRunning className="text-white" size={13} />
                    <span className="text-white text-xs font-semibold uppercase tracking-wide">Sự kiện thể thao</span>
                </div>
                <div className="px-4 py-5 flex items-center gap-3">
                    <span className="text-3xl opacity-30">🏃</span>
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Sự kiện thể thao này đã bị xóa hoặc không còn tồn tại
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Bài chia sẻ vẫn được lưu lại nhưng sự kiện không còn khả dụng</p>
                    </div>
                </div>
            </div>
        )
    }

    const event = data?.data?.result || data?.result
    if (!event) return null

    const isOnline = event.eventType === 'Trong nhà'
    const startDate = moment(event.startDate)
    const endDate = moment(event.endDate)
    const now = moment()

    // Use end of day for endDate so an event ending "today" isn't marked as ended
    const isEnded = now.isAfter(endDate.clone().endOf('day'))
    const isNotStarted = now.isBefore(startDate.clone().startOf('day'))
    const isFull = event.maxParticipants > 0 && event.participants >= event.maxParticipants

    const statusLabel = isEnded
        ? { text: 'Đã kết thúc', color: 'bg-gray-500' }
        : isNotStarted
            ? { text: 'Sắp diễn ra', color: 'bg-yellow-500' }
            : isFull
                ? { text: 'Đã đầy chỗ', color: 'bg-orange-500' }
                : { text: 'Đang diễn ra', color: 'bg-green-500' }

    // Compute overall event completion progress from leaderboard
    const leaderboard = leaderboardData?.data?.result?.leaderboard || []
    const totalEventProgress = leaderboard.reduce((sum, entry) => sum + (entry.totalProgress || 0), 0)
    const targetValue = event.targetValue || 0
    const overallProgressPct = targetValue > 0
        ? Math.min(Math.round((totalEventProgress / targetValue) * 100), 100)
        : 0

    // Time remaining or elapsed — Vietnamese
    const timeInfo = isEnded
        ? `Đã kết thúc ${fromNowVi(endDate)}`
        : isNotStarted
            ? `Bắt đầu ${fromNowVi(startDate)}`
            : `Kết thúc ${fromNowVi(endDate)}`

    // Participants list (populated objects)
    const participantsList = event.participants_ids || []
    const totalParticipants = event.participants || participantsList.length || 0

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
                    onError={(e) => { e.target.style.display = 'none' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

                {/* Badges overlay */}
                <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap">
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

                {/* Category + time info on banner */}
                <div className="absolute bottom-0 left-0 right-0 px-3 pb-2 flex items-end justify-between">
                    <div>
                        {event.category && (
                            <span className="text-white/80 text-xs bg-red-500/80 px-2 py-0.5 rounded-full font-medium">
                                {event.category}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1 text-white/70 text-[10px]">
                        <FaClock size={9} />
                        <span>{timeInfo}</span>
                    </div>
                </div>
            </div>

            {/* Info section */}
            <div className="p-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-2 leading-tight group-hover:text-red-500 transition-colors">
                        {event.name}
                    </h3>
                    {event.targetValue ? (
                        <div className="flex items-center gap-1 text-xs text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                            <FaTrophy size={9} />
                            <span className="font-medium">Mục tiêu: {event.targetValue} {event.targetUnit}</span>
                        </div>
                    ) : null}
                </div>

                {/* Date (full DD/MM/YYYY + time) and participant count+avatars on same row */}
                <div className="flex items-center justify-between gap-2 mb-2">
                    {/* ── Khoanh đỏ 1: Date with full year + time ── */}
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 min-w-0">
                        <FaCalendarAlt size={10} className="text-red-400 shrink-0" />
                        <span className="truncate">
                            {startDate.format('DD/MM/YYYY HH:mm')} – {endDate.format('DD/MM/YYYY')}
                        </span>
                    </div>

                    {/* ── Khoanh đỏ 2: Participant avatars + count ── */}
                    <div
                        className="flex items-center gap-1.5 flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <ParticipantAvatars
                            participants={participantsList}
                            friendIds={friendIds}
                            connectedIds={connectedIds}
                        />
                        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {totalParticipants}{event.maxParticipants > 0 ? `/${event.maxParticipants}` : ''} người tham gia
                        </span>
                    </div>
                </div>

                {/* Location */}
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-3">
                    {isOnline
                        ? <MdVideocam size={11} className="text-blue-400 shrink-0" />
                        : <FaMapMarkerAlt size={10} className="text-green-400 shrink-0" />
                    }
                    <span className="truncate">{event.location}</span>
                </div>

                {/* Overall event progress bar */}
                {targetValue > 0 && (
                    <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                            <span>Tiến độ hoàn thành sự kiện</span>
                            <span className={`font-semibold ${overallProgressPct >= 100 ? 'text-green-500' : 'text-gray-700 dark:text-gray-300'}`}>
                                {totalEventProgress.toLocaleString()} / {targetValue.toLocaleString()} {event.targetUnit} ({overallProgressPct}%)
                            </span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${overallProgressPct >= 100
                                    ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                                    : isEnded
                                        ? 'bg-gradient-to-r from-gray-400 to-gray-500'
                                        : 'bg-gradient-to-r from-red-400 to-orange-400'
                                    }`}
                                style={{ width: `${overallProgressPct}%` }}
                            />
                        </div>
                        {leaderboard.length > 0 && (
                            <p className="text-[10px] text-gray-400 mt-0.5">
                                {leaderboard.length} thành viên đã đóng góp
                            </p>
                        )}
                    </div>
                )}

                {/* CTA */}
                <div className="flex items-center justify-end">
                    <div className="flex items-center gap-1 text-red-500 text-xs font-semibold group-hover:gap-2 transition-all">
                        <span>Xem chi tiết</span>
                        <FaArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                </div>
            </div>
        </div>
    )
}
