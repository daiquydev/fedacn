import mongoose, { Types } from 'mongoose'

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
    participants_count: number
    badge_emoji: string

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
        participants_count: { type: Number, default: 0 },
        badge_emoji: { type: String, default: '🏆' },

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
ChallengeSchema.index({ challenge_type: 1, status: 1, is_public: 1 })
ChallengeSchema.index({ status: 1, is_public: 1, createdAt: -1 })
ChallengeSchema.index({ end_date: 1, status: 1 })



const ChallengeModel = mongoose.model('challenges', ChallengeSchema)

export default ChallengeModel
