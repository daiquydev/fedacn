import { useSafeMutation } from '../../../../hooks/useSafeMutation'
import { useNavigate } from 'react-router-dom'
import InputPass from '../../../../components/InputComponents/InputPass'
import MotionWrapper from '../../../../layouts/MotionWrapper'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { resetPassword } from '../../../../apis/authApi'
import { } from '@tanstack/react-query'
import { schemaResetPassword } from '../../../../utils/rules'
import useQueryConfig from '../../../../hooks/useQueryConfig'
import { omit } from 'lodash'
import { isAxiosUnprocessableEntityError } from '../../../../utils/utils'
import Loading from '../../../../components/GlobalComponents/Loading'
import { HiOutlineLockClosed } from 'react-icons/hi'

export default function ChangePassForm() {
  const navigate = useNavigate()
  const queryConfig = omit(useQueryConfig(), ['page', 'sort'])
  console.log(queryConfig)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schemaResetPassword)
  })
  const resetPasswordMutation = useSafeMutation({
    mutationFn: (body) => resetPassword(body)
  })
  const onSubmit = handleSubmit((data) => {
    console.log(data)

    const newData = {
      new_password: data.new_password,
      email: queryConfig.email,
      otp_code: queryConfig.otp_code
    }

    console.log(newData)

    resetPasswordMutation.mutate(newData, {
      onError: (error) => {
        if (isAxiosUnprocessableEntityError(error)) {
          const formError = error.response?.data.errors
          if (formError?.new_password) {
            setError('new_password', {
              message: formError.new_password.msg || error?.response?.data?.message,
              type: 'Server'
            })
          }
        }
      },
      onSuccess: (data) => {
        console.log(data)
        navigate('/forgot-password/success')
      }
    })
  })
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
                <HiOutlineLockClosed className='text-emerald-600 text-2xl' />
              </div>
            </div>
            <div className='text-center'>
              <h1 className='block text-2xl font-bold text-gray-900'>Đổi mật khẩu</h1>
              <p className='text-sm text-gray-500 mt-1'>Tạo mật khẩu mới cho tài khoản của bạn</p>
            </div>
            <div className='mt-6'>
              <form onSubmit={onSubmit}>
                <div className='grid gap-y-4'>
                  <div>
                    <InputPass
                      title='Mật khẩu mới'
                      className='block bg-gray-50 w-full placeholder:text-sm px-4 py-2.5 text-gray-900 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all'
                      classNameLabel='text-gray-600 text-sm font-medium mb-1.5 text-left'
                      placeholder='Nhập mật khẩu mới'
                      name='new_password'
                      register={register}
                      errors={errors.new_password}
                    />
                    <InputPass
                      title='Xác nhận mật khẩu'
                      className='block bg-gray-50 w-full placeholder:text-sm px-4 py-2.5 text-gray-900 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all'
                      classNameLabel='text-gray-600 text-sm font-medium mb-1.5 text-left'
                      placeholder='Nhập lại mật khẩu'
                      name='confirm_password'
                      register={register}
                      errors={errors.confirm_password}
                    />
                  </div>
                  {resetPasswordMutation.isPending ? (
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
                      XÁC NHẬN
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
