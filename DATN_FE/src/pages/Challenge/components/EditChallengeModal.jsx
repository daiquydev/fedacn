import React, { useState, useEffect } from 'react'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { updateChallenge } from '../../../apis/challengeApi'
import sportCategoryApi from '../../../apis/sportCategoryApi'
import { useSafeMutation } from '../../../hooks/useSafeMutation'
import { getImageUrl } from '../../../utils/imageUrl'
import CloudinaryImageUploader from '../../../components/GlobalComponents/CloudinaryImageUploader/CloudinaryImageUploader'
import toast from 'react-hot-toast'
import moment from 'moment'
import {
    FaTimes, FaRunning, FaUtensils, FaDumbbell, FaTrophy,
    FaBullseye, FaCalendarAlt, FaUsers, FaImage,
    FaGlobe, FaUserFriends, FaLock, FaFire, FaClipboardList,
    FaSave
} from 'react-icons/fa'
import { BsClockHistory } from 'react-icons/bs'

// ==================== DATE HELPERS ====================
const isValidDateStr = (val) => {
    if (!val || val.length !== 10) return false
    const [d, m, y] = val.split('/').map(Number)
    if (!d || !m || !y || y < 2000 || y > 2100) return false
    const date = new Date(y, m - 1, d)
    return date.getDate() === d && date.getMonth() === m - 1 && date.getFullYear() === y
}

const parseDateToISO = (dateStr) => {
    if (!isValidDateStr(dateStr)) return null
    const [d, m, y] = dateStr.split('/')
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T00:00:00.000Z`
}

const formatDateInput = (raw) => {
    const digits = raw.replace(/\D/g, '').slice(0, 8)
    if (digits.length <= 2) return digits
    if (digits.length <= 4) return digits.slice(0, 2) + '/' + digits.slice(2)
    return digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4)
}

const isoToDisplay = (isoStr) => {
    if (!isoStr) return ''
    const d = new Date(isoStr)
    const dd = String(d.getUTCDate()).padStart(2, '0')
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
    const yyyy = d.getUTCFullYear()
    return `${dd}/${mm}/${yyyy}`
}

// ==================== CONSTANTS ====================
const CHALLENGE_TYPES = [
    { key: 'outdoor_activity', label: 'Hoạt động ngoài trời', icon: <FaRunning />, gradient: 'from-blue-500 to-cyan-600', desc: 'Chạy bộ, đạp xe, leo núi...' },
    { key: 'nutrition', label: 'Ăn uống', icon: <FaUtensils />, gradient: 'from-emerald-500 to-teal-600', desc: 'Ăn sạch, giảm cân, detox...' },
    { key: 'fitness', label: 'Thể dục', icon: <FaDumbbell />, gradient: 'from-purple-500 to-pink-600', desc: 'Workout, tập gym...' }
]

const VISIBILITY_OPTIONS = [
    { value: 'public', label: 'Công khai', icon: <FaGlobe />, desc: 'Mọi người trong cộng đồng đều tìm thấy và tham gia được', color: 'text-green-600' },
    { value: 'friends', label: 'Bạn bè', icon: <FaUserFriends />, desc: 'Chỉ những người bạn đang theo dõi mới nhìn thấy', color: 'text-blue-600' },
    { value: 'private', label: 'Chỉ mình tôi', icon: <FaLock />, desc: 'Thử thách riêng tư, chỉ bạn có thể xem', color: 'text-gray-600' }
]

const TYPE_GRADIENT = {
    outdoor_activity: 'from-blue-500 to-cyan-600',
    nutrition: 'from-emerald-500 to-teal-600',
    fitness: 'from-purple-500 to-pink-600'
}

const NON_OUTDOOR_GOALS = {
    fitness: [
        { type: 'workout_count', label: 'Số buổi tập', unit: 'buổi' },
        { type: 'total_kcal', label: 'Tổng kcal đốt', unit: 'kcal' },
        { type: 'total_minutes', label: 'Tổng phút tập', unit: 'phút' },
        { type: 'days_active', label: 'Số ngày hoạt động', unit: 'ngày' }
    ],
    nutrition: [
        { type: 'days_completed', label: 'Số ngày hoàn thành', unit: 'ngày' },
        { type: 'meals_logged', label: 'Số bữa check-in', unit: 'bữa' },
        { type: 'kcal_target', label: 'Giữ calo (target/ngày)', unit: 'kcal/ngày' }
    ]
}

// ==================== PREVIEW MINI CARD ====================
function PreviewCard({ form, selectedCat, outdoorCategories }) {
    const typeConf = CHALLENGE_TYPES.find(t => t.key === form.challenge_type)
    const gradient = TYPE_GRADIENT[form.challenge_type] || 'from-gray-400 to-gray-500'
    const visConf = VISIBILITY_OPTIONS.find(v => v.value === form.visibility)

    const startFmt = isValidDateStr(form.startDate) ? form.startDate : '--/--/----'
    const endFmt = isValidDateStr(form.endDate) ? form.endDate : '--/--/----'

    const estimatedKcal = form.challenge_type === 'outdoor_activity' && form.goal_value && selectedCat?.kcal_per_unit
        ? Math.round(Number(form.goal_value) * selectedCat.kcal_per_unit)
        : null

    return (
        <div className="rounded-2xl overflow-hidden shadow-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className={`relative h-44 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                {form.image ? (
                    <img src={getImageUrl(form.image)} alt="preview" className="w-full h-full object-cover" />
                ) : (
                    <span className="text-7xl opacity-25">🏆</span>
                )}
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    {typeConf?.icon}
                    <span>{form.challenge_type === 'outdoor_activity' && form.category ? form.category : typeConf?.label || '...'}</span>
                </div>
                <div className="absolute bottom-3 left-3 flex gap-2">
                    <span className="bg-emerald-500/80 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" /> Đang diễn ra
                    </span>
                </div>
            </div>
            <div className="p-4">
                <h3 className="font-bold text-gray-900 dark:text-white text-base mb-3 leading-tight line-clamp-2">
                    {form.title || <span className="text-gray-400 italic font-normal">Tên thử thách...</span>}
                </h3>
                <div className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1.5">
                        <FaFire className="text-orange-400 shrink-0" />
                        <span>
                            {form.challenge_type === 'outdoor_activity'
                                ? (form.goal_value ? `Mục tiêu/ngày: ${form.goal_value} km` : 'Mục tiêu/ngày: -- km')
                                : (form.goal_value && form.goal_unit ? `Mục tiêu: ${form.goal_value} ${form.goal_unit}` : 'Mục tiêu: --')}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <FaCalendarAlt className="text-blue-400 shrink-0" />
                        <span>{startFmt} → {endFmt}</span>
                    </div>
                    {visConf && (
                        <div className={`flex items-center gap-1.5 ${visConf.color}`}>
                            {visConf.icon} <span>{visConf.label}</span>
                        </div>
                    )}
                    {estimatedKcal && estimatedKcal > 0 && (
                        <div className="flex items-center gap-1.5 text-orange-500">
                            🔥 <span>~{estimatedKcal.toLocaleString()} kcal</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ==================== MAIN MODAL ====================
export default function EditChallengeModal({ open, onClose, challenge }) {
    const queryClient = useQueryClient()

    const [form, setForm] = useState({
        title: '',
        description: '',
        image: '',
        challenge_type: 'outdoor_activity',
        category: '',
        kcal_per_unit: 0,
        goal_type: 'daily_km',
        goal_value: '',
        goal_unit: 'km',
        startDate: '',
        endDate: '',
        visibility: 'public',
        badge_emoji: '🏆'
    })

    const [errors, setErrors] = useState({})

    // Fetch categories
    const { data: categoriesData } = useQuery({
        queryKey: ['sportCategories'],
        queryFn: () => sportCategoryApi.getAll(),
        staleTime: 1000
    })
    const allCategories = categoriesData?.data?.result || []
    const outdoorCategories = allCategories.filter(c => c.type === 'Ngoài trời')
    const selectedCat = outdoorCategories.find(c => c.name === form.category)

    // Populate form from challenge data
    useEffect(() => {
        if (challenge && open) {
            setForm({
                title: challenge.title || '',
                description: challenge.description || '',
                image: challenge.image || '',
                challenge_type: challenge.challenge_type || 'outdoor_activity',
                category: challenge.category || '',
                kcal_per_unit: challenge.kcal_per_unit || 0,
                goal_type: challenge.goal_type || 'daily_km',
                goal_value: challenge.goal_value ? String(challenge.goal_value) : '',
                goal_unit: challenge.goal_unit || 'km',
                startDate: isoToDisplay(challenge.start_date),
                endDate: isoToDisplay(challenge.end_date),
                visibility: challenge.visibility || (challenge.is_public ? 'public' : 'private'),
                badge_emoji: challenge.badge_emoji || '🏆'
            })
            setErrors({})
        }
    }, [challenge, open])

    const setField = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }))
        if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }))
    }

    const validateField = (name, value) => {
        switch (name) {
            case 'title': return !value?.trim() ? 'Vui lòng nhập tên thử thách' : null
            case 'goal_value': return (!value || Number(value) <= 0) ? 'Mục tiêu phải lớn hơn 0' : null
            case 'startDate':
                if (!value) return 'Vui lòng nhập ngày bắt đầu'
                if (!isValidDateStr(value)) return 'Định dạng DD/MM/YYYY'
                return null
            case 'endDate':
                if (!value) return 'Vui lòng nhập ngày kết thúc'
                if (!isValidDateStr(value)) return 'Định dạng DD/MM/YYYY'
                if (isValidDateStr(form.startDate)) {
                    const [sd, sm, sy] = form.startDate.split('/').map(Number)
                    const [ed, em, ey] = value.split('/').map(Number)
                    if (new Date(ey, em - 1, ed) < new Date(sy, sm - 1, sd)) return 'Phải sau ngày bắt đầu'
                }
                return null
            default: return null
        }
    }

    const handleDateChange = (name, raw) => {
        const formatted = formatDateInput(raw)
        setField(name, formatted)
        if (formatted.length === 10) {
            const err = validateField(name, formatted)
            setErrors(prev => ({ ...prev, [name]: err }))
        }
    }

    const validateAll = () => {
        const fields = { title: form.title, goal_value: form.goal_value, startDate: form.startDate, endDate: form.endDate }
        const newErrors = {}
        let valid = true
        for (const [k, v] of Object.entries(fields)) {
            const err = validateField(k, v)
            if (err) { newErrors[k] = err; valid = false }
        }
        if (form.challenge_type === 'outdoor_activity' && !form.category) {
            newErrors.category = 'Vui lòng chọn danh mục'; valid = false
        }
        setErrors(newErrors)
        return valid
    }

    // ==================== SUBMIT ====================
    const mutation = useSafeMutation({
        mutationFn: () => updateChallenge(challenge._id, {
            title: form.title.trim(),
            description: form.description,
            image: form.image,
            goal_type: form.goal_type,
            goal_value: Number(form.goal_value),
            goal_unit: form.goal_unit,
            start_date: parseDateToISO(form.startDate),
            end_date: parseDateToISO(form.endDate),
            visibility: form.visibility,
            is_public: form.visibility !== 'private',
            badge_emoji: form.badge_emoji,
            category: form.category,
            kcal_per_unit: form.kcal_per_unit || 0
        }),
        onSuccess: () => {
            toast.success('✅ Cập nhật thử thách thành công!')
            queryClient.invalidateQueries({ queryKey: ['my-created-challenges'] })
            queryClient.invalidateQueries({ queryKey: ['challenges'] })
            queryClient.invalidateQueries({ queryKey: ['my-challenges'] })
            onClose()
        },
        onError: (err) => toast.error(err?.response?.data?.message || 'Lỗi khi cập nhật thử thách')
    })

    const handleSubmit = () => {
        if (!validateAll()) return
        mutation.mutate()
    }

    if (!open || !challenge) return null

    const nonOutdoorGoals = NON_OUTDOOR_GOALS[form.challenge_type] || []

    return (
        <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-5xl max-h-[92vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* HEADER */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0 bg-gradient-to-r from-amber-500 to-orange-600">
                    <div className="flex items-center gap-3">
                        <FaTrophy className="text-white text-xl" />
                        <h2 className="text-xl font-black text-white">Chỉnh sửa thử thách</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20 text-white transition">
                        <FaTimes />
                    </button>
                </div>

                {/* BODY: 2 cols */}
                <div className="flex flex-1 overflow-hidden">
                    {/* LEFT: Form (scrollable) */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-5 min-w-0">

                        {/* Loại thử thách (DISABLED - hiển thị readonly) */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Loại thử thách
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {CHALLENGE_TYPES.map(t => (
                                    <div
                                        key={t.key}
                                        className={`p-3 rounded-xl border-2 text-left ${form.challenge_type === t.key
                                            ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                                            : 'border-gray-200 dark:border-gray-700 opacity-40'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${t.gradient} flex items-center justify-center text-white text-sm mb-1.5`}>
                                            {t.icon}
                                        </div>
                                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 leading-tight">{t.label}</p>
                                        <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{t.desc}</p>
                                    </div>
                                ))}
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1 italic">🔒 Không thể thay đổi loại thử thách sau khi tạo</p>
                        </div>

                        {/* Tên thử thách */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                Tên thử thách *
                            </label>
                            <input
                                value={form.title}
                                onChange={e => { setField('title', e.target.value); const err = validateField('title', e.target.value); setErrors(p => ({ ...p, title: err })) }}
                                placeholder="VD: Chạy 100km trong tháng 4"
                                className={`w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-gray-800 outline-none transition text-sm ${errors.title ? 'border-red-400' : 'border-gray-200 dark:border-gray-600 focus:border-orange-400'}`}
                            />
                            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
                        </div>

                        {/* Outdoor: Danh mục */}
                        {form.challenge_type === 'outdoor_activity' && (
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    <FaBullseye className="inline mr-1 text-blue-500" /> Danh mục hoạt động *
                                </label>
                                <select
                                    value={form.category}
                                    onChange={e => {
                                        const catName = e.target.value;
                                        const cat = outdoorCategories.find(c => c.name === catName)
                                        setField('category', catName)
                                        setField('kcal_per_unit', cat?.kcal_per_unit || 0)
                                    }}
                                    className={`w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-gray-800 outline-none transition text-sm ${errors.category ? 'border-red-400' : 'border-gray-200 dark:border-gray-600 focus:border-blue-400'}`}
                                >
                                    <option value="" disabled>-- Chọn danh mục --</option>
                                    {outdoorCategories.map(cat => (
                                        <option key={cat._id} value={cat.name}>
                                            {cat.name} ({cat.kcal_per_unit} kcal/km)
                                        </option>
                                    ))}
                                </select>
                                {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
                            </div>
                        )}

                        {/* Non-outdoor: Goal type selector */}
                        {form.challenge_type !== 'outdoor_activity' && nonOutdoorGoals.length > 0 && (
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Loại mục tiêu *</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {nonOutdoorGoals.map(g => (
                                        <button
                                            key={g.type}
                                            onClick={() => { setField('goal_type', g.type); setField('goal_unit', g.unit) }}
                                            className={`p-3 rounded-xl border-2 text-left transition-all ${form.goal_type === g.type ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}
                                        >
                                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{g.label}</span>
                                            <span className="block text-[10px] text-gray-400">{g.unit}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Mục tiêu (value) */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                {form.challenge_type === 'outdoor_activity' ? '🎯 Mục tiêu mỗi ngày (km) *' : `🎯 Giá trị mục tiêu mỗi ngày (${form.goal_unit}) *`}
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    value={form.goal_value}
                                    onChange={e => { setField('goal_value', e.target.value); const err = validateField('goal_value', e.target.value); setErrors(p => ({ ...p, goal_value: err })) }}
                                    placeholder={form.challenge_type === 'outdoor_activity' ? '50' : '20'}
                                    min="1"
                                    className={`flex-1 px-4 py-3 rounded-xl border-2 bg-white dark:bg-gray-800 outline-none transition text-sm ${errors.goal_value ? 'border-red-400' : 'border-gray-200 dark:border-gray-600 focus:border-orange-400'}`}
                                />
                                <div className="px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-sm font-semibold text-gray-500 min-w-[60px] text-center">
                                    {form.challenge_type === 'outdoor_activity' ? 'km' : form.goal_unit}
                                </div>
                            </div>
                            {errors.goal_value && <p className="text-xs text-red-500 mt-1">{errors.goal_value}</p>}
                            {form.challenge_type === 'outdoor_activity' && form.goal_value && selectedCat && (
                                <div className="mt-2 p-2.5 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800 flex items-center gap-2 text-xs">
                                    <FaFire className="text-orange-500 shrink-0" />
                                    <span className="text-orange-700 dark:text-orange-300">
                                        Ước tính ~{Math.round(Number(form.goal_value) * (selectedCat.kcal_per_unit || 0)).toLocaleString()} kcal
                                        ({selectedCat.kcal_per_unit} kcal/km × {form.goal_value} km)
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Ngày bắt đầu / kết thúc */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    <FaCalendarAlt className="inline mr-1 text-blue-400" /> Ngày bắt đầu *
                                </label>
                                <input
                                    type="text"
                                    value={form.startDate}
                                    onChange={e => handleDateChange('startDate', e.target.value)}
                                    placeholder="DD/MM/YYYY"
                                    maxLength={10}
                                    className={`w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-gray-800 outline-none transition text-sm ${errors.startDate ? 'border-red-400' : 'border-gray-200 dark:border-gray-600 focus:border-orange-400'}`}
                                />
                                {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    <FaCalendarAlt className="inline mr-1 text-blue-400" /> Ngày kết thúc *
                                </label>
                                <input
                                    type="text"
                                    value={form.endDate}
                                    onChange={e => handleDateChange('endDate', e.target.value)}
                                    placeholder="DD/MM/YYYY"
                                    maxLength={10}
                                    className={`w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-gray-800 outline-none transition text-sm ${errors.endDate ? 'border-red-400' : 'border-gray-200 dark:border-gray-600 focus:border-orange-400'}`}
                                />
                                {errors.endDate && <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>}
                            </div>
                        </div>

                        {/* Hình thức */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                <FaUsers className="inline mr-1 text-indigo-400" /> Hình thức tham gia *
                            </label>
                            <div className="space-y-2">
                                {VISIBILITY_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setField('visibility', opt.value)}
                                        className={`w-full p-3 rounded-xl border-2 flex items-center gap-3 text-left transition-all ${form.visibility === opt.value ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 bg-white dark:bg-gray-800'}`}
                                    >
                                        <span className={`w-8 h-8 flex items-center justify-center rounded-full text-base shrink-0 ${form.visibility === opt.value ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                                            }`}>{opt.icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{opt.label}</p>
                                            <p className="text-[11px] text-gray-400 truncate">{opt.desc}</p>
                                        </div>
                                        {form.visibility === opt.value && <div className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Hình ảnh */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                <FaImage className="inline mr-1" /> Hình ảnh (tùy chọn)
                            </label>
                            <CloudinaryImageUploader
                                value={form.image}
                                onChange={url => setField('image', url)}
                                folder="challenges"
                            />
                        </div>

                        {/* Mô tả */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                <FaClipboardList className="inline mr-1" /> Mô tả
                            </label>
                            <textarea
                                value={form.description}
                                onChange={e => setField('description', e.target.value)}
                                rows={3}
                                maxLength={500}
                                placeholder="Mô tả ngắn về thử thách của bạn..."
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-orange-400 outline-none transition text-sm resize-none"
                            />
                            <p className="text-[10px] text-gray-400 text-right mt-0.5">{form.description.length}/500</p>
                        </div>

                    </div>

                    {/* RIGHT: Preview (sticky, hidden on mobile) */}
                    <div className="hidden lg:flex w-72 shrink-0 border-l border-gray-200 dark:border-gray-700 flex-col">
                        <div className="p-5 overflow-y-auto flex-1">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <BsClockHistory /> Bản xem trước
                            </p>
                            <PreviewCard form={form} selectedCat={selectedCat} outdoorCategories={outdoorCategories} />

                            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                                <p className="text-[11px] text-blue-600 dark:text-blue-400 leading-relaxed">
                                    💡 Bản xem trước cập nhật real-time khi bạn nhập thông tin
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 shrink-0">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 font-medium text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={mutation.isPending}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-sm hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
                    >
                        {mutation.isPending
                            ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang lưu...</>
                            : <><FaSave /> Lưu thay đổi</>
                        }
                    </button>
                </div>
            </div>
        </div>
    )
}
