import { useContext, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import moment from 'moment'
import {
    FaUtensils, FaRunning, FaDumbbell,
    FaUsers, FaTrophy, FaArrowRight,
    FaClock, FaFire, FaCheck, FaCalendarAlt
} from 'react-icons/fa'
import { getChallenge, getChallengeLeaderboard } from '../../apis/challengeApi'
import { currentAccount } from '../../apis/userApi'
import { getImageUrl } from '../../utils/imageUrl'
import useravatar from '../../assets/images/useravatar.jpg'
import { AppContext } from '../../contexts/app.context'
import { formatRelativeTimeVi } from '../../utils/formatRelativeTimeVi'

// ── Type config ────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
    nutrition: {
        icon: <FaUtensils />,
        label: 'Ăn uống',
        gradient: 'from-emerald-500 to-teal-600',
        badgeBg: 'bg-emerald-500',
        accentColor: 'text-emerald-400',
        progressFrom: 'from-emerald-400',
        progressTo: 'to-teal-500'
    },
    outdoor_activity: {
        icon: <FaRunning />,
        label: 'Ngoài trời',
        gradient: 'from-blue-500 to-cyan-600',
        badgeBg: 'bg-blue-500',
        accentColor: 'text-blue-400',
        progressFrom: 'from-blue-400',
        progressTo: 'to-cyan-500'
    },
    fitness: {
        icon: <FaDumbbell />,
        label: 'Thể dục',
        gradient: 'from-orange-500 to-amber-600',
        badgeBg: 'bg-orange-500',
        accentColor: 'text-orange-400',
        progressFrom: 'from-orange-400',
        progressTo: 'to-amber-500'
    }
}

// ── Participant avatar strip (max 5 + overflow) ────────────────────────────
function ParticipantAvatars({ participants, friendIds, connectedIds }) {
    if (!participants || participants.length === 0) return null
    const sorted = [...participants]
        .map((p, idx) => ({ ...p, _origIdx: idx }))
        .sort((a, b) => {
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
            return a._origIdx - b._origIdx
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
                    if (isFriend) ringStyle = { boxShadow: '0 0 0 2px #f97316, 0 0 0 3.5px rgba(249,115,22,0.25)' }
                    else if (isConn) ringStyle = { boxShadow: '0 0 0 2px #60a5fa, 0 0 0 3.5px rgba(96,165,250,0.2)' }
                    else ringStyle = { border: '2px solid #e5e7eb' }
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
                                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-orange-500 border border-white rounded-full flex items-center justify-center">
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

// ── Utility exports ────────────────────────────────────────────────────────

/**
 * Extracts challenge ID from [challenge:OBJECTID] marker in post content.
 */
export function extractChallengeId(content) {
    if (!content) return null
    const match = content.match(/\[challenge:([a-f0-9]{24})\]/i)
    return match ? match[1] : null
}

/**
 * Returns post content with [challenge:...] marker removed.
 */
export function cleanChallengeMarker(content) {
    if (!content) return content
    return content.replace(/\n?\[challenge:[a-f0-9]{24}\]/gi, '').trim()
}

// ── Main component ──────────────────────────────────────────────────────────
/**
 * Renders a rich challenge preview card inside PostCard when
 * a [challenge:ID] marker is detected. Clicking navigates to /challenge/:id.
 */
export default function ChallengePreviewCard({ challengeId }) {
    const navigate = useNavigate()

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['challenge-preview', challengeId],
        queryFn: () => getChallenge(challengeId),
        enabled: Boolean(challengeId),
        staleTime: 60_000,
        retry: false
    })

    // Leaderboard for overall progress bar
    const { data: leaderboardData } = useQuery({
        queryKey: ['challenge-leaderboard-preview', challengeId],
        queryFn: () => getChallengeLeaderboard(challengeId),
        enabled: Boolean(challengeId),
        staleTime: 60_000,
        retry: false
    })

    // Current user social graph for participant ring colors
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

    if (!challengeId) return null

    // Loading skeleton
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

    // Error state — treat all errors as "deleted/unavailable"
    if (isError) {
        return (
            <div className="mt-3 mx-4 md:mx-0 rounded-xl overflow-hidden border border-orange-200 dark:border-orange-900/40 bg-white dark:bg-gray-800/50">
                <div className="bg-gradient-to-r from-orange-500 to-amber-600 px-4 py-2 opacity-50 flex items-center gap-2">
                    <FaTrophy className="text-white" size={11} />
                    <span className="text-white text-xs font-semibold uppercase tracking-wide">Thử thách</span>
                </div>
                <div className="px-4 py-5 flex items-center gap-3">
                    <span className="text-3xl opacity-30">🏆</span>
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Thử thách này đã bị xóa hoặc không còn tồn tại
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Bài chia sẻ vẫn được lưu lại nhưng thử thách không còn khả dụng</p>
                    </div>
                </div>
            </div>
        )
    }

    const challenge = data?.data?.result
    if (!challenge) return null

    const config = TYPE_CONFIG[challenge.challenge_type] || TYPE_CONFIG.fitness
    const startDate = moment(challenge.start_date)
    const endDate = moment(challenge.end_date)
    const now = moment()

    const isEnded = now.isAfter(endDate.clone().endOf('day'))
    const isNotStarted = now.isBefore(startDate.clone().startOf('day'))
    const isOngoing = !isEnded && !isNotStarted

    const statusLabel = isEnded
        ? { text: 'Đã kết thúc', color: 'bg-gray-500' }
        : isNotStarted
            ? { text: 'Sắp diễn ra', color: 'bg-amber-500' }
            : { text: 'Đang diễn ra', color: 'bg-emerald-500' }

    // Compute overall progress from leaderboard
    const leaderboard = leaderboardData?.data?.result?.leaderboard || []
    const totalProgress = leaderboard.reduce((sum, e) => sum + (e.totalProgress || 0), 0)
    const safeStart = new Date(challenge.start_date || new Date())
    const safeEnd = new Date(challenge.end_date || new Date())
    safeStart.setHours(0, 0, 0, 0)
    safeEnd.setHours(0, 0, 0, 0)
    const totalRequiredDays = Math.max(1, Math.ceil((safeEnd - safeStart) / (1000 * 60 * 60 * 24)) + 1)
    const totalGoal = totalRequiredDays * (challenge.goal_value || 1) * (challenge.participants_count || 1)
    const overallPct = totalGoal > 0 ? Math.min(Math.round((totalProgress / totalGoal) * 100), 100) : 0

    const timeInfo = isEnded
        ? `Đã kết thúc ${formatRelativeTimeVi(endDate)}`
        : isNotStarted
            ? `Bắt đầu ${formatRelativeTimeVi(startDate)}`
            : `Kết thúc ${formatRelativeTimeVi(endDate)}`

    const participantsList = challenge.participants_ids || []
    const totalParticipants = challenge.participants_count || participantsList.length || 0

    return (
        <div
            onClick={() => navigate(`/challenge/${challengeId}`)}
            className="mt-3 mx-4 md:mx-0 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700
        hover:border-orange-400 dark:hover:border-orange-600 cursor-pointer transition-all duration-200
        hover:shadow-lg hover:shadow-orange-100 dark:hover:shadow-orange-900/20
        bg-white dark:bg-gray-800 group"
            title="Nhấn để xem chi tiết thử thách"
        >
            {/* Banner image */}
            <div className="relative h-28 overflow-hidden">
                {challenge.image ? (
                    <img
                        src={getImageUrl(challenge.image)}
                        alt={challenge.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => { e.target.style.display = 'none' }}
                    />
                ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
                        <span className="text-6xl opacity-25">{challenge.badge_emoji || '🏆'}</span>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

                {/* Badges overlay */}
                <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap">
                    <span className={`text-white text-xs px-2 py-0.5 rounded-full font-semibold ${statusLabel.color}`}>
                        {statusLabel.text}
                    </span>
                    <span className={`text-white text-xs px-2 py-0.5 rounded-full font-medium ${config.badgeBg}`}>
                        {config.icon && <span className="inline-flex items-center gap-1">{config.icon} {challenge.category && challenge.challenge_type === 'outdoor_activity' ? challenge.category : config.label}</span>}
                    </span>
                </div>

                {/* Challenge label */}
                <div className="absolute top-2 right-2 flex items-center gap-1 text-white/80 text-xs bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">
                    <FaTrophy size={9} />
                    <span>Thử thách</span>
                </div>

                {/* Time info on banner */}
                <div className="absolute bottom-0 left-0 right-0 px-3 pb-2 flex items-end justify-between">
                    <div>
                        {challenge.badge_emoji && (
                            <span className="text-xl">{challenge.badge_emoji}</span>
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
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-2 leading-tight group-hover:text-orange-500 transition-colors">
                        {challenge.title}
                    </h3>
                    {challenge.goal_value ? (
                        <div className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                            <FaFire size={9} />
                            <span className="font-medium">{challenge.goal_value} {challenge.goal_unit}/ngày</span>
                        </div>
                    ) : null}
                </div>

                {/* Date + participant row */}
                <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 min-w-0">
                        <FaCalendarAlt size={10} className="text-orange-400 shrink-0" />
                        <span className="truncate">
                            {startDate.format('DD/MM/YYYY')} – {endDate.format('DD/MM/YYYY')}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <ParticipantAvatars
                            participants={participantsList}
                            friendIds={friendIds}
                            connectedIds={connectedIds}
                        />
                        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {totalParticipants} người
                        </span>
                    </div>
                </div>

                {/* Overall progress bar */}
                {isOngoing && leaderboard.length > 0 && (
                    <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                            <span>Tiến độ cộng đồng</span>
                            <span className={`font-semibold ${overallPct >= 100 ? 'text-green-500' : 'text-gray-700 dark:text-gray-300'}`}>
                                {overallPct}%
                            </span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${config.progressFrom} ${config.progressTo}`}
                                style={{ width: `${overallPct}%` }}
                            />
                        </div>
                        {leaderboard.length > 0 && (
                            <p className="text-[10px] text-gray-400 mt-0.5">{leaderboard.length} thành viên đang tham gia</p>
                        )}
                    </div>
                )}

                {/* CTA */}
                <div className="flex items-center justify-end">
                    <div className="flex items-center gap-1 text-orange-500 text-xs font-semibold group-hover:gap-2 transition-all">
                        <span>Xem chi tiết</span>
                        <FaArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                </div>
            </div>
        </div>
    )
}
