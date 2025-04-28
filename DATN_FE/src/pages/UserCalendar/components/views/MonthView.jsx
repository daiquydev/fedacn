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
      
      days.push(
        <div
          key={day}
          className={`min-h-[120px] p-1 border border-gray-200 dark:border-gray-700 ${
            !isSameMonth(day, monthStart)
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600'
              : isSameDay(day, new Date())
                ? 'bg-blue-50 dark:bg-blue-900/20'
                : 'bg-white dark:bg-gray-900'
          }`}
          onClick={() => onDateClick(cloneDay)}
        >
          <div className="flex justify-between items-center">
            <span className={`text-sm font-semibold ${
              isSameDay(day, new Date()) ? 'bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''
            }`}>
              {formattedDate}
            </span>
            <small className="text-gray-500 dark:text-gray-400">
              {format(cloneDay, 'eee', { locale: vi })}
            </small>
          </div>
          
          <div className="mt-1 space-y-1 overflow-y-auto max-h-[90px]">
            {dateEvents.length > 0 ? (
              dateEvents.slice(0, 3).map((event, index) => (
                <CalendarEvent 
                  key={`${event.id}-${index}`}
                  event={event}
                  onClick={() => onEventClick(event)}
                  isCompact={true}
                />
              ))
            ) : null}
            
            {dateEvents.length > 3 && (
              <div 
                className="text-xs text-blue-600 dark:text-blue-400 font-medium cursor-pointer hover:underline"
                onClick={(e) => {
                  e.stopPropagation()
                  onDateClick(cloneDay)
                }}
              >
                + {dateEvents.length - 3} sự kiện khác
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
      <div className="grid grid-cols-7 text-center">
        {daysOfWeek.map((day) => (
          <div key={day} className="p-2 border-b font-medium text-gray-600 dark:text-gray-300">
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