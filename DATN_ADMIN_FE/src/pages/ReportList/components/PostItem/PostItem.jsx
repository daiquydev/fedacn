import moment from 'moment'
import useravatar from '../../../../assets/images/useravatar.jpg'
import { cutString } from '../../../../utils/helper'
import { getImageUrl } from '../../../../utils/imageUrl'
import { formatPostContentForAdmin } from '../../../../utils/formatPostContentForAdmin'
import { queryClient } from '../../../../main'
import { toast } from 'react-hot-toast'
import { useState } from 'react'
import { FaCheck, FaEye, FaTrash } from 'react-icons/fa'
import { acceptReportPost, rejectReportPost } from '../../../../apis/inspectorApi'
import ConfirmBox from '../../../../components/GlobalComponents/ConfirmBox'
import { useSafeMutation } from '../../../../hooks/useSafeMutation'
import PostInfoModal from './PostInfoModal'

function reporterBadgeClass(count) {
  if (count >= 5) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-bold'
  if (count >= 2) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 font-semibold'
  return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 font-semibold'
}

export default function PostItem({ post }) {
  const [openAccept, setOpenAccept] = useState(false)
  const [openReject, setOpenReject] = useState(false)
  const [showInfoModal, setShowInfoModal] = useState(false)

  const acceptPostsMutation = useSafeMutation({
    mutationFn: () => acceptReportPost(post._id)
  })

  const rejectPostsMutation = useSafeMutation({
    mutationFn: (body) => rejectReportPost(post._id, body)
  })

  const handleAccept = () => {
    acceptPostsMutation.mutate(null, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['report-list'] })
        toast.success('Đã giữ bài viết và xóa các báo cáo')
        setOpenAccept(false)
      },
      onError: () => toast.error('Thao tác thất bại')
    })
  }

  const handleReject = () => {
    rejectPostsMutation.mutate(
      { user_id: post?.user?._id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['report-list'] })
          queryClient.invalidateQueries({ queryKey: ['deleted-posts'] })
          toast.success('Đã gỡ bài viết')
          setOpenReject(false)
        },
        onError: () => toast.error('Không thể gỡ bài viết')
      }
    )
  }

  const reportCount = post?.report_count ?? 0
  const reportDetails = Array.isArray(post?.report_details) ? post.report_details : []
  const user = post?.user
  const contentRaw = formatPostContentForAdmin((post?.content || '').trim())

  return (
    <>
      {showInfoModal ? (
        <PostInfoModal
          post={post}
          onClose={() => setShowInfoModal(false)}
          reportCount={reportCount}
          reportDetails={reportDetails}
        />
      ) : null}
      <tr className='hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors align-top'>
        <td className='px-6 py-4 whitespace-nowrap'>
          <div className='flex gap-3 items-center'>
            <img
              className='rounded-full object-cover w-9 h-9 ring-2 ring-gray-100 dark:ring-slate-600'
              src={!user?.avatar || user.avatar === '' ? useravatar : getImageUrl(user.avatar)}
              alt={user?.name || ''}
            />
            <div>
              <div className='text-sm font-semibold text-gray-800 dark:text-white'>{user?.name || '—'}</div>
              {user?.user_name && <div className='text-xs text-gray-400'>@{user.user_name}</div>}
            </div>
          </div>
        </td>

        <td className='px-6 py-4 max-w-[200px]'>
          <p className='text-sm font-medium text-gray-800 dark:text-white line-clamp-2'>
            {contentRaw ? cutString(contentRaw, 100) : <span className='italic text-gray-400 font-normal'>Không có nội dung</span>}
          </p>
          <p className='text-xs text-gray-400 mt-1'>
            {post.createdAt ? moment(post.createdAt).format('DD/MM/YYYY HH:mm') : '—'}
          </p>
        </td>

        <td className='px-6 py-4 whitespace-nowrap align-top'>
          {reportCount > 0 ? (
            <span className={`px-2.5 py-1 inline-flex text-xs rounded-full ${reporterBadgeClass(reportCount)}`}>
              {reportCount} báo cáo
            </span>
          ) : (
            <span className='text-xs text-gray-400'>—</span>
          )}
        </td>

        <td className='px-6 py-4 min-w-[200px] max-w-xs'>
          <div className='space-y-2.5 max-h-52 overflow-y-auto pr-1'>
            {reportDetails.length === 0 ? (
              <p className='text-xs text-gray-400 italic'>Chưa có chi tiết (hãy tải lại sau khi cập nhật server)</p>
            ) : (
              reportDetails.map((row, idx) => {
                const rep = row.reporter
                const name = rep?.name || 'Người dùng'
                const uname = rep?.user_name
                const when = row.created_at ? moment(row.created_at).format('DD/MM/YYYY HH:mm') : '—'
                return (
                  <div
                    key={`rep-${row.created_at || idx}-${rep?._id || idx}`}
                    className='rounded-lg border border-gray-100 dark:border-slate-600 bg-gray-50/80 dark:bg-slate-800/50 p-2.5'
                  >
                    <div className='flex gap-2 items-start'>
                      <img
                        className='rounded-full object-cover w-8 h-8 shrink-0 mt-0.5'
                        src={rep?.avatar ? getImageUrl(rep.avatar) : useravatar}
                        alt=''
                      />
                      <div className='min-w-0 flex-1'>
                        <div className='flex flex-wrap items-center gap-2 gap-y-1'>
                          <span className='text-xs font-semibold text-gray-800 dark:text-white'>
                            {name}
                            {uname ? <span className='font-normal text-gray-500'> @{uname}</span> : null}
                          </span>
                        </div>
                        <div className='text-[10px] text-gray-400 mt-0.5'>{when}</div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </td>

        <td className='px-6 py-4 min-w-[220px] max-w-md align-top'>
          <div className='space-y-2.5 max-h-52 overflow-y-auto pr-1'>
            {reportDetails.length === 0 ? (
              <p className='text-xs text-gray-400 italic'>—</p>
            ) : (
              reportDetails.map((row, idx) => {
                const reason = (row.reason || '').trim() || '(Không ghi lý do)'
                return (
                  <div
                    key={`reason-${row.created_at || idx}-${row.reporter?._id || idx}`}
                    className='rounded-lg border border-gray-100 dark:border-slate-600 bg-gray-50/80 dark:bg-slate-800/50 p-2.5'
                  >
                    <p className='text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words'>{reason}</p>
                  </div>
                )
              })
            )}
          </div>
        </td>

        <td className='px-6 py-4 whitespace-nowrap'>
          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={() => setShowInfoModal(true)}
              title='Xem thông tin đầy đủ bài viết'
              className='p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30 rounded-lg transition-colors inline-flex'
            >
              <FaEye size={16} />
            </button>
            <button
              type='button'
              onClick={() => setOpenAccept(true)}
              title='Giữ bài viết (xóa báo cáo)'
              className='p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30 rounded-lg transition-colors'
            >
              <FaCheck size={14} />
            </button>
            <button
              type='button'
              onClick={() => setOpenReject(true)}
              title='Gỡ bài viết'
              className='p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors'
            >
              <FaTrash size={14} />
            </button>
          </div>
        </td>
      </tr>

      {openAccept && (
        <ConfirmBox
          closeModal={() => setOpenAccept(false)}
          handleDelete={handleAccept}
          isPending={acceptPostsMutation.isPending}
          title='Xác nhận'
          subtitle='Giữ bài viết và xóa toàn bộ báo cáo? Bài viết vẫn hiển thị bình thường với người dùng.'
          tilteButton='Giữ bài viết'
          danger={false}
        />
      )}
      {openReject && (
        <ConfirmBox
          closeModal={() => setOpenReject(false)}
          handleDelete={handleReject}
          isPending={rejectPostsMutation.isPending}
          title='Xác nhận gỡ bài viết'
          subtitle='Bài viết sẽ bị ẩn khỏi hệ thống và chuyển sang danh sách bài viết đã xóa.'
          tilteButton='Gỡ bài viết'
        />
      )}
    </>
  )
}
