import { Outlet } from 'react-router-dom'
import { FaLeaf } from 'react-icons/fa'
import { Link } from 'react-router-dom'

export default function ForgotPassword() {
  return (
    <div className='min-h-screen relative overflow-hidden font-Inter'>
      {/* Green gradient background */}
      <div className='absolute inset-0 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800' />

      {/* Decorative elements */}
      <div className='absolute -top-32 -right-32 w-96 h-96 bg-white/5 rounded-full blur-3xl' />
      <div className='absolute -bottom-32 -left-32 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl' />
      <div className='absolute top-1/2 right-1/4 w-40 h-40 bg-amber-400/5 rounded-full blur-2xl' />

      {/* Logo */}
      <div className='relative z-10 pt-8 px-8'>
        <Link to='/' className='inline-flex items-center gap-2'>
          <div className='w-9 h-9 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center'>
            <FaLeaf className='text-white text-sm' />
          </div>
          <span className='text-white text-xl font-bold'>FitConnect</span>
        </Link>
      </div>

      {/* Content */}
      <div className='relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)]'>
        <Outlet />
      </div>
    </div>
  )
}
