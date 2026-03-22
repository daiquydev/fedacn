import React from 'react'
import {
  FaCalendarAlt,
  FaClock,
  FaUtensils,
  FaTrophy,
  FaMapMarkerAlt,
  FaRegCalendarCheck,
  FaArrowRight,
  FaAppleAlt,
  FaBookOpen,
  FaListUl,
  FaDumbbell,
  FaRunning,
  FaUsers,
  FaTag,
  FaMedal,
} from 'react-icons/fa'
import { MdSportsSoccer, MdClose, MdOutlineTimer, MdLocalDining, MdFitnessCenter } from 'react-icons/md'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Link, useNavigate } from 'react-router-dom'

export default function EventDetails({ event, onClose }) {
  const navigate = useNavigate()
  const startDate = new Date(event.startDate)
  const endDate = event.endDate ? new Date(event.endDate) : null

  const formatDate = (date) => format(date, 'EEEE, dd MMMM yyyy', { locale: vi })
  const formatTime = (date) => format(date, 'HH:mm', { locale: vi })

  const getEventIcon = () => {
    switch (event.type) {
      case 'event':
        return <MdSportsSoccer size={28} className="text-blue-500 dark:text-blue-400" />
      case 'challenge':
        return <FaTrophy size={28} className="text-green-500 dark:text-green-400" />
      case 'mealPlan':
        return <FaUtensils size={28} className="text-orange-500 dark:text-orange-400" />
      case 'workout':
        return <FaDumbbell size={28} className="text-purple-500 dark:text-purple-400" />
      default:
        return <FaCalendarAlt size={28} className="text-gray-500 dark:text-gray-400" />
    }
  }

  const getBannerColor = () => {
    switch (event.type) {
      case 'event':
        return 'bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700'
      case 'challenge':
        return 'bg-gradient-to-r from-green-500 to-green-600 dark:from-green-600 dark:to-green-700'
      case 'mealPlan':
        return 'bg-gradient-to-r from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700'
      case 'workout':
        return 'bg-gradient-to-r from-purple-600 to-violet-500 dark:from-purple-700 dark:to-violet-600'
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 dark:from-gray-600 dark:to-gray-700'
    }
  }

  const getBodyColor = () => {
    switch (event.type) {
      case 'event':
        return 'bg-blue-50 dark:bg-gray-800'
      case 'challenge':
        return 'bg-green-50 dark:bg-gray-800'
      case 'mealPlan':
        return 'bg-orange-50 dark:bg-gray-800'
      case 'workout':
        return 'bg-purple-50 dark:bg-gray-800'
      default:
        return 'bg-gray-50 dark:bg-gray-800'
    }
  }

  const getEventTypeTitle = () => {
    switch (event.type) {
      case 'event':
        return event.category ? `Sự kiện thể thao · ${event.category}` : 'Sự kiện thể thao'
      case 'challenge':
        return 'Thử thách'
      case 'mealPlan':
        return event.mealType ? `Bữa ${event.mealType}` : 'Thực đơn'
      case 'workout':
        return 'Buổi tập luyện'
      default:
        return 'Sự kiện'
    }
  }

  const getEventLink = () => {
    if (event.type === 'mealPlan') return '/meal-plan/active'
    if (event.type === 'challenge') return `/challenge/${event.id}`
    if (event.type === 'event') return `/sport-event/${event.id}`
    if (event.type === 'workout') return '/challenge'
    return '#'
  }

  const handleStartWorkout = () => {
    onClose()
    navigate('/challenge', { state: { fromWorkoutCalendar: true, workout_id: event.workout_id } })
  }

  const getStatusLabel = (status) => {
    if (status === 'ongoing') return 'Đang diễn ra'
    if (status === 'completed') return 'Đã kết thúc'
    return 'Sắp diễn ra'
  }

  const getStatusClass = (status) => {
    if (status === 'ongoing') return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200'
    if (status === 'completed') return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200'
  }

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

        {/* Banner */}
        <div className={`${getBannerColor()} text-white`}>
          {/* Sport event: show image banner if available */}
          {event.type === 'event' && event.image && (
            <div className="relative h-40 overflow-hidden">
              <img src={event.image} alt={event.title} className="w-full h-full object-cover opacity-70" />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-700/80 to-transparent" />
              <button onClick={onClose} className="absolute top-3 right-3 p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors" aria-label="Đóng">
                <MdClose size={20} className="text-white" />
              </button>
              <div className="absolute bottom-3 left-4 right-14 flex items-center gap-3">
                {getEventIcon()}
                <div>
                  <div className="text-xs font-medium text-white/90">{getEventTypeTitle()}</div>
                  <h2 className="text-xl font-bold leading-tight">{event.title}</h2>
                </div>
              </div>
            </div>
          )}

          {/* Default banner for non-image events */}
          {!(event.type === 'event' && event.image) && (
            <div className="flex justify-between items-start p-6">
              <div className="flex items-center gap-3">
                {getEventIcon()}
                <div>
                  <div className="text-sm font-medium text-white/90 mb-1">{getEventTypeTitle()}</div>
                  <h2 className="text-2xl font-bold">{event.title}</h2>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors" aria-label="Đóng">
                <MdClose size={20} className="text-white" />
              </button>
            </div>
          )}
        </div>

        {/* Body */}
        <div className={`${getBodyColor()} p-6 overflow-y-auto flex-1`}>
          <div className="space-y-4">

            {/* Date */}
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

            {/* Time */}
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

            {/* Location */}
            {event.location && (
              <div className="flex items-start gap-3">
                <FaMapMarkerAlt className="text-gray-500 dark:text-gray-400 mt-1 w-5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">Địa điểm</p>
                  <p className="text-gray-600 dark:text-gray-400">{event.location}</p>
                </div>
              </div>
            )}

            {/* Status */}
            {event.status && (
              <div className="flex items-start gap-3">
                <FaRegCalendarCheck className="text-gray-500 dark:text-gray-400 mt-1 w-5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">Trạng thái</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(event.status)}`}>
                    {getStatusLabel(event.status)}
                  </span>
                </div>
              </div>
            )}

            {/* ---- Sport event specific section ---- */}
            {event.type === 'event' && (
              <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                {/* Event type badge */}
                <div className="flex items-center gap-3">
                  <FaTag className="text-blue-500 dark:text-blue-400 mt-0.5 w-5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300">Loại sự kiện</p>
                    <span className={`inline-block px-2 py-0.5 rounded text-sm font-medium ${event.eventType === 'Trong nhà'
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                        : 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      }`}>
                      {event.eventType === 'Trong nhà' ? '🏠 Trong nhà' : '🌿 Ngoài trời'}
                    </span>
                  </div>
                </div>

                {/* Participants */}
                {event.maxParticipants > 0 && (
                  <div className="flex items-start gap-3">
                    <FaUsers className="text-blue-500 dark:text-blue-400 mt-1 w-5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-700 dark:text-gray-300">Người tham gia</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-gray-600 dark:text-gray-400">{event.participants}/{event.maxParticipants} người</span>
                        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{ width: `${Math.min((event.participants / event.maxParticipants) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Organizer */}
                {event.organizer && (
                  <div className="flex items-start gap-3">
                    <FaMedal className="text-blue-500 dark:text-blue-400 mt-1 w-5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-700 dark:text-gray-300">Ban tổ chức</p>
                      <p className="text-gray-600 dark:text-gray-400">{event.organizer}</p>
                    </div>
                  </div>
                )}

                {/* Description */}
                {event.description && (
                  <div className="mt-3 p-4 bg-white dark:bg-gray-900 rounded-lg border border-blue-100 dark:border-blue-900/30">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">Mô tả</p>
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed line-clamp-4">{event.description}</p>
                  </div>
                )}

                {/* Joined badge */}
                {event.isJoined && (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-medium">
                    ✅ Bạn đã tham gia sự kiện này
                  </div>
                )}
              </div>
            )}

            {/* ---- Meal plan section ---- */}
            {event.type === 'mealPlan' && (
              <>
                {event.mealPlanTitle && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Thuộc thực đơn</p>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">{event.mealPlanTitle}</p>
                  </div>
                )}
                <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-4">
                    <MdLocalDining size={22} className="text-orange-500 dark:text-orange-400" />
                    <p className="font-semibold text-gray-800 dark:text-gray-200 text-lg">Chi tiết bữa ăn</p>
                  </div>

                  {event.foods && event.foods.length > 0 ? (
                    <div className="space-y-6">
                      {event.foods.map((food, index) => (
                        <div
                          key={`${food.name || 'food'}-${index}`}
                          className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-gray-800 dark:text-gray-100">{food.name}</p>
                              {food.mealType && <p className="text-sm text-gray-500 dark:text-gray-400">{food.mealType}</p>}
                            </div>
                            {food.calories && (
                              <span className="text-sm font-medium text-orange-600 dark:text-orange-400">{food.calories} kcal</span>
                            )}
                          </div>
                          {food.benefits && food.benefits.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1">
                              {food.benefits.map((benefit, idx) => (
                                <span key={idx} className="bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded text-xs text-green-700 dark:text-green-300">
                                  {benefit}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg text-center">
                      <FaAppleAlt className="w-10 h-10 text-orange-400 mx-auto mb-2" />
                      <p className="text-gray-600 dark:text-gray-300">Chưa có thông tin chi tiết</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ---- Workout detail section ---- */}
            {event.type === 'workout' && (
              <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                  <MdFitnessCenter size={22} className="text-purple-500 dark:text-purple-400" />
                  <p className="font-semibold text-gray-800 dark:text-gray-200 text-lg">Bài tập trong buổi</p>
                </div>

                {event.exercises && event.exercises.length > 0 ? (
                  <div className="space-y-3">
                    {event.exercises.map((ex, index) => (
                      <div
                        key={index}
                        className="p-4 rounded-lg border border-purple-100 dark:border-purple-900/30 bg-white dark:bg-gray-900 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-gray-800 dark:text-gray-100">
                            {ex.exercise_name_vi || ex.exercise_name}
                          </p>
                          <span className="text-xs font-medium text-purple-600 dark:text-purple-400 whitespace-nowrap">
                            {ex.sets?.length || 0} set
                          </span>
                        </div>
                        {ex.sets && ex.sets.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {ex.sets.map((s, si) => (
                              <span key={si} className="bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded text-xs text-purple-700 dark:text-purple-300">
                                Set {s.set_number}: {s.reps} reps × {s.weight} kg
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center">
                    <FaDumbbell className="w-10 h-10 text-purple-400 mx-auto mb-2" />
                    <p className="text-gray-600 dark:text-gray-300">Chưa có chi tiết bài tập</p>
                  </div>
                )}

                {event.reminder && (
                  <p className="mt-3 text-sm text-purple-600 dark:text-purple-400">🔔 Nhắc nhở đã bật</p>
                )}
              </div>
            )}

            {/* Description for non-sport, non-workout */}
            {event.description && event.type !== 'workout' && event.type !== 'mealPlan' && event.type !== 'event' && (
              <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">Mô tả</p>
                <p className="text-gray-600 dark:text-gray-400">{event.description}</p>
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="mt-6 flex justify-between items-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">Nhấn đóng để quay lại lịch</div>
            {event.type === 'workout' ? (
              <button
                onClick={handleStartWorkout}
                className="px-4 py-2 font-medium rounded-lg transition-colors bg-gradient-to-r from-purple-600 to-violet-500 text-white shadow-md hover:shadow-lg hover:from-purple-700 hover:to-violet-600 flex items-center gap-2"
              >
                <FaRunning size={16} />
                Tập ngay
              </button>
            ) : (
              <Link
                to={getEventLink()}
                onClick={onClose}
                className="px-4 py-2 font-medium rounded-lg transition-colors bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md hover:shadow-lg hover:from-blue-600 hover:to-indigo-600 flex items-center gap-2"
              >
                <FaArrowRight size={14} />
                {event.type === 'event' ? 'Xem sự kiện' : 'Xem chi tiết'}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
