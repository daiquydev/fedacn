import moment from 'moment'
import useravatar from '../../../../assets/images/useravatar.jpg'
import { cutString } from '../../../../utils/helper'
import { queryClient } from '../../../../main'
import { toast } from 'react-hot-toast'
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { FaUndo } from 'react-icons/fa'
import { restorePost } from '../../../../apis/inspectorApi'
import ConfirmBox from '../../../../components/GlobalComponents/ConfirmBox'

export default function DeletedPostItem({ post }) {
  const [openRestore, setOpenRestore] = useState(false)

  const restoreMutation = useMutation({
    mutationFn: () => restorePost(post._id)
  })

  const handleRestore = () => {
    restoreMutation.mutate(null, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['deleted-posts'] })
        queryClient.invalidateQueries({ queryKey: ['report-list'] })
        toast.success('Khôi phục bài viết thành công')
        setOpenRestore(false)
      }
    })
  }

  return (
    <>
      <tr className='hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors'>
        {/* Author */}
        <td className='px-6 py-4 whitespace-nowrap'>
          <div className='flex gap-3 items-center'>
            <img
              className='rounded-full object-cover w-9 h-9 ring-2 ring-gray-100 dark:ring-slate-600'
              src={post.user?.avatar === '' ? useravatar : post.user?.avatar}
              alt={post.user?.name}
            />
            <div>
              <div className='text-sm font-semibold text-gray-800 dark:text-white'>{post.user?.name}</div>
              <div className='text-xs text-gray-400'>@{post.user?.user_name}</div>
            </div>
          </div>
        </td>

        {/* Content */}
        <td className='px-6 py-4 max-w-[200px]'>
          <p className='text-sm text-gray-600 dark:text-gray-300 line-clamp-2'>
            {post.content === '' ? <span className='italic text-gray-400'>Bài viết không có nội dung</span> : cutString(post.content, 60)}
          </p>
        </td>

        {/* Date */}
        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400'>
          {moment(post.createdAt).format('DD/MM/YYYY')}
        </td>

        {/* Actions */}
        <td className='px-6 py-4 whitespace-nowrap'>
          <div className='flex items-center gap-2'>
            <button
              onClick={() => setOpenRestore(true)}
              title='Khôi phục bài viết'
              className='p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30 rounded-lg transition-colors flex items-center gap-1.5'
            >
              <FaUndo size={14} />
              <span className='text-xs font-semibold'>Khôi phục</span>
            </button>
          </div>
        </td>
      </tr>

      {/* Confirm dialog rendered outside table row */}
      {openRestore && (
        <ConfirmBox
          closeModal={() => setOpenRestore(false)}
          handleDelete={handleRestore}
          isPending={restoreMutation.isPending}
          title={'Xác nhận khôi phục'}
          subtitle={'Bạn có chắc chắn muốn khôi phục bài viết này không? Bài viết sẽ hiển thị lại trên hệ thống.'}
          tilteButton={'Khôi phục'}
          danger={false}
        />
      )}
    </>
  )
}
