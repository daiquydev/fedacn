import { Router } from 'express'
import {
  getPersonalDashboardStatsController,
  getCaloriesHistoryController,
  getTodayMealsController,
  getMealPlanHistoryController,
  getPersonalPostsStatsController,
  getNutritionTrendController
} from '~/controllers/userControllers/personalDashboard.controller'
import { accessTokenValidator } from '~/middlewares/authUser.middleware'
import { wrapRequestHandler } from '~/utils/handler'

const personalDashboardRouter = Router()

/**
 * Description: Get personal dashboard stats overview
 * Path: /personal-dashboard/stats
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 */
personalDashboardRouter.get('/stats', accessTokenValidator, wrapRequestHandler(getPersonalDashboardStatsController))

/**
 * Description: Get calories consumption history
 * Path: /personal-dashboard/calories-history
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 * Query: { days?: number } - default 30
 */
personalDashboardRouter.get('/calories-history', accessTokenValidator, wrapRequestHandler(getCaloriesHistoryController))

/**
 * Description: Get today's meals
 * Path: /personal-dashboard/today-meals
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 */
personalDashboardRouter.get('/today-meals', accessTokenValidator, wrapRequestHandler(getTodayMealsController))

/**
 * Description: Get meal plan application history
 * Path: /personal-dashboard/meal-plan-history
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 * Query: { page?: number, limit?: number }
 */
personalDashboardRouter.get('/meal-plan-history', accessTokenValidator, wrapRequestHandler(getMealPlanHistoryController))

/**
 * Description: Get personal posts statistics
 * Path: /personal-dashboard/posts-stats
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 */
personalDashboardRouter.get('/posts-stats', accessTokenValidator, wrapRequestHandler(getPersonalPostsStatsController))

/**
 * Description: Get nutrition trend data
 * Path: /personal-dashboard/nutrition-trend
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 * Query: { days?: number } - default 7
 */
personalDashboardRouter.get('/nutrition-trend', accessTokenValidator, wrapRequestHandler(getNutritionTrendController))

export default personalDashboardRouter
