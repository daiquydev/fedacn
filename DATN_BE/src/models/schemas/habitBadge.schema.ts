import mongoose, { Schema, Types, Document } from 'mongoose'

export interface IHabitBadge extends Document {
  user_id: Types.ObjectId
  challenge_id: Types.ObjectId
  badge_type: string
  tier: string
  earned_at: Date
}

const habitBadgeSchema = new Schema<IHabitBadge>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'users', required: true },
    challenge_id: { type: Schema.Types.ObjectId, ref: 'habit_challenges', required: true },
    badge_type: { type: String, required: true },
    tier: {
      type: String,
      enum: ['bronze', 'silver', 'gold'],
      default: 'bronze'
    },
    earned_at: { type: Date, default: Date.now }
  },
  {
    timestamps: true,
    collection: 'habit_badges'
  }
)

habitBadgeSchema.index({ user_id: 1, challenge_id: 1, badge_type: 1, tier: 1 }, { unique: true })
habitBadgeSchema.index({ user_id: 1, earned_at: -1 })
habitBadgeSchema.index({ user_id: 1, tier: 1 })

const HabitBadgeModel = mongoose.model<IHabitBadge>('habit_badges', habitBadgeSchema)
export default HabitBadgeModel
