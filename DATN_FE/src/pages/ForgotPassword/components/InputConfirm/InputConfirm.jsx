import { useNavigate } from 'react-router-dom'
import MotionWrapper from '../../../../layouts/MotionWrapper'
import useQueryConfig from '../../../../hooks/useQueryConfig'
import { omit } from 'lodash'
import OtpInput from 'react-otp-input'
import { useState } from 'react'
import { sendOtp, verifyOtp } from '../../../../apis/authApi'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import Loading from '../../../../components/GlobalComponents/Loading'
import { HiOutlineShieldCheck } from 'react-icons/hi'

export default function InputConfirm() {
  const queryConfig = omit(useQueryConfig(), ['page', 'sort'])
  console.log(queryConfig)
  const navigate = useNavigate()

  const [otp, setOtp] = useState('')
  const sendOtpMutation = useMutation({
    mutationFn: (body) => sendOtp(body)
  })

  const confirmOtpMutation = useMutation({
    mutationFn: (body) => verifyOtp(body)
  })

  const onConfirm = () => {
    if (otp.length !== 4) {
      toast.error('Bạn cần nhập đúng 4 ký tự')
      return
    }
    confirmOtpMutation.mutate(
      {
        email: queryConfig.email,
        otp_code: otp
      },
      {
        onError: (errors) => {
          console.log(errors)
        },
        onSuccess: (data) => {
          console.log(data)
          toast.success('Xác nhận mã OTP thành công')
          navigate(
            `/forgot-password/change-password?email=${data.data.result.email}&otp_code=${data.data.result.otp_code}`
          )
        }
      }
    )
  }

  const onSubmit = () => {
    sendOtpMutation.mutate(
      {
        email: queryConfig.email
      },
      {
        onError: (errors) => {
          console.log(errors)
          toast.error('Có lỗi xảy ra, vui lòng thử lại')
        },
        onSuccess: (data) => {
          console.log(data)
          toast.success('Gửi mã OTP thành công')
          navigate(`/forgot-password/confirm-otp?email=${data.data.result}`)
        }
      }
    )
  }
  console.log(otp)
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
      <div className='flex justify-center'>
        <div className='bg-white rounded-2xl shadow-xl border border-white/20 px-8 py-10 max-w-md w-full'>
          {/* Icon */}
          <div className='flex justify-center mb-5'>
            <div className='w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center'>
              <HiOutlineShieldCheck className='text-emerald-600 text-2xl' />
            </div>
          </div>

          <div className='text-center mb-6'>
            <h1 className='text-2xl font-bold text-gray-900'>Xác nhận OTP</h1>
            <p className='text-sm text-gray-500 mt-1'>Nhập mã 4 số đã gửi đến email của bạn</p>
          </div>
          <div className='flex justify-center gap-2 mb-6'>
            <OtpInput
              value={otp}
              onChange={setOtp}
              numInputs={4}
              className='otp-input'
              inputStyle={{
                border: '2px solid #E5E7EB',
                borderRadius: '12px',
                width: '56px',
                height: '56px',
                fontSize: '20px',
                color: '#111827',
                fontWeight: '600',
                caretColor: '#059669',
                backgroundColor: '#F9FAFB',
                margin: '0 4px',
                transition: 'all 0.2s'
              }}
              focusStyle={{
                border: '2px solid #059669',
                outline: 'none',
                backgroundColor: '#ECFDF5'
              }}
              separator={<span style={{ width: '8px' }}></span>}
              shouldAutoFocus={true}
              renderInput={(props) => <input {...props} />}
            />
          </div>
          <div className='flex items-center justify-center gap-3'>
            {confirmOtpMutation.isPending ? (
              <button disabled className='bg-gray-300 text-gray-500 px-6 py-2.5 rounded-xl font-semibold'>
                <Loading classNameSpin='inline w-5 h-5 text-gray-200 animate-spin fill-emerald-600' />
              </button>
            ) : (
              <button
                onClick={onConfirm}
                className='bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-md shadow-amber-200 transition-all'
                type='button'
              >
                Xác nhận
              </button>
            )}

            {sendOtpMutation.isPending ? (
              <button className='text-gray-400 px-4 py-2.5 cursor-not-allowed'>
                <Loading classNameSpin='inline w-5 h-5 text-gray-200 animate-spin fill-emerald-600' />
              </button>
            ) : (
              <button
                onClick={onSubmit}
                className='text-emerald-600 hover:text-emerald-700 px-4 py-2.5 font-semibold text-sm hover:underline'
                type='button'
              >
                Gửi lại mã
              </button>
            )}
          </div>
        </div>
      </div>
    </MotionWrapper>
  )
}
