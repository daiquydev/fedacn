import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { 
  FaArrowLeft, 
  FaRunning, 
  FaCalendarAlt, 
  FaMapMarkerAlt, 
  FaDumbbell, 
  FaImage, 
  FaUsers, 
  FaFileAlt,
  FaPlus,
  FaTrash,
  FaTrophy,
  FaBullseye,
  FaQuestionCircle,
  FaListUl,
  FaStar,
  FaCheckCircle,
  FaInfoCircle
} from 'react-icons/fa'
import { MdSportsSoccer, MdVideocam, MdHelpOutline, MdOutlineGavel } from 'react-icons/md'
import { getSportEvent, updateSportEvent } from '../../apis/sportEventApi'
import toast from 'react-hot-toast'
import moment from 'moment'

const EditSportEvent = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [newEvent, setNewEvent] = useState({
    name: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    location: '',
    category: 'Chạy bộ',
    difficulty: 'Trung bình',
    maxParticipants: 50,
    targetValue: 0,
    targetUnit: 'km',
    image: '',
    description: '',
    detailedDescription: '',
    eventType: 'offline',
    requirements: '',
    benefits: '',
    rules: [''],
    rewards: [''],
    faqs: [{ question: '', answer: '' }]
  })

  const [errors, setErrors] = useState({})

  // Fetch current event data
  const { data: eventData, isLoading: isLoadingEvent } = useQuery({
    queryKey: ['sportEvent', id],
    queryFn: () => getSportEvent(id),
    enabled: !!id
  })

  useEffect(() => {
    if (eventData?.data?.result || eventData?.result) {
      const event = eventData.data?.result || eventData.result
      setNewEvent({
        name: event.name || '',
        startDate: event.startDate ? moment(event.startDate).format('YYYY-MM-DD') : '',
        startTime: event.startDate ? moment(event.startDate).format('HH:mm') : '',
        endDate: event.endDate ? moment(event.endDate).format('YYYY-MM-DD') : '',
        endTime: event.endDate ? moment(event.endDate).format('HH:mm') : '',
        location: event.location || '',
        category: event.category || 'Chạy bộ',
        difficulty: event.difficulty || 'Trung bình',
        maxParticipants: event.maxParticipants || 50,
        targetValue: event.targetValue || 0,
        targetUnit: event.targetUnit || 'km',
        image: event.image || '',
        description: event.description || '',
        detailedDescription: event.detailedDescription || '',
        eventType: event.eventType || 'offline',
        requirements: event.requirements || '',
        benefits: event.benefits || '',
        rules: event.rules?.length > 0 ? event.rules : [''],
        rewards: event.rewards?.length > 0 ? event.rewards : [''],
        faqs: event.faqs?.length > 0 ? event.faqs : [{ question: '', answer: '' }]
      })
    }
  }, [eventData])

  // Mutation for updating event
  const updateMutation = useMutation({
    mutationFn: (data) => updateSportEvent(id, data),
    onSuccess: () => {
      toast.success('🎉 Đã cập nhật sự kiện thành công!')
      setTimeout(() => navigate(`/sport-event/${id}`), 1000)
    },
    onError: (error) => {
      const msg = error.response?.data?.message || 'Cập nhật thất bại'
      toast.error(`❌ ${msg}`)
    }
  })

  const categories = [
    { name: 'Chạy bộ', icon: <FaRunning /> },
    { name: 'Đạp xe', icon: <MdSportsSoccer /> },
    { name: 'Bơi lội', icon: <FaDumbbell /> },
    { name: 'Fitness', icon: <FaDumbbell /> },
    { name: 'Bóng rổ', icon: <MdSportsSoccer /> },
    { name: 'Yoga', icon: <FaRunning /> },
    { name: 'Cầu lông', icon: <MdSportsSoccer /> }
  ]

  const difficulties = ['Dễ', 'Trung bình', 'Khó', 'Thử thách']

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewEvent(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }))
  }

  const handleArrayChange = (index, value, field) => {
    const newArr = [...newEvent[field]]
    newArr[index] = value
    setNewEvent(prev => ({ ...prev, [field]: newArr }))
  }

  const addArrayItem = (field) => {
    setNewEvent(prev => ({ ...prev, [field]: [...prev[field], ''] }))
  }

  const removeArrayItem = (index, field) => {
    const newArr = [...newEvent[field]]
    if (newArr.length > 1) {
      newArr.splice(index, 1)
      setNewEvent(prev => ({ ...prev, [field]: newArr }))
    }
  }

  const handleFaqChange = (index, field, value) => {
    const newFaqs = [...newEvent.faqs]
    newFaqs[index][field] = value
    setNewEvent(prev => ({ ...prev, faqs: newFaqs }))
  }

  const addFaq = () => {
    setNewEvent(prev => ({ ...prev, faqs: [...prev.faqs, { question: '', answer: '' }] }))
  }

  const removeFaq = (index) => {
    const newFaqs = [...newEvent.faqs]
    if (newFaqs.length > 1) {
      newFaqs.splice(index, 1)
      setNewEvent(prev => ({ ...prev, faqs: newFaqs }))
    }
  }

  const validateForm = () => {
    const sErr = {}
    if (!newEvent.name.trim()) sErr.name = 'Yêu cầu tên sự kiện'
    if (!newEvent.startDate) sErr.startDate = 'Yêu cầu ngày bắt đầu'
    if (!newEvent.startTime) sErr.startTime = 'Yêu cầu giờ bắt đầu'
    if (!newEvent.endDate) sErr.endDate = 'Yêu cầu ngày kết thúc'
    if (!newEvent.endTime) sErr.endTime = 'Yêu cầu giờ kết thúc'
    if (!newEvent.location.trim()) sErr.location = 'Yêu cầu địa điểm'
    if (!newEvent.description.trim()) sErr.description = 'Yêu cầu mô tả ngắn'
    if (!newEvent.image.trim()) sErr.image = 'Yêu cầu URL ảnh'

    if (newEvent.startDate && newEvent.endDate) {
      const start = new Date(`${newEvent.startDate}T${newEvent.startTime}`)
      const end = new Date(`${newEvent.endDate}T${newEvent.endTime}`)
      if (end <= start) sErr.endDate = 'Thời gian kết thúc phải sau bắt đầu'
    }

    setErrors(sErr)
    return Object.keys(sErr).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validateForm()) {
      toast.error('Vui lòng kiểm tra các thông tin bắt buộc')
      return
    }

    const start = new Date(`${newEvent.startDate}T${newEvent.startTime}`).toISOString()
    const end = new Date(`${newEvent.endDate}T${newEvent.endTime}`).toISOString()

    const finalData = {
      ...newEvent,
      startDate: start,
      endDate: end,
      maxParticipants: Number(newEvent.maxParticipants),
      targetValue: Number(newEvent.targetValue),
      rules: newEvent.rules.filter(r => r.trim()),
      rewards: newEvent.rewards.filter(r => r.trim()),
      faqs: newEvent.faqs.filter(f => f.question.trim() && f.answer.trim())
    }

    updateMutation.mutate(finalData)
  }

  if (isLoadingEvent) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-10 mb-8">
        <div className="container mx-auto px-4">
          <button
            onClick={() => navigate('/sport-event/my-events')}
            className="flex items-center text-blue-50 hover:text-white mb-4 transition"
          >
            <FaArrowLeft className="mr-2" /> Quay lại dashboard
          </button>
          <h1 className="text-3xl font-extrabold">Chỉnh Sửa Sự Kiện</h1>
          <p className="opacity-90">Cập nhật thông tin chi tiết cho sự kiện của bạn</p>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Form Content - Left Side */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* 1. Thông tin chung */}
            <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
              <div className="flex items-center gap-3 mb-8 border-b border-gray-100 dark:border-gray-700 pb-4">
                <FaFileAlt className="text-blue-500 text-xl" />
                <h2 className="text-xl font-bold dark:text-white">1. Thông tin chung</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Tên sự kiện *</label>
                  <input
                    name="name"
                    value={newEvent.name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-xl border-2 dark:bg-gray-700 dark:text-white outline-none ${
                        errors.name ? 'border-red-500' : 'border-gray-100 dark:border-gray-600'
                    }`}
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Danh mục</label>
                  <select
                    name="category"
                    value={newEvent.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white outline-none"
                  >
                    {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Độ khó</label>
                  <select
                    name="difficulty"
                    value={newEvent.difficulty}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white outline-none"
                  >
                    {difficulties.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Hình thức tổ chức</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setNewEvent(p => ({ ...p, eventType: 'offline' }))}
                      className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition ${
                        newEvent.eventType === 'offline' 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' 
                        : 'border-gray-100 dark:border-gray-700 text-gray-500'
                      }`}
                    >
                      <FaMapMarkerAlt /> <b>Trực tiếp</b>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewEvent(p => ({ ...p, eventType: 'online' }))}
                      className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition ${
                        newEvent.eventType === 'online' 
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400' 
                        : 'border-gray-100 dark:border-gray-700 text-gray-500'
                      }`}
                    >
                      <MdVideocam size={20} /> <b>Trực tuyến</b>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Thời gian & Địa điểm */}
            <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
              <div className="flex items-center gap-3 mb-8 border-b border-gray-100 dark:border-gray-700 pb-4">
                <FaCalendarAlt className="text-blue-500 text-xl" />
                <h2 className="text-xl font-bold dark:text-white">2. Thời gian & Địa điểm</h2>
              </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  {/* Start Date & Time */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-700 pb-2 mb-2">
                       Bắt đầu
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500">Ngày bắt đầu</label>
                        <input 
                          type="date" 
                          name="startDate" 
                          value={newEvent.startDate} 
                          onChange={handleInputChange} 
                          className={`w-full px-4 py-3 rounded-xl border-2 dark:bg-gray-700 dark:text-white outline-none ${
                            errors.startDate ? 'border-red-500' : 'border-gray-100 dark:border-gray-600'
                          }`} 
                        />
                         {errors.startDate && <p className="text-red-500 text-xs">{errors.startDate}</p>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500">Giờ bắt đầu</label>
                        <input 
                          type="time" 
                          name="startTime" 
                          value={newEvent.startTime} 
                          onChange={handleInputChange} 
                          className={`w-full px-4 py-3 rounded-xl border-2 dark:bg-gray-700 dark:text-white outline-none ${
                            errors.startTime ? 'border-red-500' : 'border-gray-100 dark:border-gray-600'
                          }`} 
                        />
                         {errors.startTime && <p className="text-red-500 text-xs">{errors.startTime}</p>}
                      </div>
                    </div>
                  </div>

                  {/* End Date & Time */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-700 pb-2 mb-2">
                       Kết thúc
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-gray-500">Ngày kết thúc</label>
                         <input 
                           type="date" 
                           name="endDate" 
                           value={newEvent.endDate} 
                           onChange={handleInputChange} 
                           className={`w-full px-4 py-3 rounded-xl border-2 dark:bg-gray-700 dark:text-white outline-none ${
                             errors.endDate ? 'border-red-500' : 'border-gray-100 dark:border-gray-600'
                           }`} 
                         />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500">Giờ kết thúc</label>
                        <input 
                          type="time" 
                          name="endTime" 
                          value={newEvent.endTime} 
                          onChange={handleInputChange} 
                          className={`w-full px-4 py-3 rounded-xl border-2 dark:bg-gray-700 dark:text-white outline-none ${
                             errors.endTime ? 'border-red-500' : 'border-gray-100 dark:border-gray-600'
                          }`} 
                        />
                         {errors.endTime && <p className="text-red-500 text-xs">{errors.endTime}</p>}
                      </div>
                    </div>
                    {errors.endDate && <p className="text-red-500 text-xs">{errors.endDate}</p>}
                  </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    {newEvent.eventType === 'offline' ? 'Địa điểm cụ thể *' : 'Nền tảng / Link tham gia'}
                  </label>
                  <div className="relative">
                    <FaMapMarkerAlt className="absolute left-4 top-4 text-gray-400" />
                    <input
                      name="location"
                      value={newEvent.location}
                      onChange={handleInputChange}
                      className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 dark:bg-gray-700 dark:text-white outline-none ${
                        errors.location ? 'border-red-500' : 'border-gray-100 dark:border-gray-600'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* 3. Mục tiêu & Sức chứa */}
            <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
              <div className="flex items-center gap-3 mb-8 border-b border-gray-100 dark:border-gray-700 pb-4">
                <FaBullseye className="text-orange-500 text-xl" />
                <h2 className="text-xl font-bold dark:text-white">3. Mục tiêu & Sức chứa</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Số lượng người tối đa</label>
                  <div className="flex items-center border-2 border-gray-100 dark:border-gray-600 rounded-xl px-4 dark:bg-gray-700">
                    <FaUsers className="text-gray-400 mr-2" />
                    <input type="number" name="maxParticipants" value={newEvent.maxParticipants} onChange={handleInputChange} className="w-full py-3 bg-transparent dark:text-white outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Mục tiêu</label>
                    <input type="number" name="targetValue" value={newEvent.targetValue} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Đơn vị</label>
                    <select name="targetUnit" value={newEvent.targetUnit} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white outline-none">
                      <option value="km">km</option>
                      <option value="calo">calo</option>
                      <option value="bước">bước</option>
                      <option value="phút">phút</option>
                    </select>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. Hình ảnh & Mô tả */}
            <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
              <div className="flex items-center gap-3 mb-8 border-b border-gray-100 dark:border-gray-700 pb-4">
                <FaImage className="text-purple-500 text-xl" />
                <h2 className="text-xl font-bold dark:text-white">4. Hình ảnh & Mô tả</h2>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Ảnh bìa (URL) *</label>
                  <input name="image" value={newEvent.image} onChange={handleInputChange} className={`w-full px-4 py-3 rounded-xl border-2 dark:bg-gray-700 dark:text-white outline-none ${errors.image ? 'border-red-500' : 'border-gray-100 dark:border-gray-600'}`} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Mô tả ngắn *</label>
                  <textarea name="description" value={newEvent.description} onChange={handleInputChange} rows={2} maxLength={150} className={`w-full px-4 py-3 rounded-xl border-2 dark:bg-gray-700 dark:text-white resize-none outline-none ${errors.description ? 'border-red-500' : 'border-gray-100 dark:border-gray-600'}`} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Mô tả chi tiết</label>
                  <textarea name="detailedDescription" value={newEvent.detailedDescription} onChange={handleInputChange} rows={5} className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white resize-none outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <input name="requirements" value={newEvent.requirements} onChange={handleInputChange} placeholder="Yêu cầu" className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white outline-none" />
                    <input name="benefits" value={newEvent.benefits} onChange={handleInputChange} placeholder="Lợi ích" className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white outline-none" />
                </div>
              </div>
            </section>

            {/* 5. Quy định & FAQ */}
            <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
              <div className="flex items-center gap-3 mb-8 border-b border-gray-100 dark:border-gray-700 pb-4">
                <MdOutlineGavel className="text-red-500 text-xl" />
                <h2 className="text-xl font-bold dark:text-white">5. Quy định & FAQ</h2>
              </div>
              <div className="space-y-8">
                <div>
                  <div className="flex justify-between items-center mb-4"><label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Quy định</label><button type="button" onClick={() => addArrayItem('rules')} className="text-xs font-bold text-blue-500">+ THÊM QUY ĐỊNH</button></div>
                  <div className="space-y-3">
                    {newEvent.rules.map((rule, i) => (
                      <div key={i} className="flex gap-2">
                        <input value={rule} onChange={(e) => handleArrayChange(i, e.target.value, 'rules')} className="flex-1 px-4 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:border-blue-500" />
                        <button type="button" onClick={() => removeArrayItem(i, 'rules')} className="text-gray-300 hover:text-red-500"><FaTrash size={14} /></button>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-4"><label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Phần thưởng</label><button type="button" onClick={() => addArrayItem('rewards')} className="text-xs font-bold text-yellow-500">+ THÊM PHẦN THƯỞNG</button></div>
                  <div className="space-y-3">
                    {newEvent.rewards.map((reward, i) => (
                      <div key={i} className="flex gap-2">
                        <input value={reward} onChange={(e) => handleArrayChange(i, e.target.value, 'rewards')} className="flex-1 px-4 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:border-yellow-500" />
                        <button type="button" onClick={() => removeArrayItem(i, 'rewards')} className="text-gray-300 hover:text-red-500"><FaTrash size={14} /></button>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-4"><label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Câu hỏi</label><button type="button" onClick={addFaq} className="text-xs font-bold text-blue-500">+ THÊM FAQ</button></div>
                  <div className="space-y-4">
                    {newEvent.faqs.map((faq, i) => (
                      <div key={i} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border dark:border-gray-600 space-y-2 relative">
                        <button type="button" onClick={() => removeFaq(i)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500"><FaTrash size={12} /></button>
                        <input value={faq.question} onChange={(e) => handleFaqChange(i, 'question', e.target.value)} placeholder="Câu hỏi" className="w-full bg-transparent border-b dark:text-white outline-none pb-1" />
                        <textarea value={faq.answer} onChange={(e) => handleFaqChange(i, 'answer', e.target.value)} placeholder="Trả lời" rows={2} className="w-full bg-transparent dark:text-gray-300 outline-none resize-none pt-1" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

          </div>

          {/* Preview Sidebar - Right Side */}
          <div className="lg:col-span-4 lg:sticky lg:top-8 h-fit space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
                <h3 className="font-black text-gray-800 dark:text-white flex items-center gap-2 mb-8 uppercase text-xs tracking-widest">
                    <FaStar className="text-yellow-400" /> BẢN XEM TRƯỚC CẬP NHẬT
                </h3>

                {/* Event Card Preview */}
                <div className="rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-2xl mb-8">
                  <div className="relative h-44 bg-gray-100 dark:bg-gray-700">
                    {newEvent.image && <img src={newEvent.image} alt="Preview" className="w-full h-full object-cover" />}
                    <div className="absolute top-4 left-4 bg-white/90 dark:bg-gray-900/90 px-3 py-1 rounded-xl text-[10px] font-black text-blue-600 shadow-sm uppercase tracking-tighter">{newEvent.category}</div>
                  </div>
                  <div className="p-6 bg-white dark:bg-gray-800">
                    <h4 className="font-black text-gray-800 dark:text-white line-clamp-2 min-h-[3rem] mb-4">{newEvent.name || 'Tên sự kiện'}</h4>
                    <div className="grid grid-cols-2 gap-y-2 text-[10px] font-bold text-gray-400 mb-6 uppercase tracking-tighter">
                      <span className="flex items-center gap-1"><FaCalendarAlt className="text-blue-500" /> {newEvent.startDate ? moment(newEvent.startDate).format('DD/MM/YYYY') : '--'}</span>
                      <span className="flex items-center gap-1"><FaUsers className="text-green-500" /> {newEvent.maxParticipants} NGƯỜI</span>
                      <span className="col-span-2 flex items-center gap-1 text-blue-600"><FaBullseye /> {newEvent.targetValue}{newEvent.targetUnit}</span>
                    </div>
                    <div className="w-full py-3 bg-blue-600 text-white text-[10px] font-black text-center rounded-xl opacity-80 cursor-default">XEM CHI TIẾT</div>
                  </div>
                </div>

                <button
                    type="submit"
                    disabled={updateMutation.isPending}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black py-4 rounded-2xl shadow-2xl hover:shadow-blue-500/30 items-center justify-center gap-4 transition active:scale-95 disabled:opacity-50 flex"
                >
                    {updateMutation.isPending ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : 'CẬP NHẬT THAY ĐỔI'}
                </button>
                
                <div className="mt-6 flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl">
                    <FaInfoCircle className="text-blue-600 shrink-0" />
                    <p className="text-[10px] text-blue-800 dark:text-blue-400 font-bold leading-relaxed">
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
