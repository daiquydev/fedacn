import React, { useState, useMemo, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { getChallengeFeed, joinChallenge } from '../../apis/challengeApi'
import sportCategoryApi from '../../apis/sportCategoryApi'
import { currentAccount } from '../../apis/userApi'
import { toast } from 'react-hot-toast'
import {
  FaUtensils, FaRunning, FaDumbbell, FaPlus, FaSearch, FaTrophy,
  FaUsers, FaClock, FaFire, FaFilter, FaStar,
  FaTimes, FaChevronDown, FaSortAmountDown, FaCalendarAlt, FaCheck,
  FaGlobe, FaUserFriends, FaLock
} from 'react-icons/fa'
import { MdCheckCircle, MdSportsSoccer } from 'react-icons/md'
import { BsClockHistory, BsCalendarCheck } from 'react-icons/bs'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import { useSafeMutation } from '../../hooks/useSafeMutation'
import { getImageUrl } from '../../utils/imageUrl'
import { getChallengePersonalProgressPercent } from '../../utils/challengeProgress'
import { getSportIcon } from '../../utils/sportIcons'
import useravatar from '../../assets/images/useravatar.jpg'
import ParticipantsList from '../../components/ParticipantsList'
import moment from 'moment'

const TYPE_CONFIG = {
  nutrition: { icon: <FaUtensils />, label: 'Ăn uống', gradient: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300' },
  outdoor_activity: { icon: <FaRunning />, label: 'Ngoài trời', gradient: 'from-blue-500 to-cyan-600', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300' },
  fitness: { icon: <FaDumbbell />, label: 'Thể dục', gradient: 'from-purple-500 to-pink-600', bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300' }
}

const VISIBILITY_CONFIG = {
  public: { icon: <FaGlobe />, label: 'Công khai', bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400', border: 'border-green-200 dark:border-green-800' },
  friends: { icon: <FaUserFriends />, label: 'Bạn bè', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
  private: { icon: <FaLock />, label: 'Chỉ mình tôi', bg: 'bg-gray-50 dark:bg-gray-700/40', text: 'text-gray-500 dark:text-gray-400', border: 'border-gray-200 dark:border-gray-600' }
}

/** Banner carousel — cùng pattern trang Sự kiện Thể thao */
function FeaturedChallengesBanner({ challenges, navigate }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    if (challenges.length <= 1) return
    timerRef.current = setInterval(() => setActiveIdx(i => (i + 1) % challenges.length), 5000)
    return () => clearInterval(timerRef.current)
  }, [challenges.length])

  const c = challenges[activeIdx]
  if (!c) return null

  const endM = moment(c.end_date)
  const startM = moment(c.start_date)
  const now = moment()
  const isOngoing = now.isSameOrAfter(startM.startOf('day')) && now.isSameOrBefore(endM.endOf('day'))

  const coverUrl = c.image ? getImageUrl(c.image) : 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200'

  return (
    <div className="container mx-auto px-4 pt-4">
      <div
        className="relative rounded-2xl overflow-hidden shadow-lg cursor-pointer group"
        style={{ height: 200 }}
        onClick={() => navigate(`/challenge/${c._id}`)}
      >
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700"
          style={{ backgroundImage: `url(${coverUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />

        <div className="relative h-full flex items-center px-8 z-10">
          <div className="text-white max-w-lg">
            {isOngoing && (
              <span className="inline-flex items-center gap-1 bg-amber-500/90 backdrop-blur text-xs font-bold px-2.5 py-1 rounded-full mb-2">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> Đang diễn ra
              </span>
            )}
            <h2 className="text-2xl font-black mb-1 drop-shadow-lg">{c.title}</h2>
            <p className="text-white/70 text-sm mb-3">
              {(TYPE_CONFIG[c.challenge_type]?.label || 'Thử thách')}
              {c.category ? ` • ${c.category}` : ''} • {c.participants_count ?? 0} người tham gia
            </p>
            <span className="inline-block bg-white/20 backdrop-blur-md hover:bg-white/30 transition px-5 py-2 rounded-xl text-sm font-bold">
              Xem chi tiết →
            </span>
          </div>
        </div>

        {challenges.length > 1 && (
          <div className="absolute bottom-3 right-6 flex gap-1.5 z-10">
            {challenges.map((_, i) => (
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

// Challenge Card — styled after SportEventCard
function ChallengeCard({ challenge, onJoin, joinLoading, friendIds = new Set(), connectedIds = new Set(), CategoryIcon }) {
  const navigate = useNavigate()
  const config = TYPE_CONFIG[challenge.challenge_type] || TYPE_CONFIG.fitness

  const creatorId = String(challenge.creator_id?._id || challenge.creator_id || '')
  const vis = challenge.visibility || 'public'
  const mayJoinByVisibility =
    vis === 'public' ||
    (vis === 'friends' && friendIds.has(creatorId))

  const startM = moment(challenge.start_date)
  const endM = moment(challenge.end_date)
  const isEnded = challenge.end_date && moment().startOf('day').isAfter(endM.endOf('day'))
  const isNotStarted = challenge.start_date && moment().startOf('day').isBefore(startM.startOf('day'))
  const daysLeft = Math.max(0, Math.ceil((endM.endOf('day').valueOf() - moment().valueOf()) / 86400000))

  const progress = challenge.isJoined ? getChallengePersonalProgressPercent(challenge) : 0

  return (
    <div
      onClick={() => navigate(`/challenge/${challenge._id}`)}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700 flex flex-col h-full"
    >
      {/* Image / Gradient Header */}
      <div className="relative h-48 overflow-hidden rounded-t-lg">
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

        {/* Participant Count Badge — cùng style sự kiện */}
        <div className="absolute top-3 right-3 bg-white dark:bg-gray-900 text-red-500 font-medium px-3 py-1 rounded-full text-sm">
          {challenge.participants_count ?? 0} người
        </div>

        {/* Status Badge — 3 trạng thái như SportEventCard */}
        <div className={`absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${isEnded
          ? 'bg-gray-800/70 text-gray-300'
          : isNotStarted
            ? 'bg-amber-500/80 text-white'
            : 'bg-emerald-500/80 text-white'
          }`}>
          {isEnded ? (
            <><BsClockHistory className="text-[10px]" /> Đã kết thúc</>
          ) : isNotStarted ? (
            <><BsCalendarCheck className="text-[10px]" /> Sắp diễn ra</>
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
            <FaCalendarAlt className="mr-2 flex-shrink-0" />
            <span>{startM.format('DD/MM/YYYY')} - {endM.format('DD/MM/YYYY')}</span>
          </div>
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <FaFire className="mr-2 text-amber-500 flex-shrink-0" />
            <span>Mỗi ngày: {challenge.goal_value} {challenge.goal_unit}</span>
          </div>
          {challenge.category && (
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              {CategoryIcon ? <CategoryIcon className="mr-2 flex-shrink-0" /> : <MdSportsSoccer className="mr-2 flex-shrink-0" />}
              <span>{challenge.category}</span>
            </div>
          )}
          {challenge.challenge_type === 'nutrition' && challenge.nutrition_sub_type === 'time_window' && challenge.time_window_start && challenge.time_window_end && (
            <div className="flex items-center text-xs font-bold text-amber-700 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-400 px-2 py-1 rounded w-max mt-1">
              <FaClock className="mr-1.5" />
              <span>Khung giờ: {challenge.time_window_start} - {challenge.time_window_end}</span>
            </div>
          )}
          {!isEnded && !isNotStarted && daysLeft > 0 && (
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <FaClock className="mr-2 flex-shrink-0" />
              <span>Còn {daysLeft} ngày</span>
            </div>
          )}
          {/* Visibility badge */}
          {(() => {
            const vis = VISIBILITY_CONFIG[challenge.visibility]
            if (!vis) return null
            return (
              <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border w-max ${vis.bg} ${vis.text} ${vis.border}`}>
                {vis.icon} {vis.label}
              </div>
            )
          })()}
        </div>

        {challenge.description && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">{challenge.description}</p>
        )}

        {/* Participants avatar row */}
        {(() => {
          const previewUsers = (challenge.participants_preview || []).map(p => ({
            id: String(p._id || p),
            name: p.name || 'Người dùng',
            avatar: p.avatar ? getImageUrl(p.avatar) : useravatar,
          }))
          return previewUsers.length > 0 ? (
            <div className="mb-4" onClick={(e) => e.stopPropagation()}>
              <ParticipantsList
                participants={previewUsers}
                initialLimit={5}
                size="sm"
                title={null}
                showCount={false}
                friendIds={friendIds}
                connectedIds={connectedIds}
                creatorId={creatorId}
                showExpand={false}
                totalCount={challenge.participants_count}
              />
            </div>
          ) : null
        })()}

        {/* Bottom Section: Progress + Action */}
        <div className="mt-auto flex flex-col justify-end">
          {/*
            Luôn hiển thị khối tiến độ để các thẻ đồng cao (giống ý thẻ sự kiện: chỉ có % khi đã tham gia).
            Chưa tham gia → thanh 0% + gợi ý, không phải lỗi mất UI.
          */}
          <div className={`mb-3 ${!challenge.isJoined && !isEnded ? 'opacity-90' : ''}`}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-medium text-gray-500">Tiến độ cá nhân</span>
              {isEnded && !challenge.isJoined ? (
                <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">—</span>
              ) : challenge.isJoined ? (
                <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300">{progress}%</span>
              ) : (
                <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">Tham gia để theo dõi</span>
              )}
            </div>
            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  challenge.isJoined ? `bg-gradient-to-r ${config.gradient}` : 'bg-gray-300 dark:bg-gray-600'
                }`}
                style={{ width: challenge.isJoined ? `${progress}%` : '0%' }}
              />
            </div>
          </div>

          {/* Join Button — thứ tự như SportEventCard */}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
            {isEnded ? (
              <button onClick={(e) => e.stopPropagation()} className="w-full py-2 bg-gray-200 text-gray-500 rounded-md text-sm font-bold flex justify-center items-center cursor-default dark:bg-gray-700 dark:text-gray-400 gap-2">
                <BsClockHistory /> Thử thách đã kết thúc
              </button>
            ) : challenge.isJoined ? (
              <button
                onClick={(e) => e.stopPropagation()}
                className="w-full py-2 bg-green-50 text-green-600 rounded-md text-sm font-bold flex justify-center items-center cursor-default dark:bg-green-900/20 dark:text-green-400 gap-2"
              >
                <MdCheckCircle /> Đã tham gia
              </button>
            ) : !mayJoinByVisibility ? (
              <button
                type="button"
                onClick={(e) => e.stopPropagation()}
                disabled
                className="w-full py-2 bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 rounded-md text-sm font-bold flex justify-center items-center cursor-not-allowed gap-2"
              >
                {vis === 'friends' ? 'Chỉ bạn bè người tổ chức' : 'Không thể tham gia'}
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
    </div>
  )
}

const formatDateDisplay = (isoDate) => {
  if (!isoDate || isoDate.length !== 10) return ''
  return isoDate.split('-').reverse().join('/')
}

export default function Challenge() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [searchTerm, setSearchTerm] = useState('')
  const [activeType, setActiveType] = useState('all') // 'all', 'nutrition', 'outdoor_activity', 'fitness'
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('popular')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [filterJoined, setFilterJoined] = useState(false)
  const [filterVisibility, setFilterVisibility] = useState('all') // 'all' | 'public' | 'friends' | 'private'
  const [showVisDropdown, setShowVisDropdown] = useState(false)
  const [page, setPage] = useState(1)
  const ITEMS_PER_PAGE = 9
  const visDropdownRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (visDropdownRef.current && !visDropdownRef.current.contains(e.target)) {
        setShowVisDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 400)
    return () => clearTimeout(t)
  }, [searchTerm])

  const toISODate = (yyyymmdd) => {
    if (!yyyymmdd || yyyymmdd.length !== 10) return undefined
    return yyyymmdd
  }

  const resolvedStatus = sortBy === 'ongoing' ? 'ongoing' : sortBy === 'ended' ? 'ended' : sortBy === 'soonest' ? 'upcoming' : undefined

  /** Khi đang lọc/tìm, không giữ snapshot trang trước (tránh hiển thị thử thách không khớp từ khóa). */
  const hasActiveFilters =
    Boolean(debouncedSearch.trim()) ||
    activeType !== 'all' ||
    selectedCategory !== 'all' ||
    sortBy !== 'popular' ||
    Boolean(filterDateFrom) ||
    Boolean(filterDateTo) ||
    filterJoined ||
    filterVisibility !== 'all'

  const { data, isLoading, error } = useQuery({
    queryKey: ['challenges-feed', {
      page, activeType, selectedCategory, debouncedSearch, sortBy, filterJoined, filterVisibility, filterDateFrom, filterDateTo, resolvedStatus
    }],
    queryFn: () => getChallengeFeed({
      scope: (filterJoined || sortBy === 'joined') ? 'mine' : 'public',
      challenge_type: activeType === 'all' ? undefined : activeType,
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      search: debouncedSearch.trim() || undefined,
      page,
      limit: ITEMS_PER_PAGE,
      sortBy: (sortBy === 'ongoing' || sortBy === 'ended') ? 'newest' : (sortBy === 'soonest' ? 'soonest' : sortBy),
      status: resolvedStatus,
      dateFrom: toISODate(filterDateFrom),
      dateTo: toISODate(filterDateTo),
      visibility: filterVisibility !== 'all' ? filterVisibility : undefined
    }),
    staleTime: 1000,
    placeholderData: hasActiveFilters ? undefined : keepPreviousData
  })

  // Reset page to 1 whenever any filter changes
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, activeType, selectedCategory, sortBy, filterJoined, filterVisibility, filterDateFrom, filterDateTo])

  // Fetch sport categories
  const { data: categoriesData } = useQuery({
    queryKey: ['sportCategories'],
    queryFn: () => sportCategoryApi.getAll()
  })

  const dbCategories = categoriesData?.data?.result || []
  const availableCategories = useMemo(() => {
    if (activeType === 'nutrition') return []
    if (activeType === 'outdoor_activity') return dbCategories.filter(cat => cat.type === 'Ngoài trời')
    if (activeType === 'fitness') return dbCategories.filter(cat => cat.type === 'Trong nhà')
    return dbCategories
  }, [dbCategories, activeType])

  const categoryIconLookup = useMemo(() => {
    const map = {}
    dbCategories.forEach(cat => {
      map[cat.name] = getSportIcon(cat.icon)
    })
    return map
  }, [dbCategories])

  const challenges = data?.data?.result?.challenges || data?.result?.challenges || []
  const totalPage = data?.data?.result?.totalPage ?? data?.result?.totalPage ?? 1

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
  const myFriends = useMemo(() => myFollowers.filter(p => followingIds.has(String(p._id))), [myFollowers, followingIds])
  const friendIds = useMemo(() => new Set(myFriends.map(p => String(p._id))), [myFriends])
  const connectedIds = useMemo(() => new Set([...followerIds, ...followingIds]), [followerIds, followingIds])

  const joinMutation = useSafeMutation({
    mutationFn: (id) => joinChallenge(id),
    onSuccess: () => { toast.success('Đã tham gia thử thách!'); queryClient.invalidateQueries({ queryKey: ['challenges-feed'] }) },
    onError: (err) => toast.error(err?.response?.data?.message || 'Lỗi khi tham gia')
  })

  // Skeleton
  const SkeletonCard = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700 animate-pulse">
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
              onClick={() => navigate('/challenge/create', { state: { from: '/challenge' } })}
              className="bg-white hover:bg-gray-50 text-orange-600 px-4 py-2 rounded-xl font-semibold transition shadow-lg hover:shadow-xl flex items-center gap-2 text-sm"
            >
              <FaPlus /> Tạo thử thách
            </button>
          </div>
        </div>
      </div>

      {/* Banner thử thách nổi bật — cùng logic trang sự kiện (top theo lượt tham gia, chưa kết thúc) */}
      {(() => {
        const featured = [...challenges]
          .filter(c => c?.end_date && new Date(c.end_date) > new Date())
          .sort((a, b) => (b.participants_count || 0) - (a.participants_count || 0))
          .slice(0, 3)
        if (isLoading || featured.length === 0) return null
        return <FeaturedChallengesBanner challenges={featured} navigate={navigate} />
      })()}

      {/* Search & Filters — matching SportEvent filter card */}
      <div className="container mx-auto px-4 pt-6 pb-2">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-visible">

          {/* Row 1: Search + Filter toggle — z-index để dropdown không bị hàng tab đè */}
          <div className="relative z-20 p-4">
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
                  placeholder="Tìm theo tên thử thách, mô tả, danh mục..."
                  className="w-full pl-10 pr-8 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:bg-white dark:focus:bg-gray-600 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2 items-center flex-wrap">
                <button
                  onClick={() => setFilterJoined(v => !v)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border transition-all shrink-0 ${filterJoined
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 shadow-sm'
                    : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-emerald-300 hover:text-emerald-600'
                    }`}
                >
                  {filterJoined ? <FaCheck size={10} /> : <FaUsers size={12} />}
                  Đang tham gia
                </button>

                {/* Visibility filter dropdown */}
                <div className="relative shrink-0" ref={visDropdownRef}>
                  <button
                    onClick={() => setShowVisDropdown(!showVisDropdown)}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border transition-all ${filterVisibility !== 'all' || showVisDropdown
                      ? 'bg-orange-50 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300 shadow-sm'
                      : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-300'
                      }`}
                  >
                    {filterVisibility === 'all' ? <FaGlobe size={12} className="text-gray-400" /> : VISIBILITY_CONFIG[filterVisibility].icon}
                    {filterVisibility === 'all' ? 'Tất cả' : VISIBILITY_CONFIG[filterVisibility].label}
                    <FaChevronDown size={10} className={`transition-transform ${showVisDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showVisDropdown && (
                    <div className="absolute top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50 left-1/2 -translate-x-1/2 origin-top">
                      {[{ value: 'all', label: 'Tất cả', icon: <FaGlobe className="text-gray-400" /> }, ...Object.entries(VISIBILITY_CONFIG).map(([k, v]) => ({ value: k, label: v.label, icon: v.icon }))].map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => { setFilterVisibility(opt.value); setShowVisDropdown(false) }}
                          className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium transition-colors text-left ${filterVisibility === opt.value ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                        >
                          <span className={`text-base ${filterVisibility === opt.value ? '' : 'text-gray-500'}`}>{opt.icon}</span>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border transition-all shrink-0 ${showAdvanced || sortBy !== 'popular' || !!filterDateFrom || !!filterDateTo
                    ? 'bg-orange-50 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300'
                    : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-300'
                    }`}
                >
                  <FaFilter size={12} />
                  Bộ lọc
                  {([sortBy !== 'popular', !!filterDateFrom, !!filterDateTo].filter(Boolean).length > 0) && (
                    <span className="w-5 h-5 rounded-full bg-orange-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {[sortBy !== 'popular', !!filterDateFrom, !!filterDateTo].filter(Boolean).length}
                    </span>
                  )}
                  <FaChevronDown size={10} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            {/* Active filter chips */}
            {(activeType !== 'all' || selectedCategory !== 'all' || sortBy !== 'popular' || searchTerm || filterDateFrom || filterDateTo || filterJoined || filterVisibility !== 'all') && (
              <div className="flex flex-wrap gap-2 mt-3">
                {activeType !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                    {TYPE_CONFIG[activeType]?.icon} {TYPE_CONFIG[activeType]?.label}
                    <button onClick={() => { setActiveType('all'); setSelectedCategory('all') }}><FaTimes size={9} /></button>
                  </span>
                )}
                {selectedCategory !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                    🏅 {selectedCategory}
                    <button onClick={() => setSelectedCategory('all')} className="hover:text-blue-900"><FaTimes size={9} /></button>
                  </span>
                )}
                {sortBy !== 'popular' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                    ↕️ {{ newest: 'Mới nhất', oldest: 'Cũ nhất', soonest: 'Sắp diễn ra', ending_soon: 'Sắp kết thúc', ongoing: 'Đang diễn ra', joined: 'Đã tham gia', ended: 'Đã kết thúc' }[sortBy] || sortBy}
                    <button onClick={() => setSortBy('popular')}><FaTimes size={9} /></button>
                  </span>
                )}
                {filterDateFrom && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                    📅 Từ {formatDateDisplay(filterDateFrom)}
                    <button onClick={() => setFilterDateFrom('')}><FaTimes size={9} /></button>
                  </span>
                )}
                {filterDateTo && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                    📅 Đến {formatDateDisplay(filterDateTo)}
                    <button onClick={() => setFilterDateTo('')}><FaTimes size={9} /></button>
                  </span>
                )}
                {filterJoined && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                    ✅ Đang tham gia
                    <button onClick={() => setFilterJoined(false)}><FaTimes size={9} /></button>
                  </span>
                )}
                {filterVisibility !== 'all' && VISIBILITY_CONFIG[filterVisibility] && (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border ${VISIBILITY_CONFIG[filterVisibility].bg} ${VISIBILITY_CONFIG[filterVisibility].text} ${VISIBILITY_CONFIG[filterVisibility].border}`}>
                    {VISIBILITY_CONFIG[filterVisibility].icon} {VISIBILITY_CONFIG[filterVisibility].label}
                    <button onClick={() => setFilterVisibility('all')}><FaTimes size={9} /></button>
                  </span>
                )}
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setActiveType('all')
                    setSelectedCategory('all')
                    setSortBy('popular')
                    setFilterDateFrom('')
                    setFilterDateTo('')
                    setFilterJoined(false)
                    setFilterVisibility('all')
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-full transition-colors"
                >
                  <FaTimes size={9} /> Xóa tất cả
                </button>
              </div>
            )}
          </div>

          {/* Row 2: Challenge Type Tabs */}
          <div className="px-4 pb-3">
            <div className="flex bg-gray-100 dark:bg-gray-700/50 p-1.5 rounded-xl w-full lg:w-auto overflow-x-auto no-scrollbar">
              <button
                onClick={() => { setActiveType('all'); setSelectedCategory('all') }}
                className={`flex-1 lg:flex-none px-6 py-2.5 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${activeType === 'all'
                  ? 'bg-white text-orange-600 shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 hover:bg-white/50'
                  }`}
              >
                Tất cả loại
              </button>
              <button
                onClick={() => { setActiveType('nutrition'); setSelectedCategory('all') }}
                className={`flex-1 lg:flex-none px-6 py-2.5 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${activeType === 'nutrition'
                  ? 'bg-white text-emerald-600 shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 hover:bg-white/50'
                  }`}
              >
                🥗 Ăn uống
              </button>
              <button
                onClick={() => { setActiveType('outdoor_activity'); setSelectedCategory('all') }}
                className={`flex-1 lg:flex-none px-6 py-2.5 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${activeType === 'outdoor_activity'
                  ? 'bg-white text-blue-600 shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 hover:bg-white/50'
                  }`}
              >
                🏃 Ngoài trời
              </button>
              <button
                onClick={() => { setActiveType('fitness'); setSelectedCategory('all') }}
                className={`flex-1 lg:flex-none px-6 py-2.5 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${activeType === 'fitness'
                  ? 'bg-white text-purple-600 shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 hover:bg-white/50'
                  }`}
              >
                💪 Thể dục
              </button>
            </div>
          </div>

          {/* Row 3: Category Pills (hidden for Nutrition) */}
          {availableCategories.length > 0 && (
            <div className="px-4 pb-4">
              <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
                <button
                  className={`flex items-center shrink-0 whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${selectedCategory === 'all'
                    ? 'bg-orange-50 border-orange-200 text-orange-600 dark:bg-orange-900/20 dark:border-orange-800/50 dark:text-orange-400'
                    : 'bg-white border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 hover:border-orange-300'
                    }`}
                  onClick={() => setSelectedCategory('all')}
                >
                  <MdSportsSoccer className={`mr-2 ${selectedCategory === 'all' ? 'text-orange-500' : 'text-gray-400'}`} />
                  Tất cả môn
                </button>
                {availableCategories.map((category) => {
                  const CatIcon = getSportIcon(category.icon)
                  return (
                    <button
                      key={category._id}
                      className={`flex items-center shrink-0 whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${selectedCategory === category.name
                        ? 'bg-orange-50 border-orange-200 text-orange-600 dark:bg-orange-900/20 dark:border-orange-800/50 dark:text-orange-400'
                        : 'bg-white border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 hover:border-orange-300'
                        }`}
                      onClick={() => setSelectedCategory(category.name)}
                    >
                      <CatIcon className={`mr-2 ${selectedCategory === category.name ? 'text-orange-500' : 'text-gray-400'}`} />
                      {category.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}


          {/* Collapsible Advanced Filters */}
          {showAdvanced && (
            <div className="px-4 pb-4 pt-0 border-t border-gray-100 dark:border-gray-700">
              <div className="grid grid-cols-2 gap-3 pt-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Từ ngày</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={filterDateFrom}
                      onChange={e => setFilterDateFrom(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Đến ngày</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={filterDateTo}
                      onChange={e => setFilterDateTo(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <FaSortAmountDown className="text-gray-400 text-sm shrink-0" />
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase shrink-0">Sắp xếp:</span>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { value: 'popular', label: 'Phổ biến nhất' },
                    { value: 'newest', label: 'Mới nhất' },
                    { value: 'oldest', label: 'Cũ nhất' },
                    { value: 'soonest', label: 'Sắp diễn ra' },
                    { value: 'ending_soon', label: 'Sắp kết thúc' },
                    { value: 'ongoing', label: 'Đang diễn ra' },
                    { value: 'joined', label: 'Đã tham gia' },
                    { value: 'ended', label: 'Đã kết thúc' }
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
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="text-red-500 text-5xl mb-4">❌</div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Không thể tải danh sách thử thách</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error?.message || 'Vui lòng thử lại sau'}</p>
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['challenges-feed'] })}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              Thử lại
            </button>
          </div>
        ) : challenges.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {challenges.map(challenge => (
                <ChallengeCard
                  key={challenge._id}
                  challenge={challenge}
                  onJoin={(id) => joinMutation.mutate(id)}
                  joinLoading={joinMutation.isPending && joinMutation.variables === challenge._id}
                  friendIds={friendIds}
                  connectedIds={connectedIds}
                  CategoryIcon={challenge.category ? categoryIconLookup[challenge.category] : undefined}
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
          <div className="text-center py-16">
            <FaTrophy className="mx-auto text-gray-400 text-6xl mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">Không tìm thấy thử thách phù hợp</h3>
            <p className="text-gray-500 dark:text-gray-500 mb-6">Hãy thử điều chỉnh bộ lọc hoặc tìm kiếm với từ khóa khác</p>
            <button
              onClick={() => {
                setSearchTerm('')
                setActiveType('all')
                setSelectedCategory('all')
                setSortBy('popular')
                setFilterDateFrom('')
                setFilterDateTo('')
                setFilterJoined(false)
                setFilterVisibility('all')
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
