import mongoose, { Types } from 'mongoose'

export interface IChallenge {
  _id?: Types.ObjectId
  creator_id: Types.ObjectId
  title: string
  description: string
  image: string

  // Goal
  goal_type: string
  goal_value: number

  // Duration
  duration_type: string
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

const DURATION_MAP: Record<string, number> = {
  '1_week': 7,
  '2_weeks': 14,
  '1_month': 30,
  '2_months': 60,
  '3_months': 90
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

    // Goal
    goal_type: {
      type: String,
      enum: ['total_kcal', 'total_minutes', 'workout_count', 'days_active'],
      required: true
    },
    goal_value: { type: Number, required: true, min: 1 },

    // Duration
    duration_type: {
      type: String,
      enum: ['1_week', '2_weeks', '1_month', '2_months', '3_months'],
      default: '1_month'
    },
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
    collection: 'challenges'
  }
)

ChallengeSchema.index({ title: 'text', description: 'text' }, { default_language: 'none' })
ChallengeSchema.index({ creator_id: 1 })
ChallengeSchema.index({ status: 1, is_public: 1 })
ChallengeSchema.index({ end_date: 1, status: 1 })

export { DURATION_MAP }

const ChallengeModel = mongoose.model('challenges', ChallengeSchema)

export default ChallengeModel
