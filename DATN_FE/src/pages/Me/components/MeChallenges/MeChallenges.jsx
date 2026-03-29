import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  FaTrophy,
  FaCalendarAlt,
  FaClock,
  FaArrowRight,
  FaUtensils,
  FaRunning,
  FaDumbbell,
  FaFire
} from 'react-icons/fa'
import { Link } from 'react-router-dom'
import { getMyChallenges, getPublicUserChallenges } from '../../../../apis/challengeApi'
import Loading from '../../../../components/GlobalComponents/Loading'

const fadeIn = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
}

const TYPE_CONFIG = {
  nutrition: {
    icon: FaUtensils,
    label: 'Ăn uống',
    gradient: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    text: 'text-emerald-600 dark:text-emerald-400'
  },
  outdoor_activity: {
    icon: FaRunning,
    label: 'Ngoài trời',
    gradient: 'from-blue-500 to-cyan-600',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-600 dark:text-blue-400'
  },
  fitness: {
    icon: FaDumbbell,
    label: 'Thể dục',
    gradient: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50 dark:bg-violet-900/20',
    text: 'text-violet-600 dark:text-violet-400'
  }
}

function ChallengeCard({ participation }) {
  const challenge = participation.challenge_id
  if (!challenge) return null

  const config = TYPE_CONFIG[challenge.challenge_type] || TYPE_CONFIG.fitness
  const TypeIcon = config.icon

  const now = new Date()
  const startDate = new Date(challenge.start_date)
  const endDate = new Date(challenge.end_date)
  const isOngoing = now >= startDate && now <= endDate
  const isPast = now > endDate

  // Progress calculation (days completed vs total required days)
  const safeStart = new Date(challenge.start_date)
  safeStart.setHours(0, 0, 0, 0)
  const safeEnd = new Date(challenge.end_date)
  safeEnd.setHours(0, 0, 0, 0)
  const totalRequiredDays = Math.max(
    1,
    Math.ceil((safeEnd.getTime() - safeStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
  )
  const completedDays = participation.current_value || 0
  const progress = Math.min(100, Math.round((completedDays / totalRequiredDays) * 100))

  const daysLeft = Math.max(0, Math.ceil((endDate - now) / (24 * 60 * 60 * 1000)))

  return (
    <motion.div variants={fadeIn}>
      <Link
        to={`/challenge/${challenge._id}`}
        className='block bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300 group'
      >
        {/* Banner */}
        <div className={`relative h-36 bg-gradient-to-br ${config.gradient} flex items-center justify-center overflow-hidden`}>
          {challenge.image ? (
            <img
              src={challenge.image}
              alt={challenge.title}
              className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'
            />
          ) : (
            <span className='text-5xl opacity-30 group-hover:scale-110 transition-transform duration-500'>
              {challenge.badge_emoji || '🏆'}
            </span>
          )}
          <div className='absolute inset-0 bg-gradient-to-t from-black/50 to-transparent' />

          {/* Status badge */}
          <div className='absolute top-3 right-3'>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                isOngoing
                  ? 'bg-emerald-500/90 text-white'
                  : isPast
                    ? 'bg-gray-500/90 text-white'
                    : 'bg-blue-500/90 text-white'
              }`}
            >
              {isOngoing ? 'Đang diễn ra' : isPast ? 'Đã kết thúc' : 'Sắp diễn ra'}
            </span>
          </div>

          {/* Title overlay */}
          <div className='absolute bottom-3 left-3 right-3'>
            <h3 className='text-white font-bold text-sm truncate'>{challenge.title}</h3>
          </div>
        </div>

        {/* Body */}
        <div className='p-4 space-y-2.5'>
          {/* Type badge */}
          <div className='flex items-center gap-2'>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 ${config.bg} ${config.text} rounded-full text-xs font-medium`}>
              <TypeIcon className='text-[10px]' />
              {config.label}
            </span>
            {participation.is_completed && (
              <span className='inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-full text-xs font-medium'>
                ✅ Hoàn thành
              </span>
            )}
          </div>

          {/* Dates */}
          <div className='flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400'>
            <FaCalendarAlt className='text-emerald-500 flex-shrink-0' />
            <span>
              {new Date(challenge.start_date).toLocaleDateString('vi-VN')} -{' '}
              {new Date(challenge.end_date).toLocaleDateString('vi-VN')}
            </span>
          </div>

          {/* Days left */}
          {isOngoing && daysLeft > 0 && (
            <div className='flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400'>
              <FaClock className='text-orange-400 flex-shrink-0' />
              <span>Còn {daysLeft} ngày</span>
            </div>
          )}

          {/* Progress bar */}
          <div>
            <div className='flex justify-between text-xs mb-1'>
              <span className='text-gray-500 dark:text-gray-400 flex items-center gap-1'>
                <FaFire className='text-orange-400' />
                {completedDays} / {totalRequiredDays} ngày
              </span>
              <span className={`font-medium ${progress >= 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'}`}>
                {progress}%
              </span>
            </div>
            <div className='w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden'>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, delay: 0.2 }}
                className={`h-full bg-gradient-to-r ${config.gradient} rounded-full`}
              />
            </div>
          </div>

          {/* Streak */}
          {participation.streak_count > 0 && (
            <p className='text-xs text-orange-500 font-medium'>
              🔥 Streak: {participation.streak_count} ngày
            </p>
          )}
        </div>
      </Link>
    </motion.div>
  )
}

export default function MeChallenges({ isOwner = true, userId }) {
  const isPublic = Boolean(userId)

  const { data, isLoading } = useQuery({
    queryKey: isPublic
      ? ['publicUserChallenges', userId, { limit: 20 }]
      : ['my-challenges', { limit: 20 }],
    queryFn: () =>
      isPublic
        ? getPublicUserChallenges(userId, { limit: 20 })
        : getMyChallenges({ limit: 20 }),
    placeholderData: keepPreviousData
  })

  const participations = data?.data?.result?.participations || []

  if (isLoading) {
    return <Loading className='flex justify-center py-20' />
  }

  if (participations.length === 0) {
    return (
      <div className='text-center py-16'>
        <FaTrophy className='text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4' />
        <h3 className='text-lg font-medium text-gray-500 dark:text-gray-400'>
          Chưa tham gia thử thách nào
        </h3>
        {isOwner && (
          <>
            <p className='text-sm text-gray-400 dark:text-gray-500 mt-1'>
              Khám phá và tham gia các thử thách thú vị!
            </p>
            <Link
              to='/challenge'
              className='inline-flex items-center gap-2 mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors'
            >
              Khám phá thử thách <FaArrowRight />
            </Link>
          </>
        )}
      </div>
    )
  }

  return (
    <motion.div variants={stagger} initial='hidden' animate='visible'>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
        {participations.map((p) => (
          <ChallengeCard key={p._id} participation={p} />
        ))}
      </div>
    </motion.div>
  )
}
