import { Request, Response } from 'express'
import { TokenPayload } from '~/models/requests/authUser.request'
import personalDashboardService from '~/services/userServices/personalDashboard.services'

export const getPersonalDashboardStatsController = async (req: Request, res: Response) => {
  const user = req.decoded_authorization as TokenPayload
  const result = await personalDashboardService.getPersonalDashboardStats(user.user_id)
  return res.json({
    message: 'Get personal dashboard stats successfully',
    result
  })
}

export const getCaloriesHistoryController = async (req: Request, res: Response) => {
  const user = req.decoded_authorization as TokenPayload
  const { days = 30 } = req.query
  const result = await personalDashboardService.getCaloriesHistory(user.user_id, Number(days))
  return res.json({
    message: 'Get calories history successfully',
    result
  })
}

export const getTodayMealsController = async (req: Request, res: Response) => {
  const user = req.decoded_authorization as TokenPayload
  const result = await personalDashboardService.getTodayMeals(user.user_id)
  return res.json({
    message: 'Get today meals successfully',
    result
  })
}

export const getMealPlanHistoryController = async (req: Request, res: Response) => {
  const user = req.decoded_authorization as TokenPayload
  const { page = 1, limit = 10 } = req.query
  const result = await personalDashboardService.getMealPlanHistory(user.user_id, Number(page), Number(limit))
  return res.json({
    message: 'Get meal plan history successfully',
    result
  })
}

export const getPersonalPostsStatsController = async (req: Request, res: Response) => {
  const user = req.decoded_authorization as TokenPayload
  const result = await personalDashboardService.getPersonalPostsStats(user.user_id)
  return res.json({
    message: 'Get personal posts stats successfully',
    result
  })
}

export const getNutritionTrendController = async (req: Request, res: Response) => {
  const user = req.decoded_authorization as TokenPayload
  const { days = 7 } = req.query
  const result = await personalDashboardService.getNutritionTrend(user.user_id, Number(days))
  return res.json({
    message: 'Get nutrition trend successfully',
    result
  })
}
