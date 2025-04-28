import { 
  startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, 
  startOfDay, endOfDay, 
  isSameMonth, isSameWeek, isSameDay, 
  parseISO 
} from 'date-fns'

/**
 * Filter events based on current view and date
 */
export const filterEvents = (events, currentDate, view) => {
  if (!events || !events.length) return []
  
  const start = (() => {
    switch (view) {
      case 'month':
        return startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 })
      case 'week':
        return startOfWeek(currentDate, { weekStartsOn: 1 })
      case 'day':
        return startOfDay(currentDate)
      case 'agenda':
        return startOfMonth(currentDate)
      default:
        return startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 })
    }
  })()
  
  const end = (() => {
    switch (view) {
      case 'month':
        return endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
      case 'week':
        return endOfWeek(currentDate, { weekStartsOn: 1 })
      case 'day':
        return endOfDay(currentDate)
      case 'agenda':
        return endOfMonth(currentDate)
      default:
        return endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
    }
  })()
  
  return events.filter(event => {
    const eventStart = parseISO(event.startDate)
    const eventEnd = event.endDate ? parseISO(event.endDate) : eventStart
    
    // Overlap check
    return (
      (eventStart <= end && eventEnd >= start) ||
      (view === 'month' && isSameMonth(eventStart, currentDate)) ||
      (view === 'week' && isSameWeek(eventStart, currentDate, { weekStartsOn: 1 })) ||
      (view === 'day' && isSameDay(eventStart, currentDate))
    )
  })
}

/**
 * Format date range for display
 */
export const formatDateRange = (startDate, endDate, includeYear = true) => {
  const options = { 
    day: 'numeric', 
    month: 'short',
    year: includeYear ? 'numeric' : undefined
  }
  
  if (!endDate || startDate.toDateString() === endDate.toDateString()) {
    return new Date(startDate).toLocaleDateString('vi-VN', options)
  }
  
  return `${new Date(startDate).toLocaleDateString('vi-VN', options)} - ${new Date(endDate).toLocaleDateString('vi-VN', options)}`
}

/**
 * Group events by date
 */
export const groupEventsByDate = (events, dateAccessor = 'startDate') => {
  return events.reduce((acc, event) => {
    const date = event[dateAccessor].split('T')[0]
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(event)
    return acc
  }, {})
} 