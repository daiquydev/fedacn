// Admin Exercise Service
import ExerciseModel from '../models/schemas/exercise.schema'

class AdminExerciseService {
    async getAll(query: any = {}) {
        const filter: any = {}

        // status filter: 'active' (default) | 'deleted' | 'all'
        const status = query.status || 'active'
        if (status === 'active') filter.isDeleted = { $ne: true }
        else if (status === 'deleted') filter.isDeleted = true
        // 'all' → no isDeleted filter

        if (query.search) {
            filter.$or = [
                { name: { $regex: query.search, $options: 'i' } },
                { name_vi: { $regex: query.search, $options: 'i' } }
            ]
        }

        // Filter by muscle group ObjectId
        if (query.muscle_group_id) filter.muscle_group_ids = query.muscle_group_id

        // Filter by category
        if (query.category) filter.category = query.category

        // Filter by equipment ObjectId
        if (query.equipment_id) filter.equipment_ids = query.equipment_id

        const page = parseInt(query.page) || 1
        const limit = parseInt(query.limit) || 50
        const skip = (page - 1) * limit

        const [exercises, total] = await Promise.all([
            ExerciseModel.find(filter)
                .populate('equipment_ids', 'name name_en image_url')
                .populate('muscle_group_ids', 'name name_en')
                .populate('secondary_muscle_ids', 'name name_en')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            ExerciseModel.countDocuments(filter)
        ])
        return { exercises, total, page, limit }
    }

    async getById(id: string) {
        return ExerciseModel.findById(id)
            .populate('equipment_ids', 'name name_en image_url')
            .populate('muscle_group_ids', 'name name_en')
            .populate('secondary_muscle_ids', 'name name_en')
    }

    async create(data: any) {
        return ExerciseModel.create(data)
    }

    async update(id: string, data: any) {
        return ExerciseModel.findByIdAndUpdate(id, data, { new: true })
            .populate('equipment_ids', 'name name_en image_url')
            .populate('muscle_group_ids', 'name name_en')
            .populate('secondary_muscle_ids', 'name name_en')
    }

    async softDelete(id: string) {
        return ExerciseModel.findByIdAndUpdate(
            id,
            { isDeleted: true, deletedAt: new Date() },
            { new: true }
        )
    }

    async restore(id: string) {
        return ExerciseModel.findByIdAndUpdate(
            id,
            { isDeleted: false, deletedAt: null },
            { new: true }
        )
    }
}

export default new AdminExerciseService()
