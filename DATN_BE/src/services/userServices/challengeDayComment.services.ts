import ChallengeDayCommentModel from '~/models/schemas/challengeDayComment.schema'
import ChallengeModel from '~/models/schemas/challenge.schema'

class ChallengeDayCommentService {
  async createComment({
    challengeId,
    targetUserId,
    date,
    userId,
    content,
    parent_comment_id
  }: {
    challengeId: string
    targetUserId: string
    date: string
    userId: string
    content: string
    parent_comment_id?: string
  }) {
    const challenge = await ChallengeModel.findById(challengeId)
    if (!challenge) {
      throw new Error('Challenge not found')
    }

    if (parent_comment_id) {
      const parentComment = await ChallengeDayCommentModel.findById(parent_comment_id)
      if (!parentComment) {
        throw new Error('Parent comment not found')
      }
      parentComment.replyCount += 1
      await parentComment.save()
    }

    const newComment = new ChallengeDayCommentModel({
      challengeId,
      targetUserId,
      date,
      userId,
      content,
      parent_comment_id: parent_comment_id || null,
      replyCount: 0
    })

    await newComment.save()
    await newComment.populate('userId', 'name avatar')

    return newComment
  }

  async getComments(
    challengeId: string,
    targetUserId: string,
    date: string,
    { page = 1, limit = 10 }: { page?: number; limit?: number }
  ) {
    const skip = (page - 1) * limit

    const comments = await ChallengeDayCommentModel.find({
      challengeId,
      targetUserId,
      date,
      parent_comment_id: null
    })
      .populate('userId', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const total = await ChallengeDayCommentModel.countDocuments({
      challengeId,
      targetUserId,
      date,
      parent_comment_id: null
    })
    const totalPages = Math.ceil(total / limit)

    return {
      comments,
      page,
      limit,
      total,
      totalPages
    }
  }

  async getChildComments(
    parent_comment_id: string,
    { page = 1, limit = 10 }: { page?: number; limit?: number }
  ) {
    const skip = (page - 1) * limit

    const comments = await ChallengeDayCommentModel.find({
      parent_comment_id
    })
      .populate('userId', 'name avatar')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)

    const total = await ChallengeDayCommentModel.countDocuments({ parent_comment_id })
    const totalPages = Math.ceil(total / limit)

    return {
      child_comments: comments,
      page,
      limit,
      total,
      totalPages
    }
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await ChallengeDayCommentModel.findById(commentId)

    if (!comment) {
      throw new Error('Comment not found')
    }

    if (comment.userId.toString() !== userId) {
      throw new Error('Unauthorized to delete this comment')
    }

    if (comment.parent_comment_id) {
      await ChallengeDayCommentModel.findByIdAndUpdate(comment.parent_comment_id, {
        $inc: { replyCount: -1 }
      })
    }

    await comment.deleteOne()
    return comment
  }
}

const challengeDayCommentService = new ChallengeDayCommentService()
export default challengeDayCommentService
