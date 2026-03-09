import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaImage,
  FaUsers,
  FaFileAlt,
  FaPlus,
  FaTrash,
  FaTrophy,
  FaBullseye,
  FaStar,
  FaCheckCircle,
  FaInfoCircle,
  FaClock,
  FaTree,
  FaHome,
  FaExclamationCircle,
  FaTimes
} from 'react-icons/fa'
import { MdVideocam, MdAutoAwesome } from 'react-icons/md'
import { createSportEvent } from '../../apis/sportEventApi'
import sportCategoryApi from '../../apis/sportCategoryApi'
import CloudinaryImageUploader from '../../components/GlobalComponents/CloudinaryImageUploader/CloudinaryImageUploader'
import toast from 'react-hot-toast'
import moment from 'moment'

// ==================== AI FILL HELPERS ====================
// Gọi qua backend proxy để tránh lỗi CORS khi gọi trực tiếp từ trình duyệt
const AI_PROXY_ENDPOINT = 'http://localhost:5000/api/ai/generate'

// ==================== DATE/TIME HELPERS ====================
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
  return new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T${timeStr}:00`).toISOString()
}

// Format digits into DD/MM/YYYY
const formatDateInput = (raw) => {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return digits.slice(0, 2) + '/' + digits.slice(2)
  return digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4)
}

// Format digits into HH:mm
const formatTimeInput = (raw) => {
  const digits = raw.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return digits.slice(0, 2) + ':' + digits.slice(2)
}

// ============================================================

const CreateSportEvent = () => {
  const navigate = useNavigate()

  // AI modal state
  const [showAIModal, setShowAIModal] = useState(false)
  const [aiDescription, setAiDescription] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  const [newEvent, setNewEvent] = useState({
    name: '',
    startDate: '',    // DD/MM/YYYY text
    endDate: '',      // DD/MM/YYYY text
    eventTime: '',    // HH:mm text
    location: '',
    category: '',
    maxParticipants: 50,
    targetValue: 0,
    targetUnit: 'km',
    image: '',
    description: '',
    detailedDescription: '',
    eventType: 'Ngoài trời',
    requirements: '',
    benefits: ''
  })

  const [errors, setErrors] = useState({})
  const [locationSuggestions, setLocationSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Mutation for creating event
  const createMutation = useMutation({
    mutationFn: (data) => createSportEvent(data),
    onSuccess: (response) => {
      toast.success('🎉 Đã tạo sự kiện thành công!')
      const eventId = response.data?.result?._id || response.result?._id
      setTimeout(() => navigate(eventId ? `/sport-event/${eventId}` : '/sport-event'), 1500)
    },
    onError: (error) => {
      const msg = error.response?.data?.message || 'Tạo sự kiện thất bại'
      toast.error(`❌ ${msg}`)
    }
  })

  const { data: categoriesData } = useQuery({
    queryKey: ['sportCategories'],
    queryFn: () => sportCategoryApi.getAll(),
    staleTime: 1000
  })

  const categories = categoriesData?.data?.result || []
  const filteredCategories = categories.filter(c => c.type === newEvent.eventType)

  // set default category once loaded or eventType changed
  React.useEffect(() => {
    if (filteredCategories.length > 0) {
      setNewEvent(prev => {
        if (!filteredCategories.some(c => c.name === prev.category)) {
          return { ...prev, category: filteredCategories[0].name }
        }
        return prev
      })
    }
  }, [categoriesData, newEvent.eventType])

  // ==================== AI FILL HANDLER ====================
  const handleAIFill = async () => {
    if (!aiDescription.trim()) {
      toast.error('Vui lòng nhập mô tả sự kiện trước!')
      return
    }
    setAiLoading(true)
    try {
      const today = '08/03/2026'
      const allCategoryNames = categories.map(c => `${c.name} (${c.type})`).join(', ')
      const outdoorCategories = categories.filter(c => c.type === 'Ngoài trời').map(c => c.name).join(', ')
      const indoorCategories = categories.filter(c => c.type === 'Trong nhà').map(c => c.name).join(', ')

      const prompt = `Hôm nay là ngày ${today}. Múi giờ Việt Nam (UTC+7).
Người dùng muốn tạo một sự kiện thể thao. Dưới đây là mô tả sơ bộ của họ:

"${aiDescription.trim()}"

Hãy điền đầy đủ tất cả các trường sau thành một JSON object hợp lệ. Tuân thủ các quy tắc:
1. Nếu mô tả đã có thông tin rõ ràng cho một trường → dùng thông tin đó.
2. Nếu không có → tự suy luận hợp lý, thực tế, phù hợp văn hóa Việt Nam và ngữ cảnh thể thao.
3. Ngày: định dạng DD/MM/YYYY. startDate phải >= ${today}. endDate phải >= startDate. Chọn ngày trong tương lai gần, hợp lý.
4. eventType: chỉ được là "Ngoài trời" hoặc "Trong nhà".
   - Hoạt động ngoài trời (category thuộc list: ${outdoorCategories}) → "Ngoài trời"
   - Hoạt động trong nhà (category thuộc list: ${indoorCategories}) → "Trong nhà"
5. category: phải là một trong các giá trị sau (chọn phù hợp nhất với mô tả): ${allCategoryNames}. Chỉ điền tên category (không kèm loại).
6. targetUnit: chỉ được là một trong: "km", "kcal", "phút", "giờ". Chọn đơn vị phù hợp với loại hoạt động.
7. image: Mặc định để ''
8. description: tối đa 150 ký tự, ngắn gọn, hấp dẫn, tiếng Việt.
9. detailedDescription: đoạn văn dài hơn, trình bày lịch trình, thông tin chi tiết, tiếng Việt.
10. requirements: yêu cầu tham gia ngắn gọn (VD: Sức khỏe ổn định, có kinh nghiệm...).
11. benefits: lợi ích khi tham gia ngắn gọn (VD: Voucher ưu đãi, huy chương, mạng lưới kết nối...).
12. maxParticipants: số nguyên hợp lý (từ 20 đến 500).
13. Vị trí địa lý: Nếu không nêu cụ thể, hãy chọn một địa điểm thực tế, ngẫu nhiên trong thành phố Hồ Chí Minh, phù hợp với loại sự kiện.
14. Chỉ trả về JSON object, không có markdown, không có giải thích, không có ký tự thừa.

JSON output (chỉ object, không gì khác):
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

      // Gọi backend proxy thay vì gọi thẳng Grok (tránh CORS)
      const response = await fetch(AI_PROXY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData?.message || `HTTP ${response.status}`)
      }

      const data = await response.json()
      const rawText = data?.text || ''

      // Strip markdown code fences if present (though response_format json_object should prevent it, just to be sure)
      const cleaned = rawText.replace(/```(?:json)?\n?/gi, '').replace(/```/g, '').trim()
      const parsed = JSON.parse(cleaned)

      // Validate and apply fields
      setNewEvent(prev => {
        const updated = { ...prev }
        if (parsed.name) updated.name = parsed.name
        if (parsed.eventType === 'Ngoài trời' || parsed.eventType === 'Trong nhà') {
          updated.eventType = parsed.eventType
        }
        // Category: check if it exists in our list
        if (parsed.category) {
          const matchedCat = categories.find(c => c.name === parsed.category)
          if (matchedCat) { updated.category = matchedCat.name }
        }
        if (parsed.startDate) updated.startDate = parsed.startDate
        if (parsed.endDate) updated.endDate = parsed.endDate
        if (parsed.eventTime) updated.eventTime = parsed.eventTime
        if (parsed.location) updated.location = parsed.location
        if (parsed.maxParticipants) updated.maxParticipants = Number(parsed.maxParticipants)
        if (parsed.targetValue !== undefined) updated.targetValue = Number(parsed.targetValue)
        if (['km', 'kcal', 'phút', 'giờ'].includes(parsed.targetUnit)) {
          updated.targetUnit = parsed.targetUnit
        }
        if (parsed.image) updated.image = parsed.image
        if (parsed.description) updated.description = parsed.description.slice(0, 150)
        if (parsed.detailedDescription) updated.detailedDescription = parsed.detailedDescription
        if (parsed.requirements) updated.requirements = parsed.requirements
        if (parsed.benefits) updated.benefits = parsed.benefits
        return updated
      })

      // Clear all errors after AI fill
      setErrors({})
      setShowAIModal(false)
      setAiDescription('')
      toast.success('✨ AI đã điền xong các trường!')
    } catch (err) {
      console.error('AI fill error:', err)
      toast.error(`❌ AI gặp lỗi: ${err.message || 'Không thể xử lý. Thử lại sau.'}`)
    } finally {
      setAiLoading(false)
    }
  }

  // ==================== REAL-TIME FIELD VALIDATOR ====================
  const validateField = (name, value, currentState = newEvent) => {
    let error = null
    switch (name) {
      case 'name':
        if (!value?.trim()) error = 'Vui lòng nhập tên sự kiện'
        break
      case 'startDate':
        if (!value) error = 'Vui lòng nhập ngày bắt đầu'
        else if (!isValidDateStr(value)) error = 'Ngày không hợp lệ — định dạng DD/MM/YYYY'
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
        else if (!isValidDateStr(value)) error = 'Ngày không hợp lệ — định dạng DD/MM/YYYY'
        else if (isPastDate(value)) error = 'Không thể chọn ngày trong quá khứ'
        else if (currentState.startDate && isValidDateStr(currentState.startDate)) {
          const [sd, sm, sy] = currentState.startDate.split('/').map(Number)
          const [ed, em, ey] = value.split('/').map(Number)
          if (new Date(ey, em - 1, ed) < new Date(sy, sm - 1, sd))
            error = 'Ngày kết thúc phải sau ngày bắt đầu'
        }
        break
      case 'eventTime':
        if (!value) error = 'Vui lòng nhập thời điểm'
        else if (!isValidTimeStr(value)) error = 'Thời điểm không hợp lệ — định dạng HH:mm'
        break
      case 'location':
        if (!value?.trim()) error = 'Vui lòng nhập địa điểm'
        break
      case 'description':
        if (!value?.trim()) error = 'Vui lòng nhập mô tả ngắn'
        break
      case 'image':
        if (!value?.trim()) error = 'Vui lòng tải lên ảnh bìa'
        break
      default:
        break
    }
    setErrors(prev => ({ ...prev, [name]: error }))
    return error
  }

  // ==================== HANDLERS ====================
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewEvent(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }))

    if (name === 'location') {
      if (value.length > 2) {
        fetch(`https://rsapi.goong.io/Place/AutoComplete?api_key=UMRiT4CiOH9UU9Ju9L1YJLSYZM5EQberRoSsyfDW&input=${encodeURIComponent(value)}`)
          .then(res => res.json())
          .then(data => {
            if (data.predictions) {
              setLocationSuggestions(data.predictions)
              setShowSuggestions(true)
            }
          })
          .catch(console.error)
      } else {
        setShowSuggestions(false)
      }
    }
  }

  const handleDateChange = (e) => {
    const { name, value } = e.target
    const formatted = formatDateInput(value)
    setNewEvent(prev => ({ ...prev, [name]: formatted }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }))
  }

  const handleTimeChange = (e) => {
    const { name, value } = e.target
    const formatted = formatTimeInput(value)
    setNewEvent(prev => ({ ...prev, [name]: formatted }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }))
  }

  const handleSelectLocation = (address) => {
    setNewEvent(prev => ({ ...prev, location: address }))
    setShowSuggestions(false)
    setErrors(prev => ({ ...prev, location: null }))
  }

  const validateForm = () => {
    const fields = ['name', 'startDate', 'endDate', 'eventTime', 'location', 'description', 'image']
    const sErr = {}
    fields.forEach(f => {
      const e = validateField(f, newEvent[f])
      if (e) sErr[f] = e
    })
    setErrors(sErr)
    return Object.keys(sErr).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validateForm()) {
      toast.error('Vui lòng kiểm tra lại các thông tin bắt buộc')
      setTimeout(() => {
        const firstErrEl = document.querySelector('[data-error="true"]')
        if (firstErrEl) firstErrEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 50)
      return
    }

    const timeStr = newEvent.eventTime || '00:00'
    const startISO = parseDateToISO(newEvent.startDate, timeStr)
    const endISO = parseDateToISO(newEvent.endDate, '23:59')

    const finalData = {
      name: newEvent.name,
      startDate: startISO,
      endDate: endISO,
      location: newEvent.location,
      category: newEvent.category,
      maxParticipants: Number(newEvent.maxParticipants),
      targetValue: Number(newEvent.targetValue),
      targetUnit: (newEvent.eventType === 'Trong nhà' && newEvent.targetUnit === 'km') ? 'kcal' : newEvent.targetUnit,
      image: newEvent.image,
      description: newEvent.description,
      detailedDescription: newEvent.detailedDescription,
      eventType: newEvent.eventType,
      requirements: newEvent.requirements,
      benefits: newEvent.benefits
    }

    createMutation.mutate(finalData)
  }

  // ==================== INPUT CLASSES ====================
  const inputCls = (name) =>
    `w-full px-4 py-3 rounded-xl border-2 dark:bg-gray-700 dark:text-white focus:ring-4 transition outline-none ${errors[name]
      ? 'border-red-400 focus:ring-red-500/10'
      : 'border-gray-100 dark:border-gray-600 focus:border-green-400 focus:ring-green-500/10'
    }`

  const ErrorMsg = ({ name }) => errors[name]
    ? <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
      <FaExclamationCircle className="shrink-0" /> {errors[name]}
    </p>
    : null

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* ====== AI MODAL ====== */}
      {showAIModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0,0,0,0.55)' }}>
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
            {/* Modal Header */}
            <div className="relative bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                  <MdAutoAwesome className="text-2xl" />
                </div>
                <div>
                  <h3 className="font-black text-lg">AI Điền Tự Động</h3>
                  <p className="text-purple-100 text-xs">Mô tả sự kiện → AI tự điền toàn bộ form</p>
                </div>
              </div>
              <button
                onClick={() => { setShowAIModal(false); setAiDescription('') }}
                className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition"
              >
                <FaTimes className="text-sm" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                  Mô tả sơ bộ về sự kiện của bạn
                </label>
                <textarea
                  value={aiDescription}
                  onChange={e => setAiDescription(e.target.value)}
                  rows={5}
                  placeholder={`Ví dụ: "Giải chạy bộ bán marathon buổi sáng tại công viên Tao Đàn, TP.HCM, dành cho cộng đồng yêu thể thao, khoảng 100 người, chạy 21km, tổ chức vào cuối tháng 3/2026..."`}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-purple-100 dark:border-purple-900 dark:bg-gray-700 dark:text-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none resize-none transition text-sm leading-relaxed"
                />
                <p className="text-xs text-gray-400 mt-1">Càng chi tiết, AI càng điền chính xác hơn. Có thể dùng tiếng Việt.</p>
              </div>

              {/* Tips */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl p-4 border border-purple-100 dark:border-purple-800">
                <p className="text-xs font-bold text-purple-700 dark:text-purple-300 mb-2">💡 Gợi ý mô tả:</p>
                <ul className="text-xs text-purple-600 dark:text-purple-400 space-y-1">
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
                className="w-full py-3.5 rounded-2xl font-black text-white flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                style={{ background: aiLoading || !aiDescription.trim() ? '#a78bfa' : 'linear-gradient(135deg, #7c3aed, #4338ca)' }}
              >
                {aiLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    AI đang phân tích và điền form...
                  </>
                ) : (
                  <>
                    <MdAutoAwesome className="text-lg" />
                    Tạo với AI
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white py-8 mb-8">
        <div className="container mx-auto px-4">
          {/* Back button */}
          <button
            onClick={() => navigate('/sport-event')}
            className="flex items-center text-green-50 hover:text-white mb-5 transition text-sm"
          >
            <FaArrowLeft className="mr-2" /> Quay lại
          </button>
          {/* Title row + AI button */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold">Tạo Sự Kiện Thể Thao</h1>
              <p className="opacity-80 mt-1 text-sm">Điền đầy đủ thông tin để tạo sự kiện và xem trước kết quả bên phải</p>
            </div>
            <button
              type="button"
              onClick={() => setShowAIModal(true)}
              className="shrink-0 flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-sm transition-all active:scale-95 hover:shadow-xl hover:shadow-purple-500/40 hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4338ca)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', boxShadow: '0 4px 20px rgba(124,58,237,0.4)' }}
            >
              <MdAutoAwesome className="text-lg shrink-0" />
              <span className="hidden sm:inline">AI Điền Tự Động</span>
              <span className="sm:hidden">AI</span>
            </button>
          </div>
        </div>
      </div>


      <div className="container mx-auto px-4">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* ========== LEFT FORM ========== */}
          <div className="lg:col-span-8 space-y-8">

            {/* 1. Thông tin chung */}
            <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
              <div className="flex items-center gap-3 mb-8 border-b border-gray-100 dark:border-gray-700 pb-4">
                <FaFileAlt className="text-green-500 text-xl" />
                <h2 className="text-xl font-bold dark:text-white">1. Thông tin chung</h2>
              </div>

              <div className="space-y-6">
                {/* Tên */}
                <div data-error={!!errors.name}>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Tên sự kiện <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="name"
                    value={newEvent.name}
                    onChange={handleInputChange}
                    onBlur={e => validateField('name', e.target.value)}
                    placeholder="VD: Marathon Sài Gòn Night Run 2026"
                    className={inputCls('name')}
                  />
                  <ErrorMsg name="name" />
                </div>

                {/* Danh mục */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Danh mục thể thao</label>
                  <select
                    name="category"
                    value={newEvent.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white outline-none focus:border-green-400"
                  >
                    {filteredCategories.map(c => <option key={c._id || c.name} value={c.name}>{c.name}</option>)}
                  </select>
                </div>

                {/* Hình thức tổ chức */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Hình thức tổ chức</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setNewEvent(p => ({ ...p, eventType: 'Ngoài trời' }))}
                      className={`flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border-2 transition-all ${newEvent.eventType === 'Ngoài trời'
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 shadow-md shadow-green-100'
                        : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-green-300'
                        }`}
                    >
                      <div className={`text-3xl ${newEvent.eventType === 'Ngoài trời' ? 'text-green-500' : 'text-gray-400'}`}>
                        🌿
                      </div>
                      <span className="font-bold text-sm">Ngoài trời</span>
                      <span className="text-xs text-gray-400">Chạy bộ, đạp xe, leo núi...</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewEvent(p => ({ ...p, eventType: 'Trong nhà', targetUnit: p.targetUnit === 'km' ? 'kcal' : p.targetUnit }))}
                      className={`flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border-2 transition-all ${newEvent.eventType === 'Trong nhà'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 shadow-md shadow-blue-100'
                        : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-blue-300'
                        }`}
                    >
                      <div className={`text-3xl ${newEvent.eventType === 'Trong nhà' ? 'text-blue-500' : 'text-gray-400'}`}>
                        🏠
                      </div>
                      <span className="font-bold text-sm">Trong nhà</span>
                      <span className="text-xs text-gray-400">Gym, yoga, bơi lội...</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Thời gian & Địa điểm */}
            <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
              <div className="flex items-center gap-3 mb-8 border-b border-gray-100 dark:border-gray-700 pb-4">
                <FaCalendarAlt className="text-blue-500 text-xl" />
                <h2 className="text-xl font-bold dark:text-white">2. Thời gian &amp; Địa điểm</h2>
              </div>

              <div className="space-y-6">
                {/* 3 cột: ngày bắt đầu | ngày kết thúc | thời điểm */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Ngày bắt đầu */}
                  <div data-error={!!errors.startDate}>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      <FaCalendarAlt className="inline mr-1 text-green-500" />
                      Ngày bắt đầu <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="startDate"
                      value={newEvent.startDate}
                      onChange={handleDateChange}
                      onBlur={e => validateField('startDate', e.target.value)}
                      placeholder="DD/MM/YYYY"
                      maxLength={10}
                      className={inputCls('startDate')}
                    />
                    <ErrorMsg name="startDate" />
                  </div>

                  {/* Ngày kết thúc */}
                  <div data-error={!!errors.endDate}>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      <FaCalendarAlt className="inline mr-1 text-red-400" />
                      Ngày kết thúc <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="endDate"
                      value={newEvent.endDate}
                      onChange={handleDateChange}
                      onBlur={e => validateField('endDate', e.target.value)}
                      placeholder="DD/MM/YYYY"
                      maxLength={10}
                      className={inputCls('endDate')}
                    />
                    <ErrorMsg name="endDate" />
                  </div>

                  {/* Thời điểm */}
                  <div data-error={!!errors.eventTime}>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      <FaClock className="inline mr-1 text-orange-400" />
                      Thời điểm <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="eventTime"
                      value={newEvent.eventTime}
                      onChange={handleTimeChange}
                      onBlur={e => validateField('eventTime', e.target.value)}
                      placeholder="HH:mm"
                      maxLength={5}
                      className={inputCls('eventTime')}
                    />
                    <ErrorMsg name="eventTime" />
                  </div>
                </div>

                {/* Gợi ý định dạng */}
                <div className="flex items-start gap-2 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-300">
                  <FaInfoCircle className="mt-0.5 shrink-0" />
                  <span>Nhập ngày theo định dạng <strong>DD/MM/YYYY</strong> (VD: 15/06/2026) và giờ theo <strong>HH:mm</strong> (VD: 07:30). Không thể chọn ngày trong quá khứ.</span>
                </div>

                {/* Địa điểm — chỉ hiện khi là sự kiện ngoài trời */}
                {newEvent.eventType === 'Ngoài trời' && (
                  <div data-error={!!errors.location}>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      <FaMapMarkerAlt className="inline mr-1 text-green-500" />
                      Địa điểm cụ thể
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <FaMapMarkerAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        name="location"
                        value={newEvent.location}
                        onChange={handleInputChange}
                        onBlur={(e) => {
                          setTimeout(() => setShowSuggestions(false), 200)
                          validateField('location', e.target.value)
                        }}
                        placeholder="Công viên Thống Nhất, Hai Bà Trưng, Hà Nội"
                        className={`w-full pl-11 pr-4 py-3 rounded-xl border-2 dark:bg-gray-700 dark:text-white transition outline-none ${errors.location
                          ? 'border-red-400 focus:ring-2 focus:ring-red-500/10'
                          : 'border-gray-100 dark:border-gray-600 focus:border-green-400 focus:ring-4 focus:ring-green-500/10'
                          }`}
                      />
                      {showSuggestions && locationSuggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                          {locationSuggestions.map((sl, index) => (
                            <div
                              key={index}
                              className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700 last:border-0"
                              onClick={() => handleSelectLocation(sl.description)}
                            >
                              📍 {sl.description}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <ErrorMsg name="location" />
                  </div>
                )}
              </div>
            </section>

            {/* 3. Mục tiêu & Sức chứa */}
            <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
              <div className="flex items-center gap-3 mb-8 border-b border-gray-100 dark:border-gray-700 pb-4">
                <FaBullseye className="text-orange-500 text-xl" />
                <h2 className="text-xl font-bold dark:text-white">3. Mục tiêu &amp; Sức chứa</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Số người tối đa */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    <FaUsers className="inline mr-1 text-blue-500" />
                    Số người tối đa
                  </label>
                  <div className="flex items-center border-2 border-gray-100 dark:border-gray-600 rounded-xl overflow-hidden dark:bg-gray-700">
                    <button
                      type="button"
                      onClick={() => setNewEvent(p => ({ ...p, maxParticipants: Math.max(1, Number(p.maxParticipants) - 10) }))}
                      className="px-4 py-3 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-500 transition font-bold text-lg"
                    >−</button>
                    <input
                      type="number"
                      name="maxParticipants"
                      value={newEvent.maxParticipants}
                      onChange={handleInputChange}
                      min={1}
                      className="flex-1 py-3 bg-transparent dark:text-white text-center font-bold text-lg focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setNewEvent(p => ({ ...p, maxParticipants: Number(p.maxParticipants) + 10 }))}
                      className="px-4 py-3 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-500 transition font-bold text-lg"
                    >+</button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 font-medium">Tối đa người tham gia</p>
                </div>

                {/* Mục tiêu */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    <FaBullseye className="inline mr-1 text-orange-500" />
                    Mục tiêu sự kiện
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      name="targetValue"
                      value={newEvent.targetValue}
                      onChange={handleInputChange}
                      min={0}
                      placeholder="0"
                      className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white outline-none focus:border-orange-400 font-bold text-lg text-center"
                    />
                    <select
                      name="targetUnit"
                      value={newEvent.targetUnit}
                      onChange={handleInputChange}
                      className="w-24 px-3 py-3 rounded-xl border-2 border-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white outline-none focus:border-orange-400 font-bold"
                    >
                      {newEvent.eventType === 'Ngoài trời' && <option value="km">km</option>}
                      <option value="kcal">kcal</option>
                      <option value="phút">phút</option>
                      <option value="giờ">giờ</option>
                    </select>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 font-medium">Mục tiêu cần hoàn thành để nhận phần thưởng</p>
                </div>
              </div>
            </section>

            {/* 4. Hình ảnh & Mô tả */}
            <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
              <div className="flex items-center gap-3 mb-8 border-b border-gray-100 dark:border-gray-700 pb-4">
                <FaImage className="text-purple-500 text-xl" />
                <h2 className="text-xl font-bold dark:text-white">4. Hình ảnh &amp; Mô tả</h2>
              </div>

              <div className="space-y-6">
                <div data-error={!!errors.image}>
                  <CloudinaryImageUploader
                    label="Ảnh bìa"
                    required
                    value={newEvent.image}
                    onChange={(url) => {
                      setNewEvent(prev => ({ ...prev, image: url }))
                      if (errors.image) setErrors(prev => ({ ...prev, image: null }))
                    }}
                    error={errors.image}
                    folder="sport-events"
                  />
                </div>

                <div data-error={!!errors.description}>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Mô tả ngắn (hiển thị ngoài card) <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={newEvent.description}
                    onChange={handleInputChange}
                    onBlur={e => validateField('description', e.target.value)}
                    rows={2}
                    maxLength={150}
                    placeholder="Mô tả ngắn gọn trong 150 ký tự..."
                    className={inputCls('description') + ' resize-none'}
                  />
                  <div className="flex justify-between items-center mt-1">
                    <ErrorMsg name="description" />
                    <span className="text-[10px] text-gray-400 font-bold ml-auto">{newEvent.description.length}/150</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Mô tả chi tiết</label>
                  <textarea
                    name="detailedDescription"
                    value={newEvent.detailedDescription}
                    onChange={handleInputChange}
                    rows={5}
                    placeholder="Thông tin chi tiết, lịch trình, lưu ý đặc biệt..."
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white resize-none outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10 transition"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Yêu cầu tham gia</label>
                    <input name="requirements" value={newEvent.requirements} onChange={handleInputChange} placeholder="VD: Sức khỏe ổn định, có kinh nghiệm" className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white outline-none focus:border-purple-400 transition" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Lợi ích khi tham gia</label>
                    <input name="benefits" value={newEvent.benefits} onChange={handleInputChange} placeholder="VD: Voucher, huy chương, kinh nghiệm..." className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white outline-none focus:border-purple-400 transition" />
                  </div>
                </div>
              </div>
            </section>

            {/* Sticky Submit - Mobile */}
            <div className="lg:hidden sticky bottom-4 z-50">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white font-black py-4 rounded-2xl shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition disabled:opacity-50"
              >
                {createMutation.isPending ? 'ĐANG TẠO...' : '✨ TẠO SỰ KIỆN NGAY'}
              </button>
            </div>
          </div>

          {/* ========== RIGHT PREVIEW ========== */}
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

              {/* Preview Card */}
              <div className="group rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-2xl transition hover:shadow-green-500/10 mb-8">
                <div className="relative h-48 bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                  {newEvent.image ? (
                    <img src={newEvent.image} alt="Preview" className="w-full h-full object-cover transition duration-700 group-hover:scale-110" />
                  ) : (
                    <FaImage className="text-gray-300 text-6xl opacity-20" />
                  )}
                  <div className="absolute top-4 left-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur px-3 py-1.5 rounded-xl text-[10px] font-black text-green-600 shadow-xl tracking-tighter">
                    {(newEvent.category || 'THỂ THAO').toUpperCase()}
                  </div>
                  <div className="absolute top-4 right-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur px-3 py-1.5 rounded-xl text-[10px] font-black shadow-xl tracking-tighter">
                    {newEvent.eventType === 'Ngoài trời' ? (
                      <span className="text-green-600">🌿 Ngoài trời</span>
                    ) : (
                      <span className="text-blue-600">🏠 Trong nhà</span>
                    )}
                  </div>
                </div>
                <div className="p-6 bg-white dark:bg-gray-800">
                  <h4 className="font-black text-gray-800 dark:text-white text-lg leading-tight mb-4 min-h-[3.5rem] line-clamp-2">
                    {newEvent.name || 'Tên Sự Kiện Của Bạn'}
                  </h4>
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400">
                      <FaCalendarAlt className="text-green-500" />
                      <span>Bắt đầu: {newEvent.startDate || '--/--/----'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400">
                      <FaCalendarAlt className="text-red-400" />
                      <span>Kết thúc: {newEvent.endDate || '--/--/----'}</span>
                    </div>
                    {newEvent.eventTime && (
                      <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400">
                        <FaClock className="text-orange-400" />
                        <span>Thời điểm: {newEvent.eventTime}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400">
                      <FaUsers className="text-blue-500" />
                      <span>{newEvent.maxParticipants} NGƯỜI</span>
                    </div>
                    {newEvent.targetValue > 0 && (
                      <div className="flex items-center gap-2 text-[11px] font-bold text-green-600">
                        <FaBullseye />
                        <span>MỤC TIÊU: {newEvent.targetValue} {newEvent.targetUnit.toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                  <div className="w-full py-4 bg-green-500 text-white text-xs font-black text-center rounded-2xl shadow-lg shadow-green-500/20 opacity-80">
                    XEM CHI TIẾT
                  </div>
                </div>
              </div>

              {/* Summary checklist */}
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                  <FaCheckCircle className={newEvent.name ? 'text-green-500' : 'text-gray-300'} />
                  <span className="text-sm dark:text-gray-300">Tên sự kiện</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                  <FaCheckCircle className={newEvent.startDate && newEvent.endDate && newEvent.eventTime ? 'text-green-500' : 'text-gray-300'} />
                  <span className="text-sm dark:text-gray-300">Thời gian sự kiện</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                  <FaCheckCircle className={newEvent.location ? 'text-green-500' : 'text-gray-300'} />
                  <span className="text-sm dark:text-gray-300">Địa điểm</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                  <FaCheckCircle className={newEvent.image ? 'text-green-500' : 'text-gray-300'} />
                  <span className="text-sm dark:text-gray-300">Ảnh bìa</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={createMutation.isPending}
                className="hidden lg:flex w-full bg-gradient-to-r from-green-600 to-teal-600 text-white font-black py-4 rounded-2xl shadow-2xl hover:shadow-green-500/30 items-center justify-center gap-4 transition active:scale-95 disabled:opacity-50"
              >
                {createMutation.isPending ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : <>✨ TẠO SỰ KIỆN</>}
              </button>

              <div className="mt-6 flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-2xl">
                <FaInfoCircle className="text-yellow-600 shrink-0" />
                <p className="text-[11px] text-yellow-800 dark:text-yellow-400 font-bold leading-relaxed">
                  Đảm bảo tất cả thông tin chính xác trước khi đăng công khai.
                </p>
              </div>
            </div>
          </div>

        </form>
      </div>
    </div>
  )
}

export default CreateSportEvent
