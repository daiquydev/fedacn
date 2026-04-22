import React, { useState, useMemo } from 'react'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameMonth, isSameDay, isWithinInterval,
  isBefore, isAfter, startOfDay
} from 'date-fns'
import { vi } from 'date-fns/locale'

const GRADIENT_MAP = {
  nutrition: 'from-emerald-500 to-teal-600',
  outdoor_activity: 'from-blue-500 to-cyan-600',
  fitness: 'from-purple-500 to-pink-600'
}

const TYPE_EMOJI = {
  nutrition: '🥗',
  outdoor_activity: '🏃',
  fitness: '💪'
}

/**
 * Diagonal Ribbon Component
 * Renders a 45° rotated banner at bottom-right corner with visible text
 */
function DiagonalRibbon({ text, bgColor }) {
  return (
    // Ribbon spans full cell height with high zIndex — sits on top of progress badge
    <div
      className={`absolute bottom-0 right-0 w-full h-full overflow-hidden pointer-events-none`}
      style={{ zIndex: 20 }}
    >
      <div
        className={`absolute ${bgColor} text-white text-center shadow-md`}
        style={{
          width: '160%',
          bottom: '10px',
          right: '-45%',
          transform: 'rotate(-35deg)',
          fontSize: '10px',
          fontWeight: 800,
          letterSpacing: '0.03em',
          padding: '3px 0',
          lineHeight: '1.3',
          textShadow: '0 1px 2px rgba(0,0,0,0.3)'
        }}
      >
        {text}
      </div>
    </div>
  )
}

/**
 * ChallengeCalendar — MonthView with diagonal ribbon banners
 */
export default function ChallengeCalendar({ challenge, progressEntries = [], onDayClick }) {
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date()
    const start = new Date(challenge?.start_date)
    const end = new Date(challenge?.end_date)
    if (now >= start && now <= end) return now
    if (now < start) return start
    return end
  })

  const challengeType = challenge?.challenge_type || 'fitness'
  const goalValue = challenge?.goal_value || 1
  const goalUnit = challenge?.goal_unit || 'ngày'
  const gradient = GRADIENT_MAP[challengeType] || GRADIENT_MAP.fitness
  const emoji = TYPE_EMOJI[challengeType] || '🎯'

  const challengeStart = useMemo(() => challenge?.start_date ? startOfDay(new Date(challenge.start_date)) : null, [challenge])
  const challengeEnd = useMemo(() => challenge?.end_date ? startOfDay(new Date(challenge.end_date)) : null, [challenge])
  const today = startOfDay(new Date())

  // Group progress entries by date
  const progressByDate = useMemo(() => {
    const map = {}
    progressEntries.forEach(entry => {
      const dateStr = format(new Date(entry.date || entry.createdAt), 'yyyy-MM-dd')
      if (!map[dateStr]) map[dateStr] = { total: 0, entries: [], completedIds: new Set() }
      const isValid = entry.validation_status !== 'invalid_time' && entry.ai_review_valid !== false;
      
      if (isValid) {
        if (challengeType === 'fitness' && Array.isArray(entry.completed_exercises)) {
           entry.completed_exercises.forEach(ce => {
             if (ce.completed) {
                const idStr = typeof ce.exercise_id === 'string' ? ce.exercise_id : (ce.exercise_id?._id || ce.exercise_id?.toString())
                if (idStr) map[dateStr].completedIds.add(idStr.toString())
             }
           })
           map[dateStr].total = map[dateStr].completedIds.size
        } else {
           map[dateStr].total += entry.value || 0
        }
      }
      map[dateStr].entries.push(entry)
    })
    return map
  }, [progressEntries, challengeType])

  // Navigation
  const handlePrev = () => setCurrentDate(prev => subMonths(prev, 1))
  const handleNext = () => setCurrentDate(prev => addMonths(prev, 1))
  const handleToday = () => setCurrentDate(new Date())

  // Build month grid
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const daysOfWeek = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

  // Build rows
  const rows = []
  let days = []
  let day = gridStart

  while (day <= gridEnd) {
    for (let i = 0; i < 7; i++) {
      const cloneDay = new Date(day)
      const cloneDayStart = startOfDay(cloneDay)
      const dateStr = format(cloneDay, 'yyyy-MM-dd')
      const dayNum = format(cloneDay, 'd')
      const isCurrentMonth = isSameMonth(cloneDay, monthStart)
      const isTodayDate = isSameDay(cloneDayStart, today)

      const isInChallenge = challengeStart && challengeEnd
        ? isWithinInterval(cloneDayStart, { start: challengeStart, end: challengeEnd })
        : false

      const dayData = progressByDate[dateStr] || { total: 0, entries: [] }
      const isCompleted = dayData.total >= goalValue && isInChallenge
      const hasProgress = dayData.total > 0

      const isPast = isBefore(cloneDayStart, today)
      const isFuture = isAfter(cloneDayStart, today)

      const isClickable = isInChallenge && isCurrentMonth

      // Cell styling
      let cellClasses = 'relative min-h-[120px] p-2 border transition-all duration-200 overflow-hidden '

      if (!isCurrentMonth) {
        cellClasses += 'bg-gray-50/50 dark:bg-gray-900/30 border-gray-100 dark:border-gray-800 '
      } else if (!isInChallenge) {
        cellClasses += 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 '
      } else if (isTodayDate) {
        cellClasses += isCompleted
          ? 'bg-green-50 dark:bg-green-900/10 border-green-300 dark:border-green-700 shadow-md '
          : 'bg-blue-50/70 dark:bg-blue-900/10 border-blue-300 dark:border-blue-700 shadow-md '
      } else if (isPast) {
        cellClasses += isCompleted
          ? 'bg-emerald-50/40 dark:bg-emerald-900/5 border-gray-200 dark:border-gray-700 '
          : 'bg-gray-100/70 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700 '
      } else {
        cellClasses += 'bg-amber-50/40 dark:bg-amber-900/5 border-gray-200 dark:border-gray-700 '
      }

      if (isClickable) cellClasses += 'cursor-pointer hover:shadow-lg hover:scale-[1.02] '
      else cellClasses += 'cursor-default '

      // Ribbon configuration
      let ribbon = null
      if (isInChallenge && isCurrentMonth) {
        if (isTodayDate) {
          ribbon = isCompleted
            ? { text: 'HOÀN THÀNH', bg: 'bg-green-500' }
            : { text: 'ĐANG DIỄN RA', bg: 'bg-blue-500' }
        } else if (isPast) {
          ribbon = isCompleted
            ? { text: 'HOÀN THÀNH', bg: 'bg-emerald-500' }
            : { text: 'ĐÃ KẾT THÚC', bg: 'bg-gray-400' }
        } else {
          ribbon = { text: 'CHƯA DIỄN RA', bg: 'bg-amber-500' }
        }
      }

      days.push(
        <div
          key={dateStr}
          onClick={() => isClickable && onDayClick?.(dateStr, dayData)}
          className={cellClasses + ' flex flex-col'}
        >
          {/* DIAGONAL RIBBON — render first (z-0) so content (z-10) always sits on top */}
          {ribbon && (
            <DiagonalRibbon text={ribbon.text} bgColor={ribbon.bg} />
          )}

          {/* Day number — fixed height so progress badges align across all cells in a row */}
          <div className="flex justify-between items-center mb-1 min-h-[32px]" style={{ position: 'relative', zIndex: 5 }}>
            <span className={`${isTodayDate
              ? 'bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shadow-lg'
              : `font-semibold text-sm ${!isCurrentMonth || !isInChallenge
                ? 'text-gray-300 dark:text-gray-600'
                : isPast
                  ? 'text-gray-500 dark:text-gray-400'
                  : 'text-gray-800 dark:text-gray-200'
              }`
              }`}>
              {dayNum}
            </span>

            {isInChallenge && isCurrentMonth && isCompleted && (
              <span className="text-lg drop-shadow-sm" title="Hoàn thành">✅</span>
            )}
          </div>

          {/* Progress badge + bar — show on ALL challenge days, always above ribbon via zIndex */}
          {isInChallenge && isCurrentMonth && (
            <div className="flex flex-col" style={{ position: 'relative', zIndex: 5 }}>
              <div className={`px-1.5 py-1 rounded-md text-[10px] font-bold mb-1.5 inline-block ${isCompleted
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                : isTodayDate
                  ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : isPast
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    : 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
                }`}>
                {emoji} {dayData.total % 1 === 0 ? dayData.total : dayData.total.toFixed(1)}/{goalValue} {goalUnit}
              </div>
              {/* Mini progress bar */}
              <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${isCompleted
                    ? 'bg-green-500'
                    : isTodayDate
                      ? 'bg-blue-500'
                      : isPast
                        ? 'bg-gray-400'
                        : 'bg-amber-400'
                    }`}
                  style={{ width: `${Math.min(Math.round((dayData.total / goalValue) * 100), 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )

      day = addDays(day, 1)
    }

    rows.push(
      <div key={format(day, 'yyyy-MM-dd')} className="grid grid-cols-7">
        {days}
      </div>
    )
    days = []
  }

  // Summary stats
  const allChallengeDays = useMemo(() => {
    if (!challengeStart || !challengeEnd) return []
    const result = []
    let d = new Date(challengeStart)
    while (d <= challengeEnd) {
      result.push(format(d, 'yyyy-MM-dd'))
      d = addDays(d, 1)
    }
    return result
  }, [challengeStart, challengeEnd])

  const completedDays = allChallengeDays.filter(d => {
    const data = progressByDate[d]
    return data && data.total >= goalValue
  }).length

  const totalDays = allChallengeDays.length
  const completionRate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Summary stats cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center border border-gray-200 dark:border-gray-700 shadow-sm">
          <p className="text-2xl font-black text-green-500">{completedDays}</p>
          <p className="text-[11px] text-gray-500 font-medium">Ngày hoàn thành</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center border border-gray-200 dark:border-gray-700 shadow-sm">
          <p className="text-2xl font-black text-gray-800 dark:text-white">{totalDays}</p>
          <p className="text-[11px] text-gray-500 font-medium">Tổng ngày</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center border border-gray-200 dark:border-gray-700 shadow-sm">
          <p className={`text-2xl font-black ${completionRate >= 70 ? 'text-green-500' : completionRate >= 40 ? 'text-orange-500' : 'text-red-400'}`}>
            {completionRate}%
          </p>
          <p className="text-[11px] text-gray-500 font-medium">Tỷ lệ</p>
        </div>
      </div>

      {/* Overall progress bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold text-gray-500">Tiến độ cá nhân</span>
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{completedDays}/{totalDays} ngày</span>
        </div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-700`}
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        {/* Header — navigation */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <button onClick={handlePrev} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <FaChevronLeft className="text-gray-500 dark:text-gray-400 text-sm" />
          </button>
          <button onClick={handleToday} className="px-3 py-1.5 rounded-lg bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 transition-colors shadow-sm">
            Hôm nay
          </button>
          <button onClick={handleNext} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <FaChevronRight className="text-gray-500 dark:text-gray-400 text-sm" />
          </button>
          <h3 className="text-base font-bold ml-2 text-gray-800 dark:text-white capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: vi })}
          </h3>
        </div>

        {/* Weekday header */}
        <div className="grid grid-cols-7 text-center border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30">
          {daysOfWeek.map(d => (
            <div key={d} className="py-2.5 font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div>{rows}</div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30">
          <span className="flex items-center gap-1.5 text-[10px] font-medium text-gray-500">
            <span className="w-4 h-2.5 rounded-sm bg-blue-500 inline-block" /> Đang diễn ra
          </span>
          <span className="flex items-center gap-1.5 text-[10px] font-medium text-gray-500">
            <span className="w-4 h-2.5 rounded-sm bg-emerald-500 inline-block" /> Hoàn thành
          </span>
          <span className="flex items-center gap-1.5 text-[10px] font-medium text-gray-500">
            <span className="w-4 h-2.5 rounded-sm bg-gray-400 inline-block" /> Đã kết thúc
          </span>
          <span className="flex items-center gap-1.5 text-[10px] font-medium text-gray-500">
            <span className="w-4 h-2.5 rounded-sm bg-amber-500 inline-block" /> Chưa diễn ra
          </span>
        </div>
      </div>
    </div>
  )
}
