import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
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
import { createSportEvent } from '../../apis/sportEventApi'
import toast from 'react-hot-toast'
import moment from 'moment'

const CreateSportEvent = () => {
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
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc')
      // Scroll to first error
      const firstError = Object.keys(errors)[0]
      const el = document.getElementsByName(firstError)[0]
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
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

    createMutation.mutate(finalData)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white py-10 mb-8">
        <div className="container mx-auto px-4">
          <button
            onClick={() => navigate('/sport-event')}
            className="flex items-center text-green-50 hover:text-white mb-4 transition"
          >
            <FaArrowLeft className="mr-2" /> Quay lại
          </button>
          <h1 className="text-3xl font-extrabold">Tạo Sự Kiện Thể Thao</h1>
          <p className="opacity-90">Hoàn thiện thông tin bên trái để xem trước thẻ sự kiện bên phải</p>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Form Content - Left Side */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* 1. Thông tin chung */}
            <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
              <div className="flex items-center gap-3 mb-8 border-b border-gray-100 dark:border-gray-700 pb-4">
                <FaFileAlt className="text-green-500 text-xl" />
                <h2 className="text-xl font-bold dark:text-white">1. Thông tin chung</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Tên sự kiện *</label>
                  <input
                    name="name"
                    value={newEvent.name}
                    onChange={handleInputChange}
                    placeholder="VD: Marathon Sài Gòn Night Run 2026"
                    className={`w-full px-4 py-3 rounded-xl border-2 dark:bg-gray-700 dark:text-white focus:ring-4 focus:ring-green-500/10 transition outline-none ${
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
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
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
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400' 
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
                      placeholder={newEvent.eventType === 'offline' ? 'Công viên Thống Nhất, Hai Bà Trưng, Hà Nội' : 'Zoom, Google Meet, Facebook Live...'}
                      className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 dark:bg-gray-700 dark:text-white focus:ring-4 focus:ring-blue-500/10 transition outline-none ${
                        errors.location ? 'border-red-500' : 'border-gray-100 dark:border-gray-600'
                      }`}
                    />
                  </div>
                  {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
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
                    <input
                      type="number"
                      name="maxParticipants"
                      value={newEvent.maxParticipants}
                      onChange={handleInputChange}
                      className="w-full py-3 bg-transparent dark:text-white focus:outline-none"
                    />
                    <span className="text-xs font-bold text-gray-400 ml-2 whitespace-nowrap">NGƯỜI</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-1">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Mục tiêu</label>
                    <input
                      type="number"
                      name="targetValue"
                      value={newEvent.targetValue}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white outline-none"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Đơn vị</label>
                    <select
                      name="targetUnit"
                      value={newEvent.targetUnit}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white outline-none"
                    >
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
                  <input
                    name="image"
                    value={newEvent.image}
                    onChange={handleInputChange}
                    placeholder="Dán link ảnh tại đây (Unsplash, Pexels...)"
                    className={`w-full px-4 py-3 rounded-xl border-2 dark:bg-gray-700 dark:text-white focus:ring-4 focus:ring-purple-500/10 transition outline-none ${
                        errors.image ? 'border-red-500' : 'border-gray-100 dark:border-gray-600'
                    }`}
                  />
                  {errors.image && <p className="text-red-500 text-xs mt-1">{errors.image}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Mô tả ngắn (Hiển thị ngoài card) *</label>
                  <textarea
                    name="description"
                    value={newEvent.description}
                    onChange={handleInputChange}
                    rows={2}
                    maxLength={150}
                    placeholder="Mô tả ngắn gọn trong 150 ký tự..."
                    className={`w-full px-4 py-3 rounded-xl border-2 dark:bg-gray-700 dark:text-white resize-none focus:ring-4 focus:ring-purple-500/10 transition outline-none ${
                        errors.description ? 'border-red-500' : 'border-gray-100 dark:border-gray-600'
                    }`}
                  />
                  <div className="text-[10px] text-right text-gray-400 font-bold">{newEvent.description.length}/150</div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Mô tả chi tiết</label>
                    <textarea
                      name="detailedDescription"
                      value={newEvent.detailedDescription}
                      onChange={handleInputChange}
                      rows={5}
                      placeholder="Thông tin chi tiết, lịch trình, lưu ý đặc biệt..."
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white resize-none outline-none"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Yêu cầu tham gia</label>
                      <input name="requirements" value={newEvent.requirements} onChange={handleInputChange} placeholder="VD: Sức khỏe ổn định" className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Lợi ích</label>
                      <input name="benefits" value={newEvent.benefits} onChange={handleInputChange} placeholder="VD: Voucher quà tặng" className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white outline-none" />
                    </div>
                </div>
              </div>
            </section>

            {/* 5. Quy định & FAQ */}
            <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
                <div className="flex items-center gap-3 mb-8 border-b border-gray-100 dark:border-gray-700 pb-4">
                  <MdOutlineGavel className="text-red-500 text-xl" />
                  <h2 className="text-xl font-bold dark:text-white">5. Quy định & FAQ</h2>
                </div>

                <div className="space-y-10">
                  {/* Rules */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <label className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2 uppercase text-xs tracking-widest">
                        Quy định sự kiện
                      </label>
                      <button type="button" onClick={() => addArrayItem('rules')} className="text-xs font-bold text-green-600 hover:text-green-700 flex items-center gap-1">
                        <FaPlus /> THÊM QUY ĐỊNH
                      </button>
                    </div>
                    <div className="space-y-3">
                      {newEvent.rules.map((rule, i) => (
                        <div key={i} className="flex gap-2">
                          <input
                            value={rule}
                            onChange={(e) => handleArrayChange(i, e.target.value, 'rules')}
                            placeholder={`Quy định #${i + 1}`}
                            className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-100 dark:border-gray-600 rounded-xl outline-none focus:border-green-500"
                          />
                          <button type="button" onClick={() => removeArrayItem(i, 'rules')} className="p-2 text-gray-300 hover:text-red-500 transition"><FaTrash size={14} /></button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rewards */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <label className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2 uppercase text-xs tracking-widest">
                        <FaTrophy className="text-yellow-500" /> Phần thưởng
                      </label>
                      <button type="button" onClick={() => addArrayItem('rewards')} className="text-xs font-bold text-yellow-600 hover:text-yellow-700 flex items-center gap-1">
                        <FaPlus /> THÊM PHẦN THƯỞNG
                      </button>
                    </div>
                    <div className="space-y-3">
                      {newEvent.rewards.map((reward, i) => (
                        <div key={i} className="flex gap-2">
                          <input
                            value={reward}
                            onChange={(e) => handleArrayChange(i, e.target.value, 'rewards')}
                            placeholder={`Phần thưởng #${i + 1}`}
                            className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-100 dark:border-gray-600 rounded-xl outline-none focus:border-yellow-500"
                          />
                          <button type="button" onClick={() => removeArrayItem(i, 'rewards')} className="p-2 text-gray-300 hover:text-red-500 transition"><FaTrash size={14} /></button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* FAQ */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <label className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2 uppercase text-xs tracking-widest">
                        Câu hỏi thường gặp
                      </label>
                      <button type="button" onClick={addFaq} className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                        <FaPlus /> THÊM FAQ
                      </button>
                    </div>
                    <div className="space-y-4">
                      {newEvent.faqs.map((faq, i) => (
                        <div key={i} className="group relative p-5 bg-gray-50 dark:bg-gray-700 rounded-2xl border border-gray-100 dark:border-gray-600 space-y-3">
                          <button type="button" onClick={() => removeFaq(i)} className="absolute top-4 right-4 p-1 text-gray-300 hover:text-red-500 transition"><FaTrash size={12} /></button>
                          <input
                            value={faq.question}
                            onChange={(e) => handleFaqChange(i, 'question', e.target.value)}
                            placeholder="Nhập câu hỏi..."
                            className="w-full px-0 bg-transparent font-bold dark:text-white border-b border-gray-200 dark:border-gray-500 focus:border-blue-500 outline-none pb-2 transition"
                          />
                          <textarea
                            value={faq.answer}
                            onChange={(e) => handleFaqChange(i, 'answer', e.target.value)}
                            placeholder="Nhập câu trả lời..."
                            rows={2}
                            className="w-full px-0 bg-transparent dark:text-gray-300 border-none outline-none resize-none pt-1"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
            </section>

            {/* Sticky Submit Bar - Mobile Only */}
            <div className="lg:hidden sticky bottom-4 z-50">
                <button
                   type="submit"
                   disabled={createMutation.isPending}
                   className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white font-black py-4 rounded-2xl shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition"
                >
                    {createMutation.isPending ? 'ĐANG TẠO...' : '✨ TẠO SỰ KIỆN NGAY'}
                </button>
            </div>
          </div>

          {/* Preview Sidebar - Right Side */}
          <div className="lg:col-span-4 lg:sticky lg:top-8 h-fit space-y-6 pb-20 lg:pb-0">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-black text-gray-800 dark:text-white flex items-center gap-2">
                    <FaStar className="text-yellow-400" /> BẢN XEM TRƯỚC
                </h3>
                <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-400 shadow-sm" />
                    <div className="w-2 h-2 rounded-full bg-yellow-400 shadow-sm" />
                    <div className="w-2 h-2 rounded-full bg-green-400 shadow-sm" />
                </div>
              </div>

              {/* Event Card Preview */}
              <div className="group rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-2xl transition hover:shadow-green-500/10 mb-8">
                <div className="relative h-48 bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                  {newEvent.image ? (
                    <img src={newEvent.image} alt="Preview" className="w-full h-full object-cover transition duration-700 group-hover:scale-110" />
                  ) : (
                    <FaImage className="text-gray-300 text-6xl opacity-20" />
                  )}
                  <div className="absolute top-4 left-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur px-3 py-1.5 rounded-xl text-[10px] font-black text-green-600 shadow-xl tracking-tighter">
                    {newEvent.category.toUpperCase()}
                  </div>
                  <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur px-3 py-1.5 rounded-xl text-[10px] font-black text-white shadow-xl tracking-tighter">
                    {newEvent.difficulty.toUpperCase()}
                  </div>
                </div>
                <div className="p-6 bg-white dark:bg-gray-800">
                  <h4 className="font-black text-gray-800 dark:text-white text-lg leading-tight mb-4 min-h-[3.5rem] line-clamp-2">
                    {newEvent.name || 'Tên Sự Kiện Của Bạn'}
                  </h4>
                  <div className="grid grid-cols-2 gap-y-3 mb-6">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400">
                      <FaCalendarAlt className="text-green-500" /> 
                      {newEvent.startDate ? moment(newEvent.startDate).format('DD/MM/YYYY') : '--/--/----'}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400">
                      <FaUsers className="text-blue-500" /> 
                      {newEvent.maxParticipants} NGƯỜI
                    </div>
                    <div className="col-span-2 flex items-center gap-2 text-[11px] font-bold text-green-600">
                      <FaBullseye /> 
                      MỤC TIÊU: {newEvent.targetValue || 0} {newEvent.targetUnit.toUpperCase()}
                    </div>
                  </div>
                  <div className="w-full py-4 bg-green-500 text-white text-xs font-black text-center rounded-2xl shadow-lg shadow-green-500/20 opacity-80 decoration-white">
                    XEM CHI TIẾT
                  </div>
                </div>
              </div>

              {/* Summary Checklist */}
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50">
                    <div className="p-2 bg-white dark:bg-gray-800 rounded-lg text-green-500 shadow-sm"><FaCheckCircle /></div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Kiểu sự kiện</p>
                        <p className="text-sm font-black dark:text-white">{newEvent.eventType === 'offline' ? 'TRỰC TIẾP' : 'TRỰC TUYẾN'}</p>
                    </div>
                </div>
                {newEvent.location && (
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50">
                      <div className="p-2 bg-white dark:bg-gray-800 rounded-lg text-blue-500 shadow-sm"><FaMapMarkerAlt /></div>
                      <div className="overflow-hidden">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Điểm hẹn</p>
                        <p className="text-sm font-black dark:text-white truncate">{newEvent.location}</p>
                      </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={createMutation.isPending}
                className="hidden lg:flex w-full bg-gradient-to-r from-green-600 to-teal-600 text-white font-black py-4 rounded-2xl shadow-2xl hover:shadow-green-500/30 items-center justify-center gap-4 transition active:scale-95 disabled:opacity-50"
              >
                {createMutation.isPending ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <>✨ TẠO SỰ KIỆN</>
                )}
              </button>
              
              <div className="mt-6 flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-2xl">
                <FaInfoCircle className="text-yellow-600 shrink-0" />
                <p className="text-[11px] text-yellow-800 dark:text-yellow-400 font-bold leading-relaxed">
                    Đảm bảo tất cả thông tin là chính xác trước khi đăng công khai.
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
