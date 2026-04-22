import { useSafeMutation } from '../../hooks/useSafeMutation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { FaDumbbell, FaPlus, FaEdit, FaTrash, FaTimes, FaSave, FaCopy, FaMagic, FaSearch, FaToggleOn, FaToggleOff, FaCheckCircle, FaTimesCircle, FaChevronLeft, FaChevronRight, FaUndo, FaChevronDown, FaRunning, FaBolt, FaListOl, FaLightbulb, FaLink, FaThList, FaEyeSlash, FaStopwatch } from 'react-icons/fa'
import { GiBiceps, GiMeditation } from 'react-icons/gi'
import CloudinaryImageUploader from '../../components/GlobalComponents/CloudinaryImageUploader'
import {
    adminGetEquipment, adminCreateEquipment, adminUpdateEquipment, adminDeleteEquipment,
    adminGetMuscleGroups,
    adminGetExercises, adminCreateExercise, adminUpdateExercise, adminDeleteExercise, adminRestoreExercise
} from '../../apis/workoutApi'
import ConfirmBox from '../../components/GlobalComponents/ConfirmBox'

// Gradient colors for cards
const CARD_GRADIENTS = [
    'from-blue-500 to-cyan-400',
    'from-violet-500 to-purple-400',
    'from-emerald-500 to-teal-400',
    'from-amber-500 to-orange-400',
    'from-rose-500 to-pink-400',
    'from-indigo-500 to-blue-400',
    'from-teal-500 to-green-400',
    'from-fuchsia-500 to-pink-400',
    'from-sky-500 to-cyan-400',
    'from-lime-500 to-emerald-400'
]

// ===================== SHARED PAGINATION =====================
function TablePagination({ page, totalPages, onPageChange }) {
    if (totalPages <= 1) return null
    const pageList = Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
        .reduce((acc, p, i, arr) => {
            if (i > 0 && p - arr[i - 1] > 1) acc.push('ellipsis-' + p)
            acc.push(p)
            return acc
        }, [])
    return (
        <div className='mt-5 flex flex-wrap items-center justify-center gap-2'>
            <button
                type='button'
                disabled={page <= 1}
                onClick={() => onPageChange(Math.max(1, page - 1))}
                className='admin-page-btn border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
            >
                ← Trước
            </button>
            {pageList.map(p =>
                typeof p === 'number' ? (
                    <button
                        type='button'
                        key={p}
                        onClick={() => onPageChange(p)}
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-sm font-medium transition-colors ${p === page
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
                            }`}
                    >
                        {p}
                    </button>
                ) : (
                    <span key={p} className='px-1 text-gray-400'>...</span>
                )
            )}
            <button
                type='button'
                disabled={page >= totalPages}
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                className='admin-page-btn border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
            >
                Sau →
            </button>
        </div>
    )
}

// ===================== EQUIPMENT MANAGEMENT =====================
function EquipmentManager() {
    const qc = useQueryClient()
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [search, setSearch] = useState('')
    const [filterEqStatus, setFilterEqStatus] = useState('all') // 'all' | 'active' | 'hidden'
    const [confirmDeleteEquipment, setConfirmDeleteEquipment] = useState(null) // { id, name }
    const [form, setForm] = useState({ name: '', name_en: '', image_url: '', description: '', is_active: true })

    const { data, isLoading } = useQuery({ queryKey: ['admin-equipment'], queryFn: adminGetEquipment })
    const items = data?.data?.result || []

    const activeCount = items.filter(i => i.is_active !== false).length
    const hiddenCount = items.length - activeCount

    const filteredItems = items.filter(item => {
        if (filterEqStatus === 'active' && item.is_active === false) return false
        if (filterEqStatus === 'hidden' && item.is_active !== false) return false
        return !search || item.name.toLowerCase().includes(search.toLowerCase()) ||
            item.name_en?.toLowerCase().includes(search.toLowerCase()) ||
            item.description?.toLowerCase().includes(search.toLowerCase())
    })

    const createMut = useSafeMutation({
        mutationFn: (d) => adminCreateEquipment(d),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-equipment'] }); toast.success('Tạo thành công'); resetForm() },
        onError: () => toast.error('Lỗi tạo thiết bị')
    })
    const updateMut = useSafeMutation({
        mutationFn: ({ id, d }) => adminUpdateEquipment(id, d),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-equipment'] }); toast.success('Cập nhật thành công'); resetForm() },
        onError: () => toast.error('Lỗi cập nhật')
    })
    const deleteMut = useSafeMutation({
        mutationFn: (id) => adminDeleteEquipment(id),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-equipment'] }); toast.success('Xóa thành công') },
        onError: () => toast.error('Lỗi xóa')
    })
    const toggleActiveMut = useSafeMutation({
        mutationFn: ({ id, is_active }) => adminUpdateEquipment(id, { is_active }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-equipment'] }); toast.success('Cập nhật trạng thái thành công') },
        onError: () => toast.error('Lỗi cập nhật trạng thái')
    })

    const resetForm = () => { setForm({ name: '', name_en: '', image_url: '', description: '', is_active: true }); setEditingId(null); setShowForm(false) }
    const startEdit = (item) => {
        setForm({
            name: item.name, name_en: item.name_en,
            image_url: item.image_url || '', description: item.description || '',
            is_active: item.is_active !== false
        })
        setEditingId(item._id); setShowForm(true)
    }
    const handleSubmit = () => {
        if (!form.name || !form.name_en) return toast.error('Tên không được để trống')
        editingId ? updateMut.mutate({ id: editingId, d: form }) : createMut.mutate(form)
    }

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900 pt-0 pb-4 px-4'>

            {/* ── Hero Banner ── */}
            <div className='relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 px-6 py-4 mb-2 shadow-xl'>
                <div className='relative z-10 flex items-center justify-between'>
                    <h1 className='text-2xl font-bold text-white'>Quản lý Thiết bị</h1>
                    <button type='button' onClick={() => { resetForm(); setShowForm(true) }}
                        className='inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-indigo-700 shadow-lg transition-all hover:bg-indigo-50'>
                        <FaPlus size={14} className='shrink-0' aria-hidden /> Thêm mới
                    </button>
                </div>
                {/* Filter stat tabs */}
                <div className='relative z-10 mt-3 flex flex-wrap gap-2'>
                    {[
                        { key: 'all', label: 'Tất cả', Icon: FaThList, count: items.length },
                        { key: 'active', label: 'Hoạt động', Icon: FaCheckCircle, count: activeCount },
                        { key: 'hidden', label: 'Đã ẩn', Icon: FaEyeSlash, count: hiddenCount },
                    ].map(tab => (
                        <button
                            type='button'
                            key={tab.key}
                            onClick={() => setFilterEqStatus(tab.key)}
                            className={`admin-hero-tab shrink-0 ${
                                filterEqStatus === tab.key ? 'bg-white text-indigo-700 shadow-md' : 'bg-white/20 text-white hover:bg-white/30'
                            }`}
                        >
                            <tab.Icon size={14} className='shrink-0 opacity-95' aria-hidden />
                            {tab.label} <span className='font-black tabular-nums'>({tab.count})</span>
                        </button>
                    ))}
                </div>
                <div className='absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10' />
                <div className='absolute right-20 -bottom-8 w-32 h-32 rounded-full bg-white/10' />
                <FaDumbbell className='absolute right-8 top-8 text-white/10 text-[8rem]' />
            </div>

            {/* ── Search Bar ── */}
            <div className='bg-white dark:bg-slate-800 rounded-xl shadow-sm p-3 mb-2 border border-gray-100 dark:border-slate-700'>
                <div className='relative'>
                    <FaSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs' />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder='Tìm thiết bị...'
                        className='min-h-10 w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30 dark:border-slate-600 dark:bg-slate-800 dark:text-white' />
                </div>
            </div>

            {/* Modal Form */}
            {showForm && (
                <div className='fixed inset-0 z-50 flex items-center justify-center p-4'
                    style={{ animation: 'fadeIn 0.15s ease-out' }}>
                    {/* Backdrop */}
                    <div className='absolute inset-0 bg-black/50 backdrop-blur-sm' onClick={resetForm} />
                    {/* Modal content */}
                    <div className='relative w-full max-w-lg max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden'
                        style={{ animation: 'scaleIn 0.2s ease-out' }}>
                        {/* Modal header */}
                        <div className='flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-600 to-indigo-600 flex-shrink-0'>
                            <h4 className='font-bold text-white text-base flex items-center gap-2'>
                                {editingId ? <FaEdit className='text-base' aria-hidden /> : <FaPlus className='text-base' aria-hidden />}
                                <span>{editingId ? 'Chỉnh sửa thiết bị' : 'Thêm thiết bị mới'}</span>
                            </h4>
                            <button onClick={resetForm}
                                className='p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors'>
                                <FaTimes />
                            </button>
                        </div>

                        {/* Scrollable body */}
                        <div className='flex-1 overflow-y-auto p-5 space-y-4'>
                            {/* Image uploader */}
                            <div className='flex justify-center'>
                                <div className='w-44'>
                                    <CloudinaryImageUploader
                                        value={form.image_url}
                                        onChange={(url) => setForm({ ...form, image_url: url })}
                                        label='Hình ảnh'
                                        folder='equipment'
                                        square
                                    />
                                </div>
                            </div>
                            {/* Text fields */}
                            <div>
                                <label className='block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide'>Tên tiếng Việt *</label>
                                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                    className='w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none transition-all'
                                    placeholder='Nhập tên thiết bị (VI)' />
                            </div>
                            <div>
                                <label className='block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide'>Tên tiếng Anh *</label>
                                <input value={form.name_en} onChange={e => setForm({ ...form, name_en: e.target.value })}
                                    className='w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none transition-all'
                                    placeholder='Nhập tên thiết bị (EN)' />
                            </div>
                            <div>
                                <label className='block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide'>Mô tả</label>
                                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                                    className='w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none transition-all'
                                    placeholder='Mô tả ngắn về thiết bị' />
                            </div>
                            {/* Status toggle */}
                            <div className='flex items-center justify-end'>
                                <button type='button' onClick={() => setForm({ ...form, is_active: !form.is_active })}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${form.is_active
                                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                                        }`}>
                                    {form.is_active ? <FaToggleOn className='text-lg text-emerald-500' /> : <FaToggleOff className='text-lg text-slate-400' />}
                                    {form.is_active ? 'Hoạt động' : 'Đã ẩn'}
                                </button>
                            </div>
                        </div>

                        {/* Modal footer */}
                        <div className='flex gap-2 px-5 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex-shrink-0'>
                            <button onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending}
                                className='flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-blue-500/25 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed'>
                                <FaSave /> {editingId ? 'Cập nhật' : 'Tạo mới'}
                            </button>
                            <button onClick={resetForm}
                                className='flex items-center gap-1.5 px-5 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-all'>
                                <FaTimes /> Hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Equipment Cards Grid */}
            {isLoading ? (
                <div className='flex items-center justify-center py-12'>
                    <div className='flex flex-col items-center gap-3'>
                        <div className='w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin'></div>
                        <p className='text-sm text-slate-500'>Đang tải thiết bị...</p>
                    </div>
                </div>
            ) : filteredItems.length === 0 ? (
                <div className='text-center py-12'>
                    <FaSearch className='text-4xl mb-3 mx-auto text-slate-300 dark:text-slate-600' aria-hidden />
                    <p className='text-slate-500'>Không tìm thấy thiết bị nào{search ? ` với từ khóa "${search}"` : ''}</p>
                </div>
            ) : (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
                    {filteredItems.map((item, index) => {
                        const isActive = item.is_active !== false
                        const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length]
                        return (
                            <div key={item._id}
                                className={`group relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 hover:-translate-y-1 transition-all duration-300 ${!isActive ? 'opacity-60' : ''}`}>
                                <div className={`h-1.5 bg-gradient-to-r ${gradient}`}></div>
                                <div className='p-4'>
                                    <div className='flex items-start gap-3'>
                                        <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}
                                            style={{ boxShadow: '0 4px 14px -3px rgba(0,0,0,0.15)' }}>
                                            {item.image_url
                                                ? <img src={item.image_url} alt={item.name} className='w-8 h-8 object-contain' />
                                                : <FaDumbbell className='text-white text-lg' />}
                                        </div>
                                        <div className='flex-1 min-w-0'>
                                            <h4 className='font-bold text-slate-800 dark:text-slate-100 text-sm truncate'>{item.name}</h4>
                                            <p className='text-xs text-slate-400 dark:text-slate-500 font-medium truncate'>{item.name_en}</p>
                                        </div>
                                        <button onClick={() => toggleActiveMut.mutate({ id: item._id, is_active: !isActive })}
                                            title={isActive ? 'Hoạt động — Nhấn để ẩn' : 'Đã ẩn — Nhấn để kích hoạt'}
                                            className='flex-shrink-0 transition-all hover:scale-110'>
                                            {isActive
                                                ? <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold'><FaCheckCircle className='text-[8px]' /> Hoạt động</span>
                                                : <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 text-[10px] font-semibold'><FaTimesCircle className='text-[8px]' /> Ẩn</span>}
                                        </button>
                                    </div>
                                    {item.description && (
                                        <p className='mt-2.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed'>{item.description}</p>
                                    )}
                                    <div className='flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50'>
                                        <button onClick={() => startEdit(item)}
                                            className='flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors'>
                                            <FaEdit className='text-[10px]' /> Sửa
                                        </button>
                                        <button onClick={() => setConfirmDeleteEquipment({ id: item._id, name: item.name })}
                                            className='flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 text-xs font-medium hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors'>
                                            <FaTrash className='text-[10px]' /> Xóa
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Confirm delete equipment */}
            {confirmDeleteEquipment && (
                <ConfirmBox
                    title='Xác nhận xóa'
                    subtitle={`Bạn có chắc chắn muốn xóa thiết bị "${confirmDeleteEquipment.name}"?`}
                    handleDelete={() => {
                        deleteMut.mutate(confirmDeleteEquipment.id, { onSettled: () => setConfirmDeleteEquipment(null) })
                    }}
                    closeModal={() => setConfirmDeleteEquipment(null)}
                    isPending={deleteMut.isPending}
                />
            )}
        </div>
    )
}

// ===================== DEFAULT SETS EDITOR =====================
function DefaultSetsEditor({ sets, onChange, onDifficultyChange }) {
    const addSet = () => {
        const lastSet = sets[sets.length - 1]
        onChange([...sets, {
            set_number: sets.length + 1,
            reps: lastSet?.reps || 10,
            weight: lastSet?.weight || 10,
            calories_per_unit: lastSet?.calories_per_unit || 10
        }])
    }

    const duplicateSet = (index) => {
        const s = sets[index]
        const newSets = [...sets]
        newSets.splice(index + 1, 0, { ...s, set_number: 0 })
        onChange(newSets.map((set, i) => ({ ...set, set_number: i + 1 })))
    }

    const removeSet = (index) => {
        if (sets.length <= 1) return
        onChange(sets.filter((_, i) => i !== index).map((s, i) => ({ ...s, set_number: i + 1 })))
    }

    const updateSet = (index, field, value) => {
        onChange(sets.map((s, i) => i === index ? { ...s, [field]: Number(value) } : s))
    }

    const autoGenerate = (difficulty) => {
        const config = {
            beginner: { count: 3, reps: 12 },
            intermediate: { count: 4, reps: 10 },
            expert: { count: 5, reps: 8 }
        }
        const c = config[difficulty] || config.intermediate
        onChange(Array.from({ length: c.count }, (_, i) => ({
            set_number: i + 1, reps: c.reps, weight: 10, calories_per_unit: 10
        })))
        if (onDifficultyChange) onDifficultyChange(difficulty)
    }

    return (
        <div className='mt-3'>
            <div className='flex items-center justify-between mb-2'>
                <label className='text-xs font-medium text-slate-500'>Set tập mặc định ({sets.length} sets)</label>
                <div className='flex gap-1'>
                    <button type='button' onClick={() => autoGenerate('beginner')} className='px-2 py-0.5 text-[10px] rounded bg-green-100 text-green-700 hover:bg-green-200'>
                        <FaMagic className='inline mr-0.5' />Dễ (3×12)
                    </button>
                    <button type='button' onClick={() => autoGenerate('intermediate')} className='px-2 py-0.5 text-[10px] rounded bg-amber-100 text-amber-700 hover:bg-amber-200'>
                        <FaMagic className='inline mr-0.5' />Trung bình (4×10)
                    </button>
                    <button type='button' onClick={() => autoGenerate('expert')} className='px-2 py-0.5 text-[10px] rounded bg-red-100 text-red-700 hover:bg-red-200'>
                        <FaMagic className='inline mr-0.5' />Khó (5×8)
                    </button>
                </div>
            </div>
            <div className='space-y-1.5'>
                <div className='grid grid-cols-12 gap-1 text-[10px] font-medium text-slate-400 px-1'>
                    <div className='col-span-1'>SET</div>
                    <div className='col-span-3'>Số lần (Reps)</div>
                    <div className='col-span-3'>Mức tạ (kg)</div>
                    <div className='col-span-3'>kcal/lần</div>
                    <div className='col-span-2'></div>
                </div>
                {sets.map((set, i) => (
                    <div key={i} className='grid grid-cols-12 gap-1 items-center'>
                        <div className='col-span-1'>
                            <span className='inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 text-[10px] font-bold'>{set.set_number}</span>
                        </div>
                        <div className='col-span-3'>
                            <input type='number' value={set.reps} onChange={e => updateSet(i, 'reps', e.target.value)} min={0}
                                className='w-full px-2 py-1 text-xs border rounded bg-white dark:bg-slate-800 dark:border-slate-600' />
                        </div>
                        <div className='col-span-3'>
                            <input type='number' value={set.weight} onChange={e => updateSet(i, 'weight', e.target.value)} min={0} step={0.5}
                                className='w-full px-2 py-1 text-xs border rounded bg-white dark:bg-slate-800 dark:border-slate-600' />
                        </div>
                        <div className='col-span-3'>
                            <input type='number' value={set.calories_per_unit ?? 10} onChange={e => updateSet(i, 'calories_per_unit', e.target.value)} min={0} step={0.1}
                                className='w-full px-2 py-1 text-xs border rounded bg-white dark:bg-slate-800 dark:border-slate-600' placeholder='10' />
                        </div>
                        <div className='col-span-2 flex gap-0.5'>
                            <button type='button' onClick={() => duplicateSet(i)} title='Nhân đôi' className='p-1 rounded bg-blue-50 text-blue-500 hover:bg-blue-100 text-[10px]'>
                                <FaCopy />
                            </button>
                            <button type='button' onClick={() => removeSet(i)} title='Xóa' className='p-1 rounded bg-red-50 text-red-500 hover:bg-red-100 text-[10px]'>
                                <FaTrash />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <button type='button' onClick={addSet}
                className='mt-2 w-full py-1.5 border border-dashed border-blue-300 dark:border-blue-700 rounded text-blue-600 text-xs flex items-center justify-center gap-1 hover:bg-blue-50 dark:hover:bg-blue-900/20'>
                <FaPlus /> Thêm set
            </button>
        </div>
    )
}

// ===================== EXERCISE MANAGEMENT =====================
const CATEGORY_CONFIG = {
    strength: { label: 'Sức mạnh', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', bar: 'bg-blue-500', dot: 'bg-blue-500' },
    cardio: { label: 'Tim mạch', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', bar: 'bg-red-500', dot: 'bg-red-500' },
    stretching: { label: 'Giãn cơ', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', bar: 'bg-green-500', dot: 'bg-green-500' },
    plyometrics: { label: 'Bật nhảy', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', bar: 'bg-orange-500', dot: 'bg-orange-500' }
}
const DIFFICULTY_CONFIG = {
    beginner: { label: 'Dễ', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    intermediate: { label: 'Trung bình', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    expert: { label: 'Khó', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
}

const LIMIT = 12

/** Giây/rep: đồng bộ với Training (tối thiểu 1); validate chi tiết ở FE */
const SEC_PER_REP_MIN = 1
const SEC_PER_REP_MAX = 120
const REST_SEC_MAX = 600

function parseSecPerRepInput(raw) {
    if (raw === '' || raw === null || raw === undefined) return null
    const n = Math.round(Number(typeof raw === 'number' ? raw : String(raw).trim()))
    if (!Number.isFinite(n)) return null
    if (n < SEC_PER_REP_MIN || n > SEC_PER_REP_MAX) return null
    return n
}

function parseRestSecInput(raw) {
    if (raw === '' || raw === null || raw === undefined) return null
    const n = Math.round(Number(typeof raw === 'number' ? raw : String(raw).trim()))
    if (!Number.isFinite(n)) return null
    if (n < 0 || n > REST_SEC_MAX) return null
    return n
}

function ExerciseManager() {
    const qc = useQueryClient()
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [searchInput, setSearchInput] = useState('')
    const [search, setSearch] = useState('')
    const [filterMuscle, setFilterMuscle] = useState('') // muscle_group _id
    const [filterEquipment, setFilterEquipment] = useState('') // equipment _id
    const [filterCategory, setFilterCategory] = useState('') // '' | 'strength' | 'cardio' | 'stretching' | 'plyometrics'
    const [status, setStatus] = useState('active') // 'active' | 'deleted'
    const [showMuscleFilter, setShowMuscleFilter] = useState(false)
    const [showEquipmentFilter, setShowEquipmentFilter] = useState(false)
    const [page, setPage] = useState(1)
    const [confirmDelete, setConfirmDelete] = useState(null) // { id, name }
    const debounceRef = useRef(null)
    const muscleFilterRef = useRef(null)
    const equipmentFilterRef = useRef(null)

    // Close filter panels on outside click
    useEffect(() => {
        const handler = (e) => {
            if (muscleFilterRef.current && !muscleFilterRef.current.contains(e.target)) setShowMuscleFilter(false)
            if (equipmentFilterRef.current && !equipmentFilterRef.current.contains(e.target)) setShowEquipmentFilter(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    // Debounce search 300ms
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => { setSearch(searchInput); setPage(1) }, 300)
        return () => clearTimeout(debounceRef.current)
    }, [searchInput])

    const initForm = {
        name: '', name_vi: '', description: '', instructions: '', tips: '', video_url: '', image_url: '',
        category: 'strength', difficulty: 'intermediate',
        duration_default: 3,
        rest_time_default: 0,
        equipment_ids: [], muscle_group_ids: [], secondary_muscle_ids: [],
        default_sets: [
            { set_number: 1, reps: 10, weight: 10, calories_per_unit: 10 },
            { set_number: 2, reps: 10, weight: 10, calories_per_unit: 10 },
            { set_number: 3, reps: 10, weight: 10, calories_per_unit: 10 },
            { set_number: 4, reps: 10, weight: 10, calories_per_unit: 10 }
        ]
    }
    const [form, setForm] = useState(initForm)

    const { data, isLoading } = useQuery({
        queryKey: ['admin-exercises', search, filterMuscle, filterEquipment, filterCategory, page, status],
        queryFn: () => adminGetExercises({ search, muscle_group_id: filterMuscle, equipment_id: filterEquipment, category: filterCategory || undefined, page, limit: LIMIT, status }),
        keepPreviousData: true
    })
    const result = data?.data?.result || {}
    const exercises = result.exercises || []
    const total = result.total || 0
    const totalPages = Math.ceil(total / LIMIT)

    const { data: eqData } = useQuery({ queryKey: ['admin-equipment'], queryFn: adminGetEquipment })
    const { data: mgData } = useQuery({ queryKey: ['admin-muscle-groups'], queryFn: adminGetMuscleGroups })
    const allEquipment = eqData?.data?.result || []
    const allMuscleGroups = mgData?.data?.result || []

    // Stat counts per category
    const { data: strengthData } = useQuery({ queryKey: ['admin-exercises-count-strength'], queryFn: () => adminGetExercises({ category: 'strength', page: 1, limit: 1, status: 'active' }) })
    const { data: cardioData } = useQuery({ queryKey: ['admin-exercises-count-cardio'], queryFn: () => adminGetExercises({ category: 'cardio', page: 1, limit: 1, status: 'active' }) })
    const { data: stretchData } = useQuery({ queryKey: ['admin-exercises-count-stretching'], queryFn: () => adminGetExercises({ category: 'stretching', page: 1, limit: 1, status: 'active' }) })
    const { data: plyoData } = useQuery({ queryKey: ['admin-exercises-count-plyometrics'], queryFn: () => adminGetExercises({ category: 'plyometrics', page: 1, limit: 1, status: 'active' }) })
    const { data: totalAllData } = useQuery({ queryKey: ['admin-exercises-count-all'], queryFn: () => adminGetExercises({ page: 1, limit: 1, status: 'active' }) })
    const { data: deletedCountData } = useQuery({ queryKey: ['admin-exercises-count-deleted'], queryFn: () => adminGetExercises({ page: 1, limit: 1, status: 'deleted' }) })
    const totalActiveCount = totalAllData?.data?.result?.total || 0
    const deletedCount = deletedCountData?.data?.result?.total || 0
    const strengthCount = strengthData?.data?.result?.total || 0
    const cardioCount = cardioData?.data?.result?.total || 0
    const stretchCount = stretchData?.data?.result?.total || 0
    const plyoCount = plyoData?.data?.result?.total || 0

    const invalidateAll = () => {
        qc.invalidateQueries({ queryKey: ['admin-exercises'] })
        qc.invalidateQueries({ queryKey: ['admin-exercises-count-strength'] })
        qc.invalidateQueries({ queryKey: ['admin-exercises-count-cardio'] })
        qc.invalidateQueries({ queryKey: ['admin-exercises-count-stretching'] })
        qc.invalidateQueries({ queryKey: ['admin-exercises-count-plyometrics'] })
        qc.invalidateQueries({ queryKey: ['admin-exercises-count-all'] })
        qc.invalidateQueries({ queryKey: ['admin-exercises-count-deleted'] })
    }

    const mergeExerciseIntoListCache = (updated) => {
        if (!updated?._id) return
        qc.setQueriesData({ queryKey: ['admin-exercises'], exact: false }, (old) => {
            if (!old?.data?.result?.exercises) return old
            const list = old.data.result.exercises
            const idx = list.findIndex((e) => String(e._id) === String(updated._id))
            if (idx === -1) return old
            const next = [...list]
            next[idx] = { ...next[idx], ...updated }
            return {
                ...old,
                data: {
                    ...old.data,
                    result: { ...old.data.result, exercises: next }
                }
            }
        })
    }

    const createMut = useSafeMutation({
        mutationFn: (d) => adminCreateExercise(d),
        onSuccess: () => {
            invalidateAll()
            toast.success('Tạo bài tập thành công')
            resetForm()
        },
        onError: () => toast.error('Lỗi tạo bài tập')
    })
    const updateMut = useSafeMutation({
        mutationFn: ({ id, d }) => adminUpdateExercise(id, d),
        onSuccess: (res) => {
            mergeExerciseIntoListCache(res?.data?.result)
            invalidateAll()
            toast.success('Cập nhật thành công')
            resetForm()
        },
        onError: () => toast.error('Lỗi cập nhật')
    })
    const deleteMut = useSafeMutation({
        mutationFn: (id) => adminDeleteExercise(id),
        onSuccess: () => { invalidateAll(); toast.success('Đã xóa bài tập') },
        onError: () => toast.error('Lỗi xóa')
    })
    const restoreMut = useSafeMutation({
        mutationFn: (id) => adminRestoreExercise(id),
        onSuccess: () => { invalidateAll(); toast.success('Đã khôi phục bài tập') },
        onError: () => toast.error('Lỗi khôi phục')
    })

    const resetForm = () => { setForm(initForm); setEditingId(null); setShowForm(false) }
    const startEdit = (ex) => {
        setForm({
            name: ex.name, name_vi: ex.name_vi || '', description: ex.description || '',
            instructions: (ex.instructions || []).join('\n'), tips: ex.tips || '',
            video_url: ex.video_url || '', image_url: ex.image_url || '',
            category: ex.category || 'strength', difficulty: ex.difficulty || 'intermediate',
            equipment_ids: (ex.equipment_ids || []).map(e => typeof e === 'object' ? e._id : e),
            muscle_group_ids: (ex.muscle_group_ids || []).map(m => typeof m === 'object' ? m._id : m),
            secondary_muscle_ids: (ex.secondary_muscle_ids || []).map(m => typeof m === 'object' ? m._id : m),
            default_sets: (ex.default_sets && ex.default_sets.length > 0) ? ex.default_sets : [
                { set_number: 1, reps: 10, weight: 10, calories_per_unit: 10 }
            ],
            duration_default: ex.duration_default ?? 3,
            rest_time_default: ex.rest_time_default ?? 0
        })
        setEditingId(ex._id); setShowForm(true)
    }
    const handleSubmit = () => {
        if (!form.name) return toast.error('Tên bài tập không được để trống')
        const repSec = parseSecPerRepInput(form.duration_default)
        if (repSec === null) {
            return toast.error(`Giây mỗi rep: nhập số nguyên từ ${SEC_PER_REP_MIN} đến ${SEC_PER_REP_MAX}`)
        }
        const restSec = parseRestSecInput(form.rest_time_default)
        if (restSec === null) {
            return toast.error(`Nghỉ giữa các set: nhập số nguyên từ 0 đến ${REST_SEC_MAX}`)
        }
        const payload = {
            ...form,
            instructions: form.instructions.split('\n').filter(Boolean),
            duration_default: repSec,
            rest_time_default: restSec
        }
        editingId ? updateMut.mutate({ id: editingId, d: payload }) : createMut.mutate(payload)
    }

    const toggleArrayItem = (field, id) => {
        setForm(prev => ({
            ...prev,
            [field]: prev[field].includes(id) ? prev[field].filter(i => i !== id) : [...prev[field], id]
        }))
    }

    const inputClass = 'w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 outline-none transition-all'
    const labelClass = 'block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide'

    // Active filter count (for badge)
    const activeFilterCount = [filterMuscle, filterEquipment].filter(Boolean).length

    const clearAllFilters = () => { setSearchInput(''); setSearch(''); setFilterMuscle(''); setFilterEquipment(''); setFilterCategory(''); setPage(1) }

    const switchStatus = (s) => { setStatus(s); setPage(1); setFilterMuscle(''); setFilterEquipment(''); setFilterCategory(''); setSearchInput(''); setSearch(''); setShowMuscleFilter(false); setShowEquipmentFilter(false) }

    const handleDeleteClick = (ex) => setConfirmDelete({ id: ex._id, name: ex.name })
    const handleDeleteConfirm = () => {
        if (!confirmDelete) return
        deleteMut.mutate(confirmDelete.id, { onSettled: () => setConfirmDelete(null) })
    }

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900 pt-0 pb-4 px-4'>
            {/* ── Hero Banner ── */}
            <div className='relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 px-6 py-4 mb-2 shadow-xl'>
                <div className='relative z-10 flex items-center justify-between'>
                    <h1 className='text-2xl font-bold text-white'>Quản lý Bài tập</h1>
                    <button type='button' onClick={() => { resetForm(); setShowForm(true) }}
                        className='inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-indigo-700 shadow-lg transition-all hover:bg-indigo-50'>
                        <FaPlus size={14} className='shrink-0' aria-hidden /> Thêm bài tập
                    </button>
                </div>

                {/* Status tabs */}
                <div className='relative z-10 mt-3 flex flex-wrap gap-2'>
                    <button type='button' onClick={() => switchStatus('active')}
                        className={`admin-hero-tab shrink-0 ${status === 'active' && !filterCategory ? 'bg-white text-indigo-700 shadow-md' : 'bg-white/20 text-white hover:bg-white/30'}`}>
                        <FaThList size={14} className='shrink-0 opacity-95' aria-hidden /> Tất cả <span className='font-black tabular-nums'>({totalActiveCount})</span>
                    </button>
                    {[
                        { key: 'strength', Icon: FaDumbbell, label: 'Sức mạnh', count: strengthCount },
                        { key: 'cardio', Icon: FaRunning, label: 'Tim mạch', count: cardioCount },
                        { key: 'stretching', Icon: GiMeditation, label: 'Giãn cơ', count: stretchCount },
                        { key: 'plyometrics', Icon: FaBolt, label: 'Bật nhảy', count: plyoCount },
                    ].map(cat => (
                        <button
                            type='button'
                            key={cat.key}
                            onClick={() => { if (status !== 'active') switchStatus('active'); setFilterCategory(cat.key); setPage(1) }}
                            className={`admin-hero-tab shrink-0 ${
                                filterCategory === cat.key ? 'bg-white text-indigo-700 shadow-md' : 'bg-white/20 text-white hover:bg-white/30'
                            }`}
                        >
                            <cat.Icon size={14} className='shrink-0 opacity-95' aria-hidden /> {cat.label} <span className='font-black tabular-nums'>({cat.count})</span>
                        </button>
                    ))}
                    <button type='button' onClick={() => switchStatus('deleted')}
                        className={`admin-hero-tab shrink-0 ${status === 'deleted' ? 'bg-white text-indigo-700 shadow-md' : 'bg-white/20 text-white hover:bg-white/30'}`}>
                        <FaTrash size={14} className='shrink-0 opacity-95' aria-hidden /> Đã xóa <span className='font-black tabular-nums'>({deletedCount})</span>
                    </button>
                </div>

                <div className='absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10' />
                <div className='absolute right-20 -bottom-8 w-32 h-32 rounded-full bg-white/10' />
                <GiBiceps className='absolute right-8 top-8 text-white/10 text-[8rem]' />
            </div>

            {/* ── Smart Search + Filters ── */}
            <div className='bg-white dark:bg-slate-800 rounded-xl shadow-sm p-3 mb-2 border border-gray-100 dark:border-slate-700'>
                <div className='flex items-center gap-2'>
                    {/* Search */}
                    <div className='relative flex-1'>
                        <FaSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs' />
                        {searchInput && (
                            <button onClick={() => setSearchInput('')}
                                className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors'>
                                <FaTimes size={11} />
                            </button>
                        )}
                        <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
                            placeholder='Tìm tên bài tập (EN hoặc VI)...'
                            className='min-h-10 w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-8 text-sm outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-600 dark:bg-slate-800 dark:text-white' />
                    </div>

                    {/* Muscle Group filter dropdown */}
                    <div className='relative' ref={muscleFilterRef}>
                        <button type='button' onClick={() => { setShowMuscleFilter(p => !p); setShowEquipmentFilter(false) }}
                            className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold transition-all ${showMuscleFilter || filterMuscle
                                ? 'bg-violet-50 dark:bg-violet-900/30 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-300'}`}>
                            <GiBiceps className='text-sm shrink-0 opacity-90' aria-hidden />
                            <span className='hidden sm:inline'>{filterMuscle ? allMuscleGroups.find(m => m._id === filterMuscle)?.name || 'Nhóm cơ' : 'Nhóm cơ'}</span>
                            {filterMuscle && (
                                <button onClick={(e) => { e.stopPropagation(); setFilterMuscle(''); setPage(1) }}
                                    className='w-4 h-4 rounded-full bg-violet-600 text-white text-[8px] flex items-center justify-center hover:bg-violet-700'>
                                    <FaTimes size={7} />
                                </button>
                            )}
                            <FaChevronDown size={9} className={`transition-transform ${showMuscleFilter ? 'rotate-180' : ''}`} />
                        </button>

                        {showMuscleFilter && (
                            <div className='absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-20 p-3'
                                style={{ animation: 'fadeIn 0.15s ease-out' }}>
                                <p className='text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest mb-2 flex items-center gap-1'><GiBiceps className='shrink-0' size={12} aria-hidden /> Lọc theo nhóm cơ</p>
                                <div className='max-h-48 overflow-y-auto flex flex-wrap gap-1.5 pr-1'>
                                    <button onClick={() => { setFilterMuscle(''); setPage(1); setShowMuscleFilter(false) }}
                                        className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${filterMuscle === ''
                                            ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                                            : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-violet-400 hover:text-violet-600'}`}>
                                        Tất cả
                                    </button>
                                    {allMuscleGroups.map(mg => (
                                        <button key={mg._id} onClick={() => { setFilterMuscle(mg._id); setPage(1); setShowMuscleFilter(false) }}
                                            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${filterMuscle === mg._id
                                                ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                                                : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-violet-400 hover:text-violet-600'}`}>
                                            {mg.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Equipment filter dropdown */}
                    <div className='relative' ref={equipmentFilterRef}>
                        <button type='button' onClick={() => { setShowEquipmentFilter(p => !p); setShowMuscleFilter(false) }}
                            className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold transition-all ${showEquipmentFilter || filterEquipment
                                ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-300'}`}>
                            <FaDumbbell className='text-sm shrink-0 opacity-90' aria-hidden />
                            <span className='hidden sm:inline'>{filterEquipment ? allEquipment.find(e => e._id === filterEquipment)?.name || 'Thiết bị' : 'Thiết bị'}</span>
                            {filterEquipment && (
                                <button onClick={(e) => { e.stopPropagation(); setFilterEquipment(''); setPage(1) }}
                                    className='w-4 h-4 rounded-full bg-blue-600 text-white text-[8px] flex items-center justify-center hover:bg-blue-700'>
                                    <FaTimes size={7} />
                                </button>
                            )}
                            <FaChevronDown size={9} className={`transition-transform ${showEquipmentFilter ? 'rotate-180' : ''}`} />
                        </button>

                        {showEquipmentFilter && (
                            <div className='absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-20 p-3'
                                style={{ animation: 'fadeIn 0.15s ease-out' }}>
                                <p className='text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-1'><FaDumbbell className='shrink-0' size={12} aria-hidden /> Lọc theo thiết bị</p>
                                <div className='max-h-48 overflow-y-auto flex flex-wrap gap-1.5 pr-1'>
                                    <button onClick={() => { setFilterEquipment(''); setPage(1); setShowEquipmentFilter(false) }}
                                        className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${filterEquipment === ''
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                            : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-blue-400 hover:text-blue-600'}`}>
                                        Tất cả
                                    </button>
                                    {allEquipment.map(eq => (
                                        <button key={eq._id} onClick={() => { setFilterEquipment(eq._id); setPage(1); setShowEquipmentFilter(false) }}
                                            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${filterEquipment === eq._id
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                                : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-blue-400 hover:text-blue-600'}`}>
                                            {eq.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Active filter chips */}
                {activeFilterCount > 0 && (
                    <div className='flex flex-wrap gap-2 mt-2.5'>
                        {filterMuscle && (
                            <span className='inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'>
                                <GiBiceps size={11} className='shrink-0 opacity-90' aria-hidden /> {allMuscleGroups.find(m => m._id === filterMuscle)?.name || 'Nhóm cơ'}
                                <button onClick={() => { setFilterMuscle(''); setPage(1) }} className='hover:text-violet-900'><FaTimes size={9} /></button>
                            </span>
                        )}
                        {filterEquipment && (
                            <span className='inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'>
                                <FaDumbbell size={11} className='shrink-0 opacity-90' aria-hidden /> {allEquipment.find(e => e._id === filterEquipment)?.name || 'Thiết bị'}
                                <button onClick={() => { setFilterEquipment(''); setPage(1) }} className='hover:text-blue-900'><FaTimes size={9} /></button>
                            </span>
                        )}
                        <button onClick={clearAllFilters}
                            className='inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors'>
                            <FaTimes size={9} /> Xóa tất cả
                        </button>
                    </div>
                )}
            </div>

            {/* ── Delete Confirm Modal ── */}
            {confirmDelete && (
                <ConfirmBox
                    title='Xác nhận xóa'
                    subtitle={<>Bạn có chắc chắn muốn xóa bài tập <strong className='text-slate-700 dark:text-slate-200'>"{confirmDelete.name}"</strong>?<br /><span className='text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 block'>Bài tập sẽ được chuyển vào thùng rác và có thể khôi phục.</span></>}
                    handleDelete={handleDeleteConfirm}
                    closeModal={() => setConfirmDelete(null)}
                    isPending={deleteMut.isPending}
                />
            )}

            {/* ── Modal Form ── */}
            {showForm && (
                <div className='fixed inset-0 z-50 flex items-center justify-center p-4'
                    style={{ animation: 'fadeIn 0.15s ease-out' }}>
                    {/* Backdrop */}
                    <div className='absolute inset-0 bg-black/50 backdrop-blur-sm' onClick={resetForm} />
                    {/* Modal content */}
                    <div className='relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden'
                        style={{ animation: 'scaleIn 0.2s ease-out' }}>
                        {/* Modal header */}
                        <div className='flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-indigo-600 to-violet-600 flex-shrink-0'>
                            <h4 className='font-bold text-white text-base flex items-center gap-2'>
                                {editingId ? <FaEdit className='text-base' aria-hidden /> : <FaPlus className='text-base' aria-hidden />}
                                <span>{editingId ? 'Chỉnh sửa bài tập' : 'Thêm bài tập mới'}</span>
                            </h4>
                            <button onClick={resetForm}
                                className='p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors'>
                                <FaTimes />
                            </button>
                        </div>

                        {/* Scrollable body */}
                        <div className='flex-1 overflow-y-auto p-5 space-y-4'>

                            {/* ── Row 1: Identity + Category ── */}
                            <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                                <div className='md:col-span-1'>
                                    <label className={labelClass}>Tên tiếng Anh <span className='text-red-500'>*</span></label>
                                    <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                        className={inputClass} placeholder='Nhập tên bài tập (EN)' />
                                </div>
                                <div className='md:col-span-1'>
                                    <label className={labelClass}>Tên tiếng Việt</label>
                                    <input value={form.name_vi} onChange={e => setForm({ ...form, name_vi: e.target.value })}
                                        className={inputClass} placeholder='Nhập tên bài tập (VI)' />
                                </div>
                                <div className='md:col-span-1'>
                                    <label className={labelClass}>Loại hình <span className='text-red-500'>*</span></label>
                                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className={inputClass}>
                                        <option value='strength'>Sức mạnh</option>
                                        <option value='cardio'>Tim mạch</option>
                                        <option value='stretching'>Giãn cơ</option>
                                        <option value='plyometrics'>Bật nhảy</option>
                                    </select>
                                </div>
                            </div>

                            {/* ── Row 2: Equipment (left) | Muscle Groups (right) ── */}
                            <div className='grid grid-cols-1 md:grid-cols-5 gap-3'>
                                {/* Left 40%: Equipment */}
                                <div className='md:col-span-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 p-3'>
                                    <p className='text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-1'><FaDumbbell className='shrink-0' size={12} aria-hidden /> Thiết bị</p>
                                    <div className='flex flex-wrap gap-1.5'>
                                        {allEquipment.map(eq => (
                                            <button key={eq._id} type='button' onClick={() => toggleArrayItem('equipment_ids', eq._id)}
                                                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${form.equipment_ids.includes(eq._id)
                                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-indigo-400 hover:text-indigo-600'}`}>
                                                {eq.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Right 60%: Muscle Groups */}
                                <div className='md:col-span-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 p-3'>
                                    <p className='text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest mb-2 flex items-center gap-1'><GiBiceps className='shrink-0' size={12} aria-hidden /> Nhóm cơ</p>
                                    <div className='flex flex-wrap gap-1.5'>
                                        {allMuscleGroups.map(mg => (
                                            <button key={mg._id} type='button' onClick={() => toggleArrayItem('muscle_group_ids', mg._id)}
                                                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${form.muscle_group_ids.includes(mg._id)
                                                    ? 'bg-violet-600 text-white border-violet-600 shadow-sm' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-violet-400 hover:text-violet-600'}`}>
                                                {mg.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* ── Row 3: Instructions (left) | Tips + Video (right) ── */}
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                                <div>
                                    <label className={`${labelClass} inline-flex items-center gap-1.5`}><FaListOl className='text-slate-400 shrink-0' size={13} aria-hidden /> Hướng dẫn <span className='text-slate-400 font-normal'>(mỗi bước 1 dòng)</span></label>
                                    <textarea value={form.instructions} onChange={e => setForm({ ...form, instructions: e.target.value })}
                                        rows={4} className={inputClass} placeholder={'Bước 1: ...\nBước 2: ...\nBước 3: ...'} />
                                </div>
                                <div className='flex flex-col gap-2'>
                                    <div>
                                        <label className={`${labelClass} inline-flex items-center gap-1.5`}><FaLightbulb className='text-amber-500 shrink-0' size={13} aria-hidden /> Mẹo / lưu ý</label>
                                        <textarea value={form.tips} onChange={e => setForm({ ...form, tips: e.target.value })}
                                            rows={2} className={inputClass} placeholder='Nhập lưu ý...' />
                                    </div>
                                    <div>
                                        <label className={`${labelClass} inline-flex items-center gap-1.5`}><FaLink className='text-slate-400 shrink-0' size={13} aria-hidden /> URL video</label>
                                        <input value={form.video_url} onChange={e => setForm({ ...form, video_url: e.target.value })}
                                            className={inputClass} placeholder='https://youtube.com/...' />
                                    </div>
                                </div>
                            </div>

                            {/* Thời gian thực hiện (dùng trên app User: cổng chờ theo rep × giây/rep; nghỉ giữa set) */}
                            <div className='bg-amber-50/80 dark:bg-amber-900/15 rounded-xl border border-amber-200/80 dark:border-amber-800/40 p-3'>
                                <p className='text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-1.5'>
                                    <FaStopwatch className='shrink-0' size={12} aria-hidden /> Nhịp tập (app người dùng)
                                </p>
                                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                                    <div>
                                        <label className={labelClass}>Giây mỗi rep</label>
                                        <input type='number' min={SEC_PER_REP_MIN} max={SEC_PER_REP_MAX} step={1}
                                            value={form.duration_default}
                                            onChange={e => setForm({ ...form, duration_default: e.target.value })}
                                            onBlur={() => setForm(f => {
                                                const v = parseSecPerRepInput(f.duration_default)
                                                return {
                                                    ...f,
                                                    duration_default: v !== null ? v : SEC_PER_REP_MIN
                                                }
                                            })}
                                            className={inputClass}
                                            placeholder='3' />
                                        <p className='text-[10px] text-slate-500 dark:text-slate-400 mt-1'>Số nguyên {SEC_PER_REP_MIN}–{SEC_PER_REP_MAX}: mỗi rep phải chờ đủ khoảng này trước khi hoàn thành set.</p>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Nghỉ giữa các set (giây)</label>
                                        <input type='number' min={0} max={REST_SEC_MAX} step={1}
                                            value={form.rest_time_default}
                                            onChange={e => setForm({ ...form, rest_time_default: e.target.value })}
                                            onBlur={() => setForm(f => {
                                                const ok = parseRestSecInput(f.rest_time_default)
                                                if (ok !== null) return { ...f, rest_time_default: ok }
                                                const n = parseInt(String(f.rest_time_default).trim(), 10)
                                                return {
                                                    ...f,
                                                    rest_time_default: Number.isFinite(n) ? Math.max(0, Math.min(REST_SEC_MAX, n)) : 0
                                                }
                                            })}
                                            className={inputClass}
                                            placeholder='0' />
                                        <p className='text-[10px] text-slate-500 dark:text-slate-400 mt-1'>0 = không bắt buộc nghỉ giữa các set.</p>
                                    </div>
                                </div>
                            </div>

                            {/* ── Row 4: Default Sets (full width) ── */}
                            <div className='bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 p-3'>
                                <div className='flex items-center justify-between mb-2'>
                                    <p className='text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1'><FaListOl className='shrink-0' size={12} aria-hidden /> Set tập mặc định</p>
                                    <span className='text-[10px] text-slate-400'>Độ khó: <strong className='text-slate-600 dark:text-slate-300'>{DIFFICULTY_CONFIG[form.difficulty]?.label || form.difficulty}</strong></span>
                                </div>
                                <DefaultSetsEditor
                                    sets={form.default_sets}
                                    onChange={(newSets) => setForm({ ...form, default_sets: newSets })}
                                    onDifficultyChange={(d) => setForm(prev => ({ ...prev, difficulty: d }))}
                                />
                            </div>
                        </div>

                        {/* Modal footer */}
                        <div className='flex gap-2 px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex-shrink-0'>
                            <button onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending}
                                className='flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-indigo-500/25 active:scale-95 transition-all disabled:opacity-50'>
                                <FaSave /> {editingId ? 'Cập nhật' : 'Tạo bài tập'}
                            </button>
                            <button onClick={resetForm}
                                className='flex items-center gap-1.5 px-5 py-2.5 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-600 transition-all'>
                                <FaTimes /> Hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Table ── */}
            {isLoading ? (
                <div className='flex justify-center py-16'>
                    <div className='w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin'></div>
                </div>
            ) : exercises.length === 0 ? (
                <div className='text-center py-16 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700'>
                    <GiBiceps className='mx-auto text-5xl text-gray-300 mb-3' />
                    <p className='text-gray-400 text-sm'>
                        {status === 'deleted'
                            ? 'Không có bài tập nào đã xóa'
                            : `Không tìm thấy bài tập nào${search ? ` khớp "${search}"` : ''}`}
                    </p>
                </div>
            ) : (
                <div className='bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-slate-700'>
                    <div className='overflow-x-auto'>
                        <table className='w-full divide-y divide-gray-100 dark:divide-slate-700'>
                            <thead className='bg-gray-50 dark:bg-slate-900'>
                                <tr>
                                    {['Bài tập', 'Loại hình', 'Độ khó', 'Sets × Reps', 's/rep · nghỉ', 'Nhóm cơ', 'Thiết bị', 'Hành động'].map(h => (
                                        <th key={h} className='px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider'>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-gray-50 dark:divide-slate-700'>
                                {exercises.map(ex => {
                                    const cat = CATEGORY_CONFIG[ex.category] || CATEGORY_CONFIG.strength
                                    const diff = DIFFICULTY_CONFIG[ex.difficulty] || DIFFICULTY_CONFIG.intermediate
                                    const sets = ex.default_sets || []
                                    const equipList = (ex.equipment_ids || []).filter(e => typeof e === 'object')
                                    const muscleList = (ex.muscle_group_ids || []).filter(m => typeof m === 'object')
                                    const dRep = Number(ex.duration_default)
                                    const dRest = Number(ex.rest_time_default)
                                    const repSec = Number.isFinite(dRep) && dRep >= SEC_PER_REP_MIN ? Math.round(dRep) : SEC_PER_REP_MIN
                                    const restSec = Number.isFinite(dRest) && dRest >= 0 ? Math.round(dRest) : 0
                                    return (
                                        <tr key={ex._id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${status === 'deleted' ? 'opacity-70' : ''}`}>
                                            <td className='px-5 py-3'>
                                                <div className='flex items-center gap-2'>
                                                    <div className={`w-2 h-8 rounded-full flex-shrink-0 ${cat.bar}`} />
                                                    <div>
                                                        <p className='font-semibold text-sm text-slate-800 dark:text-slate-100'>{ex.name}</p>
                                                        {ex.name_vi && <p className='text-xs text-slate-400'>{ex.name_vi}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className='px-5 py-3'>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${cat.color}`}>{cat.label}</span>
                                            </td>
                                            <td className='px-5 py-3'>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${diff.color}`}>{diff.label}</span>
                                            </td>
                                            <td className='px-5 py-3 text-sm text-slate-500'>
                                                {sets.length > 0 ? `${sets.length} × ${sets[0]?.reps} reps` : '—'}
                                            </td>
                                            <td className='px-5 py-3 text-xs text-slate-600 dark:text-slate-300 tabular-nums'>
                                                <span className='font-semibold text-amber-700 dark:text-amber-400'>{repSec}</span>
                                                <span className='text-slate-400'>s/rep</span>
                                                <span className='text-slate-300 dark:text-slate-600 mx-1'>·</span>
                                                <span className='font-medium'>{restSec}s</span>
                                            </td>
                                            <td className='px-5 py-3'>
                                                <div className='flex flex-wrap gap-1'>
                                                    {muscleList.slice(0, 2).map(m => (
                                                        <span key={m._id} className='px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400'>{m.name}</span>
                                                    ))}
                                                    {muscleList.length > 2 && <span className='text-[10px] text-slate-400'>+{muscleList.length - 2}</span>}
                                                </div>
                                            </td>
                                            <td className='px-5 py-3'>
                                                <div className='flex flex-wrap gap-1'>
                                                    {equipList.slice(0, 2).map(e => (
                                                        <span key={e._id} className='px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'>{e.name}</span>
                                                    ))}
                                                    {equipList.length > 2 && <span className='text-[10px] text-slate-400'>+{equipList.length - 2}</span>}
                                                </div>
                                            </td>
                                            <td className='px-5 py-3'>
                                                <div className='flex items-center gap-1.5'>
                                                    {status === 'deleted' ? (
                                                        <button onClick={() => restoreMut.mutate(ex._id)}
                                                            disabled={restoreMut.isPending}
                                                            className='flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 text-xs font-medium hover:bg-emerald-100 transition-colors disabled:opacity-50'>
                                                            <FaUndo className='text-[10px]' /> Khôi phục
                                                        </button>
                                                    ) : (
                                                        <>
                                                            <button onClick={() => startEdit(ex)} title='Sửa'
                                                                className='flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-100 transition-colors'>
                                                                <FaEdit className='text-xs' />
                                                            </button>
                                                            <button onClick={() => handleDeleteClick(ex)}
                                                                className='flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 text-xs font-medium hover:bg-red-100 transition-colors'>
                                                                <FaTrash className='text-[10px]' />
                                                            </button>
                                                        </>
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

            {/* ── Pagination ── */}
            <TablePagination page={page} totalPages={totalPages} onPageChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />
        </div>
    )
}

// ===================== MAIN EXPORT =====================
export default function WorkoutManagement({ mode = 'equipment' }) {
    return (
        <>
            {mode === 'equipment' && <EquipmentManager />}
            {mode === 'exercises' && <ExerciseManager />}
        </>
    )
}
