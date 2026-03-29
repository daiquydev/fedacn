import mongoose, { Types } from 'mongoose'

export interface ITrainingParticipant {
    _id?: Types.ObjectId
    training_id: Types.ObjectId
    user_id: Types.ObjectId

    current_value: number
    goal_value: number
    is_completed: boolean
    completed_at: Date | null

    joined_at: Date
    last_activity_at: Date | null
    active_days: string[] // Array of date strings 'YYYY-MM-DD' for days_active tracking
    status: string

    createdAt?: Date
    updatedAt?: Date
}

const TrainingParticipantSchema = new mongoose.Schema<ITrainingParticipant>(
    {
        training_id: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'trainings',
            required: true
        },
        user_id: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'users',
            required: true
        },

        current_value: { type: Number, default: 0 },
        goal_value: { type: Number, required: true },
        is_completed: { type: Boolean, default: false },
        completed_at: { type: Date, default: null },

        joined_at: { type: Date, default: () => new Date() },
        last_activity_at: { type: Date, default: null },
        active_days: { type: [String], default: [] },
        status: {
            type: String,
            enum: ['in_progress', 'completed', 'quit'],
            default: 'in_progress'
        }
    },
    {
        timestamps: true,
        collection: 'training_participants'
    }
)

TrainingParticipantSchema.index({ training_id: 1, user_id: 1 }, { unique: true })
TrainingParticipantSchema.index({ user_id: 1, status: 1 })
TrainingParticipantSchema.index({ training_id: 1, current_value: -1 })

const TrainingParticipantModel = mongoose.model('training_participants', TrainingParticipantSchema)

export default TrainingParticipantModel
