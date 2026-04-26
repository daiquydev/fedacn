import { useQuery } from '@tanstack/react-query'
import { getUserAdminById } from '../../../../apis/adminApi'
import useravatar from '../../../../assets/images/useravatar.jpg'
import { getImageUrl } from '../../../../utils/imageUrl'
import { useEffect } from 'react'
import {
  FaTimes, FaFileAlt, FaRunning, FaDumbbell,
  FaUsers, FaHeart,
  FaCalendarAlt, FaEnvelope, FaTrophy
} from 'react-icons/fa'

const VIOLATION_KIND_LABEL = {
  post: 'Bài viết bị gỡ (vi phạm / báo cáo)',
  sport_event: 'Sự kiện bị gỡ sau kiểm duyệt báo cáo',
  challenge: 'Thử thách bị gỡ sau kiểm duyệt báo cáo'
}

function MetricCard({ icon: Icon, label, value, subtitle, iconBg, className = '' }) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow ${className}`}>
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

  const violations = Array.isArray(user?.moderation_violations) ? user.moderation_violations : []
  const showViolationSection = (user?.banned_count ?? 0) > 0 || violations.length > 0

  return (
    <>
      {/* Backdrop */}
      <div
        className='fixed inset-0 bg-black/40 backdrop-blur-sm z-[1200] transition-opacity'
        onClick={onClose}
      />

      {/* Drawer */}
      <div className='fixed right-0 top-0 h-full w-full max-w-md bg-gray-50 dark:bg-gray-900 shadow-2xl z-[1210] overflow-y-auto animate-slide-in-right'>

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
            {/* Profile Header — ảnh bìa user */}
            <div className='relative h-40 overflow-hidden bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-500'>
              {user.cover_avatar ? (
                <img
                  src={getImageUrl(user.cover_avatar)}
                  alt=''
                  className='absolute inset-0 h-full w-full object-cover'
                />
              ) : null}
              <div className='absolute inset-0 bg-gradient-to-b from-black/25 via-black/20 to-black/55' />
            </div>

            <div className='px-6 -mt-12 relative z-10'>
              {/* Avatar + Name */}
              <div className='flex items-end gap-4 mb-4'>
                <img
                  src={!user.avatar || user.avatar === '' ? useravatar : getImageUrl(user.avatar)}
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

              {/* Metrics — nhóm theo loại hoạt động */}
              <div className='mb-6 space-y-5'>
                <h3 className='text-sm font-bold text-gray-700 dark:text-gray-300'>Chi tiết hoạt động</h3>

                <div>
                  <p className='text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2'>
                    Cộng đồng
                  </p>
                  <div className='grid grid-cols-2 gap-3'>
                    <MetricCard
                      icon={FaFileAlt}
                      label='Bài viết'
                      value={user.posts_count}
                      iconBg='bg-gradient-to-br from-blue-400 to-blue-600'
                    />
                    <MetricCard
                      icon={FaHeart}
                      label='Lượt thích'
                      value={user.likes_count}
                      subtitle='đã thích bài viết'
                      iconBg='bg-gradient-to-br from-pink-400 to-rose-500'
                    />
                    <MetricCard
                      icon={FaUsers}
                      label='Người theo dõi'
                      value={user.followers_count}
                      subtitle='theo dõi tài khoản này'
                      iconBg='bg-gradient-to-br from-cyan-400 to-teal-500'
                      className='col-span-2'
                    />
                  </div>
                </div>

                <div>
                  <p className='text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2'>
                    Sự kiện &amp; thử thách
                  </p>
                  <div className='grid grid-cols-2 gap-3'>
                    <MetricCard
                      icon={FaRunning}
                      label='Sự kiện tham gia'
                      value={user.events_attended}
                      iconBg='bg-gradient-to-br from-emerald-400 to-green-600'
                    />
                    <MetricCard
                      icon={FaTrophy}
                      label='Thử thách tham gia'
                      value={user.challenges_joined ?? 0}
                      subtitle={`${user.challenges_completed ?? 0} đã hoàn thành · không tính đã bỏ cuộc`}
                      iconBg='bg-gradient-to-br from-violet-400 to-purple-600'
                    />
                  </div>
                </div>

                <div>
                  <p className='text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2'>
                    Tập luyện
                  </p>
                  <div className='grid grid-cols-2 gap-3'>
                    <MetricCard
                      icon={FaDumbbell}
                      label='Buổi tập hoàn thành'
                      value={user.workouts_completed}
                      subtitle={`${(user.total_workout_kcal ?? 0).toLocaleString('vi-VN')} kcal đốt`}
                      iconBg='bg-gradient-to-br from-orange-400 to-red-500'
                      className='col-span-2'
                    />
                  </div>
                </div>
              </div>

              {/* Violation / moderation history */}
              {showViolationSection && (
                <div className='rounded-2xl p-4 mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'>
                  <p className='text-sm font-bold text-red-700 dark:text-red-400 mb-2'>
                    ⚠️ Lịch sử vi phạm và nội dung đã gỡ
                  </p>
                  <p className='text-xs text-red-600/90 dark:text-red-300/90 mb-3'>
                    Điểm cảnh báo (banned_count): <span className='font-semibold'>{user.banned_count ?? 0}</span>
                    {violations.length > 0 && (
                      <> · Đã gỡ <span className='font-semibold'>{violations.length}</span> nội dung có thể truy vết</>
                    )}
                  </p>
                  {violations.length > 0 ? (
                    <ul className='space-y-2.5 max-h-64 overflow-y-auto pr-1'>
                      {violations.map((v, idx) => (
                        <li
                          key={`${v.kind}-${v.ref_id}-${idx}`}
                          className='text-xs rounded-xl bg-white/80 dark:bg-slate-900/50 border border-red-100 dark:border-red-900/40 p-3'
                        >
                          <p className='font-semibold text-red-800 dark:text-red-300'>
                            {VIOLATION_KIND_LABEL[v.kind] || v.kind}
                          </p>
                          <p className='text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap break-words'>
                            {v.summary}
                          </p>
                          {v.occurred_at && (
                            <p className='text-[10px] text-gray-400 mt-1.5'>
                              {new Date(v.occurred_at).toLocaleString('vi-VN')}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className='text-xs text-red-700/80 dark:text-red-400/80'>
                      Có {user.banned_count ?? 0} lần ghi nhận trên tài khoản nhưng không còn bản ghi chi tiết (dữ liệu cũ hoặc đã dọn).
                    </p>
                  )}
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
