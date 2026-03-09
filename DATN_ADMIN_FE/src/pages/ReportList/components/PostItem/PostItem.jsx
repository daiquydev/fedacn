import moment from 'moment'
import { Link } from 'react-router-dom'
import useravatar from '../../../../assets/images/useravatar.jpg'
import { cutString } from '../../../../utils/helper'
import { queryClient } from '../../../../main'
import { toast } from 'react-hot-toast'
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { FaEye, FaCheck, FaTrash } from 'react-icons/fa'
import { acceptReportPost, rejectReportPost } from '../../../../apis/inspectorApi'
import ConfirmBox from '../../../../components/GlobalComponents/ConfirmBox'

export default function PostItem({ post }) {
  const [openAccept, setOpenAccept] = useState(false)
  const [openReject, setOpenReject] = useState(false)

  const acceptPostsMutation = useMutation({
    mutationFn: () => acceptReportPost(post._id)
  })

  const rejectPostsMutation = useMutation({
    mutationFn: (body) => rejectReportPost(post._id, body)
  })

  const handleAccept = () => {
    acceptPostsMutation.mutate(null, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['report-list'] })
        toast.success('Giữ bài viết thành công')
        setOpenAccept(false)
      }
    })
  }

  const handleReject = () => {
    rejectPostsMutation.mutate({ user_id: post?.user._id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['report-list'] })
        toast.success('Xóa bài viết thành công')
        setOpenReject(false)
      }
    })
  }

  const reportCount = post?.report_count ?? 0
  const isHighRisk = reportCount >= 5
  const isModerate = reportCount >= 2 && !isHighRisk

  return (
    <>
      <tr className='hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors'>
        {/* Author */}
        <td className='px-6 py-4 whitespace-nowrap'>
          <div className='flex gap-3 items-center'>
            <img
              className='rounded-full object-cover w-9 h-9 ring-2 ring-gray-100 dark:ring-slate-600'
              src={post.user.avatar === '' ? useravatar : post.user.avatar}
              alt={post.user.name}
            />
            <div>
              <div className='text-sm font-semibold text-gray-800 dark:text-white'>{post.user.name}</div>
              <div className='text-xs text-gray-400'>@{post.user.user_name}</div>
            </div>
          </div>
        </td>

        {/* Content */}
        <td className='px-6 py-4 max-w-[200px]'>
          <p className='text-sm text-gray-600 dark:text-gray-300 line-clamp-2'>
            {post.content === '' ? <span className='italic text-gray-400'>Bài viết không có nội dung</span> : cutString(post.content, 60)}
          </p>
        </td>

        {/* Report count badge */}
        <td className='px-6 py-4 whitespace-nowrap'>
          {isHighRisk ? (
            <span className='px-2.5 py-1 inline-flex items-center gap-1 text-xs font-bold rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'>
              🚨 {reportCount} lần
            </span>
          ) : isModerate ? (
            <span className='px-2.5 py-1 inline-flex items-center gap-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'>
              ⚠️ {reportCount} lần
            </span>
          ) : (
            <span className='px-2.5 py-1 inline-flex items-center gap-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'>
              🏳️ {reportCount} lần
            </span>
          )}
        </td>

        {/* Date */}
        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400'>
          {moment(post.createdAt).format('DD/MM/YYYY')}
        </td>

        {/* Actions */}
        <td className='px-6 py-4 whitespace-nowrap'>
          <div className='flex items-center gap-2'>
            {/* View */}
            <Link
              to={`/reports/${post._id}`}
              title='Xem chi tiết'
              className='p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30 rounded-lg transition-colors'
            >
              <FaEye size={14} />
            </Link>

            {/* Keep (accept) */}
            <button
              onClick={() => setOpenAccept(true)}
              title='Giữ bài viết'
              className='p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30 rounded-lg transition-colors'
            >
              <FaCheck size={14} />
            </button>

            {/* Remove (reject) */}
            <button
              onClick={() => setOpenReject(true)}
              title='Xóa bài viết'
              className='p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors'
            >
              <FaTrash size={14} />
            </button>
          </div>

          {openAccept && (
            <ConfirmBox
              closeModal={() => setOpenAccept(false)}
              handleDelete={handleAccept}
              isPending={acceptPostsMutation.isPending}
              title={'Xác nhận duyệt'}
              subtitle={'Bạn có chắc chắn muốn giữ bài viết này không?'}
              tilteButton={'Giữ bài viết'}
            />
          )}
          {openReject && (
            <ConfirmBox
              closeModal={() => setOpenReject(false)}
              handleDelete={handleReject}
              isPending={rejectPostsMutation.isPending}
              title={'Xác nhận xóa'}
              subtitle={'Bạn có chắc chắn muốn xóa bài viết này không?'}
              tilteButton={'Xóa bài viết'}
            />
          )}
        </td>
      </tr>
    </>
  )
}
