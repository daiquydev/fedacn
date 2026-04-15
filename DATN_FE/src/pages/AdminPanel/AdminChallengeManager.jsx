import { useSafeMutation } from '../../hooks/useSafeMutation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  FaTrophy, FaSearch, FaTrash, FaUsers, FaChartBar,
  FaList, FaSync, FaCheck, FaClock, FaBan, FaRunning, FaAppleAlt, FaDumbbell
} from 'react-icons/fa'
import {
  getChallenges,
  deleteChallenge,
  getChallengeParticipants
} from '../../apis/challengeApi'
import DeleteConfirmBox from '../../components/GlobalComponents/DeleteConfirmBox'

// ──────────────────────────────────────────────
//  Helper: badge màu theo challenge_type
// ──────────────────────────────────────────────
const TYPE_CONFIG = {
  nutrition: { label: 'Ăn uống', icon: FaAppleAlt, cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  outdoor_activity: { label: 'Ngoài trời', icon: FaRunning, cls: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300' },
  fitness: { label: 'Thể dục', icon: FaDumbbell, cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' }
}

const STATUS_CONFIG = {
  active: { label: 'Đang hoạt động', cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  completed: { label: 'Hoàn thành', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  cancelled: { label: 'Đã hủy', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' }
}

const fmt = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—'

// ──────────────────────────────────────────────
//  Tab 1: Danh sách thử thách
// ──────────────────────────────────────────────
function ChallengeListTab() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [deleteId, setDeleteId] = useState(null)
  const LIMIT = 20

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-challenges', search, typeFilter, statusFilter, page],
    queryFn: () => getChallenges({
      page,
      limit: LIMIT,
      search: search || undefined,
      challenge_type: typeFilter !== 'all' ? typeFilter : undefined
    }),
    staleTime: 1000
  })

  const result = data?.data?.result || data?.data || {}
  const challenges = result.challenges || []
  const total = result.total || 0
  const totalPage = result.totalPage || 1

  // client-side status filter (API doesn't support it directly without admin route)
  const filtered = statusFilter === 'all'
    ? challenges
    : challenges.filter(c => c.status === statusFilter)

  const deleteMut = useSafeMutation({
    mutationFn: (id) => deleteChallenge(id),
    onSuccess: () => {
      toast.success('Đã hủy thử thách')
      qc.invalidateQueries({ queryKey: ['admin-challenges'] })
      setDeleteId(null)
    },
    onError: (e) => toast.error(e?.response?.data?.message || 'Xóa thất bại')
  })

  return (
    <div>
      {/* Filter bar */}
      <div className='flex flex-col sm:flex-row gap-3 mb-5'>
        <div className='relative flex-1'>
          <FaSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs' />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder='Tìm theo tên thử thách...'
            className='w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-amber-400 outline-none transition-all'
          />
        </div>
        <select
          value={typeFilter}
          onChange={e => { setTypeFilter(e.target.value); setPage(1) }}
          className='px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-amber-400 outline-none'
        >
          <option value='all'>Tất cả loại</option>
          <option value='nutrition'>🥗 Ăn uống</option>
          <option value='outdoor_activity'>🏃 Ngoài trời</option>
          <option value='fitness'>💪 Thể dục</option>
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className='px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-amber-400 outline-none'
        >
          <option value='all'>Tất cả trạng thái</option>
          <option value='active'>Đang hoạt động</option>
          <option value='completed'>Hoàn thành</option>
          <option value='cancelled'>Đã hủy</option>
        </select>
        <button
          onClick={() => refetch()}
          className='flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors'
        >
          <FaSync size={12} /> Làm mới
        </button>
      </div>

      {/* Results summary */}
      <p className='text-xs text-slate-500 mb-3'>
        Hiển thị <span className='font-semibold text-slate-700 dark:text-slate-300'>{filtered.length}</span> / {total} thử thách
      </p>

      {/* Table */}
      {isLoading ? (
        <div className='space-y-3'>
          {[...Array(5)].map((_, i) => (
            <div key={i} className='h-12 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse' />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className='py-12 text-center text-slate-400'>
          <FaTrophy size={36} className='mx-auto mb-3 opacity-30' />
          <p className='text-sm'>Không có thử thách nào</p>
        </div>
      ) : (
        <div className='overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700'>
          <table className='min-w-full text-sm'>
            <thead className='bg-slate-50 dark:bg-slate-800/80 text-left text-xs text-slate-500 uppercase tracking-wide'>
              <tr>
                <th className='py-3 px-4'>Thử thách</th>
                <th className='py-3 px-4'>Loại</th>
                <th className='py-3 px-4'>Trạng thái</th>
                <th className='py-3 px-4'>Người tham gia</th>
                <th className='py-3 px-4'>Thời gian</th>
                <th className='py-3 px-4'>Người tạo</th>
                <th className='py-3 px-4'>Hành động</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-100 dark:divide-slate-800'>
              {filtered.map(c => {
                const typeCfg = TYPE_CONFIG[c.challenge_type] || {}
                const statusCfg = STATUS_CONFIG[c.status] || {}
                const TypeIcon = typeCfg.icon || FaTrophy
                const creator = c.creator_id
                return (
                  <tr key={c._id} className='hover:bg-amber-50/30 dark:hover:bg-amber-900/5 transition-colors'>
                    <td className='py-3 px-4'>
                      <div className='flex items-center gap-2.5'>
                        {c.image ? (
                          <img src={c.image} alt={c.title} className='w-9 h-9 rounded-lg object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0' />
                        ) : (
                          <div className='w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 text-white text-lg'>
                            {c.badge_emoji || '🏆'}
                          </div>
                        )}
                        <div>
                          <p className='font-semibold text-slate-800 dark:text-slate-100 max-w-[200px] truncate'>
                            {c.title}
                          </p>
                          <p className='text-xs text-slate-400 truncate max-w-[200px]'>{c.category || c.goal_type}</p>
                        </div>
                      </div>
                    </td>
                    <td className='py-3 px-4'>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${typeCfg.cls}`}>
                        <TypeIcon size={9} />
                        {typeCfg.label || c.challenge_type}
                      </span>
                    </td>
                    <td className='py-3 px-4'>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.cls}`}>
                        {c.status === 'active' ? <FaCheck size={9} /> : c.status === 'cancelled' ? <FaBan size={9} /> : <FaClock size={9} />}
                        {statusCfg.label || c.status}
                      </span>
                    </td>
                    <td className='py-3 px-4'>
                      <span className='flex items-center gap-1 text-slate-600 dark:text-slate-300'>
                        <FaUsers size={11} className='text-amber-500' />
                        {c.participants_count || 0}
                      </span>
                    </td>
                    <td className='py-3 px-4 text-xs text-slate-500'>
                      <span>{fmt(c.start_date)}</span>
                      <span className='text-slate-300 mx-1'>→</span>
                      <span>{fmt(c.end_date)}</span>
                    </td>
                    <td className='py-3 px-4'>
                      <div className='flex items-center gap-1.5'>
                        {creator?.avatar ? (
                          <img src={creator.avatar} className='w-6 h-6 rounded-full ring-1 ring-slate-200' alt='' />
                        ) : (
                          <div className='w-6 h-6 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center text-xs font-bold text-amber-700 dark:text-amber-300'>
                            {(creator?.name || '?')[0]}
                          </div>
                        )}
                        <span className='text-xs text-slate-500 max-w-[80px] truncate'>{creator?.name || '—'}</span>
                      </div>
                    </td>
                    <td className='py-3 px-4'>
                      <div className='flex items-center gap-1.5'>
                        <Link
                          to={`/challenge/${c._id}`}
                          className='px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors'
                          title='Xem chi tiết'
                        >
                          Xem
                        </Link>
                        <button
                          onClick={() => setDeleteId(c._id)}
                          className='px-2 py-1 rounded bg-red-100 dark:bg-red-900/30 text-red-600 text-xs hover:bg-red-200 dark:hover:bg-red-800/50 transition-colors'
                          title='Hủy thử thách'
                        >
                          <FaTrash size={9} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPage > 1 && (
        <div className='flex items-center justify-center gap-2 mt-5'>
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className='px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800'
          >
            ← Trước
          </button>
          <span className='text-sm text-slate-500'>Trang {page} / {totalPage}</span>
          <button
            disabled={page >= totalPage}
            onClick={() => setPage(p => p + 1)}
            className='px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800'
          >
            Sau →
          </button>
        </div>
      )}

      {deleteId && (
        <DeleteConfirmBox
          title='Hủy thử thách'
          subtitle='Thao tác này sẽ đánh dấu thử thách là "đã hủy". Không thể hoàn tác.'
          onConfirm={() => deleteMut.mutate(deleteId)}
          onCancel={() => setDeleteId(null)}
          isLoading={deleteMut.isPending}
        />
      )}
    </div>
  )
}

// ──────────────────────────────────────────────
//  Tab 2: Thành viên
// ──────────────────────────────────────────────
function ParticipantsTab() {
  const [search, setSearch] = useState('')
  const [selectedChallengeId, setSelectedChallengeId] = useState(null)

  const { data: listData, isLoading: loadingList } = useQuery({
    queryKey: ['admin-challenges-list', search],
    queryFn: () => getChallenges({ page: 1, limit: 50, search: search || undefined }),
    staleTime: 5000
  })

  const challenges = listData?.data?.result?.challenges || []
  const filtered = challenges

  const { data: partData, isLoading: loadingPart } = useQuery({
    queryKey: ['admin-challenge-participants', selectedChallengeId],
    queryFn: () => getChallengeParticipants(selectedChallengeId),
    enabled: !!selectedChallengeId,
    staleTime: 3000
  })

  const participants = partData?.data?.result?.participants || []
  const selectedChallenge = challenges.find(c => c._id === selectedChallengeId)

  return (
    <div className='grid grid-cols-1 lg:grid-cols-5 gap-5'>
      {/* Challenge selector */}
      <div className='lg:col-span-2'>
        <div className='bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4'>
          <h3 className='text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3'>Chọn thử thách</h3>
          <div className='relative mb-3'>
            <FaSearch className='absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs' />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder='Tìm thử thách...'
              className='w-full pl-7 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-1 focus:ring-amber-400'
            />
          </div>
          {loadingList ? (
            <div className='space-y-2'>{[...Array(5)].map((_, i) => <div key={i} className='h-10 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse' />)}</div>
          ) : (
            <div className='space-y-1 max-h-[400px] overflow-y-auto scrollbar-thin pr-1'>
              {filtered.map(c => {
                const typeCfg = TYPE_CONFIG[c.challenge_type] || {}
                const TypeIcon = typeCfg.icon || FaTrophy
                return (
                  <button
                    key={c._id}
                    onClick={() => setSelectedChallengeId(c._id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center gap-2.5 ${
                      selectedChallengeId === c._id
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span className={`text-lg leading-none ${selectedChallengeId === c._id ? '' : ''}`}>
                      {c.badge_emoji || '🏆'}
                    </span>
                    <div className='min-w-0 flex-1'>
                      <p className='font-medium truncate'>{c.title}</p>
                      <div className='flex items-center gap-1.5 mt-0.5'>
                        <TypeIcon size={9} className={selectedChallengeId === c._id ? 'text-white/70' : 'text-slate-400'} />
                        <span className={`text-xs ${selectedChallengeId === c._id ? 'text-white/70' : 'text-slate-400'}`}>
                          {typeCfg.label} • {c.participants_count || 0} người
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}
              {filtered.length === 0 && <p className='text-xs text-slate-400 text-center py-4'>Không tìm thấy</p>}
            </div>
          )}
        </div>
      </div>

      {/* Participants panel */}
      <div className='lg:col-span-3'>
        {!selectedChallengeId ? (
          <div className='rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center text-slate-400'>
            <FaUsers size={32} className='mx-auto mb-3 opacity-30' />
            <p className='text-sm'>Chọn một thử thách để xem danh sách thành viên</p>
          </div>
        ) : loadingPart ? (
          <div className='space-y-3'>
            {[...Array(5)].map((_, i) => <div key={i} className='h-14 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse' />)}
          </div>
        ) : (
          <div className='rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden'>
            <div className='bg-gradient-to-r from-amber-500/10 to-orange-500/10 dark:from-amber-900/20 dark:to-orange-900/20 px-4 py-3 border-b border-slate-200 dark:border-slate-700'>
              <h3 className='font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2'>
                <FaUsers className='text-amber-500' />
                {selectedChallenge?.title}
                <span className='text-sm font-normal text-slate-500 ml-auto'>{participants.length} thành viên</span>
              </h3>
            </div>
            {participants.length === 0 ? (
              <div className='py-10 text-center text-slate-400 text-sm'>Chưa có thành viên nào</div>
            ) : (
              <div className='overflow-x-auto'>
                <table className='min-w-full text-sm'>
                  <thead className='bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-500 uppercase tracking-wide text-left'>
                    <tr>
                      <th className='py-2.5 px-4'>Hạng</th>
                      <th className='py-2.5 px-4'>Người dùng</th>
                      <th className='py-2.5 px-4'>Tiến độ</th>
                      <th className='py-2.5 px-4'>Streak</th>
                      <th className='py-2.5 px-4'>Trạng thái</th>
                      <th className='py-2.5 px-4'>Tham gia</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-slate-100 dark:divide-slate-800'>
                    {participants.map((p) => {
                      const user = p.user || {}
                      const pct = p.progress_percent || 0
                      const isCompleted = p.is_completed
                      return (
                        <tr key={p.rank} className='hover:bg-amber-50/20 dark:hover:bg-amber-900/5 transition-colors'>
                          <td className='py-3 px-4'>
                            <span className={`w-7 h-7 rounded-full inline-flex items-center justify-center text-xs font-bold ${
                              p.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                              p.rank === 2 ? 'bg-slate-200 text-slate-600' :
                              p.rank === 3 ? 'bg-orange-100 text-orange-700' :
                              'bg-slate-100 text-slate-500'
                            }`}>
                              {p.rank}
                            </span>
                          </td>
                          <td className='py-3 px-4'>
                            <div className='flex items-center gap-2'>
                              {user.avatar ? (
                                <img src={user.avatar} className='w-7 h-7 rounded-full ring-1 ring-slate-200 object-cover' alt='' />
                              ) : (
                                <div className='w-7 h-7 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center text-xs font-bold text-amber-700 dark:text-amber-200'>
                                  {(user.name || '?')[0].toUpperCase()}
                                </div>
                              )}
                              <Link to={`/user/${user._id}`} className='font-medium text-slate-700 dark:text-slate-200 hover:text-amber-600 dark:hover:text-amber-400 transition-colors text-xs'>
                                {user.name || '—'}
                              </Link>
                            </div>
                          </td>
                          <td className='py-3 px-4'>
                            <div className='flex items-center gap-2'>
                              <div className='w-20 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5'>
                                <div
                                  className='bg-gradient-to-r from-amber-400 to-orange-500 h-1.5 rounded-full transition-all'
                                  style={{ width: `${Math.min(pct, 100)}%` }}
                                />
                              </div>
                              <span className='text-xs text-slate-500 whitespace-nowrap'>
                                {p.current_value}/{p.total_required_days} ngày ({pct}%)
                              </span>
                            </div>
                          </td>
                          <td className='py-3 px-4'>
                            <span className='text-xs text-orange-600 dark:text-orange-400 font-semibold'>
                              🔥 {p.streak_count || 0}
                            </span>
                          </td>
                          <td className='py-3 px-4'>
                            {isCompleted ? (
                              <span className='inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium'>
                                <FaCheck size={8} /> Hoàn thành
                              </span>
                            ) : (
                              <span className='inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium'>
                                <FaClock size={8} /> Đang tham gia
                              </span>
                            )}
                          </td>
                          <td className='py-3 px-4 text-xs text-slate-400'>{fmt(p.joined_at)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
//  Tab 3: Thống kê
// ──────────────────────────────────────────────
function StatsTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-challenges-stats'],
    queryFn: () => getChallenges({ page: 1, limit: 50 }),
    staleTime: 10000
  })

  const challenges = data?.data?.result?.challenges || []
  const total = data?.data?.result?.total || challenges.length

  const byType = challenges.reduce((acc, c) => {
    acc[c.challenge_type] = (acc[c.challenge_type] || 0) + 1
    return acc
  }, {})

  const byStatus = challenges.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1
    return acc
  }, {})

  const totalParticipants = challenges.reduce((s, c) => s + (c.participants_count || 0), 0)

  const topByParticipants = [...challenges]
    .sort((a, b) => (b.participants_count || 0) - (a.participants_count || 0))
    .slice(0, 5)

  const statCards = [
    { label: 'Tổng thử thách', value: total, icon: FaTrophy, color: 'from-amber-500 to-orange-500', textColor: 'text-amber-600' },
    { label: 'Đang hoạt động', value: byStatus.active || 0, icon: FaCheck, color: 'from-emerald-500 to-green-500', textColor: 'text-emerald-600' },
    { label: 'Đã hủy', value: byStatus.cancelled || 0, icon: FaBan, color: 'from-red-500 to-rose-500', textColor: 'text-red-600' },
    { label: 'Tổng người tham gia', value: totalParticipants, icon: FaUsers, color: 'from-sky-500 to-blue-500', textColor: 'text-sky-600' }
  ]

  if (isLoading) {
    return (
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        {[...Array(4)].map((_, i) => (
          <div key={i} className='h-28 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse' />
        ))}
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* stat cards */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        {statCards.map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className='bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm hover:shadow-md transition-shadow'>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white mb-3`}>
                <Icon size={18} />
              </div>
              <p className={`text-2xl font-bold ${s.textColor} dark:opacity-90`}>{s.value}</p>
              <p className='text-xs text-slate-500 mt-1'>{s.label}</p>
            </div>
          )
        })}
      </div>

      {/* breakdown */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-5'>
        {/* by type */}
        <div className='bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5'>
          <h3 className='font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2'>
            <FaChartBar className='text-amber-500' /> Phân loại theo type
          </h3>
          <div className='space-y-3'>
            {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
              const count = byType[key] || 0
              const pct = total > 0 ? Math.round((count / total) * 100) : 0
              const Icon = cfg.icon
              return (
                <div key={key}>
                  <div className='flex items-center justify-between mb-1'>
                    <span className='flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300'>
                      <Icon size={12} /> {cfg.label}
                    </span>
                    <span className='text-sm font-semibold text-slate-700 dark:text-slate-200'>{count} ({pct}%)</span>
                  </div>
                  <div className='w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2'>
                    <div
                      className='bg-gradient-to-r from-amber-400 to-orange-500 h-2 rounded-full transition-all'
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* top challenges */}
        <div className='bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5'>
          <h3 className='font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2'>
            <FaTrophy className='text-amber-500' /> Top 5 thử thách phổ biến nhất
          </h3>
          {topByParticipants.length === 0 ? (
            <p className='text-sm text-slate-400 text-center py-8'>Chưa có dữ liệu</p>
          ) : (
            <div className='space-y-2.5'>
              {topByParticipants.map((c, i) => {
                const typeCfg = TYPE_CONFIG[c.challenge_type] || {}
                return (
                  <div key={c._id} className='flex items-center gap-3'>
                    <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                      i === 0 ? 'bg-yellow-100 text-yellow-700' :
                      i === 1 ? 'bg-slate-200 text-slate-600' :
                      i === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {i + 1}
                    </span>
                    <span className='text-lg'>{c.badge_emoji || '🏆'}</span>
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-medium text-slate-700 dark:text-slate-200 truncate'>{c.title}</p>
                      <p className='text-xs text-slate-400'>{typeCfg.label}</p>
                    </div>
                    <span className='flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-semibold shrink-0'>
                      <FaUsers size={10} /> {c.participants_count || 0}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
//  Main export
// ──────────────────────────────────────────────
const TABS = [
  { key: 'list', label: 'Danh sách', icon: FaList },
  { key: 'members', label: 'Thành viên', icon: FaUsers },
  { key: 'stats', label: 'Thống kê', icon: FaChartBar }
]

export default function AdminChallengeManager() {
  const [activeTab, setActiveTab] = useState('list')

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
      {/* Hero Banner */}
      <div className='relative overflow-hidden bg-gradient-to-r from-amber-500 via-orange-500 to-red-500'>
        {/* Decorative circles */}
        <div className='absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full' />
        <div className='absolute -bottom-12 -left-8 w-36 h-36 bg-white/10 rounded-full' />
        <div className='absolute top-3 right-40 w-20 h-20 bg-white/5 rounded-full' />

        <div className='relative px-6 py-6'>
          {/* Title row */}
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5'>
            <div className='flex items-center gap-3'>
              <div className='w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0'>
                <FaTrophy className='text-white text-xl' />
              </div>
              <div>
                <h1 className='text-xl font-bold text-white'>Quản lý Thử thách</h1>
                <p className='text-white/70 text-xs mt-0.5'>Giám sát, kiểm duyệt và thống kê tất cả thử thách cộng đồng</p>
              </div>
            </div>

            {/* Mini stat pills */}
            <div className='flex gap-2 flex-wrap'>
              <div className='bg-white/15 backdrop-blur-sm rounded-lg px-3 py-1.5 text-white text-xs font-medium flex items-center gap-1.5'>
                <FaTrophy size={11} /> Thử thách
              </div>
              <div className='bg-white/15 backdrop-blur-sm rounded-lg px-3 py-1.5 text-white text-xs font-medium flex items-center gap-1.5'>
                <FaUsers size={11} /> Thành viên
              </div>
              <div className='bg-white/15 backdrop-blur-sm rounded-lg px-3 py-1.5 text-white text-xs font-medium flex items-center gap-1.5'>
                <FaChartBar size={11} /> Thống kê
              </div>
            </div>
          </div>

          {/* Tab pills inside hero */}
          <div className='flex gap-1.5 flex-wrap'>
            {TABS.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === tab.key
                      ? 'bg-white text-amber-600 shadow-md'
                      : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'
                  }`}
                >
                  <Icon size={12} /> {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='px-4 sm:px-6 lg:px-10 py-8'>
        {activeTab === 'list' && <ChallengeListTab />}
        {activeTab === 'members' && <ParticipantsTab />}
        {activeTab === 'stats' && <StatsTab />}
      </div>
    </div>
  )
}
