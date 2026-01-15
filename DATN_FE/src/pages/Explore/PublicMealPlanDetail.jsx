import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FaCalendarAlt, FaClock, FaHeart, FaUsers, FaBookmark, FaShare, FaComment, FaArrowLeft, FaUserPlus, FaFire, FaDrumstickBite, FaBreadSlice, FaOilCan, FaUtensils, FaLeaf } from 'react-icons/fa'
import { IoMdTime } from 'react-icons/io'
import mealPlanApi from '../../apis/mealPlanApi'
import { getImageUrl } from '../../utils/imageUrl'
import Loading from '../../components/GlobalComponents/Loading'

const PLACEHOLDER_MEAL = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80'
const PLACEHOLDER_AVATAR = 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=200&q=80'

// Login Prompt Modal Component
const LoginPromptModal = ({ isOpen, onClose, action }) => {
  const navigate = useNavigate()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
          <FaUserPlus className="text-3xl text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Tham gia cộng đồng
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Đăng nhập để {action || 'tương tác với nội dung'} và kết nối với cộng đồng yêu thích ẩm thực lành mạnh.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl transition-all duration-300"
          >
            Đăng nhập ngay
          </button>
          <button
            onClick={() => navigate('/register')}
            className="w-full py-3 px-6 border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-semibold rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all duration-300"
          >
            Tạo tài khoản mới
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 transition-colors"
          >
            Để sau
          </button>
        </div>
      </div>
    </div>
  )
}

const getCategoryLabel = (category) => {
  const labels = {
    0: 'Giảm cân',
    1: 'Tăng cơ',
    2: 'Ăn chay',
    3: 'Low-carb',
    4: 'Cân bằng',
    5: 'Khác'
  }
  return labels[category] || 'Thực đơn'
}

const getDifficultyLabel = (level) => {
  const labels = {
    0: 'Dễ',
    1: 'Trung bình',
    2: 'Khó'
  }
  return labels[level] || 'Trung bình'
}

export default function PublicMealPlanDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [mealPlan, setMealPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedDay, setSelectedDay] = useState(1)
  const [loginModal, setLoginModal] = useState({ open: false, action: '' })

  const handleInteraction = useCallback((action) => {
    setLoginModal({ open: true, action })
  }, [])

  useEffect(() => {
    const fetchMealPlan = async () => {
      try {
        setLoading(true)
        const response = await mealPlanApi.getMealPlanDetail(id)
        setMealPlan(response?.data?.result)
      } catch (err) {
        setError(err?.response?.data?.message || 'Không thể tải thực đơn')
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchMealPlan()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    )
  }

  if (error || !mealPlan) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <FaUtensils className="text-3xl text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Không tìm thấy thực đơn</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'Thực đơn này có thể đã bị xóa hoặc không công khai.'}</p>
        <button
          onClick={() => navigate('/explore')}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl"
        >
          Khám phá thực đơn khác
        </button>
      </div>
    )
  }

  const coverImage = getImageUrl(mealPlan.image || mealPlan.cover_image) || PLACEHOLDER_MEAL
  const authorAvatar = getImageUrl(mealPlan.author?.avatar) || PLACEHOLDER_AVATAR
  const days = mealPlan.days || []
  const currentDay = days.find((d) => d.day_number === selectedDay) || days[0]
  const meals = currentDay?.meals || []

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero */}
      <div className="relative">
        <div className="h-[400px] md:h-[500px] overflow-hidden">
          <img
            src={coverImage}
            alt={mealPlan.title}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.src = PLACEHOLDER_MEAL }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        </div>

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-10 flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-colors"
        >
          <FaArrowLeft /> Quay lại
        </button>

        {/* Content overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-semibold rounded-full">
                {getCategoryLabel(mealPlan.category)}
              </span>
              <span className="px-3 py-1 bg-white/20 text-white text-xs font-semibold rounded-full flex items-center gap-1">
                <FaCalendarAlt /> {mealPlan.duration || 7} ngày
              </span>
              <span className="px-3 py-1 bg-white/20 text-white text-xs font-semibold rounded-full">
                {getDifficultyLabel(mealPlan.difficulty_level)}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{mealPlan.title}</h1>

            <div className="flex flex-wrap items-center gap-4 text-white/90">
              <div className="flex items-center gap-2">
                <img
                  src={authorAvatar}
                  alt={mealPlan.author?.name}
                  className="w-10 h-10 rounded-full border-2 border-white/50"
                  onError={(e) => { e.target.src = PLACEHOLDER_AVATAR }}
                />
                <span className="font-medium">{mealPlan.author?.name || 'Tác giả'}</span>
              </div>
              <span className="flex items-center gap-1">
                <FaHeart className="text-rose-400" /> {mealPlan.likes_count || 0}
              </span>
              <span className="flex items-center gap-1">
                <FaUsers /> {mealPlan.applied_count || 0} đang áp dụng
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 mb-8 -mt-16 relative z-10">
          <button
            onClick={() => handleInteraction('áp dụng thực đơn này')}
            className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl shadow-lg transition-all"
          >
            Áp dụng thực đơn
          </button>
          <button
            onClick={() => handleInteraction('lưu thực đơn')}
            className="px-4 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
          >
            <FaBookmark /> Lưu
          </button>
          <button
            onClick={() => handleInteraction('chia sẻ thực đơn')}
            className="px-4 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
          >
            <FaShare /> Chia sẻ
          </button>
        </div>

        {/* Nutrition Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Thông tin dinh dưỡng trung bình/ngày</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Calories', value: mealPlan.averageNutrition?.calories || mealPlan.total_calories || 0, unit: 'kcal', icon: FaFire, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
              { label: 'Protein', value: mealPlan.averageNutrition?.protein || 0, unit: 'g', icon: FaDrumstickBite, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
              { label: 'Carbs', value: mealPlan.averageNutrition?.carbs || 0, unit: 'g', icon: FaBreadSlice, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
              { label: 'Chất béo', value: mealPlan.averageNutrition?.fat || 0, unit: 'g', icon: FaOilCan, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' }
            ].map(({ label, value, unit, icon: Icon, color, bg }) => (
              <div key={label} className={`${bg} rounded-xl p-4 text-center`}>
                <Icon className={`${color} text-2xl mx-auto mb-2`} />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{label} ({unit})</p>
              </div>
            ))}
          </div>
        </div>

        {/* Description */}
        {mealPlan.description && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-8">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Mô tả</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{mealPlan.description}</p>
          </div>
        )}

        {/* Day selector */}
        {days.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-8">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Thực đơn theo ngày</h2>
            
            <div className="flex flex-wrap gap-2 mb-6">
              {days.map((day) => (
                <button
                  key={day.day_number}
                  onClick={() => setSelectedDay(day.day_number)}
                  className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                    selectedDay === day.day_number
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
                  }`}
                >
                  Ngày {day.day_number}
                </button>
              ))}
            </div>

            {/* Meals for selected day */}
            {meals.length > 0 ? (
              <div className="space-y-4">
                {meals.map((meal, index) => {
                  const recipe = meal.recipe_id || {}
                  const mealImage = getImageUrl(recipe.image || recipe.hero_image || meal.image) || PLACEHOLDER_MEAL

                  return (
                    <div
                      key={meal._id || index}
                      className="flex gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
                    >
                      <img
                        src={mealImage}
                        alt={recipe.title || meal.name}
                        className="w-24 h-24 rounded-xl object-cover flex-shrink-0"
                        onError={(e) => { e.target.src = PLACEHOLDER_MEAL }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium uppercase">
                              {meal.meal_type === 0 ? 'Sáng' : meal.meal_type === 1 ? 'Trưa' : meal.meal_type === 2 ? 'Tối' : 'Snack'}
                            </span>
                            <h3 className="font-semibold text-gray-900 dark:text-white">{recipe.title || meal.name || 'Món ăn'}</h3>
                          </div>
                          {meal.schedule_time && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <FaClock /> {meal.schedule_time}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>{recipe.calories || meal.calories || 0} kcal</span>
                          <span>P: {recipe.protein || meal.protein || 0}g</span>
                          <span>C: {recipe.carbohydrate || meal.carbs || 0}g</span>
                          <span>F: {recipe.fat || meal.fat || 0}g</span>
                        </div>

                        <button
                          onClick={() => handleInteraction('xem công thức chi tiết')}
                          className="mt-2 text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-medium"
                        >
                          Xem công thức →
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Chưa có món ăn cho ngày này</p>
            )}
          </div>
        )}

        {/* CTA Section */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-8 text-center text-white">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/20 flex items-center justify-center">
            <FaLeaf className="text-3xl" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Bắt đầu hành trình sống khỏe</h3>
          <p className="text-white/80 mb-6 max-w-lg mx-auto">
            Đăng ký tài khoản để áp dụng thực đơn này, theo dõi tiến trình và kết nối với cộng đồng.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => navigate('/register')}
              className="px-6 py-3 bg-white text-emerald-600 font-semibold rounded-xl hover:bg-emerald-50 transition-colors"
            >
              Đăng ký miễn phí
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-3 bg-white/20 text-white font-semibold rounded-xl hover:bg-white/30 transition-colors"
            >
              Đăng nhập
            </button>
          </div>
        </div>
      </div>

      {/* Login Prompt Modal */}
      <LoginPromptModal
        isOpen={loginModal.open}
        onClose={() => setLoginModal({ open: false, action: '' })}
        action={loginModal.action}
      />
    </div>
  )
}
