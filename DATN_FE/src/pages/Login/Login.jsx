import { useSafeMutation } from '../../hooks/useSafeMutation'
import { Link, useNavigate } from 'react-router-dom'
import InputPass from '../../components/InputComponents/InputPass'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { schemaLogin } from '../../utils/rules'
import Input from '../../components/InputComponents/Input'
import { } from '@tanstack/react-query'
import { loginAccount } from '../../apis/authApi'
import { isAxiosUnprocessableEntityError } from '../../utils/utils'
import { useContext } from 'react'
import { AppContext } from '../../contexts/app.context'
import Loading from '../../components/GlobalComponents/Loading'
import { queryClient } from '../../main'
import toast from 'react-hot-toast'
import { FcGoogle } from 'react-icons/fc'

export default function Login() {
  const { setIsAuthenticated, setProfile } = useContext(AppContext)
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schemaLogin)
  })
  const loginAccountMutation = useSafeMutation({
    mutationFn: (body) => loginAccount(body)
  })
  const onSubmit = handleSubmit((data) => {
    loginAccountMutation.mutate(data, {
      onSuccess: (data) => {
        setIsAuthenticated(true)
        setProfile(data.data.result.user)
        navigate('/home')
        toast.success(data.data.message)
        queryClient.invalidateQueries('me')
      },
      onError: (error) => {
        if (isAxiosUnprocessableEntityError(error)) {
          const formError = error.response?.data.errors
          console.log(formError)
          if (formError?.email) {
            setError('email', {
              message: formError.email.msg,
              type: 'Server'
            })
          }
          if (formError?.password) {
            setError('password', {
              message: formError.password.msg,
              type: 'Server'
            })
          }
        }
      }
    })
  })

  const getGoogleAuthUrl = () => {
    const { VITE_GOOGLE_CLIENT_ID, VITE_GOOGLE_REDIRECT_URI } = import.meta.env
    const url = `https://accounts.google.com/o/oauth2/v2/auth`
    const query = {
      client_id: VITE_GOOGLE_CLIENT_ID,
      redirect_uri: VITE_GOOGLE_REDIRECT_URI,
      response_type: 'code',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ].join(' '),
      prompt: 'consent',
      access_type: 'offline'
    }
    const queryString = new URLSearchParams(query).toString()
    return `${url}?${queryString}`
  }
  const googleOAuthUrl = getGoogleAuthUrl()

  return (
    <div className='sm:w-2/3 w-full px-4 lg:px-8 lg:py-12 rounded-2xl mx-auto lg:bg-white lg:shadow-sm'>
      <h1 className='mb-6'>
        <div className='text-3xl font-bold text-gray-900 lg:text-gray-900'>Đăng nhập</div>
        <p className='text-gray-400 text-sm mt-1'>Chào mừng bạn quay lại FitConnect</p>
      </h1>
      <form onSubmit={onSubmit} noValidate>
        <Input
          title='Email của bạn'
          className='block bg-white w-full placeholder:text-sm px-4 py-2.5 text-gray-900 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all'
          classNameLabel='text-gray-600 text-sm font-medium mb-1.5 text-left'
          placeholder='Nhập email của bạn'
          register={register}
          errors={errors.email}
          type='email'
          name='email'
          id='email'
        />
        <InputPass
          title='Mật khẩu của bạn'
          className='block bg-white w-full placeholder:text-sm px-4 py-2.5 text-gray-900 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all'
          classNameLabel='text-gray-600 text-sm font-medium mb-1.5 text-left'
          placeholder='Nhập mật khẩu của bạn'
          register={register}
          errors={errors.password}
          name='password'
        />
        <div className='flex justify-end text-sm mb-2'>
          <Link className='text-emerald-600 font-medium hover:underline hover:text-emerald-700' to='/forgot-password'>
            Quên mật khẩu?
          </Link>
        </div>
        <div className='pt-2'>
          {loginAccountMutation.isPending ? (
            <div className='block w-full p-3 transition-all duration-500 text-base rounded-xl bg-gray-300 cursor-not-allowed'>
              <div className='flex justify-center items-center text-gray-500'>
                <Loading
                  className='w-10 mx-1 flex justify-center items-center'
                  classNameSpin='inline w-5 h-5 text-gray-200 animate-spin fill-emerald-600'
                />
                Đang xử lý...
              </div>
            </div>
          ) : (
            <button
              type='submit'
              className='block w-full p-3 transition-all duration-300 text-base font-semibold rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-200 hover:shadow-lg hover:shadow-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2'
            >
              ĐĂNG NHẬP
            </button>
          )}
        </div>
      </form>
      <div className='px-0 pb-2'>
        {/* Divider */}
        <div className='flex items-center my-5'>
          <div className='flex-1 border-t border-gray-200'></div>
          <span className='px-4 text-gray-400 text-sm'>hoặc</span>
          <div className='flex-1 border-t border-gray-200'></div>
        </div>

        {/* Google Login Button */}
        <Link
          to={googleOAuthUrl}
          className='flex items-center justify-center gap-3 w-full px-4 py-3 border-2 border-gray-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50/50 transition-all duration-300 group'
        >
          <FcGoogle className='text-2xl' />
          <span className='text-gray-600 font-medium group-hover:text-gray-800'>Đăng nhập với Google</span>
        </Link>

        <div className='text-gray-500 flex justify-center items-center mt-5'>
          <span className='text-gray-400'>Bạn chưa có tài khoản?</span>
          <Link className='ml-1 font-semibold text-emerald-600 hover:underline hover:text-emerald-700' to='/register'>
            Đăng ký
          </Link>
        </div>
      </div>
    </div>
  )
}
