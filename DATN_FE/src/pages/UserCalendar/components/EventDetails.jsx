import React from 'react'
import { FaCalendarAlt, FaClock, FaUtensils, FaTrophy, FaMapMarkerAlt } from 'react-icons/fa'
import { MdSportsSoccer, MdClose } from 'react-icons/md'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Link } from 'react-router-dom'

export default function EventDetails({ event, onClose }) {
  const startDate = new Date(event.startDate)
  const endDate = event.endDate ? new Date(event.endDate) : null
  
  // Format dates for display
  const formatDate = (date) => {
    return format(date, 'EEEE, dd MMMM yyyy', { locale: vi })
  }
  
  // Format time for display
  const formatTime = (date) => {
    return format(date, 'HH:mm', { locale: vi })
  }
  
  // Get icon based on event type
  const getEventIcon = () => {
    switch(event.type) {
      case 'event':
        return <MdSportsSoccer size={24} className="text-blue-500" />
      case 'challenge':
        return <FaTrophy size={24} className="text-green-500" />
      case 'mealPlan':
        return <FaUtensils size={24} className="text-orange-500" />
      default:
        return <FaCalendarAlt size={24} className="text-gray-500" />
    }
  }
  
  // Get color based on event type
  const getBgColor = () => {
    switch(event.type) {
      case 'event':
        return 'bg-blue-50 dark:bg-blue-900'
      case 'challenge':
        return 'bg-green-50 dark:bg-green-900'
      case 'mealPlan':
        return 'bg-orange-50 dark:bg-orange-900'
      default:
        return 'bg-gray-50 dark:bg-gray-800'
    }
  }
  
  // Get link based on event type
  const getEventLink = () => {
    switch(event.type) {
      case 'event':
        return `/sport-event/${event.id}`
      case 'challenge':
        return `/challenge/${event.id}`
      case 'mealPlan':
        if (event.mealType) {
          return `/schedule/eat-schedule/day/${format(startDate, 'yyyy-MM-dd')}`
        }
        return `/meal-plan/${event.id}`
      default:
        return '#'
    }
  }
  
  // Get title based on event type
  const getEventTypeTitle = () => {
    switch(event.type) {
      case 'event':
        return 'Sự kiện thể thao'
      case 'challenge':
        return 'Thử thách'
      case 'mealPlan':
        return event.mealType ? `Bữa ${event.mealType}` : 'Thực đơn'
      default:
        return 'Sự kiện'
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-lg bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden ${getBgColor()}`}>
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-bold flex items-center gap-2">
            {getEventIcon()}
            {getEventTypeTitle()}
          </h3>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <MdClose size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">{event.title}</h2>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <FaCalendarAlt className="text-gray-500 mt-1" />
              <div>
                <p className="font-medium">Thời gian</p>
                <p>{formatDate(startDate)}</p>
                {endDate && startDate.toDateString() !== endDate.toDateString() && (
                  <p>đến {formatDate(endDate)}</p>
                )}
              </div>
            </div>
            
            {event.startTime && (
              <div className="flex items-start gap-3">
                <FaClock className="text-gray-500 mt-1" />
                <div>
                  <p className="font-medium">Giờ</p>
                  <p>
                    {formatTime(new Date(`${startDate.toDateString()} ${event.startTime}`))}
                    {event.endTime && ` - ${formatTime(new Date(`${startDate.toDateString()} ${event.endTime}`))}`}
                  </p>
                </div>
              </div>
            )}
            
            {event.location && (
              <div className="flex items-start gap-3">
                <FaMapMarkerAlt className="text-gray-500 mt-1" />
                <div>
                  <p className="font-medium">Địa điểm</p>
                  <p>{event.location}</p>
                </div>
              </div>
            )}
            
            {event.description && (
              <div className="mt-4">
                <p className="font-medium mb-2">Mô tả</p>
                <p className="text-gray-700 dark:text-gray-300">{event.description}</p>
              </div>
            )}
            
            {event.status && (
              <div className="mt-4">
                <p className="font-medium mb-2">Trạng thái</p>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  event.status === 'ongoing' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' 
                    : event.status === 'completed'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                }`}>
                  {event.status === 'ongoing' 
                    ? 'Đang diễn ra' 
                    : event.status === 'completed' 
                      ? 'Đã hoàn thành' 
                      : 'Sắp diễn ra'}
                </span>
              </div>
            )}
            
            {event.type === 'mealPlan' && event.foods && (
              <div className="mt-4">
                <p className="font-medium mb-2">Thực đơn</p>
                <ul className="list-disc pl-5 space-y-1">
                  {event.foods.map((food, index) => (
                    <li key={index}>
                      {food.name}
                      {food.calories && <span className="text-sm text-gray-500 ml-2">({food.calories} kcal)</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className="mt-6 flex justify-end">
            <Link 
              to={getEventLink()}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            >
              Xem chi tiết
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 