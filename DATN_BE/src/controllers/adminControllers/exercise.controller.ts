import { Request, Response } from 'express'
import adminExerciseService from '../../services/adminExercise.service'
import HTTP_STATUS from '../../constants/httpStatus'

export const getExercisesAdminController = async (req: Request, res: Response) => {
    try {
        const result = await adminExerciseService.getAll(req.query)
        return res.json({ result, message: 'Lấy danh sách bài tập thành công' })
    } catch (error) {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: (error as Error).message })
    }
}

export const getExerciseByIdAdminController = async (req: Request, res: Response) => {
    try {
        const exercise = await adminExerciseService.getById(req.params.id)
        if (!exercise) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Không tìm thấy bài tập' })
        }
        return res.json({ result: exercise, message: 'Lấy bài tập thành công' })
    } catch (error) {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: (error as Error).message })
    }
}

export const createExerciseAdminController = async (req: Request, res: Response) => {
    try {
        const { name } = req.body
        if (!name) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Tên bài tập không được để trống' })
        }
        const exercise = await adminExerciseService.create(req.body)
        return res.status(HTTP_STATUS.CREATED).json({ result: exercise, message: 'Tạo bài tập thành công' })
    } catch (error) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: (error as Error).message })
    }
}

export const updateExerciseAdminController = async (req: Request, res: Response) => {
    try {
        const exercise = await adminExerciseService.update(req.params.id, req.body)
        return res.json({ result: exercise, message: 'Cập nhật bài tập thành công' })
    } catch (error) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: (error as Error).message })
    }
}

export const deleteExerciseAdminController = async (req: Request, res: Response) => {
    try {
        await adminExerciseService.softDelete(req.params.id)
        return res.json({ message: 'Xóa bài tập thành công' })
    } catch (error) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: (error as Error).message })
    }
}

export const restoreExerciseAdminController = async (req: Request, res: Response) => {
    try {
        const exercise = await adminExerciseService.restore(req.params.id)
        if (!exercise) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Không tìm thấy bài tập' })
        }
        return res.json({ result: exercise, message: 'Khôi phục bài tập thành công' })
    } catch (error) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: (error as Error).message })
    }
}
