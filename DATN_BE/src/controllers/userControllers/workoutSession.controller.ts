import { Request, Response } from 'express'
import workoutSessionService from '~/services/workoutSession.service'

export const createWorkoutSessionController = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).decoded?.user_id
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' })
        }
        const session = await workoutSessionService.createSession(userId, req.body)
        return res.status(201).json({
            result: session,
            message: 'Workout session created successfully'
        })
    } catch (error) {
        return res.status(400).json({
            message: (error as Error).message
        })
    }
}

export const updateWorkoutSessionController = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).decoded?.user_id
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' })
        }
        const { id } = req.params
        const session = await workoutSessionService.updateSession(id, userId, req.body)
        if (!session) {
            return res.status(404).json({ message: 'Session not found' })
        }
        return res.json({
            result: session,
            message: 'Workout session updated successfully'
        })
    } catch (error) {
        return res.status(400).json({
            message: (error as Error).message
        })
    }
}

export const completeWorkoutSessionController = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).decoded?.user_id
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' })
        }
        const { id } = req.params
        const session = await workoutSessionService.completeSession(id, userId, req.body)
        if (!session) {
            return res.status(404).json({ message: 'Session not found' })
        }
        return res.json({
            result: session,
            message: 'Workout session completed successfully'
        })
    } catch (error) {
        return res.status(400).json({
            message: (error as Error).message
        })
    }
}

export const getWorkoutHistoryController = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).decoded?.user_id
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' })
        }
        const page = parseInt(req.query.page as string) || 1
        const limit = parseInt(req.query.limit as string) || 10
        const result = await workoutSessionService.getHistory(userId, page, limit)
        return res.json({
            result,
            message: 'Get workout history successfully'
        })
    } catch (error) {
        return res.status(500).json({
            message: (error as Error).message
        })
    }
}

export const getWorkoutSessionByIdController = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).decoded?.user_id
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' })
        }
        const { id } = req.params
        const session = await workoutSessionService.getSessionById(id, userId)
        if (!session) {
            return res.status(404).json({ message: 'Session not found' })
        }
        return res.json({
            result: session,
            message: 'Get workout session successfully'
        })
    } catch (error) {
        return res.status(500).json({
            message: (error as Error).message
        })
    }
}

export const quitWorkoutSessionController = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).decoded?.user_id
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' })
        }
        const { id } = req.params
        const session = await workoutSessionService.quitSession(id, userId)
        if (!session) {
            return res.status(404).json({ message: 'Session not found' })
        }
        return res.json({
            result: session,
            message: 'Workout session quit successfully'
        })
    } catch (error) {
        return res.status(400).json({
            message: (error as Error).message
        })
    }
}
