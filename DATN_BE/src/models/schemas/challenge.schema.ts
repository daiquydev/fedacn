import mongoose, { Types } from 'mongoose'

export interface IChallengeExerciseSet {
    set_number: number
    reps: number
    weight: number
    calories_per_unit: number
}

export interface IChallengeExercise {
    exercise_id: Types.ObjectId
    exercise_name: string
    sets: IChallengeExerciseSet[]
}

export interface IChallenge {
    _id?: Types.ObjectId
    creator_id: Types.ObjectId
    title: string
    description: string
    image: string

    // Type
    challenge_type: 'nutrition' | 'outdoor_activity' | 'fitness'
    category: string
    kcal_per_unit: number

    // Goal
    goal_type: string
    goal_value: number
    goal_unit: string

    // Duration
    start_date: Date
    end_date: Date

    // Config
    visibility: 'public' | 'friends' | 'private'
    is_public: boolean
    status: string
    is_deleted: boolean
    participants_count: number
    badge_emoji: string

    // Nutrition sub-type (time-window restriction)
    nutrition_sub_type?: 'free' | 'time_window'
    time_window_start?: string  // "HH:mm" e.g. "08:00"
    time_window_end?: string    // "HH:mm" e.g. "11:00"

    // Fitness exercises (only for challenge_type === 'fitness')
    exercises: IChallengeExercise[]

    // Optional links
    linked_meal_plan_id?: Types.ObjectId | null

    createdAt?: Date
    updatedAt?: Date
}



const ChallengeSchema = new mongoose.Schema<IChallenge>(
    {
        creator_id: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'users',
            required: true
        },
        title: { type: String, required: true },
        description: { type: String, default: '' },
        image: { type: String, default: '' },

        // Type
        challenge_type: {
            type: String,
            enum: ['nutrition', 'outdoor_activity', 'fitness'],
            required: true
        },
        category: { type: String, default: '' },
        kcal_per_unit: { type: Number, default: 0, min: 0 },

        // Goal
        goal_type: {
            type: String,
            required: true
        },
        goal_value: { type: Number, required: true, min: 1 },
        goal_unit: { type: String, required: true },

        // Duration
        start_date: { type: Date, required: true },
        end_date: { type: Date, required: true },

        // Config
        visibility: {
            type: String,
            enum: ['public', 'friends', 'private'],
            default: 'public'
        },
        is_public: { type: Boolean, default: true },
        status: {
            type: String,
            enum: ['active', 'completed', 'cancelled'],
            default: 'active'
        },
        is_deleted: { type: Boolean, default: false },
        participants_count: { type: Number, default: 0 },
        badge_emoji: { type: String, default: '🏆' },

        // Nutrition sub-type (time-window restriction)
        nutrition_sub_type: {
            type: String,
            enum: ['free', 'time_window'],
            default: 'free'
        },
        time_window_start: { type: String, default: null },
        time_window_end: { type: String, default: null },

        // Fitness exercises (only for challenge_type === 'fitness')
        exercises: [{
            exercise_id: { type: mongoose.SchemaTypes.ObjectId, ref: 'exercises' },
            exercise_name: { type: String, required: true },
            sets: [{
                set_number: { type: Number },
                reps: { type: Number, default: 10 },
                weight: { type: Number, default: 0 },
                calories_per_unit: { type: Number, default: 10 }
            }]
        }],

        // Optional links
        linked_meal_plan_id: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'meal_plans',
            default: null
        }
    },
    {
        timestamps: true,
        collection: 'challenges'
    }
)

ChallengeSchema.index({ title: 'text', description: 'text' }, { default_language: 'none' })
ChallengeSchema.index({ creator_id: 1 })
ChallengeSchema.index({ challenge_type: 1, status: 1, is_public: 1, is_deleted: 1 })
ChallengeSchema.index({ status: 1, is_public: 1, is_deleted: 1, createdAt: -1 })
ChallengeSchema.index({ end_date: 1, status: 1, is_deleted: 1 })



const ChallengeModel = mongoose.model('challenges', ChallengeSchema)

export default ChallengeModel
