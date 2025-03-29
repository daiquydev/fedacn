import { useState, useRef } from 'react'
import { FaTimes, FaUpload, FaUtensils, FaCalendarAlt, FaTag, FaPlus, FaTrash, FaArrowLeft, FaArrowRight, FaGripLines } from 'react-icons/fa'
import { IoMdTime } from 'react-icons/io'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

export default function CreateMealPlanModal({ onClose }) {
  const fileInputRef = useRef(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Giảm cân',
    image: null,
  })
  const [mealDays, setMealDays] = useState([
    {
      id: '1',
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

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
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

  // Thêm hàm thêm ngày mới
  const handleAddDay = () => {
    const newDay = {
      id: `day-${Date.now()}`, // tạo id duy nhất
      day: mealDays.length + 1,
      meals: [
        { type: 'Sáng', content: '', calories: '', protein: '', carbs: '', fat: '' },
        { type: 'Trưa', content: '', calories: '', protein: '', carbs: '', fat: '' },
        { type: 'Tối', content: '', calories: '', protein: '', carbs: '', fat: '' },
      ]
    }
    setMealDays(prev => [...prev, newDay])
    setActiveDay(newDay.day)
  }

  // Thêm hàm xóa ngày
  const handleRemoveDay = (dayIndex) => {
    if (mealDays.length <= 1) return // Giữ ít nhất 1 ngày
    
    const updatedMealDays = [...mealDays]
    updatedMealDays.splice(dayIndex, 1)
    
    // Cập nhật lại số thứ tự ngày
    const reindexedDays = updatedMealDays.map((day, index) => ({
      ...day,
      day: index + 1
    }))
    
    setMealDays(reindexedDays)
    
    // Điều chỉnh active day nếu cần
    if (activeDay > reindexedDays.length) {
      setActiveDay(reindexedDays.length)
    }
  }

  // Thêm hàm di chuyển ngày sang trái
  const handleMoveLeft = (dayIndex) => {
    if (dayIndex === 0) return // Không thể di chuyển sang trái ngày đầu tiên
    
    const updatedMealDays = [...mealDays]
    const dayToMove = updatedMealDays[dayIndex]
    updatedMealDays.splice(dayIndex, 1) // Xóa ngày tại vị trí hiện tại
    updatedMealDays.splice(dayIndex - 1, 0, dayToMove) // Chèn vào vị trí mới
    
    // Cập nhật lại số thứ tự ngày
    const reindexedDays = updatedMealDays.map((day, index) => ({
      ...day,
      day: index + 1
    }))
    
    setMealDays(reindexedDays)
    setActiveDay(dayIndex) // Cập nhật active day theo vị trí mới
  }

  // Thêm hàm di chuyển ngày sang phải
  const handleMoveRight = (dayIndex) => {
    if (dayIndex === mealDays.length - 1) return // Không thể di chuyển sang phải ngày cuối cùng
    
    const updatedMealDays = [...mealDays]
    const dayToMove = updatedMealDays[dayIndex]
    updatedMealDays.splice(dayIndex, 1) // Xóa ngày tại vị trí hiện tại
    updatedMealDays.splice(dayIndex + 1, 0, dayToMove) // Chèn vào vị trí mới
    
    // Cập nhật lại số thứ tự ngày
    const reindexedDays = updatedMealDays.map((day, index) => ({
      ...day,
      day: index + 1
    }))
    
    setMealDays(reindexedDays)
    setActiveDay(dayIndex + 2) // Cập nhật active day theo vị trí mới
  }

  // Bắt đầu drag
  const [draggedDayIndex, setDraggedDayIndex] = useState(null)
  
  const handleDragStart = (dayIndex) => {
    setDraggedDayIndex(dayIndex)
  }
  
  const handleDragOver = (e, targetDayIndex) => {
    e.preventDefault()
    if (draggedDayIndex === null || draggedDayIndex === targetDayIndex) return
    
    // Hiển thị visual feedback ở đây nếu cần
  }
  
  const handleDrop = (e, targetDayIndex) => {
    e.preventDefault()
    if (draggedDayIndex === null || draggedDayIndex === targetDayIndex) return
    
    const updatedMealDays = [...mealDays]
    const dayToMove = { ...updatedMealDays[draggedDayIndex] }
    
    updatedMealDays.splice(draggedDayIndex, 1)
    updatedMealDays.splice(targetDayIndex, 0, dayToMove)
    
    // Cập nhật lại số thứ tự ngày
    const reindexedDays = updatedMealDays.map((day, index) => ({
      ...day,
      day: index + 1
    }))
    
    setMealDays(reindexedDays)
    setActiveDay(targetDayIndex + 1)
    setDraggedDayIndex(null)
  }
  
  const handleDragEnd = () => {
    setDraggedDayIndex(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Here you would typically send the data to your backend
    // For now, we'll just log it and close the modal
    console.log({ ...formData, mealDays, notes })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-60 flex justify-center items-start pt-10 pb-20">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-auto border dark:border-gray-700">
        {/* Header với gradient */}
        <div className="bg-gradient-to-r from-green-600 to-green-500 text-white p-5 rounded-t-xl flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center">
            <FaUtensils className="mr-3 text-white/90" /> Tạo Thực Đơn Mới
          </h2>
          <button 
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors p-1 hover:bg-white/10 rounded-full"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left column - Basic info */}
            <div className="md:col-span-1 space-y-5">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  Ảnh đại diện
                </label>
                <div 
                  onClick={() => fileInputRef.current.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-750
                    ${imagePreview ? 'border-green-300 bg-green-50 dark:bg-green-900/20' : 'border-gray-300 dark:border-gray-600'}`}
                >
                  {imagePreview ? (
                    <div className="relative">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="mx-auto max-h-44 rounded-lg shadow-sm object-cover"
                      />
                      <button
                        type="button"
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-md hover:bg-red-600 transition-colors"
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
                      <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
                        <FaUpload className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Click để tải ảnh lên
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Định dạng JPG, PNG hoặc WEBP
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
              
              <div className="space-y-4">
                <div>
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                    <FaUtensils className="inline mr-2 text-green-600 dark:text-green-500" /> Tên thực đơn
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="Ví dụ: Thực đơn giảm cân 7 ngày"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm"
                />
              </div>
              
                <div>
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
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm"
                />
              </div>
              
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                    <FaTag className="inline mr-2 text-green-600 dark:text-green-500" /> Phân loại
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm appearance-none bg-no-repeat"
                    style={{backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundPosition: "right 0.75rem center", backgroundSize: "1.5em 1.5em"}}
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                </div>
                
                <div>
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  Ghi chú chung
                </label>
                <div className="border dark:border-gray-600 rounded-lg overflow-hidden">
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
                  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  theme="snow"
                />
                </div>
              </div>
            </div>
            
            {/* Right column - Meal planning */}
            <div className="md:col-span-2 bg-gray-50 dark:bg-gray-750 rounded-xl p-5">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
                    <IoMdTime className="mr-2 text-green-600 dark:text-green-500" /> Lập thực đơn theo ngày
                  </h3>
                </div>
                
                {/* Day tabs - Cải tiến giao diện */}
                <div className="mb-4 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Danh sách ngày:</div>
                  <div className="flex flex-nowrap items-center space-x-2 max-w-full overflow-x-auto py-1 px-0.5 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                  {mealDays.map((day, index) => (
                      <div 
                        key={day.id || index}
                        className={`flex items-center rounded-lg transition-all duration-200 ${
                          activeDay === day.day 
                            ? 'bg-green-600 text-white shadow-md' 
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-650'
                        } ${draggedDayIndex === index ? 'opacity-50 scale-95' : ''}`}
                        draggable="true"
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={(e) => handleDrop(e, index)}
                        onDragEnd={handleDragEnd}
                      >
                        <div className="flex items-center px-1.5 cursor-grab group">
                          <FaGripLines className="w-3 h-3 text-current opacity-70 group-hover:opacity-100" />
                        </div>
                    <button
                      type="button"
                          className="px-3 py-2 text-sm font-medium"
                      onClick={() => setActiveDay(day.day)}
                    >
                      Ngày {day.day}
                    </button>
                        <div className="flex items-center space-x-1 pr-1.5">
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => handleMoveLeft(index)}
                              className="p-1 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors"
                              title="Di chuyển sang trái"
                            >
                              <FaArrowLeft className="w-2.5 h-2.5" />
                            </button>
                          )}
                          {index < mealDays.length - 1 && (
                            <button
                              type="button"
                              onClick={() => handleMoveRight(index)}
                              className="p-1 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors"
                              title="Di chuyển sang phải"
                            >
                              <FaArrowRight className="w-2.5 h-2.5" />
                            </button>
                          )}
                          {mealDays.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveDay(index)}
                              className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors"
                              title="Xóa ngày"
                            >
                              <FaTrash className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {/* Nút thêm ngày */}
                    <button
                      type="button"
                      onClick={handleAddDay}
                      className="flex items-center px-4 py-2 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-green-500 dark:hover:border-green-500 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-500 transition-colors"
                      title="Thêm ngày mới"
                    >
                      <FaPlus className="w-4 h-4" />
                      <span className="ml-1 font-medium">Thêm ngày</span>
                    </button>
                  </div>
                  
                  {/* Thông tin hướng dẫn */}
                  <div className="flex items-center mt-3 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-750 p-2 rounded-lg">
                    <svg className="w-4 h-4 mr-1 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                    </svg>
                    <p>Kéo để thay đổi thứ tự ngày, hoặc sử dụng nút mũi tên. Thêm ngày mới bằng nút +</p>
                  </div>
                </div>
                
                {/* Active day meal plan */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                  {mealDays.map((day, dayIndex) => {
                    if (day.day !== activeDay) return null;
                    
                    return (
                      <div key={dayIndex}>
                        <h4 className="text-lg font-medium text-gray-800 dark:text-white mb-4 border-b pb-2 dark:border-gray-700">
                          Chi tiết Ngày {day.day}
                        </h4>
                        
                        {day.meals.map((meal, mealIndex) => (
                          <div key={mealIndex} className="mb-6 bg-gray-50 dark:bg-gray-750 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-all hover:shadow-md">
                            <div className="flex justify-between items-center mb-3">
                              <div className="flex items-center">
                                <input
                                  type="text"
                                  value={meal.type}
                                  onChange={(e) => handleMealChange(dayIndex, mealIndex, 'type', e.target.value)}
                                  className="font-medium text-green-600 dark:text-green-400 border-none py-1 px-2 rounded focus:ring-2 focus:ring-green-500 bg-transparent text-lg"
                                  placeholder="Loại bữa ăn"
                                />
                              </div>
                              
                              {day.meals.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMeal(dayIndex, mealIndex)}
                                  className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                >
                                  <FaTimes className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            
                            <div className="mb-4">
                              <textarea
                                placeholder="Mô tả chi tiết bữa ăn này (ví dụ: 1 bát phở gà, 1 quả cam, 1 ly nước chanh...)"
                                value={meal.content}
                                onChange={(e) => handleMealChange(dayIndex, mealIndex, 'content', e.target.value)}
                                rows="3"
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                              />
                            </div>
                            
                            <div className="grid grid-cols-4 gap-3">
                              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">Calo</label>
                                <input
                                  type="text"
                                  placeholder="Kcal"
                                  value={meal.calories}
                                  onChange={(e) => handleMealChange(dayIndex, mealIndex, 'calories', e.target.value)}
                                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                />
                              </div>
                              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">Protein</label>
                                <input
                                  type="text"
                                  placeholder="g"
                                  value={meal.protein}
                                  onChange={(e) => handleMealChange(dayIndex, mealIndex, 'protein', e.target.value)}
                                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                />
                              </div>
                              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">Carbs</label>
                                <input
                                  type="text"
                                  placeholder="g"
                                  value={meal.carbs}
                                  onChange={(e) => handleMealChange(dayIndex, mealIndex, 'carbs', e.target.value)}
                                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                />
                              </div>
                              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">Chất béo</label>
                                <input
                                  type="text"
                                  placeholder="g"
                                  value={meal.fat}
                                  onChange={(e) => handleMealChange(dayIndex, mealIndex, 'fat', e.target.value)}
                                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        <button
                          type="button"
                          onClick={() => handleAddMeal(dayIndex)}
                          className="w-full py-3 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-500 hover:border-green-500 dark:hover:border-green-500 transition-colors"
                        >
                          <FaPlus className="mr-2" /> Thêm bữa ăn
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          
          {/* Form actions */}
          <div className="mt-8 flex justify-end space-x-3 border-t dark:border-gray-700 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 font-medium border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 font-medium bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white rounded-lg shadow transition-colors"
            >
              Lưu Thực Đơn
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 