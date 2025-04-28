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
    <div className="day-view overflow-auto" style={{ height: '70vh' }}>
      <div className="flex flex-col">
        {/* Date header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold">
            {format(currentDate, 'EEEE, d MMMM yyyy', { locale: vi })}
          </h2>
        </div>
        
        {/* All-day events */}
        {allDayEvents.length > 0 && (
          <div className="border-b border-gray-200 dark:border-gray-700 p-2">
            <div className="font-medium text-gray-700 dark:text-gray-300 mb-2">Cả ngày</div>
            <div className="space-y-2">
              {allDayEvents.map((event, index) => (
                <CalendarEvent 
                  key={`${event.id}-${index}`}
                  event={event}
                  onClick={() => onEventClick(event)}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Time slots */}
        <div className="flex flex-1">
          {/* Time column */}
          <div className="w-20 flex-shrink-0 border-r border-gray-200 dark:border-gray-700">
            {timeSlots.map(time => (
              <div 
                key={time} 
                className="h-20 border-b border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 text-right pr-2 pt-2"
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
              
              return (
                <div 
                  key={index} 
                  className="h-20 border-b border-gray-200 dark:border-gray-700 relative"
                >
                  {events.length > 0 ? (
                    <div className="p-1 space-y-1 absolute inset-0 overflow-y-auto">
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