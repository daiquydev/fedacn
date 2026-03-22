import { useQuery } from '@tanstack/react-query'
import { getBadgesForChallenge } from '../../../apis/habitChallengeApi'
import moment from 'moment'

const BADGE_MAP = {
  first_checkin: { emoji: '🌱', label: 'Check-in đầu tiên', color: 'from-green-400 to-emerald-500' },
  streak_7: { emoji: '🔥', label: '7 ngày liên tiếp', color: 'from-orange-400 to-red-500' },
  streak_14: { emoji: '⚡', label: '14 ngày liên tiếp', color: 'from-yellow-400 to-orange-500' },
  streak_21: { emoji: '💎', label: '21 ngày liên tiếp', color: 'from-blue-400 to-purple-500' },
  streak_30: { emoji: '👑', label: '30 ngày liên tiếp', color: 'from-yellow-300 to-amber-500' },
  challenge_complete: { emoji: '🏆', label: 'Hoàn thành', color: 'from-emerald-400 to-teal-500' },
  perfect_streak: { emoji: '💯', label: 'Streak hoàn hảo', color: 'from-pink-400 to-rose-500' }
}

export default function BadgeDisplay({ challengeId }) {
  const { data: badgesData } = useQuery({
    queryKey: ['habit-badges', challengeId],
    queryFn: () => getBadgesForChallenge(challengeId)
  })

  const badges = badgesData?.data?.result || []

  if (badges.length === 0) return null

  return (
    <div className='bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 mt-4'>
      <h3 className='font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2'>
        🏅 Huy hiệu đã nhận
      </h3>
      <div className='flex flex-wrap gap-3'>
        {badges.map(badge => {
          const info = BADGE_MAP[badge.badge_type] || { emoji: '⭐', label: badge.badge_type, color: 'from-gray-400 to-gray-500' }
          return (
            <div
              key={badge._id}
              className='group relative flex flex-col items-center'
              title={`${info.label} - ${moment(badge.earned_at).format('DD/MM/YYYY')}`}
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${info.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform cursor-default`}>
                <span className='text-2xl'>{info.emoji}</span>
              </div>
              <span className='text-[10px] text-gray-500 dark:text-gray-400 mt-1.5 text-center max-w-[5rem] leading-tight'>
                {info.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
