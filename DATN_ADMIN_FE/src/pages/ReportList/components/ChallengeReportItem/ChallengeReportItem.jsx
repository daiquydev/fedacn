import moment from 'moment'
import useravatar from '../../../../assets/images/useravatar.jpg'
import { cutString } from '../../../../utils/helper'
import { getImageUrl } from '../../../../utils/imageUrl'
import { queryClient } from '../../../../main'
import { toast } from 'react-hot-toast'
import { useState } from 'react'
import { FaCheck, FaEye, FaTrash } from 'react-icons/fa'
import { acceptChallengeReport, rejectChallengeReport } from '../../../../apis/inspectorApi'
import ConfirmBox from '../../../../components/GlobalComponents/ConfirmBox'
import { useSafeMutation } from '../../../../hooks/useSafeMutation'
import ChallengeInfoModal from './ChallengeInfoModal'

function reporterBadgeClass(count) {
  if (count >= 5) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-bold'
  if (count >= 2) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 font-semibold'
  return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 font-semibold'
}

export default function ChallengeReportItem({ challenge: ch }) {
  const [openAccept, setOpenAccept] = useState(false)
  const [openReject, setOpenReject] = useState(false)
  const [showInfoModal, setShowInfoModal] = useState(false)

  const acceptMutation = useSafeMutation({
    mutationFn: () => acceptChallengeReport(ch._id)
  })

  const rejectMutation = useSafeMutation({
    mutationFn: (body) => rejectChallengeReport(ch._id, body)
  })

  const handleAccept = () => {
    acceptMutation.mutate(null, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['challenge-reports'] })
        queryClient.invalidateQueries({ queryKey: ['challenge-reports-meta'] })
        toast.success('Đã giữ thử thách và xóa các báo cáo')
        setOpenAccept(false)
      },
      onError: () => toast.error('Thao tác thất bại')
    })
  }

  const creatorUserId = ch?.creator_id ?? ch?.creator?._id

  const handleReject = () => {
    rejectMutation.mutate(
      { user_id: creatorUserId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['challenge-reports'] })
          queryClient.invalidateQueries({ queryKey: ['challenge-reports-meta'] })
          queryClient.invalidateQueries({ queryKey: ['deleted-challenges'] })
          queryClient.invalidateQueries({ queryKey: ['deleted-challenges-meta'] })
          toast.success('Đã gỡ thử thách')
          setOpenReject(false)
        },
        onError: () => toast.error('Không thể gỡ thử thách')
      }
    )
  }

  const reportCount = ch?.report_count ?? 0
  const creator = ch?.creator
  const reportDetails = Array.isArray(ch?.report_details) ? ch.report_details : []

  return (
    <>
      {showInfoModal ? (
        <ChallengeInfoModal
          challenge={ch}
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
              src={!creator?.avatar || creator.avatar === '' ? useravatar : getImageUrl(creator.avatar)}
              alt={creator?.name || ''}
            />
            <div>
              <div className='text-sm font-semibold text-gray-800 dark:text-white'>{creator?.name || '—'}</div>
              {creator?.user_name && (
                <div className='text-xs text-gray-400'>@{creator.user_name}</div>
              )}
            </div>
          </div>
        </td>

        <td className='px-6 py-4 max-w-[200px]'>
          <p className='text-sm font-medium text-gray-800 dark:text-white line-clamp-2'>{ch.title}</p>
          <p className='text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mt-0.5'>
            {ch.description === '' || !ch.description ? (
              <span className='italic text-gray-400'>Không có mô tả</span>
            ) : (
              cutString(ch.description, 100)
            )}
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
                    <p className='text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words'>
                      {reason}
                    </p>
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
              title='Xem thông tin đầy đủ thử thách'
              className='p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30 rounded-lg transition-colors inline-flex'
            >
              <FaEye size={16} />
            </button>
            <button
              onClick={() => setOpenAccept(true)}
              title='Giữ thử thách (xóa báo cáo)'
              className='p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30 rounded-lg transition-colors'
            >
              <FaCheck size={14} />
            </button>
            <button
              type='button'
              onClick={() => setOpenReject(true)}
              title='Gỡ thử thách (soft delete)'
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
          isPending={acceptMutation.isPending}
          title='Xác nhận'
          subtitle='Giữ thử thách và xóa toàn bộ báo cáo? Thử thách vẫn hiển thị bình thường với người dùng.'
          tilteButton='Giữ thử thách'
          danger={false}
        />
      )}
      {openReject && (
        <ConfirmBox
          closeModal={() => setOpenReject(false)}
          handleDelete={handleReject}
          isPending={rejectMutation.isPending}
          title='Xác nhận gỡ thử thách'
          subtitle='Thử thách sẽ bị ẩn khỏi hệ thống và chuyển sang danh sách thử thách đã xóa.'
          tilteButton='Gỡ thử thách'
        />
      )}
    </>
  )
}
