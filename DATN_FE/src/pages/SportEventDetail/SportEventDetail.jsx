import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
  inviteFriendToEvent
} from '../../apis/sportEventApi'
import { currentAccount } from '../../apis/userApi'

// Components
import { getImageUrl } from '../../utils/imageUrl'
import useravatar from '../../assets/images/useravatar.jpg'
import SportEventProgress from './components/SportEventProgress'
import SportEventLeaderboard from './components/SportEventLeaderboard'
import SportEventShareModal from '../../components/SportEvent/SportEventShareModal'
import IndoorEventProgress from './components/IndoorEventProgress'

export default function SportEventDetail() {

  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // UI State
  const [activeTab, setActiveTab] = useState('details')
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

  // Removed: Fetch Posts (community posts moved to /home page)

  // ==================== MUTATIONS ====================

  // Join Event Mutation
  const joinEventMutation = useMutation({
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
  const inviteFriendMutation = useMutation({
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
  const leaveEventMutation = useMutation({
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
  const addProgressMutation = useMutation({
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
  const checkInMutation = useMutation({
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
  const checkOutMutation = useMutation({
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


  // Calculate progress percentage
  // Tiến độ tối đa mỗi người = Mục tiêu sự kiện / Số người tối đa
  const calculateProgress = () => {
    if (!userProgress || !event?.targetValue) return 0
    const total = userProgress.totalProgress || 0
    const maxParticipants = event?.maxParticipants > 0 ? event.maxParticipants : 1
    const perPersonTarget = event.targetValue / maxParticipants
    return Math.min(Math.round((total / perPersonTarget) * 100), 100)
  }

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
            <div className="flex items-center gap-3 mb-4">
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
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">{event.name}</h1>

            <div className="flex flex-wrap items-center gap-6 text-sm md:text-base">
              <div className="flex items-center gap-2">
                <FaCalendarAlt />
                <span>{eventStartDate.format('DD/MM/YYYY')} - {eventEndDate.format('DD/MM/YYYY')}</span>
              </div>
              <div className="flex items-center gap-2">
                {isOnline ? <MdVideocam /> : <FaMapMarkerAlt />}
                <span>{event.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaUsers />
                <span>{event.participants}/{event.maxParticipants} người tham gia</span>
              </div>
            </div>

            {/* Join/Leave Button */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {!event.isJoined ? (
                (event.endDate && moment().startOf('day').isAfter(moment(event.endDate).endOf('day'))) ? (
                  <button
                    onClick={() => { }}
                    className="px-8 py-3 bg-white/10 text-white/70 border border-white/20 rounded-lg font-bold text-lg flex items-center gap-2 cursor-default"
                  >
                    Sự kiện đã kết thúc
                  </button>
                ) : (event.startDate && moment().startOf('day').isBefore(moment(event.startDate).startOf('day'))) ? (
                  <button
                    onClick={() => { }}
                    className="px-8 py-3 bg-white/10 text-white/70 border border-white/20 rounded-lg font-bold text-lg flex items-center gap-2 cursor-default"
                  >
                    Sự kiện chưa bắt đầu
                  </button>
                ) : (event.maxParticipants > 0 && event.participants >= event.maxParticipants) ? (
                  <button
                    onClick={() => { }}
                    className="px-8 py-3 bg-white/10 text-white/70 border border-white/20 rounded-lg font-bold text-lg flex items-center gap-2 cursor-default"
                  >
                    Đã đầy chỗ
                  </button>
                ) : (
                  <button
                    onClick={handleJoinEvent}
                    disabled={joinEventMutation.isPending}
                    className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold text-lg transition shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {joinEventMutation.isPending ? (
                      <AiOutlineLoading3Quarters className="animate-spin" />
                    ) : <FaPlus className="text-sm" />}
                    Tham gia ngay
                  </button>
                )
              ) : (
                <>
                  <div className="px-6 py-3 bg-green-500 text-white rounded-lg font-bold text-lg flex items-center gap-2 shadow-lg shadow-green-500/20">
                    <MdCheckCircle className="text-xl" />
                    Đã tham gia
                  </div>
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium text-sm transition shadow-lg shadow-blue-500/20 flex items-center gap-2"
                  >
                    <FaInvite className="text-sm" />
                    Mời bạn bè
                  </button>
                  <button
                    onClick={() => setShowLeaveModal(true)}
                    disabled={leaveEventMutation.isPending}
                    className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-lg font-medium text-sm transition backdrop-blur-sm flex items-center gap-2"
                  >
                    {leaveEventMutation.isPending ? (
                      <AiOutlineLoading3Quarters className="animate-spin" />
                    ) : <FaTimes className="text-sm" />}
                    Rời khỏi
                  </button>
                </>
              )}
              {/* Share Event Button - always visible, same row */}
              <button
                onClick={handleShareEvent}
                className="flex items-center gap-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2.5 rounded-lg backdrop-blur-sm transition text-sm font-medium"
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
              {/* Time Section */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <FaCalendarAlt className="text-red-500 text-2xl shrink-0" />
                  <h3 className="font-semibold text-gray-800 dark:text-white">Thời gian</h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Ngày bắt đầu</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {eventStartDate.format('DD/MM/YYYY')}
                    </p>
                  </div>
                  <div className="border-t border-gray-100 dark:border-gray-700 pt-2">
                    <p className="text-xs text-gray-500 uppercase font-bold">Ngày kết thúc</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {eventEndDate.format('DD/MM/YYYY')}
                    </p>
                  </div>
                  <div className="border-t border-gray-100 dark:border-gray-700 pt-2">
                    <p className="text-xs text-gray-500 uppercase font-bold">Thời điểm</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {eventStartDate.format('HH:mm')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Location/Online Section — chỉ hiện cho sự kiện ngoài trời */}
              {!isOnline && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <FaMapMarkerAlt className="text-green-500 text-2xl shrink-0" />
                    <h3 className="font-semibold text-gray-800 dark:text-white">Địa điểm</h3>
                  </div>
                  <p
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium mb-2 cursor-pointer inline-flex items-center gap-1 border-b border-transparent hover:border-blue-600 dark:hover:border-blue-300 transition"
                    onClick={() => setShowMapPopup(true)}
                  >
                    {event.location}
                  </p>
                </div>
              )}

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

            {/* Event Creator Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
                Người tổ chức
              </h2>
              <div
                className="flex items-center gap-4 cursor-pointer group"
                onClick={() => event.creator?._id && navigate(`/user/${event.creator._id}`)}
              >
                <div className="relative">
                  <img
                    src={getImageUrl(event.creator?.avatar)}
                    alt={event.creator?.name}
                    className="w-16 h-16 rounded-full object-cover ring-2 ring-transparent group-hover:ring-red-400 transition"
                  />
                  {event.creator?._id && friendIds.has(String(event.creator._id)) && (
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                      <FaCheck className="text-white" style={{ fontSize: 8 }} />
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white group-hover:text-red-500 transition">
                    {event.creator?.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Đã tạo {moment(event.createdAt).fromNow()}
                  </p>
                </div>
              </div>
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
                            src={friend.avatar || useravatar}
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