import mongoose, { Types } from 'mongoose'

export interface SportEventProgress {
  _id?: Types.ObjectId
  eventId: Types.ObjectId
  userId: Types.ObjectId
  date: Date
  value: number
  unit: string
  distance?: number
  time?: string
  calories?: number
  proofImage?: string
  notes?: string
  createdAt?: Date
  updatedAt?: Date
}

const SportEventProgressSchema = new mongoose.Schema<SportEventProgress>(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'sport_events', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    date: { type: Date, required: true, default: Date.now },
    value: { type: Number, required: true },
    unit: { type: String, required: true },
    distance: { type: Number },
    time: { type: String },
    calories: { type: Number },
    proofImage: { type: String, default: '' },
    notes: { type: String, default: '' }
  },
  {
    timestamps: true,
    collection: 'sport_event_progress'
  }
)

// Create compound index for efficient querying
SportEventProgressSchema.index({ eventId: 1, userId: 1, date: -1 })
SportEventProgressSchema.index({ eventId: 1, date: -1 })

const SportEventProgressModel = mongoose.model('sport_event_progress', SportEventProgressSchema)

export default SportEventProgressModel
