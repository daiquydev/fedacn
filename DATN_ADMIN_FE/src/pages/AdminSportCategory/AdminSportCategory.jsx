import React, { useState, useRef, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
    FaPlus, FaEdit, FaTrash, FaDumbbell, FaRunning, FaHome, FaTimes, FaUndo,
    FaBiking, FaSwimmer, FaBasketballBall, FaVolleyballBall, FaTableTennis, FaMountain, FaSkating,
    FaChevronDown, FaWalking, FaHorse, FaFistRaised, FaBowlingBall, FaFootballBall, FaGolfBall,
    FaSkiing, FaSnowboarding, FaWater, FaBaseballBall, FaSearch
} from 'react-icons/fa'
import {
    MdSportsSoccer, MdSportsTennis, MdGolfCourse, MdSportsScore,
    MdSportsHandball, MdSportsGymnastics, MdSportsBaseball, MdSportsVolleyball,
    MdSportsHockey, MdSportsRugby, MdSportsCricket, MdSportsEsports,
    MdSurfing, MdKayaking, MdSkateboarding, MdDownhillSkiing,
    MdPool, MdFitnessCenter, MdDirectionsRun, MdDirectionsBike,
    MdDirectionsWalk, MdSelfImprovement, MdSailing, MdScubaDiving
} from 'react-icons/md'
import {
    GiMeditation, GiShuttlecock, GiHighKick, GiBoxingGlove,
    GiArcheryTarget, GiFencer, GiJumpingRope, GiWeightLiftingUp
} from 'react-icons/gi'
import toast from 'react-hot-toast'
import sportCategoryApi from '../../apis/sportCategoryApi'
import Loading from '../../components/GlobalComponents/Loading'
import { useForm, Controller } from 'react-hook-form'
import { useSafeMutation } from '../../hooks/useSafeMutation'
import ConfirmBox from '../../components/GlobalComponents/ConfirmBox'

// ── Bộ icon thể thao (đồng nhất với DATN_FE/src/utils/sportIcons.js) ──
const SPORT_ICONS = {
    running: { icon: FaRunning },
    walking: { icon: FaWalking },
    directions_run: { icon: MdDirectionsRun },
    cycling: { icon: FaBiking },
    directions_bike: { icon: MdDirectionsBike },
    swimming: { icon: FaSwimmer },
    surfing: { icon: MdSurfing },
    kayaking: { icon: MdKayaking },
    sailing: { icon: MdSailing },
    scuba_diving: { icon: MdScubaDiving },
    pool: { icon: MdPool },
    water: { icon: FaWater },
    fitness: { icon: FaDumbbell },
    fitness_center: { icon: MdFitnessCenter },
    weight_lifting: { icon: GiWeightLiftingUp },
    jump_rope: { icon: GiJumpingRope },
    yoga: { icon: GiMeditation },
    self_improve: { icon: MdSelfImprovement },
    pilates: { icon: MdDirectionsWalk },
    soccer: { icon: MdSportsSoccer },
    basketball: { icon: FaBasketballBall },
    volleyball: { icon: FaVolleyballBall },
    football: { icon: FaFootballBall },
    baseball: { icon: FaBaseballBall },
    rugby: { icon: MdSportsRugby },
    cricket: { icon: MdSportsCricket },
    handball: { icon: MdSportsHandball },
    bowling: { icon: FaBowlingBall },
    tennis: { icon: MdSportsTennis },
    tabletennis: { icon: FaTableTennis },
    badminton: { icon: GiShuttlecock },
    martial_arts: { icon: GiHighKick },
    boxing: { icon: GiBoxingGlove },
    fencing: { icon: GiFencer },
    fist: { icon: FaFistRaised },
    hiking: { icon: FaMountain },
    archery: { icon: GiArcheryTarget },
    horse: { icon: FaHorse },
    golf: { icon: MdGolfCourse },
    skating: { icon: FaSkating },
    skateboarding: { icon: MdSkateboarding },
    skiing: { icon: FaSkiing },
    downhill_ski: { icon: MdDownhillSkiing },
    snowboarding: { icon: FaSnowboarding },
    gymnastics: { icon: MdSportsGymnastics },
    hockey: { icon: MdSportsHockey },
    esports: { icon: MdSportsEsports },
    sport: { icon: MdSportsScore }
}

// Danh sách Strava activity types có sẵn để chọn (Tiếng Việt ưu tiên)
const STRAVA_TYPES = [
    { value: 'Run', label: 'Chạy bộ (Run)' },
    { value: 'Walk', label: 'Đi bộ (Walk)' },
    { value: 'TrailRun', label: 'Chạy trail (TrailRun)' },
    { value: 'VirtualRun', label: 'Chạy ảo (VirtualRun)' },
    { value: 'Ride', label: 'Đạp xe đường dài (Ride)' },
    { value: 'MountainBikeRide', label: 'Đạp xe địa hình (MountainBikeRide)' },
    { value: 'GravelRide', label: 'Đạp xe sỏi (GravelRide)' },
    { value: 'VirtualRide', label: 'Đạp xe ảo (VirtualRide)' },
    { value: 'EBikeRide', label: 'Đạp xe điện (EBikeRide)' },
    { value: 'Hike', label: 'Leo núi (Hike)' },
    { value: 'Swim', label: 'Bơi lội (Swim)' },
    { value: 'AlpineSki', label: 'Trượt tuyết (AlpineSki)' },
    { value: 'RockClimbing', label: 'Leo vách đá (RockClimbing)' },
]

/** Helper: lấy component icon từ key, fallback về MdSportsScore */
export function getSportIcon(key) {
    return SPORT_ICONS[key]?.icon || MdSportsScore
}


/** Compact Icon Picker — dropdown, chỉ hiện icon (không label), grid 8 cột */
function IconPickerDropdown({ value, onChange }) {
    const [open, setOpen] = useState(false)
    const SelectedIcon = getSportIcon(value)

    return (
        <div className='relative'>
            <label className='block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5 uppercase tracking-wide'>
                Icon <span className='text-red-500'>*</span>
            </label>
            <button
                type='button'
                onClick={() => setOpen(!open)}
                className={`flex items-center gap-2 w-full px-3 py-2.5 border rounded-xl text-sm transition-all outline-none
                    ${open
                        ? 'border-emerald-500 ring-2 ring-emerald-500 bg-white dark:bg-gray-700'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-emerald-400'
                    } dark:text-white`}
            >
                <span className='w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0'>
                    <SelectedIcon className='text-emerald-600 dark:text-emerald-400 text-sm' />
                </span>
                <FaChevronDown className={`text-gray-400 text-xs transition-transform ml-auto ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className='absolute z-50 mt-1 left-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl p-2 max-h-48 overflow-y-auto'
                    style={{ width: '320px' }}>
                    <div className='grid grid-cols-8 gap-1'>
                        {Object.entries(SPORT_ICONS).map(([key, { icon: IconComp }]) => {
                            const isActive = value === key
                            return (
                                <button
                                    key={key}
                                    type='button'
                                    onClick={() => { onChange(key); setOpen(false) }}
                                    title={key}
                                    className={`flex items-center justify-center p-2 rounded-lg transition-all
                                        ${isActive
                                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500'
                                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200'
                                        }`}
                                >
                                    <IconComp size={18} />
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}

export default function AdminSportCategory() {
    const queryClient = useQueryClient()
    const [modalOpen, setModalOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState(null)
    const [showDeleted, setShowDeleted] = useState(false)
    const [confirmAction, setConfirmAction] = useState(null) // { type: 'delete'|'restore', category }
    const [page, setPage] = useState(1)
    const [searchInput, setSearchInput] = useState('')
    const [search, setSearch] = useState('')
    const [filterType, setFilterType] = useState('') // '' = Tất cả, 'Ngoài trời', 'Trong nhà'
    const debounceRef = useRef(null)
    const LIMIT = 10
    const { register, handleSubmit, reset, watch, control, formState: { errors } } = useForm()
    const watchedType = watch('type', 'Ngoài trời')

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => { setSearch(searchInput); setPage(1) }, 300)
        return () => clearTimeout(debounceRef.current)
    }, [searchInput])

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['adminSportCategories'],
        queryFn: () => sportCategoryApi.getAll(),
        retry: 2
    })

    const categories = data?.data?.result || []
    const activeCategories = categories.filter(c => !c.isDeleted)
    const deletedCategories = categories.filter(c => c.isDeleted)
    const outdoorCount = activeCategories.filter(c => c.type === 'Ngoài trời').length
    const indoorCount = activeCategories.filter(c => c.type === 'Trong nhà').length

    const baseCategories = showDeleted ? deletedCategories : activeCategories
    const filteredByType = filterType
        ? baseCategories.filter(c => c.type === filterType)
        : baseCategories
    const displayCategories = search
        ? filteredByType.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
        : filteredByType
    const totalPage = Math.ceil(displayCategories.length / LIMIT) || 1
    const paginatedCategories = displayCategories.slice((page - 1) * LIMIT, page * LIMIT)

    const createMutation = useSafeMutation({
        mutationFn: (body) => sportCategoryApi.create(body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminSportCategories'] })
            toast.success('Thêm danh mục thành công!')
            closeModal()
        },
        onError: (err) => toast.error(err?.response?.data?.message || 'Có lỗi xảy ra khi thêm danh mục')
    })

    const updateMutation = useSafeMutation({
        mutationFn: ({ id, body }) => sportCategoryApi.update(id, body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminSportCategories'] })
            toast.success('Cập nhật danh mục thành công!')
            closeModal()
        },
        onError: (err) => toast.error(err?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật')
    })

    const deleteMutation = useSafeMutation({
        mutationFn: (id) => sportCategoryApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminSportCategories'] })
            toast.success('Đã xóa danh mục!')
        },
        onError: (err) => toast.error(err?.response?.data?.message || 'Có lỗi xảy ra khi xóa')
    })

    const restoreMutation = useSafeMutation({
        mutationFn: (id) => sportCategoryApi.restore(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminSportCategories'] })
            toast.success('Đã khôi phục danh mục!')
        },
        onError: (err) => toast.error(err?.response?.data?.message || 'Có lỗi xảy ra khi khôi phục')
    })

    const openModalConfig = (category = null) => {
        setEditingCategory(category)
        reset(category
            ? { name: category.name, type: category.type, kcal_per_unit: category.kcal_per_unit || '', icon: category.icon || 'sport', stravaTypes: category.stravaTypes || [] }
            : { name: '', type: 'Ngoài trời', kcal_per_unit: '', icon: 'sport', stravaTypes: [] }
        )
        setModalOpen(true)
    }

    const closeModal = () => {
        setEditingCategory(null)
        setModalOpen(false)
        reset()
    }

    const onSubmitForm = (formData) => {
        if (editingCategory) {
            updateMutation.mutate({ id: editingCategory._id, body: formData })
        } else {
            createMutation.mutate(formData)
        }
    }

    const handleDelete = (category) => {
        setConfirmAction({ type: 'delete', category })
    }

    const handleRestore = (category) => {
        setConfirmAction({ type: 'restore', category })
    }

    const handleConfirm = () => {
        if (!confirmAction) return
        if (confirmAction.type === 'delete') deleteMutation.mutate(confirmAction.category._id)
        else if (confirmAction.type === 'restore') restoreMutation.mutate(confirmAction.category._id)
        setConfirmAction(null)
    }

    if (isError) {
        return (
            <div className='min-h-screen bg-gray-50 dark:bg-gray-900 flex items-start justify-center pt-20 px-4'>
                <div className='text-center'>
                    <div className='text-red-500 text-5xl mb-4'>⚠️</div>
                    <h2 className='text-xl font-semibold text-gray-800 dark:text-white mb-2'>Lỗi khi tải danh mục</h2>
                    <p className='text-gray-500 dark:text-gray-400 text-sm'>{error?.response?.data?.message || 'Không thể kết nối đến máy chủ'}</p>
                    <button
                        onClick={() => queryClient.invalidateQueries({ queryKey: ['adminSportCategories'] })}
                        className='mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm'
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900 pt-0 pb-4 px-4'>

            {/* ── Hero Banner ── */}
            <div className='relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600 px-6 py-4 mb-2 shadow-xl'>
                <div className='relative z-10 flex items-center justify-between'>
                    <h1 className='text-2xl font-bold text-white'>Danh mục Thể thao</h1>
                    <button
                        onClick={() => openModalConfig()}
                        className='flex items-center gap-2 bg-white text-emerald-700 font-bold text-sm px-4 py-2 rounded-xl hover:bg-emerald-50 transition-all shadow-lg shrink-0'
                    >
                        <FaPlus size={12} /> Thêm danh mục
                    </button>
                </div>

                {/* Filter stat tabs */}
                <div className='relative z-10 flex gap-2 mt-3 flex-wrap'>
                    {[
                        {
                            key: 'active', label: 'Đang hoạt động', icon: FaDumbbell,
                            count: activeCategories.length,
                            active: !showDeleted && filterType === '',
                            onClick: () => { setShowDeleted(false); setFilterType(''); setPage(1) }
                        },
                        {
                            key: 'outdoor', label: 'Ngoài trời', icon: FaRunning,
                            count: outdoorCount,
                            active: !showDeleted && filterType === 'Ngoài trời',
                            onClick: () => { setShowDeleted(false); setFilterType('Ngoài trời'); setPage(1) }
                        },
                        {
                            key: 'indoor', label: 'Trong nhà', icon: FaHome,
                            count: indoorCount,
                            active: !showDeleted && filterType === 'Trong nhà',
                            onClick: () => { setShowDeleted(false); setFilterType('Trong nhà'); setPage(1) }
                        },
                        {
                            key: 'deleted', label: 'Đã xóa', icon: FaTrash,
                            count: deletedCategories.length,
                            active: showDeleted,
                            onClick: () => { setShowDeleted(true); setFilterType(''); setPage(1) }
                        },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={tab.onClick}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-semibold transition-all backdrop-blur-sm ${
                                tab.active ? 'bg-white text-emerald-700 shadow-md' : 'bg-white/20 text-white hover:bg-white/30'
                            }`}
                        >
                            <tab.icon size={13} />
                            {tab.label}
                            <span className='font-black'>({tab.count})</span>
                        </button>
                    ))}
                </div>

                <div className='absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10' />
                <div className='absolute right-20 -bottom-8 w-32 h-32 rounded-full bg-white/10' />
            </div>

            {/* ── Search Box + Filter ── */}
            <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm p-3 mb-2 border border-gray-100 dark:border-gray-700 flex items-center gap-3'>
                <div className='relative flex-1'>
                    <FaSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs' />
                    <input
                        value={searchInput}
                        onChange={e => setSearchInput(e.target.value)}
                        placeholder='Tìm kiếm theo tên danh mục...'
                        className='pl-9 pr-4 py-2 text-sm w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 outline-none transition-all'
                    />
                </div>

                {/* Type filter dropdown */}
                <select
                    value={filterType}
                    onChange={e => { setFilterType(e.target.value); setPage(1) }}
                    className={`px-3 py-2 text-sm font-semibold rounded-lg border transition-all outline-none cursor-pointer shrink-0 ${
                        filterType
                            ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-300'
                    }`}
                >
                    <option value=''>📋 Tất cả</option>
                    <option value='Ngoài trời'>🌿 Ngoài trời</option>
                    <option value='Trong nhà'>🏠 Trong nhà</option>
                </select>
            </div>

            {/* ── Table ── */}
            {isLoading ? (
                <Loading />
            ) : (
                <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700'>
                    <div className='overflow-x-auto'>
                        <table className='w-full divide-y divide-gray-100 dark:divide-gray-700'>
                            <thead className='bg-gray-50 dark:bg-gray-900'>
                                <tr>
                                    {['STT', 'Tên danh mục', 'Loại hình', 'kcal/đơn vị', 'Trạng thái', 'Hành động'].map(h => (
                                        <th key={h} className='px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-gray-50 dark:divide-gray-700'>
                                {paginatedCategories.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className='text-center py-16'>
                                            <FaDumbbell className='mx-auto text-4xl text-gray-300 mb-3' />
                                            <p className='text-gray-400 text-sm'>
                                                {showDeleted ? 'Không có danh mục nào đã xóa' : 'Chưa có danh mục nào'}
                                            </p>
                                            {!showDeleted && (
                                                <button
                                                    onClick={() => openModalConfig()}
                                                    className='mt-2 text-sm text-emerald-600 hover:underline'
                                                >
                                                    + Thêm danh mục đầu tiên
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedCategories.map((category, idx) => {
                                        const CategoryIcon = getSportIcon(category.icon)
                                        return (
                                            <tr key={category._id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${category.isDeleted ? 'opacity-60' : ''}`}>
                                                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400'>
                                                    {(page - 1) * LIMIT + idx + 1}
                                                </td>
                                                {/* Icon bên cạnh tên */}
                                                <td className='px-6 py-4 whitespace-nowrap'>
                                                    <div className='flex items-center gap-3'>
                                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${category.isDeleted ? 'bg-gray-100 dark:bg-gray-700' : 'bg-emerald-50 dark:bg-emerald-900/30'}`}>
                                                            <CategoryIcon className={`text-lg ${category.isDeleted ? 'text-gray-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
                                                        </div>
                                                        <span className={`text-sm font-semibold ${category.isDeleted ? 'line-through text-gray-400' : 'text-gray-800 dark:text-white'}`}>
                                                            {category.name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className='px-6 py-4 whitespace-nowrap'>
                                                    {category.type === 'Ngoài trời' ? (
                                                        <span className='px-2.5 py-1 inline-flex items-center gap-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'>
                                                            🌿 Ngoài trời
                                                        </span>
                                                    ) : (
                                                        <span className='px-2.5 py-1 inline-flex items-center gap-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'>
                                                            🏠 Trong nhà
                                                        </span>
                                                    )}
                                                </td>
                                                <td className='px-6 py-4 whitespace-nowrap'>
                                                    <span className='text-sm font-semibold text-gray-800 dark:text-white'>
                                                        {category.kcal_per_unit || '—'}
                                                    </span>
                                                    {category.kcal_per_unit > 0 && (
                                                        <span className='text-xs text-gray-400 ml-1'>
                                                            {category.type === 'Ngoài trời' ? 'kcal/km' : 'kcal/phút'}
                                                        </span>
                                                    )}
                                                    {/* Strava Types badges */}
                                                    {category.type === 'Ngoài trời' && category.stravaTypes?.length > 0 && (
                                                        <div className='flex flex-wrap gap-1 mt-1.5'>
                                                            {category.stravaTypes.map(st => {
                                                                const item = STRAVA_TYPES.find(s => s.value === st)
                                                                return (
                                                                    <span key={st} className='px-1.5 py-0.5 text-[10px] font-semibold rounded bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'>
                                                                        {item?.label || st}
                                                                    </span>
                                                                )
                                                            })}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className='px-6 py-4 whitespace-nowrap'>
                                                    {category.isDeleted ? (
                                                        <span className='px-2.5 py-1 inline-flex items-center gap-1 text-xs font-semibold rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'>
                                                            🗑️ Đã xóa
                                                        </span>
                                                    ) : (
                                                        <span className='px-2.5 py-1 inline-flex items-center gap-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'>
                                                            ✅ Hoạt động
                                                        </span>
                                                    )}
                                                </td>
                                                <td className='px-6 py-4 whitespace-nowrap'>
                                                    <div className='flex items-center gap-2'>
                                                        {category.isDeleted ? (
                                                            <button
                                                                onClick={() => handleRestore(category)}
                                                                disabled={restoreMutation.isPending}
                                                                title='Khôi phục danh mục'
                                                                className='p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/30 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5'
                                                            >
                                                                <FaUndo size={14} />
                                                                <span className='text-xs font-semibold'>Khôi phục</span>
                                                            </button>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={() => openModalConfig(category)}
                                                                    title='Chỉnh sửa'
                                                                    className='p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30 rounded-lg transition-colors'
                                                                >
                                                                    <FaEdit size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(category)}
                                                                    disabled={deleteMutation.isPending}
                                                                    title='Xóa (có thể khôi phục)'
                                                                    className='p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50'
                                                                >
                                                                    <FaTrash size={14} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Pagination ── */}
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

            {/* ── Modal Form ── */}
            {modalOpen && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4' onClick={(e) => e.target === e.currentTarget && closeModal()}>
                    <div className='bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md'>
                        <div className='flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-200 dark:border-gray-700'>
                            <div className='flex items-center gap-3'>
                                <div className='p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg'>
                                    <FaDumbbell className='text-emerald-600 dark:text-emerald-400' />
                                </div>
                                <h3 className='text-base font-bold text-gray-800 dark:text-white'>
                                    {editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
                                </h3>
                            </div>
                            <button onClick={closeModal} className='p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors'>
                                <FaTimes className='text-gray-400' />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmitForm)} className='px-6 py-5 space-y-4'>

                            {/* Icon picker + Tên — cùng 1 hàng */}
                            <div className='flex gap-3 items-start'>
                                {/* Icon Picker Dropdown */}
                                <div className='w-[100px] shrink-0'>
                                    <Controller
                                        name='icon'
                                        control={control}
                                        defaultValue='sport'
                                        rules={{ required: 'Chọn icon' }}
                                        render={({ field }) => (
                                            <IconPickerDropdown value={field.value} onChange={field.onChange} />
                                        )}
                                    />
                                    {errors.icon && <p className='text-red-500 text-xs mt-1'>{errors.icon.message}</p>}
                                </div>

                                {/* Tên môn thể thao */}
                                <div className='flex-1'>
                                    <label className='block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5 uppercase tracking-wide'>
                                        Tên môn thể thao <span className='text-red-500'>*</span>
                                    </label>
                                    <input
                                        type='text'
                                        placeholder='Nhập tên danh mục (ví dụ: Chạy bộ)'
                                        className='w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all'
                                        {...register('name', { required: 'Tên danh mục không được để trống' })}
                                    />
                                    {errors.name && <p className='text-red-500 text-xs mt-1'>{errors.name.message}</p>}
                                </div>
                            </div>

                            <div>
                                <label className='block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5 uppercase tracking-wide'>
                                    Loại hình <span className='text-red-500'>*</span>
                                </label>
                                <select
                                    className='mt-1 w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all'
                                    {...register('type', { required: 'Vui lòng chọn loại hình' })}
                                >
                                    <option value='Ngoài trời'>🌿 Ngoài trời</option>
                                    <option value='Trong nhà'>🏠 Trong nhà</option>
                                </select>
                                {errors.type && <p className='text-red-500 text-xs mt-1'>{errors.type.message}</p>}
                            </div>

                            <div>
                                <label className='block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5 uppercase tracking-wide'>
                                    {watchedType === 'Ngoài trời' ? 'Số kcal/km' : 'Số kcal/phút'} <span className='text-red-500'>*</span>
                                </label>
                                <input
                                    type='number'
                                    step='0.1'
                                    min='0'
                                    placeholder={watchedType === 'Ngoài trời' ? 'Nhập hệ số (VD: 60 kcal/km)' : 'Nhập hệ số (VD: 5 kcal/phút)'}
                                    className='w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all'
                                    {...register('kcal_per_unit', {
                                        required: 'Vui lòng nhập số kcal',
                                        min: { value: 0.1, message: 'Giá trị phải lớn hơn 0' }
                                    })}
                                />
                                <p className='text-gray-400 text-[11px] mt-1'>
                                    {watchedType === 'Ngoài trời'
                                        ? '💡 Số kcal tiêu thụ mỗi km (dùng để tính kcal khi tracking GPS)'
                                        : '💡 Số kcal tiêu thụ mỗi phút (dùng để tính kcal khi tham gia video call)'}
                                </p>
                                {errors.kcal_per_unit && <p className='text-red-500 text-xs mt-1'>{errors.kcal_per_unit.message}</p>}
                            </div>

                            {/* Strava Types — chỉ hiện cho Ngoài trời */}
                            {watchedType === 'Ngoài trời' && (
                                <div>
                                    <label className='block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5 uppercase tracking-wide'>
                                        Loại hoạt động Strava
                                    </label>
                                    <p className='text-gray-400 text-[11px] mb-2'>
                                        🔗 Chọn các loại hoạt động Strava tương ứng. Khi sync Strava, chỉ các hoạt động thuộc loại đã chọn mới được hiển thị.
                                    </p>
                                    <Controller
                                        name='stravaTypes'
                                        control={control}
                                        defaultValue={[]}
                                        render={({ field }) => {
                                            const [stravaSearch, setStravaSearch] = useState('')
                                            const [dropdownOpen, setDropdownOpen] = useState(false)
                                            const selected = field.value || []
                                            const filtered = STRAVA_TYPES.filter(st =>
                                                !selected.includes(st.value) &&
                                                st.label.toLowerCase().includes(stravaSearch.toLowerCase())
                                            )
                                            return (
                                                <div className='relative'>
                                                    {/* Selected tags */}
                                                    {selected.length > 0 && (
                                                        <div className='flex flex-wrap gap-1.5 mb-2'>
                                                            {selected.map(val => {
                                                                const item = STRAVA_TYPES.find(s => s.value === val)
                                                                return (
                                                                    <span key={val} className='inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-orange-100 dark:bg-orange-900/40 border border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300'>
                                                                        {item?.label || val}
                                                                        <button
                                                                            type='button'
                                                                            onClick={() => field.onChange(selected.filter(v => v !== val))}
                                                                            className='ml-0.5 text-orange-400 hover:text-orange-700 dark:hover:text-orange-200 transition-colors'
                                                                        >
                                                                            <FaTimes size={9} />
                                                                        </button>
                                                                    </span>
                                                                )
                                                            })}
                                                        </div>
                                                    )}
                                                    {/* Search input */}
                                                    <div className='relative'>
                                                        <FaSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs' />
                                                        <input
                                                            type='text'
                                                            value={stravaSearch}
                                                            onChange={e => { setStravaSearch(e.target.value); setDropdownOpen(true) }}
                                                            onFocus={() => setDropdownOpen(true)}
                                                            placeholder='Tìm loại hoạt động...'
                                                            className='w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition-all'
                                                        />
                                                    </div>
                                                    {/* Dropdown */}
                                                    {dropdownOpen && filtered.length > 0 && (
                                                        <div className='absolute z-50 mt-1 left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl max-h-40 overflow-y-auto'>
                                                            {filtered.map(st => (
                                                                <button
                                                                    key={st.value}
                                                                    type='button'
                                                                    onClick={() => {
                                                                        field.onChange([...selected, st.value])
                                                                        setStravaSearch('')
                                                                        setDropdownOpen(false)
                                                                    }}
                                                                    className='w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0'
                                                                >
                                                                    {st.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {dropdownOpen && filtered.length === 0 && stravaSearch && (
                                                        <div className='absolute z-50 mt-1 left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl px-4 py-3 text-sm text-gray-400'>
                                                            Không tìm thấy loại hoạt động nào
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        }}
                                    />
                                </div>
                            )}

                            <div className='flex justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-700'>
                                <button
                                    type='button'
                                    onClick={closeModal}
                                    className='px-5 py-2 text-sm bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors'
                                >
                                    Hủy
                                </button>
                                <button
                                    type='submit'
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                    className='px-5 py-2 text-sm bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed'
                                >
                                    {createMutation.isPending || updateMutation.isPending
                                        ? '⏳ Đang xử lý...'
                                        : editingCategory ? '💾 Lưu thay đổi' : '➕ Thêm mới'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Confirm Dialog ── */}
            {confirmAction && (
                <ConfirmBox
                    title={confirmAction.type === 'delete' ? 'Xóa danh mục' : 'Khôi phục danh mục'}
                    subtitle={
                        confirmAction.type === 'delete'
                            ? `Bạn có chắc muốn xóa danh mục "${confirmAction.category.name}"? Danh mục sẽ bị ẩn khỏi hệ thống (có thể khôi phục).`
                            : `Khôi phục danh mục "${confirmAction.category.name}"?`
                    }
                    danger={confirmAction.type === 'delete'}
                    handleDelete={handleConfirm}
                    closeModal={() => setConfirmAction(null)}
                    isPending={deleteMutation.isPending || restoreMutation.isPending}
                    tilteButton={confirmAction.type === 'delete' ? 'Xóa' : 'Khôi phục'}
                />
            )}
        </div>
    )
}
