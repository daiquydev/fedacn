import MuscleGroupModel from '../models/schemas/muscleGroup.schema'

class AdminMuscleGroupService {
    async getAll() {
        return MuscleGroupModel.find().sort({ createdAt: -1 })
    }

    async getActive() {
        return MuscleGroupModel.find({ is_active: true }).sort({ name: 1 })
    }

    async getById(id: string) {
        return MuscleGroupModel.findById(id)
    }

    async create(data: any) {
        return MuscleGroupModel.create(data)
    }

    async update(id: string, data: any) {
        return MuscleGroupModel.findByIdAndUpdate(id, data, { new: true })
    }

    async delete(id: string) {
        return MuscleGroupModel.findByIdAndDelete(id)
    }
}

export default new AdminMuscleGroupService()
