import React from 'react'
import { FaCalendarAlt, FaClock, FaUtensils, FaTrophy, FaMapMarkerAlt, FaRegCalendarCheck, FaArrowRight, FaFire, FaAppleAlt, FaBookOpen, FaListUl } from 'react-icons/fa'
import { MdSportsSoccer, MdClose, MdRestaurant, MdOutlineTimer, MdLocalDining, MdOutlineFoodBank } from 'react-icons/md'
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

  // Lấy thông tin chi tiết về món ăn
  const getMealDetails = (food) => {
    // Trả về dữ liệu trực tiếp từ food object nếu có đầy đủ thông tin
    if (food.ingredients && food.instructions && food.time && food.nutrition && food.benefits) {
      return food;
    }
    return null;
  };
  
  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
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
        
        <div className={`p-6 ${getBodyColor()} overflow-y-auto`}>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <FaCalendarAlt className="text-gray-500 dark:text-gray-400 mt-1 w-5 flex-shrink-0" />
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
                <FaClock className="text-gray-500 dark:text-gray-400 mt-1 w-5 flex-shrink-0" />
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
                <FaMapMarkerAlt className="text-gray-500 dark:text-gray-400 mt-1 w-5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">Địa điểm</p>
                  <p className="text-gray-600 dark:text-gray-400">{event.location}</p>
                </div>
              </div>
            )}
            
            {event.status && (
              <div className="flex items-start gap-3">
                <FaRegCalendarCheck className="text-gray-500 dark:text-gray-400 mt-1 w-5 flex-shrink-0" />
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
            
            {event.type === 'mealPlan' && (
              <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                  <MdLocalDining size={22} className="text-orange-500 dark:text-orange-400" />
                  <p className="font-semibold text-gray-800 dark:text-gray-200 text-lg">Chi tiết bữa ăn</p>
                </div>
                
                {event.foods && event.foods.length > 0 ? (
                  <div className="space-y-6">
                    {event.foods.map((food, index) => {
                      const mealDetails = getMealDetails(food);
                      return (
                        <div key={index} className="bg-white dark:bg-gray-700 rounded-lg shadow-sm p-4 border border-orange-100 dark:border-orange-900/30">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <MdRestaurant className="text-orange-500 text-lg" />
                              <h4 className="font-medium text-gray-800 dark:text-white">{food.name}</h4>
                            </div>
                            {food.calories && (
                              <div className="flex items-center gap-1 bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded text-xs font-medium text-orange-700 dark:text-orange-200">
                                <FaFire className="text-orange-600 dark:text-orange-400" />
                                <span>{food.calories} kcal</span>
                              </div>
                            )}
                          </div>
                          
                          {food.ingredients && food.instructions && food.time && food.nutrition ? (
                            <div className="space-y-3 pl-1 border-l-2 border-orange-200 dark:border-orange-700">
                              {/* Thời gian chế biến */}
                              <div className="flex items-center gap-2 text-sm">
                                <MdOutlineTimer className="text-gray-500 dark:text-gray-400" />
                                <span className="text-gray-600 dark:text-gray-300">Thời gian chuẩn bị: {food.time}</span>
                              </div>
                              
                              {/* Thông tin dinh dưỡng */}
                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded flex flex-col items-center">
                                  <span className="text-gray-600 dark:text-gray-400">Protein</span>
                                  <span className="font-bold text-green-600 dark:text-green-400">{food.nutrition.protein}</span>
                                </div>
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded flex flex-col items-center">
                                  <span className="text-gray-600 dark:text-gray-400">Carbs</span>
                                  <span className="font-bold text-blue-600 dark:text-blue-400">{food.nutrition.carbs}</span>
                                </div>
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded flex flex-col items-center">
                                  <span className="text-gray-600 dark:text-gray-400">Chất béo</span>
                                  <span className="font-bold text-yellow-600 dark:text-yellow-400">{food.nutrition.fat}</span>
                                </div>
                              </div>
                              
                              {/* Lợi ích sức khỏe */}
                              {food.benefits && (
                                <div>
                                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lợi ích:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {food.benefits.map((benefit, idx) => (
                                      <span key={idx} className="bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded text-xs text-green-700 dark:text-green-300">
                                        {benefit}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Nguyên liệu */}
                              <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                                  <FaListUl className="text-orange-500 dark:text-orange-400" size={12} />
                                  Nguyên liệu:
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {food.ingredients.map((ingredient, idx) => (
                                    <span key={idx} className="bg-orange-50 dark:bg-orange-900/30 px-2 py-0.5 rounded text-xs text-orange-700 dark:text-orange-300">
                                      {ingredient}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              
                              {/* Hướng dẫn nấu ăn */}
                              <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                                  <MdOutlineFoodBank className="text-orange-500 dark:text-orange-400" size={14} />
                                  Cách làm:
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 pl-1">{food.instructions}</p>
                              </div>
                              
                              {/* Nút xem công thức chi tiết */}
                              <div className="flex justify-end">
                                <Link 
                                  to={`/recipes/${food.name.replace(/\s+/g, '-').toLowerCase()}`}
                                  className="flex items-center text-xs text-orange-600 dark:text-orange-400 hover:underline"
                                >
                                  <FaBookOpen className="mr-1" /> Xem công thức chi tiết
                                </Link>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                              Không có thông tin chi tiết cho món ăn này
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : event.mealPlans && event.mealPlans.length > 0 ? (
                  <div className="space-y-6">
                    {/* Hiển thị chi tiết kế hoạch thực đơn nhiều ngày */}
                    {event.mealPlans.map((dayPlan, dayIndex) => (
                      <div key={dayIndex} className="bg-white dark:bg-gray-700 rounded-lg shadow-sm overflow-hidden border border-orange-100 dark:border-orange-900/30">
                        <div className="bg-orange-100 dark:bg-orange-900/40 p-3">
                          <h3 className="font-medium text-orange-800 dark:text-orange-200">{dayPlan.day}</h3>
                        </div>
                        
                        <div className="divide-y divide-orange-100 dark:divide-orange-900/30">
                          {dayPlan.meals.map((meal, mealIndex) => (
                            <div key={mealIndex} className="p-4">
                              <div className="font-medium text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                                <MdLocalDining className="text-orange-500" />
                                <span>Bữa {meal.mealType}</span>
                              </div>
                              
                              {meal.foods && meal.foods.length > 0 ? (
                                <div className="pl-4 space-y-4">
                                  {meal.foods.map((food, foodIndex) => (
                                    <div key={foodIndex} className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          <MdRestaurant className="text-orange-500 text-sm" />
                                          <h4 className="font-medium text-gray-800 dark:text-white text-sm">{food.name}</h4>
                                        </div>
                                        {food.calories && (
                                          <div className="flex items-center gap-1 bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded text-xs font-medium text-orange-700 dark:text-orange-200">
                                            <FaFire className="text-orange-600 dark:text-orange-400" />
                                            <span>{food.calories} kcal</span>
                                          </div>
                                        )}
                                      </div>
                                      
                                      {food.ingredients && food.instructions ? (
                                        <div className="mt-2 pl-2 border-l-2 border-orange-200 dark:border-orange-700 space-y-2 text-xs">
                                          <div className="flex items-center gap-1">
                                            <MdOutlineTimer className="text-gray-500 dark:text-gray-400" />
                                            <span className="text-gray-600 dark:text-gray-300">Thời gian: {food.time}</span>
                                          </div>
                                          
                                          {food.nutrition && (
                                            <div className="grid grid-cols-3 gap-1">
                                              <div className="bg-green-50 dark:bg-green-900/20 p-1 rounded flex items-center justify-center">
                                                <span className="text-green-600 dark:text-green-400">{food.nutrition.protein} prot</span>
                                              </div>
                                              <div className="bg-blue-50 dark:bg-blue-900/20 p-1 rounded flex items-center justify-center">
                                                <span className="text-blue-600 dark:text-blue-400">{food.nutrition.carbs} carb</span>
                                              </div>
                                              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-1 rounded flex items-center justify-center">
                                                <span className="text-yellow-600 dark:text-yellow-400">{food.nutrition.fat} fat</span>
                                              </div>
                                            </div>
                                          )}
                                          
                                          <div>
                                            <Link 
                                              to={`/recipes/${food.name.replace(/\s+/g, '-').toLowerCase()}`}
                                              className="text-orange-600 dark:text-orange-400 hover:underline text-xs"
                                            >
                                              Xem chi tiết
                                            </Link>
                                          </div>
                                        </div>
                                      ) : null}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400 italic pl-4">
                                  Không có thông tin món ăn
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg text-center">
                    <FaAppleAlt className="w-10 h-10 text-orange-400 mx-auto mb-2" />
                    <p className="text-gray-600 dark:text-gray-300">
                      Chưa có thông tin chi tiết về thực đơn này
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="mt-6 flex justify-end">
            <Link 
              to={getEventLink()}
              className="px-4 py-2 font-medium rounded-lg transition-colors
                bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md hover:shadow-lg hover:from-green-600 hover:to-green-700 flex items-center"
            >
              <FaArrowRight className="mr-1.5" /> Xem chi tiết
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 