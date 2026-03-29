import React, { useState, useMemo } from 'react'
import { FaMedal, FaSearch, FaTrophy, FaCheck, FaUserFriends } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import { getImageUrl } from '../../../utils/imageUrl'
import useravatar from '../../../assets/images/useravatar.jpg'

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Ring style based on relationship */
const getRingStyle = (isFriend, isConnected) => {
  if (isFriend) return '0 0 0 3px #22c55e, 0 0 0 5px rgba(34,197,94,0.25)'
  if (isConnected) return '0 0 0 2px #60a5fa, 0 0 0 4px rgba(96,165,250,0.2)'
  return null
}

// ─── Podium Step ─────────────────────────────────────────────────────────────
const PodiumStep = ({ participant, rank, connectedIds = new Set(), friendIds = new Set(), isMe = false }) => {
  const navigate = useNavigate()
  if (!participant) return <div className="flex-1" />

  const isFirst = rank === 1
  const isSecond = rank === 2

  let heightClass = 'h-32'
  let colorClass = 'bg-gray-100'
  let iconColor = 'text-gray-400'

  if (isFirst) {
    heightClass = 'h-48'
    colorClass = 'bg-yellow-100 border-yellow-300'
    iconColor = 'text-yellow-500'
  } else if (isSecond) {
    heightClass = 'h-40'
    colorClass = 'bg-gray-200 border-gray-300'
    iconColor = 'text-gray-400'
  } else {
    colorClass = 'bg-orange-100 border-orange-300'
    iconColor = 'text-orange-500'
    heightClass = 'h-36'
  }

  const userId = participant.userId || participant._id
  const isFriend = userId && friendIds.has(String(userId))
  const isConnected = userId && connectedIds.has(String(userId))
  const ringStyle = getRingStyle(isFriend, isConnected)

  return (
    <div className={`flex flex-col items-center justify-end ${isFirst ? 'order-2' : isSecond ? 'order-1' : 'order-3'} flex-1`}>
      <div className="relative mb-4 flex flex-col items-center">
        <FaTrophy className={`text-2xl mb-2 ${iconColor}`} />
        <button
          onClick={() => userId && navigate(`/user/${userId}`)}
          className="focus:outline-none"
          title={`Xem trang cá nhân ${participant.name}`}
        >
          <div
            className={`relative ${isFirst ? 'w-24 h-24' : 'w-20 h-20'} rounded-full border-4 ${isMe ? 'border-blue-400' : 'border-white'} shadow-md overflow-hidden`}
            style={ringStyle ? { boxShadow: `0 0 0 4px white, ${ringStyle}` } : {}}
          >
            <img
              src={participant.avatar ? getImageUrl(participant.avatar) : useravatar}
              alt={participant.name}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.onerror = null; e.target.src = useravatar }}
            />
          </div>
          {isFriend && (
            <span className="absolute bottom-0 right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center shadow z-10">
              <FaCheck className="text-white" style={{ fontSize: 7 }} />
            </span>
          )}
        </button>
        <div className={`absolute -bottom-3 px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm ${isFirst ? 'bg-yellow-500' : isSecond ? 'bg-gray-500' : 'bg-orange-500'
          }`}>
          #{rank}
        </div>
      </div>

      <div className="text-center mb-2">
        <p className={`font-bold truncate max-w-[120px] ${isMe ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
          {participant.name} {isMe && '(Bạn)'}
        </p>
        <p className="text-sm font-semibold text-red-500">{Number(participant.totalProgress || 0).toFixed(2)}</p>
      </div>

      <div className={`w-full ${heightClass} ${colorClass} rounded-t-lg border-t-4 flex items-end justify-center pb-4 shadow-inner`}>
        <span className={`text-4xl font-black opacity-20 ${isFirst ? 'text-yellow-600' : 'text-gray-600'}`}>
          {rank}
        </span>
      </div>
    </div>
  )
}

// ─── Main Leaderboard ─────────────────────────────────────────────────────────
export default function SportEventLeaderboard({
  participants,
  isLoading,
  searchTerm,
  setSearchTerm,
  event,
  connectedIds = new Set(),
  friendIds = new Set(),
  currentUserId = null
}) {
  const navigate = useNavigate()
  const [filterMode, setFilterMode] = useState('all') // 'all' | 'friends'

  const filteredParticipants = useMemo(() => {
    let list = participants
    if (filterMode === 'friends') {
      list = list.filter(p => {
        const uid = p.userId || p._id
        return uid && (friendIds.has(String(uid)) || String(uid) === String(currentUserId))
      })
    }
    return list
  }, [participants, filterMode, friendIds, currentUserId])

  const top3 = filteredParticipants.slice(0, 3)

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Podium Section */}
      {filteredParticipants.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm mb-8">
          <h3 className="text-center text-2xl font-black text-gray-800 dark:text-white mb-8 uppercase tracking-wider">
            Top Xuất Sắc Nhất
          </h3>
          <div className="flex items-end justify-center max-w-2xl mx-auto gap-4">
            <PodiumStep participant={top3[1]} rank={2} connectedIds={connectedIds} friendIds={friendIds} isMe={top3[1] && String(top3[1].userId || top3[1]._id) === String(currentUserId)} />
            <PodiumStep participant={top3[0]} rank={1} connectedIds={connectedIds} friendIds={friendIds} isMe={top3[0] && String(top3[0].userId || top3[0]._id) === String(currentUserId)} />
            <PodiumStep participant={top3[2]} rank={3} connectedIds={connectedIds} friendIds={friendIds} isMe={top3[2] && String(top3[2].userId || top3[2]._id) === String(currentUserId)} />
          </div>
        </div>
      )}

      {/* 2. List Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Người tham gia</h3>
            {/* Filter Toggle */}
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${filterMode === 'all'
                  ? 'bg-red-500 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
              >
                Tất cả ({participants.length})
              </button>
              <button
                onClick={() => setFilterMode('friends')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1 ${filterMode === 'friends'
                  ? 'bg-green-500 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
              >
                <FaUserFriends className="text-xs" />
                Bạn bè
              </button>
            </div>
          </div>

          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-none rounded-xl focus:ring-2 focus:ring-red-500 w-full md:w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {/* Thông tin mục tiêu mỗi người */}
          {event?.targetValue && event?.maxParticipants > 0 && (
            <div className="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800 flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
              <FaTrophy className="text-blue-400 flex-shrink-0" />
              <span>
                Mục tiêu mỗi người:{' '}
                <strong>{(event.targetValue / event.maxParticipants).toFixed(2)} {event.targetUnit}</strong>
              </span>
            </div>
          )}
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-750 text-gray-500 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4 text-left">Hạng</th>
                <th className="px-6 py-4 text-left">Vận động viên</th>
                <th className="px-6 py-4 text-left">Kết quả ({event.targetUnit})</th>
                <th className="px-6 py-4 text-left">Tiến độ cá nhân</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredParticipants.map((user, idx) => {
                const userId = user.userId || user._id
                const isFriend = userId && friendIds.has(String(userId))
                const isConnected = userId && connectedIds.has(String(userId))
                const ringStyle = getRingStyle(isFriend, isConnected)
                const isMe = String(userId) === String(currentUserId)

                const maxParticipants = event?.maxParticipants > 0 ? event.maxParticipants : 1
                const perPersonTarget = event?.targetValue > 0 ? event.targetValue / maxParticipants : 1
                const correctedPct = Math.min(Math.round((user.totalProgress / perPersonTarget) * 100), 100)

                return (
                  <tr
                    key={userId || idx}
                    className={`transition ${isMe
                      ? 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-750'
                      }`}
                  >
                    <td className="px-6 py-4">
                      <span className={`font-bold ${user.rank <= 3 ? 'text-red-500 text-lg' : 'text-gray-500'}`}>
                        #{user.rank}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => userId && navigate(`/user/${userId}`)}
                          className="relative flex-shrink-0 focus:outline-none"
                          title={`Xem trang cá nhân ${user.name}`}
                        >
                          <img
                            src={user.avatar ? getImageUrl(user.avatar) : useravatar}
                            alt={user.name}
                            className={`w-10 h-10 rounded-full object-cover ${isMe ? 'ring-2 ring-blue-500' : ''}`}
                            style={!isMe && ringStyle ? { boxShadow: ringStyle } : !isMe ? { border: '2px solid #e5e7eb' } : {}}
                            onError={(e) => { e.target.onerror = null; e.target.src = useravatar }}
                          />
                          {isFriend && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                              <FaCheck className="text-white" style={{ fontSize: 6 }} />
                            </span>
                          )}
                        </button>
                        <div>
                          <button
                            onClick={() => userId && navigate(`/user/${userId}`)}
                            className={`font-semibold hover:text-red-500 dark:hover:text-red-400 transition-colors text-left ${isMe ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}
                          >
                            {user.name} {isMe && <span className="text-xs font-normal text-blue-400">(Bạn)</span>}
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-gray-900 dark:text-white">{Number(user.totalProgress || 0).toFixed(2)} {event.targetUnit}</span>
                      <span className="text-xs text-gray-400 block">/ {perPersonTarget.toFixed(2)} {event.targetUnit}</span>
                    </td>
                    <td className="px-6 py-4 w-1/4">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${correctedPct >= 100 ? 'bg-green-500' : correctedPct >= 50 ? 'bg-blue-500' : 'bg-orange-400'}`}
                          style={{ width: `${correctedPct}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 mt-1 block text-right">{correctedPct}%</span>
                    </td>
                  </tr>
                )
              })}
              {filteredParticipants.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-12 text-gray-500">
                    {filterMode === 'friends' ? 'Chưa có bạn bè nào tham gia sự kiện này' : 'Chưa có dữ liệu xếp hạng'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
