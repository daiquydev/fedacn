import { Request, Response } from 'express'
import activityTrackingService from '~/services/userServices/activityTracking.services'

export const startActivityController = async (req: Request, res: Response) => {
    try {
        const { eventId } = req.params
        const userId = (req as any).decoded?.user_id
        const { activityType, startLat, startLng } = req.body

        const activity = await activityTrackingService.startActivityService({
            eventId,
            userId,
            activityType,
            startLat,
            startLng
        })

        return res.status(201).json({
            result: activity,
            message: 'Activity started successfully'
        })
    } catch (error) {
        return res.status(400).json({
            message: (error as Error).message
        })
    }
}

export const updateActivityController = async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        const userId = (req as any).decoded?.user_id
        const updateData = req.body

        const activity = await activityTrackingService.updateActivityService(id, userId, updateData)

        return res.json({
            result: activity,
            message: 'Activity updated successfully'
        })
    } catch (error) {
        return res.status(400).json({
            message: (error as Error).message
        })
    }
}

export const completeActivityController = async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        const userId = (req as any).decoded?.user_id
        const finalData = req.body

        const activity = await activityTrackingService.completeActivityService(id, userId, finalData)

        return res.json({
            result: activity,
            message: 'Activity completed successfully. Progress has been recorded.'
        })
    } catch (error) {
        return res.status(400).json({
            message: (error as Error).message
        })
    }
}

export const discardActivityController = async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        const userId = (req as any).decoded?.user_id

        const activity = await activityTrackingService.discardActivityService(id, userId)

        return res.json({
            result: activity,
            message: 'Activity discarded'
        })
    } catch (error) {
        return res.status(400).json({
            message: (error as Error).message
        })
    }
}

export const getActivityController = async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        const userId = (req as any).decoded?.user_id

        const activity = await activityTrackingService.getActivityService(id, userId)

        return res.json({
            result: activity,
            message: 'Get activity successfully'
        })
    } catch (error) {
        return res.status(400).json({
            message: (error as Error).message
        })
    }
}

export const getUserActivitiesController = async (req: Request, res: Response) => {
    try {
        const { eventId } = req.params
        const userId = (req as any).decoded?.user_id

        const data = await activityTrackingService.getUserActivitiesService(eventId, userId)

        return res.json({
            result: data,
            message: 'Get user activities successfully'
        })
    } catch (error) {
        return res.status(500).json({
            message: (error as Error).message
        })
    }
}

export const softDeleteActivityController = async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        const userId = (req as any).decoded?.user_id

        const activity = await activityTrackingService.softDeleteActivityService(id, userId)

        return res.json({
            result: activity,
            message: 'Đã xóa hoạt động thành công'
        })
    } catch (error) {
        return res.status(400).json({
            message: (error as Error).message
        })
    }
}
