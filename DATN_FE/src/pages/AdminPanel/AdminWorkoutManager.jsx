import { useSafeMutation } from '../../hooks/useSafeMutation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { FaDumbbell, FaPlus, FaEdit, FaTrash, FaTimes, FaSave, FaImage } from 'react-icons/fa'
import { GiMuscleUp } from 'react-icons/gi'
import {
    adminGetEquipment, adminCreateEquipment, adminUpdateEquipment, adminDeleteEquipment,
    adminGetMuscleGroups, adminCreateMuscleGroup, adminUpdateMuscleGroup, adminDeleteMuscleGroup,
    adminGetExercises, adminCreateExercise, adminUpdateExercise, adminDeleteExercise
} from '../../apis/adminWorkoutApi'

// ===================== EQUIPMENT MANAGEMENT =====================
function EquipmentManager() {
    const qc = useQueryClient()
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [form, setForm] = useState({ name: '', name_en: '', image_url: '', description: '' })

    const { data, isLoading } = useQuery({ queryKey: ['admin-equipment'], queryFn: adminGetEquipment })
    const items = data?.data?.result || []

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

    const resetForm = () => { setForm({ name: '', name_en: '', image_url: '', description: '' }); setEditingId(null); setShowForm(false) }
    const startEdit = (item) => { setForm({ name: item.name, name_en: item.name_en, image_url: item.image_url || '', description: item.description || '' }); setEditingId(item._id); setShowForm(true) }
    const handleSubmit = () => {
        if (!form.name || !form.name_en) return toast.error('Tên không được để trống')
        editingId ? updateMut.mutate({ id: editingId, d: form }) : createMut.mutate(form)
    }

    return (
        <div>
            <div className='flex items-center justify-between mb-4'>
                <h3 className='text-lg font-semibold flex items-center gap-2'><FaDumbbell className='text-blue-600' /> Quản lý Thiết bị</h3>
                <button onClick={() => { resetForm(); setShowForm(true) }} className='flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700'>
                    <FaPlus /> Thêm
                </button>
            </div>

            {showForm && (
                <div className='mb-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                        <div>
                            <label className='text-xs font-medium text-slate-500'>Tên (VN)</label>
                            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                className='w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm' placeholder='Tạ tay' />
                        </div>
                        <div>
                            <label className='text-xs font-medium text-slate-500'>Tên (EN - key)</label>
                            <input value={form.name_en} onChange={e => setForm({ ...form, name_en: e.target.value })}
                                className='w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm' placeholder='dumbbell' />
                        </div>
                        <div>
                            <label className='text-xs font-medium text-slate-500'><FaImage className='inline mr-1' />Đường dẫn ảnh</label>
                            <input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })}
                                className='w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm' placeholder='/images/equipment/dumbbell.png' />
                        </div>
                        <div>
                            <label className='text-xs font-medium text-slate-500'>Mô tả</label>
                            <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                                className='w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm' placeholder='Dumbbell' />
                        </div>
                    </div>
                    {form.image_url && (
                        <div className='mt-3 flex items-center gap-2'>
                            <span className='text-xs text-slate-500'>Xem trước:</span>
                            <img src={form.image_url} alt='preview' className='w-12 h-12 object-contain border rounded' />
                        </div>
                    )}
                    <div className='flex gap-2 mt-3'>
                        <button onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending}
                            className='flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm disabled:opacity-50'>
                            <FaSave /> {editingId ? 'Cập nhật' : 'Tạo mới'}
                        </button>
                        <button onClick={resetForm} className='px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg text-sm'>
                            <FaTimes className='inline mr-1' /> Hủy
                        </button>
                    </div>
                </div>
            )}

            {isLoading ? <p className='text-sm text-slate-500'>Đang tải...</p> : (
                <div className='overflow-x-auto'>
                    <table className='min-w-full text-sm'>
                        <thead className='text-left text-slate-500'>
                            <tr>
                                <th className='py-2 pr-3'>Ảnh</th>
                                <th className='py-2 pr-3'>Tên</th>
                                <th className='py-2 pr-3'>Key</th>
                                <th className='py-2 pr-3'>Mô tả</th>
                                <th className='py-2 pr-3'>Hành động</th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-slate-200 dark:divide-slate-800'>
                            {items.map(item => (
                                <tr key={item._id}>
                                    <td className='py-2 pr-3'>
                                        {item.image_url ? <img src={item.image_url} alt={item.name} className='w-10 h-10 object-contain' /> : <span className='text-slate-400'>—</span>}
                                    </td>
                                    <td className='py-2 pr-3 font-medium'>{item.name}</td>
                                    <td className='py-2 pr-3 font-mono text-xs'>{item.name_en}</td>
                                    <td className='py-2 pr-3 text-slate-500 max-w-xs truncate'>{item.description}</td>
                                    <td className='py-2 pr-3 space-x-2'>
                                        <button onClick={() => startEdit(item)} className='px-2 py-1 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 text-xs'>
                                            <FaEdit className='inline mr-1' />Sửa
                                        </button>
                                        <button onClick={() => window.confirm('Xóa thiết bị này?') && deleteMut.mutate(item._id)}
                                            className='px-2 py-1 rounded bg-red-100 dark:bg-red-900/30 text-red-600 text-xs'>
                                            <FaTrash className='inline mr-1' />Xóa
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

// ===================== MUSCLE GROUP MANAGEMENT =====================
function MuscleGroupManager() {
    const qc = useQueryClient()
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [form, setForm] = useState({ name: '', name_en: '', body_part_ids: '', description: '' })

    const { data, isLoading } = useQuery({ queryKey: ['admin-muscle-groups'], queryFn: adminGetMuscleGroups })
    const items = data?.data?.result || []

    const createMut = useSafeMutation({
        mutationFn: (d) => adminCreateMuscleGroup({ ...d, body_part_ids: d.body_part_ids.split(',').map(s => s.trim()).filter(Boolean) }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-muscle-groups'] }); toast.success('Tạo thành công'); resetForm() },
        onError: () => toast.error('Lỗi tạo nhóm cơ')
    })
    const updateMut = useSafeMutation({
        mutationFn: ({ id, d }) => adminUpdateMuscleGroup(id, { ...d, body_part_ids: d.body_part_ids.split(',').map(s => s.trim()).filter(Boolean) }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-muscle-groups'] }); toast.success('Cập nhật thành công'); resetForm() },
        onError: () => toast.error('Lỗi cập nhật')
    })
    const deleteMut = useSafeMutation({
        mutationFn: (id) => adminDeleteMuscleGroup(id),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-muscle-groups'] }); toast.success('Xóa thành công') },
        onError: () => toast.error('Lỗi xóa')
    })

    const resetForm = () => { setForm({ name: '', name_en: '', body_part_ids: '', description: '' }); setEditingId(null); setShowForm(false) }
    const startEdit = (item) => {
        setForm({ name: item.name, name_en: item.name_en, body_part_ids: (item.body_part_ids || []).join(', '), description: item.description || '' })
        setEditingId(item._id); setShowForm(true)
    }
    const handleSubmit = () => {
        if (!form.name || !form.name_en) return toast.error('Tên không được để trống')
        editingId ? updateMut.mutate({ id: editingId, d: form }) : createMut.mutate(form)
    }

    return (
        <div>
            <div className='flex items-center justify-between mb-4'>
                <h3 className='text-lg font-semibold flex items-center gap-2'><GiMuscleUp className='text-purple-600' /> Quản lý Nhóm cơ</h3>
                <button onClick={() => { resetForm(); setShowForm(true) }} className='flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700'>
                    <FaPlus /> Thêm
                </button>
            </div>

            {showForm && (
                <div className='mb-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                        <div>
                            <label className='text-xs font-medium text-slate-500'>Tên (VN)</label>
                            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                className='w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm' placeholder='Ngực' />
                        </div>
                        <div>
                            <label className='text-xs font-medium text-slate-500'>Tên (EN - key)</label>
                            <input value={form.name_en} onChange={e => setForm({ ...form, name_en: e.target.value })}
                                className='w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm' placeholder='chest' />
                        </div>
                        <div>
                            <label className='text-xs font-medium text-slate-500'>Body Part IDs (SVG, cách nhau bởi dấu phẩy)</label>
                            <input value={form.body_part_ids} onChange={e => setForm({ ...form, body_part_ids: e.target.value })}
                                className='w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm' placeholder='chest' />
                        </div>
                        <div>
                            <label className='text-xs font-medium text-slate-500'>Mô tả</label>
                            <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                                className='w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm' placeholder='Cơ ngực trước' />
                        </div>
                    </div>
                    <div className='flex gap-2 mt-3'>
                        <button onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending}
                            className='flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm disabled:opacity-50'>
                            <FaSave /> {editingId ? 'Cập nhật' : 'Tạo mới'}
                        </button>
                        <button onClick={resetForm} className='px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg text-sm'>
                            <FaTimes className='inline mr-1' /> Hủy
                        </button>
                    </div>
                </div>
            )}

            {isLoading ? <p className='text-sm text-slate-500'>Đang tải...</p> : (
                <div className='overflow-x-auto'>
                    <table className='min-w-full text-sm'>
                        <thead className='text-left text-slate-500'>
                            <tr>
                                <th className='py-2 pr-3'>Tên</th>
                                <th className='py-2 pr-3'>Key</th>
                                <th className='py-2 pr-3'>Body Part IDs</th>
                                <th className='py-2 pr-3'>Mô tả</th>
                                <th className='py-2 pr-3'>Hành động</th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-slate-200 dark:divide-slate-800'>
                            {items.map(item => (
                                <tr key={item._id}>
                                    <td className='py-2 pr-3 font-medium'>{item.name}</td>
                                    <td className='py-2 pr-3 font-mono text-xs'>{item.name_en}</td>
                                    <td className='py-2 pr-3 text-xs'>{(item.body_part_ids || []).join(', ')}</td>
                                    <td className='py-2 pr-3 text-slate-500 max-w-xs truncate'>{item.description}</td>
                                    <td className='py-2 pr-3 space-x-2'>
                                        <button onClick={() => startEdit(item)} className='px-2 py-1 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 text-xs'>
                                            <FaEdit className='inline mr-1' />Sửa
                                        </button>
                                        <button onClick={() => window.confirm('Xóa nhóm cơ này?') && deleteMut.mutate(item._id)}
                                            className='px-2 py-1 rounded bg-red-100 dark:bg-red-900/30 text-red-600 text-xs'>
                                            <FaTrash className='inline mr-1' />Xóa
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

// ===================== EXERCISE MANAGEMENT =====================
function ExerciseManager() {
    const qc = useQueryClient()
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const initForm = {
        name: '', name_vi: '', description: '', instructions: '', tips: '', video_url: '', image_url: '',
        category: 'strength', difficulty: 'intermediate',
        duration_default: 45, rest_time_default: 60, equipment_ids: [], muscle_group_ids: [], secondary_muscle_ids: []
    }
    const [form, setForm] = useState(initForm)

    const { data, isLoading } = useQuery({
        queryKey: ['admin-exercises', search, page],
        queryFn: () => adminGetExercises({ search, page, limit: 20 })
    })
    const result = data?.data?.result || {}
    const exercises = result.exercises || []
    const total = result.total || 0

    // Fetch equipment and muscle groups for dropdowns
    const { data: eqData } = useQuery({ queryKey: ['admin-equipment'], queryFn: adminGetEquipment })
    const { data: mgData } = useQuery({ queryKey: ['admin-muscle-groups'], queryFn: adminGetMuscleGroups })
    const allEquipment = eqData?.data?.result || []
    const allMuscleGroups = mgData?.data?.result || []

    const createMut = useSafeMutation({
        mutationFn: (d) => adminCreateExercise(d),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-exercises'] }); toast.success('Tạo bài tập thành công'); resetForm() },
        onError: () => toast.error('Lỗi tạo bài tập')
    })
    const updateMut = useSafeMutation({
        mutationFn: ({ id, d }) => adminUpdateExercise(id, d),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-exercises'] }); toast.success('Cập nhật thành công'); resetForm() },
        onError: () => toast.error('Lỗi cập nhật')
    })
    const deleteMut = useSafeMutation({
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
            duration_default: ex.duration_default || 45, rest_time_default: ex.rest_time_default || 60,
            equipment_ids: (ex.equipment_ids || []).map(e => typeof e === 'object' ? e._id : e),
            muscle_group_ids: (ex.muscle_group_ids || []).map(m => typeof m === 'object' ? m._id : m),
            secondary_muscle_ids: (ex.secondary_muscle_ids || []).map(m => typeof m === 'object' ? m._id : m)
        })
        setEditingId(ex._id); setShowForm(true)
    }
    const handleSubmit = () => {
        if (!form.name) return toast.error('Tên bài tập không được để trống')
        const payload = {
            ...form,
            instructions: form.instructions.split('\n').filter(Boolean),
            duration_default: Number(form.duration_default),
            rest_time_default: Number(form.rest_time_default)
        }
        editingId ? updateMut.mutate({ id: editingId, d: payload }) : createMut.mutate(payload)
    }

    const toggleArrayItem = (field, id) => {
        setForm(prev => ({
            ...prev,
            [field]: prev[field].includes(id) ? prev[field].filter(i => i !== id) : [...prev[field], id]
        }))
    }

    return (
        <div>
            <div className='flex items-center justify-between mb-4'>
                <h3 className='text-lg font-semibold flex items-center gap-2'><FaDumbbell className='text-green-600' /> Quản lý Bài tập ({total})</h3>
                <div className='flex gap-2'>
                    <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
                        placeholder='Tìm kiếm...' className='text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1' />
                    <button onClick={() => { resetForm(); setShowForm(true) }} className='flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700'>
                        <FaPlus /> Thêm
                    </button>
                </div>
            </div>

            {showForm && (
                <div className='mb-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 max-h-[70vh] overflow-y-auto'>
                    <h4 className='font-semibold mb-3'>{editingId ? 'Chỉnh sửa bài tập' : 'Thêm bài tập mới'}</h4>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                        <div>
                            <label className='text-xs font-medium text-slate-500'>Tên (EN)</label>
                            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                className='w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm' />
                        </div>
                        <div>
                            <label className='text-xs font-medium text-slate-500'>Tên (VN)</label>
                            <input value={form.name_vi} onChange={e => setForm({ ...form, name_vi: e.target.value })}
                                className='w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm' />
                        </div>
                        <div className='md:col-span-2'>
                            <label className='text-xs font-medium text-slate-500'>Mô tả</label>
                            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
                                className='w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm' />
                        </div>
                        <div className='md:col-span-2'>
                            <label className='text-xs font-medium text-slate-500'>Hướng dẫn (mỗi bước 1 dòng)</label>
                            <textarea value={form.instructions} onChange={e => setForm({ ...form, instructions: e.target.value })} rows={3}
                                className='w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm' placeholder={'Bước 1...\nBước 2...'} />
                        </div>
                        <div className='md:col-span-2'>
                            <label className='text-xs font-medium text-slate-500'>Lưu ý / Tips</label>
                            <input value={form.tips} onChange={e => setForm({ ...form, tips: e.target.value })}
                                className='w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm' />
                        </div>
                    </div>

                    {/* Equipment multi-select */}
                    <div className='mt-3'>
                        <label className='text-xs font-medium text-slate-500'>Thiết bị</label>
                        <div className='flex flex-wrap gap-2 mt-1'>
                            {allEquipment.map(eq => (
                                <button key={eq._id} onClick={() => toggleArrayItem('equipment_ids', eq._id)}
                                    className={`px-2 py-1 rounded-full text-xs ${form.equipment_ids.includes(eq._id)
                                        ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                                    {eq.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Muscle groups multi-select */}
                    <div className='mt-3'>
                        <label className='text-xs font-medium text-slate-500'>Nhóm cơ chính</label>
                        <div className='flex flex-wrap gap-2 mt-1'>
                            {allMuscleGroups.map(mg => (
                                <button key={mg._id} onClick={() => toggleArrayItem('muscle_group_ids', mg._id)}
                                    className={`px-2 py-1 rounded-full text-xs ${form.muscle_group_ids.includes(mg._id)
                                        ? 'bg-purple-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                                    {mg.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Secondary muscles multi-select */}
                    <div className='mt-3'>
                        <label className='text-xs font-medium text-slate-500'>Nhóm cơ phụ</label>
                        <div className='flex flex-wrap gap-2 mt-1'>
                            {allMuscleGroups.map(mg => (
                                <button key={mg._id} onClick={() => toggleArrayItem('secondary_muscle_ids', mg._id)}
                                    className={`px-2 py-1 rounded-full text-xs ${form.secondary_muscle_ids.includes(mg._id)
                                        ? 'bg-orange-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                                    {mg.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className='grid grid-cols-2 md:grid-cols-4 gap-3 mt-3'>
                        <div>
                            <label className='text-xs font-medium text-slate-500'>Loại</label>
                            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                                className='w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm'>
                                <option value='strength'>Strength</option>
                                <option value='cardio'>Cardio</option>
                                <option value='stretching'>Stretching</option>
                                <option value='plyometrics'>Plyometrics</option>
                            </select>
                        </div>
                        <div>
                            <label className='text-xs font-medium text-slate-500'>Độ khó</label>
                            <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}
                                className='w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm'>
                                <option value='beginner'>Beginner</option>
                                <option value='intermediate'>Intermediate</option>
                                <option value='expert'>Expert</option>
                            </select>
                        </div>
                        <div>
                            <label className='text-xs font-medium text-slate-500'>Thời gian mặc định (giây)</label>
                            <input type='number' value={form.duration_default} onChange={e => setForm({ ...form, duration_default: e.target.value })}
                                className='w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm' />
                        </div>
                        <div>
                            <label className='text-xs font-medium text-slate-500'>Nghỉ mặc định (giây)</label>
                            <input type='number' value={form.rest_time_default} onChange={e => setForm({ ...form, rest_time_default: e.target.value })}
                                className='w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm' />
                        </div>
                        <div>
                            <label className='text-xs font-medium text-slate-500'><FaImage className='inline mr-1' />Ảnh URL</label>
                            <input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })}
                                className='w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm' />
                        </div>
                        <div>
                            <label className='text-xs font-medium text-slate-500'>Video URL</label>
                            <input value={form.video_url} onChange={e => setForm({ ...form, video_url: e.target.value })}
                                className='w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm' />
                        </div>
                    </div>

                    {form.image_url && (
                        <div className='mt-3 flex items-center gap-2'>
                            <span className='text-xs text-slate-500'>Xem trước ảnh:</span>
                            <img src={form.image_url} alt='preview' className='w-16 h-16 object-contain border rounded' />
                        </div>
                    )}

                    <div className='flex gap-2 mt-3'>
                        <button onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending}
                            className='flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm disabled:opacity-50'>
                            <FaSave /> {editingId ? 'Cập nhật' : 'Tạo mới'}
                        </button>
                        <button onClick={resetForm} className='px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg text-sm'>
                            <FaTimes className='inline mr-1' /> Hủy
                        </button>
                    </div>
                </div>
            )}

            {isLoading ? <p className='text-sm text-slate-500'>Đang tải...</p> : (
                <div className='overflow-x-auto'>
                    <table className='min-w-full text-sm'>
                        <thead className='text-left text-slate-500'>
                            <tr>
                                <th className='py-2 pr-3'>Tên</th>
                                <th className='py-2 pr-3'>Tên VN</th>
                                <th className='py-2 pr-3'>Loại</th>
                                <th className='py-2 pr-3'>Độ khó</th>
                                <th className='py-2 pr-3'>Thiết bị</th>
                                <th className='py-2 pr-3'>Nhóm cơ</th>
                                <th className='py-2 pr-3'>Hành động</th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-slate-200 dark:divide-slate-800'>
                            {exercises.map(ex => (
                                <tr key={ex._id}>
                                    <td className='py-2 pr-3 font-medium max-w-[120px] truncate'>{ex.name}</td>
                                    <td className='py-2 pr-3 max-w-[120px] truncate'>{ex.name_vi}</td>
                                    <td className='py-2 pr-3'>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${ex.category === 'strength' ? 'bg-blue-100 text-blue-700' :
                                            ex.category === 'cardio' ? 'bg-red-100 text-red-700' :
                                                ex.category === 'stretching' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                            }`}>{ex.category}</span>
                                    </td>
                                    <td className='py-2 pr-3'>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${ex.difficulty === 'beginner' ? 'bg-emerald-100 text-emerald-700' :
                                            ex.difficulty === 'intermediate' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                            }`}>{ex.difficulty}</span>
                                    </td>
                                    <td className='py-2 pr-3 text-xs'>{ex.difficulty}</td>
                                    <td className='py-2 pr-3 text-xs max-w-[100px] truncate'>
                                        {(ex.equipment_ids || []).map(e => typeof e === 'object' ? e.name : e).join(', ')}
                                    </td>
                                    <td className='py-2 pr-3 text-xs max-w-[100px] truncate'>
                                        {(ex.muscle_group_ids || []).map(m => typeof m === 'object' ? m.name : m).join(', ')}
                                    </td>
                                    <td className='py-2 pr-3 space-x-1 whitespace-nowrap'>
                                        <button onClick={() => startEdit(ex)} className='px-2 py-1 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 text-xs'>
                                            <FaEdit className='inline' />
                                        </button>
                                        <button onClick={() => window.confirm('Xóa bài tập này?') && deleteMut.mutate(ex._id)}
                                            className='px-2 py-1 rounded bg-red-100 dark:bg-red-900/30 text-red-600 text-xs'>
                                            <FaTrash className='inline' />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {total > page * 20 && (
                        <div className='mt-3 flex justify-center'>
                            <button onClick={() => setPage(p => p + 1)} className='px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-sm'>
                                Xem thêm (trang {page + 1})
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// ===================== MAIN EXPORT =====================
export default function AdminWorkoutManager() {
    const [activeTab, setActiveTab] = useState('equipment')

    return (
        <div className='mt-8 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm'>
            <div className='flex items-center justify-between mb-5'>
                <h2 className='text-xl font-semibold flex items-center gap-2'>
                    <FaDumbbell className='text-blue-600' /> Quản lý Tập luyện
                </h2>
            </div>

            {/* Tabs */}
            <div className='flex gap-2 mb-5 border-b border-slate-200 dark:border-slate-700'>
                {[
                    { key: 'equipment', label: 'Thiết bị', icon: '🏋️' },
                    { key: 'muscles', label: 'Nhóm cơ', icon: '💪' },
                    { key: 'exercises', label: 'Bài tập', icon: '📋' }
                ].map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}>
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'equipment' && <EquipmentManager />}
            {activeTab === 'muscles' && <MuscleGroupManager />}
            {activeTab === 'exercises' && <ExerciseManager />}
        </div>
    )
}
