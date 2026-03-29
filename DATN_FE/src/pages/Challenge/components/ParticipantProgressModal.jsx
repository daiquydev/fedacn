import React, { useMemo, useState } from 'react'
import {
  FaTimes, FaCalendarCheck, FaChevronRight,
  FaChevronLeft
} from 'react-icons/fa'
import { useQuery } from '@tanstack/react-query'
import { getUserChallengeProgress } from '../../../apis/challengeApi'
import useravatar from '../../../assets/images/useravatar.jpg'
import { getImageUrl } from '../../../utils/imageUrl'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addWeeks, addMonths, subWeeks, subMonths,
  isSameDay, isWithinInterval, isBefore, isAfter,
  startOfDay, eachMonthOfInterval, parseISO,
  startOfYear, endOfYear, eachMonthOfInterval as eachMonth,
  getYear, addYears, subYears
} from 'date-fns'
import { vi } from 'date-fns/locale'
import ActivityEntryDetailView from './ActivityEntryDetailView'
import NutritionDetailView from './NutritionDetailView'
import FitnessDetailView from './FitnessDetailView'

// ── Constants ─────────────────────────────────────────────────────────────────

const GRADIENT_MAP = {
  nutrition: 'from-emerald-500 to-teal-600',
  outdoor_activity: 'from-blue-500 to-cyan-600',
  fitness: 'from-purple-500 to-pink-600'
}

const DOW_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

// ── Day Status ────────────────────────────────────────────────────────────────

function getDayMeta(dateStr, challengeStart, challengeEnd, progressByDate, goalValue) {
  const date = startOfDay(parseISO(dateStr))
  const todayDate = startOfDay(new Date())

  const inRange = challengeStart && challengeEnd
    ? isWithinInterval(date, { start: challengeStart, end: challengeEnd })
    : false

  const isToday = isSameDay(date, todayDate)
  const isPast = isBefore(date, todayDate)
  const isFuture = isAfter(date, todayDate)

  const entries = progressByDate[dateStr] || []
  const total = entries.reduce((s, e) => s + (e.value || 0), 0)
  const hasDone = inRange && total >= goalValue
  const hasPartial = inRange && total > 0 && !hasDone

  let status = 'out'
  if (inRange) {
    if (isFuture) status = 'future'
    else if (isToday) status = hasDone ? 'today_done' : hasPartial ? 'today_partial' : 'today_empty'
    else if (hasDone) status = 'done'
    else if (hasPartial) status = 'partial'
    else status = 'missed'
  }

  return { status, total, entries, inRange, isToday, isPast, isFuture }
}

const CELL_STYLE = {
  out:           'bg-transparent text-transparent cursor-default pointer-events-none',
  future:        'bg-gray-100 dark:bg-gray-700 text-gray-300 dark:text-gray-600 cursor-default',
  today_done:    'bg-green-500 text-white ring-2 ring-green-300 dark:ring-green-600 cursor-pointer shadow-md',
  today_partial: 'bg-yellow-400 text-white ring-2 ring-yellow-200 cursor-pointer shadow-md',
  today_empty:   'bg-blue-100 dark:bg-blue-900/40 text-blue-500 ring-2 ring-blue-300 cursor-pointer',
  done:          'bg-emerald-500 text-white cursor-pointer hover:bg-emerald-600',
  partial:       'bg-yellow-300 dark:bg-yellow-600 text-yellow-900 dark:text-white cursor-pointer hover:bg-yellow-400',
  missed:        'bg-red-100 dark:bg-red-900/20 text-red-400 cursor-pointer hover:bg-red-200'
}

const CELL_ICON = {
  today_done: '✓', done: '✓',
  today_partial: '~', partial: '~',
  out: null, future: null, today_empty: null, missed: null
}

const STATUS_LABEL = {
  today_done: 'Hôm nay · Hoàn thành',
  today_partial: 'Hôm nay · Đang thực hiện',
  today_empty: 'Hôm nay · Chưa bắt đầu',
  done: 'Hoàn thành mục tiêu',
  partial: 'Chưa đạt mục tiêu',
  missed: 'Không có hoạt động',
  future: 'Chưa diễn ra',
  out: ''
}

// ── DayCell ───────────────────────────────────────────────────────────────────

function DayCell({ dateStr, meta, label, isSelected, onClick, size = 'sm' }) {
  const { status } = meta
  const icon = CELL_ICON[status]
  const isClickable = !['out', 'future'].includes(status)
  const dayNum = label ?? format(parseISO(dateStr), 'd')

  return (
    <div
      title={status !== 'out' ? `${dateStr} — ${STATUS_LABEL[status]}` : ''}
      onClick={() => isClickable && onClick?.(dateStr)}
      className={`
        relative aspect-square rounded-md flex items-center justify-center font-bold transition-all duration-150 select-none
        ${size === 'lg' ? 'text-sm' : 'text-[9px]'}
        ${CELL_STYLE[status]}
        ${isSelected ? 'ring-2 ring-orange-500 scale-110 shadow-lg z-10' : ''}
        ${isClickable ? 'hover:scale-105' : ''}
      `}
    >
      {status !== 'out' && (icon !== null ? icon : dayNum)}
    </div>
  )
}

// ── WEEK VIEW ─────────────────────────────────────────────────────────────────

function WeekView({ refDate, challengeStart, challengeEnd, progressByDate, goalValue, selectedDay, onDayClick }) {
  const weekStart = startOfWeek(refDate, { weekStartsOn: 1 })

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DOW_LABELS.map(d => (
          <div key={d} className="text-center text-[9px] font-semibold text-gray-400">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 7 }).map((_, i) => {
          const day = addDays(weekStart, i)
          const dateStr = format(day, 'yyyy-MM-dd')
          const meta = getDayMeta(dateStr, challengeStart, challengeEnd, progressByDate, goalValue)
          return (
            <DayCell
              key={dateStr}
              dateStr={dateStr}
              meta={meta}
              isSelected={selectedDay === dateStr}
              onClick={onDayClick}
              size="lg"
            />
          )
        })}
      </div>
      {/* Full date labels below */}
      <div className="grid grid-cols-7 gap-1 mt-1">
        {Array.from({ length: 7 }).map((_, i) => {
          const day = addDays(weekStart, i)
          return (
            <div key={i} className="text-center text-[8px] text-gray-400">
              {format(day, 'dd/MM')}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── MONTH VIEW ────────────────────────────────────────────────────────────────

function MonthView({ refDate, challengeStart, challengeEnd, progressByDate, goalValue, selectedDay, onDayClick }) {
  const monthStart = startOfMonth(refDate)
  const monthEnd = endOfMonth(refDate)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const cells = []
  let d = gridStart
  while (d <= gridEnd) {
    const dateStr = format(d, 'yyyy-MM-dd')
    const inMonth = d >= monthStart && d <= monthEnd
    const meta = inMonth
      ? getDayMeta(dateStr, challengeStart, challengeEnd, progressByDate, goalValue)
      : { status: 'out', total: 0, entries: [] }
    cells.push(
      <DayCell
        key={dateStr}
        dateStr={dateStr}
        meta={meta}
        isSelected={selectedDay === dateStr}
        onClick={onDayClick}
      />
    )
    d = addDays(d, 1)
  }

  return (
    <div>
      <div className="grid grid-cols-7 gap-0.5 mb-0.5">
        {DOW_LABELS.map(d => (
          <div key={d} className="text-center text-[8px] font-semibold text-gray-400 py-0.5">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">{cells}</div>
    </div>
  )
}

// ── YEAR VIEW ─────────────────────────────────────────────────────────────────

function YearView({ refDate, challengeStart, challengeEnd, progressByDate, goalValue, selectedDay, onDayClick }) {
  const year = getYear(refDate)
  const yearStart = startOfYear(new Date(year, 0, 1))
  const yearEnd = endOfYear(new Date(year, 11, 31))

  // Clamp to challenge range
  const displayStart = challengeStart && isBefore(challengeStart, yearEnd) && isAfter(challengeStart, yearStart)
    ? challengeStart : yearStart
  const displayEnd = challengeEnd && isBefore(challengeEnd, yearEnd) ? challengeEnd : yearEnd

  const months = eachMonthOfInterval({ start: yearStart, end: yearEnd })

  return (
    <div className="grid grid-cols-3 gap-3">
      {months.map(monthDate => {
        const mStart = startOfMonth(monthDate)
        const mEnd = endOfMonth(monthDate)
        const gStart = startOfWeek(mStart, { weekStartsOn: 1 })
        const gEnd = endOfWeek(mEnd, { weekStartsOn: 1 })

        const cells = []
        let d = gStart
        while (d <= gEnd) {
          const dateStr = format(d, 'yyyy-MM-dd')
          const inMonth = d >= mStart && d <= mEnd
          const meta = inMonth
            ? getDayMeta(dateStr, challengeStart, challengeEnd, progressByDate, goalValue)
            : { status: 'out', total: 0, entries: [] }
          cells.push(
            <DayCell
              key={dateStr}
              dateStr={dateStr}
              meta={meta}
              isSelected={selectedDay === dateStr}
              onClick={onDayClick}
            />
          )
          d = addDays(d, 1)
        }

        return (
          <div key={format(monthDate, 'yyyy-MM')}>
            <p className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 text-center tracking-wide">
              {format(monthDate, 'MMM', { locale: vi })}
            </p>
            <div className="grid grid-cols-7 gap-px">{cells}</div>
          </div>
        )
      })}
    </div>
  )
}

// ── Legend ────────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 border-t border-gray-200 dark:border-gray-600">
      {[
        { color: 'bg-emerald-500', label: 'Hoàn thành' },
        { color: 'bg-yellow-300 dark:bg-yellow-600', label: 'Một phần' },
        { color: 'bg-red-100 dark:bg-red-900/30', label: 'Bỏ lỡ' },
        { color: 'bg-blue-100 dark:bg-blue-800', label: 'Hôm nay' },
        { color: 'bg-gray-100 dark:bg-gray-600', label: 'Tương lai' }
      ].map(({ color, label }) => (
        <span key={label} className="flex items-center gap-1 text-[9px] font-medium text-gray-500">
          <span className={`w-3 h-3 rounded-sm ${color} inline-block flex-shrink-0`} />
          {label}
        </span>
      ))}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function ParticipantProgressModal({ participant, challenge, onClose }) {
  const challengeType = challenge?.challenge_type || 'fitness'
  const gradient = GRADIENT_MAP[challengeType] || GRADIENT_MAP.fitness
  const user = participant?.user || {}
  const userId = user._id
  const goalValue = challenge?.goal_value || 1

  // Calendar navigation state
  const [calView, setCalView] = useState('month') // 'week' | 'month' | 'year'
  const [refDate, setRefDate] = useState(() => {
    const now = new Date()
    if (challenge?.start_date && challenge?.end_date) {
      const s = new Date(challenge.start_date)
      const e = new Date(challenge.end_date)
      if (now >= s && now <= e) return now
      if (now < s) return s
      return e
    }
    return now
  })
  const [selectedDay, setSelectedDay] = useState(null)
  const [selectedEntry, setSelectedEntry] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['user-challenge-progress', challenge?._id, userId],
    queryFn: () => getUserChallengeProgress(challenge._id, userId),
    staleTime: 1000,
    enabled: !!challenge?._id && !!userId
  })

  const result = data?.data?.result
  const participantData = result?.participant || participant
  const progressEntries = result?.progress || []

  const progressByDate = useMemo(() => {
    const map = {}
    progressEntries.forEach(entry => {
      const dateStr = format(new Date(entry.date || entry.createdAt), 'yyyy-MM-dd')
      if (!map[dateStr]) map[dateStr] = []
      map[dateStr].push(entry)
    })
    return map
  }, [progressEntries])

  const challengeStart = useMemo(
    () => challenge?.start_date ? startOfDay(new Date(challenge.start_date)) : null,
    [challenge]
  )
  const challengeEnd = useMemo(
    () => challenge?.end_date ? startOfDay(new Date(challenge.end_date)) : null,
    [challenge]
  )

  // All challenge days for stats
  const allChallengeDays = useMemo(() => {
    if (!challengeStart || !challengeEnd) return []
    const days = []
    let d = new Date(challengeStart)
    while (d <= challengeEnd) {
      days.push(format(d, 'yyyy-MM-dd'))
      d = addDays(d, 1)
    }
    return days
  }, [challengeStart, challengeEnd])

  const completedDays = useMemo(() =>
    allChallengeDays.filter(ds => {
      const entries = progressByDate[ds] || []
      return entries.reduce((s, e) => s + (e.value || 0), 0) >= goalValue
    }).length,
    [allChallengeDays, progressByDate, goalValue]
  )

  const totalDays = allChallengeDays.length
  const pct = participantData?.progress_percent ?? (totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0)
  const streakCount = participantData?.streak_count || 0
  const activeDaysCount = participantData?.active_days?.length || Object.keys(progressByDate).length

  // Navigation label
  const navLabel = useMemo(() => {
    if (calView === 'week') {
      const ws = startOfWeek(refDate, { weekStartsOn: 1 })
      const we = addDays(ws, 6)
      return `${format(ws, 'dd/MM')} – ${format(we, 'dd/MM/yyyy')}`
    }
    if (calView === 'month') return format(refDate, 'MMMM yyyy', { locale: vi })
    return `Năm ${getYear(refDate)}`
  }, [calView, refDate])

  const handlePrev = () => {
    if (calView === 'week') setRefDate(d => subWeeks(d, 1))
    else if (calView === 'month') setRefDate(d => subMonths(d, 1))
    else setRefDate(d => subYears(d, 1))
    setSelectedDay(null)
  }
  const handleNext = () => {
    if (calView === 'week') setRefDate(d => addWeeks(d, 1))
    else if (calView === 'month') setRefDate(d => addMonths(d, 1))
    else setRefDate(d => addYears(d, 1))
    setSelectedDay(null)
  }
  const handleToday = () => { setRefDate(new Date()); setSelectedDay(null) }

  const handleDayClick = (dateStr) => {
    setSelectedDay(prev => prev === dateStr ? null : dateStr)
    setSelectedEntry(null)
  }

  const selectedDayEntries = useMemo(() =>
    selectedDay ? (progressByDate[selectedDay] || []) : [],
    [selectedDay, progressByDate]
  )

  const TAB_VIEWS = [
    { id: 'week', label: 'Tuần' },
    { id: 'month', label: 'Tháng' },
    { id: 'year', label: 'Năm' }
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden max-h-[88vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className={`bg-gradient-to-r ${gradient} px-5 py-4 flex items-center justify-between flex-shrink-0`}>
          <div className="flex items-center gap-3">
            <img
              src={user.avatar ? getImageUrl(user.avatar) : useravatar}
              alt={user.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-white/50"
              onError={e => { e.target.onerror = null; e.target.src = useravatar }}
            />
            <div>
              <h3 className="font-bold text-white text-sm">{user.name || 'Ẩn danh'}</h3>
              <p className="text-white/80 text-[11px] mt-0.5">
                {completedDays}/{totalDays} ngày hoàn thành
                {streakCount > 0 && <span className="ml-2">🔥 {streakCount} streak</span>}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 text-white transition">
            <FaTimes />
          </button>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: `${pct}%`, label: 'Hoàn thành', color: pct >= 100 ? 'text-green-500' : 'text-gray-800 dark:text-white' },
                  { value: streakCount, label: '🔥 Streak', color: 'text-orange-500' },
                  { value: activeDaysCount, label: 'Ngày tham gia', color: 'text-gray-800 dark:text-white' }
                ].map(({ value, label, color }) => (
                  <div key={label} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-2.5 text-center">
                    <p className={`text-xl font-black ${color}`}>{value}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-semibold text-gray-500">Tiến độ tổng thể</span>
                  <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300">{completedDays}/{totalDays} ngày</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-700`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* ── Calendar Section ── */}
              <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-3 space-y-3">

                {/* Tab switcher */}
                <div className="flex items-center gap-2">
                  <FaCalendarCheck className="text-orange-500 text-sm flex-shrink-0" />
                  <div className="flex bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-0.5 gap-0.5 flex-1">
                    {TAB_VIEWS.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => { setCalView(tab.id); setSelectedDay(null) }}
                        className={`flex-1 py-1 text-[11px] font-bold rounded-md transition-all ${
                          calView === tab.id
                            ? 'bg-orange-500 text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Navigation bar */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={handlePrev}
                    className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition text-gray-500 dark:text-gray-400"
                  >
                    <FaChevronLeft className="text-xs" />
                  </button>
                  <button
                    onClick={handleToday}
                    className="text-[11px] font-bold text-gray-700 dark:text-gray-200 hover:text-orange-500 transition px-2 py-1 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20"
                    title="Về hôm nay"
                  >
                    {navLabel}
                  </button>
                  <button
                    onClick={handleNext}
                    className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition text-gray-500 dark:text-gray-400"
                  >
                    <FaChevronRight className="text-xs" />
                  </button>
                </div>

                {/* Calendar grid */}
                {calView === 'week' && (
                  <WeekView
                    refDate={refDate}
                    challengeStart={challengeStart}
                    challengeEnd={challengeEnd}
                    progressByDate={progressByDate}
                    goalValue={goalValue}
                    selectedDay={selectedDay}
                    onDayClick={handleDayClick}
                  />
                )}
                {calView === 'month' && (
                  <MonthView
                    refDate={refDate}
                    challengeStart={challengeStart}
                    challengeEnd={challengeEnd}
                    progressByDate={progressByDate}
                    goalValue={goalValue}
                    selectedDay={selectedDay}
                    onDayClick={handleDayClick}
                  />
                )}
                {calView === 'year' && (
                  <YearView
                    refDate={refDate}
                    challengeStart={challengeStart}
                    challengeEnd={challengeEnd}
                    progressByDate={progressByDate}
                    goalValue={goalValue}
                    selectedDay={selectedDay}
                    onDayClick={handleDayClick}
                  />
                )}

                <Legend />
              </div>

              {/* ── Selected Day Detail ── */}
              {selectedDay && (
                <div className="bg-orange-50 dark:bg-orange-900/10 rounded-xl p-3 border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-orange-700 dark:text-orange-400 flex items-center gap-1">
                      📅 {format(parseISO(selectedDay), "EEEE, dd/MM/yyyy", { locale: vi })}
                    </h4>
                    <button
                      onClick={() => setSelectedDay(null)}
                      className="text-[10px] text-gray-400 hover:text-gray-600 font-bold px-2 py-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                      ✕
                    </button>
                  </div>
                  {selectedDayEntries.length === 0 ? (
                    <p className="text-[10px] text-gray-400 text-center py-3">Không có hoạt động vào ngày này</p>
                  ) : (
                    <div className="space-y-1.5">
                      {selectedDayEntries.map(entry => (
                        <button
                          key={entry._id}
                          onClick={() => setSelectedEntry(entry)}
                          className="w-full text-left flex items-center justify-between p-2.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600 hover:shadow-sm transition-all group"
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-md bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-[9px] font-bold`}>
                              {new Date(entry.date || entry.createdAt).getDate()}
                            </div>
                            <div>
                              <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                                +{entry.value} {entry.unit}
                              </p>
                              {entry.notes && (
                                <p className="text-[9px] text-gray-400 truncate max-w-[180px]">{entry.notes}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1.5 text-[9px] text-gray-400">
                              {entry.distance && <span>📍{entry.distance}km</span>}
                              {entry.duration_minutes && <span>⏱{entry.duration_minutes}p</span>}
                              {entry.calories && <span>🔥{Math.round(entry.calories)}</span>}
                            </div>
                            <FaChevronRight className="text-[10px] text-gray-300 group-hover:text-orange-400 transition" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {progressEntries.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-xs">
                  <FaCalendarCheck className="text-3xl mx-auto mb-2 opacity-30" />
                  Người dùng chưa có lần check-in nào
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 font-medium text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* ── Entry Detail Modal ── */}
      {selectedEntry && (
        challengeType === 'outdoor_activity'
          ? <ActivityEntryDetailView entry={selectedEntry} challenge={challenge} onClose={() => setSelectedEntry(null)} />
          : challengeType === 'nutrition'
            ? <NutritionDetailView entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
            : <FitnessDetailView entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
      )}
    </div>
  )
}
