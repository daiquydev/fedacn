import mongoose, { Types } from 'mongoose'

export interface HabitChallenge {
  _id?: Types.ObjectId
  creator_id: Types.ObjectId
  title: string
  description: string
  category: string
  challenge_type: string
  difficulty: string
  duration_days: number
  image: string
  is_public: boolean
  participants_count: number
  max_participants: number
  min_level: number
  status: string
  end_date: Date | null

  // Rules Engine
  rules: {
    checkin_frequency: string
    require_image: boolean
    require_note: boolean
    streak_freeze_allowed: number
    grace_period_hours: number
    target_checkins: number
    completion_type: string
  }

  // Team challenge
  team_size: number

  createdAt?: Date
  updatedAt?: Date
}

const HabitChallengeSchema = new mongoose.Schema<HabitChallenge>(
  {
    creator_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'users',
      required: true
    },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    category: {
      type: String,
      enum: ['exercise', 'nutrition', 'sleep', 'mental', 'hydration', 'other'],
      default: 'other'
    },
    challenge_type: {
      type: String,
      enum: ['solo', 'team', 'global'],
      default: 'solo'
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    duration_days: {
      type: Number,
      min: 3,
      max: 90,
      default: 21
    },
    image: { type: String, default: '' },
    is_public: { type: Boolean, default: true },
    participants_count: { type: Number, default: 0 },
    max_participants: { type: Number, default: 0 },
    min_level: { type: Number, default: 1, min: 1, max: 5 },
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled'],
      default: 'active'
    },
    end_date: { type: Date, default: null },

    // Rules Engine
    rules: {
      checkin_frequency: {
        type: String,
        enum: ['daily', 'weekly_3', 'weekly_5', 'free'],
        default: 'daily'
      },
      require_image: { type: Boolean, default: true },
      require_note: { type: Boolean, default: false },
      streak_freeze_allowed: { type: Number, default: 1, min: 0, max: 3 },
      grace_period_hours: { type: Number, default: 0, min: 0, max: 12 },
      target_checkins: { type: Number, default: 0 },
      completion_type: {
        type: String,
        enum: ['streak', 'percentage', 'total'],
        default: 'percentage'
      }
    },

    // Team challenge
    team_size: { type: Number, default: 0, min: 0, max: 10 }
  },
  {
    timestamps: true,
    collection: 'habit_challenges'
  }
)

HabitChallengeSchema.index({ title: 'text', description: 'text' }, { default_language: 'none' })
HabitChallengeSchema.index({ creator_id: 1 })
HabitChallengeSchema.index({ status: 1, is_public: 1 })
HabitChallengeSchema.index({ challenge_type: 1, difficulty: 1 })
HabitChallengeSchema.index({ end_date: 1, status: 1 })

const HabitChallengeModel = mongoose.model('habit_challenges', HabitChallengeSchema)

export default HabitChallengeModel
