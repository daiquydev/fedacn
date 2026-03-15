import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { FaDumbbell, FaPlus, FaEdit, FaTrash, FaTimes, FaSave, FaCopy, FaMagic, FaSearch, FaToggleOn, FaToggleOff, FaCheckCircle, FaTimesCircle } from 'react-icons/fa'
import CloudinaryImageUploader from '../../components/GlobalComponents/CloudinaryImageUploader'
import {
    adminGetEquipment, adminCreateEquipment, adminUpdateEquipment, adminDeleteEquipment,
    adminGetMuscleGroups,
    adminGetExercises, adminCreateExercise, adminUpdateExercise, adminDeleteExercise
} from '../../apis/workoutApi'

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

// ===================== EQUIPMENT MANAGEMENT =====================
function EquipmentManager() {
    const qc = useQueryClient()
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [search, setSearch] = useState('')
    const [form, setForm] = useState({ name: '', name_en: '', image_url: '', description: '', is_active: true })

    const { data, isLoading } = useQuery({ queryKey: ['admin-equipment'], queryFn: adminGetEquipment, staleTime: 60000 })
    const items = data?.data?.result || []

    const filteredItems = items.filter(item =>
        !search || item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.name_en?.toLowerCase().includes(search.toLowerCase()) ||
        item.description?.toLowerCase().includes(search.toLowerCase())
    )

    const activeCount = items.filter(i => i.is_active !== false).length

    const createMut = useMutation({
        mutationFn: (d) => adminCreateEquipment(d),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-equipment'] }); toast.success('Tạo thành công'); resetForm() },
        onError: () => toast.error('Lỗi tạo thiết bị')
    })
    const updateMut = useMutation({
        mutationFn: ({ id, d }) => adminUpdateEquipment(id, d),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-equipment'] }); toast.success('Cập nhật thành công'); resetForm() },
        onError: () => toast.error('Lỗi cập nhật')
    })
    const deleteMut = useMutation({
        mutationFn: (id) => adminDeleteEquipment(id),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-equipment'] }); toast.success('Xóa thành công') },
        onError: () => toast.error('Lỗi xóa')
    })
    const toggleActiveMut = useMutation({
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
        // Scroll to top of form
        setTimeout(() => document.getElementById('equipment-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    }
    const handleSubmit = () => {
        if (!form.name || !form.name_en) return toast.error('Tên không được để trống')
        editingId ? updateMut.mutate({ id: editingId, d: form }) : createMut.mutate(form)
    }

    return (
        <div>
            {/* Header with stats */}
            <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5'>
                <div>
                    <h3 className='text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100'>
                        <div className='w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30'>
                            <FaDumbbell className='text-white text-sm' />
                        </div>
                        Quản lý Thiết bị
                    </h3>
                    <div className='flex items-center gap-3 mt-1.5'>
                        <span className='text-xs text-slate-500 flex items-center gap-1'>
                            <span className='inline-block w-2 h-2 rounded-full bg-blue-500'></span>
                            Tổng: <strong className='text-slate-700 dark:text-slate-300'>{items.length}</strong>
                        </span>
                        <span className='text-xs text-slate-500 flex items-center gap-1'>
                            <span className='inline-block w-2 h-2 rounded-full bg-emerald-500'></span>
                            Hoạt động: <strong className='text-emerald-600'>{activeCount}</strong>
                        </span>
                        <span className='text-xs text-slate-500 flex items-center gap-1'>
                            <span className='inline-block w-2 h-2 rounded-full bg-slate-400'></span>
                            Ẩn: <strong className='text-slate-500'>{items.length - activeCount}</strong>
                        </span>
                    </div>
                </div>
                <div className='flex items-center gap-2'>
                    <div className='relative'>
                        <FaSearch className='absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs' />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder='Tìm thiết bị...'
                            className='pl-8 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none transition-all w-52' />
                    </div>
                    <button onClick={() => { resetForm(); setShowForm(true) }}
                        className='flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-blue-500/30 active:scale-95 transition-all'>
                        <FaPlus className='text-xs' /> Thêm mới
                    </button>
                </div>
            </div>

            {/* Form */}
            {showForm && (
                <div id='equipment-form' className='mb-6 p-5 bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-800/80 dark:to-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm'>
                    <h4 className='font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2'>
                        <span className='text-lg'>{editingId ? '✏️' : '✨'}</span>
                        {editingId ? 'Chỉnh sửa thiết bị' : 'Thêm thiết bị mới'}
                    </h4>
                    <div className='flex gap-5'>
                        {/* Left: Square image uploader */}
                        <div className='w-44 shrink-0'>
                            <CloudinaryImageUploader
                                value={form.image_url}
                                onChange={(url) => setForm({ ...form, image_url: url })}
                                label='Hình ảnh'
                                folder='equipment'
                                square
                            />
                        </div>
                        {/* Right: Text fields stacked */}
                        <div className='flex-1 space-y-3'>
                            <div>
                                <label className='block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide'>Tên tiếng Việt *</label>
                                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                    className='w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none transition-all'
                                    placeholder='VD: Tạ tay' />
                            </div>
                            <div>
                                <label className='block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide'>Tên tiếng Anh *</label>
                                <input value={form.name_en} onChange={e => setForm({ ...form, name_en: e.target.value })}
                                    className='w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none transition-all'
                                    placeholder='VD: Dumbbell' />
                            </div>
                            <div>
                                <label className='block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide'>Mô tả</label>
                                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                                    className='w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none transition-all'
                                    placeholder='Mô tả ngắn về thiết bị' />
                            </div>
                        </div>
                    </div>

                    {/* Status toggle */}
                    <div className='flex items-center justify-end mt-4'>
                        <button type='button' onClick={() => setForm({ ...form, is_active: !form.is_active })}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${form.is_active
                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                                }`}>
                            {form.is_active ? <FaToggleOn className='text-lg text-emerald-500' /> : <FaToggleOff className='text-lg text-slate-400' />}
                            {form.is_active ? 'Đang hoạt động' : 'Đã ẩn'}
                        </button>
                    </div>

                    <div className='flex gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700'>
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
            )}

            {/* Equipment Cards Grid */}
            {isLoading ? (
                <div className='flex items-center justify-center py-12'>
                    <div className='flex flex-col items-center gap-3'>
                        <div className='w-10 h-10 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin'></div>
                        <p className='text-sm text-slate-500'>Đang tải thiết bị...</p>
                    </div>
                </div>
            ) : filteredItems.length === 0 ? (
                <div className='text-center py-12'>
                    <span className='text-4xl mb-3 block'>🔍</span>
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

                                {/* Top gradient bar */}
                                <div className={`h-1.5 bg-gradient-to-r ${gradient}`}></div>

                                <div className='p-4'>
                                    {/* Icon + Name */}
                                    <div className='flex items-start gap-3'>
                                        <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}
                                            style={{ boxShadow: `0 4px 14px -3px rgba(0,0,0,0.15)` }}>
                                            {item.image_url
                                                ? <img src={item.image_url} alt={item.name} className='w-8 h-8 object-contain' />
                                                : <FaDumbbell className='text-white text-lg' />
                                            }
                                        </div>
                                        <div className='flex-1 min-w-0'>
                                            <h4 className='font-bold text-slate-800 dark:text-slate-100 text-sm truncate'>{item.name}</h4>
                                            <p className='text-xs text-slate-400 dark:text-slate-500 font-medium truncate'>{item.name_en}</p>
                                        </div>
                                        {/* Status badge */}
                                        <button onClick={() => toggleActiveMut.mutate({ id: item._id, is_active: !isActive })}
                                            title={isActive ? 'Đang hoạt động — Nhấn để ẩn' : 'Đã ẩn — Nhấn để kích hoạt'}
                                            className='flex-shrink-0 transition-all hover:scale-110'>
                                            {isActive ? (
                                                <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold'>
                                                    <FaCheckCircle className='text-[8px]' /> Active
                                                </span>
                                            ) : (
                                                <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 text-[10px] font-semibold'>
                                                    <FaTimesCircle className='text-[8px]' /> Ẩn
                                                </span>
                                            )}
                                        </button>
                                    </div>

                                    {/* Description */}
                                    {item.description && (
                                        <p className='mt-2.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed'>
                                            {item.description}
                                        </p>
                                    )}

                                    {/* Actions */}
                                    <div className='flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50'>
                                        <button onClick={() => startEdit(item)}
                                            className='flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors'>
                                            <FaEdit className='text-[10px]' /> Sửa
                                        </button>
                                        <button onClick={() => window.confirm(`Xóa thiết bị "${item.name}"?`) && deleteMut.mutate(item._id)}
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
                        <FaMagic className='inline mr-0.5' />TB (4×10)
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
    cardio: { label: 'Cardio', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', bar: 'bg-red-500', dot: 'bg-red-500' },
    stretching: { label: 'Giãn cơ', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', bar: 'bg-green-500', dot: 'bg-green-500' },
    plyometrics: { label: 'Bật nhảy', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', bar: 'bg-orange-500', dot: 'bg-orange-500' }
}
const DIFFICULTY_CONFIG = {
    beginner: { label: 'Dễ', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    intermediate: { label: 'Trung bình', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    expert: { label: 'Khó', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
}

function ExerciseManager() {
    const qc = useQueryClient()
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [search, setSearch] = useState('')
    const [filterCat, setFilterCat] = useState('')
    const [filterDiff, setFilterDiff] = useState('')
    const [page, setPage] = useState(1)
    const initForm = {
        name: '', name_vi: '', description: '', instructions: '', tips: '', video_url: '', image_url: '',
        category: 'strength', difficulty: 'intermediate',
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
        queryKey: ['admin-exercises', search, filterCat, filterDiff, page],
        queryFn: () => adminGetExercises({ search, category: filterCat, difficulty: filterDiff, page, limit: 20 }),
        staleTime: 60000
    })
    const result = data?.data?.result || {}
    const exercises = result.exercises || []
    const total = result.total || 0

    const { data: eqData } = useQuery({ queryKey: ['admin-equipment'], queryFn: adminGetEquipment, staleTime: 60000 })
    const { data: mgData } = useQuery({ queryKey: ['admin-muscle-groups'], queryFn: adminGetMuscleGroups, staleTime: 60000 })
    const allEquipment = eqData?.data?.result || []
    const allMuscleGroups = mgData?.data?.result || []

    const createMut = useMutation({
        mutationFn: (d) => adminCreateExercise(d),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-exercises'] }); toast.success('Tạo bài tập thành công'); resetForm() },
        onError: () => toast.error('Lỗi tạo bài tập')
    })
    const updateMut = useMutation({
        mutationFn: ({ id, d }) => adminUpdateExercise(id, d),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-exercises'] }); toast.success('Cập nhật thành công'); resetForm() },
        onError: () => toast.error('Lỗi cập nhật')
    })
    const deleteMut = useMutation({
        mutationFn: (id) => adminDeleteExercise(id),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-exercises'] }); toast.success('Xóa thành công') },
        onError: () => toast.error('Lỗi xóa')
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
            ]
        })
        setEditingId(ex._id); setShowForm(true)
        setTimeout(() => document.getElementById('exercise-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    }
    const handleSubmit = () => {
        if (!form.name) return toast.error('Tên bài tập không được để trống')
        const payload = {
            ...form,
            instructions: form.instructions.split('\n').filter(Boolean),
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

    return (
        <div>
            {/* ── Header ── */}
            <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5'>
                <div>
                    <h3 className='text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100'>
                        <div className='w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30'>
                            <FaDumbbell className='text-white text-sm' />
                        </div>
                        Quản lý Bài tập
                    </h3>
                    <p className='text-xs text-slate-500 mt-1'>Tổng <strong className='text-slate-700 dark:text-slate-300'>{total}</strong> bài tập</p>
                </div>
                <button onClick={() => { resetForm(); setShowForm(true) }}
                    className='flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-indigo-500/30 active:scale-95 transition-all'>
                    <FaPlus className='text-xs' /> Thêm bài tập
                </button>
            </div>

            {/* ── Filter bar ── */}
            <div className='flex flex-wrap items-center gap-2 mb-5 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700'>
                <div className='relative flex-1 min-w-[160px]'>
                    <FaSearch className='absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs' />
                    <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
                        placeholder='Tìm tên bài tập...'
                        className='pl-7 pr-3 py-1.5 text-sm w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 outline-none transition-all' />
                </div>
                <select value={filterCat} onChange={e => { setFilterCat(e.target.value); setPage(1) }}
                    className='py-1.5 px-2 text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500/30 outline-none'>
                    <option value=''>Tất cả loại</option>
                    <option value='strength'>Sức mạnh</option>
                    <option value='cardio'>Cardio</option>
                    <option value='stretching'>Giãn cơ</option>
                    <option value='plyometrics'>Bật nhảy</option>
                </select>
                <select value={filterDiff} onChange={e => { setFilterDiff(e.target.value); setPage(1) }}
                    className='py-1.5 px-2 text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500/30 outline-none'>
                    <option value=''>Tất cả độ khó</option>
                    <option value='beginner'>Dễ</option>
                    <option value='intermediate'>Trung bình</option>
                    <option value='expert'>Khó</option>
                </select>
                {(search || filterCat || filterDiff) && (
                    <button onClick={() => { setSearch(''); setFilterCat(''); setFilterDiff(''); setPage(1) }}
                        className='text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'>
                        <FaTimes className='text-[10px]' /> Xóa bộ lọc
                    </button>
                )}
            </div>

            {/* ── Form ── */}
            {showForm && (
                <div id='exercise-form' className='mb-6 bg-gradient-to-br from-slate-50 to-indigo-50/20 dark:from-slate-800/80 dark:to-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden'>
                    {/* Form header */}
                    <div className='px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 flex items-center justify-between'>
                        <h4 className='font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2'>
                            <span>{editingId ? '✏️' : '✨'}</span>
                            {editingId ? 'Chỉnh sửa bài tập' : 'Thêm bài tập mới'}
                        </h4>
                        <button onClick={resetForm} className='p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-colors'><FaTimes /></button>
                    </div>

                    <div className='p-6 max-h-[75vh] overflow-y-auto space-y-5'>
                        {/* Section: Basic Info */}
                        <div>
                            <p className='text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3'>📝 Thông tin cơ bản</p>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                                <div>
                                    <label className={labelClass}>Tên tiếng Anh *</label>
                                    <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder='VD: Dumbbell Curl' />
                                </div>
                                <div>
                                    <label className={labelClass}>Tên tiếng Việt</label>
                                    <input value={form.name_vi} onChange={e => setForm({ ...form, name_vi: e.target.value })} className={inputClass} placeholder='VD: Cuốn tạ' />
                                </div>
                                <div className='md:col-span-2'>
                                    <label className={labelClass}>Mô tả</label>
                                    <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className={inputClass} />
                                </div>
                                <div className='md:col-span-2'>
                                    <label className={labelClass}>Hướng dẫn (mỗi bước 1 dòng)</label>
                                    <textarea value={form.instructions} onChange={e => setForm({ ...form, instructions: e.target.value })} rows={3}
                                        className={inputClass} placeholder={'Bước 1...\nBước 2...'} />
                                </div>
                                <div>
                                    <label className={labelClass}>Mẹo / Lưu ý</label>
                                    <input value={form.tips} onChange={e => setForm({ ...form, tips: e.target.value })} className={inputClass} placeholder='Lưu ý khi thực hiện' />
                                </div>
                                <div>
                                    <label className={labelClass}>URL Video</label>
                                    <input value={form.video_url} onChange={e => setForm({ ...form, video_url: e.target.value })} className={inputClass} placeholder='https://youtube.com/...' />
                                </div>
                            </div>
                        </div>

                        {/* Section: Category */}
                        <div className='bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4'>
                            <p className='text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3'>⚙️ Phân loại</p>
                            <div className='max-w-xs'>
                                <label className={labelClass}>Loại hình bài tập</label>
                                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className={inputClass}>
                                    <option value='strength'>Sức mạnh</option>
                                    <option value='cardio'>Cardio</option>
                                    <option value='stretching'>Giãn cơ</option>
                                    <option value='plyometrics'>Bật nhảy</option>
                                </select>
                                <p className='text-[10px] text-slate-400 mt-1'>Độ khó được tự động xác định từ Set tập mặc định bên dưới</p>
                            </div>
                        </div>

                        {/* Section: Equipment & Muscles */}
                        <div className='bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3'>
                            <p className='text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest'>🏋️ Thiết bị & Nhóm cơ</p>
                            <div>
                                <label className={labelClass}>Thiết bị sử dụng</label>
                                <div className='flex flex-wrap gap-1.5 mt-1'>
                                    {allEquipment.map(eq => (
                                        <button key={eq._id} type='button' onClick={() => toggleArrayItem('equipment_ids', eq._id)}
                                            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${form.equipment_ids.includes(eq._id)
                                                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
                                            {eq.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Nhóm cơ chính</label>
                                <div className='flex flex-wrap gap-1.5 mt-1'>
                                    {allMuscleGroups.map(mg => (
                                        <button key={mg._id} type='button' onClick={() => toggleArrayItem('muscle_group_ids', mg._id)}
                                            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${form.muscle_group_ids.includes(mg._id)
                                                ? 'bg-violet-600 text-white shadow-sm shadow-violet-500/30' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
                                            {mg.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Nhóm cơ phụ</label>
                                <div className='flex flex-wrap gap-1.5 mt-1'>
                                    {allMuscleGroups.map(mg => (
                                        <button key={mg._id} type='button' onClick={() => toggleArrayItem('secondary_muscle_ids', mg._id)}
                                            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${form.secondary_muscle_ids.includes(mg._id)
                                                ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
                                            {mg.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Section: Default Sets */}
                        <div className='bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4'>
                            <p className='text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2'>📊 Set tập mặc định</p>
                            <p className='text-[10px] text-slate-400 mb-2'>Chọn preset để tự động đặt độ khó: <strong className='text-slate-600 dark:text-slate-300'>{DIFFICULTY_CONFIG[form.difficulty]?.label || form.difficulty}</strong></p>
                            <DefaultSetsEditor
                                sets={form.default_sets}
                                onChange={(newSets) => setForm({ ...form, default_sets: newSets })}
                                onDifficultyChange={(d) => setForm(prev => ({ ...prev, difficulty: d }))}
                            />
                        </div>

                        {/* Submit */}
                        <div className='flex gap-2 pt-2'>
                            <button onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending}
                                className='flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-indigo-500/25 active:scale-95 transition-all disabled:opacity-50'>
                                <FaSave /> {editingId ? 'Cập nhật' : 'Tạo bài tập'}
                            </button>
                            <button onClick={resetForm}
                                className='flex items-center gap-1.5 px-5 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-all'>
                                <FaTimes /> Hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Exercise Card List ── */}
            {isLoading ? (
                <div className='flex justify-center py-12'>
                    <div className='flex flex-col items-center gap-3'>
                        <div className='w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin'></div>
                        <p className='text-sm text-slate-500'>Đang tải bài tập...</p>
                    </div>
                </div>
            ) : exercises.length === 0 ? (
                <div className='text-center py-12'>
                    <span className='text-4xl mb-3 block'>🔍</span>
                    <p className='text-slate-500'>Không tìm thấy bài tập nào</p>
                </div>
            ) : (
                <div className='space-y-2'>
                    {exercises.map(ex => {
                        const cat = CATEGORY_CONFIG[ex.category] || CATEGORY_CONFIG.strength
                        const diff = DIFFICULTY_CONFIG[ex.difficulty] || DIFFICULTY_CONFIG.intermediate
                        const sets = ex.default_sets || []
                        const equipList = (ex.equipment_ids || []).filter(e => typeof e === 'object')
                        const muscleList = (ex.muscle_group_ids || []).filter(m => typeof m === 'object')

                        return (
                            <div key={ex._id}
                                className='group bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 overflow-hidden hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800/50 transition-all duration-200'>
                                <div className='flex items-stretch'>
                                    {/* Left color bar */}
                                    <div className={`w-1 flex-shrink-0 ${cat.bar}`}></div>

                                    <div className='flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 min-w-0'>
                                        {/* Name block */}
                                        <div className='flex-1 min-w-0'>
                                            <div className='flex items-center gap-2 flex-wrap'>
                                                <span className='font-semibold text-slate-800 dark:text-slate-100 text-sm'>{ex.name}</span>
                                                {ex.name_vi && <span className='text-xs text-slate-400'>/ {ex.name_vi}</span>}
                                            </div>
                                            {/* Tags row */}
                                            <div className='flex items-center flex-wrap gap-1.5 mt-1.5'>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${cat.color}`}>{cat.label}</span>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${diff.color}`}>{diff.label}</span>
                                                {sets.length > 0 && (
                                                    <span className='inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'>
                                                        {sets.length} sets × {sets[0]?.reps} reps
                                                    </span>
                                                )}
                                            </div>
                                            {/* Equipment & Muscles */}
                                            {(equipList.length > 0 || muscleList.length > 0) && (
                                                <div className='flex items-center flex-wrap gap-x-3 gap-y-1 mt-1.5'>
                                                    {equipList.length > 0 && (
                                                        <span className='text-[10px] text-slate-400 flex items-center gap-1'>
                                                            <span className='font-medium text-slate-500'>🏋️</span>
                                                            {equipList.map(e => e.name).join(', ')}
                                                        </span>
                                                    )}
                                                    {muscleList.length > 0 && (
                                                        <span className='text-[10px] text-slate-400 flex items-center gap-1'>
                                                            <span className='font-medium text-slate-500'>💪</span>
                                                            {muscleList.map(m => m.name).join(', ')}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>


                                        {/* Actions */}
                                        <div className='flex items-center gap-1.5 flex-shrink-0'>
                                            <button onClick={() => startEdit(ex)}
                                                className='flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors'>
                                                <FaEdit className='text-[10px]' /> Sửa
                                            </button>
                                            <button onClick={() => window.confirm(`Xóa bài tập "${ex.name}"?`) && deleteMut.mutate(ex._id)}
                                                className='flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 text-xs font-medium hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors'>
                                                <FaTrash className='text-[10px]' />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Pagination */}
            {total > page * 20 && (
                <div className='mt-5 flex justify-center'>
                    <button onClick={() => setPage(p => p + 1)}
                        className='px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-medium hover:shadow-lg hover:shadow-indigo-500/25 active:scale-95 transition-all'>
                        Xem thêm ({total - page * 20} bài còn lại)
                    </button>
                </div>
            )}

            {/* Result count */}
            {!isLoading && exercises.length > 0 && (
                <p className='text-center text-xs text-slate-400 mt-3'>
                    Hiển thị {exercises.length} / {total} bài tập
                </p>
            )}
        </div>
    )
}

// ===================== MAIN EXPORT =====================
export default function WorkoutManagement() {
    const [activeTab, setActiveTab] = useState('equipment')

    const tabs = [
        { key: 'equipment', label: 'Thiết bị', emoji: '🏋️', desc: 'Quản lý dụng cụ tập luyện' },
        { key: 'exercises', label: 'Bài tập', emoji: '📋', desc: 'Quản lý danh sách bài tập' }
    ]

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900 py-4 px-4'>

            {/* ── Hero Banner ── */}
            <div className='relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-8 py-8 mb-6 shadow-xl'>
                <div className='relative z-10'>
                    <p className='text-white/70 text-sm font-medium mb-1'>FitConnect Admin</p>
                    <h1 className='text-3xl font-black text-white mb-2'>Quản lý Tập luyện</h1>
                    <p className='text-white/80 text-sm max-w-lg'>
                        Quản lý thiết bị tập luyện và danh sách bài tập trong hệ thống, bao gồm nhóm cơ và kcal tiêu thụ.
                    </p>

                    {/* Tab pills inside banner */}
                    <div className='flex gap-2 mt-5'>
                        {tabs.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === tab.key
                                    ? 'bg-white text-indigo-700 shadow-lg'
                                    : 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm'
                                    }`}
                            >
                                {tab.emoji} {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className='absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10' />
                <div className='absolute right-20 -bottom-8 w-32 h-32 rounded-full bg-white/10' />
                <FaDumbbell className='absolute right-8 top-8 text-white/10 text-[8rem]' />
            </div>

            {/* ── Tab Content ── */}
            <div>
                {activeTab === 'equipment' && <EquipmentManager />}
                {activeTab === 'exercises' && <ExerciseManager />}
            </div>
        </div>
    )
}

