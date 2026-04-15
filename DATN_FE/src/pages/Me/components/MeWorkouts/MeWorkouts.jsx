import { useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { FaDumbbell, FaFireAlt, FaCalendarAlt, FaArrowRight } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import { getListWorkoutSchedules } from '../../../../apis/workoutScheduleApi'
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

function WorkoutCard({ schedule }) {
  const isActive = moment().isBetween(schedule.start_date, schedule.end_date)
  const progress = schedule.calo_target > 0
    ? Math.min(100, Math.round(((schedule.total_calo_burn || 0) / schedule.calo_target) * 100))
    : 0

  return (
    <motion.div variants={fadeIn}>
      <Link
        to={`/schedule/ex-schedule/${schedule._id}`}
        className='block bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300 group'
      >
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
      </Link>
    </motion.div>
  )
}

export default function MeWorkouts({ isOwner = true }) {
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['workoutSchedules', { page, limit: LIMIT }],
    queryFn: () => getListWorkoutSchedules({ page, limit: LIMIT }),
    placeholderData: keepPreviousData
  })

  const raw = data?.data?.result
  const schedules = Array.isArray(raw) ? raw : Array.isArray(raw?.workoutSchedule) ? raw.workoutSchedule : []
  const totalPage = raw?.totalPage || 1

  if (isLoading) {
    return <Loading className='flex justify-center py-20' />
  }

  if (schedules.length === 0 && page === 1) {
    return (
      <div className='text-center py-16'>
        <FaDumbbell className='text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4' />
        <h3 className='text-lg font-medium text-gray-500 dark:text-gray-400'>Chưa có lịch bài tập nào</h3>
        {isOwner && (
          <>
            <p className='text-sm text-gray-400 dark:text-gray-500 mt-1'>Tạo lịch bài tập để theo dõi tiến trình!</p>
            <Link to='/training' className='inline-flex items-center gap-2 mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors'>
              Tạo lịch tập <FaArrowRight />
            </Link>
          </>
        )}
      </div>
    )
  }

  return (
    <div>
      <motion.div variants={stagger} initial='hidden' animate='visible'>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          {schedules.map((schedule) => (
            <WorkoutCard key={schedule._id} schedule={schedule} />
          ))}
        </div>
      </motion.div>

      {/* Pagination — cùng style Challenge.jsx */}
      {totalPage > 1 && (
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
