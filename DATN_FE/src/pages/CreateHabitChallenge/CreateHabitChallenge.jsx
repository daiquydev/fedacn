import { useSafeMutation } from '../../hooks/useSafeMutation'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { FaArrowLeft, FaFire, FaChevronDown, FaChevronUp } from 'react-icons/fa'
import toast from 'react-hot-toast'
import { createHabitChallenge } from '../../apis/habitChallengeApi'
import CloudinaryImageUploader from '../../components/GlobalComponents/CloudinaryImageUploader/CloudinaryImageUploader'

const CATEGORIES = [
  { value: 'exercise', label: 'Tập luyện', emoji: '💪', desc: 'Tập gym, yoga, chạy bộ...' },
  { value: 'nutrition', label: 'Dinh dưỡng', emoji: '🥗', desc: 'Ăn sạch, nấu ăn...' },
  { value: 'sleep', label: 'Giấc ngủ', emoji: '😴', desc: 'Ngủ sớm, đúng giờ...' },
  { value: 'mental', label: 'Tinh thần', emoji: '🧘', desc: 'Thiền, đọc sách...' },
  { value: 'hydration', label: 'Uống nước', emoji: '💧', desc: 'Uống đủ nước mỗi ngày' },
  { value: 'other', label: 'Khác', emoji: '✨', desc: 'Thói quen tự do' }
]

const CHALLENGE_TYPES = [
  { value: 'solo', label: 'Cá Nhân', emoji: '🧑', desc: 'Tự thử thách bản thân', color: 'blue' },
  { value: 'team', label: 'Đội Nhóm', emoji: '👥', desc: 'Nhóm 2-10 người cùng tiến', color: 'green' },
  { value: 'global', label: 'Cộng Đồng', emoji: '🌍', desc: 'Toàn server cùng tham gia', color: 'purple' }
]

const DIFFICULTIES = [
  { value: 'easy', label: 'Nhẹ', emoji: '🌿', desc: 'XP ×0.8', color: 'green', multiplier: '×0.8' },
  { value: 'medium', label: 'Trung Bình', emoji: '⚡', desc: 'XP ×1.0', color: 'yellow', multiplier: '×1.0' },
  { value: 'hard', label: 'Thử Thách', emoji: '🔥', desc: 'XP ×1.5', color: 'red', multiplier: '×1.5' }
]

const CHECKIN_FREQUENCIES = [
  { value: 'daily', label: 'Hàng ngày' },
  { value: 'weekly_3', label: '3 lần/tuần' },
  { value: 'weekly_5', label: '5 lần/tuần' },
  { value: 'free', label: 'Tự do' }
]

const COMPLETION_TYPES = [
  { value: 'percentage', label: 'Theo % hoàn thành', desc: 'Hoàn thành khi đạt đủ % check-in' },
  { value: 'streak', label: 'Streak liên tục', desc: 'Check-in liên tục, miss = mất streak' },
  { value: 'total', label: 'Tổng lượt', desc: 'Đạt đủ số check-in bất kỳ' }
]

export default function CreateHabitChallenge() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showAdvanced, setShowAdvanced] = useState(false)

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'exercise',
    challenge_type: 'solo',
    difficulty: 'medium',
    duration_days: 21,
    image: '',
    is_public: true,
    max_participants: 0,
    min_level: 1,
    team_size: 5,
    rules: {
      checkin_frequency: 'daily',
      require_image: true,
      require_note: false,
      streak_freeze_allowed: 1,
      grace_period_hours: 0,
      target_checkins: 0,
      completion_type: 'percentage'
    }
  })

  const createMutation = useSafeMutation({
    mutationFn: () => createHabitChallenge(form),
    onSuccess: () => {
      toast.success('Tạo thử thách thành công! 🎉')
      queryClient.invalidateQueries({ queryKey: ['habit-challenges'] })
      navigate('/habit-challenge')
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Không thể tạo thử thách')
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.title.trim()) {
      toast.error('Vui lòng nhập tên thử thách')
      return
    }
    createMutation.mutate()
  }

  const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }))
  const updateRules = (key, value) => setForm(prev => ({
    ...prev,
    rules: { ...prev.rules, [key]: value }
  }))

  const difficultyColor = {
    easy: 'border-green-500 bg-green-50 dark:bg-green-900/20',
    medium: 'border-amber-500 bg-amber-50 dark:bg-amber-900/20',
    hard: 'border-red-500 bg-red-50 dark:bg-red-900/20'
  }

  return (
    <div className='max-w-2xl mx-auto px-4 py-6'>
      <button
        onClick={() => navigate('/habit-challenge')}
        className='flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-4 transition-colors'
      >
        <FaArrowLeft /> Quay lại
      </button>

      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2'>
          <FaFire className='text-orange-500' /> Tạo Thử Thách Mới
        </h1>
        <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
          Tạo thử thách với luật chơi tùy chỉnh • Kiếm XP • Lên level
        </p>
      </div>

      <form onSubmit={handleSubmit} className='space-y-6'>
        {/* Title */}
        <div>
          <label className='block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2'>
            Tên thử thách <span className='text-red-500'>*</span>
          </label>
          <input
            type='text'
            value={form.title}
            onChange={(e) => updateForm('title', e.target.value)}
            placeholder='Ví dụ: 21 ngày tập yoga buổi sáng'
            maxLength={100}
            className='w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 dark:text-white'
          />
          <p className='text-xs text-gray-400 mt-1'>{form.title.length}/100</p>
        </div>

        {/* Description */}
        <div>
          <label className='block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2'>
            Mô tả
          </label>
          <textarea
            value={form.description}
            onChange={(e) => updateForm('description', e.target.value)}
            placeholder='Mô tả chi tiết thử thách, cách check-in, lưu ý...'
            rows={3}
            maxLength={500}
            className='w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 dark:text-white resize-none'
          />
        </div>

        {/* Challenge Type */}
        <div>
          <label className='block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2'>
            Loại thử thách
          </label>
          <div className='grid grid-cols-3 gap-2'>
            {CHALLENGE_TYPES.map(type => (
              <button
                key={type.value}
                type='button'
                onClick={() => updateForm('challenge_type', type.value)}
                className={`p-3 rounded-xl border-2 text-center transition-all ${
                  form.challenge_type === type.value
                    ? `border-${type.color}-500 bg-${type.color}-50 dark:bg-${type.color}-900/20 ring-1 ring-${type.color}-500/30`
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <span className='text-2xl block'>{type.emoji}</span>
                <p className='text-sm font-semibold text-gray-700 dark:text-gray-200 mt-1'>{type.label}</p>
                <p className='text-xs text-gray-400 mt-0.5'>{type.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div>
          <label className='block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2'>
            Độ khó <span className='text-xs font-normal text-gray-400'>(ảnh hưởng XP nhận được)</span>
          </label>
          <div className='grid grid-cols-3 gap-2'>
            {DIFFICULTIES.map(diff => (
              <button
                key={diff.value}
                type='button'
                onClick={() => updateForm('difficulty', diff.value)}
                className={`p-3 rounded-xl border-2 text-center transition-all ${
                  form.difficulty === diff.value
                    ? difficultyColor[diff.value] + ' ring-1'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <span className='text-xl'>{diff.emoji}</span>
                <p className='text-sm font-semibold text-gray-700 dark:text-gray-200 mt-1'>{diff.label}</p>
                <p className={`text-xs font-bold mt-0.5 ${
                  diff.value === 'hard' ? 'text-red-500' : diff.value === 'easy' ? 'text-green-500' : 'text-amber-500'
                }`}>
                  XP {diff.multiplier}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Category */}
        <div>
          <label className='block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2'>
            Danh mục
          </label>
          <div className='grid grid-cols-2 sm:grid-cols-3 gap-2'>
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                type='button'
                onClick={() => updateForm('category', cat.value)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${form.category === cat.value
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <span className='text-xl'>{cat.emoji}</span>
                <p className='text-sm font-medium text-gray-700 dark:text-gray-200 mt-1'>{cat.label}</p>
                <p className='text-xs text-gray-400 mt-0.5'>{cat.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Duration — Slider */}
        <div>
          <label className='block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2'>
            Thời gian: <span className='text-orange-500'>{form.duration_days} ngày</span>
          </label>
          <input
            type='range'
            min={3}
            max={90}
            value={form.duration_days}
            onChange={(e) => updateForm('duration_days', Number(e.target.value))}
            className='w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500'
          />
          <div className='flex justify-between text-xs text-gray-400 mt-1'>
            <span>3 ngày</span>
            <span className='text-orange-400 font-medium'>21 ngày ★</span>
            <span>90 ngày</span>
          </div>
        </div>

        {/* Cover image */}
        <div>
          <label className='block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2'>
            Ảnh bìa (tùy chọn)
          </label>
          {form.image ? (
            <div className='relative'>
              <img src={form.image} alt='Cover' className='w-full h-40 object-cover rounded-xl' />
              <button
                type='button'
                onClick={() => updateForm('image', '')}
                className='absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600'
              >
                ✕
              </button>
            </div>
          ) : (
            <CloudinaryImageUploader
              onChange={(url) => updateForm('image', url)}
              folder='habit-challenges'
            />
          )}
        </div>

        {/* Public toggle */}
        <div className='flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl'>
          <div>
            <p className='text-sm font-medium text-gray-700 dark:text-gray-200'>Thử thách công khai</p>
            <p className='text-xs text-gray-400 mt-0.5'>Mọi người có thể tìm và tham gia</p>
          </div>
          <button
            type='button'
            onClick={() => updateForm('is_public', !form.is_public)}
            className={`w-12 h-6 rounded-full transition-colors relative ${form.is_public ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${form.is_public ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {/* ==================== ADVANCED RULES ==================== */}
        <div className='border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden'>
          <button
            type='button'
            onClick={() => setShowAdvanced(!showAdvanced)}
            className='w-full flex items-center justify-between p-4 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors'
          >
            <span className='flex items-center gap-2'>⚙️ Luật chơi nâng cao</span>
            {showAdvanced ? <FaChevronUp className='text-gray-400' /> : <FaChevronDown className='text-gray-400' />}
          </button>

          {showAdvanced && (
            <div className='p-4 pt-0 space-y-4 border-t border-gray-100 dark:border-gray-700'>
              {/* Check-in Frequency */}
              <div>
                <label className='block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5'>
                  Tần suất check-in
                </label>
                <select
                  value={form.rules.checkin_frequency}
                  onChange={(e) => updateRules('checkin_frequency', e.target.value)}
                  className='w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30'
                >
                  {CHECKIN_FREQUENCIES.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>

              {/* Completion Type */}
              <div>
                <label className='block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5'>
                  Kiểu hoàn thành
                </label>
                <div className='space-y-1.5'>
                  {COMPLETION_TYPES.map(ct => (
                    <label
                      key={ct.value}
                      className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${
                        form.rules.completion_type === ct.value
                          ? 'bg-orange-50 dark:bg-orange-900/20 ring-1 ring-orange-400/40'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <input
                        type='radio'
                        name='completion_type'
                        value={ct.value}
                        checked={form.rules.completion_type === ct.value}
                        onChange={(e) => updateRules('completion_type', e.target.value)}
                        className='accent-orange-500'
                      />
                      <div>
                        <p className='text-sm font-medium text-gray-700 dark:text-gray-200'>{ct.label}</p>
                        <p className='text-xs text-gray-400'>{ct.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Toggles row */}
              <div className='grid grid-cols-2 gap-3'>
                <div className='flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg'>
                  <span className='text-xs text-gray-600 dark:text-gray-300'>Yêu cầu ảnh</span>
                  <button
                    type='button'
                    onClick={() => updateRules('require_image', !form.rules.require_image)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${form.rules.require_image ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${form.rules.require_image ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <div className='flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg'>
                  <span className='text-xs text-gray-600 dark:text-gray-300'>Yêu cầu ghi chú</span>
                  <button
                    type='button'
                    onClick={() => updateRules('require_note', !form.rules.require_note)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${form.rules.require_note ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${form.rules.require_note ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>

              {/* Streak Freeze */}
              <div>
                <label className='block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5'>
                  Lượt đóng băng Streak ❄️ <span className='text-gray-400'>({form.rules.streak_freeze_allowed} lượt)</span>
                </label>
                <input
                  type='range'
                  min={0}
                  max={3}
                  value={form.rules.streak_freeze_allowed}
                  onChange={(e) => updateRules('streak_freeze_allowed', Number(e.target.value))}
                  className='w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500'
                />
                <div className='flex justify-between text-[10px] text-gray-400 mt-0.5'>
                  <span>Không cho</span>
                  <span>1</span>
                  <span>2</span>
                  <span>3 lượt</span>
                </div>
              </div>

              {/* Grace Period */}
              <div>
                <label className='block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5'>
                  Gia hạn streak <span className='text-gray-400'>({form.rules.grace_period_hours}h)</span>
                </label>
                <select
                  value={form.rules.grace_period_hours}
                  onChange={(e) => updateRules('grace_period_hours', Number(e.target.value))}
                  className='w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30'
                >
                  <option value={0}>Không gia hạn</option>
                  <option value={3}>3 giờ</option>
                  <option value={6}>6 giờ</option>
                  <option value={12}>12 giờ</option>
                </select>
              </div>

              {/* Max participants */}
              <div>
                <label className='block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5'>
                  Giới hạn người tham gia <span className='text-gray-400'>(0 = không giới hạn)</span>
                </label>
                <input
                  type='number'
                  min={0}
                  max={1000}
                  value={form.max_participants}
                  onChange={(e) => updateForm('max_participants', Number(e.target.value))}
                  className='w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30'
                />
              </div>

              {/* Min level */}
              <div>
                <label className='block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5'>
                  Level tối thiểu <span className='text-gray-400'>(1-5)</span>
                </label>
                <select
                  value={form.min_level}
                  onChange={(e) => updateForm('min_level', Number(e.target.value))}
                  className='w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30'
                >
                  <option value={1}>🌱 Level 1 — Người mới</option>
                  <option value={2}>💪 Level 2 — Chiến binh (100 XP)</option>
                  <option value={3}>⚡ Level 3 — Kiên trì (300 XP)</option>
                  <option value={4}>🔥 Level 4 — Bền bỉ (600 XP)</option>
                  <option value={5}>👑 Level 5 — Huyền thoại (1000 XP)</option>
                </select>
              </div>

              {/* Team size (only for team type) */}
              {form.challenge_type === 'team' && (
                <div>
                  <label className='block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5'>
                    Số người mỗi đội
                  </label>
                  <input
                    type='number'
                    min={2}
                    max={10}
                    value={form.team_size}
                    onChange={(e) => updateForm('team_size', Number(e.target.value))}
                    className='w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30'
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type='submit'
          disabled={!form.title.trim() || createMutation.isPending}
          className='w-full py-3.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-orange-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
        >
          {createMutation.isPending ? (
            <span className='animate-spin'>⏳</span>
          ) : (
            <>🔥 Tạo thử thách</>
          )}
        </button>
      </form>
    </div>
  )
}
