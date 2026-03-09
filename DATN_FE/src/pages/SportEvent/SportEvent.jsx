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
import sportCategoryApi from '../../apis/sportCategoryApi'
import { currentAccount } from '../../apis/userApi'
import toast from 'react-hot-toast'

const SportEvent = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [eventType, setEventType] = useState('all') // all, Ngoài trời, Trong nhà
  const [sortBy, setSortBy] = useState('popular')

  // Fetch sport events with React Query
  const {
    data: eventsData,
    isLoading,
    error
  } = useQuery({
    queryKey: ['sportEvents', { sortBy }],
    queryFn: () => getAllSportEvents({ page: 1, limit: 100, sortBy }),
    staleTime: 1000
  })

  const sportEvents = eventsData?.data?.result?.events || eventsData?.result?.events || []

  // Fetch current user's social graph
  const { data: meData } = useQuery({
    queryKey: ['me'],
    queryFn: currentAccount,
    staleTime: 1000
  })

  const me = meData?.data?.result?.[0]
  const myFollowers = useMemo(() => me?.followers || [], [me])
  const myFollowings = useMemo(() => me?.followings || [], [me])
  const followerIds = useMemo(() => new Set(myFollowers.map(p => String(p._id))), [myFollowers])
  const followingIds = useMemo(() => new Set(myFollowings.map(p => String(p._id))), [myFollowings])

  // Friends = mutual follow
  const myFriends = useMemo(
    () => myFollowers.filter(p => followingIds.has(String(p._id))),
    [myFollowers, followingIds]
  )
  const friendIds = useMemo(() => new Set(myFriends.map(p => String(p._id))), [myFriends])
  const connectedIds = useMemo(() => new Set([...followerIds, ...followingIds]), [followerIds, followingIds])

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

  // Fetch sport categories
  const { data: categoriesData } = useQuery({
    queryKey: ['sportCategories'],
    queryFn: () => sportCategoryApi.getAll(),
    staleTime: 1000
  })

  // Dynamic categories from DB
  const dbCategories = categoriesData?.data?.result || []

  // Custom Icon Mapping if needed (optional)
  const getIconForCategory = (name) => {
    switch (name?.toLowerCase()) {
      case 'chạy bộ': return <FaRunning />
      case 'đạp xe': return <FaBiking />
      case 'bơi lội': return <FaSwimmer />
      case 'fitness': return <FaDumbbell />
      case 'yoga': return <MdDirectionsWalk />
      default: return <MdSportsSoccer />
    }
  }

  // Filter categories based on selected eventType ('Ngoài trời' or 'Trong nhà')
  const availableCategories = useMemo(() => {
    if (eventType === 'all') return dbCategories
    return dbCategories.filter(cat => cat.type === eventType)
  }, [dbCategories, eventType])

  const handleJoinEvent = (eventId) => {
    joinEventMutation.mutate(eventId)
  }

  // Skeleton loader
  const SkeletonCard = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700 animate-pulse">
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
      {/* Page Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-red-600 to-red-500 px-6 py-6">
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 container mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
              <MdSportsSoccer className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Sự kiện Thể thao</h1>
              <p className="text-white/75 text-sm mt-0.5">Khám phá và đăng ký tham gia các sự kiện phù hợp với bạn</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link
              to="/sport-event/my-events"
              className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2 text-sm"
            >
              <FaTrophy /> Sự kiện của tôi
            </Link>
            <Link
              to="/sport-event/create"
              className="bg-white hover:bg-gray-50 text-red-600 px-4 py-2 rounded-xl font-semibold transition shadow-lg hover:shadow-xl flex items-center gap-2 text-sm"
            >
              <FaPlus /> Tạo sự kiện mới
            </Link>
          </div>
        </div>
      </div>

      {/* Modern Search & Filters Section */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-20 shadow-sm transition-all">
        <div className="container mx-auto px-4 py-6">

          {/* Top Row: Main Tabs & Search Engine */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-6">

            {/* Event Type Tabs */}
            <div className="flex bg-gray-100 dark:bg-gray-700/50 p-1.5 rounded-xl w-full lg:w-auto overflow-x-auto no-scrollbar">
              <button
                onClick={() => { setEventType('all'); setSelectedCategory('all') }}
                className={`flex-1 lg:flex-none px-6 py-2.5 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${eventType === 'all'
                  ? 'bg-white text-red-600 shadow-md transform scale-100'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 hover:bg-white/50'
                  }`}
              >
                Tất cả loại hình
              </button>
              <button
                onClick={() => { setEventType('Ngoài trời'); setSelectedCategory('all') }}
                className={`flex-1 lg:flex-none px-6 py-2.5 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${eventType === 'Ngoài trời'
                  ? 'bg-white text-green-600 shadow-md transform scale-100'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 hover:bg-white/50'
                  }`}
              >
                🌿 Ngoài trời
              </button>
              <button
                onClick={() => { setEventType('Trong nhà'); setSelectedCategory('all') }}
                className={`flex-1 lg:flex-none px-6 py-2.5 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${eventType === 'Trong nhà'
                  ? 'bg-white text-blue-600 shadow-md transform scale-100'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 hover:bg-white/50'
                  }`}
              >
                🏠 Trong nhà
              </button>
            </div>

            {/* Search and Sort */}
            <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-3 flex-1 lg:flex-none justify-end">
              <div className="relative group flex-1 sm:max-w-xs">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Tìm tên, địa điểm..."
                  className="w-full pl-11 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full sm:w-48 px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 font-medium dark:text-white focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all outline-none cursor-pointer appearance-none"
              >
                <option value="popular">📊 Nổi bật nhất</option>
                <option value="newest">🆕 Mới cập nhật</option>
                <option value="soonest">📅 Sắp diễn ra</option>
              </select>
            </div>

          </div>

          {/* Bottom Row: Dynamic Category Pills */}
          {availableCategories.length > 0 && (
            <div className="flex flex-wrap gap-2.5">
              <button
                className={`flex items-center px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${selectedCategory === 'all'
                  ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-400'
                  : 'bg-white border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 hover:border-red-300'
                  }`}
                onClick={() => setSelectedCategory('all')}
              >
                <MdSportsSoccer className={`mr-2 ${selectedCategory === 'all' ? 'text-red-500' : 'text-gray-400'}`} />
                Tất cả môn
              </button>

              {availableCategories.map((category) => (
                <button
                  key={category._id}
                  className={`flex items-center px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${selectedCategory === category.name
                    ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-400'
                    : 'bg-white border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 hover:border-red-300'
                    }`}
                  onClick={() => setSelectedCategory(category.name)}
                >
                  <span className={`mr-2 ${selectedCategory === category.name ? 'text-red-500' : 'text-gray-400'}`}>
                    {getIconForCategory(category.name)}
                  </span>
                  {category.name}
                </button>
              ))}
            </div>
          )}
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
                friendIds={friendIds}
                connectedIds={connectedIds}
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
