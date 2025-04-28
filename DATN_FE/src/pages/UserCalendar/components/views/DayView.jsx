import React from 'react'
import { format, isSameDay, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import CalendarEvent from '../CalendarEvent'

// Time slots to display
const timeSlots = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`)

export default function DayView({ currentDate, calendarItems, onDateClick, onEventClick }) {
  // Function to get all-day events
  const getAllDayEvents = () => {
    return calendarItems.filter(event => {
      const eventStart = parseISO(event.startDate)
      const eventEnd = event.endDate ? parseISO(event.endDate) : eventStart
      
      // All day events either don't have time or span multiple days
      return (
        (isSameDay(eventStart, currentDate) || isSameDay(eventEnd, currentDate) || 
        (eventStart < currentDate && eventEnd > currentDate)) && 
        (!event.startTime || eventStart.toDateString() !== eventEnd.toDateString())
      )
    })
  }
  
  // Function to get events for a specific hour
  const getEventsForHour = (hour) => {
    return calendarItems.filter(event => {
      if (!event.startTime) return false
      
      const eventStart = parseISO(event.startDate)
      const eventStartHour = parseInt(event.startTime.split(':')[0])
      const eventEndHour = event.endTime 
        ? parseInt(event.endTime.split(':')[0]) 
        : eventStartHour + 1
      
      return isSameDay(eventStart, currentDate) && hour >= eventStartHour && hour < eventEndHour
    })
  }
  
  const allDayEvents = getAllDayEvents()
  
  return (
    <div className="day-view">
      <div className="flex flex-col">
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold mb-2">
            {format(currentDate, 'EEEE, dd/MM/yyyy', { locale: vi })}
          </h2>
          
          {/* All-day events */}
          {allDayEvents.length > 0 && (
            <div className="space-y-1.5">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Sự kiện cả ngày:</h3>
              {allDayEvents.map((event, index) => (
                <CalendarEvent 
                  key={`${event.id}-${index}`}
                  event={event}
                  onClick={() => onEventClick(event)}
                />
              ))}
            </div>
          )}
        </div>
        
        <div className="flex flex-1 overflow-y-auto max-h-[calc(100vh-300px)]">
          {/* Time column */}
          <div className="w-20 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/20">
            {timeSlots.map(time => (
              <div 
                key={time} 
                className="h-24 border-b border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 text-right pr-2 pt-1"
              >
                {time}
              </div>
            ))}
          </div>
          
          {/* Events column */}
          <div className="flex-1">
            {timeSlots.map((time, index) => {
              const hour = parseInt(time.split(':')[0])
              const events = getEventsForHour(hour)
              const isCurrentHour = new Date().getHours() === hour && isSameDay(currentDate, new Date())
              
              return (
                <div 
                  key={index} 
                  className={`h-24 border-b border-gray-200 dark:border-gray-700 relative ${
                    isCurrentHour ? 'bg-blue-50/50 dark:bg-blue-900/10' : 
                    hour >= 8 && hour < 18 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800/30'
                  }`}
                >
                  {isCurrentHour && (
                    <div className="absolute left-0 right-0 border-t-2 border-red-400 dark:border-red-500 z-10" 
                      style={{ top: `${Math.floor(new Date().getMinutes() / 60 * 100)}%` }}
                    ></div>
                  )}
                  
                  {events.length > 0 ? (
                    <div className="p-1.5 space-y-1.5 absolute inset-0 overflow-y-auto">
                      {events.map((event, eventIndex) => (
                        <CalendarEvent 
                          key={`${event.id}-${eventIndex}`}
                          event={event}
                          onClick={() => onEventClick(event)}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
} 