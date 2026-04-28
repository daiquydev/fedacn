import { useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { FaRunning, FaCalendarAlt, FaUsers, FaArrowRight, FaMapMarkerAlt } from 'react-icons/fa'
import { FiSearch } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { getJoinedEvents, getPublicUserJoinedEvents } from '../../../../apis/sportEventApi'
import Loading from '../../../../components/GlobalComponents/Loading'
import moment from 'moment'

const LIMIT = 9

const fadeIn = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
}

function EventCard({ event }) {
  const isOngoing = moment().isBetween(event.startDate, event.endDate)
  const isPast = moment().isAfter(event.endDate)

  return (
    <motion.div variants={fadeIn}>
      <Link
        to={`/sport-event/${event._id}`}
        className='block bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300 group'
      >
        <div className='relative h-40 overflow-hidden'>
          <img
            src={event.image || 'https://via.placeholder.com/400x200'}
            alt={event.name}
            className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'
          />
          <div className='absolute inset-0 bg-gradient-to-t from-black/60 to-transparent' />
          <div className='absolute top-3 right-3'>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${isOngoing
                ? 'bg-emerald-500/90 text-white'
                : isPast
                  ? 'bg-gray-500/90 text-white'
                  : 'bg-blue-500/90 text-white'
              }`}>
              {isOngoing ? 'Đang diễn ra' : isPast ? 'Đã kết thúc' : 'Sắp diễn ra'}
            </span>
          </div>
          <div className='absolute bottom-3 left-3 right-3'>
            <h3 className='text-white font-bold text-sm truncate'>{event.name}</h3>
          </div>
        </div>
        <div className='p-4 space-y-2'>
          <div className='flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400'>
            <FaCalendarAlt className='text-emerald-500 flex-shrink-0' />
            <span>{moment(event.startDate).format('DD/MM/YYYY')} - {moment(event.endDate).format('DD/MM/YYYY')}</span>
          </div>
          <div className='flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400'>
            <FaMapMarkerAlt className='text-red-400 flex-shrink-0' />
            <span className='truncate'>{event.location || event.eventType}</span>
          </div>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400'>
              <FaUsers className='text-blue-400' />
              <span>{event.participants} người</span>
            </div>
            <span className='px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300'>{event.category}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default function MeSportEvents({ userId }) {
  const isPublic = Boolean(userId)
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: isPublic
      ? ['publicUserEvents', userId, { page, limit: LIMIT }]
      : ['joinedEvents', { page, limit: LIMIT }],
    queryFn: () =>
      isPublic
        ? getPublicUserJoinedEvents(userId, { page, limit: LIMIT })
        : getJoinedEvents({ page, limit: LIMIT }),
    placeholderData: keepPreviousData
  })

  const raw = data?.data?.result
  const events = Array.isArray(raw) ? raw : Array.isArray(raw?.events) ? raw.events : []
  const filteredEvents = events.filter((event) => {
    const normalized = keyword.trim().toLowerCase()
    if (!normalized) return true
    const searchable = [event?.name, event?.category, event?.location, event?.eventType]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return searchable.includes(normalized)
  })
  const totalPage = raw?.totalPage || 1

  if (isLoading) {
    return <Loading className='flex justify-center py-20' />
  }

  if (events.length === 0 && page === 1) {
    return (
      <div className='text-center py-16'>
        <FaRunning className='text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4' />
        <h3 className='text-lg font-medium text-gray-500 dark:text-gray-400'>Chưa tham gia sự kiện nào</h3>
        {!isPublic && (
          <>
            <p className='text-sm text-gray-400 dark:text-gray-500 mt-1'>Tham gia sự kiện thể thao để bắt đầu!</p>
            <Link to='/sport-event' className='inline-flex items-center gap-2 mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors'>
              Khám phá sự kiện <FaArrowRight />
            </Link>
          </>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className='mb-5'>
        <label className='relative block'>
          <FiSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' />
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder='Tìm sự kiện theo tên, loại hoặc địa điểm...'
            className='w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-2.5 pl-10 pr-4 text-sm text-gray-700 dark:text-gray-100 outline-none focus:border-emerald-500'
          />
        </label>
      </div>

      {filteredEvents.length === 0 && (
        <div className='text-center py-10 text-sm text-gray-500 dark:text-gray-400'>
          Không tìm thấy sự kiện phù hợp với từ khóa "{keyword}".
        </div>
      )}

      <motion.div variants={stagger} initial='hidden' animate='visible'>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          {filteredEvents.map((event) => (
            <EventCard key={event._id} event={event} />
          ))}
        </div>
      </motion.div>

      {/* Pagination — cùng style Challenge.jsx */}
      {totalPage > 1 && !keyword.trim() && (
        <div className='flex items-center justify-center gap-2 mt-8'>
          <button
            disabled={page <= 1}
            onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            className='px-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium'
          >
            ← Trước
          </button>
          {Array.from({ length: totalPage }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPage || Math.abs(p - page) <= 2)
            .reduce((acc, p, i, arr) => {
              if (i > 0 && p - arr[i - 1] > 1) acc.push('ellipsis-' + p)
              acc.push(p)
              return acc
            }, [])
            .map(p =>
              typeof p === 'number' ? (
                <button
                  key={p}
                  onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                  className={`w-9 h-9 text-sm rounded-lg font-semibold transition-colors ${p === page ? 'bg-emerald-600 text-white shadow-md' : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                >
                  {p}
                </button>
              ) : (
                <span key={p} className='px-1 text-gray-400'>...</span>
              )
            )
          }
          <button
            disabled={page >= totalPage}
            onClick={() => { setPage(p => Math.min(totalPage, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            className='px-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium'
          >
            Sau →
          </button>
        </div>
      )}
    </div>
  )
}
