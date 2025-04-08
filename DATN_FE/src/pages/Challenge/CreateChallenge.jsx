import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaUpload, FaTimes, FaTrophy, FaRunning, FaCalendarAlt, FaUserFriends } from 'react-icons/fa'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

export default function CreateChallenge() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'running',
    type: 'public', // public, group, private
    startDate: '',
    endDate: '',
    targetValue: '',
    targetUnit: 'km',
    maxParticipants: '',
    rules: [''],
    rewards: [''],
    image: null
  })
  const [imagePreview, setImagePreview] = useState(null)

  const categories = [
    { id: 'running', name: 'Chạy bộ' },
    { id: 'cycling', name: 'Đạp xe' },
    { id: 'gym', name: 'Tập gym' },
    { id: 'yoga', name: 'Yoga' },
    { id: 'swimming', name: 'Bơi lội' }
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
      
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRuleChange = (index, value) => {
    const newRules = [...formData.rules]
    newRules[index] = value
    setFormData(prev => ({
      ...prev,
      rules: newRules
    }))
  }

  const handleAddRule = () => {
    setFormData(prev => ({
      ...prev,
      rules: [...prev.rules, '']
    }))
  }

  const handleRemoveRule = (index) => {
    setFormData(prev => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index)
    }))
  }

  const handleRewardChange = (index, value) => {
    const newRewards = [...formData.rewards]
    newRewards[index] = value
    setFormData(prev => ({
      ...prev,
      rewards: newRewards
    }))
  }

  const handleAddReward = () => {
    setFormData(prev => ({
      ...prev,
      rewards: [...prev.rewards, '']
    }))
  }

  const handleRemoveReward = (index) => {
    setFormData(prev => ({
      ...prev,
      rewards: prev.rewards.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    // Implement form submission
    console.log(formData)
    navigate('/challenge')
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-green-500 p-6">
          <h1 className="text-2xl font-bold text-white flex items-center">
            <FaTrophy className="mr-3" /> Tạo thử thách mới
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ảnh bìa thử thách
            </label>
            <div 
              onClick={() => fileInputRef.current.click()}
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all duration-200
                ${imagePreview ? 'border-green-300 dark:border-green-500' : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              {imagePreview ? (
                <div className="relative">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="mx-auto max-h-48 rounded"
                  />
                  <button
                    type="button"
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    onClick={(e) => {
                      e.stopPropagation()
                      setImagePreview(null)
                      setFormData(prev => ({ ...prev, image: null }))
                    }}
                  >
                    <FaTimes className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div>
                  <FaUpload className="mx-auto h-12 w-12 text-gray-400" />
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

          {/* Basic Info */}
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tên thử thách
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-green-500 dark:focus:border-green-400 focus:outline-none"
                placeholder="VD: Thử thách chạy bộ 30 ngày"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mô tả thử thách
              </label>
              <div className="quill-wrapper dark:text-white">
                <ReactQuill
                  value={formData.description}
                  onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                  className="bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600"
                  placeholder="Mô tả chi tiết về thử thách..."
                  theme="snow"
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      ['link', 'image'],
                      ['clean']
                    ],
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Loại thử thách
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-green-500 dark:focus:border-green-400 focus:outline-none appearance-none"
                  style={{
                    backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")",
                    backgroundPosition: "right 0.5rem center",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "1.5em 1.5em",
                    paddingRight: "2.5rem"
                  }}
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phạm vi
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-green-500 dark:focus:border-green-400 focus:outline-none appearance-none"
                  style={{
                    backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")",
                    backgroundPosition: "right 0.5rem center",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "1.5em 1.5em",
                    paddingRight: "2.5rem"
                  }}
                >
                  <option value="public">Công khai</option>
                  <option value="group">Nhóm</option>
                  <option value="private">Riêng tư</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ngày bắt đầu
                </label>
                <input
                  type="datetime-local"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-green-500 dark:focus:border-green-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ngày kết thúc
                </label>
                <input
                  type="datetime-local"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-green-500 dark:focus:border-green-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mục tiêu
                </label>
                <input
                  type="number"
                  name="targetValue"
                  value={formData.targetValue}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-green-500 dark:focus:border-green-400 focus:outline-none"
                  placeholder="VD: 100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Đơn vị
                </label>
                <select
                  name="targetUnit"
                  value={formData.targetUnit}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-green-500 dark:focus:border-green-400 focus:outline-none appearance-none"
                  style={{
                    backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")",
                    backgroundPosition: "right 0.5rem center",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "1.5em 1.5em",
                    paddingRight: "2.5rem"
                  }}
                >
                  <option value="km">Kilomet (km)</option>
                  <option value="steps">Bước chân</option>
                  <option value="minutes">Phút</option>
                  <option value="calories">Calories</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Số người tối đa
                </label>
                <input
                  type="number"
                  name="maxParticipants"
                  value={formData.maxParticipants}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-green-500 dark:focus:border-green-400 focus:outline-none"
                  placeholder="VD: 100"
                />
              </div>
            </div>
          </div>

          {/* Rules */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Luật chơi
            </label>
            <div className="space-y-2">
              {formData.rules.map((rule, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={rule}
                    onChange={(e) => handleRuleChange(index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-green-500 dark:focus:border-green-400 focus:outline-none"
                    placeholder="Thêm luật chơi..."
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveRule(index)}
                    className="p-2 text-red-500 hover:text-red-600"
                  >
                    <FaTimes />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddRule}
                className="mt-2 text-green-600 hover:text-green-700 text-sm font-medium"
              >
                + Thêm luật
              </button>
            </div>
          </div>

          {/* Rewards */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phần thưởng
            </label>
            <div className="space-y-2">
              {formData.rewards.map((reward, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={reward}
                    onChange={(e) => handleRewardChange(index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-green-500 dark:focus:border-green-400 focus:outline-none"
                    placeholder="Thêm phần thưởng..."
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveReward(index)}
                    className="p-2 text-red-500 hover:text-red-600"
                  >
                    <FaTimes />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddReward}
                className="mt-2 text-green-600 hover:text-green-700 text-sm font-medium"
              >
                + Thêm phần thưởng
              </button>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t dark:border-gray-700">
            <button
              type="button"
              onClick={() => navigate('/challenge')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Tạo thử thách
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 