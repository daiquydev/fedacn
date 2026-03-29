import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
    FaTrophy, FaSearch, FaTrash, FaUsers, FaChartBar,
    FaList, FaSync, FaCheck, FaClock, FaBan,
    FaRunning, FaAppleAlt, FaDumbbell, FaFilter, FaChevronDown
} from 'react-icons/fa'
import toast from 'react-hot-toast'
import adminChallengeApi from '../../apis/challengeApi'
import ConfirmBox from '../../components/GlobalComponents/ConfirmBox'
import { useSafeMutation } from '../../hooks/useSafeMutation'

// ──────────────────────────────────────────────
//  Helpers
// ──────────────────────────────────────────────
const TYPE_CONFIG = {
    nutrition: { label: 'Dinh dưỡng', icon: FaAppleAlt, badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
    outdoor_activity: { label: 'Ngoài trời', icon: FaRunning, badge: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300' },
    fitness: { label: 'Tập luyện', icon: FaDumbbell, badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' }
}

const STATUS_CONFIG = {
    active: { label: 'Đang hoạt động', cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
    completed: { label: 'Hoàn thành', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
    cancelled: { label: 'Đã hủy', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' }
}

const fmt = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—'

// ──────────────────────────────────────────────
//  Stat Card (same style as AdminSportEvent)
// ──────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, iconBg, borderColor }) {
    return (
        <div className={`bg-white dark:bg-gray-800 rounded-xl px-5 py-4 border-l-4 ${borderColor} shadow-sm border border-gray-100 dark:border-gray-700`}>
            <div className='flex items-center justify-between'>
                <div>
                    <p className='text-xs text-gray-400 dark:text-gray-500 mb-1'>{label}</p>
                    <p className='text-2xl font-black text-gray-800 dark:text-white'>{value ?? '—'}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
                    <Icon className='text-white text-base' />
                </div>
            </div>
        </div>
    )
}

// ──────────────────────────────────────────────
//  Tab 1: Danh sách
// ──────────────────────────────────────────────
function ChallengeListTab({ stats }) {
    const qc = useQueryClient()
    const [search, setSearch] = useState('')
    const [searchInput, setSearchInput] = useState('')
    const [typeFilter, setTypeFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [page, setPage] = useState(1)
    const [confirmId, setConfirmId] = useState(null)
    const [confirmTitle, setConfirmTitle] = useState('')
    const LIMIT = 15

    // Debounce
    React.useEffect(() => {
        const t = setTimeout(() => { setSearch(searchInput); setPage(1) }, 500)
        return () => clearTimeout(t)
    }, [searchInput])

    const { data, isLoading } = useQuery({
        queryKey: ['admin-challenges', search, typeFilter, statusFilter, page],
        queryFn: () => adminChallengeApi.getAll({
            page, limit: LIMIT,
            search: search || undefined,
            challenge_type: typeFilter !== 'all' ? typeFilter : undefined,
            // 'deleted' là chế độ xem riêng, dùng show_deleted=true để lấy is_deleted records
            status: statusFilter !== 'all' && statusFilter !== 'deleted' ? statusFilter : undefined,
            show_deleted: statusFilter === 'deleted' ? 'true' : undefined
        }),
        keepPreviousData: true,
        staleTime: 3000
    })

    const challenges = data?.data?.result?.challenges || []
    const total = data?.data?.result?.total || 0
    const totalPage = data?.data?.result?.totalPage || 1

    // No more client-side status filter needed — it's server-side now
    const filtered = challenges

    const cancelMut = useSafeMutation({
        mutationFn: (id) => adminChallengeApi.forceCancel(id),
        onSuccess: () => {
            toast.success('Đã xóa thử thách thành công')
            qc.invalidateQueries({ queryKey: ['admin-challenges'] })
            qc.invalidateQueries({ queryKey: ['admin-challenge-stats'] })
            setConfirmId(null)
        },
        onError: (e) => toast.error(e?.response?.data?.message || 'Xóa thất bại')
    })

    const restoreMut = useSafeMutation({
        mutationFn: (id) => adminChallengeApi.restore(id),
        onSuccess: () => {
            toast.success('Đã khôi phục thử thách')
            qc.invalidateQueries({ queryKey: ['admin-challenges'] })
            qc.invalidateQueries({ queryKey: ['admin-challenge-stats'] })
        },
        onError: (e) => toast.error(e?.response?.data?.message || 'Khôi phục thất bại')
    })

    const activeFilterCount = [typeFilter !== 'all', statusFilter !== 'all'].filter(Boolean).length

    return (
        <div>
            {/* Filter bar */}
            <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-5 overflow-hidden'>
                <div className='p-4'>
                    <div className='flex gap-2 items-center'>
                        <div className='relative flex-1'>
                            <FaSearch className='absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs' />
                            <input
                                value={searchInput}
                                onChange={e => setSearchInput(e.target.value)}
                                placeholder='Tìm theo tên thử thách...'
                                className='w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all'
                            />
                        </div>
                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border transition-all shrink-0 ${
                                showAdvanced || activeFilterCount > 0
                                    ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 text-amber-700 dark:text-amber-300'
                                    : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'
                            }`}
                        >
                            <FaFilter size={12} />
                            Bộ lọc
                            {activeFilterCount > 0 && (
                                <span className='w-5 h-5 rounded-full bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center'>
                                    {activeFilterCount}
                                </span>
                            )}
                            <FaChevronDown size={10} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                        </button>
                        <button
                            onClick={() => qc.invalidateQueries({ queryKey: ['admin-challenges'] })}
                            className='flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition-colors shrink-0'
                        >
                            <FaSync size={11} /> Làm mới
                        </button>
                    </div>

                    {showAdvanced && (
                        <div className='grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700'>
                            <div>
                                <label className='block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5'>Loại thử thách</label>
                                <select
                                    value={typeFilter}
                                    onChange={e => { setTypeFilter(e.target.value); setPage(1) }}
                                    className='w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-amber-400'
                                >
                                    <option value='all'>Tất cả loại</option>
                                    <option value='nutrition'>🥗 Dinh dưỡng</option>
                                    <option value='outdoor_activity'>🏃 Ngoài trời</option>
                                    <option value='fitness'>💪 Tập luyện</option>
                                </select>
                            </div>
                            <div>
                                <label className='block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5'>Trạng thái</label>
                                <select
                                    value={statusFilter}
                                    onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
                                    className='w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-amber-400'
                                >
                                    <option value='all'>Tất cả trạng thái</option>
                                    <option value='active'>Đang hoạt động</option>
                                    <option value='completed'>Hoàn thành</option>
                                    <option value='cancelled'>Đã hủy</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Count + toggle xem đã xóa */}
            <div className='flex items-center justify-between mb-3'>
                <p className='text-xs text-gray-500 dark:text-gray-400'>
                    Hiển thị <span className='font-semibold text-gray-800 dark:text-white'>{filtered.length}</span> / {total} thử thách
                </p>
                <button
                    onClick={() => {
                        const next = statusFilter === 'deleted' ? 'all' : 'deleted'
                        setStatusFilter(next)
                        setPage(1)
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        statusFilter === 'deleted'
                            ? 'bg-red-50 dark:bg-red-900/20 border-red-300 text-red-700 dark:text-red-300'
                            : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300'
                    }`}
                >
                    <FaTrash size={10} />
                    {statusFilter === 'deleted' ? 'Ẩn đã xóa' : 'Xem đã xóa'}
                </button>
            </div>

            {/* Table */}
            {isLoading ? (
                <div className='space-y-2'>{[...Array(6)].map((_, i) => <div key={i} className='h-14 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse' />)}</div>
            ) : filtered.length === 0 ? (
                <div className='py-14 text-center text-gray-400'>
                    <FaTrophy size={36} className='mx-auto mb-3 opacity-30' />
                    <p className='text-sm'>Không có thử thách nào</p>
                </div>
            ) : (
                <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700'>
                    <div className='overflow-x-auto'>
                        <table className='w-full divide-y divide-gray-200 dark:divide-gray-700'>
                            <thead className='bg-gray-50 dark:bg-gray-900'>
                                <tr>
                                    {['STT', 'Thử thách', 'Loại', 'Trạng thái', 'Người tham gia', 'Thời gian', 'Người tạo', 'Hành động'].map(h => (
                                        <th key={h} className='px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap'>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-gray-100 dark:divide-gray-700'>
                                {filtered.map((c, idx) => {
                                    const typeCfg = TYPE_CONFIG[c.challenge_type] || {}
                                    const statusCfg = STATUS_CONFIG[c.status] || {}
                                    const TypeIcon = typeCfg.icon || FaTrophy
                                    const creator = c.creator_id
                                    return (
                                        <tr key={c._id} className='hover:bg-amber-50/30 dark:hover:bg-amber-900/5 transition-colors'>
                                            <td className='px-4 py-3 text-sm text-gray-500 dark:text-gray-400'>{(page - 1) * LIMIT + idx + 1}</td>
                                            <td className='px-4 py-3 min-w-[200px]'>
                                                <div className='flex items-center gap-2.5'>
                                                    {c.image ? (
                                                        <img src={c.image} alt={c.title} className='w-9 h-9 rounded-lg object-cover shrink-0' onError={e => { e.target.style.display = 'none' }} />
                                                    ) : (
                                                        <div className='w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-base shrink-0'>
                                                            {c.badge_emoji || '🏆'}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className='font-semibold text-gray-800 dark:text-white text-sm max-w-[180px] truncate'>{c.title}</p>
                                                        <p className='text-xs text-gray-400 truncate max-w-[180px]'>{c.category || c.goal_type}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className='px-4 py-3 whitespace-nowrap'>
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${typeCfg.badge}`}>
                                                    <TypeIcon size={9} />
                                                    {typeCfg.label || c.challenge_type}
                                                </span>
                                            </td>
                                            <td className='px-4 py-3 whitespace-nowrap'>
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.cls}`}>
                                                    {c.status === 'active' ? <FaCheck size={9} /> : c.status === 'cancelled' ? <FaBan size={9} /> : <FaClock size={9} />}
                                                    {statusCfg.label || c.status}
                                                </span>
                                            </td>
                                            <td className='px-4 py-3 whitespace-nowrap'>
                                                <span className='flex items-center gap-1 text-sm text-gray-700 dark:text-gray-200'>
                                                    <FaUsers size={11} className='text-amber-500' />
                                                    {c.participants_count || 0}
                                                </span>
                                            </td>
                                            <td className='px-4 py-3 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400'>
                                                <div className='flex flex-col gap-0.5'>
                                                    <span>🟢 {fmt(c.start_date)}</span>
                                                    <span>🔴 {fmt(c.end_date)}</span>
                                                </div>
                                            </td>
                                            <td className='px-4 py-3 whitespace-nowrap'>
                                                <div className='flex items-center gap-1.5'>
                                                    <div className='w-6 h-6 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center text-xs font-bold text-amber-700 dark:text-amber-300'>
                                                        {(creator?.name || creator?.username || '?')[0]?.toUpperCase()}
                                                    </div>
                                                    <span className='text-xs text-gray-500 dark:text-gray-400 max-w-[80px] truncate'>{creator?.name || creator?.username || '—'}</span>
                                                </div>
                                            </td>
                                            <td className='px-4 py-3 whitespace-nowrap'>
                                                <div className='flex items-center gap-1'>
                                                    {c.is_deleted ? (
                                                        <button
                                                            onClick={() => restoreMut.mutate(c._id)}
                                                            disabled={restoreMut.isPending}
                                                            title='Khôi phục thử thách'
                                                            className='p-1.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors disabled:opacity-50'
                                                        >
                                                            <FaSync size={13} />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => { setConfirmId(c._id); setConfirmTitle(c.title) }}
                                                            title='Xóa thử thách'
                                                            className='p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors'
                                                        >
                                                            <FaTrash size={13} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Pagination */}
            {totalPage > 1 && (
                <div className='flex items-center justify-center gap-2 mt-5'>
                    <button
                        disabled={page <= 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        className='px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
                    >
                        ← Trước
                    </button>
                    {Array.from({ length: totalPage }, (_, i) => i + 1)
                        .filter(p => p === 1 || p === totalPage || Math.abs(p - page) <= 2)
                        .reduce((acc, p, i, arr) => {
                            if (i > 0 && p - arr[i - 1] > 1) acc.push('...' + p)
                            acc.push(p)
                            return acc
                        }, [])
                        .map(p => typeof p === 'number' ? (
                            <button
                                key={p}
                                onClick={() => setPage(p)}
                                className={`w-8 h-8 text-sm rounded-lg font-medium transition-colors ${p === page ? 'bg-amber-500 text-white' : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                            >
                                {p}
                            </button>
                        ) : <span key={p} className='px-1 text-gray-400'>...</span>)
                    }
                    <button
                        disabled={page >= totalPage}
                        onClick={() => setPage(p => Math.min(totalPage, p + 1))}
                        className='px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
                    >
                        Sau →
                    </button>
                </div>
            )}

            {/* Confirm Dialog */}
            {confirmId && (
                <ConfirmBox
                    title='Xóa thử thách?'
                    subtitle={`Thử thách "${confirmTitle}" sẽ bị xóa khỏi danh sách. Thao tác này có thể được khôi phục.`}
                    danger={true}
                    handleDelete={() => cancelMut.mutate(confirmId)}
                    closeModal={() => setConfirmId(null)}
                    isPending={cancelMut.isPending}
                    tilteButton='Xóa'
                />
            )}
        </div>
    )
}

// ──────────────────────────────────────────────
//  Tab 2: Thành viên
// ──────────────────────────────────────────────
function ParticipantsTab() {
    const [searchChallenge, setSearchChallenge] = useState('')
    const [selectedId, setSelectedId] = useState(null)

    const { data: listData, isLoading: loadingList } = useQuery({
        queryKey: ['admin-challenges-list'],
        queryFn: () => adminChallengeApi.getAll({ page: 1, limit: 100 }),
        staleTime: 10000
    })

    const challenges = listData?.data?.result?.challenges || []
    const filtered = searchChallenge
        ? challenges.filter(c => c.title?.toLowerCase().includes(searchChallenge.toLowerCase()))
        : challenges

    const { data: partData, isLoading: loadingPart } = useQuery({
        queryKey: ['admin-challenge-participants', selectedId],
        queryFn: () => adminChallengeApi.getParticipants(selectedId),
        enabled: !!selectedId,
        staleTime: 5000
    })

    const participants = partData?.data?.result?.participants || []
    const selectedChallenge = challenges.find(c => c._id === selectedId)

    return (
        <div className='grid grid-cols-1 lg:grid-cols-5 gap-5'>
            {/* Left panel: challenge list */}
            <div className='lg:col-span-2'>
                <div className='bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-4'>
                    <h3 className='text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3'>Chọn thử thách</h3>
                    <div className='relative mb-3'>
                        <FaSearch className='absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs' />
                        <input
                            value={searchChallenge}
                            onChange={e => setSearchChallenge(e.target.value)}
                            placeholder='Tìm thử thách...'
                            className='w-full pl-7 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white outline-none focus:ring-1 focus:ring-amber-400 transition-all'
                        />
                    </div>
                    {loadingList ? (
                        <div className='space-y-2'>{[...Array(5)].map((_, i) => <div key={i} className='h-10 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse' />)}</div>
                    ) : (
                        <div className='space-y-1 max-h-[420px] overflow-y-auto scrollbar-thin pr-1'>
                            {filtered.map(c => {
                                const typeCfg = TYPE_CONFIG[c.challenge_type] || {}
                                const TypeIcon = typeCfg.icon || FaTrophy
                                return (
                                    <button
                                        key={c._id}
                                        onClick={() => setSelectedId(c._id)}
                                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center gap-2.5 ${
                                            selectedId === c._id
                                                ? 'bg-amber-500 text-white shadow-sm'
                                                : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                                        }`}
                                    >
                                        <span className='text-base leading-none shrink-0'>{c.badge_emoji || '🏆'}</span>
                                        <div className='min-w-0 flex-1'>
                                            <p className='font-medium truncate text-sm'>{c.title}</p>
                                            <span className={`text-xs ${selectedId === c._id ? 'text-white/70' : 'text-gray-400'}`}>
                                                {typeCfg.label} • {c.participants_count || 0} người
                                            </span>
                                        </div>
                                    </button>
                                )
                            })}
                            {filtered.length === 0 && <p className='text-xs text-gray-400 text-center py-5'>Không tìm thấy</p>}
                        </div>
                    )}
                </div>
            </div>

            {/* Right panel: participants */}
            <div className='lg:col-span-3'>
                {!selectedId ? (
                    <div className='rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-14 text-center text-gray-400'>
                        <FaUsers size={32} className='mx-auto mb-3 opacity-30' />
                        <p className='text-sm'>Chọn một thử thách để xem danh sách thành viên</p>
                    </div>
                ) : loadingPart ? (
                    <div className='space-y-3'>{[...Array(5)].map((_, i) => <div key={i} className='h-14 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse' />)}</div>
                ) : (
                    <div className='bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden'>
                        <div className='bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3 flex items-center justify-between'>
                            <h3 className='font-bold text-white flex items-center gap-2 text-sm'>
                                <FaUsers size={13} />
                                {selectedChallenge?.title}
                            </h3>
                            <span className='text-white/80 text-xs font-medium'>{participants.length} thành viên</span>
                        </div>
                        {participants.length === 0 ? (
                            <div className='py-10 text-center text-gray-400 text-sm'>Chưa có thành viên nào</div>
                        ) : (
                            <div className='overflow-x-auto'>
                                <table className='w-full divide-y divide-gray-100 dark:divide-gray-700'>
                                    <thead className='bg-gray-50 dark:bg-gray-900'>
                                        <tr>
                                            {['Hạng', 'Người dùng', 'Tiến độ', 'Streak', 'Trạng thái', 'Tham gia'].map(h => (
                                                <th key={h} className='px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap'>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className='divide-y divide-gray-100 dark:divide-gray-700'>
                                        {participants.map(p => {
                                            const user = p.user || {}
                                            const pct = p.progress_percent || 0
                                            return (
                                                <tr key={p.rank} className='hover:bg-amber-50/20 dark:hover:bg-amber-900/5 transition-colors'>
                                                    <td className='px-4 py-3'>
                                                        <span className={`w-7 h-7 rounded-full inline-flex items-center justify-center text-xs font-bold ${
                                                            p.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                                                            p.rank === 2 ? 'bg-gray-200 text-gray-600' :
                                                            p.rank === 3 ? 'bg-orange-100 text-orange-700' :
                                                            'bg-gray-100 text-gray-500'
                                                        }`}>{p.rank}</span>
                                                    </td>
                                                    <td className='px-4 py-3'>
                                                        <div className='flex items-center gap-2'>
                                                            {user.avatar ? (
                                                                <img src={user.avatar} className='w-7 h-7 rounded-full object-cover ring-1 ring-gray-200' alt='' />
                                                            ) : (
                                                                <div className='w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-xs font-bold text-amber-600 dark:text-amber-300'>
                                                                    {(user.name || user.username || '?')[0]?.toUpperCase()}
                                                                </div>
                                                            )}
                                                            <span className='text-sm font-medium text-gray-700 dark:text-gray-200'>{user.name || user.username || '—'}</span>
                                                        </div>
                                                    </td>
                                                    <td className='px-4 py-3'>
                                                        <div className='flex items-center gap-2'>
                                                            <div className='w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5'>
                                                                <div className='bg-gradient-to-r from-amber-400 to-orange-500 h-1.5 rounded-full' style={{ width: `${Math.min(pct, 100)}%` }} />
                                                            </div>
                                                            <span className='text-xs text-gray-500 whitespace-nowrap'>{p.current_value}/{p.total_required_days} ({pct}%)</span>
                                                        </div>
                                                    </td>
                                                    <td className='px-4 py-3'>
                                                        <span className='text-xs font-semibold text-orange-600 dark:text-orange-400'>🔥 {p.streak_count || 0}</span>
                                                    </td>
                                                    <td className='px-4 py-3'>
                                                        {p.is_completed ? (
                                                            <span className='inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium'>
                                                                <FaCheck size={8} /> Hoàn thành
                                                            </span>
                                                        ) : (
                                                            <span className='inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium'>
                                                                <FaClock size={8} /> Đang tham gia
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className='px-4 py-3 text-xs text-gray-400'>{fmt(p.joined_at)}</td>
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
        queryKey: ['admin-challenge-stats'],
        queryFn: () => adminChallengeApi.getStats(),
        staleTime: 10000
    })

    const stats = data?.data?.result || {}

    const { data: listData } = useQuery({
        queryKey: ['admin-challenges-list'],
        queryFn: () => adminChallengeApi.getAll({ page: 1, limit: 200 }),
        staleTime: 15000
    })
    const challenges = listData?.data?.result?.challenges || []
    const topByParticipants = [...challenges].sort((a, b) => (b.participants_count || 0) - (a.participants_count || 0)).slice(0, 5)

    // Mini bar chart data (challenges created per recent 6 months)
    const monthData = (() => {
        const arr = []
        for (let i = 5; i >= 0; i--) {
            const d = new Date()
            d.setMonth(d.getMonth() - i)
            const m = d.getMonth(); const y = d.getFullYear()
            const count = challenges.filter(c => {
                if (!c.createdAt) return false
                const cd = new Date(c.createdAt)
                return cd.getMonth() === m && cd.getFullYear() === y
            }).length
            arr.push({ label: `T${m + 1}`, count })
        }
        return arr
    })()
    const maxCount = Math.max(...monthData.map(m => m.count), 1)

    if (isLoading) {
        return <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>{[...Array(4)].map((_, i) => <div key={i} className='h-28 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse' />)}</div>
    }

    return (
        <div className='space-y-5'>
            {/* Stat cards */}
            <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
                <StatCard icon={FaTrophy} label='Tổng thử thách' value={stats.total} borderColor='border-l-amber-400' iconBg='bg-gradient-to-br from-amber-400 to-orange-600' />
                <StatCard icon={FaCheck} label='Đang hoạt động' value={stats.active} borderColor='border-l-emerald-400' iconBg='bg-gradient-to-br from-emerald-400 to-green-600' />
                <StatCard icon={FaBan} label='Đã hủy' value={stats.cancelled} borderColor='border-l-red-400' iconBg='bg-gradient-to-br from-red-400 to-rose-600' />
                <StatCard icon={FaUsers} label='Tổng người tham gia' value={stats.totalParticipants} borderColor='border-l-sky-400' iconBg='bg-gradient-to-br from-sky-400 to-blue-600' />
            </div>

            {/* Type breakdown + Top challenges */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-5'>
                {/* By type */}
                <div className='bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5'>
                    <h3 className='font-bold text-gray-800 dark:text-white text-sm mb-4 flex items-center gap-2'>
                        <FaChartBar className='text-amber-500' /> Phân loại theo loại thử thách
                    </h3>
                    <div className='space-y-3'>
                        {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
                            const count = stats.byType?.[key] || 0
                            const total = stats.total || 1
                            const pct = Math.round((count / total) * 100)
                            const Icon = cfg.icon
                            return (
                                <div key={key}>
                                    <div className='flex items-center justify-between mb-1'>
                                        <span className='flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300'><Icon size={12} /> {cfg.label}</span>
                                        <span className='text-sm font-semibold text-gray-700 dark:text-gray-100'>{count} ({pct}%)</span>
                                    </div>
                                    <div className='w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2'>
                                        <div className='bg-gradient-to-r from-amber-400 to-orange-500 h-2 rounded-full transition-all' style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Mini chart */}
                    <p className='text-[10px] text-gray-400 uppercase font-bold tracking-wide mt-5 mb-2'>Thử thách tạo theo tháng</p>
                    <div className='flex items-end gap-2' style={{ height: 56 }}>
                        {monthData.map((m, i) => (
                            <div key={i} className='flex-1 flex flex-col items-center gap-0.5'>
                                <span className='text-[9px] font-bold text-gray-500'>{m.count}</span>
                                <div
                                    className='w-full rounded-t-md bg-gradient-to-t from-amber-600 to-amber-400 transition-all'
                                    style={{ height: `${Math.max((m.count / maxCount) * 44, 2)}px` }}
                                />
                                <span className='text-[9px] text-gray-400'>{m.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top 5 */}
                <div className='bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5'>
                    <h3 className='font-bold text-gray-800 dark:text-white text-sm mb-4 flex items-center gap-2'>
                        <FaTrophy className='text-amber-500' /> Top 5 thử thách phổ biến nhất
                    </h3>
                    {topByParticipants.length === 0 ? (
                        <p className='text-sm text-gray-400 text-center py-8'>Chưa có dữ liệu</p>
                    ) : (
                        <div className='space-y-3'>
                            {topByParticipants.map((c, i) => {
                                const typeCfg = TYPE_CONFIG[c.challenge_type] || {}
                                return (
                                    <div key={c._id} className='flex items-center gap-3'>
                                        <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                                            i === 0 ? 'bg-yellow-100 text-yellow-700' :
                                            i === 1 ? 'bg-gray-200 text-gray-600' :
                                            i === 2 ? 'bg-orange-100 text-orange-700' :
                                            'bg-gray-100 text-gray-500'
                                        }`}>{i + 1}</span>
                                        <span className='text-base'>{c.badge_emoji || '🏆'}</span>
                                        <div className='flex-1 min-w-0'>
                                            <p className='text-sm font-medium text-gray-700 dark:text-gray-200 truncate'>{c.title}</p>
                                            <p className='text-xs text-gray-400'>{typeCfg.label}</p>
                                        </div>
                                        <span className='flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 shrink-0'>
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

export default function AdminChallenge() {
    const [activeTab, setActiveTab] = useState('list')

    const { data: statsData } = useQuery({
        queryKey: ['admin-challenge-stats'],
        queryFn: () => adminChallengeApi.getStats(),
        staleTime: 10000
    })
    const stats = statsData?.data?.result || {}

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900 py-4 px-4'>

            {/* ── Hero Banner ── */}
            <div className='relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 px-8 py-8 mb-6 shadow-xl'>
                <div className='relative z-10 flex items-start justify-between flex-wrap gap-4'>
                    <div>
                        <p className='text-white/70 text-sm font-medium mb-1'>FitConnect Admin</p>
                        <h1 className='text-3xl font-black text-white mb-2'>Quản lý Thử thách</h1>
                        <p className='text-white/80 text-sm max-w-md'>
                            Giám sát và kiểm duyệt tất cả thử thách cộng đồng trong hệ thống.
                        </p>
                    </div>
                </div>

                {/* Tabs inside Hero Banner */}
                <div className='relative z-10 flex gap-2 mt-5 flex-wrap'>
                    {TABS.map(tab => {
                        const Icon = tab.icon
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all backdrop-blur-sm ${
                                    activeTab === tab.key
                                        ? 'bg-white text-amber-700 shadow-md'
                                        : 'bg-white/20 text-white hover:bg-white/30'
                                }`}
                            >
                                <Icon size={13} />
                                {tab.label}
                            </button>
                        )
                    })}
                </div>

                {/* Decorative circles */}
                <div className='absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10' />
                <div className='absolute right-20 -bottom-8 w-32 h-32 rounded-full bg-white/10' />
            </div>

            {/* Stat Cards */}
            <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6'>
                <StatCard icon={FaTrophy} label='Tổng thử thách' value={stats.total} borderColor='border-l-amber-400' iconBg='bg-gradient-to-br from-amber-400 to-orange-600' />
                <StatCard icon={FaCheck} label='Đang hoạt động' value={stats.active} borderColor='border-l-emerald-400' iconBg='bg-gradient-to-br from-emerald-400 to-green-600' />
                <StatCard icon={FaBan} label='Đã hủy' value={stats.cancelled} borderColor='border-l-red-400' iconBg='bg-gradient-to-br from-red-400 to-rose-600' />
                <StatCard icon={FaUsers} label='Người tham gia' value={stats.totalParticipants} borderColor='border-l-sky-400' iconBg='bg-gradient-to-br from-sky-400 to-blue-600' />
            </div>

            {/* Tab content */}
            {activeTab === 'list' && <ChallengeListTab stats={stats} />}
            {activeTab === 'members' && <ParticipantsTab />}
            {activeTab === 'stats' && <StatsTab />}
        </div>
    )
}
