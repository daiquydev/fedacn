import { useMemo, useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { FaDumbbell, FaFireAlt, FaCalendarAlt, FaArrowRight, FaPlusCircle, FaBookmark } from 'react-icons/fa'
import { FiSearch } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { getListWorkoutSchedules, getPublicUserWorkoutSchedules } from '../../../../apis/workoutScheduleApi'
import { getSavedWorkouts } from '../../../../apis/savedWorkoutApi'
import Loading from '../../../../components/GlobalComponents/Loading'
import moment from 'moment'

const LIMIT = 6

const fadeIn = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
}

function parseSchedulesPayload(data) {
  const raw = data?.data?.result
  const schedules = Array.isArray(raw) ? raw : Array.isArray(raw?.workoutSchedule) ? raw.workoutSchedule : []
  const total = typeof raw?.total === 'number' ? raw.total : schedules.length
  const totalPage = raw?.totalPage || 1
  return { schedules, total, totalPage }
}

function WorkoutCard({ schedule, readOnly = false }) {
  const isActive = moment().isBetween(schedule.start_date, schedule.end_date)
  const progress = schedule.calo_target > 0
    ? Math.min(100, Math.round(((schedule.total_calo_burn || 0) / schedule.calo_target) * 100))
    : 0

  const content = (
    <>
      <div className='flex items-start justify-between mb-3'>
        <div className='flex items-center gap-3'>
          <div className='p-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl'>
            <FaDumbbell className='text-emerald-600 dark:text-emerald-400 text-lg' />
          </div>
          <div>
            <h3 className='font-bold text-gray-800 dark:text-white text-sm'>{schedule.name}</h3>
            <div className='flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-0.5'>
              <FaCalendarAlt className='text-[10px]' />
              {moment(schedule.start_date).format('DD/MM')} - {moment(schedule.end_date).format('DD/MM/YYYY')}
            </div>
          </div>
        </div>
        {isActive && (
          <span className='px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs rounded-full font-medium'>
            Đang hoạt động
          </span>
        )}
      </div>

      <div className='mt-4'>
        <div className='flex justify-between text-xs mb-1.5'>
          <span className='text-gray-500 dark:text-gray-400 flex items-center gap-1'>
            <FaFireAlt className='text-orange-400' />
            {(schedule.total_calo_burn || 0).toLocaleString()} / {schedule.calo_target.toLocaleString()} kcal
          </span>
          <span className='font-medium text-gray-700 dark:text-gray-300'>{progress}%</span>
        </div>
        <div className='w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden'>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, delay: 0.2 }}
            className='h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full'
          />
        </div>
      </div>
    </>
  )

  if (readOnly) {
    return (
      <motion.div variants={fadeIn} className='block bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700/50'>
        {content}
      </motion.div>
    )
  }

  return (
    <motion.div variants={fadeIn}>
      <Link
        to={`/schedule/ex-schedule/${schedule._id}`}
        className='block bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300 group'
      >
        {content}
      </Link>
    </motion.div>
  )
}

function EmptyTabState({ activeTab, isPublic, isOwner }) {
  return (
    <div className='text-center py-16'>
      <FaDumbbell className='text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4' />
      <h3 className='text-lg font-medium text-gray-500 dark:text-gray-400'>
        {activeTab === 'created' ? 'Chưa có lịch tập nào' : 'Chưa có bài tập đã lưu'}
      </h3>
      {isPublic && !isOwner ? (
        <p className='text-sm text-gray-400 dark:text-gray-500 mt-1 max-w-md mx-auto'>
          {activeTab === 'created'
            ? 'Người dùng chưa có lịch tập công khai để hiển thị.'
            : 'Bài tập đã lưu chỉ hiển thị với chủ tài khoản.'}
        </p>
      ) : null}
      {isOwner && (
        <>
          <p className='text-sm text-gray-400 dark:text-gray-500 mt-1'>
            {activeTab === 'created'
              ? 'Tạo lịch bài tập để theo dõi tiến trình!'
              : 'Lưu bài tập từ thư viện để tập nhanh hơn!'}
          </p>
          <Link
            to='/training'
            className='inline-flex items-center gap-2 mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors'
          >
            {activeTab === 'created' ? 'Tạo lịch tập' : 'Khám phá bài tập'} <FaArrowRight />
          </Link>
        </>
      )}
    </div>
  )
}

export default function MeWorkouts({ isOwner = true, userId }) {
  const isPublic = Boolean(userId)
  const [activeTab, setActiveTab] = useState('created')
  const [pageByTab, setPageByTab] = useState({ created: 1, saved: 1 })
  const [keyword, setKeyword] = useState('')

  const createdPage = pageByTab.created
  const page = pageByTab[activeTab]

  const schedulesQuery = useQuery({
    queryKey: isPublic
      ? ['publicUserWorkouts', userId, { page: createdPage, limit: LIMIT }]
      : ['workout-schedule', { page: createdPage, limit: LIMIT }],
    queryFn: () =>
      isPublic
        ? getPublicUserWorkoutSchedules(userId, { page: createdPage, limit: LIMIT })
        : getListWorkoutSchedules({ page: createdPage, limit: LIMIT }),
    placeholderData: keepPreviousData,
    refetchOnMount: 'always'
  })

  const savedQuery = useQuery({
    queryKey: ['savedWorkouts'],
    queryFn: getSavedWorkouts,
    enabled: !isPublic,
    refetchOnMount: 'always'
  })

  const activeQuery = activeTab === 'created' ? schedulesQuery : savedQuery

  const { schedules, total: schedulesTotal, totalPage } = parseSchedulesPayload(schedulesQuery.data)
  const savedWorkouts = Array.isArray(savedQuery.data?.data?.result) ? savedQuery.data.data.result : []
  const savedTotal = savedWorkouts.length

  const sortedSchedules = useMemo(
    () =>
      [...schedules].sort((a, b) => {
        const dateA = new Date(a?.createdAt || a?.start_date || 0).getTime()
        const dateB = new Date(b?.createdAt || b?.start_date || 0).getTime()
        return dateB - dateA
      }),
    [schedules]
  )

  const filteredSchedules = useMemo(() => {
    const normalized = keyword.trim().toLowerCase()
    if (!normalized) return sortedSchedules
    return sortedSchedules.filter((schedule) => (schedule?.name || '').toLowerCase().includes(normalized))
  }, [keyword, sortedSchedules])

  const filteredSavedWorkouts = useMemo(() => {
    const normalized = keyword.trim().toLowerCase()
    if (!normalized) return savedWorkouts
    return savedWorkouts.filter((workout) => (workout?.name || '').toLowerCase().includes(normalized))
  }, [keyword, savedWorkouts])

  const activeItems = activeTab === 'created' ? filteredSchedules : filteredSavedWorkouts
  const activeCount = activeTab === 'created' ? filteredSchedules.length : filteredSavedWorkouts.length

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
            Lịch tập đã tạo{tabCountLabel(schedulesTotal, schedulesQuery.isSuccess)}
          </span>
        </button>
        <button
          type='button'
          onClick={() => handleTabChange('saved')}
          className={`flex-1 inline-flex justify-center items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition ${activeTab === 'saved'
            ? 'bg-white dark:bg-gray-700 text-emerald-600 shadow-sm'
            : 'text-gray-500 dark:text-gray-300'
            }`}
        >
          <FaBookmark className='text-xs shrink-0' />
          <span className='truncate'>
            Bài tập đã lưu{!isPublic ? tabCountLabel(savedTotal, savedQuery.isSuccess) : ''}
          </span>
        </button>
      </div>

      <div className='mb-5'>
        <label className='relative block'>
          <FiSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' />
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder={activeTab === 'created' ? 'Tìm lịch tập theo tên...' : 'Tìm bài tập đã lưu...'}
            className='w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-2.5 pl-10 pr-4 text-sm text-gray-700 dark:text-gray-100 outline-none focus:border-emerald-500'
          />
        </label>
      </div>

      {activeQuery.isError && (
        <div className='text-center py-16 px-4'>
          <FaDumbbell className='text-6xl text-red-200 dark:text-red-900/40 mx-auto mb-4' />
          <h3 className='text-lg font-medium text-gray-700 dark:text-gray-300'>Không tải được dữ liệu bài tập</h3>
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

      {!activeQuery.isError && !activeQuery.isPending && activeCount === 0 && page === 1 && !keyword.trim() && (
        <EmptyTabState activeTab={activeTab} isPublic={isPublic} isOwner={isOwner} />
      )}

      {!activeQuery.isError && !activeQuery.isPending && (activeCount > 0 || page > 1 || keyword.trim()) && (
        <>
          {activeCount === 0 && (
            <div className='text-center py-10 text-sm text-gray-500 dark:text-gray-400'>
              {keyword.trim()
                ? `Không tìm thấy kết quả phù hợp với từ khóa "${keyword}".`
                : activeTab === 'created'
                  ? 'Chưa có lịch tập nào.'
                  : 'Chưa có bài tập đã lưu.'}
            </div>
          )}

          {activeTab === 'created' && filteredSchedules.length > 0 && (
            <motion.div variants={stagger} initial='hidden' animate='visible'>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                {filteredSchedules.map((schedule) => (
                  <WorkoutCard key={schedule._id} schedule={schedule} readOnly={isPublic} />
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'saved' && filteredSavedWorkouts.length > 0 && (
            <motion.div variants={stagger} initial='hidden' animate='visible'>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                {filteredSavedWorkouts.map((workout) => (
                  <Link
                    key={workout._id}
                    to='/training'
                    state={{ fromWorkoutCalendar: true, workout_id: workout._id }}
                    className='block bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300'
                  >
                    <div className='flex items-center gap-3 mb-2'>
                      <div className='p-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl'>
                        <FaDumbbell className='text-emerald-600 dark:text-emerald-400 text-lg' />
                      </div>
                      <div className='min-w-0'>
                        <h4 className='font-bold text-gray-800 dark:text-white text-sm truncate'>{workout.name}</h4>
                        <p className='text-xs text-gray-500 dark:text-gray-400 mt-0.5'>
                          {workout.exercises?.length || 0} bài tập
                        </p>
                      </div>
                    </div>
                    <div className='text-xs text-gray-500 dark:text-gray-400'>
                      Lưu lúc {moment(workout.saved_at || workout.createdAt).format('DD/MM/YYYY')}
                    </div>
                    <div className='mt-3 text-emerald-600 dark:text-emerald-400 text-sm font-medium'>Tập ngay →</div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'created' && totalPage > 1 && !keyword.trim() && filteredSchedules.length > 0 && (
            <div className='flex items-center justify-center gap-2 mt-8'>
              <button
                disabled={page <= 1}
                onClick={() => {
                  setPageByTab((prev) => ({ ...prev, created: Math.max(1, prev.created - 1) }))
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
                        setPageByTab((prev) => ({ ...prev, created: p }))
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
                  setPageByTab((prev) => ({ ...prev, created: Math.min(totalPage, prev.created + 1) }))
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
