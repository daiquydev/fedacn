import { roundKcal } from '../../../utils/mathUtils'
import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FaTimes, FaRunning, FaDumbbell, FaCamera, FaLocationArrow, FaCheck,
  FaClock, FaFire, FaBolt, FaChartLine, FaRoad, FaLock, FaHourglassHalf,
  FaShareAlt, FaWalking, FaBicycle, FaChevronRight, FaMapMarkerAlt, FaRedo, FaTrash
} from 'react-icons/fa'
import { format, isBefore, isAfter, startOfDay } from 'date-fns'
import { vi } from 'date-fns/locale'
import ActivityDetailModal from '../../../components/SportEvent/ActivityDetailModal'
import ActivityShareModal from '../../../components/SportEvent/ActivityShareModal'
import ChallengeProgressShareModal from './ChallengeProgressShareModal'
import ActivityEntryDetailView from './ActivityEntryDetailView'
import NutritionDetailView from './NutritionDetailView'
import FitnessDetailView from './FitnessDetailView'
import toast from 'react-hot-toast'
import { deleteChallengeProgress } from '../../../apis/challengeApi'

/**
 * Returns display name for an activity entry based on challenge type.
 */
function getEntryDisplayName(challengeType, challenge, entry) {
  if (challengeType === 'outdoor_activity') return challenge?.category || 'Ngoài trời'
  if (challengeType === 'nutrition') return entry?.food_name || 'Ăn uống'
  if (challengeType === 'fitness') return 'Thể dục'
  return challenge?.category || 'Hoạt động'
}

const TYPE_CONFIG = {
  outdoor_activity: {
    gradient: 'from-blue-500 to-cyan-500',
    gradientCSS: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
    emoji: '🏃',
    label: 'Ngoài trời',
    icon: FaRunning,
    ringColor: '#3b82f6',
    ringTrack: '#e0e7ff',
    barGradient: 'linear-gradient(90deg, #3b82f6, #06b6d4)'
  },
  fitness: {
    gradient: 'from-purple-500 to-pink-500',
    gradientCSS: 'linear-gradient(135deg, #a855f7, #ec4899)',
    emoji: '💪',
    label: 'Thể dục',
    icon: FaDumbbell,
    ringColor: '#a855f7',
    ringTrack: '#f3e8ff',
    barGradient: 'linear-gradient(90deg, #a855f7, #ec4899)'
  },
  nutrition: {
    gradient: 'from-emerald-500 to-teal-500',
    gradientCSS: 'linear-gradient(135deg, #10b981, #14b8a6)',
    emoji: '🥗',
    label: 'Ăn uống',
    icon: FaCamera,
    ringColor: '#10b981',
    ringTrack: '#d1fae5',
    barGradient: 'linear-gradient(90deg, #10b981, #14b8a6)'
  }
}

const ACTIVITY_ICONS = {
  'Chạy bộ': FaRunning,
  'Đi bộ': FaWalking,
  'Đạp xe': FaBicycle,
  running: FaRunning,
  walking: FaWalking,
  cycling: FaBicycle
}

function fmtDuration(seconds) {
  if (!seconds) return '0:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

function fmtPace(seconds, distKm) {
  if (!distKm || distKm <= 0 || !seconds) return null
  const paceS = seconds / distKm
  const pm = Math.floor(paceS / 60)
  const ps = Math.floor(paceS % 60)
  return `${pm}'${String(ps).padStart(2, '0')}"/km`
}

/**
 * SVG Circular Progress Ring
 */
function ProgressRing({ percent, size = 140, stroke = 10, color, track, children }) {
  const radius = (size - stroke) / 2
  const circ = 2 * Math.PI * radius
  const offset = circ - (Math.min(percent, 100) / 100) * circ

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  )
}

/**
 * DayChallengeModal v2
 * Circular progress ring + stat pills + horizontal bar chart per activity
 */
export default function DayChallengeModal({
  challenge,
  dateStr,
  dayEntries = [],
  dayTotal = 0,
  onClose,
  onStartTracking,
  onRefresh
}) {
  const navigate = useNavigate()
  const type = challenge?.challenge_type || 'fitness'
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.fitness
  const goalValue = challenge?.goal_value || 1
  const goalUnit = challenge?.goal_unit || 'km'
  const isCompleted = dayTotal >= goalValue
  const progressPercent = Math.min(Math.round((dayTotal / goalValue) * 100), 100)

  const [selectedActivityId, setSelectedActivityId] = useState(null)
  const [shareActivity, setShareActivity] = useState(null)
  const [selectedEntryDetail, setSelectedEntryDetail] = useState(null)
  const [deleteEntry, setDeleteEntry] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const today = startOfDay(new Date())
  const selectedDate = startOfDay(new Date(dateStr + 'T00:00:00'))
  const isPast = isBefore(selectedDate, today)
  const isFuture = isAfter(selectedDate, today)
  const isToday = !isPast && !isFuture

  // Time-window check for nutrition challenges
  const isTimeWindowChallenge = type === 'nutrition' && challenge?.nutrition_sub_type === 'time_window'
      && challenge?.time_window_start && challenge?.time_window_end
  const isInsideTimeWindow = (() => {
      if (!isTimeWindowChallenge) return true
      const now = new Date()
      const currentMinutes = now.getHours() * 60 + now.getMinutes()
      const [sh, sm] = challenge.time_window_start.split(':').map(Number)
      const [eh, em] = challenge.time_window_end.split(':').map(Number)
      return currentMinutes >= sh * 60 + sm && currentMinutes <= eh * 60 + em
  })()

  const dateFormatted = useMemo(() => {
    try {
      return format(selectedDate, "EEEE, dd/MM/yyyy", { locale: vi })
    } catch {
      return dateStr
    }
  }, [dateStr, selectedDate])

  // Aggregate stats for the day
  const dayStats = useMemo(() => {
    let totalDuration = 0, totalCalories = 0, totalDistance = 0
    dayEntries.forEach(e => {
      const isValid = e.validation_status !== 'invalid_time' && e.ai_review_valid !== false;
      if (isValid) {
        totalDuration += (e.duration_minutes || 0) * 60
        totalCalories += (e.calories || 0)
        totalDistance += (e.distance || 0)
      }
    })
    const avgSpeed = totalDuration > 0 && totalDistance > 0
      ? (totalDistance / (totalDuration / 3600)).toFixed(1)
      : null
    return { totalDuration, totalCalories, totalDistance, avgSpeed }
  }, [dayEntries])

  // Track distinct completed exercises for fitness challenges
  const fitnessCompletedExerciseIds = useMemo(() => {
    if (type !== 'fitness') return new Set()
    const ids = new Set()
    dayEntries.forEach(e => {
       const isValid = e.validation_status !== 'invalid_time' && e.ai_review_valid !== false;
       if (isValid && Array.isArray(e.completed_exercises)) {
         e.completed_exercises.forEach(ce => {
           if (ce.completed) {
               const idStr = typeof ce.exercise_id === 'string' ? ce.exercise_id : (ce.exercise_id?._id || ce.exercise_id?.toString())
               if (idStr) ids.add(idStr.toString())
           }
         })
       }
    })
    return ids
  }, [dayEntries, type])

  const handleStartRecording = () => {
    onClose()
    navigate(`/challenge/${challenge._id}/tracking`)
  }

  const handleShare = (e, entry) => {
    e.stopPropagation()
    if (type === 'outdoor_activity') {
      // Outdoor: modal chia sẻ hoạt động có lộ trình
      const distKm = entry.distance ? Number(entry.distance) : 0
      const durationSec = entry.duration_minutes ? entry.duration_minutes * 60 : 0
      setShareActivity({
        _id: entry.activity_id || entry._id,
        hasGpsRoute: !!entry.activity_id,
        activityType: challenge?.category || 'Chạy bộ',
        totalDistance: distKm * 1000,
        totalDuration: durationSec,
        avgSpeed: entry.avg_speed ? entry.avg_speed / 3.6 : 0,
        calories: entry.calories || 0,
        startTime: entry.createdAt || entry.date,
        status: 'completed'
      })
    } else {
      // Fitness / Nutrition: use ChallengeProgressShareModal
      setShareActivity(entry)
    }
  }

  const CategoryIcon = ACTIVITY_ICONS[challenge?.category] || config.icon

  // Modal con (chi tiết hoạt động, chia sẻ, xóa…) đã có overlay riêng — giữ nền cha sẽ chồng 2 lớp mờ → gần như đen.
  const childStackModalOpen = Boolean(
    selectedActivityId || selectedEntryDetail || shareActivity || deleteEntry
  )

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
        childStackModalOpen ? 'bg-transparent' : 'bg-black/60 backdrop-blur-sm'
      }`}
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden"
        style={{ maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className={`bg-gradient-to-r ${config.gradient} px-5 py-4 relative`}>
          <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition">
            <FaTimes size={14} />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <CategoryIcon className="text-white text-lg" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base leading-tight">{challenge?.title || 'Thử thách'}</h3>
              <p className="text-white/70 text-xs mt-0.5 capitalize">{dateFormatted}</p>
            </div>
            {/* Time-window badge */}
            {isTimeWindowChallenge && (
              <div className="ml-auto flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full text-white text-[10px] font-semibold">
                <FaClock className="text-[9px]" />
                ⏰ {challenge.time_window_start} – {challenge.time_window_end}
              </div>
            )}
          </div>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {/* ── Future Day ── */}
          {isFuture && (
            <div className="flex flex-col items-center py-10 px-6 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
                <FaHourglassHalf className="text-2xl text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">Ngày chưa diễn ra</p>
              <p className="text-xs text-gray-400 mt-1">Hãy quay lại vào đúng ngày để thực hiện</p>
              <button onClick={onClose} className="mt-6 px-8 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                Đóng
              </button>
            </div>
          )}

          {/* ── Past Day (no data) ── */}
          {isPast && dayEntries.length === 0 && (
            <div className="flex flex-col items-center py-10 px-6 text-center">
              <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-3">
                <FaLock className="text-2xl text-red-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">Không có hoạt động</p>
              <p className="text-xs text-gray-400 mt-1">Ngày này đã qua, không có dữ liệu nào</p>
              <button onClick={onClose} className="mt-6 px-8 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                Đóng
              </button>
            </div>
          )}

          {/* ── Main Content (today or past with data) ── */}
          {(!isFuture && (isToday || dayEntries.length > 0)) && (
            <div className="p-5 space-y-5">
              {/* ── Circular Progress Ring + Stats ── */}
              <div className="flex flex-col items-center">
                <ProgressRing
                  percent={progressPercent}
                  size={130}
                  stroke={10}
                  color={isCompleted ? '#22c55e' : config.ringColor}
                  track={isCompleted ? '#dcfce7' : config.ringTrack}
                >
                  {isCompleted ? (
                    <>
                      <FaCheck className="text-green-500 text-xl mb-0.5" />
                      <span className="text-[11px] font-bold text-green-600">Hoàn thành!</span>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl font-black text-gray-800 dark:text-white leading-none">
                        {dayTotal % 1 === 0 ? dayTotal : dayTotal.toFixed(1)}
                      </span>
                      <span className="text-xs text-gray-400 mt-0.5">/ {goalValue} {goalUnit}</span>
                    </>
                  )}
                </ProgressRing>

                <p className="text-xs text-gray-400 mt-2">
                  {isCompleted
                    ? `🎉 Đã vượt mục tiêu ${dayTotal.toFixed(1)} ${goalUnit}`
                    : `Còn ${Math.max(0, goalValue - dayTotal).toFixed(1)} ${goalUnit} nữa`}
                </p>

                {/* ── Summary Stat Pills ── */}
                {dayEntries.length > 0 && (
                  <div className="flex items-center gap-2 mt-3">
                    {dayStats.totalDuration > 0 && (
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[11px] font-medium">
                        <FaClock className="text-[9px]" />
                        {fmtDuration(dayStats.totalDuration)}
                      </div>
                    )}
                    {dayStats.totalCalories > 0 && (
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-[11px] font-medium">
                        <FaFire className="text-[9px]" />
                        {roundKcal(dayStats.totalCalories)} kcal
                      </div>
                    )}
                    {dayStats.avgSpeed && (
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-[11px] font-medium">
                        <FaBolt className="text-[9px]" />
                        {dayStats.avgSpeed} km/h
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── Fitness Exercise Checklist ── */}
              {type === 'fitness' && challenge?.exercises && challenge.exercises.length > 0 && (
                <div className="bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/50 rounded-2xl p-4 mt-2">
                  <h5 className="text-xs font-bold text-purple-800 dark:text-purple-300 uppercase tracking-wider mb-3">
                    Bài tập yêu cầu ({challenge.exercises.length})
                  </h5>
                  <div className="space-y-2">
                    {challenge.exercises.map(ex => {
                        const exIdStr = typeof ex.exercise_id === 'string' ? ex.exercise_id : (ex.exercise_id?._id || ex.exercise_id?.toString())
                        const isDone = fitnessCompletedExerciseIds.has(exIdStr?.toString())
                        return (
                          <div key={exIdStr} className="flex items-center gap-3 bg-white dark:bg-gray-800 p-2.5 rounded-xl border border-gray-100 dark:border-gray-700">
                             <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isDone ? 'bg-green-100 dark:bg-green-900/40 text-green-500' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
                                 {isDone ? <FaCheck size={10} /> : <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-500"></span>}
                             </div>
                             <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${isDone ? 'text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'}`}>{ex.exercise_name}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">{ex.sets?.length || 1} hiệp tập</p>
                             </div>
                          </div>
                        )
                    })}
                  </div>
                </div>
              )}

              {/* ── Horizontal Bar Chart — Activity Entries ── */}
              {dayEntries.length > 0 && (
                <div>
                  <h5 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                    Các lần hoạt động ({dayEntries.length})
                  </h5>
                  <div className="space-y-2.5">
                    {dayEntries.map((entry, idx) => {
                      // Primary: entry.value (backend progress value)
                      // Fallback: entry.distance (từ bản ghi có lộ trình)
                      const progressValue = entry.value || entry.distance || 0
                      const distKm = entry.distance ? Number(entry.distance) : 0
                      const durationSec = (entry.duration_minutes || 0) * 60
                      const speedKmh = entry.avg_speed ? Number(entry.avg_speed).toFixed(1) : null
                      const pace = fmtPace(durationSec, distKm)
                      const barPercent = goalValue > 0 ? Math.min((progressValue / goalValue) * 100, 100) : 0
                      const hasActivityLink = !!entry.activity_id
                      const EntryIcon = ACTIVITY_ICONS[challenge?.category] || config.icon
                      const timeStr = entry.createdAt
                        ? format(new Date(entry.createdAt), 'HH:mm')
                        : ''
                      const displayValue = progressValue % 1 === 0 ? progressValue : Number(progressValue).toFixed(2)
                      const isLate = entry.validation_status === 'invalid_time'
                      const isInvalidAI = entry.ai_review_valid === false
                      const isInvalid = isLate || isInvalidAI

                      return (
                        <div
                          key={entry._id || idx}
                          onClick={() => {
                            if (hasActivityLink) setSelectedActivityId(entry.activity_id)
                            else setSelectedEntryDetail(entry)
                          }}
                          className={`rounded-xl border transition-all overflow-hidden cursor-pointer border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-orange-200 dark:hover:border-orange-800 ${isInvalid ? 'opacity-60 grayscale' : ''}`}
                        >
                          {/* Entry header */}
                          <div className="p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm"
                                  style={{ background: isInvalid ? '#9ca3af' : config.gradientCSS }}>
                                  <EntryIcon />
                                </div>
                                <div>
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="text-sm font-bold text-gray-800 dark:text-white">
                                      {getEntryDisplayName(type, challenge, entry)}
                                    </span>
                                    <span className="text-sm font-black" style={{ color: isInvalid ? '#9ca3af' : config.ringColor }}>
                                      {displayValue} {goalUnit}
                                    </span>
                                    {isInvalid && (
                                      <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-md whitespace-nowrap">
                                        {isLate ? 'Trễ giờ' : 'Không hợp lệ'}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-gray-400">{timeStr}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {!isInvalid && (
                                  <button
                                    onClick={(e) => handleShare(e, entry)}
                                    className="p-1 rounded-md text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition"
                                    title="Chia sẻ"
                                  >
                                    <FaShareAlt className="text-[10px]" />
                                  </button>
                                )}
                                <button
                                  onClick={(e) => { e.stopPropagation(); setDeleteEntry(entry) }}
                                  className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                                  title="Xóa hoạt động"
                                >
                                  <FaTrash className="text-[10px]" />
                                </button>
                                <FaChevronRight className="text-[10px] text-gray-300" />
                              </div>
                            </div>

                            {/* Metrics pills — always visible */}
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-[10px] font-medium text-blue-600 dark:text-blue-400">
                                <FaClock className="text-[8px]" />
                                {durationSec > 0 ? fmtDuration(durationSec) : '0:00'}
                              </span>
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-900/20 text-[10px] font-medium text-orange-600 dark:text-orange-400">
                                <FaFire className="text-[8px]" />
                                {entry.calories ? roundKcal(entry.calories) : 0} kcal
                              </span>
                              {type === 'outdoor_activity' && (
                                <>
                                  {pace && (
                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/20 text-[10px] font-medium text-green-600 dark:text-green-400">
                                      <FaChartLine className="text-[8px]" />
                                      {pace}
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/20 text-[10px] font-medium text-purple-600 dark:text-purple-400">
                                    <FaBolt className="text-[8px]" />
                                    {speedKmh || '0.0'} km/h
                                  </span>
                                </>
                              )}
                              {hasActivityLink && (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-[10px] font-medium text-indigo-600 dark:text-indigo-400">
                                  <FaMapMarkerAlt className="text-[8px]" />
                                  Có lộ trình
                                </span>
                              )}
                            </div>

                            {/* Mini progress bar */}
                            <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mt-2">
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{
                                  width: `${Math.max(barPercent, 2)}%`,
                                  background: isCompleted && idx === 0
                                    ? 'linear-gradient(90deg, #22c55e, #10b981)'
                                    : config.barGradient
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ── Action Button ── */}
              {isToday && !isCompleted && (
                <div>
                  {type === 'outdoor_activity' ? (
                    <button
                      onClick={handleStartRecording}
                      className={`w-full py-3.5 rounded-xl bg-gradient-to-r ${config.gradient} text-white font-bold text-sm hover:shadow-lg transition flex items-center justify-center gap-2.5`}
                    >
                      <FaLocationArrow /> Bắt đầu ghi
                    </button>
                  ) : (
                    <div>
                      {isTimeWindowChallenge && !isInsideTimeWindow && (
                        <div className="mb-2 p-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700 flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 text-left">
                          <FaClock className="shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold">Đã ngoài khung giờ ({challenge.time_window_start} – {challenge.time_window_end})</p>
                            <p className="mt-0.5 opacity-90">Hệ thống vẫn cho phép ghi nhận hoạt động nhưng tiến độ sẽ không được cộng dồn.</p>
                          </div>
                        </div>
                      )}
                      <button
                        onClick={onStartTracking}
                        className={`w-full py-3.5 rounded-xl bg-gradient-to-r ${config.gradient} text-white font-bold text-sm hover:shadow-lg transition flex items-center justify-center gap-2.5`}
                      >
                        <config.icon /> Bắt đầu thực hiện
                      </button>
                    </div>
                  )}
                </div>
              )}

              {isToday && isCompleted && type === 'outdoor_activity' && (
                <button
                  onClick={handleStartRecording}
                  className="w-full py-3 rounded-xl bg-blue-500 text-white font-bold text-sm hover:bg-blue-600 transition flex items-center justify-center gap-2"
                >
                  <FaLocationArrow /> Tiếp tục hoạt động
                </button>
              )}

              {isToday && isCompleted && type !== 'outdoor_activity' && (
                <button
                  onClick={onStartTracking}
                  className={`w-full py-3 rounded-xl bg-gradient-to-r ${config.gradient} text-white font-bold text-sm hover:shadow-lg transition flex items-center justify-center gap-2 opacity-90`}
                >
                  <FaRedo className="text-xs" /> Thực hiện thêm
                </button>
              )}

              {(isPast || isCompleted) && (
                <button
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Đóng
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Activity Detail Modal (Map) ── */}
        {selectedActivityId && (
          <ActivityDetailModal
            activityId={selectedActivityId}
            challengeId={challenge?._id}
            event={{ category: challenge?.category || 'Chạy bộ' }}
            onClose={() => setSelectedActivityId(null)}
            onShare={(activity) => {
              setSelectedActivityId(null)
              setShareActivity(activity)
            }}
          />
        )}

        {/* ── Activity Share Modal ── */}
        {shareActivity && type === 'outdoor_activity' && (
          <ActivityShareModal
            activity={shareActivity}
            event={{ category: challenge?.category || 'Chạy bộ', name: challenge?.title }}
            challengeId={challenge?._id}
            challengeVisibility={challenge?.visibility}
            onClose={() => setShareActivity(null)}
          />
        )}

        {/* ── Challenge Progress Share Modal (fitness / nutrition) ── */}
        {shareActivity && type !== 'outdoor_activity' && (
          <ChallengeProgressShareModal
            entry={shareActivity}
            challenge={challenge}
            onClose={() => setShareActivity(null)}
          />
        )}

        {/* ── Entry Detail View (type-specific) ── */}
        {selectedEntryDetail && (
          type === 'outdoor_activity'
            ? <ActivityEntryDetailView entry={selectedEntryDetail} challenge={challenge} onClose={() => setSelectedEntryDetail(null)} />
            : type === 'nutrition'
              ? <NutritionDetailView entry={selectedEntryDetail} challenge={challenge} dayTotal={dayTotal} onClose={() => setSelectedEntryDetail(null)} />
              : <FitnessDetailView entry={selectedEntryDetail} challenge={challenge} dayTotal={dayTotal} onClose={() => setSelectedEntryDetail(null)} />
        )}

        {/* Delete Confirmation Modal */}
        {deleteEntry && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" onClick={() => !isDeleting && setDeleteEntry(null)}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                  <FaTrash className="text-red-500 text-xl" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Xóa hoạt động?</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  <strong>{deleteEntry.value || deleteEntry.distance || 0} {goalUnit}</strong>
                </p>
                <p className="text-xs text-gray-400 mb-6">
                  {deleteEntry.createdAt ? format(new Date(deleteEntry.createdAt), 'HH:mm dd/MM/yyyy') : ''}
                  {deleteEntry.calories ? ` • ${roundKcal(deleteEntry.calories)} kcal` : ''}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteEntry(null)}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={async () => {
                    setIsDeleting(true)
                    try {
                      await deleteChallengeProgress(challenge._id, deleteEntry._id)
                      toast.success('Đã xóa hoạt động')
                      setDeleteEntry(null)
                      if (onRefresh) onRefresh()
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
    </div>
  )
}
