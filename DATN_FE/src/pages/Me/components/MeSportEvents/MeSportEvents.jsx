import { useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { FaRunning, FaCalendarAlt, FaUsers, FaArrowRight, FaMapMarkerAlt, FaPlusCircle, FaCheckCircle } from 'react-icons/fa'
import { FiSearch } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { getJoinedEvents, getMyEvents, getPublicUserJoinedEvents } from '../../../../apis/sportEventApi'
import Loading from '../../../../components/GlobalComponents/Loading'
import { formatDateVN, vnMoment } from '../../../../utils/vnDateUtils'

const LIMIT = 9

const fadeIn = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
}

function parseEventsPayload(data) {
  const raw = data?.data?.result
  const events = Array.isArray(raw) ? raw : Array.isArray(raw?.events) ? raw.events : []
  const total = typeof raw?.total === 'number' ? raw.total : events.length
  const totalPage = raw?.totalPage || 1
  return { events, total, totalPage }
}

function EventCard({ event }) {
  const isOngoing = vnMoment().isBetween(event.startDate, event.endDate)
  const isPast = vnMoment().isAfter(event.endDate)

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
            <span>{vnMoment(event.startDate).format('DD/MM/YYYY')} - {vnMoment(event.endDate).format('DD/MM/YYYY')}</span>
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

function EmptyTabState({ activeTab, isPublic }) {
  return (
    <div className='text-center py-16'>
      <FaRunning className='text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4' />
      <h3 className='text-lg font-medium text-gray-500 dark:text-gray-400'>
        {activeTab === 'created' ? 'Chưa tạo sự kiện nào' : 'Chưa tham gia sự kiện nào'}
      </h3>
      {isPublic ? (
        <p className='text-sm text-gray-400 dark:text-gray-500 mt-1 max-w-md mx-auto'>
          {activeTab === 'created'
            ? 'Người dùng chưa có sự kiện nào được tạo, hoặc chưa có dữ liệu để hiển thị.'
            : 'Người dùng chưa tham gia sự kiện nào, hoặc chưa có dữ liệu để hiển thị.'}
        </p>
      ) : null}
      {!isPublic && (
        <>
          {activeTab === 'created' ? (
            <>
              <p className='text-sm text-gray-400 dark:text-gray-500 mt-1'>Tạo sự kiện để cộng đồng cùng tham gia!</p>
              <Link to='/sport-event/create' className='inline-flex items-center gap-2 mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors'>
                Tạo sự kiện <FaArrowRight />
              </Link>
            </>
          ) : (
            <>
              <p className='text-sm text-gray-400 dark:text-gray-500 mt-1'>Tham gia sự kiện thể thao để bắt đầu!</p>
              <Link to='/sport-event' className='inline-flex items-center gap-2 mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors'>
                Khám phá sự kiện <FaArrowRight />
              </Link>
            </>
          )}
        </>
      )}
    </div>
  )
}

export default function MeSportEvents({ userId }) {
  const isPublic = Boolean(userId)
  const [activeTab, setActiveTab] = useState('created')
  const [pageByTab, setPageByTab] = useState({ created: 1, joined: 1 })
  const [keyword, setKeyword] = useState('')

  const createdPage = pageByTab.created
  const joinedPage = pageByTab.joined
  const page = pageByTab[activeTab]

  const createdQuery = useQuery({
    queryKey: isPublic
      ? ['publicUserEvents-created', userId, { page: createdPage, limit: LIMIT }]
      : ['myCreatedEvents-profile', { page: createdPage, limit: LIMIT }],
    queryFn: () =>
      isPublic
        ? getPublicUserJoinedEvents(userId, { page: createdPage, limit: LIMIT, scope: 'created' })
        : getMyEvents({ page: createdPage, limit: LIMIT }),
    placeholderData: keepPreviousData
  })

  const joinedQuery = useQuery({
    queryKey: isPublic
      ? ['publicUserEvents-joined', userId, { page: joinedPage, limit: LIMIT }]
      : ['joinedEvents-profile', { page: joinedPage, limit: LIMIT }],
    queryFn: () =>
      isPublic
        ? getPublicUserJoinedEvents(userId, { page: joinedPage, limit: LIMIT, scope: 'joined' })
        : getJoinedEvents({ page: joinedPage, limit: LIMIT }),
    placeholderData: keepPreviousData
  })

  const activeQuery = activeTab === 'created' ? createdQuery : joinedQuery
  const { events, totalPage } = parseEventsPayload(activeQuery.data)
  const createdTotal = parseEventsPayload(createdQuery.data).total
  const joinedTotal = parseEventsPayload(joinedQuery.data).total

  const filteredEvents = events.filter((event) => {
    const normalized = keyword.trim().toLowerCase()
    if (!normalized) return true
    const searchable = [event?.name, event?.category, event?.location, event?.eventType]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return searchable.includes(normalized)
  })

  const errorMessage =
    activeQuery.error?.response?.data?.message ||
    activeQuery.error?.message ||
    'Đã xảy ra lỗi khi tải dữ liệu.'

  const handleTabChange = (tab) => {
    if (tab !== activeTab) setKeyword('')
    setActiveTab(tab)
  }

  const tabCountLabel = (total, isSuccess) => (isSuccess ? ` (${total})` : '')

  return (
    <div>
      <div className='mb-5 flex items-center gap-2 rounded-xl bg-gray-100 dark:bg-gray-800 p-1'>
        <button
          type='button'
          onClick={() => handleTabChange('created')}
          className={`flex-1 inline-flex justify-center items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition ${activeTab === 'created'
            ? 'bg-white dark:bg-gray-700 text-emerald-600 shadow-sm'
            : 'text-gray-500 dark:text-gray-300'
            }`}
        >
          <FaPlusCircle className='text-xs shrink-0' />
          <span className='truncate'>
            Sự kiện đã tạo{tabCountLabel(createdTotal, createdQuery.isSuccess)}
          </span>
        </button>
        <button
          type='button'
          onClick={() => handleTabChange('joined')}
          className={`flex-1 inline-flex justify-center items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition ${activeTab === 'joined'
            ? 'bg-white dark:bg-gray-700 text-emerald-600 shadow-sm'
            : 'text-gray-500 dark:text-gray-300'
            }`}
        >
          <FaCheckCircle className='text-xs shrink-0' />
          <span className='truncate'>
            Sự kiện đã tham gia{tabCountLabel(joinedTotal, joinedQuery.isSuccess)}
          </span>
        </button>
      </div>

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

      {activeQuery.isError && (
        <div className='text-center py-16 px-4'>
          <FaRunning className='text-6xl text-red-200 dark:text-red-900/40 mx-auto mb-4' />
          <h3 className='text-lg font-medium text-gray-700 dark:text-gray-300'>Không tải được dữ liệu sự kiện</h3>
          <p className='text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md mx-auto'>{errorMessage}</p>
          <button
            type='button'
            onClick={() => activeQuery.refetch()}
            className='mt-5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors'
          >
            Thử lại
          </button>
        </div>
      )}

      {!activeQuery.isError && activeQuery.isPending && (
        <Loading className='flex justify-center py-20' />
      )}

      {!activeQuery.isError && !activeQuery.isPending && events.length === 0 && page === 1 && !keyword.trim() && (
        <EmptyTabState activeTab={activeTab} isPublic={isPublic} />
      )}

      {!activeQuery.isError && !activeQuery.isPending && (events.length > 0 || page > 1 || keyword.trim()) && (
        <>
          {filteredEvents.length === 0 && (
            <div className='text-center py-10 text-sm text-gray-500 dark:text-gray-400'>
              {keyword.trim()
                ? `Không tìm thấy sự kiện phù hợp với từ khóa "${keyword}".`
                : activeTab === 'created'
                  ? 'Chưa tạo sự kiện nào.'
                  : 'Chưa tham gia sự kiện nào.'}
            </div>
          )}

          {filteredEvents.length > 0 && (
            <motion.div variants={stagger} initial='hidden' animate='visible'>
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                {filteredEvents.map((event) => (
                  <EventCard key={event._id} event={event} />
                ))}
              </div>
            </motion.div>
          )}

          {totalPage > 1 && !keyword.trim() && filteredEvents.length > 0 && (
            <div className='flex items-center justify-center gap-2 mt-8'>
              <button
                disabled={page <= 1}
                onClick={() => {
                  setPageByTab((prev) => ({ ...prev, [activeTab]: Math.max(1, prev[activeTab] - 1) }))
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
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
                      onClick={() => {
                        setPageByTab((prev) => ({ ...prev, [activeTab]: p }))
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
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
                onClick={() => {
                  setPageByTab((prev) => ({ ...prev, [activeTab]: Math.min(totalPage, prev[activeTab] + 1) }))
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className='px-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium'
              >
                Sau →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
