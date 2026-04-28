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

export const getChallengeAnalyticsController = async (req: Request, res: Response) => {
  const { period, startDate, endDate } = req.query
  const result = await analyticsService.getChallengeAnalytics(
    period as string,
    startDate as string,
    endDate as string
  )
  return res.json({ result, message: 'Lấy thống kê thử thách thành công' })
}

export const getCommunityHealthAnalyticsController = async (req: Request, res: Response) => {
  const { period, startDate, endDate } = req.query
  const result = await analyticsService.getCommunityHealthAnalytics(
    period as string,
    startDate as string,
    endDate as string
  )
  return res.json({ result, message: 'Lấy thống kê sức khỏe cộng đồng thành công' })
}

export const getSystemOverviewAnalyticsController = async (_req: Request, res: Response) => {
  const result = await analyticsService.getSystemOverviewAnalytics()
  return res.json({ result, message: 'Lấy tổng quan hệ thống thành công' })
}

export const getUsersHealthAnalyticsController = async (req: Request, res: Response) => {
  const { period, startDate, endDate } = req.query
  const result = await analyticsService.getUsersHealthAnalytics(period as string, startDate as string, endDate as string)
  return res.json({ result, message: 'Lấy thống kê người dùng và sức khỏe thành công' })
}
