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
        return {
            totalSessions: endedSessions.length,
            totalActiveSeconds,
            totalCalories
        }
    }, [endedSessions])

    // Progress % from userProgress
    // Với sự kiện trong nhà: dùng nguồn dữ liệu thực từ video sessions thay vì userProgress
    const progressStats = useMemo(() => {
        if (!event?.targetValue) return null
        const maxParticipants = event?.maxParticipants > 0 ? event.maxParticipants : 1
        const perPersonTarget = event.targetValue / maxParticipants

        // Xác định giá trị tiến độ thực tế theo targetUnit
        const unit = (event.targetUnit || '').toLowerCase()
        let actualTotal = 0
        if (unit.includes('kcal') || unit.includes('calo')) {
            // Đo bằng calo: lấy từ video sessions
            actualTotal = indoorStats.totalCalories
        } else {
            // Đo bằng phút/thời gian: quy đổi activeSeconds -> phút
            actualTotal = Math.round(indoorStats.totalActiveSeconds / 60)
        }

        const pct = Math.min(Math.round((actualTotal / perPersonTarget) * 100), 100)
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

            {/* ── Stat Cards ─────────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={<FaTrophy className="text-yellow-500" />}
                    label="Tiến độ của bạn"
                    value={progressStats
                        ? `${progressStats.total} / ${progressStats.perPersonTarget.toFixed(1)} ${event.targetUnit}`
                        : `0 / ${(event.targetValue / (event?.maxParticipants > 0 ? event.maxParticipants : 1)).toFixed(1)} ${event.targetUnit}`}
                    subValue={progressStats ? `${progressStats.pct}% phần đóng góp của bạn` : '0% phần đóng góp của bạn'}
                    colorClass="bg-yellow-100 text-yellow-600"
                    isActive={false}
                    onClick={() => { }}
                />
                <StatCard
                    icon={<FaClock className="text-blue-500" />}
                    label="Thời gian tham gia"
                    value={formatSeconds(indoorStats.totalActiveSeconds)}
                    subValue="Thời gian AI xác nhận có mặt"
                    colorClass="bg-blue-100 text-blue-600"
                    isActive={activeMetric === 'minutes'}
                    onClick={() => setActiveMetric('minutes')}
                />
                <StatCard
                    icon={<FaFire className="text-orange-500" />}
                    label="kcal tiêu thụ"
                    value={`${indoorStats.totalCalories} kcal`}
                    colorClass="bg-orange-100 text-orange-600"
                    isActive={activeMetric === 'calories'}
                    onClick={() => setActiveMetric('calories')}
                />
                <StatCard
                    icon={<MdVideocam className="text-purple-500" />}
                    label="Số buổi tham gia"
                    value={`${indoorStats.totalSessions} buổi`}
                    colorClass="bg-purple-100 text-purple-600"
                    isActive={false}
                    onClick={() => { }}
                />
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
