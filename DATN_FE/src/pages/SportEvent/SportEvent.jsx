import React, { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  FaRunning, 
  FaCalendarAlt, 
  FaMapMarkerAlt, 
  FaUserFriends, 
  FaSearch, 
  FaTrophy, 
  FaBiking, 
  FaSwimmer, 
  FaDumbbell, 
  FaPlus 
} from 'react-icons/fa'
import { MdSportsSoccer, MdDirectionsWalk } from 'react-icons/md'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import SportEventCard from './components/SportEventCard'
import { getAllSportEvents, joinSportEvent } from '../../apis/sportEventApi'
import toast from 'react-hot-toast'

const SportEvent = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [eventType, setEventType] = useState('all') // all, online, offline
  const [sortBy, setSortBy] = useState('popular')

  // Fetch sport events with React Query
  const { 
    data: eventsData, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['sportEvents', { sortBy }],
    queryFn: () => getAllSportEvents({ page: 1, limit: 100, sortBy }),
    staleTime: 5 * 60 * 1000 // 5 minutes
  })

  const sportEvents = eventsData?.data?.result?.events || eventsData?.result?.events || []

  // Join event mutation
  const joinEventMutation = useMutation({
    mutationFn: (eventId) => joinSportEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries(['sportEvents'])
      toast.success('Đã tham gia sự kiện!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Không thể tham gia sự kiện')
    }
  })

  // Memoized filtered events
  const filteredEvents = useMemo(() => {
    let filtered = [...sportEvents]

    // Filter by search term
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (event) =>
          event.name?.toLowerCase().includes(search) ||
          event.description?.toLowerCase().includes(search) ||
          event.location?.toLowerCase().includes(search)
      )
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((event) => event.category === selectedCategory)
    }

    // Filter by event type
    if (eventType !== 'all') {
      filtered = filtered.filter((event) => event.eventType === eventType)
    }

    // Sort events
    if (sortBy === 'popular') {
      filtered.sort((a, b) => (b.participants || 0) - (a.participants || 0))
    } else if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    } else if (sortBy === 'soonest') {
      filtered.sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
    }

    return filtered
  }, [sportEvents, searchTerm, selectedCategory, eventType, sortBy])

  // Các danh mục thể thao
  const categories = [
    { id: 'all', name: 'Tất cả', icon: <MdSportsSoccer /> },
    { id: 'Chạy bộ', name: 'Chạy bộ', icon: <FaRunning /> },
    { id: 'Đạp xe', name: 'Đạp xe', icon: <FaBiking /> },
    { id: 'Bơi lội', name: 'Bơi lội', icon: <FaSwimmer /> },
    { id: 'Fitness', name: 'Fitness', icon: <FaDumbbell /> },
    { id: 'Yoga', name: 'Yoga', icon: <MdDirectionsWalk /> }
  ]

  const handleJoinEvent = (eventId) => {
    joinEventMutation.mutate(eventId)
  }

  // Skeleton loader
  const SkeletonCard = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700 animate-pulse">
      <div className="h-48 bg-gray-300 dark:bg-gray-700" />
      <div className="p-4">
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded mb-3 w-3/4" />
        <div className="space-y-2 mb-3">
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2" />
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-2/3" />
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2" />
        </div>
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-4" />
        <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded" />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">Sự kiện Thể thao</h1>
              <p className="text-red-100">
                Khám phá và tham gia các sự kiện thể thao hấp dẫn
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                to="/sport-event/my-events"
                className="bg-white text-red-600 hover:bg-red-50 px-6 py-3 rounded-lg font-semibold transition shadow-md flex items-center gap-2"
              >
                <FaTrophy />
                Sự kiện của tôi
              </Link>
              <Link
                to="/sport-event/create"
                className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-6 py-3 rounded-lg font-semibold transition shadow-md flex items-center gap-2"
              >
                <FaPlus />
                Tạo sự kiện mới
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          {/* Search and Sort */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            {/* Search */}
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm sự kiện..."
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-red-500 dark:focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Sort Dropdown */}
            <div className="w-full md:w-64">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="popular">📊 Phổ biến nhất</option>
                <option value="newest">🆕 Mới nhất</option>
                <option value="soonest">📅 Sắp diễn ra</option>
              </select>
            </div>
          </div>

          {/* Event Type Filter */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setEventType('all')}
              className={`px-4 py-2 rounded-full font-medium transition ${
                eventType === 'all'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setEventType('online')}
              className={`px-4 py-2 rounded-full font-medium transition ${
                eventType === 'online'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              🌐 Trực tuyến
            </button>
            <button
              onClick={() => setEventType('offline')}
              className={`px-4 py-2 rounded-full font-medium transition ${
                eventType === 'offline'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              📍 Trực tiếp
            </button>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                className={`flex items-center px-4 py-2 rounded-full font-medium transition ${
                  selectedCategory === category.id
                    ? 'bg-red-500 text-white shadow-md'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
                onClick={() => setSelectedCategory(category.id)}
              >
                <span className="mr-2">{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="container mx-auto px-4 py-8">
        {/* Results Count */}
        {!isLoading && (
          <div className="mb-6 text-gray-600 dark:text-gray-400">
            Tìm thấy <span className="font-semibold text-gray-900 dark:text-white">{filteredEvents.length}</span> sự kiện
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : error ? (
          /* Error State */
          <div className="text-center py-16">
            <div className="text-red-500 text-5xl mb-4">❌</div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
              Không thể tải danh sách sự kiện
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error?.message || 'Vui lòng thử lại sau'}
            </p>
            <button
              onClick={() => queryClient.invalidateQueries(['sportEvents'])}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              Thử lại
            </button>
          </div>
        ) : filteredEvents.length > 0 ? (
          /* Events Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <SportEventCard 
                key={event._id || event.id} 
                event={event}
                onJoin={handleJoinEvent}
                isJoining={joinEventMutation.isPending && joinEventMutation.variables === (event._id || event.id)}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16">
            <MdSportsSoccer className="mx-auto text-gray-400 text-6xl mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
              Không tìm thấy sự kiện phù hợp
            </h3>
            <p className="text-gray-500 dark:text-gray-500 mb-6">
              Hãy thử điều chỉnh bộ lọc hoặc tìm kiếm với từ khóa khác
            </p>
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('all')
                setEventType('all')
              }}
              className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg font-semibold transition"
            >
              Xóa bộ lọc
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default SportEvent
