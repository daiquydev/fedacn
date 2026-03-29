import React, { useState, useRef, useCallback } from 'react'
import { FaTimes, FaCamera, FaUpload, FaUtensils, FaRobot, FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa'
import { toast } from 'react-hot-toast'
import { reviewMealImageAI } from '../../../apis/challengeApi'

const MEAL_TYPES = [
  { key: 'breakfast', label: 'Bữa sáng', emoji: '🌅' },
  { key: 'lunch', label: 'Bữa trưa', emoji: '☀️' },
  { key: 'dinner', label: 'Bữa tối', emoji: '🌙' },
  { key: 'snack', label: 'Bữa phụ', emoji: '🍎' }
]

// AI review status constants
const AI_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  APPROVED: 'approved',
  REJECTED: 'rejected'
}

export default function NutritionCheckinModal({ challenge, onClose, onSubmit, isLoading }) {
  const [mealType, setMealType] = useState('lunch')
  const [foodName, setFoodName] = useState('')
  const [description, setDescription] = useState('')
  const [calories, setCalories] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [imageBase64, setImageBase64] = useState('')
  const [imageMimeType, setImageMimeType] = useState('image/jpeg')

  // AI review state
  const [aiStatus, setAiStatus] = useState(AI_STATUS.IDLE)
  const [aiReason, setAiReason] = useState('')

  const fileInputRef = useRef(null)

  const resetImage = () => {
    setPreviewUrl('')
    setImageBase64('')
    setAiStatus(AI_STATUS.IDLE)
    setAiReason('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const runAiReview = useCallback(async (base64, mimeType) => {
    setAiStatus(AI_STATUS.LOADING)
    setAiReason('')
    try {
      const res = await reviewMealImageAI({
        imageBase64: base64,
        mimeType,
        challengeTitle: challenge?.title || '',
        challengeDescription: challenge?.description || ''
      })
      const { valid, reason } = res.data
      setAiStatus(valid ? AI_STATUS.APPROVED : AI_STATUS.REJECTED)
      setAiReason(reason || '')
    } catch {
      // On error, be lenient — allow check-in
      setAiStatus(AI_STATUS.APPROVED)
      setAiReason('Không thể xác minh ảnh, cho phép ghi nhận.')
    }
  }, [challenge])

  // Compress image to max 512x512, quality 0.7 for AI review (keeps tokens low)
  const compressForAI = (fullBase64, mimeType) => new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const MAX = 512
      let { width, height } = img
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round((height / width) * MAX); width = MAX }
        else { width = Math.round((width / height) * MAX); height = MAX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL(mimeType === 'image/png' ? 'image/png' : 'image/jpeg', 0.7))
    }
    img.onerror = () => resolve(fullBase64) // fallback to original
    img.src = fullBase64
  })

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ảnh tối đa 5MB')
      return
    }

    const mimeType = file.type || 'image/jpeg'
    setImageMimeType(mimeType)

    const reader = new FileReader()
    reader.onload = async () => {
      const fullBase64 = reader.result
      setPreviewUrl(fullBase64)       // preview giữ full size
      setImageBase64(fullBase64)      // lưu full để submit

      // Compress riêng để gửi AI (tối đa 512px)
      const compressed = await compressForAI(fullBase64, mimeType)
      runAiReview(compressed, 'image/jpeg')
    }
    reader.readAsDataURL(file)
  }

  const canCheckin = () => {
    if (!previewUrl) return false // must have image
    if (aiStatus === AI_STATUS.LOADING) return false // wait for AI
    if (aiStatus === AI_STATUS.REJECTED) return false // AI rejected
    return true
  }

  const handleSubmit = () => {
    if (!previewUrl) {
      toast.error('Vui lòng tải ảnh bữa ăn lên')
      return
    }
    if (aiStatus === AI_STATUS.REJECTED) {
      toast.error('Ảnh không hợp lệ với thử thách. Vui lòng chọn ảnh khác.')
      return
    }

    const mealLabel = MEAL_TYPES.find(m => m.key === mealType)?.label || 'Bữa ăn'

    const data = {
      value: 1,
      food_name: foodName.trim(),
      notes: description.trim() || `${mealLabel}${foodName ? ': ' + foodName : ''}`,
      proof_image: imageBase64,
      calories: calories ? Number(calories) : undefined,
      source: 'photo_checkin',
      ai_review_valid: aiStatus === AI_STATUS.APPROVED,
      ai_review_reason: aiReason
    }
    onSubmit(data)
  }

  const selectedMeal = MEAL_TYPES.find(m => m.key === mealType)

  // -------- Render AI Badge --------
  const renderAiBadge = () => {
    if (aiStatus === AI_STATUS.IDLE) return null

    if (aiStatus === AI_STATUS.LOADING) {
      return (
        <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <FaRobot className="text-blue-500 shrink-0 animate-pulse" size={14} />
          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
            🔍 AI đang phân tích ảnh...
          </span>
          <FaSpinner className="text-blue-400 animate-spin ml-auto" size={12} />
        </div>
      )
    }

    if (aiStatus === AI_STATUS.APPROVED) {
      return (
        <div className="mt-2 flex items-start gap-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
          <FaCheckCircle className="text-emerald-500 shrink-0 mt-0.5" size={14} />
          <div>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">✅ Ảnh hợp lệ</span>
            {aiReason && (
              <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">{aiReason}</p>
            )}
          </div>
        </div>
      )
    }

    if (aiStatus === AI_STATUS.REJECTED) {
      return (
        <div className="mt-2 flex items-start gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <FaTimesCircle className="text-red-500 shrink-0 mt-0.5" size={14} />
          <div className="flex-1">
            <span className="text-xs font-semibold text-red-700 dark:text-red-400">❌ Ảnh không phù hợp</span>
            {aiReason && (
              <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">{aiReason}</p>
            )}
            <button
              onClick={resetImage}
              className="mt-1.5 text-xs text-red-600 dark:text-red-400 underline hover:no-underline font-medium"
            >
              Chọn ảnh khác
            </button>
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4 flex items-center justify-between">
          <h3 className="font-bold text-white text-lg flex items-center gap-2">
            <FaUtensils /> Ghi nhận bữa ăn
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition"
          >
            <FaTimes />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Meal type selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Loại bữa ăn
            </label>
            <div className="grid grid-cols-4 gap-2">
              {MEAL_TYPES.map(meal => (
                <button
                  key={meal.key}
                  onClick={() => setMealType(meal.key)}
                  className={`p-2.5 rounded-xl text-center transition-all ${
                    mealType === meal.key
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-500 shadow-sm'
                      : 'bg-gray-50 dark:bg-gray-700 border-2 border-transparent hover:border-gray-200'
                  }`}
                >
                  <span className="text-xl block mb-0.5">{meal.emoji}</span>
                  <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400">{meal.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Food name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              🍽️ Tên món ăn
            </label>
            <input
              type="text"
              value={foodName}
              onChange={e => setFoodName(e.target.value)}
              placeholder="Ví dụ: Cơm gà, Salad rau củ..."
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-emerald-400 outline-none transition text-sm"
            />
          </div>

          {/* Photo upload + AI Review */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FaCamera className="inline mr-1" /> Ảnh bữa ăn
              <span className="ml-1 text-xs text-red-500 font-normal">* Bắt buộc để Check-in</span>
            </label>

            {previewUrl ? (
              <>
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className={`w-full h-48 object-cover rounded-xl transition-all ${
                      aiStatus === AI_STATUS.REJECTED ? 'opacity-60 ring-2 ring-red-400' :
                      aiStatus === AI_STATUS.APPROVED ? 'ring-2 ring-emerald-400' : ''
                    }`}
                  />
                  {/* Loading overlay */}
                  {aiStatus === AI_STATUS.LOADING && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 rounded-xl gap-2">
                      <FaRobot className="text-white text-2xl animate-pulse" />
                      <span className="text-white text-xs font-medium">AI đang phân tích...</span>
                    </div>
                  )}
                  <button
                    onClick={resetImage}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition"
                    disabled={aiStatus === AI_STATUS.LOADING}
                  >
                    <FaTimes size={12} />
                  </button>
                </div>
                {/* AI Review Badge */}
                {renderAiBadge()}
              </>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-36 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition cursor-pointer"
              >
                <FaUpload className="text-2xl text-gray-400" />
                <span className="text-xs text-gray-500">Nhấn để chọn ảnh hoặc kéo thả</span>
                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                  <FaRobot size={10} /> AI sẽ tự động xác minh ảnh
                </span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Calories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              🔥 Kcal ước tính (tùy chọn)
            </label>
            <input
              type="number"
              value={calories}
              onChange={e => setCalories(e.target.value)}
              placeholder="Ví dụ: 500"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-emerald-400 outline-none transition text-sm"
            />
          </div>

          {/* Description (renamed from Ghi chú) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              📝 Mô tả
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              placeholder="Mô tả bữa ăn của bạn..."
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-emerald-400 outline-none transition text-sm resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-300 font-medium hover:bg-gray-50 transition text-sm"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading || !canCheckin()}
              title={
                !previewUrl ? 'Vui lòng tải ảnh lên' :
                aiStatus === AI_STATUS.LOADING ? 'Đang xác minh ảnh...' :
                aiStatus === AI_STATUS.REJECTED ? 'Ảnh không hợp lệ, chọn ảnh khác' : ''
              }
              className={`flex-1 py-3 rounded-xl text-white font-bold text-sm transition flex items-center justify-center gap-2 ${
                canCheckin() && !isLoading
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-lg'
                  : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : aiStatus === AI_STATUS.LOADING ? (
                <>
                  <FaSpinner className="animate-spin" size={14} />
                  Đang xác minh...
                </>
              ) : (
                <>✅ Check-in {selectedMeal?.label}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
