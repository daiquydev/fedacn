import { Link } from 'react-router-dom'
import MotionWrapper from '../../../../layouts/MotionWrapper'
import { HiOutlineCheckCircle } from 'react-icons/hi'

export default function ChangeSuccess() {
  return (
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
      <main className='w-full max-w-md mx-auto p-6'>
        <div className='bg-white rounded-2xl shadow-xl border border-white/20 overflow-hidden'>
          <div className='p-6 sm:p-8 text-center'>
            {/* Success icon */}
            <div className='flex justify-center mb-5'>
              <div className='w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center'>
                <HiOutlineCheckCircle className='text-emerald-600 text-4xl' />
              </div>
            </div>
            <h1 className='text-2xl font-bold text-gray-900'>Đổi mật khẩu thành công!</h1>
            <p className='mt-3 text-gray-500 text-sm'>
              Mật khẩu của bạn đã được cập nhật. Bạn có thể đăng nhập với mật khẩu mới.
            </p>
            <Link
              to='/login'
              className='inline-block mt-6 bg-amber-500 hover:bg-amber-600 text-white px-8 py-3 rounded-xl font-semibold shadow-md shadow-amber-200 hover:shadow-lg transition-all'
            >
              Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </main>
    </MotionWrapper>
  )
}
