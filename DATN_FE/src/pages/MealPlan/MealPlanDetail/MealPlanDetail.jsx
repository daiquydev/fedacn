import { useState, useEffect, useRef, useMemo, useCallback, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  FaArrowLeft,
  FaRegHeart,
  FaHeart,
  FaRegComment,
  FaCheckCircle,
  FaShare,
  FaStar,
  FaPrint,
  FaCalendarAlt,
  FaCheckSquare,
  FaBell,
  FaClipboardList,
  FaUtensils,
  FaInfoCircle,
  FaUserFriends,
  FaEdit
} from 'react-icons/fa'
import { MdFastfood, MdClose, MdSchedule, MdDateRange } from 'react-icons/md'
import { IoMdTime } from 'react-icons/io'
import { toast } from 'react-toastify'
import DayMealPlan from './components/DayMealPlan'
import Comments from './components/Comments/Comments'
import {
  getMealPlanDetail,
  likeMealPlan as likeMealPlanApi,
  unlikeMealPlan as unlikeMealPlanApi,
  applyMealPlan as applyMealPlanApi,
  createMealPlan as createMealPlanApi,
  shareMealPlan as shareMealPlanApi
} from '../../../services/mealPlanService'
import { getImageUrl } from '../../../utils/imageUrl'
import { MEAL_PLAN_CATEGORIES } from '../../../constants/mealPlan'
import { getActiveMealSchedule } from '../../../services/userMealScheduleService'
import { AppContext } from '../../../contexts/app.context'

export default function MealPlanDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useContext(AppContext)
  const [mealPlan, setMealPlan] = useState(null)
  const [mealPlanRaw, setMealPlanRaw] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeDay, setActiveDay] = useState(1)
  const [liked, setLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [engagementStats, setEngagementStats] = useState({ saves: 0, shares: 0, applies: 0 })
  const [showCloneModal, setShowCloneModal] = useState(false)
  const [cloneForm, setCloneForm] = useState({ title: '', isPublic: false })
  const [cloneLoading, setCloneLoading] = useState(false)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [applyLoading, setApplyLoading] = useState(false)
  const [startDate, setStartDate] = useState(getCurrentDate())
  const [applyMode, setApplyMode] = useState('schedule')
  const [activeSchedule, setActiveSchedule] = useState(null)
  const [checkingActiveSchedule, setCheckingActiveSchedule] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [shareForm, setShareForm] = useState({ content: '', privacy: '0' })
  const [shareLoading, setShareLoading] = useState(false)
  const commentsRef = useRef(null)
  const [friendsApplying] = useState([])
  const [reloadToken, setReloadToken] = useState(0)
  
  // Thêm state để quản lý modal cách chế biến
  const [showCookingModal, setShowCookingModal] = useState(false)
  const [activeMeal, setActiveMeal] = useState(null)
  const sourceMeta = useMemo(() => {
    const tags = mealPlanRaw?.tags
    if (!Array.isArray(tags)) return null
    const marker = tags.find((tag) => typeof tag === 'string' && tag.startsWith('source:'))
    if (!marker) return null
    const payload = marker.replace('source:', '')
    const [planId, ownerName] = payload.split('|')
    return {
      planId,
      ownerName: ownerName || 'Không xác định'
    }
  }, [mealPlanRaw?.tags])
  const isOwner = useMemo(() => {
    if (!mealPlanRaw?.author_id?._id || !profile?._id) return false
    return mealPlanRaw.author_id._id === profile._id
  }, [mealPlanRaw?.author_id?._id, profile?._id])
  const triggerReload = useCallback(() => setReloadToken((prev) => prev + 1), [])

  const loadMealPlan = useCallback(async () => {
    if (!id) return
    try {
      setLoading(true)
      setError(null)

      const response = await getMealPlanDetail(id)
      const mealPlanData = response.data.result

      const nutritionSnapshot = calculateAverageNutrition(mealPlanData)

      const transformedData = {
        id: mealPlanData._id,
        title: mealPlanData.title,
        description: mealPlanData.description,
        author: {
          id: mealPlanData.author_id._id,
          name: mealPlanData.author_id.name,
          avatar: getImageUrl(mealPlanData.author_id.avatar) || 'https://randomuser.me/api/portraits/men/32.jpg',
          isVerified: Boolean(mealPlanData.author_id.is_chef || mealPlanData.author_id.is_verified)
        },
        duration: mealPlanData.duration,
        category: MEAL_PLAN_CATEGORIES[mealPlanData.category] || 'Khác',
        likes: mealPlanData.likes_count,
        comments: mealPlanData.comments_count,
        rating: mealPlanData.rating || 0,
        ratingCount: mealPlanData.rating_count || 0,
        createdAt: mealPlanData.createdAt,
        image: getImageUrl(mealPlanData.image) || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
        notes: mealPlanData.description,
        averageNutrition: nutritionSnapshot,
        days: mealPlanData.days.map((day) => ({
          id: day._id,
          day: day.day_number,
          meals: day.meals.map((meal) => {
            const cookingPayload = buildCookingPayload(meal)
            return {
              type: getMealTypeName(meal.meal_type),
              content: meal.recipe_id?.title || meal.name,
              calories: meal.calories || meal.recipe_id?.energy || 0,
              protein: meal.protein || meal.recipe_id?.protein || 0,
              carbs: meal.carbs || meal.recipe_id?.carbohydrate || 0,
              fat: meal.fat || meal.recipe_id?.fat || 0,
              image:
                getImageUrl(meal.image || meal.recipe_id?.image) ||
                'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
              cooking: cookingPayload.html,
              cookingSteps: cookingPayload.steps,
              hasCooking: cookingPayload.hasCooking,
              ingredients: normalizeMealIngredients(meal)
            }
          })
        }))
      }

      setMealPlan(transformedData)
      setMealPlanRaw(mealPlanData)
      setLikesCount(transformedData.likes)
      setLiked(mealPlanData.is_liked || false)
      setEngagementStats({
        saves: mealPlanData.bookmarks_count || 0,
        shares: mealPlanData.shared_count || 0,
        applies: mealPlanData.applied_count || 0
      })
      setShareForm((prev) => ({
        ...prev,
        content: prev.content?.trim() ? prev.content : ''
      }))
    } catch (err) {
      setError('Không thể tải thông tin thực đơn. Vui lòng thử lại sau.')
      toast.error('Không thể tải thông tin thực đơn')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadMealPlan()
  }, [loadMealPlan, reloadToken])

  // Helper function to calculate average nutrition from raw plan data
  const calculateAverageNutrition = (planData) => {
    const days = planData?.days || []
    if (!days.length) {
      return {
        calories: planData?.target_calories || 0,
        protein: planData?.target_protein || 0,
        carbs: planData?.target_carbs || 0,
        fat: planData?.target_fat || 0
      }
    }

    const totals = days.reduce(
      (acc, day) => {
        const dayTotals = day.meals.reduce(
          (mealAcc, meal) => ({
            calories: mealAcc.calories + (meal.calories || meal.recipe_id?.energy || 0),
            protein: mealAcc.protein + (meal.protein || meal.recipe_id?.protein || 0),
            carbs: mealAcc.carbs + (meal.carbs || meal.recipe_id?.carbohydrate || 0),
            fat: mealAcc.fat + (meal.fat || meal.recipe_id?.fat || 0)
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        )

        return {
          calories: acc.calories + dayTotals.calories,
          protein: acc.protein + dayTotals.protein,
          carbs: acc.carbs + dayTotals.carbs,
          fat: acc.fat + dayTotals.fat
        }
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    )

    const divisor = Math.max(days.length, 1)
    return {
      calories: Math.round(totals.calories / divisor),
      protein: Math.round(totals.protein / divisor),
      carbs: Math.round(totals.carbs / divisor),
      fat: Math.round(totals.fat / divisor)
    }
  }

  const normalizeMealIngredients = (meal) => {
    const customIngredients = Array.isArray(meal.ingredients) ? meal.ingredients : []
    const recipeIngredients = Array.isArray(meal.recipe_id?.ingredients) ? meal.recipe_id.ingredients : []
    const source = customIngredients.length ? customIngredients : recipeIngredients

    if (!source.length) return []

    return source
      .map((ingredient) => {
        const amountValue =
          ingredient.amount ?? ingredient.quantity ?? ingredient.qty ?? ingredient.value ?? ''
        const parsedAmount =
          amountValue === '' || amountValue === null || typeof amountValue === 'undefined'
            ? ''
            : String(amountValue)

        return {
          name: ingredient.name || ingredient.title || '',
          amount: parsedAmount,
          unit: ingredient.unit || ingredient.unit_name || ingredient.measure || ''
        }
      })
      .filter((ingredient) => Boolean(ingredient.name))
  }

  const escapeHtml = (text = '') =>
    text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')

  const normalizeInstructionList = (source) => {
    if (!source) return []

    const coerceString = (value) => (typeof value === 'string' ? value.trim() : '')

    if (Array.isArray(source)) {
      return source
        .map((entry) => {
          if (typeof entry === 'string') return entry.trim()
          if (entry && typeof entry === 'object') {
            if (typeof entry.instruction === 'string') return entry.instruction.trim()
            if (typeof entry.description === 'string') return entry.description.trim()
            if (typeof entry.step === 'string') return entry.step.trim()
          }
          return ''
        })
        .filter(Boolean)
    }

    if (typeof source === 'string') {
      const trimmed = source.trim()
      if (!trimmed) return []

      if (trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed)
          const normalized = normalizeInstructionList(parsed)
          if (normalized.length) return normalized
        } catch (_) {
          // Ignore JSON parse errors and fall back to plain text handling
        }
      }

      return trimmed
        .split(/\r?\n+/)
        .map((line) => line.replace(/^[0-9]+[\.\)\-]\s*/, '').trim())
        .filter(Boolean)
    }

    return []
  }

  const buildInstructionHtml = (steps) => {
    if (!Array.isArray(steps) || steps.length === 0) return ''

    const items = steps
      .map((step, index) => {
        const safeStep = escapeHtml(step)
        return `<li class="leading-relaxed"><span class="font-semibold text-green-700 dark:text-green-300 mr-2">Bước ${
          index + 1
        }:</span>${safeStep}</li>`
      })
      .join('')

    return `<ol class="list-decimal pl-5 space-y-2 text-gray-800 dark:text-gray-100">${items}</ol>`
  }

  const buildCookingPayload = (meal) => {
    const recipeSteps = normalizeInstructionList(meal.recipe_id?.instructions)
    const customSteps = normalizeInstructionList(meal.instructions)
    const steps = recipeSteps.length ? recipeSteps : customSteps

    if (steps.length) {
      return {
        html: buildInstructionHtml(steps),
        steps,
        hasCooking: true
      }
    }

    const fallbackHtml = [meal.recipe_id?.content, typeof meal.instructions === 'string' ? meal.instructions : '', '']
      .find((value) => typeof value === 'string' && value.trim())
    const resolvedHtml = fallbackHtml && fallbackHtml.trim()
      ? fallbackHtml
      : '<p>Hướng dẫn chế biến sẽ được cập nhật sớm.</p>'

    return {
      html: resolvedHtml,
      steps: [],
      hasCooking: Boolean(resolvedHtml)
    }
  }

  // Helper function to convert meal type number to name
  const getMealTypeName = (mealType) => {
    const mealTypeMap = {
      1: 'Sáng',
      2: 'Trưa', 
      3: 'Tối',
      4: 'Xế'
    }
    return mealTypeMap[mealType] || 'Khác'
  }

  // Hàm lấy ngày hiện tại theo format YYYY-MM-DD
  function getCurrentDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const buildClonePayload = () => {
    if (!mealPlanRaw) return null

    const normalizeNumber = (value, fallback = 0) => {
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : fallback
    }

    const clonedDays = (mealPlanRaw.days || []).map((day) => {
      const meals = (day.meals || []).map((meal, index) => ({
        meal_type: meal.meal_type,
        meal_order: meal.meal_order || index + 1,
        recipe_id: meal.recipe_id?._id || meal.recipe_id || null,
        name: meal.name || meal.recipe_id?.title || '',
        image: meal.image || meal.recipe_id?.image || '',
        calories: normalizeNumber(meal.calories),
        protein: normalizeNumber(meal.protein),
        fat: normalizeNumber(meal.fat),
        carbs: normalizeNumber(meal.carbs),
        time: meal.time || '',
        servings: normalizeNumber(meal.servings, 1),
        is_optional: Boolean(meal.is_optional),
        difficult_level: meal.difficult_level || meal.recipe_id?.difficulty_level || '',
        notes: meal.notes || ''
      }))

      const totals = meals.reduce(
        (acc, meal) => ({
          calories: acc.calories + meal.calories,
          protein: acc.protein + meal.protein,
          fat: acc.fat + meal.fat,
          carbs: acc.carbs + meal.carbs
        }),
        { calories: 0, protein: 0, fat: 0, carbs: 0 }
      )

      return {
        day_number: day.day_number,
        title: day.title || `Ngày ${day.day_number}`,
        description: day.description || '',
        notes: day.notes || '',
        meals,
        total_calories: day.total_calories || totals.calories,
        total_protein: day.total_protein || totals.protein,
        total_fat: day.total_fat || totals.fat,
        total_carbs: day.total_carbs || totals.carbs
      }
    })

    const sourceTag = `source:${mealPlanRaw._id}|${mealPlan?.author?.name || mealPlanRaw.author_id?.name || 'unknown'}`
    const unifiedTags = Array.from(new Set([...(mealPlanRaw.tags || []), sourceTag]))

    return {
      title: cloneForm.title.trim() || mealPlanRaw.title,
      description: mealPlanRaw.description,
      duration: mealPlanRaw.duration,
      category: mealPlanRaw.category,
      target_calories: mealPlanRaw.target_calories,
      total_calories: mealPlanRaw.total_calories,
      target_protein: mealPlanRaw.target_protein,
      target_carbs: mealPlanRaw.target_carbs,
      target_fat: mealPlanRaw.target_fat,
      image: mealPlanRaw.image,
      is_public: cloneForm.isPublic,
      difficulty_level: mealPlanRaw.difficulty_level,
      price_range: mealPlanRaw.price_range,
      suitable_for: mealPlanRaw.suitable_for || [],
      restrictions: mealPlanRaw.restrictions || [],
      tags: unifiedTags,
      days: clonedDays
    }
  }

  const handleCloneMealPlan = async () => {
    const payload = buildClonePayload()
    if (!payload) {
      toast.error('Không thể chuẩn bị dữ liệu để sao chép')
      return
    }

    try {
      setCloneLoading(true)
      await createMealPlanApi(payload)
      toast.success('Đã thêm bản sao vào "Thực đơn của tôi"')
      triggerReload()
      setShowCloneModal(false)
      setEngagementStats((prev) => ({ ...prev, saves: prev.saves + 1 }))
      navigate('/meal-plan/my')
    } catch (error) {
      console.error('Clone meal plan failed', error)
      toast.error('Không thể sao chép thực đơn này')
    } finally {
      setCloneLoading(false)
    }
  }

  const handleLike = async () => {
    try {
      if (liked) {
        await unlikeMealPlanApi(id)
        setLikesCount(prev => Math.max(prev - 1, 0))
        setLiked(false)
        toast.success('Đã bỏ thích thực đơn!')
      } else {
        await likeMealPlanApi(id)
        setLikesCount(prev => prev + 1)
        setLiked(true)
        toast.success('Đã thích thực đơn!')
      }
    } catch (err) {
      toast.error('Không thể thực hiện thao tác này')
    }
  }

  const openCloneModal = () => {
    if (!mealPlanRaw) {
      toast.error('Đang chuẩn bị dữ liệu thực đơn, vui lòng thử lại sau')
      return
    }
    setCloneForm({
      title: `${mealPlanRaw.title || 'Thực đơn'} (bản sao)`
        .replace(/\s+/g, ' ')
        .trim(),
      isPublic: false
    })
    setShowCloneModal(true)
  }

  const openApplyModal = async () => {
    setShowApplyModal(true)
    setCheckingActiveSchedule(true)
    setStartDate(getCurrentDate())
    try {
      const schedule = await getActiveMealSchedule()
      setActiveSchedule(schedule)
      setApplyMode(schedule ? 'replace' : 'schedule')
    } catch (err) {
      console.error('Failed to fetch active schedule', err)
      setActiveSchedule(null)
      setApplyMode('schedule')
    } finally {
      setCheckingActiveSchedule(false)
    }
  }

  // Xác nhận áp dụng thực đơn
  const confirmApply = async () => {
    if (!mealPlan) return
    const selectedDate = applyMode === 'replace' ? getCurrentDate() : startDate

    try {
      setApplyLoading(true)
      await applyMealPlanApi(id, mealPlan.title, selectedDate)
      setShowApplyModal(false)
      setShowSuccessModal(true)
      triggerReload()
      setEngagementStats((prev) => ({ ...prev, applies: prev.applies + 1 }))
      toast.success('Đã áp dụng thực đơn thành công!')
    } catch (err) {
      console.error('Apply meal plan failed', err)
      toast.error('Không thể áp dụng thực đơn')
    } finally {
      setApplyLoading(false)
    }
  }

  // Chuyển hướng đến trang thực đơn đang áp dụng
  const goToMealSchedule = () => {
    setShowSuccessModal(false)
    navigate('/meal-plan/active')
  }

  const openShareModal = () => {
    setShareModalOpen(true)
  }

  const handleShareMealPlan = async () => {
    const caption = shareForm.content.trim()
    if (!caption) {
      toast.error('Vui lòng nhập nội dung chia sẻ')
      return
    }

    try {
      setShareLoading(true)
      await shareMealPlanApi({
        mealPlanId: id,
        content: caption,
        privacy: shareForm.privacy
      })
      toast.success('Đã chia sẻ thực đơn lên trang cá nhân')
      triggerReload()
      setShareModalOpen(false)
      setShareForm((prev) => ({ ...prev, content: '' }))
      setEngagementStats((prev) => ({ ...prev, shares: prev.shares + 1 }))
    } catch (error) {
      console.error('Share meal plan failed', error)
      toast.error('Không thể chia sẻ thực đơn')
    } finally {
      setShareLoading(false)
    }
  }

  const handlePrint = () => {
    window.print();
  };

  const scrollToComments = () => {
    commentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }).format(date);
  };

  // Hàm mở modal cách chế biến
  const handleOpenCookingModal = (meal) => {
    setActiveMeal(meal);
    setShowCookingModal(true);
  };

  // Hàm đóng modal cách chế biến
  const handleCloseCookingModal = () => {
    setShowCookingModal(false);
    setActiveMeal(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={() => navigate('/meal-plan')}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow"
          >
            Quay lại danh sách thực đơn
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6 px-4 md:px-6 print:px-0">
      {/* Back button - hide when printing */}
      <button 
        onClick={() => navigate('/meal-plan')}
        className="mb-6 flex items-center text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 print:hidden"
      >
        <FaArrowLeft className="mr-2" /> Quay lại danh sách thực đơn
      </button>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content - 2/3 width on desktop */}
        <div className="lg:col-span-2">
          {/* Header with image */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden mb-6">
            <div className="relative h-64 md:h-80">
              <img 
                src={mealPlan.image} 
                alt={mealPlan.title} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-6">
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  {mealPlan.title}
                </h1>
                <div className="flex items-center text-white mb-2">
                  <div className="flex mr-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FaStar 
                        key={star}
                        className={`w-4 h-4 ${star <= Math.round(mealPlan.rating) ? 'text-yellow-400' : 'text-gray-400'}`}
                      />
                    ))}
                    <span className="ml-1 text-sm">{mealPlan.rating} ({mealPlan.ratingCount})</span>
                  </div>
                  <span className="flex items-center text-sm mr-4">
                    <IoMdTime className="mr-1" /> {mealPlan.duration} ngày
                  </span>
                  <span className="text-sm bg-green-600 px-2 py-1 rounded-full">
                    {mealPlan.category}
                  </span>
                </div>
                <div className="flex items-center">
                  <img 
                    src={mealPlan.author.avatar} 
                    alt={mealPlan.author.name} 
                    className="w-8 h-8 rounded-full mr-2"
                  />
                  <div>
                    <div className="flex items-center">
                      <span className="text-white text-sm">{mealPlan.author.name}</span>
                      {mealPlan.author.isVerified && (
                        <FaCheckCircle className="ml-1 text-blue-500 w-3 h-3" />
                      )}
                    </div>
                    <span className="text-gray-300 text-xs">
                      {formatDate(mealPlan.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Description */}
            <div className="p-6">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {mealPlan.description}
              </p>
              {sourceMeta && (
                <div className="mb-4 p-3 rounded-lg bg-amber-50 text-amber-700 text-sm flex flex-wrap items-center gap-2">
                  <FaInfoCircle className="text-amber-500" />
                  <span>
                    Bản sao từ <strong>{sourceMeta.ownerName}</strong>
                  </span>
                  {sourceMeta.planId && (
                    <button
                      type="button"
                      onClick={() => navigate(`/meal-plan/${sourceMeta.planId}`)}
                      className="underline text-amber-600 hover:text-amber-700"
                    >
                      Xem thực đơn gốc
                    </button>
                  )}
                </div>
              )}
              
              {/* Action buttons */}
              <div className="flex flex-wrap gap-3 print:hidden">
                <button
                  type="button"
                  onClick={handleLike}
                  className={`flex items-center px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-600 transition-colors ${
                    liked
                      ? 'bg-red-50 border-red-200 text-red-600'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {liked ? <FaHeart className="mr-1" /> : <FaRegHeart className="mr-1" />}
                  <span>Thích ({likesCount})</span>
                </button>

                <button
                  type="button"
                  onClick={scrollToComments}
                  className="flex items-center px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <FaRegComment className="mr-1" />
                  <span>Bình luận ({mealPlan.comments})</span>
                </button>

                <button
                  type="button"
                  onClick={openShareModal}
                  className="flex items-center px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <FaShare className="mr-1" />
                  <span>Chia sẻ</span>
                </button>

                <button
                  type="button"
                  onClick={openCloneModal}
                  className="flex items-center px-3 py-1.5 rounded-full border border-green-300 text-green-700 bg-green-50 hover:bg-green-100"
                >
                  <FaClipboardList className="mr-1" />
                  <span>Lưu vào Thực đơn của tôi</span>
                </button>

                <button
                  type="button"
                  onClick={openApplyModal}
                  className="flex items-center px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <FaCalendarAlt className="mr-1" />
                  <span>Áp dụng thực đơn</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <FaPrint className="mr-1" />
                  <span>In</span>
                </button>

                {isOwner && (
                  <button
                    type="button"
                    onClick={() => navigate(`/meal-plan/my?planId=${mealPlan?.id}`)}
                    className="flex items-center px-3 py-1.5 rounded-full border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100"
                  >
                    <FaEdit className="mr-1" />
                    <span>Chỉnh sửa thực đơn</span>
                  </button>
                )}
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <FaClipboardList className="text-green-600" />
                  <div>
                    <p className="font-semibold">{engagementStats.saves}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Người đã lưu</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <FaShare className="text-blue-600" />
                  <div>
                    <p className="font-semibold">{engagementStats.shares}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Lượt chia sẻ</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <FaCalendarAlt className="text-emerald-600" />
                  <div>
                    <p className="font-semibold">{engagementStats.applies}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Đang áp dụng</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Notes section */}
          {mealPlan.notes && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Ghi chú</h2>
              <div 
                className="prose max-w-none dark:prose-invert" 
                dangerouslySetInnerHTML={{ __html: mealPlan.notes }}
              />
            </div>
          )}
          
          {/* Daily meal plans */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <MdFastfood className="mr-2 text-green-600" /> Kế hoạch bữa ăn theo ngày
            </h2>
            
            {/* Thay đổi từ nút ngày sang select dropdown */}
            <div className="mb-6">
              <div className="max-w-xs mx-auto">
                <label htmlFor="day-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Chọn ngày thực đơn (Tổng số ngày: {mealPlan.duration})
                </label>
                <div className="relative">
                  <select
                    id="day-select"
                    className="block w-full p-3 pl-4 pr-10 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:focus:ring-green-600 dark:focus:border-green-600 appearance-none transition-colors"
                    value={activeDay}
                    onChange={(e) => setActiveDay(Number(e.target.value))}
                  >
                    {mealPlan.days.map((day) => (
                      <option key={day.day} value={day.day}>
                        Ngày {day.day} - {day.day === 1 ? 'Bắt đầu' : day.day === mealPlan.duration ? 'Kết thúc' : `Ngày ${day.day}/${mealPlan.duration}`}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                </div>
                {/* <div className="mt-2 flex flex-wrap gap-2">
                  {mealPlan.days.map((day) => (
                    <button 
                      key={day.day}
                      onClick={() => setActiveDay(day.day)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                        activeDay === day.day 
                          ? 'bg-green-600 text-white shadow-md' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {day.day}
                    </button>
                  ))}
                </div> */}
              </div>
            </div>
            
            {/* Active day meals */}
            {mealPlan.days.map((day) => (
              day.day === activeDay && (
                <DayMealPlan 
                  key={day.day} 
                  day={day} 
                  onViewCooking={handleOpenCookingModal} 
                />
              )
            ))}
          </div>
          
          {/* Comments section */}
          <div ref={commentsRef} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <FaRegComment className="mr-2 text-green-600" /> Bình luận
            </h2>
            <Comments mealPlanId={id} />
          </div>
        </div>
        
        {/* Sidebar - 1/3 width on desktop */}
        <div className="lg:col-span-1 space-y-6">
          {/* Nutrition summary card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Thông tin dinh dưỡng</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Trung bình mỗi ngày
            </p>
            
            {/* Nutrition data */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Calories</p>
                <p className="text-xl font-bold text-gray-800 dark:text-white">{mealPlan.averageNutrition.calories}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">kcal/ngày</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Protein</p>
                <p className="text-xl font-bold text-gray-800 dark:text-white">{mealPlan.averageNutrition.protein}g</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{Math.round(mealPlan.averageNutrition.protein * 4 / mealPlan.averageNutrition.calories * 100)}%</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Carbs</p>
                <p className="text-xl font-bold text-gray-800 dark:text-white">{mealPlan.averageNutrition.carbs}g</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{Math.round(mealPlan.averageNutrition.carbs * 4 / mealPlan.averageNutrition.calories * 100)}%</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Chất béo</p>
                <p className="text-xl font-bold text-gray-800 dark:text-white">{mealPlan.averageNutrition.fat}g</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{Math.round(mealPlan.averageNutrition.fat * 9 / mealPlan.averageNutrition.calories * 100)}%</p>
              </div>
            </div>
            
          </div>
          
          {/* Friends applying placeholder */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FaUserFriends className="text-green-600" />
                Bạn bè đang áp dụng
              </h3>
              <span className="text-xs text-gray-500">Sắp ra mắt</span>
            </div>
            {friendsApplying.length > 0 ? (
              <ul className="space-y-3">
                {friendsApplying.map((friend) => (
                  <li key={friend.id} className="flex items-center gap-3">
                    <img src={friend.avatar} alt={friend.name} className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{friend.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Đang áp dụng đến ngày {friend.until}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                Kết nối bạn bè để xem ai đang áp dụng thực đơn này cùng bạn. Chúng tôi sẽ kích hoạt trung tâm bạn bè sau khi hoàn tất tính năng quản lý thực đơn.
              </div>
            )}
            <button
              type="button"
              onClick={() => toast.info('Tính năng kết bạn sẽ sớm được cập nhật')}
              className="mt-4 w-full px-4 py-2 border border-green-300 text-green-700 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30"
            >
              Mời bạn bè tham gia
            </button>
          </div>
        </div>
      </div>

      {/* Modal tạo bản sao */}
      {showCloneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Lưu về "Thực đơn của tôi"</h3>
              <button
                type="button"
                onClick={() => setShowCloneModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
              >
                <MdClose size={24} />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Một bản sao đầy đủ của "{mealPlan?.title}" sẽ được thêm vào danh sách thực đơn cá nhân của bạn. Bạn có thể tùy chỉnh lại từng ngày sau khi lưu.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tên bản sao
                </label>
                <input
                  type="text"
                  value={cloneForm.title}
                  onChange={(e) => setCloneForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Ví dụ: Thực đơn Keto (biến thể cá nhân)"
                />
              </div>
              <div className="flex items-center justify-between border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Chế độ công khai</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Bật để chia sẻ bản sao đến cộng đồng</p>
                </div>
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={cloneForm.isPublic}
                    onChange={(e) => setCloneForm((prev) => ({ ...prev, isPublic: e.target.checked }))}
                  />
                  <span className={`w-12 h-6 flex items-center rounded-full p-1 ${cloneForm.isPublic ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                    <span className={`bg-white w-4 h-4 rounded-full shadow transform transition ${cloneForm.isPublic ? 'translate-x-6' : ''}`}></span>
                  </span>
                </label>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleCloneMealPlan}
                disabled={cloneLoading}
                className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-60"
              >
                {cloneLoading ? 'Đang sao chép...' : 'Tạo bản sao ngay'}
              </button>
              <button
                type="button"
                onClick={() => setShowCloneModal(false)}
                className="w-full py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium"
              >
                Để sau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal chia sẻ */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Chia sẻ thực đơn</h3>
              <button
                type="button"
                onClick={() => setShareModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
              >
                <MdClose size={24} />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Nội dung chia sẻ sẽ hiển thị trên trang cá nhân của bạn cùng liên kết đến thực đơn.
            </p>
            <textarea
              rows={4}
              value={shareForm.content}
              onChange={(e) => setShareForm((prev) => ({ ...prev, content: e.target.value }))}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Chia sẻ cảm nhận của bạn về thực đơn này..."
            />
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quyền riêng tư</label>
              <select
                value={shareForm.privacy}
                onChange={(e) => setShareForm((prev) => ({ ...prev, privacy: e.target.value }))}
                className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="0">Công khai</option>
                <option value="1">Bạn bè</option>
                <option value="2">Chỉ mình tôi</option>
              </select>
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleShareMealPlan}
                disabled={shareLoading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-60"
              >
                {shareLoading ? 'Đang chia sẻ...' : 'Đăng lên trang cá nhân'}
              </button>
              <button
                type="button"
                onClick={() => setShareModalOpen(false)}
                className="w-full py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Áp dụng thực đơn */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Áp dụng thực đơn</h3>
              <button 
                onClick={() => setShowApplyModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <MdClose size={24} />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <MdSchedule className="text-blue-600 dark:text-blue-400 text-3xl" />
              </div>
              {checkingActiveSchedule ? (
                <p className="text-center text-sm text-gray-500">Đang kiểm tra lịch hiện tại...</p>
              ) : activeSchedule ? (
                <div className="mb-4 bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg text-sm text-orange-700 dark:text-orange-200">
                  Bạn đang áp dụng "{activeSchedule.title}". Bạn muốn thay thế bằng thực đơn này chứ?
                </div>
              ) : (
                <p className="text-gray-700 dark:text-gray-300 mb-4 text-center">
                  Chọn ngày bắt đầu áp dụng "{mealPlan.title}"
                </p>
              )}

              <div className="space-y-3 mb-4">
                <label className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="radio"
                    name="apply_mode"
                    value="replace"
                    checked={applyMode === 'replace'}
                    onChange={() => setApplyMode('replace')}
                    disabled={!activeSchedule}
                    className="mt-1"
                  />
                  <span>
                    Thay thế lịch hiện tại
                    <span className="block text-xs text-gray-500">Chúng tôi sẽ tạo lịch mới và đánh dấu lịch cũ là đã hoàn thành.</span>
                  </span>
                </label>
                <label className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="radio"
                    name="apply_mode"
                    value="schedule"
                    checked={applyMode === 'schedule'}
                    onChange={() => setApplyMode('schedule')}
                    className="mt-1"
                  />
                  <span>
                    Lên lịch bắt đầu mới
                    <span className="block text-xs text-gray-500">Giữ lịch cũ và chọn ngày bắt đầu cho thực đơn này.</span>
                  </span>
                </label>
              </div>

              {applyMode === 'schedule' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ngày bắt đầu:
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={getCurrentDate()}
                    className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              )}
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg mb-4">
                <div className="flex items-start">
                  <FaBell className="text-yellow-600 dark:text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    Bạn sẽ nhận được nhắc nhở hàng ngày về các bữa ăn theo thực đơn này. Bạn có thể điều chỉnh thiết lập nhắc nhở trong phần Cài đặt.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col space-y-3">
              <button 
                onClick={confirmApply}
                disabled={applyLoading || (applyMode === 'schedule' && !startDate)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex justify-center items-center disabled:opacity-60"
              >
                <FaCalendarAlt className="mr-2" />
                {applyLoading ? 'Đang áp dụng...' : 'Áp dụng thực đơn'}
              </button>
              <button 
                onClick={() => setShowApplyModal(false)}
                className="w-full py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium transition-colors"
              >
                Để sau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Áp dụng thành công */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCheckSquare className="text-green-600 dark:text-green-400 text-3xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Áp dụng thành công!
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Thực đơn "{mealPlan.title}" đã được áp dụng từ ngày {new Date(startDate).toLocaleDateString('vi-VN')}
              </p>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
              <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center">
                <FaClipboardList className="mr-2" /> Tiếp theo bạn có thể:
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
                  <span className="text-blue-800 dark:text-blue-300">Xem lịch thực đơn hàng ngày của bạn</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
                  <span className="text-blue-800 dark:text-blue-300">Đánh dấu các bữa ăn đã hoàn thành</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
                  <span className="text-blue-800 dark:text-blue-300">Ghi chú cảm nhận về mỗi món ăn</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
                  <span className="text-blue-800 dark:text-blue-300">Theo dõi tiến trình áp dụng thực đơn</span>
                </li>
              </ul>
            </div>
            
            <div className="flex flex-col space-y-3">
              <button 
                onClick={goToMealSchedule}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex justify-center items-center"
              >
                <MdDateRange className="mr-2" />
                Xem thực đơn đang áp dụng
              </button>
              <button 
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium transition-colors"
              >
                Ở lại trang này
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal hiển thị cách chế biến */}
      {showCookingModal && activeMeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white dark:bg-gray-800 pb-2 border-b dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <FaUtensils className="text-green-600 mr-2" /> 
                Cách chế biến: {activeMeal.type}
              </h3>
              <button 
                onClick={handleCloseCookingModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <MdClose size={24} />
              </button>
            </div>
            
            <div className="mb-4">
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Thành phần:</h4>
              <div className="bg-gray-50 dark:bg-gray-750 p-3 rounded-lg mb-4">
                {Array.isArray(activeMeal.ingredients) && activeMeal.ingredients.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300 text-sm">
                    {activeMeal.ingredients.map((ingredient, index) => (
                      <li key={`${ingredient.name}-${index}`}>
                        {ingredient.name}
                        {(() => {
                          const measurement = [ingredient.amount, ingredient.unit]
                            .filter((value) => Boolean(value && String(value).trim()))
                            .join(' ')
                          return measurement ? ` - ${measurement}` : ''
                        })()}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-700 dark:text-gray-300">{activeMeal.content}</p>
                )}
              </div>
            </div>
            
            <div className="mb-4">
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Thông tin dinh dưỡng:</h4>
              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="bg-gray-50 dark:bg-gray-750 p-2 rounded text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Calories</p>
                  <p className="font-bold text-gray-800 dark:text-white">{activeMeal.calories}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-750 p-2 rounded text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Protein</p>
                  <p className="font-bold text-gray-800 dark:text-white">{activeMeal.protein}g</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-750 p-2 rounded text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Carbs</p>
                  <p className="font-bold text-gray-800 dark:text-white">{activeMeal.carbs}g</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-750 p-2 rounded text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Chất béo</p>
                  <p className="font-bold text-gray-800 dark:text-white">{activeMeal.fat}g</p>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Hướng dẫn chi tiết:</h4>
              {Array.isArray(activeMeal.cookingSteps) && activeMeal.cookingSteps.length > 0 ? (
                <ol className="list-decimal pl-5 space-y-3 text-gray-700 dark:text-gray-200 text-sm bg-gray-50 dark:bg-gray-750 p-4 rounded-lg">
                  {activeMeal.cookingSteps.map((step, index) => (
                    <li key={`cooking-step-${index}`} className="leading-relaxed">
                      <span className="font-semibold text-green-700 dark:text-green-300 mr-2">Bước {index + 1}:</span>
                      {step}
                    </li>
                  ))}
                </ol>
              ) : (
                <div
                  className="prose prose-sm max-w-none dark:prose-invert bg-gray-50 dark:bg-gray-750 p-4 rounded-lg"
                  dangerouslySetInnerHTML={{ __html: activeMeal.cooking }}
                />
              )}
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleCloseCookingModal}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}