import mongoose, { Types } from 'mongoose'

export interface IChallengeParticipant {
  _id?: Types.ObjectId
  challenge_id: Types.ObjectId
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

const ChallengeParticipantSchema = new mongoose.Schema<IChallengeParticipant>(
  {
    challenge_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'challenges',
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
    collection: 'challenge_participants'
  }
)

ChallengeParticipantSchema.index({ challenge_id: 1, user_id: 1 }, { unique: true })
ChallengeParticipantSchema.index({ user_id: 1, status: 1 })
ChallengeParticipantSchema.index({ challenge_id: 1, current_value: -1 })

const ChallengeParticipantModel = mongoose.model('challenge_participants', ChallengeParticipantSchema)

export default ChallengeParticipantModel
