import { Request, Response } from 'express'
import nutritionService, { UserProfile } from '~/services/userServices/nutrition.services'

export const calculateDailyNutritionController = async (req: Request, res: Response) => {
  const { age, gender, weight, height, activityLevel, goal } = req.body

  if (!age || !gender || !weight || !height || !activityLevel) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng cung cấp đầy đủ thông tin: tuổi, giới tính, cân nặng, chiều cao, mức độ hoạt động'
    })
  }

  const userProfile: UserProfile = {
    age: Number(age),
    gender,
    weight: Number(weight),
    height: Number(height),
    activityLevel,
    goal: goal || 'maintain'
  }

  const bmr = nutritionService.calculateBMR(userProfile)
  const tdee = nutritionService.calculateTDEE(userProfile)
  const recommendation = nutritionService.calculateDailyNutritionRecommendation(userProfile)
  const bmi = nutritionService.calculateBMI(userProfile.weight, userProfile.height)

  return res.json({
    success: true,
    result: {
      userProfile,
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      recommendation,
      bmi
    },
    message: 'Tính toán dinh dưỡng thành công'
  })
}

export const analyzeMealController = async (req: Request, res: Response) => {
  const { recipeIds, servingSizes } = req.body

  if (!recipeIds || !Array.isArray(recipeIds) || recipeIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng cung cấp danh sách ID công thức hợp lệ'
    })
  }

  const result = await nutritionService.analyzeMealNutrition(recipeIds, servingSizes)

  return res.json({
    success: true,
    result,
    message: 'Phân tích bữa ăn thành công'
  })
}

export const suggestMealPlanController = async (req: Request, res: Response) => {
  const { targetNutrition, mealsPerDay } = req.body

  if (!targetNutrition || !targetNutrition.calories) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng cung cấp mục tiêu dinh dưỡng hợp lệ'
    })
  }

  const result = await nutritionService.suggestMealPlan(targetNutrition, mealsPerDay || 3)

  return res.json({
    success: true,
    result,
    message: 'Đề xuất thực đơn thành công'
  })
}

export const getIngredientNutritionController = async (req: Request, res: Response) => {
  const { id } = req.params

  const result = await nutritionService.getIngredientNutrition(id)

  if (!result) {
    return res.status(404).json({
      success: false,
      message: 'Không tìm thấy nguyên liệu'
    })
  }

  return res.json({
    success: true,
    result: result.nutrition,
    message: 'Lấy thông tin dinh dưỡng thành công'
  })
}

export const compareRecipesController = async (req: Request, res: Response) => {
  const { recipeIds } = req.body

  if (!recipeIds || !Array.isArray(recipeIds) || recipeIds.length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng cung cấp ít nhất 2 ID công thức để so sánh'
    })
  }

  const result = await nutritionService.compareRecipes(recipeIds)

  return res.json({
    success: true,
    result,
    message: 'So sánh công thức thành công'
  })
}

export const findSimilarRecipesController = async (req: Request, res: Response) => {
  const { id } = req.params
  const { limit } = req.query

  const result = await nutritionService.findSimilarRecipes(id, Number(limit) || 5)

  if (result.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Không tìm thấy công thức tương tự'
    })
  }

  return res.json({
    success: true,
    result,
    message: 'Tìm công thức tương tự thành công'
  })
}

export const calculateBMIController = async (req: Request, res: Response) => {
  const { weight, height } = req.body

  if (!weight || !height) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng cung cấp cân nặng và chiều cao'
    })
  }

  const result = nutritionService.calculateBMI(Number(weight), Number(height))

  return res.json({
    success: true,
    result,
    message: 'Tính BMI thành công'
  })
}

export const getNutritionRecommendationController = async (req: Request, res: Response) => {
  const { age, gender, weight, height, activityLevel, goal } = req.query

  if (!age || !gender || !weight || !height || !activityLevel) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng cung cấp đầy đủ thông tin trong query parameters'
    })
  }

  const userProfile: UserProfile = {
    age: Number(age),
    gender: gender as 'male' | 'female',
    weight: Number(weight),
    height: Number(height),
    activityLevel: activityLevel as any,
    goal: (goal as any) || 'maintain'
  }

  const recommendation = nutritionService.calculateDailyNutritionRecommendation(userProfile)

  return res.json({
    success: true,
    result: recommendation,
    message: 'Lấy khuyến nghị dinh dưỡng thành công'
  })
}
