import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell, LabelList
} from 'recharts'
import {
    FaFire, FaClock, FaTrophy, FaVideo, FaPlay,
    FaHistory, FaCheckCircle, FaDotCircle, FaShareAlt, FaTrash, FaChartLine
} from 'react-icons/fa'
import { MdVideocam } from 'react-icons/md'
import moment from 'moment'
import toast from 'react-hot-toast'

import {
    getVideoSessions,
    getVideoSessionStats,
    softDeleteVideoSession
} from '../../../apis/sportEventApi'
import VideoCallModal from '../../../components/SportEvent/VideoCallModal'
import VideoCallResult from '../../../components/SportEvent/VideoCallResult'
import IndoorDetailModal from '../../../components/SportEvent/IndoorDetailModal'
import IndoorShareModal from '../../../components/SportEvent/IndoorShareModal'
import ProgressRing from '../../../components/SportEvent/ProgressRing'
import TimeRangeDropdown from '../../../components/SportEvent/TimeRangeDropdown'
import MilestoneCelebration, { useMilestoneCelebration } from '../../../components/SportEvent/MilestoneCelebration'

// ─── Helpers ──────────────────────────────────────────────────────────────────
// Định dạng giây → chuỗi rõ đơn vị: "48p 00s" hoặc "1g 01p 01s"
function formatDuration(secs) {
    if (!secs || secs <= 0) return '0p 00s'
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = Math.floor(secs % 60)
    if (h > 0) return `${h}g ${String(m).padStart(2, '0')}p ${String(s).padStart(2, '0')}s`
    return `${m}p ${String(s).padStart(2, '0')}s`
}

function formatCountdown(secs) {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = Math.floor(secs % 60)
    if (h > 0) return `${h}g ${String(m).padStart(2, '0')}p ${String(s).padStart(2, '0')}s`
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const FILTER_LABELS = {
    '24h': '24 giờ gần nhất',
    '7d': '7 ngày gần nhất',
    '1m': '1 tháng gần nhất',
    '6m': '6 tháng gần nhất',
    'all': 'Toàn bộ thời gian'
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, subValue, colorClass, isActive, onClick }) => (
    <div
        onClick={onClick}
        className={`p-4 rounded-2xl shadow-sm border flex items-center gap-4 transition-all cursor-pointer
      ${isActive
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 ring-2 ring-blue-400'
                : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:shadow-md'
            }`}
    >
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${colorClass} bg-opacity-10 flex-shrink-0`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
            <h4 className="text-xl font-bold text-gray-900 dark:text-white">{value}</h4>
            {subValue && <p className="text-xs text-gray-400">{subValue}</p>}
        </div>
    </div>
)

// ─── Main Component ───────────────────────────────────────────────────────────
export default function IndoorEventProgress({ event, userProgress }) {
    const { id: eventId } = useParams()
    const queryClient = useQueryClient()

    // ── UI state
    const [timeFilter, setTimeFilter] = useState('7d')
    const [customRange, setCustomRange] = useState(null) // { startDate, endDate }
    const [activeMetric, setActiveMetric] = useState('minutes') // 'minutes' | 'calories'
    const [highlightDate, setHighlightDate] = useState(null)
    const [showVideoCall, setShowVideoCall] = useState(false)
    const [callResult, setCallResult] = useState(null)
    const [selectedSession, setSelectedSession] = useState(null) // For IndoorDetailModal
    const [shareSession, setShareSession] = useState(null) // For IndoorShareModal
    const [deleteSession, setDeleteSession] = useState(null) // For delete confirmation
    const [isDeleting, setIsDeleting] = useState(false)
    const [countdown, setCountdown] = useState(null)
    const countdownRef = useRef(null)

    // ── Fetch video sessions history
    const { data: vsData, refetch: refetchSessions } = useQuery({
        queryKey: ['videoSessions', eventId],
        queryFn: () => getVideoSessions(eventId),
        enabled: !!eventId && !!event?.isJoined
    })
    const videoSessions = useMemo(() => vsData?.data?.result || [], [vsData])
    // Lọc bỏ "abandoned sessions" + chỉ tính từ startDate hiện tại của sự kiện (fallback)
    const endedSessions = useMemo(() => {
        const eventStart = event?.startDate ? moment(event.startDate).startOf('day') : null
        return videoSessions.filter(s =>
            s.status === 'ended' &&
            (s.totalSeconds > 0 || s.activeSeconds > 0) &&
            (!eventStart || moment(s.joinedAt).isSameOrAfter(eventStart))
        )
    }, [videoSessions, event?.startDate])

    // ── Window calculation for event
    const eventStartMoment = useMemo(() => moment(event?.startDate), [event?.startDate])
    const eventEndMoment = useMemo(() => moment(event?.endDate), [event?.endDate])

    const getWindowStatus = useCallback(() => {
        const now = moment()
        const secondsBefore = eventStartMoment.diff(now, 'seconds')
        const isEnded = now.isAfter(eventEndMoment)
        const isActive = secondsBefore <= 0 && !isEnded  // event has started
        const canJoin = secondsBefore <= 600 && !isEnded  // <=10 minutes before start
        return { secondsBefore, isEnded, isActive, canJoin }
    }, [eventStartMoment, eventEndMoment])

    // ── Countdown timer
    useEffect(() => {
        const update = () => {
            const { secondsBefore, canJoin, isEnded } = getWindowStatus()
            if (isEnded || canJoin) {
                setCountdown(null)
                clearInterval(countdownRef.current)
                return
            }
            setCountdown(secondsBefore > 120 * 60 ? null : secondsBefore)
        }
        update()
        countdownRef.current = setInterval(update, 1000)
        return () => clearInterval(countdownRef.current)
    }, [getWindowStatus])

    // ── Filter sessions by time range
    const filteredSessions = useMemo(() => {
        if (customRange) {
            const start = moment(customRange.startDate).startOf('day')
            const end = moment(customRange.endDate).endOf('day')
            return endedSessions.filter(s => moment(s.joinedAt).isBetween(start, end, null, '[]'))
        }
        if (timeFilter === 'all') return endedSessions
        const now = moment()
        let cutoff
        switch (timeFilter) {
            case '24h': cutoff = moment().subtract(24, 'hours'); break
            case '7d': cutoff = moment().subtract(7, 'days'); break
            case '1m': cutoff = moment().subtract(1, 'month'); break
            case '6m': cutoff = moment().subtract(6, 'months'); break
            default: return endedSessions
        }
        return endedSessions.filter(s => moment(s.joinedAt).isAfter(cutoff))
    }, [endedSessions, timeFilter, customRange])

    // Today-only stats for the banner (independent of dropdown filter)
    const todayStats = useMemo(() => {
        const today = moment().startOf('day')
        const todaySessions = endedSessions.filter(s => moment(s.joinedAt).isSame(today, 'day'))
        return {
            totalSessions: todaySessions.length,
            totalActiveSeconds: todaySessions.reduce((s, v) => s + (v.activeSeconds || 0), 0),
            totalCalories: todaySessions.reduce((s, v) => s + (v.caloriesBurned || 0), 0)
        }
    }, [endedSessions])

    // All-time stats (từ sự kiện bắt đầu tới giờ, KHÔNG bị filter dropdown)
    // Dùng cho "Tiến độ tổng quan" — luôn phản ánh toàn bộ tiến độ thực tế
    const allTimeStats = useMemo(() => ({
        totalActiveSeconds: endedSessions.reduce((s, v) => s + (v.activeSeconds || 0), 0),
        totalCalories: endedSessions.reduce((s, v) => s + (v.caloriesBurned || 0), 0),
    }), [endedSessions])

    // Aggregate stats from filtered sessions (react to time filter)
    // Chỉ dùng cho "Thống kê chi tiết" và biểu đồ
    const indoorStats = useMemo(() => {
        const totalActiveSeconds = filteredSessions.reduce((s, v) => s + (v.activeSeconds || 0), 0)
        const totalCalories = filteredSessions.reduce((s, v) => s + (v.caloriesBurned || 0), 0)
        const avgSessionSeconds = filteredSessions.length > 0
            ? Math.round(totalActiveSeconds / filteredSessions.length)
            : 0

        // Weekly Streak (luôn tính từ tất cả sessions)
        const weekSet = new Set()
        endedSessions.forEach(s => {
            weekSet.add(moment(s.joinedAt).format('YYYY-[W]WW'))
        })
        let streak = 0
        let checkWeek = moment()
        while (weekSet.has(checkWeek.format('YYYY-[W]WW'))) {
            streak++
            checkWeek = checkWeek.subtract(1, 'week')
        }

        return {
            totalSessions: filteredSessions.length,
            totalActiveSeconds,
            totalCalories,
            avgSessionSeconds,
            weeklyStreak: streak
        }
    }, [filteredSessions, endedSessions])

    // Progress % từ ALL-TIME stats — KHÔNG bị filter dropdown
    // Đây là tiến độ thực tế từ lúc tham gia sự kiện đến hiện tại
    const progressStats = useMemo(() => {
        if (!event?.targetValue || event.targetValue <= 0) return null
        const maxParticipants = event?.maxParticipants > 0 ? event.maxParticipants : 1
        const perPersonTarget = event.targetValue / maxParticipants
        if (perPersonTarget <= 0) return null

        const unit = (event.targetUnit || '').toLowerCase()
        let actualTotal = 0
        if (unit.includes('kcal') || unit.includes('calo')) {
            actualTotal = allTimeStats.totalCalories
        } else {
            // Đổi giây → phút để so với target (đơn vị thường là phút)
            actualTotal = Math.round(allTimeStats.totalActiveSeconds / 60)
        }

        const rawPct = Math.round((actualTotal / perPersonTarget) * 100)
        const pct = isNaN(rawPct) ? 0 : Math.min(rawPct, 100)
        return { total: actualTotal, pct, perPersonTarget }
    }, [allTimeStats, event])

    // ── Handle time filter change from dropdown
    const handleTimeChange = useCallback((filterObj) => {
        if (filterObj.period) {
            setTimeFilter(filterObj.period)
            setCustomRange(null)
        } else if (filterObj.startDate && filterObj.endDate) {
            setTimeFilter('custom')
            setCustomRange({ startDate: filterObj.startDate, endDate: filterObj.endDate })
        }
    }, [])

    // ── Filter subtitle
    const filterSubtitle = useMemo(() => {
        if (customRange) {
            const s = moment(customRange.startDate).format('DD/MM/YYYY')
            const e = moment(customRange.endDate).format('DD/MM/YYYY')
            return `${s} → ${e}`
        }
        return FILTER_LABELS[timeFilter] || ''
    }, [timeFilter, customRange])

    // ── Chart data
    const chartData = useMemo(() => {
        const field = activeMetric === 'calories' ? 'caloriesBurned' : 'activeSeconds'
        const divisor = activeMetric === 'minutes' ? 60 : 1

        // 24h → show per-session bars (individual entries)
        if (timeFilter === '24h' && !customRange) {
            const cutoff = moment().subtract(24, 'hours')
            const recentSessions = endedSessions
                .filter(s => moment(s.joinedAt).isAfter(cutoff))
                .sort((a, b) => moment(a.joinedAt).diff(moment(b.joinedAt)))
            return recentSessions.map(vs => ({
                date: moment(vs.joinedAt).format('HH:mm'),
                fullDate: moment(vs.joinedAt).format('YYYY-MM-DD'),
                value: Math.round((vs[field] || 0) / divisor),
                calories: vs.caloriesBurned || 0,
                minutes: Math.round((vs.activeSeconds || 0) / 60),
                aiPct: vs.totalSeconds > 0 ? Math.round((vs.activeSeconds / vs.totalSeconds) * 100) : 0
            }))
        }

        // Custom date range → group by day
        if (customRange) {
            const start = moment(customRange.startDate)
            const end = moment(customRange.endDate)
            const totalDays = end.diff(start, 'days') + 1
            const arr = Array.from({ length: totalDays }, (_, i) => {
                const d = moment(start).add(i, 'days')
                return { date: d.format('DD/MM'), fullDate: d.format('YYYY-MM-DD'), value: 0, calories: 0, minutes: 0, sessions: 0 }
            })
            endedSessions.forEach(vs => {
                const d = moment(vs.joinedAt).format('YYYY-MM-DD')
                const slot = arr.find(x => x.fullDate === d)
                if (slot) {
                    slot.value += Math.round((vs[field] || 0) / divisor)
                    slot.calories += (vs.caloriesBurned || 0)
                    slot.minutes += Math.round((vs.activeSeconds || 0) / 60)
                    slot.sessions += 1
                }
            })
            if (arr.length > 30) {
                const step = Math.ceil(arr.length / 30)
                return arr.filter((_, i) => i % step === 0)
            }
            return arr
        }

        // 7d → 7 cột theo ngày
        if (timeFilter === '7d') {
            const arr = Array.from({ length: 7 }, (_, i) => {
                const d = moment().subtract(6 - i, 'days')
                return { date: d.format('DD/MM'), fullDate: d.format('YYYY-MM-DD'), value: 0, calories: 0, minutes: 0, sessions: 0 }
            })
            endedSessions.forEach(vs => {
                const d = moment(vs.joinedAt).format('YYYY-MM-DD')
                const slot = arr.find(x => x.fullDate === d)
                if (slot) {
                    slot.value += Math.round((vs[field] || 0) / divisor)
                    slot.calories += (vs.caloriesBurned || 0)
                    slot.minutes += Math.round((vs.activeSeconds || 0) / 60)
                    slot.sessions += 1
                }
            })
            return arr
        }

        // all → group by tháng (≤12 cột)
        if (timeFilter === 'all') {
            const monthMap = {}
            endedSessions.forEach(vs => {
                const key = moment(vs.joinedAt).format('MM/YY')
                if (!monthMap[key]) monthMap[key] = { date: key, fullDate: moment(vs.joinedAt).format('YYYY-MM'), value: 0, calories: 0, minutes: 0, sessions: 0 }
                monthMap[key].value += Math.round((vs[field] || 0) / divisor)
                monthMap[key].calories += (vs.caloriesBurned || 0)
                monthMap[key].minutes += Math.round((vs.activeSeconds || 0) / 60)
                monthMap[key].sessions += 1
            })
            return Object.values(monthMap).slice(-12)
        }

        // 1m → 5 tuần, 6m → 26 tuần
        const numWeeks = timeFilter === '6m' ? 26 : 5
        const weeks = []
        for (let i = numWeeks - 1; i >= 0; i--) {
            const weekStart = moment().subtract(i * 7 + 6, 'days')
            const weekEnd = moment().subtract(i * 7, 'days')
            weeks.push({
                date: weekStart.format('DD/MM'),
                fullDate: weekStart.format('YYYY-MM-DD'),
                weekEnd: weekEnd.format('YYYY-MM-DD'),
                value: 0, calories: 0, minutes: 0, sessions: 0
            })
        }
        endedSessions.forEach(vs => {
            const vsDate = moment(vs.joinedAt)
            const week = weeks.find(w => vsDate.isBetween(moment(w.fullDate), moment(w.weekEnd), 'day', '[]'))
            if (week) {
                week.value += Math.round((vs[field] || 0) / divisor)
                week.calories += (vs.caloriesBurned || 0)
                week.minutes += Math.round((vs.activeSeconds || 0) / 60)
                week.sessions += 1
            }
        })
        return weeks
    }, [endedSessions, timeFilter, activeMetric, customRange])

    const handleCallEnded = useCallback((summary) => {
        setCallResult(summary)
        setShowVideoCall(false)
        refetchSessions()
        queryClient.invalidateQueries({ queryKey: ['userProgress', eventId] })
        // Auto-open detail modal with summary data after a short delay
        setTimeout(() => {
            setSelectedSession({
                ...summary,
                joinedAt: new Date().toISOString(),
                screenshots: summary.screenshots || []
            })
        }, 300)
    }, [refetchSessions, queryClient, eventId])

    const { canJoin, isEnded, secondsBefore } = getWindowStatus()

    const metricUnit = activeMetric === 'calories' ? 'kcal' : 'phút'
    const barColor = activeMetric === 'calories' ? '#F97316' : '#3B82F6'

    // ── Indoor Milestone Celebration
    const { celebration: indoorCelebration, closeCelebration: closeIndoorCelebration } =
        useMilestoneCelebration(eventId, progressStats?.pct || 0, 'indoor')

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Milestone Celebration */}
            <MilestoneCelebration milestone={indoorCelebration} isGroup={false} onClose={closeIndoorCelebration} />

            {/* ── Video Call Modal ── */}
            {showVideoCall && (
                <VideoCallModal
                    event={event}
                    onClose={() => setShowVideoCall(false)}
                    onCallEnded={handleCallEnded}
                />
            )}

            {/* ── Result Modal ── */}
            {callResult && (
                <VideoCallResult
                    result={callResult}
                    event={event}
                    onClose={() => setCallResult(null)}
                />
            )}

            {/* ── Indoor Detail Modal ── */}
            {selectedSession && (
                <IndoorDetailModal
                    session={selectedSession}
                    event={event}
                    isCompletion={!!callResult}
                    onClose={() => { setSelectedSession(null); setCallResult(null) }}
                    onShare={(session) => {
                        setSelectedSession(null)
                        setCallResult(null)
                        setShareSession(session)
                    }}
                />
            )}

            {/* ── Indoor Share Modal ── */}
            {shareSession && (
                <IndoorShareModal
                    session={shareSession}
                    event={event}
                    eventId={eventId}
                    progressStats={progressStats}
                    onClose={() => setShareSession(null)}
                />
            )}

            {/* ── Video Call Banner ───────────────────────────────────────────────── */}
            <div className={`rounded-2xl p-6 shadow-lg text-white relative overflow-hidden
        ${canJoin
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600'
                    : isEnded
                        ? 'bg-gradient-to-r from-gray-500 to-gray-600'
                        : 'bg-gradient-to-r from-violet-600 to-blue-600'
                }`}
            >
                {/* decorative circles */}
                <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full" />
                <div className="absolute -bottom-8 -left-4 w-24 h-24 bg-white/10 rounded-full" />

                <div className="relative flex items-center justify-between gap-4 flex-wrap">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <MdVideocam className="text-2xl" />
                            <h3 className="text-xl font-bold">Video Call Trong nhà</h3>
                            {indoorStats.weeklyStreak > 0 && (
                                <span className="ml-2 bg-white/20 backdrop-blur-sm rounded-lg px-2 py-0.5 text-sm font-black">
                                    🔥 {indoorStats.weeklyStreak} tuần
                                </span>
                            )}
                        </div>

                        {isEnded ? (
                            <p className="text-sm opacity-80">Sự kiện đã kết thúc</p>
                        ) : canJoin ? (
                            <p className="text-sm opacity-90">
                                {secondsBefore > 0
                                    ? `🟡 Sự kiện bắt đầu trong ${formatCountdown(secondsBefore)} — Bạn có thể vào sớm`
                                    : '🟢 Sự kiện đang diễn ra — Tham gia ngay!'
                                }
                            </p>
                        ) : countdown !== null ? (
                            <p className="text-sm opacity-90">
                                ⏳ Còn <span className="font-mono font-bold text-yellow-300">{formatCountdown(countdown)}</span> nữa sẽ mở video call
                            </p>
                        ) : (
                            <p className="text-sm opacity-80">Video call mở 10 phút trước khi sự kiện bắt đầu</p>
                        )}
                    </div>

                    {!isEnded && canJoin && (
                        <button
                            onClick={() => setShowVideoCall(true)}
                            className="flex-shrink-0 flex items-center gap-2 bg-white text-blue-600 px-6 py-3
                         rounded-xl font-bold text-sm hover:bg-blue-50 transition shadow-lg"
                        >
                            <FaPlay className="text-xs" />
                            Tham gia Video Call
                        </button>
                    )}
                </div>

                {/* Session stats quick row - today only */}
                {todayStats.totalSessions > 0 && (
                    <div className="relative mt-4 pt-4 border-t border-white/20 grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-2xl font-bold">{todayStats.totalSessions}</p>
                            <p className="text-xs opacity-80">Lần tham gia</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{formatDuration(todayStats.totalActiveSeconds)}</p>
                            <p className="text-xs opacity-80">Thời gian hôm nay</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{todayStats.totalCalories}</p>
                            <p className="text-xs opacity-80">kcal</p>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Progress Overview Block — Independent of filter */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 flex flex-col md:flex-row items-center gap-8">
                    <div className="relative flex-shrink-0">
                        <ProgressRing
                            size={180}
                            strokeWidth={16}
                            percent={progressStats?.pct || 0}
                            color="#6366f1"
                            colorEnd={(progressStats?.pct || 0) >= 100 ? '#22c55e' : '#8b5cf6'}
                            label={`${progressStats?.pct || 0}%`}
                            sublabel="hoàn thành"
                            showPercent={false}
                        />
                    </div>
                    <div className="flex-1 w-full">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Tiến độ tổng quan</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            Mục tiêu cá nhân:{' '}
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                                {progressStats?.perPersonTarget > 0 ? `${progressStats.perPersonTarget.toFixed(2)} ${event.targetUnit}` : 'Chưa thiết lập'}
                            </span>
                        </p>
                        <div className="p-4 rounded-2xl border-2 border-indigo-100 dark:border-indigo-900/30 bg-indigo-50 dark:bg-indigo-900/10 max-w-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" />
                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Tiến độ đạt được</span>
                            </div>
                            <p className="text-2xl font-black text-gray-800 dark:text-white">
                                {progressStats ? Number(progressStats.total).toFixed(2) : 0} <span className="text-sm font-medium text-gray-400">{event.targetUnit}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Activity Stats — Dropdown in header */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 px-6 py-4 flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">📊 Thống kê chi tiết</h3>
                        {filterSubtitle && <p className="text-gray-500 text-xs mt-0.5">📅 {filterSubtitle}</p>}
                    </div>
                    <TimeRangeDropdown
                        value={timeFilter}
                        onChange={handleTimeChange}
                        accentColor="indigo"
                    />
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Time stat */}
                        <div
                            onClick={() => setActiveMetric('minutes')}
                            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${activeMetric === 'minutes'
                                ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 shadow-md ring-1 ring-blue-400'
                                : 'border-gray-100 dark:border-gray-700 hover:border-blue-200 bg-white dark:bg-gray-800'
                                }`}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" />
                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Thời gian</span>
                            </div>
                            <p className="text-xl font-black text-gray-800 dark:text-white">
                                {formatDuration(indoorStats.totalActiveSeconds)}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">AI xác nhận có mặt</p>
                        </div>

                        {/* Calories stat */}
                        <div
                            onClick={() => setActiveMetric('calories')}
                            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${activeMetric === 'calories'
                                ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20 shadow-md ring-1 ring-orange-400'
                                : 'border-gray-100 dark:border-gray-700 hover:border-orange-200 bg-white dark:bg-gray-800'
                                }`}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-orange-500 to-yellow-500" />
                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Calories</span>
                            </div>
                            <p className="text-xl font-black text-gray-800 dark:text-white">
                                {indoorStats.totalCalories} <span className="text-sm font-medium text-gray-400">kcal</span>
                            </p>
                        </div>

                        {/* Sessions stat */}
                        <div className="p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-sm transition-all">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Lần tham gia</span>
                            </div>
                            <p className="text-xl font-black text-gray-800 dark:text-white">
                                {indoorStats.totalSessions} <span className="text-sm font-medium text-gray-400">buổi</span>
                            </p>
                        </div>

                        {/* Avg session time */}
                        <div className="p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-sm transition-all">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500" />
                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">TB/buổi</span>
                            </div>
                            <p className="text-xl font-black text-gray-800 dark:text-white">
                                {formatDuration(indoorStats.avgSessionSeconds)}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">Thời gian trung bình</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Chart + History */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Chart */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="px-6 pt-6 pb-2 flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg"
                                    style={{ background: `linear-gradient(135deg, ${barColor}, ${barColor}99)` }}>
                                    <FaChartLine />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                                        Lịch sử
                                        <span className="text-sm font-normal text-gray-400 ml-1">({metricUnit})</span>
                                    </h3>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {timeFilter === '24h'
                                            ? 'Hiển thị từng buổi tham gia trong 24 giờ qua'
                                            : 'Nhấn vào cột để xem chi tiết ngày đó'}
                                    </p>
                                </div>
                            </div>
                            {/* Legend dots */}
                            <div className="flex items-center gap-4 text-xs text-gray-400">
                                <span className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: barColor }} />
                                    Có dữ liệu
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-gray-200 dark:bg-gray-600" />
                                    Không có
                                </span>
                            </div>
                        </div>

                        <div className="px-6 pb-6 pt-2">
                            <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart 
                                    data={chartData}
                                    margin={{ top: 28, right: 8, left: -8, bottom: 4 }}
                                    barCategoryGap="20%"
                                >
                                    <defs>
                                        <linearGradient id="barGradientBlue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#3B82F6" stopOpacity={1} />
                                            <stop offset="100%" stopColor="#06B6D4" stopOpacity={0.85} />
                                        </linearGradient>
                                        <linearGradient id="barGradientOrange" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#F97316" stopOpacity={1} />
                                            <stop offset="100%" stopColor="#FBBF24" stopOpacity={0.85} />
                                        </linearGradient>
                                        <linearGradient id="barGradientHighlight" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#8B5CF6" stopOpacity={1} />
                                            <stop offset="100%" stopColor="#A78BFA" stopOpacity={0.9} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#E5E7EB" strokeOpacity={0.6} />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 500 }}
                                        dy={8}
                                        interval={chartData.length > 10 ? Math.floor(chartData.length / 7) : 0}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#9CA3AF', fontSize: 11 }}
                                        width={40}
                                        tickFormatter={(v) => {
                                            if (v >= 1000) return `${(v / 1000).toFixed(1)}k`
                                            return v % 1 === 0 ? v : v.toFixed(1)
                                        }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(99, 102, 241, 0.06)', radius: 8 }}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload
                                                return (
                                                    <div className="bg-white dark:bg-gray-800 p-3 shadow-lg rounded-xl border border-gray-100 dark:border-gray-700 text-sm">
                                                        <p className="font-bold text-gray-800 dark:text-white mb-2 border-b border-gray-100 dark:border-gray-700 pb-1">{data.date}</p>
                                                        {timeFilter === '24h' ? (
                                                            <div className="space-y-1">
                                                                <p className="flex justify-between gap-6"><span className="text-gray-500 dark:text-gray-400">Thời gian:</span> <span className="font-bold text-blue-500">{data.minutes} phút</span></p>
                                                                <p className="flex justify-between gap-6"><span className="text-gray-500 dark:text-gray-400">Calories:</span> <span className="font-bold text-orange-500">{data.calories} kcal</span></p>
                                                                <p className="flex justify-between gap-6"><span className="text-gray-500 dark:text-gray-400">AI:</span> <span className="font-bold text-indigo-500">{data.aiPct}%</span></p>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-1">
                                                                <p className="flex justify-between gap-6"><span className="text-gray-500 dark:text-gray-400">Thời gian:</span> <span className="font-bold text-blue-500">{data.minutes} phút</span></p>
                                                                <p className="flex justify-between gap-6"><span className="text-gray-500 dark:text-gray-400">Calories:</span> <span className="font-bold text-orange-500">{data.calories} kcal</span></p>
                                                                <p className="flex justify-between gap-6"><span className="text-gray-500 dark:text-gray-400">Số buổi:</span> <span className="font-bold text-emerald-500">{data.sessions} lần</span></p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            }
                                            return null
                                        }}
                                    />
                                    <Bar 
                                        dataKey="value" 
                                        radius={[6, 6, 0, 0]}
                                        onClick={d => {
                                            if (d?.fullDate) {
                                                setHighlightDate(d.fullDate)
                                                setTimeout(() => setHighlightDate(null), 3000)
                                            }
                                        }}
                                        style={{ cursor: 'pointer' }}
                                        animationDuration={800}
                                        animationEasing="ease-out"
                                    >
                                        <LabelList
                                            dataKey="value"
                                            position="top"
                                            style={{ fontSize: 10, fontWeight: 600, fill: '#6B7280' }}
                                            formatter={(v) => {
                                                if (!v || v <= 0) return ''
                                                if (v >= 1000) return `${(v / 1000).toFixed(1)}k`
                                                return v % 1 === 0 ? v : v.toFixed(1)
                                            }}
                                            offset={6}
                                        />
                                        {chartData.map((entry, index) => {
                                            const gradientMap = {
                                                minutes: 'url(#barGradientBlue)',
                                                calories: 'url(#barGradientOrange)'
                                            }
                                            const isHighlighted = entry.fullDate === highlightDate
                                            const isEmpty = !entry.value || entry.value <= 0
                                            let fill = isEmpty ? '#F3F4F6' : (gradientMap[activeMetric] || 'url(#barGradientBlue)')
                                            if (isHighlighted) fill = 'url(#barGradientHighlight)'
                                            return (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={fill}
                                                />
                                            )
                                        })}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        </div>
                    </div>
                </div>

                {/* Session History */}
                <div>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 sticky top-24">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <FaHistory className="text-blue-500" />
                            Lịch sử buổi học
                        </h3>

                        {endedSessions.length === 0 ? (
                            <div className="text-center py-8">
                                <MdVideocam className="text-4xl text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                <p className="text-sm text-gray-400">
                                    Chưa có buổi học nào.<br />Nhấn "Tham gia Video Call" để bắt đầu!
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                                {endedSessions.map((vs) => {
                                    const vsDate = moment(vs.joinedAt).format('YYYY-MM-DD')
                                    const isHighlighted = highlightDate === vsDate
                                    const aiPct = vs.totalSeconds > 0
                                        ? Math.round((vs.activeSeconds / vs.totalSeconds) * 100)
                                        : 0

                                    return (
                                        <div
                                            key={vs._id}
                                            onClick={() => setSelectedSession(vs)}
                                            className={`p-3 rounded-xl border transition-all cursor-pointer
                        ${isHighlighted
                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md ring-2 ring-blue-400'
                                                    : 'border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-gray-200'
                                                }`}
                                        >
                                            {/* Header row */}
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/20
                                         flex items-center justify-center text-blue-500 flex-shrink-0">
                                                    <MdVideocam className="text-lg" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                                                        {vs.sessionId?.title || 'Video Call'}
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        {moment(vs.joinedAt).format('HH:mm DD/MM/YYYY')}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setShareSession(vs) }}
                                                        title="Chia sẻ lên cộng đồng"
                                                        className="p-1.5 rounded-lg transition-all bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-indigo-100 hover:text-indigo-500 dark:hover:bg-indigo-900/20"
                                                    >
                                                        <FaShareAlt className="text-xs" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setDeleteSession(vs) }}
                                                        title="Xóa buổi học"
                                                        className="p-1.5 rounded-lg transition-all bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/20"
                                                    >
                                                        <FaTrash className="text-xs" />
                                                    </button>
                                                    <FaCheckCircle className="text-green-500 text-base" />
                                                </div>
                                            </div>

                                            {/* Stats row */}
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400 pl-[44px]">
                                                <span className="flex items-center gap-1">
                                                    <FaClock className="text-[10px]" />
                                                    {formatDuration(vs.activeSeconds)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <FaFire className="text-[10px] text-orange-400" />
                                                    {vs.caloriesBurned} kcal
                                                </span>
                                                <span className="font-medium text-blue-500">
                                                    AI {aiPct}%
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteSession && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" onClick={() => !isDeleting && setDeleteSession(null)}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="text-center">
                            <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                                <FaTrash className="text-red-500 text-xl" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Xóa buổi học?</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                                <strong>{deleteSession.sessionId?.title || 'Video Call'}</strong>
                            </p>
                            <p className="text-xs text-gray-400 mb-6">
                                {moment(deleteSession.joinedAt).format('HH:mm DD/MM/YYYY')} • {formatDuration(deleteSession.activeSeconds)} • {deleteSession.caloriesBurned} kcal
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteSession(null)}
                                disabled={isDeleting}
                                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={async () => {
                                    setIsDeleting(true)
                                    try {
                                        await softDeleteVideoSession(eventId, deleteSession._id)
                                        queryClient.invalidateQueries({ queryKey: ['videoSessions', eventId] })
                                        queryClient.invalidateQueries({ queryKey: ['videoSessionStats', eventId] })
                                        queryClient.invalidateQueries({ queryKey: ['userProgress', eventId] })
                                        toast.success('Đã xóa buổi học')
                                        setDeleteSession(null)
                                    } catch (err) {
                                        toast.error(err?.response?.data?.message || 'Xóa thất bại')
                                    } finally {
                                        setIsDeleting(false)
                                    }
                                }}
                                disabled={isDeleting}
                                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                            >
                                {isDeleting ? 'Đang xóa...' : 'Xóa'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
