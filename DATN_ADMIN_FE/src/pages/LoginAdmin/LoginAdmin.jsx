import { useNavigate } from 'react-router-dom'
import InputPass from '../../components/InputComponents/InputPass'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { schemaLoginAdmin } from '../../utils/rules'
import Input from '../../components/InputComponents/Input'
import { loginAdminAccount } from '../../apis/authApi'
import { toast } from 'react-hot-toast'
import { isAxiosUnprocessableEntityError } from '../../utils/utils'
import { useContext } from 'react'
import { AppContext } from '../../contexts/app.context'
import Loading from '../../components/GlobalComponents/Loading'
import { FaShieldAlt } from 'react-icons/fa'
import { useSafeMutation } from '../../hooks/useSafeMutation'

export default function Login() {
  const { setIsAuthenticated, setProfile } = useContext(AppContext)
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schemaLoginAdmin)
  })
  const loginAccountAdminMutation = useSafeMutation({
    mutationFn: (body) => loginAdminAccount(body)
  })
  const onSubmit = handleSubmit((data) => {
    loginAccountAdminMutation.mutate(data, {
      onSuccess: (data) => {
        setIsAuthenticated(true)
        setProfile(data.data.result.user)
        if (data.data.result.user.role === 2) {
          navigate('/')
        }
        if (data.data.result.user.role === 3) {
          navigate('/recipes-writter')
        }
        if (data.data.result.user.role === 4) {
          navigate('/reports')
        }

        toast.success(data.data.message)
      },
      onError: (error) => {
        if (isAxiosUnprocessableEntityError(error)) {
          const formError = error.response?.data.errors
          console.log(formError)
          if (formError?.user_name) {
            setError('user_name', {
              message: formError.user_name.msg,
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

  return (
    <div className='sm:w-2/3 w-full px-4 lg:px-8 lg:py-12 rounded-2xl mx-auto lg:bg-white lg:shadow-sm' style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header with icon */}
      <div className='flex items-center gap-3 mb-2'>
        <div className='w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center'>
          <FaShieldAlt className='text-emerald-600 text-lg' />
        </div>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Đăng nhập quản trị</h1>
          <p className='text-gray-400 text-sm'>Admin Panel — FitConnect</p>
        </div>
      </div>

      <form onSubmit={onSubmit} noValidate className='mt-6'>
        <Input
          title='Tên tài khoản'
          className='block bg-white w-full placeholder:text-sm px-4 py-2.5 text-gray-900 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all'
          classNameLabel='text-gray-600 text-sm font-medium mb-1.5 text-left'
          placeholder='Nhập tên tài khoản của bạn'
          register={register}
          errors={errors.user_name}
          type='text'
          name='user_name'
          id='user_name'
        />
        <InputPass
          title='Mật khẩu'
          className='block bg-white w-full placeholder:text-sm px-4 py-2.5 text-gray-900 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all'
          classNameLabel='text-gray-600 text-sm font-medium mb-1.5 text-left'
          placeholder='Nhập mật khẩu của bạn'
          register={register}
          errors={errors.password}
          name='password'
        />
        <div className='pt-4'>
          {loginAccountAdminMutation.isPending ? (
            <div className='block w-full p-3 text-base rounded-xl bg-gray-300 cursor-not-allowed'>
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
    </div>
  )
}
