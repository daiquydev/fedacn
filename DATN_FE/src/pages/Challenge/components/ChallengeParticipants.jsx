import React, { useState, useMemo } from 'react'
import { FaSearch, FaFire, FaCheck, FaTimes, FaCircle } from 'react-icons/fa'
import useravatar from '../../../assets/images/useravatar.jpg'
import { getImageUrl } from '../../../utils/imageUrl'

const GRADIENT_MAP = {
  nutrition: 'from-emerald-500 to-teal-600',
  outdoor_activity: 'from-blue-500 to-cyan-600',
  fitness: 'from-purple-500 to-pink-600'
}

export default function ChallengeParticipants({
  participants = [],
  isLoading,
  challengeType = 'fitness',
  goalUnit = 'ngày',
  onViewProgress
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const gradient = GRADIENT_MAP[challengeType] || GRADIENT_MAP.fitness

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return participants
    const lc = searchTerm.toLowerCase()
    return participants.filter(p => {
      const name = p.user?.name || ''
      return name.toLowerCase().includes(lc)
    })
  }, [participants, searchTerm])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header + Search */}
      <div className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
        <div className="flex-1 relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
          <input
            type="text"
            placeholder="Tìm kiếm người tham gia..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-none rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none"
          />
        </div>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
          {filtered.length} người
        </span>
      </div>

      {/* Participant list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 text-sm font-medium">
            {searchTerm ? 'Không tìm thấy người tham gia' : 'Chưa có người tham gia'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((participant, idx) => {
            const user = participant.user || {}
            const pct = participant.progress_percent || 0
            const isCompleted = participant.is_completed

            return (
              <button
                key={user._id || idx}
                onClick={() => onViewProgress?.(participant)}
                className="w-full bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600 hover:shadow-md transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  {/* Rank badge */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${
                    participant.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                    participant.rank === 2 ? 'bg-gray-100 text-gray-600' :
                    participant.rank === 3 ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-50 dark:bg-gray-700 text-gray-500'
                  }`}>
                    {participant.rank <= 3
                      ? ['🥇', '🥈', '🥉'][participant.rank - 1]
                      : `#${participant.rank}`
                    }
                  </div>

                  {/* Avatar */}
                  <div className="relative">
                    <img
                      src={user.avatar ? getImageUrl(user.avatar) : useravatar}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-gray-100 dark:border-gray-600"
                      onError={e => { e.target.onerror = null; e.target.src = useravatar }}
                    />
                    {isCompleted && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                        <FaCheck className="text-white" style={{ fontSize: 6 }} />
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-gray-800 dark:text-white truncate group-hover:text-orange-600 transition">
                        {user.name || 'Ẩn danh'}
                      </p>
                      {isCompleted && (
                        <span className="px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[9px] font-bold">
                          Hoàn thành
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-0.5">
                      {/* Today's check-in progress */}
                      <span className="font-medium text-gray-500 dark:text-gray-400">
                        {participant.today_value ?? 0}/{participant.goal_value} {goalUnit} hôm nay
                      </span>
                      {/* Overall completed days */}
                      {participant.total_required_days > 0 && (
                        <span className="text-gray-400">
                          · {participant.current_value}/{participant.total_required_days} ngày
                        </span>
                      )}
                      {participant.streak_count > 0 && (
                        <span className="flex items-center gap-0.5 text-orange-500">
                          <FaFire className="text-[9px]" /> {participant.streak_count}🔥
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress circular */}
                  <div className="relative w-12 h-12">
                    <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="2.5"
                        className="text-gray-200 dark:text-gray-700" />
                      <circle cx="18" cy="18" r="15" fill="none" strokeWidth="2.5"
                        strokeDasharray={`${pct * 0.942} 94.2`}
                        strokeLinecap="round"
                        className={`${isCompleted ? 'text-green-500' : pct >= 50 ? 'text-blue-500' : 'text-orange-400'}`}
                        stroke="currentColor" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-700 dark:text-gray-300">
                      {pct}%
                    </span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
