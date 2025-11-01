import { Router } from 'express'
import {
  calculateDailyNutritionController,
  analyzeMealController,
  suggestMealPlanController,
  getIngredientNutritionController,
  compareRecipesController,
  findSimilarRecipesController,
  calculateBMIController,
  getNutritionRecommendationController
} from '~/controllers/userControllers/nutrition.controller'
import { wrapRequestHandler } from '~/utils/handler'

const nutritionRouter = Router()

// Public routes
nutritionRouter.get('/recommendation', wrapRequestHandler(getNutritionRecommendationController))
nutritionRouter.post('/calculate-daily', wrapRequestHandler(calculateDailyNutritionController))
nutritionRouter.post('/calculate-bmi', wrapRequestHandler(calculateBMIController))
nutritionRouter.post('/analyze-meal', wrapRequestHandler(analyzeMealController))
nutritionRouter.post('/suggest-meal-plan', wrapRequestHandler(suggestMealPlanController))
nutritionRouter.post('/compare-recipes', wrapRequestHandler(compareRecipesController))
nutritionRouter.get('/ingredient/:id', wrapRequestHandler(getIngredientNutritionController))
nutritionRouter.get('/similar-recipes/:id', wrapRequestHandler(findSimilarRecipesController))

export default nutritionRouter
