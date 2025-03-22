import { useState, useRef } from 'react'
import { FaTimes, FaUpload, FaUtensils, FaCalendarAlt, FaTag } from 'react-icons/fa'
import { IoMdTime } from 'react-icons/io'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

export default function CreateMealPlanModal({ onClose }) {
  const fileInputRef = useRef(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Giảm cân',
    duration: 7,
    image: null,
  })
  const [mealDays, setMealDays] = useState([
    {
      day: 1,
      meals: [
        { 
          type: 'Sáng', 
          content: '', 
          calories: '', 
          protein: '', 
          carbs: '', 
          fat: '' 
        },
        { 
          type: 'Trưa', 
          content: '', 
          calories: '', 
          protein: '', 
          carbs: '', 
          fat: '' 
        },
        { 
          type: 'Tối', 
          content: '', 
          calories: '', 
          protein: '', 
          carbs: '', 
          fat: '' 
        },
      ]
    }
  ])
  const [activeDay, setActiveDay] = useState(1)
  const [imagePreview, setImagePreview] = useState(null)
  const [notes, setNotes] = useState('')

  const categories = [
    'Giảm cân', 'Tăng cơ', 'Ăn sạch', 'Thuần chay', 
    'Gia đình', 'Keto', 'Dinh dưỡng thể thao'
  ]

  const durations = [3, 5, 7, 10, 14, 21, 28, 30]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleDurationChange = (e) => {
    const newDuration = parseInt(e.target.value, 10)
    setFormData(prev => ({
      ...prev,
      duration: newDuration
    }))
    
    // If we need more days than we currently have, add them
    if (newDuration > mealDays.length) {
      const newDays = []
      for (let i = mealDays.length + 1; i <= newDuration; i++) {
        newDays.push({
          day: i,
          meals: [
            { type: 'Sáng', content: '', calories: '', protein: '', carbs: '', fat: '' },
            { type: 'Trưa', content: '', calories: '', protein: '', carbs: '', fat: '' },
            { type: 'Tối', content: '', calories: '', protein: '', carbs: '', fat: '' },
          ]
        })
      }
      setMealDays(prev => [...prev, ...newDays])
    }
    // If we need fewer days, trim the array
    else if (newDuration < mealDays.length) {
      setMealDays(prev => prev.slice(0, newDuration))
      // If active day is now out of bounds, adjust it
      if (activeDay > newDuration) {
        setActiveDay(newDuration)
      }
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }))
      
      // Create a preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleMealChange = (dayIndex, mealIndex, field, value) => {
    const updatedMealDays = [...mealDays]
    updatedMealDays[dayIndex].meals[mealIndex][field] = value
    setMealDays(updatedMealDays)
  }

  const handleAddMeal = (dayIndex) => {
    const updatedMealDays = [...mealDays]
    updatedMealDays[dayIndex].meals.push({ 
      type: 'Snack', 
      content: '', 
      calories: '', 
      protein: '', 
      carbs: '', 
      fat: '' 
    })
    setMealDays(updatedMealDays)
  }

  const handleRemoveMeal = (dayIndex, mealIndex) => {
    if (mealDays[dayIndex].meals.length <= 1) return // Keep at least one meal
    
    const updatedMealDays = [...mealDays]
    updatedMealDays[dayIndex].meals.splice(mealIndex, 1)
    setMealDays(updatedMealDays)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Here you would typically send the data to your backend
    // For now, we'll just log it and close the modal
    console.log({ ...formData, mealDays, notes })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex justify-center items-start pt-10 pb-20">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[85vh] overflow-auto">
        {/* Header */}
        <div className="bg-green-600 text-white p-4 rounded-t-xl flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center">
            <FaUtensils className="mr-2" /> Tạo Thực Đơn Mới
          </h2>
          <button 
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left column - Basic info */}
            <div className="md:col-span-1">
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  Ảnh đại diện
                </label>
                <div 
                  onClick={() => fileInputRef.current.click()}
                  className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer
                    ${imagePreview ? 'border-green-300' : 'border-gray-300 dark:border-gray-600'}`}
                >
                  {imagePreview ? (
                    <div className="relative">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="mx-auto max-h-40 rounded"
                      />
                      <button
                        type="button"
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          setImagePreview(null)
                          setFormData(prev => ({ ...prev, image: null }))
                        }}
                      >
                        <FaTimes className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <FaUpload className="mx-auto h-8 w-8 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Click để tải ảnh lên
                      </p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  <FaUtensils className="inline mr-1" /> Tên thực đơn
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="Ví dụ: Thực đơn giảm cân 7 ngày"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  Mô tả ngắn
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  placeholder="Mô tả ngắn gọn về thực đơn của bạn"
                  rows="3"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                    <FaTag className="inline mr-1" /> Phân loại
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                    <FaCalendarAlt className="inline mr-1" /> Số ngày
                  </label>
                  <select
                    name="duration"
                    value={formData.duration}
                    onChange={handleDurationChange}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {durations.map(days => (
                      <option key={days} value={days}>{days} ngày</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  Ghi chú chung
                </label>
                <ReactQuill 
                  value={notes} 
                  onChange={setNotes}
                  placeholder="Thêm ghi chú, lời khuyên, hoặc hướng dẫn chung cho thực đơn..."
                  modules={{
                    toolbar: [
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      ['link'],
                      ['clean']
                    ]
                  }}
                />
              </div>
            </div>
            
            {/* Right column - Meal planning */}
            <div className="md:col-span-2">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
                    <IoMdTime className="mr-1" /> Lập thực đơn theo ngày
                  </h3>
                </div>
                
                {/* Day tabs */}
                <div className="flex flex-wrap gap-2 mb-4 overflow-x-auto pb-2">
                  {mealDays.map((day, index) => (
                    <button
                      key={day.day}
                      type="button"
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        activeDay === day.day 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                      onClick={() => setActiveDay(day.day)}
                    >
                      Ngày {day.day}
                    </button>
                  ))}
                </div>
                
                {/* Active day meal plan */}
                <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-4">
                  {mealDays.map((day, dayIndex) => {
                    if (day.day !== activeDay) return null;
                    
                    return (
                      <div key={dayIndex}>
                        <h4 className="text-md font-medium text-gray-800 dark:text-white mb-3">
                          Ngày {day.day}
                        </h4>
                        
                        {day.meals.map((meal, mealIndex) => (
                          <div key={mealIndex} className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center">
                                <input
                                  type="text"
                                  value={meal.type}
                                  onChange={(e) => handleMealChange(dayIndex, mealIndex, 'type', e.target.value)}
                                  className="font-medium text-green-600 dark:text-green-400 border-none py-1 px-2 rounded focus:ring-2 focus:ring-green-500 bg-transparent"
                                  placeholder="Loại bữa ăn"
                                />
                              </div>
                              
                              {day.meals.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMeal(dayIndex, mealIndex)}
                                  className="text-red-500 hover:text-red-600"
                                >
                                  <FaTimes />
                                </button>
                              )}
                            </div>
                            
                            <div className="mb-3">
                              <textarea
                                placeholder="Mô tả chi tiết bữa ăn này (ví dụ: 1 bát phở gà, 1 quả cam, 1 ly nước chanh...)"
                                value={meal.content}
                                onChange={(e) => handleMealChange(dayIndex, mealIndex, 'content', e.target.value)}
                                rows="3"
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              />
                            </div>
                            
                            <div className="grid grid-cols-4 gap-2">
                              <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400">Calo</label>
                                <input
                                  type="text"
                                  placeholder="Kcal"
                                  value={meal.calories}
                                  onChange={(e) => handleMealChange(dayIndex, mealIndex, 'calories', e.target.value)}
                                  className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400">Protein</label>
                                <input
                                  type="text"
                                  placeholder="g"
                                  value={meal.protein}
                                  onChange={(e) => handleMealChange(dayIndex, mealIndex, 'protein', e.target.value)}
                                  className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400">Carbs</label>
                                <input
                                  type="text"
                                  placeholder="g"
                                  value={meal.carbs}
                                  onChange={(e) => handleMealChange(dayIndex, mealIndex, 'carbs', e.target.value)}
                                  className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400">Chất béo</label>
                                <input
                                  type="text"
                                  placeholder="g"
                                  value={meal.fat}
                                  onChange={(e) => handleMealChange(dayIndex, mealIndex, 'fat', e.target.value)}
                                  className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        <button
                          type="button"
                          onClick={() => handleAddMeal(dayIndex)}
                          className="w-full py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                        >
                          + Thêm bữa ăn
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          
          {/* Form actions */}
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow transition-colors"
            >
              Lưu Thực Đơn
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 