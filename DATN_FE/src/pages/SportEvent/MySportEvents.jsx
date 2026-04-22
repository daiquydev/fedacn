import { useSafeMutation } from '../../hooks/useSafeMutation'
import React, { useState, useMemo, useEffect } from 'react'
import DeleteConfirmBox from '../../components/GlobalComponents/DeleteConfirmBox'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  FaEdit,
  FaTrash,
  FaArrowLeft,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaUsers,
  FaPlus,
  FaTrophy,
  FaEye,
  FaSearch,
  FaClock,
  FaChartLine,
  FaMedal,
  FaUserMinus,
  FaCog,
  FaBullseye,
  FaStar,
  FaChevronLeft
} from 'react-icons/fa'
import { MdVideocam, MdLeaderboard, MdSportsScore, MdCheckCircle } from 'react-icons/md'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import { BsClockHistory, BsCalendarCheck, BsPeopleFill } from 'react-icons/bs'
import { HiOutlineViewGrid } from 'react-icons/hi'
import { getMyEvents, getJoinedEvents, getEventStats, deleteSportEvent, getParticipants, getLeaderboard, getEventOverallProgress, removeParticipant } from '../../apis/sportEventApi'
import { getImageUrl } from '../../utils/imageUrl'
import useravatar from '../../assets/images/useravatar.jpg'
import toast from 'react-hot-toast'
import moment from 'moment'

function rawDateToMs(raw) {
  if (raw == null || raw === '') return null
  const t = new Date(raw).getTime()
  return Number.isFinite(t) ? t : null
}

/** Đồng bộ với BE `sportEventHasStartedForDelete` (kể cả snake_case / sự kiện đã kết thúc) */
function isSportEventStartedForDelete(event) {
  const startMs = rawDateToMs(event?.startDate ?? event?.start_date)
  if (startMs != null) return startMs <= Date.now()
  const endMs = rawDateToMs(event?.endDate ?? event?.end_date)
  if (endMs != null) return endMs < Date.now()
  return false
}

const MySportEvents = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Main tabs
  const [activeTab, setActiveTab] = useState('created') // 'created' or 'joined'
  // Dashboard state
  const [selectedEventId, setSelectedEventId] = useState(null)
  const [activeSubTab, setActiveSubTab] = useState('overview') // 'overview' | 'participants' | 'settings'
  const [mobileShowDetail, setMobileShowDetail] = useState(false) // mobile: show detail instead of list
  // Modals
  const [openDeleteBox, setOpenDeleteBox] = useState(false)
  const [selectedEventInfo, setSelectedEventInfo] = useState({ id: null, name: '' })
  const [kickTarget, setKickTarget] = useState(null) // { userId, name }
  // Sidebar search
  const [sidebarSearch, setSidebarSearch] = useState('')
  // Pagination
  const [createdPage, setCreatedPage] = useState(1)
  const [joinedPage, setJoinedPage] = useState(1)
  const [participantPage, setParticipantPage] = useState(1)
  const [participantSearch, setParticipantSearch] = useState('')
  const ITEMS_PER_PAGE = 20

  // Filter state for BOTH tabs
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'ongoing' | 'upcoming' | 'ended'

  // Debounce sidebar search for created events
  const [createdDebouncedSearch, setCreatedDebouncedSearch] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setCreatedDebouncedSearch(sidebarSearch), 400)
    return () => clearTimeout(t)
  }, [sidebarSearch])

  // Joined tab: search, status filter
  const [joinedSearch, setJoinedSearch] = useState('')
  const [joinedDebouncedSearch, setJoinedDebouncedSearch] = useState('')
  const [joinedStatus, setJoinedStatus] = useState('all')
  const JOINED_PER_PAGE = 6

  // Debounced search for joined tab
  useEffect(() => {
    const t = setTimeout(() => setJoinedDebouncedSearch(joinedSearch), 400)
    return () => clearTimeout(t)
  }, [joinedSearch])

  // Reset joined page when filters change
  useEffect(() => {
    setJoinedPage(1)
  }, [joinedDebouncedSearch, statusFilter])

  // Reset created page when filters change
  useEffect(() => {
    setCreatedPage(1)
  }, [createdDebouncedSearch, statusFilter])

  // Reset filter when switching tabs
  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setStatusFilter('all')
    setMobileShowDetail(false)
  }

  // ─── DATA FETCHING ───────────────────────────────────────
  const { data: statsData } = useQuery({
    queryKey: ['eventStats', activeTab],
    queryFn: () => getEventStats({ type: activeTab }),
    keepPreviousData: true
  })
  
  const stats = useMemo(() => {
    return statsData?.data?.result || { total: 0, ongoing: 0, upcoming: 0, ended: 0 }
  }, [statsData])

  const { data: createdEventsData, isLoading: isLoadingCreated } = useQuery({
    queryKey: ['myCreatedEvents', createdPage, createdDebouncedSearch, statusFilter],
    queryFn: () => getMyEvents({ 
      page: createdPage, 
      limit: 50,
      search: createdDebouncedSearch || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined
    }),
    keepPreviousData: true
  })

  const createdEvents = createdEventsData?.data?.result?.events || createdEventsData?.result?.events || []
  const createdTotal = createdEventsData?.data?.result?.total || 0

  const { data: joinedEventsData, isLoading: isLoadingJoined } = useQuery({
    queryKey: ['myJoinedEvents', joinedPage, joinedDebouncedSearch, joinedStatus],
    queryFn: () => getJoinedEvents({
      page: joinedPage,
      limit: JOINED_PER_PAGE,
      search: joinedDebouncedSearch || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined
    }),
    keepPreviousData: true
  })

  const joinedEvents = joinedEventsData?.data?.result?.events || joinedEventsData?.result?.events || []
  const joinedTotal = joinedEventsData?.data?.result?.total || 0
  const joinedTotalPage = joinedEventsData?.data?.result?.totalPage || 1

  // Selected event
  const selectedEvent = useMemo(() => {
    if (!selectedEventId) return createdEvents[0] || null
    return createdEvents.find((e) => e._id === selectedEventId) || null
  }, [selectedEventId, createdEvents])

  // Auto-select first event when data loads
  React.useEffect(() => {
    if (createdEvents.length > 0 && !selectedEventId) {
      setSelectedEventId(createdEvents[0]._id)
    }
  }, [createdEvents])

  // Participants for selected event
  const { data: participantsData, isLoading: isLoadingParticipants } = useQuery({
    queryKey: ['eventParticipants', selectedEvent?._id, participantPage, participantSearch],
    queryFn: () => getParticipants(selectedEvent?._id, { page: participantPage, limit: 10, search: participantSearch }),
    enabled: !!selectedEvent?._id && activeSubTab === 'participants',
    keepPreviousData: true
  })

  const participants = participantsData?.data?.result?.participants || []
  const participantsTotal = participantsData?.data?.result?.total || 0
  const participantsTotalPages = participantsData?.data?.result?.totalPages || 1

  // Leaderboard for selected event
  const { data: leaderboardData } = useQuery({
    queryKey: ['eventLeaderboard', selectedEvent?._id],
    queryFn: () => getLeaderboard(selectedEvent?._id),
    enabled: !!selectedEvent?._id && activeSubTab === 'overview'
  })
  const leaderboard = leaderboardData?.data?.result?.leaderboard || []

  // Overall progress for selected event
  const { data: overallData } = useQuery({
    queryKey: ['eventOverall', selectedEvent?._id],
    queryFn: () => getEventOverallProgress(selectedEvent?._id),
    enabled: !!selectedEvent?._id && activeSubTab === 'overview'
  })
  const overallProgress = overallData?.data?.result || {}

  // ─── MUTATIONS ───────────────────────────────────────────
  const deleteMutation = useSafeMutation({
    mutationFn: (eventId) => deleteSportEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myCreatedEvents'] })
      queryClient.invalidateQueries({ queryKey: ['eventStats'] })
      toast.success('Đã xóa sự kiện thành công!')
      setOpenDeleteBox(false)
      setSelectedEventId(null)
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Không thể xóa sự kiện')
      setOpenDeleteBox(false)
    }
  })

  const kickMutation = useSafeMutation({
    mutationFn: ({ eventId, targetUserId }) => removeParticipant(eventId, targetUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventParticipants'] })
      queryClient.invalidateQueries({ queryKey: ['myCreatedEvents'] })
      queryClient.invalidateQueries({ queryKey: ['eventLeaderboard'] })
      queryClient.invalidateQueries({ queryKey: ['eventOverall'] })
      toast.success('Đã xóa người tham gia!')
      setKickTarget(null)
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Không thể xóa người tham gia')
      setKickTarget(null)
    }
  })

  const filteredSidebarEvents = useMemo(() => {
    if (!sidebarSearch.trim()) return createdEvents
    return createdEvents.filter((e) => e.name.toLowerCase().includes(sidebarSearch.toLowerCase()))
  }, [createdEvents, sidebarSearch])

  // ─── HANDLERS ────────────────────────────────────────────
  const handleSelectEvent = (eventId) => {
    setSelectedEventId(eventId)
    setActiveSubTab('overview')
    setParticipantPage(1)
    setParticipantSearch('')
    setMobileShowDetail(true)
  }

  const handleDeleteClick = (event) => {
    if (isSportEventStartedForDelete(event)) {
      toast.error('Sự kiện đã bắt đầu, không thể xóa')
      return
    }
    setSelectedEventInfo({ id: event._id, name: event.name })
    setOpenDeleteBox(true)
  }

  const confirmDelete = () => {
    if (selectedEventInfo.id) deleteMutation.mutate(selectedEventInfo.id)
  }

  const handleKickClick = (userId, userName) => {
    setKickTarget({ userId, name: userName })
  }

  const confirmKick = () => {
    if (kickTarget && selectedEvent) {
      kickMutation.mutate({ eventId: selectedEvent._id, targetUserId: kickTarget.userId })
    }
  }

  const getStatusBadge = (event) => {
    const now = moment()
    const start = moment(event.startDate)
    const end = moment(event.endDate)
    if (now.isAfter(end)) return { text: 'Đã kết thúc', color: 'bg-gray-500', dot: false }
    if (now.isBefore(start)) return { text: 'Sắp diễn ra', color: 'bg-amber-500', dot: false }
    return { text: 'Đang diễn ra', color: 'bg-emerald-500', dot: true }
  }

  // ─── RENDER ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* ═══ HERO HEADER ═══ */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 px-6 py-5">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djJIMjR2LTJIMTJ2LTJoMjR2MmgtMnYyem0wLTMwVjJIMjR2Mkgxdi0ySDB2MmgyNHYyaC0ydjJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
        <div className="relative container mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 shadow-lg">
                <FaTrophy className="text-white text-2xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Quản lý Sự kiện</h1>
                <p className="text-white/70 text-sm mt-0.5">Dashboard quản lý sự kiện thể thao của bạn</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => navigate('/sport-event')}
                className="bg-white/15 hover:bg-white/25 backdrop-blur-md text-white px-4 py-2.5 rounded-xl font-medium transition flex items-center gap-2 text-sm border border-white/20"
              >
                <FaArrowLeft className="text-xs" /> Danh sách sự kiện
              </button>
              <Link
                to="/sport-event/create"
                className="bg-white hover:bg-gray-50 text-indigo-600 px-5 py-2.5 rounded-xl font-semibold transition shadow-lg hover:shadow-xl flex items-center gap-2 text-sm"
              >
                <FaPlus className="text-xs" /> Tạo sự kiện mới
              </Link>
            </div>
          </div>

          {/* ═══ STAT CARDS ═══ */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
            {[
              { id: 'all', label: activeTab === 'created' ? 'Tổng đã tạo' : 'Tổng đã tham gia', value: stats.total, icon: HiOutlineViewGrid, color: 'from-blue-500 to-cyan-400' },
              { id: 'ongoing', label: 'Đang diễn ra', value: stats.ongoing, icon: FaChartLine, color: 'from-emerald-500 to-green-400' },
              { id: 'upcoming', label: 'Sắp diễn ra', value: stats.upcoming, icon: FaClock, color: 'from-amber-500 to-yellow-400' },
              { id: 'ended', label: 'Đã kết thúc', value: stats.ended, icon: BsClockHistory, color: 'from-gray-500 to-gray-400' }
            ].map(({ id, label, value, icon: Icon, color }) => {
              const isActive = statusFilter === id
              return (
                <button 
                  key={id} 
                  onClick={() => setStatusFilter(id)}
                  className={`text-left rounded-xl p-4 border transition group relative overflow-hidden ${
                    isActive 
                      ? 'bg-white/20 border-white/40 shadow-[0_0_15px_rgba(255,255,255,0.2)]' 
                      : 'bg-white/10 border-white/15 hover:bg-white/15'
                  }`}
                >
                  {isActive && <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] animate-[shimmer_2s_infinite]" />}
                  <div className="flex items-center justify-between relative z-10">
                    <div>
                      <p className={`text-xs font-medium uppercase tracking-wider transition-colors ${isActive ? 'text-white font-bold' : 'text-white/60'}`}>{label}</p>
                      <p className="text-3xl font-bold text-white mt-1">{value}</p>
                    </div>
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                      <Icon className="text-white text-lg" />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="container mx-auto px-4 -mt-2">
        {/* ═══ MAIN TABS ═══ */}
        <div className="bg-white dark:bg-gray-800 rounded-t-xl shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex">
            <button
              onClick={() => handleTabChange('created')}
              className={`flex-1 md:flex-none px-6 py-4 font-semibold text-sm transition-all relative ${activeTab === 'created'
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
            >
              <span className="flex items-center justify-center gap-2">
                <FaTrophy className="text-xs" />
                Sự kiện đã tạo ({createdTotal})
              </span>
              {activeTab === 'created' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t" />}
            </button>
            <button
              onClick={() => handleTabChange('joined')}
              className={`flex-1 md:flex-none px-6 py-4 font-semibold text-sm transition-all relative ${activeTab === 'joined'
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
            >
              <span className="flex items-center justify-center gap-2">
                <MdCheckCircle className="text-sm" />
                Đã tham gia ({joinedTotal})
              </span>
              {activeTab === 'joined' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t" />}
            </button>
          </div>
        </div>

        {/* ═══ TAB CONTENT ═══ */}
        <div className="bg-white dark:bg-gray-800 rounded-b-xl shadow-md mb-8 overflow-hidden">
          {activeTab === 'created' ? (
            <CreatedTabContent
              isLoading={isLoadingCreated}
              events={filteredSidebarEvents}
              createdTotal={createdTotal}
              selectedEvent={selectedEvent}
              selectedEventId={selectedEventId}
              onSelectEvent={handleSelectEvent}
              sidebarSearch={sidebarSearch}
              onSidebarSearchChange={setSidebarSearch}
              activeSubTab={activeSubTab}
              onSubTabChange={setActiveSubTab}
              // Participants
              participants={participants}
              participantsTotal={participantsTotal}
              participantsTotalPages={participantsTotalPages}
              participantPage={participantPage}
              participantSearch={participantSearch}
              onParticipantPageChange={setParticipantPage}
              onParticipantSearchChange={setParticipantSearch}
              isLoadingParticipants={isLoadingParticipants}
              onKickClick={handleKickClick}
              // Leaderboard & overall
              leaderboard={leaderboard}
              overallProgress={overallProgress}
              // Actions
              onDeleteClick={handleDeleteClick}
              navigate={navigate}
              // Mobile
              mobileShowDetail={mobileShowDetail}
              onMobileBack={() => setMobileShowDetail(false)}
              statusFilter={statusFilter}
              onClearFilter={() => setStatusFilter('all')}
            />
          ) : (
            <JoinedTabContent
              isLoading={isLoadingJoined}
              events={joinedEvents}
              navigate={navigate}
              joinedPage={joinedPage}
              joinedTotalPage={joinedTotalPage}
              joinedTotal={joinedTotal}
              onPageChange={setJoinedPage}
              joinedSearch={joinedSearch}
              onSearchChange={setJoinedSearch}
              JOINED_PER_PAGE={JOINED_PER_PAGE}
              statusFilter={statusFilter}
              onClearFilter={() => setStatusFilter('all')}
            />
          )}
        </div>
      </div>

      {/* ═══ DELETE CONFIRM ═══ */}
      {openDeleteBox && (
        <DeleteConfirmBox
          title='Xóa sự kiện'
          subtitle={`Bạn chắc chắn muốn xóa sự kiện "${selectedEventInfo.name}"?`}
          handleDelete={confirmDelete}
          closeModal={() => setOpenDeleteBox(false)}
          isPending={deleteMutation.isPending}
        />
      )}

      {/* ═══ KICK CONFIRM ═══ */}
      {kickTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setKickTarget(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-center w-14 h-14 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full">
              <FaUserMinus className="text-red-600 text-xl" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center mb-2">Xóa người tham gia?</h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              Bạn có chắc chắn muốn xóa <strong>{kickTarget.name}</strong> khỏi sự kiện không? Người này sẽ nhận được thông báo.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setKickTarget(null)} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition">Hủy</button>
              <button
                onClick={confirmKick}
                disabled={kickMutation.isPending}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {kickMutation.isPending ? <AiOutlineLoading3Quarters className="animate-spin" /> : <FaUserMinus />}
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// CREATED TAB — Dashboard layout
// ═══════════════════════════════════════════════════════════
function CreatedTabContent({
  isLoading, events, createdTotal, selectedEvent, selectedEventId, onSelectEvent,
  sidebarSearch, onSidebarSearchChange,
  activeSubTab, onSubTabChange,
  participants, participantsTotal, participantsTotalPages, participantPage, participantSearch,
  onParticipantPageChange, onParticipantSearchChange, isLoadingParticipants, onKickClick,
  leaderboard, overallProgress,
  onDeleteClick, navigate,
  mobileShowDetail, onMobileBack,
  statusFilter, onClearFilter
}) {
  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
      </div>
    )
  }

  if (createdTotal === 0) {
    if (sidebarSearch || statusFilter !== 'all') {
      return (
        <div className="text-center py-20 px-6">
          <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
            <FaSearch className="text-indigo-400 text-3xl" />
          </div>
          <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">Không tìm thấy sự kiện phù hợp</h3>
          <p className="text-gray-500 mb-6">Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          <button
            onClick={() => { onSidebarSearchChange(''); onClearFilter(); }}
            className="inline-flex items-center gap-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-5 py-2.5 rounded-xl font-semibold transition"
          >
            Xóa bộ lọc
          </button>
        </div>
      )
    }

    return (
      <div className="text-center py-20 px-6">
        <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
          <FaCalendarAlt className="text-indigo-400 text-3xl" />
        </div>
        <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">Bạn chưa tạo sự kiện nào</h3>
        <p className="text-gray-500 dark:text-gray-500 mb-6 max-w-md mx-auto">Hãy tạo sự kiện đầu tiên để bắt đầu quản lý và theo dõi</p>
        <Link to="/sport-event/create" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition shadow-lg">
          <FaPlus /> Tạo sự kiện mới
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row min-h-[500px]">
      {/* ─── SIDEBAR (event list) ─── */}
      <div className={`md:w-72 lg:w-80 border-r border-gray-200 dark:border-gray-700 flex-shrink-0 ${mobileShowDetail ? 'hidden md:flex md:flex-col' : 'flex flex-col'}`}>
        {/* Search */}
        <div className="p-3 border-b border-gray-100 dark:border-gray-700">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
            <input
              type="text"
              placeholder="Tìm sự kiện..."
              value={sidebarSearch}
              onChange={(e) => onSidebarSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border-0 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:text-white placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Event list */}
        <div className="flex-1 overflow-y-auto max-h-[600px] scrollbar-thin pr-1">
          {events.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
              Không tìm thấy sự kiện nào phù hợp với "{sidebarSearch}"
            </div>
          ) : (
          events.map((event) => {
            const status = getStatusBadge(event)
            const isSelected = event._id === selectedEventId
            return (
              <button
                key={event._id}
                onClick={() => onSelectEvent(event._id)}
                className={`w-full text-left p-3 flex items-center gap-3 border-b border-gray-50 dark:border-gray-700/50 transition-all hover:bg-gray-50 dark:hover:bg-gray-700/50 ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-[3px] border-l-indigo-500' : 'border-l-[3px] border-l-transparent'}`}
              >
                <img
                  src={event.image}
                  alt={event.name}
                  className="w-11 h-11 rounded-lg object-cover flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold truncate ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-800 dark:text-white'}`}>
                    {event.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-medium text-white px-1.5 py-0.5 rounded-full ${status.color}`}>
                      {status.dot && <span className="w-1 h-1 rounded-full bg-white animate-pulse" />}
                      {status.text}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      <FaUsers className="inline mr-0.5" />{event.participants}/{event.maxParticipants}
                    </span>
                  </div>
                </div>
              </button>
            )
          }))}
        </div>
      </div>

      {/* ─── MAIN DETAIL AREA ─── */}
      <div className={`flex-1 ${!mobileShowDetail ? 'hidden md:block' : 'block'}`}>
        {!selectedEvent ? (
          <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500 py-20">
            <div className="text-center">
              <FaEye className="mx-auto text-4xl mb-3 opacity-50" />
              <p>Chọn một sự kiện để xem chi tiết</p>
            </div>
          </div>
        ) : (
          <EventDashboard
            event={selectedEvent}
            activeSubTab={activeSubTab}
            onSubTabChange={onSubTabChange}
            participants={participants}
            participantsTotal={participantsTotal}
            participantsTotalPages={participantsTotalPages}
            participantPage={participantPage}
            participantSearch={participantSearch}
            onParticipantPageChange={onParticipantPageChange}
            onParticipantSearchChange={onParticipantSearchChange}
            isLoadingParticipants={isLoadingParticipants}
            onKickClick={onKickClick}
            leaderboard={leaderboard}
            overallProgress={overallProgress}
            onDeleteClick={onDeleteClick}
            navigate={navigate}
            onMobileBack={onMobileBack}
          />
        )}
      </div>
    </div>
  )
}

// Helper: status badge (used in sidebar)
function getStatusBadge(event) {
  const now = moment()
  const start = moment(event.startDate)
  const end = moment(event.endDate)
  if (now.isAfter(end)) return { text: 'Đã kết thúc', color: 'bg-gray-500', dot: false }
  if (now.isBefore(start)) return { text: 'Sắp diễn ra', color: 'bg-amber-500', dot: false }
  return { text: 'Đang diễn ra', color: 'bg-emerald-500', dot: true }
}

// ═══════════════════════════════════════════════════════════
// EVENT DASHBOARD — Main detail area with sub-tabs
// ═══════════════════════════════════════════════════════════
function EventDashboard({
  event, activeSubTab, onSubTabChange,
  participants, participantsTotal, participantsTotalPages, participantPage, participantSearch,
  onParticipantPageChange, onParticipantSearchChange, isLoadingParticipants, onKickClick,
  leaderboard, overallProgress,
  onDeleteClick, navigate, onMobileBack
}) {
  const status = getStatusBadge(event)

  return (
    <div className="flex flex-col h-full">
      {/* Event header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        {/* Mobile back button */}
        <button onClick={onMobileBack} className="md:hidden flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 font-medium mb-3">
          <FaChevronLeft className="text-xs" /> Quay lại danh sách
        </button>

        <div className="flex items-center gap-4">
          <img src={event.image} alt={event.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0 shadow" />
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">{event.name}</h2>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium text-white px-2.5 py-1 rounded-full ${status.color}`}>
                {status.dot && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                {status.text}
              </span>
              <span className="text-xs text-gray-500 flex items-center gap-1"><FaCalendarAlt /> {moment(event.startDate).format('DD/MM/YYYY')} - {moment(event.endDate).format('DD/MM/YYYY')}</span>
              <span className="text-xs text-gray-500 flex items-center gap-1"><FaUsers /> {event.participants}/{event.maxParticipants}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex border-b border-gray-100 dark:border-gray-700 px-4 gap-1">
        {[
          { key: 'overview', label: 'Tổng quan', icon: FaChartLine },
          { key: 'participants', label: 'Người tham gia', icon: BsPeopleFill },
          { key: 'settings', label: 'Cài đặt', icon: FaCog }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => onSubTabChange(key)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-all relative ${activeSubTab === key
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
          >
            <Icon className="text-xs" />
            <span className="hidden sm:inline">{label}</span>
            {activeSubTab === key && <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-indigo-600 rounded-t" />}
          </button>
        ))}
      </div>

      {/* Sub-tab content */}
      <div className="flex-1 overflow-y-auto p-5">
        {activeSubTab === 'overview' && (
          <OverviewSubTab event={event} leaderboard={leaderboard} overallProgress={overallProgress} navigate={navigate} />
        )}
        {activeSubTab === 'participants' && (
          <ParticipantsSubTab
            event={event}
            participants={participants}
            participantsTotal={participantsTotal}
            totalPages={participantsTotalPages}
            page={participantPage}
            search={participantSearch}
            onPageChange={onParticipantPageChange}
            onSearchChange={onParticipantSearchChange}
            isLoading={isLoadingParticipants}
            onKickClick={onKickClick}
          />
        )}
        {activeSubTab === 'settings' && (
          <SettingsSubTab event={event} onDeleteClick={onDeleteClick} navigate={navigate} />
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// SUB-TAB: Overview
// ═══════════════════════════════════════════════════════════
function OverviewSubTab({ event, leaderboard, overallProgress, navigate }) {
  const perPersonTarget = event.targetValue && event.maxParticipants
    ? (event.targetValue / event.maxParticipants) : event.targetValue || 0

  return (
    <div className="space-y-6">
      {/* Info grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <InfoCard icon={FaCalendarAlt} label="Bắt đầu" value={moment(event.startDate).format('DD/MM/YYYY')} color="text-blue-500" />
        <InfoCard icon={FaClock} label="Thời gian" value={moment(event.startDate).format('HH:mm')} color="text-green-500" />
        <InfoCard icon={event.eventType === 'Trong nhà' ? MdVideocam : FaMapMarkerAlt} label={event.eventType === 'Trong nhà' ? 'Loại' : 'Địa điểm'} value={event.eventType === 'Trong nhà' ? 'Trong nhà' : (event.location || '—')} color="text-violet-500" truncate />
        <InfoCard icon={FaBullseye} label="Mục tiêu" value={event.targetValue > 0 ? `${event.targetValue} ${event.targetUnit}` : 'Không có'} color="text-orange-500" />
      </div>

      {/* Description */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Mô tả</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap line-clamp-4">{event.description || 'Chưa có mô tả.'}</p>
      </div>

      {/* Overall progress */}
      {event.targetValue > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800/30">
          <h4 className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 mb-3 flex items-center gap-2">
            <FaChartLine /> Tiến độ chung
          </h4>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>{(overallProgress.totalGroupProgress || 0).toFixed(1)} {event.targetUnit}</span>
                <span>{event.targetValue} {event.targetUnit}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-violet-500 h-3 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(((overallProgress.totalGroupProgress || 0) / event.targetValue) * 100, 100)}%` }}
                />
              </div>
            </div>
            <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 flex-shrink-0">
              {Math.min(Math.round(((overallProgress.totalGroupProgress || 0) / event.targetValue) * 100), 100)}%
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {overallProgress.participantCount || 0} người đã đóng góp • {overallProgress.entriesCount || 0} lần ghi nhận
          </p>
        </div>
      )}

      {/* Leaderboard preview top 5 */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <MdLeaderboard className="text-amber-500" /> Bảng xếp hạng (Top 5)
        </h4>
        {leaderboard.length > 0 ? (
          <div className="space-y-2">
            {leaderboard.slice(0, 5).map((entry, idx) => (
              <div key={entry.userId} className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 flex items-center justify-center flex-shrink-0">
                    {idx === 0 && <FaTrophy className="text-yellow-500" />}
                    {idx === 1 && <FaMedal className="text-gray-400" />}
                    {idx === 2 && <FaMedal className="text-amber-600" />}
                    {idx >= 3 && <span className="text-xs font-bold text-gray-400">{idx + 1}</span>}
                  </div>
                  <img src={entry.avatar ? getImageUrl(entry.avatar) : useravatar} alt="" className="w-7 h-7 rounded-full flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-800 dark:text-white truncate">{entry.name}</span>
                </div>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                  {entry.totalProgress?.toFixed(1)} {event.targetUnit}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">Chưa có dữ liệu tiến độ</p>
        )}
      </div>
    </div>
  )
}

// Small info card helper
function InfoCard({ icon: Icon, label, value, color, truncate }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={`text-xs ${color}`} />
        <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">{label}</span>
      </div>
      <p className={`text-sm font-semibold text-gray-800 dark:text-white ${truncate ? 'truncate' : ''}`}>{value}</p>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// SUB-TAB: Participants
// ═══════════════════════════════════════════════════════════
function ParticipantsSubTab({ event, participants, participantsTotal, totalPages, page, search, onPageChange, onSearchChange, isLoading, onKickClick }) {
  return (
    <div>
      {/* Header + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          <BsPeopleFill className="inline mr-1.5 text-indigo-500" />
          Người tham gia ({participantsTotal})
        </h4>
        <div className="relative max-w-xs w-full sm:w-auto">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
          <input
            type="text"
            placeholder="Tìm người tham gia..."
            value={search}
            onChange={(e) => { onSearchChange(e.target.value); onPageChange(1) }}
            className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:text-white"
          />
        </div>
      </div>

      {/* Participants table/list */}
      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
        </div>
      ) : participants.length > 0 ? (
        <>
          <div className="space-y-2">
            {participants.map((p) => (
              <div key={p.userId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Rank */}
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                    {p.rank <= 3 ? (
                      <span className="text-sm">{p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : '🥉'}</span>
                    ) : (
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{p.rank}</span>
                    )}
                  </div>
                  {/* Avatar + name */}
                  <img src={p.avatar ? getImageUrl(p.avatar) : useravatar} alt="" className="w-9 h-9 rounded-full flex-shrink-0 border-2 border-white dark:border-gray-600 shadow-sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{p.name}</p>
                    <p className="text-[10px] text-gray-400">
                      {p.totalProgress?.toFixed(1)} {event.targetUnit} • {p.progressPercentage}%
                    </p>
                  </div>
                </div>
                {/* Progress + Kick */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="hidden sm:block w-24">
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${p.progressPercentage >= 100 ? 'bg-green-500' : 'bg-indigo-500'}`}
                        style={{ width: `${Math.min(p.progressPercentage, 100)}%` }}
                      />
                    </div>
                  </div>
                  {String(p.userId) === String(event.createdBy?._id || event.createdBy) ? (
                    <span className="px-2 py-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg" title="Người tổ chức">
                      👑
                    </span>
                  ) : (
                    <button
                      onClick={() => onKickClick(p.userId, p.name)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                      title="Xóa khỏi sự kiện"
                    >
                      <FaUserMinus className="text-sm" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-5">
              <button disabled={page <= 1} onClick={() => onPageChange(p => p - 1)}
                className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 disabled:opacity-30 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition">Trước</button>
              <span className="text-xs text-gray-500">Trang {page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => onPageChange(p => p + 1)}
                className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 disabled:opacity-30 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition">Sau</button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <BsPeopleFill className="mx-auto text-4xl text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Chưa có người tham gia</p>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// SUB-TAB: Settings (Quick edit)
// ═══════════════════════════════════════════════════════════
function SettingsSubTab({ event, onDeleteClick, navigate }) {
  return (
    <div className="space-y-6 max-w-xl">
      {/* Quick info */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5 space-y-4">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <FaCog className="text-gray-400" /> Thông tin sự kiện
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400 text-xs block mb-0.5">Tên sự kiện</span>
            <span className="text-gray-800 dark:text-white font-medium">{event.name}</span>
          </div>
          <div>
            <span className="text-gray-400 text-xs block mb-0.5">Thể loại</span>
            <span className="text-gray-800 dark:text-white font-medium">{event.category}</span>
          </div>
          <div>
            <span className="text-gray-400 text-xs block mb-0.5">Loại sự kiện</span>
            <span className="text-gray-800 dark:text-white font-medium">{event.eventType}</span>
          </div>
          <div>
            <span className="text-gray-400 text-xs block mb-0.5">Số người tối đa</span>
            <span className="text-gray-800 dark:text-white font-medium">{event.maxParticipants} người</span>
          </div>
          <div>
            <span className="text-gray-400 text-xs block mb-0.5">Ngày bắt đầu</span>
            <span className="text-gray-800 dark:text-white font-medium">{moment(event.startDate).format('DD/MM/YYYY HH:mm')}</span>
          </div>
          <div>
            <span className="text-gray-400 text-xs block mb-0.5">Ngày kết thúc</span>
            <span className="text-gray-800 dark:text-white font-medium">{moment(event.endDate).format('DD/MM/YYYY HH:mm')}</span>
          </div>
          {event.targetValue > 0 && (
            <div>
              <span className="text-gray-400 text-xs block mb-0.5">Mục tiêu</span>
              <span className="text-gray-800 dark:text-white font-medium">{event.targetValue} {event.targetUnit}</span>
            </div>
          )}
          <div>
            <span className="text-gray-400 text-xs block mb-0.5">{event.eventType === 'Trong nhà' ? 'Link Video Call' : 'Địa điểm'}</span>
            <span className="text-gray-800 dark:text-white font-medium truncate block">{event.location || '—'}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => navigate(`/sport-event/edit/${event._id}`)}
          className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-semibold transition shadow-lg"
        >
          <FaEdit /> Sửa đầy đủ
        </button>
        <button
          onClick={() => navigate(`/sport-event/${event._id}`)}
          className="flex-1 flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-5 py-3 rounded-xl font-semibold transition"
        >
          <FaEye /> Xem trang sự kiện
        </button>
      </div>

      {/* Chỉ hiện khi sự kiện chưa bắt đầu — đã/đang diễn ra thì không còn nút xóa */}
      {!isSportEventStartedForDelete(event) && (
        <div className="border border-red-200 dark:border-red-900/50 rounded-xl p-5 bg-red-50/50 dark:bg-red-900/10">
          <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">Vùng nguy hiểm</h4>
          <p className="text-xs text-red-600/70 dark:text-red-400/70 mb-4">Xóa sự kiện sẽ không thể hoàn tác. Tất cả dữ liệu liên quan sẽ bị ẩn.</p>
          <button
            type="button"
            onClick={() => onDeleteClick(event)}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-xl font-medium transition text-sm"
          >
            <FaTrash className="text-xs" /> Xóa sự kiện
          </button>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// JOINED TAB — Card grid with search, status filter, pagination
// ═══════════════════════════════════════════════════════════
function JoinedTabContent({ isLoading, events, navigate, joinedPage, joinedTotalPage, joinedTotal, onPageChange, joinedSearch, onSearchChange, statusFilter, onClearFilter, JOINED_PER_PAGE }) {
  return (
    <div className="p-5">
      {/* Search + Status Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
          <input
            type="text"
            placeholder="Tìm sự kiện..."
            value={joinedSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:text-white placeholder:text-gray-400 transition-all"
          />
        </div>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(JOINED_PER_PAGE)].map((_, i) => (
            <div key={i} className="bg-gray-50 dark:bg-gray-700 rounded-xl h-64 animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 px-6">
          <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
            <FaTrophy className="text-indigo-400 text-3xl" />
          </div>
          <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">
            {joinedSearch || statusFilter !== 'all' ? 'Không tìm thấy sự kiện phù hợp' : 'Bạn chưa tham gia sự kiện nào'}
          </h3>
          <p className="text-gray-500 mb-6">
            {joinedSearch || statusFilter !== 'all' ? 'Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm' : 'Khám phá và tham gia các sự kiện thú vị!'}
          </p>
          {joinedSearch || statusFilter !== 'all' ? (
            <button
              onClick={() => { onSearchChange(''); onClearFilter() }}
              className="inline-flex items-center gap-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-5 py-2.5 rounded-xl font-semibold transition"
            >
              Xóa bộ lọc
            </button>
          ) : (
            <Link to="/sport-event" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition shadow-lg">
              Khám phá sự kiện
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event) => {
              const status = getStatusBadge(event)
              return (
                <div
                  key={event._id}
                  onClick={() => navigate(`/sport-event/${event._id}`)}
                  className="bg-gray-50 dark:bg-gray-700/50 rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all group border border-gray-100 dark:border-gray-600/50 hover:border-indigo-200 dark:hover:border-indigo-700"
                >
                  {/* Image */}
                  <div className="relative h-36">
                    <img src={event.image} alt={event.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <span className={`absolute top-2.5 left-2.5 inline-flex items-center gap-1 text-[10px] font-semibold text-white px-2 py-1 rounded-full ${status.color}`}>
                      {status.dot && <span className="w-1 h-1 rounded-full bg-white animate-pulse" />}
                      {status.text}
                    </span>
                    <span className="absolute top-2.5 right-2.5 bg-black/40 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-1 rounded-full">
                      <FaUsers className="inline mr-1" />{event.participants}/{event.maxParticipants}
                    </span>
                  </div>
                  {/* Info */}
                  <div className="p-3.5">
                    <h4 className="text-sm font-bold text-gray-800 dark:text-white truncate mb-2">{event.name}</h4>
                    <div className="flex items-center gap-3 text-[11px] text-gray-500 dark:text-gray-400 mb-2">
                      <span className="flex items-center gap-1"><FaCalendarAlt />{moment(event.startDate).format('DD/MM')}</span>
                      <span className="flex items-center gap-1"><FaClock />{moment(event.startDate).format('HH:mm')}</span>
                      <span className="flex items-center gap-1">
                        {event.eventType === 'Trong nhà' ? <MdVideocam /> : <FaMapMarkerAlt />}
                        {event.eventType}
                      </span>
                    </div>
                    {/* Mini joined badge */}
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                      <MdCheckCircle /> Đã tham gia
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Rich Pagination */}
          {joinedTotalPage > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                disabled={joinedPage <= 1}
                onClick={() => { onPageChange(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                className="px-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
              >
                ← Trước
              </button>
              {Array.from({ length: joinedTotalPage }, (_, i) => i + 1)
                .filter(p => p === 1 || p === joinedTotalPage || Math.abs(p - joinedPage) <= 2)
                .reduce((acc, p, i, arr) => {
                  if (i > 0 && p - arr[i - 1] > 1) acc.push('ellipsis-' + p)
                  acc.push(p)
                  return acc
                }, [])
                .map(p =>
                  typeof p === 'number' ? (
                    <button
                      key={p}
                      onClick={() => { onPageChange(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                      className={`w-9 h-9 text-sm rounded-lg font-semibold transition-colors ${p === joinedPage ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                    >
                      {p}
                    </button>
                  ) : (
                    <span key={p} className="px-1 text-gray-400">...</span>
                  )
                )
              }
              <button
                disabled={joinedPage >= joinedTotalPage}
                onClick={() => { onPageChange(p => Math.min(joinedTotalPage, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                className="px-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Sau →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default MySportEvents
