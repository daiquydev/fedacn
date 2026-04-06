import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaTimes, FaDumbbell } from 'react-icons/fa'

const WORKOUT_TYPES = [
  { key: 'cardio', label: 'Cardio', emoji: '🏃' },
  { key: 'strength', label: 'Tập tạ', emoji: '🏋️' },
  { key: 'yoga', label: 'Yoga', emoji: '🧘' },
  { key: 'hiit', label: 'HIIT', emoji: '⚡' },
  { key: 'stretching', label: 'Giãn cơ', emoji: '🤸' },
  { key: 'other', label: 'Khác', emoji: '💪' }
]

export default function FitnessCheckinModal({ challenge, onClose, onSubmit, isLoading }) {
  // challenge._id and challenge.title are passed from ChallengeDetail
  const navigate = useNavigate()
  const [workoutType, setWorkoutType] = useState('cardio')
  const [durationMin, setDurationMin] = useState('')
  const [calories, setCalories] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    onClose()
    navigate('/training', {
      state: {
        challengeId: challenge?._id,
        challengeTitle: challenge?.title,
        challengeExercises: challenge?.exercises || [],
        referrer: 'challenge'
      }
    })
  }, [])

  const handleSubmit = () => {
    if (!durationMin || Number(durationMin) <= 0) {
      return
    }
    const selected = WORKOUT_TYPES.find(w => w.key === workoutType)
    const data = {
      value: 1,
      notes: `${selected?.label || 'Tập luyện'}${notes ? ': ' + notes : ''}`,
      duration_minutes: Number(durationMin),
      calories: calories ? Number(calories) : undefined,
      source: 'workout_session'
    }
    onSubmit(data)
  }

  // Step 2: Manual input form
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4 flex items-center justify-between">
          <h3 className="font-bold text-white text-lg flex items-center gap-2">
            <FaDumbbell /> Ghi nhận buổi tập
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 text-white transition"><FaTimes /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Back to mode selector */}
          <button onClick={() => setMode('choose')} className="text-sm text-purple-500 hover:text-purple-700 font-medium">
            ← Quay lại chọn phương thức
          </button>

          {/* Workout type selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Loại bài tập</label>
            <div className="grid grid-cols-3 gap-2">
              {WORKOUT_TYPES.map(wt => (
                <button
                  key={wt.key}
                  onClick={() => setWorkoutType(wt.key)}
                  className={`p-2.5 rounded-xl text-center transition-all ${
                    workoutType === wt.key
                      ? 'bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-500 shadow-sm'
                      : 'bg-gray-50 dark:bg-gray-700 border-2 border-transparent hover:border-gray-200'
                  }`}
                >
                  <span className="text-xl block mb-0.5">{wt.emoji}</span>
                  <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400">{wt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Duration + Calories */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">⏱️ Thời gian (phút) *</label>
              <input
                type="number" value={durationMin} onChange={e => setDurationMin(e.target.value)}
                placeholder="30" min="1"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-purple-400 outline-none transition text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">🔥 Calo đốt (kcal)</label>
              <input
                type="number" value={calories} onChange={e => setCalories(e.target.value)}
                placeholder="200" min="0"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-purple-400 outline-none transition text-sm"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">📝 Ghi chú</label>
            <textarea
              value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="Chi tiết buổi tập..."
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-purple-400 outline-none transition text-sm resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-300 font-medium hover:bg-gray-50 transition text-sm">Hủy</button>
            <button
              onClick={handleSubmit}
              disabled={isLoading || !durationMin}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold text-sm hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>💪 Ghi nhận buổi tập</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
