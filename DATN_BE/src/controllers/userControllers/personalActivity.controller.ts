import { Request, Response } from 'express'
import personalActivityService from '~/services/userServices/personalActivity.services'

export const startPersonalActivityController = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).decoded?.user_id
        const { name, activityType, startLat, startLng } = req.body

        const activity = await personalActivityService.startActivityService({
            userId,
            name,
            activityType,
            startLat,
            startLng
        })

        return res.status(201).json({
            result: activity,
            message: 'Personal activity started successfully'
        })
    } catch (error) {
        return res.status(400).json({ message: (error as Error).message })
    }
}

export const updatePersonalActivityController = async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        const userId = (req as any).decoded?.user_id
        const updateData = req.body

        const activity = await personalActivityService.updateActivityService(id, userId, updateData)

        return res.json({
            result: activity,
            message: 'Activity updated successfully'
        })
    } catch (error) {
        return res.status(400).json({ message: (error as Error).message })
    }
}

export const completePersonalActivityController = async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        const userId = (req as any).decoded?.user_id
        const finalData = req.body

        const activity = await personalActivityService.completeActivityService(id, userId, finalData)

        return res.json({
            result: activity,
            message: 'Activity completed successfully'
        })
    } catch (error) {
        return res.status(400).json({ message: (error as Error).message })
    }
}

export const discardPersonalActivityController = async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        const userId = (req as any).decoded?.user_id

        const activity = await personalActivityService.discardActivityService(id, userId)

        return res.json({
            result: activity,
            message: 'Activity discarded'
        })
    } catch (error) {
        return res.status(400).json({ message: (error as Error).message })
    }
}

export const getUserPersonalActivitiesController = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).decoded?.user_id
        const page = parseInt(req.query.page as string) || 1
        const limit = parseInt(req.query.limit as string) || 10
        const range = typeof req.query.range === 'string' ? req.query.range : 'all'
        const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : undefined
        const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : undefined

        const data = await personalActivityService.getUserActivitiesService(
            userId,
            page,
            limit,
            range,
            startDate,
            endDate
        )

        return res.json({
            result: data,
            message: 'Get user personal activities successfully'
        })
    } catch (error) {
        return res.status(500).json({ message: (error as Error).message })
    }
}
