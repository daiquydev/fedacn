import { memo } from 'react'
import { Link } from 'react-router-dom'
import MotionWrapper from '../MotionWrapper'
import { FaLeaf } from 'react-icons/fa'

function AuthLayoutInner({ children }) {
  return (
    <section className='min-h-screen flex items-stretch font-Inter bg-gradient-to-br from-white via-slate-50 to-gray-100'>
      {/* Left Panel — Light Branding */}
      <div className='lg:flex w-1/2 hidden relative items-center bg-gradient-to-br from-white via-slate-50 to-emerald-50 overflow-hidden border-r border-slate-200'>
        {/* Decorative circles */}
        <div className='absolute -top-20 -left-20 w-72 h-72 bg-emerald-100/70 rounded-full blur-3xl' />
        <div className='absolute -bottom-32 -right-20 w-96 h-96 bg-sky-100/70 rounded-full blur-3xl' />
        <div className='absolute top-1/3 right-10 w-40 h-40 bg-amber-100/80 rounded-full blur-2xl' />

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
              <div className='w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center'>
                <FaLeaf className='text-emerald-600 text-xl' />
              </div>
              <span className='text-slate-900 text-2xl font-bold tracking-tight'>FitConnect</span>
            </div>

            {/* Main heading */}
            <Link to='/' className='block'>
              <h1 className='text-5xl font-extrabold text-slate-900 leading-tight tracking-tight'>
                Chào mừng đến với{' '}
                <span className='text-emerald-600'>FitConnect</span>
              </h1>
            </Link>
            <p className='text-xl text-slate-600 mt-4 leading-relaxed'>
              Kết nối cộng đồng yêu thích sức khỏe và thể thao
            </p>

            {/* Feature highlights */}
            <div className='mt-10 space-y-4'>
              <div className='flex items-center gap-3 text-slate-700'>
                <div className='w-8 h-8 bg-white rounded-lg flex items-center justify-center text-sm shadow-sm'>🤖</div>
                <span>AI gợi ý bài tập thông minh</span>
              </div>
              <div className='flex items-center gap-3 text-slate-700'>
                <div className='w-8 h-8 bg-white rounded-lg flex items-center justify-center text-sm shadow-sm'>📊</div>
                <span>Phân tích sức khỏe với AI</span>
              </div>
              <div className='flex items-center gap-3 text-slate-700'>
                <div className='w-8 h-8 bg-white rounded-lg flex items-center justify-center text-sm shadow-sm'>👥</div>
                <span>Kết nối cộng đồng fitness</span>
              </div>
            </div>
          </MotionWrapper>
        </div>
      </div>

      {/* Right Panel — Form Area */}
      <div className='lg:w-1/2 w-full flex bg-transparent items-center justify-center text-left md:px-16 px-0 z-0'>
        <div className='absolute lg:hidden z-10 inset-0 bg-gradient-to-br from-white via-slate-50 to-gray-100'>
          <div className='absolute inset-0 bg-transparent' />
        </div>
        <div className='w-full py-6 z-20'>{children}</div>
      </div>
    </section>
  )
}

const AuthLayout = memo(AuthLayoutInner)

export default AuthLayout
