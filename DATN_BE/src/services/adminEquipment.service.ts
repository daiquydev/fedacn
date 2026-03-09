import EquipmentModel from '../models/schemas/equipment.schema'

class AdminEquipmentService {
    async getAll() {
        return EquipmentModel.find().sort({ createdAt: -1 })
    }

    async getActive() {
        return EquipmentModel.find({ is_active: true }).sort({ name: 1 })
    }

    async getById(id: string) {
        return EquipmentModel.findById(id)
    }

    async create(data: any) {
        return EquipmentModel.create(data)
    }

    async update(id: string, data: any) {
        return EquipmentModel.findByIdAndUpdate(id, data, { new: true })
    }

    async delete(id: string) {
        return EquipmentModel.findByIdAndDelete(id)
    }
}

export default new AdminEquipmentService()
