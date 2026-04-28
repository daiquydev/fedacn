import { useMemo, useState } from 'react'
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
  FaFire,
  FaPlusCircle,
  FaCheckCircle
} from 'react-icons/fa'
import { FiSearch } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { getMyChallenges, getMyCreatedChallenges, getPublicUserChallenges } from '../../../../apis/challengeApi'
import { getChallengePersonalProgressPercent, getChallengeTotalRequiredDays } from '../../../../utils/challengeProgress'
import Loading from '../../../../components/GlobalComponents/Loading'

const LIMIT = 9

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

  const totalRequiredDays = getChallengeTotalRequiredDays(challenge)
  const completedDays = participation.current_value || 0
  const progress = getChallengePersonalProgressPercent(challenge, participation)
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
          <div className='absolute top-3 right-3'>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${isOngoing ? 'bg-emerald-500/90 text-white' : isPast ? 'bg-gray-500/90 text-white' : 'bg-blue-500/90 text-white'
              }`}>
              {isOngoing ? 'Đang diễn ra' : isPast ? 'Đã kết thúc' : 'Sắp diễn ra'}
            </span>
          </div>
          <div className='absolute bottom-3 left-3 right-3'>
            <h3 className='text-white font-bold text-sm truncate'>{challenge.title}</h3>
          </div>
        </div>

        {/* Body */}
        <div className='p-4 space-y-2.5'>
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

          <div className='flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400'>
            <FaCalendarAlt className='text-emerald-500 flex-shrink-0' />
            <span>
              {new Date(challenge.start_date).toLocaleDateString('vi-VN')} -{' '}
              {new Date(challenge.end_date).toLocaleDateString('vi-VN')}
            </span>
          </div>

          {isOngoing && daysLeft > 0 && (
            <div className='flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400'>
              <FaClock className='text-orange-400 flex-shrink-0' />
              <span>Còn {daysLeft} ngày</span>
            </div>
          )}

          <div>
            <div className='flex justify-between text-xs mb-1'>
              <span className='text-gray-500 dark:text-gray-400 flex items-center gap-1'>
                <FaFire className='text-orange-400' />
                <span>Tiến độ cá nhân</span>
                <span className='text-gray-400'>·</span>
                <span>{completedDays} / {totalRequiredDays} ngày</span>
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
  const [activeTab, setActiveTab] = useState('created')
  const [pageByTab, setPageByTab] = useState({ created: 1, joined: 1 })
  const [keyword, setKeyword] = useState('')
  const page = pageByTab[activeTab]

  const createdQuery = useQuery({
    queryKey: isPublic
      ? ['publicUserChallenges-created', userId, { page, limit: LIMIT }]
      : ['my-created-challenges-profile', { page, limit: LIMIT }],
    queryFn: () =>
      isPublic
        ? getPublicUserChallenges(userId, { page, limit: LIMIT })
        : getMyCreatedChallenges({ page, limit: LIMIT }),
    enabled: activeTab === 'created',
    placeholderData: keepPreviousData
  })

  const joinedQuery = useQuery({
    queryKey: isPublic
      ? ['publicUserChallenges-joined', userId, { page, limit: LIMIT }]
      : ['my-challenges-profile', { page, limit: LIMIT }],
    queryFn: () =>
      isPublic
        ? getPublicUserChallenges(userId, { page, limit: LIMIT })
        : getMyChallenges({ page, limit: LIMIT }),
    enabled: activeTab === 'joined',
    placeholderData: keepPreviousData
  })

  const activeQuery = activeTab === 'created' ? createdQuery : joinedQuery
  const result = activeQuery?.data?.data?.result
  const sourceParticipations = result?.participations || []
  const sourceCreatedChallenges = result?.challenges || []
  const participations = useMemo(() => {
    if (!isPublic) {
      return activeTab === 'created'
        ? sourceCreatedChallenges.map((challenge) => ({
          _id: challenge._id,
          challenge_id: challenge,
          current_value: challenge.current_value || 0,
          is_completed: false,
          streak_count: challenge.streak_count || 0
        }))
        : sourceParticipations
    }
    const normalizeCreator = (item) =>
      String(
        item?.challenge_id?.created_by?._id ||
        item?.challenge_id?.created_by ||
        item?.challenge_id?.createdBy?._id ||
        item?.challenge_id?.createdBy ||
        ''
      )
    if (activeTab === 'created') {
      return sourceParticipations.filter((item) => normalizeCreator(item) === String(userId))
    }
    return sourceParticipations.filter((item) => normalizeCreator(item) !== String(userId))
  }, [activeTab, isPublic, sourceCreatedChallenges, sourceParticipations, userId])

  const filteredParticipations = participations.filter((item) => {
    const normalized = keyword.trim().toLowerCase()
    if (!normalized) return true
    const challenge = item?.challenge_id
    const searchable = [challenge?.title, challenge?.challenge_type, challenge?.badge_emoji]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return searchable.includes(normalized)
  })
  const totalPage = result?.totalPage || 1

  if (activeQuery.isLoading) {
    return <Loading className='flex justify-center py-20' />
  }

  if (participations.length === 0 && page === 1) {
    return (
      <div className='text-center py-16'>
        <FaTrophy className='text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4' />
        <h3 className='text-lg font-medium text-gray-500 dark:text-gray-400'>
          {activeTab === 'created' ? 'Chưa tạo thử thách nào' : 'Chưa tham gia thử thách nào'}
        </h3>
        {isOwner && (
          <>
            <p className='text-sm text-gray-400 dark:text-gray-500 mt-1'>
              {activeTab === 'created'
                ? 'Tạo thử thách đầu tiên để kết nối cộng đồng!'
                : 'Khám phá và tham gia các thử thách thú vị!'}
            </p>
            <Link
              to={activeTab === 'created' ? '/challenge/create' : '/challenge'}
              className='inline-flex items-center gap-2 mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors'
            >
              {activeTab === 'created' ? 'Tạo thử thách' : 'Khám phá thử thách'} <FaArrowRight />
            </Link>
          </>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className='mb-5 flex items-center gap-2 rounded-xl bg-gray-100 dark:bg-gray-800 p-1'>
        <button
          type='button'
          onClick={() => setActiveTab('created')}
          className={`flex-1 inline-flex justify-center items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition ${activeTab === 'created'
            ? 'bg-white dark:bg-gray-700 text-emerald-600 shadow-sm'
            : 'text-gray-500 dark:text-gray-300'
            }`}
        >
          <FaPlusCircle className='text-xs' />
          Thử thách đã tạo
        </button>
        <button
          type='button'
          onClick={() => setActiveTab('joined')}
          className={`flex-1 inline-flex justify-center items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition ${activeTab === 'joined'
            ? 'bg-white dark:bg-gray-700 text-emerald-600 shadow-sm'
            : 'text-gray-500 dark:text-gray-300'
            }`}
        >
          <FaCheckCircle className='text-xs' />
          Thử thách đã tham gia
        </button>
      </div>

      <div className='mb-5'>
        <label className='relative block'>
          <FiSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' />
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder='Tìm thử thách theo tiêu đề hoặc loại...'
            className='w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-2.5 pl-10 pr-4 text-sm text-gray-700 dark:text-gray-100 outline-none focus:border-emerald-500'
          />
        </label>
      </div>

      {filteredParticipations.length === 0 && (
        <div className='text-center py-10 text-sm text-gray-500 dark:text-gray-400'>
          Không tìm thấy thử thách phù hợp với từ khóa "{keyword}".
        </div>
      )}

      <motion.div variants={stagger} initial='hidden' animate='visible'>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          {filteredParticipations.map((p) => (
            <ChallengeCard key={p._id} participation={p} />
          ))}
        </div>
      </motion.div>

      {/* Pagination — cùng style Challenge.jsx */}
      {totalPage > 1 && !keyword.trim() && (
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
    </div>
  )
}
