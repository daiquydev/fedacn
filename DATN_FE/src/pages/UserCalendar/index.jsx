import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import CalendarHeader from './components/CalendarHeader'
import CalendarGrid from './components/CalendarGrid'
import EventDetails from './components/EventDetails'
import { mockChallenges } from './components/CalendarMockData'
import { filterEvents } from './utils/calendarUtils'
import { HiOutlineCalendar } from 'react-icons/hi'
import { getActiveMealSchedule, getScheduleMealsByDay } from '../../services/userMealScheduleService'
import { getWorkoutCalendarEvents } from '../../apis/savedWorkoutApi'
import { getJoinedEventsForCalendar } from '../../apis/sportEventApi'
import { startOfMonth, endOfMonth, format } from 'date-fns'

const MEAL_TYPE_META = {
  0: { label: 'Bữa sáng', startTime: '06:30', endTime: '07:30' },
  1: { label: 'Bữa trưa', startTime: '12:00', endTime: '13:00' },
  2: { label: 'Bữa tối', startTime: '18:30', endTime: '19:30' },
  3: { label: 'Ăn nhẹ', startTime: '15:30', endTime: '16:00' },
  4: { label: 'Ăn nhẹ 2', startTime: '20:30', endTime: '21:00' }
}

const getDateKey = (value) => {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const y = date.getFullYear()
  const m = `${date.getMonth() + 1}`.padStart(2, '0')
  const d = `${date.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${d}`
}

const getTimeString = (value, fallback) => {
  if (!value) return fallback
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed.includes('T')) {
      const timePart = trimmed.split('T')[1] || ''
      return timePart.slice(0, 5) || fallback
    }
    return trimmed.slice(0, 5) || fallback
  }
  if (value instanceof Date) {
    const h = value.getHours().toString().padStart(2, '0')
    const m = value.getMinutes().toString().padStart(2, '0')
    return `${h}:${m}`
  }
  return fallback
}

const mapMealsToEvents = ({ mealsByDate = {}, schedule }) => {
  if (!schedule) return []
  const planTitle = schedule?.meal_plan_id?.name || schedule?.meal_plan_id?.title || 'Thực đơn đang áp dụng'
  const scheduleId = schedule?._id

  return Object.entries(mealsByDate).flatMap(([dateKey, meals]) => {
    const normalizedDate = getDateKey(dateKey)
    if (!normalizedDate) return []

    return (meals || []).map((meal, idx) => {
      const meta = MEAL_TYPE_META[meal.meal_type] || { label: 'Bữa ăn', startTime: '08:00', endTime: '09:00' }
      const recipe = meal.recipe_id || {}
      const mealName = meal.name || recipe.title || 'Món ăn'

      const startTimeStr = getTimeString(meal.scheduled_time, meta.startTime || '08:00')
      const [startHourRaw, startMinuteRaw] = startTimeStr.split(':')
      const safeStartHour = (startHourRaw && startHourRaw.trim()) ? startHourRaw.trim().padStart(2, '0') : '08'
      const safeStartMinute = (startMinuteRaw && startMinuteRaw.trim()) ? startMinuteRaw.trim().padStart(2, '0') : '00'

      const metaEnd = meta.endTime || ''
      const endTimeStr = metaEnd || `${(Number(safeStartHour) + 1).toString().padStart(2, '0')}:${safeStartMinute}`
      const [endHourRaw, endMinuteRaw] = endTimeStr.split(':')
      const safeEndHour = (endHourRaw && endHourRaw.trim()) ? endHourRaw.trim().padStart(2, '0') : safeStartHour
      const safeEndMinute = (endMinuteRaw && endMinuteRaw.trim()) ? endMinuteRaw.trim().padStart(2, '0') : safeStartMinute

      const startTimeSafe = `${safeStartHour}:${safeStartMinute}`
      const endTimeSafe = `${safeEndHour}:${safeEndMinute}`

      const startDateStr = `${normalizedDate}T00:00:00`
      const endDateStr = `${normalizedDate}T23:59:59`

      return {
        id: `meal-${scheduleId || 'schedule'}-${meal._id || idx}-${normalizedDate}`,
        type: 'mealPlan',
        title: `${meta.label}: ${mealName}`,
        description: recipe.description || meal.description || planTitle,
        startDate: startDateStr,
        endDate: endDateStr,
        startTime: startTimeSafe,
        endTime: endTimeSafe,
        status: 'ongoing',
        mealType: meta.label,
        mealPlanTitle: planTitle,
        scheduleId,
        dateKey: normalizedDate,
        foods: [
          {
            name: mealName,
            calories: meal.calories ?? recipe.calories ?? 0,
            protein: meal.protein ?? recipe.protein ?? 0,
            carbs: meal.carbs ?? recipe.carbohydrate ?? 0,
            fat: meal.fat ?? recipe.fat ?? 0,
            image: meal.image || recipe.image || '',
            benefits: meal.notes ? [meal.notes] : []
          }
        ]
      }
    })
  })
}

/**
 * Map backend workout calendar events → CalendarGrid-compatible items
 */
const mapWorkoutEventsToCalendar = (events = []) => {
  return events.map((ev) => {
    const [startHour, startMin] = (ev.time_of_day || '07:00').split(':')
    const endHour = String(Number(startHour) + 1).padStart(2, '0')
    const endTime = `${endHour}:${startMin || '00'}`

    return {
      id: ev.id,
      type: 'workout',
      title: `🏋️ ${ev.workout_name}`,
      description: `${ev.exercises?.length || 0} bài tập`,
      startDate: `${ev.date}T00:00:00`,
      endDate: `${ev.date}T23:59:59`,
      startTime: ev.time_of_day || '07:00',
      endTime,
      status: 'ongoing',
      workout_id: ev.workout_id,
      workout_name: ev.workout_name,
      exercises: ev.exercises || [],
      reminder: ev.reminder
    }
  })
}

/**
 * Map joined sport events from backend → CalendarGrid-compatible items
 */
const mapSportEventsToCalendar = (events = []) => {
  return events.map((ev) => {
    const startDate = new Date(ev.startDate)
    const endDate = new Date(ev.endDate)

    const startDateKey = getDateKey(startDate)
    const endDateKey = getDateKey(endDate)

    const startTime = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`
    const endTime = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`

    const now = new Date()
    let status = 'upcoming'
    if (endDate < now) status = 'completed'
    else if (startDate <= now) status = 'ongoing'

    return {
      id: ev._id,
      type: 'event',
      title: ev.name,
      description: ev.description || '',
      startDate: `${startDateKey}T00:00:00`,
      endDate: `${endDateKey}T23:59:59`,
      startTime,
      endTime,
      status,
      location: ev.location || '',
      category: ev.category || '',
      eventType: ev.eventType || 'Ngoài trời',
      image: ev.image || '',
      participants: ev.participants || 0,
      maxParticipants: ev.maxParticipants || 0,
      organizer: ev.createdBy?.name || '',
      isJoined: true
    }
  })
}

export default function UserCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [currentView, setCurrentView] = useState('month')
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [mealPlanSchedule, setMealPlanSchedule] = useState(null)
  const [mealsByDate, setMealsByDate] = useState({})
  const [workoutEvents, setWorkoutEvents] = useState([])
  const [sportEvents, setSportEvents] = useState([])
  const [filters, setFilters] = useState({
    events: true,
    challenges: true,
    mealPlans: true,
    workouts: true
  })

  const [calendarItems, setCalendarItems] = useState([])
  const [loadingMealPlan, setLoadingMealPlan] = useState(false)
  const [loadingWorkouts, setLoadingWorkouts] = useState(false)
  const [loadingSportEvents, setLoadingSportEvents] = useState(false)

  // ---- Meal plan ----
  const hydrateMealsFromSchedule = (schedule) => {
    if (!schedule?.meals_by_date) return
    const mapped = Object.entries(schedule.meals_by_date).reduce((acc, [key, meals]) => {
      const normalized = getDateKey(key)
      if (normalized) acc[normalized] = meals || []
      return acc
    }, {})
    setMealsByDate(mapped)
  }

  const fetchActiveMealPlan = async () => {
    try {
      setLoadingMealPlan(true)
      const active = await getActiveMealSchedule()
      if (!active?.schedule) {
        setMealPlanSchedule(null)
        setMealsByDate({})
        return
      }
      setMealPlanSchedule(active.schedule)
      hydrateMealsFromSchedule(active.schedule)
    } catch (error) {
      console.error('Không thể tải thực đơn đang áp dụng:', error)
    } finally {
      setLoadingMealPlan(false)
    }
  }

  // ---- Workout events ----
  const fetchWorkoutEvents = async (refDate) => {
    try {
      setLoadingWorkouts(true)
      const monthStart = format(startOfMonth(refDate), 'yyyy-MM-dd')
      const monthEnd = format(endOfMonth(refDate), 'yyyy-MM-dd')
      const res = await getWorkoutCalendarEvents(monthStart, monthEnd)
      const events = res?.data?.result || []
      setWorkoutEvents(mapWorkoutEventsToCalendar(events))
    } catch (error) {
      console.error('Không thể tải lịch tập luyện:', error)
    } finally {
      setLoadingWorkouts(false)
    }
  }

  // ---- Sport events (joined) ----
  const fetchJoinedSportEvents = async () => {
    try {
      setLoadingSportEvents(true)
      const res = await getJoinedEventsForCalendar()
      const events = res?.data?.result?.events || []
      setSportEvents(mapSportEventsToCalendar(events))
    } catch (error) {
      console.error('Không thể tải sự kiện đã tham gia:', error)
    } finally {
      setLoadingSportEvents(false)
    }
  }

  useEffect(() => {
    fetchActiveMealPlan()
    fetchWorkoutEvents(new Date())
    fetchJoinedSportEvents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-fetch workout events when month changes
  useEffect(() => {
    fetchWorkoutEvents(currentDate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate.getFullYear(), currentDate.getMonth()])

  // ---- Build combined calendar items ----
  useEffect(() => {
    const mealEvents = mapMealsToEvents({ mealsByDate, schedule: mealPlanSchedule })
    const combinedItems = [
      ...mockChallenges.map(challenge => ({ ...challenge, type: 'challenge' })),
      ...(mealEvents || []),
      ...(workoutEvents || []),
      ...(sportEvents || [])
    ].filter(item => {
      if (item.type === 'event' && !filters.events) return false
      if (item.type === 'challenge' && !filters.challenges) return false
      if (item.type === 'mealPlan' && !filters.mealPlans) return false
      if (item.type === 'workout' && !filters.workouts) return false
      return true
    })

    setCalendarItems(combinedItems)
  }, [filters, mealsByDate, mealPlanSchedule, workoutEvents, sportEvents])

  const handlePrevious = () => {
    const newDate = new Date(currentDate)
    if (currentView === 'month') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else if (currentView === 'week') {
      newDate.setDate(newDate.getDate() - 7)
    } else if (currentView === 'day') {
      newDate.setDate(newDate.getDate() - 1)
    }
    setCurrentDate(newDate)
  }

  const handleNext = () => {
    const newDate = new Date(currentDate)
    if (currentView === 'month') {
      newDate.setMonth(newDate.getMonth() + 1)
    } else if (currentView === 'week') {
      newDate.setDate(newDate.getDate() + 7)
    } else if (currentView === 'day') {
      newDate.setDate(newDate.getDate() + 1)
    }
    setCurrentDate(newDate)
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const handleChangeView = (view) => {
    setCurrentView(view)
  }

  const handleDateClick = (date) => {
    setSelectedDate(date)
    const dateKey = getDateKey(date)
    if (mealPlanSchedule?._id && !mealsByDate[dateKey]) {
      getScheduleMealsByDay({ scheduleId: mealPlanSchedule._id, date: dateKey })
        .then((meals) => {
          setMealsByDate((prev) => ({ ...prev, [dateKey]: meals || [] }))
        })
        .catch((error) => console.error('Không thể tải bữa ăn cho ngày:', error))
    }
    if (currentView === 'month' || currentView === 'week') {
      setCurrentView('day')
      setCurrentDate(date)
    }
  }

  const handleEventClick = (event) => {
    setSelectedEvent(event)
  }

  const handleCloseEventDetails = () => {
    setSelectedEvent(null)
  }

  const handleFilterChange = (filterType) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: !prev[filterType]
    }))
  }

  const filteredItems = filterEvents(calendarItems, currentDate, currentView)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-full bg-white dark:bg-color-primary-dark dark:text-gray-300"
    >
      {/* Page Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-green-600 to-teal-500 px-6 py-6">
        <div className="relative flex items-center gap-4 max-w-7xl mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
            <HiOutlineCalendar className="text-white text-2xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Lịch Cá Nhân</h1>
            <p className="text-white/75 text-sm mt-0.5">Theo dõi lịch tập luyện, sự kiện và hoạt động của bạn</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {(loadingMealPlan || loadingWorkouts || loadingSportEvents) && (
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            {loadingMealPlan && 'Đang tải thực đơn... '}
            {loadingWorkouts && 'Đang tải lịch tập luyện... '}
            {loadingSportEvents && 'Đang tải sự kiện...'}
          </div>
        )}
        {/* Calendar Controls */}
        <CalendarHeader
          currentDate={currentDate}
          currentView={currentView}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onToday={handleToday}
          onChangeView={handleChangeView}
          filters={filters}
          onFilterChange={handleFilterChange}
        />

        {/* Calendar Grid */}
        <div className="bg-white dark:bg-color-primary-dark shadow-md rounded-xl overflow-hidden my-4 border border-gray-200 dark:border-gray-700">
          <CalendarGrid
            currentDate={currentDate}
            currentView={currentView}
            calendarItems={filteredItems}
            onDateClick={handleDateClick}
            onEventClick={handleEventClick}
          />
        </div>

        {/* Event Details Modal */}
        {selectedEvent && (
          <EventDetails
            event={selectedEvent}
            onClose={handleCloseEventDetails}
          />
        )}
      </div>
    </motion.div>
  )
}