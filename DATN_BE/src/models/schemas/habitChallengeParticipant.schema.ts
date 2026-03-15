import mongoose, { Types } from 'mongoose'

export interface HabitChallengeParticipant {
  _id?: Types.ObjectId
  challenge_id: Types.ObjectId
  user_id: Types.ObjectId
  buddy_id: Types.ObjectId | null
  start_date: Date
  current_streak: number
  longest_streak: number
  total_checkins: number
  xp_earned: number
  streak_freezes_used: number
  streak_freeze_available: number
  last_checkin_date: Date | null
  team_id: string | null
  completion_percentage: number
  status: string
  joined_at: Date
}

const HabitChallengeParticipantSchema = new mongoose.Schema<HabitChallengeParticipant>(
  {
    challenge_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'habit_challenges',
      required: true
    },
    user_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'users',
      required: true
    },
    buddy_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'users',
      default: null
    },
    start_date: { type: Date, default: () => new Date() },
    current_streak: { type: Number, default: 0 },
    longest_streak: { type: Number, default: 0 },
    total_checkins: { type: Number, default: 0 },
    xp_earned: { type: Number, default: 0 },
    streak_freezes_used: { type: Number, default: 0 },
    streak_freeze_available: { type: Number, default: 1 },
    last_checkin_date: { type: Date, default: null },
    team_id: { type: String, default: null },
    completion_percentage: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'quit'],
      default: 'in_progress'
    },
    joined_at: { type: Date, default: () => new Date() }
  },
  {
    timestamps: true,
    collection: 'habit_challenge_participants'
  }
)

HabitChallengeParticipantSchema.index({ challenge_id: 1, user_id: 1 }, { unique: true })
HabitChallengeParticipantSchema.index({ user_id: 1, status: 1 })
HabitChallengeParticipantSchema.index({ challenge_id: 1, xp_earned: -1 })
HabitChallengeParticipantSchema.index({ team_id: 1 })

const HabitChallengeParticipantModel = mongoose.model(
  'habit_challenge_participants',
  HabitChallengeParticipantSchema
)

export default HabitChallengeParticipantModel
