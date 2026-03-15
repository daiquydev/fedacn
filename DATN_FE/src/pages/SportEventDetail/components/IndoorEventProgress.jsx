import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import {
    FaFire, FaClock, FaTrophy, FaVideo, FaPlay,
    FaHistory, FaCheckCircle, FaDotCircle
} from 'react-icons/fa'
import { MdVideocam } from 'react-icons/md'
import moment from 'moment'
import toast from 'react-hot-toast'

import {
    getVideoSessions,
    getVideoSessionStats
} from '../../../apis/sportEventApi'
import VideoCallModal from '../../../components/SportEvent/VideoCallModal'
import VideoCallResult from '../../../components/SportEvent/VideoCallResult'
import { ActivityRings } from '../../../components/SportEvent/ProgressRing'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatSeconds(secs) {
    if (!secs || secs <= 0) return '0:00'
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = Math.floor(secs % 60)
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    return `${m}:${String(s).padStart(2, '0')}`
}

function formatCountdown(secs) {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = Math.floor(secs % 60)
    if (h > 0) return `${h}g ${String(m).padStart(2, '0')}p ${String(s).padStart(2, '0')}s`
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const TIME_FILTERS = [
    { key: '7d', label: '7 ngày' },
    { key: '1m', label: '1 tháng' },
    { key: '6m', label: '6 tháng' },
    { key: 'all', label: 'Tất cả' }
]

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
    const [activeMetric, setActiveMetric] = useState('minutes') // 'minutes' | 'calories'
    const [highlightDate, setHighlightDate] = useState(null)
    const [showVideoCall, setShowVideoCall] = useState(false)
    const [callResult, setCallResult] = useState(null)
    const [countdown, setCountdown] = useState(null)
    const countdownRef = useRef(null)

    // ── Fetch video sessions history
    const { data: vsData, refetch: refetchSessions } = useQuery({
        queryKey: ['videoSessions', eventId],
        queryFn: () => getVideoSessions(eventId),
        enabled: !!eventId && !!event?.isJoined
    })
    const videoSessions = useMemo(() => vsData?.data?.result || [], [vsData])
    // Lọc bỏ "abandoned sessions" (buổi bị force-end do reload/StrictMode, totalSeconds = 0)
    const endedSessions = useMemo(
        () => videoSessions.filter(s => s.status === 'ended' && (s.totalSeconds > 0 || s.activeSeconds > 0)),
        [videoSessions]
    )

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

    // ── Aggregate stats from video sessions
    const indoorStats = useMemo(() => {
        const totalActiveSeconds = endedSessions.reduce((s, v) => s + (v.activeSeconds || 0), 0)
        const totalCalories = endedSessions.reduce((s, v) => s + (v.caloriesBurned || 0), 0)

        // Weekly Streak calculation
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
            totalSessions: endedSessions.length,
            totalActiveSeconds,
            totalCalories,
            weeklyStreak: streak
        }
    }, [endedSessions])

    // Progress % from userProgress — with NaN/zero guards
    const progressStats = useMemo(() => {
        if (!event?.targetValue || event.targetValue <= 0) return null
        const maxParticipants = event?.maxParticipants > 0 ? event.maxParticipants : 1
        const perPersonTarget = event.targetValue / maxParticipants
        if (perPersonTarget <= 0) return null

        const unit = (event.targetUnit || '').toLowerCase()
        let actualTotal = 0
        if (unit.includes('kcal') || unit.includes('calo')) {
            actualTotal = indoorStats.totalCalories
        } else {
            actualTotal = Math.round(indoorStats.totalActiveSeconds / 60)
        }

        const rawPct = Math.round((actualTotal / perPersonTarget) * 100)
        const pct = isNaN(rawPct) ? 0 : Math.min(rawPct, 100)
        return { total: actualTotal, pct, perPersonTarget }
    }, [indoorStats, event])

    // ── Chart data
    const chartData = useMemo(() => {
        const field = activeMetric === 'calories' ? 'caloriesBurned' : 'activeSeconds'
        const divisor = activeMetric === 'minutes' ? 60 : 1 // convert seconds to minutes

        const getDays = () => {
            switch (timeFilter) {
                case '7d': return 7
                case '1m': return 30
                case '6m': return 180
                default: return 365
            }
        }

        const days = getDays()

        const arr = Array.from({ length: days }, (_, i) => {
            const d = moment().subtract(days - 1 - i, 'days')
            return { date: d.format('DD/MM'), fullDate: d.format('YYYY-MM-DD'), value: 0 }
        })

        endedSessions.forEach(vs => {
            const d = moment(vs.joinedAt).format('YYYY-MM-DD')
            const slot = arr.find(x => x.fullDate === d)
            if (slot) slot.value += Math.round((vs[field] || 0) / divisor)
        })

        // Thin out for large ranges
        if (arr.length > 30) {
            const step = Math.ceil(arr.length / 30)
            return arr.filter((_, i) => i % step === 0)
        }
        return arr
    }, [endedSessions, timeFilter, activeMetric])

    const handleCallEnded = useCallback((summary) => {
        setCallResult(summary)
        setShowVideoCall(false)
        refetchSessions()
        queryClient.invalidateQueries({ queryKey: ['userProgress', eventId] })
    }, [refetchSessions, queryClient, eventId])

    const { canJoin, isEnded, secondsBefore } = getWindowStatus()

    const metricUnit = activeMetric === 'calories' ? 'kcal' : 'phút'
    const barColor = activeMetric === 'calories' ? '#F97316' : '#3B82F6'

    return (
        <div className="space-y-8 animate-fadeIn">

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

                {/* Session stats quick row */}
                {indoorStats.totalSessions > 0 && (
                    <div className="relative mt-4 pt-4 border-t border-white/20 grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-2xl font-bold">{indoorStats.totalSessions}</p>
                            <p className="text-xs opacity-80">Buổi đã tham gia</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{formatSeconds(indoorStats.totalActiveSeconds)}</p>
                            <p className="text-xs opacity-80">Thời gian active</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{indoorStats.totalCalories}</p>
                            <p className="text-xs opacity-80">kcal</p>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Activity Rings Hero — Apple Fitness style ──────────────────── */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-6 py-4">
                    <h3 className="text-lg font-bold text-white">📊 Thống kê hoạt động</h3>
                    <p className="text-white/70 text-sm">Mục tiêu cá nhân: {progressStats?.perPersonTarget > 0 ? `${progressStats.perPersonTarget.toFixed(1)} ${event.targetUnit}` : 'Chưa thiết lập'}</p>
                </div>
                <div className="p-6">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        {/* Activity Rings */}
                        <div className="relative flex-shrink-0">
                            <ActivityRings
                                size={180}
                                strokeWidth={14}
                                gap={5}
                                rings={[
                                    {
                                        percent: progressStats?.pct || 0,
                                        color: '#6366f1',
                                        colorEnd: (progressStats?.pct || 0) >= 100 ? '#22c55e' : '#8b5cf6',
                                        label: event.targetUnit
                                    },
                                    {
                                        percent: indoorStats.totalActiveSeconds > 0 ? Math.min(Math.round(indoorStats.totalActiveSeconds / 60 / (progressStats?.perPersonTarget || 60) * 100), 100) : 0,
                                        color: '#3b82f6',
                                        colorEnd: '#06b6d4',
                                        label: 'phút'
                                    },
                                    {
                                        percent: indoorStats.totalCalories > 0 ? Math.min(indoorStats.totalCalories / 5, 100) : 0,
                                        color: '#f97316',
                                        colorEnd: '#eab308',
                                        label: 'kcal'
                                    }
                                ]}
                                centerContent={
                                    <div className="text-center">
                                        <p className="text-2xl font-black text-gray-800 dark:text-white">{progressStats?.pct || 0}%</p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">hoàn thành</p>
                                    </div>
                                }
                            />
                        </div>

                        {/* Ring Legend + Stats */}
                        <div className="flex-1 grid grid-cols-2 gap-3 w-full">
                            {/* Progress stat */}
                            <div className="p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" />
                                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Tiến độ</span>
                                </div>
                                <p className="text-xl font-black text-gray-800 dark:text-white">
                                    {progressStats ? progressStats.total : 0} <span className="text-sm font-medium text-gray-400">{event.targetUnit}</span>
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">{progressStats?.pct || 0}% hoàn thành</p>
                            </div>

                            {/* Time stat */}
                            <div
                                onClick={() => setActiveMetric('minutes')}
                                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                                    activeMetric === 'minutes'
                                        ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                                        : 'border-gray-100 dark:border-gray-700 hover:border-blue-200 bg-white dark:bg-gray-800'
                                }`}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" />
                                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Thời gian</span>
                                </div>
                                <p className="text-xl font-black text-gray-800 dark:text-white">
                                    {formatSeconds(indoorStats.totalActiveSeconds)}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">AI xác nhận có mặt</p>
                            </div>

                            {/* Calories stat */}
                            <div
                                onClick={() => setActiveMetric('calories')}
                                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                                    activeMetric === 'calories'
                                        ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20 shadow-md'
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
                            <div className="p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Buổi tham gia</span>
                                </div>
                                <p className="text-xl font-black text-gray-800 dark:text-white">
                                    {indoorStats.totalSessions} <span className="text-sm font-medium text-gray-400">buổi</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Chart + History ─────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Chart */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                                Lịch sử{' '}
                                <span className="text-sm font-normal text-gray-400">
                                    ({activeMetric === 'calories' ? 'kcal' : 'phút'})
                                </span>
                            </h3>
                            <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                {TIME_FILTERS.map(f => (
                                    <button
                                        key={f.key}
                                        onClick={() => setTimeFilter(f.key)}
                                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all
                      ${timeFilter === f.key
                                                ? 'bg-blue-500 text-white shadow-sm'
                                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                            }`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6B7280', fontSize: 11 }}
                                        dy={10}
                                        interval={chartData.length > 10 ? Math.floor(chartData.length / 7) : 0}
                                    />
                                    <YAxis hide />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-gray-800 text-white text-xs py-1 px-2 rounded">
                                                        {`${payload[0].value} ${metricUnit}`}
                                                    </div>
                                                )
                                            }
                                            return null
                                        }}
                                    />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]}
                                        onClick={d => {
                                            if (d?.fullDate) {
                                                setHighlightDate(d.fullDate)
                                                setTimeout(() => setHighlightDate(null), 3000)
                                            }
                                        }}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.fullDate === highlightDate
                                                    ? '#8B5CF6'
                                                    : entry.value > 0 ? barColor : '#F3F4F6'}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
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
                                            className={`p-3 rounded-xl border transition-all
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
                                                <span className="flex-shrink-0">
                                                    <FaCheckCircle className="text-green-500 text-base" />
                                                </span>
                                            </div>

                                            {/* Stats row */}
                                            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 pl-11">
                                                <span className="flex items-center gap-1">
                                                    <FaClock className="text-[10px]" />
                                                    {formatSeconds(vs.activeSeconds)} active
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
        </div>
    )
}
