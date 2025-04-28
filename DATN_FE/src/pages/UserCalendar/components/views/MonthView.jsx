import React from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import CalendarEvent from '../CalendarEvent'

export default function MonthView({ currentDate, calendarItems, onDateClick, onEventClick }) {
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }) // Start from Monday
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })
  
  const daysOfWeek = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
  
  // Function to check if an event falls on a specific date
  const getEventsForDate = (date) => {
    return calendarItems.filter(event => {
      const eventStart = parseISO(event.startDate)
      const eventEnd = event.endDate ? parseISO(event.endDate) : eventStart
      
      // Check if the date is within event range
      return date >= eventStart && date <= eventEnd
    })
  }
  
  // Create calendar rows
  const rows = []
  let days = []
  let day = startDate
  
  // Create calendar grid
  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      const cloneDay = day
      const dateEvents = getEventsForDate(cloneDay)
      const formattedDate = format(cloneDay, 'd')
      const isToday = isSameDay(cloneDay, new Date())
      const isCurrentMonth = isSameMonth(cloneDay, monthStart)
      
      days.push(
        <div
          key={day}
          className={`min-h-[120px] p-2 border border-gray-200 dark:border-gray-700 transition-all duration-200 ${
            !isCurrentMonth
              ? 'bg-gray-50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-600'
              : isToday
                ? 'bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-200 dark:ring-blue-700 ring-inset'
                : 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/70'
          }`}
          onClick={() => onDateClick(cloneDay)}
        >
          <div className="flex justify-between items-center mb-1.5">
            <span className={`${
              isToday 
                ? 'bg-blue-500 dark:bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center font-medium'
                : `font-medium ${isCurrentMonth ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400 dark:text-gray-600'}`
            }`}>
              {formattedDate}
            </span>
            <small className={`${
              isCurrentMonth ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400 dark:text-gray-600'
            }`}>
              {format(cloneDay, 'eee', { locale: vi })}
            </small>
          </div>
          
          <div className="space-y-1 overflow-y-auto max-h-[85px] scrollbar-thin">
            {dateEvents.length > 0 ? (
              dateEvents.slice(0, 3).map((event, index) => (
                <CalendarEvent 
                  key={`${event.id}-${index}`}
                  event={event}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick(event);
                  }}
                  isCompact={true}
                />
              ))
            ) : null}
            
            {dateEvents.length > 3 && (
              <div 
                className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full text-blue-600 dark:text-blue-400 font-medium cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 text-center transition"
                onClick={(e) => {
                  e.stopPropagation()
                  onDateClick(cloneDay)
                }}
              >
                + {dateEvents.length - 3} sự kiện
              </div>
            )}
          </div>
        </div>
      )
      
      day = addDays(day, 1)
    }
    
    rows.push(
      <div key={day} className="grid grid-cols-7">
        {days}
      </div>
    )
    days = []
  }
  
  return (
    <div className="month-view">
      {/* Header - Days of week */}
      <div className="grid grid-cols-7 text-center border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        {daysOfWeek.map((day) => (
          <div key={day} className="py-3 font-medium text-gray-700 dark:text-gray-300">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="month-grid">
        {rows}
      </div>
    </div>
  )
} 