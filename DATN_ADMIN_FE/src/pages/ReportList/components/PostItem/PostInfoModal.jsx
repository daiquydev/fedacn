import moment from 'moment'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { FaTimes, FaUser, FaFlag, FaCalendarAlt } from 'react-icons/fa'
import { getImageUrl } from '../../../../utils/imageUrl'
import { formatPostContentForAdmin } from '../../../../utils/formatPostContentForAdmin'
import useravatar from '../../../../assets/images/useravatar.jpg'

function reportCountBadgeClass(count) {
  if (count >= 5) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-bold'
  if (count >= 2) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 font-semibold'
  return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 font-semibold'
}

export default function PostInfoModal({ post, onClose, reportCount, reportDetails = [] }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!post) return null

  const user = post.user
  const images = Array.isArray(post.images) ? post.images : []
  const thumb = images[0] ? getImageUrl(images[0]) : null
  const displayContent = formatPostContentForAdmin(post.content?.trim() ? post.content : '')
  const titleText =
    displayContent.length > 0
      ? displayContent.slice(0, 120) + (displayContent.length > 120 ? '…' : '')
      : 'Bài viết không có nội dung'

  const node = (
    <div
      className='fixed inset-0 z-[240] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm'
      role='dialog'
      aria-modal='true'
      aria-labelledby='post-report-info-title'
      onClick={onClose}
    >
      <div
        className='bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-100 dark:border-slate-700'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='flex items-start justify-between gap-3 p-4 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-rose-50 to-orange-50 dark:from-rose-950/40 dark:to-orange-950/40'>
          <div className='flex gap-4 min-w-0 flex-1'>
            <div className='w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-slate-600 shadow-md'>
              {thumb ? (
                <img src={thumb} alt='' className='w-full h-full object-cover' />
              ) : (
                <div className='w-full h-full flex items-center justify-center text-gray-400 text-xs'>Không ảnh</div>
              )}
            </div>
            <div className='min-w-0'>
              <h2 id='post-report-info-title' className='text-lg font-bold text-gray-900 dark:text-white leading-tight line-clamp-2'>
                {titleText}
              </h2>
              <p className='text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1'>
                <FaCalendarAlt className='shrink-0' />
                {post.createdAt ? moment(post.createdAt).format('DD/MM/YYYY HH:mm') : '—'}
              </p>
            </div>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='p-2 rounded-lg hover:bg-white/80 dark:hover:bg-slate-700 text-gray-500 transition shrink-0'
            aria-label='Đóng'
          >
            <FaTimes className='text-lg' />
          </button>
        </div>

        <div className='overflow-y-auto flex-1 p-5 space-y-5'>
          {reportDetails.length > 0 && (
            <div className='rounded-xl border border-rose-100 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 p-4'>
              <div className='flex flex-wrap items-center gap-2 mb-3'>
                <FaFlag className='text-rose-500 text-sm shrink-0' />
                <h4 className='text-sm font-semibold text-gray-800 dark:text-white'>Người báo cáo</h4>
                {reportCount > 0 && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${reportCountBadgeClass(reportCount)}`}>
                    {reportCount} báo cáo
                  </span>
                )}
              </div>
              <div className='space-y-3'>
                {reportDetails.map((row, idx) => {
                  const rep = row.reporter
                  const name = rep?.name || 'Người dùng'
                  const uname = rep?.user_name
                  const when = row.created_at ? moment(row.created_at).format('DD/MM/YYYY HH:mm') : '—'
                  const reason = (row.reason || '').trim() || '(Không ghi lý do)'
                  return (
                    <div
                      key={`mod-post-rep-${row.created_at || idx}-${rep?._id || idx}`}
                      className='rounded-lg border border-gray-100 dark:border-slate-600 bg-white/80 dark:bg-slate-800/50 p-3'
                    >
                      <div className='flex gap-2 items-start'>
                        <img
                          src={rep?.avatar ? getImageUrl(rep.avatar) : useravatar}
                          alt=''
                          className='w-8 h-8 rounded-full object-cover shrink-0 mt-0.5'
                        />
                        <div className='min-w-0 flex-1'>
                          <div className='text-xs font-semibold text-gray-800 dark:text-white'>
                            {name}
                            {uname ? <span className='font-normal text-gray-500'> @{uname}</span> : null}
                          </div>
                          <div className='text-[10px] text-gray-400 mt-0.5'>{when}</div>
                          <p className='text-sm text-gray-700 dark:text-gray-300 mt-2 whitespace-pre-wrap break-words'>{reason}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {user ? (
            <div className='bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 flex items-center gap-3'>
              <FaUser className='text-rose-500 shrink-0' />
              <img
                src={user.avatar ? getImageUrl(user.avatar) : useravatar}
                alt=''
                className='w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-slate-600'
              />
              <div className='min-w-0'>
                <div className='text-xs text-gray-400'>Người viết</div>
                <div className='font-semibold text-gray-800 dark:text-white truncate'>
                  {user.name || '—'}
                  {user.user_name ? <span className='font-normal text-gray-500'> @{user.user_name}</span> : null}
                </div>
              </div>
            </div>
          ) : null}

          <div className='bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4'>
            <h4 className='text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2'>Nội dung bài viết</h4>
            <p className='text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap break-words'>
              {displayContent.length > 0 ? displayContent : 'Không có nội dung.'}
            </p>
          </div>

          {images.length > 0 ? (
            <div className='bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4'>
              <h4 className='text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2'>Ảnh đính kèm</h4>
              <div className='grid gap-2 grid-cols-2 sm:grid-cols-3'>
                {images.map((url, index) => (
                  <img key={index} className='object-cover w-full h-32 rounded-lg' src={getImageUrl(url)} alt='' />
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className='p-4 border-t border-gray-100 dark:border-slate-700 flex flex-wrap justify-end bg-gray-50/80 dark:bg-slate-900/50'>
          <button
            type='button'
            onClick={onClose}
            className='inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-800 dark:text-gray-200 text-sm font-semibold transition'
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(node, document.body) : node
}
