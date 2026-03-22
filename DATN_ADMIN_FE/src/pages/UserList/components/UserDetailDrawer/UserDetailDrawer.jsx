import { useQuery } from '@tanstack/react-query'
import { getUserAdminById } from '../../../../apis/adminApi'
import useravatar from '../../../../assets/images/useravatar.jpg'
import { useEffect } from 'react'
import {
  FaTimes, FaFileAlt, FaRunning, FaDumbbell,
  FaUsers, FaHeart, FaFire, FaCheck, FaExclamationTriangle, FaMoon,
  FaCalendarAlt, FaEnvelope
} from 'react-icons/fa'

const ACTIVITY_CONFIG = {
  very_active: { label: 'Rất tích cực', emoji: '🔥', color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30', border: 'border-orange-400', icon: FaFire },
  active: { label: 'Tích cực', emoji: '✅', color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30', border: 'border-emerald-400', icon: FaCheck },
  low_activity: { label: 'Ít tích cực', emoji: '⚠️', color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30', border: 'border-amber-400', icon: FaExclamationTriangle },
  inactive: { label: 'Không hoạt động', emoji: '💤', color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-800', border: 'border-gray-400', icon: FaMoon }
}

function MetricCard({ icon: Icon, label, value, subtitle, iconBg }) {
  return (
    <div className='bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow'>
      <div className='flex items-center gap-3 mb-2'>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className='text-white text-sm' />
        </div>
        <span className='text-xs text-gray-400 dark:text-gray-500 font-medium'>{label}</span>
      </div>
      <p className='text-2xl font-black text-gray-800 dark:text-white'>{(value ?? 0).toLocaleString('vi-VN')}</p>
      {subtitle && <p className='text-xs text-gray-400 mt-0.5'>{subtitle}</p>}
    </div>
  )
}

export default function UserDetailDrawer({ userId, onClose }) {
  const { data, isLoading } = useQuery({
    queryKey: ['user-detail', userId],
    queryFn: () => getUserAdminById(userId),
    enabled: !!userId
  })

  const user = data?.data?.result?.[0]

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const activityCfg = ACTIVITY_CONFIG[user?.activity_level] || ACTIVITY_CONFIG.inactive

  return (
    <>
      {/* Backdrop */}
      <div
        className='fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] transition-opacity'
        onClick={onClose}
      />

      {/* Drawer */}
      <div className='fixed right-0 top-0 h-full w-full max-w-md bg-gray-50 dark:bg-gray-900 shadow-2xl z-[70] overflow-y-auto animate-slide-in-right'>

        {/* Close button */}
        <button
          onClick={onClose}
          className='absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-200 dark:hover:bg-slate-700 dark:hover:text-white transition-colors z-10'
          title='Đóng'
        >
          <FaTimes size={18} />
        </button>

        {isLoading ? (
          <div className='flex items-center justify-center h-full'>
            <div className='flex flex-col items-center gap-3'>
              <div className='w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin' />
              <span className='text-sm text-gray-400'>Đang tải thông tin...</span>
            </div>
          </div>
        ) : !user ? (
          <div className='flex items-center justify-center h-full'>
            <p className='text-gray-400'>Không tìm thấy người dùng</p>
          </div>
        ) : (
          <>
            {/* Profile Header */}
            <div className='relative bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-500 px-6 pt-8 pb-16'>
              <div className='absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/10' />
              <div className='absolute left-10 -bottom-4 w-20 h-20 rounded-full bg-white/10' />
            </div>

            <div className='px-6 -mt-12 relative z-10'>
              {/* Avatar + Name */}
              <div className='flex items-end gap-4 mb-4'>
                <img
                  src={user.avatar || useravatar}
                  alt={user.name}
                  className='w-20 h-20 rounded-2xl object-cover ring-4 ring-white dark:ring-gray-900 shadow-lg'
                />
                <div className='pb-1'>
                  <h2 className='text-xl font-black text-gray-800 dark:text-white leading-tight'>{user.name}</h2>
                  <p className='text-sm text-gray-400'>@{user.user_name}</p>
                </div>
              </div>

              {/* Info chips */}
              <div className='flex flex-wrap gap-2 mb-5'>
                <div className='flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-800 rounded-lg px-3 py-1.5 border border-gray-100 dark:border-slate-700'>
                  <FaEnvelope size={10} />
                  {user.email}
                </div>
                <div className='flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-800 rounded-lg px-3 py-1.5 border border-gray-100 dark:border-slate-700'>
                  <FaCalendarAlt size={10} />
                  Tham gia {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                </div>
              </div>

              {/* Activity Score */}
              <div className={`rounded-2xl p-5 mb-5 border-2 ${activityCfg.border} ${activityCfg.bg}`}>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-xs text-gray-500 dark:text-gray-400 font-medium mb-1'>Điểm hoạt động</p>
                    <div className='flex items-baseline gap-2'>
                      <span className={`text-4xl font-black ${activityCfg.color}`}>
                        {Math.round(user.activity_score ?? 0)}
                      </span>
                      <span className='text-sm text-gray-400'>điểm</span>
                    </div>
                  </div>
                  <div className='text-right'>
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold ${activityCfg.color} ${activityCfg.bg}`}>
                      {activityCfg.emoji} {activityCfg.label}
                    </div>
                    <p className='text-[10px] text-gray-400 mt-1'>
                      Bài viết×3 + Sự kiện×5 + Workout×2 + Follow×1 + Like×0.5
                    </p>
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className='mb-6'>
                <h3 className='text-sm font-bold text-gray-700 dark:text-gray-300 mb-3'>Chi tiết hoạt động</h3>
                <div className='grid grid-cols-2 gap-3'>
                  <MetricCard
                    icon={FaFileAlt}
                    label='Bài viết'
                    value={user.posts_count}
                    iconBg='bg-gradient-to-br from-blue-400 to-blue-600'
                  />
                  <MetricCard
                    icon={FaRunning}
                    label='Sự kiện tham gia'
                    value={user.events_attended}
                    iconBg='bg-gradient-to-br from-emerald-400 to-green-600'
                  />
                  <MetricCard
                    icon={FaDumbbell}
                    label='Buổi tập'
                    value={user.workouts_completed}
                    subtitle={`${(user.total_workout_kcal ?? 0).toLocaleString('vi-VN')} kcal đốt`}
                    iconBg='bg-gradient-to-br from-orange-400 to-red-500'
                  />
                  <MetricCard
                    icon={FaUsers}
                    label='Người theo dõi'
                    value={user.followers_count}
                    iconBg='bg-gradient-to-br from-cyan-400 to-teal-500'
                  />
                  <MetricCard
                    icon={FaHeart}
                    label='Lượt thích'
                    value={user.likes_count}
                    subtitle='đã thích bài viết'
                    iconBg='bg-gradient-to-br from-pink-400 to-rose-500'
                  />
                </div>
              </div>

              {/* Violation info */}
              {(user.banned_count ?? 0) > 0 && (
                <div className='rounded-2xl p-4 mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'>
                  <p className='text-sm font-bold text-red-700 dark:text-red-400'>
                    ⚠️ Lịch sử vi phạm: {user.banned_count} lần
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.3s ease-out;
        }
      `}</style>
    </>
  )
}
