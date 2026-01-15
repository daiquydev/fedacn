import { useEffect, useMemo, useRef, useState } from 'react'
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaChevronLeft,
  FaTimes,
  FaTimesCircle,
  FaFireAlt,
  FaUtensils,
  FaOilCan,
  FaDrumstickBite,
  FaBreadSlice,
  FaShareAlt,
  FaHeart,
  FaUserFriends,
  FaBookOpen
} from 'react-icons/fa'
import { GiWheat } from 'react-icons/gi'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  getActiveMealSchedule,
  deleteUserMealSchedule,
  completeMealItem,
  skipMealItem,
  getScheduleMealsByDay
} from '../../../services/userMealScheduleService'
import { getRecipeForUser } from '../../../apis/recipeApi'
import Loading from '../../../components/GlobalComponents/Loading'
import { getImageUrl } from '../../../utils/imageUrl'

const STATUS_BADGES = {
  0: { label: 'Đang áp dụng', className: 'bg-emerald-100 text-emerald-700' },
  1: { label: 'Hoàn thành', className: 'bg-blue-100 text-blue-700' },
  2: { label: 'Tạm dừng', className: 'bg-amber-100 text-amber-700' },
  3: { label: 'Hủy', className: 'bg-gray-200 text-gray-600' }
}

const MEAL_PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80'

const formatDate = (value) => {
  if (!value) return 'Không xác định'
  const date = new Date(value)
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date)
}

const formatShortDate = (value) => {
  if (!value) return ''
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit'
  }).format(new Date(value))
}

const summarizeMeals = (meals = []) => {
  if (!Array.isArray(meals) || !meals.length) {
    return { calories: 0, protein: 0, carbs: 0, fat: 0 }
  }
  return meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + (meal.calories || meal.recipe_id?.calories || 0),
      protein: acc.protein + (meal.protein || meal.recipe_id?.protein || 0),
      carbs: acc.carbs + (meal.carbs || meal.recipe_id?.carbohydrate || 0),
      fat: acc.fat + (meal.fat || meal.recipe_id?.fat || 0)
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )
}

const getDayNumber = (startDate, dateValue) => {
  if (!startDate || !dateValue) return null
  const start = new Date(startDate)
  const current = new Date(dateValue)
  const diffDays = Math.round((current.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1
  return diffDays > 0 ? diffDays : 1
}

const clampProgress = (value) => {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(160, Math.round(value)))
}

const getDateKey = (value) => {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getPreferredDate = (...candidates) => {
  for (const candidate of candidates) {
    const normalized = getDateKey(candidate)
    if (normalized) return normalized
  }
  return ''
}

const buildPlanDateKeys = (startDate, duration) => {
  const normalizedStart = getDateKey(startDate)
  if (!normalizedStart || !Number.isFinite(duration) || duration <= 0) return []
  const start = new Date(normalizedStart)
  return Array.from({ length: duration }, (_, index) => {
    const next = new Date(start)
    next.setDate(start.getDate() + index)
    return getDateKey(next)
  })
}

const MEAL_TYPE_LABELS = {
  breakfast: 'Sáng',
  morning: 'Sáng',
  brunch: 'Sáng',
  lunch: 'Trưa',
  dinner: 'Tối',
  supper: 'Tối',
  snack: 'Snack',
  dessert: 'Tráng miệng',
  default: 'Bữa ăn'
}

const getMealTypeLabel = (value) => {
  if (!value) return MEAL_TYPE_LABELS.default
  const normalized = String(value).toLowerCase().trim()
  return MEAL_TYPE_LABELS[normalized] || value || MEAL_TYPE_LABELS.default
}
const getDefaultMealTime = (label) => {
  switch (label) {
    case 'Sáng':
      return '06:30'
    case 'Trưa':
      return '12:30'
    case 'Tối':
      return '18:30'
    case 'Xế':
    case 'Snack':
      return '15:30'
    default:
      return '08:00'
  }
}

const resolveRecipeId = (meal) => {
  if (!meal) return null

  // Accept direct primitive values
  if (typeof meal.recipe_id === 'string' || typeof meal.recipe_id === 'number') {
    return String(meal.recipe_id)
  }

  // Support nested recipe object shapes
  const candidates = [
    meal.recipe_id,
    meal.recipe,
    meal.recipe_id?.recipe,
    meal.recipe_id?.recipe_id
  ].filter(Boolean)

  for (const ref of candidates) {
    if (!ref) continue
    if (typeof ref === 'string' || typeof ref === 'number') return String(ref)
    if (ref._id?.$oid) return String(ref._id.$oid)
    if (ref._id) return String(ref._id)
    if (ref.id) return String(ref.id)
    if (ref.recipe_id) return String(ref.recipe_id)
    if (ref.recipeId) return String(ref.recipeId)
  }

  return null
}

const resolveCookingHtml = (meal) => {
  if (!meal) return ''
  const candidates = [
    meal.instructions,
    meal.recipe_id?.instructions,
    meal.recipe_id?.content,
    meal.description,
    meal.recipe_id?.description
  ]
    .filter(Boolean)
    .map((value) => {
      if (Array.isArray(value)) {
        return value
          .map((step) => (typeof step === 'string' ? step.trim() : ''))
          .filter(Boolean)
          .join('\n')
      }
      return value
    })
  return candidates.find((html) => typeof html === 'string' && html.trim()) || ''
}

const normalizeMealItem = (meal, index = 0) => {
  if (!meal) return null

  const recipe = meal.recipe_id || meal.recipe || null
  const mealTypeLabel = getMealTypeLabel(meal.meal_type || meal.type || recipe?.meal_type)
  const fallbackTitle =
    meal.custom_name || meal.meal_name || meal.name || recipe?.title || mealTypeLabel || 'Bữa ăn'

  const normalizedRecipe =
    recipe && typeof recipe === 'object'
      ? {
          ...recipe,
          _id: recipe._id || recipe.id,
          title: recipe.title || fallbackTitle,
          image: recipe.image || recipe.hero_image || meal.image,
          hero_image: recipe.hero_image || recipe.image || meal.image,
          calories: recipe.calories ?? recipe.energy ?? recipe.kcal,
          protein: recipe.protein ?? recipe.proteins,
          carbohydrate: recipe.carbohydrate ?? recipe.carbs,
          fat: recipe.fat ?? recipe.fats,
          summary: recipe.summary || recipe.description || meal.notes || ''
        }
      : recipe

  const normalizedStatus = (() => {
    if (typeof meal.status === 'string') return meal.status
    if (Number.isFinite(Number(meal.status))) return Number(meal.status)
    return 'pending'
  })()

  return {
    ...meal,
    _id: meal._id || meal.id || meal.meal_item_id || `meal-${index}`,
    meal_type: mealTypeLabel,
    custom_name: fallbackTitle,
    meal_name: fallbackTitle,
    schedule_time: meal.schedule_time || meal.scheduled_time || getDefaultMealTime(mealTypeLabel),
    recipe_id: normalizedRecipe,
    calories: meal.calories ?? normalizedRecipe?.calories ?? 0,
    protein: meal.protein ?? normalizedRecipe?.protein ?? 0,
    carbs: meal.carbs ?? normalizedRecipe?.carbohydrate ?? 0,
    fat: meal.fat ?? normalizedRecipe?.fat ?? 0,
    notes: meal.notes || normalizedRecipe?.summary || '',
    status: normalizedStatus
  }
}

const normalizeMeals = (meals = []) => meals.map((meal, index) => normalizeMealItem(meal, index)).filter(Boolean)

const extractRecipeDocument = (payload) => {
  if (!payload) return null
  if (Array.isArray(payload?.recipe)) return payload.recipe[0] || null
  if (payload?.recipe && typeof payload.recipe === 'object') return payload.recipe
  if (Array.isArray(payload)) return payload[0] || null
  return payload
}

const hasHtmlContent = (value) => typeof value === 'string' && /<[^>]+>/.test(value)

const buildCookingModalData = (meal, recipeDoc, fallbackInstructions = '') => {
  if (!meal && !recipeDoc && !fallbackInstructions) return null

  const fallbackTitle = meal?.custom_name || meal?.meal_name || meal?.name || 'Cách chế biến'
  const title = recipeDoc?.title || fallbackTitle

  const ingredients = Array.isArray(recipeDoc?.ingredients) && recipeDoc.ingredients.length
    ? recipeDoc.ingredients
    : Array.isArray(meal?.recipe_id?.ingredients) && meal.recipe_id.ingredients.length
    ? meal.recipe_id.ingredients
    : []

  const rawInstructions =
    recipeDoc?.instructions ||
    recipeDoc?.steps ||
    meal?.instructions ||
    meal?.recipe_id?.instructions ||
    meal?.recipe_id?.steps ||
    fallbackInstructions ||
    recipeDoc?.content ||
    meal?.recipe_id?.content ||
    meal?.notes ||
    ''

  let htmlContent = ''
  let instructionSteps = []

  if (Array.isArray(rawInstructions)) {
    instructionSteps = rawInstructions
      .map((step) => (typeof step === 'string' ? step.trim() : ''))
      .filter(Boolean)
  } else if (typeof rawInstructions === 'string') {
    const normalizedInstructions = rawInstructions.replace(/<br\s*\/?\>/gi, '\n')
    const containsHtml = hasHtmlContent(rawInstructions)
    if (containsHtml && !(recipeDoc?.instructions && recipeDoc.instructions.length)) {
      htmlContent = rawInstructions
    } else {
      instructionSteps = normalizedInstructions
        .split(/\r?\n/)
        .map((step) => step.trim())
        .filter(Boolean)
    }
  }

  const calories =
    recipeDoc?.energy ??
    recipeDoc?.calories ??
    recipeDoc?.nutrition?.calories ??
    meal?.calories ??
    meal?.recipe_id?.calories ??
    0
  const protein =
    recipeDoc?.protein ??
    recipeDoc?.nutrition?.protein ??
    meal?.protein ??
    meal?.recipe_id?.protein ??
    0
  const carbs =
    recipeDoc?.carbohydrate ??
    recipeDoc?.carbs ??
    recipeDoc?.nutrition?.carbs ??
    meal?.carbs ??
    meal?.recipe_id?.carbs ??
    meal?.recipe_id?.carbohydrate ??
    0
  const fat =
    recipeDoc?.fat ??
    recipeDoc?.nutrition?.fat ??
    meal?.fat ??
    meal?.recipe_id?.fat ??
    0

  return {
    title,
    description: recipeDoc?.description || meal?.description || meal?.notes || '',
    cookingTime: recipeDoc?.time || meal?.recipe_id?.time || meal?.time || '',
    ingredients,
    htmlContent,
    instructionSteps,
    nutrition: { calories, protein, carbs, fat },
    hasNutrition: [calories, protein, carbs, fat].some((value) => Number(value) > 0),
    servings: recipeDoc?.quantity ? `${recipeDoc.quantity} ${recipeDoc.unit || ''}`.trim() : '',
    image: recipeDoc?.image || recipeDoc?.hero_image || meal?.recipe_id?.image || meal?.image,
    video: typeof recipeDoc?.video === 'string' ? recipeDoc.video : ''
  }
}

const mergeRecipeIntoMeal = (meal, recipe) => {
  const mergedRecipe = {
    ...(meal.recipe_id && typeof meal.recipe_id === 'object' ? meal.recipe_id : {}),
    ...(recipe || {})
  }

  const patchedMeal = {
    ...meal,
    recipe_id: {
      ...mergedRecipe,
      image: mergedRecipe.image || mergedRecipe.hero_image || meal.image || mergedRecipe.thumbnail,
      hero_image: mergedRecipe.hero_image || mergedRecipe.image || meal.image,
      title: mergedRecipe.title || meal.custom_name || meal.meal_name || meal.name
    },
    image: meal.image || mergedRecipe.image || mergedRecipe.hero_image
  }

  return normalizeMealItem(patchedMeal)
}

const ActiveMealPlan = () => {
  const [loading, setLoading] = useState(true)
  const [scheduleDetail, setScheduleDetail] = useState(null)
  const [linkedPlan, setLinkedPlan] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [overviewStats, setOverviewStats] = useState(null)
  const [progressReport, setProgressReport] = useState(null)
  const [timelineDates, setTimelineDates] = useState([])
  const [todaySummary, setTodaySummary] = useState(null)
  const [metaInfo, setMetaInfo] = useState(null)
  const [cookingModal, setCookingModal] = useState(null)
  const recipeCacheRef = useRef(new Map())
  const [cancelling, setCancelling] = useState(false)
  const [dynamicMealsByDate, setDynamicMealsByDate] = useState({})
  const todayKey = useMemo(() => getDateKey(new Date()), [])
  const isFutureSelectedDate = useMemo(() => selectedDate && todayKey && selectedDate > todayKey, [selectedDate, todayKey])
  const navigate = useNavigate()
  const pendingMealDatesRef = useRef(new Set())

  const fetchActiveSchedule = async () => {
    try {
      setLoading(true)
      const activeSummary = await getActiveMealSchedule()
      const detail = activeSummary?.schedule

      if (!detail) {
        setErrorMessage('Bạn chưa áp dụng thực đơn nào gần đây. Hãy áp dụng một thực đơn để bắt đầu theo dõi.')
        setScheduleDetail(null)
        setLinkedPlan(null)
        setOverviewStats(null)
        setProgressReport(null)
        setTimelineDates([])
        setTodaySummary(null)
        setMetaInfo(null)
        setSelectedDate('')
        return
      }

      setScheduleDetail(detail)
      setLinkedPlan(detail.meal_plan_id || null)
      setOverviewStats(activeSummary?.overview || null)
      setProgressReport(activeSummary?.overview || null)
      const normalizedTimeline = (activeSummary?.timeline_dates || []).map(getDateKey).filter(Boolean)
      setTimelineDates(normalizedTimeline)
      const normalizedTodayMeals = normalizeMeals(activeSummary?.today?.meals || [])
      setTodaySummary(
        activeSummary?.today
          ? { ...activeSummary.today, date: getDateKey(activeSummary.today.date), meals: normalizedTodayMeals }
          : null
      )
      setMetaInfo(activeSummary?.meta || null)

      const fallbackDates = Object.keys(detail?.meals_by_date || {})
        .map(getDateKey)
        .filter(Boolean)
        .sort()
      const primaryDates = normalizedTimeline.length ? normalizedTimeline : fallbackDates
      const planDayCount =
        detail?.duration ||
        detail?.meal_plan_id?.duration ||
        detail?.meal_plan_id?.days?.length ||
        primaryDates.length ||
        0
      const syntheticPlanDates = buildPlanDateKeys(
        detail?.start_date || detail?.startDate || detail?.applied_start_date,
        planDayCount
      )
      const candidateDates = Array.from(new Set([...primaryDates, ...syntheticPlanDates])).filter(Boolean)
      const initialDate =
        getDateKey(activeSummary?.today?.date) ||
        (candidateDates.includes(todayKey) ? todayKey : '') ||
        candidateDates[0] ||
        syntheticPlanDates[0] ||
        getPreferredDate(detail?.start_date, detail?.startDate, detail?.applied_start_date)
      setSelectedDate(initialDate)
      setErrorMessage('')
    } catch (error) {
      console.error('Error fetching active meal schedule detail:', error)
      setErrorMessage('Không thể tải thực đơn đang áp dụng. Vui lòng thử lại sau.')
      setTimelineDates([])
      setTodaySummary(null)
      setMetaInfo(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActiveSchedule()
  }, [])

  const mealsByDate = useMemo(() => {
    if (!scheduleDetail?.meals_by_date) return {}
    const startKey = getPreferredDate(
      scheduleDetail.start_date,
      scheduleDetail.startDate,
      scheduleDetail.applied_start_date
    )
    return Object.entries(scheduleDetail.meals_by_date).reduce((acc, [dateKey, meals]) => {
      const normalizedKey = getDateKey(dateKey)
      if (normalizedKey) {
        acc[normalizedKey] = normalizeMeals(meals || [])
        return acc
      }

      const numericDay = Number(dateKey)
      if (Number.isFinite(numericDay) && numericDay > 0 && startKey) {
        const start = new Date(startKey)
        if (!Number.isNaN(start.getTime())) {
          const dt = new Date(start)
          dt.setDate(start.getDate() + (numericDay - 1))
          const computedKey = getDateKey(dt)
          if (computedKey) {
            acc[computedKey] = normalizeMeals(meals || [])
          }
        }
      }
      return acc
    }, {})
  }, [scheduleDetail])

  useEffect(() => {
    setDynamicMealsByDate({})
    pendingMealDatesRef.current = new Set()
  }, [scheduleDetail?._id])

  const resolvedMealsByDate = useMemo(() => {
    if (!Object.keys(dynamicMealsByDate).length) return mealsByDate
    return { ...mealsByDate, ...dynamicMealsByDate }
  }, [mealsByDate, dynamicMealsByDate])

  const scheduleStartDate = useMemo(() => {
    if (!scheduleDetail) return ''
    return getPreferredDate(
      scheduleDetail.start_date,
      scheduleDetail.startDate,
      scheduleDetail.applied_start_date,
      Object.keys(resolvedMealsByDate)[0]
    )
  }, [scheduleDetail, resolvedMealsByDate])

  const scheduleEndDate = useMemo(() => {
    if (!scheduleDetail) return ''
    const explicitEnd = getPreferredDate(scheduleDetail.end_date, scheduleDetail.endDate)
    if (explicitEnd) return explicitEnd

    if (scheduleStartDate && scheduleDetail.duration) {
      const start = new Date(scheduleStartDate)
      const end = new Date(start)
      end.setDate(start.getDate() + (scheduleDetail.duration - 1))
      return getDateKey(end)
    }

    const existingDates = Object.keys(resolvedMealsByDate).sort()
    return existingDates[existingDates.length - 1] || ''
  }, [scheduleDetail, scheduleStartDate, resolvedMealsByDate])

  useEffect(() => {
    if (!selectedDate || !scheduleDetail?._id) return

    const hasSourceMeals = Array.isArray(mealsByDate[selectedDate])
    const hasFetchedMeals = Object.prototype.hasOwnProperty.call(dynamicMealsByDate, selectedDate)
    if (hasSourceMeals || hasFetchedMeals || pendingMealDatesRef.current.has(selectedDate)) return

    const dayNumber = getDayNumber(scheduleStartDate, selectedDate)
    let isActive = true
    pendingMealDatesRef.current.add(selectedDate)

    const fetchMealsForSelectedDate = async () => {
      try {
        const meals = await getScheduleMealsByDay({
          scheduleId: scheduleDetail._id,
          dayNumber: Number.isFinite(dayNumber) ? dayNumber : undefined,
          date: Number.isFinite(dayNumber) ? undefined : selectedDate
        })
        if (isActive) {
          setDynamicMealsByDate((prev) => ({
            ...prev,
            [selectedDate]: Array.isArray(meals) ? normalizeMeals(meals) : []
          }))
        }
      } catch (error) {
        console.error('Error fetching meals for selected date:', error)
      } finally {
        pendingMealDatesRef.current.delete(selectedDate)
      }
    }

    fetchMealsForSelectedDate()

    return () => {
      isActive = false
    }
  }, [selectedDate, scheduleDetail?._id, mealsByDate, dynamicMealsByDate, scheduleStartDate])

  const planDayCount = useMemo(() => {
    if (scheduleDetail?.duration) return scheduleDetail.duration
    if (linkedPlan?.duration) return linkedPlan.duration
    if (Array.isArray(linkedPlan?.days) && linkedPlan.days.length) return linkedPlan.days.length
    if (timelineDates?.length) return timelineDates.length
    return Object.keys(resolvedMealsByDate).length
  }, [scheduleDetail, linkedPlan, timelineDates, resolvedMealsByDate])

  const syntheticPlanDates = useMemo(
    () => buildPlanDateKeys(scheduleStartDate, planDayCount),
    [scheduleStartDate, planDayCount]
  )

  const sortedDates = useMemo(() => {
    const actualDates = Object.keys(resolvedMealsByDate)
    const combined = new Set([...actualDates, ...syntheticPlanDates].filter(Boolean))
    return Array.from(combined).sort()
  }, [resolvedMealsByDate, syntheticPlanDates])

  const planMealsByDay = useMemo(() => {
    if (!Array.isArray(linkedPlan?.days)) return {}
    return linkedPlan.days.reduce((acc, day, index) => {
      const numericDay = Number(day.day_number)
      const dayNumber = Number.isFinite(numericDay) && numericDay > 0 ? numericDay : index + 1
      const normalizedMeals = (day.meals || []).map((meal, index) => {
        const recipe = meal.recipe_id || {}
        const mealTypeLabel = getMealTypeLabel(meal.meal_type || meal.type || recipe.meal_type)
        const fallbackTitle = meal.name || recipe.title || mealTypeLabel
        const normalizedRecipe = recipe && typeof recipe === 'object'
          ? {
              ...recipe,
              _id: recipe._id || recipe.id,
              title: recipe.title || fallbackTitle,
              image: recipe.image || meal.image,
              hero_image: recipe.hero_image || meal.image,
              calories: recipe.calories || recipe.energy,
              protein: recipe.protein,
              carbohydrate: recipe.carbohydrate,
              fat: recipe.fat,
              summary: recipe.summary || recipe.description || meal.notes || ''
            }
          : undefined

        return {
          _id: meal._id || normalizedRecipe?._id || `plan-${dayNumber}-${index}`,
          meal_type: mealTypeLabel,
          custom_name: fallbackTitle,
          meal_name: fallbackTitle,
          schedule_time: meal.schedule_time || getDefaultMealTime(mealTypeLabel),
          recipe_id: normalizedRecipe,
          calories: meal.calories || normalizedRecipe?.calories || 0,
          protein: meal.protein || normalizedRecipe?.protein || 0,
          carbs: meal.carbs || normalizedRecipe?.carbohydrate || 0,
          fat: meal.fat || normalizedRecipe?.fat || 0,
          notes: meal.notes || normalizedRecipe?.summary || '',
          image: meal.image || normalizedRecipe?.image || normalizedRecipe?.hero_image,
          status: 'planned',
          isPlanFallback: true
        }
      })

      acc[dayNumber] = normalizedMeals
      return acc
    }, {})
  }, [linkedPlan])

  useEffect(() => {
    const planStart = scheduleStartDate || sortedDates[0] || ''
    const planEnd = scheduleEndDate || sortedDates[sortedDates.length - 1] || ''
    const isWithinPlanRange = (dateKey) => {
      if (!dateKey) return false
      if (planStart && dateKey < planStart) return false
      if (planEnd && dateKey > planEnd) return false
      return true
    }

    if (!sortedDates.length) {
      const fallback = planStart || todayKey || ''
      if (fallback && selectedDate !== fallback) {
        setSelectedDate(fallback)
      }
      return
    }

    if (selectedDate) {
      if (!isWithinPlanRange(selectedDate)) {
        const fallback = sortedDates.includes(todayKey) ? todayKey : sortedDates[0]
        setSelectedDate(fallback)
      }
      return
    }

    const fallbackDate = sortedDates.includes(todayKey) ? todayKey : sortedDates[0]
    setSelectedDate(fallbackDate)
  }, [sortedDates, selectedDate, todayKey, scheduleStartDate, scheduleEndDate])

  const mealsForDate = useMemo(() => {
    if (!selectedDate) return []
    const actualMeals = resolvedMealsByDate[selectedDate] || []
    if (actualMeals.length) return actualMeals
    const dayNumber = getDayNumber(scheduleStartDate, selectedDate)
    if (dayNumber && planMealsByDay[dayNumber]) {
      return planMealsByDay[dayNumber]
    }
    return []
  }, [resolvedMealsByDate, selectedDate, planMealsByDay, scheduleStartDate])

  const progressStats = useMemo(() => {
    if (overviewStats) {
      const total = overviewStats.total_meals || 0
      const completed = overviewStats.completed_meals || 0
      const skipped = overviewStats.skipped_meals || 0
      const pending = overviewStats.pending_meals ?? Math.max(total - completed - skipped, 0)
      return { total, completed, skipped, pending }
    }

    if (!Object.keys(resolvedMealsByDate).length) return { total: 0, completed: 0, skipped: 0, pending: 0 }
    const allItems = Object.values(resolvedMealsByDate).flat()
    const total = allItems.length
    const completed = allItems.filter((item) => item.status === 1 || item.status === 'completed').length
    const skipped = allItems.filter((item) => item.status === 2 || item.status === 'skipped').length
    return { total, completed, skipped, pending: Math.max(total - completed - skipped, 0) }
  }, [overviewStats, resolvedMealsByDate])

  const selectedDayNutrition = useMemo(() => summarizeMeals(mealsForDate), [mealsForDate])

  const selectedDayStatus = useMemo(() => {
    if (!mealsForDate.length) return { completed: 0, skipped: 0, pending: 0 }
    const completed = mealsForDate.filter((item) => item.status === 1 || item.status === 'completed').length
    const skipped = mealsForDate.filter((item) => item.status === 2 || item.status === 'skipped').length
    return {
      completed,
      skipped,
      pending: Math.max(mealsForDate.length - completed - skipped, 0)
    }
  }, [mealsForDate])

  const nextDateKey = useMemo(() => {
    if (!sortedDates.length || !selectedDate) return ''
    const currentIndex = sortedDates.indexOf(selectedDate)
    if (currentIndex === -1) return ''
    return sortedDates[currentIndex + 1] || ''
  }, [selectedDate, sortedDates])

  const activeDayNumber = useMemo(() => getDayNumber(scheduleStartDate, selectedDate), [scheduleStartDate, selectedDate])
  const nextDayNumber = useMemo(() => getDayNumber(scheduleStartDate, nextDateKey), [scheduleStartDate, nextDateKey])

  const nextDayMeals = useMemo(() => {
    if (!nextDateKey) return []
    const actualMeals = resolvedMealsByDate[nextDateKey] || []
    if (actualMeals.length) return actualMeals
    if (nextDayNumber && planMealsByDay[nextDayNumber]) {
      return planMealsByDay[nextDayNumber]
    }
    return []
  }, [resolvedMealsByDate, nextDateKey, nextDayNumber, planMealsByDay])

  const nextDayNutrition = useMemo(() => summarizeMeals(nextDayMeals), [nextDayMeals])

  useEffect(() => {
    const enrichMeals = async () => {
      if (!selectedDate || !mealsForDate.length) return

      const candidates = mealsForDate.filter((meal) => {
        const recipeId = resolveRecipeId(meal)
        if (!recipeId) return false
        const cached = recipeCacheRef.current.get(recipeId)
        const hasVisual = meal.image || meal.recipe_id?.image || meal.recipe_id?.hero_image
        const cachedHasVisual = cached?.image || cached?.hero_image
        const hasInstruction = Boolean(resolveCookingHtml(meal))
        const cachedHasInstruction = cached?.content || cached?.instructions || cached?.description
        return !cached || (!hasVisual && cachedHasVisual) || (!hasInstruction && cachedHasInstruction)
      })

      for (const meal of candidates) {
        const recipeId = resolveRecipeId(meal)
        if (!recipeId) continue

        let recipeDoc = recipeCacheRef.current.get(recipeId)

        if (!recipeDoc) {
          try {
            const response = await getRecipeForUser(recipeId)
            const result = response?.data?.result
            recipeDoc = extractRecipeDocument(result)
            if (recipeDoc) {
              recipeCacheRef.current.set(recipeId, recipeDoc)
            }
          } catch (error) {
            console.error('Error fetching recipe for meal item:', error)
            continue
          }
        }

        if (recipeDoc) {
          setDynamicMealsByDate((prev) => {
            const baseMeals = prev[selectedDate] || mealsForDate
            const patched = baseMeals.map((item) =>
              resolveRecipeId(item) === recipeId ? mergeRecipeIntoMeal(item, recipeDoc) : item
            )
            return { ...prev, [selectedDate]: patched }
          })
        }
      }
    }

    enrichMeals()
  }, [selectedDate, mealsForDate])

  const goalNutrition = useMemo(
    () => ({
      calories: linkedPlan?.target_calories || linkedPlan?.averageNutrition?.calories || linkedPlan?.total_calories || 0,
      protein: linkedPlan?.target_protein || linkedPlan?.averageNutrition?.protein || 0,
      carbs: linkedPlan?.target_carbs || linkedPlan?.averageNutrition?.carbs || 0,
      fat: linkedPlan?.target_fat || linkedPlan?.averageNutrition?.fat || 0
    }),
    [linkedPlan]
  )

  const heroCover = useMemo(() => {
    const mealImages = Object.values(resolvedMealsByDate || {})
      .flat()
      .map((meal) => meal.recipe_id?.image || meal.image || meal.recipe_id?.hero_image)
      .filter(Boolean)
    const candidates = [
      scheduleDetail?.cover_image,
      scheduleDetail?.image,
      linkedPlan?.cover_image,
      linkedPlan?.banner,
      linkedPlan?.image,
      ...(Array.isArray(linkedPlan?.images) ? linkedPlan.images : []),
      ...mealImages
    ]
    const normalized = candidates.map((src) => getImageUrl(src)).find(Boolean)
    return normalized || ''
  }, [linkedPlan, scheduleDetail, resolvedMealsByDate])

  const planTags = useMemo(() => {
    if (!linkedPlan) return []
    const merged = [...(linkedPlan.tags || []), ...(linkedPlan.suitable_for || [])]
    return merged.filter(Boolean).slice(0, 4)
  }, [linkedPlan])

  const communityStats = useMemo(
    () => [
      { label: 'Chuỗi kỷ luật', value: metaInfo?.streak_days ?? 0, suffix: 'ngày', icon: FaFireAlt },
      { label: 'Người đang áp dụng', value: linkedPlan?.applied_count ?? 0, suffix: 'người', icon: FaUserFriends },
      { label: 'Lượt yêu thích', value: linkedPlan?.likes_count ?? 0, suffix: 'lượt', icon: FaHeart }
    ],
    [linkedPlan, metaInfo]
  )

  const todayTeaser = useMemo(() => {
    if (!todaySummary?.meals?.length) return ''
    return todaySummary.meals
      .map((meal) => meal.custom_name || meal.meal_name || meal.recipe_id?.title)
      .filter(Boolean)
      .slice(0, 3)
      .join(' • ')
  }, [todaySummary])

  const completionPercent = useMemo(() => {
    if (!progressStats.total) return 0
    return Math.round((progressStats.completed / progressStats.total) * 100)
  }, [progressStats])

  const calorieProgress = useMemo(() => {
    if (!selectedDayNutrition.calories) return 0
    const goal = goalNutrition.calories || selectedDayNutrition.calories || 1
    return clampProgress((selectedDayNutrition.calories / goal) * 100)
  }, [goalNutrition, selectedDayNutrition.calories])

  const handleShareProgress = () => {
    toast.info('Tính năng chia sẻ tiến độ đang được hoàn thiện. Bạn có thể chia sẻ nhanh bằng cách chụp màn hình!')
  }

  const handleCancelSchedule = async () => {
    if (!scheduleDetail?._id) return
    const confirmed = window.confirm('Bạn chắc chắn muốn bỏ áp dụng thực đơn này? Những bữa ăn đã lên lịch sẽ bị xóa.')
    if (!confirmed) return

    try {
      setCancelling(true)
      await deleteUserMealSchedule(scheduleDetail._id)
      toast.success('Đã bỏ áp dụng thực đơn hiện tại')
      await fetchActiveSchedule()
    } catch (error) {
      console.error('Error cancelling meal schedule:', error)
      toast.error('Không thể bỏ áp dụng thực đơn. Vui lòng thử lại.')
    } finally {
      setCancelling(false)
    }
  }

  const handleCompleteMeal = async (mealItemId) => {
    if (!mealItemId) return
    if (isFutureSelectedDate) {
      toast.info('Bạn chỉ có thể cập nhật bữa ăn trong ngày hiện tại hoặc đã qua.')
      return
    }
    try {
      await completeMealItem(mealItemId)
      toast.success('Đã đánh dấu bữa ăn hoàn thành')
      await fetchActiveSchedule()
    } catch (error) {
      console.error('Error completing meal item:', error)
      toast.error('Không thể cập nhật trạng thái bữa ăn')
    }
  }

  const handleSkipMeal = async (mealItemId) => {
    if (!mealItemId) return
    if (isFutureSelectedDate) {
      toast.info('Không thể bỏ qua bữa ăn ở ngày tương lai.')
      return
    }
    const confirmed = window.confirm('Bạn muốn bỏ qua bữa ăn này?')
    if (!confirmed) return
    try {
      await skipMealItem(mealItemId)
      toast.info('Đã ghi nhận bữa ăn bị bỏ qua')
      await fetchActiveSchedule()
    } catch (error) {
      console.error('Error skipping meal item:', error)
      toast.error('Không thể cập nhật trạng thái bữa ăn')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading className="flex flex-col items-center gap-3 text-gray-600" />
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <FaExclamationTriangle className="text-4xl text-amber-500 mb-4" />
        <p className="text-gray-700 dark:text-gray-300 mb-4">{errorMessage}</p>
        <button
          type="button"
          onClick={() => navigate('/meal-plan')}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
        >
          Khám phá thực đơn
        </button>
      </div>
    )
  }

  const statusBadge = STATUS_BADGES[scheduleDetail?.status ?? 0]

  return (
    <>
      <div className="min-h-screen py-6 px-4 md:px-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-4 hover:text-gray-900"
      >
        <FaChevronLeft /> Trở lại
      </button>

      <div className="relative overflow-hidden rounded-3xl border border-emerald-100 dark:border-emerald-900/50 bg-emerald-700 text-white shadow-2xl mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 opacity-95" />
        {heroCover && (
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="w-full h-full bg-cover bg-center opacity-40 mix-blend-soft-light"
              style={{ backgroundImage: `url(${heroCover})` }}
            />
          </div>
        )}
        <div className="relative z-10 grid lg:grid-cols-[2fr,1fr] gap-8 p-6 md:p-8">
          <div className="space-y-5">
            <p className="text-xs uppercase tracking-[0.3em] text-white/70">Thực đơn đang áp dụng</p>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight">{scheduleDetail?.title || 'Chưa có thực đơn hoạt động'}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-white/85">
              <span className="px-3 py-1 rounded-full border border-white/40 text-xs font-semibold tracking-wide">
                {statusBadge?.label || 'Đang áp dụng'}
              </span>
              {scheduleStartDate && (
                <span className="inline-flex items-center gap-1">
                  <FaCalendarAlt /> Bắt đầu: {formatDate(scheduleStartDate)}
                </span>
              )}
              {scheduleEndDate && (
                <span className="inline-flex items-center gap-1">
                  <FaClock /> Kết thúc: {formatDate(scheduleEndDate)}
                </span>
              )}
              {scheduleDetail?.duration && <span>{scheduleDetail.duration} ngày</span>}
            </div>
            <p className="text-sm text-white/85">
              {todaySummary?.meals?.length
                ? `Hôm nay có ${todaySummary.meals.length} bữa • ${todaySummary.nutrition?.calories || 0} kcal${todayTeaser ? ` • ${todayTeaser}` : ''}`
                : 'Áp dụng thực đơn để theo dõi hành trình ăn uống của bạn theo phong cách mạng xã hội.'}
            </p>
            {planTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {planTags.map((tag) => (
                  <span key={tag} className="px-3 py-1 rounded-full bg-white/15 text-xs font-semibold tracking-wide">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              {/* actions, badges, etc. could go here */}
            </div>
            <div
              className="w-28 h-28 rounded-full flex items-center justify-center"
              style={{
                background: `conic-gradient(#ffffff ${(completionPercent || 0) * 3.6}deg, rgba(255,255,255,0.2) 0)`
              }}
            >
                <div className="w-20 h-20 bg-white/90 text-emerald-600 rounded-full flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold">{completionPercent}%</span>
                  <span className="text-[10px] uppercase tracking-wide text-emerald-700">tiến độ</span>
                </div>
              </div>
              <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/80 font-semibold">
                {progressStats.completed}/{progressStats.total} bữa
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full text-sm text-white/85">
              <div className="p-3 rounded-xl bg-white/10">
                <p className="text-xs uppercase tracking-wide text-white/70">Hoàn thành</p>
                <p className="text-xl font-semibold">{progressStats.completed}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/10">
                <p className="text-xs uppercase tracking-wide text-white/70">Bỏ qua</p>
                <p className="text-xl font-semibold">{progressStats.skipped}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/10">
                <p className="text-xs uppercase tracking-wide text-white/70">Chờ</p>
                <p className="text-xl font-semibold">{progressStats.pending}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/10">
                <p className="text-xs uppercase tracking-wide text-white/70">Hiệu suất</p>
                <p className="text-xl font-semibold">{progressReport?.completion_rate ? `${progressReport.completion_rate}%` : 'Đang cập nhật'}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCancelSchedule}
              disabled={cancelling}
              className="w-full px-4 py-2 rounded-xl border border-white/40 text-white font-semibold hover:bg-white/10 disabled:opacity-60"
            >
              {cancelling ? 'Đang hủy...' : 'Bỏ áp dụng thực đơn'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {communityStats.map(({ label, value, suffix, icon: Icon }) => (
          <div key={label} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 flex flex-col gap-2 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-200 flex items-center justify-center text-xl">
                <Icon />
              </span>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {value || 0} <span className="text-base font-medium text-gray-500 dark:text-gray-400">{suffix}</span>
                </p>
              </div>
            </div>
            {label === 'Chuỗi kỷ luật' && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ngày hiện tại: {metaInfo?.today_index || getDayNumber(scheduleDetail?.start_date, selectedDate) || 1}/
                {metaInfo?.total_days || scheduleDetail?.duration || timelineDates.length || '—'}
              </p>
            )}
            {label === 'Người đang áp dụng' && (
              <p className="text-sm text-gray-500 dark:text-gray-400">Cộng đồng đang lan tỏa thực đơn này, cập nhật tiến độ để cổ vũ nhau.</p>
            )}
            {label === 'Lượt yêu thích' && (
              <p className="text-sm text-gray-500 dark:text-gray-400">Thực đơn càng được yêu thích, bạn càng có thêm cảm hứng.</p>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow">
            <div className="border-b border-gray-100 dark:border-gray-700 px-6 py-4 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Bữa ăn trong ngày</h2>
                  <p className="text-sm text-gray-500">Chọn ngày để xem chi tiết bữa ăn đã được lên lịch.</p>
                </div>
                <div className="flex flex-col items-start lg:items-end gap-2 w-full lg:w-auto">
                  <label htmlFor="active-plan-date" className="text-xs uppercase tracking-wide text-gray-500">
                    Ngày đang xem
                  </label>
                  <input
                    id="active-plan-date"
                    type="date"
                    min={scheduleStartDate || ''}
                    max={scheduleEndDate || ''}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(getDateKey(e.target.value))}
                    className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-transparent w-full lg:w-auto"
                  />
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-right w-full">
                    {selectedDate
                      ? `${formatDate(selectedDate)}${selectedDate === todayKey ? ' (Hôm nay)' : ''}`
                      : 'Chọn ngày để xem thực đơn chi tiết'}
                  </div>
                </div>
              </div>
              {sortedDates.length > 1 && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs uppercase tracking-wide text-gray-500">Lịch nhanh</span>
                  <div className="flex flex-wrap gap-2 max-h-16 overflow-y-auto">
                    {sortedDates.map((dateKey) => {
                      const dayNumber = getDayNumber(scheduleDetail?.start_date, dateKey)
                      const isActive = selectedDate === dateKey
                      return (
                        <button
                          key={dateKey}
                          type="button"
                          onClick={() => setSelectedDate(dateKey)}
                          className={`px-3 py-1 rounded-full border text-sm transition-colors ${
                            isActive
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-emerald-400'
                          }`}
                          title={formatDate(dateKey)}
                        >
                          Ngày {dayNumber || '?'} ({formatShortDate(dateKey)})
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 space-y-6">
              {selectedDate ? (
                <>
                  <div className="flex flex-col xl:flex-row gap-6 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-4">
                    <div className="flex-1 space-y-2">
                      <p className="text-xs uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                        Ngày {activeDayNumber || '?'} {selectedDate === todayKey ? '• Hôm nay' : ''}
                      </p>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{formatDate(selectedDate)}</h3>
                      <p className="text-sm text-gray-500">
                        Đã lên lịch {mealsForDate.length} bữa • Hoàn thành {selectedDayStatus.completed} • Bỏ qua {selectedDayStatus.skipped}
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-3 py-1 rounded-full bg-white dark:bg-gray-800 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-700/60">
                          {selectedDayStatus.completed} hoàn thành
                        </span>
                        <span className="px-3 py-1 rounded-full bg-white dark:bg-gray-800 text-amber-600 border border-amber-100 dark:border-amber-800/60">
                          {selectedDayStatus.skipped} bỏ qua
                        </span>
                        <span className="px-3 py-1 rounded-full bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-200 border border-gray-200 dark:border-gray-700">
                          {selectedDayStatus.pending} chờ thực hiện
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 self-stretch">
                      <div className="relative mx-auto">
                        <div
                          className="w-24 h-24 rounded-full flex items-center justify-center"
                          style={{
                            background: `conic-gradient(#10b981 ${Math.min(calorieProgress, 100) * 3.6}deg, #d1fae5 0)`
                          }}
                        >
                          <div className="w-16 h-16 bg-white dark:bg-gray-900 rounded-full flex flex-col items-center justify-center">
                            <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-300">{Math.min(calorieProgress, 100)}%</span>
                            <span className="text-[10px] text-gray-500">năng lượng</span>
                          </div>
                        </div>
                        <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-xs text-gray-500 dark:text-gray-300">
                          {selectedDayNutrition.calories} / {goalNutrition.calories || selectedDayNutrition.calories || 0} kcal
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        <p className="font-semibold text-gray-900 dark:text-white">Mục tiêu hằng ngày</p>
                        <p>Calories: {goalNutrition.calories || '—'}</p>
                        <p>Protein: {goalNutrition.protein || '—'} g</p>
                        <p>Carbs: {goalNutrition.carbs || '—'} g</p>
                        <p>Chất béo: {goalNutrition.fat || '—'} g</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                    {[
                      {
                        label: 'Calories',
                        value: selectedDayNutrition.calories,
                        display: `${selectedDayNutrition.calories} kcal`,
                        target: goalNutrition.calories,
                        icon: FaFireAlt,
                        color: 'text-emerald-600',
                        bar: 'bg-emerald-500'
                      },
                      {
                        label: 'Protein',
                        value: selectedDayNutrition.protein,
                        display: `${selectedDayNutrition.protein} g`,
                        target: goalNutrition.protein,
                        icon: FaDrumstickBite,
                        color: 'text-orange-500',
                        bar: 'bg-orange-400'
                      },
                      {
                        label: 'Carbs',
                        value: selectedDayNutrition.carbs,
                        display: `${selectedDayNutrition.carbs} g`,
                        target: goalNutrition.carbs,
                        icon: FaBreadSlice,
                        color: 'text-amber-600',
                        bar: 'bg-amber-500'
                      },
                      {
                        label: 'Chất béo',
                        value: selectedDayNutrition.fat,
                        display: `${selectedDayNutrition.fat} g`,
                        target: goalNutrition.fat,
                        icon: FaOilCan,
                        color: 'text-yellow-500',
                        bar: 'bg-yellow-400'
                      }
                    ].map(({ label, value, display, target, icon: Icon, color, bar }, idx) => {
                      const percent = target ? Math.min(100, Math.round((value / target) * 100)) : value ? 100 : 0
                      return (
                        <div key={idx} className="p-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900/60 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-gray-800 dark:text-gray-100">
                              <Icon className={`${color} text-lg`} />
                              <span className="font-medium text-sm">{label}</span>
                            </div>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">{display}</span>
                          </div>
                          <div className="mt-2 w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className={`${bar} h-2`} style={{ width: `${percent}%` }} />
                          </div>
                          {target > 0 && (
                            <p className="text-[11px] text-gray-500 mt-1">Mục tiêu {target}{label === 'Calories' ? ' kcal' : ' g'}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {nextDayMeals.length > 0 && (
                    <div className="bg-gradient-to-r from-emerald-50 to-green-100 dark:from-gray-900/40 dark:to-emerald-900/30 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-900/40">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-emerald-600 dark:text-emerald-300">Chuẩn bị ngày tiếp theo</p>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Ngày {nextDayNumber || '?'} - {formatDate(nextDateKey)}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {nextDayMeals.length} bữa • Tổng {nextDayNutrition.calories} kcal
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {nextDayMeals.slice(0, 2).map((meal) => meal.custom_name || meal.meal_name || meal.recipe_id?.title).filter(Boolean).join(' • ')}
                            {nextDayMeals.length > 2 ? '…' : ''}
                          </p>
                        </div>
                        <div className="flex gap-4 text-sm">
                          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-100">
                            <FaFireAlt className="text-emerald-500" />
                            <div>
                              <p className="text-xs text-gray-500">Calories</p>
                              <p className="font-semibold">{nextDayNutrition.calories}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-100">
                            <FaUtensils className="text-emerald-500" />
                            <div>
                              <p className="text-xs text-gray-500">Số bữa</p>
                              <p className="font-semibold">{nextDayMeals.length}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-100">
                            <GiWheat className="text-emerald-500" />
                            <div>
                              <p className="text-xs text-gray-500">Carbs</p>
                              <p className="font-semibold">{nextDayNutrition.carbs} g</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center text-gray-500">
                  <FaClock className="text-3xl mx-auto mb-3 text-gray-300" />
                  <p>Chọn ngày để xem thực đơn chi tiết.</p>
                </div>
              )}

              {selectedDate && mealsForDate.length === 0 && (
                <div className="text-center text-gray-500">
                  <FaClock className="text-3xl mx-auto mb-3 text-gray-300" />
                  <p>Không có bữa ăn nào trong ngày đã chọn.</p>
                </div>
              )}

              {selectedDate && mealsForDate.length > 0 && (
                <div className="space-y-4">
                  {mealsForDate.map((meal) => {
                    const mealTitle = meal.custom_name || meal.meal_name || meal.recipe_id?.title || 'Bữa ăn'
                    const mealImage = getImageUrl(meal.recipe_id?.image || meal.image || meal.recipe_id?.hero_image) || MEAL_PLACEHOLDER_IMAGE
                    const mealStatus = meal.status === 1 || meal.status === 'completed'
                      ? { label: 'Đã hoàn thành', className: 'bg-emerald-50 text-emerald-700 border border-emerald-100', icon: FaCheckCircle }
                      : meal.status === 2 || meal.status === 'skipped'
                        ? { label: 'Đã bỏ qua', className: 'bg-amber-50 text-amber-700 border border-amber-100', icon: FaTimesCircle }
                        : { label: 'Chưa ăn', className: 'bg-gray-100 text-gray-600 border border-gray-200', icon: FaClock }

                    const nutrition = {
                      calories: meal.calories || meal.recipe_id?.calories || 0,
                      protein: meal.protein || meal.recipe_id?.protein || 0,
                      carbs: meal.carbs || meal.recipe_id?.carbohydrate || 0,
                      fat: meal.fat || meal.recipe_id?.fat || 0
                    }

                    const StatusIcon = mealStatus.icon

                    return (
                      <div key={meal._id} className="border border-gray-100 dark:border-gray-700 rounded-2xl p-4 space-y-4 bg-white dark:bg-gray-900/40">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg font-semibold">
                              {meal.meal_type?.toUpperCase?.()?.[0] || 'M'}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white text-lg">{mealTitle}</p>
                              <p className="text-sm text-gray-500 flex items-center gap-1">
                                <FaClock /> {meal.schedule_time || 'Không có giờ cụ thể'}
                              </p>
                            </div>
                          </div>
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full ${mealStatus.className}`}>
                            <StatusIcon /> {mealStatus.label}
                          </span>
                        </div>

                        <div className="flex flex-col lg:flex-row gap-5">
                          <div className="w-full lg:w-1/3">
                            <div className="relative h-48 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                              <img
                                src={mealImage}
                                alt={mealTitle}
                                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                                onError={(event) => {
                                  event.currentTarget.onerror = null
                                  event.currentTarget.src = MEAL_PLACEHOLDER_IMAGE
                                }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0" />
                              <div className="absolute bottom-3 left-3 text-white text-sm font-medium flex items-center gap-2">
                                <FaUtensils /> {meal.recipe_id?.title || meal.recipe_title || 'Món tùy chọn'}
                              </div>
                            </div>
                          </div>

                          <div className="flex-1 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-300">
                              <p>
                                <span className="font-semibold text-gray-900 dark:text-white">Món chính:</span>{' '}
                                {meal.recipe_id?.title || meal.recipe_title || 'Chưa gán món'}
                              </p>
                              <p>
                                <span className="font-semibold text-gray-900 dark:text-white">Thực đơn gợi ý:</span>{' '}
                                {meal.notes || meal.recipe_id?.summary || 'Ăn kết hợp với rau xanh và nước lọc.'}
                              </p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {[
                                { label: 'Calories', value: `${nutrition.calories} kcal`, color: 'text-emerald-600', icon: FaFireAlt },
                                { label: 'Protein', value: `${nutrition.protein} g`, color: 'text-orange-500', icon: FaDrumstickBite },
                                { label: 'Carbs', value: `${nutrition.carbs} g`, color: 'text-amber-600', icon: FaBreadSlice },
                                { label: 'Chất béo', value: `${nutrition.fat} g`, color: 'text-yellow-500', icon: FaOilCan }
                              ].map(({ label, value, color, icon: Icon }) => (
                                <div key={label} className="border border-gray-100 dark:border-gray-700 rounded-xl p-3 bg-gray-50 dark:bg-gray-800/60">
                                  <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                                    <Icon className={color} />
                                    <span className="font-medium">{label}</span>
                                  </div>
                                  <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">{value}</p>
                                </div>
                              ))}
                            </div>

                            <div className="flex flex-wrap gap-3">
                              <button
                                type="button"
                                onClick={async () => {
                                  const hasModalContent = (payload) =>
                                    payload &&
                                    (payload.ingredients?.length || payload.htmlContent || payload.instructionSteps?.length)

                                  const recipeFromSchedule =
                                    meal.recipe_id && typeof meal.recipe_id === 'object' ? meal.recipe_id : null
                                  const fallbackHtml = resolveCookingHtml(meal)

                                  if (recipeFromSchedule) {
                                    const modalPayload = buildCookingModalData(meal, recipeFromSchedule, fallbackHtml)
                                    if (hasModalContent(modalPayload)) {
                                      setCookingModal(modalPayload)
                                      return
                                    }
                                  }

                                  if (fallbackHtml) {
                                    const modalPayload = buildCookingModalData(meal, null, fallbackHtml)
                                    if (hasModalContent(modalPayload)) {
                                      setCookingModal(modalPayload)
                                      return
                                    }
                                  }

                                  const recipeId = resolveRecipeId(meal)

                                  if (recipeId) {
                                    try {
                                      const cached = recipeCacheRef.current.get(recipeId)
                                      let recipeDoc = cached

                                      if (!recipeDoc) {
                                        const response = await getRecipeForUser(recipeId)
                                        const result = response?.data?.result
                                        recipeDoc = extractRecipeDocument(result)
                                        if (recipeDoc) {
                                          recipeCacheRef.current.set(recipeId, recipeDoc)
                                        }
                                      }

                                      if (recipeDoc) {
                                        setDynamicMealsByDate((prev) => {
                                          const baseMeals = prev[selectedDate] || mealsForDate
                                          const patched = baseMeals.map((item) =>
                                            resolveRecipeId(item) === recipeId
                                              ? mergeRecipeIntoMeal(item, recipeDoc)
                                              : item
                                          )
                                          return { ...prev, [selectedDate]: patched }
                                        })

                                        const modalPayload = buildCookingModalData(meal, recipeDoc, fallbackHtml)
                                        if (hasModalContent(modalPayload)) {
                                          setCookingModal(modalPayload)
                                          return
                                        }
                                      }
                                    } catch (error) {
                                      console.error('Error loading recipe detail:', error)
                                    }
                                  }

                                  toast.info('Chưa có công thức chi tiết cho món ăn này.')
                                }}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                              >
                                <FaBookOpen /> Xem cách chế biến
                              </button>

                              {meal.status === 1 || meal.status === 'completed' ? (
                                <span className="inline-flex items-center gap-1 text-sm text-emerald-600">
                                  <FaCheckCircle /> Đã hoàn thành
                                </span>
                              ) : meal.status === 2 || meal.status === 'skipped' ? (
                                <span className="inline-flex items-center gap-1 text-sm text-amber-600">
                                  <FaTimesCircle /> Đã bỏ qua
                                </span>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleCompleteMeal(meal._id)}
                                    disabled={isFutureSelectedDate}
                                    className={`px-4 py-2 border border-emerald-600 text-emerald-600 rounded-lg text-sm hover:bg-emerald-50 ${
                                      isFutureSelectedDate ? 'opacity-60 cursor-not-allowed' : ''
                                    }`}
                                  >
                                    Đánh dấu hoàn thành
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSkipMeal(meal._id)}
                                    disabled={isFutureSelectedDate}
                                    className={`px-4 py-2 border border-amber-500 text-amber-600 rounded-lg text-sm hover:bg-amber-50 ${
                                      isFutureSelectedDate ? 'opacity-60 cursor-not-allowed' : ''
                                    }`}
                                  >
                                    Bỏ qua bữa này
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          {overviewStats && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Hiệu suất & trạng thái</h3>
              <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-300">
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/30">
                  <p className="text-xs text-gray-500">Tổng số bữa</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{overviewStats.total_meals}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/30">
                  <p className="text-xs text-gray-500">Đã hoàn thành</p>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{overviewStats.completed_meals}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/30">
                  <p className="text-xs text-gray-500">Bỏ qua</p>
                  <p className="text-xl font-bold text-amber-600">{overviewStats.skipped_meals}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/30">
                  <p className="text-xs text-gray-500">Chưa thực hiện</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{overviewStats.pending_meals}</p>
                </div>
              </div>
            </div>
          )}
          <div className="bg-gradient-to-br from-emerald-50 to-lime-100 dark:from-gray-900 dark:to-emerald-900/30 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 shadow p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-10 h-10 rounded-xl bg-white/70 text-emerald-600 flex items-center justify-center text-lg">
                <FaUserFriends />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Nhịp bạn bè</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Khoe tiến độ, nhắn tin và rủ bạn đồng hành.</p>
              </div>
            </div>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1 mb-4">
              <li>• Cập nhật streak hiện tại: {metaInfo?.streak_days ?? 0} ngày</li>
              <li>• {linkedPlan?.applied_count ?? 0} người đang áp dụng thực đơn này</li>
              <li>• {todaySummary?.meals?.length || 0} bữa hôm nay đã sẵn sàng để bạn ghi chú cảm nghĩ</li>
            </ul>
            <button
              type="button"
              onClick={() => navigate('/friends')}
              className="w-full px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              Mở trung tâm bạn bè
            </button>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Thông tin thêm</h3>
            {linkedPlan ? (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Áp dụng từ thực đơn <span className="font-semibold">{linkedPlan.title}</span>.
                </p>
                <button
                  type="button"
                  className="mt-3 w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                  onClick={() => navigate(`/meal-plan/${linkedPlan._id}`)}
                >
                  Xem chi tiết thực đơn
                </button>
              </>
            ) : (
              <p className="text-sm text-gray-500">Không tìm thấy thông tin thực đơn gốc.</p>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Gợi ý tiếp theo</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Nếu bạn muốn thay đổi thực đơn, hãy quay lại trang <strong>Thực đơn</strong> để khám phá những gợi ý mới phù hợp với mình.
            </p>
            <button
              type="button"
              onClick={() => navigate('/meal-plan')}
              className="mt-3 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
            >
              Khám phá thực đơn khác
            </button>
          </div>
        </aside>
      </div>

      {cookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-start justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <FaUtensils className="text-emerald-500" /> {cookingModal.title}
                </h3>
                {(cookingModal.cookingTime || cookingModal.servings) && (
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {cookingModal.cookingTime && (
                      <span className="flex items-center gap-1">
                        <FaClock className="text-emerald-500" />
                        Thời gian: {cookingModal.cookingTime} phút
                      </span>
                    )}
                    {cookingModal.servings && <span>Khẩu phần: {cookingModal.servings}</span>}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setCookingModal(null)}
                className="text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
                aria-label="Đóng"
              >
                <FaTimes />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-6 text-gray-800 dark:text-gray-100 max-h-[65vh]">
              {cookingModal.description && (
                <div className="bg-emerald-50/80 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl p-4 text-sm">
                  <p>{cookingModal.description}</p>
                </div>
              )}

              <section>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Nguyên liệu</h4>
                {cookingModal.ingredients?.length ? (
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700 dark:text-gray-300">
                    {cookingModal.ingredients.map((ingredient, index) => (
                      <li
                        key={`${ingredient.name || ingredient.title || 'ingredient'}-${index}`}
                        className="flex items-start gap-2"
                      >
                        <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500"></span>
                        <span>
                          <span className="font-medium">{ingredient.name || ingredient.title || `Nguyên liệu ${index + 1}`}</span>
                          {(() => {
                            const measurement = [ingredient.quantity || ingredient.amount, ingredient.unit]
                              .filter((value) => Boolean(value && String(value).trim()))
                              .join(' ')
                            return measurement ? <span className="ml-1 text-gray-500">({measurement})</span> : null
                          })()}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">Chưa có thông tin nguyên liệu.</p>
                )}
              </section>

              {cookingModal.hasNutrition && (
                <section>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Thông tin dinh dưỡng</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 rounded-lg p-3 text-center">
                      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Calories</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{cookingModal.nutrition.calories}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 rounded-lg p-3 text-center">
                      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Protein</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{cookingModal.nutrition.protein}g</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 rounded-lg p-3 text-center">
                      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Carbs</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{cookingModal.nutrition.carbs}g</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 rounded-lg p-3 text-center">
                      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Fat</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{cookingModal.nutrition.fat}g</p>
                    </div>
                  </div>
                </section>
              )}

              <section>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Hướng dẫn chế biến</h4>
                {cookingModal.htmlContent ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: cookingModal.htmlContent }} />
                ) : cookingModal.instructionSteps?.length ? (
                  <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    {cookingModal.instructionSteps.map((step, index) => (
                      <li key={`step-${index}`}>{step}</li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-gray-500">Chưa có hướng dẫn chi tiết cho món ăn này.</p>
                )}
              </section>

              {cookingModal.video && (
                <section>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Video hướng dẫn</h4>
                  <div className="aspect-video w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                    <iframe
                      className="w-full h-full"
                      src={
                        cookingModal.video.includes('watch?v=')
                          ? cookingModal.video.replace('watch?v=', 'embed/')
                          : cookingModal.video
                      }
                      title="Cooking video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </section>
              )}
            </div>

            <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end bg-gray-50/70 dark:bg-gray-800/60">
              <button
                type="button"
                onClick={() => setCookingModal(null)}
                className="px-4 py-2 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ActiveMealPlan
