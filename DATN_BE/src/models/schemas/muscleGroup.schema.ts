import mongoose, { Schema } from 'mongoose'

export interface MuscleGroup {
    name: string
    name_en: string
    /** Slug từ react-body-highlighter (có thể nhiều id / nhóm — ví dụ trapezius + neck). */
    body_part_ids: string[]
    image_url: string
    description: string
    is_active: boolean
}

const MuscleGroupSchema = new Schema<MuscleGroup>(
    {
        name: { type: String, required: true },
        name_en: { type: String, required: true, unique: true },
        body_part_ids: { type: [String], required: true },
        image_url: { type: String, default: '' },
        description: { type: String, default: '' },
        is_active: { type: Boolean, default: true }
    },
    { timestamps: true, collection: 'muscle_groups' }
)

MuscleGroupSchema.index({ is_active: 1 })

const MuscleGroupModel = mongoose.model<MuscleGroup>('muscle_groups', MuscleGroupSchema)
export default MuscleGroupModel
