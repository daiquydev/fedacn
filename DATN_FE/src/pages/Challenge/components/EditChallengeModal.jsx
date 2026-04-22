import { roundKcal } from '../../../utils/mathUtils'
import React, { useState, useEffect } from 'react'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { updateChallenge } from '../../../apis/challengeApi'
import sportCategoryApi from '../../../apis/sportCategoryApi'
import { useSafeMutation } from '../../../hooks/useSafeMutation'
import { getImageUrl } from '../../../utils/imageUrl'
import CloudinaryImageUploader from '../../../components/GlobalComponents/CloudinaryImageUploader/CloudinaryImageUploader'
import toast from 'react-hot-toast'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import {
    FaTimes, FaRunning, FaUtensils, FaDumbbell, FaTrophy,
    FaBullseye, FaCalendarAlt, FaUsers, FaImage,
    FaGlobe, FaUserFriends, FaLock, FaFire, FaClipboardList,
    FaSave, FaClock, FaArrowLeft,
    FaFileAlt, FaStar, FaInfoCircle, FaCheckCircle
} from 'react-icons/fa'
import { BsClockHistory } from 'react-icons/bs'

// ==================== DATE HELPERS ====================
// Date input uses type="date" → value is YYYY-MM-DD
const isValidDateISO = (val) => {
    if (!val || val.length !== 10) return false
    const date = new Date(val + 'T00:00:00')
    return !isNaN(date.getTime())
}

const parseDateToISO = (dateISO) => {
    if (!isValidDateISO(dateISO)) return null
    // dateISO is already YYYY-MM-DD from type="date" input
    return `${dateISO}T00:00:00.000Z`
}

// Convert ISO string from backend to YYYY-MM-DD for type="date" input value
const isoToInput = (isoStr) => {
    if (!isoStr) return ''
    const d = new Date(isoStr)
    if (isNaN(d.getTime())) return ''
    const yyyy = d.getUTCFullYear()
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
    const dd = String(d.getUTCDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
}

const parseTime = (timeStr) => {
    if (!timeStr) return new Date()
    const [hours, minutes] = timeStr.split(':')
    const d = new Date()
    d.setHours(parseInt(hours, 10))
    d.setMinutes(parseInt(minutes, 10))
    d.setSeconds(0)
    d.setMilliseconds(0)
    return d
}

// ==================== CONSTANTS ====================
const CHALLENGE_TYPES = [
    { key: 'outdoor_activity', label: 'Ngoài trời', icon: <FaRunning />, gradient: 'from-blue-500 to-cyan-600', desc: 'Chạy bộ, đạp xe, leo núi...' },
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
function PreviewCard({ form, selectedCat }) {
    const typeConf = CHALLENGE_TYPES.find(t => t.key === form.challenge_type)
    const gradient = TYPE_GRADIENT[form.challenge_type] || 'from-gray-400 to-gray-500'
    const visConf = VISIBILITY_OPTIONS.find(v => v.value === form.visibility)

    const startFmt = isValidDateISO(form.startDate)
        ? form.startDate.split('-').reverse().join('/')
        : '--/--/----'
    const endFmt = isValidDateISO(form.endDate)
        ? form.endDate.split('-').reverse().join('/')
        : '--/--/----'

    const estimatedKcal = form.challenge_type === 'outdoor_activity' && form.goal_value && selectedCat?.kcal_per_unit
        ? roundKcal(Number(form.goal_value) * selectedCat.kcal_per_unit)
        : null

    return (
        <div className="rounded-2xl overflow-hidden shadow-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className={`relative h-48 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
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

// ==================== MAIN MODAL (layout="modal" | "page") ====================
export default function EditChallengeModal({ open, onClose, challenge, layout = 'modal' }) {
    const queryClient = useQueryClient()
    const isPage = layout === 'page'

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
        badge_emoji: '🏆',
        nutrition_sub_type: 'free',
        time_window_start: '08:00',
        time_window_end: '11:00'
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
        if (challenge && (isPage || open)) {
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
                startDate: isoToInput(challenge.start_date),
                endDate: isoToInput(challenge.end_date),
                visibility: challenge.visibility || (challenge.is_public ? 'public' : 'private'),
                badge_emoji: challenge.badge_emoji || '🏆',
                nutrition_sub_type: challenge.nutrition_sub_type || 'free',
                time_window_start: challenge.time_window_start || '08:00',
                time_window_end: challenge.time_window_end || '11:00'
            })
            setErrors({})
        }
    }, [challenge, open, isPage])

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
                if (!isValidDateISO(value)) return 'Ngày không hợp lệ'
                return null
            case 'endDate':
                if (!value) return 'Vui lòng nhập ngày kết thúc'
                if (!isValidDateISO(value)) return 'Ngày không hợp lệ'
                if (isValidDateISO(form.startDate)) {
                    if (new Date(value) < new Date(form.startDate)) return 'Phải sau ngày bắt đầu'
                }
                return null
            default: return null
        }
    }

    const handleDateChange = (name, raw) => {
        // type="date" gives YYYY-MM-DD directly
        setField(name, raw)
        if (raw.length === 10) {
            const err = validateField(name, raw)
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
            kcal_per_unit: form.kcal_per_unit || 0,
            nutrition_sub_type: form.challenge_type === 'nutrition' ? form.nutrition_sub_type : 'free',
            time_window_start: (form.challenge_type === 'nutrition' && form.nutrition_sub_type === 'time_window')
                ? form.time_window_start : null,
            time_window_end: (form.challenge_type === 'nutrition' && form.nutrition_sub_type === 'time_window')
                ? form.time_window_end : null
        }),
        onSuccess: () => {
            toast.success('✅ Cập nhật thử thách thành công!')
            queryClient.invalidateQueries({ queryKey: ['my-created-challenges'] })
            queryClient.invalidateQueries({ queryKey: ['challenges'] })
            queryClient.invalidateQueries({ queryKey: ['my-challenges'] })
            queryClient.invalidateQueries({ queryKey: ['challenge', challenge._id] })
            onClose()
        },
        onError: (err) => toast.error(err?.response?.data?.message || 'Lỗi khi cập nhật thử thách')
    })

    const handleSubmit = () => {
        if (!validateAll()) return
        mutation.mutate()
    }

    if (!challenge || (!isPage && !open)) return null

    const nonOutdoorGoals = NON_OUTDOOR_GOALS[form.challenge_type] || []

    const pageHero = isPage && (
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-10 mb-8">
            <div className="container mx-auto px-4">
                <button
                    type="button"
                    onClick={onClose}
                    className="flex items-center text-emerald-50 hover:text-white mb-4 transition text-sm"
                >
                    <FaArrowLeft className="mr-2" /> Quay lại
                </button>
                <h1 className="text-3xl font-extrabold">Chỉnh Sửa Thử Thách</h1>
                <p className="opacity-90 mt-1">Cập nhật thông tin chi tiết cho thử thách của bạn</p>
            </div>
        </div>
    )

    const modalHeader = !isPage && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0 bg-gradient-to-r from-emerald-500 to-teal-600">
            <div className="flex items-center gap-3">
                <FaTrophy className="text-white text-xl" />
                <h2 className="text-xl font-black text-white">Chỉnh sửa thử thách</h2>
            </div>
            <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-white/20 text-white transition">
                <FaTimes />
            </button>
        </div>
    )

    const challengeFormFields = (
                        <>

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
                                placeholder="Nhập tên thử thách"
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

                        {/* Nutrition: giới hạn giờ check-in (tuỳ chọn) */}
                        {form.challenge_type === 'nutrition' && (
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    <FaClock className="inline mr-1 text-emerald-500" /> Giờ check-in bữa ăn
                                </label>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-3">
                                    Mặc định thành viên có thể check-in cả ngày. Bật nếu thử thách yêu cầu ảnh bữa ăn chỉ trong một khung giờ nhất định.
                                </p>
                                <label className="flex items-start gap-3 p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 cursor-pointer hover:border-emerald-300 transition-all">
                                    <input
                                        type="checkbox"
                                        className="mt-1 w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                        checked={form.nutrition_sub_type === 'time_window'}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setForm(prev => ({
                                                    ...prev,
                                                    nutrition_sub_type: 'time_window',
                                                    time_window_start: prev.time_window_start || '11:00',
                                                    time_window_end: prev.time_window_end || '14:30'
                                                }))
                                            } else {
                                                setField('nutrition_sub_type', 'free')
                                            }
                                        }}
                                    />
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Giới hạn check-in trong khung giờ</p>
                                        <p className="text-[11px] text-gray-400 mt-0.5">Check-in ngoài khoảng giờ sẽ không hợp lệ.</p>
                                    </div>
                                </label>
                                {form.nutrition_sub_type === 'time_window' && (
                                    <div className="mt-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                                        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-1">
                                            <FaClock className="text-[10px]" /> Khung giờ được check-in
                                        </p>
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1">
                                                <label className="block text-[10px] text-gray-500 mb-1">Từ giờ</label>
                                                <DatePicker
                                                    selected={parseTime(form.time_window_start)}
                                                    onChange={date => {
                                                        if (date) {
                                                            const h = String(date.getHours()).padStart(2, '0')
                                                            const m = String(date.getMinutes()).padStart(2, '0')
                                                            setField('time_window_start', `${h}:${m}`)
                                                        }
                                                    }}
                                                    showTimeSelect
                                                    showTimeSelectOnly
                                                    timeIntervals={15}
                                                    timeCaption="Giờ"
                                                    dateFormat="HH:mm"
                                                    timeFormat="HH:mm"
                                                    className="w-full px-3 py-2 rounded-lg border-2 border-emerald-200 dark:border-emerald-700 bg-white dark:bg-gray-800 outline-none focus:border-emerald-500 text-sm"
                                                    wrapperClassName="w-full"
                                                />
                                            </div>
                                            <span className="text-gray-400 font-bold mt-4">→</span>
                                            <div className="flex-1">
                                                <label className="block text-[10px] text-gray-500 mb-1">Đến giờ</label>
                                                <DatePicker
                                                    selected={parseTime(form.time_window_end)}
                                                    onChange={date => {
                                                        if (date) {
                                                            const h = String(date.getHours()).padStart(2, '0')
                                                            const m = String(date.getMinutes()).padStart(2, '0')
                                                            setField('time_window_end', `${h}:${m}`)
                                                        }
                                                    }}
                                                    showTimeSelect
                                                    showTimeSelectOnly
                                                    timeIntervals={15}
                                                    timeCaption="Giờ"
                                                    dateFormat="HH:mm"
                                                    timeFormat="HH:mm"
                                                    className="w-full px-3 py-2 rounded-lg border-2 border-emerald-200 dark:border-emerald-700 bg-white dark:bg-gray-800 outline-none focus:border-emerald-500 text-sm"
                                                    wrapperClassName="w-full"
                                                />
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-2">
                                            Gợi ý: trưa 11:00–14:30 · sáng 06:00–10:30 · tối 17:30–21:00
                                        </p>
                                    </div>
                                )}
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
                                        Ước tính ~{roundKcal(Number(form.goal_value) * (selectedCat.kcal_per_unit || 0)).toLocaleString()} kcal
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
                                    type="date"
                                    value={form.startDate}
                                    onChange={e => handleDateChange('startDate', e.target.value)}
                                    className={`w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-gray-800 outline-none transition text-sm ${errors.startDate ? 'border-red-400' : 'border-gray-200 dark:border-gray-600 focus:border-orange-400'}`}
                                />
                                {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    <FaCalendarAlt className="inline mr-1 text-blue-400" /> Ngày kết thúc *
                                </label>
                                <input
                                    type="date"
                                    value={form.endDate}
                                    onChange={e => handleDateChange('endDate', e.target.value)}
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
                                placeholder="Mô tả ngắn về thử thách..."
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-orange-400 outline-none transition text-sm resize-none"
                            />
                            <p className="text-[10px] text-gray-400 text-right mt-0.5">{form.description.length}/500</p>
                        </div>
                        </>
    )

    const previewAsideCompact = (
                    <div className="hidden lg:flex w-72 shrink-0 border-l border-gray-200 dark:border-gray-700 flex-col">
                        <div className="p-5 overflow-y-auto flex-1">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <BsClockHistory /> Bản xem trước
                            </p>
                            <PreviewCard form={form} selectedCat={selectedCat} />
                            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                                <p className="text-[11px] text-blue-600 dark:text-blue-400 leading-relaxed">
                                    💡 Bản xem trước cập nhật real-time khi bạn nhập thông tin
                                </p>
                            </div>
                        </div>
                    </div>
    )

    const formScrollArea = (
                <div className="flex flex-1 overflow-hidden min-h-0">
                    <div className="flex-1 overflow-y-auto p-6 space-y-5 min-w-0">
                        {challengeFormFields}
                    </div>
                    {previewAsideCompact}
                </div>
    )

    const formPageLayout = (
        <form
            onSubmit={(e) => { e.preventDefault(); handleSubmit() }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
        >
            <div className="lg:col-span-8 space-y-8">
                <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
                    <div className="flex items-center gap-3 mb-8 border-b border-gray-100 dark:border-gray-700 pb-4">
                        <FaFileAlt className="text-green-500 text-xl" />
                        <h2 className="text-xl font-bold dark:text-white">1. Thông tin thử thách</h2>
                    </div>
                    <div className="space-y-6">
                        {challengeFormFields}
                    </div>
                </section>

                <div className="lg:hidden sticky bottom-4 z-50">
                    <button
                        type="submit"
                        disabled={mutation.isPending}
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black py-4 rounded-2xl shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition disabled:opacity-50"
                    >
                        {mutation.isPending ? 'ĐANG LƯU...' : '✨ LƯU THAY ĐỔI'}
                    </button>
                </div>
            </div>

            <div className="lg:col-span-4 lg:sticky lg:top-8 h-fit space-y-6 pb-20 lg:pb-0">
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="font-black text-gray-800 dark:text-white flex items-center gap-2">
                            <FaStar className="text-yellow-400" /> BẢN XEM TRƯỚC
                        </h3>
                        <div className="flex gap-1">
                            <div className="w-2 h-2 rounded-full bg-red-400" />
                            <div className="w-2 h-2 rounded-full bg-yellow-400" />
                            <div className="w-2 h-2 rounded-full bg-green-400" />
                        </div>
                    </div>
                    <PreviewCard form={form} selectedCat={selectedCat} />

                    <div className="space-y-3 my-8">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                            <FaCheckCircle className={form.title?.trim() ? 'text-green-500' : 'text-gray-300'} />
                            <span className="text-sm dark:text-gray-300">Tên thử thách</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                            <FaCheckCircle className={form.startDate && form.endDate ? 'text-green-500' : 'text-gray-300'} />
                            <span className="text-sm dark:text-gray-300">Khung thời gian</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                            <FaCheckCircle className={form.goal_value ? 'text-green-500' : 'text-gray-300'} />
                            <span className="text-sm dark:text-gray-300">Mục tiêu</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                            <FaCheckCircle className={form.description?.trim() ? 'text-green-500' : 'text-gray-300'} />
                            <span className="text-sm dark:text-gray-300">Mô tả</span>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={mutation.isPending}
                        className="hidden lg:flex w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black py-4 rounded-2xl shadow-2xl hover:shadow-emerald-500/30 items-center justify-center gap-4 transition active:scale-95 disabled:opacity-50"
                    >
                        {mutation.isPending ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : <>✨ LƯU THAY ĐỔI</>}
                    </button>

                    <div className="mt-6 flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-2xl">
                        <FaInfoCircle className="text-yellow-600 shrink-0" />
                        <p className="text-[11px] text-yellow-800 dark:text-yellow-400 font-bold leading-relaxed">
                            Kiểm tra lại thông tin trước khi lưu.
                        </p>
                    </div>
                </div>
            </div>
        </form>
    )

    const formFooter = (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 shrink-0">
                    <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 font-medium text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                        Hủy
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={mutation.isPending}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
                    >
                        {mutation.isPending
                            ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang lưu...</>
                            : <><FaSave /> Lưu thay đổi</>
                        }
                    </button>
                </div>
    )

    const cardShellClass = 'relative w-full max-w-5xl max-h-[92vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden'

    return (
        <>
            {isPage ? (
                <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
                    {pageHero}
                    <div className="container mx-auto px-4">
                        {formPageLayout}
                    </div>
                </div>
            ) : (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <div
                        className={cardShellClass}
                        onClick={e => e.stopPropagation()}
                    >
                        {modalHeader}
                        {formScrollArea}
                        {formFooter}
                    </div>
                </div>
            )}
        </>
    )
}
