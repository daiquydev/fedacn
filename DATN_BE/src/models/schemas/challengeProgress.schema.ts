import mongoose, { Types } from 'mongoose'

export interface IChallengeProgress {
    _id?: Types.ObjectId
    challenge_id: Types.ObjectId
    user_id: Types.ObjectId
    date: Date

    // Common
    challenge_type: string // denormalized for query performance
    value: number
    unit: string
    notes: string

    // Nutrition check-in
    proof_image: string
    food_name: string
    ai_review_valid: boolean | null
    ai_review_reason: string

    // Outdoor activity data
    distance: number | null
    duration_minutes: number | null
    avg_speed: number | null
    calories: number | null

    // Fitness workout data
    workout_session_id: Types.ObjectId | null
    exercises_count: number | null

    // Source
    source: 'photo_checkin' | 'gps_tracking' | 'workout_session' | 'manual'

    // GPS Activity link (for map display)
    activity_id: Types.ObjectId | null

    is_deleted?: boolean
    createdAt?: Date
    updatedAt?: Date
}

const ChallengeProgressSchema = new mongoose.Schema<IChallengeProgress>(
    {
        challenge_id: { type: mongoose.Schema.Types.ObjectId, ref: 'challenges', required: true },
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
        date: { type: Date, required: true, default: Date.now },

        // Common
        challenge_type: {
            type: String,
            enum: ['nutrition', 'outdoor_activity', 'fitness'],
            required: true
        },
        value: { type: Number, required: true },
        unit: { type: String, required: true },
        notes: { type: String, default: '' },

        // Nutrition
        proof_image: { type: String, default: '' },
        food_name: { type: String, default: '' },
        ai_review_valid: { type: Boolean, default: null },
        ai_review_reason: { type: String, default: '' },

        // Outdoor activity
        distance: { type: Number, default: null },
        duration_minutes: { type: Number, default: null },
        avg_speed: { type: Number, default: null },
        calories: { type: Number, default: null },

        // Fitness
        workout_session_id: { type: mongoose.Schema.Types.ObjectId, ref: 'workout_sessions', default: null },
        exercises_count: { type: Number, default: null },

        // Source
        source: {
            type: String,
            enum: ['photo_checkin', 'gps_tracking', 'workout_session', 'manual'],
            default: 'manual'
        },

        // GPS Activity link (for map display)
        activity_id: { type: mongoose.Schema.Types.ObjectId, ref: 'activity_tracking', default: null },

        is_deleted: { type: Boolean, default: false }
    },
    {
        timestamps: true,
        collection: 'challenge_progress'
    }
)

ChallengeProgressSchema.index({ challenge_id: 1, user_id: 1, date: -1 })
ChallengeProgressSchema.index({ challenge_id: 1, date: -1 })
ChallengeProgressSchema.index({ user_id: 1, challenge_type: 1 })

const ChallengeProgressModel = mongoose.model('challenge_progress', ChallengeProgressSchema)

export default ChallengeProgressModel
