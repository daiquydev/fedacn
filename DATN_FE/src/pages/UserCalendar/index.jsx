import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import CalendarHeader from './components/CalendarHeader'
import CalendarGrid from './components/CalendarGrid'
import EventDetails from './components/EventDetails'
import { mockEvents, mockChallenges, mockMealPlans } from './components/CalendarMockData'
import { filterEvents } from './utils/calendarUtils'
import { HiOutlineCalendar } from 'react-icons/hi'

export default function UserCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [currentView, setCurrentView] = useState('month') // 'month', 'week', 'day', 'agenda'
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [filters, setFilters] = useState({
    events: true,
    challenges: true,
    mealPlans: true
  })

  // Combine all calendar items
  const [calendarItems, setCalendarItems] = useState([])
  
  useEffect(() => {
    // Combine and filter items based on user's filter settings
    const combinedItems = [
      ...mockEvents.map(event => ({ ...event, type: 'event' })),
      ...mockChallenges.map(challenge => ({ ...challenge, type: 'challenge' })),
      ...mockMealPlans.map(meal => ({ ...meal, type: 'mealPlan' }))
    ].filter(item => {
      if (item.type === 'event' && !filters.events) return false
      if (item.type === 'challenge' && !filters.challenges) return false
      if (item.type === 'mealPlan' && !filters.mealPlans) return false
      return true
    })
    
    setCalendarItems(combinedItems)
  }, [filters])

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