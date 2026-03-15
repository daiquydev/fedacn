import mongoose, { Types } from 'mongoose'

export interface HabitCheckin {
  _id?: Types.ObjectId
  challenge_id: Types.ObjectId
  user_id: Types.ObjectId
  image_url: string
  note: string
  day_number: number
  checkin_date: Date
  likes: Types.ObjectId[]
  createdAt?: Date
}

const HabitCheckinSchema = new mongoose.Schema<HabitCheckin>(
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
    image_url: { type: String, required: true },
    note: { type: String, default: '' },
    day_number: { type: Number, required: true },
    checkin_date: { type: Date, required: true },
    likes: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'users'
      }
    ]
  },
  {
    timestamps: true,
    collection: 'habit_checkins'
  }
)

HabitCheckinSchema.index({ challenge_id: 1, user_id: 1, checkin_date: 1 }, { unique: true })
HabitCheckinSchema.index({ challenge_id: 1, createdAt: -1 })

const HabitCheckinModel = mongoose.model('habit_checkins', HabitCheckinSchema)

export default HabitCheckinModel
