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
    <div className="flex flex-wrap items-center gap-3 pb-3">
      {/* Left: Navigation */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={onPrevious}
          className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <FaChevronLeft className="text-gray-600 dark:text-gray-300 text-sm" />
        </button>

        <button
          onClick={onToday}
          className="px-3 py-1.5 rounded-md bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors"
        >
          Hôm nay
        </button>

        <button
          onClick={onNext}
          className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <FaChevronRight className="text-gray-600 dark:text-gray-300 text-sm" />
        </button>

        <h2 className="text-base font-bold ml-1 whitespace-nowrap">
          {formatDate(currentDate, currentView)}
        </h2>
      </div>

      {/* Center: Filters */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={() => onFilterChange('events')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-sm ${filters.events
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100'
            : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
            }`}
        >
          <MdSportsSoccer size={14} />
          <span>Sự kiện</span>
        </button>

        <button
          onClick={() => onFilterChange('workouts')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-sm ${filters.workouts
            ? 'bg-purple-100 text-purple-700 dark:bg-purple-700 dark:text-purple-100'
            : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
            }`}
        >
          <FaDumbbell size={14} />
          <span>Tập luyện</span>
        </button>
      </div>

      {/* Right: View tabs — horizontal scroll on mobile */}
      <div className="ml-auto overflow-x-auto flex-shrink-0 scrollbar-thin">
        <div className="flex border rounded-md overflow-hidden whitespace-nowrap">
          <button
            onClick={() => onChangeView('month')}
            className={`px-2.5 py-1.5 flex items-center gap-1 text-sm ${currentView === 'month'
              ? 'bg-green-500 text-white'
              : 'bg-white dark:bg-gray-800 dark:text-gray-300'
              }`}
          >
            <FaCalendarAlt size={12} />
            <span>Tháng</span>
          </button>

          <button
            onClick={() => onChangeView('week')}
            className={`px-2.5 py-1.5 flex items-center gap-1 text-sm ${currentView === 'week'
              ? 'bg-green-500 text-white'
              : 'bg-white dark:bg-gray-800 dark:text-gray-300'
              }`}
          >
            <BsFillCalendarWeekFill size={12} />
            <span>Tuần</span>
          </button>

          <button
            onClick={() => onChangeView('day')}
            className={`px-2.5 py-1.5 flex items-center gap-1 text-sm ${currentView === 'day'
              ? 'bg-green-500 text-white'
              : 'bg-white dark:bg-gray-800 dark:text-gray-300'
              }`}
          >
            <BsFillCalendarDayFill size={12} />
            <span>Ngày</span>
          </button>

          <button
            onClick={() => onChangeView('agenda')}
            className={`px-2.5 py-1.5 flex items-center gap-1 text-sm ${currentView === 'agenda'
              ? 'bg-green-500 text-white'
              : 'bg-white dark:bg-gray-800 dark:text-gray-300'
              }`}
          >
            <FaList size={12} />
            <span>Danh sách</span>
          </button>
        </div>
      </div>
    </div>
  )
}