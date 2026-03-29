import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { createChallenge } from '../../apis/challengeApi'
import sportCategoryApi from '../../apis/sportCategoryApi'
import { toast } from 'react-hot-toast'
import {
  FaUtensils, FaRunning, FaDumbbell, FaTrophy, FaArrowLeft,
  FaImage, FaCheck, FaClock, FaUsers, FaFire, FaBullseye
} from 'react-icons/fa'
import { useSafeMutation } from '../../hooks/useSafeMutation'

const CHALLENGE_TYPES = [
  {
    key: 'nutrition', label: 'Ăn uống', icon: <FaUtensils className="text-2xl" />,
    gradient: 'from-emerald-500 to-teal-600', desc: 'Thử thách ăn uống lành mạnh, check-in bằng ảnh',
    goals: [
      { type: 'days_completed', label: 'Số ngày hoàn thành', unit: 'ngày', placeholder: '7' },
      { type: 'meals_logged', label: 'Số bữa check-in', unit: 'bữa', placeholder: '21' },
      { type: 'kcal_target', label: 'Giữ calo mỗi ngày', unit: 'kcal/ngày', placeholder: '2000' }
    ]
  },
  {
    key: 'outdoor_activity', label: 'Hoạt động ngoài trời', icon: <FaRunning className="text-2xl" />,
    gradient: 'from-blue-500 to-cyan-600', desc: 'Chạy bộ, đạp xe, đi bộ - chọn danh mục và đo GPS tiến độ',
    // Goals sẽ được tạo dynamic dựa trên category
    goals: []
  },
  {
    key: 'fitness', label: 'Thể dục', icon: <FaDumbbell className="text-2xl" />,
    gradient: 'from-purple-500 to-pink-600', desc: 'Tập luyện workout, đo qua buổi tập',
    goals: [
      { type: 'total_kcal', label: 'Tổng kcal đốt', unit: 'kcal', placeholder: '3000' },
      { type: 'workout_count', label: 'Số buổi tập', unit: 'buổi', placeholder: '20' },
      { type: 'total_minutes', label: 'Tổng phút tập', unit: 'phút', placeholder: '600' },
      { type: 'days_active', label: 'Số ngày hoạt động', unit: 'ngày', placeholder: '15' }
    ]
  }
]



const BADGE_OPTIONS = ['🏆', '🔥', '💪', '🎯', '⭐', '🏅', '🥇', '🚀', '🌟', '💎', '🍎', '🥗', '🏃', '🚴']

export default function CreateChallenge() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1: type, 2: details, 3: config
  const [form, setForm] = useState({
    title: '',
    description: '',
    image: '',
    challenge_type: '',
    goal_type: '',
    goal_value: '',
    goal_unit: '',
    is_public: true,
    badge_emoji: '🏆',
    // New fields for outdoor
    category: '',
    kcal_per_unit: 0
  })

  const selectedType = CHALLENGE_TYPES.find(t => t.key === form.challenge_type)

  // Fetch sport categories from DB
  const { data: categoriesData } = useQuery({
    queryKey: ['sportCategories'],
    queryFn: () => sportCategoryApi.getAll(),
    staleTime: 1000
  })
  const allCategories = categoriesData?.data?.result || []
  const outdoorCategories = allCategories.filter(c => c.type === 'Ngoài trời')

  // When category changes for outdoor, update kcal_per_unit
  const selectedCategory = outdoorCategories.find(c => c.name === form.category)

  // Set default outdoor category when switching to outdoor type
  useEffect(() => {
    if (form.challenge_type === 'outdoor_activity' && outdoorCategories.length > 0 && !form.category) {
      const first = outdoorCategories[0]
      setForm(prev => ({
        ...prev,
        category: first.name,
        kcal_per_unit: first.kcal_per_unit || 0
      }))
    }
  }, [form.challenge_type, outdoorCategories.length])

  // Auto-calculate estimated kcal when goal_value or category changes (for outdoor km-based)
  const estimatedKcal = form.challenge_type === 'outdoor_activity' && form.goal_type === 'total_km' && form.goal_value && selectedCategory
    ? Math.round(Number(form.goal_value) * (selectedCategory.kcal_per_unit || 0))
    : null

  const mutation = useSafeMutation({
    mutationFn: () => createChallenge(form),
    onSuccess: (res) => {
      toast.success('Tạo thử thách thành công! 🎉')
      navigate(`/challenge/${res?.data?.result?._id || ''}`)
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Lỗi khi tạo thử thách')
  })

  const handleSelectGoal = (goal) => {
    setForm(prev => ({ ...prev, goal_type: goal.type, goal_unit: goal.unit }))
  }

  const handleSelectCategory = (cat) => {
    setForm(prev => ({
      ...prev,
      category: cat.name,
      kcal_per_unit: cat.kcal_per_unit || 0,
      // Reset goal when changing category
      goal_type: '',
      goal_unit: '',
      goal_value: ''
    }))
  }

  // Generate outdoor goals dynamically based on selected category
  const getOutdoorGoals = () => {
    if (!selectedCategory) return []
    return [
      { type: 'total_km', label: 'Tổng km', unit: 'km', placeholder: '50' },
      { type: 'total_kcal', label: 'Tổng kcal đốt', unit: 'kcal', placeholder: String(Math.round(50 * (selectedCategory.kcal_per_unit || 60))) },
      { type: 'total_minutes', label: 'Tổng phút hoạt động', unit: 'phút', placeholder: '300' }
    ]
  }

  const canProceedStep2 = form.title.trim() && form.goal_type && form.goal_value > 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-6">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate('/challenge')} className="p-2 rounded-xl bg-white/20 text-white hover:bg-white/30 transition">
            <FaArrowLeft />
          </button>
          <div>
            <h1 className="text-2xl font-black text-white">Tạo thử thách mới</h1>
            <p className="text-white/70 text-sm">Bước {step}/3</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <React.Fragment key={s}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${s <= step ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                }`}>
                {s < step ? <FaCheck /> : s}
              </div>
              {s < 3 && <div className={`flex-1 h-1 rounded-full ${s < step ? 'bg-orange-400' : 'bg-gray-200 dark:bg-gray-700'}`} />}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Select Type */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">Chọn loại thử thách</h2>
            <div className="space-y-3">
              {CHALLENGE_TYPES.map(type => (
                <button
                  key={type.key}
                  onClick={() => {
                    setForm(prev => ({ ...prev, challenge_type: type.key, goal_type: '', goal_unit: '', category: '', kcal_per_unit: 0 }))
                    setStep(2)
                  }}
                  className={`w-full p-5 rounded-2xl border-2 text-left transition-all hover:shadow-lg ${form.challenge_type === type.key
                    ? 'border-orange-400 shadow-md'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${type.gradient} flex items-center justify-center text-white`}>
                      {type.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 dark:text-gray-200">{type.label}</h3>
                      <p className="text-sm text-gray-500">{type.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 2 && selectedType && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Chi tiết thử thách</h2>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tên thử thách *</label>
              <input
                value={form.title}
                onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder={`VD: ${selectedType.key === 'nutrition' ? 'Ăn clean 7 ngày' : selectedType.key === 'outdoor_activity' ? 'Chạy 100km trong tháng' : 'Tập gym 20 buổi'}`}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-orange-400 outline-none transition text-sm"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Mô tả</label>
              <textarea
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                placeholder="Mô tả thêm về thử thách..."
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-orange-400 outline-none transition text-sm resize-none"
              />
            </div>

            {/* === OUTDOOR: Category Selection === */}
            {form.challenge_type === 'outdoor_activity' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FaBullseye className="inline mr-1 text-blue-500" /> Danh mục hoạt động *
                </label>
                {outdoorCategories.length === 0 ? (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800 text-sm text-yellow-700 dark:text-yellow-300">
                    Đang tải danh mục...
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {outdoorCategories.map(cat => (
                      <button
                        key={cat._id}
                        onClick={() => handleSelectCategory(cat)}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${form.category === cat.name
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 bg-white dark:bg-gray-800'
                          }`}
                      >
                        <span className="text-lg block mb-0.5">{cat.icon === 'sport' ? '🏃' : cat.icon || '🌿'}</span>
                        <span className={`text-xs font-medium ${form.category === cat.name ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'}`}>
                          {cat.name}
                        </span>
                        <span className="text-[10px] block text-gray-400 mt-0.5">{cat.kcal_per_unit} kcal/km</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Goal Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mục tiêu *</label>
              <div className="grid grid-cols-1 gap-2">
                {(form.challenge_type === 'outdoor_activity' ? getOutdoorGoals() : selectedType.goals).map(goal => (
                  <button
                    key={goal.type}
                    onClick={() => handleSelectGoal(goal)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${form.goal_type === goal.type
                      ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm text-gray-800 dark:text-gray-200">{goal.label}</span>
                      <span className="text-xs text-gray-400">{goal.unit}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Goal Value */}
            {form.goal_type && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Giá trị mục tiêu * ({form.goal_unit})
                </label>
                <input
                  type="number"
                  value={form.goal_value}
                  onChange={e => setForm(prev => ({ ...prev, goal_value: e.target.value }))}
                  placeholder={(form.challenge_type === 'outdoor_activity' ? getOutdoorGoals() : selectedType.goals).find(g => g.type === form.goal_type)?.placeholder}
                  min="1"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-orange-400 outline-none transition text-sm"
                />

                {/* Estimated kcal for outdoor km-based goals */}
                {estimatedKcal !== null && estimatedKcal > 0 && (
                  <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 flex items-center gap-2">
                    <FaFire className="text-orange-500 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                        Ước tính: ~{estimatedKcal.toLocaleString()} kcal
                      </p>
                      <p className="text-[10px] text-blue-500 dark:text-blue-400">
                        Dựa trên {selectedCategory?.name}: {selectedCategory?.kcal_per_unit} kcal/km × {form.goal_value} km
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl border-2 border-gray-300 font-medium hover:bg-gray-50 transition">
                <FaArrowLeft className="inline mr-2" /> Quay lại
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!canProceedStep2}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold disabled:opacity-40 hover:shadow-lg transition"
              >
                Tiếp tục
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Config */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Cấu hình</h2>



            {/* Public/Private */}
            <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div>
                <p className="font-medium text-sm text-gray-800 dark:text-gray-200">
                  <FaUsers className="inline mr-2" /> Chia sẻ cộng đồng
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Cho phép mọi người tham gia thử thách</p>
              </div>
              <button
                onClick={() => setForm(prev => ({ ...prev, is_public: !prev.is_public }))}
                className={`w-12 h-6 rounded-full transition-all ${form.is_public ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${form.is_public ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>



            {/* Badge */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Huy hiệu</label>
              <div className="flex flex-wrap gap-2">
                {BADGE_OPTIONS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => setForm(prev => ({ ...prev, badge_emoji: emoji }))}
                    className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${form.badge_emoji === emoji
                      ? 'bg-amber-100 dark:bg-amber-900/30 ring-2 ring-amber-400 scale-110'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl border-2 border-gray-300 font-medium hover:bg-gray-50 transition">
                <FaArrowLeft className="inline mr-2" /> Quay lại
              </button>
              <button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {mutation.isPending ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <><FaTrophy /> Tạo thử thách</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
