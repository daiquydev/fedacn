import ChallengeDayCommentModel from '~/models/schemas/challengeDayComment.schema'
import ChallengeModel from '~/models/schemas/challenge.schema'
import ChallengeParticipantModel from '~/models/schemas/challengeParticipant.schema'
import FollowModel from '~/models/schemas/follow.schema'
import { Types } from 'mongoose'
import { ErrorWithStatus } from '~/utils/error'
import HTTP_STATUS from '~/constants/httpStatus'

class ChallengeDayCommentService {
  private async assertUserCanViewChallengeDayComments(challengeId: string, userId?: string) {
    const challenge = await ChallengeModel.findById(challengeId).select('creator_id visibility is_deleted deleted_from_report_moderation')
    if (!challenge) {
      throw new ErrorWithStatus({ message: 'Challenge not found', status: HTTP_STATUS.NOT_FOUND })
    }
    if ((challenge as any).is_deleted) {
      if ((challenge as any).deleted_from_report_moderation) {
        throw new ErrorWithStatus({ message: 'Challenge has been removed due to moderation', status: HTTP_STATUS.GONE })
      }
      throw new ErrorWithStatus({ message: 'Challenge not found', status: HTTP_STATUS.NOT_FOUND })
    }

    const visibility = (challenge as any).visibility || 'public'
    if (visibility === 'public') return

    const creatorId = challenge.creator_id.toString()
    if (userId && userId === creatorId) return

    if (userId) {
      const participation = await ChallengeParticipantModel.findOne({
        challenge_id: new Types.ObjectId(challengeId),
        user_id: new Types.ObjectId(userId),
        status: { $ne: 'quit' }
      })
        .select('_id')
        .lean()
      if (participation) return
    }

    if (visibility === 'private') {
      throw new ErrorWithStatus({
        message: 'Challenge is private',
        status: HTTP_STATUS.FORBIDDEN
      })
    }

    if (visibility === 'friends') {
      if (!userId) {
        throw new ErrorWithStatus({
          message: 'Login is required to view friends-only challenge comments',
          status: HTTP_STATUS.FORBIDDEN
        })
      }
      const [viewerFollowsCreator, creatorFollowsViewer] = await Promise.all([
        FollowModel.findOne({
          user_id: new Types.ObjectId(userId),
          follow_id: new Types.ObjectId(creatorId)
        })
          .select('_id')
          .lean(),
        FollowModel.findOne({
          user_id: new Types.ObjectId(creatorId),
          follow_id: new Types.ObjectId(userId)
        })
          .select('_id')
          .lean()
      ])
      if (!(viewerFollowsCreator && creatorFollowsViewer)) {
        throw new ErrorWithStatus({
          message: 'Only creator friends can view these comments',
          status: HTTP_STATUS.FORBIDDEN
        })
      }
    }
  }

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
    await this.assertUserCanViewChallengeDayComments(challengeId, userId)

    if (parent_comment_id) {
      const parentComment = await ChallengeDayCommentModel.findById(parent_comment_id)
      if (!parentComment) {
        throw new Error('Parent comment not found')
      }
      if (parentComment.challengeId.toString() !== challengeId) {
        throw new Error('Parent comment does not belong to this challenge')
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
    { page = 1, limit = 10 }: { page?: number; limit?: number },
    viewerUserId?: string
  ) {
    await this.assertUserCanViewChallengeDayComments(challengeId, viewerUserId)
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
    { page = 1, limit = 10 }: { page?: number; limit?: number },
    viewerUserId?: string
  ) {
    const parent = await ChallengeDayCommentModel.findById(parent_comment_id).select('challengeId')
    if (!parent) {
      throw new Error('Parent comment not found')
    }
    await this.assertUserCanViewChallengeDayComments(parent.challengeId.toString(), viewerUserId)

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

    await this.assertUserCanViewChallengeDayComments(comment.challengeId.toString(), userId)

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
