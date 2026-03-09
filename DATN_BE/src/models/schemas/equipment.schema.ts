import mongoose, { Schema } from 'mongoose'

export interface Equipment {
    name: string
    name_en: string
    image_url: string
    description: string
    is_active: boolean
}

const EquipmentSchema = new Schema<Equipment>(
    {
        name: { type: String, required: true },
        name_en: { type: String, required: true, unique: true },
        image_url: { type: String, default: '' },
        description: { type: String, default: '' },
        is_active: { type: Boolean, default: true }
    },
    { timestamps: true, collection: 'equipment' }
)

EquipmentSchema.index({ name_en: 1 })
EquipmentSchema.index({ is_active: 1 })

const EquipmentModel = mongoose.model<Equipment>('equipment', EquipmentSchema)
export default EquipmentModel
