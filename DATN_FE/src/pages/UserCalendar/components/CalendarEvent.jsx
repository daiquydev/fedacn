import React from 'react'
import { FaUtensils, FaTrophy } from 'react-icons/fa'
import { MdSportsSoccer } from 'react-icons/md'

export default function CalendarEvent({ event, onClick, isCompact = false }) {
  // Get color based on event type
  const getBgColor = () => {
    switch(event.type) {
      case 'event':
        return 'bg-blue-100 dark:bg-blue-900/60 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200'
      case 'challenge':
        return 'bg-green-100 dark:bg-green-900/60 border-green-300 dark:border-green-700 text-green-800 dark:text-green-200'
      case 'mealPlan':
        return 'bg-orange-100 dark:bg-orange-900/60 border-orange-300 dark:border-orange-700 text-orange-800 dark:text-orange-200'
      default:
        return 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200'
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
      className={`px-2 py-1 rounded border ${getBgColor()} ${
        isCompact ? 'text-xs' : 'text-sm'
      } cursor-pointer hover:opacity-90 truncate`}
      onClick={onClick}
    >
      <div className="flex items-center gap-1 truncate">
        {getEventIcon()}
        <span className="truncate">
          {isCompact && event.type === 'mealPlan' && event.mealType ? `${event.mealType}: ` : ''}
          {event.title}
          {event.startTime && !isCompact && ` (${event.startTime}${event.endTime ? ` - ${event.endTime}` : ''})`}
        </span>
      </div>
    </div>
  )
} 