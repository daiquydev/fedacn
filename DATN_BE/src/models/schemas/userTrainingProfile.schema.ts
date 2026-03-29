import mongoose, { Types } from 'mongoose'
import { TRAINING_LEVEL_THRESHOLDS } from '~/constants/enums'

export interface IUserTrainingProfile {
    _id?: Types.ObjectId
    user_id: Types.ObjectId
    total_xp: number
    level: number
    title: string
    trainings_joined: number
    trainings_completed: number
    total_checkins: number
    longest_streak_ever: number
    perfect_trainings: number
    team_wins: number
    streak_freeze_tokens: number
    last_freeze_replenish: Date | null
    createdAt?: Date
    updatedAt?: Date
}

const UserTrainingProfileSchema = new mongoose.Schema<IUserTrainingProfile>(
    {
        user_id: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'users',
            required: true,
            unique: true
        },
        total_xp: { type: Number, default: 0 },
        level: { type: Number, default: 1 },
        title: { type: String, default: TRAINING_LEVEL_THRESHOLDS[0].title },
        trainings_joined: { type: Number, default: 0 },
        trainings_completed: { type: Number, default: 0 },
        total_checkins: { type: Number, default: 0 },
        longest_streak_ever: { type: Number, default: 0 },
        perfect_trainings: { type: Number, default: 0 },
        team_wins: { type: Number, default: 0 },
        streak_freeze_tokens: { type: Number, default: 2 },
        last_freeze_replenish: { type: Date, default: null }
    },
    {
        timestamps: true,
        collection: 'user_training_profiles'
    }
)

UserTrainingProfileSchema.index({ total_xp: -1 })
UserTrainingProfileSchema.index({ level: -1, total_xp: -1 })

const UserTrainingProfileModel = mongoose.model('user_training_profiles', UserTrainingProfileSchema)

export default UserTrainingProfileModel
