import mongoose, { Types } from 'mongoose'

export interface SportEventSession {
  _id?: Types.ObjectId
  eventId: Types.ObjectId
  sessionNumber: number
  title: string
  description?: string
  sessionDate: Date
  durationHours: number
  videoCallUrl?: string
  isCompleted: boolean
  maxParticipants?: number
  createdAt?: Date
  updatedAt?: Date
}

const SportEventSessionSchema = new mongoose.Schema<SportEventSession>(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'sport_events', required: true },
    sessionNumber: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    sessionDate: { type: Date, required: true },
    durationHours: { type: Number, required: true, default: 1 },
    videoCallUrl: { type: String, default: '' },
    isCompleted: { type: Boolean, default: false },
    maxParticipants: { type: Number }
  },
  {
    timestamps: true,
    collection: 'sport_event_sessions'
  }
)

// Create indexes for efficient querying
SportEventSessionSchema.index({ eventId: 1, sessionDate: 1 })
SportEventSessionSchema.index({ eventId: 1, sessionNumber: 1 }, { unique: true })

const SportEventSessionModel = mongoose.model('sport_event_sessions', SportEventSessionSchema)

export default SportEventSessionModel
