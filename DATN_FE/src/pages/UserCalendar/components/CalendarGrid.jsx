import React from 'react'
import MonthView from './views/MonthView'
import WeekView from './views/WeekView'
import DayView from './views/DayView'
import AgendaView from './views/AgendaView'

export default function CalendarGrid({ 
  currentDate, 
  currentView, 
  calendarItems,
  onDateClick,
  onEventClick
}) {
  // Render view based on currentView prop
  const renderView = () => {
    switch(currentView) {
      case 'month':
        return (
          <MonthView 
            currentDate={currentDate}
            calendarItems={calendarItems}
            onDateClick={onDateClick}
            onEventClick={onEventClick}
          />
        )
      case 'week':
        return (
          <WeekView 
            currentDate={currentDate}
            calendarItems={calendarItems}
            onDateClick={onDateClick}
            onEventClick={onEventClick}
          />
        )
      case 'day':
        return (
          <DayView 
            currentDate={currentDate}
            calendarItems={calendarItems}
            onDateClick={onDateClick}
            onEventClick={onEventClick}
          />
        )
      case 'agenda':
        return (
          <AgendaView 
            currentDate={currentDate}
            calendarItems={calendarItems}
            onEventClick={onEventClick}
          />
        )
      default:
        return (
          <MonthView 
            currentDate={currentDate}
            calendarItems={calendarItems}
            onDateClick={onDateClick}
            onEventClick={onEventClick}
          />
        )
    }
  }
  
  return (
    <div className="w-full h-full">
      {renderView()}
    </div>
  )
} 