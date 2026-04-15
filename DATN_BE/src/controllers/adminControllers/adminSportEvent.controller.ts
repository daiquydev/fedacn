import { Request, Response } from 'express'
import adminSportEventService from '~/services/adminServices/adminSportEvent.services'

export const adminGetAllSportEventsController = async (req: Request, res: Response) => {
    try {
        const { page, limit, search, category, eventType, status, sortBy, dateFrom, dateTo } = req.query
        const result = await adminSportEventService.getAllEventsAdmin({
            page: Number(page) || 1,
            limit: Number(limit) || 10,
            search: search as string,
            category: category as string,
            eventType: eventType as string,
            status: status as string,
            sortBy: sortBy as string,
            dateFrom: dateFrom as string,
            dateTo: dateTo as string
        })
        return res.json({ result, message: 'Lấy danh sách sự kiện thành công' })
    } catch (error) {
        return res.status(500).json({ message: (error as Error).message })
    }
}

export const adminGetEventStatsController = async (req: Request, res: Response) => {
    try {
        const stats = await adminSportEventService.getEventStatsAdmin()
        return res.json({ result: stats, message: 'Lấy thống kê thành công' })
    } catch (error) {
        return res.status(500).json({ message: (error as Error).message })
    }
}

export const adminCreateSportEventController = async (req: Request, res: Response) => {
    try {
        const decoded = (req as any).decoded_authorization || (req as any).decoded
        const adminId = decoded?.user_id

        if (!adminId) {
            return res.status(401).json({ message: 'Unauthorized: No admin ID found' })
        }

        const event = await adminSportEventService.createEventAdmin(req.body, adminId)
        return res.status(201).json({ result: event, message: 'Tạo sự kiện thành công' })
    } catch (error) {
        return res.status(400).json({ message: (error as Error).message })
    }
}

export const adminUpdateSportEventController = async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        const event = await adminSportEventService.updateEventAdmin(id, req.body)
        return res.json({ result: event, message: 'Cập nhật sự kiện thành công' })
    } catch (error) {
        return res.status(400).json({ message: (error as Error).message })
    }
}

export const adminDeleteSportEventController = async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        await adminSportEventService.deleteEventAdmin(id)
        return res.json({ message: 'Xóa sự kiện thành công' })
    } catch (error) {
        return res.status(400).json({ message: (error as Error).message })
    }
}

export const adminRestoreSportEventController = async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        const event = await adminSportEventService.restoreEventAdmin(id)
        return res.json({ result: event, message: 'Khôi phục sự kiện thành công' })
    } catch (error) {
        return res.status(400).json({ message: (error as Error).message })
    }
}

export const adminHardDeleteSportEventController = async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        await adminSportEventService.hardDeleteEventAdmin(id)
        return res.json({ message: 'Xóa vĩnh viễn sự kiện thành công' })
    } catch (error) {
        return res.status(400).json({ message: (error as Error).message })
    }
}

export const adminGetSportEventParticipantsController = async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        const { page, limit, search } = req.query
        const result = await adminSportEventService.getEventParticipantsAdmin(id, {
            page: Number(page) || 1,
            limit: Math.min(Number(limit) || 100, 500),
            search: (search as string) || ''
        })
        return res.json({ result, message: 'Lấy danh sách thành viên thành công' })
    } catch (error) {
        return res.status(500).json({ message: (error as Error).message })
    }
}
