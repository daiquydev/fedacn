import mongoose, { Types } from 'mongoose'

export interface ITraining {
    _id?: Types.ObjectId
    creator_id: Types.ObjectId
    title: string
    description: string
    image: string

    // Goal
    goal_type: string
    goal_value: number

    // Duration
    start_date: Date
    end_date: Date

    // Config
    is_public: boolean
    difficulty: string
    status: string
    participants_count: number
    badge_emoji: string

    createdAt?: Date
    updatedAt?: Date
}



const TrainingSchema = new mongoose.Schema<ITraining>(
    {
        creator_id: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'users',
            required: true
        },
        title: { type: String, required: true },
        description: { type: String, default: '' },
        image: { type: String, default: '' },

        // Goal
        goal_type: {
            type: String,
            enum: ['total_kcal', 'total_minutes', 'workout_count', 'days_active'],
            required: true
        },
        goal_value: { type: Number, required: true, min: 1 },

        // Duration
        start_date: { type: Date, required: true },
        end_date: { type: Date, required: true },

        // Config
        is_public: { type: Boolean, default: true },
        difficulty: {
            type: String,
            enum: ['easy', 'medium', 'hard'],
            default: 'medium'
        },
        status: {
            type: String,
            enum: ['active', 'completed', 'cancelled'],
            default: 'active'
        },
        participants_count: { type: Number, default: 0 },
        badge_emoji: { type: String, default: '🏆' }
    },
    {
        timestamps: true,
        collection: 'trainings'
    }
)

TrainingSchema.index({ title: 'text', description: 'text' }, { default_language: 'none' })
TrainingSchema.index({ creator_id: 1 })
TrainingSchema.index({ status: 1, is_public: 1 })
TrainingSchema.index({ end_date: 1, status: 1 })



const TrainingModel = mongoose.model('trainings', TrainingSchema)

export default TrainingModel
