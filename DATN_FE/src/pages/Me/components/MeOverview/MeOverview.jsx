import { roundKcal } from '../../../../utils/mathUtils'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { FaRunning, FaDumbbell, FaFireAlt, FaChartLine, FaArrowRight } from 'react-icons/fa'
import { FaHeartPulse, FaArrowUp, FaArrowDown, FaEquals } from 'react-icons/fa6'
import { Link } from 'react-router-dom'
import { getMeStats, currentAccount } from '../../../../apis/userApi'
import Loading from '../../../../components/GlobalComponents/Loading'

const fadeIn = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

function StatCard({ icon: Icon, label, value, color, bgColor }) {
  return (
    <motion.div variants={fadeIn}>
      <div
        className={`block p-5 rounded-2xl ${bgColor} border border-gray-100 dark:border-gray-700/50`}
      >
        <div className={`p-3 rounded-xl ${color} bg-white/80 dark:bg-gray-800/80 shadow-sm w-fit`}>
          <Icon className='text-xl' />
        </div>
        <div className='mt-4'>
          <div className='text-3xl font-bold text-gray-800 dark:text-white'>{value}</div>
          <div className='text-sm text-gray-500 dark:text-gray-400 mt-1'>{label}</div>
        </div>
      </div>
    </motion.div>
  )
}

function HealthCompact({ user }) {
  const weight = Number(user?.weight)
  const height = Number(user?.height)
  const bmi = Number(user?.BMI) || (Number.isFinite(weight) && Number.isFinite(height) && height > 0 ? weight / ((height / 100) ** 2) : null)
  const bmr = Number(user?.BMR) || null
  const tdee = Number(user?.TDEE) || null

  const getBmiStatus = (bmi) => {
    if (!Number.isFinite(bmi)) return { text: 'Chưa cập nhật', color: 'text-gray-400', icon: null }
    if (bmi < 18.5) return { text: 'Thiếu cân', color: 'text-blue-500', icon: <FaArrowDown className='inline mr-1' /> }
    if (bmi < 25) return { text: 'Bình thường', color: 'text-emerald-500', icon: <FaEquals className='inline mr-1' /> }
    if (bmi < 30) return { text: 'Thừa cân', color: 'text-amber-500', icon: <FaArrowUp className='inline mr-1' /> }
    return { text: 'Béo phì', color: 'text-red-500', icon: <FaArrowUp className='inline mr-1' /> }
  }

  const status = getBmiStatus(bmi)

  return (
    <motion.div variants={fadeIn} className='bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700/50 shadow-sm'>
      <div className='flex items-center justify-between mb-5'>
        <h3 className='font-bold text-gray-800 dark:text-white flex items-center gap-2'>
          <FaHeartPulse className='text-emerald-500' />
          Sức khỏe
        </h3>
        <Link to='/fitness/fitness-calculator' className='text-sm text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1'>
          Chi tiết <FaArrowRight className='text-xs' />
        </Link>
      </div>

      <div className='grid grid-cols-3 gap-4'>
        <div className='text-center'>
          <div className='text-2xl font-bold text-gray-800 dark:text-white'>
            {Number.isFinite(bmi) ? bmi.toFixed(1) : '—'}
          </div>
          <div className='text-xs text-gray-500 dark:text-gray-400'>BMI</div>
          <div className={`text-xs mt-1 font-medium ${status.color}`}>
            {status.icon}{status.text}
          </div>
        </div>
        <div className='text-center border-x border-gray-200 dark:border-gray-700'>
          <div className='text-2xl font-bold text-gray-800 dark:text-white'>
            {Number.isFinite(bmr) ? roundKcal(bmr) : '—'}
          </div>
          <div className='text-xs text-gray-500 dark:text-gray-400'>BMR</div>
          <div className='text-xs text-gray-400 dark:text-gray-500 mt-1'>kcal/ngày</div>
        </div>
        <div className='text-center'>
          <div className='text-2xl font-bold text-gray-800 dark:text-white'>
            {Number.isFinite(tdee) ? roundKcal(tdee) : '—'}
          </div>
          <div className='text-xs text-gray-500 dark:text-gray-400'>TDEE</div>
          <div className='text-xs text-gray-400 dark:text-gray-500 mt-1'>kcal/ngày</div>
        </div>
      </div>

      {Number.isFinite(weight) && (
        <div className='mt-5 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between'>
          <div className='text-sm text-gray-500 dark:text-gray-400'>Cân nặng hiện tại</div>
          <div className='text-lg font-bold text-gray-800 dark:text-white'>{weight} kg</div>
        </div>
      )}
    </motion.div>
  )
}

function RecentEvents({ events }) {
  if (!events || events.length === 0) {
    return (
      <div className='text-center py-8 text-gray-400 dark:text-gray-500'>
        <FaRunning className='text-4xl mx-auto mb-2 opacity-50' />
        <p className='text-sm'>Chưa có sự kiện nào</p>
      </div>
    )
  }
  return (
    <div className='space-y-3'>
      {events.map((event) => (
        <Link
          key={event._id}
          to={`/sport-event/${event._id}`}
          className='flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group'
        >
          <img
            src={event.image || 'https://via.placeholder.com/60'}
            alt={event.name}
            className='w-12 h-12 rounded-lg object-cover flex-shrink-0'
          />
          <div className='flex-1 min-w-0'>
            <div className='font-medium text-sm text-gray-800 dark:text-white truncate'>{event.name}</div>
            <div className='text-xs text-gray-500 dark:text-gray-400'>
              {event.category} • {event.eventType}
            </div>
          </div>
          <FaArrowRight className='text-gray-300 dark:text-gray-600 group-hover:text-gray-500 transition-colors text-xs flex-shrink-0' />
        </Link>
      ))}
    </div>
  )
}

export default function MeOverview() {
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['meStats'],
    queryFn: getMeStats,
    placeholderData: keepPreviousData
  })

  const { data: userData } = useQuery({
    queryKey: ['me'],
    queryFn: currentAccount,
    placeholderData: keepPreviousData
  })

  const stats = statsData?.data?.result
  const user = userData?.data?.result?.[0]

  if (isLoading) {
    return <Loading className='flex justify-center py-20' />
  }

  return (
    <motion.div variants={stagger} initial='hidden' animate='visible' className='space-y-6'>
      {/* Quick Stats Grid */}
      <motion.div variants={stagger} className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        <StatCard
          icon={FaRunning}
          label='Sự kiện thể thao'
          value={stats?.sportEvents?.joined_count || 0}
          color='text-blue-600'
          bgColor='bg-blue-50/80 dark:bg-blue-900/10'
        />
        <StatCard
          icon={FaDumbbell}
          label='Lịch bài tập'
          value={stats?.workouts?.schedules_count || 0}
          color='text-emerald-600'
          bgColor='bg-emerald-50/80 dark:bg-emerald-900/10'
        />
        <StatCard
          icon={FaFireAlt}
          label='Tổng kcal đốt'
          value={stats?.total_kcal_burned ? stats.total_kcal_burned.toLocaleString() : '0'}
          color='text-red-600'
          bgColor='bg-red-50/80 dark:bg-red-900/10'
        />
      </motion.div>

      {/* Health + Recent - 2-column */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <HealthCompact user={user} />

        <motion.div variants={fadeIn} className='bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700/50 shadow-sm'>
          <div className='flex items-center justify-between mb-5'>
            <h3 className='font-bold text-gray-800 dark:text-white flex items-center gap-2'>
              <FaChartLine className='text-blue-500' />
              Sự kiện gần đây
            </h3>
            <Link to='/sport-event' className='text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1'>
              Xem tất cả <FaArrowRight className='text-xs' />
            </Link>
          </div>
          <RecentEvents events={stats?.sportEvents?.recent} />
        </motion.div>
      </div>
    </motion.div>
  )
}
