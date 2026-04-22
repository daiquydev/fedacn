import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FaSearch, FaFire, FaCheck, FaCrown, FaUserFriends,
  FaSort, FaSortUp, FaSortDown, FaChevronLeft, FaChevronRight
} from 'react-icons/fa'
import useravatar from '../../../assets/images/useravatar.jpg'
import { getImageUrl } from '../../../utils/imageUrl'
import { getChallengePersonalProgressPercent } from '../../../utils/challengeProgress'

const PAGE_SIZE = 10

// ─── Role helpers ──────────────────────────────────────────────────────────────
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
    labelColor: isOrganizer ? 'text-amber-500' : isFriend ? 'text-green-500' : 'text-blue-400',
  }
}

function getRingStyle(isOrganizer, isFriend, isConnected) {
  if (isOrganizer) return { boxShadow: '0 0 0 2.5px #f59e0b, 0 0 0 4.5px rgba(245,158,11,0.25)' }
  if (isFriend) return { boxShadow: '0 0 0 2.5px #22c55e, 0 0 0 4.5px rgba(34,197,94,0.22)' }
  if (isConnected) return { boxShadow: '0 0 0 2px #60a5fa, 0 0 0 4px rgba(96,165,250,0.18)' }
  return { border: '2px solid #e5e7eb' }
}

// ─── Sort Icon ─────────────────────────────────────────────────────────────────
function SortIcon({ colKey, sortConfig }) {
  if (sortConfig.key !== colKey) return <FaSort className="text-gray-300 group-hover:text-gray-500 transition-colors" />
  return sortConfig.direction === 'asc'
    ? <FaSortUp className="text-orange-500" />
    : <FaSortDown className="text-orange-500" />
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ChallengeParticipants({
  participants = [],
  isLoading,
  challenge = null,
  challengeType = 'fitness',
  goalUnit = 'ngày',
  onViewProgress,
  friendIds = new Set(),
  connectedIds = new Set(),
  creatorId = '',
  currentUserId = null,
}) {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterMode, setFilterMode] = useState('all')
  const [sortConfig, setSortConfig] = useState({ key: 'rank', direction: 'asc' })
  const [page, setPage] = useState(1)

  const handleSort = (key) => {
    setSortConfig(prev =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    )
    setPage(1)
  }

  const processed = useMemo(() => {
    let list = participants

    if (filterMode === 'friends') {
      list = list.filter(p => {
        const uid = String(p.user?._id || '')
        return uid && (friendIds.has(uid) || uid === String(currentUserId))
      })
    }

    if (searchTerm.trim()) {
      const lc = searchTerm.toLowerCase().trim()
      list = list.filter(p => {
        const name = (p.user?.name || '').toLowerCase()
        const email = (p.user?.email || '').toLowerCase()
        return name.includes(lc) || email.includes(lc)
      })
    }

    return [...list].sort((a, b) => {
      let valA, valB
      switch (sortConfig.key) {
        case 'rank':
          valA = a.rank ?? 9999; valB = b.rank ?? 9999; break
        case 'name': {
          const na = (a.user?.name || '').toLowerCase()
          const nb = (b.user?.name || '').toLowerCase()
          return sortConfig.direction === 'asc' ? na.localeCompare(nb) : nb.localeCompare(na)
        }
        case 'progress':
          valA = challenge ? getChallengePersonalProgressPercent(challenge, a) : (a.progress_percent ?? 0)
          valB = challenge ? getChallengePersonalProgressPercent(challenge, b) : (b.progress_percent ?? 0)
          break
        case 'streak':
          valA = a.streak_count ?? 0; valB = b.streak_count ?? 0; break
        case 'today':
          valA = a.today_value ?? 0; valB = b.today_value ?? 0; break
        default:
          valA = a.rank ?? 9999; valB = b.rank ?? 9999
      }
      return sortConfig.direction === 'asc' ? valA - valB : valB - valA
    })
  }, [participants, filterMode, searchTerm, sortConfig, friendIds, currentUserId, challenge])

  const totalPages = Math.max(1, Math.ceil(processed.length / PAGE_SIZE))
  const paged = processed.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-700">
        {/* Filter buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setFilterMode('all'); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterMode === 'all'
              ? 'bg-orange-500 text-white shadow-sm'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
          >
            Tất cả ({participants.length})
          </button>
          <button
            onClick={() => { setFilterMode('friends'); setPage(1) }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterMode === 'friends'
              ? 'bg-green-500 text-white shadow-sm'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
          >
            <FaUserFriends className="text-[10px]" /> Bạn bè
          </button>

          {/* Legend */}
          <div className="hidden sm:flex items-center gap-3 ml-2">
            {[
              { bg: 'bg-amber-500', icon: <FaCrown style={{ fontSize: 6, color: 'white' }} />, label: 'Người tổ chức' },
              { bg: 'bg-green-500', icon: <FaCheck style={{ fontSize: 6, color: 'white' }} />, label: 'Bạn bè' },
              { border: 'border-2 border-blue-400', label: 'Theo dõi' },
            ].map((item, i) => (
              <span key={i} className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
                {item.bg
                  ? <span className={`w-3 h-3 rounded-full ${item.bg} flex items-center justify-center shrink-0`}>{item.icon}</span>
                  : <span className={`w-3 h-3 rounded-full ${item.border} shrink-0`} />}
                {item.label}
              </span>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
          <input
            type="text"
            placeholder="Tìm người tham gia..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setPage(1) }}
            className="pl-9 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-none rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none w-full sm:w-52"
          />
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900/40 text-gray-500 dark:text-gray-400 uppercase text-xs font-semibold select-none">
            <tr>
              <th className="px-5 py-3 text-left">
                <button onClick={() => handleSort('rank')} className="group flex items-center gap-1.5 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                  Hạng <SortIcon colKey="rank" sortConfig={sortConfig} />
                </button>
              </th>
              <th className="px-5 py-3 text-left">
                <button onClick={() => handleSort('name')} className="group flex items-center gap-1.5 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                  Người tham gia <SortIcon colKey="name" sortConfig={sortConfig} />
                </button>
              </th>
              <th className="px-5 py-3 text-left">
                <button onClick={() => handleSort('today')} className="group flex items-center gap-1.5 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                  Hôm nay <SortIcon colKey="today" sortConfig={sortConfig} />
                </button>
              </th>
              <th className="px-5 py-3 text-left">
                <button onClick={() => handleSort('progress')} className="group flex items-center gap-1.5 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                  Tiến độ cá nhân <SortIcon colKey="progress" sortConfig={sortConfig} />
                </button>
              </th>
              <th className="px-5 py-3 text-left">
                <button onClick={() => handleSort('streak')} className="group flex items-center gap-1.5 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                  Streak <SortIcon colKey="streak" sortConfig={sortConfig} />
                </button>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {paged.map((participant, idx) => {
              const user = participant.user || {}
              const uid = String(user._id || '')
              const pct = challenge ? getChallengePersonalProgressPercent(challenge, participant) : (participant.progress_percent || 0)
              const isCompleted = participant.is_completed
              const isMe = uid && uid === String(currentUserId)

              const { isOrganizer, isFriend, isConnected, label, labelColor } = getRole(uid, creatorId, friendIds, connectedIds)
              const ringStyle = !isMe ? getRingStyle(isOrganizer, isFriend, isConnected) : {}
              const showBadge = isOrganizer || isFriend
              const badgeBg = isOrganizer ? 'bg-amber-500' : 'bg-green-500'

              return (
                <tr
                  key={uid || idx}
                  className={`transition cursor-pointer ${isMe
                    ? 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-750'}`}
                  onClick={() => onViewProgress?.(participant)}
                >
                  {/* Rank */}
                  <td className="px-5 py-3.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${
                      participant.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                      participant.rank === 2 ? 'bg-gray-100 text-gray-600' :
                      participant.rank === 3 ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-50 dark:bg-gray-700/60 text-gray-500'
                    }`}>
                      {participant.rank <= 3
                        ? ['🥇', '🥈', '🥉'][participant.rank - 1]
                        : `#${participant.rank}`}
                    </div>
                  </td>

                  {/* Participant */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={e => { e.stopPropagation(); uid && navigate(`/user/${uid}`) }}
                        className="relative shrink-0 focus:outline-none"
                        title={`Xem trang cá nhân ${user.name}`}
                      >
                        <img
                          src={user.avatar ? getImageUrl(user.avatar) : useravatar}
                          alt={user.name}
                          className={`w-10 h-10 rounded-full object-cover ${isMe ? 'ring-2 ring-blue-500' : ''}`}
                          style={ringStyle}
                          onError={e => { e.target.onerror = null; e.target.src = useravatar }}
                        />
                        {showBadge && (
                          <span className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 ${badgeBg} rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center`}>
                            {isOrganizer
                              ? <FaCrown className="text-white" style={{ fontSize: 6 }} />
                              : <FaCheck className="text-white" style={{ fontSize: 6 }} />}
                          </span>
                        )}
                        {isCompleted && !showBadge && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                            <FaCheck className="text-white" style={{ fontSize: 6 }} />
                          </span>
                        )}
                      </button>

                      <div className="min-w-0">
                        <button
                          onClick={e => { e.stopPropagation(); uid && navigate(`/user/${uid}`) }}
                          className={`font-semibold text-sm hover:text-orange-500 dark:hover:text-orange-400 transition-colors text-left block truncate max-w-[160px] ${isMe ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}
                        >
                          {user.name || 'Ẩn danh'}
                          {isMe && <span className="text-xs font-normal text-blue-400 ml-1">(Bạn)</span>}
                        </button>
                        {label && (
                          <span className={`text-[10px] font-semibold ${labelColor} flex items-center gap-0.5`}>
                            {isOrganizer && <FaCrown style={{ fontSize: 7 }} />}
                            {label}
                          </span>
                        )}
                        {isCompleted && (
                          <span className="inline-flex px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[9px] font-bold mt-0.5">
                            Hoàn thành
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Today */}
                  <td className="px-5 py-3.5">
                    <span className="font-bold text-sm text-gray-800 dark:text-white">
                      {participant.today_value ?? 0}
                    </span>
                    <span className="text-xs text-gray-400">/{participant.goal_value} {goalUnit}</span>
                    {participant.total_required_days > 0 && (
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        {participant.current_value}/{participant.total_required_days} ngày
                      </div>
                    )}
                  </td>

                  {/* Progress bar */}
                  <td className="px-5 py-3.5 w-44">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${isCompleted ? 'bg-green-500' : pct >= 50 ? 'bg-blue-500' : 'bg-orange-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 mt-1 block text-right">{pct}%</span>
                  </td>

                  {/* Streak */}
                  <td className="px-5 py-3.5">
                    {(participant.streak_count ?? 0) > 0 ? (
                      <span className="flex items-center gap-1 text-orange-500 font-bold text-sm">
                        <FaFire className="text-xs" />
                        {participant.streak_count}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">—</span>
                    )}
                  </td>
                </tr>
              )
            })}

            {processed.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center py-12 text-gray-500">
                  {filterMode === 'friends'
                    ? 'Chưa có bạn bè nào tham gia thử thách này'
                    : searchTerm
                      ? 'Không tìm thấy người tham gia'
                      : 'Chưa có người tham gia'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ──────────────────────────────────────────────────── */}
      {processed.length > PAGE_SIZE && (
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Hiển thị{' '}
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, processed.length)}
            </span>
            {' '}/ {processed.length} người
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
                  <span key={`e-${i}`} className="w-8 h-8 flex items-center justify-center text-gray-400 text-xs">...</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-all ${p === page
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
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
  )
}
