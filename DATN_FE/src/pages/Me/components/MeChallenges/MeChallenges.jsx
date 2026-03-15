import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { FaFlag, FaTrophy, FaArrowRight, FaCalendarAlt, FaFire, FaCheck } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import { getMyHabitChallenges, getUserBadges } from '../../../../apis/habitChallengeApi'
import Loading from '../../../../components/GlobalComponents/Loading'
import moment from 'moment'

const fadeIn = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
}

const CATEGORY_LABELS = {
  exercise: 'Tập luyện',
  nutrition: 'Dinh dưỡng',
  sleep: 'Giấc ngủ',
  mental: 'Tinh thần',
  hydration: 'Uống nước',
  other: 'Khác'
}

function ChallengeCard({ participation }) {
  // API returns participation with populated challenge_id
  const challenge = participation.challenge_id || {}
  const challengeId = challenge._id || participation.challenge_id
  const isActive = participation.status === 'in_progress'
  const isCompleted = participation.status === 'completed'

  return (
    <motion.div variants={fadeIn}>
      <Link
        to={`/habit-challenge/${challengeId}`}
        className='block bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300 group'
      >
        <div className='flex items-start justify-between mb-3'>
          <div className='flex items-center gap-3'>
            <div className='p-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-xl'>
              <FaFlag className='text-amber-600 dark:text-amber-400 text-lg' />
            </div>
            <div>
              <h3 className='font-bold text-gray-800 dark:text-white text-sm'>{challenge.title || 'Thử thách'}</h3>
              <div className='text-xs text-gray-500 dark:text-gray-400 mt-0.5'>
                {CATEGORY_LABELS[challenge.category] || challenge.category} • {challenge.duration_days || 21} ngày
              </div>
            </div>
          </div>
          {isActive && (
            <span className='px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs rounded-full font-medium flex items-center gap-1'>
              <FaFire className='text-[10px]' /> Đang tham gia
            </span>
          )}
          {isCompleted && (
            <span className='px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs rounded-full font-medium flex items-center gap-1'>
              <FaCheck className='text-[10px]' /> Hoàn thành
            </span>
          )}
        </div>

        {challenge.description && (
          <p className='text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3'>{challenge.description}</p>
        )}

        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400'>
            <FaCalendarAlt className='text-[10px]' />
            Tham gia: {moment(participation.start_date || participation.joined_at).format('DD/MM/YYYY')}
          </div>
          {participation.current_streak > 0 && (
            <div className='flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium'>
              <FaFire className='text-[10px]' />
              Streak: {participation.current_streak} ngày
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  )
}

function BadgesList({ badges }) {
  if (!badges || badges.length === 0) return null

  return (
    <motion.div variants={fadeIn} className='bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700/50 shadow-sm'>
      <h3 className='font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-4'>
        <FaTrophy className='text-amber-500' />
        Huy hiệu đạt được
      </h3>
      <div className='flex flex-wrap gap-3'>
        {badges.map((badge) => (
          <div key={badge._id} className='flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl'>
            <span className='text-2xl'>{badge.icon || '🏆'}</span>
            <div>
              <div className='text-xs font-medium text-gray-800 dark:text-white'>{badge.name || badge.badge_type}</div>
              <div className='text-[10px] text-gray-500 dark:text-gray-400'>{badge.description || ''}</div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

export default function MeChallenges() {
  const { data, isLoading } = useQuery({
    queryKey: ['myHabitChallenges'],
    queryFn: () => getMyHabitChallenges({ page: 1, limit: 20 }),
    placeholderData: keepPreviousData,
    staleTime: 1000
  })

  const { data: badgesData } = useQuery({
    queryKey: ['userBadges'],
    queryFn: getUserBadges,
    placeholderData: keepPreviousData,
    staleTime: 1000
  })

  const participations = data?.data?.result?.participations || []
  const badges = badgesData?.data?.result || []

  if (isLoading) {
    return <Loading className='flex justify-center py-20' />
  }

  if (participations.length === 0 && badges.length === 0) {
    return (
      <div className='text-center py-16'>
        <FaFlag className='text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4' />
        <h3 className='text-lg font-medium text-gray-500 dark:text-gray-400'>Chưa tham gia thử thách nào</h3>
        <p className='text-sm text-gray-400 dark:text-gray-500 mt-1'>Tham gia thử thách để xây dựng thói quen tốt!</p>
        <Link to='/habit-challenge' className='inline-flex items-center gap-2 mt-4 px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-medium hover:bg-amber-700 transition-colors'>
          Khám phá thử thách <FaArrowRight />
        </Link>
      </div>
    )
  }

  return (
    <motion.div variants={stagger} initial='hidden' animate='visible' className='space-y-6'>
      <BadgesList badges={badges} />
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        {participations.map((participation) => (
          <ChallengeCard key={participation._id} participation={participation} />
        ))}
      </div>
    </motion.div>
  )
}
