import mongoose, { Types } from 'mongoose'

export interface SportEvent {
  _id?: Types.ObjectId
  name: string
  description: string
  detailedDescription?: string
  category: string
  startDate: Date
  endDate: Date
  location: string
  address?: string
  distance?: string
  maxParticipants: number
  participants: number
  image: string
  createdBy: Types.ObjectId
  eventType: 'Ngoài trời' | 'Trong nhà'
  isJoined?: boolean
  participants_ids?: Types.ObjectId[]
  requirements?: string
  benefits?: string
  organizer?: string
  targetValue?: number
  targetUnit?: string
  difficulty?: string
  isDeleted?: boolean
  deletedAt?: Date | null
  createdAt?: Date
  updatedAt?: Date
}

const SportEventSchema = new mongoose.Schema<SportEvent>(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    detailedDescription: { type: String, default: '' },
    category: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    location: { type: String, required: false, default: 'Online' },
    address: { type: String, default: '' },
    distance: { type: String, default: '' },
    maxParticipants: { type: Number, required: true },
    participants: { type: Number, default: 0 },
    image: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    eventType: { type: String, enum: ['Ngoài trời', 'Trong nhà'], default: 'Ngoài trời' },
    participants_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }],
    requirements: { type: String, default: '' },
    benefits: { type: String, default: '' },
    organizer: { type: String, default: '' },
    targetValue: { type: Number },
    targetUnit: { type: String, default: '' },
    difficulty: { type: String, default: '' },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null }
  },
  {
    timestamps: true,
    collection: 'sport_events'
  }
)

// Create text index for search
SportEventSchema.index({ name: 'text', description: 'text', category: 'text' }, { default_language: 'none' })

const SportEventModel = mongoose.model('sport_events', SportEventSchema)

export default SportEventModel
