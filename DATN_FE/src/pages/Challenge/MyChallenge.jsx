import { useSafeMutation } from '../../hooks/useSafeMutation'
import React, { useState, useMemo } from 'react'
import DeleteConfirmBox from '../../components/GlobalComponents/DeleteConfirmBox'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  FaEdit, FaTrash, FaArrowLeft, FaCalendarAlt, FaUsers,
  FaPlus, FaTrophy, FaEye, FaUtensils, FaRunning, FaDumbbell,
  FaFire, FaClock, FaSearch, FaChartLine, FaMedal, FaCog,
  FaBullseye, FaChevronLeft
} from 'react-icons/fa'
import { MdCheckCircle, MdLeaderboard } from 'react-icons/md'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import { BsClockHistory, BsPeopleFill } from 'react-icons/bs'
import { HiOutlineViewGrid } from 'react-icons/hi'
import {
  getMyCreatedChallenges, getMyChallenges, deleteChallenge,
  getChallengeLeaderboard, getChallengeParticipants, getChallengeStats
} from '../../apis/challengeApi'
import { getImageUrl } from '../../utils/imageUrl'
import useravatar from '../../assets/images/useravatar.jpg'
import toast from 'react-hot-toast'
import moment from 'moment'
import { getChallengePersonalProgressPercent, getChallengeTotalRequiredDays } from '../../utils/challengeProgress'

const TYPE_CONFIG = {
  nutrition: { icon: <FaUtensils />, label: 'Ăn uống', gradient: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300' },
  outdoor_activity: { icon: <FaRunning />, label: 'Ngoài trời', gradient: 'from-blue-500 to-cyan-600', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
  fitness: { icon: <FaDumbbell />, label: 'Thể dục', gradient: 'from-indigo-500 to-violet-600', bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-300' }
}

export default function MyChallenge() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Main tabs
  const [activeTab, setActiveTab] = useState('created') // 'created' or 'joined'
  // Dashboard state
  const [selectedChallengeId, setSelectedChallengeId] = useState(null)
  const [activeSubTab, setActiveSubTab] = useState('overview')
  const [mobileShowDetail, setMobileShowDetail] = useState(false)
  // Modals
  const [openDeleteBox, setOpenDeleteBox] = useState(false)
  const [selectedInfo, setSelectedInfo] = useState({ id: null, name: '' })
  // Sidebar search
  const [sidebarSearch, setSidebarSearch] = useState('')
  // Pagination
  const [createdPage, setCreatedPage] = useState(1)
  const [joinedPage, setJoinedPage] = useState(1)
  
  // Filter state for BOTH tabs
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'ongoing' | 'upcoming' | 'ended'

  // Debounce sidebar search for created challenges
  const [createdDebouncedSearch, setCreatedDebouncedSearch] = useState('')
  React.useEffect(() => {
    const t = setTimeout(() => setCreatedDebouncedSearch(sidebarSearch), 400)
    return () => clearTimeout(t)
  }, [sidebarSearch])

  // Joined tab: search, status filter
  const [joinedSearch, setJoinedSearch] = useState('')
  const [joinedDebouncedSearch, setJoinedDebouncedSearch] = useState('')
  const JOINED_PER_PAGE = 6

  // Debounced search for joined tab
  React.useEffect(() => {
    const t = setTimeout(() => setJoinedDebouncedSearch(joinedSearch), 400)
    return () => clearTimeout(t)
  }, [joinedSearch])

  // Reset joined page when filters change
  React.useEffect(() => {
    setJoinedPage(1)
  }, [joinedDebouncedSearch, statusFilter])

  // Reset created page when filters change
  React.useEffect(() => {
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
    queryKey: ['challengeStats', activeTab],
    queryFn: () => getChallengeStats({ type: activeTab }),
    keepPreviousData: true
  })

  const stats = useMemo(() => {
    return statsData?.data?.result || { total: 0, ongoing: 0, upcoming: 0, ended: 0 }
  }, [statsData])

  const { data: createdData, isLoading: isLoadingCreated } = useQuery({
    queryKey: ['my-created-challenges', createdPage, createdDebouncedSearch, statusFilter],
    queryFn: () => getMyCreatedChallenges({ 
      page: createdPage, 
      limit: 50,
      search: createdDebouncedSearch || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined
    }),
    staleTime: 1000,
    keepPreviousData: true
  })
  const createdChallenges = createdData?.data?.result?.challenges || createdData?.result?.challenges || []
  const createdTotal = createdData?.data?.result?.total || 0

  const { data: joinedData, isLoading: isLoadingJoined } = useQuery({
    queryKey: ['my-challenges', joinedPage, joinedDebouncedSearch, statusFilter],
    queryFn: () => getMyChallenges({ 
      page: joinedPage, 
      limit: JOINED_PER_PAGE,
      search: joinedDebouncedSearch || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined
    }),
    staleTime: 1000,
    keepPreviousData: true
  })
  const joinedParticipations = joinedData?.data?.result?.participations || joinedData?.result?.participations || []
  const joinedTotal = joinedData?.data?.result?.total || 0
  const joinedTotalPage = joinedData?.data?.result?.totalPage || 1

  // Selected challenge
  const selectedChallenge = useMemo(() => {
    if (!selectedChallengeId) return createdChallenges[0] || null
    return createdChallenges.find((c) => c._id === selectedChallengeId) || null
  }, [selectedChallengeId, createdChallenges])

  // Auto-select first challenge
  React.useEffect(() => {
    if (createdChallenges.length > 0 && !selectedChallengeId) {
      setSelectedChallengeId(createdChallenges[0]._id)
    }
  }, [createdChallenges])

  // Leaderboard for selected challenge
  const { data: leaderboardData } = useQuery({
    queryKey: ['challengeLeaderboard', selectedChallenge?._id],
    queryFn: () => getChallengeLeaderboard(selectedChallenge?._id),
    enabled: !!selectedChallenge?._id && activeSubTab === 'overview'
  })
  const leaderboard = leaderboardData?.data?.result?.leaderboard || []

  // Participants for selected challenge
  const { data: participantsData, isLoading: isLoadingParticipants } = useQuery({
    queryKey: ['challengeParticipants', selectedChallenge?._id],
    queryFn: () => getChallengeParticipants(selectedChallenge?._id),
    enabled: !!selectedChallenge?._id && activeSubTab === 'participants'
  })
  const participants = participantsData?.data?.result?.participants || []
  const participantsTotal = participantsData?.data?.result?.total || 0

  // ─── MUTATIONS ───────────────────────────────────────────
  const deleteMutation = useSafeMutation({
    mutationFn: (id) => deleteChallenge(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-created-challenges'] })
      queryClient.invalidateQueries({ queryKey: ['challengeStats'] })
      queryClient.invalidateQueries({ queryKey: ['challenges'] })
      toast.success('Đã xóa thử thách thành công!')
      setOpenDeleteBox(false)
      setSelectedChallengeId(null)
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Không thể xóa thử thách')
      setOpenDeleteBox(false)
    }
  })

  // Sidebar filtered challenges
  const filteredSidebarChallenges = useMemo(() => {
    if (!sidebarSearch.trim()) return createdChallenges
    return createdChallenges.filter((c) => c.title.toLowerCase().includes(sidebarSearch.toLowerCase()))
  }, [createdChallenges, sidebarSearch])

  // ─── HANDLERS ────────────────────────────────────────────
  const handleSelectChallenge = (id) => {
    setSelectedChallengeId(id)
    setActiveSubTab('overview')
    setMobileShowDetail(true)
  }

  const handleDeleteClick = (id, name) => {
    setSelectedInfo({ id, name })
    setOpenDeleteBox(true)
  }

  const confirmDelete = () => {
    if (selectedInfo.id) deleteMutation.mutate(selectedInfo.id)
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
                <h1 className="text-2xl font-bold text-white tracking-tight">Quản lý Thử thách</h1>
                <p className="text-white/70 text-sm mt-0.5">Dashboard quản lý thử thách của bạn</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => navigate('/challenge')}
                className="bg-white/15 hover:bg-white/25 backdrop-blur-md text-white px-4 py-2.5 rounded-xl font-medium transition flex items-center gap-2 text-sm border border-white/20"
              >
                <FaArrowLeft className="text-xs" /> Danh sách thử thách
              </button>
              <button
                onClick={() => navigate('/challenge/create', { state: { from: '/challenge/my-challenges' } })}
                className="bg-white hover:bg-gray-50 text-indigo-600 px-5 py-2.5 rounded-xl font-semibold transition shadow-lg hover:shadow-xl flex items-center gap-2 text-sm"
              >
                <FaPlus className="text-xs" /> Tạo thử thách mới
              </button>
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
                Thử thách đã tạo ({createdTotal})
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
              challenges={filteredSidebarChallenges}
              createdTotal={createdTotal}
              selectedChallenge={selectedChallenge}
              selectedChallengeId={selectedChallengeId}
              onSelectChallenge={handleSelectChallenge}
              sidebarSearch={sidebarSearch}
              onSidebarSearchChange={setSidebarSearch}
              activeSubTab={activeSubTab}
              onSubTabChange={setActiveSubTab}
              participants={participants}
              participantsTotal={participantsTotal}
              isLoadingParticipants={isLoadingParticipants}
              leaderboard={leaderboard}
              onDeleteClick={handleDeleteClick}
              onEditClick={(c) => navigate(`/challenge/edit/${c._id}`, { state: { from: '/challenge/my-challenges' } })}
              navigate={navigate}
              mobileShowDetail={mobileShowDetail}
              onMobileBack={() => setMobileShowDetail(false)}
              statusFilter={statusFilter}
              onClearFilter={() => setStatusFilter('all')}
            />
          ) : (
            <JoinedTabContent
              isLoading={isLoadingJoined}
              participations={joinedParticipations}
              navigate={navigate}
              joinedPage={joinedPage}
              joinedTotalPage={joinedTotalPage}
              joinedTotal={joinedTotal}
              onPageChange={setJoinedPage}
              joinedSearch={joinedSearch}
              onSearchChange={setJoinedSearch}
              statusFilter={statusFilter}
              onClearFilter={() => setStatusFilter('all')}
            />
          )}
        </div>
      </div>

      {/* ═══ DELETE CONFIRM ═══ */}
      {openDeleteBox && (
        <DeleteConfirmBox
          title='Xóa thử thách'
          subtitle={`Bạn chắc chắn muốn xóa thử thách "${selectedInfo.name}"?`}
          handleDelete={confirmDelete}
          closeModal={() => setOpenDeleteBox(false)}
          isPending={deleteMutation.isPending}
        />
      )}

    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// CREATED TAB — Dashboard layout
// ═══════════════════════════════════════════════════════════
function CreatedTabContent({
  isLoading, challenges, createdTotal, selectedChallenge, selectedChallengeId, onSelectChallenge,
  sidebarSearch, onSidebarSearchChange,
  activeSubTab, onSubTabChange,
  participants, participantsTotal, isLoadingParticipants,
  leaderboard,
  onDeleteClick, onEditClick, navigate,
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
          <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">Không tìm thấy thử thách phù hợp</h3>
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
          <FaTrophy className="text-indigo-400 text-3xl" />
        </div>
        <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">Bạn chưa tạo thử thách nào</h3>
        <p className="text-gray-500 dark:text-gray-500 mb-6 max-w-md mx-auto">Hãy tạo thử thách đầu tiên để bắt đầu quản lý và theo dõi</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row min-h-[500px]">
      {/* ─── SIDEBAR (challenge list) ─── */}
      <div className={`md:w-72 lg:w-80 border-r border-gray-200 dark:border-gray-700 flex-shrink-0 ${mobileShowDetail ? 'hidden md:flex md:flex-col' : 'flex flex-col'}`}>
        {/* Search */}
        <div className="p-3 border-b border-gray-100 dark:border-gray-700">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
            <input
              type="text"
              placeholder="Tìm thử thách..."
              value={sidebarSearch}
              onChange={(e) => onSidebarSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border-0 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:text-white placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Challenge list */}
        <div className="flex-1 overflow-y-auto max-h-[600px] scrollbar-thin pr-1">
          {challenges.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
              Không tìm thấy thử thách nào phù hợp với "{sidebarSearch}"
            </div>
          ) : (
          challenges.map((challenge) => {
            const status = getStatusBadge(challenge)
            const config = TYPE_CONFIG[challenge.challenge_type] || TYPE_CONFIG.fitness
            const isSelected = challenge._id === selectedChallengeId
            return (
              <button
                key={challenge._id}
                onClick={() => onSelectChallenge(challenge._id)}
                className={`w-full text-left p-3 flex items-center gap-3 border-b border-gray-50 dark:border-gray-700/50 transition-all hover:bg-gray-50 dark:hover:bg-gray-700/50 ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-[3px] border-l-indigo-500' : 'border-l-[3px] border-l-transparent'}`}
              >
                {challenge.image ? (
                  <img src={getImageUrl(challenge.image)} alt={challenge.title} className="w-11 h-11 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className={`w-11 h-11 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center flex-shrink-0 text-lg`}>
                    {challenge.badge_emoji || '🏆'}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold truncate ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-800 dark:text-white'}`}>
                    {challenge.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-medium text-white px-1.5 py-0.5 rounded-full ${status.color}`}>
                      {status.dot && <span className="w-1 h-1 rounded-full bg-white animate-pulse" />}
                      {status.text}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      <FaUsers className="inline mr-0.5" />{challenge.participants_count || 0}
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
        {!selectedChallenge ? (
          <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500 py-20">
            <div className="text-center">
              <FaEye className="mx-auto text-4xl mb-3 opacity-50" />
              <p>Chọn một thử thách để xem chi tiết</p>
            </div>
          </div>
        ) : (
          <ChallengeDashboard
            challenge={selectedChallenge}
            activeSubTab={activeSubTab}
            onSubTabChange={onSubTabChange}
            participants={participants}
            participantsTotal={participantsTotal}
            isLoadingParticipants={isLoadingParticipants}
            leaderboard={leaderboard}
            onDeleteClick={onDeleteClick}
            onEditClick={onEditClick}
            navigate={navigate}
            onMobileBack={onMobileBack}
          />
        )}
      </div>
    </div>
  )
}

// Helper: status badge
function getStatusBadge(challenge) {
  const now = moment()
  const start = moment(challenge.start_date)
  const end = moment(challenge.end_date)
  if (now.isAfter(end)) return { text: 'Đã kết thúc', color: 'bg-gray-500', dot: false }
  if (now.isBefore(start)) return { text: 'Sắp diễn ra', color: 'bg-amber-500', dot: false }
  return { text: 'Đang diễn ra', color: 'bg-emerald-500', dot: true }
}

// ═══════════════════════════════════════════════════════════
// CHALLENGE DASHBOARD — Main detail area with sub-tabs
// ═══════════════════════════════════════════════════════════
function ChallengeDashboard({
  challenge, activeSubTab, onSubTabChange,
  participants, participantsTotal, isLoadingParticipants,
  leaderboard,
  onDeleteClick, onEditClick, navigate, onMobileBack
}) {
  const status = getStatusBadge(challenge)
  const config = TYPE_CONFIG[challenge.challenge_type] || TYPE_CONFIG.fitness

  return (
    <div className="flex flex-col h-full">
      {/* Challenge header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        {/* Mobile back button */}
        <button onClick={onMobileBack} className="md:hidden flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 font-medium mb-3">
          <FaChevronLeft className="text-xs" /> Quay lại danh sách
        </button>

        <div className="flex items-center gap-4">
          {challenge.image ? (
            <img src={getImageUrl(challenge.image)} alt={challenge.title} className="w-16 h-16 rounded-xl object-cover flex-shrink-0 shadow" />
          ) : (
            <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center flex-shrink-0 shadow text-2xl`}>
              {challenge.badge_emoji || '🏆'}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">{challenge.title}</h2>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium text-white px-2.5 py-1 rounded-full ${status.color}`}>
                {status.dot && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                {status.text}
              </span>
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${config.bg} ${config.text}`}>
                {config.icon} {config.label}
              </span>
              <span className="text-xs text-gray-500 flex items-center gap-1"><FaCalendarAlt /> {moment(challenge.start_date).format('DD/MM/YYYY')} - {moment(challenge.end_date).format('DD/MM/YYYY')}</span>
              <span className="text-xs text-gray-500 flex items-center gap-1"><FaUsers /> {challenge.participants_count || 0}</span>
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
          <OverviewSubTab challenge={challenge} leaderboard={leaderboard} navigate={navigate} />
        )}
        {activeSubTab === 'participants' && (
          <ParticipantsSubTab
            challenge={challenge}
            participants={participants}
            participantsTotal={participantsTotal}
            isLoading={isLoadingParticipants}
          />
        )}
        {activeSubTab === 'settings' && (
          <SettingsSubTab challenge={challenge} onDeleteClick={onDeleteClick} onEditClick={onEditClick} navigate={navigate} />
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// SUB-TAB: Overview
// ═══════════════════════════════════════════════════════════
function OverviewSubTab({ challenge, leaderboard, navigate }) {
  const config = TYPE_CONFIG[challenge.challenge_type] || TYPE_CONFIG.fitness

  // Calculate total required days
  const safeStart = new Date(challenge.start_date); safeStart.setHours(0, 0, 0, 0)
  const safeEnd = new Date(challenge.end_date); safeEnd.setHours(0, 0, 0, 0)
  const totalRequiredDays = Math.max(1, Math.ceil((safeEnd.getTime() - safeStart.getTime()) / (1000 * 60 * 60 * 24)) + 1)

  return (
    <div className="space-y-6">
      {/* Info grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <InfoCard icon={FaCalendarAlt} label="Bắt đầu" value={moment(challenge.start_date).format('DD/MM/YYYY')} color="text-blue-500" />
        <InfoCard icon={FaCalendarAlt} label="Kết thúc" value={moment(challenge.end_date).format('DD/MM/YYYY')} color="text-red-400" />
        <InfoCard icon={FaBullseye} label="Mục tiêu/ngày" value={`${challenge.goal_value} ${challenge.goal_unit}`} color="text-orange-500" />
        <InfoCard icon={FaClock} label="Tổng số ngày" value={`${totalRequiredDays} ngày`} color="text-green-500" />
      </div>

      {/* Description */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Mô tả</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap line-clamp-4">{challenge.description || 'Chưa có mô tả.'}</p>
      </div>

      {/* Challenge type specific info */}
      <div className={`bg-gradient-to-r ${challenge.challenge_type === 'nutrition' ? 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-100 dark:border-emerald-800/30' : challenge.challenge_type === 'outdoor_activity' ? 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-100 dark:border-blue-800/30' : 'from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 border-indigo-100 dark:border-indigo-800/30'} rounded-xl p-4 border`}>
        <h4 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${config.text}`}>
          {config.icon} Thông tin thử thách
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          <div>
            <span className="text-gray-400 text-xs block mb-0.5">Loại thử thách</span>
            <span className={`font-medium ${config.text} flex items-center gap-1`}>{config.icon} {config.label}</span>
          </div>
          <div>
            <span className="text-gray-400 text-xs block mb-0.5">Mục tiêu mỗi ngày</span>
            <span className="font-medium text-gray-800 dark:text-white">{challenge.goal_value} {challenge.goal_unit}</span>
          </div>
          <div>
            <span className="text-gray-400 text-xs block mb-0.5">Số người tham gia</span>
            <span className="font-medium text-gray-800 dark:text-white">{challenge.participants_count || 0} người</span>
          </div>
          {challenge.badge_emoji && (
            <div>
              <span className="text-gray-400 text-xs block mb-0.5">Huy hiệu</span>
              <span className="text-2xl">{challenge.badge_emoji}</span>
            </div>
          )}
          {challenge.kcal_per_unit > 0 && (
            <div>
              <span className="text-gray-400 text-xs block mb-0.5">Kcal/đơn vị</span>
              <span className="font-medium text-gray-800 dark:text-white">{challenge.kcal_per_unit} kcal</span>
            </div>
          )}
        </div>
      </div>

      {/* Leaderboard preview top 5 */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <MdLeaderboard className="text-amber-500" /> Bảng xếp hạng (Top 5)
        </h4>
        {leaderboard.length > 0 ? (
          <div className="space-y-2">
            {leaderboard.slice(0, 5).map((entry, idx) => (
              <div key={entry.user?._id || idx} className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 flex items-center justify-center flex-shrink-0">
                    {idx === 0 && <FaTrophy className="text-yellow-500" />}
                    {idx === 1 && <FaMedal className="text-gray-400" />}
                    {idx === 2 && <FaMedal className="text-amber-600" />}
                    {idx >= 3 && <span className="text-xs font-bold text-gray-400">{idx + 1}</span>}
                  </div>
                  <img src={entry.user?.avatar ? getImageUrl(entry.user.avatar) : useravatar} alt="" className="w-7 h-7 rounded-full flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-800 dark:text-white truncate">{entry.user?.name || 'Người dùng'}</span>
                  {entry.streak_count > 0 && (
                    <span className="text-[10px] text-orange-500 flex items-center gap-0.5 flex-shrink-0">
                      <FaFire /> {entry.streak_count}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {entry.current_value}/{entry.total_required_days} ngày
                  </span>
                  {entry.is_completed && <span className="text-green-500 text-xs">✅</span>}
                </div>
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
function ParticipantsSubTab({ challenge, participants, participantsTotal, isLoading }) {
  const config = TYPE_CONFIG[challenge.challenge_type] || TYPE_CONFIG.fitness

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          <BsPeopleFill className="inline mr-1.5 text-indigo-500" />
          Người tham gia ({participantsTotal})
        </h4>
      </div>

      {/* Participants list */}
      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
        </div>
      ) : participants.length > 0 ? (
        <div className="space-y-2">
          {participants.map((p) => {
            const rowPct = getChallengePersonalProgressPercent(challenge, p)
            return (
            <div key={p.user?._id || p.rank} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition">
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
                <img src={p.user?.avatar ? getImageUrl(p.user.avatar) : useravatar} alt="" className="w-9 h-9 rounded-full flex-shrink-0 border-2 border-white dark:border-gray-600 shadow-sm" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{p.user?.name || 'Người dùng'}</p>
                  <div className="flex items-center gap-2 text-[10px] text-gray-400">
                    <span>{p.current_value}/{p.total_required_days} ngày</span>
                    {p.streak_count > 0 && <span className="text-orange-500 flex items-center gap-0.5"><FaFire /> {p.streak_count}</span>}
                    {p.is_completed && <span className="text-green-600 font-bold">✅ Hoàn thành</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="hidden sm:block w-24">
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${rowPct >= 100 ? 'bg-green-500' : 'bg-indigo-500'}`}
                      style={{ width: `${rowPct}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 min-w-[36px] text-right">
                  {rowPct}%
                </span>
              </div>
            </div>
            )
          })}
        </div>
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
// SUB-TAB: Settings
// ═══════════════════════════════════════════════════════════
function SettingsSubTab({ challenge, onDeleteClick, onEditClick, navigate }) {
  const config = TYPE_CONFIG[challenge.challenge_type] || TYPE_CONFIG.fitness

  return (
    <div className="space-y-6 max-w-xl">
      {/* Quick info */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5 space-y-4">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <FaCog className="text-gray-400" /> Thông tin thử thách
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400 text-xs block mb-0.5">Tên thử thách</span>
            <span className="text-gray-800 dark:text-white font-medium">{challenge.title}</span>
          </div>
          <div>
            <span className="text-gray-400 text-xs block mb-0.5">Loại thử thách</span>
            <span className={`font-medium ${config.text} flex items-center gap-1`}>{config.icon} {config.label}</span>
          </div>
          <div>
            <span className="text-gray-400 text-xs block mb-0.5">Mục tiêu/ngày</span>
            <span className="text-gray-800 dark:text-white font-medium">{challenge.goal_value} {challenge.goal_unit}</span>
          </div>
          <div>
            <span className="text-gray-400 text-xs block mb-0.5">Số người tham gia</span>
            <span className="text-gray-800 dark:text-white font-medium">{challenge.participants_count || 0} người</span>
          </div>
          <div>
            <span className="text-gray-400 text-xs block mb-0.5">Ngày bắt đầu</span>
            <span className="text-gray-800 dark:text-white font-medium">{moment(challenge.start_date).format('DD/MM/YYYY')}</span>
          </div>
          <div>
            <span className="text-gray-400 text-xs block mb-0.5">Ngày kết thúc</span>
            <span className="text-gray-800 dark:text-white font-medium">{moment(challenge.end_date).format('DD/MM/YYYY')}</span>
          </div>
          {challenge.badge_emoji && (
            <div>
              <span className="text-gray-400 text-xs block mb-0.5">Huy hiệu</span>
              <span className="text-2xl">{challenge.badge_emoji}</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => onEditClick(challenge)}
          className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-semibold transition shadow-lg"
        >
          <FaEdit /> Sửa thử thách
        </button>
        <button
          onClick={() => navigate(`/challenge/${challenge._id}`)}
          className="flex-1 flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-5 py-3 rounded-xl font-semibold transition"
        >
          <FaEye /> Xem trang thử thách
        </button>
      </div>

      {/* Danger zone */}
      <div className="border border-red-200 dark:border-red-900/50 rounded-xl p-5 bg-red-50/50 dark:bg-red-900/10">
        <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">Vùng nguy hiểm</h4>
        <p className="text-xs text-red-600/70 dark:text-red-400/70 mb-4">Xóa thử thách sẽ không thể hoàn tác. Tất cả dữ liệu liên quan sẽ bị ẩn.</p>
        <button
          onClick={() => onDeleteClick(challenge._id, challenge.title)}
          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-xl font-medium transition text-sm"
        >
          <FaTrash className="text-xs" /> Xóa thử thách
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// JOINED TAB — Card grid
// ═══════════════════════════════════════════════════════════
function JoinedTabContent({ isLoading, participations, navigate, joinedPage, joinedTotalPage, joinedTotal, onPageChange, joinedSearch, onSearchChange, statusFilter, onClearFilter }) {
  if (isLoading) {
    return (
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-gray-50 dark:bg-gray-700 rounded-xl h-64 animate-pulse" />
        ))}
      </div>
    )
  }

  if (joinedTotal === 0) {
    if (joinedSearch || statusFilter !== 'all') {
      return (
        <div className="text-center py-20 px-6">
          <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
            <FaSearch className="text-indigo-400 text-3xl" />
          </div>
          <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">Không tìm thấy thử thách phù hợp</h3>
          <p className="text-gray-500 mb-6">Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          <button
            onClick={() => { onSearchChange(''); onClearFilter(); }}
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
          <FaTrophy className="text-indigo-400 text-3xl" />
        </div>
        <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">Bạn chưa tham gia thử thách nào</h3>
        <p className="text-gray-500 mb-6">Khám phá và tham gia các thử thách thú vị!</p>
        <Link to="/challenge" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition shadow-lg">
          Khám phá thử thách
        </Link>
      </div>
    )
  }

  return (
    <div className="p-5">
      {/* Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
          <input
            type="text"
            placeholder="Tìm kiếm thử thách..."
            value={joinedSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:text-white placeholder:text-gray-400 transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {participations.map((participation) => {
          const challenge = participation.challenge_id || participation.challenge
          if (!challenge) return null
          const config = TYPE_CONFIG[challenge.challenge_type] || TYPE_CONFIG.fitness
          const status = getStatusBadge(challenge)

          const totalRequiredDays = getChallengeTotalRequiredDays(challenge)
          const progress = getChallengePersonalProgressPercent(challenge, participation)

          return (
            <div
              key={participation._id}
              onClick={() => navigate(`/challenge/${challenge._id}`)}
              className="bg-gray-50 dark:bg-gray-700/50 rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all group border border-gray-100 dark:border-gray-600/50 hover:border-indigo-200 dark:hover:border-indigo-700"
            >
              {/* Image */}
              <div className="relative h-36">
                {challenge.image ? (
                  <img src={getImageUrl(challenge.image)} alt={challenge.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${config.gradient} flex items-center justify-center group-hover:scale-105 transition-transform duration-300`}>
                    <span className="text-5xl opacity-40">{challenge.badge_emoji || '🏆'}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <span className={`absolute top-2.5 left-2.5 inline-flex items-center gap-1 text-[10px] font-semibold text-white px-2 py-1 rounded-full ${status.color}`}>
                  {status.dot && <span className="w-1 h-1 rounded-full bg-white animate-pulse" />}
                  {status.text}
                </span>
                <span className={`absolute top-2.5 right-2.5 inline-flex items-center gap-1 text-[10px] font-medium text-white px-2 py-1 rounded-full ${config.bg.replace('dark:bg-', 'bg-').split(' ')[0].replace('bg-', 'bg-')}`} style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
                  {config.icon} {config.label}
                </span>
              </div>
              {/* Info */}
              <div className="p-3.5">
                <h4 className="text-sm font-bold text-gray-800 dark:text-white truncate mb-2">{challenge.title}</h4>
                <div className="flex items-center gap-3 text-[11px] text-gray-500 dark:text-gray-400 mb-2">
                  <span className="flex items-center gap-1"><FaCalendarAlt />{moment(challenge.start_date).format('DD/MM')}</span>
                  <span className="flex items-center gap-1"><FaBullseye />{challenge.goal_value} {challenge.goal_unit}/ngày</span>
                  <span className="flex items-center gap-1"><FaUsers />{challenge.participants_count || 0}</span>
                </div>
                <div className="mb-2">
                  <div className="flex justify-between text-[10px] text-gray-400 mb-1 gap-2">
                    <span>
                      <span className="font-medium text-gray-500 dark:text-gray-400">Tiến độ cá nhân</span>
                      <span className="mx-1">·</span>
                      <span>{participation.current_value}/{totalRequiredDays} ngày</span>
                    </span>
                    <span className={`font-bold flex-shrink-0 ${progress >= 100 ? 'text-green-600' : ''}`}>{progress}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full bg-gradient-to-r ${config.gradient} transition-all duration-500`} style={{ width: `${progress}%` }} />
                  </div>
                </div>
                {/* Stats */}
                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                  {participation.streak_count > 0 && <span className="flex items-center gap-0.5 text-orange-500"><FaFire /> {participation.streak_count} ngày</span>}
                  {participation.is_completed && <span className="text-green-600 font-bold">✅ Hoàn thành</span>}
                  <span className="flex items-center gap-0.5 text-emerald-500"><MdCheckCircle /> Đã tham gia</span>
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
    </div>
  )
}
