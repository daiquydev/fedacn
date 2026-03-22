import { useSafeMutation } from '../../../../hooks/useSafeMutation'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'
import ModalLayout from '../../../../layouts/ModalLayout'
import { } from '@tanstack/react-query'
import Loading from '../../../../components/GlobalComponents/Loading'
import { schemaChangePassword } from '../../../../utils/rules'
import toast from 'react-hot-toast'
import { changePassword } from '../../../../apis/userApi'
import InputPass from '../../../../components/InputComponents/InputPass'
import { FaLock } from 'react-icons/fa'

export default function ModalChangePass({ handleCloseModalUpdatePass }) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schemaChangePassword),
    defaultValues: {
      old_password: '',
      new_password: '',
      confirm_password: ''
    }
  })

  const updatePassMutation = useSafeMutation({
    mutationFn: (body) => changePassword(body)
  })

  const onSubmit = handleSubmit((data) => {
    const newData = {
      old_password: data.old_password,
      new_password: data.new_password
    }

    updatePassMutation.mutate(newData, {
      onSuccess: () => {
        toast.success('Đổi mật khẩu thành công')
        handleCloseModalUpdatePass()
      },
      onError: (error) => {
        setError('old_password', {
          type: 'manual',
          message: error?.response?.data?.message
        })
        setError('new_password', {
          type: 'manual',
          message: error?.response?.data?.errors?.new_password?.msg
        })
      }
    })
  })

  return (
    <ModalLayout closeModal={handleCloseModalUpdatePass} title='Đổi mật khẩu' icon={FaLock} size='md'>
      <form noValidate onSubmit={onSubmit} className='p-5 space-y-4'>
        <InputPass
          title='Mật khẩu cũ'
          type='password'
          name='old_password'
          id='old_password'
          register={register}
          errors={errors.old_password}
          placeholder='Nhập mật khẩu cũ'
        />
        <InputPass
          title='Mật khẩu mới'
          type='password'
          name='new_password'
          id='new_password'
          register={register}
          errors={errors.new_password}
          placeholder='Nhập mật khẩu mới'
        />
        <InputPass
          title='Nhập lại mật khẩu mới'
          type='password'
          name='confirm_password'
          id='confirm_password'
          register={register}
          errors={errors.confirm_password}
          placeholder='Nhập lại mật khẩu mới'
        />

        <div className='pt-2'>
          <button
            type='submit'
            disabled={updatePassMutation.isPending}
            className='w-full py-3 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2'
          >
            {updatePassMutation.isPending ? (
              <Loading className='' classNameSpin='inline w-5 h-5 text-gray-200 animate-spin fill-white' />
            ) : (
              'Đổi mật khẩu'
            )}
          </button>
        </div>
      </form>
    </ModalLayout>
  )
}
