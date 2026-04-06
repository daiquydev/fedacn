import { useSafeMutation } from '../../hooks/useSafeMutation'
import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AiOutlineLoading3Quarters
} from 'react-icons/ai'
import {
  FaMedal,
  FaTimes,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaTrophy,
  FaUsers,
  FaArrowLeft,
  FaShare,
  FaPlus,
  FaSearch,
  FaUserFriends as FaInvite,
  FaCheck,
  FaBell
} from 'react-icons/fa'
import {
  MdVideocam,
  MdErrorOutline,
  MdCheckCircle
} from 'react-icons/md'
import { BsClockHistory, BsCalendarCheck } from 'react-icons/bs'
import moment from 'moment'
import toast from 'react-hot-toast'

// API imports
import {
  getSportEvent,
  joinSportEvent,
  leaveSportEvent,
  getEventSessions,
  getNextSession,
  getUserProgress,
  addProgress,
  getParticipants,
  checkInSession,
  checkOutSession,
  inviteFriendToEvent,
  getEventOverallProgress
} from '../../apis/sportEventApi'
import { currentAccount } from '../../apis/userApi'

// Components
import { getImageUrl } from '../../utils/imageUrl'
import useravatar from '../../assets/images/useravatar.jpg'
import SportEventProgress from './components/SportEventProgress'
import SportEventLeaderboard from './components/SportEventLeaderboard'
import SportEventShareModal from '../../components/SportEvent/SportEventShareModal'
import IndoorEventProgress from './components/IndoorEventProgress'
import ProgressRing from '../../components/SportEvent/ProgressRing'


export default function SportEventDetail() {

  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // UI State
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get('tab')
    return tabParam === 'progress' ? 'progress' : 'details'
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [showMapPopup, setShowMapPopup] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [friendSearch, setFriendSearch] = useState('')
  const [invitedIds, setInvitedIds] = useState(new Set())

  // Form State
  const [progressUpdate, setProgressUpdate] = useState({
    value: '',
    distance: '',
    time: '',
    calories: '',
    proofImage: '',
    notes: ''
  })

  // ==================== DATA FETCHING ====================

  // Fetch Event Details
  const {
    data: eventData,
    isLoading: isLoadingEvent,
    error: eventError
  } = useQuery({
    queryKey: ['sportEvent', id],
    queryFn: () => getSportEvent(id),
    enabled: !!id
  })

  // Fetch current user's friends/followers
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

  // All people I'm connected to (friends + following) for social ring detection
  const connectedIds = useMemo(() => new Set([...followerIds, ...followingIds]), [followerIds, followingIds])

  // Filtered friends for invite modal
  const filteredFriendsForInvite = useMemo(() => {
    const kw = friendSearch.toLowerCase().trim()
    return myFriends.filter(f => {
      if (!kw) return true
      return (f.name || '').toLowerCase().includes(kw) || (f.email || '').toLowerCase().includes(kw)
    })
  }, [myFriends, friendSearch])

  const event = eventData?.data?.result || eventData?.result
  const isCreator = me?._id && event?.createdBy && (me._id === String(event.createdBy?._id || event.createdBy))

  // Fetch Sessions (for Trong nhà events)
  const {
    data: sessionsData,
    isLoading: isLoadingSessions
  } = useQuery({
    queryKey: ['eventSessions', id],
    queryFn: () => getEventSessions(id),
    enabled: !!id && event?.eventType === 'Trong nhà'
  })

  const sessions = sessionsData?.data?.result || sessionsData?.result || []

  // Fetch Next Session
  const {
    data: nextSessionData
  } = useQuery({
    queryKey: ['nextSession', id],
    queryFn: () => getNextSession(id),
    enabled: !!id && event?.eventType === 'Trong nhà'
  })

  const nextSession = nextSessionData?.data?.result || nextSessionData?.result

  // Fetch User's Progress
  const {
    data: userProgressData,
    isLoading: isLoadingProgress
  } = useQuery({
    queryKey: ['userProgress', id],
    queryFn: () => getUserProgress(id),
    enabled: !!id && !!event?.isJoined
  })

  const userProgress = userProgressData?.data?.result || userProgressData?.result

  // Fetch Participants (for Leaderboard Preview in Details Tab)
  const {
    data: participantsData,
    isLoading: isLoadingParticipants
  } = useQuery({
    queryKey: ['eventParticipants', id, searchTerm],
    queryFn: () => getParticipants(id, { search: searchTerm, limit: 100 }),
    enabled: !!id && activeTab === 'details'
  })

  const participants = participantsData?.data?.result?.participants || participantsData?.result?.participants || []

  // Fetch Overall Event Progress (group total)
  const {
    data: overallProgressData
  } = useQuery({
    queryKey: ['eventOverallProgress', id],
    queryFn: () => getEventOverallProgress(id),
    enabled: !!id
  })

  const overallProgress = overallProgressData?.data?.result || { totalGroupProgress: 0, participantCount: 0 }

  // Removed: Fetch Posts (community posts moved to /home page)

  // ==================== MUTATIONS ====================

  // Join Event Mutation
  const joinEventMutation = useSafeMutation({
    mutationFn: () => joinSportEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sportEvent', id] })
      toast.success('Đã tham gia sự kiện thành công!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Không thể tham gia sự kiện')
    }
  })

  // Invite Friend Mutation
  const inviteFriendMutation = useSafeMutation({
    mutationFn: (friendId) => inviteFriendToEvent(id, friendId),
    onSuccess: (_, friendId) => {
      setInvitedIds(prev => new Set([...prev, String(friendId)]))
      toast.success('Đã gửi lời mời! Bạn bè của bạn sẽ nhận được thông báo.')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Không thể gửi lời mời')
    }
  })

  // Leave Event Mutation
  const leaveEventMutation = useSafeMutation({
    mutationFn: () => leaveSportEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sportEvent', id] })
      toast.success('Đã rời khỏi sự kiện')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Không thể rời khỏi sự kiện')
    }
  })

  // Add Progress Mutation
  const addProgressMutation = useSafeMutation({
    mutationFn: (progressData) => addProgress(id, progressData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProgress', id] })
      queryClient.invalidateQueries({ queryKey: ['eventParticipants', id] })
      queryClient.invalidateQueries({ queryKey: ['eventLeaderboard', id] })
      toast.success('Đã cập nhật tiến độ thành công!')
      setProgressUpdate({ value: '', distance: '', time: '', calories: '', proofImage: '', notes: '' })
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Không thể cập nhật tiến độ')
    }
  })

  // Share Event to Community (open modal inline)
  const handleShareEvent = () => {
    setShowShareModal(true)
  }

  // Check-in Mutation
  const checkInMutation = useSafeMutation({
    mutationFn: (sessionId) => checkInSession(id, sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessionAttendance'] })
      toast.success('Điểm danh thành công!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Không thể điểm danh')
    }
  })

  // Check-out Mutation
  const checkOutMutation = useSafeMutation({
    mutationFn: (sessionId) => checkOutSession(id, sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessionAttendance'] })
      toast.success('Đã checkout thành công!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Không thể checkout')
    }
  })

  // ==================== EVENT HANDLERS ====================

  const handleJoinEvent = () => {
    if (joinEventMutation.isPending || leaveEventMutation.isPending) return

    if (!event?.isJoined) {
      // Check if event is full
      if (event.participants >= event.maxParticipants) {
        toast.error('Sự kiện đã đầy người tham gia')
        return
      }

      // Check if event has ended (allow joining on the end date)
      const isEnded = event.endDate && moment().startOf('day').isAfter(moment(event.endDate).endOf('day'))
      if (isEnded) {
        toast.error('Sự kiện này đã kết thúc')
        return
      }

      joinEventMutation.mutate()
    } else {
      setShowLeaveModal(true)
    }
  }

  const confirmLeaveEvent = () => {
    leaveEventMutation.mutate(undefined, {
      onSuccess: () => setShowLeaveModal(false)
    })
  }

  const handleProgressSubmit = (e) => {
    e.preventDefault()

    if (!progressUpdate.value || !event?.targetUnit) {
      toast.error('Vui lòng nhập giá trị tiến độ')
      return
    }

    const progressData = {
      value: parseFloat(progressUpdate.value),
      unit: event.targetUnit,
      distance: progressUpdate.distance ? parseFloat(progressUpdate.distance) : undefined,
      time: progressUpdate.time || undefined,
      calories: progressUpdate.calories ? parseInt(progressUpdate.calories) : undefined,
      proofImage: progressUpdate.proofImage || undefined,
      notes: progressUpdate.notes || undefined
    }

    addProgressMutation.mutate(progressData)
  }


  // Helper: check if targetUnit is calorie-based
  const isKcalUnit = (unit = '') => {
    const u = unit.toLowerCase().trim()
    return u === 'kcal' || u === 'calo' || u === 'calories' || u === 'cal'
  }

  // Calculate progress percentage — with NaN/zero guards
  // For kcal events: compare totalCalories vs per-person target
  // For other events: compare totalProgress (native unit) vs per-person target
  const calculateProgress = () => {
    if (!userProgress || !event?.targetValue || event.targetValue <= 0) return 0
    const maxParticipants = event?.maxParticipants > 0 ? event.maxParticipants : 1
    const perPersonTarget = event.targetValue / maxParticipants
    if (perPersonTarget <= 0) return 0
    const myTotal = isKcalUnit(event.targetUnit)
      ? (userProgress.totalCalories || 0)
      : (userProgress.totalProgress || 0)
    const pct = Math.round((myTotal / perPersonTarget) * 100)
    return isNaN(pct) ? 0 : Math.min(pct, 100)
  }

  // ===== Countdown Timer (hooks MUST be before any early returns) =====
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  useEffect(() => {
    if (!event?.startDate) return
    const startDt = moment(event.startDate)
    if (!moment().isBefore(startDt)) return
    const tick = () => {
      const now = moment()
      const diff = startDt.diff(now)
      if (diff <= 0) { setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return }
      const dur = moment.duration(diff)
      setCountdown({ days: Math.floor(dur.asDays()), hours: dur.hours(), minutes: dur.minutes(), seconds: dur.seconds() })
    }
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [event?.startDate])



  // ==================== LOADING & ERROR STATES ====================

  if (isLoadingEvent) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <AiOutlineLoading3Quarters className="animate-spin text-4xl text-blue-500" />
      </div>
    )
  }

  if (eventError || !event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <MdErrorOutline className="text-6xl text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          Không tìm thấy sự kiện
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Sự kiện không tồn tại hoặc đã bị xóa
        </p>
        <button
          onClick={() => navigate('/sport-event')}
          className="flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition"
        >
          <FaArrowLeft />
          Quay lại danh sách sự kiện
        </button>
      </div>
    )
  }

  // ==================== RENDER ====================

  const progressPercentage = calculateProgress()
  const isOnline = event.eventType === 'Trong nhà'
  const eventStartDate = moment(event.startDate)
  const eventEndDate = moment(event.endDate)

  const isEnded = moment().isAfter(eventEndDate)
  const isNotStarted = moment().isBefore(eventStartDate)
  const isOngoing = !isEnded && !isNotStarted

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">


      {/* Share Sport Event Modal */}
      {showShareModal && event && (
        <SportEventShareModal
          event={event}
          eventId={id}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* Map Popup Modal */}
      {showMapPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowMapPopup(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FaMapMarkerAlt className="text-red-500" /> Bản đồ địa điểm
              </h3>
              <button onClick={() => setShowMapPopup(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition">
                <FaTimes className="text-gray-500" />
              </button>
            </div>
            <div className="w-full h-[60vh] bg-gray-100 dark:bg-gray-700">
              <iframe
                title="Google Maps"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                allow="geolocation"
                src={`https://www.google.com/maps?q=${encodeURIComponent(event.location)}&output=embed`}
              ></iframe>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <FaMapMarkerAlt className="text-red-500" /> {event.location}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section with Event Banner */}
      <div className="relative h-96 bg-gradient-to-b from-gray-900 to-gray-800">
        <img
          src={getImageUrl(event.image)}
          alt={event.name}
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* Navigation */}
        <div className="absolute top-6 left-6">
          <button
            onClick={() => navigate('/sport-event')}
            className="flex items-center gap-2 text-white bg-black/30 hover:bg-black/50 px-4 py-2 rounded-lg backdrop-blur-sm transition"
          >
            <FaArrowLeft />
            <span>Quay lại</span>
          </button>
        </div>

        {/* Event Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
          <div className="container mx-auto max-w-6xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${isOnline ? 'bg-blue-500' : 'bg-green-500'
                  }`}>
                  {isOnline ? (
                    <span className="flex items-center gap-1">
                      <MdVideocam /> Trong nhà
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <FaMapMarkerAlt /> Ngoài trời
                    </span>
                  )}
                </span>
                <span className="px-4 py-1.5 bg-red-500 rounded-full text-sm font-medium">
                  {event.category}
                </span>
                {event.difficulty && (() => {
                  const map = { easy: '😊 Dễ', medium: '💪 Trung bình', hard: '🔥 Khó', expert: '🏆 Chuyên gia' }
                  const colors = { easy: 'bg-green-500', medium: 'bg-yellow-500', hard: 'bg-orange-500', expert: 'bg-red-600' }
                  return (
                    <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${colors[event.difficulty] || 'bg-gray-500'}`}>
                      {map[event.difficulty] || event.difficulty}
                    </span>
                  )
                })()}
              </div>
              {/* Người tổ chức - trong hero */}
              {event.createdBy && (
                <div
                  className="flex items-center gap-3 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full pl-1.5 pr-4 py-1.5 cursor-pointer transition group"
                  onClick={(e) => { e.stopPropagation(); event.createdBy?._id && navigate(`/user/${event.createdBy._id}`) }}
                >
                  <img
                    src={getImageUrl(event.createdBy?.avatar) || useravatar}
                    alt={event.createdBy?.name || 'Người tổ chức'}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-white/40 group-hover:ring-white/80 transition"
                    onError={e => { e.target.src = useravatar }}
                  />
                  <div className="min-w-0">
                    <p className="text-[10px] text-white/60 uppercase font-semibold leading-tight">Người tổ chức</p>
                    <p className="text-sm font-semibold text-white truncate max-w-[150px] group-hover:text-red-300 transition">{event.createdBy?.name}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Status + Countdown */}
            {isNotStarted && (
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-amber-500/90 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                  <BsCalendarCheck className="text-[10px]" /> Sắp diễn ra
                </span>
                <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1">
                  {[{ v: countdown.days, l: 'ngày' }, { v: countdown.hours, l: 'giờ' }, { v: countdown.minutes, l: 'phút' }, { v: countdown.seconds, l: 'giây' }].map((u, i) => (
                    <span key={i} className="flex items-center gap-0.5">
                      <span className="bg-white/20 text-white font-mono font-bold text-sm px-1.5 py-0.5 rounded">{String(u.v).padStart(2, '0')}</span>
                      <span className="text-white/50 text-[10px]">{u.l}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
            {isOngoing && (
              <div className="mb-3">
                <span className="bg-emerald-500/90 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 w-fit">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Đang diễn ra
                </span>
              </div>
            )}
            {isEnded && (
              <div className="mb-3">
                <span className="bg-gray-600/80 text-gray-300 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 w-fit">
                  <BsClockHistory className="text-[10px]" /> Đã kết thúc
                </span>
              </div>
            )}

            <h1 className="text-4xl md:text-5xl font-bold mb-4">{event.name}</h1>

            <div className="flex flex-wrap items-center gap-6 text-sm md:text-base">
              <div className="flex items-center gap-2">
                <FaCalendarAlt />
                <span>{eventStartDate.format('DD/MM/YYYY')} - {eventEndDate.format('DD/MM/YYYY')}</span>
              </div>
              <div className="flex items-center gap-2">
                {isOnline ? <MdVideocam /> : <FaMapMarkerAlt />}
                <span>{isOnline ? 'Video call trực tuyến' : event.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaUsers />
                <span>{event.participants}/{event.maxParticipants} người tham gia</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              {!event.isJoined ? (
                (event.endDate && moment().startOf('day').isAfter(moment(event.endDate).endOf('day'))) ? (
                  <button
                    onClick={() => { }}
                    className="px-5 py-2.5 bg-white/10 text-white/60 border border-white/20 rounded-lg font-semibold text-sm flex items-center gap-2 cursor-default"
                  >
                    Sự kiện đã kết thúc
                  </button>
                ) : (event.startDate && moment().startOf('day').isBefore(moment(event.startDate).startOf('day'))) ? (
                  <button
                    onClick={() => { }}
                    className="px-5 py-2.5 bg-white/10 text-white/60 border border-white/20 rounded-lg font-semibold text-sm flex items-center gap-2 cursor-default"
                  >
                    Sự kiện chưa bắt đầu
                  </button>
                ) : (event.maxParticipants > 0 && event.participants >= event.maxParticipants) ? (
                  <button
                    onClick={() => { }}
                    className="px-5 py-2.5 bg-white/10 text-white/60 border border-white/20 rounded-lg font-semibold text-sm flex items-center gap-2 cursor-default"
                  >
                    Đã đầy chỗ
                  </button>
                ) : (
                  <button
                    onClick={handleJoinEvent}
                    disabled={joinEventMutation.isPending}
                    className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold text-sm transition shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {joinEventMutation.isPending ? (
                      <AiOutlineLoading3Quarters className="animate-spin" />
                    ) : <FaPlus className="text-xs" />}
                    Tham gia ngay
                  </button>
                )
              ) : (
                <>
                  <div className="px-5 py-2.5 bg-green-500/20 text-green-300 border border-green-400/30 rounded-lg font-semibold text-sm flex items-center gap-2 cursor-default backdrop-blur-sm">
                    <MdCheckCircle className="text-base" />
                    Đã tham gia
                  </div>
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg font-semibold text-sm transition backdrop-blur-sm flex items-center gap-2"
                  >
                    <FaInvite className="text-sm" />
                    Mời bạn bè
                  </button>
                  {isCreator ? (
                    <div className="px-5 py-2.5 bg-amber-500/20 text-amber-300 border border-amber-400/30 rounded-lg font-semibold text-sm flex items-center gap-2 cursor-default backdrop-blur-sm">
                      👑 Người tổ chức
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowLeaveModal(true)}
                      disabled={leaveEventMutation.isPending}
                      className="px-5 py-2.5 bg-white/10 hover:bg-red-500/30 text-white/80 hover:text-red-300 border border-white/20 hover:border-red-400/40 rounded-lg font-semibold text-sm transition backdrop-blur-sm flex items-center gap-2"
                    >
                      {leaveEventMutation.isPending ? (
                        <AiOutlineLoading3Quarters className="animate-spin" />
                      ) : <FaTimes className="text-sm" />}
                      Rời khỏi
                    </button>
                  )}
                </>
              )}
              {/* Share Event Button */}
              <button
                onClick={handleShareEvent}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white border border-white/20 rounded-lg font-semibold text-sm transition backdrop-blur-sm flex items-center gap-2"
              >
                <FaShare className="text-sm" />
                Chia sẻ lên cộng đồng
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="container mx-auto max-w-6xl">
          <div className="flex">
            {[
              { id: 'details', label: 'Chi tiết', icon: <FaCalendarAlt /> },
              ...(event?.isJoined ? [{ id: 'progress', label: 'Tiến độ', icon: <FaMedal /> }] : []),
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-semibold transition whitespace-nowrap text-base ${activeTab === tab.id
                  ? 'text-red-500 border-b-2 border-red-500 bg-red-50 dark:bg-red-900/10'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/40'
                  }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="container mx-auto max-w-6xl p-6">
        {/* CHI TIẾT TAB */}
        {activeTab === 'details' && (
          <div className="space-y-8">
            {/* About Event */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
                Về sự kiện này
              </h2>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                {event.detailedDescription || event.description}
              </p>
            </div>

            {/* Requirements & Benefits */}
            {(event.requirements || event.benefits) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Requirements */}
                {event.requirements && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 shadow-sm">
                    <h2 className="text-xl font-bold mb-3 text-blue-900 dark:text-blue-300 flex items-center gap-2">
                      📋 Yêu cầu tham gia
                    </h2>
                    <p className="text-blue-800 dark:text-blue-200 whitespace-pre-line">
                      {event.requirements}
                    </p>
                  </div>
                )}
                {/* Benefits */}
                {event.benefits && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 shadow-sm">
                    <h2 className="text-xl font-bold mb-3 text-green-900 dark:text-green-300 flex items-center gap-2">
                      🎁 Lợi ích khi tham gia
                    </h2>
                    <p className="text-green-800 dark:text-green-200 whitespace-pre-line">
                      {event.benefits}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Event Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Time Section — 1 dòng gọn */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <FaCalendarAlt className="text-red-500 text-2xl shrink-0" />
                  <h3 className="font-semibold text-gray-800 dark:text-white">Thời gian</h3>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-2.5 py-1 rounded-lg text-sm font-bold">
                    <BsClockHistory className="text-xs" />
                    {eventStartDate.format('HH:mm')}
                  </span>
                  <span className="text-gray-400 dark:text-gray-500 text-sm font-medium">
                    {eventStartDate.format('DD/MM/YYYY')}
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">→</span>
                  <span className="text-gray-600 dark:text-gray-300 text-sm font-semibold">
                    {eventEndDate.format('DD/MM/YYYY')}
                  </span>
                </div>
              </div>

              {/* Location / Format Section */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  {isOnline
                    ? <MdVideocam className="text-blue-500 text-2xl shrink-0" />
                    : <FaMapMarkerAlt className="text-green-500 text-2xl shrink-0" />
                  }
                  <h3 className="font-semibold text-gray-800 dark:text-white">
                    {isOnline ? 'Hình thức tham gia' : 'Địa điểm'}
                  </h3>
                </div>
                {isOnline ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-full text-sm font-semibold">
                      <MdVideocam className="text-base" />
                      Video call trực tuyến
                    </span>
                  </div>
                ) : (
                  event.location ? (
                    <p
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium cursor-pointer inline-flex items-center gap-1 border-b border-transparent hover:border-blue-600 dark:hover:border-blue-300 transition"
                      onClick={() => setShowMapPopup(true)}
                    >
                      <FaMapMarkerAlt className="text-xs shrink-0" />
                      {event.location}
                    </p>
                  ) : (
                    <p className="text-gray-400 dark:text-gray-500 italic text-sm">Chưa có địa điểm</p>
                  )
                )}
              </div>

              {/* Target Section */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <FaTrophy className="text-yellow-500 text-2xl shrink-0" />
                  <h3 className="font-semibold text-gray-800 dark:text-white">Mục tiêu</h3>
                </div>
                <div className="flex items-end gap-2">
                  <p className="text-3xl font-black text-gray-900 dark:text-white">
                    {event.targetValue}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 font-bold mb-1 uppercase">
                    {event.targetUnit}
                  </p>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Hoàn thành mục tiêu để nhận phần thưởng!
                </p>
              </div>
            </div>

            {/* Rules Section */}
            {event.rules && event.rules.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
                  📋 Quy định sự kiện
                </h2>
                <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                  {event.rules.map((rule, index) => (
                    <li key={index}>{rule}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Rewards Section */}
            {event.rewards && event.rewards.length > 0 && (
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-gray-800 dark:to-gray-750 rounded-lg p-6 shadow-sm border border-yellow-200 dark:border-yellow-900">
                <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
                  <FaTrophy className="text-yellow-500" />
                  Phần thưởng
                </h2>
                <ul className="space-y-3">
                  {event.rewards.map((reward, index) => (
                    <li key={index} className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                      <FaMedal className="text-yellow-500 text-lg mt-1" />
                      <span>{reward}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* FAQs Section */}
            {event.faqs && event.faqs.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
                  ❓ Câu hỏi thường gặp
                </h2>
                <div className="space-y-4">
                  {event.faqs.map((faq, index) => (
                    <details key={index} className="group border-b border-gray-200 dark:border-gray-700 pb-4">
                      <summary className="cursor-pointer font-semibold text-gray-900 dark:text-white hover:text-red-500 dark:hover:text-red-400 transition">
                        {faq.question}
                      </summary>
                      <p className="mt-3 text-gray-700 dark:text-gray-300 pl-4">
                        {faq.answer}
                      </p>
                    </details>
                  ))}
                </div>
              </div>
            )}

            {/* Progress Overview — Circular Rings */}
            {(() => {
              const effectiveTarget = event.targetValue || 0
              const kcal = isKcalUnit(event.targetUnit)
              // For kcal events, group progress is sum of calories; otherwise sum of value (native unit)
              const groupTotal = kcal
                ? (overallProgress.totalCalories || 0)
                : (overallProgress.totalGroupProgress || 0)
              const groupPercent = effectiveTarget > 0 ? Math.min(Math.round((groupTotal / effectiveTarget) * 100), 100) : 0
              const perPersonTarget = effectiveTarget > 0 ? effectiveTarget / (event.maxParticipants || 1) : 0
              // For kcal events, personal progress is totalCalories; otherwise totalProgress (native unit)
              const myTotal = kcal
                ? (userProgress?.totalCalories || 0)
                : (userProgress?.totalProgress || 0)
              const myPercent = perPersonTarget > 0 ? Math.min(Math.round((myTotal / perPersonTarget) * 100), 100) : 0
              const hasTarget = effectiveTarget > 0

              return (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-6 py-5">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      🎯 Tiến độ tổng quan
                    </h2>
                    <p className="text-white/60 text-sm mt-1">
                      {hasTarget ? `Mục tiêu: ${effectiveTarget} ${event.targetUnit}` : 'Chưa thiết lập mục tiêu'}
                    </p>
                  </div>

                  {!hasTarget ? (
                    <div className="p-8 text-center">
                      <div className="text-4xl mb-3">🎯</div>
                      <p className="text-gray-500 dark:text-gray-400 font-medium">Sự kiện chưa thiết lập mục tiêu</p>
                      <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Người tổ chức sẽ cập nhật mục tiêu sớm</p>
                    </div>
                  ) : (
                    <div className="p-6">
                      {/* Rings Row */}
                      <div className={`grid gap-6 ${event.isJoined ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                        {/* Group Progress Ring */}
                        <div className="flex flex-col items-center gap-4 p-5 bg-gradient-to-b from-blue-50 to-transparent dark:from-blue-900/10 dark:to-transparent rounded-2xl">
                          <div className="relative">
                            <ProgressRing
                              percent={groupPercent}
                              size={140}
                              strokeWidth={12}
                              color="#3b82f6"
                              colorEnd={groupPercent >= 100 ? '#22c55e' : '#6366f1'}
                              label={`${groupPercent}%`}
                              sublabel="cả nhóm"
                            />
                          </div>
                          <div className="text-center">
                            <div className="flex items-center gap-2 justify-center mb-1">
                              <FaUsers className="text-blue-500 text-sm" />
                              <span className="font-bold text-gray-800 dark:text-white">Tiến độ cả nhóm</span>
                            </div>
                            <p className="text-sm">
                              <span className="font-black text-blue-600 dark:text-blue-400">{groupTotal.toFixed(2)}</span>
                              <span className="text-gray-400 mx-1">/</span>
                              <span className="text-gray-600 dark:text-gray-300 font-semibold">{effectiveTarget} {event.targetUnit}</span>
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              {overallProgress.participantCount || 0} người đóng góp
                            </p>
                          </div>
                        </div>

                        {/* My Progress Ring (only for participants) */}
                        {event.isJoined && (
                          <div className="flex flex-col items-center gap-4 p-5 bg-gradient-to-b from-emerald-50 to-transparent dark:from-emerald-900/10 dark:to-transparent rounded-2xl">
                            <div className="relative">
                              <ProgressRing
                                percent={myPercent}
                                size={140}
                                strokeWidth={12}
                                color="#10b981"
                                colorEnd={myPercent >= 100 ? '#22c55e' : '#06b6d4'}
                                label={`${myPercent}%`}
                                sublabel="hoàn thành"
                              />
                            </div>
                            <div className="text-center">
                              <div className="flex items-center gap-2 justify-center mb-1">
                                <FaTrophy className="text-yellow-500 text-sm" />
                                <span className="font-bold text-gray-800 dark:text-white">Mục tiêu cá nhân</span>
                              </div>
                              <p className="text-sm">
                                <span className="font-black text-emerald-600 dark:text-emerald-400">{myTotal.toFixed(2)}</span>
                                <span className="text-gray-400 mx-1">/</span>
                                <span className="text-gray-600 dark:text-gray-300 font-semibold">{perPersonTarget.toFixed(2)} {event.targetUnit}</span>
                              </p>

                            </div>
                          </div>
                        )}
                      </div>



                      {/* CTA for non-participants */}
                      {!event.isJoined && (
                        <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
                          <p className="text-sm text-gray-400 dark:text-gray-500 text-center">
                            Tham gia sự kiện để theo dõi tiến độ cá nhân
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })()}
            {/* Event Stats Summary */}
            {(() => {
              const targetVal = event.targetValue || 0
              const groupTotal = overallProgress.totalGroupProgress || 0
              const partCount = overallProgress.participantCount || 0
              const groupPct = targetVal > 0 ? Math.min(Math.round((groupTotal / targetVal) * 100), 100) : 0
              return targetVal > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                  <div className="bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-4">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      📊 Thống kê sự kiện
                    </h2>
                  </div>
                  <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                      <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{groupTotal.toFixed(2)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Tổng {event.targetUnit}</p>
                    </div>
                    <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                      <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{groupPct}%</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Hoàn thành</p>
                    </div>
                    <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                      <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{partCount}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Đóng góp</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                      <p className="text-2xl font-black text-purple-600 dark:text-purple-400">
                        {partCount > 0 ? (groupTotal / partCount).toFixed(2) : '0'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">TB/{event.targetUnit}/người</p>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Leaderboard Preview */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="flex items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <FaMedal className="text-yellow-500" /> Bảng xếp hạng
                </h2>
              </div>
              {participants && participants.length > 0 ? (
                <SportEventLeaderboard
                  participants={participants}
                  isLoading={isLoadingParticipants}
                  searchTerm={""}
                  setSearchTerm={() => { }}
                  event={event}
                  connectedIds={connectedIds}
                  friendIds={friendIds}
                />
              ) : (
                <p className="text-center text-gray-500 py-8">Chưa có người tham gia xếp hạng</p>
              )}
            </div>


          </div>
        )}

        {/* TIẾN ĐỘ TAB */}
        {activeTab === 'progress' && event.isJoined && (
          event.eventType === 'Trong nhà'
            ? <IndoorEventProgress event={event} userProgress={userProgress} />
            : <SportEventProgress event={event} userProgress={userProgress} />
        )}




      </div>

      {/* ==================== INVITE FRIENDS MODAL ==================== */}
      {
        showInviteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[80vh]">
              {/* Modal Header */}
              <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-700">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <FaBell className="text-blue-500" />
                    Mời bạn bè tham gia
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Bạn bè sẽ nhận được thông báo về sự kiện này
                  </p>
                </div>
                <button
                  onClick={() => { setShowInviteModal(false); setFriendSearch('') }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
                >
                  <FaTimes className="text-gray-500" />
                </button>
              </div>

              {/* Search */}
              <div className="px-5 pt-4 pb-2">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={friendSearch}
                    onChange={(e) => setFriendSearch(e.target.value)}
                    placeholder="Tìm tên bạn bè..."
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Friends List */}
              <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-2">
                {myFriends.length === 0 ? (
                  <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                    <FaInvite className="mx-auto text-4xl mb-3 text-gray-300" />
                    <p className="font-medium">Bạn chưa có người bạn nào</p>
                    <p className="text-xs mt-1">Kết bạn thêm để có thể mời họ!</p>
                  </div>
                ) : filteredFriendsForInvite.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    Không tìm thấy bạn bè phù hợp
                  </div>
                ) : (
                  filteredFriendsForInvite.map((friend) => {
                    const alreadyInvited = invitedIds.has(String(friend._id))
                    const alreadyJoined = participants.some(p => {
                      const pid = p._id || p.userId?._id
                      return String(pid) === String(friend._id)
                    })
                    return (
                      <div
                        key={friend._id}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/40 transition"
                      >
                        <div className="relative shrink-0">
                          <img
                            src={friend.avatar ? getImageUrl(friend.avatar) : useravatar}
                            alt={friend.name}
                            className="w-11 h-11 rounded-full object-cover border-2 border-green-400"
                          />
                          <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{friend.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{friend.email}</p>
                        </div>
                        <div className="shrink-0">
                          {alreadyJoined ? (
                            <span className="text-xs px-3 py-1.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full font-medium flex items-center gap-1">
                              <FaCheck size={10} /> Đã tham gia
                            </span>
                          ) : alreadyInvited ? (
                            <span className="text-xs px-3 py-1.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full font-medium flex items-center gap-1">
                              <FaCheck size={10} /> Đã mời
                            </span>
                          ) : (
                            <button
                              onClick={() => inviteFriendMutation.mutate(friend._id)}
                              disabled={inviteFriendMutation.isPending}
                              className="text-xs px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-medium transition flex items-center gap-1 disabled:opacity-50"
                            >
                              {inviteFriendMutation.isPending ? (
                                <AiOutlineLoading3Quarters className="animate-spin" size={10} />
                              ) : (
                                <FaBell size={10} />
                              )}
                              Mời
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-b-2xl">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  💡 Bạn bè sẽ nhận thông báo — nhấn vào sẽ dẫn đến trang sự kiện này
                </p>
              </div>
            </div>
          </div>
        )
      }

      {/* Leave Confirmation Modal */}
      {
        showLeaveModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl animate-scaleIn border border-gray-100 dark:border-gray-700">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mb-6">
                  <FaTimes size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
                  Rời khỏi sự kiện?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                  Bạn có chắc chắn muốn rời khỏi sự kiện <span className="font-bold text-gray-800 dark:text-white">"{event.name}"</span> không?
                  Tiến độ hiện tại của bạn sẽ không bị xóa nhưng bạn sẽ không xuất hiện trong bảng xếp hạng nữa.
                </p>

                <div className="flex gap-4 w-full">
                  <button
                    onClick={() => setShowLeaveModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    onClick={confirmLeaveEvent}
                    disabled={leaveEventMutation.isPending}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition shadow-lg shadow-red-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {leaveEventMutation.isPending && (
                      <AiOutlineLoading3Quarters className="animate-spin" />
                    )}
                    Xác nhận rời
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  )
}