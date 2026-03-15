import React, { useState, useCallback, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    FaCalendarAlt, FaPlus, FaEdit, FaTrash, FaUndo, FaSearch,
    FaFilter, FaUsers, FaMapMarkerAlt, FaRunning, FaHome,
    FaTimes, FaExclamationTriangle, FaSync, FaChevronDown, FaSortAmountDown
} from 'react-icons/fa'
import { MdAutoAwesome } from 'react-icons/md'
import moment from 'moment'
import toast from 'react-hot-toast'
import adminSportEventApi from '../../apis/sportEventApi'
import Loading from '../../components/GlobalComponents/Loading'
import CloudinaryImageUploader from '../../components/GlobalComponents/CloudinaryImageUploader'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const EVENT_TYPE_OPTIONS = ['all', 'Ngoài trời', 'Trong nhà']
const STATUS_OPTIONS = [
    { value: 'active', label: 'Đang hoạt động' },
    { value: 'deleted', label: 'Đã xóa' },
    { value: 'all', label: 'Tất cả' }
]

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, iconBg, borderColor }) {
    return (
        <div className={`bg-white dark:bg-gray-800 rounded-xl px-5 py-4 border-l-4 ${borderColor} shadow-sm border border-gray-100 dark:border-gray-700`}>
            <div className='flex items-center justify-between'>
                <div>
                    <p className='text-xs text-gray-400 dark:text-gray-500 mb-1'>{label}</p>
                    <p className='text-2xl font-black text-gray-800 dark:text-white'>{value ?? '—'}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
                    <Icon className='text-white text-base' />
                </div>
            </div>
        </div>
    )
}

// ─── Event Form Modal ─────────────────────────────────────────────────────────
function EventFormModal({ event, categories, onClose, onSuccess }) {
    const isEdit = Boolean(event)
    const defaultValues = {
        name: event?.name || '',
        description: event?.description || '',
        detailedDescription: event?.detailedDescription || '',
        category: event?.category || '',
        eventType: event?.eventType || 'Ngoài trời',
        startDate: event?.startDate ? event.startDate.slice(0, 10) : '',
        endDate: event?.endDate ? event.endDate.slice(0, 10) : '',
        eventTime: event?.startDate ? new Date(event.startDate).toTimeString().slice(0, 5) : '08:00',
        location: event?.location || '',
        maxParticipants: event?.maxParticipants || 50,
        targetValue: event?.targetValue || 0,
        targetUnit: event?.targetUnit || 'km',
        image: event?.image || '',
        requirements: event?.requirements || '',
        benefits: event?.benefits || ''
    }

    const [form, setForm] = useState(defaultValues)
    const [errors, setErrors] = useState({})
    const [submitting, setSubmitting] = useState(false)

    // AI auto-fill state
    const [showAIModal, setShowAIModal] = useState(false)
    const [aiDescription, setAiDescription] = useState('')
    const [aiLoading, setAiLoading] = useState(false)

    // Location autocomplete state
    const [locationSuggestions, setLocationSuggestions] = useState([])
    const [showSuggestions, setShowSuggestions] = useState(false)

    // Sync targetUnit when eventType changes to indoor
    const handleEventTypeChange = (type) => {
        setForm(prev => ({
            ...prev,
            eventType: type,
            targetUnit: (type === 'Trong nhà' && prev.targetUnit === 'km') ? 'kcal' : prev.targetUnit
        }))
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))

        // Location autocomplete via Goong API
        if (name === 'location' && value.length > 2) {
            fetch(`https://rsapi.goong.io/Place/AutoComplete?api_key=UMRiT4CiOH9UU9Ju9L1YJLSYZM5EQberRoSsyfDW&input=${encodeURIComponent(value)}`)
                .then(res => res.json())
                .then(data => { if (data.predictions) { setLocationSuggestions(data.predictions); setShowSuggestions(true) } })
                .catch(console.error)
        } else if (name === 'location') { setShowSuggestions(false) }
    }

    const handleSelectLocation = (address) => {
        setForm(prev => ({ ...prev, location: address }))
        setShowSuggestions(false)
        if (errors.location) setErrors(prev => ({ ...prev, location: '' }))
    }

    // ── AI Fill Handler ──
    const handleAIFill = async () => {
        if (!aiDescription.trim()) { toast.error('Vui lòng nhập mô tả!'); return }
        setAiLoading(true)
        try {
            const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/ai/generate'
            const today = moment().format('DD/MM/YYYY')
            const allCatNames = categories.map(c => `${c.name} (${c.type})`).join(', ')
            const outdoorCats = categories.filter(c => c.type === 'Ngoài trời').map(c => c.name).join(', ')
            const indoorCats = categories.filter(c => c.type === 'Trong nhà').map(c => c.name).join(', ')

            const prompt = `Hôm nay là ngày ${today}. Múi giờ Việt Nam (UTC+7).
Người dùng muốn tạo một sự kiện thể thao. Dưới đây là mô tả sơ bộ:
"${aiDescription.trim()}"
Hãy điền đầy đủ các trường sau thành JSON object hợp lệ. Quy tắc:
1. Nếu mô tả có thông tin rõ → dùng nó. Nếu không → suy luận hợp lý.
2. Ngày: DD/MM/YYYY. startDate >= ${today}. endDate >= startDate.
3. eventType: "Ngoài trời" hoặc "Trong nhà".
   - Ngoài trời: ${outdoorCats}
   - Trong nhà: ${indoorCats}
4. category: một trong: ${allCatNames}. Chỉ điền tên.
5. targetUnit: "km", "kcal", "phút", "giờ".
6. image: để ''
7. description: tối đa 150 ký tự, tiếng Việt.
8. detailedDescription: chi tiết hơn, tiếng Việt.
9. requirements, benefits: ngắn gọn, tiếng Việt.
10. maxParticipants: 20-500.
11. Địa điểm: thực tế tại TP.HCM nếu không nêu.
12. Chỉ trả về JSON object, không markdown.
JSON: { "name", "eventType", "category", "startDate", "endDate", "eventTime": "HH:mm", "location", "maxParticipants", "targetValue", "targetUnit", "image", "description", "detailedDescription", "requirements", "benefits" }`

            const response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) })
            if (!response.ok) throw new Error(`HTTP ${response.status}`)
            const data = await response.json()
            const cleaned = (data?.text || '').replace(/```(?:json)?\n?/gi, '').replace(/```/g, '').trim()
            const parsed = JSON.parse(cleaned)

            setForm(prev => {
                const u = { ...prev }
                if (parsed.name) u.name = parsed.name
                if (parsed.eventType === 'Ngoài trời' || parsed.eventType === 'Trong nhà') u.eventType = parsed.eventType
                if (parsed.category) { const m = categories.find(c => c.name === parsed.category); if (m) u.category = m.name }
                // Convert DD/MM/YYYY to YYYY-MM-DD for date input
                if (parsed.startDate) { const [d, m, y] = parsed.startDate.split('/'); u.startDate = `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}` }
                if (parsed.endDate) { const [d, m, y] = parsed.endDate.split('/'); u.endDate = `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}` }
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
            toast.error(`❌ AI gặp lỗi: ${err.message}`)
        } finally { setAiLoading(false) }
    }

    const validate = () => {
        const errs = {}
        if (!form.name.trim()) errs.name = 'Tên sự kiện không được để trống'
        if (!form.category.trim()) errs.category = 'Danh mục không được để trống'
        if (!form.startDate) errs.startDate = 'Vui lòng chọn ngày bắt đầu'
        if (!form.endDate) errs.endDate = 'Vui lòng chọn ngày kết thúc'
        if (form.startDate && form.endDate && new Date(form.endDate) <= new Date(form.startDate)) {
            errs.endDate = 'Ngày kết thúc phải sau ngày bắt đầu'
        }
        if (form.eventType === 'Ngoài trời' && !form.location.trim()) errs.location = 'Địa điểm không được để trống'
        if (!form.maxParticipants || Number(form.maxParticipants) < 1) errs.maxParticipants = 'Tối thiểu 1 người'
        return errs
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const errs = validate()
        if (Object.keys(errs).length > 0) { setErrors(errs); return }

        setSubmitting(true)
        try {
            // Combine date + time into ISO strings
            const timeStr = form.eventTime || '00:00'
            const startISO = new Date(`${form.startDate}T${timeStr}:00`).toISOString()
            const endISO = new Date(`${form.endDate}T23:59:00`).toISOString()

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
        } finally {
            setSubmitting(false)
        }
    }

    const inputCls = (name) =>
        `w-full px-4 py-3 border-2 rounded-xl dark:bg-gray-700 dark:text-white text-sm outline-none focus:ring-2 transition-all ${errors[name] ? 'border-red-400 focus:ring-red-300' : 'border-gray-200 dark:border-gray-600 focus:ring-emerald-400 focus:border-emerald-400'}`
    const labelCls = 'block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1'
    const sectionCls = 'bg-gray-50 dark:bg-gray-700/40 rounded-xl p-4 space-y-4'

    // Filter categories by eventType
    const filteredCategories = categories.filter(c => c.type === form.eventType)

    return (
        <>
        {/* AI Modal Popup */}
        {showAIModal && (
            <div className='fixed inset-0 z-[60] flex items-center justify-center p-4' style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0,0,0,0.55)' }}>
                <div className='bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden'>
                    <div className='relative bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-5 text-white'>
                        <div className='flex items-center gap-3'>
                            <div className='w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center'><MdAutoAwesome className='text-xl' /></div>
                            <div>
                                <h3 className='font-black text-base'>AI Điền Tự Động</h3>
                                <p className='text-purple-100 text-xs'>Mô tả sự kiện → AI tự điền toàn bộ form</p>
                            </div>
                        </div>
                        <button onClick={() => { setShowAIModal(false); setAiDescription('') }}
                            className='absolute top-3 right-3 w-7 h-7 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition'>
                            <FaTimes className='text-xs' />
                        </button>
                    </div>
                    <div className='p-5 space-y-4'>
                        <div>
                            <label className='block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2'>Mô tả sơ bộ về sự kiện</label>
                            <textarea value={aiDescription} onChange={e => setAiDescription(e.target.value)} rows={4}
                                placeholder='Ví dụ: "Giải chạy bộ bán marathon tại công viên Tao Đàn, TP.HCM, khoảng 100 người..."'
                                className='w-full px-4 py-3 rounded-xl border-2 border-purple-100 dark:border-purple-900 dark:bg-gray-700 dark:text-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none resize-none transition text-sm' />
                            <p className='text-xs text-gray-400 mt-1'>Càng chi tiết, AI càng điền chính xác hơn.</p>
                        </div>
                        <div className='bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 border border-purple-100 dark:border-purple-800'>
                            <p className='text-xs font-bold text-purple-700 dark:text-purple-300 mb-1'>💡 Gợi ý:</p>
                            <ul className='text-xs text-purple-600 dark:text-purple-400 space-y-0.5'>
                                <li>• Loại thể thao, địa điểm, số người, thời gian, mục tiêu</li>
                            </ul>
                        </div>
                        <button onClick={handleAIFill} disabled={aiLoading || !aiDescription.trim()}
                            className='w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 text-sm'
                            style={{ background: aiLoading || !aiDescription.trim() ? '#a78bfa' : 'linear-gradient(135deg, #7c3aed, #4338ca)' }}>
                            {aiLoading ? (<><div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' /> AI đang phân tích...</>) : (<><MdAutoAwesome /> Tạo với AI</>)}
                        </button>
                    </div>
                </div>
            </div>
        )}
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4' onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className='bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col'>
                {/* Header */}
                <div className='flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-200 dark:border-gray-700 shrink-0'>
                    <div className='flex items-center gap-3'>
                        <div className='p-2 bg-blue-100 dark:bg-blue-900 rounded-lg'><FaCalendarAlt className='text-blue-600 dark:text-blue-300' /></div>
                        <h2 className='text-base font-bold text-gray-800 dark:text-white'>{isEdit ? 'Chỉnh sửa sự kiện' : 'Tạo sự kiện mới'}</h2>
                    </div>
                    <div className='flex items-center gap-2'>
                        {!isEdit && (
                            <button type='button' onClick={() => setShowAIModal(true)}
                                className='flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95 hover:shadow-lg'
                                style={{ background: 'linear-gradient(135deg, #7c3aed, #4338ca)' }}>
                                <MdAutoAwesome className='text-sm' /> AI Điền
                            </button>
                        )}
                        <button onClick={onClose} className='p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors'><FaTimes className='text-gray-500' /></button>
                    </div>
                </div>

                {/* Scrollable body */}
                <form onSubmit={handleSubmit} className='overflow-y-auto flex-1 px-6 py-4 space-y-5'>

                    {/* ── 1. Thông tin chung ── */}
                    <div>
                        <p className='text-xs font-bold text-gray-400 uppercase tracking-widest mb-3'>1. Thông tin chung</p>
                        <div className={sectionCls}>
                            {/* Tên sự kiện */}
                            <div>
                                <label className={labelCls}>Tên sự kiện <span className='text-red-500'>*</span></label>
                                <input name='name' value={form.name} onChange={handleChange} className={inputCls('name')} placeholder='Nhập tên sự kiện...' />
                                {errors.name && <p className='text-red-500 text-xs mt-0.5'>{errors.name}</p>}
                            </div>

                            {/* Hình thức tổ chức (button cards) */}
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
                                        <option value=''>-- Chọn danh mục --</option>
                                        {filteredCategories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                                    </select>
                                ) : (
                                    <input name='category' value={form.category} onChange={handleChange} className={inputCls('category')} placeholder='Nhập tên danh mục...' />
                                )}
                                {errors.category && <p className='text-red-500 text-xs mt-0.5'>{errors.category}</p>}
                            </div>
                        </div>
                    </div>

                    {/* ── 2. Thời gian & Địa điểm ── */}
                    <div>
                        <p className='text-xs font-bold text-gray-400 uppercase tracking-widest mb-3'>2. Thời gian &amp; Địa điểm</p>
                        <div className={sectionCls}>
                            {/* Ngày + Giờ */}
                            <div className='grid grid-cols-3 gap-3'>
                                <div>
                                    <label className={labelCls}>Ngày bắt đầu <span className='text-red-500'>*</span></label>
                                    <input type='date' name='startDate' value={form.startDate} onChange={handleChange} className={inputCls('startDate')} />
                                    {errors.startDate && <p className='text-red-500 text-xs mt-0.5'>{errors.startDate}</p>}
                                </div>
                                <div>
                                    <label className={labelCls}>Ngày kết thúc <span className='text-red-500'>*</span></label>
                                    <input type='date' name='endDate' value={form.endDate} onChange={handleChange} className={inputCls('endDate')} />
                                    {errors.endDate && <p className='text-red-500 text-xs mt-0.5'>{errors.endDate}</p>}
                                </div>
                                <div>
                                    <label className={labelCls}>Thời điểm <span className='text-red-500'>*</span></label>
                                    <input type='time' name='eventTime' value={form.eventTime} onChange={handleChange} className={inputCls('eventTime')} />
                                </div>
                            </div>

                            {/* Địa điểm */}
                            <div className='relative'>
                                <label className={labelCls}>Địa điểm <span className='text-red-500'>*</span></label>
                                <input name='location' value={form.location} onChange={handleChange}
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                    className={inputCls('location')} placeholder='Nhập địa điểm...' />
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
                                {errors.location && <p className='text-red-500 text-xs mt-0.5'>{errors.location}</p>}
                            </div>
                        </div>
                    </div>

                    {/* ── 3. Mục tiêu & Sức chứa ── */}
                    <div>
                        <p className='text-xs font-bold text-gray-400 uppercase tracking-widest mb-3'>3. Mục tiêu &amp; Sức chứa</p>
                        <div className={sectionCls}>
                            <div className='grid grid-cols-2 gap-4'>
                                {/* Số người tối đa */}
                                <div>
                                    <label className={labelCls}>Số người tối đa <span className='text-red-500'>*</span></label>
                                    <div className='flex items-center border border-gray-300 dark:border-slate-600 rounded-lg overflow-hidden dark:bg-slate-700'>
                                        <button type='button'
                                            onClick={() => setForm(p => ({ ...p, maxParticipants: Math.max(1, Number(p.maxParticipants) - 10) }))}
                                            className='px-3 py-2 bg-gray-100 dark:bg-slate-600 font-bold text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-slate-500 transition'>−</button>
                                        <input type='number' name='maxParticipants' value={form.maxParticipants} onChange={handleChange} min='1'
                                            className='flex-1 py-2 bg-transparent dark:text-white text-center font-bold text-sm focus:outline-none' />
                                        <button type='button'
                                            onClick={() => setForm(p => ({ ...p, maxParticipants: Number(p.maxParticipants) + 10 }))}
                                            className='px-3 py-2 bg-gray-100 dark:bg-slate-600 font-bold text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-slate-500 transition'>+</button>
                                    </div>
                                    {errors.maxParticipants && <p className='text-red-500 text-xs mt-0.5'>{errors.maxParticipants}</p>}
                                </div>

                                {/* Mục tiêu */}
                                <div>
                                    <label className={labelCls}>Mục tiêu sự kiện</label>
                                    <div className='flex gap-2'>
                                        <input type='number' name='targetValue' value={form.targetValue} onChange={handleChange} min='0'
                                            className='flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-orange-300' />
                                        <select name='targetUnit' value={form.targetUnit} onChange={handleChange}
                                            className='w-20 px-2 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-300'>
                                            {form.eventType === 'Ngoài trời' && <option value='km'>km</option>}
                                            <option value='kcal'>kcal</option>
                                            <option value='phút'>phút</option>
                                            <option value='giờ'>giờ</option>
                                        </select>
                                    </div>
                                </div>
                            </div>


                        </div>
                    </div>

                    {/* ── 4. Hình ảnh & Mô tả ── */}
                    <div>
                        <p className='text-xs font-bold text-gray-400 uppercase tracking-widest mb-3'>4. Hình ảnh &amp; Mô tả</p>
                        <div className={sectionCls}>
                            {/* Ảnh bìa — Cloudinary Upload */}
                            <div>
                                <CloudinaryImageUploader
                                    label="Ảnh bìa"
                                    required
                                    value={form.image}
                                    onChange={(url) => setForm(prev => ({ ...prev, image: url }))}
                                    error={errors.image}
                                    folder="sport-events"
                                />
                            </div>

                            {/* Mô tả ngắn */}
                            <div>
                                <label className={labelCls}>Mô tả ngắn <span className='text-red-500'>*</span></label>
                                <textarea name='description' value={form.description} onChange={handleChange} className={inputCls('description')} rows={2} maxLength={150} placeholder='Mô tả ngắn gọn...' />
                                <p className='text-right text-xs text-gray-400 mt-0.5'>{form.description.length}/150</p>
                            </div>

                            {/* Mô tả chi tiết */}
                            <div>
                                <label className={labelCls}>Mô tả chi tiết</label>
                                <textarea name='detailedDescription' value={form.detailedDescription} onChange={handleChange} className={inputCls('detailedDescription')} rows={4} placeholder='Mô tả đầy đủ về sự kiện...' />
                            </div>

                            {/* Yêu cầu + Lợi ích */}
                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className={labelCls}>Yêu cầu tham gia</label>
                                    <input name='requirements' value={form.requirements} onChange={handleChange} className={inputCls('requirements')} placeholder='Yêu cầu...' />
                                </div>
                                <div>
                                    <label className={labelCls}>Lợi ích khi tham gia</label>
                                    <input name='benefits' value={form.benefits} onChange={handleChange} className={inputCls('benefits')} placeholder='Lợi ích...' />
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

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────
function ConfirmDialog({ title, message, onConfirm, onCancel, danger = true }) {
    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60' onClick={(e) => e.target === e.currentTarget && onCancel()}>
            <div className='bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-sm mx-4'>
                <div className='flex items-center gap-3 mb-3'>
                    <div className={`p-2 rounded-full ${danger ? 'bg-red-100 dark:bg-red-900' : 'bg-yellow-100 dark:bg-yellow-900'}`}>
                        <FaExclamationTriangle className={`text-lg ${danger ? 'text-red-600' : 'text-yellow-600'}`} />
                    </div>
                    <h3 className='text-base font-bold text-gray-800 dark:text-white'>{title}</h3>
                </div>
                <p className='text-sm text-gray-600 dark:text-gray-400 ml-11 mb-5'>{message}</p>
                <div className='flex justify-end gap-3'>
                    <button onClick={onCancel} className='px-4 py-2 text-sm bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors'>
                        Hủy
                    </button>
                    <button onClick={onConfirm} className={`px-4 py-2 text-sm text-white rounded-lg font-medium transition-colors ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-600 hover:bg-yellow-700'}`}>
                        Xác nhận
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminSportEvent() {
    const queryClient = useQueryClient()
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const [searchInput, setSearchInput] = useState('')
    const [filterCategory, setFilterCategory] = useState('')
    const [filterEventType, setFilterEventType] = useState('all')
    const [filterStatus, setFilterStatus] = useState('active')
    const [sortBy, setSortBy] = useState('newest')
    const [filterDateFrom, setFilterDateFrom] = useState('')
    const [filterDateTo, setFilterDateTo] = useState('')
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [modalEvent, setModalEvent] = useState(undefined) // undefined = closed, null = new, obj = edit
    const [confirmAction, setConfirmAction] = useState(null) // { type, event }
    const LIMIT = 10
    const debounceRef = useRef(null)

    // Debounced live search — auto-search 500ms after typing
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
            setSearch(searchInput)
            setPage(1)
        }, 500)
        return () => clearTimeout(debounceRef.current)
    }, [searchInput])

    // Stats
    const { data: statsData } = useQuery({
        queryKey: ['adminSportEventStats'],
        queryFn: () => adminSportEventApi.getStats(),
        staleTime: 1000
    })
    const stats = statsData?.data?.result || {}

    // Event list
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['adminSportEvents', page, search, filterCategory, filterEventType, filterStatus, filterDateFrom, filterDateTo, sortBy],
        queryFn: () => adminSportEventApi.getAll({
            page, limit: LIMIT, search,
            category: filterCategory || undefined,
            eventType: filterEventType !== 'all' ? filterEventType : undefined,
            status: filterStatus,
            dateFrom: filterDateFrom || undefined,
            dateTo: filterDateTo || undefined,
            sortBy
        }),
        keepPreviousData: true,
        staleTime: 1000
    })

    const events = data?.data?.result?.events || []
    const totalPage = data?.data?.result?.totalPage || 1
    const total = data?.data?.result?.total || 0

    // Sport categories for the form dropdown — only active (non-deleted)
    const { data: catData } = useQuery({
        queryKey: ['adminSportCategories'],
        queryFn: () => import('../../apis/sportCategoryApi').then(m => m.default.getAll()),
        staleTime: 1000
    })
    const categories = (catData?.data?.result || []).filter(c => !c.isDeleted)

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ['adminSportEvents'] })
        queryClient.invalidateQueries({ queryKey: ['adminSportEventStats'] })
    }

    const softDeleteMutation = useMutation({
        mutationFn: (id) => adminSportEventApi.softDelete(id),
        onSuccess: () => { toast.success('Đã xóa sự kiện'); invalidate() },
        onError: (err) => toast.error(err?.response?.data?.message || 'Lỗi xóa sự kiện')
    })

    const restoreMutation = useMutation({
        mutationFn: (id) => adminSportEventApi.restore(id),
        onSuccess: () => { toast.success('Đã khôi phục sự kiện'); invalidate() },
        onError: (err) => toast.error(err?.response?.data?.message || 'Lỗi khôi phục')
    })

    // Count active filters for badge
    const activeFilterCount = [
        filterCategory, 
        filterEventType !== 'all' && filterEventType, 
        filterDateFrom, 
        filterDateTo,
        sortBy !== 'newest' && sortBy
    ].filter(Boolean).length

    const clearAllFilters = () => {
        setSearchInput(''); setSearch(''); setFilterCategory('')
        setFilterEventType('all'); setFilterDateFrom(''); setFilterDateTo('')
        setSortBy('newest'); setPage(1)
    }

    const handleConfirm = () => {
        if (!confirmAction) return
        if (confirmAction.type === 'delete') softDeleteMutation.mutate(confirmAction.event._id)
        else if (confirmAction.type === 'restore') restoreMutation.mutate(confirmAction.event._id)
        setConfirmAction(null)
    }

    const handleFormSuccess = useCallback(() => {
        setModalEvent(undefined)
        invalidate()
    }, [])

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900 py-4 px-4'>

            {/* ── Hero Banner ── */}
            <div className='relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-500 via-green-500 to-emerald-600 px-8 py-8 mb-6 shadow-xl'>
                <div className='relative z-10 flex items-start justify-between'>
                    <div>
                        <p className='text-white/70 text-sm font-medium mb-1'>FitConnect Admin</p>
                        <h1 className='text-3xl font-black text-white mb-2'>Quản lý Sự kiện Thể thao</h1>
                        <p className='text-white/80 text-sm max-w-md'>
                            Tạo, chỉnh sửa và theo dõi các sự kiện thể thao trong hệ thống.
                        </p>
                    </div>
                    <div className='flex items-center gap-2 mt-1'>
                        <button
                            onClick={() => queryClient.invalidateQueries({ queryKey: ['adminSportEvents'] })}
                            className='flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all mt-1'
                        >
                            <FaSync size={13} />
                            Làm mới
                        </button>
                        <button
                            onClick={() => setModalEvent(null)}
                            className='flex items-center gap-2 bg-white text-emerald-700 font-bold text-sm px-4 py-2 rounded-xl hover:bg-emerald-50 transition-all shadow-lg shrink-0 mt-1'
                        >
                            <FaPlus size={12} /> Tạo sự kiện
                        </button>
                    </div>
                </div>

                {/* Tabs inside Hero Banner */}
                <div className='relative z-10 flex gap-2 mt-5'>
                    <button
                        onClick={() => { setFilterStatus('active'); setPage(1) }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all backdrop-blur-sm ${
                            filterStatus === 'active'
                                ? 'bg-white text-emerald-700 shadow-md'
                                : 'bg-white/20 text-white hover:bg-white/30'
                        }`}
                    >
                        <FaCalendarAlt size={14} />
                        Đang hoạt động ({stats.active ?? 0})
                    </button>
                    <button
                        onClick={() => { setFilterStatus('deleted'); setPage(1) }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all backdrop-blur-sm ${
                            filterStatus === 'deleted'
                                ? 'bg-white text-emerald-700 shadow-md'
                                : 'bg-white/20 text-white hover:bg-white/30'
                        }`}
                    >
                        <FaTrash size={13} />
                        Đã xóa ({stats.deleted ?? 0})
                    </button>
                    <button
                        onClick={() => { setFilterStatus('all'); setPage(1) }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all backdrop-blur-sm ${
                            filterStatus === 'all'
                                ? 'bg-white text-emerald-700 shadow-md'
                                : 'bg-white/20 text-white hover:bg-white/30'
                        }`}
                    >
                        Tất cả ({stats.total ?? 0})
                    </button>
                </div>

                <div className='absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10' />
                <div className='absolute right-20 -bottom-8 w-32 h-32 rounded-full bg-white/10' />
            </div>

            {/* Stat Cards */}
            <div className='grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6'>
                <StatCard icon={FaCalendarAlt} label='Tổng sự kiện' value={stats.total} borderColor='border-l-blue-400' iconBg='bg-gradient-to-br from-blue-400 to-blue-600' />
                <StatCard icon={FaCalendarAlt} label='Đang hoạt động' value={stats.active} borderColor='border-l-emerald-400' iconBg='bg-gradient-to-br from-emerald-400 to-green-600' />
                <StatCard icon={FaRunning} label='Ngoài trời' value={stats.outdoor} borderColor='border-l-orange-400' iconBg='bg-gradient-to-br from-orange-400 to-amber-600' />
                <StatCard icon={FaHome} label='Trong nhà' value={stats.indoor} borderColor='border-l-purple-400' iconBg='bg-gradient-to-br from-purple-400 to-violet-600' />
                <StatCard icon={FaTrash} label='Đã xóa' value={stats.deleted} borderColor='border-l-red-400' iconBg='bg-gradient-to-br from-red-400 to-rose-600' />
            </div>

            {/* ── Smart Search & Filters ── */}
            <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-4 overflow-hidden'>
                {/* Main search row */}
                <div className='p-4'>
                    <div className='flex gap-2 items-center'>
                        <div className='relative flex-1'>
                            <FaSearch className='absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm' />
                            {searchInput && (
                                <button
                                    onClick={() => setSearchInput('')}
                                    className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors'
                                >
                                    <FaTimes size={12} />
                                </button>
                            )}
                            <input
                                value={searchInput}
                                onChange={e => setSearchInput(e.target.value)}
                                placeholder='Tìm theo tên sự kiện, danh mục, địa điểm...'
                                className='w-full pl-10 pr-8 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-600 transition-all'
                            />
                        </div>
                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border transition-all shrink-0 ${
                                showAdvanced || activeFilterCount > 0
                                    ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                                    : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-300'
                            }`}
                        >
                            <FaFilter size={12} />
                            Bộ lọc
                            {activeFilterCount > 0 && (
                                <span className='w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center'>
                                    {activeFilterCount}
                                </span>
                            )}
                            <FaChevronDown size={10} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                        </button>
                    </div>

                    {/* Active filter chips */}
                    {activeFilterCount > 0 && (
                        <div className='flex flex-wrap gap-2 mt-3'>
                            {filterCategory && (
                                <span className='inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'>
                                    📂 {filterCategory}
                                    <button onClick={() => { setFilterCategory(''); setPage(1) }} className='hover:text-blue-900 dark:hover:text-blue-100'><FaTimes size={9} /></button>
                                </span>
                            )}
                            {filterEventType !== 'all' && (
                                <span className='inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'>
                                    {filterEventType === 'Ngoài trời' ? '🌳' : '🏠'} {filterEventType}
                                    <button onClick={() => { setFilterEventType('all'); setPage(1) }} className='hover:text-emerald-900 dark:hover:text-emerald-100'><FaTimes size={9} /></button>
                                </span>
                            )}
                            {filterDateFrom && (
                                <span className='inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'>
                                    📅 Từ {new Date(filterDateFrom).toLocaleDateString('vi-VN')}
                                    <button onClick={() => { setFilterDateFrom(''); setPage(1) }} className='hover:text-orange-900 dark:hover:text-orange-100'><FaTimes size={9} /></button>
                                </span>
                            )}
                            {filterDateTo && (
                                <span className='inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'>
                                    📅 Đến {new Date(filterDateTo).toLocaleDateString('vi-VN')}
                                    <button onClick={() => { setFilterDateTo(''); setPage(1) }} className='hover:text-orange-900 dark:hover:text-orange-100'><FaTimes size={9} /></button>
                                </span>
                            )}
                            {sortBy !== 'newest' && (
                                <span className='inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'>
                                    ↕️ {sortBy === 'oldest' ? 'Cũ nhất' : sortBy === 'popular' ? 'Phổ biến nhất' : 'Sắp diễn ra'}
                                    <button onClick={() => { setSortBy('newest'); setPage(1) }} className='hover:text-purple-900 dark:hover:text-purple-100'><FaTimes size={9} /></button>
                                </span>
                            )}
                            <button
                                onClick={clearAllFilters}
                                className='inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors'
                            >
                                <FaTimes size={9} /> Xóa tất cả
                            </button>
                        </div>
                    )}
                </div>

                {/* Collapsible advanced filters */}
                {showAdvanced && (
                    <div className='px-4 pb-4 pt-0 border-t border-gray-100 dark:border-gray-700'>
                        <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 pt-3'>
                            {/* Category filter */}
                            <div>
                                <label className='block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5'>Danh mục</label>
                                <select
                                    value={filterCategory}
                                    onChange={e => { setFilterCategory(e.target.value); setPage(1) }}
                                    className='w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all'
                                >
                                    <option value=''>Tất cả danh mục</option>
                                    {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                                </select>
                            </div>

                            {/* Event type filter */}
                            <div>
                                <label className='block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5'>Loại hình</label>
                                <select
                                    value={filterEventType}
                                    onChange={e => { setFilterEventType(e.target.value); setPage(1) }}
                                    className='w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all'
                                >
                                    <option value='all'>Tất cả loại</option>
                                    <option value='Ngoài trời'>🌳 Ngoài trời</option>
                                    <option value='Trong nhà'>🏠 Trong nhà</option>
                                </select>
                            </div>

                            {/* Date from */}
                            <div>
                                <label className='block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5'>Từ ngày</label>
                                <input
                                    type='date'
                                    value={filterDateFrom}
                                    onChange={e => { setFilterDateFrom(e.target.value); setPage(1) }}
                                    className='w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all'
                                />
                            </div>

                            {/* Date to */}
                            <div>
                                <label className='block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5'>Đến ngày</label>
                                <input
                                    type='date'
                                    value={filterDateTo}
                                    onChange={e => { setFilterDateTo(e.target.value); setPage(1) }}
                                    className='w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all'
                                />
                            </div>
                        </div>

                        {/* Sort row */}
                        <div className='flex items-center gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700'>
                            <FaSortAmountDown className='text-gray-400 text-sm shrink-0' />
                            <span className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase shrink-0'>Sắp xếp:</span>
                            <div className='flex gap-2 flex-wrap'>
                                {[
                                    { value: 'newest', label: 'Mới nhất' },
                                    { value: 'oldest', label: 'Cũ nhất' },
                                    { value: 'popular', label: 'Phổ biến nhất' },
                                    { value: 'earliest', label: 'Sắp diễn ra' }
                                ].map(s => (
                                    <button
                                        key={s.value}
                                        onClick={() => { setSortBy(s.value); setPage(1) }}
                                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                            sortBy === s.value
                                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-300 dark:ring-emerald-700'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        }`}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Event Analytics Dashboard */}
            {events.length > 0 && (() => {
                const now = new Date()
                const outdoorCount = events.filter(e => e.eventType === 'Ngoài trời' && !e.isDeleted).length
                const indoorCount = events.filter(e => e.eventType === 'Trong nhà' && !e.isDeleted).length
                const activeEvents = events.filter(e => !e.isDeleted)
                const avgParticipants = activeEvents.length > 0
                    ? Math.round(activeEvents.reduce((s, e) => s + (e.participants || 0), 0) / activeEvents.length)
                    : 0
                const ongoingCount = activeEvents.filter(e => new Date(e.startDate) <= now && new Date(e.endDate) > now).length

                // Events per month (last 6 months)
                const monthData = []
                for (let i = 5; i >= 0; i--) {
                    const d = new Date()
                    d.setMonth(d.getMonth() - i)
                    const m = d.getMonth()
                    const y = d.getFullYear()
                    const count = activeEvents.filter(e => {
                        const cd = new Date(e.createdAt)
                        return cd.getMonth() === m && cd.getFullYear() === y
                    }).length
                    monthData.push({ label: `T${m + 1}`, count })
                }
                const maxCount = Math.max(...monthData.map(m => m.count), 1)

                return (
                    <div className='bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm mb-4 overflow-hidden'>
                        <div className='bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-3 flex items-center justify-between'>
                            <h3 className='text-white font-bold text-sm flex items-center gap-2'>📊 Thống kê sự kiện</h3>
                        </div>
                        <div className='p-5'>
                            <div className='grid grid-cols-2 md:grid-cols-4 gap-3 mb-5'>
                                <div className='text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl'>
                                    <p className='text-xl font-black text-blue-600'>{activeEvents.length}</p>
                                    <p className='text-[10px] text-gray-500 uppercase font-bold mt-1'>Tổng sự kiện</p>
                                </div>
                                <div className='text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl'>
                                    <p className='text-xl font-black text-emerald-600'>{ongoingCount}</p>
                                    <p className='text-[10px] text-gray-500 uppercase font-bold mt-1'>Đang diễn ra</p>
                                </div>
                                <div className='text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl'>
                                    <p className='text-xl font-black text-amber-600'>{avgParticipants}</p>
                                    <p className='text-[10px] text-gray-500 uppercase font-bold mt-1'>TB thành viên</p>
                                </div>
                                <div className='text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl'>
                                    <p className='text-xl font-black text-purple-600'>
                                        {outdoorCount}<span className='text-gray-400 mx-1 text-sm font-normal'>/</span>{indoorCount}
                                    </p>
                                    <p className='text-[10px] text-gray-500 uppercase font-bold mt-1'>Ngoài / Trong nhà</p>
                                </div>
                            </div>

                            {/* Mini CSS Bar Chart */}
                            <p className='text-[10px] text-gray-400 uppercase font-bold tracking-wide mb-2'>Sự kiện tạo theo tháng</p>
                            <div className='flex items-end gap-2' style={{ height: 60 }}>
                                {monthData.map((m, i) => (
                                    <div key={i} className='flex-1 flex flex-col items-center gap-1'>
                                        <span className='text-[9px] font-bold text-gray-500'>{m.count}</span>
                                        <div
                                            className='w-full rounded-t-md bg-gradient-to-t from-indigo-600 to-blue-400 transition-all'
                                            style={{ height: `${Math.max((m.count / maxCount) * 48, 2)}px` }}
                                        />
                                        <span className='text-[9px] text-gray-400'>{m.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )
            })()}

            {/* Table */}
            {isLoading ? (
                <Loading />
            ) : isError ? (
                <div className='text-center py-16'>
                    <div className='text-red-500 text-4xl mb-3'>⚠️</div>
                    <p className='text-gray-500 dark:text-gray-400'>{error?.response?.data?.message || 'Không thể tải dữ liệu'}</p>
                    <button onClick={() => queryClient.invalidateQueries({ queryKey: ['adminSportEvents'] })}
                        className='mt-3 text-sm text-blue-600 hover:underline'>Thử lại</button>
                </div>
            ) : (
                <>
                    <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden'>
                        <div className='px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between'>
                            <p className='text-sm text-gray-500 dark:text-gray-400'>
                                Hiển thị <span className='font-semibold text-gray-800 dark:text-white'>{events.length}</span> / {total} sự kiện
                            </p>
                        </div>
                        <div className='overflow-x-auto'>
                            <table className='w-full divide-y divide-gray-200 dark:divide-slate-700'>
                                <thead className='bg-gray-50 dark:bg-gray-900'>
                                    <tr>
                                        {['STT', 'Sự kiện', 'Danh mục / Loại', 'Thời gian', 'Địa điểm', 'Người tham gia', 'Tiến độ', 'Trạng thái', 'Hành động'].map(h => (
                                            <th key={h} className='px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap'>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-gray-100 dark:divide-slate-700'>
                                    {events.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className='text-center py-14'>
                                                <FaCalendarAlt className='mx-auto text-4xl text-gray-300 mb-3' />
                                                <p className='text-gray-400 text-sm'>Không có sự kiện nào</p>
                                                <button onClick={() => setModalEvent(null)} className='mt-2 text-sm text-blue-600 hover:underline'>+ Tạo sự kiện đầu tiên</button>
                                            </td>
                                        </tr>
                                    ) : events.map((ev, idx) => (
                                        <tr key={ev._id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${ev.isDeleted ? 'opacity-60' : ''}`}>
                                            {/* STT */}
                                            <td className='px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap'>
                                                {(page - 1) * LIMIT + idx + 1}
                                            </td>
                                            {/* Event name + image */}
                                            <td className='px-4 py-3 min-w-[200px]'>
                                                <div className='flex items-center gap-3'>
                                                    {ev.image ? (
                                                        <img src={ev.image} alt={ev.name} className='w-10 h-10 rounded-lg object-cover shrink-0' onError={e => { e.target.style.display = 'none' }} />
                                                    ) : (
                                                        <div className='w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center shrink-0'>
                                                            <FaCalendarAlt className='text-blue-500 text-sm' />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className='font-semibold text-sm text-gray-800 dark:text-white line-clamp-1'>{ev.name}</p>
                                                        <p className='text-xs text-gray-500 line-clamp-1'>{ev.description}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            {/* Category + Type */}
                                            <td className='px-4 py-3 whitespace-nowrap'>
                                                <div>
                                                    <p className='text-sm font-medium text-gray-700 dark:text-gray-200'>{ev.category}</p>
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full mt-0.5 ${ev.eventType === 'Ngoài trời' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'}`}>
                                                        {ev.eventType === 'Ngoài trời' ? '🌳' : '🏠'} {ev.eventType}
                                                    </span>
                                                </div>
                                            </td>
                                            {/* Dates */}
                                            <td className='px-4 py-3 whitespace-nowrap'>
                                                <div className='flex flex-col gap-0.5 text-xs text-gray-600 dark:text-gray-300'>
                                                    <span>🟢 {formatDate(ev.startDate)}</span>
                                                    <span>🔴 {formatDate(ev.endDate)}</span>
                                                </div>
                                            </td>
                                            {/* Location */}
                                            <td className='px-4 py-3 min-w-[140px]'>
                                                <div className='flex items-start gap-1'>
                                                    <FaMapMarkerAlt className='text-gray-400 mt-0.5 shrink-0 text-xs' />
                                                    <span className='text-sm text-gray-600 dark:text-gray-300 line-clamp-2'>{ev.location}</span>
                                                </div>
                                            </td>
                                            {/* Participants */}
                                            <td className='px-4 py-3 whitespace-nowrap'>
                                                <div className='flex items-center gap-1'>
                                                    <FaUsers className='text-gray-400 text-xs' />
                                                    <span className='text-sm font-semibold text-gray-700 dark:text-gray-200'>{ev.participants}</span>
                                                    <span className='text-gray-400 text-xs'>/ {ev.maxParticipants}</span>
                                                </div>
                                                <div className='mt-1 w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5'>
                                                    <div
                                                        className='bg-blue-500 h-1.5 rounded-full'
                                                        style={{ width: `${Math.min((ev.participants / ev.maxParticipants) * 100, 100)}%` }}
                                                    />
                                                </div>
                                            </td>
                                            {/* Progress */}
                                            <td className='px-4 py-3 whitespace-nowrap'>
                                                {(() => {
                                                    const now = new Date()
                                                    const start = new Date(ev.startDate)
                                                    const end = new Date(ev.endDate)
                                                    const isEvEnded = now > end
                                                    const isEvUpcoming = now < start
                                                    const totalDur = end - start
                                                    const elapsed = now - start
                                                    const timePct = isEvEnded ? 100 : isEvUpcoming ? 0 : Math.min(Math.round((elapsed / totalDur) * 100), 100)
                                                    const barColor = isEvEnded ? 'bg-gray-400' : timePct > 75 ? 'bg-amber-500' : 'bg-emerald-500'
                                                    return (
                                                        <div>
                                                            <div className='flex items-center justify-between text-xs mb-1'>
                                                                <span className='text-gray-500 dark:text-gray-400'>{timePct}%</span>
                                                                <span className={`text-[10px] font-semibold ${isEvEnded ? 'text-gray-400' : isEvUpcoming ? 'text-amber-500' : 'text-emerald-600'}`}>
                                                                    {isEvEnded ? 'Xong' : isEvUpcoming ? 'Chờ' : 'Live'}
                                                                </span>
                                                            </div>
                                                            <div className='w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5'>
                                                                <div className={`${barColor} h-1.5 rounded-full transition-all`} style={{ width: `${timePct}%` }} />
                                                            </div>
                                                        </div>
                                                    )
                                                })()}
                                            </td>
                                            {/* Status */}
                                            <td className='px-4 py-3 whitespace-nowrap'>
                                                {ev.isDeleted ? (
                                                    <span className='px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'>Đã xóa</span>
                                                ) : (
                                                    <span className='px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'>Hoạt động</span>
                                                )}
                                            </td>
                                            {/* Actions */}
                                            <td className='px-4 py-3 whitespace-nowrap'>
                                                <div className='flex items-center gap-2'>
                                                    {!ev.isDeleted && (
                                                        <button
                                                            onClick={() => setModalEvent(ev)}
                                                            title='Chỉnh sửa'
                                                            className='p-1.5 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors'
                                                        >
                                                            <FaEdit size={14} />
                                                        </button>
                                                    )}
                                                    {ev.isDeleted ? (
                                                        <button
                                                            onClick={() => setConfirmAction({ type: 'restore', event: ev })}
                                                            title='Khôi phục'
                                                            className='p-1.5 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors'
                                                        >
                                                            <FaUndo size={14} />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => setConfirmAction({ type: 'delete', event: ev })}
                                                            title='Xóa'
                                                            className='p-1.5 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors'
                                                        >
                                                            <FaTrash size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
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
                </>
            )}

            {/* Create/Edit Modal */}
            {modalEvent !== undefined && (
                <EventFormModal
                    event={modalEvent}
                    categories={categories}
                    onClose={() => setModalEvent(undefined)}
                    onSuccess={handleFormSuccess}
                />
            )}

            {/* Confirm Dialog */}
            {confirmAction && (
                <ConfirmDialog
                    title={confirmAction.type === 'delete' ? 'Xóa sự kiện?' : 'Khôi phục sự kiện?'}
                    message={
                        confirmAction.type === 'delete'
                            ? `Bạn có chắc muốn xóa sự kiện "${confirmAction.event.name}"? Người dùng sẽ không thể xem sự kiện này nữa.`
                            : `Bạn có chắc muốn khôi phục sự kiện "${confirmAction.event.name}"?`
                    }
                    danger={confirmAction.type === 'delete'}
                    onConfirm={handleConfirm}
                    onCancel={() => setConfirmAction(null)}
                />
            )}
        </div>
    )
}
