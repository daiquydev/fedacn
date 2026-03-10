import mongoose, { Types } from 'mongoose'

export interface SportCategory {
    _id?: Types.ObjectId
    name: string
    type: 'Ngoài trời' | 'Trong nhà'
    kcal_per_unit: number // kcal/km (Ngoài trời) hoặc kcal/phút (Trong nhà)
    isDeleted?: boolean
    deletedAt?: Date
    createdAt?: Date
    updatedAt?: Date
}

const SportCategorySchema = new mongoose.Schema<SportCategory>(
    {
        name: { type: String, required: true },
        type: { type: String, enum: ['Ngoài trời', 'Trong nhà'], required: true },
        kcal_per_unit: { type: Number, default: 0, min: 0 },
        isDeleted: { type: Boolean, default: false },
        deletedAt: { type: Date, default: null }
    },
    {
        timestamps: true,
        collection: 'sport_categories'
    }
)

const SportCategoryModel = mongoose.model('SportCategory', SportCategorySchema)

export default SportCategoryModel
