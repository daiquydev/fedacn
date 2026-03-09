import { Types } from 'mongoose'
import SportCategoryModel from '~/models/schemas/sportCategory.schema'

export class SportCategoryService {
    /** Get all non-deleted categories (dùng cho user & event dropdown) */
    async getSportCategories() {
        return await SportCategoryModel.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 })
    }

    /** Get ALL categories including deleted (dùng cho admin management) */
    async getAllSportCategoriesAdmin() {
        return await SportCategoryModel.find().sort({ isDeleted: 1, createdAt: -1 })
    }

    async createSportCategory(body: any) {
        // Check against non-deleted names only
        const existingCategory = await SportCategoryModel.findOne({ name: body.name, isDeleted: { $ne: true } })
        if (existingCategory) {
            throw new Error('Danh mục đã tồn tại')
        }
        const newCategory = new SportCategoryModel({
            name: body.name,
            type: body.type
        })
        await newCategory.save()
        return newCategory
    }

    async updateSportCategory(id: string, body: any) {
        if (!Types.ObjectId.isValid(id)) {
            throw new Error('ID không hợp lệ')
        }
        const category = await SportCategoryModel.findByIdAndUpdate(
            id,
            { name: body.name, type: body.type },
            { new: true, runValidators: true }
        )
        if (!category) {
            throw new Error('Không tìm thấy danh mục')
        }
        return category
    }

    /** Soft delete — đặt isDeleted = true */
    async softDeleteSportCategory(id: string) {
        if (!Types.ObjectId.isValid(id)) {
            throw new Error('ID không hợp lệ')
        }
        const category = await SportCategoryModel.findByIdAndUpdate(
            id,
            { isDeleted: true, deletedAt: new Date() },
            { new: true }
        )
        if (!category) {
            throw new Error('Không tìm thấy danh mục')
        }
        return category
    }

    /** Restore soft-deleted category */
    async restoreSportCategory(id: string) {
        if (!Types.ObjectId.isValid(id)) {
            throw new Error('ID không hợp lệ')
        }
        const category = await SportCategoryModel.findByIdAndUpdate(
            id,
            { isDeleted: false, deletedAt: null },
            { new: true }
        )
        if (!category) {
            throw new Error('Không tìm thấy danh mục')
        }
        return category
    }

    /** Hard delete (dự phòng nếu cần) */
    async deleteSportCategory(id: string) {
        if (!Types.ObjectId.isValid(id)) {
            throw new Error('ID không hợp lệ')
        }
        const category = await SportCategoryModel.findByIdAndDelete(id)
        if (!category) {
            throw new Error('Không tìm thấy danh mục')
        }
        return category
    }
}

const sportCategoryService = new SportCategoryService()
export default sportCategoryService
