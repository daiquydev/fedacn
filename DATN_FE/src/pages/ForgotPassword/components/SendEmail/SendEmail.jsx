import { useSafeMutation } from '../../../../hooks/useSafeMutation'
import { Link, useNavigate } from 'react-router-dom'
import Input from '../../../../components/InputComponents/Input'
import MotionWrapper from '../../../../layouts/MotionWrapper'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { sendOtp } from '../../../../apis/authApi'

import { } from '@tanstack/react-query'
import { schemaSendOtp } from '../../../../utils/rules'
import toast from 'react-hot-toast'
import Loading from '../../../../components/GlobalComponents/Loading'
import { HiOutlineMail } from 'react-icons/hi'

export default function SendEmail() {
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schemaSendOtp)
  })
  const sendOtpMutation = useSafeMutation({
    mutationFn: (body) => sendOtp(body)
  })
  const onSubmit = handleSubmit(
    (data) => {
      console.log(data)
      sendOtpMutation.mutate(data, {
        onError: (errors) => {
          console.log(errors)
          setError('email', {
            type: 'manual',
            message: errors?.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại'
          })
        },
        onSuccess: (data) => {
          console.log(data)
          toast.success('Gửi mã OTP thành công')
          navigate(`/forgot-password/confirm-otp?email=${data.data.result}`)
        }
      })
    },
    (errors) => {
      console.log(errors)
    }
  )

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
          <div className='p-6 sm:p-8'>
            {/* Icon */}
            <div className='flex justify-center mb-5'>
              <div className='w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center'>
                <HiOutlineMail className='text-emerald-600 text-2xl' />
              </div>
            </div>
            <div className='text-center'>
              <h1 className='block text-2xl font-bold text-gray-900'>Quên mật khẩu?</h1>
              <p className='mt-2 text-sm text-gray-500'>
                Nhập email để nhận mã xác nhận.{' '}
                <Link to='/login' className='text-emerald-600 font-medium hover:underline'>
                  Quay lại đăng nhập
                </Link>
              </p>
            </div>
            <div className='mt-6'>
              <form onSubmit={onSubmit}>
                <div className='grid gap-y-4'>
                  <div>
                    <Input
                      title='Email'
                      type='email'
                      name='email'
                      id='email'
                      register={register}
                      errors={errors?.email}
                      placeholder='Nhập Email'
                      className='block bg-gray-50 w-full placeholder:text-sm px-4 py-2.5 text-gray-900 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all'
                      classNameLabel='text-gray-600 text-sm font-medium mb-1.5 text-left'
                    />
                  </div>
                  {sendOtpMutation.isPending ? (
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
                      className='block w-full p-3 text-base font-semibold rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-200 hover:shadow-lg transition-all'
                    >
                      GỬI MÃ XÁC NHẬN
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </MotionWrapper>
  )
}
