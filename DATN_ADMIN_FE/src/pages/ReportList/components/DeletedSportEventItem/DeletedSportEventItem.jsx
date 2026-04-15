import moment from 'moment'
import useravatar from '../../../../assets/images/useravatar.jpg'
import { cutString } from '../../../../utils/helper'
import { getImageUrl } from '../../../../utils/imageUrl'
import { queryClient } from '../../../../main'
import { toast } from 'react-hot-toast'
import { useState } from 'react'
import { FaEye, FaUndo } from 'react-icons/fa'
import { restoreSportEvent } from '../../../../apis/inspectorApi'
import ConfirmBox from '../../../../components/GlobalComponents/ConfirmBox'
import { useSafeMutation } from '../../../../hooks/useSafeMutation'
import SportEventInfoModal from '../SportEventReportItem/SportEventInfoModal'

export default function DeletedSportEventItem({ event: ev }) {
  const [openRestore, setOpenRestore] = useState(false)
  const [showInfoModal, setShowInfoModal] = useState(false)

  const restoreMutation = useSafeMutation({
    mutationFn: () => restoreSportEvent(ev._id)
  })

  const handleRestore = () => {
    restoreMutation.mutate(null, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['deleted-sport-events'] })
        queryClient.invalidateQueries({ queryKey: ['deleted-sport-events-meta'] })
        queryClient.invalidateQueries({ queryKey: ['sport-event-reports'] })
        queryClient.invalidateQueries({ queryKey: ['sport-event-reports-meta'] })
        toast.success('Đã khôi phục sự kiện')
        setOpenRestore(false)
      },
      onError: () => toast.error('Không thể khôi phục sự kiện')
    })
  }

  const creator = ev?.creator
  const reportCount = ev?.report_count ?? 0
  const deletedAt = ev?.deletedAt
  const reportDetails = Array.isArray(ev?.report_details) ? ev.report_details : []

  return (
    <>
      {showInfoModal ? (
        <SportEventInfoModal
          event={ev}
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
              {creator?.user_name && <div className='text-xs text-gray-400'>@{creator.user_name}</div>}
            </div>
          </div>
        </td>

        <td className='px-6 py-4 max-w-[240px]'>
          <p className='text-sm font-medium text-gray-800 dark:text-white line-clamp-2'>{ev.name}</p>
          <p className='text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mt-0.5'>
            {!ev.description?.trim() ? (
              <span className='italic text-gray-400'>Không có mô tả</span>
            ) : (
              cutString(ev.description, 100)
            )}
          </p>
        </td>

        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400'>
          {deletedAt ? moment(deletedAt).format('DD/MM/YYYY HH:mm') : '—'}
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
                    key={`reason-del-${row.created_at || idx}-${row.reporter?._id || idx}`}
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
              title='Xem thông tin sự kiện'
              className='p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30 rounded-lg transition-colors inline-flex'
            >
              <FaEye size={16} />
            </button>
            <button
              type='button'
              onClick={() => setOpenRestore(true)}
              title='Khôi phục sự kiện'
              className='p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30 rounded-lg transition-colors inline-flex items-center gap-1.5'
            >
              <FaUndo size={14} />
              <span className='text-xs font-semibold'>Khôi phục</span>
            </button>
          </div>
        </td>
      </tr>

      {openRestore && (
        <ConfirmBox
          closeModal={() => setOpenRestore(false)}
          handleDelete={handleRestore}
          isPending={restoreMutation.isPending}
          title='Xác nhận khôi phục'
          subtitle='Sự kiện sẽ hiển thị lại cho người dùng (trừ khi bị gỡ lần nữa).'
          tilteButton='Khôi phục'
          danger={false}
        />
      )}
    </>
  )
}
