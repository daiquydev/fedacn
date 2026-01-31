import mongoose, { Types } from 'mongoose'

export interface SportEventComment {
  _id?: Types.ObjectId
  postId: Types.ObjectId
  userId: Types.ObjectId
  content: string
  parent_comment_id?: Types.ObjectId
  likeCount: number
  replyCount: number
  likedBy: Types.ObjectId[]
  createdAt?: Date
  updatedAt?: Date
}

const SportEventCommentSchema = new mongoose.Schema<SportEventComment>(
  {
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'sport_event_posts', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    content: { type: String, required: true },
    parent_comment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'sport_event_comments', default: null },
    likeCount: { type: Number, default: 0 },
    replyCount: { type: Number, default: 0 },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }]
  },
  {
    timestamps: true,
    collection: 'sport_event_comments'
  }
)

// Index for fetching comments of a post
SportEventCommentSchema.index({ postId: 1, parent_comment_id: 1, createdAt: 1 })

const SportEventCommentModel = mongoose.model('sport_event_comments', SportEventCommentSchema)

export default SportEventCommentModel
