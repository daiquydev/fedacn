import ExerciseModel from '../models/schemas/exercise.schema'

class AdminExerciseService {
    async getAll(query: any = {}) {
        const filter: any = {}
        if (query.search) {
            filter.$or = [
                { name: { $regex: query.search, $options: 'i' } },
                { name_vi: { $regex: query.search, $options: 'i' } }
            ]
        }
        if (query.category) filter.category = query.category
        if (query.difficulty) filter.difficulty = query.difficulty

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

    async delete(id: string) {
        return ExerciseModel.findByIdAndDelete(id)
    }
}

export default new AdminExerciseService()
