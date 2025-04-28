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
  
  // Function to check if an event falls on a specific date and time
  const getEventsForDateTime = (date, hour) => {
    return calendarItems.filter(event => {
      const eventStart = parseISO(event.startDate)
      const eventEnd = event.endDate ? parseISO(event.endDate) : eventStart
      
      // For events with specific time
      if (event.startTime) {
        const eventStartHour = parseInt(event.startTime.split(':')[0])
        const eventEndHour = event.endTime 
          ? parseInt(event.endTime.split(':')[0]) 
          : eventStartHour + 1
        
        // Check if the date matches and hour is within event time range
        return isSameDay(date, eventStart) && hour >= eventStartHour && hour < eventEndHour
      }
      
      // For all-day events or events without specific time
      return date >= eventStart && date <= eventEnd
    })
  }
  
  return (
    <div className="week-view overflow-auto" style={{ height: '70vh' }}>
      <div className="flex">
        {/* Time slots column */}
        <div className="time-column w-16 border-r border-gray-200 dark:border-gray-700">
          <div className="h-16 border-b border-gray-200 dark:border-gray-700"></div>
          {timeSlots.map(time => (
            <div 
              key={time} 
              className="h-16 border-b border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 text-right pr-2 pt-0"
            >
              {time}
            </div>
          ))}
        </div>
        
        {/* Days columns */}
        <div className="flex-1 grid grid-cols-7">
          {/* Day headers */}
          {days.map((day, index) => (
            <div 
              key={index}
              className={`h-16 border border-gray-200 dark:border-gray-700 p-2 text-center ${
                isSameDay(day, new Date()) 
                  ? 'bg-blue-50 dark:bg-blue-900/20' 
                  : ''
              }`}
              onClick={() => onDateClick(day)}
            >
              <div className="font-medium">{format(day, 'eee', { locale: vi })}</div>
              <div className={`mt-1 text-lg font-bold ${
                isSameDay(day, new Date()) ? 'text-blue-600 dark:text-blue-400' : ''
              }`}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
          
          {/* Time slots grid */}
          {timeSlots.map((time, timeIndex) => (
            <React.Fragment key={time}>
              {days.map((day, dayIndex) => {
                const events = getEventsForDateTime(day, parseInt(time.split(':')[0]))
                
                return (
                  <div 
                    key={`${dayIndex}-${timeIndex}`}
                    className="border border-gray-200 dark:border-gray-700 h-16 overflow-y-auto"
                    onClick={() => onDateClick(day)}
                  >
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
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  )
} 