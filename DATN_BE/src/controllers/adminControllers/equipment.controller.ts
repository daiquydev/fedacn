import { Request, Response } from 'express'
import adminEquipmentService from '../../services/adminEquipment.service'
import HTTP_STATUS from '../../constants/httpStatus'

export const getEquipmentController = async (req: Request, res: Response) => {
    try {
        const equipment = await adminEquipmentService.getAll()
        return res.json({ result: equipment, message: 'Lấy danh sách thiết bị thành công' })
    } catch (error) {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: (error as Error).message })
    }
}

export const getActiveEquipmentController = async (req: Request, res: Response) => {
    try {
        const equipment = await adminEquipmentService.getActive()
        return res.json({ result: equipment, message: 'Lấy danh sách thiết bị thành công' })
    } catch (error) {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: (error as Error).message })
    }
}

export const createEquipmentController = async (req: Request, res: Response) => {
    try {
        const { name, name_en, image_url, description } = req.body
        if (!name || !name_en) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Tên thiết bị không được để trống' })
        }
        const equipment = await adminEquipmentService.create({ name, name_en, image_url, description })
        return res.status(HTTP_STATUS.CREATED).json({ result: equipment, message: 'Tạo thiết bị thành công' })
    } catch (error) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: (error as Error).message })
    }
}

export const updateEquipmentController = async (req: Request, res: Response) => {
    try {
        const equipment = await adminEquipmentService.update(req.params.id, req.body)
        return res.json({ result: equipment, message: 'Cập nhật thiết bị thành công' })
    } catch (error) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: (error as Error).message })
    }
}

export const deleteEquipmentController = async (req: Request, res: Response) => {
    try {
        await adminEquipmentService.delete(req.params.id)
        return res.json({ message: 'Xóa thiết bị thành công' })
    } catch (error) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: (error as Error).message })
    }
}
