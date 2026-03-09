import React from 'react'
import { FaChevronLeft, FaChevronRight, FaCalendarAlt, FaList, FaDumbbell } from 'react-icons/fa'
import { BsFillCalendarWeekFill, BsFillCalendarDayFill } from 'react-icons/bs'
import { FaUtensils, FaTrophy } from 'react-icons/fa'
import { MdSportsSoccer } from 'react-icons/md'

const formatDate = (date, view) => {
  const options = { year: 'numeric' }
  if (view === 'month') {
    options.month = 'long'
    return date.toLocaleDateString('vi-VN', options)
  } else if (view === 'week') {
    const start = new Date(date)
    const end = new Date(date)
    start.setDate(date.getDate() - date.getDay())
    end.setDate(date.getDate() - date.getDay() + 6)
    return `${start.getDate()} - ${end.getDate()} ${start.toLocaleDateString('vi-VN', { month: 'long' })} ${start.getFullYear()}`
  } else if (view === 'day') {
    options.month = 'long'
    options.day = 'numeric'
    return date.toLocaleDateString('vi-VN', options)
  }
}

export default function CalendarHeader({
  currentDate,
  currentView,
  onPrevious,
  onNext,
  onToday,
  onChangeView,
  filters,
  onFilterChange
}) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pb-4">
      <div className="flex items-center gap-2">
        <button
          onClick={onPrevious}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <FaChevronLeft className="text-gray-600 dark:text-gray-300" />
        </button>

        <button
          onClick={onToday}
          className="px-4 py-2 rounded-md bg-green-500 text-white hover:bg-green-600 transition-colors"
        >
          Hôm nay
        </button>

        <button
          onClick={onNext}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <FaChevronRight className="text-gray-600 dark:text-gray-300" />
        </button>

        <h2 className="text-xl font-bold ml-2">
          {formatDate(currentDate, currentView)}
        </h2>
      </div>

      <div className="flex gap-4">
        <div className="flex items-center gap-2 mr-4 flex-wrap">
          <button
            onClick={() => onFilterChange('events')}
            className={`flex items-center gap-1 px-3 py-1 rounded-md ${filters.events
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100'
              : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
              }`}
          >
            <MdSportsSoccer size={16} />
            <span>Sự kiện</span>
          </button>

          {/* Thử thách đã bị ẩn */}

          {/* Thực đơn đã bị ẩn */}

          <button
            onClick={() => onFilterChange('workouts')}
            className={`flex items-center gap-1 px-3 py-1 rounded-md ${filters.workouts
              ? 'bg-purple-100 text-purple-700 dark:bg-purple-700 dark:text-purple-100'
              : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
              }`}
          >
            <FaDumbbell size={16} />
            <span>Tập luyện</span>
          </button>
        </div>

        <div className="flex border rounded-md overflow-hidden">
          <button
            onClick={() => onChangeView('month')}
            className={`px-3 py-2 flex items-center gap-1 ${currentView === 'month'
              ? 'bg-green-500 text-white'
              : 'bg-white dark:bg-gray-800 dark:text-gray-300'
              }`}
          >
            <FaCalendarAlt size={14} />
            <span>Tháng</span>
          </button>

          <button
            onClick={() => onChangeView('week')}
            className={`px-3 py-2 flex items-center gap-1 ${currentView === 'week'
              ? 'bg-green-500 text-white'
              : 'bg-white dark:bg-gray-800 dark:text-gray-300'
              }`}
          >
            <BsFillCalendarWeekFill size={14} />
            <span>Tuần</span>
          </button>

          <button
            onClick={() => onChangeView('day')}
            className={`px-3 py-2 flex items-center gap-1 ${currentView === 'day'
              ? 'bg-green-500 text-white'
              : 'bg-white dark:bg-gray-800 dark:text-gray-300'
              }`}
          >
            <BsFillCalendarDayFill size={14} />
            <span>Ngày</span>
          </button>

          <button
            onClick={() => onChangeView('agenda')}
            className={`px-3 py-2 flex items-center gap-1 ${currentView === 'agenda'
              ? 'bg-green-500 text-white'
              : 'bg-white dark:bg-gray-800 dark:text-gray-300'
              }`}
          >
            <FaList size={14} />
            <span>Danh sách</span>
          </button>
        </div>
      </div>
    </div>
  )
}