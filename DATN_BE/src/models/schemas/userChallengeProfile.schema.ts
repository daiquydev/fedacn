import mongoose, { Types } from 'mongoose'
import { CHALLENGE_LEVEL_THRESHOLDS } from '~/constants/enums'

export interface IUserChallengeProfile {
  _id?: Types.ObjectId
  user_id: Types.ObjectId
  total_xp: number
  level: number
  title: string
  challenges_joined: number
  challenges_completed: number
  total_checkins: number
  longest_streak_ever: number
  perfect_challenges: number
  team_wins: number
  streak_freeze_tokens: number
  last_freeze_replenish: Date | null
  createdAt?: Date
  updatedAt?: Date
}

const UserChallengeProfileSchema = new mongoose.Schema<IUserChallengeProfile>(
  {
    user_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'users',
      required: true,
      unique: true
    },
    total_xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    title: { type: String, default: CHALLENGE_LEVEL_THRESHOLDS[0].title },
    challenges_joined: { type: Number, default: 0 },
    challenges_completed: { type: Number, default: 0 },
    total_checkins: { type: Number, default: 0 },
    longest_streak_ever: { type: Number, default: 0 },
    perfect_challenges: { type: Number, default: 0 },
    team_wins: { type: Number, default: 0 },
    streak_freeze_tokens: { type: Number, default: 2 },
    last_freeze_replenish: { type: Date, default: null }
  },
  {
    timestamps: true,
    collection: 'user_challenge_profiles'
  }
)

UserChallengeProfileSchema.index({ total_xp: -1 })
UserChallengeProfileSchema.index({ level: -1, total_xp: -1 })

const UserChallengeProfileModel = mongoose.model('user_challenge_profiles', UserChallengeProfileSchema)

export default UserChallengeProfileModel
