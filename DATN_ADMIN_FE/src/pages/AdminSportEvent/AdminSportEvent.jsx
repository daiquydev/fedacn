import React, { useState, useCallback, useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
    FaCalendarAlt, FaPlus, FaEdit, FaTrash, FaUndo, FaSearch,
    FaFilter, FaUsers, FaMapMarkerAlt, FaRunning, FaHome,
    FaTimes, FaChevronDown, FaSortAmountDown
} from 'react-icons/fa'
import toast from 'react-hot-toast'
import adminSportEventApi from '../../apis/sportEventApi'
import Loading from '../../components/GlobalComponents/Loading'
import ConfirmBox from '../../components/GlobalComponents/ConfirmBox'
import { useSafeMutation } from '../../hooks/useSafeMutation'
import EventFormModal from './EventFormModal'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const EVENT_TYPE_OPTIONS = ['all', 'Ngoài trời', 'Trong nhà']
const STATUS_OPTIONS = [
    { value: 'active', label: 'Đang hoạt động' },
    { value: 'deleted', label: 'Đã xóa' },
    { value: 'all', label: 'Tất cả' }
]

// ─── Stat Card ───────────────────────────────────────────────────────────────
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



// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminSportEvent() {
    const queryClient = useQueryClient()
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const [searchInput, setSearchInput] = useState('')
    const [filterCategory, setFilterCategory] = useState('')
    const [filterEventType, setFilterEventType] = useState('all')
    const [filterStatus, setFilterStatus] = useState('active')
    const [sortBy, setSortBy] = useState('newest')
    const [filterDateFrom, setFilterDateFrom] = useState('')
    const [filterDateTo, setFilterDateTo] = useState('')
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [modalEvent, setModalEvent] = useState(undefined) // undefined = closed, null = new, obj = edit
    const [confirmAction, setConfirmAction] = useState(null) // { type, event }
    const LIMIT = 10
    const debounceRef = useRef(null)

    // Debounced live search — auto-search 500ms after typing
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
        queryKey: ['adminSportEventStats'],
        queryFn: () => adminSportEventApi.getStats()
    })
    const stats = statsData?.data?.result || {}

    // Event list
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['adminSportEvents', page, search, filterCategory, filterEventType, filterStatus, filterDateFrom, filterDateTo, sortBy],
        queryFn: () => adminSportEventApi.getAll({
            page, limit: LIMIT, search,
            category: filterCategory || undefined,
            eventType: filterEventType !== 'all' ? filterEventType : undefined,
            status: filterStatus,
            dateFrom: filterDateFrom || undefined,
            dateTo: filterDateTo || undefined,
            sortBy
        }),
        keepPreviousData: true
    })

    const events = data?.data?.result?.events || []
    const totalPage = data?.data?.result?.totalPage || 1
    const total = data?.data?.result?.total || 0

    // Sport categories for the form dropdown — only active (non-deleted)
    const { data: catData } = useQuery({
        queryKey: ['adminSportCategories'],
        queryFn: () => import('../../apis/sportCategoryApi').then(m => m.default.getAll())
    })
    const categories = (catData?.data?.result || []).filter(c => !c.isDeleted)

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ['adminSportEvents'] })
        queryClient.invalidateQueries({ queryKey: ['adminSportEventStats'] })
    }

    const softDeleteMutation = useSafeMutation({
        mutationFn: (id) => adminSportEventApi.softDelete(id),
        onSuccess: () => { toast.success('Đã xóa sự kiện'); invalidate() },
        onError: (err) => toast.error(err?.response?.data?.message || 'Lỗi xóa sự kiện')
    })

    const restoreMutation = useSafeMutation({
        mutationFn: (id) => adminSportEventApi.restore(id),
        onSuccess: () => { toast.success('Đã khôi phục sự kiện'); invalidate() },
        onError: (err) => toast.error(err?.response?.data?.message || 'Lỗi khôi phục')
    })

    // Count active filters for badge
    const activeFilterCount = [
        filterCategory, 
        filterEventType !== 'all' && filterEventType, 
        filterDateFrom, 
        filterDateTo,
        sortBy !== 'newest' && sortBy
    ].filter(Boolean).length

    const clearAllFilters = () => {
        setSearchInput(''); setSearch(''); setFilterCategory('')
        setFilterEventType('all'); setFilterDateFrom(''); setFilterDateTo('')
        setSortBy('newest'); setPage(1)
    }

    const handleConfirm = () => {
        if (!confirmAction) return
        if (confirmAction.type === 'delete') softDeleteMutation.mutate(confirmAction.event._id)
        else if (confirmAction.type === 'restore') restoreMutation.mutate(confirmAction.event._id)
        setConfirmAction(null)
    }

    const handleFormSuccess = useCallback(() => {
        setModalEvent(undefined)
        invalidate()
    }, [])

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900 py-4 px-4'>

            {/* ── Hero Banner ── */}
            <div className='relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-500 via-green-500 to-emerald-600 px-8 py-8 mb-6 shadow-xl'>
                <div className='relative z-10 flex items-start justify-between'>
                    <div>
                        <p className='text-white/70 text-sm font-medium mb-1'>FitConnect Admin</p>
                        <h1 className='text-3xl font-black text-white mb-2'>Quản lý Sự kiện Thể thao</h1>
                        <p className='text-white/80 text-sm max-w-md'>
                            Tạo, chỉnh sửa và theo dõi các sự kiện thể thao trong hệ thống.
                        </p>
                    </div>
                    <button
                        onClick={() => setModalEvent(null)}
                        className='flex items-center gap-2 bg-white text-emerald-700 font-bold text-sm px-4 py-2 rounded-xl hover:bg-emerald-50 transition-all shadow-lg shrink-0 mt-1'
                    >
                        <FaPlus size={12} /> Tạo sự kiện
                    </button>
                </div>

                {/* Tabs inside Hero Banner */}
                <div className='relative z-10 flex gap-2 mt-5'>
                    <button
                        onClick={() => { setFilterStatus('active'); setPage(1) }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all backdrop-blur-sm ${
                            filterStatus === 'active'
                                ? 'bg-white text-emerald-700 shadow-md'
                                : 'bg-white/20 text-white hover:bg-white/30'
                        }`}
                    >
                        <FaCalendarAlt size={14} />
                        Đang hoạt động ({stats.active ?? 0})
                    </button>
                    <button
                        onClick={() => { setFilterStatus('deleted'); setPage(1) }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all backdrop-blur-sm ${
                            filterStatus === 'deleted'
                                ? 'bg-white text-emerald-700 shadow-md'
                                : 'bg-white/20 text-white hover:bg-white/30'
                        }`}
                    >
                        <FaTrash size={13} />
                        Đã xóa ({stats.deleted ?? 0})
                    </button>
                    <button
                        onClick={() => { setFilterStatus('all'); setPage(1) }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all backdrop-blur-sm ${
                            filterStatus === 'all'
                                ? 'bg-white text-emerald-700 shadow-md'
                                : 'bg-white/20 text-white hover:bg-white/30'
                        }`}
                    >
                        Tất cả ({stats.total ?? 0})
                    </button>
                </div>

                <div className='absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10' />
                <div className='absolute right-20 -bottom-8 w-32 h-32 rounded-full bg-white/10' />
            </div>

            {/* Stat Cards */}
            <div className='grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6'>
                <StatCard icon={FaCalendarAlt} label='Tổng sự kiện' value={stats.total} borderColor='border-l-blue-400' iconBg='bg-gradient-to-br from-blue-400 to-blue-600' />
                <StatCard icon={FaCalendarAlt} label='Đang hoạt động' value={stats.active} borderColor='border-l-emerald-400' iconBg='bg-gradient-to-br from-emerald-400 to-green-600' />
                <StatCard icon={FaRunning} label='Ngoài trời' value={stats.outdoor} borderColor='border-l-orange-400' iconBg='bg-gradient-to-br from-orange-400 to-amber-600' />
                <StatCard icon={FaHome} label='Trong nhà' value={stats.indoor} borderColor='border-l-purple-400' iconBg='bg-gradient-to-br from-purple-400 to-violet-600' />
                <StatCard icon={FaTrash} label='Đã xóa' value={stats.deleted} borderColor='border-l-red-400' iconBg='bg-gradient-to-br from-red-400 to-rose-600' />
            </div>

            {/* ── Smart Search & Filters ── */}
            <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-4 overflow-hidden'>
                {/* Main search row */}
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
                                placeholder='Tìm theo tên sự kiện, danh mục, địa điểm...'
                                className='w-full pl-10 pr-8 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-600 transition-all'
                            />
                        </div>
                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border transition-all shrink-0 ${
                                showAdvanced || activeFilterCount > 0
                                    ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                                    : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-300'
                            }`}
                        >
                            <FaFilter size={12} />
                            Bộ lọc
                            {activeFilterCount > 0 && (
                                <span className='w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center'>
                                    {activeFilterCount}
                                </span>
                            )}
                            <FaChevronDown size={10} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                        </button>
                    </div>

                    {/* Active filter chips */}
                    {activeFilterCount > 0 && (
                        <div className='flex flex-wrap gap-2 mt-3'>
                            {filterCategory && (
                                <span className='inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'>
                                    📂 {filterCategory}
                                    <button onClick={() => { setFilterCategory(''); setPage(1) }} className='hover:text-blue-900 dark:hover:text-blue-100'><FaTimes size={9} /></button>
                                </span>
                            )}
                            {filterEventType !== 'all' && (
                                <span className='inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'>
                                    {filterEventType === 'Ngoài trời' ? '🌿' : '🏠'} {filterEventType}
                                    <button onClick={() => { setFilterEventType('all'); setPage(1) }} className='hover:text-emerald-900 dark:hover:text-emerald-100'><FaTimes size={9} /></button>
                                </span>
                            )}
                            {filterDateFrom && (
                                <span className='inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'>
                                    📅 Từ {new Date(filterDateFrom).toLocaleDateString('vi-VN')}
                                    <button onClick={() => { setFilterDateFrom(''); setPage(1) }} className='hover:text-orange-900 dark:hover:text-orange-100'><FaTimes size={9} /></button>
                                </span>
                            )}
                            {filterDateTo && (
                                <span className='inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'>
                                    📅 Đến {new Date(filterDateTo).toLocaleDateString('vi-VN')}
                                    <button onClick={() => { setFilterDateTo(''); setPage(1) }} className='hover:text-orange-900 dark:hover:text-orange-100'><FaTimes size={9} /></button>
                                </span>
                            )}
                            {sortBy !== 'newest' && (
                                <span className='inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'>
                                    ↕️ {sortBy === 'oldest' ? 'Cũ nhất' : sortBy === 'popular' ? 'Phổ biến nhất' : 'Sắp diễn ra'}
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
                        <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 pt-3'>
                            {/* Category filter */}
                            <div>
                                <label className='block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5'>Danh mục</label>
                                <select
                                    value={filterCategory}
                                    onChange={e => { setFilterCategory(e.target.value); setPage(1) }}
                                    className='w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all'
                                >
                                    <option value=''>Tất cả danh mục</option>
                                    {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                                </select>
                            </div>

                            {/* Event type filter */}
                            <div>
                                <label className='block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5'>Loại hình</label>
                                <select
                                    value={filterEventType}
                                    onChange={e => { setFilterEventType(e.target.value); setPage(1) }}
                                    className='w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all'
                                >
                                    <option value='all'>Tất cả loại</option>
                                    <option value='Ngoài trời'>🌿 Ngoài trời</option>
                                    <option value='Trong nhà'>🏠 Trong nhà</option>
                                </select>
                            </div>

                            {/* Date from */}
                            <div>
                                <label className='block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5'>Từ ngày</label>
                                <input
                                    type='date'
                                    value={filterDateFrom}
                                    onChange={e => { setFilterDateFrom(e.target.value); setPage(1) }}
                                    className='w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all'
                                />
                            </div>

                            {/* Date to */}
                            <div>
                                <label className='block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5'>Đến ngày</label>
                                <input
                                    type='date'
                                    value={filterDateTo}
                                    onChange={e => { setFilterDateTo(e.target.value); setPage(1) }}
                                    className='w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all'
                                />
                            </div>
                        </div>

                        {/* Sort row */}
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
                                        key={s.value}
                                        onClick={() => { setSortBy(s.value); setPage(1) }}
                                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                            sortBy === s.value
                                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-300 dark:ring-emerald-700'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
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

            {/* Event Analytics Dashboard */}
            {events.length > 0 && (() => {
                const now = new Date()
                const outdoorCount = events.filter(e => e.eventType === 'Ngoài trời' && !e.isDeleted).length
                const indoorCount = events.filter(e => e.eventType === 'Trong nhà' && !e.isDeleted).length
                const activeEvents = events.filter(e => !e.isDeleted)
                const avgParticipants = activeEvents.length > 0
                    ? Math.round(activeEvents.reduce((s, e) => s + (e.participants || 0), 0) / activeEvents.length)
                    : 0
                const ongoingCount = activeEvents.filter(e => new Date(e.startDate) <= now && new Date(e.endDate) > now).length

                // Events per month (last 6 months)
                const monthData = []
                for (let i = 5; i >= 0; i--) {
                    const d = new Date()
                    d.setMonth(d.getMonth() - i)
                    const m = d.getMonth()
                    const y = d.getFullYear()
                    const count = activeEvents.filter(e => {
                        const cd = new Date(e.createdAt)
                        return cd.getMonth() === m && cd.getFullYear() === y
                    }).length
                    monthData.push({ label: `T${m + 1}`, count })
                }
                const maxCount = Math.max(...monthData.map(m => m.count), 1)

                return (
                    <div className='bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm mb-4 overflow-hidden'>
                        <div className='bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-3 flex items-center justify-between'>
                            <h3 className='text-white font-bold text-sm flex items-center gap-2'>📊 Thống kê sự kiện</h3>
                        </div>
                        <div className='p-5'>
                            <div className='grid grid-cols-2 md:grid-cols-4 gap-3 mb-5'>
                                <div className='text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl'>
                                    <p className='text-xl font-black text-blue-600'>{activeEvents.length}</p>
                                    <p className='text-[10px] text-gray-500 uppercase font-bold mt-1'>Tổng sự kiện</p>
                                </div>
                                <div className='text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl'>
                                    <p className='text-xl font-black text-emerald-600'>{ongoingCount}</p>
                                    <p className='text-[10px] text-gray-500 uppercase font-bold mt-1'>Đang diễn ra</p>
                                </div>
                                <div className='text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl'>
                                    <p className='text-xl font-black text-amber-600'>{avgParticipants}</p>
                                    <p className='text-[10px] text-gray-500 uppercase font-bold mt-1'>TB thành viên</p>
                                </div>
                                <div className='text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl'>
                                    <p className='text-xl font-black text-purple-600'>
                                        {outdoorCount}<span className='text-gray-400 mx-1 text-sm font-normal'>/</span>{indoorCount}
                                    </p>
                                    <p className='text-[10px] text-gray-500 uppercase font-bold mt-1'>Ngoài / Trong nhà</p>
                                </div>
                            </div>

                            {/* Mini CSS Bar Chart */}
                            <p className='text-[10px] text-gray-400 uppercase font-bold tracking-wide mb-2'>Sự kiện tạo theo tháng</p>
                            <div className='flex items-end gap-2' style={{ height: 60 }}>
                                {monthData.map((m, i) => (
                                    <div key={i} className='flex-1 flex flex-col items-center gap-1'>
                                        <span className='text-[9px] font-bold text-gray-500'>{m.count}</span>
                                        <div
                                            className='w-full rounded-t-md bg-gradient-to-t from-indigo-600 to-blue-400 transition-all'
                                            style={{ height: `${Math.max((m.count / maxCount) * 48, 2)}px` }}
                                        />
                                        <span className='text-[9px] text-gray-400'>{m.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )
            })()}

            {/* Table */}
            {isLoading ? (
                <Loading />
            ) : isError ? (
                <div className='text-center py-16'>
                    <div className='text-red-500 text-4xl mb-3'>⚠️</div>
                    <p className='text-gray-500 dark:text-gray-400'>{error?.response?.data?.message || 'Không thể tải dữ liệu'}</p>
                    <button onClick={() => queryClient.invalidateQueries({ queryKey: ['adminSportEvents'] })}
                        className='mt-3 text-sm text-blue-600 hover:underline'>Thử lại</button>
                </div>
            ) : (
                <>
                    <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden'>
                        <div className='px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between'>
                            <p className='text-sm text-gray-500 dark:text-gray-400'>
                                Hiển thị <span className='font-semibold text-gray-800 dark:text-white'>{events.length}</span> / {total} sự kiện
                            </p>
                        </div>
                        <div className='overflow-x-auto'>
                            <table className='w-full divide-y divide-gray-200 dark:divide-slate-700'>
                                <thead className='bg-gray-50 dark:bg-gray-900'>
                                    <tr>
                                        {['STT', 'Sự kiện', 'Danh mục / Loại', 'Thời gian', 'Địa điểm', 'Người tham gia', 'Tiến độ', 'Trạng thái', 'Hành động'].map(h => (
                                            <th key={h} className='px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap'>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-gray-100 dark:divide-slate-700'>
                                    {events.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className='text-center py-14'>
                                                <FaCalendarAlt className='mx-auto text-4xl text-gray-300 mb-3' />
                                                <p className='text-gray-400 text-sm'>Không có sự kiện nào</p>
                                                <button onClick={() => setModalEvent(null)} className='mt-2 text-sm text-blue-600 hover:underline'>+ Tạo sự kiện đầu tiên</button>
                                            </td>
                                        </tr>
                                    ) : events.map((ev, idx) => (
                                        <tr key={ev._id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${ev.isDeleted ? 'opacity-60' : ''}`}>
                                            {/* STT */}
                                            <td className='px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap'>
                                                {(page - 1) * LIMIT + idx + 1}
                                            </td>
                                            {/* Event name + image */}
                                            <td className='px-4 py-3 min-w-[200px]'>
                                                <div className='flex items-center gap-3'>
                                                    {ev.image ? (
                                                        <img src={ev.image} alt={ev.name} className='w-10 h-10 rounded-lg object-cover shrink-0' onError={e => { e.target.style.display = 'none' }} />
                                                    ) : (
                                                        <div className='w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center shrink-0'>
                                                            <FaCalendarAlt className='text-blue-500 text-sm' />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className='font-semibold text-sm text-gray-800 dark:text-white line-clamp-1'>{ev.name}</p>
                                                        <p className='text-xs text-gray-500 line-clamp-1'>{ev.description}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            {/* Category + Type */}
                                            <td className='px-4 py-3 whitespace-nowrap'>
                                                <div>
                                                    <p className='text-sm font-medium text-gray-700 dark:text-gray-200'>{ev.category}</p>
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full mt-0.5 ${ev.eventType === 'Ngoài trời' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'}`}>
                                                        {ev.eventType === 'Ngoài trời' ? '🌿' : '🏠'} {ev.eventType}
                                                    </span>
                                                </div>
                                            </td>
                                            {/* Dates */}
                                            <td className='px-4 py-3 whitespace-nowrap'>
                                                <div className='flex flex-col gap-0.5 text-xs text-gray-600 dark:text-gray-300'>
                                                    <span>🟢 {formatDate(ev.startDate)}</span>
                                                    <span>🔴 {formatDate(ev.endDate)}</span>
                                                </div>
                                            </td>
                                            {/* Location */}
                                            <td className='px-4 py-3 min-w-[140px]'>
                                                <div className='flex items-start gap-1'>
                                                    <FaMapMarkerAlt className='text-gray-400 mt-0.5 shrink-0 text-xs' />
                                                    <span className='text-sm text-gray-600 dark:text-gray-300 line-clamp-2'>{ev.location}</span>
                                                </div>
                                            </td>
                                            {/* Participants */}
                                            <td className='px-4 py-3 whitespace-nowrap'>
                                                <div className='flex items-center gap-1'>
                                                    <FaUsers className='text-gray-400 text-xs' />
                                                    <span className='text-sm font-semibold text-gray-700 dark:text-gray-200'>{ev.participants}</span>
                                                    <span className='text-gray-400 text-xs'>/ {ev.maxParticipants}</span>
                                                </div>
                                                <div className='mt-1 w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5'>
                                                    <div
                                                        className='bg-blue-500 h-1.5 rounded-full'
                                                        style={{ width: `${Math.min((ev.participants / ev.maxParticipants) * 100, 100)}%` }}
                                                    />
                                                </div>
                                            </td>
                                            {/* Progress */}
                                            <td className='px-4 py-3 whitespace-nowrap'>
                                                {(() => {
                                                    const now = new Date()
                                                    const start = new Date(ev.startDate)
                                                    const end = new Date(ev.endDate)
                                                    const isEvEnded = now > end
                                                    const isEvUpcoming = now < start

                                                    // Tiến độ thực tế từ participants (từ backend aggregate)
                                                    const pct = ev.progressPercent ?? 0
                                                    const total = ev.progressTotal ?? 0
                                                    const target = ev.targetValue || 0
                                                    const unit = ev.targetUnit || ''
                                                    const barColor = pct >= 100 ? 'bg-emerald-500' : pct > 50 ? 'bg-blue-500' : 'bg-amber-500'

                                                    const statusLabel = isEvEnded ? 'Đã kết thúc' : isEvUpcoming ? 'Sắp diễn ra' : 'Đang diễn ra'
                                                    const statusColor = isEvEnded ? 'text-gray-400' : isEvUpcoming ? 'text-amber-500' : 'text-emerald-600'

                                                    return (
                                                        <div className='min-w-[110px]'>
                                                            <div className='flex items-center justify-between text-xs mb-1'>
                                                                <span className='font-semibold text-gray-700 dark:text-gray-200'>
                                                                    {target > 0 ? (
                                                                        <>{Number(total).toFixed(total % 1 === 0 ? 0 : 1)}<span className='text-gray-400 font-normal ml-0.5'>{unit}</span></>
                                                                    ) : '—'}
                                                                </span>
                                                                <span className={`text-[10px] font-semibold ${statusColor}`}>
                                                                    {statusLabel}
                                                                </span>
                                                            </div>
                                                            {target > 0 && (
                                                                <>
                                                                    <div className='w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5'>
                                                                        <div className={`${barColor} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                                                                    </div>
                                                                    <p className='text-[10px] text-gray-400 mt-0.5'>{pct}% / {target} {unit}</p>
                                                                </>
                                                            )}
                                                        </div>
                                                    )
                                                })()}
                                            </td>
                                            {/* Status */}
                                            <td className='px-4 py-3 whitespace-nowrap'>
                                                {ev.isDeleted ? (
                                                    <span className='px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'>Đã xóa</span>
                                                ) : (
                                                    <span className='px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'>Hoạt động</span>
                                                )}
                                            </td>
                                            {/* Actions */}
                                            <td className='px-4 py-3 whitespace-nowrap'>
                                                <div className='flex items-center gap-2'>
                                                    {!ev.isDeleted && (
                                                        <button
                                                            onClick={() => setModalEvent(ev)}
                                                            title='Chỉnh sửa'
                                                            className='p-1.5 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors'
                                                        >
                                                            <FaEdit size={14} />
                                                        </button>
                                                    )}
                                                    {ev.isDeleted ? (
                                                        <button
                                                            onClick={() => setConfirmAction({ type: 'restore', event: ev })}
                                                            title='Khôi phục'
                                                            className='p-1.5 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors flex items-center gap-1.5'
                                                        >
                                                            <FaUndo size={14} />
                                                            <span className='text-xs font-semibold'>Khôi phục</span>
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => setConfirmAction({ type: 'delete', event: ev })}
                                                            title='Xóa'
                                                            className='p-1.5 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors'
                                                        >
                                                            <FaTrash size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

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
                                    if (i > 0 && p - arr[i - 1] > 1) acc.push('ellipsis-' + p)
                                    acc.push(p)
                                    return acc
                                }, [])
                                .map(p =>
                                    typeof p === 'number' ? (
                                        <button
                                            key={p}
                                            onClick={() => setPage(p)}
                                            className={`w-8 h-8 text-sm rounded-lg font-medium transition-colors ${p === page ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
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
                                onClick={() => setPage(p => Math.min(totalPage, p + 1))}
                                className='px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
                            >
                                Sau →
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Create/Edit Modal */}
            {modalEvent !== undefined && (
                <EventFormModal
                    event={modalEvent}
                    categories={categories}
                    onClose={() => setModalEvent(undefined)}
                    onSuccess={handleFormSuccess}
                />
            )}

            {/* Confirm Dialog */}
            {confirmAction && (
                <ConfirmBox
                    title={confirmAction.type === 'delete' ? 'Xóa sự kiện?' : 'Khôi phục sự kiện?'}
                    subtitle={
                        confirmAction.type === 'delete'
                            ? `Bạn có chắc muốn xóa sự kiện "${confirmAction.event.name}"? Người dùng sẽ không thể xem sự kiện này nữa.`
                            : `Bạn có chắc muốn khôi phục sự kiện "${confirmAction.event.name}"?`
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
