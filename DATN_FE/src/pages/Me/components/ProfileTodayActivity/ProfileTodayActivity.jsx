import { useMemo, useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { MdArticle, MdSportsSoccer, MdFitnessCenter } from 'react-icons/md'
import { FaTrophy, FaCalendarDay } from 'react-icons/fa'
import { getUserTodayActivity } from '../../../../apis/userApi'
import Loading from '../../../../components/GlobalComponents/Loading'
import TimeRangeDropdown from '../../../../components/SportEvent/TimeRangeDropdown'

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } }
}

const PRESET_TO_API_RANGE = {
  today: 'today',
  '7d': '7days',
  '1m': '1month',
  '6m': '6months',
  all: 'all'
}

function TodayStatCard({ icon: Icon, label, value, color, bgColor }) {
  return (
    <motion.div variants={fadeIn}>
      <div
        className={`block p-4 sm:p-5 rounded-2xl ${bgColor} border border-gray-100 dark:border-gray-700/50 h-full`}
      >
        <div className={`p-2.5 rounded-xl ${color} bg-white/80 dark:bg-gray-800/80 shadow-sm w-fit`}>
          <Icon className='text-xl' />
        </div>
        <div className='mt-3'>
          <div className='text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white tabular-nums'>{value}</div>
          <div className='text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 leading-snug'>{label}</div>
        </div>
      </div>
    </motion.div>
  )
}

export default function ProfileTodayActivity({ userId }) {
  const [timePreset, setTimePreset] = useState('7d')
  const [customRange, setCustomRange] = useState(null)

  const queryParams = useMemo(() => {
    if (customRange) {
      return { range: 'custom', startDate: customRange.startDate, endDate: customRange.endDate }
    }
    return { range: PRESET_TO_API_RANGE[timePreset] || '7days' }
  }, [timePreset, customRange])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['userTodayActivity', userId, queryParams.range, customRange?.startDate, customRange?.endDate],
    queryFn: () => getUserTodayActivity(userId, queryParams),
    enabled: Boolean(userId),
    placeholderData: keepPreviousData
  })

  const handleTimeFilterChange = (payload) => {
    if (payload.period) {
      setCustomRange(null)
      setTimePreset(payload.period)
    } else if (payload.startDate && payload.endDate) {
      setCustomRange({ startDate: payload.startDate, endDate: payload.endDate })
    }
  }

  const result = data?.data?.result
  const selectValue = customRange ? 'custom' : timePreset
  const rangeSelectId = `profile-activity-range-${String(userId).replace(/[^a-zA-Z0-9_-]/g, '')}`

  if (!userId) {
    return null
  }

  if (isLoading && !result) {
    return <Loading className='flex justify-center py-12' />
  }

  if (isError) {
    return (
      <div className='rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/80 dark:bg-amber-950/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-200'>
        Không tải được dữ liệu hoạt động. Thử tải lại trang.
      </div>
    )
  }

  const stagger = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  }

  return (
    <motion.div
      variants={stagger}
      initial='hidden'
      animate='visible'
      className='bg-white dark:bg-gray-800 rounded-2xl p-5 sm:p-6 border border-gray-100 dark:border-gray-700/50 shadow-sm'
    >
      <div className='flex flex-col gap-4 mb-4 sm:flex-row sm:items-start sm:justify-between'>
        <label
          htmlFor={rangeSelectId}
          className='flex items-start gap-2 min-w-0 cursor-pointer group rounded-lg -m-1 p-1 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors'
        >
          <FaCalendarDay className='text-emerald-600 dark:text-emerald-400 text-lg mt-0.5 flex-shrink-0 group-hover:text-emerald-500' />
          <div className='min-w-0'>
            <h3 className='font-bold text-gray-800 dark:text-white'>Lịch hoạt động hôm nay</h3>
            <p className='text-xs text-gray-500 dark:text-gray-400 mt-0.5'>{result?.period_label || ''}</p>
          </div>
        </label>
        <div className='flex-shrink-0 sm:pt-0.5'>
          <TimeRangeDropdown
            selectId={rangeSelectId}
            value={selectValue}
            onChange={handleTimeFilterChange}
            allLabel='Toàn bộ'
            accentColor='blue'
          />
        </div>
      </div>

      <motion.div variants={stagger} className='grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4'>
        <TodayStatCard
          icon={MdArticle}
          label='Bài viết đã đăng'
          value={result?.posts ?? 0}
          color='text-violet-600'
          bgColor='bg-violet-50/80 dark:bg-violet-900/10'
        />
        <TodayStatCard
          icon={MdSportsSoccer}
          label='Hoạt động sự kiện thể thao'
          value={result?.sport_event_activities ?? 0}
          color='text-blue-600'
          bgColor='bg-blue-50/80 dark:bg-blue-900/10'
        />
        <TodayStatCard
          icon={FaTrophy}
          label='Hoạt động thử thách'
          value={result?.challenge_activities ?? 0}
          color='text-amber-600'
          bgColor='bg-amber-50/80 dark:bg-amber-900/10'
        />
        <TodayStatCard
          icon={MdFitnessCenter}
          label='Buổi tập hoàn thành'
          value={result?.training_sessions ?? 0}
          color='text-emerald-600'
          bgColor='bg-emerald-50/80 dark:bg-emerald-900/10'
        />
      </motion.div>
    </motion.div>
  )
}
