import React, { useState, useMemo } from 'react'
import { FaMedal, FaSearch, FaTrophy, FaCheck, FaUserFriends, FaCrown, FaSort, FaSortUp, FaSortDown, FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import { getImageUrl } from '../../../utils/imageUrl'
import useravatar from '../../../assets/images/useravatar.jpg'

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Returns role info for a participant given social context.
 * Priority: organizer → friend → connected → none
 */
function getRole(userId, creatorId, friendIds, connectedIds) {
  const uid = String(userId || '')
  if (!uid) return { isOrganizer: false, isFriend: false, isConnected: false, label: '', labelColor: '' }
  const isOrganizer = !!(uid && String(creatorId) && uid === String(creatorId))
  const isFriend = friendIds.has(uid)
  const isConnected = connectedIds.has(uid)
  return {
    isOrganizer,
    isFriend,
    isConnected,
    label: isOrganizer ? 'Người tổ chức' : isFriend ? 'Bạn bè' : isConnected ? 'Theo dõi' : '',
    labelColor: isOrganizer ? 'text-amber-400' : isFriend ? 'text-green-400' : 'text-blue-400',
  }
}

/** Ring box-shadow based on role */
function getRingBoxShadow(isOrganizer, isFriend, isConnected) {
  if (isOrganizer) return '0 0 0 3px #f59e0b, 0 0 0 5px rgba(245,158,11,0.25)'
  if (isFriend) return '0 0 0 3px #22c55e, 0 0 0 5px rgba(34,197,94,0.25)'
  if (isConnected) return '0 0 0 2px #60a5fa, 0 0 0 4px rgba(96,165,250,0.2)'
  return null
}

// ─── Podium Step ─────────────────────────────────────────────────────────────
const PodiumStep = ({
  participant,
  rank,
  connectedIds = new Set(),
  friendIds = new Set(),
  isMe = false,
  creatorId = '',
  event
}) => {
  const navigate = useNavigate()
  if (!participant) return <div className="flex-1" />

  const isFirst = rank === 1
  const isSecond = rank === 2

  let heightClass = 'h-32'
  let colorClass = 'bg-gray-100'
  let iconColor = 'text-gray-400'
  if (isFirst) { heightClass = 'h-48'; colorClass = 'bg-yellow-100 border-yellow-300'; iconColor = 'text-yellow-500' }
  else if (isSecond) { heightClass = 'h-40'; colorClass = 'bg-gray-200 border-gray-300'; iconColor = 'text-gray-400' }
  else { colorClass = 'bg-orange-100 border-orange-300'; iconColor = 'text-orange-500'; heightClass = 'h-36' }

  const userId = participant.userId || participant._id
  const { isOrganizer, isFriend, isConnected, label, labelColor } = getRole(userId, creatorId, friendIds, connectedIds)
  const ringBoxShadow = getRingBoxShadow(isOrganizer, isFriend, isConnected)

  // Badge color + icon
  const badgeBg = isOrganizer ? 'bg-amber-500' : 'bg-green-500'
  const showBadge = isOrganizer || isFriend

  return (
    <div className={`flex flex-col items-center justify-end ${isFirst ? 'order-2' : isSecond ? 'order-1' : 'order-3'} flex-1`}>
      <div className="relative mb-4 flex flex-col items-center">
        <FaTrophy className={`text-2xl mb-2 ${iconColor}`} />
        <button
          onClick={() => userId && navigate(`/user/${userId}`)}
          className="relative focus:outline-none"
          title={`Xem trang cá nhân ${participant.name}`}
        >
          <div
            className={`${isFirst ? 'w-24 h-24' : 'w-20 h-20'} rounded-full border-4 ${isMe ? 'border-blue-400' : 'border-white'} shadow-md overflow-hidden`}
            style={ringBoxShadow ? { boxShadow: `0 0 0 4px white, ${ringBoxShadow}` } : {}}
          >
            <img
              src={participant.avatar ? getImageUrl(participant.avatar) : useravatar}
              alt={participant.name}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.onerror = null; e.target.src = useravatar }}
            />
          </div>

          {/* Badge */}
          {showBadge && (
            <span className={`absolute bottom-0 right-1 w-5 h-5 ${badgeBg} rounded-full border-2 border-white flex items-center justify-center shadow z-10`}>
              {isOrganizer
                ? <FaCrown className="text-white" style={{ fontSize: 7 }} />
                : <FaCheck className="text-white" style={{ fontSize: 7 }} />
              }
            </span>
          )}
        </button>

        {/* Rank badge */}
        <div className={`absolute -bottom-3 px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm ${isFirst ? 'bg-yellow-500' : isSecond ? 'bg-gray-500' : 'bg-orange-500'}`}>
          #{rank}
        </div>
      </div>

      <div className="text-center mb-2">
        <p className={`font-bold truncate max-w-[120px] ${isMe ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
          {participant.name} {isMe && '(Bạn)'}
        </p>
        {/* Role label */}
        {label && (
          <p className={`text-[10px] font-semibold ${labelColor} flex items-center justify-center gap-0.5`}>
            {isOrganizer && <FaCrown style={{ fontSize: 8 }} />}
            {label}
          </p>
        )}
        <p className="text-sm font-semibold text-red-500 mt-0.5">
          {Number(participant.totalProgress || 0).toFixed(2)} {event?.targetUnit}
        </p>
      </div>

      <div className={`w-full ${heightClass} ${colorClass} rounded-t-lg border-t-4 flex items-end justify-center pb-4 shadow-inner`}>
        <span className={`text-4xl font-black opacity-20 ${isFirst ? 'text-yellow-600' : 'text-gray-600'}`}>
          {rank}
        </span>
      </div>
    </div>
  )
}

const PAGE_SIZE = 10

// ─── Sort Icon ───────────────────────────────────────────────────────────────
function SortIcon({ colKey, sortConfig }) {
  if (sortConfig.key !== colKey) return <FaSort className="text-gray-300 group-hover:text-gray-400 transition-colors" />
  return sortConfig.direction === 'asc'
    ? <FaSortUp className="text-red-500" />
    : <FaSortDown className="text-red-500" />
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
  currentUserId = null,
  creatorId = '',
}) {
  const navigate = useNavigate()
  const [filterMode, setFilterMode] = useState('all') // 'all' | 'friends'
  const [sortConfig, setSortConfig] = useState({ key: 'rank', direction: 'asc' })
  const [page, setPage] = useState(1)

  const maxParticipants = event?.maxParticipants > 0 ? event.maxParticipants : 1
  const perPersonTarget = event?.targetValue > 0 ? event.targetValue / maxParticipants : 1

  // Toggle sort: same key → flip direction; new key → asc
  const handleSort = (key) => {
    setSortConfig(prev =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    )
    setPage(1)
  }

  const filteredParticipants = useMemo(() => {
    let list = participants
    if (filterMode === 'friends') {
      list = list.filter(p => {
        const uid = p.userId || p._id
        return uid && (friendIds.has(String(uid)) || String(uid) === String(currentUserId))
      })
    }

    // Sort
    return [...list].sort((a, b) => {
      let valA, valB
      switch (sortConfig.key) {
        case 'rank':
          valA = a.rank ?? 9999
          valB = b.rank ?? 9999
          break
        case 'name':
          valA = (a.name || '').toLowerCase()
          valB = (b.name || '').toLowerCase()
          return sortConfig.direction === 'asc'
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA)
        case 'totalProgress':
          valA = a.totalProgress ?? 0
          valB = b.totalProgress ?? 0
          break
        case 'progressPct': {
          valA = perPersonTarget > 0 ? (a.totalProgress ?? 0) / perPersonTarget : (a.progressPercentage ?? 0)
          valB = perPersonTarget > 0 ? (b.totalProgress ?? 0) / perPersonTarget : (b.progressPercentage ?? 0)
          break
        }
        default:
          valA = a.rank ?? 9999
          valB = b.rank ?? 9999
      }
      return sortConfig.direction === 'asc' ? valA - valB : valB - valA
    })
  }, [participants, filterMode, friendIds, currentUserId, sortConfig, perPersonTarget])

  const totalPages = Math.max(1, Math.ceil(filteredParticipants.length / PAGE_SIZE))
  const pagedParticipants = filteredParticipants.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

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
            <PodiumStep participant={top3[1]} rank={2} connectedIds={connectedIds} friendIds={friendIds}
              isMe={top3[1] && String(top3[1].userId || top3[1]._id) === String(currentUserId)}
              creatorId={creatorId} event={event}
            />
            <PodiumStep participant={top3[0]} rank={1} connectedIds={connectedIds} friendIds={friendIds}
              isMe={top3[0] && String(top3[0].userId || top3[0]._id) === String(currentUserId)}
              creatorId={creatorId} event={event}
            />
            <PodiumStep participant={top3[2]} rank={3} connectedIds={connectedIds} friendIds={friendIds}
              isMe={top3[2] && String(top3[2].userId || top3[2]._id) === String(currentUserId)}
              creatorId={creatorId} event={event}
            />
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-5 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <span className="w-3 h-3 rounded-full bg-amber-500 flex items-center justify-center">
                <FaCrown style={{ fontSize: 6, color: 'white' }} />
              </span>
              Người tổ chức
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <span className="w-3 h-3 rounded-full bg-green-500 flex items-center justify-center">
                <FaCheck style={{ fontSize: 6, color: 'white' }} />
              </span>
              Bạn bè
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <span className="inline-block w-3 h-3 rounded-full border-2 border-blue-400" />
              Theo dõi
            </span>
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
                onClick={() => { setFilterMode('all'); setPage(1) }}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${filterMode === 'all'
                  ? 'bg-red-500 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
              >
                Tất cả ({participants.length})
              </button>
              <button
                onClick={() => { setFilterMode('friends'); setPage(1) }}
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
              placeholder="Tìm người tham gia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-none rounded-xl focus:ring-2 focus:ring-red-500 w-full md:w-64"
              onKeyDown={() => setPage(1)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {/* Target info */}
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
            <thead className="bg-gray-50 dark:bg-gray-750 text-gray-500 uppercase text-xs font-semibold select-none">
              <tr>
                {/* Rank */}
                <th className="px-6 py-4 text-left">
                  <button
                    onClick={() => handleSort('rank')}
                    className="group flex items-center gap-1.5 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  >
                    Hạng
                    <SortIcon colKey="rank" sortConfig={sortConfig} />
                  </button>
                </th>
                {/* Name */}
                <th className="px-6 py-4 text-left">
                  <button
                    onClick={() => handleSort('name')}
                    className="group flex items-center gap-1.5 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  >
                    Vận động viên
                    <SortIcon colKey="name" sortConfig={sortConfig} />
                  </button>
                </th>
                {/* Result */}
                <th className="px-6 py-4 text-left">
                  <button
                    onClick={() => handleSort('totalProgress')}
                    className="group flex items-center gap-1.5 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  >
                    Kết quả ({event?.targetUnit || 'điểm'})
                    <SortIcon colKey="totalProgress" sortConfig={sortConfig} />
                  </button>
                </th>
                {/* Progress */}
                <th className="px-6 py-4 text-left">
                  <button
                    onClick={() => handleSort('progressPct')}
                    className="group flex items-center gap-1.5 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  >
                    Tiến độ cá nhân
                    <SortIcon colKey="progressPct" sortConfig={sortConfig} />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {pagedParticipants.map((user, idx) => {
                const userId = user.userId || user._id
                const isMe = String(userId) === String(currentUserId)
                const { isOrganizer, isFriend, isConnected, label, labelColor } = getRole(userId, creatorId, friendIds, connectedIds)
                const ringBoxShadow = getRingBoxShadow(isOrganizer, isFriend, isConnected)
                const showBadge = isOrganizer || isFriend
                const badgeBg = isOrganizer ? 'bg-amber-500' : 'bg-green-500'

                const correctedPct = perPersonTarget > 0
                  ? Math.min(Math.round((user.totalProgress / perPersonTarget) * 100), 100)
                  : user.progressPercentage ?? 0

                return (
                  <tr
                    key={userId || idx}
                    className={`transition ${isMe
                      ? 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-750'
                      }`}
                  >
                    {/* Rank */}
                    <td className="px-6 py-4">
                      <span className={`font-bold ${user.rank <= 3 ? 'text-red-500 text-lg' : 'text-gray-500'}`}>
                        #{user.rank}
                      </span>
                    </td>

                    {/* Athlete */}
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
                            style={!isMe && ringBoxShadow
                              ? { boxShadow: ringBoxShadow }
                              : !isMe ? { border: '2px solid #e5e7eb' } : {}
                            }
                            onError={(e) => { e.target.onerror = null; e.target.src = useravatar }}
                          />
                          {showBadge && (
                            <span className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 ${badgeBg} rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center`}>
                              {isOrganizer
                                ? <FaCrown className="text-white" style={{ fontSize: 6 }} />
                                : <FaCheck className="text-white" style={{ fontSize: 6 }} />
                              }
                            </span>
                          )}
                        </button>

                        <div className="min-w-0">
                          <button
                            onClick={() => userId && navigate(`/user/${userId}`)}
                            className={`font-semibold hover:text-red-500 dark:hover:text-red-400 transition-colors text-left block truncate max-w-[160px] ${isMe ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}
                          >
                            {user.name}
                            {isMe && <span className="text-xs font-normal text-blue-400 ml-1">(Bạn)</span>}
                          </button>
                          {label && (
                            <span className={`text-[10px] font-semibold ${labelColor} flex items-center gap-0.5`}>
                              {isOrganizer && <FaCrown style={{ fontSize: 8 }} />}
                              {label}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Result */}
                    <td className="px-6 py-4">
                      <span className="font-bold text-gray-900 dark:text-white">
                        {Number(user.totalProgress || 0).toFixed(2)} {event?.targetUnit}
                      </span>
                      <span className="text-xs text-gray-400 block">/ {perPersonTarget.toFixed(2)} {event?.targetUnit}</span>
                    </td>

                    {/* Progress bar */}
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

          {/* Pagination */}
          {filteredParticipants.length > PAGE_SIZE && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Hiển thị{' '}
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredParticipants.length)}
                </span>
                {' '}/ {filteredParticipants.length} người
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <FaChevronLeft className="text-xs" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce((acc, p, i, arr) => {
                    if (i > 0 && p - arr[i - 1] > 1) acc.push('...')
                    acc.push(p)
                    return acc
                  }, [])
                  .map((p, i) =>
                    p === '...' ? (
                      <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-gray-400 text-xs">...</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-all ${p === page
                          ? 'bg-red-500 text-white shadow-sm'
                          : 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                      >
                        {p}
                      </button>
                    )
                  )
                }

                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <FaChevronRight className="text-xs" />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
