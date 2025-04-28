import React from 'react'
import { FaUtensils, FaTrophy, FaClock } from 'react-icons/fa'
import { MdSportsSoccer } from 'react-icons/md'

export default function CalendarEvent({ event, onClick, isCompact = false }) {
  // Get color based on event type
  const getBgColor = () => {
    switch(event.type) {
      case 'event':
        return 'bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 dark:border-blue-400 text-blue-700 dark:text-blue-200'
      case 'challenge':
        return 'bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500 dark:border-green-400 text-green-700 dark:text-green-200'
      case 'mealPlan':
        return 'bg-orange-50 dark:bg-orange-900/30 border-l-4 border-orange-500 dark:border-orange-400 text-orange-700 dark:text-orange-200'
      default:
        return 'bg-gray-50 dark:bg-gray-800 border-l-4 border-gray-500 dark:border-gray-400 text-gray-700 dark:text-gray-200'
    }
  }
  
  // Get icon based on event type
  const getEventIcon = () => {
    switch(event.type) {
      case 'event':
        return <MdSportsSoccer size={isCompact ? 12 : 16} className="min-w-[12px]" />
      case 'challenge':
        return <FaTrophy size={isCompact ? 12 : 16} className="min-w-[12px]" />
      case 'mealPlan':
        return <FaUtensils size={isCompact ? 12 : 16} className="min-w-[12px]" />
      default:
        return null
    }
  }
  
  return (
    <div 
      className={`px-2 py-1.5 rounded ${getBgColor()} ${
        isCompact ? 'text-xs' : 'text-sm'
      } cursor-pointer hover:brightness-95 dark:hover:brightness-125 transition-all shadow-sm`}
      onClick={onClick}
      title={event.title}
    >
      <div className="flex items-center gap-1.5 truncate">
        {getEventIcon()}
        <span className="font-medium truncate">
          {isCompact && event.type === 'mealPlan' && event.mealType ? `${event.mealType}: ` : ''}
          {event.title}
        </span>
      </div>
      
      {!isCompact && event.startTime && (
        <div className="flex items-center gap-1 mt-1 text-xs opacity-80">
          <FaClock size={10} />
          <span>
            {event.startTime}
            {event.endTime ? ` - ${event.endTime}` : ''}
          </span>
        </div>
      )}
    </div>
  )
} 