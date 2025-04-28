import React from 'react'
import { FaCalendarAlt, FaClock, FaUtensils, FaTrophy, FaMapMarkerAlt, FaRegCalendarCheck } from 'react-icons/fa'
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
        return <MdSportsSoccer size={28} className="text-blue-500 dark:text-blue-400" />
      case 'challenge':
        return <FaTrophy size={28} className="text-green-500 dark:text-green-400" />
      case 'mealPlan':
        return <FaUtensils size={28} className="text-orange-500 dark:text-orange-400" />
      default:
        return <FaCalendarAlt size={28} className="text-gray-500 dark:text-gray-400" />
    }
  }
  
  // Get banner color based on event type
  const getBannerColor = () => {
    switch(event.type) {
      case 'event':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700'
      case 'challenge':
        return 'bg-gradient-to-r from-green-500 to-green-600 dark:from-green-600 dark:to-green-700'
      case 'mealPlan':
        return 'bg-gradient-to-r from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700'
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 dark:from-gray-600 dark:to-gray-700'
    }
  }
  
  // Get body color based on event type
  const getBodyColor = () => {
    switch(event.type) {
      case 'event':
        return 'bg-blue-50 dark:bg-gray-800'
      case 'challenge':
        return 'bg-green-50 dark:bg-gray-800'
      case 'mealPlan':
        return 'bg-orange-50 dark:bg-gray-800'
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
    <div className="fixed inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
        <div className={`${getBannerColor()} text-white p-6`}>
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              {getEventIcon()}
              <div>
                <div className="text-sm font-medium text-white/90 mb-1">{getEventTypeTitle()}</div>
                <h2 className="text-2xl font-bold">{event.title}</h2>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              aria-label="Đóng"
            >
              <MdClose size={20} className="text-white" />
            </button>
          </div>
        </div>
        
        <div className={`p-6 ${getBodyColor()}`}>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <FaCalendarAlt className="text-gray-500 dark:text-gray-400 mt-1 w-5" />
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-300">Thời gian</p>
                <p className="text-gray-600 dark:text-gray-400">{formatDate(startDate)}</p>
                {endDate && startDate.toDateString() !== endDate.toDateString() && (
                  <p className="text-gray-600 dark:text-gray-400">đến {formatDate(endDate)}</p>
                )}
              </div>
            </div>
            
            {event.startTime && (
              <div className="flex items-start gap-3">
                <FaClock className="text-gray-500 dark:text-gray-400 mt-1 w-5" />
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">Giờ</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    {formatTime(new Date(`${startDate.toDateString()} ${event.startTime}`))}
                    {event.endTime && ` - ${formatTime(new Date(`${startDate.toDateString()} ${event.endTime}`))}`}
                  </p>
                </div>
              </div>
            )}
            
            {event.location && (
              <div className="flex items-start gap-3">
                <FaMapMarkerAlt className="text-gray-500 dark:text-gray-400 mt-1 w-5" />
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">Địa điểm</p>
                  <p className="text-gray-600 dark:text-gray-400">{event.location}</p>
                </div>
              </div>
            )}
            
            {event.status && (
              <div className="flex items-start gap-3">
                <FaRegCalendarCheck className="text-gray-500 dark:text-gray-400 mt-1 w-5" />
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">Trạng thái</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    event.status === 'ongoing' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200' 
                      : event.status === 'completed'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200'
                  }`}>
                    {event.status === 'ongoing' 
                      ? 'Đang diễn ra' 
                      : event.status === 'completed' 
                        ? 'Đã hoàn thành' 
                        : 'Sắp diễn ra'}
                  </span>
                </div>
              </div>
            )}
            
            {event.description && (
              <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">Mô tả</p>
                <p className="text-gray-600 dark:text-gray-400">{event.description}</p>
              </div>
            )}
            
            {event.type === 'mealPlan' && event.foods && (
              <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">Thực đơn</p>
                <ul className="space-y-2">
                  {event.foods.map((food, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                      <span>
                        {food.name}
                        {food.calories && <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">({food.calories} kcal)</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className="mt-6 flex justify-end">
            <Link 
              to={getEventLink()}
              className="px-4 py-2 font-medium rounded-lg transition-colors
                bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md hover:shadow-lg hover:from-green-600 hover:to-green-700"
            >
              Xem chi tiết
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 