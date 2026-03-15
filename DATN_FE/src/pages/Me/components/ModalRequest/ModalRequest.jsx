import { useForm } from 'react-hook-form'
import ModalLayout from '../../../../layouts/ModalLayout'
import Loading from '../../../../components/GlobalComponents/Loading'
import Input from '../../../../components/InputComponents/Input'
import TextArea from '../../../../components/InputComponents/TextArea'
import { yupResolver } from '@hookform/resolvers/yup'
import { schemaRequestUpgrade } from '../../../../utils/rules'
import toast from 'react-hot-toast'
import { queryClient } from '../../../../main'
import { FaArrowUp } from 'react-icons/fa'

export default function ModalRequest({ handleCloseModalRequest, updateRequest }) {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schemaRequestUpgrade),
    defaultValues: {
      reason: '',
      proof: ''
    }
  })

  const onSubmit = handleSubmit((data) => {
    updateRequest.mutate(data, {
      onSuccess: () => {
        toast.success('Yêu cầu nâng cấp lên đầu bếp thành công, hãy đợi email phản hồi từ chúng tôi')
        queryClient.invalidateQueries({ queryKey: ['me'] })
        handleCloseModalRequest()
      },
      onError: (error) => {
        toast.error(error?.response?.data?.message || 'Có lỗi xảy ra')
      }
    })
  })

  return (
    <ModalLayout closeModal={handleCloseModalRequest} title='Nâng cấp lên đầu bếp' icon={FaArrowUp} size='md'>
      <form noValidate onSubmit={onSubmit} className='p-5 space-y-4'>
        <Input
          title='Link minh chứng kinh nghiệm của bạn'
          type='text'
          name='proof'
          id='proof'
          placeholder='VD: https://www.facebook.com/...'
          register={register}
          errors={errors.proof}
        />
        <TextArea
          title='Lý do bạn muốn nâng cấp lên đầu bếp'
          name='reason'
          id='reason'
          placeholder='Nhập lý do của bạn'
          register={register}
          errors={errors.reason}
        />

        <div className='pt-2'>
          <button
            type='submit'
            disabled={updateRequest.isPending}
            className='w-full py-3 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2'
          >
            {updateRequest.isPending ? (
              <Loading classNameSpin='inline w-5 h-5 text-gray-200 animate-spin fill-white' />
            ) : (
              'Gửi lên hệ thống'
            )}
          </button>
        </div>
      </form>
    </ModalLayout>
  )
}
