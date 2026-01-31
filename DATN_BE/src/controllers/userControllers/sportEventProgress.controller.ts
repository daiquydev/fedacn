import { Request, Response } from 'express'
import sportEventProgressService from '~/services/userServices/sportEventProgress.services'

export const addProgressController = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params
    const userId = (req as any).decoded?.user_id
    const { value, unit, distance, time, calories, proofImage, notes } = req.body

    if (!value || !unit) {
      return res.status(400).json({
        message: 'Value and unit are required'
      })
    }

    const progress = await sportEventProgressService.addProgressService({
      eventId,
      userId,
      value,
      unit,
      distance,
      time,
      calories,
      proofImage,
      notes
    })

    return res.status(201).json({
      result: progress,
      message: 'Progress added successfully'
    })
  } catch (error) {
    return res.status(400).json({
      message: (error as Error).message
    })
  }
}

export const getUserProgressController = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params
    const userId = (req as any).decoded?.user_id

    const progressData = await sportEventProgressService.getUserProgressService(eventId, userId)

    return res.json({
      result: progressData,
      message: 'Get user progress successfully'
    })
  } catch (error) {
    return res.status(500).json({
      message: (error as Error).message
    })
  }
}

export const getLeaderboardController = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params
    const { sortBy } = req.query

    const leaderboardData = await sportEventProgressService.getLeaderboardService(
      eventId,
      sortBy as string
    )

    return res.json({
      result: leaderboardData,
      message: 'Get leaderboard successfully'
    })
  } catch (error) {
    return res.status(500).json({
      message: (error as Error).message
    })
  }
}

export const getParticipantsController = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params
    const { page, limit, search } = req.query

    const participantsData = await sportEventProgressService.getParticipantsService(eventId, {
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      search: search as string
    })

    return res.json({
      result: participantsData,
      message: 'Get participants successfully'
    })
  } catch (error) {
    return res.status(500).json({
      message: (error as Error).message
    })
  }
}

export const updateProgressController = async (req: Request, res: Response) => {
  try {
    const { progressId } = req.params
    const userId = (req as any).decoded?.user_id
    const updateData = req.body

    const progress = await sportEventProgressService.updateProgressService(progressId, userId, updateData)

    return res.json({
      result: progress,
      message: 'Progress updated successfully'
    })
  } catch (error) {
    return res.status(400).json({
      message: (error as Error).message
    })
  }
}

export const deleteProgressController = async (req: Request, res: Response) => {
  try {
    const { progressId } = req.params
    const userId = (req as any).decoded?.user_id

    await sportEventProgressService.deleteProgressService(progressId, userId)

    return res.json({
      message: 'Progress deleted successfully'
    })
  } catch (error) {
    return res.status(400).json({
      message: (error as Error).message
    })
  }
}
