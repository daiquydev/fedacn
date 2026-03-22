import { useSafeMutation } from '../../hooks/useSafeMutation'
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  FaFire, FaArrowLeft, FaCamera, FaUsers, FaCalendarCheck, FaHeart, FaRegHeart,
  FaSignOutAlt, FaUserFriends, FaTrophy, FaSnowflake, FaStar, FaInfoCircle
} from 'react-icons/fa'
import toast from 'react-hot-toast'
import moment from 'moment'
import {
  getHabitChallenge, joinHabitChallenge, quitHabitChallenge,
  checkin, getCheckins, getCheckinFeed, likeCheckin, getParticipants,
  useStreakFreeze, getLeaderboard
} from '../../apis/habitChallengeApi'
import CloudinaryImageUploader from '../../components/GlobalComponents/CloudinaryImageUploader/CloudinaryImageUploader'
import BuddySelector from './components/BuddySelector'
import BadgeDisplay from './components/BadgeDisplay'
import defaultAvatar from '../../assets/images/useravatar.jpg'

const CATEGORY_MAP = {
  exercise: { label: 'Tập luyện', emoji: '💪' },
  nutrition: { label: 'Dinh dưỡng', emoji: '🥗' },
  sleep: { label: 'Giấc ngủ', emoji: '😴' },
  mental: { label: 'Tinh thần', emoji: '🧘' },
  hydration: { label: 'Uống nước', emoji: '💧' },
  other: { label: 'Khác', emoji: '✨' }
}

const DIFFICULTY_CONFIG = {
  easy: { label: 'Nhẹ nhàng', emoji: '🌿', color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400' },
  medium: { label: 'Trung bình', emoji: '⚡', color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400' },
  hard: { label: 'Thử thách', emoji: '🔥', color: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400' }
}

const TYPE_CONFIG = {
  solo: { label: 'Cá nhân', emoji: '🧑' },
  team: { label: 'Đội nhóm', emoji: '👥' },
  global: { label: 'Cộng đồng', emoji: '🌍' }
}

const FREQUENCY_LABELS = {
  daily: 'Hàng ngày',
  weekly_3: '3 lần/tuần',
  weekly_5: '5 lần/tuần',
  free: 'Tự do'
}

const COMPLETION_LABELS = {
  streak: 'Streak liên tục',
  percentage: 'Theo % hoàn thành',
  total: 'Tổng lượt check-in'
}

export default function HabitChallengeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('progress')
  const [checkinImage, setCheckinImage] = useState('')
  const [checkinNote, setCheckinNote] = useState('')
  const [showBuddyModal, setShowBuddyModal] = useState(false)
  const [leaderboardSort, setLeaderboardSort] = useState('xp')

  const { data: challengeData, isLoading } = useQuery({
    queryKey: ['habit-challenge', id],
    queryFn: () => getHabitChallenge(id)
  })

  const { data: checkinsData } = useQuery({
    queryKey: ['habit-checkins', id],
    queryFn: () => getCheckins(id, { limit: 90 }),
    enabled: activeTab === 'progress'
  })

  const { data: feedData } = useQuery({
    queryKey: ['habit-checkin-feed', id],
    queryFn: () => getCheckinFeed(id, { limit: 30 }),
    enabled: activeTab === 'feed'
  })

  const { data: leaderboardData } = useQuery({
    queryKey: ['habit-leaderboard', id, leaderboardSort],
    queryFn: () => getLeaderboard({ challengeId: id, sort_by: leaderboardSort, limit: 50 }),
    enabled: activeTab === 'leaderboard'
  })

  const { data: participantsData } = useQuery({
    queryKey: ['habit-participants', id],
    queryFn: () => getParticipants(id),
    enabled: activeTab === 'participants'
  })

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['habit-challenge', id] })
    queryClient.invalidateQueries({ queryKey: ['habit-checkins', id] })
    queryClient.invalidateQueries({ queryKey: ['habit-checkin-feed', id] })
    queryClient.invalidateQueries({ queryKey: ['my-habit-challenges'] })
    queryClient.invalidateQueries({ queryKey: ['habit-badges', id] })
    queryClient.invalidateQueries({ queryKey: ['challenge-profile'] })
    queryClient.invalidateQueries({ queryKey: ['habit-leaderboard', id] })
  }

  const joinMutation = useSafeMutation({
    mutationFn: () => joinHabitChallenge(id),
    onSuccess: () => { toast.success('Đã tham gia thử thách!'); invalidateAll() },
    onError: (err) => toast.error(err?.response?.data?.message || 'Lỗi')
  })

  const quitMutation = useSafeMutation({
    mutationFn: () => quitHabitChallenge(id),
    onSuccess: () => { toast.success('Đã rời thử thách'); invalidateAll() },
    onError: (err) => toast.error(err?.response?.data?.message || 'Lỗi')
  })

  const checkinMutation = useSafeMutation({
    mutationFn: () => checkin(id, { image_url: checkinImage, note: checkinNote }),
    onSuccess: (res) => {
      const r = res?.data?.result
      let msg = `✅ Check-in thành công! Streak: ${r?.current_streak || 1} 🔥 (+${r?.xp_earned || 0} XP)`
      if (r?.leveled_up) msg += ` 🎉 LÊN LEVEL ${r.new_level}! ${r.new_title}`
      if (r?.new_badges?.length) msg += ` 🏅 ${r.new_badges.length} huy hiệu mới!`
      toast.success(msg, { duration: 5000 })
      setCheckinImage('')
      setCheckinNote('')
      invalidateAll()
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Không thể check-in')
  })

  const freezeMutation = useSafeMutation({
    mutationFn: () => useStreakFreeze(id),
    onSuccess: (res) => {
      const r = res?.data?.result
      toast.success(`❄️ Đã đóng băng streak! Còn ${r?.remaining || 0} lượt`)
      invalidateAll()
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Không thể đóng băng')
  })

  const likeMutation = useSafeMutation({
    mutationFn: (checkinId) => likeCheckin(id, checkinId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['habit-checkin-feed', id] })
  })

  if (isLoading) {
    return (
      <div className='max-w-4xl mx-auto px-4 py-8'>
        <div className='animate-pulse space-y-4'>
          <div className='h-48 bg-gray-200 dark:bg-gray-700 rounded-2xl' />
          <div className='h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3' />
        </div>
      </div>
    )
  }

  const challenge = challengeData?.data?.result
  if (!challenge) {
    return (
      <div className='max-w-4xl mx-auto px-4 py-16 text-center'>
        <span className='text-5xl block mb-4'>❌</span>
        <h2 className='text-lg font-semibold text-gray-700 dark:text-gray-300'>Thử thách không tồn tại</h2>
        <button onClick={() => navigate('/habit-challenge')} className='mt-4 text-orange-500 font-medium'>
          ← Quay lại
        </button>
      </div>
    )
  }

  const participation = challenge.participation
  const isJoined = challenge.isJoined
  const cat = CATEGORY_MAP[challenge.category] || CATEGORY_MAP.other
  const diff = DIFFICULTY_CONFIG[challenge.difficulty] || DIFFICULTY_CONFIG.medium
  const type = TYPE_CONFIG[challenge.challenge_type] || TYPE_CONFIG.solo
  const rules = challenge.rules || {}
  const progress = participation ? Math.min(Math.round((participation.total_checkins / challenge.duration_days) * 100), 100) : 0

  const myCheckins = checkinsData?.data?.result?.checkins || []
  const feedCheckins = feedData?.data?.result?.checkins || []
  const leaderboard = leaderboardData?.data?.result?.leaderboard || []
  const participants = participantsData?.data?.result || []
  const checkinDates = new Set(myCheckins.map(c => moment(c.checkin_date).format('YYYY-MM-DD')))

  const freezeRemaining = participation
    ? participation.streak_freeze_available - participation.streak_freezes_used
    : 0

  return (
    <div className='max-w-4xl mx-auto px-4 py-6'>
      <button
        onClick={() => navigate('/habit-challenge')}
        className='flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-4 transition-colors'
      >
        <FaArrowLeft /> Quay lại
      </button>

      {/* Hero */}
      <div className='relative rounded-2xl overflow-hidden mb-6'>
        {challenge.image ? (
          <img src={challenge.image} alt={challenge.title} className='w-full h-52 object-cover' />
        ) : (
          <div className='w-full h-52 bg-gradient-to-br from-orange-400 via-red-400 to-pink-500 flex items-center justify-center'>
            <span className='text-7xl'>{cat.emoji}</span>
          </div>
        )}
        <div className='absolute inset-0 bg-gradient-to-t from-black/60 to-transparent' />
        <div className='absolute bottom-4 left-4 right-4'>
          <div className='flex items-center gap-2 mb-2'>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${diff.color}`}>
              {diff.emoji} {diff.label}
            </span>
            <span className='px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white backdrop-blur-sm'>
              {type.emoji} {type.label}
            </span>
            <span className='px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white backdrop-blur-sm'>
              {cat.emoji} {cat.label} • {challenge.duration_days} ngày
            </span>
          </div>
          <h1 className='text-2xl font-bold text-white'>{challenge.title}</h1>
        </div>
      </div>

      {/* Stats + Actions */}
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 flex-wrap'>
          <span className='flex items-center gap-1'>
            <FaUsers className='text-blue-500' /> {challenge.participants_count} người
          </span>
          {participation && (
            <>
              <span className='flex items-center gap-1'>
                <FaFire className='text-orange-500' />
                <span className='font-bold text-orange-500'>{participation.current_streak}</span> streak
              </span>
              <span className='flex items-center gap-1'>
                <FaCalendarCheck className='text-green-500' />
                {participation.total_checkins}/{challenge.duration_days} ngày
              </span>
              <span className='flex items-center gap-1 font-bold text-amber-500'>
                <FaStar className='text-amber-500' /> +{participation.xp_earned} XP
              </span>
            </>
          )}
        </div>

        <div className='flex items-center gap-2'>
          {/* Streak Freeze Button */}
          {isJoined && freezeRemaining > 0 && (
            <button
              onClick={() => freezeMutation.mutate()}
              disabled={freezeMutation.isPending}
              className='flex items-center gap-1 px-3 py-2 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors border border-blue-200 dark:border-blue-800'
              title={`${freezeRemaining} lượt freeze còn lại`}
            >
              <FaSnowflake /> ❄️ Freeze ({freezeRemaining})
            </button>
          )}

          {isJoined ? (
            <button
              onClick={() => quitMutation.mutate()}
              disabled={quitMutation.isPending}
              className='flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors'
            >
              <FaSignOutAlt /> Bỏ cuộc
            </button>
          ) : (
            <button
              onClick={() => joinMutation.mutate()}
              disabled={joinMutation.isPending}
              className='px-5 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all'
            >
              Tham gia
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {participation && (
        <div className='mb-6'>
          <div className='flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1'>
            <span>Tiến trình</span>
            <span>{progress}%</span>
          </div>
          <div className='w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5'>
            <div
              className='h-2.5 rounded-full bg-gradient-to-r from-orange-400 to-red-500 transition-all duration-700'
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Rules Summary Card */}
      <div className='mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700'>
        <h3 className='flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3'>
          <FaInfoCircle className='text-blue-500' /> Luật chơi
        </h3>
        <div className='grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs'>
          <div className='p-2 bg-white dark:bg-gray-700 rounded-lg'>
            <p className='text-gray-400 mb-0.5'>Tần suất</p>
            <p className='font-medium text-gray-700 dark:text-gray-200'>{FREQUENCY_LABELS[rules.checkin_frequency] || 'Hàng ngày'}</p>
          </div>
          <div className='p-2 bg-white dark:bg-gray-700 rounded-lg'>
            <p className='text-gray-400 mb-0.5'>Hoàn thành</p>
            <p className='font-medium text-gray-700 dark:text-gray-200'>{COMPLETION_LABELS[rules.completion_type] || '%'}</p>
          </div>
          <div className='p-2 bg-white dark:bg-gray-700 rounded-lg'>
            <p className='text-gray-400 mb-0.5'>Streak Freeze</p>
            <p className='font-medium text-gray-700 dark:text-gray-200'>❄️ {rules.streak_freeze_allowed ?? 1} lượt</p>
          </div>
          <div className='p-2 bg-white dark:bg-gray-700 rounded-lg'>
            <p className='text-gray-400 mb-0.5'>Yêu cầu ảnh</p>
            <p className='font-medium text-gray-700 dark:text-gray-200'>{rules.require_image ? '📸 Có' : '❌ Không'}</p>
          </div>
          <div className='p-2 bg-white dark:bg-gray-700 rounded-lg'>
            <p className='text-gray-400 mb-0.5'>Yêu cầu ghi chú</p>
            <p className='font-medium text-gray-700 dark:text-gray-200'>{rules.require_note ? '📝 Có' : '❌ Không'}</p>
          </div>
          {rules.grace_period_hours > 0 && (
            <div className='p-2 bg-white dark:bg-gray-700 rounded-lg'>
              <p className='text-gray-400 mb-0.5'>Gia hạn</p>
              <p className='font-medium text-gray-700 dark:text-gray-200'>⏰ {rules.grace_period_hours}h</p>
            </div>
          )}
        </div>
      </div>

      {/* Buddy Card */}
      {isJoined && (
        <div className='mb-6 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center'>
                <FaUserFriends className='text-blue-500' size={16} />
              </div>
              {participation?.buddy_id ? (
                <div>
                  <p className='text-xs text-gray-400 mb-0.5'>Accountability Buddy</p>
                  <div className='flex items-center gap-2'>
                    <img
                      src={participation.buddy_id.avatar?.url || participation.buddy_id.avatar || defaultAvatar}
                      alt=''
                      className='w-6 h-6 rounded-full object-cover'
                      onError={(e) => { e.target.src = defaultAvatar }}
                    />
                    <span className='text-sm font-semibold text-gray-700 dark:text-gray-200'>
                      {participation.buddy_id.name || 'Buddy'}
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <p className='text-xs text-gray-400 mb-0.5'>Accountability Buddy</p>
                  <p className='text-sm text-gray-500 dark:text-gray-400'>Chưa chọn buddy</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowBuddyModal(true)}
              className='px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors'
            >
              {participation?.buddy_id ? 'Đổi' : '+ Chọn'}
            </button>
          </div>
        </div>
      )}

      {/* Description */}
      {challenge.description && (
        <div className='mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm text-gray-600 dark:text-gray-300'>
          {challenge.description}
        </div>
      )}

      {/* Tabs */}
      <div className='flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-6 overflow-x-auto'>
        {[
          { key: 'progress', label: 'Tiến trình', icon: '📅' },
          { key: 'checkin', label: 'Check-in', icon: '📸', show: isJoined },
          { key: 'feed', label: 'Feed', icon: '🔥' },
          { key: 'leaderboard', label: 'Xếp hạng', icon: '🏆' },
          { key: 'participants', label: 'Thành viên', icon: '👥' }
        ].filter(t => t.show !== false).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.key
              ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* === PROGRESS TAB === */}
      {activeTab === 'progress' && (
        <div>
          <div className='bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700'>
            <h3 className='font-semibold text-gray-700 dark:text-gray-200 mb-4'>Lịch check-in</h3>
            {participation ? (
              <div className='grid grid-cols-7 gap-2'>
                {Array.from({ length: challenge.duration_days }, (_, i) => {
                  const day = moment(participation.start_date).add(i, 'days')
                  const dateStr = day.format('YYYY-MM-DD')
                  const isChecked = checkinDates.has(dateStr)
                  const isToday = day.isSame(moment(), 'day')
                  const isFuture = day.isAfter(moment(), 'day')

                  return (
                    <div
                      key={i}
                      className={`relative aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-all ${isChecked
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 ring-1 ring-green-300 dark:ring-green-700'
                        : isToday
                          ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 ring-2 ring-orange-400'
                          : isFuture
                            ? 'bg-gray-50 dark:bg-gray-700/50 text-gray-400'
                            : 'bg-red-50 dark:bg-red-900/20 text-red-400'
                      }`}
                    >
                      <span className='text-[10px] opacity-70'>{day.format('DD/MM')}</span>
                      <span className='text-sm'>{isChecked ? '✅' : isFuture ? '⬜' : isToday ? '📌' : '❌'}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className='text-sm text-gray-500 text-center py-8'>Tham gia thử thách để xem lịch check-in</p>
            )}
          </div>
          {isJoined && <BadgeDisplay challengeId={id} />}
        </div>
      )}

      {/* === CHECK-IN TAB === */}
      {activeTab === 'checkin' && isJoined && (
        <div className='bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700'>
          <h3 className='font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2'>
            <FaCamera className='text-orange-500' /> Check-in hôm nay
          </h3>

          {rules.require_image !== false && (
            <div className='mb-4'>
              <label className='block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2'>
                Ảnh bằng chứng {rules.require_image && <span className='text-red-500'>*</span>}
              </label>
              {checkinImage ? (
                <div className='relative'>
                  <img src={checkinImage} alt='Check-in' className='w-full max-h-64 object-cover rounded-xl' />
                  <button
                    onClick={() => setCheckinImage('')}
                    className='absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600'
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <CloudinaryImageUploader onChange={(url) => setCheckinImage(url)} folder='habit-checkins' />
              )}
            </div>
          )}

          <div className='mb-4'>
            <label className='block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2'>
              Ghi chú {rules.require_note ? <span className='text-red-500'>*</span> : '(tùy chọn)'}
            </label>
            <textarea
              value={checkinNote}
              onChange={(e) => setCheckinNote(e.target.value)}
              placeholder='Hôm nay tôi đã...'
              rows={3}
              className='w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 dark:text-white resize-none'
            />
          </div>

          <button
            onClick={() => checkinMutation.mutate()}
            disabled={
              (rules.require_image !== false && !checkinImage) ||
              (rules.require_note && !checkinNote?.trim()) ||
              checkinMutation.isPending
            }
            className='w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
          >
            {checkinMutation.isPending ? (
              <span className='animate-spin'>⏳</span>
            ) : (
              <>🔥 Check-in ngay (+10 XP)</>
            )}
          </button>
        </div>
      )}

      {/* === FEED TAB === */}
      {activeTab === 'feed' && (
        <div className='space-y-4'>
          {feedCheckins.length === 0 ? (
            <div className='text-center py-12'>
              <span className='text-4xl block mb-3'>📷</span>
              <p className='text-gray-500 dark:text-gray-400'>Chưa có check-in nào</p>
            </div>
          ) : (
            feedCheckins.map(item => (
              <div key={item._id} className='bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden'>
                <div className='flex items-center gap-3 p-4 pb-2'>
                  <img
                    src={item.user_id?.avatar?.url || defaultAvatar}
                    alt=''
                    className='w-9 h-9 rounded-full object-cover'
                    onError={(e) => { e.target.src = defaultAvatar }}
                  />
                  <div>
                    <p className='text-sm font-semibold text-gray-700 dark:text-gray-200'>
                      {item.user_id?.name || 'Người dùng'}
                    </p>
                    <p className='text-xs text-gray-400'>
                      Ngày {item.day_number} • {moment(item.createdAt).fromNow()}
                    </p>
                  </div>
                </div>

                {item.image_url && (
                  <img src={item.image_url} alt='Check-in' className='w-full max-h-80 object-cover' />
                )}

                <div className='p-4'>
                  {item.note && <p className='text-sm text-gray-600 dark:text-gray-300 mb-3'>{item.note}</p>}
                  <button
                    onClick={() => likeMutation.mutate(item._id)}
                    className='flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors'
                  >
                    {item.likes?.length > 0 ? (
                      <FaHeart className='text-red-500' size={16} />
                    ) : (
                      <FaRegHeart size={16} />
                    )}
                    <span>{item.likes?.length || 0}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* === LEADERBOARD TAB === */}
      {activeTab === 'leaderboard' && (
        <div className='bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700'>
          <div className='p-4 border-b border-gray-100 dark:border-gray-700'>
            <div className='flex items-center justify-between'>
              <h3 className='font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2'>
                <FaTrophy className='text-amber-500' /> Bảng xếp hạng
              </h3>
              <div className='flex gap-1'>
                {[
                  { value: 'xp', label: 'XP' },
                  { value: 'streak', label: 'Streak' },
                  { value: 'checkins', label: 'Check-in' },
                  { value: 'completion', label: '% HT' }
                ].map(s => (
                  <button
                    key={s.value}
                    onClick={() => setLeaderboardSort(s.value)}
                    className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${leaderboardSort === s.value
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {leaderboard.length === 0 ? (
            <div className='text-center py-12'>
              <span className='text-4xl block mb-3'>🏆</span>
              <p className='text-gray-500 dark:text-gray-400'>Chưa có dữ liệu xếp hạng</p>
            </div>
          ) : (
            <div className='divide-y divide-gray-100 dark:divide-gray-700'>
              {leaderboard.map((entry, index) => {
                const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : ''
                return (
                  <div key={index} className={`flex items-center gap-3 p-4 ${index < 3 ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}`}>
                    <div className='w-8 text-center'>
                      {rankEmoji ? (
                        <span className='text-lg'>{rankEmoji}</span>
                      ) : (
                        <span className='text-xs font-bold text-gray-400'>#{entry.rank}</span>
                      )}
                    </div>
                    <img
                      src={entry.user?.avatar?.url || defaultAvatar}
                      alt=''
                      className='w-9 h-9 rounded-full object-cover'
                      onError={(e) => { e.target.src = defaultAvatar }}
                    />
                    <div className='flex-1'>
                      <p className='text-sm font-semibold text-gray-700 dark:text-gray-200'>
                        {entry.user?.name || 'Người dùng'}
                      </p>
                      <div className='flex items-center gap-2 text-[10px] text-gray-400'>
                        <span>🔥 {entry.current_streak} streak</span>
                        <span>📅 {entry.total_checkins} check-in</span>
                        <span>{entry.completion_percentage}% HT</span>
                      </div>
                    </div>
                    <div className='text-right'>
                      <p className='text-sm font-bold text-amber-500'>+{entry.xp_earned} XP</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* === PARTICIPANTS TAB === */}
      {activeTab === 'participants' && (
        <div className='bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700'>
          {participants.length === 0 ? (
            <div className='text-center py-12'>
              <span className='text-4xl block mb-3'>👥</span>
              <p className='text-gray-500 dark:text-gray-400'>Chưa có ai tham gia</p>
            </div>
          ) : (
            participants.map(p => (
              <div key={p._id} className='flex items-center gap-3 p-4'>
                <img
                  src={p.user_id?.avatar?.url || defaultAvatar}
                  alt=''
                  className='w-10 h-10 rounded-full object-cover'
                  onError={(e) => { e.target.src = defaultAvatar }}
                />
                <div className='flex-1'>
                  <p className='text-sm font-semibold text-gray-700 dark:text-gray-200'>
                    {p.user_id?.name || 'Người dùng'}
                  </p>
                  <div className='flex items-center gap-2 text-xs text-gray-400'>
                    <span className='flex items-center gap-0.5'>
                      <FaFire className='text-orange-500' size={10} /> {p.current_streak} streak
                    </span>
                    <span>•</span>
                    <span>{p.total_checkins} check-in</span>
                    <span>•</span>
                    <span className='text-amber-500 font-bold'>{p.xp_earned} XP</span>
                    {p.buddy_id && (
                      <>
                        <span>•</span>
                        <span className='flex items-center gap-0.5 text-blue-500'>
                          <FaUserFriends size={10} /> Buddy
                        </span>
                      </>
                    )}
                  </div>
                </div>
                {p.status === 'completed' && (
                  <span className='text-xs font-semibold text-green-500'>🎉 HT</span>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Buddy Selector Modal */}
      {showBuddyModal && (
        <BuddySelector
          challengeId={id}
          currentBuddyId={participation?.buddy_id?._id || participation?.buddy_id}
          onClose={() => setShowBuddyModal(false)}
        />
      )}
    </div>
  )
}
