import { useSafeMutation } from '../../../../hooks/useSafeMutation'
import { } from '@tanstack/react-query'
import { reportPost } from '../../../../apis/postApi'
import toast from 'react-hot-toast'
import ModalLayout from '../../../../layouts/ModalLayout'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import TextArea from '../../../../components/InputComponents/TextArea'
import { schemaCreateReport } from '../../../../utils/rules'
import Loading from '../../../../components/GlobalComponents/Loading'
import { FaFlag } from 'react-icons/fa'

export default function ModalReportPost({ handleCloseReportPost, post }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schemaCreateReport),
    defaultValues: {
      reason: ''
    }
  })

  const reportMutation = useSafeMutation({
    mutationFn: (body) => reportPost(body)
  })

  const onSubmit = handleSubmit((data) => {
    const body = {
      post_id: post._id,
      ...data
    }
    reportMutation.mutate(body, {
      onSuccess: () => {
        toast.success('Báo cáo bài viết thành công, hãy đợi quản trị viên xử lý')
        reset()
        handleCloseReportPost()
      },
      onError: () => {
        toast.error('Có lỗi xảy ra khi báo cáo')
      }
    })
  })

  return (
    <ModalLayout closeModal={handleCloseReportPost} title='Báo cáo bài viết' icon={FaFlag} size='md'>
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
            'Báo cáo'
          )}
        </button>
      </form>
    </ModalLayout>
  )
}
