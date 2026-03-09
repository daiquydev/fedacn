import { Request, Response } from 'express'
import sportCategoryService from '~/services/sportCategory.services'
import HTTP_STATUS from '~/constants/httpStatus'

export const getSportCategoriesController = async (req: Request, res: Response) => {
    try {
        const categories = await sportCategoryService.getSportCategories()
        return res.status(HTTP_STATUS.OK).json({
            message: 'Lấy danh sách danh mục thể thao thành công',
            result: categories
        })
    } catch (error) {
        const errMsg = (error as Error).message
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            message: errMsg,
            errorInfo: { message: errMsg }
        })
    }
}

export const getAllSportCategoriesAdminController = async (req: Request, res: Response) => {
    try {
        const categories = await sportCategoryService.getAllSportCategoriesAdmin()
        return res.status(HTTP_STATUS.OK).json({
            message: 'Lấy danh sách danh mục thể thao (admin) thành công',
            result: categories
        })
    } catch (error) {
        const errMsg = (error as Error).message
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            message: errMsg,
            errorInfo: { message: errMsg }
        })
    }
}

export const createSportCategoryController = async (req: Request, res: Response) => {
    try {
        const { name, type } = req.body
        if (!name || !name.trim()) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                message: 'Tên danh mục không được để trống'
            })
        }
        if (!type || !['Ngoài trời', 'Trong nhà'].includes(type)) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                message: 'Loại hình không hợp lệ. Chỉ chấp nhận "Ngoài trời" hoặc "Trong nhà"'
            })
        }
        const category = await sportCategoryService.createSportCategory({ name: name.trim(), type })
        return res.status(HTTP_STATUS.CREATED).json({
            message: 'Thêm danh mục thể thao thành công',
            result: category
        })
    } catch (error) {
        const errMsg = (error as Error).message
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            message: errMsg,
            errorInfo: { message: errMsg }
        })
    }
}

export const updateSportCategoryController = async (req: Request, res: Response) => {
    const { id } = req.params
    try {
        const { name, type } = req.body
        if (!name || !name.trim()) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                message: 'Tên danh mục không được để trống'
            })
        }
        if (!type || !['Ngoài trời', 'Trong nhà'].includes(type)) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                message: 'Loại hình không hợp lệ. Chỉ chấp nhận "Ngoài trời" hoặc "Trong nhà"'
            })
        }
        const category = await sportCategoryService.updateSportCategory(id, { name: name.trim(), type })
        return res.status(HTTP_STATUS.OK).json({
            message: 'Cập nhật danh mục thể thao thành công',
            result: category
        })
    } catch (error) {
        const errMsg = (error as Error).message
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            message: errMsg,
            errorInfo: { message: errMsg }
        })
    }
}

export const softDeleteSportCategoryController = async (req: Request, res: Response) => {
    const { id } = req.params
    try {
        await sportCategoryService.softDeleteSportCategory(id)
        return res.status(HTTP_STATUS.OK).json({
            message: 'Xóa mềm danh mục thể thao thành công'
        })
    } catch (error) {
        const errMsg = (error as Error).message
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            message: errMsg,
            errorInfo: { message: errMsg }
        })
    }
}

export const restoreSportCategoryController = async (req: Request, res: Response) => {
    const { id } = req.params
    try {
        const category = await sportCategoryService.restoreSportCategory(id)
        return res.status(HTTP_STATUS.OK).json({
            message: 'Khôi phục danh mục thể thao thành công',
            result: category
        })
    } catch (error) {
        const errMsg = (error as Error).message
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            message: errMsg,
            errorInfo: { message: errMsg }
        })
    }
}

export const deleteSportCategoryController = async (req: Request, res: Response) => {
    const { id } = req.params
    try {
        await sportCategoryService.deleteSportCategory(id)
        return res.status(HTTP_STATUS.OK).json({
            message: 'Xóa danh mục thể thao thành công'
        })
    } catch (error) {
        const errMsg = (error as Error).message
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            message: errMsg,
            errorInfo: { message: errMsg }
        })
    }
}
