import { roundKcal } from '../../../utils/mathUtils'
import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createChallenge } from '../../../apis/challengeApi'
import { getAllExercises } from '../../../apis/exerciseApi'
import sportCategoryApi from '../../../apis/sportCategoryApi'
import CloudinaryImageUploader from '../../../components/GlobalComponents/CloudinaryImageUploader/CloudinaryImageUploader'
import { useSafeMutation } from '../../../hooks/useSafeMutation'
import { getImageUrl } from '../../../utils/imageUrl'
import toast from 'react-hot-toast'
import moment from 'moment'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import {
    FaTimes, FaRunning, FaUtensils, FaDumbbell, FaTrophy,
    FaMagic, FaBullseye, FaCalendarAlt, FaUsers, FaImage,
    FaGlobe, FaUserFriends, FaLock, FaFire, FaClipboardList, FaClock,
    FaChevronRight, FaChevronLeft
} from 'react-icons/fa'
import { MdAutoAwesome } from 'react-icons/md'
import { BsClockHistory } from 'react-icons/bs'

// ==================== AI PROXY ====================
const AI_PROXY_ENDPOINT = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/ai/generate`

// ==================== DATE HELPERS ====================
// Date input uses type="date" → value is YYYY-MM-DD
const isValidDateISO = (val) => {
    if (!val || val.length !== 10) return false
    const date = new Date(val + 'T00:00:00')
    return !isNaN(date.getTime())
}

const isPastDate = (dateISO) => {
    if (!isValidDateISO(dateISO)) return false
    const date = new Date(dateISO + 'T00:00:00')
    const today = new Date(); today.setHours(0, 0, 0, 0)
    return date < today
}

const parseDateToISO = (dateISO) => {
    if (!isValidDateISO(dateISO)) return null
    // dateISO is already YYYY-MM-DD from type="date" input
    return `${dateISO}T00:00:00.000Z`
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
    { key: 'outdoor_activity', label: 'Hoạt động ngoài trời', icon: <FaRunning />, gradient: 'from-blue-500 to-cyan-600', desc: 'Chạy bộ, đạp xe, leo núi...' },
    { key: 'nutrition', label: 'Ăn uống', icon: <FaUtensils />, gradient: 'from-emerald-500 to-teal-600', desc: 'Ăn sạch, giảm cân, detox...' },
    { key: 'fitness', label: 'Thể dục', icon: <FaDumbbell />, gradient: 'from-purple-500 to-pink-600', desc: 'Workout, tập gym...' }
]

const VISIBILITY_OPTIONS = [
    { value: 'public', label: 'Công khai', icon: <FaGlobe />, desc: 'Mọi người trong cộng đồng đều tìm thấy và tham gia được', color: 'text-green-600' },
    { value: 'friends', label: 'Bạn bè', icon: <FaUserFriends />, desc: 'Chỉ những người bạn đang theo dõi mới nhìn thấy', color: 'text-blue-600' },
    { value: 'private', label: 'Chỉ mình tôi', icon: <FaLock />, desc: 'Thử thách riêng tư, chỉ bạn có thể xem', color: 'text-gray-600' }
]

const DIFFICULTY_OPTIONS = [
    { value: 'easy', label: '😊 Dễ', color: 'text-green-600' },
    { value: 'medium', label: '💪 Trung bình', color: 'text-yellow-600' },
    { value: 'hard', label: '🔥 Khó', color: 'text-red-600' }
]

const TYPE_GRADIENT = {
    outdoor_activity: 'from-blue-500 to-cyan-600',
    nutrition: 'from-emerald-500 to-teal-600',
    fitness: 'from-purple-500 to-pink-600'
}

// Nutrition goal options (fitness is now fixed to total_kcal)
const NON_OUTDOOR_GOALS = {
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

    const startFmt = isValidDateISO(form.startDate) ? form.startDate : '--/--/----'
    const endFmt = isValidDateISO(form.endDate) ? form.endDate : '--/--/----'

    const estimatedKcal = form.challenge_type === 'outdoor_activity' && form.goal_value && selectedCat?.kcal_per_unit
        ? roundKcal(Number(form.goal_value) * selectedCat.kcal_per_unit)
        : null

    return (
        <div className="rounded-2xl overflow-hidden shadow-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
            {/* Card image/gradient header */}
            <div className={`relative h-44 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                {form.image ? (
                    <img src={getImageUrl(form.image)} alt="preview" className="w-full h-full object-cover" />
                ) : (
                    <span className="text-7xl opacity-25">🏆</span>
                )}

                {/* Type badge */}
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    {typeConf?.icon}
                    <span>{form.challenge_type === 'outdoor_activity' && form.category ? form.category : typeConf?.label || '...'}</span>
                </div>

                {/* Status */}
                <div className="absolute bottom-3 left-3 flex gap-2">
                    <span className="bg-emerald-500/80 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" /> Đang diễn ra
                    </span>
                </div>
            </div>

            {/* Card body */}
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
                    {/* time-window badge */}
                    {form.challenge_type === 'nutrition' && form.nutrition_sub_type === 'time_window' && form.time_window_start && form.time_window_end && (
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                            <FaClock className="shrink-0" />
                            <span>⏰ {form.time_window_start} – {form.time_window_end}</span>
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
export default function CreateChallengeModal({ open, onClose }) {
    const navigate = useNavigate()
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
        badge_emoji: '🏆',
        // nutrition time-window
        nutrition_sub_type: 'free',
        time_window_start: '08:00',
        time_window_end: '11:00'
    })

    // Exercise selection state (fitness challenges)
    const [selectedExercises, setSelectedExercises] = useState([])
    const [exerciseSearch, setExerciseSearch] = useState('')
    const [showExerciseDropdown, setShowExerciseDropdown] = useState(false)
    const exerciseSearchRef = useRef(null)

    // Fetch all exercises for fitness type
    const { data: exercisesData } = useQuery({
        queryKey: ['all-exercises'],
        queryFn: () => getAllExercises(),
        staleTime: 60000,
        enabled: form.challenge_type === 'fitness'
    })
    const allExercises = exercisesData?.data?.result || []

    // Filtered exercises for dropdown
    const filteredExercises = useMemo(() => {
        if (!exerciseSearch.trim()) return allExercises.filter(ex => !selectedExercises.some(s => s.exercise_id === ex._id)).slice(0, 20)
        const kw = exerciseSearch.toLowerCase().trim()
        return allExercises
            .filter(ex => !selectedExercises.some(s => s.exercise_id === ex._id))
            .filter(ex => (ex.name || '').toLowerCase().includes(kw) || (ex.name_vi || '').toLowerCase().includes(kw))
            .slice(0, 20)
    }, [allExercises, exerciseSearch, selectedExercises])

    const addExercise = (ex) => {
        setSelectedExercises(prev => [...prev, {
            exercise_id: ex._id,
            exercise_name: ex.name,
            exercise_name_vi: ex.name_vi || '',
            sets: ex.default_sets?.length > 0 ? ex.default_sets : [{ set_number: 1, reps: 10, weight: 1, calories_per_unit: 10 }]
        }])
        setExerciseSearch('')
        setShowExerciseDropdown(false)
    }

    const removeExercise = (exerciseId) => {
        setSelectedExercises(prev => prev.filter(e => e.exercise_id !== exerciseId))
    }

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (exerciseSearchRef.current && !exerciseSearchRef.current.contains(e.target)) {
                setShowExerciseDropdown(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const [errors, setErrors] = useState({})
    const [showAIModal, setShowAIModal] = useState(false)
    const [aiStep, setAiStep] = useState(1)          // 1 = choose type, 2 = describe
    const [aiType, setAiType] = useState('')          // selected type in wizard
    const [aiDesc, setAiDesc] = useState('')
    const [aiLoading, setAiLoading] = useState(false)

    const openAIModal = () => {
        setAiStep(1)
        setAiType('')
        setAiDesc('')
        setShowAIModal(true)
    }

    // Fetch categories
    const { data: categoriesData } = useQuery({
        queryKey: ['sportCategories'],
        queryFn: () => sportCategoryApi.getAll(),
        staleTime: 1000
    })
    const allCategories = categoriesData?.data?.result || []
    const outdoorCategories = allCategories.filter(c => c.type === 'Ngoài trời')
    const selectedCat = outdoorCategories.find(c => c.name === form.category)

    // Auto-set default outdoor category
    useEffect(() => {
        if (form.challenge_type === 'outdoor_activity' && outdoorCategories.length > 0 && !form.category) {
            const first = outdoorCategories[0]
            setForm(prev => ({ ...prev, category: first.name, kcal_per_unit: first.kcal_per_unit || 0 }))
        }
    }, [form.challenge_type, outdoorCategories.length])

    // Reset goal when changing type
    const FIXED_GOALS = {
        nutrition: { goal_type: 'meals_logged', goal_unit: 'bữa' },
        fitness: { goal_type: 'exercises_completed', goal_unit: 'bài tập' }
    }
    useEffect(() => {
        if (form.challenge_type === 'outdoor_activity') {
            setForm(prev => ({ ...prev, goal_type: 'daily_km', goal_unit: 'km' }))
        } else {
            const fixed = FIXED_GOALS[form.challenge_type]
            if (fixed) {
                setForm(prev => ({ ...prev, goal_type: fixed.goal_type, goal_unit: fixed.goal_unit }))
            }
        }
    }, [form.challenge_type])

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
                if (!isValidDateISO(value)) return 'Định dạng ngày không hợp lệ'
                if (isPastDate(value)) return 'Không được chọn ngày trong quá khứ'
                return null
            case 'endDate':
                if (!value) return 'Vui lòng nhập ngày kết thúc'
                if (!isValidDateISO(value)) return 'Định dạng ngày không hợp lệ'
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
        // Fitness: goal_value is auto-set from exercises count, skip validation
        const fields = { title: form.title, startDate: form.startDate, endDate: form.endDate }
        if (form.challenge_type !== 'fitness') fields.goal_value = form.goal_value
        const newErrors = {}
        let valid = true
        for (const [k, v] of Object.entries(fields)) {
            const err = validateField(k, v)
            if (err) { newErrors[k] = err; valid = false }
        }
        if (form.challenge_type === 'outdoor_activity' && !form.category) {
            newErrors.category = 'Vui lòng chọn danh mục'; valid = false
        }
        if (form.challenge_type === 'fitness' && selectedExercises.length === 0) {
            newErrors.exercises = 'Vui lòng chọn ít nhất 1 bài tập'; valid = false
        }
        if (form.challenge_type === 'nutrition' && form.nutrition_sub_type === 'time_window') {
            if (!form.time_window_start || !form.time_window_end) {
                newErrors.time_window = 'Vui lòng nhập khung giờ'; valid = false
            } else {
                const [sh, sm] = form.time_window_start.split(':').map(Number)
                const [eh, em] = form.time_window_end.split(':').map(Number)
                const startMin = sh * 60 + sm
                const endMin = eh * 60 + em
                if (endMin - startMin < 30) {
                    newErrors.time_window = 'Khung giờ phải cách nhau ít nhất 30 phút'; valid = false
                }
            }
        }
        setErrors(newErrors)
        return valid
    }

    // ==================== SUBMIT ====================
    const mutation = useSafeMutation({
        mutationFn: () => createChallenge({
            title: form.title.trim(),
            description: form.description,
            image: form.image,
            challenge_type: form.challenge_type,
            goal_type: form.challenge_type === 'fitness' ? 'exercises_completed' : form.goal_type,
            goal_value: form.challenge_type === 'fitness' ? selectedExercises.length : Number(form.goal_value),
            goal_unit: form.challenge_type === 'fitness' ? 'bài tập' : form.goal_unit,
            start_date_iso: parseDateToISO(form.startDate),
            end_date_iso: parseDateToISO(form.endDate),
            visibility: form.visibility,
            is_public: form.visibility !== 'private',
            badge_emoji: form.badge_emoji,
            category: form.category,
            kcal_per_unit: form.kcal_per_unit || 0,
            // nutrition time-window
            nutrition_sub_type: form.challenge_type === 'nutrition' ? form.nutrition_sub_type : 'free',
            time_window_start: (form.challenge_type === 'nutrition' && form.nutrition_sub_type === 'time_window')
                ? form.time_window_start : null,
            time_window_end: (form.challenge_type === 'nutrition' && form.nutrition_sub_type === 'time_window')
                ? form.time_window_end : null,
            // fitness exercises
            exercises: form.challenge_type === 'fitness' ? selectedExercises.map(ex => ({
                exercise_id: ex.exercise_id,
                exercise_name: ex.exercise_name,
                sets: ex.sets
            })) : []
        }),
        onSuccess: (res) => {
            toast.success('🎉 Tạo thử thách thành công!')
            queryClient.invalidateQueries({ queryKey: ['challenges'] })
            queryClient.invalidateQueries({ queryKey: ['my-challenges'] })
            const id = res?.data?.result?._id
            onClose()
            if (id) navigate(`/challenge/${id}`)
        },
        onError: (err) => toast.error(err?.response?.data?.message || 'Lỗi khi tạo thử thách')
    })

    const handleSubmit = () => {
        if (!validateAll()) return
        mutation.mutate()
    }

    // ==================== AI FILL ====================
    // Contextual placeholders per type (Step 2 hint)
    const AI_PLACEHOLDERS = {
        outdoor_activity: 'VD: Tôi muốn thử thách chạy bộ buổi sáng, mục tiêu 5km mỗi ngày trong 30 ngày, dành cho người mới bắt đầu',
        nutrition: 'VD: Thử thách ăn chay buổi sáng từ 7-10h trong vòng 3 tuần, check-in 1 bữa/ngày\nVD: Giảm cân bằng cách ăn sạch, không đường, 2 bữa check-in/ngày trong 2 tháng',
        fitness: 'VD: Tập gym 4 buổi/tuần trong tháng này, mỗi buổi 45 phút, tổng 16 buổi\nVD: Thử thách plank 30 ngày, bắt đầu từ 1 phút và tăng dần'
    }

    const buildAIPrompt = (desc, today, type) => {
        const outdoorNames = outdoorCategories.map(c => c.name).join(', ')

        if (type === 'outdoor_activity') {
            return `Hôm nay là ${today}. Người dùng muốn tạo một thử thách HOẠT ĐỘNG NGOÀI TRỜI (chạy bộ, đạp xe, leo núi...). Mô tả:
"${desc}"

Quy tắc:
1. startDate >= ${today}, endDate >= startDate, định dạng YYYY-MM-DD.
2. category: một trong [${outdoorNames}], chọn phù hợp nhất với mô tả.
3. goal_value: số km di chuyển MỖI NGÀY hợp lý (thường 3-15km).
4. visibility: "public" | "friends" | "private".
5. title: ngắn gọn, tiếng Việt, hấp dẫn, phù hợp hoạt động ngoài trời.
6. description: tối đa 150 ký tự, tiếng Việt.
7. Chỉ trả về JSON object, không markdown.

{
  "title": string,
  "category": string,
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "goal_value": number,
  "visibility": "public" | "friends" | "private",
  "description": string
}`
        }

        if (type === 'nutrition') {
            return `Hôm nay là ${today}. Người dùng muốn tạo một thử thách ĂN UỐNG / CHẾ ĐỘ DINH DƯỠNG (ăn kiêng, detox, ăn sạch, giảm cân...). Mô tả:
"${desc}"

Quy tắc:
1. startDate >= ${today}, endDate >= startDate, định dạng YYYY-MM-DD.
2. goal_value: số bữa ăn cần check-in mỗi ngày (thường là 1-3 bữa).
3. nutrition_sub_type: nếu mô tả đề cập đến khung giờ cụ thể (ví dụ "7-10h", "buổi sáng từ 8 đến 11") thì trả về "time_window", ngược lại trả về "free".
4. time_window_start, time_window_end: nếu nutrition_sub_type là "time_window", suy ra khung giờ từ mô tả, định dạng "HH:mm" (24h). Nếu không có thì bỏ qua.
5. visibility: "public" | "friends" | "private".
6. title: ngắn gọn, tiếng Việt, hấp dẫn, CHỦ ĐỀ ĂN UỐNG/DINH DƯỠNG.
7. description: tối đa 150 ký tự, tiếng Việt, nói về chế độ ăn uống.
8. Chỉ trả về JSON object, không markdown.

{
  "title": string,
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "goal_value": number,
  "nutrition_sub_type": "free" | "time_window",
  "time_window_start": "HH:mm" | null,
  "time_window_end": "HH:mm" | null,
  "visibility": "public" | "friends" | "private",
  "description": string
}`
        }

        // fitness
        return `Hôm nay là ${today}. Người dùng muốn tạo một thử thách THỂ DỤC / TẬP LUYỆN (workout, gym, yoga...). Mô tả:
"${desc}"

Quy tắc:
1. startDate >= ${today}, endDate >= startDate, định dạng YYYY-MM-DD.
2. goal_value: tổng kcal cần đốt MỖI NGÀY hợp lý (thường 200-800 kcal).
3. visibility: "public" | "friends" | "private".
4. title: ngắn gọn, tiếng Việt, hấp dẫn, CHỦ ĐỀ LUYỆN TẬP THỂ DỤC.
5. description: tối đa 150 ký tự, tiếng Việt, nói về luyện tập.
6. Chỉ trả về JSON object, không markdown.

{
  "title": string,
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "goal_value": number,
  "visibility": "public" | "friends" | "private",
  "description": string
}`
    }

    const handleAIFill = async () => {
        if (!aiDesc.trim()) { toast.error('Nhập mô tả trước!'); return }
        setAiLoading(true)
        try {
            const today = moment().format('YYYY-MM-DD')
            const prompt = buildAIPrompt(aiDesc.trim(), today, aiType)

            const res = await fetch(AI_PROXY_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            })
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            const data = await res.json()
            const cleaned = (data?.text || '').replace(/```(?:json)?\n?/gi, '').replace(/```/g, '').trim()
            const parsed = JSON.parse(cleaned)

            // Resolve goal defaults per type
            const goalDefaults = {
                outdoor_activity: { goal_type: 'daily_km', goal_unit: 'km' },
                nutrition: { goal_type: 'meals_logged', goal_unit: 'bữa' },
                fitness: { goal_type: 'total_kcal', goal_unit: 'kcal' }
            }

            setForm(prev => {
                const updated = { ...prev }

                // ⭐ Sync challenge_type to wizard selection
                updated.challenge_type = aiType
                const gd = goalDefaults[aiType]
                updated.goal_type = gd.goal_type
                updated.goal_unit = gd.goal_unit

                if (parsed.title) updated.title = parsed.title

                // Outdoor: sync category
                if (aiType === 'outdoor_activity' && parsed.category && outdoorCategories.some(c => c.name === parsed.category)) {
                    updated.category = parsed.category
                    const cat = outdoorCategories.find(c => c.name === parsed.category)
                    updated.kcal_per_unit = cat?.kcal_per_unit || 0
                }

                // Nutrition: sync time-window fields from AI
                if (aiType === 'nutrition') {
                    if (parsed.nutrition_sub_type === 'time_window') {
                        updated.nutrition_sub_type = 'time_window'
                        if (parsed.time_window_start) updated.time_window_start = parsed.time_window_start
                        if (parsed.time_window_end) updated.time_window_end = parsed.time_window_end
                    } else {
                        updated.nutrition_sub_type = 'free'
                    }
                }

                if (parsed.startDate) updated.startDate = parsed.startDate
                if (parsed.endDate) updated.endDate = parsed.endDate
                if (parsed.goal_value && Number(parsed.goal_value) > 0) updated.goal_value = String(parsed.goal_value)
                if (['public', 'friends', 'private'].includes(parsed.visibility)) updated.visibility = parsed.visibility
                if (parsed.description) updated.description = parsed.description.slice(0, 150)
                return updated
            })
            setErrors({})
            setShowAIModal(false)
            setAiDesc('')
            toast.success('✨ AI đã điền xong!')
        } catch (err) {
            toast.error(`AI lỗi: ${err.message}`)
        } finally {
            setAiLoading(false)
        }
    }

    if (!open) return null

    const nonOutdoorGoals = NON_OUTDOOR_GOALS[form.challenge_type] || []

    return (
        <>
            {/* BACKDROP */}
            <div
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={onClose}
            >
                {/* MODAL */}
                <div
                    className="relative w-full max-w-5xl max-h-[92vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    {/* HEADER */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0 bg-gradient-to-r from-amber-500 to-orange-600">
                        <div className="flex items-center gap-3">
                            <FaTrophy className="text-white text-xl" />
                            <h2 className="text-xl font-black text-white">Tạo thử thách mới</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* AI Button */}
                            <button
                                onClick={openAIModal}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-bold transition"
                            >
                                <MdAutoAwesome className="text-yellow-300" /> AI điền
                            </button>
                            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20 text-white transition">
                                <FaTimes />
                            </button>
                        </div>
                    </div>

                    {/* BODY: 2 cols */}
                    <div className="flex flex-1 overflow-hidden">
                        {/* LEFT: Form (scrollable) */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-5 min-w-0">

                            {/* Loại thử thách */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Loại thử thách *
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {CHALLENGE_TYPES.map(t => (
                                        <button
                                            key={t.key}
                                            onClick={() => setField('challenge_type', t.key)}
                                            className={`p-3 rounded-xl border-2 text-left transition-all ${form.challenge_type === t.key
                                                ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-orange-300'
                                                }`}
                                        >
                                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${t.gradient} flex items-center justify-center text-white text-sm mb-1.5`}>
                                                {t.icon}
                                            </div>
                                            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 leading-tight">{t.label}</p>
                                            <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{t.desc}</p>
                                        </button>
                                    ))}
                                </div>
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

                            {/* Non-outdoor: goal type is fixed, no selector needed */}

                            {/* Nutrition: loại hình thử thách (time-window) */}
                            {form.challenge_type === 'nutrition' && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        <FaClock className="inline mr-1 text-emerald-500" /> Loại hình thử thách ăn uống *
                                    </label>
                                    <div className="space-y-2">
                                        {/* Free option */}
                                        <button
                                            type="button"
                                            onClick={() => setField('nutrition_sub_type', 'free')}
                                            className={`w-full p-3 rounded-xl border-2 flex items-start gap-3 text-left transition-all ${form.nutrition_sub_type === 'free'
                                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 bg-white dark:bg-gray-800'}`}
                                        >
                                            <span className={`w-8 h-8 flex items-center justify-center rounded-full text-base shrink-0 mt-0.5 ${form.nutrition_sub_type === 'free'
                                                ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                                                🕊️
                                            </span>
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Tự do</p>
                                                <p className="text-[11px] text-gray-400">Check-in bất kỳ lúc nào trong ngày</p>
                                            </div>
                                            {form.nutrition_sub_type === 'free' && <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-2" />}
                                        </button>

                                        {/* Time-window option */}
                                        <button
                                            type="button"
                                            onClick={() => setField('nutrition_sub_type', 'time_window')}
                                            className={`w-full p-3 rounded-xl border-2 flex items-start gap-3 text-left transition-all ${form.nutrition_sub_type === 'time_window'
                                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 bg-white dark:bg-gray-800'}`}
                                        >
                                            <span className={`w-8 h-8 flex items-center justify-center rounded-full text-base shrink-0 mt-0.5 ${form.nutrition_sub_type === 'time_window'
                                                ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                                                ⏰
                                            </span>
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Khung giờ ăn</p>
                                                <p className="text-[11px] text-gray-400">Chỉ check-in trong khoảng giờ quy định</p>
                                            </div>
                                            {form.nutrition_sub_type === 'time_window' && <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-2" />}
                                        </button>

                                        {/* Time range inputs */}
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
                                                                    setErrors(p => ({ ...p, time_window: null }))
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
                                                                    setErrors(p => ({ ...p, time_window: null }))
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
                                                {errors.time_window && <p className="text-xs text-red-500 mt-2">{errors.time_window}</p>}
                                                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-2">
                                                    💡 Check-in ngoài khung giờ này sẽ bị từ chối
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Exercise Selection — Fitness only */}
                            {form.challenge_type === 'fitness' && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                        💪 Chọn bài tập *
                                    </label>
                                    <div ref={exerciseSearchRef} className="relative">
                                        <input
                                            type="text"
                                            value={exerciseSearch}
                                            onChange={e => { setExerciseSearch(e.target.value); setShowExerciseDropdown(true) }}
                                            onFocus={() => setShowExerciseDropdown(true)}
                                            placeholder="🔍 Tìm bài tập (VD: Squat, Bench Press...)"
                                            className={`w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-gray-800 outline-none transition text-sm ${errors.exercises ? 'border-red-400' : 'border-gray-200 dark:border-gray-600 focus:border-purple-400'}`}
                                        />
                                        {showExerciseDropdown && filteredExercises.length > 0 && (
                                            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-2xl max-h-[240px] overflow-y-auto">
                                                {filteredExercises.map(ex => (
                                                    <button
                                                        key={ex._id}
                                                        type="button"
                                                        onClick={() => addExercise(ex)}
                                                        className="w-full text-left px-4 py-2.5 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition flex items-center gap-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
                                                    >
                                                        <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                                                            <FaDumbbell className="text-purple-500 text-xs" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{ex.name}</p>
                                                            <p className="text-[10px] text-gray-400 truncate">{ex.name_vi} • {ex.category} • {ex.difficulty === 'beginner' ? 'Dễ' : ex.difficulty === 'intermediate' ? 'TB' : 'Khó'}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {/* Selected exercises chips */}
                                    {selectedExercises.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {selectedExercises.map((ex, idx) => (
                                                <span
                                                    key={ex.exercise_id}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium"
                                                >
                                                    <span className="w-5 h-5 rounded-full bg-purple-500 text-white text-[10px] font-bold flex items-center justify-center">{idx + 1}</span>
                                                    {ex.exercise_name}
                                                    <button type="button" onClick={() => removeExercise(ex.exercise_id)} className="ml-0.5 hover:text-red-500 transition">
                                                        <FaTimes className="text-xs" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    {errors.exercises && <p className="text-xs text-red-500 mt-1">{errors.exercises}</p>}
                                    <p className="text-[10px] text-gray-400 mt-1">Đã chọn {selectedExercises.length} bài tập</p>
                                </div>
                            )}

                            {/* Fitness: auto goal info */}
                            {form.challenge_type === 'fitness' && selectedExercises.length > 0 && (
                                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-xl p-3">
                                    <p className="text-sm font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-2">
                                        🎯 Mục tiêu: <span className="text-lg font-black">{selectedExercises.length}</span> bài tập / ngày
                                    </p>
                                    <p className="text-[11px] text-purple-500 dark:text-purple-400 mt-0.5">Hoàn thành tất cả bài tập mỗi ngày để đạt mục tiêu</p>
                                </div>
                            )}

                            {/* Mục tiêu (value) — hide for fitness */}
                            {form.challenge_type !== 'fitness' && (<div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    {form.challenge_type === 'outdoor_activity'
                                        ? '🎯 Mục tiêu mỗi ngày (km) *'
                                        : '🍽️ Số bữa check-in *'}
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        value={form.goal_value}
                                        onChange={e => { setField('goal_value', e.target.value); const err = validateField('goal_value', e.target.value); setErrors(p => ({ ...p, goal_value: err })) }}
                                        placeholder={form.challenge_type === 'fitness' ? '500' : form.challenge_type === 'outdoor_activity' ? '50' : '1'}
                                        min="1"
                                        className={`flex-1 px-4 py-3 rounded-xl border-2 bg-white dark:bg-gray-800 outline-none transition text-sm ${errors.goal_value ? 'border-red-400' : 'border-gray-200 dark:border-gray-600 focus:border-orange-400'}`}
                                    />
                                    <div className={`px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-sm font-semibold text-gray-500 min-w-[60px] text-center`}>
                                        {form.challenge_type === 'outdoor_activity' ? 'km' : form.goal_unit}
                                    </div>
                                </div>
                                {errors.goal_value && <p className="text-xs text-red-500 mt-1">{errors.goal_value}</p>}
                                {/* Estimated kcal hint for outdoor */}
                                {form.challenge_type === 'outdoor_activity' && form.goal_value && selectedCat && (
                                    <div className="mt-2 p-2.5 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800 flex items-center gap-2 text-xs">
                                        <FaFire className="text-orange-500 shrink-0" />
                                        <span className="text-orange-700 dark:text-orange-300">
                                            Ước tính ~{roundKcal(Number(form.goal_value) * (selectedCat.kcal_per_unit || 0)).toLocaleString()} kcal
                                            ({selectedCat.kcal_per_unit} kcal/km × {form.goal_value} km)
                                        </span>
                                    </div>
                                )}
                            </div>)}

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

                                {/* Info note */}
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
                                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang tạo...</>
                                : <><FaTrophy /> Tạo thử thách</>
                            }
                        </button>
                    </div>
                </div>
            </div>

            {/* AI MODAL – 2-step wizard */}
            {showAIModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => { setShowAIModal(false) }}>
                    <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center shrink-0">
                                <MdAutoAwesome className="text-white text-xl" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-900 dark:text-white">AI tự điền thử thách</h3>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    {/* Step indicator */}
                                    {[1, 2].map(s => (
                                        <div key={s} className={`h-1.5 rounded-full transition-all ${
                                            s === aiStep ? 'w-6 bg-orange-500' :
                                            s < aiStep ? 'w-4 bg-orange-300' : 'w-4 bg-gray-200 dark:bg-gray-700'
                                        }`} />
                                    ))}
                                    <span className="text-[10px] text-gray-400 ml-1">Bước {aiStep}/2</span>
                                </div>
                            </div>
                            <button onClick={() => setShowAIModal(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
                                <FaTimes />
                            </button>
                        </div>

                        <div className="px-6 py-5">

                            {/* ── STEP 1: Choose type ── */}
                            {aiStep === 1 && (
                                <>
                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                                        🎯 Bước 1: Chọn loại thử thách bạn muốn tạo
                                    </p>
                                    <div className="space-y-2.5">
                                        {CHALLENGE_TYPES.map(t => (
                                            <button
                                                key={t.key}
                                                onClick={() => { setAiType(t.key); setAiStep(2) }}
                                                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-all text-left group"
                                            >
                                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${t.gradient} flex items-center justify-center text-white text-xl shrink-0 shadow-sm group-hover:scale-105 transition-transform`}>
                                                    {t.icon}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-bold text-gray-800 dark:text-gray-200">{t.label}</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">{t.desc}</p>
                                                </div>
                                                <FaChevronRight className="text-gray-300 group-hover:text-orange-400 transition" />
                                            </button>
                                        ))}
                                    </div>
                                    <button onClick={() => setShowAIModal(false)} className="w-full mt-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                                        Hủy
                                    </button>
                                </>
                            )}

                            {/* ── STEP 2: Describe + AI fill ── */}
                            {aiStep === 2 && (() => {
                                const typeConf = CHALLENGE_TYPES.find(t => t.key === aiType)
                                return (
                                    <>
                                        {/* Selected type badge */}
                                        <div className="flex items-center gap-2 mb-4">
                                            <button
                                                onClick={() => { setAiStep(1); setAiDesc('') }}
                                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition"
                                            >
                                                <FaChevronLeft className="text-sm" />
                                            </button>
                                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${typeConf?.gradient} text-white text-sm font-semibold shadow-sm`}>
                                                {typeConf?.icon}
                                                <span>{typeConf?.label}</span>
                                            </div>
                                            <span className="text-xs text-gray-400 ml-1">đã chọn</span>
                                        </div>

                                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            ✍️ Bước 2: Mô tả ý tưởng thử thách
                                        </p>
                                        <textarea
                                            value={aiDesc}
                                            onChange={e => setAiDesc(e.target.value)}
                                            rows={5}
                                            placeholder={AI_PLACEHOLDERS[aiType] || 'Mô tả thử thách của bạn...'}
                                            autoFocus
                                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 outline-none focus:border-orange-400 transition text-sm resize-none mb-1"
                                        />
                                        <p className="text-[10px] text-gray-400 mb-4">{aiDesc.length} ký tự • Càng chi tiết AI càng chính xác</p>

                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => { setAiStep(1); setAiDesc('') }}
                                                className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 font-medium text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                                            >
                                                ← Quay lại
                                            </button>
                                            <button
                                                onClick={handleAIFill}
                                                disabled={aiLoading || !aiDesc.trim()}
                                                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold text-sm hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                                            >
                                                {aiLoading
                                                    ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang xử lý...</>
                                                    : <><MdAutoAwesome /> Điền ngay</>
                                                }
                                            </button>
                                        </div>
                                    </>
                                )
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
