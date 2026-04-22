import React, { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getChallenge, joinChallenge, quitChallenge,
  addChallengeProgress, getChallengeProgress, getChallengeParticipants,
  inviteFriendToChallenge
} from '../../apis/challengeApi'
import { currentAccount } from '../../apis/userApi'
import { toast } from 'react-hot-toast'
import {
  FaTrophy, FaArrowLeft, FaUtensils, FaRunning, FaDumbbell,
  FaUsers, FaClock, FaFire, FaPlus, FaCalendarAlt, FaTimes,
  FaMedal, FaShare, FaSearch, FaCheck, FaBell, FaFlag,
  FaUserFriends as FaInvite, FaGlobe, FaUserFriends, FaLock
} from 'react-icons/fa'
import {
  MdCheckCircle, MdErrorOutline
} from 'react-icons/md'
import { BsClockHistory, BsCalendarCheck } from 'react-icons/bs'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import moment from 'moment'
import { useSafeMutation } from '../../hooks/useSafeMutation'
import { getImageUrl } from '../../utils/imageUrl'
import useravatar from '../../assets/images/useravatar.jpg'
import ChallengeCalendar from './components/ChallengeCalendar'
import DayChallengeModal from './components/DayChallengeModal'
import NutritionCheckinModal from './components/NutritionCheckinModal'
import FitnessCheckinModal from './components/FitnessCheckinModal'
import OutdoorCheckinModal from './components/OutdoorCheckinModal'
import ChallengeParticipants from './components/ChallengeParticipants'
import ParticipantProgressModal from './components/ParticipantProgressModal'
import ChallengeShareModal from '../../components/Challenge/ChallengeShareModal'
import ModalReportChallenge from './components/ModalReportChallenge'
import { format } from 'date-fns'
import { getChallengePersonalProgressPercent } from '../../utils/challengeProgress'

const TYPE_CONFIG = {
  nutrition: { icon: <FaUtensils />, label: 'Ăn uống', gradient: 'from-emerald-500 to-teal-600', color: 'bg-emerald-500', checkinLabel: 'Chụp ảnh bữa ăn' },
  outdoor_activity: { icon: <FaRunning />, label: 'Ngoài trời', gradient: 'from-blue-500 to-cyan-600', color: 'bg-blue-500', checkinLabel: 'Ghi nhận hoạt động' },
  fitness: { icon: <FaDumbbell />, label: 'Thể dục', gradient: 'from-purple-500 to-pink-600', color: 'bg-pink-500', checkinLabel: 'Ghi nhận buổi tập' }
}

const VISIBILITY_CONFIG = {
  public:  { icon: <FaGlobe />,       label: 'Công khai',    bg: 'bg-green-500/90', text: 'text-white' },
  friends: { icon: <FaUserFriends />, label: 'Bạn bè',       bg: 'bg-blue-500/90',  text: 'text-white' },
  private: { icon: <FaLock />,        label: 'Chỉ mình tôi', bg: 'bg-gray-600/90',  text: 'text-white' }
}


export default function ChallengeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // UI State
  const [activeTab, setActiveTab] = useState('details')
  const [showCheckin, setShowCheckin] = useState(false)
  const [selectedParticipant, setSelectedParticipant] = useState(null)
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [selectedDay, setSelectedDay] = useState(null) // { dateStr, dayData }
  const [showSubModal, setShowSubModal] = useState(null) // 'tracking' | 'manual' | null
  const [showShareModal, setShowShareModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [friendSearch, setFriendSearch] = useState('')
  const [invitedIds, setInvitedIds] = useState(new Set())

  // ==================== DATA FETCHING ====================

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['challenge', id],
    queryFn: () => getChallenge(id),
    staleTime: 1000
  })
  const challenge = data?.data?.result

  // Fetch current user's friends
  const { data: meData } = useQuery({
    queryKey: ['me'],
    queryFn: currentAccount
  })
  const me = meData?.data?.result?.[0]
  const myFollowers = useMemo(() => me?.followers || [], [me])
  const myFollowings = useMemo(() => me?.followings || [], [me])
  const followerIds = useMemo(() => new Set(myFollowers.map(p => String(p._id))), [myFollowers])
  const followingIds = useMemo(() => new Set(myFollowings.map(p => String(p._id))), [myFollowings])
  const myFriends = useMemo(
    () => myFollowers.filter(p => followingIds.has(String(p._id))),
    [myFollowers, followingIds]
  )
  const friendIds = useMemo(() => new Set(myFriends.map(p => String(p._id))), [myFriends])
  const connectedIds = useMemo(() => new Set([...followerIds, ...followingIds]), [followerIds, followingIds])

  /** Khớp quy tắc backend: công khai = mọi người; bạn bè = mutual follow với người tạo; chỉ mình tôi = không tham gia qua link */
  const mayJoinByVisibility = useMemo(() => {
    if (!challenge) return false
    const vis = challenge.visibility || 'public'
    const creatorId = String(challenge.creator_id?._id || challenge.creator_id || '')
    if (vis === 'public') return true
    if (vis === 'private') return false
    if (vis === 'friends') return friendIds.has(creatorId)
    return true
  }, [challenge, friendIds])

  /** Công khai: mọi người đã tham gia đều mời được. Bạn bè: chỉ người tạo. Chỉ mình tôi: không hiện. */
  const canShowInviteFriends = useMemo(() => {
    if (!challenge?.isJoined) return false
    const vis = challenge.visibility
    if (vis === 'private') return false
    if (vis === 'public') return true
    if (vis === 'friends') {
      const creatorId = String(challenge.creator_id?._id || challenge.creator_id || '')
      const myId = String(me?._id || '')
      return Boolean(creatorId && myId && creatorId === myId)
    }
    return false
  }, [challenge?.isJoined, challenge?.visibility, challenge?.creator_id, me?._id])

  const filteredFriendsForInvite = useMemo(() => {
    const kw = friendSearch.toLowerCase().trim()
    return myFriends.filter(f => {
      if (!kw) return true
      return (f.name || '').toLowerCase().includes(kw) || (f.email || '').toLowerCase().includes(kw)
    })
  }, [myFriends, friendSearch])

  // My progress entries (for calendar)
  const { data: progressData, refetch: refetchProgress } = useQuery({
    queryKey: ['challenge-progress', id],
    queryFn: () => getChallengeProgress(id, {}),
    staleTime: 1000,
    enabled: !!challenge?.isJoined
  })
  const progressList = progressData?.data?.result?.progress || []

  // Group progress entries by date for DayChallengeModal
  const progressByDate = useMemo(() => {
    const map = {}
    const challengeType = challenge?.challenge_type
    progressList.forEach(entry => {
      const dateStr = format(new Date(entry.date || entry.createdAt), 'yyyy-MM-dd')
      if (!map[dateStr]) map[dateStr] = { total: 0, entries: [], completedIds: new Set() }
      const isValid = entry.validation_status !== 'invalid_time' && entry.ai_review_valid !== false
      if (isValid) {
        if (challengeType === 'fitness' && Array.isArray(entry.completed_exercises)) {
          entry.completed_exercises.forEach(ce => {
            if (ce.completed) {
              const idStr =
                typeof ce.exercise_id === 'string'
                  ? ce.exercise_id
                  : (ce.exercise_id?._id || ce.exercise_id?.toString())
              if (idStr) map[dateStr].completedIds.add(idStr.toString())
            }
          })
          map[dateStr].total = map[dateStr].completedIds.size
        } else {
          map[dateStr].total += entry.value || 0
        }
      }
      map[dateStr].entries.push(entry)
    })
    return map
  }, [progressList, challenge?.challenge_type])

  // Participants list
  const { data: participantsData, isLoading: participantsLoading } = useQuery({
    queryKey: ['challenge-participants', id],
    queryFn: () => getChallengeParticipants(id),
    staleTime: 1000,
    enabled: activeTab === 'participants' || showInviteModal
  })
  const participantsList = participantsData?.data?.result?.participants || []

  // ==================== MUTATIONS ====================

  const joinMutation = useSafeMutation({
    mutationFn: () => joinChallenge(id),
    onSuccess: () => { toast.success('Đã tham gia thử thách!'); queryClient.invalidateQueries({ queryKey: ['challenge', id] }) },
    onError: (err) => toast.error(err?.response?.data?.message || 'Lỗi')
  })

  const quitMutation = useSafeMutation({
    mutationFn: () => quitChallenge(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['challenge', id] }); toast.success('Đã rời thử thách'); setShowLeaveModal(false) },
    onError: (err) => toast.error(err?.response?.data?.message || 'Lỗi')
  })

  const progressMutation = useSafeMutation({
    mutationFn: (data) => addChallengeProgress(id, data),
    onSuccess: () => {
      toast.success('Ghi nhận tiến độ thành công! 🎉')
      setShowCheckin(false)
      setShowSubModal(null)
      queryClient.invalidateQueries({ queryKey: ['challenge', id] })
      queryClient.invalidateQueries({ queryKey: ['challenge-progress', id] })
      // Refresh day data if modal is open
      if (selectedDay) {
        refetchProgress()
      }
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Lỗi')
  })

  // Invite Friend Mutation
  const inviteFriendMutation = useSafeMutation({
    mutationFn: (friendId) => inviteFriendToChallenge(id, friendId),
    onSuccess: (_, friendId) => {
      setInvitedIds(prev => new Set([...prev, String(friendId)]))
      toast.success('Đã gửi lời mời! Bạn bè của bạn sẽ nhận được thông báo.')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Không thể gửi lời mời')
    }
  })

  // ==================== COMPUTED ====================

  const config = challenge ? (TYPE_CONFIG[challenge.challenge_type] || TYPE_CONFIG.fitness) : TYPE_CONFIG.fitness
  const participation = challenge?.participation

  // Calculate total days for the challenge
  const safeStartDate = new Date(challenge?.start_date || new Date())
  const safeEndDate = new Date(challenge?.end_date || new Date())
  safeStartDate.setHours(0, 0, 0, 0)
  safeEndDate.setHours(0, 0, 0, 0)
  const totalRequiredDays = Math.max(1, Math.ceil((safeEndDate.getTime() - safeStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1)

  const progress = getChallengePersonalProgressPercent(challenge, participation)

  const startDate = challenge ? moment(challenge.start_date) : moment()
  const endDate = challenge ? moment(challenge.end_date) : moment()
  const isExpired = moment().isAfter(endDate)
  const isNotStarted = moment().isBefore(startDate)
  const isOngoing = !isExpired && !isNotStarted
  const daysLeft = Math.max(0, endDate.diff(moment(), 'days'))

  // Countdown for not-started challenges
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  useEffect(() => {
    if (!challenge?.start_date) return
    const startDt = moment(challenge.start_date)
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
  }, [challenge?.start_date])

  // ==================== LOADING & ERROR ====================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <AiOutlineLoading3Quarters className="animate-spin text-4xl text-orange-500" />
      </div>
    )
  }

  if (isError) {
    const status = error?.response?.status
    const msg = error?.response?.data?.message || error?.message || 'Đã có lỗi xảy ra'
    if (status === 403) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-gray-50 dark:bg-gray-900">
          <FaLock className="text-6xl text-amber-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2 text-center">Không thể xem thử thách</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-center max-w-md">{msg}</p>
          <button
            type="button"
            onClick={() => navigate('/challenge')}
            className="flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition"
          >
            <FaArrowLeft /> Quay lại danh sách
          </button>
        </div>
      )
    }
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <MdErrorOutline className="text-6xl text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2 text-center">Không tải được thử thách</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6 text-center max-w-md">{msg}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition"
        >
          Thử lại
        </button>
      </div>
    )
  }

  if (!challenge) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <MdErrorOutline className="text-6xl text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Không tìm thấy thử thách</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Thử thách không tồn tại hoặc đã bị xóa</p>
        <button
          onClick={() => navigate('/challenge')}
          className="flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition"
        >
          <FaArrowLeft /> Quay lại danh sách
        </button>
      </div>
    )
  }

  const isCreator =
    String(challenge?.creator_id?._id || challenge?.creator_id || '') === String(me?._id || '')

  // Handle day click from calendar → open DayChallengeModal
  const handleDayClick = (dateStr, dayData) => {
    // Lookup day entries from progressByDate
    const data = progressByDate[dateStr] || { total: 0, entries: [] }
    setSelectedDay({ dateStr, dayData: data })
  }

  // Start tracking from DayChallengeModal
  const handleStartTracking = () => {
    if (challenge.challenge_type === 'outdoor_activity') {
      setSelectedDay(null)
      // Navigate to GPS tracking page (handled in DayChallengeModal)
    } else {
      setShowSubModal('tracking')
    }
  }


  // Render sub-modal (type-specific tracking or manual input)
  const renderSubModal = () => {
    if (!showSubModal || !selectedDay) return null
    const commonProps = {
      challenge,
      onClose: () => setShowSubModal(null),
      onSubmit: (data) => progressMutation.mutate(data),
      isLoading: progressMutation.isPending
    }
    switch (challenge.challenge_type) {
      case 'nutrition': return <NutritionCheckinModal {...commonProps} />
      case 'outdoor_activity': return <OutdoorCheckinModal {...commonProps} />
      case 'fitness':
      default: return <FitnessCheckinModal {...commonProps} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Leave Confirmation Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowLeaveModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Rời thử thách?</h3>
            <p className="text-gray-500 text-sm mb-4">Tiến độ của bạn sẽ bị mất. Bạn có chắc chắn muốn rời?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLeaveModal(false)} className="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium text-sm">Hủy</button>
              <button onClick={() => quitMutation.mutate()} disabled={quitMutation.isPending} className="flex-1 py-2.5 rounded-lg bg-red-500 text-white font-medium text-sm hover:bg-red-600 transition disabled:opacity-50">
                {quitMutation.isPending ? <AiOutlineLoading3Quarters className="animate-spin mx-auto" /> : 'Xác nhận rời'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showReportModal && id && (
        <ModalReportChallenge challengeId={id} onClose={() => setShowReportModal(false)} />
      )}

      {/* Hero Section — Matching SportEventDetail */}
      <div className="relative h-96 bg-gradient-to-b from-gray-900 to-gray-800">
        {challenge.image ? (
          <img src={getImageUrl(challenge.image)} alt={challenge.title} className="absolute inset-0 w-full h-full object-cover opacity-40" />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-60`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* Back button — z-30 so it stays above the hero info overlay (also z-10, later in DOM) */}
        <div className="absolute top-6 left-6 z-30">
          <button
            type="button"
            onClick={() => navigate('/challenge')}
            className="flex items-center gap-2 text-white bg-black/30 hover:bg-black/50 px-4 py-2 rounded-lg backdrop-blur-sm transition"
          >
            <FaArrowLeft /> <span>Quay lại</span>
          </button>
        </div>

        {/* Event Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white z-10">
          <div className="container mx-auto max-w-6xl">
            {/* Badges row */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${config.color} flex items-center gap-1.5 shadow-lg`}>
                  {config.icon} {challenge.category && challenge.challenge_type === 'outdoor_activity' ? challenge.category : config.label}
                </span>
                {(() => {
                  const vis = VISIBILITY_CONFIG[challenge?.visibility]
                  if (!vis) return null
                  return (
                    <span className={`px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5 shadow-lg ${vis.bg} ${vis.text}`}>
                      {vis.icon} {vis.label}
                    </span>
                  )
                })()}
              </div>
              {/* Creator */}
              {challenge.creator_id && (
                <div
                  className="flex items-center gap-3 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full pl-1.5 pr-4 py-1.5 cursor-pointer transition group"
                  onClick={() => challenge.creator_id?._id && navigate(`/user/${challenge.creator_id._id}`)}
                >
                  <img
                    src={challenge.creator_id?.avatar ? getImageUrl(challenge.creator_id.avatar) : useravatar}
                    alt={challenge.creator_id?.name}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-white/40 group-hover:ring-white/80 transition"
                    onError={e => { e.target.src = useravatar }}
                  />
                  <div className="min-w-0">
                    <p className="text-[10px] text-white/60 uppercase font-semibold leading-tight">Người tạo</p>
                    <p className="text-sm font-semibold text-white truncate max-w-[150px] group-hover:text-orange-300 transition">{challenge.creator_id?.name}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Status badges + Countdown */}
            {isNotStarted && (
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-amber-500/90 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                  <BsCalendarCheck className="text-[10px]" /> Sắp bắt đầu
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
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="bg-emerald-500/90 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 w-fit">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Đang diễn ra
                </span>
                
                {challenge.challenge_type === 'nutrition' && challenge.nutrition_sub_type === 'time_window' && challenge.time_window_start && challenge.time_window_end && (
                  (() => {
                    const now = new Date()
                    const currentHours = now.getHours()
                    const currentMinutes = now.getMinutes()
                    const [startH, startM] = challenge.time_window_start.split(':').map(Number)
                    const [endH, endM] = challenge.time_window_end.split(':').map(Number)
                    
                    const currentTimeVal = currentHours * 60 + currentMinutes
                    const startTimeVal = startH * 60 + startM
                    const endTimeVal = endH * 60 + endM
                    
                    const isInWindow = currentTimeVal >= startTimeVal && currentTimeVal <= endTimeVal
                    
                    return (
                      <span className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 w-fit shadow-lg ${isInWindow ? 'bg-emerald-500/90 text-white border border-emerald-400' : 'bg-gray-800/80 text-white border border-gray-600'}`}>
                         <FaClock size={10} />
                         {isInWindow 
                            ? `🟢 Đang mở check-in (${challenge.time_window_start} - ${challenge.time_window_end})` 
                            : `🔴 Đã đóng / Chưa tới giờ (${challenge.time_window_start} - ${challenge.time_window_end})`}
                      </span>
                    )
                  })()
                )}
              </div>
            )}
            {isExpired && (
              <div className="mb-3">
                <span className="bg-gray-600/80 text-gray-300 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 w-fit">
                  <BsClockHistory className="text-[10px]" /> Đã kết thúc
                </span>
              </div>
            )}

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{challenge.title}</h1>

            {/* Info row */}
            <div className="flex flex-wrap items-center gap-6 text-sm md:text-base">
              <div className="flex items-center gap-2">
                <FaCalendarAlt />
                <span>{startDate.format('DD/MM/YYYY')} - {endDate.format('DD/MM/YYYY')}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaFire />
                <span>Mỗi ngày: {challenge.goal_value} {challenge.goal_unit}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaUsers />
                <span>{challenge.participants_count} người tham gia</span>
              </div>
              {!isExpired && daysLeft > 0 && (
                <div className="flex items-center gap-2">
                  <FaClock />
                  <span>Còn {daysLeft} ngày</span>
                </div>
              )}
            </div>

            {/* Action Buttons — Join / Leave / Share */}
            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              {!challenge.isJoined ? (
                isExpired ? (
                  <button className="px-5 py-2.5 bg-white/10 text-white/60 border border-white/20 rounded-lg font-semibold text-sm flex items-center gap-2 cursor-default">
                    Thử thách đã kết thúc
                  </button>
                ) : !mayJoinByVisibility ? (
                  <div className="flex flex-col gap-1.5 max-w-md">
                    <button
                      type="button"
                      disabled
                      className="px-5 py-2.5 bg-white/10 text-white/50 border border-white/20 rounded-lg font-semibold text-sm cursor-not-allowed flex items-center gap-2"
                    >
                      <FaLock className="text-xs" />
                      {(challenge.visibility || 'public') === 'friends'
                        ? 'Chỉ bạn bè của người tạo mới tham gia được'
                        : 'Thử thách riêng tư — không mở tham gia qua liên kết'}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => joinMutation.mutate()}
                      disabled={joinMutation.isPending}
                      className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold text-sm transition shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {joinMutation.isPending ? <AiOutlineLoading3Quarters className="animate-spin" /> : <FaPlus className="text-xs" />}
                      {challenge.hasPreviouslyQuit ? 'Tham gia lại' : 'Tham gia ngay'}
                    </button>
                    {challenge.hasPreviouslyQuit && (
                      <p className="text-xs text-yellow-300/80 flex items-center gap-1">
                        ⚠️ Bạn đã rời thử thách này trước đó. Tham gia lại sẽ bắt đầu từ đầu.
                      </p>
                    )}
                  </div>
                )
              ) : (
                <>
                  <div className="px-5 py-2.5 bg-green-500/20 text-green-300 border border-green-400/30 rounded-lg font-semibold text-sm flex items-center gap-2 cursor-default backdrop-blur-sm">
                    <MdCheckCircle className="text-base" /> Đã tham gia
                  </div>
                  {canShowInviteFriends && (
                    <button
                      onClick={() => setShowInviteModal(true)}
                      className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg font-semibold text-sm transition backdrop-blur-sm flex items-center gap-2"
                    >
                      <FaInvite className="text-sm" />
                      Mời bạn bè
                    </button>
                  )}
                  <button
                    onClick={() => setShowLeaveModal(true)}
                    disabled={quitMutation.isPending}
                    className="px-5 py-2.5 bg-white/10 hover:bg-red-500/30 text-white/80 hover:text-red-300 border border-white/20 hover:border-red-400/40 rounded-lg font-semibold text-sm transition backdrop-blur-sm flex items-center gap-2"
                  >
                    {quitMutation.isPending ? <AiOutlineLoading3Quarters className="animate-spin" /> : <FaTimes className="text-sm" />}
                    Rời khỏi
                  </button>
                </>
              )}
              {/* Share button — always visible */}
              <button
                onClick={() => setShowShareModal(true)}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/40 rounded-lg font-semibold text-sm transition backdrop-blur-sm flex items-center gap-2"
              >
                <FaShare className="text-sm" /> Chia sẻ
              </button>
              {me?._id && !isCreator && (
                <button
                  type="button"
                  onClick={() => setShowReportModal(true)}
                  className="px-5 py-2.5 bg-white/10 hover:bg-amber-500/20 text-white/80 hover:text-amber-200 border border-white/20 rounded-lg font-semibold text-sm transition backdrop-blur-sm flex items-center gap-2"
                >
                  <FaFlag className="text-sm" />
                  Báo cáo
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation — Sticky matching SportEventDetail */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="container mx-auto max-w-6xl">
          <div className="flex">
            {[
              { id: 'details', label: 'Chi tiết', icon: <FaCalendarAlt /> },
              ...(challenge?.isJoined ? [{ id: 'progress', label: 'Tiến độ cá nhân', icon: <FaMedal /> }] : []),
              { id: 'participants', label: 'Người tham gia', icon: <FaUsers /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-semibold transition whitespace-nowrap text-base ${activeTab === tab.id
                  ? 'text-orange-500 border-b-2 border-orange-500 bg-orange-50 dark:bg-orange-900/10'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/40'
                  }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="container mx-auto max-w-6xl p-6">
        {/* DETAILS TAB — matching SportEventDetail */}
        {activeTab === 'details' && (
          <div className="space-y-8">
            {/* About */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Về thử thách này</h2>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                {challenge.description || 'Không có mô tả cho thử thách này.'}
              </p>
            </div>

            {/* How to check-in */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-3 text-gray-800 dark:text-white flex items-center gap-2">
                📋 Cách ghi nhận tiến độ
              </h2>
              {challenge.challenge_type === 'nutrition' && (
                <div className="flex items-start gap-3 text-gray-600 dark:text-gray-300 p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                  <span className="text-3xl">📸</span>
                  <div>
                    <p className="font-semibold text-emerald-700 dark:text-emerald-400 mb-1">Chụp ảnh bữa ăn</p>
                    <p className="text-sm">Chuyển sang tab "Tiến độ cá nhân", nhấn vào ngày hôm nay trên lịch. Chọn loại bữa (Sáng/Trưa/Tối/Phụ), chụp ảnh và ghi chú năng lượng.</p>
                  </div>
                </div>
              )}
              {challenge.challenge_type === 'outdoor_activity' && (
                <div className="flex items-start gap-3 text-gray-600 dark:text-gray-300 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <span className="text-3xl">🏃</span>
                  <div>
                    <p className="font-semibold text-blue-700 dark:text-blue-400 mb-1">Ghi nhận khoảng cách</p>
                    <p className="text-sm">Chuyển sang tab "Tiến độ cá nhân", nhấn vào ngày hôm nay trên lịch. Nhập km đã {challenge.category || 'chạy/đi bộ/đạp xe'}, thời gian và calo tiêu hao.</p>
                  </div>
                </div>
              )}
              {challenge.challenge_type === 'fitness' && (
                <div className="flex items-start gap-3 text-gray-600 dark:text-gray-300 p-4 bg-pink-50 dark:bg-pink-900/10 border border-pink-200 dark:border-pink-800 rounded-lg">
                  <span className="text-3xl">💪</span>
                  <div>
                    <p className="font-semibold text-pink-700 dark:text-pink-400 mb-1">Thể dục & ghi nhận tiến độ</p>
                    <p className="text-sm">Chuyển sang tab "Tiến độ cá nhân", nhấn vào ngày hôm nay trên lịch. Nhấn "Bắt đầu tập" để thực hiện các bài đã chọn. Đánh dấu hoàn thành các bài tập để tự động ghi nhận vào tiến độ của ngày.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Exercises List — Fitness challenges only */}
            {challenge.challenge_type === 'fitness' && challenge.exercises?.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
                  🏋️ Danh sách bài tập ({challenge.exercises.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {challenge.exercises.map((ex, idx) => (
                    <div key={ex.exercise_id || idx} className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-100 dark:border-purple-800/50">
                      <div className="w-8 h-8 rounded-lg bg-purple-500 text-white text-sm font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm truncate">{ex.exercise_name}</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          {ex.sets?.length || 1} hiệp • {ex.sets?.[0]?.reps || 10} lần lặp
                          {ex.sets?.[0]?.weight > 0 && ` • ${ex.sets[0].weight}kg`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info Grid — 3 columns matching SportEventDetail */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Time */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <FaCalendarAlt className="text-orange-500 text-2xl shrink-0" />
                  <h3 className="font-semibold text-gray-800 dark:text-white">Thời gian</h3>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 px-2.5 py-1 rounded-lg text-sm font-bold">
                    <BsClockHistory className="text-xs" />
                    {startDate.format('DD/MM/YYYY')}
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">→</span>
                  <span className="text-gray-600 dark:text-gray-300 text-sm font-semibold">
                    {endDate.format('DD/MM/YYYY')}
                  </span>
                </div>
                {!isExpired && daysLeft > 0 && (
                  <p className="text-xs text-gray-400 mt-2">Còn {daysLeft} ngày</p>
                )}
              </div>

              {/* Goal */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <FaTrophy className="text-yellow-500 text-2xl shrink-0" />
                  <h3 className="font-semibold text-gray-800 dark:text-white">Mục tiêu</h3>
                </div>
                <div className="flex items-end gap-2">
                  <p className="text-3xl font-black text-gray-900 dark:text-white">{challenge.goal_value}</p>
                  <p className="text-gray-500 dark:text-gray-400 font-bold mb-1 uppercase">{challenge.goal_unit}</p>
                </div>
              </div>

              {/* Participants */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <FaUsers className="text-blue-500 text-2xl shrink-0" />
                  <h3 className="font-semibold text-gray-800 dark:text-white">Tham gia</h3>
                </div>
                <div className="flex items-end gap-2">
                  <p className="text-3xl font-black text-gray-900 dark:text-white">{challenge.participants_count}</p>
                  <p className="text-gray-500 dark:text-gray-400 font-bold mb-1">người</p>
                </div>
              </div>
            </div>

            {/* My progress summary if joined */}
            {challenge.isJoined && participation && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
                  <FaMedal className="text-orange-500" /> Tiến độ cá nhân
                </h2>
                <div className="flex items-center gap-4 mb-4">
                  {/* Progress Ring */}
                  <div className="relative w-20 h-20">
                    <svg viewBox="0 0 36 36" className="w-20 h-20 transform -rotate-90">
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none" stroke="#e5e7eb" strokeWidth="3" />
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none" stroke="url(#progressGrad)" strokeWidth="3"
                        strokeDasharray={`${progress}, 100`} strokeLinecap="round" />
                      <defs>
                        <linearGradient id="progressGrad"><stop offset="0%" stopColor="#f97316" /><stop offset="100%" stopColor="#ef4444" /></linearGradient>
                      </defs>
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-gray-800 dark:text-white">{progress}%</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Số ngày đạt</p>
                    <p className="text-2xl font-black text-gray-800 dark:text-white">{participation.current_value} / {totalRequiredDays} <span className="text-sm text-gray-400">ngày</span></p>
                    {participation.streak_count > 0 && (
                      <p className="text-sm text-orange-500 font-medium mt-1">🔥 Streak: {participation.streak_count} ngày liên tiếp</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PROGRESS TAB — Calendar MonthView, click day = open DayChallengeModal */}
        {activeTab === 'progress' && (
          challenge.isJoined ? (
            <ChallengeCalendar
              challenge={challenge}
              progressEntries={progressList}
              onDayClick={handleDayClick}
            />
          ) : (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
              <FaCalendarAlt className="text-4xl text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Tham gia thử thách để xem tiến độ</p>
              {mayJoinByVisibility ? (
                <button
                  type="button"
                  onClick={() => joinMutation.mutate()}
                  disabled={joinMutation.isPending}
                  className="mt-4 px-6 py-2 rounded-xl bg-orange-500 text-white font-medium text-sm hover:bg-orange-600 transition disabled:opacity-50"
                >
                  {joinMutation.isPending ? 'Đang xử lý…' : 'Tham gia ngay'}
                </button>
              ) : (
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                  {(challenge.visibility || 'public') === 'friends'
                    ? 'Chỉ bạn bè của người tạo mới có thể tham gia.'
                    : 'Thử thách riêng tư — không mở tham gia qua liên kết.'}
                </p>
              )}
            </div>
          )
        )}

        {/* PARTICIPANTS TAB */}
        {activeTab === 'participants' && (
          <ChallengeParticipants
            participants={participantsList}
            isLoading={participantsLoading}
            challenge={challenge}
            challengeType={challenge.challenge_type}
            goalUnit={challenge.goal_unit}
            onViewProgress={(p) => setSelectedParticipant(p)}
            friendIds={friendIds}
            connectedIds={connectedIds}
            creatorId={String(challenge.creator_id?._id || challenge.creator_id || '')}
            currentUserId={me?._id}
          />
        )}
      </div>

      {/* DayChallengeModal — daily progress + action buttons */}
      {selectedDay && (
        <DayChallengeModal
          challenge={challenge}
          dateStr={selectedDay.dateStr}
          dayEntries={progressByDate[selectedDay.dateStr]?.entries || []}
          dayTotal={progressByDate[selectedDay.dateStr]?.total || 0}
          onClose={() => { setSelectedDay(null); setShowSubModal(null) }}
          onStartTracking={handleStartTracking}
          onRefresh={() => {
            queryClient.invalidateQueries({ queryKey: ['challenge', id] })
            queryClient.invalidateQueries({ queryKey: ['challenge-progress', id] })
          }}
        />
      )}

      {/* Sub-modal: type-specific tracking/manual input */}
      {renderSubModal()}

      {/* Share Challenge Modal */}
      {showShareModal && (
        <ChallengeShareModal
          challenge={challenge}
          challengeId={id}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* Participant Progress Modal */}
      {/* ==================== INVITE FRIENDS MODAL ==================== */}
      {
        showInviteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[80vh]">
              {/* Modal Header */}
              <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-700">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <FaBell className="text-orange-500" />
                    Mời bạn bè tham gia
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Bạn bè sẽ nhận được thông báo về thử thách này
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
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-orange-500 outline-none"
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
                    const alreadyJoined = participantsList.some(p => {
                      const pid = p.user?._id || p._id
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
                            className="w-11 h-11 rounded-full object-cover border-2 border-orange-400"
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
                            <span className="text-xs px-3 py-1.5 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 rounded-full font-medium flex items-center gap-1">
                              <FaCheck size={10} /> Đã mời
                            </span>
                          ) : (
                            <button
                              onClick={() => inviteFriendMutation.mutate(friend._id)}
                              disabled={inviteFriendMutation.isPending}
                              className="text-xs px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-full font-medium transition flex items-center gap-1 disabled:opacity-50"
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
            </div>
          </div>
        )
      }

      {selectedParticipant && (
        <ParticipantProgressModal
          participant={selectedParticipant}
          challenge={challenge}
          onClose={() => setSelectedParticipant(null)}
        />
      )}
    </div>
  )
}
