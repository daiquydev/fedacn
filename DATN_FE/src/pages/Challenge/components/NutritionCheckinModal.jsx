import React, { useState, useRef } from 'react'
import { FaTimes, FaCamera, FaUpload, FaUtensils } from 'react-icons/fa'
import { toast } from 'react-hot-toast'

const MEAL_TYPES = [
  { key: 'breakfast', label: 'Bữa sáng', emoji: '🌅' },
  { key: 'lunch', label: 'Bữa trưa', emoji: '☀️' },
  { key: 'dinner', label: 'Bữa tối', emoji: '🌙' },
  { key: 'snack', label: 'Bữa phụ', emoji: '🍎' }
]

export default function NutritionCheckinModal({ challenge, onClose, onSubmit, isLoading }) {
  const [mealType, setMealType] = useState('lunch')
  const [notes, setNotes] = useState('')
  const [calories, setCalories] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [proofImage, setProofImage] = useState('')
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ảnh tối đa 5MB')
        return
      }
      const reader = new FileReader()
      reader.onload = () => setPreviewUrl(reader.result)
      reader.readAsDataURL(file)
      // For now, just store filename as proof
      setProofImage(file.name)
    }
  }

  const handleSubmit = () => {
    const data = {
      value: 1, // 1 meal = 1 unit check-in
      notes: `${MEAL_TYPES.find(m => m.key === mealType)?.label || 'Bữa ăn'}${notes ? ': ' + notes : ''}`,
      proof_image: proofImage || previewUrl,
      calories: calories ? Number(calories) : undefined,
      source: 'photo_checkin'
    }
    onSubmit(data)
  }

  const selectedMeal = MEAL_TYPES.find(m => m.key === mealType)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4 flex items-center justify-between">
          <h3 className="font-bold text-white text-lg flex items-center gap-2">
            <FaUtensils /> Ghi nhận bữa ăn
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 text-white transition"><FaTimes /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Meal type selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Loại bữa ăn</label>
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

          {/* Photo upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FaCamera className="inline mr-1" /> Ảnh bữa ăn
            </label>
            {previewUrl ? (
              <div className="relative">
                <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover rounded-xl" />
                <button
                  onClick={() => { setPreviewUrl(''); setProofImage('') }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition"
                >
                  <FaTimes size={12} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-36 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition cursor-pointer"
              >
                <FaUpload className="text-2xl text-gray-400" />
                <span className="text-xs text-gray-500">Nhấn để chọn ảnh hoặc kéo thả</span>
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
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

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">📝 Ghi chú</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Mô tả bữa ăn..."
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-emerald-400 outline-none transition text-sm resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-300 font-medium hover:bg-gray-50 transition text-sm">Hủy</button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>✅ Check-in {selectedMeal?.label}</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
