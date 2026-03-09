import { Request, Response } from 'express'
import adminMuscleGroupService from '../../services/adminMuscleGroup.service'
import HTTP_STATUS from '../../constants/httpStatus'

export const getMuscleGroupsController = async (req: Request, res: Response) => {
    try {
        const groups = await adminMuscleGroupService.getAll()
        return res.json({ result: groups, message: 'Lấy danh sách nhóm cơ thành công' })
    } catch (error) {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: (error as Error).message })
    }
}

export const getActiveMuscleGroupsController = async (req: Request, res: Response) => {
    try {
        const groups = await adminMuscleGroupService.getActive()
        return res.json({ result: groups, message: 'Lấy danh sách nhóm cơ thành công' })
    } catch (error) {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: (error as Error).message })
    }
}

export const createMuscleGroupController = async (req: Request, res: Response) => {
    try {
        const { name, name_en, body_part_ids, image_url, description } = req.body
        if (!name || !name_en) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Tên nhóm cơ không được để trống' })
        }
        const group = await adminMuscleGroupService.create({ name, name_en, body_part_ids, image_url, description })
        return res.status(HTTP_STATUS.CREATED).json({ result: group, message: 'Tạo nhóm cơ thành công' })
    } catch (error) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: (error as Error).message })
    }
}

export const updateMuscleGroupController = async (req: Request, res: Response) => {
    try {
        const group = await adminMuscleGroupService.update(req.params.id, req.body)
        return res.json({ result: group, message: 'Cập nhật nhóm cơ thành công' })
    } catch (error) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: (error as Error).message })
    }
}

export const deleteMuscleGroupController = async (req: Request, res: Response) => {
    try {
        await adminMuscleGroupService.delete(req.params.id)
        return res.json({ message: 'Xóa nhóm cơ thành công' })
    } catch (error) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: (error as Error).message })
    }
}
