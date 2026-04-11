import mongoose, { Types } from 'mongoose'

export interface ChallengeDayComment {
  _id?: Types.ObjectId
  challengeId: Types.ObjectId
  targetUserId: Types.ObjectId
  date: string
  userId: Types.ObjectId
  content: string
  parent_comment_id?: Types.ObjectId
  replyCount: number
  createdAt?: Date
  updatedAt?: Date
}

const ChallengeDayCommentSchema = new mongoose.Schema<ChallengeDayComment>(
  {
    challengeId: { type: mongoose.Schema.Types.ObjectId, ref: 'challenges', required: true },
    targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    date: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    content: { type: String, required: true },
    parent_comment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'challenge_day_comments', default: null },
    replyCount: { type: Number, default: 0 }
  },
  {
    timestamps: true,
    collection: 'challenge_day_comments'
  }
)

ChallengeDayCommentSchema.index({ challengeId: 1, targetUserId: 1, date: 1, parent_comment_id: 1, createdAt: 1 })

const ChallengeDayCommentModel = mongoose.model('challenge_day_comments', ChallengeDayCommentSchema)

export default ChallengeDayCommentModel
