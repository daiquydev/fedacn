import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { toast } from 'react-toastify'
import { FaPlus, FaTrash, FaImage, FaLink, FaUtensils, FaCalendarDay, FaCopy, FaMagic, FaCheck, FaSync } from 'react-icons/fa'
import { MdFastfood } from 'react-icons/md'
import { MEAL_PLAN_CATEGORIES } from '../../../../constants/mealPlan'
import { getImageUrl } from '../../../../utils/imageUrl'
import http from '../../../../utils/http'

const MEAL_TYPES = {
  1: 'Sáng',
  2: 'Trưa', 
  3: 'Tối',
  4: 'Xế chiều'
}

const DIFFICULTY_LEVELS = {
  1: 'Dễ',
  2: 'Trung bình',
  3: 'Khó'
}

const PRICE_RANGES = {
  'budget': 'Tiết kiệm',
  'medium': 'Trung bình',
  'premium': 'Cao cấp'
}

const DEFAULT_MEAL_SLOTS = [
  { meal_type: 1, meal_order: 1, label: 'Bữa sáng' },
  { meal_type: 2, meal_order: 2, label: 'Bữa trưa' },
  { meal_type: 3, meal_order: 3, label: 'Bữa tối' }
]

const buildBaseMealTemplate = (mealType, mealOrder = 1) => ({
  meal_type: mealType,
  meal_order: mealOrder,
  recipe_id: null,
  servings: 1,
  name: '',
  calories: 0,
  protein: 0,
  fat: 0,
  carbs: 0,
  is_optional: false,
  notes: ''
})

const toNumberSafe = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const sumMealsNutrition = (meals = []) => {
  return meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + (Number(meal.calories) || 0),
      protein: acc.protein + (Number(meal.protein) || 0),
      fat: acc.fat + (Number(meal.fat) || 0),
      carbs: acc.carbs + (Number(meal.carbs ?? meal.carbohydrate) || 0)
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 }
  )
}

const normalizeMealsFromSource = (meals = []) => {
  const seededMeals = Array.isArray(meals)
    ? meals.map((meal, index) => ({
        ...buildBaseMealTemplate(
          meal?.meal_type ?? DEFAULT_MEAL_SLOTS[Math.min(index, DEFAULT_MEAL_SLOTS.length - 1)].meal_type,
          meal?.meal_order ?? index + 1
        ),
        ...meal,
        servings: toNumberSafe(meal?.servings, 1) > 0 ? toNumberSafe(meal?.servings, 1) : 1,
        calories: toNumberSafe(meal?.calories),
        protein: toNumberSafe(meal?.protein),
        fat: toNumberSafe(meal?.fat),
        carbs: toNumberSafe(meal?.carbs ?? meal?.carbohydrate)
      }))
    : []

  DEFAULT_MEAL_SLOTS.forEach((slot) => {
    if (!seededMeals.some((meal) => meal.meal_type === slot.meal_type)) {
      seededMeals.push(buildBaseMealTemplate(slot.meal_type, slot.meal_order))
    }
  })

  return seededMeals
    .sort((a, b) => (a.meal_order ?? a.meal_type ?? 0) - (b.meal_order ?? b.meal_type ?? 0))
    .map((meal, index) => ({ ...meal, meal_order: index + 1 }))
}

const normalizeDayFromSource = (dayData = {}, index = 0) => {
  const meals = normalizeMealsFromSource(dayData.meals)
  const totals = sumMealsNutrition(meals)
  const dayNumber = dayData.day_number ?? index + 1

  return {
    ...dayData,
    day_number: dayNumber,
    title: dayData.title || `Ngày ${dayNumber}`,
    description: dayData.description || '',
    notes: dayData.notes || '',
    meals,
    total_calories: totals.calories,
    total_protein: totals.protein,
    total_fat: totals.fat,
    total_carbs: totals.carbs
  }
}

const buildDefaultDays = (duration = 7) => {
  return Array.from({ length: duration }, (_, index) => normalizeDayFromSource({ day_number: index + 1 }, index))
}

const buildFormStateFromPlan = (plan) => {
  const baseState = {
    title: '',
    description: '',
    category: 1,
    duration: 7,
    target_calories: '',
    difficulty_level: 1,
    image: '',
    is_public: true,
    price_range: 'medium',
    suitable_for: [],
    tags: [],
    days: buildDefaultDays(7)
  }

  if (!plan) {
    return baseState
  }

  const normalizedDays = (Array.isArray(plan.days) && plan.days.length > 0 ? plan.days : buildDefaultDays(plan.duration || baseState.duration)).map(
    (day, index) => normalizeDayFromSource(day, index)
  )

  return {
    ...baseState,
    title: plan.title || '',
    description: plan.description || '',
    category: plan.category ?? 1,
    duration: plan.duration || normalizedDays.length,
    target_calories:
      typeof plan.target_calories === 'number' && Number.isFinite(plan.target_calories)
        ? plan.target_calories
        : '',
    difficulty_level: plan.difficulty_level ?? 1,
    image: plan.image || '',
    is_public: typeof plan.is_public === 'boolean' ? plan.is_public : true,
    price_range: plan.price_range || 'medium',
    suitable_for: Array.isArray(plan.suitable_for) ? plan.suitable_for : [],
    tags: Array.isArray(plan.tags) ? plan.tags : [],
    days: normalizedDays
  }
}

export default function CreateMealPlanModal({ onClose, onCreate, initialData = null, mode = 'create', defaultStep = 1 }) {
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(defaultStep)
  const [imageInputType, setImageInputType] = useState('url') // 'url' or 'file'
  const [selectedFile, setSelectedFile] = useState(null)
  const [formData, setFormData] = useState(() => buildFormStateFromPlan(initialData))
  const [activeDay, setActiveDay] = useState(1)
  const [recipes, setRecipes] = useState([])
  const [recipesLoading, setRecipesLoading] = useState(false)
  const [recipeSearch, setRecipeSearch] = useState('')
  const [bulkConfig, setBulkConfig] = useState({ startDay: 1, endDay: 7, mealType: 1, recipeId: '' })
  const [copyConfig, setCopyConfig] = useState({ fromDay: 1, startDay: 2, endDay: 2 })
  const [recipeFilters, setRecipeFilters] = useState({ category: 'all', difficulty: 'all' })
  const [recipeSort, setRecipeSort] = useState('title')
  const [validationErrors, setValidationErrors] = useState({ title: false, description: false })
  const [highlightedDay, setHighlightedDay] = useState(null)
  const [missingMealKey, setMissingMealKey] = useState(null)
  const titleInputRef = useRef(null)
  const descriptionInputRef = useRef(null)
  const daySectionRef = useRef(null)
  const highlightTimeoutRef = useRef(null)

  const focusField = (ref) => {
    if (!ref?.current) return
    ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    if (typeof ref.current.focus === 'function') {
      try {
        ref.current.focus({ preventScroll: true })
      } catch (error) {
        ref.current.focus()
      }
    }
  }

  const highlightDaySection = (dayNumber) => {
    setHighlightedDay(dayNumber)
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current)
    }
    highlightTimeoutRef.current = setTimeout(() => {
      setHighlightedDay(null)
    }, 4000)

    if (daySectionRef.current) {
      setTimeout(() => {
        daySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 120)
    }
  }

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    setFormData(buildFormStateFromPlan(initialData))
    setActiveDay(1)
    setCurrentStep(defaultStep)
    setSelectedFile(null)
  }, [initialData, defaultStep])

  const createBaseMeal = useCallback((mealType, mealOrder = 1) => buildBaseMealTemplate(mealType, mealOrder), [])

  const calculateDayTotals = useCallback((meals = []) => {
    return sumMealsNutrition(meals)
  }, [])

  const ensureDayStructure = useCallback((day) => {
    if (!day) return null
    return normalizeDayFromSource(day, (day?.day_number || 1) - 1)
  }, [])

  const recipesMap = useMemo(() => {
    const map = {}
    recipes.forEach((recipe) => {
      if (recipe?._id) {
        map[recipe._id] = recipe
      }
    })
    return map
  }, [recipes])

  const recipeCategoryOptions = useMemo(() => {
    const map = new Map()
    recipes.forEach((recipe) => {
      const id = recipe.category_recipe_id || recipe.category || recipe.category_id
      if (!id) return
      const label =
        recipe.category_recipe_name ||
        recipe.category_name ||
        recipe.category?.name ||
        recipe.category ||
        id
      if (!map.has(id)) {
        map.set(id, label)
      }
    })
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }))
  }, [recipes])

  const recipeDifficultyOptions = useMemo(() => {
    const set = new Set()
    recipes.forEach((recipe) => {
      if (recipe?.difficult_level !== undefined && recipe?.difficult_level !== null) {
        set.add(Number(recipe.difficult_level))
      }
    })
    return Array.from(set)
      .sort((a, b) => a - b)
      .map((value) => ({
        value: String(value),
        label: DIFFICULTY_LEVELS[value] || `Mức ${value}`
      }))
  }, [recipes])

  const filteredRecipes = useMemo(() => {
    const keyword = recipeSearch.trim().toLowerCase()

    const containsKeyword = (value) => {
      if (!keyword) return false
      return typeof value === 'string' && value.toLowerCase().includes(keyword)
    }

    const filtered = recipes.filter((recipe) => {
      const matchesCategory =
        recipeFilters.category === 'all' ||
        (recipe.category_recipe_id || recipe.category || recipe.category_id) === recipeFilters.category

      const matchesDifficulty =
        recipeFilters.difficulty === 'all' ||
        String(recipe.difficult_level ?? '') === recipeFilters.difficulty

      if (!matchesCategory || !matchesDifficulty) {
        return false
      }

      if (!keyword) return true

      const titleMatch = containsKeyword(recipe.title)
      const descMatch = containsKeyword(recipe.description)
      const tagMatch = Array.isArray(recipe.tags)
        ? recipe.tags.some((tag) => containsKeyword(tag))
        : false

      return titleMatch || descMatch || tagMatch
    })

    const sorted = [...filtered]
    if (recipeSort === 'calories-asc') {
      sorted.sort((a, b) => (a.energy || 0) - (b.energy || 0))
    } else if (recipeSort === 'calories-desc') {
      sorted.sort((a, b) => (b.energy || 0) - (a.energy || 0))
    } else {
      const toComparable = (value) => (typeof value === 'string' ? value : String(value ?? ''))
      sorted.sort((a, b) => toComparable(a.title).localeCompare(toComparable(b.title)))
    }

    return sorted
  }, [recipeSearch, recipeFilters, recipeSort, recipes])

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setRecipesLoading(true)
        const response = await http.get('/recipes/user/my-recipes', {
          params: {
            page: 1,
            limit: 100
          }
        })
        setRecipes(response.data?.result?.recipes || [])
      } catch (error) {
        console.error('Failed to fetch recipes:', error)
        toast.error('Không thể tải danh sách công thức của bạn')
      } finally {
        setRecipesLoading(false)
      }
    }

    fetchRecipes()
  }, [])

  // Initialize & normalize days when duration changes
  useEffect(() => {
    setFormData((prev) => {
      const duration = prev.duration
      const nextDays = []

      for (let i = 1; i <= duration; i++) {
        const existingDay = prev.days.find((day) => day.day_number === i)
        const fallbackDay = {
          day_number: i,
          meals: DEFAULT_MEAL_SLOTS.map((slot) => createBaseMeal(slot.meal_type, slot.meal_order))
        }
        const normalizedDay = ensureDayStructure(existingDay || fallbackDay)
        if (normalizedDay) {
          nextDays.push(normalizedDay)
        }
      }

      return {
        ...prev,
        days: nextDays
      }
    })
  }, [formData.duration, createBaseMeal, ensureDayStructure])

  // Ensure helper configs stay in range with duration updates
  useEffect(() => {
    setBulkConfig((prev) => {
      const startDay = Math.min(Math.max(prev.startDay, 1), formData.duration)
      const endDay = Math.min(Math.max(prev.endDay, startDay), formData.duration)
      return {
        ...prev,
        startDay,
        endDay
      }
    })

    setCopyConfig((prev) => {
      const fromDay = Math.min(Math.max(prev.fromDay, 1), formData.duration)
      const startDay = Math.min(Math.max(prev.startDay, 1), formData.duration)
      const endDay = Math.min(Math.max(prev.endDay, startDay), formData.duration)
      return {
        ...prev,
        fromDay,
        startDay,
        endDay
      }
    })

    setActiveDay((prev) => {
      if (!formData.duration) return 1
      return prev > formData.duration ? formData.duration : prev
    })
  }, [formData.duration])

  const planTotals = useMemo(() => {
    return formData.days.reduce(
      (acc, day) => {
        const totals = calculateDayTotals(day.meals)
        return {
          calories: acc.calories + totals.calories,
          protein: acc.protein + totals.protein,
          fat: acc.fat + totals.fat,
          carbs: acc.carbs + totals.carbs
        }
      },
      { calories: 0, protein: 0, fat: 0, carbs: 0 }
    )
  }, [formData.days, calculateDayTotals])

  const targetCaloriesValue = useMemo(() => {
    if (formData.target_calories === '' || formData.target_calories === null || typeof formData.target_calories === 'undefined') {
      return null
    }
    const parsed = Number(formData.target_calories)
    return Number.isFinite(parsed) ? parsed : null
  }, [formData.target_calories])

  const caloriesDelta = useMemo(() => {
    if (targetCaloriesValue === null) {
      return null
    }
    return planTotals.calories - targetCaloriesValue
  }, [planTotals.calories, targetCaloriesValue])

  const activeDayData = useMemo(() => {
    return formData.days.find((day) => day.day_number === activeDay) || null
  }, [formData.days, activeDay])

  const updateDay = useCallback((dayNumber, updater) => {
    setFormData((prev) => {
      const days = prev.days.map((day) => {
        if (day.day_number !== dayNumber) return day
        const draftDay = {
          ...day,
          meals: day.meals.map((meal) => ({ ...meal }))
        }
        const updated = updater(draftDay) || draftDay
        const totals = calculateDayTotals(updated.meals)
        return {
          ...updated,
          total_calories: totals.calories,
          total_protein: totals.protein,
          total_fat: totals.fat,
          total_carbs: totals.carbs
        }
      })
      return {
        ...prev,
        days
      }
    })
  }, [calculateDayTotals])

  const updateDaysRange = useCallback((startDay, endDay, updater) => {
    setFormData((prev) => {
      const days = prev.days.map((day) => {
        if (day.day_number < startDay || day.day_number > endDay) return day
        const draftDay = {
          ...day,
          meals: day.meals.map((meal) => ({ ...meal }))
        }
        const updated = updater(draftDay) || draftDay
        const totals = calculateDayTotals(updated.meals)
        return {
          ...updated,
          total_calories: totals.calories,
          total_protein: totals.protein,
          total_fat: totals.fat,
          total_carbs: totals.carbs
        }
      })
      return {
        ...prev,
        days
      }
    })
  }, [calculateDayTotals])

  const assignRecipeToMeal = useCallback((dayNumber, mealType, recipeId, options = {}) => {
    const recipe = recipesMap[recipeId]
    if (!recipe) {
      toast.error('Không tìm thấy công thức được chọn')
      return
    }

    updateDay(dayNumber, (draft) => {
      const explicitIndex = typeof options.mealIndex === 'number' && draft.meals[options.mealIndex]
        ? options.mealIndex
        : null
      const targetIndex = explicitIndex !== null
        ? explicitIndex
        : draft.meals.findIndex((meal) => meal.meal_type === mealType)
      const baseOrder = targetIndex > -1 ? draft.meals[targetIndex].meal_order : draft.meals.length + 1
      const templateMeal = targetIndex > -1
        ? draft.meals[targetIndex]
        : createBaseMeal(mealType, baseOrder)
      const servings = Number(options.servings ?? templateMeal?.servings ?? 1)
      const safeServings = servings > 0 ? servings : 1
      const calories = Math.round((recipe.energy || 0) * safeServings)
      const protein = Number(((recipe.protein || 0) * safeServings).toFixed(2))
      const fat = Number(((recipe.fat || 0) * safeServings).toFixed(2))
      const carbs = Number(((recipe.carbohydrate || recipe.carbs || 0) * safeServings).toFixed(2))

      const nextMeal = {
        ...createBaseMeal(mealType, baseOrder),
        ...templateMeal,
        recipe_id: recipe._id,
        name: recipe.title,
        image: recipe.image,
        servings: safeServings,
        calories,
        protein,
        fat,
        carbs,
        difficult_level: recipe.difficult_level,
        time: recipe.time,
        is_optional: templateMeal?.is_optional || false
      }

      if (targetIndex > -1) {
        draft.meals[targetIndex] = nextMeal
      } else {
        draft.meals.push(nextMeal)
      }

      return {
        ...draft,
        meals: draft.meals
          .map((meal, index) => ({ ...meal, meal_order: index + 1 }))
          .sort((a, b) => a.meal_order - b.meal_order)
      }
    })
    setMissingMealKey(null)
  }, [createBaseMeal, recipesMap, updateDay])

  const clearMealSelection = useCallback((dayNumber, mealType, mealIndex) => {
    updateDay(dayNumber, (draft) => {
      if (typeof mealIndex === 'number') {
        const target = draft.meals[mealIndex]
        if (target) {
          draft.meals[mealIndex] = createBaseMeal(target.meal_type, target.meal_order)
        }
      } else {
        const targetIndex = draft.meals.findIndex((meal) => meal.meal_type === mealType)
        if (targetIndex > -1) {
          draft.meals[targetIndex] = createBaseMeal(mealType, draft.meals[targetIndex].meal_order)
        }
      }

      return {
        ...draft,
        meals: draft.meals.map((meal, index) => ({ ...meal, meal_order: index + 1 }))
      }
    })
    setMissingMealKey(null)
  }, [createBaseMeal, updateDay])

  const updateMealField = useCallback((dayNumber, mealIndex, field, value) => {
    updateDay(dayNumber, (draft) => {
      const meal = draft.meals[mealIndex]
      if (!meal) return draft

      if (field === 'meal_type') {
        const newType = Number(value)
        meal.meal_type = newType
        meal.meal_order = mealIndex + 1
        return draft
      }

      if (['calories', 'protein', 'fat', 'carbs'].includes(field)) {
        meal[field] = Number(value) || 0
        return draft
      }

      if (field === 'servings') {
        const newServings = Number(value)
        meal.servings = newServings > 0 ? newServings : 1
        if (meal.recipe_id) {
          const recipe = recipesMap[meal.recipe_id]
          if (recipe) {
            meal.calories = Math.round((recipe.energy || 0) * meal.servings)
            meal.protein = Number(((recipe.protein || 0) * meal.servings).toFixed(2))
            meal.fat = Number(((recipe.fat || 0) * meal.servings).toFixed(2))
            meal.carbs = Number(((recipe.carbohydrate || recipe.carbs || 0) * meal.servings).toFixed(2))
          }
        }
        return draft
      }

      if (field === 'is_optional') {
        meal.is_optional = Boolean(value)
        return draft
      }

      meal[field] = value
      return draft
    })
    if (['name', 'recipe_id', 'meal_type', 'is_optional', 'calories', 'protein', 'fat', 'carbs'].includes(field)) {
      setMissingMealKey(null)
    }
  }, [recipesMap, updateDay])

  const addMealToDay = useCallback((dayNumber) => {
    updateDay(dayNumber, (draft) => {
      const nextOrder = draft.meals.length + 1
      draft.meals.push(createBaseMeal(4, nextOrder))
      return draft
    })
    setMissingMealKey(null)
  }, [createBaseMeal, updateDay])

  const removeMealFromDay = useCallback((dayNumber, mealIndex, options = {}) => {
    updateDay(dayNumber, (draft) => {
      if (mealIndex < 0 || mealIndex >= draft.meals.length) return draft

      const isCoreMeal = mealIndex < DEFAULT_MEAL_SLOTS.length
      if (isCoreMeal && !options?.allowCoreRemoval) {
        const target = draft.meals[mealIndex]
        draft.meals[mealIndex] = createBaseMeal(target.meal_type, target.meal_order)
      } else {
        draft.meals = draft.meals
          .filter((_, index) => index !== mealIndex)
          .map((meal, index) => ({ ...meal, meal_order: index + 1 }))
      }
      return draft
    })
    setMissingMealKey(null)
  }, [createBaseMeal, updateDay])

  const applyRecipeToRange = useCallback(() => {
    if (!bulkConfig.recipeId) {
      toast.error('Vui lòng chọn món ăn để áp dụng')
      return
    }
    if (bulkConfig.startDay > bulkConfig.endDay) {
      toast.error('Khoảng ngày không hợp lệ')
      return
    }

    updateDaysRange(bulkConfig.startDay, bulkConfig.endDay, (draft) => {
      const mealsClone = draft.meals.map((meal) => ({ ...meal }))
      const targetIndex = mealsClone.findIndex((meal) => meal.meal_type === bulkConfig.mealType)
      const baseOrder = targetIndex > -1 ? mealsClone[targetIndex].meal_order : mealsClone.length + 1
      const templateMeal = targetIndex > -1 ? mealsClone[targetIndex] : createBaseMeal(bulkConfig.mealType, baseOrder)

      const recipe = recipesMap[bulkConfig.recipeId]
      if (!recipe) return draft

      const servings = Number(templateMeal.servings || 1)
      const calories = Math.round((recipe.energy || 0) * servings)
      const protein = Number(((recipe.protein || 0) * servings).toFixed(2))
      const fat = Number(((recipe.fat || 0) * servings).toFixed(2))
      const carbs = Number(((recipe.carbohydrate || recipe.carbs || 0) * servings).toFixed(2))

      const nextMeal = {
        ...templateMeal,
        recipe_id: recipe._id,
        name: recipe.title,
        image: recipe.image,
        calories,
        protein,
        fat,
        carbs
      }

      if (targetIndex > -1) {
        mealsClone[targetIndex] = nextMeal
      } else {
        mealsClone.push(nextMeal)
      }

      return {
        ...draft,
        meals: mealsClone
          .map((meal, index) => ({ ...meal, meal_order: index + 1 }))
          .sort((a, b) => a.meal_order - b.meal_order)
      }
    })

    toast.success(`Đã áp dụng công thức cho ngày ${bulkConfig.startDay} - ${bulkConfig.endDay}`)
  }, [bulkConfig, createBaseMeal, recipesMap, updateDaysRange])

  const copyDayToRange = useCallback(() => {
    const sourceDay = formData.days.find((day) => day.day_number === copyConfig.fromDay)
    if (!sourceDay) {
      toast.error('Không tìm thấy ngày nguồn để sao chép')
      return
    }

    if (copyConfig.startDay > copyConfig.endDay) {
      toast.error('Khoảng ngày cần sao chép không hợp lệ')
      return
    }

    const mealsTemplate = sourceDay.meals.map((meal, index) => ({
      ...createBaseMeal(meal.meal_type, index + 1),
      ...meal,
      meal_order: index + 1
    }))

    updateDaysRange(copyConfig.startDay, copyConfig.endDay, (draft) => ({
      ...draft,
      meals: mealsTemplate.map((meal) => ({ ...meal }))
    }))

    toast.success(`Đã sao chép ngày ${copyConfig.fromDay} sang ngày ${copyConfig.startDay}-${copyConfig.endDay}`)
  }, [copyConfig, createBaseMeal, formData.days, updateDaysRange])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      
      // Validate form
      if (!formData.title.trim()) {
        toast.error('Vui lòng nhập tên thực đơn')
        setValidationErrors((prev) => ({ ...prev, title: true }))
        focusField(titleInputRef)
        return
      }
      
      if (!formData.description.trim()) {
        toast.error('Vui lòng nhập mô tả')
        setValidationErrors((prev) => ({ ...prev, description: true }))
        focusField(descriptionInputRef)
        return
      }

      setMissingMealKey(null)

      const missingRequiredMeal = (() => {
        for (const day of formData.days) {
          const sortedMeals = [...day.meals].sort((a, b) => (a.meal_order ?? a.meal_type ?? 0) - (b.meal_order ?? b.meal_type ?? 0))

          for (let i = 0; i < DEFAULT_MEAL_SLOTS.length; i++) {
            const slot = DEFAULT_MEAL_SLOTS[i]
            const targetIndex = sortedMeals.findIndex((meal) => meal.meal_type === slot.meal_type)
            const meal = targetIndex > -1 ? sortedMeals[targetIndex] : null

            if (!meal) {
              return { dayNumber: day.day_number, mealIndex: targetIndex, slot, needsInsert: true }
            }

            const hasContent = Boolean(meal.recipe_id || (meal.name && meal.name.trim()))
            if (!hasContent && !meal.is_optional) {
              return { dayNumber: day.day_number, mealIndex: targetIndex, slot, needsInsert: false }
            }
          }
        }
        return null
      })()

      if (missingRequiredMeal) {
        const { dayNumber, mealIndex, slot, needsInsert } = missingRequiredMeal

        setCurrentStep(3)
        setActiveDay(dayNumber)
        highlightDaySection(dayNumber)

        if (!needsInsert && mealIndex > -1) {
          setMissingMealKey(`${dayNumber}-${mealIndex}`)
        } else {
          setMissingMealKey(null)
        }

        toast.error(
          `Ngày ${dayNumber} còn thiếu ${slot.label.toLowerCase()}. Vui lòng bổ sung trước khi tạo.`
        )
        return
      }

      const normalizedDays = formData.days.map((day) => {
        const cleanedMeals = day.meals
          .filter((meal) => {
            if (meal.recipe_id) return true
            return Boolean(meal.name && meal.name.trim())
          })
          .map((meal, index) => {
            const fallbackName = meal.recipe_id ? recipesMap[meal.recipe_id]?.title || '' : ''
            return {
              meal_type: meal.meal_type,
              meal_order: index + 1,
              recipe_id: meal.recipe_id || null,
              name: (meal.name && meal.name.trim()) || fallbackName,
              image: meal.image || '',
              calories: Number(meal.calories) || 0,
              protein: Number(meal.protein) || 0,
              fat: Number(meal.fat) || 0,
              carbs: Number(meal.carbs) || 0,
              time: meal.time || '',
              servings: Number(meal.servings) || 1,
              is_optional: Boolean(meal.is_optional),
              difficult_level: meal.difficult_level || '',
              notes: meal.notes || ''
            }
          })

        const totals = calculateDayTotals(cleanedMeals)

        return {
          day_number: day.day_number,
          title: day.title || `Ngày ${day.day_number}`,
          description: day.description || '',
          notes: day.notes || '',
          meals: cleanedMeals,
          total_calories: totals.calories,
          total_protein: totals.protein,
          total_fat: totals.fat,
          total_carbs: totals.carbs
        }
      })

      const firstEmptyDay = normalizedDays.find((day) => day.meals.length === 0)
      if (firstEmptyDay) {
        toast.error(`Ngày ${firstEmptyDay.day_number} chưa có món ăn. Vui lòng thêm ít nhất một món.`)
        setCurrentStep(3)
        setActiveDay(firstEmptyDay.day_number)
        highlightDaySection(firstEmptyDay.day_number)
        return
      }

      // Handle image upload if file selected
      let imageUrl = formData.image
      if (selectedFile) {
        try {
          // Upload image to server
          const formDataForUpload = new FormData()
          formDataForUpload.append('image', selectedFile)
          formDataForUpload.append('category', 'meal-plans')
          
          const uploadResponse = await http.post('/posts/upload', formDataForUpload, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            validateStatus: () => true
          })
          if (uploadResponse.status >= 200 && uploadResponse.status < 300 && uploadResponse.data?.result?.image_url) {
            imageUrl = uploadResponse.data.result.image_url
          } else {
            const warningMessage =
              uploadResponse.status === 404
                ? 'Máy chủ chưa hỗ trợ tải ảnh tại đường dẫn /posts/upload. Ảnh sẽ được gửi trực tiếp kèm biểu mẫu.'
                : 'Không thể upload hình ảnh, sử dụng ảnh hiện tại trong biểu mẫu.'
            toast.warning(warningMessage)
            imageUrl = formData.image
          }
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError)
          toast.warning('Không thể upload hình ảnh, sử dụng ảnh hiện tại trong biểu mẫu.')
          imageUrl = formData.image
        }
      }

      const aggregateTotals = normalizedDays.reduce(
        (acc, day) => ({
          calories: acc.calories + day.total_calories,
          protein: acc.protein + day.total_protein,
          fat: acc.fat + day.total_fat,
          carbs: acc.carbs + day.total_carbs
        }),
        { calories: 0, protein: 0, fat: 0, carbs: 0 }
      )

      const rawTargetCalories = formData.target_calories
      const parsedTargetCalories =
        rawTargetCalories === '' || rawTargetCalories === null || typeof rawTargetCalories === 'undefined'
          ? null
          : Number(rawTargetCalories)
      const targetCalories = Number.isFinite(parsedTargetCalories) ? parsedTargetCalories : null

      // Transform data to match API structure
      const apiData = {
        ...formData,
        target_calories: targetCalories,
        total_calories: aggregateTotals.calories,
        total_protein: aggregateTotals.protein,
        total_fat: aggregateTotals.fat,
        total_carbs: aggregateTotals.carbs,
        days: normalizedDays,
        image: imageUrl
      }

      // Call API
      await onCreate(apiData)
      onClose()
    } catch (error) {
      // Error đã được handle trong useMealPlans hook
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setValidationErrors((prev) => {
      if (Object.prototype.hasOwnProperty.call(prev, field)) {
        return {
          ...prev,
          [field]: false
        }
      }
      return prev
    })
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      // Show preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          image: e.target.result
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleTagsChange = (e) => {
    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
    handleInputChange('tags', tags)
  }

  const handleSuitableForChange = (e) => {
    const suitable = e.target.value.split(',').map(item => item.trim()).filter(item => item)
    handleInputChange('suitable_for', suitable)
  }

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 3))
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1))
  const submitButtonLabel = loading
    ? mode === 'edit'
      ? 'Đang cập nhật...'
      : 'Đang tạo...'
    : mode === 'edit'
      ? 'Cập nhật thực đơn'
      : 'Tạo thực đơn'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          {[1, 2, 3].map(step => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= step 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
                {step}
              </div>
              {step < 3 && (
                <div className={`w-12 h-0.5 mx-2 ${
                  currentStep > step ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}></div>
              )}
            </div>
          ))}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {currentStep === 1 && 'Thông tin cơ bản'}
          {currentStep === 2 && 'Hình ảnh & chi tiết'}
          {currentStep === 3 && 'Món ăn theo ngày'}
        </div>
      </div>

      {/* Step 1: Basic Information */}
      {currentStep === 1 && (
        <div className="space-y-4">
          {/* Tên thực đơn */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tên thực đơn <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              ref={titleInputRef}
              className={`w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 ${
                validationErrors.title
                  ? 'border border-red-500 dark:border-red-400 focus:ring-red-500'
                  : 'border border-gray-300 dark:border-gray-600 focus:ring-green-500'
              }`}
              aria-invalid={validationErrors.title}
              placeholder="Ví dụ: Thực đơn Keto 10 ngày"
              required
            />
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mô tả <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              ref={descriptionInputRef}
              className={`w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 resize-none ${
                validationErrors.description
                  ? 'border border-red-500 dark:border-red-400 focus:ring-red-500'
                  : 'border border-gray-300 dark:border-gray-600 focus:ring-green-500'
              }`}
              aria-invalid={validationErrors.description}
              placeholder="Mô tả ngắn gọn về thực đơn..."
              required
            />
          </div>

          {/* Row 1: Category, Duration, Calories */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Loại thực đơn
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
              >
                {Object.entries(MEAL_PLAN_CATEGORIES).map(([id, name]) => (
                  <option key={id} value={parseInt(id)}>{name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Số ngày
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Calories mục tiêu
              </label>
              <input
                type="number"
                min="1000"
                max="5000"
                step="100"
                value={formData.target_calories}
                onChange={(e) => {
                  const rawValue = e.target.value
                  if (rawValue === '') {
                    handleInputChange('target_calories', '')
                    return
                  }
                  const parsed = parseInt(rawValue, 10)
                  handleInputChange('target_calories', Number.isNaN(parsed) ? '' : parsed)
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                placeholder="Nhập khi bạn có mục tiêu cụ thể"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Bỏ trống nếu bạn muốn hệ thống tự tính tổng calories dựa trên các bữa ăn.
              </p>
            </div>
          </div>

          {/* Row 2: Difficulty, Price Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Độ khó
              </label>
              <select
                value={formData.difficulty_level}
                onChange={(e) => handleInputChange('difficulty_level', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
              >
                {Object.entries(DIFFICULTY_LEVELS).map(([id, name]) => (
                  <option key={id} value={parseInt(id)}>{name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mức giá
              </label>
              <select
                value={formData.price_range}
                onChange={(e) => handleInputChange('price_range', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
              >
                {Object.entries(PRICE_RANGES).map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Public checkbox */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_public"
              checked={formData.is_public}
              onChange={(e) => handleInputChange('is_public', e.target.checked)}
              className="mr-2 text-green-600 focus:ring-green-500"
            />
            <label htmlFor="is_public" className="text-sm text-gray-700 dark:text-gray-300">
              Công khai thực đơn
            </label>
          </div>
        </div>
      )}

      {/* Step 2: Image & Details */}
      {currentStep === 2 && (
        <div className="space-y-4">
          {/* Image upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Hình ảnh thực đơn
            </label>
            
            {/* Image input type selector */}
            <div className="flex mb-3">
              <button
                type="button"
                onClick={() => setImageInputType('url')}
                className={`flex items-center px-3 py-2 rounded-l-lg border border-r-0 ${
                  imageInputType === 'url' 
                    ? 'bg-green-100 border-green-300 text-green-700 dark:bg-green-900 dark:border-green-700 dark:text-green-300' 
                    : 'bg-gray-100 border-gray-300 text-gray-600 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400'
                }`}
              >
                <FaLink className="mr-2" /> URL
              </button>
              <button
                type="button"
                onClick={() => setImageInputType('file')}
                className={`flex items-center px-3 py-2 rounded-r-lg border border-l-0 ${
                  imageInputType === 'file' 
                    ? 'bg-green-100 border-green-300 text-green-700 dark:bg-green-900 dark:border-green-700 dark:text-green-300' 
                    : 'bg-gray-100 border-gray-300 text-gray-600 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400'
                }`}
              >
                <FaImage className="mr-2" /> Tải lên
              </button>
            </div>

            {imageInputType === 'url' ? (
              <input
                type="url"
                value={formData.image}
                onChange={(e) => handleInputChange('image', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                placeholder="https://example.com/image.jpg"
              />
            ) : (
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
              />
            )}

            {/* Image preview */}
            {formData.image && (
              <div className="mt-3">
                <img
                  src={selectedFile ? formData.image : getImageUrl(formData.image) || formData.image}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'
                  }}
                />
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Thẻ (phân cách bằng dấu phẩy)
            </label>
            <input
              type="text"
              value={formData.tags.join(', ')}
              onChange={handleTagsChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
              placeholder="keto, low_carb, high_fat"
            />
          </div>

          {/* Suitable for */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phù hợp với (phân cách bằng dấu phẩy)
            </label>
            <input
              type="text"
              value={formData.suitable_for.join(', ')}
              onChange={handleSuitableForChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
              placeholder="keto, low_carb"
            />
          </div>
        </div>
      )}

      {/* Step 3: Daily Meals */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <FaCalendarDay className="text-green-600" />
                  Lập kế hoạch {formData.duration} ngày
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Chọn công thức có sẵn và điều chỉnh khẩu phần cho từng ngày.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 dark:text-gray-300">
                <span>
                  Tổng calories: <span className="font-semibold text-green-600">{planTotals.calories.toLocaleString('vi-VN')}</span> kcal
                </span>
                {targetCaloriesValue !== null ? (
                  <span>
                    Mục tiêu: <span className="font-semibold">{targetCaloriesValue.toLocaleString('vi-VN')}</span> kcal
                    {caloriesDelta !== null && (
                      <span className={`ml-2 font-medium ${caloriesDelta > 0 ? 'text-orange-500' : caloriesDelta < 0 ? 'text-blue-500' : 'text-green-600'}`}>
                        {`${caloriesDelta > 0 ? '+' : ''}${caloriesDelta.toLocaleString('vi-VN')} kcal`}
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="text-xs text-gray-500 dark:text-gray-400">Chưa thiết lập calories mục tiêu</span>
                )}
                <span>
                  Protein: <span className="font-semibold">{planTotals.protein.toFixed(1)}</span> g
                </span>
                <span>
                  Chất béo: <span className="font-semibold">{planTotals.fat.toFixed(1)}</span> g
                </span>
                <span>
                  Carb: <span className="font-semibold">{planTotals.carbs.toFixed(1)}</span> g
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 border-b border-gray-200 dark:border-gray-700">
            {formData.days.map((day) => {
              const hasMeal = day.meals.some((meal) => meal.recipe_id || (meal.name && meal.name.trim()))
              const isActive = day.day_number === activeDay
              const isHighlighted = highlightedDay === day.day_number
              return (
                <button
                  key={day.day_number}
                  type="button"
                  onClick={() => setActiveDay(day.day_number)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-green-600 border-green-600 text-white'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-green-400'
                  } ${isHighlighted ? 'ring-2 ring-red-400 border-red-400' : ''}`}
                >
                  Ngày {day.day_number}
                  {hasMeal && <FaCheck className="text-xs" />}
                </button>
              )
            })}
          </div>

          <div className="grid gap-6 lg:grid-cols-[2.2fr,1fr]">
            <section className="space-y-4" ref={daySectionRef}>
              {activeDayData ? (
                <>
                  <div
                    className={`rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm ${
                      highlightedDay === activeDayData.day_number ? 'border-red-400 ring-2 ring-red-300/70' : ''
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <MdFastfood className="text-green-600" />
                          Ngày {activeDayData.day_number}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Tổng {activeDayData.total_calories.toLocaleString('vi-VN')} kcal · Protein {activeDayData.total_protein.toFixed(1)} g · Fat {activeDayData.total_fat.toFixed(1)} g · Carb {activeDayData.total_carbs.toFixed(1)} g
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => addMealToDay(activeDayData.day_number)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm transition-colors"
                        >
                          <FaPlus /> Thêm bữa phụ
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {activeDayData.meals.map((meal, mealIndex) => {
                      const recipeDetail = meal.recipe_id ? recipesMap[meal.recipe_id] : null
                      const imageSrc = meal.image || recipeDetail?.image || ''
                      const isCoreMeal = mealIndex < DEFAULT_MEAL_SLOTS.length
                      const macroFields = [
                        { key: 'calories', label: 'Calories (kcal)', step: 10 },
                        { key: 'protein', label: 'Protein (g)', step: 0.5 },
                        { key: 'fat', label: 'Chất béo (g)', step: 0.5 },
                        { key: 'carbs', label: 'Carb (g)', step: 0.5 }
                      ]
                      const mealKey = `${activeDayData.day_number}-${mealIndex}`
                      const isMissing = missingMealKey === mealKey

                      return (
                        <div
                          key={`${activeDayData.day_number}-${meal.meal_type}-${mealIndex}`}
                          className={`rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm transition-shadow ${
                            isMissing ? 'border-red-400 ring-2 ring-red-300/70' : ''
                          }`}
                        >
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-semibold">
                                {MEAL_TYPES[meal.meal_type] || 'Bữa ăn'}
                              </span>
                              <select
                                value={meal.meal_type}
                                onChange={(e) => updateMealField(activeDayData.day_number, mealIndex, 'meal_type', parseInt(e.target.value))}
                                className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                              >
                                {Object.entries(MEAL_TYPES).map(([id, label]) => (
                                  <option key={id} value={parseInt(id)}>
                                    {label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex items-center gap-3">
                              <label className="inline-flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300">
                                <input
                                  type="checkbox"
                                  checked={meal.is_optional}
                                  onChange={(e) => updateMealField(activeDayData.day_number, mealIndex, 'is_optional', e.target.checked)}
                                  className="mt-0.5 text-green-600 focus:ring-green-500"
                                />
                                <span>
                                  <span className="block leading-none font-semibold text-gray-700 dark:text-gray-200">Tùy chọn</span>
                                  <span className="block text-[10px] text-gray-500 dark:text-gray-400">
                                    Khi bật, bạn có thể để trống bữa này mà vẫn tạo được thực đơn.
                                  </span>
                                </span>
                              </label>
                              <button
                                type="button"
                                onClick={() => clearMealSelection(activeDayData.day_number, meal.meal_type, mealIndex)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-xs text-gray-600 dark:text-gray-300 hover:border-green-500"
                              >
                                <FaSync className="text-xs" />
                                Đặt lại
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (isCoreMeal) {
                                    const confirmed = window.confirm('Bữa ăn mặc định sẽ bị xóa khỏi ngày này. Bạn có chắc chắn?')
                                    if (!confirmed) return
                                  }
                                  removeMealFromDay(activeDayData.day_number, mealIndex, { allowCoreRemoval: true })
                                }}
                                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                                  isCoreMeal
                                    ? 'border-red-200 text-red-600 hover:bg-red-50'
                                    : 'border-red-300 text-red-600 hover:bg-red-50'
                                }`}
                              >
                                <FaTrash className="text-xs" /> Xóa bữa
                              </button>
                            </div>
                          </div>

                          {isMissing && (
                            <p className="mt-2 text-xs text-red-500 dark:text-red-400">
                              Bữa này đang để trống. Hãy chọn công thức hoặc nhập tên món trước khi tạo thực đơn.
                            </p>
                          )}

                          <div className="mt-4 grid gap-4 md:grid-cols-[100px,1fr]">
                            <div className="h-24 w-24 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                              {imageSrc ? (
                                <img
                                  src={getImageUrl(imageSrc) || imageSrc}
                                  alt={recipeDetail?.title || meal.name || 'Meal thumbnail'}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    e.target.src = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836'
                                  }}
                                />
                              ) : (
                                <FaUtensils className="text-gray-400 text-xl" />
                              )}
                            </div>

                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Tên món ăn</label>
                                  <input
                                    type="text"
                                    value={meal.name}
                                    placeholder={recipeDetail?.title || 'Nhập tên món'}
                                    onChange={(e) => updateMealField(activeDayData.day_number, mealIndex, 'name', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                                  />
                                </div>
                                {recipes.length > 0 && (
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Công thức tham chiếu</label>
                                    <select
                                      value={meal.recipe_id || ''}
                                      onChange={(e) => {
                                        const recipeId = e.target.value
                                        if (!recipeId) {
                                          clearMealSelection(activeDayData.day_number, meal.meal_type, mealIndex)
                                          return
                                        }
                                        assignRecipeToMeal(activeDayData.day_number, meal.meal_type, recipeId, {
                                          servings: meal.servings,
                                          mealIndex
                                        })
                                      }}
                                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                                      disabled={recipesLoading}
                                    >
                                      <option value="">Không dùng công thức</option>
                                      {recipes.map((recipe) => (
                                        <option key={recipe._id} value={recipe._id}>
                                          {recipe.title}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                )}
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {macroFields.map((field) => (
                                  <div key={field.key}>
                                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">{field.label}</label>
                                    <input
                                      type="number"
                                      step={field.step}
                                      min="0"
                                      value={meal[field.key] ?? 0}
                                      onChange={(e) => updateMealField(activeDayData.day_number, mealIndex, field.key, e.target.value)}
                                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                                    />
                                  </div>
                                ))}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Khẩu phần</label>
                                  <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={meal.servings}
                                    onChange={(e) => updateMealField(activeDayData.day_number, mealIndex, 'servings', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Thời gian gợi ý</label>
                                  <input
                                    type="text"
                                    value={meal.time || ''}
                                    onChange={(e) => updateMealField(activeDayData.day_number, mealIndex, 'time', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                                    placeholder="Ví dụ: 07:30"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Ghi chú</label>
                                  <input
                                    type="text"
                                    value={meal.notes || ''}
                                    onChange={(e) => updateMealField(activeDayData.day_number, mealIndex, 'notes', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                                    placeholder="Thêm ghi chú cho bữa ăn"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  Chưa có dữ liệu cho ngày này. Thử giảm số ngày hoặc thêm ngày mới.
                </div>
              )}
            </section>

            <aside className="space-y-4">
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Thư viện công thức</h4>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{recipes.length} món</span>
                </div>
                <input
                  type="text"
                  value={recipeSearch}
                  onChange={(e) => setRecipeSearch(e.target.value)}
                  placeholder="Tìm theo tên, thẻ..."
                  className="mt-3 w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                />

                <div className="mt-3 max-h-80 overflow-y-auto space-y-3 pr-1">
                  {recipesLoading ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400">Đang tải danh sách công thức...</p>
                  ) : filteredRecipes.length === 0 ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Không tìm thấy công thức phù hợp. Hãy tạo thêm món mới trong thư viện công thức.
                    </p>
                  ) : (
                    filteredRecipes.map((recipe) => {
                      const energy = Number(recipe.energy || 0)
                      const protein = Number(recipe.protein || 0)
                      const fat = Number(recipe.fat || 0)
                      const carbs = Number(recipe.carbohydrate ?? recipe.carbs ?? 0)
                      return (
                        <div key={recipe._id} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 p-3">
                          <div className="flex gap-3">
                            <div className="h-16 w-16 rounded-lg overflow-hidden bg-white dark:bg-gray-800 flex-shrink-0">
                              {recipe.image ? (
                                <img
                                  src={getImageUrl(recipe.image) || recipe.image}
                                  alt={recipe.title}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-gray-400">
                                  <FaUtensils />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <h5 className="text-sm font-semibold text-gray-900 dark:text-white">{recipe.title}</h5>
                                <span className="text-xs text-green-600 font-semibold">{Math.round(energy)} kcal</span>
                              </div>
                              <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-gray-600 dark:text-gray-300">
                                <span>P: {protein.toFixed(1)} g</span>
                                <span>F: {fat.toFixed(1)} g</span>
                                <span>C: {carbs.toFixed(1)} g</span>
                              </div>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {Object.entries(MEAL_TYPES).map(([id, label]) => (
                                  <button
                                    key={id}
                                    type="button"
                                    onClick={() => {
                                      if (!activeDayData) {
                                        toast.error('Vui lòng chọn ngày cần thêm món')
                                        return
                                      }
                                      assignRecipeToMeal(activeDayData.day_number, parseInt(id), recipe._id)
                                    }}
                                    className="px-3 py-1 text-xs rounded-full border border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/40 transition-colors"
                                  >
                                    {label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                  <FaMagic className="text-green-600" />
                  Áp dụng nhanh
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Chọn công thức và áp dụng cho nhiều ngày cùng một loại bữa.
                </p>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Công thức</label>
                    <select
                      value={bulkConfig.recipeId}
                      onChange={(e) => setBulkConfig((prev) => ({ ...prev, recipeId: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Chọn công thức</option>
                      {recipes.map((recipe) => (
                        <option key={recipe._id} value={recipe._id}>
                          {recipe.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Loại bữa</label>
                    <select
                      value={bulkConfig.mealType}
                      onChange={(e) => setBulkConfig((prev) => ({ ...prev, mealType: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                    >
                      {Object.entries(MEAL_TYPES).map(([id, label]) => (
                        <option key={id} value={parseInt(id)}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Từ ngày</label>
                      <select
                        value={bulkConfig.startDay}
                        onChange={(e) => setBulkConfig((prev) => ({ ...prev, startDay: Number(e.target.value) }))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                      >
                        {Array.from({ length: formData.duration }, (_, index) => index + 1).map((day) => (
                          <option key={day} value={day}>
                            Ngày {day}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Đến ngày</label>
                      <select
                        value={bulkConfig.endDay}
                        onChange={(e) => setBulkConfig((prev) => ({ ...prev, endDay: Number(e.target.value) }))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                      >
                        {Array.from({ length: formData.duration }, (_, index) => index + 1).map((day) => (
                          <option key={day} value={day}>
                            Ngày {day}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={applyRecipeToRange}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  disabled={!bulkConfig.recipeId}
                >
                  <FaMagic /> Áp dụng
                </button>
              </div>

              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                  <FaCopy className="text-green-600" />
                  Sao chép ngày
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Sao chép toàn bộ thực đơn của một ngày sang các ngày khác.
                </p>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Ngày nguồn</label>
                    <select
                      value={copyConfig.fromDay}
                      onChange={(e) => setCopyConfig((prev) => ({ ...prev, fromDay: Number(e.target.value) }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                    >
                      {Array.from({ length: formData.duration }, (_, index) => index + 1).map((day) => (
                        <option key={day} value={day}>
                          Ngày {day}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Từ ngày</label>
                      <select
                        value={copyConfig.startDay}
                        onChange={(e) => setCopyConfig((prev) => ({ ...prev, startDay: Number(e.target.value) }))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                      >
                        {Array.from({ length: formData.duration }, (_, index) => index + 1).map((day) => (
                          <option key={day} value={day}>
                            Ngày {day}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Đến ngày</label>
                      <select
                        value={copyConfig.endDay}
                        onChange={(e) => setCopyConfig((prev) => ({ ...prev, endDay: Number(e.target.value) }))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                      >
                        {Array.from({ length: formData.duration }, (_, index) => index + 1).map((day) => (
                          <option key={day} value={day}>
                            Ngày {day}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={copyDayToRange}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold bg-gray-900 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  <FaCopy /> Sao chép
                </button>
              </div>
            </aside>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between pt-4">
        <div>
          {currentStep > 1 && (
            <button
              type="button"
              onClick={prevStep}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
            >
              Quay lại
            </button>
          )}
        </div>
        
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
          >
            Hủy
          </button>
          
          {currentStep < 3 ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              Tiếp tục
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitButtonLabel}
            </button>
          )}
        </div>
      </div>
    </form>
  )
}