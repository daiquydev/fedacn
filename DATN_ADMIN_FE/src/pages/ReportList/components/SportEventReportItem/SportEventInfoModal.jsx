import moment from 'moment'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  FaTimes,
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaUsers,
  FaBullseye,
  FaCog,
  FaUser,
  FaFlag
} from 'react-icons/fa'
import { MdVideocam } from 'react-icons/md'
import { getImageUrl } from '../../../../utils/imageUrl'
import useravatar from '../../../../assets/images/useravatar.jpg'

function getStatusBadge(event) {
  if (!event?.endDate || !event?.startDate) {
    return { text: '—', color: 'bg-gray-500', dot: false }
  }
  const now = moment()
  const start = moment(event.startDate)
  const end = moment(event.endDate)
  if (now.isAfter(end)) return { text: 'Đã kết thúc', color: 'bg-gray-500', dot: false }
  if (now.isBefore(start)) return { text: 'Sắp diễn ra', color: 'bg-amber-500', dot: false }
  return { text: 'Đang diễn ra', color: 'bg-emerald-500', dot: true }
}

function InfoCard({ icon: Icon, label, value, color, truncate }) {
  if (value === undefined || value === null || value === '') return null
  return (
    <div className='bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3'>
      <div className='flex items-center gap-1.5 mb-1'>
        <Icon className={`text-xs ${color}`} />
        <span className='text-[10px] text-gray-400 uppercase tracking-wider font-medium'>{label}</span>
      </div>
      <p className={`text-sm font-semibold text-gray-800 dark:text-white ${truncate ? 'truncate' : ''}`}>{String(value)}</p>
    </div>
  )
}

function reportCountBadgeClass(count) {
  if (count >= 5) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-bold'
  if (count >= 2) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 font-semibold'
  return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 font-semibold'
}

export default function SportEventInfoModal({ event, onClose, reportCount, reportDetails = [] }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!event) return null

  const status = getStatusBadge(event)
  const creator = event.creator
  const imgSrc = event.image ? getImageUrl(event.image) : null
  const isIndoor = event.eventType === 'Trong nhà'

  const node = (
    <div
      className='fixed inset-0 z-[240] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm'
      role='dialog'
      aria-modal='true'
      aria-labelledby='sport-event-info-title'
      onClick={onClose}
    >
      <div
        className='bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-100 dark:border-slate-700'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='flex items-start justify-between gap-3 p-4 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/40 dark:to-violet-950/40'>
          <div className='flex gap-4 min-w-0 flex-1'>
            <div className='w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-slate-600 shadow-md'>
              {imgSrc ? (
                <img src={imgSrc} alt='' className='w-full h-full object-cover' />
              ) : (
                <div className='w-full h-full flex items-center justify-center text-gray-400 text-xs'>No img</div>
              )}
            </div>
            <div className='min-w-0'>
              <h2 id='sport-event-info-title' className='text-lg font-bold text-gray-900 dark:text-white leading-tight'>
                {event.name}
              </h2>
              <div className='flex flex-wrap items-center gap-2 mt-2'>
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium text-white px-2.5 py-1 rounded-full ${status.color}`}>
                  {status.dot && <span className='w-1.5 h-1.5 rounded-full bg-white animate-pulse' />}
                  {status.text}
                </span>
              </div>
              <p className='text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1 flex-wrap'>
                <FaCalendarAlt className='shrink-0' />
                {moment(event.startDate).format('DD/MM/YYYY HH:mm')} — {moment(event.endDate).format('DD/MM/YYYY HH:mm')}
              </p>
              <p className='text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1'>
                <FaUsers className='shrink-0' />
                {event.participants ?? 0}/{event.maxParticipants ?? '—'} người tham gia
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
              <div className='space-y-2'>
                {reportDetails.map((row, idx) => {
                  const rep = row.reporter
                  const name = rep?.name || 'Người dùng'
                  const uname = rep?.user_name
                  const when = row.created_at ? moment(row.created_at).format('DD/MM/YYYY HH:mm') : '—'
                  return (
                    <div key={`mod-rep-${row.created_at || idx}-${rep?._id || idx}`} className='flex gap-2 items-center text-sm'>
                      <img
                        src={rep?.avatar ? getImageUrl(rep.avatar) : useravatar}
                        alt=''
                        className='w-8 h-8 rounded-full object-cover shrink-0'
                      />
                      <div className='min-w-0'>
                        <span className='font-semibold text-gray-800 dark:text-white'>
                          {name}
                          {uname ? <span className='font-normal text-gray-500'> @{uname}</span> : null}
                        </span>
                        <span className='text-xs text-gray-400 ml-2'>{when}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Lưới tổng quan — giống MySportEvents OverviewSubTab */}
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
            <InfoCard icon={FaCalendarAlt} label='Bắt đầu' value={event.startDate ? moment(event.startDate).format('DD/MM/YYYY') : null} color='text-blue-500' />
            <InfoCard icon={FaClock} label='Giờ bắt đầu' value={event.startDate ? moment(event.startDate).format('HH:mm') : null} color='text-green-500' />
            <InfoCard
              icon={isIndoor ? MdVideocam : FaMapMarkerAlt}
              label={isIndoor ? 'Loại' : 'Địa điểm'}
              value={isIndoor ? 'Trong nhà' : (event.location || '—')}
              color='text-violet-500'
              truncate={!isIndoor}
            />
            <InfoCard
              icon={FaBullseye}
              label='Mục tiêu'
              value={event.targetValue > 0 ? `${event.targetValue} ${event.targetUnit || ''}`.trim() : 'Không có'}
              color='text-orange-500'
            />
          </div>

          {/* Thông tin sự kiện — giống SettingsSubTab */}
          <div className='bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5 space-y-4'>
            <h4 className='text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2'>
              <FaCog className='text-gray-400' /> Thông tin sự kiện
            </h4>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm'>
              <div>
                <span className='text-gray-400 text-xs block mb-0.5'>Thể loại</span>
                <span className='text-gray-800 dark:text-white font-medium'>{event.category || '—'}</span>
              </div>
              <div>
                <span className='text-gray-400 text-xs block mb-0.5'>Loại sự kiện</span>
                <span className='text-gray-800 dark:text-white font-medium'>{event.eventType || '—'}</span>
              </div>
              <div>
                <span className='text-gray-400 text-xs block mb-0.5'>Số người tối đa</span>
                <span className='text-gray-800 dark:text-white font-medium'>{event.maxParticipants ?? '—'} người</span>
              </div>
              {event.difficulty ? (
                <div>
                  <span className='text-gray-400 text-xs block mb-0.5'>Độ khó</span>
                  <span className='text-gray-800 dark:text-white font-medium'>{event.difficulty}</span>
                </div>
              ) : null}
              {event.organizer ? (
                <div className='sm:col-span-2'>
                  <span className='text-gray-400 text-xs block mb-0.5'>Ban tổ chức (text)</span>
                  <span className='text-gray-800 dark:text-white font-medium'>{event.organizer}</span>
                </div>
              ) : null}
              <div className='sm:col-span-2'>
                <span className='text-gray-400 text-xs block mb-0.5'>{isIndoor ? 'Link / Video call' : 'Địa điểm chi tiết'}</span>
                <span className='text-gray-800 dark:text-white font-medium break-words'>{event.location || '—'}</span>
              </div>
              {event.address ? (
                <div className='sm:col-span-2'>
                  <span className='text-gray-400 text-xs block mb-0.5'>Địa chỉ</span>
                  <span className='text-gray-800 dark:text-white font-medium break-words'>{event.address}</span>
                </div>
              ) : null}
              <div>
                <span className='text-gray-400 text-xs block mb-0.5'>Yêu cầu Strava</span>
                <span className='text-gray-800 dark:text-white font-medium'>{event.requireStrava ? 'Có' : 'Không'}</span>
              </div>
            </div>

            {creator ? (
              <div className='pt-3 border-t border-gray-200 dark:border-slate-600 flex items-center gap-3'>
                <FaUser className='text-indigo-500 shrink-0' />
                <img
                  src={creator.avatar ? getImageUrl(creator.avatar) : useravatar}
                  alt=''
                  className='w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-slate-600'
                />
                <div className='min-w-0'>
                  <div className='text-xs text-gray-400'>Người tạo</div>
                  <div className='font-semibold text-gray-800 dark:text-white truncate'>
                    {creator.name || '—'}
                    {creator.user_name ? <span className='font-normal text-gray-500'> @{creator.user_name}</span> : null}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className='bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4'>
            <h4 className='text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2'>Mô tả</h4>
            <p className='text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap'>{event.description || 'Chưa có mô tả.'}</p>
          </div>

          {event.detailedDescription ? (
            <div className='bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4'>
              <h4 className='text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2'>Mô tả chi tiết</h4>
              <p className='text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap'>{event.detailedDescription}</p>
            </div>
          ) : null}

          {(event.requirements || event.benefits) ? (
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              {event.requirements ? (
                <div className='rounded-xl p-4 bg-blue-50/80 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40'>
                  <h4 className='text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2'>Yêu cầu tham gia</h4>
                  <p className='text-sm text-blue-800 dark:text-blue-100/90 whitespace-pre-wrap'>{event.requirements}</p>
                </div>
              ) : null}
              {event.benefits ? (
                <div className='rounded-xl p-4 bg-emerald-50/80 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/40'>
                  <h4 className='text-sm font-semibold text-emerald-900 dark:text-emerald-200 mb-2'>Quyền lợi</h4>
                  <p className='text-sm text-emerald-800 dark:text-emerald-100/90 whitespace-pre-wrap'>{event.benefits}</p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className='p-4 border-t border-gray-100 dark:border-slate-700 flex justify-end bg-gray-50/80 dark:bg-slate-900/50'>
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
