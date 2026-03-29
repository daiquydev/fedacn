import { Request, Response } from 'express'
import sportEventVideoSessionService from '~/services/userServices/sportEventVideoSession.services'

// ─── Join Video Session ────────────────────────────────────────────────────────
export const joinVideoSessionController = async (req: Request, res: Response) => {
    try {
        const { eventId } = req.params
        const userId = (req as any).decoded?.user_id
        const { sessionId } = req.body

        const videoSession = await sportEventVideoSessionService.joinVideoSessionService(
            eventId,
            userId,
            sessionId
        )

        return res.status(201).json({
            result: videoSession,
            message: 'Đã tham gia video call thành công'
        })
    } catch (error) {
        return res.status(400).json({
            message: (error as Error).message
        })
    }
}

// ─── End Video Session ─────────────────────────────────────────────────────────
export const endVideoSessionController = async (req: Request, res: Response) => {
    try {
        const { eventId, vsId } = req.params
        const userId = (req as any).decoded?.user_id
        const { activeSeconds, totalSeconds, screenshots } = req.body

        // Validate input
        if (activeSeconds === undefined || activeSeconds === null) {
            return res.status(400).json({ message: 'activeSeconds là bắt buộc' })
        }
        if (totalSeconds === undefined || totalSeconds === null) {
            return res.status(400).json({ message: 'totalSeconds là bắt buộc' })
        }
        if (activeSeconds < 0 || totalSeconds < 0) {
            return res.status(400).json({ message: 'Giá trị thời gian không hợp lệ' })
        }

        const result = await sportEventVideoSessionService.endVideoSessionService(
            eventId,
            vsId,
            userId,
            Number(activeSeconds),
            Number(totalSeconds),
            Array.isArray(screenshots) ? screenshots : []
        )

        return res.json({
            result,
            message: 'Kết thúc video call và ghi nhận tiến độ thành công'
        })
    } catch (error) {
        return res.status(400).json({
            message: (error as Error).message
        })
    }
}

// ─── Get Video Sessions (history) ─────────────────────────────────────────────
export const getVideoSessionsController = async (req: Request, res: Response) => {
    try {
        const { eventId } = req.params
        const userId = (req as any).decoded?.user_id

        const sessions = await sportEventVideoSessionService.getVideoSessionsService(eventId, userId)

        return res.json({
            result: sessions,
            message: 'Lấy lịch sử video session thành công'
        })
    } catch (error) {
        return res.status(500).json({
            message: (error as Error).message
        })
    }
}

// ─── Get Single Video Session By Id ──────────────────────────────────────────
export const getVideoSessionByIdController = async (req: Request, res: Response) => {
    try {
        const { eventId, vsId } = req.params
        const userId = (req as any).decoded?.user_id || ''

        const session = await sportEventVideoSessionService.getVideoSessionByIdService(eventId, vsId, userId)

        if (!session) {
            return res.status(404).json({ message: 'Không tìm thấy buổi học' })
        }

        return res.json({
            result: session,
            message: 'Lấy thông tin buổi học thành công'
        })
    } catch (error) {
        return res.status(500).json({
            message: (error as Error).message
        })
    }
}

// ─── Get Active Video Session ──────────────────────────────────────────────────
export const getActiveVideoSessionController = async (req: Request, res: Response) => {
    try {
        const { eventId } = req.params
        const userId = (req as any).decoded?.user_id

        const session = await sportEventVideoSessionService.getActiveVideoSessionService(
            eventId,
            userId
        )

        return res.json({
            result: session,
            message: session ? 'Có video session đang hoạt động' : 'Không có video session đang hoạt động'
        })
    } catch (error) {
        return res.status(500).json({
            message: (error as Error).message
        })
    }
}

// ─── Get Video Session Stats ──────────────────────────────────────────────────
export const getVideoSessionStatsController = async (req: Request, res: Response) => {
    try {
        const { eventId } = req.params
        const userId = (req as any).decoded?.user_id

        const stats = await sportEventVideoSessionService.getVideoSessionStatsService(eventId, userId)

        return res.json({
            result: stats,
            message: 'Lấy thống kê video session thành công'
        })
    } catch (error) {
        return res.status(500).json({
            message: (error as Error).message
        })
    }
}

// ─── Soft-delete Video Session ────────────────────────────────────────────────
export const softDeleteVideoSessionController = async (req: Request, res: Response) => {
    try {
        const { eventId, vsId } = req.params
        const userId = (req as any).decoded?.user_id

        const session = await sportEventVideoSessionService.softDeleteVideoSessionService(eventId, vsId, userId)

        return res.json({
            result: session,
            message: 'Đã xóa buổi học thành công'
        })
    } catch (error) {
        return res.status(400).json({
            message: (error as Error).message
        })
    }
}
