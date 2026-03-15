import { memo } from 'react'
import { Link } from 'react-router-dom'
import MotionWrapper from '../MotionWrapper'
import { FaLeaf, FaShieldAlt } from 'react-icons/fa'

function AuthLayoutInner({ children }) {
  return (
    <section className='min-h-screen flex items-stretch' style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Left Panel — Green Gradient + Admin Branding */}
      <div className='lg:flex w-1/2 hidden relative items-center bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-900 overflow-hidden'>
        {/* Decorative circles */}
        <div className='absolute -top-20 -left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl' />
        <div className='absolute -bottom-32 -right-20 w-96 h-96 bg-teal-400/15 rounded-full blur-3xl' />
        <div className='absolute top-1/3 right-10 w-40 h-40 bg-amber-400/10 rounded-full blur-2xl' />

        <div className='w-full px-16 z-10'>
          <MotionWrapper
            variants={{
              offscreen: {
                opacity: 0,
                y: 30
              },
              onscreen: {
                opacity: 1,
                y: 0
              }
            }}
          >
            {/* Logo */}
            <div className='flex items-center gap-3 mb-8'>
              <div className='w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center'>
                <FaLeaf className='text-white text-xl' />
              </div>
              <span className='text-white text-2xl font-bold tracking-tight'>FitConnect</span>
            </div>

            {/* Main heading */}
            <Link to='/' className='block'>
              <h1 className='text-5xl font-extrabold text-white leading-tight tracking-tight'>
                Trang quản trị{' '}
                <span className='text-amber-300'>FitConnect</span>
              </h1>
            </Link>
            <p className='text-xl text-emerald-100/80 mt-4 leading-relaxed'>
              Hệ thống quản lý nền tảng sức khỏe cộng đồng
            </p>

            {/* Feature highlights */}
            <div className='mt-10 space-y-4'>
              <div className='flex items-center gap-3 text-emerald-100/70'>
                <div className='w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center text-sm'>
                  <FaShieldAlt className='text-xs' />
                </div>
                <span>Quản lý người dùng & quyền hạn</span>
              </div>
              <div className='flex items-center gap-3 text-emerald-100/70'>
                <div className='w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center text-sm'>📊</div>
                <span>Thống kê & Báo cáo hệ thống</span>
              </div>
              <div className='flex items-center gap-3 text-emerald-100/70'>
                <div className='w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center text-sm'>⚙️</div>
                <span>Cấu hình & Kiểm duyệt nội dung</span>
              </div>
            </div>
          </MotionWrapper>
        </div>
      </div>

      {/* Right Panel — White Form */}
      <div className='lg:w-1/2 w-full flex bg-gray-50 items-center justify-center text-center md:px-16 px-0 z-0'>
        <div className='absolute lg:hidden z-10 inset-0 bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-900'>
          <div className='absolute inset-0 bg-black/40' />
        </div>
        <div className='w-full py-6 z-20'>{children}</div>
      </div>
    </section>
  )
}

const AuthLayout = memo(AuthLayoutInner)

export default AuthLayout
