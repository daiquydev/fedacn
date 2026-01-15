import { useContext, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { setAccessTokenToLS, setProfileToLS, setRefreshTokenToLS } from '../../utils/auth'
import { AppContext } from '../../contexts/app.context'
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa'
import { FcGoogle } from 'react-icons/fc'

export default function LoginGoogle() {
  const [params] = useSearchParams()
  const { setIsAuthenticated, setProfile } = useContext(AppContext)
  const [isBanner, setIsBanner] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const access_token = params.get('access_token')
    const refresh_token = params.get('refresh_token')
    const userParam = params.get('user')
    
    // Small delay for better UX
    setTimeout(() => {
      if (access_token && refresh_token && userParam) {
        try {
          const user = JSON.parse(userParam)
          setAccessTokenToLS(access_token)
          setRefreshTokenToLS(refresh_token)
          setProfileToLS(user)
          setIsAuthenticated(true)
          setProfile(user)
          setIsLoading(false)
        } catch (error) {
          console.error('Error parsing user data:', error)
          setIsBanner(true)
          setIsLoading(false)
        }
      } else {
        setIsBanner(true)
        setIsLoading(false)
      }
    }, 500)
  }, [params, setIsAuthenticated, setProfile])

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-16 h-16 mx-auto mb-4 rounded-full bg-white shadow-lg flex items-center justify-center animate-pulse'>
            <FcGoogle className='text-3xl' />
          </div>
          <p className='text-gray-600'>Đang xử lý đăng nhập...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4'>
      <div className='bg-white rounded-2xl shadow-xl max-w-md w-full p-8'>
        {!isBanner ? (
          <>
            {/* Success State */}
            <div className='text-center'>
              <div className='w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center'>
                <FaCheckCircle className='text-4xl text-green-500' />
              </div>
              <h2 className='text-2xl font-bold text-gray-900 mb-2'>Đăng nhập thành công!</h2>
              <p className='text-gray-600 mb-6'>
                Chào mừng bạn quay trở lại. Hãy bắt đầu khám phá ngay!
              </p>
              <a
                href='/home'
                className='inline-flex items-center justify-center w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg shadow-green-500/25'
              >
                Đi đến trang chủ
              </a>
            </div>
          </>
        ) : (
          <>
            {/* Error State */}
            <div className='text-center'>
              <div className='w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center'>
                <FaTimesCircle className='text-4xl text-red-500' />
              </div>
              <h2 className='text-2xl font-bold text-gray-900 mb-2'>Đăng nhập thất bại</h2>
              <p className='text-gray-600 mb-6'>
                Tài khoản của bạn có thể đã bị khóa hoặc có lỗi xảy ra trong quá trình xác thực.
              </p>
              <div className='space-y-3'>
                <a
                  href='/login'
                  className='inline-flex items-center justify-center w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 shadow-lg shadow-blue-500/25'
                >
                  Thử đăng nhập lại
                </a>
                <a
                  href='/register'
                  className='inline-flex items-center justify-center w-full px-6 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-300'
                >
                  Tạo tài khoản mới
                </a>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
