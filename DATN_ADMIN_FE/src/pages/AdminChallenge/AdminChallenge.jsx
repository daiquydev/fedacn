import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
    FaTrophy, FaSearch, FaTrash, FaUsers, FaCheck, FaClock,
    FaRunning, FaAppleAlt, FaDumbbell, FaFilter, FaChevronDown,
    FaTimes, FaSortAmountDown, FaUndo, FaBullseye, FaEye,
    FaChartBar, FaFolderOpen, FaCalendarAlt, FaCircle, FaExclamationTriangle, FaFire,
    FaThList, FaCheckCircle
} from 'react-icons/fa'
import toast from 'react-hot-toast'
import adminChallengeApi from '../../apis/challengeApi'
import sportCategoryApi from '../../apis/sportCategoryApi'
import Loading from '../../components/GlobalComponents/Loading'
import ConfirmBox from '../../components/GlobalComponents/ConfirmBox'
import { useSafeMutation } from '../../hooks/useSafeMutation'

const TYPE_CONFIG = {
    nutrition: { label: 'Ăn uống', icon: FaAppleAlt, badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
    outdoor_activity: { label: 'Ngoài trời', icon: FaRunning, badge: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300' },
    fitness: { label: 'Thể dục', icon: FaDumbbell, badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' }
}

const fmt = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—'

// ─── Participants / Overview Modal ───────────────────────────────────────────
function ParticipantsModal({ challenge, onClose }) {
    const [activeTab, setActiveTab] = useState('overview')

    const { data, isLoading } = useQuery({
        queryKey: ['admin-challenge-participants', challenge?._id],
        queryFn: () => adminChallengeApi.getParticipants(challenge._id),
        enabled: !!challenge?._id && activeTab === 'participants',
        staleTime: 5000
    })
    const participants = data?.data?.result?.participants || []
    const totalFromParticipantsApi = data?.data?.result?.total
    const memberCount =
        activeTab === 'participants' && typeof totalFromParticipantsApi === 'number'
            ? totalFromParticipantsApi
            : (challenge.participants_count || 0)

    const renderDetails = () => (
        <div className='p-6 space-y-6'>
            {/* Background & Basic Info */}
            <div className='flex gap-4 items-start'>
                {challenge.image ? (
                    <img src={challenge.image} alt={challenge.title} className='w-20 h-20 rounded-xl object-cover shrink-0' />
                ) : (
                    <div className='w-20 h-20 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-3xl shrink-0 shadow-lg'>
                        {challenge.badge_emoji ? <span className='text-3xl leading-none' aria-hidden>{challenge.badge_emoji}</span> : <FaTrophy className='text-3xl' aria-hidden />}
                    </div>
                )}
                <div>
                    <h4 className='text-lg font-bold text-gray-800 dark:text-white'>{challenge.title}</h4>
                    <p className='text-sm text-gray-500 dark:text-gray-400 mt-1 whitespace-pre-line'>
                        {challenge.description || 'Chưa có mô tả chi tiết'}
                    </p>
                </div>
            </div>

            <div className='grid grid-cols-2 gap-4'>
                <div className='bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl'>
                    <p className='text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1'>Loại & Danh mục</p>
                    <p className='text-sm font-semibold text-gray-700 dark:text-gray-200 inline-flex items-center gap-1.5 flex-wrap'>
                        {(() => {
                            const tc = TYPE_CONFIG[challenge.challenge_type] || TYPE_CONFIG.fitness
                            const TIcon = tc.icon || FaDumbbell
                            return (
                                <>
                                    <TIcon className='text-amber-500 shrink-0' size={14} />
                                    <span>{tc.label}</span>
                                </>
                            )
                        })()}
                        {challenge.category && <span className='text-gray-500 font-medium'>— {challenge.category}</span>}
                    </p>
                </div>
                <div className='bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl'>
                    <p className='text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1'>Mục tiêu</p>
                    <p className='text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-1.5'>
                        <FaBullseye className='text-orange-500' />
                        {challenge.goal_value} {challenge.goal_unit}
                    </p>
                </div>
                <div className='bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl'>
                    <p className='text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1'>Thời gian diễn ra</p>
                    <p className='text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-1.5'>
                        <FaClock className='text-blue-500' />
                        {fmt(challenge.start_date)} - {fmt(challenge.end_date)}
                    </p>
                </div>
                <div className='bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl'>
                    <p className='text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1'>Tham gia / Tương tác</p>
                    <p className='text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-1.5'>
                        <FaUsers className='text-indigo-500' />
                        {memberCount} thành viên đã tham gia
                    </p>
                </div>
            </div>

            {/* Cấu hình đặc thù Fitness */}
            {challenge.challenge_type === 'fitness' && challenge.exercises && challenge.exercises.length > 0 && (
                <div>
                    <h5 className='text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 border-b border-gray-100 dark:border-gray-700 pb-2'>
                        Yêu cầu bài tập (Fitness)
                    </h5>
                    <div className='space-y-3'>
                        {challenge.exercises.map((ex, i) => (
                            <div key={i} className='p-3 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-lg flex justify-between items-center'>
                                <span className='font-semibold text-sm text-gray-800 dark:text-gray-200'>{ex.exercise_name}</span>
                                <div className='flex gap-2 flex-wrap max-w-[60%] justify-end text-xs'>
                                    {ex.sets?.map((set, sIdx) => (
                                        <span key={sIdx} className='px-2 py-1 bg-white dark:bg-gray-800 rounded font-medium text-gray-600 dark:text-gray-300 shadow-sm'>
                                            H{set.set_number}: {set.reps} reps {set.weight > 0 ? `(${set.weight}kg)` : ''}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Cấu hình đặc thù Ăn uống */}
            {challenge.challenge_type === 'nutrition' && challenge.nutrition_sub_type === 'time_window' && (
                <div>
                    <h5 className='text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 border-b border-gray-100 dark:border-gray-700 pb-2 flex items-center gap-2'>
                        <FaClock className='text-amber-500'/> Khung giờ Check-in
                    </h5>
                    <div className='p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-900/50'>
                        <p className='text-sm text-gray-700 dark:text-gray-300'>
                            Yêu cầu người dùng thực hiện hoạt động trong khung giờ: <span className='font-bold text-orange-600 dark:text-orange-400'>{challenge.time_window_start || '?'}</span> - <span className='font-bold text-orange-600 dark:text-orange-400'>{challenge.time_window_end || '?'}</span>
                        </p>
                    </div>
                </div>
            )}
        </div>
    )

    const renderParticipants = () => (
        <div className='h-full'>
            {isLoading ? (
                <div className='space-y-3 p-6'>{[...Array(5)].map((_, i) => <div key={i} className='h-14 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse' />)}</div>
            ) : participants.length === 0 ? (
                <div className='py-14 text-center text-gray-400'>
                    <FaUsers size={32} className='mx-auto mb-3 opacity-30' />
                    <p className='text-sm'>Chưa có thành viên nào</p>
                </div>
            ) : (
                <table className='w-full divide-y divide-gray-100 dark:divide-gray-700 relative'>
                    <thead className='bg-gray-50 dark:bg-gray-900 sticky top-0 z-10'>
                        <tr>
                            {['Hạng', 'Người dùng', 'Tiến độ', 'Streak', 'Trạng thái', 'Tham gia'].map(h => (
                                <th key={h} className='px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap'>{h}</th>
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
                                        <span className='inline-flex items-center gap-1 text-xs font-semibold text-orange-600 dark:text-orange-400'><FaFire className='shrink-0 text-orange-500' size={11} aria-hidden /> {p.streak_count || 0}</span>
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
            )}
        </div>
    )

    return (
        <div className='fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4' onClick={e => e.target === e.currentTarget && onClose()}>
            <div className='bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col'>
                <div className='bg-gradient-to-r from-amber-500 to-orange-500 px-6 pt-4 rounded-t-2xl flex flex-col shrink-0'>
                    <div className='flex items-center justify-between'>
                        <h3 className='font-bold text-white flex items-center gap-2 text-base'>
                            <FaEye size={15} /> Phân tích Thử thách
                        </h3>
                        <button onClick={onClose} className='p-1.5 bg-black/10 hover:bg-black/20 rounded-lg transition-colors flex items-center justify-center'>
                            <FaTimes className='text-white' size={14} />
                        </button>
                    </div>
                    {/* Tabs */}
                    <div className='flex gap-6 mt-4'>
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`pb-3 font-semibold text-sm transition-all border-b-2 ${activeTab === 'overview' ? 'border-white text-white' : 'border-transparent text-white/70 hover:text-white'}`}
                        >
                            Tổng quan
                        </button>
                        <button
                            onClick={() => setActiveTab('participants')}
                            className={`pb-3 font-semibold text-sm transition-all border-b-2 flex items-center gap-1.5 ${activeTab === 'participants' ? 'border-white text-white' : 'border-transparent text-white/70 hover:text-white'}`}
                        >
                            <FaUsers size={14} /> Thành viên ({memberCount})
                        </button>
                    </div>
                </div>

                <div className='overflow-y-auto flex-1 bg-white dark:bg-gray-800 rounded-b-2xl' style={{ maxHeight: 'calc(85vh - 100px)' }}>
                    {activeTab === 'overview' ? renderDetails() : renderParticipants()}
                </div>
            </div>
        </div>
    )
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function AdminChallenge() {
    const queryClient = useQueryClient()
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const [searchInput, setSearchInput] = useState('')
    const [filterType, setFilterType] = useState('all')
    const [filterCategory, setFilterCategory] = useState('all')
    const [filterStatus, setFilterStatus] = useState('active')
    const [sortBy, setSortBy] = useState('newest')
    const [filterDateFrom, setFilterDateFrom] = useState('')
    const [filterDateTo, setFilterDateTo] = useState('')
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [confirmAction, setConfirmAction] = useState(null)
    const [participantsChallenge, setParticipantsChallenge] = useState(null)
    const LIMIT = 10
    const debounceRef = useRef(null)

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
            setSearch(searchInput)
            setPage(1)
        }, 500)
        return () => clearTimeout(debounceRef.current)
    }, [searchInput])

    // Stats
    const { data: statsData } = useQuery({
        queryKey: ['admin-challenge-stats'],
        queryFn: () => adminChallengeApi.getStats(),
        staleTime: 10000
    })
    const stats = statsData?.data?.result || {}

    // Categories
    const { data: categoriesData } = useQuery({
        queryKey: ['admin-categories'],
        queryFn: () => sportCategoryApi.getAll(),
        staleTime: 60000
    })
    const categories = categoriesData?.data?.result || []

    // Challenge list
    const isDeletedView = filterStatus === 'deleted'
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['admin-challenges', page, search, filterType, filterCategory, filterStatus, filterDateFrom, filterDateTo, sortBy],
        queryFn: () => adminChallengeApi.getAll({
            page, limit: LIMIT, search: search || undefined,
            challenge_type: filterType !== 'all' ? filterType : undefined,
            category: filterCategory !== 'all' ? filterCategory : undefined,
            status: !isDeletedView && filterStatus !== 'all' ? filterStatus : undefined,
            show_deleted: isDeletedView ? 'true' : undefined,
            dateFrom: filterDateFrom || undefined,
            dateTo: filterDateTo || undefined,
            sortBy
        }),
        keepPreviousData: true
    })

    const challenges = data?.data?.result?.challenges || []
    const totalPage = data?.data?.result?.totalPage || 1
    const total = data?.data?.result?.total || 0

    const invalidate = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['admin-challenges'] })
        queryClient.invalidateQueries({ queryKey: ['admin-challenge-stats'] })
    }, [queryClient])

    const softDeleteMutation = useSafeMutation({
        mutationFn: (id) => adminChallengeApi.forceCancel(id),
        onSuccess: () => { toast.success('Đã xóa thử thách'); invalidate() },
        onError: (err) => toast.error(err?.response?.data?.message || 'Lỗi xóa thử thách')
    })

    const restoreMutation = useSafeMutation({
        mutationFn: (id) => adminChallengeApi.restore(id),
        onSuccess: () => { toast.success('Đã khôi phục thử thách'); invalidate() },
        onError: (err) => toast.error(err?.response?.data?.message || 'Lỗi khôi phục')
    })

    const activeFilterCount = [
        filterType !== 'all' && filterType,
        filterCategory !== 'all' && filterCategory,
        filterDateFrom,
        filterDateTo,
        sortBy !== 'newest' && sortBy
    ].filter(Boolean).length

    const clearAllFilters = () => {
        setSearchInput(''); setSearch(''); setFilterType('all')
        setFilterCategory('all')
        setFilterStatus('active'); setFilterDateFrom(''); setFilterDateTo('')
        setSortBy('newest'); setPage(1)
    }

    const handleConfirm = () => {
        if (!confirmAction) return
        if (confirmAction.type === 'delete') softDeleteMutation.mutate(confirmAction.challenge._id)
        else if (confirmAction.type === 'restore') restoreMutation.mutate(confirmAction.challenge._id)
        setConfirmAction(null)
    }

    // Determine active hero tab
    const getActiveTabKey = () => {
        if (filterStatus === 'deleted') return 'deleted'
        if (filterType === 'nutrition' && filterStatus === 'active') return 'nutrition'
        if (filterType === 'outdoor_activity' && filterStatus === 'active') return 'outdoor'
        if (filterType === 'fitness' && filterStatus === 'active') return 'fitness'
        if (filterStatus === 'active' && filterType === 'all') return 'active'
        if (filterStatus === 'all' && filterType === 'all') return 'all'
        return null
    }
    const activeTabKey = getActiveTabKey()

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900 pt-0 pb-4 px-4'>

            {/* ── Hero Banner ── */}
            <div className='relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 px-6 py-4 mb-2 shadow-xl'>
                <div className='relative z-10 flex items-center justify-between'>
                    <h1 className='text-2xl font-bold text-white'>Quản lý Thử thách</h1>
                </div>

                <div className='relative z-10 flex gap-2 mt-3 flex-wrap'>
                    {[
                        {
                            key: 'all', label: 'Tất cả', icon: FaThList,
                            count: stats.total,
                            onClick: () => { setFilterStatus('all'); setFilterType('all'); setPage(1) }
                        },
                        {
                            key: 'active', label: 'Hoạt động', icon: FaCheckCircle,
                            count: stats.active,
                            onClick: () => { setFilterStatus('active'); setFilterType('all'); setPage(1) }
                        },
                        {
                            key: 'nutrition', label: 'Ăn uống', icon: FaAppleAlt,
                            count: stats.byType?.nutrition,
                            onClick: () => { setFilterStatus('active'); setFilterType('nutrition'); setPage(1) }
                        },
                        {
                            key: 'outdoor', label: 'Ngoài trời', icon: FaRunning,
                            count: stats.byType?.outdoor_activity,
                            onClick: () => { setFilterStatus('active'); setFilterType('outdoor_activity'); setPage(1) }
                        },
                        {
                            key: 'fitness', label: 'Thể dục', icon: FaDumbbell,
                            count: stats.byType?.fitness,
                            onClick: () => { setFilterStatus('active'); setFilterType('fitness'); setPage(1) }
                        },
                        {
                            key: 'deleted', label: 'Đã xóa', icon: FaTrash,
                            count: stats.deleted,
                            onClick: () => { setFilterStatus('deleted'); setFilterType('all'); setPage(1) }
                        },
                    ].map(tab => (
                        <button
                            type='button'
                            key={tab.key}
                            onClick={tab.onClick}
                            className={`admin-hero-tab shrink-0 ${
                                activeTabKey === tab.key ? 'bg-white text-amber-700 shadow-md' : 'bg-white/20 text-white hover:bg-white/30'
                            }`}
                        >
                            <tab.icon size={14} className='shrink-0 opacity-95' aria-hidden />
                            {tab.label}
                            <span className='font-black tabular-nums'>({tab.count ?? 0})</span>
                        </button>
                    ))}
                </div>

                <div className='absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10' />
                <div className='absolute right-20 -bottom-8 w-32 h-32 rounded-full bg-white/10' />
            </div>

            {/* ── Analytics Strip ── */}
            {challenges.length > 0 && (() => {
                const now = new Date()
                const activeChallenges = challenges.filter(c => !c.is_deleted)
                const nutritionCount = activeChallenges.filter(c => c.challenge_type === 'nutrition').length
                const outdoorCount = activeChallenges.filter(c => c.challenge_type === 'outdoor_activity').length
                const fitnessCount = activeChallenges.filter(c => c.challenge_type === 'fitness').length
                const avgParticipants = activeChallenges.length > 0
                    ? Math.round(activeChallenges.reduce((s, c) => s + (c.participants_count || 0), 0) / activeChallenges.length)
                    : 0
                const ongoingCount = activeChallenges.filter(c => new Date(c.start_date) <= now && new Date(c.end_date) > now).length

                const monthData = []
                for (let i = 5; i >= 0; i--) {
                    const d = new Date()
                    d.setMonth(d.getMonth() - i)
                    const m = d.getMonth(); const y = d.getFullYear()
                    const count = activeChallenges.filter(c => {
                        const cd = new Date(c.createdAt)
                        return cd.getMonth() === m && cd.getFullYear() === y
                    }).length
                    monthData.push({ label: `T${m + 1}`, count })
                }
                const maxCount = Math.max(...monthData.map(m => m.count), 1)

                return (
                    <div className='bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm mb-2 overflow-hidden'>
                        <div className='flex flex-wrap items-center gap-3 px-4 py-3'>
                            <span className='flex flex-col gap-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide shrink-0 border-r border-gray-200 dark:border-gray-600 pr-3'>
                                <span className='flex items-center gap-1.5'><FaChartBar size={12} className='shrink-0' /> Thống kê</span>
                                <span className='text-[9px] font-semibold normal-case text-gray-500 dark:text-gray-400 tracking-normal'>Theo danh sách hiện tại</span>
                            </span>

                            {[
                                { label: 'Tổng (lọc) / hiển thị', value: `${total} / ${activeChallenges.length}`, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                                { label: 'Đang diễn ra', value: ongoingCount, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                                { label: 'Trung bình thành viên', value: avgParticipants, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                                { label: 'Ăn uống / Ngoài trời / Thể dục', value: `${nutritionCount}/${outdoorCount}/${fitnessCount}`, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
                            ].map(s => (
                                <div key={s.label} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${s.bg}`}>
                                    <span className={`text-base font-black leading-none ${s.color}`}>{s.value}</span>
                                    <span className='text-[10px] text-gray-400 dark:text-gray-500 font-semibold uppercase leading-tight'>{s.label}</span>
                                </div>
                            ))}

                            <div className='flex items-end gap-1 ml-auto' style={{ height: 36 }}>
                                <span className='text-[9px] text-gray-400 mr-1 self-center uppercase font-semibold tracking-wide'>6 tháng</span>
                                {monthData.map((m, i) => (
                                    <div key={i} className='flex flex-col items-center gap-0.5' style={{ width: 20 }}>
                                        <span className='text-[8px] font-bold text-gray-400 leading-none'>{m.count || ''}</span>
                                        <div
                                            className='w-full rounded-t bg-gradient-to-t from-amber-600 to-orange-400'
                                            style={{ height: `${Math.max((m.count / maxCount) * 22, 2)}px` }}
                                        />
                                        <span className='text-[8px] text-gray-400 leading-none'>{m.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )
            })()}

            {/* ── Smart Search & Filters ── */}
            <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-2 overflow-hidden'>
                <div className='p-4'>
                    <div className='flex gap-2 items-center'>
                        <div className='relative flex-1'>
                            <FaSearch className='absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm' />
                            {searchInput && (
                                <button
                                    onClick={() => setSearchInput('')}
                                    className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors'
                                >
                                    <FaTimes size={12} />
                                </button>
                            )}
                            <input
                                value={searchInput}
                                onChange={e => setSearchInput(e.target.value)}
                                placeholder='Tìm theo tên thử thách, mô tả...'
                                className='min-h-10 w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-10 pr-8 text-sm outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:bg-slate-600'
                            />
                        </div>
                        <button
                            type='button'
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className={`admin-page-btn shrink-0 ${
                                showAdvanced || activeFilterCount > 0
                                    ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300'
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
                    </div>

                    {/* Active filter chips */}
                    {activeFilterCount > 0 && (
                        <div className='flex flex-wrap gap-2 mt-3'>
                            {filterType !== 'all' && (() => {
                                const ft = TYPE_CONFIG[filterType]
                                const FtIcon = ft?.icon || FaTrophy
                                return (
                                <span className='inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'>
                                    <FtIcon size={11} className='shrink-0 opacity-90' aria-hidden /> {ft?.label || filterType}
                                    <button onClick={() => { setFilterType('all'); setFilterCategory('all'); setPage(1) }} className='hover:text-amber-900 dark:hover:text-amber-100'><FaTimes size={9} /></button>
                                </span>
                                )
                            })()}
                            {filterCategory !== 'all' && (
                                <span className='inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'>
                                    <FaFolderOpen size={11} className='shrink-0 opacity-80' /> {filterCategory}
                                    <button onClick={() => { setFilterCategory('all'); setPage(1) }} className='hover:text-indigo-900 dark:hover:text-indigo-100'><FaTimes size={9} /></button>
                                </span>
                            )}
                            {filterDateFrom && (
                                <span className='inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'>
                                    <FaCalendarAlt size={11} className='shrink-0 opacity-80' /> Từ {new Date(filterDateFrom).toLocaleDateString('vi-VN')}
                                    <button onClick={() => { setFilterDateFrom(''); setPage(1) }} className='hover:text-orange-900 dark:hover:text-orange-100'><FaTimes size={9} /></button>
                                </span>
                            )}
                            {filterDateTo && (
                                <span className='inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'>
                                    <FaCalendarAlt size={11} className='shrink-0 opacity-80' /> Đến {new Date(filterDateTo).toLocaleDateString('vi-VN')}
                                    <button onClick={() => { setFilterDateTo(''); setPage(1) }} className='hover:text-orange-900 dark:hover:text-orange-100'><FaTimes size={9} /></button>
                                </span>
                            )}
                            {sortBy !== 'newest' && (
                                <span className='inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'>
                                    <FaSortAmountDown size={11} className='shrink-0 opacity-80' /> {sortBy === 'oldest' ? 'Cũ nhất' : sortBy === 'popular' ? 'Phổ biến nhất' : 'Sắp diễn ra'}
                                    <button onClick={() => { setSortBy('newest'); setPage(1) }} className='hover:text-purple-900 dark:hover:text-purple-100'><FaTimes size={9} /></button>
                                </span>
                            )}
                            <button
                                onClick={clearAllFilters}
                                className='inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors'
                            >
                                <FaTimes size={9} /> Xóa tất cả
                            </button>
                        </div>
                    )}
                </div>

                {/* Collapsible advanced filters */}
                {showAdvanced && (
                    <div className='px-4 pb-4 pt-0 border-t border-gray-100 dark:border-gray-700'>
                        <div className='grid grid-cols-2 lg:grid-cols-5 gap-3 pt-3'>
                            <div>
                                <label className='block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5'>Loại thử thách</label>
                                <select
                                    value={filterType}
                                    onChange={e => { setFilterType(e.target.value); setFilterCategory('all'); setPage(1) }}
                                    className='w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-amber-500 transition-all'
                                >
                                    <option value='all'>Tất cả loại</option>
                                    <option value='nutrition'>Ăn uống</option>
                                    <option value='outdoor_activity'>Ngoài trời</option>
                                    <option value='fitness'>Thể dục</option>
                                </select>
                            </div>

                            <div className={filterType === 'all' || filterType === 'nutrition' ? 'opacity-50 pointer-events-none' : ''}>
                                <label className='block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5'>Danh mục con</label>
                                <select
                                    disabled={filterType === 'all' || filterType === 'nutrition'}
                                    value={filterCategory}
                                    onChange={e => { setFilterCategory(e.target.value); setPage(1) }}
                                    className='w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-amber-500 transition-all disabled:bg-gray-100 dark:disabled:bg-gray-800'
                                >
                                    <option value='all'>Tất cả danh mục</option>
                                    {categories.filter(c => c.sport_type === filterType).map(c => (
                                        <option key={c._id} value={c.name}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className='block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5'>Trạng thái</label>
                                <select
                                    value={filterStatus}
                                    onChange={e => { setFilterStatus(e.target.value); setPage(1) }}
                                    className='w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-amber-500 transition-all'
                                >
                                    <option value='all'>Tất cả trạng thái</option>
                                    <option value='active'>Hoạt động</option>
                                    <option value='completed'>Hoàn thành</option>
                                    <option value='cancelled'>Đã hủy</option>
                                    <option value='deleted'>Đã xóa</option>
                                </select>
                            </div>

                            <div>
                                <label className='block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5'>Từ ngày</label>
                                <input
                                    type='date'
                                    value={filterDateFrom}
                                    onChange={e => { setFilterDateFrom(e.target.value); setPage(1) }}
                                    className='w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-amber-500 transition-all'
                                />
                            </div>

                            <div>
                                <label className='block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5'>Đến ngày</label>
                                <input
                                    type='date'
                                    value={filterDateTo}
                                    onChange={e => { setFilterDateTo(e.target.value); setPage(1) }}
                                    className='w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-amber-500 transition-all'
                                />
                            </div>
                        </div>

                        <div className='flex items-center gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700'>
                            <FaSortAmountDown className='text-gray-400 text-sm shrink-0' />
                            <span className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase shrink-0'>Sắp xếp:</span>
                            <div className='flex gap-2 flex-wrap'>
                                {[
                                    { value: 'newest', label: 'Mới nhất' },
                                    { value: 'oldest', label: 'Cũ nhất' },
                                    { value: 'popular', label: 'Phổ biến nhất' },
                                    { value: 'earliest', label: 'Sắp diễn ra' }
                                ].map(s => (
                                    <button
                                        type='button'
                                        key={s.value}
                                        onClick={() => { setSortBy(s.value); setPage(1) }}
                                        className={`inline-flex min-h-9 items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                                            sortBy === s.value
                                                ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-700'
                                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
                                        }`}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Table ── */}
            {isLoading ? (
                <Loading />
            ) : isError ? (
                <div className='text-center py-16'>
                    <div className='text-red-500 mb-3 flex justify-center'><FaExclamationTriangle className='text-4xl' aria-hidden /></div>
                    <p className='text-gray-500 dark:text-gray-400'>{error?.response?.data?.message || 'Không thể tải dữ liệu'}</p>
                    <button onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-challenges'] })}
                        className='mt-3 text-sm text-blue-600 hover:underline'>Thử lại</button>
                </div>
            ) : (
                <>
                    <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden'>
                        <div className='overflow-x-auto'>
                            <table className='w-full divide-y divide-gray-200 dark:divide-slate-700'>
                                <thead className='bg-gray-50 dark:bg-gray-900'>
                                    <tr>
                                        {['STT', 'Thử thách', 'Loại / Danh mục', 'Thời gian', 'Mục tiêu', 'Tiến độ', 'Tham gia', 'Người tổ chức', 'Hành động'].map(h => (
                                            <th key={h} className='px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap'>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-gray-100 dark:divide-slate-700'>
                                    {challenges.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className='text-center py-14'>
                                                <FaTrophy className='mx-auto text-4xl text-gray-300 mb-3' />
                                                <p className='text-gray-400 text-sm'>Không có thử thách nào</p>
                                            </td>
                                        </tr>
                                    ) : challenges.map((c, idx) => {
                                        const typeCfg = TYPE_CONFIG[c.challenge_type] || {}
                                        const TypeIcon = typeCfg.icon || FaTrophy
                                        const creator = c.creator_id

                                        return (
                                            <tr key={c._id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${c.is_deleted ? 'opacity-60' : ''}`}>
                                                {/* STT */}
                                                <td className='px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap'>
                                                    {(page - 1) * LIMIT + idx + 1}
                                                </td>
                                                {/* Challenge name + image */}
                                                <td className='px-4 py-3 min-w-[200px]'>
                                                    <div className='flex items-center gap-3'>
                                                        {c.image ? (
                                                            <img src={c.image} alt={c.title} className='w-10 h-10 rounded-lg object-cover shrink-0' onError={e => { e.target.style.display = 'none' }} />
                                                        ) : (
                                                            <div className='w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-lg shrink-0'>
                                                                {c.badge_emoji ? <span className='text-lg leading-none' aria-hidden>{c.badge_emoji}</span> : <FaTrophy className='text-lg' aria-hidden />}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className='font-semibold text-sm text-gray-800 dark:text-white line-clamp-1'>{c.title}</p>
                                                            <p className='text-xs text-gray-500 line-clamp-1'>{c.description}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                {/* Type + Category */}
                                                <td className='px-4 py-3 whitespace-nowrap'>
                                                    <div>
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full ${typeCfg.badge}`}>
                                                            <TypeIcon size={11} className='shrink-0' aria-hidden />
                                                            {typeCfg.label || c.challenge_type}
                                                        </span>
                                                        {c.category && (
                                                            <p className='text-xs text-gray-400 mt-0.5'>{c.category}</p>
                                                        )}
                                                    </div>
                                                </td>
                                                {/* Dates */}
                                                <td className='px-4 py-3 whitespace-nowrap'>
                                                    <div className='flex flex-col gap-0.5 text-xs text-gray-600 dark:text-gray-300'>
                                                        <span className='inline-flex items-center gap-1'><FaCircle className='text-emerald-500 shrink-0' style={{ fontSize: '6px' }} aria-hidden /> {fmt(c.start_date)}</span>
                                                        <span className='inline-flex items-center gap-1'><FaCircle className='text-rose-500 shrink-0' style={{ fontSize: '6px' }} aria-hidden /> {fmt(c.end_date)}</span>
                                                    </div>
                                                </td>
                                                {/* Goal */}
                                                <td className='px-4 py-3 whitespace-nowrap'>
                                                    <div className='flex items-center gap-1.5'>
                                                        <FaBullseye className='text-orange-400 text-xs' />
                                                        <span className='text-sm font-semibold text-gray-700 dark:text-gray-200'>
                                                            {c.goal_value} {c.goal_unit}
                                                        </span>
                                                    </div>
                                                </td>
                                                {/* Progress */}
                                                <td className='px-4 py-3 whitespace-nowrap'>
                                                    {c.progressPercent != null ? (
                                                        <div className='flex items-center gap-2'>
                                                            <div className='w-20 bg-gray-200 dark:bg-slate-600 rounded-full h-1.5'>
                                                                <div className='bg-gradient-to-r from-amber-400 to-orange-500 h-1.5 rounded-full' style={{ width: `${Math.min(c.progressPercent, 100)}%` }} />
                                                            </div>
                                                            <span className='text-xs text-gray-500 font-medium'>{c.progressPercent}%</span>
                                                        </div>
                                                    ) : (
                                                        <span className='text-xs text-gray-400'>—</span>
                                                    )}
                                                </td>
                                                {/* Participants */}
                                                <td className='px-4 py-3 whitespace-nowrap'>
                                                    <div className='flex items-center gap-1'>
                                                        <FaUsers className='text-amber-500 text-xs' />
                                                        <span className='text-sm font-semibold text-gray-700 dark:text-gray-200'>{c.participants_count || 0}</span>
                                                    </div>
                                                </td>
                                                {/* Creator */}
                                                <td className='px-4 py-3 whitespace-nowrap'>
                                                    <div className='flex items-center gap-1.5'>
                                                        {creator?.avatar ? (
                                                            <img src={creator.avatar} className='w-6 h-6 rounded-full object-cover ring-1 ring-gray-200' alt='' />
                                                        ) : (
                                                            <div className='w-6 h-6 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center text-xs font-bold text-amber-700 dark:text-amber-300'>
                                                                {(creator?.name || creator?.username || '?')[0]?.toUpperCase()}
                                                            </div>
                                                        )}
                                                        <span className='text-xs text-gray-500 dark:text-gray-400 max-w-[80px] truncate'>{creator?.name || creator?.username || '—'}</span>
                                                    </div>
                                                </td>
                                                {/* Actions */}
                                                <td className='px-4 py-3 whitespace-nowrap'>
                                                    <div className='flex items-center gap-1.5'>
                                                        {!c.is_deleted && (
                                                            <button
                                                                type='button'
                                                                onClick={() => setParticipantsChallenge(c)}
                                                                title='Xem thành viên'
                                                                className='inline-flex h-9 w-9 items-center justify-center rounded-lg text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/30 dark:hover:text-blue-200'
                                                            >
                                                                <FaEye size={15} />
                                                            </button>
                                                        )}
                                                        {c.is_deleted ? (
                                                            <button
                                                                type='button'
                                                                onClick={() => setConfirmAction({ type: 'restore', challenge: c })}
                                                                title='Khôi phục'
                                                                className='inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-2.5 text-green-600 transition-colors hover:bg-green-50 hover:text-green-800 dark:text-green-400 dark:hover:bg-green-900/30 dark:hover:text-green-200'
                                                            >
                                                                <FaUndo size={15} />
                                                                <span className='text-xs font-semibold'>Khôi phục</span>
                                                            </button>
                                                        ) : (
                                                            <button
                                                                type='button'
                                                                onClick={() => setConfirmAction({ type: 'delete', challenge: c })}
                                                                title='Xóa'
                                                                className='inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50 hover:text-red-800 dark:text-red-400 dark:hover:bg-red-900/30 dark:hover:text-red-200'
                                                            >
                                                                <FaTrash size={15} />
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

                    {/* Pagination */}
                    {totalPage > 1 && (
                        <div className='flex items-center justify-center gap-2 mt-5'>
                            <button
                                type='button'
                                disabled={page <= 1}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                className='admin-page-btn border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
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
                                            type='button'
                                            key={p}
                                            onClick={() => setPage(p)}
                                            className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-sm font-medium transition-colors ${p === page ? 'bg-amber-600 text-white shadow-sm' : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'}`}
                                        >
                                            {p}
                                        </button>
                                    ) : (
                                        <span key={p} className='px-1 text-gray-400'>...</span>
                                    )
                                )
                            }
                            <button
                                type='button'
                                disabled={page >= totalPage}
                                onClick={() => setPage(p => Math.min(totalPage, p + 1))}
                                className='admin-page-btn border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
                            >
                                Sau →
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Participants Modal */}
            {participantsChallenge && (
                <ParticipantsModal
                    challenge={participantsChallenge}
                    onClose={() => setParticipantsChallenge(null)}
                />
            )}

            {/* Confirm Dialog */}
            {confirmAction && (
                <ConfirmBox
                    title={confirmAction.type === 'delete' ? 'Xóa thử thách?' : 'Khôi phục thử thách?'}
                    subtitle={
                        confirmAction.type === 'delete'
                            ? `Bạn có chắc muốn xóa thử thách "${confirmAction.challenge.title}"? Thao tác này có thể được khôi phục.`
                            : `Bạn có chắc muốn khôi phục thử thách "${confirmAction.challenge.title}"?`
                    }
                    danger={confirmAction.type === 'delete'}
                    handleDelete={handleConfirm}
                    closeModal={() => setConfirmAction(null)}
                    isPending={softDeleteMutation.isPending || restoreMutation.isPending}
                    tilteButton={confirmAction.type === 'delete' ? 'Xóa' : 'Khôi phục'}
                />
            )}
        </div>
    )
}
