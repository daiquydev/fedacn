import { useSafeMutation } from '../../hooks/useSafeMutation'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { FaFire, FaPlus, FaSearch, FaUsers, FaCalendarCheck, FaChevronRight, FaTrophy, FaStar } from 'react-icons/fa'
import { MdExplore } from 'react-icons/md'
import toast from 'react-hot-toast'
import { getHabitChallenges, getMyHabitChallenges, joinHabitChallenge, getChallengeProfile } from '../../apis/habitChallengeApi'

const CATEGORIES = [
  { value: 'all', label: 'Tất cả', emoji: '🌟' },
  { value: 'exercise', label: 'Tập luyện', emoji: '💪' },
  { value: 'nutrition', label: 'Dinh dưỡng', emoji: '🥗' },
  { value: 'sleep', label: 'Giấc ngủ', emoji: '😴' },
  { value: 'mental', label: 'Tinh thần', emoji: '🧘' },
  { value: 'hydration', label: 'Uống nước', emoji: '💧' },
  { value: 'other', label: 'Khác', emoji: '✨' }
]

const DIFFICULTY_CONFIG = {
  easy: { label: 'Nhẹ', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', emoji: '🌿' },
  medium: { label: 'Trung bình', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', emoji: '⚡' },
  hard: { label: 'Thử thách', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', emoji: '🔥' }
}

const TYPE_CONFIG = {
  solo: { label: 'Cá nhân', emoji: '🧑' },
  team: { label: 'Đội nhóm', emoji: '👥' },
  global: { label: 'Cộng đồng', emoji: '🌍' }
}

const LEVEL_THRESHOLDS = [
  { level: 1, xp: 0, title: 'Người mới 🌱' },
  { level: 2, xp: 100, title: 'Chiến binh 💪' },
  { level: 3, xp: 300, title: 'Kiên trì ⚡' },
  { level: 4, xp: 600, title: 'Bền bỉ 🔥' },
  { level: 5, xp: 1000, title: 'Huyền thoại 👑' }
]

function XPProfileBar({ profile }) {
  if (!profile) return null

  const current = LEVEL_THRESHOLDS.find(l => l.level === profile.level) || LEVEL_THRESHOLDS[0]
  const next = LEVEL_THRESHOLDS.find(l => l.level === profile.level + 1)
  const xpInLevel = profile.total_xp - current.xp
  const xpNeeded = next ? next.xp - current.xp : 0
  const progress = next ? Math.min(Math.round((xpInLevel / xpNeeded) * 100), 100) : 100

  return (
    <div className='mb-6 p-4 bg-gradient-to-r from-orange-500/10 via-red-500/10 to-pink-500/10 dark:from-orange-900/20 dark:via-red-900/20 dark:to-pink-900/20 rounded-2xl border border-orange-200/50 dark:border-orange-700/30'>
      <div className='flex items-center justify-between mb-2'>
        <div className='flex items-center gap-2'>
          <span className='text-lg'>{current.title.split(' ').pop()}</span>
          <div>
            <p className='text-sm font-bold text-gray-800 dark:text-white'>Level {profile.level} — {profile.title}</p>
            <p className='text-xs text-gray-500 dark:text-gray-400'>
              {profile.total_xp} XP tổng • {profile.challenges_completed} thử thách hoàn thành
            </p>
          </div>
        </div>
        <div className='text-right'>
          <p className='text-lg font-bold text-orange-500'>{profile.total_xp} XP</p>
          {next && <p className='text-[10px] text-gray-400'>Còn {next.xp - profile.total_xp} XP → Level {next.level}</p>}
        </div>
      </div>
      <div className='w-full bg-gray-200/50 dark:bg-gray-700/50 rounded-full h-2'>
        <div
          className='h-2 rounded-full bg-gradient-to-r from-orange-400 to-red-500 transition-all duration-700'
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className='flex justify-between mt-2 text-[10px] text-gray-400'>
        <span className='flex items-center gap-1'><FaTrophy size={10} /> Streak dài nhất: {profile.longest_streak_ever} ngày</span>
        <span className='flex items-center gap-1'><FaStar size={10} /> Perfect: {profile.perfect_challenges}</span>
        <span className='flex items-center gap-1'>❄️ Freeze: {profile.streak_freeze_tokens}</span>
      </div>
    </div>
  )
}

function ChallengeCard({ challenge, onJoin, isJoining }) {
  const navigate = useNavigate()
  const categoryEmoji = CATEGORIES.find(c => c.value === challenge.category)?.emoji || '✨'
  const diff = DIFFICULTY_CONFIG[challenge.difficulty] || DIFFICULTY_CONFIG.medium
  const type = TYPE_CONFIG[challenge.challenge_type] || TYPE_CONFIG.solo

  return (
    <div
      className='bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer group border border-gray-100 dark:border-gray-700'
      onClick={() => navigate(`/habit-challenge/${challenge._id}`)}
    >
      <div className='relative h-40 overflow-hidden'>
        {challenge.image ? (
          <img src={challenge.image} alt={challenge.title} className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-500' />
        ) : (
          <div className='w-full h-full bg-gradient-to-br from-orange-400 via-red-400 to-pink-500 flex items-center justify-center'>
            <span className='text-5xl'>{categoryEmoji}</span>
          </div>
        )}
        {/* Top badges */}
        <div className='absolute top-3 left-3 flex items-center gap-1.5'>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${diff.color}`}>
            {diff.emoji} {diff.label}
          </span>
          <span className='px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 dark:bg-gray-800/90 text-gray-600 dark:text-gray-300'>
            {type.emoji} {type.label}
          </span>
        </div>
        <div className='absolute top-3 right-3'>
          <span className='px-2.5 py-1 rounded-full text-xs font-bold bg-orange-500 text-white'>
            {challenge.duration_days} ngày
          </span>
        </div>
        {/* Min level badge */}
        {challenge.min_level > 1 && (
          <div className='absolute bottom-3 left-3'>
            <span className='px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'>
              🔒 Level {challenge.min_level}+
            </span>
          </div>
        )}
      </div>

      <div className='p-4'>
        <h3 className='font-bold text-gray-800 dark:text-white text-base line-clamp-1 mb-1.5'>
          {challenge.title}
        </h3>
        <p className='text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3 min-h-[2.5rem]'>
          {challenge.description || 'Không có mô tả'}
        </p>

        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400'>
            <span className='flex items-center gap-1'>
              <FaUsers className='text-blue-500' /> {challenge.participants_count || 0}
            </span>
            <span className='flex items-center gap-1'>
              <FaCalendarCheck className='text-green-500' /> {challenge.duration_days}d
            </span>
          </div>

          {challenge.isJoined ? (
            <span className='px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'>
              Đang tham gia
            </span>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onJoin(challenge._id) }}
              disabled={isJoining}
              className='px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white transition-colors disabled:opacity-50'
            >
              Tham gia
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function MyParticipationCard({ participation }) {
  const navigate = useNavigate()
  const challenge = participation.challenge_id
  if (!challenge) return null

  const progress = challenge.duration_days > 0
    ? Math.round((participation.total_checkins / challenge.duration_days) * 100)
    : 0

  const diff = DIFFICULTY_CONFIG[challenge.difficulty] || DIFFICULTY_CONFIG.medium

  return (
    <div
      className='bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer border border-gray-100 dark:border-gray-700 p-4'
      onClick={() => navigate(`/habit-challenge/${challenge._id}`)}
    >
      <div className='flex items-start gap-3'>
        <div className='w-14 h-14 rounded-xl overflow-hidden flex-shrink-0'>
          {challenge.image ? (
            <img src={challenge.image} alt={challenge.title} className='w-full h-full object-cover' />
          ) : (
            <div className='w-full h-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-2xl'>
              🔥
            </div>
          )}
        </div>

        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-1.5 mb-0.5'>
            <h3 className='font-bold text-gray-800 dark:text-white text-sm line-clamp-1'>{challenge.title}</h3>
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${diff.color}`}>
              {diff.emoji}
            </span>
          </div>
          <div className='flex items-center gap-2 mt-1'>
            <div className='flex items-center gap-1'>
              <FaFire className='text-orange-500' size={14} />
              <span className='text-sm font-bold text-orange-500'>{participation.current_streak}</span>
              <span className='text-xs text-gray-400'>streak</span>
            </div>
            <span className='text-gray-300 dark:text-gray-600'>•</span>
            <span className='text-xs text-gray-500'>
              {participation.total_checkins}/{challenge.duration_days} ngày
            </span>
            <span className='text-gray-300 dark:text-gray-600'>•</span>
            <span className='text-xs font-bold text-amber-500'>
              +{participation.xp_earned} XP
            </span>
          </div>

          <div className='mt-2'>
            <div className='w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5'>
              <div
                className='h-1.5 rounded-full bg-gradient-to-r from-orange-400 to-red-500 transition-all duration-500'
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <FaChevronRight className='text-gray-300 dark:text-gray-600 mt-1' size={12} />
      </div>

      {participation.status === 'completed' && (
        <div className='mt-3 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-lg text-center'>
          <span className='text-xs font-semibold text-green-600 dark:text-green-400'>🎉 Đã hoàn thành!</span>
        </div>
      )}
    </div>
  )
}

export default function HabitChallenge() {
  const [activeTab, setActiveTab] = useState('explore')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [difficulty, setDifficulty] = useState('all')
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data: profileData } = useQuery({
    queryKey: ['challenge-profile'],
    queryFn: getChallengeProfile
  })

  const { data: challengesData, isLoading: loadingChallenges } = useQuery({
    queryKey: ['habit-challenges', { page, search, category, difficulty }],
    queryFn: () => getHabitChallenges({
      page, limit: 12,
      search: search || undefined,
      category: category !== 'all' ? category : undefined,
      difficulty: difficulty !== 'all' ? difficulty : undefined
    })
  })

  const { data: myData, isLoading: loadingMy } = useQuery({
    queryKey: ['my-habit-challenges'],
    queryFn: () => getMyHabitChallenges({ page: 1, limit: 50 })
  })

  const joinMutation = useSafeMutation({
    mutationFn: (id) => joinHabitChallenge(id),
    onSuccess: () => {
      toast.success('Đã tham gia thử thách!')
      queryClient.invalidateQueries({ queryKey: ['habit-challenges'] })
      queryClient.invalidateQueries({ queryKey: ['my-habit-challenges'] })
      queryClient.invalidateQueries({ queryKey: ['challenge-profile'] })
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Không thể tham gia')
  })

  const profile = profileData?.data?.result
  const challenges = challengesData?.data?.result?.challenges || []
  const totalPage = challengesData?.data?.result?.totalPage || 1
  const myParticipations = myData?.data?.result?.participations || []

  return (
    <div className='max-w-6xl mx-auto px-4 py-6'>
      {/* Header */}
      <div className='mb-4'>
        <div className='flex items-center justify-between mb-4'>
          <div>
            <h1 className='text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2'>
              <FaFire className='text-orange-500' /> Thử Thách Thói Quen
            </h1>
            <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
              Check-in • Kiếm XP • Lên Level • Nhận Huy hiệu
            </p>
          </div>
          <button
            onClick={() => navigate('/habit-challenge/create')}
            className='flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-orange-500/25 transition-all'
          >
            <FaPlus /> Tạo thử thách
          </button>
        </div>

        {/* XP Profile */}
        <XPProfileBar profile={profile} />

        {/* Tabs */}
        <div className='flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit'>
          <button
            onClick={() => setActiveTab('explore')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'explore'
              ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            <MdExplore size={18} /> Khám phá
          </button>
          <button
            onClick={() => setActiveTab('mine')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'mine'
              ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            <FaFire size={14} /> Của tôi ({myParticipations.length})
          </button>
        </div>
      </div>

      {/* === EXPLORE TAB === */}
      {activeTab === 'explore' && (
        <>
          <div className='mb-5 space-y-3'>
            <div className='relative'>
              <FaSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' />
              <input
                type='text'
                placeholder='Tìm thử thách...'
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className='w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 dark:text-white'
              />
            </div>

            {/* Filters row */}
            <div className='flex gap-2 overflow-x-auto pb-1 scrollbar-thin'>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => { setCategory(cat.value); setPage(1) }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${category === cat.value
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>

            {/* Difficulty filter */}
            <div className='flex gap-2'>
              {[
                { value: 'all', label: 'Tất cả', emoji: '🎯' },
                { value: 'easy', label: 'Nhẹ', emoji: '🌿' },
                { value: 'medium', label: 'Trung bình', emoji: '⚡' },
                { value: 'hard', label: 'Thử thách', emoji: '🔥' }
              ].map(d => (
                <button
                  key={d.value}
                  onClick={() => { setDifficulty(d.value); setPage(1) }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${difficulty === d.value
                    ? 'bg-gray-800 dark:bg-white text-white dark:text-gray-800 shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {d.emoji} {d.label}
                </button>
              ))}
            </div>
          </div>

          {loadingChallenges ? (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className='bg-gray-100 dark:bg-gray-800 rounded-2xl h-72 animate-pulse' />
              ))}
            </div>
          ) : challenges.length === 0 ? (
            <div className='text-center py-16'>
              <span className='text-5xl block mb-4'>🌱</span>
              <h3 className='text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2'>
                Chưa có thử thách nào
              </h3>
              <p className='text-sm text-gray-500 dark:text-gray-400 mb-4'>
                Hãy là người đầu tiên tạo thử thách!
              </p>
              <button
                onClick={() => navigate('/habit-challenge/create')}
                className='px-5 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors'
              >
                Tạo thử thách đầu tiên
              </button>
            </div>
          ) : (
            <>
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                {challenges.map(challenge => (
                  <ChallengeCard
                    key={challenge._id}
                    challenge={challenge}
                    onJoin={(id) => joinMutation.mutate(id)}
                    isJoining={joinMutation.isPending}
                  />
                ))}
              </div>

              {totalPage > 1 && (
                <div className='flex justify-center gap-2 mt-6'>
                  {Array.from({ length: totalPage }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${p === page
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* === MY CHALLENGES TAB === */}
      {activeTab === 'mine' && (
        <>
          {loadingMy ? (
            <div className='space-y-3'>
              {[1, 2, 3].map(i => (
                <div key={i} className='bg-gray-100 dark:bg-gray-800 rounded-2xl h-24 animate-pulse' />
              ))}
            </div>
          ) : myParticipations.length === 0 ? (
            <div className='text-center py-16'>
              <span className='text-5xl block mb-4'>🎯</span>
              <h3 className='text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2'>
                Bạn chưa tham gia thử thách nào
              </h3>
              <p className='text-sm text-gray-500 dark:text-gray-400 mb-4'>
                Khám phá và tham gia các thử thách để kiếm XP!
              </p>
              <button
                onClick={() => setActiveTab('explore')}
                className='px-5 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors'
              >
                Khám phá ngay
              </button>
            </div>
          ) : (
            <div className='space-y-3'>
              {myParticipations.map(p => (
                <MyParticipationCard key={p._id} participation={p} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
