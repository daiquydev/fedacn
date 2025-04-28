import React from 'react'
import { format, isSameMonth, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import { FaCalendarAlt, FaClock, FaUtensils, FaTrophy, FaMapMarkerAlt } from 'react-icons/fa'
import { MdSportsSoccer } from 'react-icons/md'

export default function AgendaView({ currentDate, calendarItems, onEventClick }) {
  // Group events by date
  const eventsByDate = calendarItems.reduce((acc, event) => {
    const date = format(parseISO(event.startDate), 'yyyy-MM-dd')
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(event)
    return acc
  }, {})
  
  // Sort dates
  const sortedDates = Object.keys(eventsByDate).sort()
  
  // Get icon based on event type
  const getEventIcon = (type) => {
    switch(type) {
      case 'event':
        return <MdSportsSoccer size={20} className="text-blue-500" />
      case 'challenge':
        return <FaTrophy size={20} className="text-green-500" />
      case 'mealPlan':
        return <FaUtensils size={20} className="text-orange-500" />
      default:
        return <FaCalendarAlt size={20} className="text-gray-500" />
    }
  }
  
  return (
    <div className="agenda-view overflow-auto" style={{ maxHeight: '70vh' }}>
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">
          Danh sách sự kiện - {format(currentDate, 'MMMM yyyy', { locale: vi })}
        </h2>
        
        {sortedDates.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Không có sự kiện nào trong khoảng thời gian này
          </div>
        ) : (
          <div className="space-y-4">
            {sortedDates.map(dateStr => {
              const date = new Date(dateStr)
              const isCurrentMonth = isSameMonth(date, currentDate)
              
              // Only show events from the current month
              if (!isCurrentMonth) return null
              
              return (
                <div key={dateStr} className="border rounded-lg overflow-hidden dark:border-gray-700">
                  <div className="p-3 font-medium bg-gray-100 dark:bg-gray-800 border-b dark:border-gray-700">
                    {format(date, 'EEEE, d MMMM yyyy', { locale: vi })}
                  </div>
                  
                  <div className="divide-y dark:divide-gray-700">
                    {eventsByDate[dateStr].map((event, index) => (
                      <div 
                        key={`${event.id}-${index}`}
                        className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                        onClick={() => onEventClick(event)}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {getEventIcon(event.type)}
                          <span className="font-medium">{event.title}</span>
                        </div>
                        
                        <div className="ml-7 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          {event.startTime && (
                            <div className="flex items-center gap-2">
                              <FaClock size={14} />
                              <span>
                                {event.startTime}
                                {event.endTime ? ` - ${event.endTime}` : ''}
                              </span>
                            </div>
                          )}
                          
                          {event.location && (
                            <div className="flex items-center gap-2">
                              <FaMapMarkerAlt size={14} />
                              <span>{event.location}</span>
                            </div>
                          )}
                          
                          {event.description && (
                            <div className="mt-1 line-clamp-2">{event.description}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
} 