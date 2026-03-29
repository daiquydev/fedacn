import React, { useState, useEffect } from 'react'
import {
    FaCalendarAlt, FaUsers, FaMapMarkerAlt,
    FaTimes, FaExclamationCircle, FaClock, FaBullseye, FaInfoCircle
} from 'react-icons/fa'
import { MdAutoAwesome } from 'react-icons/md'
import moment from 'moment'
import toast from 'react-hot-toast'
import adminSportEventApi from '../../apis/sportEventApi'
import CloudinaryImageUploader from '../../components/GlobalComponents/CloudinaryImageUploader'

// ─── Date/Time Helpers (synced from User FE) ─────────────────────────────────
const isValidDateStr = (val) => {
    if (!val || val.length !== 10) return false
    const [d, m, y] = val.split('/').map(Number)
    if (!d || !m || !y || y < 2000 || y > 2100) return false
    const date = new Date(y, m - 1, d)
    return date.getDate() === d && date.getMonth() === m - 1 && date.getFullYear() === y
}

const isValidTimeStr = (val) => {
    if (!val || val.length !== 5) return false
    const [h, min] = val.split(':').map(Number)
    return h >= 0 && h <= 23 && min >= 0 && min <= 59
}

const isPastDate = (dateStr) => {
    if (!isValidDateStr(dateStr)) return false
    const [d, m, y] = dateStr.split('/').map(Number)
    const date = new Date(y, m - 1, d)
    const today = new Date(); today.setHours(0, 0, 0, 0)
    return date < today
}

const parseDateToISO = (dateStr, timeStr = '00:00') => {
    const [d, m, y] = dateStr.split('/')
    // Construct UTC ISO string directly to avoid local timezone shifting date back by 1 day
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T${timeStr}:00.000Z`
}

const formatDateInput = (raw) => {
    const digits = raw.replace(/\D/g, '').slice(0, 8)
    if (digits.length <= 2) return digits
    if (digits.length <= 4) return digits.slice(0, 2) + '/' + digits.slice(2)
    return digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4)
}

const formatTimeInput = (raw) => {
    const digits = raw.replace(/\D/g, '').slice(0, 4)
    if (digits.length <= 2) return digits
    return digits.slice(0, 2) + ':' + digits.slice(2)
}

// ─── AI Proxy ────────────────────────────────────────────────────────────────
const AI_PROXY_ENDPOINT = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/ai/generate`

// ─── Event Form Modal (synced from User FE) ──────────────────────────────────
export default function EventFormModal({ event, categories, onClose, onSuccess }) {
    const isEdit = Boolean(event)

    // Form state — DD/MM/YYYY format (synced from User FE)
    const [form, setForm] = useState({
        name: event?.name || '',
        startDate: event?.startDate ? moment(event.startDate).format('DD/MM/YYYY') : '',
        endDate: event?.endDate ? moment(event.endDate).format('DD/MM/YYYY') : '',
        eventTime: event?.startDate ? moment(event.startDate).format('HH:mm') : '08:00',
        location: event?.location || '',
        category: event?.category || '',
        maxParticipants: event?.maxParticipants || 50,
        targetValue: event?.targetValue || 0,
        targetUnit: (() => {
            const unit = event?.targetUnit || 'km'
            const type = event?.eventType || 'Ngoài trời'
            if (type === 'Trong nhà' && unit === 'km') return 'kcal'
            return unit
        })(),
        image: event?.image || '',
        description: event?.description || '',
        detailedDescription: event?.detailedDescription || '',
        eventType: event?.eventType || 'Ngoài trời',
        requirements: event?.requirements || '',
        benefits: event?.benefits || ''
    })

    const [errors, setErrors] = useState({})
    const [submitting, setSubmitting] = useState(false)

    // AI state
    const [showAIModal, setShowAIModal] = useState(false)
    const [aiDescription, setAiDescription] = useState('')
    const [aiLoading, setAiLoading] = useState(false)

    // Location autocomplete
    const [locationSuggestions, setLocationSuggestions] = useState([])
    const [showSuggestions, setShowSuggestions] = useState(false)

    const filteredCategories = categories.filter(c => c.type === form.eventType)

    // Default category when eventType changes
    useEffect(() => {
        if (filteredCategories.length > 0) {
            setForm(prev => {
                if (!filteredCategories.some(c => c.name === prev.category)) {
                    return { ...prev, category: filteredCategories[0].name }
                }
                return prev
            })
        }
    }, [categories, form.eventType])

    const handleEventTypeChange = (type) => {
        setForm(prev => ({
            ...prev,
            eventType: type,
            targetUnit: (type === 'Trong nhà' && prev.targetUnit === 'km') ? 'kcal' : prev.targetUnit
        }))
    }

    // ── Real-time Validation (synced from User FE) ──
    const validateField = (name, value, currentState = form) => {
        let error = null
        switch (name) {
            case 'name':
                if (!value?.trim()) error = 'Vui lòng nhập tên sự kiện'
                break
            case 'startDate':
                if (!value) error = 'Vui lòng nhập ngày bắt đầu'
                else if (!isValidDateStr(value)) error = 'Ngày không hợp lệ — DD/MM/YYYY'
                else if (isPastDate(value)) error = 'Không thể chọn ngày trong quá khứ'
                else if (currentState.endDate && isValidDateStr(currentState.endDate)) {
                    const [sd, sm, sy] = value.split('/').map(Number)
                    const [ed, em, ey] = currentState.endDate.split('/').map(Number)
                    if (new Date(ey, em - 1, ed) < new Date(sy, sm - 1, sd))
                        setErrors(prev => ({ ...prev, endDate: 'Ngày kết thúc phải sau ngày bắt đầu' }))
                    else
                        setErrors(prev => ({ ...prev, endDate: null }))
                }
                break
            case 'endDate':
                if (!value) error = 'Vui lòng nhập ngày kết thúc'
                else if (!isValidDateStr(value)) error = 'Ngày không hợp lệ — DD/MM/YYYY'
                else if (currentState.startDate && isValidDateStr(currentState.startDate)) {
                    const [sd, sm, sy] = currentState.startDate.split('/').map(Number)
                    const [ed, em, ey] = value.split('/').map(Number)
                    if (new Date(ey, em - 1, ed) < new Date(sy, sm - 1, sd))
                        error = 'Ngày kết thúc phải sau ngày bắt đầu'
                }
                break
            case 'eventTime':
                if (!value) error = 'Vui lòng nhập thời điểm'
                else if (!isValidTimeStr(value)) error = 'Thời điểm không hợp lệ — HH:mm'
                break
            case 'location':
                if (currentState.eventType === 'Ngoài trời' && !value?.trim()) error = 'Vui lòng nhập địa điểm'
                break
            case 'description':
                if (!value?.trim()) error = 'Vui lòng nhập mô tả ngắn'
                break
            case 'image':
                if (!value?.trim()) error = 'Vui lòng tải lên ảnh bìa'
                break
            default: break
        }
        setErrors(prev => ({ ...prev, [name]: error }))
        return error
    }

    // ── Input Handlers ──
    const handleChange = (e) => {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }))

        if (name === 'location') {
            if (value.length > 2) {
                fetch(`https://rsapi.goong.io/Place/AutoComplete?api_key=UMRiT4CiOH9UU9Ju9L1YJLSYZM5EQberRoSsyfDW&input=${encodeURIComponent(value)}`)
                    .then(res => res.json())
                    .then(data => { if (data.predictions) { setLocationSuggestions(data.predictions); setShowSuggestions(true) } })
                    .catch(console.error)
            } else { setShowSuggestions(false) }
        }
    }

    const handleDateChange = (e) => {
        const { name, value } = e.target
        const formatted = formatDateInput(value)
        setForm(prev => ({ ...prev, [name]: formatted }))
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }))
    }

    const handleTimeChange = (e) => {
        const { name, value } = e.target
        const formatted = formatTimeInput(value)
        setForm(prev => ({ ...prev, [name]: formatted }))
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }))
    }

    const handleSelectLocation = (address) => {
        setForm(prev => ({ ...prev, location: address }))
        setShowSuggestions(false)
        if (errors.location) setErrors(prev => ({ ...prev, location: null }))
    }

    // ── AI Fill (enabled for BOTH create and edit) ──
    const handleAIFill = async () => {
        if (!aiDescription.trim()) { toast.error('Vui lòng nhập mô tả sự kiện trước!'); return }
        setAiLoading(true)
        try {
            const today = moment().format('DD/MM/YYYY')
            const allCatNames = categories.map(c => `${c.name} (${c.type})`).join(', ')
            const outdoorCats = categories.filter(c => c.type === 'Ngoài trời').map(c => c.name).join(', ')
            const indoorCats = categories.filter(c => c.type === 'Trong nhà').map(c => c.name).join(', ')

            const prompt = `Hôm nay là ngày ${today}. Múi giờ Việt Nam (UTC+7).
Người dùng muốn tạo một sự kiện thể thao. Dưới đây là mô tả sơ bộ của họ:

"${aiDescription.trim()}"

Hãy điền đầy đủ tất cả các trường sau thành một JSON object hợp lệ. Tuân thủ các quy tắc:
1. Nếu mô tả đã có thông tin rõ ràng cho một trường → dùng thông tin đó.
2. Nếu không có → tự suy luận hợp lý, thực tế, phù hợp văn hóa Việt Nam và ngữ cảnh thể thao.
3. Ngày: định dạng DD/MM/YYYY. startDate phải >= ${today}. endDate phải >= startDate.
4. eventType: chỉ được là "Ngoài trời" hoặc "Trong nhà".
   - Hoạt động ngoài trời (category thuộc list: ${outdoorCats}) → "Ngoài trời"
   - Hoạt động trong nhà (category thuộc list: ${indoorCats}) → "Trong nhà"
5. category: phải là một trong: ${allCatNames}. Chỉ điền tên category.
6. targetUnit: "km", "kcal", "phút", "giờ".
7. image: để ''
8. description: tối đa 150 ký tự, tiếng Việt.
9. detailedDescription: chi tiết hơn, tiếng Việt.
10. requirements, benefits: ngắn gọn, tiếng Việt.
11. maxParticipants: 20-500.
12. Địa điểm: thực tế tại TP.HCM nếu không nêu.
13. Chỉ trả về JSON object, không markdown.

JSON output:
{
  "name": string,
  "eventType": "Ngoài trời" | "Trong nhà",
  "category": string,
  "startDate": "DD/MM/YYYY",
  "endDate": "DD/MM/YYYY",
  "eventTime": "HH:mm",
  "location": string,
  "maxParticipants": number,
  "targetValue": number,
  "targetUnit": "km" | "kcal" | "phút" | "giờ",
  "image": string,
  "description": string,
  "detailedDescription": string,
  "requirements": string,
  "benefits": string
}`

            const response = await fetch(AI_PROXY_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            })
            if (!response.ok) throw new Error(`HTTP ${response.status}`)
            const data = await response.json()
            const cleaned = (data?.text || '').replace(/```(?:json)?\n?/gi, '').replace(/```/g, '').trim()
            const parsed = JSON.parse(cleaned)

            setForm(prev => {
                const u = { ...prev }
                if (parsed.name) u.name = parsed.name
                if (parsed.eventType === 'Ngoài trời' || parsed.eventType === 'Trong nhà') u.eventType = parsed.eventType
                if (parsed.category) { const m = categories.find(c => c.name === parsed.category); if (m) u.category = m.name }
                if (parsed.startDate) u.startDate = parsed.startDate
                if (parsed.endDate) u.endDate = parsed.endDate
                if (parsed.eventTime) u.eventTime = parsed.eventTime
                if (parsed.location) u.location = parsed.location
                if (parsed.maxParticipants) u.maxParticipants = Number(parsed.maxParticipants)
                if (parsed.targetValue !== undefined) u.targetValue = Number(parsed.targetValue)
                if (['km', 'kcal', 'phút', 'giờ'].includes(parsed.targetUnit)) u.targetUnit = parsed.targetUnit
                if (parsed.description) u.description = parsed.description.slice(0, 150)
                if (parsed.detailedDescription) u.detailedDescription = parsed.detailedDescription
                if (parsed.requirements) u.requirements = parsed.requirements
                if (parsed.benefits) u.benefits = parsed.benefits
                return u
            })
            setErrors({})
            setShowAIModal(false)
            setAiDescription('')
            toast.success('✨ AI đã điền xong các trường!')
        } catch (err) {
            toast.error(`❌ AI gặp lỗi: ${err.message || 'Không thể xử lý'}`)
        } finally { setAiLoading(false) }
    }

    // ── Full Form Validation ──
    const validateForm = () => {
        const fields = ['name', 'startDate', 'endDate', 'eventTime', ...(form.eventType === 'Ngoài trời' ? ['location'] : []), 'description', 'image']
        const sErr = {}
        fields.forEach(f => {
            const e = validateField(f, form[f])
            if (e) sErr[f] = e
        })
        setErrors(sErr)
        return Object.keys(sErr).length === 0
    }

    // ── Submit ──
    const handleSubmit = async (e) => {
        e.preventDefault()
        if (submitting) return
        if (!validateForm()) {
            toast.error('Vui lòng kiểm tra lại các thông tin bắt buộc')
            setTimeout(() => {
                const firstErrEl = document.querySelector('[data-error="true"]')
                if (firstErrEl) firstErrEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }, 50)
            return
        }

        setSubmitting(true)
        try {
            const timeStr = form.eventTime || '00:00'
            const startISO = parseDateToISO(form.startDate, timeStr)
            const endISO = parseDateToISO(form.endDate, '23:59')
            const finalUnit = (form.eventType === 'Trong nhà' && form.targetUnit === 'km') ? 'kcal' : form.targetUnit

            const payload = {
                name: form.name,
                description: form.description,
                detailedDescription: form.detailedDescription,
                category: form.category,
                eventType: form.eventType,
                startDate: startISO,
                endDate: endISO,
                location: form.eventType === 'Trong nhà' ? (form.location?.trim() || 'Video call trực tuyến') : form.location,
                maxParticipants: Number(form.maxParticipants),
                targetValue: Number(form.targetValue),
                targetUnit: finalUnit,
                image: form.image,
                requirements: form.requirements,
                benefits: form.benefits
            }

            if (isEdit) {
                await adminSportEventApi.update(event._id, payload)
                toast.success('Cập nhật sự kiện thành công!')
            } else {
                await adminSportEventApi.create(payload)
                toast.success('Tạo sự kiện thành công!')
            }
            onSuccess()
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Có lỗi xảy ra')
        } finally { setSubmitting(false) }
    }

    // ── Styling helpers ──
    const inputCls = (name) =>
        `w-full px-4 py-3 rounded-xl border-2 dark:bg-gray-700 dark:text-white focus:ring-4 transition outline-none text-sm ${errors[name]
            ? 'border-red-400 focus:ring-red-500/10'
            : 'border-gray-200 dark:border-gray-600 focus:border-emerald-400 focus:ring-emerald-500/10'
        }`
    const labelCls = 'block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1'
    const sectionCls = 'bg-gray-50 dark:bg-gray-700/40 rounded-xl p-4 space-y-4'

    const ErrorMsg = ({ name }) => errors[name]
        ? <p className='text-red-500 text-xs mt-1 flex items-center gap-1'>
            <FaExclamationCircle className='shrink-0' /> {errors[name]}
        </p>
        : null

    // ── Render ──
    return (
        <>
            {/* ====== AI Modal ====== */}
            {showAIModal && (
                <div className='fixed inset-0 z-[60] flex items-center justify-center p-4' style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0,0,0,0.55)' }}>
                    <div className='bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up'>
                        {/* Header */}
                        <div className='relative bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-6 text-white'>
                            <div className='flex items-center gap-3'>
                                <div className='w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center shrink-0'>
                                    <MdAutoAwesome className='text-2xl' />
                                </div>
                                <div>
                                    <h3 className='font-black text-lg'>AI Điền Tự Động</h3>
                                    <p className='text-purple-100 text-xs'>Mô tả sự kiện → AI tự điền toàn bộ form</p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setShowAIModal(false); setAiDescription('') }}
                                className='absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition'
                            >
                                <FaTimes className='text-sm' />
                            </button>
                        </div>
                        {/* Body */}
                        <div className='p-6 space-y-4'>
                            <div>
                                <label className='block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2'>
                                    Mô tả sơ bộ về sự kiện của bạn
                                </label>
                                <textarea
                                    value={aiDescription}
                                    onChange={e => setAiDescription(e.target.value)}
                                    rows={5}
                                    placeholder='Ví dụ: "Giải chạy bộ bán marathon buổi sáng tại công viên Tao Đàn, TP.HCM, dành cho cộng đồng yêu thể thao, khoảng 100 người, chạy 21km, tổ chức vào cuối tháng 3/2026..."'
                                    className='w-full px-4 py-3 rounded-2xl border-2 border-purple-100 dark:border-purple-900 dark:bg-gray-700 dark:text-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none resize-none transition text-sm leading-relaxed'
                                />
                                <p className='text-xs text-gray-400 mt-1'>Càng chi tiết, AI càng điền chính xác hơn. Có thể dùng tiếng Việt.</p>
                            </div>
                            <div className='bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl p-4 border border-purple-100 dark:border-purple-800'>
                                <p className='text-xs font-bold text-purple-700 dark:text-purple-300 mb-2'>💡 Gợi ý mô tả:</p>
                                <ul className='text-xs text-purple-600 dark:text-purple-400 space-y-1'>
                                    <li>• Loại thể thao (chạy bộ, đạp xe, yoga...)</li>
                                    <li>• Địa điểm tổ chức</li>
                                    <li>• Số người tham gia mong muốn</li>
                                    <li>• Thời gian / ngày dự kiến</li>
                                    <li>• Mục tiêu (5km, 100 kcal...)</li>
                                </ul>
                            </div>
                            <button
                                onClick={handleAIFill}
                                disabled={aiLoading || !aiDescription.trim()}
                                className='w-full py-3.5 rounded-2xl font-black text-white flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95'
                                style={{ background: aiLoading || !aiDescription.trim() ? '#a78bfa' : 'linear-gradient(135deg, #7c3aed, #4338ca)' }}
                            >
                                {aiLoading ? (
                                    <><div className='w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin' /> AI đang phân tích và điền form...</>
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
                            <div className='p-2 bg-blue-100 dark:bg-blue-900 rounded-lg'><FaCalendarAlt className='text-blue-600 dark:text-blue-300' /></div>
                            <h2 className='text-base font-bold text-gray-800 dark:text-white'>{isEdit ? 'Chỉnh sửa sự kiện' : 'Tạo sự kiện mới'}</h2>
                        </div>
                        <div className='flex items-center gap-2'>
                            {/* AI button — enabled for BOTH create and edit */}
                            <button type='button' onClick={() => setShowAIModal(true)}
                                className='flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95 hover:shadow-lg'
                                style={{ background: 'linear-gradient(135deg, #7c3aed, #4338ca)' }}>
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
                                {/* Tên sự kiện */}
                                <div data-error={!!errors.name}>
                                    <label className={labelCls}>Tên sự kiện <span className='text-red-500'>*</span></label>
                                    <input name='name' value={form.name} onChange={handleChange}
                                        onBlur={e => validateField('name', e.target.value)}
                                        className={inputCls('name')} placeholder='VD: Marathon Sài Gòn Night Run 2026' />
                                    <ErrorMsg name='name' />
                                </div>

                                {/* Hình thức tổ chức */}
                                <div>
                                    <label className={labelCls}>Hình thức tổ chức <span className='text-red-500'>*</span></label>
                                    <div className='grid grid-cols-2 gap-3 mt-1'>
                                        <button type='button' onClick={() => handleEventTypeChange('Ngoài trời')}
                                            className={`flex flex-col items-center gap-1.5 py-3 px-4 rounded-xl border-2 transition-all text-sm font-semibold ${form.eventType === 'Ngoài trời' ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'border-gray-200 dark:border-slate-600 text-gray-500 hover:border-green-300'}`}>
                                            <span className='text-2xl'>🌿</span>
                                            <span>Ngoài trời</span>
                                            <span className='text-xs text-gray-400 font-normal'>Chạy bộ, đạp xe, leo núi...</span>
                                        </button>
                                        <button type='button' onClick={() => handleEventTypeChange('Trong nhà')}
                                            className={`flex flex-col items-center gap-1.5 py-3 px-4 rounded-xl border-2 transition-all text-sm font-semibold ${form.eventType === 'Trong nhà' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'border-gray-200 dark:border-slate-600 text-gray-500 hover:border-blue-300'}`}>
                                            <span className='text-2xl'>🏠</span>
                                            <span>Trong nhà</span>
                                            <span className='text-xs text-gray-400 font-normal'>Gym, yoga, bơi lội...</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Danh mục */}
                                <div>
                                    <label className={labelCls}>Danh mục thể thao <span className='text-red-500'>*</span></label>
                                    {filteredCategories.length > 0 ? (
                                        <select name='category' value={form.category} onChange={handleChange} className={inputCls('category')}>
                                            {filteredCategories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                                        </select>
                                    ) : (
                                        <input name='category' value={form.category} onChange={handleChange} className={inputCls('category')} placeholder='Nhập tên danh mục...' />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── 2. Thời gian & Địa điểm ── */}
                        <div>
                            <p className='text-xs font-bold text-gray-400 uppercase tracking-widest mb-3'>2. Thời gian &amp; Địa điểm</p>
                            <div className={sectionCls}>
                                {/* Ngày + Giờ — text inputs DD/MM/YYYY */}
                                <div className='grid grid-cols-3 gap-3'>
                                    <div data-error={!!errors.startDate}>
                                        <label className={labelCls}>
                                            <FaCalendarAlt className='inline mr-1 text-green-500' />
                                            Ngày bắt đầu <span className='text-red-500'>*</span>
                                        </label>
                                        <input type='text' name='startDate' value={form.startDate}
                                            onChange={handleDateChange}
                                            onBlur={e => validateField('startDate', e.target.value)}
                                            placeholder='DD/MM/YYYY' maxLength={10}
                                            className={inputCls('startDate')} />
                                        <ErrorMsg name='startDate' />
                                    </div>
                                    <div data-error={!!errors.endDate}>
                                        <label className={labelCls}>
                                            <FaCalendarAlt className='inline mr-1 text-red-400' />
                                            Ngày kết thúc <span className='text-red-500'>*</span>
                                        </label>
                                        <input type='text' name='endDate' value={form.endDate}
                                            onChange={handleDateChange}
                                            onBlur={e => validateField('endDate', e.target.value)}
                                            placeholder='DD/MM/YYYY' maxLength={10}
                                            className={inputCls('endDate')} />
                                        <ErrorMsg name='endDate' />
                                    </div>
                                    <div data-error={!!errors.eventTime}>
                                        <label className={labelCls}>
                                            <FaClock className='inline mr-1 text-orange-400' />
                                            Thời điểm <span className='text-red-500'>*</span>
                                        </label>
                                        <input type='text' name='eventTime' value={form.eventTime}
                                            onChange={handleTimeChange}
                                            onBlur={e => validateField('eventTime', e.target.value)}
                                            placeholder='HH:mm' maxLength={5}
                                            className={inputCls('eventTime')} />
                                        <ErrorMsg name='eventTime' />
                                    </div>
                                </div>

                                {/* Hint */}
                                <div className='flex items-start gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300'>
                                    <FaInfoCircle className='mt-0.5 shrink-0' />
                                    <span>Nhập ngày theo <strong>DD/MM/YYYY</strong> (VD: 15/06/2026) và giờ theo <strong>HH:mm</strong> (VD: 07:30).</span>
                                </div>

                                {/* Địa điểm */}
                                {form.eventType === 'Ngoài trời' && (
                                    <div className='relative' data-error={!!errors.location}>
                                        <label className={labelCls}>
                                            <FaMapMarkerAlt className='inline mr-1 text-green-500' />
                                            Địa điểm cụ thể <span className='text-red-500'>*</span>
                                        </label>
                                        <input name='location' value={form.location} onChange={handleChange}
                                            onBlur={() => { setTimeout(() => setShowSuggestions(false), 200); validateField('location', form.location) }}
                                            className={inputCls('location')} placeholder='Tìm địa điểm...' />
                                        {showSuggestions && locationSuggestions.length > 0 && (
                                            <div className='absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-48 overflow-y-auto'>
                                                {locationSuggestions.map((sl, i) => (
                                                    <div key={i} className='px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700 last:border-0'
                                                        onClick={() => handleSelectLocation(sl.description)}>
                                                        📍 {sl.description}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <ErrorMsg name='location' />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── 3. Mục tiêu & Sức chứa ── */}
                        <div>
                            <p className='text-xs font-bold text-gray-400 uppercase tracking-widest mb-3'>3. Mục tiêu &amp; Sức chứa</p>
                            <div className={sectionCls}>
                                <div className='grid grid-cols-2 gap-4'>
                                    {/* Số người tối đa */}
                                    <div>
                                        <label className={labelCls}>
                                            <FaUsers className='inline mr-1 text-blue-500' />
                                            Số người tối đa <span className='text-red-500'>*</span>
                                        </label>
                                        <div className='flex items-center border-2 border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden dark:bg-gray-700'>
                                            <button type='button'
                                                onClick={() => setForm(p => ({ ...p, maxParticipants: Math.max(1, Number(p.maxParticipants) - 10) }))}
                                                className='px-3 py-2.5 bg-gray-100 dark:bg-gray-600 font-bold text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-500 transition text-lg'>−</button>
                                            <input type='number' name='maxParticipants' value={form.maxParticipants} onChange={handleChange} min='1'
                                                className='flex-1 py-2.5 bg-transparent dark:text-white text-center font-bold text-sm focus:outline-none' />
                                            <button type='button'
                                                onClick={() => setForm(p => ({ ...p, maxParticipants: Number(p.maxParticipants) + 10 }))}
                                                className='px-3 py-2.5 bg-gray-100 dark:bg-gray-600 font-bold text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-500 transition text-lg'>+</button>
                                        </div>
                                        <p className='text-xs text-gray-400 mt-1 font-medium'>Tối đa người tham gia</p>
                                    </div>

                                    {/* Mục tiêu */}
                                    <div>
                                        <label className={labelCls}>
                                            <FaBullseye className='inline mr-1 text-orange-500' />
                                            Mục tiêu sự kiện
                                        </label>
                                        <div className='flex gap-2'>
                                            <input type='number' name='targetValue' value={form.targetValue} onChange={handleChange} min='0'
                                                className='flex-1 px-3 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm text-center font-bold outline-none focus:border-orange-400' />
                                            <select name='targetUnit' value={form.targetUnit} onChange={handleChange}
                                                className='w-20 px-2 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm font-bold outline-none focus:border-orange-400'>
                                                {form.eventType === 'Ngoài trời' && <option value='km'>km</option>}
                                                <option value='kcal'>kcal</option>
                                                <option value='phút'>phút</option>
                                                <option value='giờ'>giờ</option>
                                            </select>
                                        </div>
                                        <p className='text-xs text-gray-400 mt-1 font-medium'>Mục tiêu cần hoàn thành</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── 4. Hình ảnh & Mô tả ── */}
                        <div>
                            <p className='text-xs font-bold text-gray-400 uppercase tracking-widest mb-3'>4. Hình ảnh &amp; Mô tả</p>
                            <div className={sectionCls}>
                                {/* Ảnh bìa */}
                                <div data-error={!!errors.image}>
                                    <CloudinaryImageUploader
                                        label="Ảnh bìa"
                                        required
                                        value={form.image}
                                        onChange={(url) => { setForm(prev => ({ ...prev, image: url })); if (errors.image) setErrors(prev => ({ ...prev, image: null })) }}
                                        error={errors.image}
                                        folder="sport-events"
                                    />
                                </div>

                                {/* Mô tả ngắn */}
                                <div data-error={!!errors.description}>
                                    <label className={labelCls}>Mô tả ngắn <span className='text-red-500'>*</span></label>
                                    <textarea name='description' value={form.description} onChange={handleChange}
                                        onBlur={e => validateField('description', e.target.value)}
                                        className={inputCls('description') + ' resize-none'} rows={2} maxLength={150}
                                        placeholder='Mô tả ngắn gọn trong 150 ký tự...' />
                                    <div className='flex justify-between items-center mt-1'>
                                        <ErrorMsg name='description' />
                                        <span className='text-[10px] text-gray-400 font-bold ml-auto'>{form.description.length}/150</span>
                                    </div>
                                </div>

                                {/* Mô tả chi tiết */}
                                <div>
                                    <label className={labelCls}>Mô tả chi tiết</label>
                                    <textarea name='detailedDescription' value={form.detailedDescription} onChange={handleChange}
                                        className={inputCls('detailedDescription') + ' resize-none'} rows={4}
                                        placeholder='Thông tin chi tiết, lịch trình, lưu ý...' />
                                </div>

                                {/* Yêu cầu + Lợi ích */}
                                <div className='grid grid-cols-2 gap-3'>
                                    <div>
                                        <label className={labelCls}>Yêu cầu tham gia</label>
                                        <input name='requirements' value={form.requirements} onChange={handleChange}
                                            className={inputCls('requirements')} placeholder='VD: Sức khỏe ổn định...' />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Lợi ích khi tham gia</label>
                                        <input name='benefits' value={form.benefits} onChange={handleChange}
                                            className={inputCls('benefits')} placeholder='VD: Voucher, huy chương...' />
                                    </div>
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
                                className='px-5 py-2 text-sm bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2'>
                                {submitting ? '⏳ Đang xử lý...' : isEdit ? '💾 Lưu thay đổi' : '➕ Tạo sự kiện'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    )
}
