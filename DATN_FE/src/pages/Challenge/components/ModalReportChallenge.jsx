import { useSafeMutation } from '../../../hooks/useSafeMutation'
import { reportChallenge } from '../../../apis/challengeApi'
import toast from 'react-hot-toast'
import ModalLayout from '../../../layouts/ModalLayout'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import TextArea from '../../../components/InputComponents/TextArea'
import { schemaCreateReport } from '../../../utils/rules'
import Loading from '../../../components/GlobalComponents/Loading'
import { FaFlag } from 'react-icons/fa'

export default function ModalReportChallenge({ onClose, challengeId }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schemaCreateReport),
    defaultValues: { reason: '' }
  })

  const reportMutation = useSafeMutation({
    mutationFn: (body) => reportChallenge(challengeId, body)
  })

  const onSubmit = handleSubmit((data) => {
    reportMutation.mutate(data, {
      onSuccess: () => {
        toast.success('Báo cáo thử thách thành công, quản trị viên sẽ xử lý')
        reset()
        onClose()
      },
      onError: (err) => {
        toast.error(err?.response?.data?.message || 'Có lỗi xảy ra khi báo cáo')
      }
    })
  })

  return (
    <ModalLayout closeModal={onClose} title='Báo cáo thử thách' icon={FaFlag} size='md'>
      <form onSubmit={onSubmit} className='p-5 space-y-4'>
        <TextArea
          title='Lý do báo cáo'
          name='reason'
          id='reason'
          placeholder='Nhập lý do báo cáo'
          register={register}
          errors={errors.reason}
        />

        <button
          type='submit'
          disabled={reportMutation.isPending}
          className='w-full py-3 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-red-500/20 flex items-center justify-center gap-2'
        >
          {reportMutation.isPending ? (
            <Loading classNameSpin='inline w-5 h-5 text-gray-200 animate-spin fill-white' />
          ) : (
            'Gửi báo cáo'
          )}
        </button>
      </form>
    </ModalLayout>
  )
}
