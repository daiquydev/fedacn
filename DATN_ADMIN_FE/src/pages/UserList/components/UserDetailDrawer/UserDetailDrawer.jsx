import { useQuery } from '@tanstack/react-query'
import { getUserAdminById } from '../../../../apis/adminApi'
import useravatar from '../../../../assets/images/useravatar.jpg'
import { getImageUrl } from '../../../../utils/imageUrl'
import { useEffect } from 'react'
import Loading from '../../../../components/GlobalComponents/Loading'
import {
  FaTimes, FaFileAlt, FaRunning,
  FaUsers,
  FaCalendarAlt, FaEnvelope, FaTrophy
} from 'react-icons/fa'

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
          <Loading
            className='h-full flex justify-center items-center gap-3'
            size='xl'
            tone='info'
            text='Đang tải thông tin...'
            textClassName='text-sm text-gray-400'
          />
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
                      icon={FaUsers}
                      label='Người theo dõi'
                      value={user.followers_count}
                      subtitle='theo dõi tài khoản này'
                      iconBg='bg-gradient-to-br from-cyan-400 to-teal-500'
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
                      iconBg='bg-gradient-to-br from-violet-400 to-purple-600'
                    />
                  </div>
                </div>
              </div>
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
