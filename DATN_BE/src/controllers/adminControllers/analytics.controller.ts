import { Request, Response } from 'express'
import analyticsService from '~/services/adminServices/analytics.services'

export const getAIUsageAnalyticsController = async (req: Request, res: Response) => {
  const { period, startDate, endDate } = req.query
  const result = await analyticsService.getAIUsageAnalytics(
    period as string,
    startDate as string,
    endDate as string
  )
  return res.json({ result, message: 'Lấy thống kê AI thành công' })
}

export const getCommunityAnalyticsController = async (req: Request, res: Response) => {
  const { period, startDate, endDate } = req.query
  const result = await analyticsService.getCommunityAnalytics(
    period as string,
    startDate as string,
    endDate as string
  )
  return res.json({ result, message: 'Lấy thống kê cộng đồng thành công' })
}
