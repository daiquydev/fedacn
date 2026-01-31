import mongoose, { Types } from 'mongoose'

export interface SportEventPost {
  _id?: Types.ObjectId
  eventId: Types.ObjectId
  userId: Types.ObjectId
  content: string
  images: string[]
  likeCount: number
  commentCount: number
  likedBy: Types.ObjectId[]
  shareCount: number
  shares: Types.ObjectId[]
  createdAt?: Date
  updatedAt?: Date
}

const SportEventPostSchema = new mongoose.Schema<SportEventPost>(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'sport_events', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    content: { type: String, required: true },
    images: [{ type: String }],
    likeCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }],
    shares: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }]
  },
  {
    timestamps: true,
    collection: 'sport_event_posts'
  }
)

// Create indexes for efficient querying
SportEventPostSchema.index({ eventId: 1, createdAt: -1 })
SportEventPostSchema.index({ userId: 1 })

const SportEventPostModel = mongoose.model('sport_event_posts', SportEventPostSchema)

export default SportEventPostModel
