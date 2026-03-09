import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import HTTP_STATUS from '~/constants/httpStatus'
import savedWorkoutTemplateService from '~/services/userServices/savedWorkoutTemplate.services'

// POST /api/saved-workouts
export const createSavedWorkoutController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
    const user_id = (req as any).decoded?.user_id as string
    const result = await savedWorkoutTemplateService.createSavedWorkout({ ...req.body, user_id })
    return res.status(HTTP_STATUS.CREATED).json({
        message: 'Da luu bai tap thanh cong',
        result
    })
}

// GET /api/saved-workouts
export const getUserSavedWorkoutsController = async (req: Request, res: Response) => {
    const user_id = (req as any).decoded?.user_id as string
    const result = await savedWorkoutTemplateService.getUserSavedWorkouts(user_id)
    return res.status(HTTP_STATUS.OK).json({
        message: 'Lay danh sach bai tap da luu thanh cong',
        result
    })
}

// PATCH /api/saved-workouts/:id/schedule
export const updateSavedWorkoutScheduleController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
    const user_id = (req as any).decoded?.user_id as string
    const { id } = req.params
    const { schedule } = req.body
    const result = await savedWorkoutTemplateService.updateSchedule({ id, user_id, schedule })
    return res.status(HTTP_STATUS.OK).json({
        message: 'Cap nhat lich tap thanh cong',
        result
    })
}

// DELETE /api/saved-workouts/:id
export const deleteSavedWorkoutController = async (req: Request, res: Response) => {
    const user_id = (req as any).decoded?.user_id as string
    const { id } = req.params
    await savedWorkoutTemplateService.deleteSavedWorkout({ id, user_id })
    return res.status(HTTP_STATUS.OK).json({
        message: 'Da xoa bai tap da luu'
    })
}

// GET /api/saved-workouts/calendar?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
export const getWorkoutCalendarEventsController = async (req: Request, res: Response) => {
    const user_id = (req as any).decoded?.user_id as string
    const { start_date, end_date } = req.query as { start_date: string; end_date: string }
    const result = await savedWorkoutTemplateService.getWorkoutEventsForCalendar({
        user_id,
        start_date,
        end_date
    })
    return res.status(HTTP_STATUS.OK).json({
        message: 'Lay lich tap luyen thanh cong',
        result
    })
}

