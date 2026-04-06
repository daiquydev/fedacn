import React, { useState, useMemo, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getChallengeFeed, joinChallenge, quitChallenge } from '../../apis/challengeApi'
import { currentAccount } from '../../apis/userApi'
import { toast } from 'react-hot-toast'
import {
  FaUtensils, FaRunning, FaDumbbell, FaPlus, FaSearch, FaTrophy,
  FaUsers, FaClock, FaFire, FaChevronRight, FaFilter, FaStar,
  FaTimes, FaChevronDown, FaSortAmountDown, FaCalendarAlt, FaCheck,
  FaGlobe, FaUserFriends, FaUser
} from 'react-icons/fa'
import { MdCheckCircle } from 'react-icons/md'
import { BsClockHistory, BsCalendarCheck } from 'react-icons/bs'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import { useSafeMutation } from '../../hooks/useSafeMutation'
import { getImageUrl } from '../../utils/imageUrl'
import useravatar from '../../assets/images/useravatar.jpg'
import ParticipantsList from '../../components/ParticipantsList'
import CreateChallengeModal from './components/CreateChallengeModal'

const TYPE_CONFIG = {
  nutrition: { icon: <FaUtensils />, label: 'Ăn uống', gradient: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300' },
  outdoor_activity: { icon: <FaRunning />, label: 'Ngoài trời', gradient: 'from-blue-500 to-cyan-600', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300' },
  fitness: { icon: <FaDumbbell />, label: 'Thể dục', gradient: 'from-purple-500 to-pink-600', bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300' }
}

// Challenge Card — styled after SportEventCard
function ChallengeCard({ challenge, onJoin, onQuit, joinLoading, friendIds = new Set(), connectedIds = new Set() }) {
  const navigate = useNavigate()
  const config = TYPE_CONFIG[challenge.challenge_type] || TYPE_CONFIG.fitness

  const daysLeft = Math.max(0, Math.ceil((new Date(challenge.end_date) - new Date()) / (86400000)))
  const isExpired = daysLeft <= 0

  const safeStartDate = new Date(challenge.start_date || new Date())
  const safeEndDate = new Date(challenge.end_date || new Date())
  safeStartDate.setHours(0, 0, 0, 0)
  safeEndDate.setHours(0, 0, 0, 0)
  const totalRequiredDays = Math.max(1, Math.ceil((safeEndDate.getTime() - safeStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1)

  const progress = challenge.myProgress
    ? Math.min(Math.round((challenge.myProgress.current_value / totalRequiredDays) * 100), 100)
    : 0

  return (
    <div
      onClick={() => navigate(`/challenge/${challenge._id}`)}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700 flex flex-col h-full"
    >
      {/* Image / Gradient Header */}
      <div className="relative h-48">
        {challenge.image ? (
          <img src={getImageUrl(challenge.image)} alt={challenge.title} className="w-full h-full object-cover" />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
            <span className="text-7xl opacity-30">{challenge.badge_emoji || '🏆'}</span>
          </div>
        )}

        {/* Type Badge */}
        <div className={`absolute top-3 left-3 bg-white dark:bg-gray-900 font-medium px-3 py-1 rounded-full text-sm flex items-center gap-1.5 ${config.text}`}>
          {config.icon} <span>{challenge.category && challenge.challenge_type === 'outdoor_activity' ? challenge.category : config.label}</span>
        </div>

        {/* Participant Count Badge */}
        <div className="absolute top-3 right-3 bg-white dark:bg-gray-900 text-orange-500 font-medium px-3 py-1 rounded-full text-sm">
          {challenge.participants_count} người
        </div>

        {/* Status Badge */}
        <div className={`absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${isExpired
          ? 'bg-gray-800/70 text-gray-300'
          : 'bg-emerald-500/80 text-white'
          }`}>
          {isExpired ? (
            <><BsClockHistory className="text-[10px]" /> Đã kết thúc</>
          ) : (
            <><span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Đang diễn ra</>
          )}
        </div>


      </div>

      {/* Details */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white line-clamp-2">{challenge.title}</h3>

        <div className="space-y-2 mb-3">
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <FaFire className="mr-2 text-amber-500" />
            <span>Mỗi ngày: {challenge.goal_value} {challenge.goal_unit}</span>
          </div>
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <FaCalendarAlt className="mr-2" />
            <span>{new Date(challenge.start_date).toLocaleDateString('vi-VN')} - {new Date(challenge.end_date).toLocaleDateString('vi-VN')}</span>
          </div>
          {challenge.challenge_type === 'nutrition' && challenge.nutrition_sub_type === 'time_window' && challenge.time_window_start && challenge.time_window_end && (
            <div className="flex items-center text-xs font-bold text-amber-700 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-400 px-2 py-1 rounded w-max mt-1">
              <FaClock className="mr-1.5" />
              <span>Khung giờ: {challenge.time_window_start} - {challenge.time_window_end}</span>
            </div>
          )}
          {!isExpired && daysLeft > 0 && (
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <FaClock className="mr-2" />
              <span>Còn {daysLeft} ngày</span>
            </div>
          )}
        </div>

        {challenge.description && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">{challenge.description}</p>
        )}

        {/* Participants avatar row */}
        {(() => {
          const previewUsers = (challenge.participants_preview || []).map(p => ({
            id: p._id || p,
            name: p.name || 'Người dùng',
            avatar: p.avatar ? getImageUrl(p.avatar) : useravatar,
          }))
          return previewUsers.length > 0 ? (
            <div className="mb-3" onClick={(e) => e.stopPropagation()}>
              <ParticipantsList
                participants={previewUsers}
                initialLimit={4}
                size="sm"
                title={null}
                showCount={false}
                friendIds={friendIds}
                connectedIds={connectedIds}
              />
            </div>
          ) : null
        })()}

        {/* Progress bar (if joined) */}
        {challenge.isJoined && (
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-medium text-gray-500">Tiến độ</span>
              <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300">{progress}%</span>
            </div>
            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${config.gradient} transition-all duration-500`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Join Button */}
        <div className="mt-auto pt-2 border-t border-gray-100 dark:border-gray-700">
          {challenge.isJoined ? (
            <button
              onClick={(e) => e.stopPropagation()}
              className="w-full py-2 bg-green-50 text-green-600 rounded-md text-sm font-bold flex justify-center items-center cursor-default dark:bg-green-900/20 dark:text-green-400 gap-2"
            >
              <MdCheckCircle /> Đã tham gia
            </button>
          ) : isExpired ? (
            <button onClick={(e) => e.stopPropagation()} className="w-full py-2 bg-gray-200 text-gray-500 rounded-md text-sm font-bold flex justify-center items-center cursor-default dark:bg-gray-700 dark:text-gray-400 gap-2">
              Thử thách đã kết thúc
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onJoin(challenge._id) }}
              disabled={joinLoading}
              className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {joinLoading ? <AiOutlineLoading3Quarters className="animate-spin" /> : <FaPlus className="text-xs" />}
              Tham gia ngay
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Challenge() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [searchTerm, setSearchTerm] = useState('')
  const [activeType, setActiveType] = useState('all')
  const [sortBy, setSortBy] = useState('popular')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [filterOngoing, setFilterOngoing] = useState(false)
  const [page, setPage] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [scope, setScope] = useState('public')
  const [showScopeMenu, setShowScopeMenu] = useState(false)
  const scopeRef = useRef(null)

  const SCOPE_OPTIONS = [
    { value: 'public', label: 'Công khai', icon: FaGlobe, color: 'text-blue-600' },
    { value: 'friends', label: 'Bạn bè', icon: FaUserFriends, color: 'text-emerald-600' },
    { value: 'mine', label: 'Của tôi', icon: FaUser, color: 'text-orange-600' }
  ]
  const activeScope = SCOPE_OPTIONS.find(s => s.value === scope)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (scopeRef.current && !scopeRef.current.contains(e.target)) setShowScopeMenu(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const ITEMS_PER_PAGE = 9

  const { data, isLoading, error } = useQuery({
    queryKey: ['challenges-feed', scope, activeType, searchTerm, page],
    queryFn: () => getChallengeFeed({
      scope,
      challenge_type: activeType === 'all' ? undefined : activeType,
      search: searchTerm || undefined,
      page,
      limit: ITEMS_PER_PAGE
    }),
    staleTime: 1000
  })

  const challenges = data?.data?.result?.challenges || []
  const totalPage = data?.data?.result?.totalPage || 1

  // Fetch current user's social graph for ParticipantsList social rings
  const { data: meData } = useQuery({
    queryKey: ['me'],
    queryFn: currentAccount
  })
  const me = meData?.data?.result?.[0]
  const myFollowers = useMemo(() => me?.followers || [], [me])
  const myFollowings = useMemo(() => me?.followings || [], [me])
  const followerIds = useMemo(() => new Set(myFollowers.map(p => String(p._id))), [myFollowers])
  const followingIds = useMemo(() => new Set(myFollowings.map(p => String(p._id))), [myFollowings])
  const myFriends = useMemo(() => myFollowers.filter(p => followingIds.has(String(p._id))), [myFollowers, followingIds])
  const friendIds = useMemo(() => new Set(myFriends.map(p => String(p._id))), [myFriends])
  const connectedIds = useMemo(() => new Set([...followerIds, ...followingIds]), [followerIds, followingIds])

  useEffect(() => { setPage(1) }, [searchTerm, activeType, sortBy, filterOngoing, scope])

  const joinMutation = useSafeMutation({
    mutationFn: (id) => joinChallenge(id),
    onSuccess: () => { toast.success('Đã tham gia thử thách!'); queryClient.invalidateQueries({ queryKey: ['challenges-feed'] }) },
    onError: (err) => toast.error(err?.response?.data?.message || 'Lỗi khi tham gia')
  })

  const quitMutation = useSafeMutation({
    mutationFn: (id) => quitChallenge(id),
    onSuccess: () => { toast.success('Đã rời thử thách'); queryClient.invalidateQueries({ queryKey: ['challenges-feed'] }) },
    onError: (err) => toast.error(err?.response?.data?.message || 'Lỗi khi rời')
  })

  // Sort & filter client-side
  const sortedChallenges = useMemo(() => {
    let sorted = [...challenges]
    if (filterOngoing) {
      const now = new Date()
      sorted = sorted.filter(c => new Date(c.start_date) <= now && now <= new Date(c.end_date))
    }
    if (sortBy === 'popular') sorted.sort((a, b) => (b.participants_count || 0) - (a.participants_count || 0))
    else if (sortBy === 'newest') sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    else if (sortBy === 'ending_soon') sorted.sort((a, b) => new Date(a.end_date) - new Date(b.end_date))
    else if (sortBy === 'joined') sorted = sorted.filter(c => c.isJoined)
    return sorted
  }, [challenges, sortBy, filterOngoing])

  // Skeleton
  const SkeletonCard = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700 animate-pulse">
      <div className="h-48 bg-gray-300 dark:bg-gray-700" />
      <div className="p-4">
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded mb-3 w-3/4" />
        <div className="space-y-2 mb-3">
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2" />
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-2/3" />
        </div>
        <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded" />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Page Header — matching SportEvent header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-amber-600 to-orange-500 px-6 py-4">
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 container mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
              <FaTrophy className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Thử thách</h1>
              <p className="text-white/75 text-xs mt-0.5">Thử thách bản thân và cùng cộng đồng chinh phục mục tiêu</p>
            </div>
          </div>
          <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
            <Link
              to="/challenge/my-challenges"
              className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2 text-sm"
            >
              <FaStar /> Thử thách của tôi
            </Link>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-white hover:bg-gray-50 text-orange-600 px-4 py-2 rounded-xl font-semibold transition shadow-lg hover:shadow-xl flex items-center gap-2 text-sm"
            >
              <FaPlus /> Tạo thử thách
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filters — matching SportEvent filter card */}
      <div className="container mx-auto px-4 pt-6 pb-2">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">

          {/* Row 1: Search + Filter toggle */}
          <div className="p-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1 min-w-0">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    <FaTimes size={12} />
                  </button>
                )}
                <input
                  type="text"
                  placeholder="Tìm theo tên thử thách, mô tả..."
                  className="w-full pl-10 pr-8 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:bg-white dark:focus:bg-gray-600 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2 items-center">
                {/* Scope Dropdown */}
                <div className="relative" ref={scopeRef}>
                  <button
                    onClick={() => setShowScopeMenu(v => !v)}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border transition-all shrink-0 ${
                      scope !== 'public'
                        ? 'bg-orange-50 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300'
                        : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-300'
                    }`}
                  >
                    {activeScope && <activeScope.icon size={12} className={activeScope.color} />}
                    <span>{activeScope?.label}</span>
                    <FaChevronDown size={10} className={`transition-transform ${showScopeMenu ? 'rotate-180' : ''}`} />
                  </button>
                  {showScopeMenu && (
                    <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden">
                      {SCOPE_OPTIONS.map(opt => {
                        const Icon = opt.icon
                        return (
                          <button
                            key={opt.value}
                            onClick={() => { setScope(opt.value); setShowScopeMenu(false) }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                              scope === opt.value
                                ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
                                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                          >
                            <Icon size={14} className={opt.color} />
                            {opt.label}
                            {scope === opt.value && <FaCheck size={10} className="ml-auto text-orange-500" />}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setFilterOngoing(v => !v)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border transition-all shrink-0 ${
                    filterOngoing
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 shadow-sm'
                      : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-emerald-300 hover:text-emerald-600'
                  }`}
                >
                  {filterOngoing ? <FaCheck size={10} /> : <FaUsers size={12} />}
                  Đang diễn ra
                </button>
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border transition-all shrink-0 ${showAdvanced || sortBy !== 'popular'
                    ? 'bg-orange-50 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300'
                    : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-300'
                    }`}
                >
                  <FaFilter size={12} />
                  Bộ lọc
                  {([sortBy !== 'popular'].filter(Boolean).length > 0) && (
                    <span className="w-5 h-5 rounded-full bg-orange-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {[sortBy !== 'popular'].filter(Boolean).length}
                    </span>
                  )}
                  <FaChevronDown size={10} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            {/* Active filter chips */}
            {(activeType !== 'all' || sortBy !== 'popular' || searchTerm || filterOngoing || scope !== 'public') && (
              <div className="flex flex-wrap gap-2 mt-3">
                {scope !== 'public' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                    {scope === 'friends' ? '👥 Bạn bè' : '👤 Của tôi'}
                    <button onClick={() => setScope('public')}><FaTimes size={9} /></button>
                  </span>
                )}
                {activeType !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                    {TYPE_CONFIG[activeType]?.icon} {TYPE_CONFIG[activeType]?.label}
                    <button onClick={() => setActiveType('all')}><FaTimes size={9} /></button>
                  </span>
                )}
                {filterOngoing && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                    ✅ Đang diễn ra
                    <button onClick={() => setFilterOngoing(false)}><FaTimes size={9} /></button>
                  </span>
                )}
                {sortBy !== 'popular' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                    ↕️ {{ newest: 'Mới nhất', ending_soon: 'Sắp kết thúc', joined: 'Đã tham gia' }[sortBy] || sortBy}
                    <button onClick={() => setSortBy('popular')}><FaTimes size={9} /></button>
                  </span>
                )}
                <button
                  onClick={() => { setSearchTerm(''); setActiveType('all'); setSortBy('popular'); setFilterOngoing(false); setScope('public') }}
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-full transition-colors"
                >
                  <FaTimes size={9} /> Xóa tất cả
                </button>
              </div>
            )}
          </div>

          {/* Row 2: Challenge Type Tabs */}
          <div className="px-4 pb-3">
            <div className="flex bg-gray-100 dark:bg-gray-700/50 p-1.5 rounded-xl w-full overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveType('all')}
                className={`flex-1 px-6 py-2.5 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${activeType === 'all'
                  ? 'bg-white text-orange-600 shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 hover:bg-white/50'
                  }`}
              >
                Tất cả loại
              </button>
              <button
                onClick={() => setActiveType('nutrition')}
                className={`flex-1 px-6 py-2.5 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${activeType === 'nutrition'
                  ? 'bg-white text-emerald-600 shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 hover:bg-white/50'
                  }`}
              >
                🥗 Ăn uống
              </button>
              <button
                onClick={() => setActiveType('outdoor_activity')}
                className={`flex-1 px-6 py-2.5 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${activeType === 'outdoor_activity'
                  ? 'bg-white text-blue-600 shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 hover:bg-white/50'
                  }`}
              >
                🏃 Ngoài trời
              </button>
              <button
                onClick={() => setActiveType('fitness')}
                className={`flex-1 px-6 py-2.5 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${activeType === 'fitness'
                  ? 'bg-white text-purple-600 shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 hover:bg-white/50'
                  }`}
              >
                💪 Thể dục
              </button>
            </div>
          </div>


          {/* Collapsible Advanced Filters */}
          {showAdvanced && (
            <div className="px-4 pb-4 pt-0 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3 mt-3">
                <FaSortAmountDown className="text-gray-400 text-sm shrink-0" />
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase shrink-0">Sắp xếp:</span>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { value: 'popular', label: 'Phổ biến nhất' },
                    { value: 'newest', label: 'Mới nhất' },
                    { value: 'ending_soon', label: 'Sắp kết thúc' },
                    { value: 'joined', label: 'Đã tham gia' }
                  ].map(s => (
                    <button
                      key={s.value}
                      onClick={() => setSortBy(s.value)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${sortBy === s.value
                        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 ring-1 ring-orange-300 dark:ring-orange-700'
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

      {/* Challenge Grid */}
      <div className="container mx-auto px-4 py-8">
        {!isLoading && (
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Hiển thị <span className="font-semibold text-gray-900 dark:text-white">{sortedChallenges.length}</span> / {challenges.length} thử thách
              {totalPage > 1 && <span className="text-gray-400 ml-2">(trang {page}/{totalPage})</span>}
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="text-red-500 text-5xl mb-4">❌</div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Không thể tải danh sách thử thách</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Vui lòng thử lại sau</p>
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['challenges'] })}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              Thử lại
            </button>
          </div>
        ) : sortedChallenges.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedChallenges.map(challenge => (
                <ChallengeCard
                  key={challenge._id}
                  challenge={challenge}
                  onJoin={(id) => joinMutation.mutate(id)}
                  onQuit={(id) => quitMutation.mutate(id)}
                  joinLoading={joinMutation.isPending || quitMutation.isPending}
                  friendIds={friendIds}
                  connectedIds={connectedIds}
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
                {Array.from({ length: totalPage }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                    className={`w-9 h-9 text-sm rounded-lg font-semibold transition-colors ${p === page ? 'bg-orange-600 text-white shadow-md' : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                  >
                    {p}
                  </button>
                ))}
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
          <div className="text-center py-16">
            <FaTrophy className="mx-auto text-gray-400 text-6xl mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">Không tìm thấy thử thách phù hợp</h3>
            <p className="text-gray-500 dark:text-gray-500 mb-6">Hãy thử điều chỉnh bộ lọc hoặc tìm kiếm với từ khóa khác</p>
            <button
              onClick={() => { setSearchTerm(''); setActiveType('all'); setDifficulty('all') }}
              className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg font-semibold transition"
            >
              Xóa bộ lọc
            </button>
          </div>
        )}
      </div>

      <CreateChallengeModal
        open={showCreateModal}
        onClose={() => { setShowCreateModal(false); queryClient.invalidateQueries({ queryKey: ['challenges'] }) }}
      />


    </div>
  )
}
