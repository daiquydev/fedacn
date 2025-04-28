import React from 'react'
import { format, startOfWeek, endOfWeek, addDays, isSameDay, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import CalendarEvent from '../CalendarEvent'

// Time slots to display
const timeSlots = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`)

export default function WeekView({ currentDate, calendarItems, onDateClick, onEventClick }) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }) // Start from Monday
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
  
  // Create week days
  const days = []
  let day = weekStart
  
  while (day <= weekEnd) {
    days.push(day)
    day = addDays(day, 1)
  }
  
  // Function to get all-day events for a specific date
  const getAllDayEvents = (date) => {
    return calendarItems.filter(event => {
      const eventStart = parseISO(event.startDate)
      const eventEnd = event.endDate ? parseISO(event.endDate) : eventStart
      
      // All day events or multi-day events
      return (
        (isSameDay(eventStart, date) || isSameDay(eventEnd, date) || (eventStart < date && eventEnd > date)) && 
        (!event.startTime || eventStart.toDateString() !== eventEnd.toDateString())
      )
    })
  }
  
  // Function to check if an event falls on a specific date and time
  const getEventsForDateTime = (date, hour) => {
    return calendarItems.filter(event => {
      if (!event.startTime) return false
      
      const eventStart = parseISO(event.startDate)
      const eventEnd = event.endDate ? parseISO(event.endDate) : eventStart
      const eventStartHour = parseInt(event.startTime.split(':')[0])
      const eventEndHour = event.endTime 
        ? parseInt(event.endTime.split(':')[0]) 
        : eventStartHour + 1
      
      // Check if the date matches and hour is within event time range
      return isSameDay(date, eventStart) && hour >= eventStartHour && hour < eventEndHour
    })
  }
  
  // Check if a day has any all-day events
  const hasAllDayEvents = days.some(day => getAllDayEvents(day).length > 0)
  
  return (
    <div className="week-view">
      {/* Header - Days of week */}
      <div className="grid grid-cols-8 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
        <div className="p-3 border-r border-gray-200 dark:border-gray-700"></div>
        {days.map(day => {
          const isToday = isSameDay(day, new Date())
          return (
            <div 
              key={day} 
              className={`p-3 text-center cursor-pointer ${
                isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
              onClick={() => onDateClick(day)}
            >
              <div className={`text-sm font-medium ${
                isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
              }`}>
                {format(day, 'EEEEEE', { locale: vi })}
              </div>
              <div className={`text-lg ${
                isToday 
                  ? 'bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mt-1' 
                  : 'text-gray-800 dark:text-gray-200 mt-1'
              }`}>
                {format(day, 'd')}
              </div>
            </div>
          )
        })}
      </div>
      
      {/* All-day events section */}
      {hasAllDayEvents && (
        <div className="grid grid-cols-8 border-b border-gray-200 dark:border-gray-700">
          <div className="p-2 border-r border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 text-right">
            Cả ngày
          </div>
          {days.map((day, index) => {
            const allDayEvents = getAllDayEvents(day)
            return (
              <div 
                key={index}
                className={`p-1.5 border-r border-gray-200 dark:border-gray-700 ${
                  isSameDay(day, new Date()) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                }`}
              >
                {allDayEvents.map((event, eventIndex) => (
                  <div className="mb-1" key={`${event.id}-${eventIndex}`}>
                    <CalendarEvent 
                      event={event}
                      onClick={() => onEventClick(event)}
                      isCompact={true}
                    />
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}
      
      {/* Time grid */}
      <div className="grid grid-cols-8 overflow-y-auto max-h-[calc(100vh-300px)]">
        {/* Time column */}
        <div className="col-span-1 bg-gray-50 dark:bg-gray-800/20 border-r border-gray-200 dark:border-gray-700">
          {timeSlots.map(time => (
            <div
              key={time}
              className="h-24 border-b border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 text-right pr-2 pt-1"
            >
              {time}
            </div>
          ))}
        </div>
        
        {/* Days columns */}
        <div className="col-span-7 grid grid-cols-7">
          {days.map((day, dayIndex) => (
            <div key={dayIndex} className="col-span-1">
              {timeSlots.map((time, timeIndex) => {
                const hour = parseInt(time.split(':')[0])
                const events = getEventsForDateTime(day, hour)
                const isCurrentHour = new Date().getHours() === hour && isSameDay(day, new Date())
                
                return (
                  <div 
                    key={`${dayIndex}-${timeIndex}`}
                    className={`h-24 border-b border-r border-gray-200 dark:border-gray-700 relative ${
                      isCurrentHour ? 'bg-blue-50/40 dark:bg-blue-900/10' : 
                      hour >= 8 && hour < 18 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800/30'
                    }`}
                    onClick={() => onDateClick(day)}
                  >
                    {isCurrentHour && (
                      <div className="absolute left-0 right-0 border-t-2 border-red-400 dark:border-red-500 z-10" 
                        style={{ top: `${Math.floor(new Date().getMinutes() / 60 * 100)}%` }}
                      ></div>
                    )}
                    
                    {events.length > 0 && (
                      <div className="p-1 space-y-1">
                        {events.map((event, index) => (
                          <CalendarEvent 
                            key={`${event.id}-${index}`}
                            event={event}
                            onClick={(e) => {
                              e.stopPropagation()
                              onEventClick(event)
                            }}
                            isCompact={true}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 