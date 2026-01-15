import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import CalendarHeader from './components/CalendarHeader'
import CalendarGrid from './components/CalendarGrid'
import EventDetails from './components/EventDetails'
import { mockEvents, mockChallenges } from './components/CalendarMockData'
import { filterEvents } from './utils/calendarUtils'
import { HiOutlineCalendar } from 'react-icons/hi'
import { getActiveMealSchedule, getScheduleMealsByDay } from '../../services/userMealScheduleService'

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
    // Expect formats like "06:30" or "06:30:00" or ISO strings; take HH:mm
    const trimmed = value.trim()
    if (trimmed.includes('T')) {
      // ISO-like string
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

      // Đặt start/end theo ngày để luôn nằm trong khoảng lọc; slot hiển thị dùng startTime/endTime
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

export default function UserCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [currentView, setCurrentView] = useState('month') // 'month', 'week', 'day', 'agenda'
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [mealPlanSchedule, setMealPlanSchedule] = useState(null)
  const [mealsByDate, setMealsByDate] = useState({})
  const [filters, setFilters] = useState({
    events: true,
    challenges: true,
    mealPlans: true
  })

  // Combine all calendar items
  const [calendarItems, setCalendarItems] = useState([])
  const [loadingMealPlan, setLoadingMealPlan] = useState(false)

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
  
  useEffect(() => {
    fetchActiveMealPlan()
  }, [])

  useEffect(() => {
    const mealEvents = mapMealsToEvents({ mealsByDate, schedule: mealPlanSchedule })
    const combinedItems = [
      ...mockEvents.map(event => ({ ...event, type: 'event' })),
      ...mockChallenges.map(challenge => ({ ...challenge, type: 'challenge' })),
      ...(mealEvents || [])
    ].filter(item => {
      if (item.type === 'event' && !filters.events) return false
      if (item.type === 'challenge' && !filters.challenges) return false
      if (item.type === 'mealPlan' && !filters.mealPlans) return false
      return true
    })

    setCalendarItems(combinedItems)
  }, [filters, mealsByDate, mealPlanSchedule])

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
    // Nếu chưa có dữ liệu meal cho ngày này, gọi API để lấy
    if (mealPlanSchedule?._id && !mealsByDate[dateKey]) {
      getScheduleMealsByDay({ scheduleId: mealPlanSchedule._id, date: dateKey })
        .then((meals) => {
          setMealsByDate((prev) => ({ ...prev, [dateKey]: meals || [] }))
        })
        .catch((error) => console.error('Không thể tải bữa ăn cho ngày:', error))
    }
    // Optionally change to day view when clicking on a date
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

  // Get events for the current view
  const filteredItems = filterEvents(calendarItems, currentDate, currentView)

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-full p-4 bg-white dark:bg-color-primary-dark dark:text-gray-300"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <HiOutlineCalendar className="text-3xl text-green-500 dark:text-green-400" />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Lịch Cá Nhân</h1>
        </div>
          {loadingMealPlan && (
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Đang tải thực đơn đang áp dụng...</div>
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