import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
    FaTimes, FaRunning, FaUtensils, FaDumbbell, FaTrophy,
    FaBullseye, FaCalendarAlt, FaImage, FaFire,
    FaClipboardList, FaClock, FaExclamationCircle, FaInfoCircle
} from 'react-icons/fa'
import { MdAutoAwesome } from 'react-icons/md'
import moment from 'moment'
import toast from 'react-hot-toast'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import adminChallengeApi from '../../apis/challengeApi'
import sportCategoryApi from '../../apis/sportCategoryApi'
import CloudinaryImageUploader from '../../components/GlobalComponents/CloudinaryImageUploader'
import http from '../../utils/http'

// ─── Fetch exercises (admin endpoint) ────────────────────────────────────────
const getAllExercises = () => http.get('/admin/exercises')

// ─── Date Helpers ────────────────────────────────────────────────────────────
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
    return `${dateISO}T00:00:00.000Z`
}

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
    d.setSeconds(0); d.setMilliseconds(0)
    return d
}

// ─── Constants ───────────────────────────────────────────────────────────────
const CHALLENGE_TYPES = [
    { key: 'outdoor_activity', label: 'Hoạt động ngoài trời', icon: <FaRunning />, gradient: 'from-blue-500 to-cyan-600', desc: 'Chạy bộ, đạp xe, leo núi...' },
    { key: 'nutrition', label: 'Ăn uống', icon: <FaUtensils />, gradient: 'from-emerald-500 to-teal-600', desc: 'Ăn sạch, giảm cân, detox...' },
    { key: 'fitness', label: 'Thể dục', icon: <FaDumbbell />, gradient: 'from-purple-500 to-pink-600', desc: 'Workout, tập gym...' }
]

const AI_PROXY_ENDPOINT = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/ai/generate`

// ─── Main Modal ──────────────────────────────────────────────────────────────
export default function ChallengeFormModal({ challenge, onClose, onSuccess }) {
    const isEdit = Boolean(challenge)

    // Form state
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

    const [selectedExercises, setSelectedExercises] = useState([])
    const [exerciseSearch, setExerciseSearch] = useState('')
    const [showExerciseDropdown, setShowExerciseDropdown] = useState(false)
    const exerciseSearchRef = useRef(null)
    const [errors, setErrors] = useState({})
    const [submitting, setSubmitting] = useState(false)

    // AI state
    const [showAIModal, setShowAIModal] = useState(false)
    const [aiDescription, setAiDescription] = useState('')
    const [aiLoading, setAiLoading] = useState(false)

    // Fetch categories
    const { data: categoriesData } = useQuery({
        queryKey: ['sportCategories'],
        queryFn: () => sportCategoryApi.getAll(),
        staleTime: 60000
    })
    const allCategories = categoriesData?.data?.result || []
    const outdoorCategories = allCategories.filter(c => c.type === 'Ngoài trời')
    const selectedCat = outdoorCategories.find(c => c.name === form.category)

    // Fetch exercises for fitness type
    const { data: exercisesData } = useQuery({
        queryKey: ['admin-all-exercises'],
        queryFn: () => getAllExercises(),
        staleTime: 60000,
        enabled: form.challenge_type === 'fitness'
    })
    const allExercises = exercisesData?.data?.result?.exercises || exercisesData?.data?.result || []

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

    // Close exercise dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (exerciseSearchRef.current && !exerciseSearchRef.current.contains(e.target)) setShowExerciseDropdown(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    // Populate form from challenge when editing
    useEffect(() => {
        if (challenge && isEdit) {
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
            // Populate exercises for fitness
            if (challenge.challenge_type === 'fitness' && Array.isArray(challenge.exercises)) {
                setSelectedExercises(challenge.exercises.map(ex => ({
                    exercise_id: ex.exercise_id,
                    exercise_name: ex.exercise_name,
                    exercise_name_vi: ex.exercise_name_vi || '',
                    sets: ex.sets || [{ set_number: 1, reps: 10, weight: 1, calories_per_unit: 10 }]
                })))
            }
            setErrors({})
        }
    }, [challenge, isEdit])

    // Auto-set default outdoor category
    useEffect(() => {
        if (form.challenge_type === 'outdoor_activity' && outdoorCategories.length > 0 && !form.category) {
            const first = outdoorCategories[0]
            setForm(prev => ({ ...prev, category: first.name, kcal_per_unit: first.kcal_per_unit || 0 }))
        }
    }, [form.challenge_type, outdoorCategories.length])

    // Reset goal when changing type (only in create mode)
    const FIXED_GOALS = {
        outdoor_activity: { goal_type: 'daily_km', goal_unit: 'km' },
        nutrition: { goal_type: 'meals_logged', goal_unit: 'bữa' },
        fitness: { goal_type: 'exercises_completed', goal_unit: 'bài tập' }
    }
    useEffect(() => {
        if (!isEdit) {
            const fixed = FIXED_GOALS[form.challenge_type]
            if (fixed) setForm(prev => ({ ...prev, goal_type: fixed.goal_type, goal_unit: fixed.goal_unit }))
        }
    }, [form.challenge_type, isEdit])

    const setField = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }))
        if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }))
    }

    // ─── Validation ──────────────────────────────────────────────────────────
    const validateField = (name, value) => {
        switch (name) {
            case 'title': return !value?.trim() ? 'Vui lòng nhập tên thử thách' : null
            case 'goal_value': return (!value || Number(value) <= 0) ? 'Mục tiêu phải lớn hơn 0' : null
            case 'startDate':
                if (!value) return 'Vui lòng nhập ngày bắt đầu'
                if (!isValidDateISO(value)) return 'Ngày không hợp lệ'
                if (!isEdit && isPastDate(value)) return 'Không được chọn ngày trong quá khứ'
                return null
            case 'endDate':
                if (!value) return 'Vui lòng nhập ngày kết thúc'
                if (!isValidDateISO(value)) return 'Ngày không hợp lệ'
                if (isValidDateISO(form.startDate) && new Date(value) < new Date(form.startDate))
                    return 'Ngày kết thúc phải sau ngày bắt đầu'
                return null
            case 'image':
                if (!value?.trim()) return 'Vui lòng tải lên ảnh bìa'
                return null
            default: return null
        }
    }

    const validateAll = () => {
        const fields = { title: form.title, startDate: form.startDate, endDate: form.endDate, image: form.image }
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
                if ((eh * 60 + em) - (sh * 60 + sm) < 30) {
                    newErrors.time_window = 'Khung giờ phải cách nhau ít nhất 30 phút'; valid = false
                }
            }
        }
        setErrors(newErrors)
        return valid
    }

    // ─── Submit ──────────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e?.preventDefault()
        if (submitting) return
        if (!validateAll()) {
            toast.error('Vui lòng kiểm tra lại các thông tin bắt buộc')
            return
        }

        setSubmitting(true)
        try {
            const payload = {
                title: form.title.trim(),
                description: form.description,
                image: form.image,
                challenge_type: form.challenge_type,
                goal_type: form.challenge_type === 'fitness' ? 'exercises_completed' : form.goal_type,
                goal_value: form.challenge_type === 'fitness' ? selectedExercises.length : Number(form.goal_value),
                goal_unit: form.challenge_type === 'fitness' ? 'bài tập' : form.goal_unit,
                start_date_iso: parseDateToISO(form.startDate),
                end_date_iso: parseDateToISO(form.endDate),
                start_date: parseDateToISO(form.startDate),
                end_date: parseDateToISO(form.endDate),
                visibility: 'public',
                is_public: true,
                badge_emoji: form.badge_emoji,
                category: form.category,
                kcal_per_unit: form.kcal_per_unit || 0,
                nutrition_sub_type: form.challenge_type === 'nutrition' ? form.nutrition_sub_type : 'free',
                time_window_start: (form.challenge_type === 'nutrition' && form.nutrition_sub_type === 'time_window') ? form.time_window_start : null,
                time_window_end: (form.challenge_type === 'nutrition' && form.nutrition_sub_type === 'time_window') ? form.time_window_end : null,
                exercises: form.challenge_type === 'fitness' ? selectedExercises.map(ex => ({
                    exercise_id: ex.exercise_id,
                    exercise_name: ex.exercise_name,
                    sets: ex.sets
                })) : []
            }

            if (isEdit) {
                // Edit mode: allow visibility change
                payload.visibility = form.visibility
                payload.is_public = form.visibility !== 'private'
                await adminChallengeApi.update(challenge._id, payload)
                toast.success('✅ Cập nhật thử thách thành công!')
            } else {
                await adminChallengeApi.create(payload)
                toast.success('🎉 Tạo thử thách thành công!')
            }
            onSuccess()
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Có lỗi xảy ra')
        } finally {
            setSubmitting(false)
        }
    }

    // ─── AI Fill ─────────────────────────────────────────────────────────────
    const handleAIFill = async () => {
        if (!aiDescription.trim()) { toast.error('Vui lòng nhập mô tả trước!'); return }
        setAiLoading(true)
        try {
            const today = moment().format('YYYY-MM-DD')
            const outdoorNames = outdoorCategories.map(c => c.name).join(', ')
            const type = form.challenge_type

            let prompt = ''
            if (type === 'outdoor_activity') {
                prompt = `Hôm nay là ${today}. Người dùng muốn tạo một thử thách HOẠT ĐỘNG NGOÀI TRỜI. Mô tả:\n"${aiDescription.trim()}"\n\nQuy tắc:\n1. startDate >= ${today}, endDate >= startDate, định dạng YYYY-MM-DD.\n2. category: một trong [${outdoorNames}].\n3. goal_value: số km di chuyển MỖI NGÀY hợp lý (3-15km).\n4. title: ngắn gọn, tiếng Việt.\n5. description: tối đa 150 ký tự, tiếng Việt.\n6. Chỉ trả về JSON object, không markdown.\n\n{ "title": string, "category": string, "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD", "goal_value": number, "description": string }`
            } else if (type === 'nutrition') {
                prompt = `Hôm nay là ${today}. Người dùng muốn tạo một thử thách ĂN UỐNG. Mô tả:\n"${aiDescription.trim()}"\n\nQuy tắc:\n1. startDate >= ${today}, endDate >= startDate, định dạng YYYY-MM-DD.\n2. goal_value: số bữa ăn cần check-in mỗi ngày (1-3).\n3. nutrition_sub_type: nếu mô tả đề cập đến khung giờ → "time_window", ngược lại "free".\n4. time_window_start, time_window_end: nếu có, định dạng "HH:mm".\n5. title: ngắn gọn, tiếng Việt.\n6. description: tối đa 150 ký tự, tiếng Việt.\n7. Chỉ trả về JSON object, không markdown.\n\n{ "title": string, "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD", "goal_value": number, "nutrition_sub_type": "free"|"time_window", "time_window_start": "HH:mm"|null, "time_window_end": "HH:mm"|null, "description": string }`
            } else {
                prompt = `Hôm nay là ${today}. Người dùng muốn tạo một thử thách THỂ DỤC. Mô tả:\n"${aiDescription.trim()}"\n\nQuy tắc:\n1. startDate >= ${today}, endDate >= startDate, định dạng YYYY-MM-DD.\n2. suggested_exercises: mảng tên tiếng Việt 2-4 bài tập.\n3. title: ngắn gọn, tiếng Việt.\n4. description: tối đa 150 ký tự, tiếng Việt.\n5. Chỉ trả về JSON object, không markdown.\n\n{ "title": string, "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD", "suggested_exercises": ["tên bài tập"], "description": string }`
            }

            const res = await fetch(AI_PROXY_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            })
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            const data = await res.json()
            const cleaned = (data?.text || '').replace(/```(?:json)?\n?/gi, '').replace(/```/g, '').trim()
            const parsed = JSON.parse(cleaned)

            setForm(prev => {
                const u = { ...prev }
                if (parsed.title) u.title = parsed.title
                if (parsed.startDate) u.startDate = parsed.startDate
                if (parsed.endDate) u.endDate = parsed.endDate
                if (parsed.goal_value && Number(parsed.goal_value) > 0) u.goal_value = String(parsed.goal_value)
                if (parsed.description) u.description = parsed.description.slice(0, 150)

                if (type === 'outdoor_activity' && parsed.category && outdoorCategories.some(c => c.name === parsed.category)) {
                    u.category = parsed.category
                    const cat = outdoorCategories.find(c => c.name === parsed.category)
                    u.kcal_per_unit = cat?.kcal_per_unit || 0
                }

                if (type === 'nutrition') {
                    u.nutrition_sub_type = parsed.nutrition_sub_type === 'time_window' ? 'time_window' : 'free'
                    if (parsed.time_window_start) u.time_window_start = parsed.time_window_start
                    if (parsed.time_window_end) u.time_window_end = parsed.time_window_end
                }
                return u
            })

            // Handle fitness suggested_exercises
            if (type === 'fitness' && Array.isArray(parsed.suggested_exercises)) {
                const newExercises = []
                for (const exName of parsed.suggested_exercises) {
                    if (typeof exName !== 'string') continue
                    const searchTerm = exName.toLowerCase().trim()
                    const match = allExercises.find(ex => {
                        const nameEn = (ex.name || '').toLowerCase()
                        const nameVi = (ex.name_vi || '').toLowerCase()
                        return (nameEn && searchTerm.includes(nameEn)) || (nameVi && searchTerm.includes(nameVi)) ||
                               (nameEn && nameEn.includes(searchTerm)) || (nameVi && nameVi.includes(searchTerm))
                    })
                    if (match && !newExercises.some(ne => ne.exercise_id === match._id)) {
                        newExercises.push({
                            exercise_id: match._id,
                            exercise_name: match.name,
                            exercise_name_vi: match.name_vi || '',
                            sets: match.default_sets?.length > 0 ? match.default_sets : [{ set_number: 1, reps: 10, weight: 1, calories_per_unit: 10 }]
                        })
                    }
                }
                setSelectedExercises(newExercises)
                if (newExercises.length === 0) toast.error('AI không tìm thấy bài tập nào khớp, vui lòng chọn thủ công.')
                else toast.success(`✨ AI đã tìm thấy ${newExercises.length} bài tập!`)
            } else {
                toast.success('✨ AI đã điền xong!')
            }

            setErrors({})
            setShowAIModal(false)
            setAiDescription('')
        } catch (err) {
            toast.error(`AI lỗi: ${err.message}`)
        } finally { setAiLoading(false) }
    }

    // ─── Styling helpers ─────────────────────────────────────────────────────
    const inputCls = (name) =>
        `w-full px-4 py-3 rounded-xl border-2 dark:bg-gray-700 dark:text-white focus:ring-4 transition outline-none text-sm ${errors[name]
            ? 'border-red-400 focus:ring-red-500/10'
            : 'border-gray-200 dark:border-gray-600 focus:border-emerald-400 focus:ring-emerald-500/10'
        }`
    const labelCls = 'block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1'
    const sectionCls = 'bg-gray-50 dark:bg-gray-700/40 rounded-xl p-4 space-y-4'

    const ErrorMsg = ({ name }) => errors[name]
        ? <p className='text-red-500 text-xs mt-1 flex items-center gap-1'><FaExclamationCircle className='shrink-0' /> {errors[name]}</p>
        : null

    // ─── Render ──────────────────────────────────────────────────────────────
    return (
        <>
            {/* ====== AI Modal ====== */}
            {showAIModal && (
                <div className='fixed inset-0 z-[60] flex items-center justify-center p-4' style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0,0,0,0.55)' }}>
                    <div className='bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up'>
                        <div className='relative bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 p-6 text-white'>
                            <div className='flex items-center gap-3'>
                                <div className='w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center shrink-0'>
                                    <MdAutoAwesome className='text-2xl' />
                                </div>
                                <div>
                                    <h3 className='font-black text-lg'>AI Điền Tự Động</h3>
                                    <p className='text-orange-100 text-xs'>Mô tả thử thách → AI tự điền toàn bộ form</p>
                                </div>
                            </div>
                            <button onClick={() => { setShowAIModal(false); setAiDescription('') }}
                                className='absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition'>
                                <FaTimes className='text-sm' />
                            </button>
                        </div>
                        <div className='p-6 space-y-4'>
                            <div>
                                <label className='block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2'>
                                    Mô tả sơ bộ về thử thách
                                </label>
                                <textarea value={aiDescription} onChange={e => setAiDescription(e.target.value)}
                                    rows={5} placeholder='Nhập thông tin thử thách để AI gợi ý...'
                                    className='w-full px-4 py-3 rounded-2xl border-2 border-orange-100 dark:border-orange-900 dark:bg-gray-700 dark:text-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none resize-none transition text-sm leading-relaxed' />
                            </div>
                            <button onClick={handleAIFill} disabled={aiLoading || !aiDescription.trim()}
                                className='w-full py-3.5 rounded-2xl font-black text-white flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 bg-gradient-to-r from-amber-500 to-orange-600 hover:shadow-lg'>
                                {aiLoading ? (
                                    <><div className='w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin' /> AI đang phân tích...</>
                                ) : (
                                    <><MdAutoAwesome className='text-lg' /> Tạo với AI</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ====== Main Form Modal ====== */}
            <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4' onClick={(e) => e.target === e.currentTarget && onClose()}>
                <div className='bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col'>
                    {/* Header */}
                    <div className='flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-200 dark:border-gray-700 shrink-0'>
                        <div className='flex items-center gap-3'>
                            <div className='p-2 bg-amber-100 dark:bg-amber-900 rounded-lg'><FaTrophy className='text-amber-600 dark:text-amber-300' /></div>
                            <h2 className='text-base font-bold text-gray-800 dark:text-white'>{isEdit ? 'Chỉnh sửa thử thách' : 'Tạo thử thách mới'}</h2>
                        </div>
                        <div className='flex items-center gap-2'>
                            <button type='button' onClick={() => setShowAIModal(true)}
                                className='flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95 hover:shadow-lg bg-gradient-to-r from-amber-500 to-orange-600'>
                                <MdAutoAwesome className='text-sm' /> AI Điền
                            </button>
                            <button onClick={onClose} className='p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors'><FaTimes className='text-gray-500' /></button>
                        </div>
                    </div>

                    {/* Scrollable form body */}
                    <form onSubmit={handleSubmit} className='overflow-y-auto flex-1 px-6 py-4 space-y-5'>

                        {/* ── 1. Thông tin chung ── */}
                        <div>
                            <p className='text-xs font-bold text-gray-400 uppercase tracking-widest mb-3'>1. Thông tin chung</p>
                            <div className={sectionCls}>
                                {/* Loại thử thách */}
                                <div>
                                    <label className={labelCls}>Loại thử thách <span className='text-red-500'>*</span></label>
                                    <div className='grid grid-cols-3 gap-2 mt-1'>
                                        {CHALLENGE_TYPES.map(t => (
                                            isEdit ? (
                                                <div key={t.key}
                                                    className={`p-3 rounded-xl border-2 text-left ${form.challenge_type === t.key
                                                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                                                        : 'border-gray-200 dark:border-gray-700 opacity-40'}`}>
                                                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${t.gradient} flex items-center justify-center text-white text-sm mb-1.5`}>{t.icon}</div>
                                                    <p className='text-xs font-semibold text-gray-800 dark:text-gray-200 leading-tight'>{t.label}</p>
                                                    <p className='text-[10px] text-gray-400 mt-0.5 leading-tight'>{t.desc}</p>
                                                </div>
                                            ) : (
                                                <button type='button' key={t.key}
                                                    onClick={() => setField('challenge_type', t.key)}
                                                    className={`p-3 rounded-xl border-2 text-left transition-all ${form.challenge_type === t.key
                                                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                                                        : 'border-gray-200 dark:border-gray-700 hover:border-orange-300'}`}>
                                                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${t.gradient} flex items-center justify-center text-white text-sm mb-1.5`}>{t.icon}</div>
                                                    <p className='text-xs font-semibold text-gray-800 dark:text-gray-200 leading-tight'>{t.label}</p>
                                                    <p className='text-[10px] text-gray-400 mt-0.5 leading-tight'>{t.desc}</p>
                                                </button>
                                            )
                                        ))}
                                    </div>
                                    {isEdit && <p className='text-[10px] text-gray-400 mt-1 italic'>🔒 Không thể thay đổi loại thử thách sau khi tạo</p>}
                                </div>

                                {/* Tên thử thách */}
                                <div data-error={!!errors.title}>
                                    <label className={labelCls}>Tên thử thách <span className='text-red-500'>*</span></label>
                                    <input value={form.title}
                                        onChange={e => setField('title', e.target.value)}
                                        onBlur={e => { const err = validateField('title', e.target.value); setErrors(p => ({ ...p, title: err })) }}
                                        className={inputCls('title')} placeholder='Nhập tên thử thách' />
                                    <ErrorMsg name='title' />
                                </div>

                                {/* Outdoor: Danh mục */}
                                {form.challenge_type === 'outdoor_activity' && (
                                    <div>
                                        <label className={labelCls}><FaBullseye className='inline mr-1 text-blue-500' /> Danh mục hoạt động <span className='text-red-500'>*</span></label>
                                        <select value={form.category}
                                            onChange={e => {
                                                const catName = e.target.value
                                                const cat = outdoorCategories.find(c => c.name === catName)
                                                setField('category', catName)
                                                setField('kcal_per_unit', cat?.kcal_per_unit || 0)
                                            }}
                                            className={inputCls('category')}>
                                            <option value='' disabled>-- Chọn danh mục --</option>
                                            {outdoorCategories.map(cat => (
                                                <option key={cat._id} value={cat.name}>{cat.name} ({cat.kcal_per_unit} kcal/km)</option>
                                            ))}
                                        </select>
                                        <ErrorMsg name='category' />
                                    </div>
                                )}

                                {/* Nutrition: sub-type (time-window) */}
                                {form.challenge_type === 'nutrition' && (
                                    <div>
                                        <label className={labelCls}><FaClock className='inline mr-1 text-emerald-500' /> Loại hình thử thách ăn uống <span className='text-red-500'>*</span></label>
                                        <div className='space-y-2'>
                                            <button type='button' onClick={() => setField('nutrition_sub_type', 'free')}
                                                className={`w-full p-3 rounded-xl border-2 flex items-start gap-3 text-left transition-all ${form.nutrition_sub_type === 'free'
                                                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 bg-white dark:bg-gray-800'}`}>
                                                <span className={`w-8 h-8 flex items-center justify-center rounded-full shrink-0 mt-0.5 ${form.nutrition_sub_type === 'free' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>🕊️</span>
                                                <div className='flex-1'>
                                                    <p className='text-sm font-semibold text-gray-800 dark:text-gray-200'>Tự do</p>
                                                    <p className='text-[11px] text-gray-400'>Check-in bất kỳ lúc nào trong ngày</p>
                                                </div>
                                                {form.nutrition_sub_type === 'free' && <div className='w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-2' />}
                                            </button>
                                            <button type='button' onClick={() => setField('nutrition_sub_type', 'time_window')}
                                                className={`w-full p-3 rounded-xl border-2 flex items-start gap-3 text-left transition-all ${form.nutrition_sub_type === 'time_window'
                                                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 bg-white dark:bg-gray-800'}`}>
                                                <span className={`w-8 h-8 flex items-center justify-center rounded-full shrink-0 mt-0.5 ${form.nutrition_sub_type === 'time_window' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>⏰</span>
                                                <div className='flex-1'>
                                                    <p className='text-sm font-semibold text-gray-800 dark:text-gray-200'>Khung giờ ăn</p>
                                                    <p className='text-[11px] text-gray-400'>Chỉ check-in trong khoảng giờ quy định</p>
                                                </div>
                                                {form.nutrition_sub_type === 'time_window' && <div className='w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-2' />}
                                            </button>
                                            {form.nutrition_sub_type === 'time_window' && (
                                                <div className='mt-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800'>
                                                    <p className='text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-1'>
                                                        <FaClock className='text-[10px]' /> Khung giờ được check-in
                                                    </p>
                                                    <div className='flex items-center gap-3'>
                                                        <div className='flex-1'>
                                                            <label className='block text-[10px] text-gray-500 mb-1'>Từ giờ</label>
                                                            <DatePicker selected={parseTime(form.time_window_start)}
                                                                onChange={date => { if (date) { const h = String(date.getHours()).padStart(2, '0'); const m = String(date.getMinutes()).padStart(2, '0'); setField('time_window_start', `${h}:${m}`) } }}
                                                                showTimeSelect showTimeSelectOnly timeIntervals={15} timeCaption='Giờ' dateFormat='HH:mm' timeFormat='HH:mm'
                                                                className='w-full px-3 py-2 rounded-lg border-2 border-emerald-200 dark:border-emerald-700 bg-white dark:bg-gray-800 outline-none focus:border-emerald-500 text-sm'
                                                                wrapperClassName='w-full' />
                                                        </div>
                                                        <span className='text-gray-400 font-bold mt-4'>→</span>
                                                        <div className='flex-1'>
                                                            <label className='block text-[10px] text-gray-500 mb-1'>Đến giờ</label>
                                                            <DatePicker selected={parseTime(form.time_window_end)}
                                                                onChange={date => { if (date) { const h = String(date.getHours()).padStart(2, '0'); const m = String(date.getMinutes()).padStart(2, '0'); setField('time_window_end', `${h}:${m}`) } }}
                                                                showTimeSelect showTimeSelectOnly timeIntervals={15} timeCaption='Giờ' dateFormat='HH:mm' timeFormat='HH:mm'
                                                                className='w-full px-3 py-2 rounded-lg border-2 border-emerald-200 dark:border-emerald-700 bg-white dark:bg-gray-800 outline-none focus:border-emerald-500 text-sm'
                                                                wrapperClassName='w-full' />
                                                        </div>
                                                    </div>
                                                    <ErrorMsg name='time_window' />
                                                    <p className='text-[10px] text-emerald-600 dark:text-emerald-400 mt-2'>💡 Check-in ngoài khung giờ này sẽ bị từ chối</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Fitness: Exercise picker */}
                                {form.challenge_type === 'fitness' && (
                                    <div>
                                        <label className={labelCls}><FaDumbbell className='inline mr-1 text-purple-500' /> Danh sách bài tập <span className='text-red-500'>*</span></label>
                                        {/* Selected exercises */}
                                        {selectedExercises.length > 0 && (
                                            <div className='space-y-1.5 mb-3'>
                                                {selectedExercises.map((ex, idx) => (
                                                    <div key={ex.exercise_id} className='flex items-center justify-between px-3 py-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800'>
                                                        <div className='flex items-center gap-2'>
                                                            <span className='w-6 h-6 rounded-full bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-300 flex items-center justify-center text-[10px] font-bold'>{idx + 1}</span>
                                                            <span className='text-sm font-medium text-gray-700 dark:text-gray-200'>{ex.exercise_name_vi || ex.exercise_name}</span>
                                                        </div>
                                                        <button type='button' onClick={() => removeExercise(ex.exercise_id)}
                                                            className='p-1 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition'>
                                                            <FaTimes size={10} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {/* Search input */}
                                        <div ref={exerciseSearchRef} className='relative'>
                                            <input value={exerciseSearch}
                                                onChange={e => { setExerciseSearch(e.target.value); setShowExerciseDropdown(true) }}
                                                onFocus={() => setShowExerciseDropdown(true)}
                                                placeholder='🔍 Tìm bài tập...'
                                                className={inputCls('exercises')} />
                                            {showExerciseDropdown && filteredExercises.length > 0 && (
                                                <div className='absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-48 overflow-y-auto'>
                                                    {filteredExercises.map(ex => (
                                                        <div key={ex._id} onClick={() => addExercise(ex)}
                                                            className='px-3 py-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer text-sm text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700 last:border-0'>
                                                            💪 {ex.name_vi || ex.name}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <ErrorMsg name='exercises' />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── 2. Mục tiêu ── */}
                        <div>
                            <p className='text-xs font-bold text-gray-400 uppercase tracking-widest mb-3'>2. Mục tiêu</p>
                            <div className={sectionCls}>
                                {form.challenge_type === 'fitness' ? (
                                    <div className='flex items-start gap-2 px-3 py-2 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800 text-xs text-purple-700 dark:text-purple-300'>
                                        <FaInfoCircle className='mt-0.5 shrink-0' />
                                        <span>Mục tiêu sẽ tự động tính theo số bài tập đã chọn: <strong>{selectedExercises.length} bài tập/ngày</strong></span>
                                    </div>
                                ) : (
                                    <div data-error={!!errors.goal_value}>
                                        <label className={labelCls}>
                                            {form.challenge_type === 'outdoor_activity' ? '🎯 Mục tiêu mỗi ngày (km)' : `🎯 Giá trị mục tiêu mỗi ngày (${form.goal_unit})`} <span className='text-red-500'>*</span>
                                        </label>
                                        <div className='flex gap-2'>
                                            <input type='number' value={form.goal_value}
                                                onChange={e => setField('goal_value', e.target.value)}
                                                onBlur={e => { const err = validateField('goal_value', e.target.value); setErrors(p => ({ ...p, goal_value: err })) }}
                                                placeholder={form.challenge_type === 'outdoor_activity' ? '5' : '3'}
                                                min='1' className='flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm text-center font-bold outline-none focus:border-orange-400' />
                                            <div className='px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-sm font-semibold text-gray-500 min-w-[60px] text-center'>
                                                {form.challenge_type === 'outdoor_activity' ? 'km' : form.goal_unit}
                                            </div>
                                        </div>
                                        <ErrorMsg name='goal_value' />
                                        {form.challenge_type === 'outdoor_activity' && form.goal_value && selectedCat && (
                                            <div className='mt-2 p-2.5 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800 flex items-center gap-2 text-xs'>
                                                <FaFire className='text-orange-500 shrink-0' />
                                                <span className='text-orange-700 dark:text-orange-300'>
                                                    Ước tính ~{Math.round(Number(form.goal_value) * (selectedCat.kcal_per_unit || 0)).toLocaleString()} kcal ({selectedCat.kcal_per_unit} kcal/km × {form.goal_value} km)
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── 3. Thời gian ── */}
                        <div>
                            <p className='text-xs font-bold text-gray-400 uppercase tracking-widest mb-3'>3. Thời gian</p>
                            <div className={sectionCls}>
                                <div className='grid grid-cols-2 gap-3'>
                                    <div data-error={!!errors.startDate}>
                                        <label className={labelCls}>
                                            <FaCalendarAlt className='inline mr-1 text-green-500' /> Ngày bắt đầu <span className='text-red-500'>*</span>
                                        </label>
                                        <input type='date' value={form.startDate}
                                            onChange={e => { setField('startDate', e.target.value); if (e.target.value.length === 10) { const err = validateField('startDate', e.target.value); setErrors(p => ({ ...p, startDate: err })) } }}
                                            className={inputCls('startDate')} />
                                        <ErrorMsg name='startDate' />
                                    </div>
                                    <div data-error={!!errors.endDate}>
                                        <label className={labelCls}>
                                            <FaCalendarAlt className='inline mr-1 text-red-400' /> Ngày kết thúc <span className='text-red-500'>*</span>
                                        </label>
                                        <input type='date' value={form.endDate}
                                            onChange={e => { setField('endDate', e.target.value); if (e.target.value.length === 10) { const err = validateField('endDate', e.target.value); setErrors(p => ({ ...p, endDate: err })) } }}
                                            className={inputCls('endDate')} />
                                        <ErrorMsg name='endDate' />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── 4. Hình ảnh & Mô tả ── */}
                        <div>
                            <p className='text-xs font-bold text-gray-400 uppercase tracking-widest mb-3'>4. Hình ảnh & Mô tả</p>
                            <div className={sectionCls}>
                                <div data-error={!!errors.image}>
                                    <CloudinaryImageUploader
                                        label='Ảnh bìa'
                                        required
                                        value={form.image}
                                        onChange={(url) => { setForm(prev => ({ ...prev, image: url })); if (errors.image) setErrors(prev => ({ ...prev, image: null })) }}
                                        error={errors.image}
                                        folder='challenges'
                                    />
                                </div>

                                <div>
                                    <label className={labelCls}><FaClipboardList className='inline mr-1' /> Mô tả ngắn</label>
                                    <textarea value={form.description} onChange={e => setField('description', e.target.value)}
                                        className={inputCls('description') + ' resize-none'} rows={2} maxLength={150}
                                        placeholder='Mô tả ngắn gọn trong 150 ký tự...' />
                                    <span className='text-[10px] text-gray-400 font-bold float-right'>{form.description.length}/150</span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className='flex justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-700'>
                            <button type='button' onClick={onClose}
                                className='px-5 py-2 text-sm bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors'>
                                Hủy
                            </button>
                            <button type='submit' disabled={submitting}
                                className='px-5 py-2 text-sm bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2'>
                                {submitting ? '⏳ Đang xử lý...' : isEdit ? '💾 Lưu thay đổi' : '➕ Tạo thử thách'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    )
}
