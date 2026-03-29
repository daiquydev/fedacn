import { useSafeMutation } from '../../hooks/useSafeMutation'
import React, { useState, useMemo, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaSearch,
  FaTrophy,
  FaPlus,
  FaTimes,
  FaFilter,
  FaChevronDown,
  FaSortAmountDown,
  FaCheck,
  FaUsers
} from 'react-icons/fa'
import { MdSportsSoccer } from 'react-icons/md'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import SportEventCard from './components/SportEventCard'
import { getAllSportEvents, joinSportEvent } from '../../apis/sportEventApi'
import sportCategoryApi from '../../apis/sportCategoryApi'
import { currentAccount } from '../../apis/userApi'
import { getSportIcon } from '../../utils/sportIcons'
import toast from 'react-hot-toast'

// Format digits into DD/MM/YYYY
const formatDateInput = (raw) => {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return digits.slice(0, 2) + '/' + digits.slice(2)
  return digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4)
}

// Featured Events Carousel Banner
function FeaturedBanner({ events, navigate }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    if (events.length <= 1) return
    timerRef.current = setInterval(() => setActiveIdx(i => (i + 1) % events.length), 5000)
    return () => clearInterval(timerRef.current)
  }, [events.length])

  const ev = events[activeIdx]
  if (!ev) return null

  const isOngoing = new Date(ev.startDate) <= new Date() && new Date(ev.endDate) > new Date()

  return (
    <div className="container mx-auto px-4 pt-4">
      <div
        className="relative rounded-2xl overflow-hidden shadow-lg cursor-pointer group"
        style={{ height: 200 }}
        onClick={() => navigate(`/sport-event/${ev._id}`)}
      >
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700"
          style={{ backgroundImage: `url(${ev.image || 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200'})` }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />

        {/* Content */}
        <div className="relative h-full flex items-center px-8 z-10">
          <div className="text-white max-w-lg">
            {isOngoing && (
              <span className="inline-flex items-center gap-1 bg-green-500/90 backdrop-blur text-xs font-bold px-2.5 py-1 rounded-full mb-2">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> Đang diễn ra
              </span>
            )}
            <h2 className="text-2xl font-black mb-1 drop-shadow-lg">{ev.name}</h2>
            <p className="text-white/70 text-sm mb-3">
              {ev.category} • {ev.participants || 0} người tham gia
            </p>
            <span className="inline-block bg-white/20 backdrop-blur-md hover:bg-white/30 transition px-5 py-2 rounded-xl text-sm font-bold">
              Xem chi tiết →
            </span>
          </div>
        </div>

        {/* Dot indicators */}
        {events.length > 1 && (
          <div className="absolute bottom-3 right-6 flex gap-1.5 z-10">
            {events.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setActiveIdx(i) }}
                className={`w-2 h-2 rounded-full transition-all ${i === activeIdx ? 'bg-white w-6' : 'bg-white/40 hover:bg-white/60'}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const SportEvent = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [eventType, setEventType] = useState('all') // all, Ngoài trời, Trong nhà
  const [sortBy, setSortBy] = useState('popular')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [filterJoined, setFilterJoined] = useState(false)
  const [page, setPage] = useState(1)
  const ITEMS_PER_PAGE = 9

  // Fetch sport events with React Query
  const {
    data: eventsData,
    isLoading,
    error
  } = useQuery({
    queryKey: ['sportEvents', { sortBy }],
    queryFn: () => getAllSportEvents({ page: 1, limit: 100, sortBy })
  })

  const sportEvents = eventsData?.data?.result?.events || eventsData?.result?.events || []

  // Fetch current user's social graph
  const { data: meData } = useQuery({
    queryKey: ['me'],
    queryFn: currentAccount
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
  const joinEventMutation = useSafeMutation({
    mutationFn: (eventId) => joinSportEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sportEvents'] })
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

    // Filter by date range
    if (filterDateFrom && filterDateFrom.length === 10) {
      const [d, m, y] = filterDateFrom.split('/')
      const fromDate = new Date(`${y}-${m}-${d}T00:00:00`)
      if (!isNaN(fromDate.getTime())) {
        filtered = filtered.filter((event) => new Date(event.startDate) >= fromDate)
      }
    }
    if (filterDateTo && filterDateTo.length === 10) {
      const [d, m, y] = filterDateTo.split('/')
      const toDate = new Date(`${y}-${m}-${d}T23:59:59`)
      if (!isNaN(toDate.getTime())) {
        filtered = filtered.filter((event) => new Date(event.startDate) <= toDate)
      }
    }

    // Filter: Đã tham gia (joined by current user)
    if (sortBy === 'joined' || filterJoined) {
      filtered = filtered.filter((event) => event.isJoined === true)
    }

    // Filter: Đang diễn ra (ongoing)
    if (sortBy === 'ongoing') {
      const now = new Date()
      filtered = filtered.filter((event) => {
        const start = new Date(event.startDate)
        const end = new Date(event.endDate)
        return start <= now && now <= end
      })
    }

    // Filter: Đã kết thúc
    if (sortBy === 'ended') {
      const now = new Date()
      filtered = filtered.filter((event) => new Date(event.endDate) < now)
    }

    // Sort events
    if (sortBy === 'popular') {
      filtered.sort((a, b) => (b.participants || 0) - (a.participants || 0))
    } else if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    } else if (sortBy === 'soonest') {
      filtered.sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
    } else if (sortBy === 'ongoing') {
      filtered.sort((a, b) => new Date(a.endDate) - new Date(b.endDate))
    } else if (sortBy === 'ended') {
      filtered.sort((a, b) => new Date(b.endDate) - new Date(a.endDate))
    }

    return filtered
  }, [sportEvents, searchTerm, selectedCategory, eventType, sortBy, filterDateFrom, filterDateTo, filterJoined, me])

  // Reset page to 1 when any filter changes
  useEffect(() => {
    setPage(1)
  }, [searchTerm, selectedCategory, eventType, sortBy, filterDateFrom, filterDateTo, filterJoined])

  // Pagination calculations
  const totalPage = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE) || 1
  const paginatedEvents = filteredEvents.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  // Fetch sport categories
  const { data: categoriesData } = useQuery({
    queryKey: ['sportCategories'],
    queryFn: () => sportCategoryApi.getAll()
  })

  // Dynamic categories from DB
  const dbCategories = categoriesData?.data?.result || []

  // Lấy icon component từ DB field `icon` của category
  const renderCategoryIcon = (category) => {
    const IconComp = getSportIcon(category.icon)
    return <IconComp />
  }

  // Lookup map: tên category => icon component (dùng cho SportEventCard)
  const categoryIconLookup = useMemo(() => {
    const map = {}
    dbCategories.forEach(cat => {
      map[cat.name] = getSportIcon(cat.icon)
    })
    return map
  }, [dbCategories])

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
      <div className="relative overflow-hidden bg-gradient-to-r from-red-600 to-red-500 px-6 py-4">
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 container mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
              <MdSportsSoccer className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Sự kiện Thể thao</h1>
              <p className="text-white/75 text-xs mt-0.5">Khám phá và đăng ký tham gia các sự kiện phù hợp với bạn</p>
            </div>
          </div>
          <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
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

      {/* Featured Events Banner Carousel */}
      {(() => {
        const featuredEvents = [...sportEvents]
          .filter(e => new Date(e.endDate) > new Date()) // only active/upcoming
          .sort((a, b) => (b.participants || 0) - (a.participants || 0))
          .slice(0, 3)

        if (featuredEvents.length === 0) return null

        return <FeaturedBanner events={featuredEvents} navigate={navigate} />
      })()}

      {/* Modern Search & Filters Section — Admin-inspired card design */}
      <div className="container mx-auto px-4 pt-6 pb-2">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">

          {/* Row 1: Search bar + Bộ lọc button */}
          <div className="p-4">
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Search input — full width on mobile */}
              <div className="relative flex-1 min-w-0">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <FaTimes size={12} />
                  </button>
                )}
                <input
                  type="text"
                  placeholder="Tìm theo tên sự kiện, danh mục, địa điểm..."
                  className="w-full pl-10 pr-8 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 dark:text-white outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:bg-white dark:focus:bg-gray-600 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              {/* Filter buttons — wrap to second row on mobile */}
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => setFilterJoined(v => !v)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border transition-all shrink-0 ${
                    filterJoined
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 shadow-sm'
                      : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-emerald-300 hover:text-emerald-600'
                  }`}
                >
                  {filterJoined ? <FaCheck size={10} /> : <FaUsers size={12} />}
                  Đang tham gia
                </button>
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border transition-all shrink-0 ${
                    showAdvanced || sortBy !== 'popular' || (filterDateFrom && filterDateFrom.length === 10) || (filterDateTo && filterDateTo.length === 10)
                      ? 'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300'
                      : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  <FaFilter size={12} />
                  Bộ lọc
                  {([sortBy !== 'popular', filterDateFrom?.length === 10, filterDateTo?.length === 10].filter(Boolean).length > 0) && (
                    <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {[sortBy !== 'popular', filterDateFrom?.length === 10, filterDateTo?.length === 10].filter(Boolean).length}
                    </span>
                  )}
                  <FaChevronDown size={10} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            {/* Active filter chips */}
            {(eventType !== 'all' || selectedCategory !== 'all' || sortBy !== 'popular' || searchTerm || (filterDateFrom && filterDateFrom.length === 10) || (filterDateTo && filterDateTo.length === 10) || filterJoined) && (
              <div className="flex flex-wrap gap-2 mt-3">
                {eventType !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                    {eventType === 'Ngoài trời' ? '🌿' : '🏠'} {eventType}
                    <button onClick={() => { setEventType('all'); setSelectedCategory('all') }} className="hover:text-emerald-900 dark:hover:text-emerald-100"><FaTimes size={9} /></button>
                  </span>
                )}
                {selectedCategory !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                    🏅 {selectedCategory}
                    <button onClick={() => setSelectedCategory('all')} className="hover:text-blue-900 dark:hover:text-blue-100"><FaTimes size={9} /></button>
                  </span>
                )}
                {sortBy !== 'popular' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                    ↕️ {{ newest: 'Mới nhất', oldest: 'Cũ nhất', soonest: 'Sắp diễn ra', ongoing: 'Đang diễn ra', joined: 'Đã tham gia', ended: 'Đã kết thúc' }[sortBy] || sortBy}
                    <button onClick={() => setSortBy('popular')} className="hover:text-purple-900 dark:hover:text-purple-100"><FaTimes size={9} /></button>
                  </span>
                )}
                {filterDateFrom && filterDateFrom.length === 10 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                    📅 Từ {filterDateFrom}
                    <button onClick={() => setFilterDateFrom('')} className="hover:text-orange-900 dark:hover:text-orange-100"><FaTimes size={9} /></button>
                  </span>
                )}
                {filterDateTo && filterDateTo.length === 10 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                    📅 Đến {filterDateTo}
                    <button onClick={() => setFilterDateTo('')} className="hover:text-orange-900 dark:hover:text-orange-100"><FaTimes size={9} /></button>
                  </span>
                )}
                {filterJoined && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                    ✅ Đang tham gia
                    <button onClick={() => setFilterJoined(false)} className="hover:text-emerald-900 dark:hover:text-emerald-100"><FaTimes size={9} /></button>
                  </span>
                )}
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedCategory('all')
                    setEventType('all')
                    setSortBy('popular')
                    setFilterDateFrom('')
                    setFilterDateTo('')
                    setFilterJoined(false)
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                >
                  <FaTimes size={9} /> Xóa tất cả
                </button>
              </div>
            )}
          </div>

          {/* Row 2: Event Type Tabs — always visible */}
          <div className="px-4 pb-3">
            <div className="flex bg-gray-100 dark:bg-gray-700/50 p-1.5 rounded-xl w-full lg:w-auto overflow-x-auto no-scrollbar">
              <button
                onClick={() => { setEventType('all'); setSelectedCategory('all') }}
                className={`flex-1 lg:flex-none px-6 py-2.5 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${eventType === 'all'
                  ? 'bg-white text-red-600 shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 hover:bg-white/50'
                  }`}
              >
                Tất cả loại hình
              </button>
              <button
                onClick={() => { setEventType('Ngoài trời'); setSelectedCategory('all') }}
                className={`flex-1 lg:flex-none px-6 py-2.5 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${eventType === 'Ngoài trời'
                  ? 'bg-white text-green-600 shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 hover:bg-white/50'
                  }`}
              >
                🌿 Ngoài trời
              </button>
              <button
                onClick={() => { setEventType('Trong nhà'); setSelectedCategory('all') }}
                className={`flex-1 lg:flex-none px-6 py-2.5 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${eventType === 'Trong nhà'
                  ? 'bg-white text-blue-600 shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 hover:bg-white/50'
                  }`}
              >
                🏠 Trong nhà
              </button>
            </div>
          </div>

          {/* Row 3: Dynamic Category Pills — always visible */}
          {availableCategories.length > 0 && (
            <div className="px-4 pb-4">
              <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
                <button
                  className={`flex items-center shrink-0 whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${selectedCategory === 'all'
                    ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-400'
                    : 'bg-white border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 hover:border-red-300'
                    }`}
                  onClick={() => setSelectedCategory('all')}
                >
                  <MdSportsSoccer className={`mr-2 ${selectedCategory === 'all' ? 'text-red-500' : 'text-gray-400'}`} />
                  Tất cả môn
                </button>

                {availableCategories.map((category) => {
                  const CatIcon = getSportIcon(category.icon)
                  return (
                    <button
                      key={category._id}
                      className={`flex items-center shrink-0 whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${selectedCategory === category.name
                        ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-400'
                        : 'bg-white border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 hover:border-red-300'
                        }`}
                      onClick={() => setSelectedCategory(category.name)}
                    >
                      <CatIcon className={`mr-2 ${selectedCategory === category.name ? 'text-red-500' : 'text-gray-400'}`} />
                      {category.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Collapsible Advanced Filter Panel */}
          {showAdvanced && (
            <div className="px-4 pb-4 pt-0 border-t border-gray-100 dark:border-gray-700">
              {/* Date range filters */}
              <div className="grid grid-cols-2 gap-3 pt-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Từ ngày</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={filterDateFrom}
                      onChange={e => setFilterDateFrom(formatDateInput(e.target.value))}
                      placeholder="DD/MM/YYYY"
                      maxLength={10}
                      className="w-full px-3 py-2 pr-10 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-red-500 transition-all"
                    />
                    <FaCalendarAlt className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Đến ngày</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={filterDateTo}
                      onChange={e => setFilterDateTo(formatDateInput(e.target.value))}
                      placeholder="DD/MM/YYYY"
                      maxLength={10}
                      className="w-full px-3 py-2 pr-10 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-red-500 transition-all"
                    />
                    <FaCalendarAlt className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Sort row */}
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <FaSortAmountDown className="text-gray-400 text-sm shrink-0" />
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase shrink-0">Sắp xếp:</span>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { value: 'popular', label: 'Phổ biến nhất' },
                    { value: 'newest', label: 'Mới nhất' },
                    { value: 'oldest', label: 'Cũ nhất' },
                    { value: 'soonest', label: 'Sắp diễn ra' },
                    { value: 'ongoing', label: 'Đang diễn ra' },
                    { value: 'joined', label: 'Đã tham gia' },
                    { value: 'ended', label: 'Đã kết thúc' }
                  ].map(s => (
                    <button
                      key={s.value}
                      onClick={() => setSortBy(s.value)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        sortBy === s.value
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 ring-1 ring-red-300 dark:ring-red-700'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Events Grid */}
      <div className="container mx-auto px-4 py-8">
        {/* Results Count */}
        {!isLoading && (
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Hiển thị <span className="font-semibold text-gray-900 dark:text-white">{paginatedEvents.length}</span> / {filteredEvents.length} sự kiện
              {totalPage > 1 && <span className="text-gray-400 ml-2">(trang {page}/{totalPage})</span>}
            </p>
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
              onClick={() => queryClient.invalidateQueries({ queryKey: ['sportEvents'] })}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              Thử lại
            </button>
          </div>
        ) : filteredEvents.length > 0 ? (
          /* Events Grid */
          <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedEvents.map((event) => (
              <SportEventCard
                key={event._id || event.id}
                event={event}
                onJoin={handleJoinEvent}
                isJoining={joinEventMutation.isPending && joinEventMutation.variables === (event._id || event.id)}
                friendIds={friendIds}
                connectedIds={connectedIds}
                CategoryIcon={categoryIconLookup[event.category]}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPage > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                disabled={page <= 1}
                onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                className="px-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
              >
                ← Trước
              </button>
              {Array.from({ length: totalPage }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPage || Math.abs(p - page) <= 2)
                .reduce((acc, p, i, arr) => {
                  if (i > 0 && p - arr[i - 1] > 1) acc.push('ellipsis-' + p)
                  acc.push(p)
                  return acc
                }, [])
                .map(p =>
                  typeof p === 'number' ? (
                    <button
                      key={p}
                      onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                      className={`w-9 h-9 text-sm rounded-lg font-semibold transition-colors ${p === page ? 'bg-emerald-600 text-white shadow-md' : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                    >
                      {p}
                    </button>
                  ) : (
                    <span key={p} className="px-1 text-gray-400">...</span>
                  )
                )
              }
              <button
                disabled={page >= totalPage}
                onClick={() => { setPage(p => Math.min(totalPage, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                className="px-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Sau →
              </button>
            </div>
          )}
          </>
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
                setFilterJoined(false)
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
