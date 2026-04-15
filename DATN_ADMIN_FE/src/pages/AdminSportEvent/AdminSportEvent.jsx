import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
    FaCalendarAlt, FaTrash, FaUndo, FaSearch,
    FaFilter, FaUsers, FaMapMarkerAlt, FaRunning, FaHome,
    FaTimes, FaChevronDown, FaSortAmountDown, FaEye, FaBullseye, FaClock, FaCheck
} from 'react-icons/fa'
import toast from 'react-hot-toast'
import adminSportEventApi from '../../apis/sportEventApi'
import sportCategoryApi from '../../apis/sportCategoryApi'
import Loading from '../../components/GlobalComponents/Loading'
import ConfirmBox from '../../components/GlobalComponents/ConfirmBox'
import { useSafeMutation } from '../../hooks/useSafeMutation'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const formatDateTime = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const fmtNum = (n) => {
    if (n == null || Number.isNaN(n)) return '—'
    const x = Number(n)
    return x % 1 === 0 ? String(x) : x.toFixed(1)
}

const EVENT_TYPE_CONFIG = {
    'Ngoài trời': { label: 'Ngoài trời', icon: FaRunning, badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
    'Trong nhà': { label: 'Trong nhà', icon: FaHome, badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' }
}

// ─── Chi tiết / Thành viên (theo mẫu Admin Thử thách) ─────────────────────────
function EventDetailModal({ event, onClose }) {
    const [activeTab, setActiveTab] = useState('overview')
    const typeCfg = EVENT_TYPE_CONFIG[event?.eventType] || EVENT_TYPE_CONFIG['Ngoài trời']
    const TypeIcon = typeCfg.icon || FaRunning
    const participantsListFallback = Array.isArray(event?.participants_ids) ? event.participants_ids : []
    const memberCountFallback = typeof event?.participants === 'number' ? event.participants : participantsListFallback.length
    const creator = event?.createdBy

    const { data: participantsRes, isLoading: participantsLoading } = useQuery({
        queryKey: ['admin-sport-event-participants', event?._id],
        queryFn: () => adminSportEventApi.getParticipants(event._id, { page: 1, limit: 200 }),
        enabled: !!event?._id && activeTab === 'participants',
        staleTime: 5000
    })
    const participantsRows = participantsRes?.data?.result?.participants || []
    const totalFromApi = participantsRes?.data?.result?.total
    const memberCount =
        activeTab === 'participants' && typeof totalFromApi === 'number'
            ? totalFromApi
            : memberCountFallback

    const maxP = Math.max(event?.maxParticipants || 1, 1)
    const perPersonTarget = (event?.targetValue || 0) > 0 ? (event.targetValue / maxP) : 0
    const targetUnit = event?.targetUnit || ''

    const renderOverview = () => (
        <div className='p-6 space-y-6'>
            <div className='flex gap-4 items-start'>
                {event.image ? (
                    <img src={event.image} alt={event.name} className='w-20 h-20 rounded-xl object-cover shrink-0' />
                ) : (
                    <div className='w-20 h-20 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center text-white text-3xl shrink-0 shadow-lg'>
                        <FaCalendarAlt />
                    </div>
                )}
                <div>
                    <h4 className='text-lg font-bold text-gray-800 dark:text-white'>{event.name}</h4>
                    <p className='text-sm text-gray-500 dark:text-gray-400 mt-1 whitespace-pre-line'>
                        {event.description || 'Chưa có mô tả'}
                    </p>
                </div>
            </div>

            <div className='grid grid-cols-2 gap-4'>
                <div className='bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl'>
                    <p className='text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1'>Danh mục & Loại</p>
                    <p className='text-sm font-semibold text-gray-700 dark:text-gray-200'>{event.category}</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full mt-1 ${typeCfg.badge}`}>
                        <TypeIcon size={9} /> {typeCfg.label}
                    </span>
                </div>
                <div className='bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl'>
                    <p className='text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1'>Thời gian</p>
                    <p className='text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-1.5'>
                        <FaClock className='text-teal-500' />
                        {formatDate(event.startDate)} — {formatDate(event.endDate)}
                    </p>
                </div>
                <div className='bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl col-span-2'>
                    <p className='text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1'>Địa điểm</p>
                    <p className='text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-start gap-1.5'>
                        <FaMapMarkerAlt className='text-gray-400 shrink-0 mt-0.5' />
                        <span>{event.location || '—'}</span>
                    </p>
                </div>
                {(event.targetValue > 0 || event.targetUnit) && (
                    <div className='bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl'>
                        <p className='text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1'>Mục tiêu tập thể</p>
                        <p className='text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-1.5'>
                            <FaBullseye className='text-emerald-500' />
                            {event.targetValue ?? '—'} {event.targetUnit || ''}
                        </p>
                    </div>
                )}
                <div className='bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl'>
                    <p className='text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1'>Tham gia</p>
                    <p className='text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-1.5'>
                        <FaUsers className='text-indigo-500' />
                        {memberCountFallback} / {event.maxParticipants ?? '—'}
                    </p>
                </div>
                {creator && (
                    <div className='bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl col-span-2'>
                        <p className='text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1'>Người tạo</p>
                        <div className='flex items-center gap-2'>
                            {creator.avatar ? (
                                <img src={creator.avatar} className='w-8 h-8 rounded-full object-cover ring-1 ring-gray-200' alt='' />
                            ) : (
                                <div className='w-8 h-8 rounded-full bg-teal-200 dark:bg-teal-800 flex items-center justify-center text-xs font-bold text-teal-700 dark:text-teal-300'>
                                    {(creator.name || creator.username || '?')[0]?.toUpperCase()}
                                </div>
                            )}
                            <span className='text-sm font-medium text-gray-700 dark:text-gray-200'>{creator.name || creator.username || '—'}</span>
                        </div>
                    </div>
                )}
                {event.eventType === 'Ngoài trời' && (
                    <div className='bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl col-span-2'>
                        <p className='text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1'>Strava</p>
                        <p className='text-sm text-gray-700 dark:text-gray-300'>
                            {event.requireStrava ? 'Bắt buộc đồng bộ Strava' : 'Không bắt buộc Strava'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )

    const renderParticipants = () => (
        <div className='h-full'>
            {participantsLoading ? (
                <div className='space-y-3 p-6'>{[...Array(5)].map((_, i) => <div key={i} className='h-14 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse' />)}</div>
            ) : participantsRows.length === 0 ? (
                <div className='py-14 text-center text-gray-400'>
                    <FaUsers size={32} className='mx-auto mb-3 opacity-30' />
                    <p className='text-sm'>Chưa có thành viên đăng ký</p>
                </div>
            ) : (
                <table className='w-full divide-y divide-gray-100 dark:divide-gray-700 relative'>
                    <thead className='bg-gray-50 dark:bg-gray-900 sticky top-0 z-10'>
                        <tr>
                            {['Hạng', 'Người dùng', 'Giá trị / Mục tiêu (người)', 'Tiến độ', 'Trạng thái', 'Cập nhật'].map(h => (
                                <th key={h} className='px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap'>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-100 dark:divide-gray-700'>
                        {participantsRows.map((p) => {
                            const pct = p.progressPercentage ?? 0
                            const done = pct >= 100
                            return (
                                <tr key={String(p.userId)} className='hover:bg-teal-50/20 dark:hover:bg-teal-900/5 transition-colors'>
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
                                            {p.avatar ? (
                                                <img src={p.avatar} className='w-7 h-7 rounded-full object-cover ring-1 ring-gray-200' alt='' />
                                            ) : (
                                                <div className='w-7 h-7 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center text-xs font-bold text-teal-600 dark:text-teal-300'>
                                                    {(p.name || '?')[0]?.toUpperCase()}
                                                </div>
                                            )}
                                            <span className='text-sm font-medium text-gray-700 dark:text-gray-200'>{p.name || '—'}</span>
                                        </div>
                                    </td>
                                    <td className='px-4 py-3 text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap'>
                                        {perPersonTarget > 0 ? (
                                            <span>{fmtNum(p.totalProgress)} / {fmtNum(perPersonTarget)} {targetUnit}</span>
                                        ) : (
                                            <span>{fmtNum(p.totalProgress)} {targetUnit}</span>
                                        )}
                                    </td>
                                    <td className='px-4 py-3'>
                                        <div className='flex items-center gap-2'>
                                            <div className='w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5'>
                                                <div
                                                    className='bg-gradient-to-r from-teal-400 to-emerald-500 h-1.5 rounded-full'
                                                    style={{ width: `${Math.min(pct, 100)}%` }}
                                                />
                                            </div>
                                            <span className='text-xs text-gray-500 whitespace-nowrap'>{pct}%</span>
                                        </div>
                                    </td>
                                    <td className='px-4 py-3'>
                                        {done ? (
                                            <span className='inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium'>
                                                <FaCheck size={8} /> Đạt mục tiêu cá nhân
                                            </span>
                                        ) : (
                                            <span className='inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium'>
                                                <FaClock size={8} /> Đang tham gia
                                            </span>
                                        )}
                                    </td>
                                    <td className='px-4 py-3 text-xs text-gray-400 whitespace-nowrap'>{formatDateTime(p.lastUpdate)}</td>
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
                <div className='bg-gradient-to-r from-teal-500 to-emerald-600 px-6 pt-4 rounded-t-2xl flex flex-col shrink-0'>
                    <div className='flex items-center justify-between'>
                        <h3 className='font-bold text-white flex items-center gap-2 text-base'>
                            <FaEye size={15} /> Phân tích Sự kiện
                        </h3>
                        <button type='button' onClick={onClose} className='p-1.5 bg-black/10 hover:bg-black/20 rounded-lg transition-colors flex items-center justify-center'>
                            <FaTimes className='text-white' size={14} />
                        </button>
                    </div>
                    <div className='flex gap-6 mt-4'>
                        <button
                            type='button'
                            onClick={() => setActiveTab('overview')}
                            className={`pb-3 font-semibold text-sm transition-all border-b-2 ${activeTab === 'overview' ? 'border-white text-white' : 'border-transparent text-white/70 hover:text-white'}`}
                        >
                            Tổng quan
                        </button>
                        <button
                            type='button'
                            onClick={() => setActiveTab('participants')}
                            className={`pb-3 font-semibold text-sm transition-all border-b-2 flex items-center gap-1.5 ${activeTab === 'participants' ? 'border-white text-white' : 'border-transparent text-white/70 hover:text-white'}`}
                        >
                            <FaUsers size={14} /> Thành viên ({memberCount})
                        </button>
                    </div>
                </div>

                <div className='overflow-y-auto flex-1 bg-white dark:bg-gray-800 rounded-b-2xl' style={{ maxHeight: 'calc(85vh - 100px)' }}>
                    {activeTab === 'overview' ? renderOverview() : renderParticipants()}
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
    const [confirmAction, setConfirmAction] = useState(null) // { type, event }
    const [detailEvent, setDetailEvent] = useState(null)
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
        queryFn: () => adminSportEventApi.getStats(),
        staleTime: 10000
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

    // Sport categories for the form dropdown — only active (non-deleted)
    const { data: catData } = useQuery({
        queryKey: ['adminSportCategories'],
        queryFn: () => sportCategoryApi.getAll(),
        staleTime: 60000
    })
    const categories = (catData?.data?.result || []).filter(c => !c.isDeleted)

    const invalidate = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['adminSportEvents'] })
        queryClient.invalidateQueries({ queryKey: ['adminSportEventStats'] })
    }, [queryClient])

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
        setFilterEventType('all'); setFilterStatus('active')
        setFilterDateFrom(''); setFilterDateTo('')
        setSortBy('newest'); setPage(1)
    }

    const handleConfirm = () => {
        if (!confirmAction) return
        if (confirmAction.type === 'delete') softDeleteMutation.mutate(confirmAction.event._id)
        else if (confirmAction.type === 'restore') restoreMutation.mutate(confirmAction.event._id)
        setConfirmAction(null)
    }

    const getActiveTabKey = () => {
        if (filterStatus === 'deleted') return 'deleted'
        if (filterStatus === 'active' && filterEventType === 'Ngoài trời') return 'outdoor'
        if (filterStatus === 'active' && filterEventType === 'Trong nhà') return 'indoor'
        if (filterStatus === 'all' && filterEventType === 'all') return 'all'
        if (filterStatus === 'active' && filterEventType === 'all') return 'active'
        return null
    }
    const activeTabKey = getActiveTabKey()

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900 pt-0 pb-4 px-4'>

            {/* ── Hero Banner ── */}
            <div className='relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-500 via-green-500 to-emerald-600 px-6 py-4 mb-2 shadow-xl'>
                <div className='relative z-10 flex items-center justify-between'>
                    <h1 className='text-2xl font-bold text-white'>Quản lý Sự kiện Thể thao</h1>
                </div>

                {/* Filter stat tabs */}
                <div className='relative z-10 flex gap-2 mt-3 flex-wrap'>
                    {[
                        {
                            key: 'all', label: 'Tất cả', icon: FaCalendarAlt,
                            count: stats.total,
                            onClick: () => { setFilterStatus('all'); setFilterEventType('all'); setPage(1) }
                        },
                        {
                            key: 'active', label: 'Đang hoạt động', icon: FaCalendarAlt,
                            count: stats.active,
                            onClick: () => { setFilterStatus('active'); setFilterEventType('all'); setPage(1) }
                        },
                        {
                            key: 'outdoor', label: 'Ngoài trời', icon: FaRunning,
                            count: stats.outdoor,
                            onClick: () => { setFilterStatus('active'); setFilterEventType('Ngoài trời'); setPage(1) }
                        },
                        {
                            key: 'indoor', label: 'Trong nhà', icon: FaHome,
                            count: stats.indoor,
                            onClick: () => { setFilterStatus('active'); setFilterEventType('Trong nhà'); setPage(1) }
                        },
                        {
                            key: 'deleted', label: 'Đã xóa', icon: FaTrash,
                            count: stats.deleted,
                            onClick: () => { setFilterStatus('deleted'); setFilterEventType('all'); setPage(1) }
                        },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            type='button'
                            onClick={tab.onClick}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-semibold transition-all backdrop-blur-sm ${activeTabKey === tab.key ? 'bg-white text-emerald-700 shadow-md' : 'bg-white/20 text-white hover:bg-white/30'
                                }`}
                        >
                            <tab.icon size={13} />
                            {tab.label}
                            <span className='font-black'>({tab.count ?? 0})</span>
                        </button>
                    ))}
                </div>

                <div className='absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10' />
                <div className='absolute right-20 -bottom-8 w-32 h-32 rounded-full bg-white/10' />
            </div>

            {/* ── Event Analytics — compact strip above search ── */}
            {events.length > 0 && (() => {
                const now = new Date()
                const outdoorCount = events.filter(e => e.eventType === 'Ngoài trời' && !e.isDeleted).length
                const indoorCount = events.filter(e => e.eventType === 'Trong nhà' && !e.isDeleted).length
                const activeEvents = events.filter(e => !e.isDeleted)
                const avgParticipants = activeEvents.length > 0
                    ? Math.round(activeEvents.reduce((s, e) => s + (e.participants || 0), 0) / activeEvents.length)
                    : 0
                const ongoingCount = activeEvents.filter(e => new Date(e.startDate) <= now && new Date(e.endDate) > now).length

                const monthData = []
                for (let i = 5; i >= 0; i--) {
                    const d = new Date()
                    d.setMonth(d.getMonth() - i)
                    const m = d.getMonth(); const y = d.getFullYear()
                    const count = activeEvents.filter(e => {
                        const cd = new Date(e.createdAt)
                        return cd.getMonth() === m && cd.getFullYear() === y
                    }).length
                    monthData.push({ label: `T${m + 1}`, count })
                }
                const maxCount = Math.max(...monthData.map(m => m.count), 1)

                return (
                    <div className='bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm mb-2 overflow-hidden'>
                        <div className='flex flex-wrap items-center gap-3 px-4 py-3'>
                            {/* Label */}
                            <span className='flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide shrink-0 border-r border-gray-200 dark:border-gray-600 pr-3'>
                                📊 Thống kê
                            </span>

                            {/* 4 stat pills */}
                            {[
                                { label: 'Tổng SK', value: activeEvents.length, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                                { label: 'Đang diễn ra', value: ongoingCount, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                                { label: 'TB thành viên', value: avgParticipants, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                                { label: 'Ngoài trời / Trong nhà', value: `${outdoorCount}/${indoorCount}`, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
                            ].map(s => (
                                <div key={s.label} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${s.bg}`}>
                                    <span className={`text-base font-black leading-none ${s.color}`}>{s.value}</span>
                                    <span className='text-[10px] text-gray-400 dark:text-gray-500 font-semibold uppercase leading-tight'>{s.label}</span>
                                </div>
                            ))}

                            {/* Mini bar chart */}
                            <div className='flex items-end gap-1 ml-auto' style={{ height: 36 }}>
                                <span className='text-[9px] text-gray-400 mr-1 self-center uppercase font-semibold tracking-wide'>6 tháng</span>
                                {monthData.map((m, i) => (
                                    <div key={i} className='flex flex-col items-center gap-0.5' style={{ width: 20 }}>
                                        <span className='text-[8px] font-bold text-gray-400 leading-none'>{m.count || ''}</span>
                                        <div
                                            className='w-full rounded-t bg-gradient-to-t from-indigo-600 to-blue-400'
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
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border transition-all shrink-0 ${showAdvanced || activeFilterCount > 0
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
                        <div className='grid grid-cols-2 lg:grid-cols-5 gap-3 pt-3'>
                            <div>
                                <label className='block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5'>Trạng thái</label>
                                <select
                                    value={filterStatus}
                                    onChange={e => { setFilterStatus(e.target.value); setPage(1) }}
                                    className='w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all'
                                >
                                    <option value='all'>Tất cả</option>
                                    <option value='active'>Đang hoạt động</option>
                                    <option value='deleted'>Đã xóa</option>
                                </select>
                            </div>
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
                                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${sortBy === s.value
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
                        <div className='overflow-x-auto'>
                            <table className='w-full divide-y divide-gray-200 dark:divide-slate-700'>
                                <thead className='bg-gray-50 dark:bg-gray-900'>
                                    <tr>
                                        {['STT', 'Sự kiện', 'Danh mục / Loại', 'Thời gian', 'Địa điểm', 'Người tham gia', 'Tiến độ', 'Người tạo', 'Trạng thái', 'Hành động'].map(h => (
                                            <th key={h} className='px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap'>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-gray-100 dark:divide-slate-700'>
                                    {events.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className='text-center py-14'>
                                                <FaCalendarAlt className='mx-auto text-4xl text-gray-300 mb-3' />
                                                <p className='text-gray-400 text-sm'>Không có sự kiện nào</p>
                                            </td>
                                        </tr>
                                    ) : events.map((ev, idx) => {
                                        const typeCfg = EVENT_TYPE_CONFIG[ev.eventType] || EVENT_TYPE_CONFIG['Ngoài trời']
                                        const TypeIcon = typeCfg.icon || FaRunning
                                        const creator = ev.createdBy
                                        return (
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
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full mt-0.5 ${typeCfg.badge}`}>
                                                        <TypeIcon size={9} /> {typeCfg.label}
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
                                            {/* Creator */}
                                            <td className='px-4 py-3 whitespace-nowrap'>
                                                <div className='flex items-center gap-1.5'>
                                                    {creator?.avatar ? (
                                                        <img src={creator.avatar} className='w-6 h-6 rounded-full object-cover ring-1 ring-gray-200' alt='' />
                                                    ) : (
                                                        <div className='w-6 h-6 rounded-full bg-teal-200 dark:bg-teal-800 flex items-center justify-center text-xs font-bold text-teal-700 dark:text-teal-300'>
                                                            {(creator?.name || creator?.username || '?')[0]?.toUpperCase()}
                                                        </div>
                                                    )}
                                                    <span className='text-xs text-gray-500 dark:text-gray-400 max-w-[88px] truncate'>{creator?.name || creator?.username || '—'}</span>
                                                </div>
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
                                                <div className='flex items-center gap-1.5'>
                                                    {!ev.isDeleted && (
                                                        <button
                                                            type='button'
                                                            onClick={() => setDetailEvent(ev)}
                                                            title='Xem chi tiết'
                                                            className='p-1.5 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors'
                                                        >
                                                            <FaEye size={14} />
                                                        </button>
                                                    )}
                                                    {ev.isDeleted ? (
                                                        <button
                                                            type='button'
                                                            onClick={() => setConfirmAction({ type: 'restore', event: ev })}
                                                            title='Khôi phục'
                                                            className='p-1.5 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors flex items-center gap-1.5'
                                                        >
                                                            <FaUndo size={14} />
                                                            <span className='text-xs font-semibold'>Khôi phục</span>
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type='button'
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

            {detailEvent && (
                <EventDetailModal
                    event={detailEvent}
                    onClose={() => setDetailEvent(null)}
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
