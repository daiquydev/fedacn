import { useSafeMutation } from '../../hooks/useSafeMutation'
import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
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
  FaExclamationCircle
} from 'react-icons/fa'
import { MdVideocam } from 'react-icons/md'
import { getSportEvent, updateSportEvent } from '../../apis/sportEventApi'
import sportCategoryApi from '../../apis/sportCategoryApi'
import CloudinaryImageUploader from '../../components/GlobalComponents/CloudinaryImageUploader/CloudinaryImageUploader'
import toast from 'react-hot-toast'
import moment from 'moment'

// ==================== DATE/TIME HELPERS ====================
// Date input uses type="date" → value is YYYY-MM-DD
const isValidDateISO = (val) => {
  if (!val || val.length !== 10) return false
  const date = new Date(val + 'T00:00:00')
  return !isNaN(date.getTime())
}

const isValidTimeStr = (val) => {
  if (!val || val.length !== 5) return false
  const [h, min] = val.split(':').map(Number)
  return h >= 0 && h <= 23 && min >= 0 && min <= 59
}

const isPastDate = (dateISO) => {
  if (!isValidDateISO(dateISO)) return false
  const date = new Date(dateISO + 'T00:00:00')
  const today = new Date(); today.setHours(0, 0, 0, 0)
  return date < today
}

const parseDateToISO = (dateISO, timeStr = '00:00') => {
  // dateISO is already YYYY-MM-DD from type="date" input
  return `${dateISO}T${timeStr}:00.000Z`
}

const formatDateInput = (raw) => {
  const digits = raw.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return digits.slice(0, 2) + ':' + digits.slice(2)
}
// ===========================================================

const EditSportEvent = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [newEvent, setNewEvent] = useState({
    name: '',
    startDate: '',      // YYYY-MM-DD (type="date")
    endDate: '',        // YYYY-MM-DD (type="date")
    eventTime: '',      // HH:mm text
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
    benefits: '',
    requireStrava: false
  })

  const [errors, setErrors] = useState({})
  const [isNavigating, setIsNavigating] = useState(false)
  const [locationSuggestions, setLocationSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Fetch current event data
  const { data: eventData, isLoading: isLoadingEvent } = useQuery({
    queryKey: ['sportEvent', id],
    queryFn: () => getSportEvent(id),
    enabled: !!id
  })

  // Populate form from existing event
  useEffect(() => {
    const event = eventData?.data?.result || eventData?.result
    if (event) {
      setNewEvent({
        name: event.name || '',
        startDate: event.startDate ? moment(event.startDate).format('YYYY-MM-DD') : '',
        endDate: event.endDate ? moment(event.endDate).format('YYYY-MM-DD') : '',
        eventTime: event.startDate ? moment(event.startDate).format('HH:mm') : '',
        location: event.location || '',
        category: event.category || '',
        maxParticipants: event.maxParticipants || 50,
        targetValue: event.targetValue || 0,
        targetUnit: (() => {
          const unit = event.targetUnit || 'km'
          const type = event.eventType || 'Ngoài trời'
          // Nếu sự kiện Trong nhà mà unit là 'km' thì tự đổi sang 'kcal'
          if (type === 'Trong nhà' && unit === 'km') return 'kcal'
          return unit
        })(),
        image: event.image || '',
        description: event.description || '',
        detailedDescription: event.detailedDescription || '',
        eventType: event.eventType || 'Ngoài trời',
        requirements: event.requirements || '',
        benefits: event.benefits || '',
        requireStrava: event.requireStrava || false
      })
    }
  }, [eventData])

  // Mutation for updating event
  const updateMutation = useSafeMutation({
    mutationFn: (data) => updateSportEvent(id, data),
    onSuccess: () => {
      setIsNavigating(true)
      toast.success('🎉 Đã cập nhật sự kiện thành công!')
      setTimeout(() => navigate(`/sport-event/${id}`), 1000)
    },
    onError: (error) => {
      const msg = error.response?.data?.message || 'Cập nhật thất bại'
      toast.error(`❌ ${msg}`)
    }
  })

  const { data: categoriesData } = useQuery({
    queryKey: ['sportCategories'],
    queryFn: () => sportCategoryApi.getAll()
  })

  const categories = categoriesData?.data?.result || []
  const filteredCategories = categories.filter(c => c.type === newEvent.eventType)

  useEffect(() => {
    if (filteredCategories.length > 0) {
      setNewEvent(prev => {
        if (!filteredCategories.some(c => c.name === prev.category)) {
          return { ...prev, category: filteredCategories[0].name }
        }
        return prev
      })
    }
  }, [categoriesData, newEvent.eventType])

  // ==================== REAL-TIME FIELD VALIDATOR ====================
  const validateField = (name, value, currentState = newEvent) => {
    let error = null
    switch (name) {
      case 'name':
        if (!value?.trim()) error = 'Vui lòng nhập tên sự kiện'
        break
      case 'startDate':
        if (!value) error = 'Vui lòng nhập ngày bắt đầu'
        else if (!isValidDateISO(value)) error = 'Ngày không hợp lệ'
        else if (currentState.endDate && isValidDateISO(currentState.endDate)) {
          if (new Date(currentState.endDate) < new Date(value))
            setErrors(prev => ({ ...prev, endDate: 'Ngày kết thúc phải sau ngày bắt đầu' }))
          else
            setErrors(prev => ({ ...prev, endDate: null }))
        }
        break
      case 'endDate':
        if (!value) error = 'Vui lòng nhập ngày kết thúc'
        else if (!isValidDateISO(value)) error = 'Ngày không hợp lệ'
        else if (isPastDate(value)) error = 'Ngày kết thúc không thể nằm trong quá khứ'
        else if (currentState.startDate && isValidDateISO(currentState.startDate)) {
          if (new Date(value) < new Date(currentState.startDate))
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
    // type="date" already gives YYYY-MM-DD format directly
    setNewEvent(prev => ({ ...prev, [name]: value }))
    validateField(name, value)
  }

  const handleTimeChange = (e) => {
    const { name, value } = e.target
    const formatted = formatDateInput(value)
    setNewEvent(prev => ({ ...prev, [name]: formatted }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }))
  }

  const handleSelectLocation = (address) => {
    setNewEvent(prev => ({ ...prev, location: address }))
    setShowSuggestions(false)
    setErrors(prev => ({ ...prev, location: null }))
  }

  const validateForm = () => {
    const fields = ['name', 'startDate', 'endDate', 'eventTime', ...(newEvent.eventType === 'Ngoài trời' ? ['location'] : []), 'description', 'image']
    const sErr = {}
    fields.forEach(f => {
      // Run validate but collect errors manually without setting state per-field
      let e = null
      if (f === 'startDate') {
        if (!newEvent[f]) e = 'Vui lòng nhập ngày bắt đầu'
        else if (!isValidDateISO(newEvent[f])) e = 'Ngày không hợp lệ'
      } else if (f === 'endDate') {
        if (!newEvent[f]) e = 'Vui lòng nhập ngày kết thúc'
        else if (!isValidDateISO(newEvent[f])) e = 'Ngày không hợp lệ'
        else if (isPastDate(newEvent[f])) e = 'Ngày kết thúc không thể nằm trong quá khứ'
        else if (newEvent.startDate && new Date(newEvent[f]) < new Date(newEvent.startDate)) e = 'Ngày kết thúc phải sau ngày bắt đầu'
      } else {
        e = validateField(f, newEvent[f])
      }
      if (e) sErr[f] = e
    })
    setErrors(sErr)
    return Object.keys(sErr).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Ngăn chặn submit nhiều lần
    if (updateMutation.isPending || isNavigating) return

    if (!validateForm()) {
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
      location: newEvent.eventType === 'Trong nhà' ? (newEvent.location?.trim() || 'Video call trực tuyến') : newEvent.location,
      category: newEvent.category,
      maxParticipants: Number(newEvent.maxParticipants),
      targetValue: Number(newEvent.targetValue),
      targetUnit: (newEvent.eventType === 'Trong nhà' && newEvent.targetUnit === 'km') ? 'kcal' : newEvent.targetUnit,
      image: newEvent.image,
      description: newEvent.description,
      detailedDescription: newEvent.detailedDescription,
      eventType: newEvent.eventType,
      requirements: newEvent.requirements,
      benefits: newEvent.benefits,
      requireStrava: newEvent.eventType === 'Ngoài trời' ? newEvent.requireStrava : false
    }

    updateMutation.mutate(finalData)
  }

  // ==================== HELPERS ====================
  const inputCls = (name) =>
    `w-full px-4 py-3 rounded-xl border-2 dark:bg-gray-700 dark:text-white focus:ring-4 transition outline-none ${errors[name]
      ? 'border-red-400 focus:ring-red-500/10'
      : 'border-gray-100 dark:border-gray-600 focus:border-emerald-400 focus:ring-emerald-500/10'
    }`

  const ErrorMsg = ({ name }) => errors[name]
    ? <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
      <FaExclamationCircle className="shrink-0" /> {errors[name]}
    </p>
    : null

  if (isLoadingEvent) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-10 mb-8">
        <div className="container mx-auto px-4">
          <button
            onClick={() => navigate('/sport-event/my-events')}
            className="flex items-center text-emerald-50 hover:text-white mb-4 transition"
          >
            <FaArrowLeft className="mr-2" /> Quay lại dashboard
          </button>
          <h1 className="text-3xl font-extrabold">Chỉnh Sửa Sự Kiện</h1>
          <p className="opacity-90 mt-1">Cập nhật thông tin chi tiết cho sự kiện của bạn</p>
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
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white outline-none focus:border-emerald-400"
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
                      <div className={`text-3xl ${newEvent.eventType === 'Ngoài trời' ? 'text-green-500' : 'text-gray-400'}`}>🌿</div>
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
                      <div className={`text-3xl ${newEvent.eventType === 'Trong nhà' ? 'text-blue-500' : 'text-gray-400'}`}>🏠</div>
                      <span className="font-bold text-sm">Trong nhà</span>
                      <span className="text-xs text-gray-400">Gym, yoga, bơi lội...</span>
                    </button>
                  </div>
                </div>

                {/* Yêu cầu Strava Sync */}
                {newEvent.eventType === 'Ngoài trời' && (
                  <div className="flex items-center gap-3 bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-100 dark:border-orange-800">
                    <div className="flex-1">
                      <h4 className="font-bold text-sm text-orange-900 dark:text-orange-300">Yêu cầu ghi hoạt động (đồng bộ Strava)</h4>
                      <p className="text-xs text-orange-700 dark:text-orange-400">Chỉ chấp nhận tiến độ từ hoạt động đã ghi trên Strava</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        name="requireStrava"
                        className="sr-only peer" 
                        checked={newEvent.requireStrava}
                        onChange={(e) => setNewEvent(p => ({ ...p, requireStrava: e.target.checked }))}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-300 dark:peer-focus:ring-orange-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-orange-500"></div>
                    </label>
                  </div>
                )}
              </div>
            </section>

            {/* 2. Thời gian & Địa điểm */}
            <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
              <div className="flex items-center gap-3 mb-8 border-b border-gray-100 dark:border-gray-700 pb-4">
                <FaCalendarAlt className="text-blue-500 text-xl" />
                <h2 className="text-xl font-bold dark:text-white">2. Thời gian &amp; Địa điểm</h2>
              </div>

              <div className="space-y-6">
                {/* 3 cột ngày/giờ */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Ngày bắt đầu */}
                  <div data-error={!!errors.startDate}>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      <FaCalendarAlt className="inline mr-1 text-green-500" />
                      Ngày bắt đầu <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={newEvent.startDate}
                      onChange={handleDateChange}
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
                      type="date"
                      name="endDate"
                      value={newEvent.endDate}
                      onChange={handleDateChange}
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

                {/* Hint */}
                <div className="flex items-start gap-2 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-300">
                  <FaInfoCircle className="mt-0.5 shrink-0" />
                  <span>Chọn ngày từ lịch và nhập giờ theo định dạng <strong>HH:mm</strong> (VD: 07:30). Ngày kết thúc không thể ở quá khứ.</span>
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
                        placeholder="Tìm địa điểm..."
                        className={`w-full pl-11 pr-4 py-3 rounded-xl border-2 dark:bg-gray-700 dark:text-white transition outline-none ${errors.location
                          ? 'border-red-400'
                          : 'border-gray-100 dark:border-gray-600 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10'
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
                      placeholder="Nhập số người tham gia"
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
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Mô tả ngắn <span className="text-red-500">*</span></label>
                  <textarea
                    name="description"
                    value={newEvent.description}
                    onChange={handleInputChange}
                    onBlur={e => validateField('description', e.target.value)}
                    rows={2}
                    maxLength={150}
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
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white resize-none outline-none focus:border-emerald-400 transition"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Yêu cầu tham gia</label>
                    <input name="requirements" value={newEvent.requirements} onChange={handleInputChange} placeholder="Yêu cầu..." className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white outline-none focus:border-emerald-400 transition" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Lợi ích khi tham gia</label>
                    <input name="benefits" value={newEvent.benefits} onChange={handleInputChange} placeholder="Lợi ích..." className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white outline-none focus:border-emerald-400 transition" />
                  </div>
                </div>
              </div>
            </section>

          </div>

          {/* ========== RIGHT PREVIEW ========== */}
          <div className="lg:col-span-4 lg:sticky lg:top-8 h-fit space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
              <h3 className="font-black text-gray-800 dark:text-white flex items-center gap-2 mb-8 uppercase text-xs tracking-widest">
                <FaStar className="text-yellow-400" /> BẢN XEM TRƯỚC CẬP NHẬT
              </h3>

              {/* Preview Card */}
              <div className="rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-2xl mb-8">
                <div className="relative h-44 bg-gray-100 dark:bg-gray-700">
                  {newEvent.image && <img src={newEvent.image} alt="Preview" className="w-full h-full object-cover" />}
                  <div className="absolute top-4 left-4 bg-white/90 dark:bg-gray-900/90 px-3 py-1 rounded-xl text-[10px] font-black shadow-sm">
                    {newEvent.eventType === 'Ngoài trời'
                      ? <span className="text-green-600">🌿 Ngoài trời</span>
                      : <span className="text-blue-600">🏠 Trong nhà</span>
                    }
                  </div>
                  <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-900/90 px-3 py-1 rounded-xl text-[10px] font-black text-blue-600 shadow-sm uppercase tracking-tighter">
                    {newEvent.category}
                  </div>
                </div>
                <div className="p-6 bg-white dark:bg-gray-800">
                  <h4 className="font-black text-gray-800 dark:text-white line-clamp-2 min-h-[3rem] mb-4">
                    {newEvent.name || 'Tên sự kiện'}
                  </h4>
                  <div className="space-y-2 text-[10px] font-bold text-gray-400 mb-6 uppercase tracking-tighter">
                    <div className="flex items-center gap-1">
                      <FaCalendarAlt className="text-green-500" />
                      <span>Bắt đầu: {newEvent.startDate ? newEvent.startDate.split('-').reverse().join('/') : '--/--/----'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FaCalendarAlt className="text-red-400" />
                      <span>Kết thúc: {newEvent.endDate ? newEvent.endDate.split('-').reverse().join('/') : '--/--/----'}</span>
                    </div>
                    {newEvent.eventTime && (
                      <div className="flex items-center gap-1">
                        <FaClock className="text-orange-400" />
                        <span>Thời điểm: {newEvent.eventTime}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <FaUsers className="text-blue-500" />
                      <span>{newEvent.maxParticipants} Người</span>
                    </div>
                    {newEvent.targetValue > 0 && (
                      <div className="flex items-center gap-1 text-blue-600">
                        <FaBullseye />
                        <span>{newEvent.targetValue} {newEvent.targetUnit}</span>
                      </div>
                    )}
                  </div>
                  <div className="w-full py-3 bg-green-500 text-white text-[10px] font-black text-center rounded-xl opacity-80 cursor-default">XEM CHI TIẾT</div>
                </div>
              </div>

              {/* Checklist */}
              <div className="space-y-3 mb-8">
                {[
                  { label: 'Tên sự kiện', done: !!newEvent.name },
                  { label: 'Thời gian sự kiện', done: !!(newEvent.startDate && newEvent.endDate && newEvent.eventTime) },
                  { label: 'Địa điểm', done: !!newEvent.location },
                  { label: 'Ảnh bìa', done: !!newEvent.image },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                    <FaCheckCircle className={item.done ? 'text-green-500' : 'text-gray-300'} />
                    <span className="text-sm dark:text-gray-300">{item.label}</span>
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={updateMutation.isPending || isNavigating}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black py-4 rounded-2xl shadow-2xl hover:shadow-emerald-500/30 items-center justify-center gap-4 transition active:scale-95 disabled:opacity-50 flex"
              >
                {updateMutation.isPending || isNavigating ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : 'CẬP NHẬT THAY ĐỔI'}
              </button>

              <div className="mt-6 flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl">
                <FaInfoCircle className="text-emerald-600 shrink-0" />
                <p className="text-[10px] text-emerald-800 dark:text-emerald-400 font-bold leading-relaxed">
                  Bạn có thể tiếp tục chỉnh sửa sau này nếu cần thiết.
                </p>
              </div>
            </div>
          </div>

        </form>
      </div>
    </div>
  )
}

export default EditSportEvent
