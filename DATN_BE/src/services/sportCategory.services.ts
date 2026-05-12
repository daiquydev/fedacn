import { Types } from 'mongoose'
import SportCategoryModel from '~/models/schemas/sportCategory.schema'
import SportEventModel from '~/models/schemas/sportEvent.schema'

export class SportCategoryService {
    /** Get all non-deleted categories (dùng cho user & event dropdown) */
    async getSportCategories() {
        return await SportCategoryModel.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 })
    }

    /** Get ALL categories including deleted kèm trạng thái isDeleted (dùng cho user FE resolve tên danh mục) */
    async getSportCategoriesAllWithStatus() {
        return await SportCategoryModel.find().sort({ isDeleted: 1, createdAt: -1 }).lean()
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
            icon: body.icon || 'sport',
            type: body.type,
            kcal_per_unit: body.kcal_per_unit
        })
        await newCategory.save()
        return newCategory
    }

    async updateSportCategory(id: string, body: any) {
        if (!Types.ObjectId.isValid(id)) {
            throw new Error('ID không hợp lệ')
        }
        const existing = await SportCategoryModel.findById(id)
        if (!existing) {
            throw new Error('Không tìm thấy danh mục')
        }
        const oldName = existing.name
        const newName = body.name

        const category = await SportCategoryModel.findByIdAndUpdate(
            id,
            { name: newName, icon: body.icon, type: body.type, kcal_per_unit: body.kcal_per_unit },
            { new: true, runValidators: true }
        )

        // P2: Cascade rename — cập nhật tất cả sự kiện đang dùng tên cũ
        if (oldName !== newName) {
            await SportEventModel.updateMany({ category: oldName }, { $set: { category: newName } })
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
