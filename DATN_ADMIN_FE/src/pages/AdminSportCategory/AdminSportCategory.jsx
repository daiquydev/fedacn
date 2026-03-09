import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FaPlus, FaEdit, FaTrash, FaDumbbell, FaRunning, FaHome, FaSync, FaTimes, FaUndo } from 'react-icons/fa'
import toast from 'react-hot-toast'
import sportCategoryApi from '../../apis/sportCategoryApi'
import Loading from '../../components/GlobalComponents/Loading'
import { useForm } from 'react-hook-form'

function MiniStatCard({ icon: Icon, label, value, color, iconBg }) {
    return (
        <div className={`bg-white dark:bg-gray-800 rounded-xl px-5 py-4 border-l-4 ${color} shadow-sm border border-gray-100 dark:border-gray-700`}>
            <div className='flex items-center justify-between'>
                <div>
                    <p className='text-xs text-gray-400 dark:text-gray-500 mb-1'>{label}</p>
                    <p className='text-2xl font-black text-gray-800 dark:text-white'>{value ?? 0}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
                    <Icon className='text-white text-base' />
                </div>
            </div>
        </div>
    )
}

export default function AdminSportCategory() {
    const queryClient = useQueryClient()
    const [modalOpen, setModalOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState(null)
    const [showDeleted, setShowDeleted] = useState(false)
    const { register, handleSubmit, reset, formState: { errors } } = useForm()

    const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
        queryKey: ['adminSportCategories'],
        queryFn: () => sportCategoryApi.getAll(),
        staleTime: 1000,
        retry: 2
    })

    const categories = data?.data?.result || []
    const activeCategories = categories.filter(c => !c.isDeleted)
    const deletedCategories = categories.filter(c => c.isDeleted)
    const outdoorCount = activeCategories.filter(c => c.type === 'Ngoài trời').length
    const indoorCount = activeCategories.filter(c => c.type === 'Trong nhà').length

    const displayCategories = showDeleted ? deletedCategories : activeCategories

    const createMutation = useMutation({
        mutationFn: (body) => sportCategoryApi.create(body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminSportCategories'] })
            toast.success('Thêm danh mục thành công!')
            closeModal()
        },
        onError: (err) => toast.error(err?.response?.data?.message || 'Có lỗi xảy ra khi thêm danh mục')
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, body }) => sportCategoryApi.update(id, body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminSportCategories'] })
            toast.success('Cập nhật danh mục thành công!')
            closeModal()
        },
        onError: (err) => toast.error(err?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật')
    })

    // Soft delete
    const deleteMutation = useMutation({
        mutationFn: (id) => sportCategoryApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminSportCategories'] })
            toast.success('Đã xóa danh mục!')
        },
        onError: (err) => toast.error(err?.response?.data?.message || 'Có lỗi xảy ra khi xóa')
    })

    // Restore
    const restoreMutation = useMutation({
        mutationFn: (id) => sportCategoryApi.restore(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminSportCategories'] })
            toast.success('Đã khôi phục danh mục!')
        },
        onError: (err) => toast.error(err?.response?.data?.message || 'Có lỗi xảy ra khi khôi phục')
    })

    const openModalConfig = (category = null) => {
        setEditingCategory(category)
        reset(category ? { name: category.name, type: category.type } : { name: '', type: 'Ngoài trời' })
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

    const handleDelete = (id, name) => {
        if (window.confirm(`Bạn có chắc muốn xóa danh mục "${name}" không? Danh mục sẽ bị ẩn khỏi hệ thống (có thể khôi phục).`)) {
            deleteMutation.mutate(id)
        }
    }

    const handleRestore = (id, name) => {
        if (window.confirm(`Khôi phục danh mục "${name}"?`)) {
            restoreMutation.mutate(id)
        }
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
                        className='mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm'
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900 py-4 px-4'>

            {/* ── Hero Banner ── */}
            <div className='relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-500 px-8 py-8 mb-6 shadow-xl'>
                <div className='relative z-10 flex items-start justify-between'>
                    <div>
                        <p className='text-white/70 text-sm font-medium mb-1'>FitConnect Admin</p>
                        <h1 className='text-3xl font-black text-white mb-2'>Danh mục Thể thao</h1>
                        <p className='text-white/80 text-sm max-w-md'>
                            Quản lý các môn thể thao và hoạt động phân theo loại hình trong nhà / ngoài trời.
                        </p>
                    </div>
                    <div className='flex items-center gap-2 mt-1 flex-wrap justify-end'>
                        <button
                            onClick={() => refetch()}
                            disabled={isFetching}
                            className='flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all disabled:opacity-50'
                        >
                            <FaSync size={13} className={isFetching ? 'animate-spin' : ''} />
                            Làm mới
                        </button>
                        <button
                            onClick={() => openModalConfig()}
                            className='flex items-center gap-2 bg-white text-indigo-700 font-bold text-sm px-4 py-2 rounded-xl hover:bg-indigo-50 transition-all shadow-lg shrink-0'
                        >
                            <FaPlus size={12} /> Thêm danh mục
                        </button>
                    </div>
                </div>
                <div className='absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10' />
                <div className='absolute right-20 -bottom-8 w-32 h-32 rounded-full bg-white/10' />
            </div>

            {/* ── Stat Cards ── */}
            <div className='grid grid-cols-2 xl:grid-cols-4 gap-3 mb-6'>
                <MiniStatCard icon={FaDumbbell} label='Đang hoạt động' value={activeCategories.length} color='border-l-indigo-400' iconBg='bg-gradient-to-br from-indigo-400 to-violet-600' />
                <MiniStatCard icon={FaRunning} label='Ngoài trời' value={outdoorCount} color='border-l-emerald-400' iconBg='bg-gradient-to-br from-emerald-400 to-green-600' />
                <MiniStatCard icon={FaHome} label='Trong nhà' value={indoorCount} color='border-l-blue-400' iconBg='bg-gradient-to-br from-blue-400 to-cyan-600' />
                <MiniStatCard icon={FaTrash} label='Đã xóa' value={deletedCategories.length} color='border-l-red-400' iconBg='bg-gradient-to-br from-red-400 to-rose-600' />
            </div>

            {/* ── Tab toggle: Active / Deleted ── */}
            <div className='flex items-center gap-2 mb-4'>
                <button
                    onClick={() => setShowDeleted(false)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${!showDeleted ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                >
                    ✅ Đang hoạt động ({activeCategories.length})
                </button>
                <button
                    onClick={() => setShowDeleted(true)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${showDeleted ? 'bg-red-600 text-white shadow-sm' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                >
                    🗑️ Đã xóa ({deletedCategories.length})
                </button>
            </div>

            {/* ── Table ── */}
            {isLoading ? (
                <Loading />
            ) : (
                <div className='bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-slate-700'>
                    <div className='px-4 py-3 border-b border-gray-100 dark:border-slate-700'>
                        <p className='text-sm text-gray-500 dark:text-gray-400'>
                            {showDeleted
                                ? <><span className='font-semibold text-red-600'>{deletedCategories.length}</span> danh mục đã xóa</>
                                : <><span className='font-semibold text-gray-800 dark:text-white'>{activeCategories.length}</span> danh mục đang hoạt động</>
                            }
                        </p>
                    </div>
                    <div className='overflow-x-auto'>
                        <table className='w-full divide-y divide-gray-100 dark:divide-slate-700'>
                            <thead className='bg-gray-50 dark:bg-slate-900'>
                                <tr>
                                    {['STT', 'Tên danh mục', 'Loại hình', 'Trạng thái', 'Hành động'].map(h => (
                                        <th key={h} className='px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-gray-50 dark:divide-slate-700'>
                                {displayCategories.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className='text-center py-16'>
                                            <FaDumbbell className='mx-auto text-4xl text-gray-300 mb-3' />
                                            <p className='text-gray-400 text-sm'>
                                                {showDeleted ? 'Không có danh mục nào đã xóa' : 'Chưa có danh mục nào'}
                                            </p>
                                            {!showDeleted && (
                                                <button
                                                    onClick={() => openModalConfig()}
                                                    className='mt-2 text-sm text-indigo-600 hover:underline'
                                                >
                                                    + Thêm danh mục đầu tiên
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ) : (
                                    displayCategories.map((category, idx) => (
                                        <tr key={category._id} className={`hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${category.isDeleted ? 'opacity-60' : ''}`}>
                                            <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400'>
                                                {idx + 1}
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap'>
                                                <div className='flex items-center gap-2'>
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${category.isDeleted ? 'bg-gray-100 dark:bg-gray-700' : 'bg-indigo-100 dark:bg-indigo-900/30'}`}>
                                                        <FaDumbbell className={`text-sm ${category.isDeleted ? 'text-gray-400' : 'text-indigo-500'}`} />
                                                    </div>
                                                    <span className={`text-sm font-semibold ${category.isDeleted ? 'line-through text-gray-400' : 'text-gray-800 dark:text-white'}`}>
                                                        {category.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap'>
                                                {category.type === 'Ngoài trời' ? (
                                                    <span className='px-2.5 py-1 inline-flex items-center gap-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'>
                                                        🌳 Ngoài trời
                                                    </span>
                                                ) : (
                                                    <span className='px-2.5 py-1 inline-flex items-center gap-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'>
                                                        🏠 Trong nhà
                                                    </span>
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
                                                        // Restore button
                                                        <button
                                                            onClick={() => handleRestore(category._id, category.name)}
                                                            disabled={restoreMutation.isPending}
                                                            title='Khôi phục danh mục'
                                                            className='p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/30 rounded-lg transition-colors disabled:opacity-50'
                                                        >
                                                            <FaUndo size={14} />
                                                        </button>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => openModalConfig(category)}
                                                                title='Chỉnh sửa'
                                                                className='p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30 rounded-lg transition-colors'
                                                            >
                                                                <FaEdit size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(category._id, category.name)}
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
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Modal Form ── */}
            {modalOpen && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4' onClick={(e) => e.target === e.currentTarget && closeModal()}>
                    <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md'>
                        <div className='flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-200 dark:border-slate-700'>
                            <div className='flex items-center gap-3'>
                                <div className='p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg'>
                                    <FaDumbbell className='text-indigo-600 dark:text-indigo-400' />
                                </div>
                                <h3 className='text-base font-bold text-gray-800 dark:text-white'>
                                    {editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
                                </h3>
                            </div>
                            <button onClick={closeModal} className='p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors'>
                                <FaTimes className='text-gray-400' />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmitForm)} className='px-6 py-5 space-y-4'>
                            <div>
                                <label className='block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5 uppercase tracking-wide'>
                                    Tên môn thể thao / Hoạt động <span className='text-red-500'>*</span>
                                </label>
                                <input
                                    type='text'
                                    placeholder='Ví dụ: Chạy bộ, Bơi lội, Yoga...'
                                    className='w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl dark:bg-slate-700 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all'
                                    {...register('name', { required: 'Tên danh mục không được để trống' })}
                                />
                                {errors.name && <p className='text-red-500 text-xs mt-1'>{errors.name.message}</p>}
                            </div>

                            <div>
                                <label className='block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5 uppercase tracking-wide'>
                                    Loại hình <span className='text-red-500'>*</span>
                                </label>
                                <select
                                    className='mt-1 w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl dark:bg-slate-700 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all'
                                    {...register('type', { required: 'Vui lòng chọn loại hình' })}
                                >
                                    <option value='Ngoài trời'>🌳 Ngoài trời</option>
                                    <option value='Trong nhà'>🏠 Trong nhà</option>
                                </select>
                                {errors.type && <p className='text-red-500 text-xs mt-1'>{errors.type.message}</p>}
                            </div>

                            <div className='flex justify-end gap-3 pt-2 border-t border-gray-200 dark:border-slate-700'>
                                <button
                                    type='button'
                                    onClick={closeModal}
                                    className='px-5 py-2 text-sm bg-gray-200 dark:bg-slate-600 text-gray-800 dark:text-white rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors'
                                >
                                    Hủy
                                </button>
                                <button
                                    type='submit'
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                    className='px-5 py-2 text-sm bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed'
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
        </div>
    )
}
