import mongoose, { Schema, Types } from 'mongoose'

export interface DefaultSet {
    set_number: number
    reps: number
    weight: number
    calories_per_unit: number
}

export interface Exercise {
    name: string
    name_vi: string
    description: string
    instructions: string[]
    tips: string
    equipment: string[]
    equipment_ids: Types.ObjectId[]
    primary_muscles: string[]
    muscle_group_ids: Types.ObjectId[]
    secondary_muscles: string[]
    secondary_muscle_ids: Types.ObjectId[]
    image_url: string
    video_url: string
    category: string
    difficulty: string
    default_sets: DefaultSet[]
    is_active: boolean
    isDeleted: boolean
    deletedAt?: Date
}

const DefaultSetSchema = new Schema<DefaultSet>(
    {
        set_number: { type: Number, required: true },
        reps: { type: Number, default: 10 },
        weight: { type: Number, default: 0 },
        calories_per_unit: { type: Number, default: 10 }
    },
    { _id: false }
)

const ExerciseSchema = new Schema<Exercise>(
    {
        name: { type: String, required: true },
        name_vi: { type: String, default: '' },
        description: { type: String, default: '' },
        instructions: { type: [String], default: [] },
        tips: { type: String, default: '' },
        equipment: { type: [String], default: [] },
        equipment_ids: [{ type: Schema.Types.ObjectId, ref: 'equipment' }],
        primary_muscles: { type: [String], default: [] },
        muscle_group_ids: [{ type: Schema.Types.ObjectId, ref: 'muscle_groups' }],
        secondary_muscles: { type: [String], default: [] },
        secondary_muscle_ids: [{ type: Schema.Types.ObjectId, ref: 'muscle_groups' }],
        image_url: { type: String, default: '' },
        video_url: { type: String, default: '' },
        category: {
            type: String,
            enum: ['strength', 'stretching', 'cardio', 'plyometrics'],
            default: 'strength'
        },
        difficulty: {
            type: String,
            enum: ['beginner', 'intermediate', 'expert'],
            default: 'intermediate'
        },
        default_sets: { type: [DefaultSetSchema], default: [] },
        is_active: { type: Boolean, default: true },
        isDeleted: { type: Boolean, default: false },
        deletedAt: { type: Date, default: null }
    },
    { timestamps: true, collection: 'exercises' }
)

ExerciseSchema.index({ equipment: 1 })
ExerciseSchema.index({ primary_muscles: 1 })
ExerciseSchema.index({ equipment_ids: 1 })
ExerciseSchema.index({ muscle_group_ids: 1 })
ExerciseSchema.index({ is_active: 1 })

const ExerciseModel = mongoose.model('exercises', ExerciseSchema)
export default ExerciseModel
