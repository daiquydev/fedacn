import { roundKcal } from '../../../utils/mathUtils'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FaTimes, FaRunning, FaMapMarkerAlt, FaLocationArrow, FaFire } from 'react-icons/fa'
import sportCategoryApi from '../../../apis/sportCategoryApi'

export default function OutdoorCheckinModal({ challenge, onClose, onSubmit, isLoading }) {
  const navigate = useNavigate()
  const [mode, setMode] = useState('choose') // 'choose' | 'manual'
  const [activityType, setActivityType] = useState(challenge?.category || '')
  const [distance, setDistance] = useState('')
  const [durationMin, setDurationMin] = useState('')
  const [calories, setCalories] = useState('')
  const [notes, setNotes] = useState('')

  // Fetch categories from DB
  const { data: categoriesData } = useQuery({
    queryKey: ['sportCategories'],
    queryFn: () => sportCategoryApi.getAll(),
    staleTime: 1000
  })
  const allCategories = categoriesData?.data?.result || []
  const outdoorCategories = allCategories.filter(c => c.type === 'Ngoài trời')

  // Use challenge.kcal_per_unit if available, else find from categories
  const selectedCat = outdoorCategories.find(c => c.name === activityType)
  const kcalPerKm = challenge?.kcal_per_unit || selectedCat?.kcal_per_unit || 60

  // Auto-calc speed
  const speed = distance && durationMin && Number(durationMin) > 0
    ? ((Number(distance) / (Number(durationMin) / 60))).toFixed(1)
    : null

  // Auto-calc pace
  const pace = distance && durationMin && Number(distance) > 0
    ? (Number(durationMin) / Number(distance)).toFixed(1)
    : null

  // Auto-calc calories from distance if not manually entered
  const autoCalories = distance && Number(distance) > 0 && !calories
    ? roundKcal(Number(distance) * kcalPerKm)
    : null

  const handleSubmit = () => {
    if (!distance || Number(distance) <= 0) return
    const data = {
      value: Number(distance),
      notes: `${activityType || 'Hoạt động'}${notes ? ': ' + notes : ''}`,
      distance: Number(distance),
      duration_minutes: durationMin ? Number(durationMin) : undefined,
      avg_speed: speed ? Number(speed) : undefined,
      calories: calories ? Number(calories) : (autoCalories || undefined),
      source: 'manual_input'
    }
    onSubmit(data)
  }

  const handleStartRecording = () => {
    onClose()
    navigate(`/challenge/${challenge._id}/tracking`)
  }

  // Step 1: Choose mode (ghi hoạt động hoặc nhập tay)
  if (mode === 'choose') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-cyan-600 px-6 py-4 flex items-center justify-between">
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
              <FaRunning /> Ghi nhận hoạt động
            </h3>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 text-white transition"><FaTimes /></button>
          </div>

          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-2">Chọn cách ghi nhận hoạt động</p>

            {/* Ghi hoạt động trên bản đồ */}
            <button
              onClick={handleStartRecording}
              className="w-full p-5 rounded-xl border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 bg-blue-50 dark:bg-blue-900/20 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-2xl text-white shadow-lg">
                  <FaLocationArrow />
                </div>
                <div className="text-left flex-1">
                  <h4 className="font-bold text-gray-800 dark:text-white text-base group-hover:text-blue-600 transition">Bắt đầu ghi</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Ghi lại lộ trình khi bạn di chuyển; tự động tính quãng đường, tốc độ và calo.</p>
                </div>
              </div>
              <div className="mt-3 text-[11px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 justify-center">
                Sử dụng bản đồ Goong — Giống sự kiện ngoài trời →
              </div>
            </button>

            {/* Manual Input Option */}
            <button
              onClick={() => setMode('manual')}
              className="w-full p-5 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-gray-400 bg-gray-50 dark:bg-gray-700/50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-2xl text-white shadow-lg">
                  ✍️
                </div>
                <div className="text-left flex-1">
                  <h4 className="font-bold text-gray-800 dark:text-white text-base group-hover:text-gray-600 transition">Nhập tay</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Nhập khoảng cách và thời gian thủ công.</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Step 2: Manual input form
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-cyan-600 px-6 py-4 flex items-center justify-between">
          <h3 className="font-bold text-white text-lg flex items-center gap-2">
            <FaRunning /> Ghi nhận hoạt động
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 text-white transition"><FaTimes /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Back to mode selector */}
          <button onClick={() => setMode('choose')} className="text-sm text-blue-500 hover:text-blue-700 font-medium">
            ← Quay lại chọn phương thức
          </button>

          {/* Activity type selector — from DB categories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Loại hoạt động</label>
            <div className="grid grid-cols-3 gap-2">
              {outdoorCategories.length > 0 ? outdoorCategories.map(cat => (
                <button
                  key={cat._id}
                  onClick={() => setActivityType(cat.name)}
                  className={`p-2.5 rounded-xl text-center transition-all ${
                    activityType === cat.name
                      ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500 shadow-sm'
                      : 'bg-gray-50 dark:bg-gray-700 border-2 border-transparent hover:border-gray-200'
                  }`}
                >
                  <span className="text-xl block mb-0.5">{cat.icon === 'sport' ? '🏃' : cat.icon || '🌿'}</span>
                  <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400">{cat.name}</span>
                </button>
              )) : (
                // Fallback if categories haven't loaded
                ['Chạy bộ', 'Đạp xe', 'Đi bộ'].map(name => (
                  <button
                    key={name}
                    onClick={() => setActivityType(name)}
                    className={`p-2.5 rounded-xl text-center transition-all ${
                      activityType === name
                        ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500 shadow-sm'
                        : 'bg-gray-50 dark:bg-gray-700 border-2 border-transparent hover:border-gray-200'
                    }`}
                  >
                    <span className="text-xl block mb-0.5">{name === 'Chạy bộ' ? '🏃' : name === 'Đạp xe' ? '🚴' : '🚶'}</span>
                    <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400">{name}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Distance */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
              <FaMapMarkerAlt className="inline mr-1 text-blue-500" /> Khoảng cách (km) *
            </label>
            <input
              type="number" value={distance} onChange={e => setDistance(e.target.value)}
              placeholder="Nhập cự ly (km)" min="0.1" step="0.1"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-blue-400 outline-none transition text-sm"
            />
          </div>

          {/* Duration + Calories */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">⏱️ Thời gian (phút)</label>
              <input
                type="number" value={durationMin} onChange={e => setDurationMin(e.target.value)}
                placeholder="Nhập thời gian (phút)" min="1"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-blue-400 outline-none transition text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">🔥 Calo (kcal)</label>
              <input
                type="number" value={calories} onChange={e => setCalories(e.target.value)}
                placeholder={autoCalories ? String(autoCalories) : '300'} min="0"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-blue-400 outline-none transition text-sm"
              />
            </div>
          </div>

          {/* Auto-calc kcal hint */}
          {autoCalories && (
            <div className="flex items-center gap-2 p-2.5 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800 text-xs">
              <FaFire className="text-orange-500 shrink-0" />
              <span className="text-orange-700 dark:text-orange-300">
                Ước tính ~{autoCalories} kcal ({kcalPerKm} kcal/km × {distance} km)
              </span>
            </div>
          )}

          {/* Auto-calculated stats */}
          {(speed || pace) && (
            <div className="flex gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              {speed && (
                <div className="flex-1 text-center">
                  <p className="text-lg font-black text-blue-600 dark:text-blue-400">{speed}</p>
                  <p className="text-[10px] text-gray-500">km/h</p>
                </div>
              )}
              {pace && (
                <div className="flex-1 text-center">
                  <p className="text-lg font-black text-blue-600 dark:text-blue-400">{pace}</p>
                  <p className="text-[10px] text-gray-500">phút/km</p>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">📝 Ghi chú</label>
            <textarea
              value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="Mô tả hoạt động..."
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-blue-400 outline-none transition text-sm resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-300 font-medium hover:bg-gray-50 transition text-sm">Hủy</button>
            <button
              onClick={handleSubmit}
              disabled={isLoading || !distance}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold text-sm hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>🏃 Ghi nhận</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
