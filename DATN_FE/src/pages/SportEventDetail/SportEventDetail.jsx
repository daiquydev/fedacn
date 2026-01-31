import { useState, useRef, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  AiFillHeart,
  AiOutlineHeart,
  AiOutlineLoading3Quarters 
} from 'react-icons/ai'
import { 
  FaCheckCircle, 
  FaUserFriends, 
  FaMedal, 
  FaSort, 
  FaSortUp, 
  FaSortDown, 
  FaSearch, 
  FaTimes, 
  FaImage, 
  FaCalendarAlt, 
  FaMapMarkerAlt, 
  FaTrophy, 
  FaUserCircle, 
  FaUsers,
  FaArrowLeft,
  FaShare,
  FaPlus
} from 'react-icons/fa'
import { 
  MdPublic, 
  MdVideocam, 
  MdOutlineHistoryEdu, 
  MdErrorOutline, 
  MdCheckCircle 
} from 'react-icons/md'
import { BsClockHistory, BsCalendarCheck } from 'react-icons/bs'
import { PiShareFatLight } from 'react-icons/pi'
import { LiaComments } from 'react-icons/lia'
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
  getLeaderboard,
  getEventPosts,
  createEventPost,
  likeEventPost,
  shareEventPost,
  checkInSession,
  checkOutSession,
  isCheckedIn,
  getSessionAttendance
} from '../../apis/sportEventApi'

// Components
import AttendanceTracker from '../../components/AttendanceTracker'
import SessionAttendanceSummary from '../../components/SessionAttendanceSummary'
import SessionNotification from '../../components/SessionNotification'
import { getImageUrl } from '../../utils/imageUrl'
import useravatar from '../../assets/images/useravatar.jpg'
import { AppContext } from '../../contexts/app.context'
import SportEventProgress from './components/SportEventProgress'
import SportEventLeaderboard from './components/SportEventLeaderboard'
import SportEventComments from './components/SportEventComments'

export default function SportEventDetail() {

  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { profile } = useContext(AppContext)
  
  // UI State
  const [activeTab, setActiveTab] = useState('details')
  const [searchTerm, setSearchTerm] = useState('')
  const [showVideoCall, setShowVideoCall] = useState(false)
  const [showSessionNotification, setShowSessionNotification] = useState(false)
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  
  // Form State
  const [newPost, setNewPost] = useState({ content: '', images: [] })
  const [progressUpdate, setProgressUpdate] = useState({ 
    value: '', 
    distance: '', 
    time: '',
    calories: '', 
    proofImage: '',
    notes: '' 
  })
  const fileInputRef = useRef(null)

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

  const event = eventData?.data?.result || eventData?.result

  // Fetch Sessions (for online events)
  const { 
    data: sessionsData, 
    isLoading: isLoadingSessions 
  } = useQuery({
    queryKey: ['eventSessions', id],
    queryFn: () => getEventSessions(id),
    enabled: !!id && event?.eventType === 'online'
  })

  const sessions = sessionsData?.data?.result || sessionsData?.result || []

  // Fetch Next Session
  const { 
    data: nextSessionData 
  } = useQuery({
    queryKey: ['nextSession', id],
    queryFn: () => getNextSession(id),
    enabled: !!id && event?.eventType === 'online'
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

  // Fetch Participants (for Participants Tab)
  const { 
    data: participantsData,
    isLoading: isLoadingParticipants 
  } = useQuery({
    queryKey: ['eventParticipants', id, searchTerm],
    queryFn: () => getParticipants(id, { search: searchTerm, limit: 100 }),
    enabled: !!id && (activeTab === 'participants' || activeTab === 'details')
  })

  const participants = participantsData?.data?.result?.participants || participantsData?.result?.participants || []

  // Fetch Leaderboard
  const { 
    data: leaderboardData 
  } = useQuery({
    queryKey: ['eventLeaderboard', id],
    queryFn: () => getLeaderboard(id),
    enabled: !!id && activeTab === 'participants'
  })

  const leaderboard = leaderboardData?.data?.result?.leaderboard || leaderboardData?.result?.leaderboard || []

  // Fetch Posts (for Community Tab)
  const { 
    data: postsData,
    isLoading: isLoadingPosts 
  } = useQuery({
    queryKey: ['eventPosts', id],
    queryFn: () => getEventPosts(id, { page: 1, limit: 20 }),
    enabled: !!id && activeTab === 'posts'
  })

  const posts = postsData?.data?.result?.posts || postsData?.result?.posts || []

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

  // Create Post Mutation
  const createPostMutation = useMutation({
    mutationFn: (postData) => createEventPost(id, postData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventPosts', id] })
      toast.success('Đã đăng bài thành công!')
      setNewPost({ content: '', images: [] })
      if (fileInputRef.current) fileInputRef.current.value = ''
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Không thể đăng bài')
    }
  })

  // Like Post Mutation
  const likePostMutation = useMutation({
    mutationFn: (postId) => likeEventPost(id, postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventPosts', id] })
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Không thể thích bài viết')
    }
  })

  // Share Post Mutation
  const sharePostMutation = useMutation({
    mutationFn: (postId) => shareEventPost(id, postId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['eventPosts', id] })
      // Copy link to clipboard
      const link = `${window.location.origin}/sport-event/${id}?postId=${data.data.result._id}`
      navigator.clipboard.writeText(link)
      toast.success('Đã sao chép liên kết chia sẻ!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Không thể chia sẻ bài viết')
    }
  })

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

      // Check if event has ended
      if (moment().isAfter(moment(event.endDate))) {
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

  const handlePostSubmit = (e) => {
    e.preventDefault()
    
    if (!newPost.content.trim()) {
      toast.error('Vui lòng nhập nội dung bài viết')
      return
    }

    // Create FormData for image upload if needed, but current API expects JSON for images list
    // Assuming images are already uploaded/URLs or just handled as array
    // Check if API needs 'images' as array of strings
    
    createPostMutation.mutate({
      content: newPost.content,
      images: newPost.images
    })
  }



  const handleLikePost = (postId) => {
    likePostMutation.mutate(postId)
  }

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    // TODO: Upload images to server and get URLs
    // For now, just add placeholder URLs
    const imageUrls = files.map((file, index) => URL.createObjectURL(file))
    setNewPost(prev => ({ ...prev, images: [...prev.images, ...imageUrls] }))
  }

  const removeImage = (index) => {
    setNewPost(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }



  // Calculate progress percentage
  const calculateProgress = () => {
    if (!userProgress || !event?.targetValue) return 0
    const total = userProgress.totalProgress || 0
    return Math.min(Math.round((total / event.targetValue) * 100), 100)
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
  const isOnline = event.eventType === 'online'
  const eventStartDate = moment(event.startDate)
  const eventEndDate = moment(event.endDate)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
              <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                isOnline ? 'bg-blue-500' : 'bg-green-500'
              }`}>
                {isOnline ? (
                  <span className="flex items-center gap-1">
                    <MdVideocam /> Trực tuyến
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <FaMapMarkerAlt /> Trực tiếp
                  </span>
                )}
              </span>
              <span className="px-4 py-1.5 bg-red-500 rounded-full text-sm font-medium">
                {event.category}
              </span>
              {event.difficulty && (
                <span className="px-4 py-1.5 bg-yellow-500 rounded-full text-sm font-medium">
                  {event.difficulty}
                </span>
              )}
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
            <div className="mt-6 flex flex-wrap gap-4">
              {!event.isJoined ? (
                <button
                  onClick={handleJoinEvent}
                  disabled={
                    joinEventMutation.isPending || 
                    event.participants >= event.maxParticipants ||
                    moment().isAfter(moment(event.endDate))
                  }
                  className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold text-lg transition shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {joinEventMutation.isPending ? (
                    <AiOutlineLoading3Quarters className="animate-spin" />
                  ) : <FaPlus className="text-sm" />}
                  {event.participants >= event.maxParticipants ? 'Đã đầy chỗ' : 'Tham gia ngay'}
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="px-6 py-3 bg-green-500 text-white rounded-lg font-bold text-lg flex items-center gap-2 shadow-lg shadow-green-500/20">
                    <MdCheckCircle className="text-xl" />
                    Đã tham gia
                  </div>
                  <button
                    onClick={() => setShowLeaveModal(true)}
                    disabled={leaveEventMutation.isPending}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-lg font-medium transition backdrop-blur-sm flex items-center gap-2"
                  >
                    {leaveEventMutation.isPending ? (
                      <AiOutlineLoading3Quarters className="animate-spin" />
                    ) : <FaTimes className="text-sm" />}
                    Rời khỏi
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="container mx-auto max-w-6xl">
          <div className="flex gap-1 overflow-x-auto">
            {[
              { id: 'details', label: 'Chi tiết', icon: <FaCalendarAlt /> },
              ...(event?.isJoined ? [{ id: 'progress', label: 'Tiến độ', icon: <FaMedal /> }] : []),
              { id: 'participants', label: 'Người tham gia', icon: <FaUsers /> },
              { id: 'posts', label: 'Bài đăng cộng đồng', icon: <LiaComments /> },
              ...(isOnline ? [{ id: 'sessions', label: 'Buổi học trực tiếp', icon: <MdVideocam /> }] : [])
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-red-500 border-b-2 border-red-500'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
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
                      <p className="text-xs text-gray-500 uppercase font-bold">Bắt đầu</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {eventStartDate.format('HH:mm')} - {eventStartDate.format('DD/MM/YYYY')}
                      </p>
                   </div>
                   <div className="border-t border-gray-100 dark:border-gray-700 pt-2">
                      <p className="text-xs text-gray-500 uppercase font-bold">Kết thúc</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {eventEndDate.format('HH:mm')} - {eventEndDate.format('DD/MM/YYYY')}
                      </p>
                   </div>
                </div>
              </div>

              {/* Location/Online Section */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  {isOnline ? (
                    <MdVideocam className="text-blue-500 text-2xl shrink-0" />
                  ) : (
                    <FaMapMarkerAlt className="text-green-500 text-2xl shrink-0" />
                  )}
                  <h3 className="font-semibold text-gray-800 dark:text-white">
                    {isOnline ? 'Thông tin tham gia' : 'Địa điểm'}
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 font-medium mb-2">{event.location}</p>
                {isOnline && (
                   <div className="mt-2 text-sm">
                      <p className="text-gray-500 mb-1">Link tham gia:</p>
                      {event.location && (event.location.startsWith('http') ? (
                        <a href={event.location} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline break-all">
                          {event.location}
                        </a>
                      ) : (
                        <span className="text-gray-400 italic">Link sẽ được cập nhật</span>
                      ))}
                      {/* Show next session hint if available */}
                      {nextSession && (
                         <div className="mt-3 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-1">Buổi tiếp theo</p>
                            <p className="font-bold text-blue-800 dark:text-blue-300 line-clamp-1">{nextSession.title}</p>
                            <p className="text-xs text-blue-700 dark:text-blue-400">
                               {moment(nextSession.sessionDate).format('HH:mm DD/MM')}
                            </p>
                         </div>
                      )}
                   </div>
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

            {/* Leaderboard Preview */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
               <div className="flex items-center justify-between mb-6">
                 <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <FaMedal className="text-yellow-500" /> Bảng xếp hạng
                 </h2>
                 <button 
                   onClick={() => setActiveTab('participants')}
                   className="text-sm font-bold text-red-500 hover:text-red-600"
                 >
                    Xem tất cả &rarr;
                 </button>
               </div>
               {participants && participants.length > 0 ? (
                  <SportEventLeaderboard 
                     participants={participants}
                     isLoading={isLoadingParticipants}
                     searchTerm={""}
                     setSearchTerm={() => {}} // No search in preview
                     event={event}
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
              <div className="flex items-center gap-4">
                <img
                  src={getImageUrl(event.creator?.avatar)}
                  alt={event.creator?.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
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
          <SportEventProgress 
            event={event}
            userProgress={userProgress}
            addProgressMutation={addProgressMutation}
            progressUpdate={progressUpdate}
            setProgressUpdate={setProgressUpdate}
          />
        )}
        
        {activeTab === 'participants' && (
          <SportEventLeaderboard 
             participants={participants}
             isLoading={isLoadingParticipants}
             searchTerm={searchTerm}
             setSearchTerm={setSearchTerm}
             event={event}
          />
        )}

        {/* BÀI ĐĂNG CỘNG ĐỒNG TAB */}
        {activeTab === 'posts' && (
          <div className="space-y-6">
            {/* Post Creation Form - Only for Joined Users */}
            {event.isJoined && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                  Tạo bài đăng mới
                </h2>
                
                <form onSubmit={handlePostSubmit}>
                  <textarea
                    value={newPost.content}
                    onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white resize-none"
                    placeholder="Chia sẻ thành tích hôm nay của bạn!"
                    rows={4}
                  />

                  {/* Image Preview */}
                  {newPost.images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                      {newPost.images.map((img, index) => (
                        <div key={index} className="relative">
                          <img
                            src={img}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                          >
                            <FaTimes className="text-xs" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between items-center mt-4">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                      <FaImage />
                      <span>Hình ảnh</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />

                    <button
                      type="submit"
                      disabled={createPostMutation.isPending || !newPost.content.trim()}
                      className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {createPostMutation.isPending ? (
                        <AiOutlineLoading3Quarters className="animate-spin inline mr-2" />
                      ) : null}
                      Đăng
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Posts Feed */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                Bài đăng cộng đồng
              </h2>

              {isLoadingPosts ? (
                <div className="flex items-center justify-center py-12">
                  <AiOutlineLoading3Quarters className="animate-spin text-4xl text-blue-500" />
                </div>
              ) : posts.length > 0 ? (
                <div className="space-y-6">
                  {posts.map((post) => (
                    <div
                      key={post._id}
                      className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0"
                    >
                      {/* Post Header */}
                      <div className="flex items-center gap-3 mb-4">
                        <img
                          src={!post.userId?.avatar ? useravatar : getImageUrl(post.userId.avatar)}
                          alt={post.userId?.name || 'User'}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {post.userId?.name || 'Người dùng'}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {moment(post.createdAt).fromNow()}
                          </p>
                        </div>
                      </div>

                      {/* Post Content */}
                      <p className="text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-line">
                        {post.content}
                      </p>

                      {/* Post Images */}
                      {post.images && post.images.length > 0 && (
                        <div className={`grid gap-3 mb-4 ${
                          post.images.length === 1 ? 'grid-cols-1' :
                          post.images.length === 2 ? 'grid-cols-2' :
                          'grid-cols-2'
                        }`}>
                          {post.images.map((img, index) => (
                            <img
                              key={index}
                              src={getImageUrl(img)}
                              alt={`Post image ${index + 1}`}
                              className="w-full h-64 object-cover rounded-lg"
                            />
                          ))}
                        </div>
                      )}

                      {/* Post Actions */}
                      <div className="flex items-center gap-6 text-gray-600 dark:text-gray-400">
                        <button
                          onClick={() => handleLikePost(post._id)}
                          className={`flex items-center gap-2 transition ${
                            Array.isArray(post.likedBy) && post.likedBy.includes(profile?._id) 
                              ? 'text-red-500' 
                              : 'hover:text-red-500'
                          }`}
                        >
                          {Array.isArray(post.likedBy) && post.likedBy.includes(profile?._id) ? (
                            <AiFillHeart className="text-xl" />
                          ) : (
                            <AiOutlineHeart className="text-xl" />
                          )}
                          <span>{post.likeCount || 0} Thích</span>
                        </button>

                        <div className="flex items-center gap-2 cursor-pointer hover:text-blue-500 transition">
                          <LiaComments className="text-xl" />
                          <span>{post.commentCount || 0} Bình luận</span>
                        </div>

                        <button 
                          onClick={() => sharePostMutation.mutate(post._id)}
                          className="flex items-center gap-2 hover:text-blue-500 transition"
                        >
                          <PiShareFatLight className="text-xl" />
                          <span>{post.shareCount || 0} Chia sẻ</span>
                        </button>
                      </div>

                      {/* Comments Section */}
                      <SportEventComments post={post} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <LiaComments className="mx-auto text-gray-400 text-6xl mb-4" />
                  <h3 className="text-xl font-medium text-gray-600 dark:text-gray-400">
                    Chưa có bài đăng nào
                  </h3>
                  <p className="text-gray-500 mt-2">
                    Hãy là người đầu tiên chia sẻ thành tích của bạn!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* BUỔI HỌC TRỰC TIẾP TAB */}
        {activeTab === 'sessions' && isOnline && (
          <div className="space-y-8">
            {/* Next Upcoming Session */}
            {nextSession && (
              <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-gray-800 dark:to-gray-750 rounded-lg p-8 shadow-sm border border-red-200 dark:border-red-900">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                  Buổi học trực tiếp sắp tới
                </h2>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    {nextSession.title}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                      <FaCalendarAlt className="text-red-500 text-xl" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Ngày</p>
                        <p className="font-semibold">
                          {moment(nextSession.sessionDate).format('dddd, DD MMMM, YYYY')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                      <BsClockHistory className="text-blue-500 text-xl" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Thời gian</p>
                        <p className="font-semibold">
                          {moment(nextSession.sessionDate).format('HH:mm')} ({nextSession.durationHours}h)
                        </p>
                      </div>
                    </div>
                  </div>

                  {nextSession.description && (
                    <p className="text-gray-700 dark:text-gray-300 mb-6">
                      {nextSession.description}
                    </p>
                  )}

                  <button
                    onClick={() => {
                      if (nextSession.videoCallUrl) {
                        window.open(nextSession.videoCallUrl, '_blank')
                      } else {
                        toast.info('Link video call sẽ được cập nhật sớm')
                      }
                    }}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-lg transition flex items-center justify-center gap-2"
                  >
                    <MdVideocam className="text-2xl" />
                    Tham gia ngay
                  </button>

                  {/* Friends also joining */}
                  {event.participants_ids && event.participants_ids.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Có {Math.min(event.participants_ids.length, 3)} người bạn theo dõi đang tham gia
                      </p>
                      <div className="flex -space-x-2">
                        {event.participants_ids.slice(0, 3).map((participant, index) => (
                          <img
                            key={index}
                            src={getImageUrl(participant.avatar)}
                            alt={participant.name}
                            className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 object-cover"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Session List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="border-l-4 border-purple-500 pl-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  Danh sách buổi học
                </h2>
              </div>

              {isLoadingSessions ? (
                <div className="flex items-center justify-center py-12">
                  <AiOutlineLoading3Quarters className="animate-spin text-4xl text-blue-500" />
                </div>
              ) : sessions.length > 0 ? (
                <div className="space-y-4">
                  {sessions.map((session, index) => {
                    const sessionStart = moment(session.sessionDate)
                    const sessionEnd = sessionStart.clone().add(session.durationHours, 'hours')
                    const now = moment()
                    const isCompleted = session.isCompleted || now.isAfter(sessionEnd)
                    const isOngoing = now.isBetween(sessionStart, sessionEnd)
                    const isUpcoming = now.isBefore(sessionStart)

                    return (
                      <div
                        key={session._id || index}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition"
                      >
                        <div className="flex flex-col gap-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                            Buổi {session.sessionNumber}: {session.title}
                                        </h3>
                                        {isCompleted && (
                                            <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-full text-sm font-medium">
                                            Đã hoàn thành
                                            </span>
                                        )}
                                        {isOngoing && (
                                            <span className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full text-sm font-medium animate-pulse">
                                            Đang diễn ra
                                            </span>
                                        )}
                                        {isUpcoming && (
                                            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 rounded-full text-sm font-medium">
                                            Sắp tới
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                                        <div className="flex items-center gap-2">
                                            <FaCalendarAlt className="text-gray-400" />
                                            <span>{sessionStart.format('DD/MM/YYYY')}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <BsClockHistory className="text-gray-400" />
                                            <span>{sessionStart.format('HH:mm')} - {sessionEnd.format('HH:mm')} ({session.durationHours}h)</span>
                                        </div>
                                    </div>
                                    
                                    {session.description && (
                                        <p className="mt-3 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-750 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                                            {session.description}
                                        </p>
                                    )}

                                    {/* Camera Preview / Join Link */}
                                    <div className="mt-4">
                                      <p className="text-sm font-semibold text-gray-500 mb-2">Phòng học trực tuyến:</p>
                                      {session.videoCallUrl ? (
                                        <div 
                                          onClick={() => window.open(session.videoCallUrl, '_blank')}
                                          className="relative group cursor-pointer overflow-hidden rounded-xl bg-gray-900 aspect-video max-w-md w-full border border-gray-700 shadow-lg"
                                        >
                                          {/* Placeholder / Thumbnail */}
                                          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50 group-hover:text-white/80 transition duration-300">
                                            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-3 backdrop-blur-sm group-hover:scale-110 transition duration-300">
                                              <MdVideocam className="text-3xl" />
                                            </div>
                                            <p className="font-medium text-sm">Nhấn để tham gia buổi học</p>
                                          </div>
                                          
                                          {/* Overlay Button */}
                                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center backdrop-blur-[2px]">
                                            <button className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition duration-300 flex items-center gap-2">
                                              <MdVideocam />
                                              Tham gia ngay
                                            </button>
                                          </div>
                                          
                                          {/* Link text at bottom */}
                                          <div className="absolute bottom-3 left-0 right-0 px-4 text-center">
                                            <p className="text-xs text-white/40 truncate">{session.videoCallUrl}</p>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="aspect-video max-w-md w-full bg-gray-100 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center text-gray-400">
                                            <MdVideocam className="text-4xl mb-2 opacity-50" />
                                            <p className="text-sm">Chưa có link phòng học</p>
                                        </div>
                                      )}
                                    </div>
                                </div>

                                {/* Action Buttons for Ongoing Session */}
                                {event.isJoined && isOngoing && (
                                    <div className="flex flex-col gap-2 shrink-0">
                                        <button
                                            onClick={() => checkInMutation.mutate(session._id)}
                                            disabled={checkInMutation.isPending}
                                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold text-sm transition disabled:opacity-50 whitespace-nowrap"
                                        >
                                            Điểm danh
                                        </button>
                                        <button
                                            onClick={() => checkOutMutation.mutate(session._id)}
                                            disabled={checkOutMutation.isPending}
                                            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold text-sm transition disabled:opacity-50 whitespace-nowrap"
                                        >
                                            Kết thúc
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Attendance Info - Only for completed sessions */}
                        {isCompleted && event.isJoined && (
                          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <details className="group">
                              <summary className="cursor-pointer text-blue-600 dark:text-blue-400 hover:underline font-medium text-sm">
                                Xem thông tin điểm danh của bạn
                              </summary>
                              <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-750 rounded-lg">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {/* Placeholder for attendance details */}
                                  Thông tin điểm danh chi tiết sẽ được hiển thị ở đây.
                                </p>
                              </div>
                            </details>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* Attendance Instructions */}
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                      Lưu ý về Điểm danh
                    </h4>
                    <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                      <li>• Bạn có thể điểm danh khi buổi học đang diễn ra.</li>
                      <li>• Nhớ nhấn "Kết thúc" khi rời khỏi buổi học để ghi nhận thời gian.</li>
                      <li>• Hệ thống sẽ tự động tính thời gian tham gia của bạn dựa trên Check-in/Check-out.</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <BsCalendarCheck className="mx-auto text-gray-400 text-6xl mb-4" />
                  <h3 className="text-xl font-medium text-gray-600 dark:text-gray-400">
                    Chưa có buổi học nào
                  </h3>
                  <p className="text-gray-500 mt-2">
                    Các buổi học sẽ được cập nhật sớm
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {/* Leave Confirmation Modal */}
      {showLeaveModal && (
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
      )}
    </div>
  )
}