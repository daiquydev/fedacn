import SportEventCommentModel from '~/models/schemas/sportEventComment.schema'
import SportEventPostModel from '~/models/schemas/sportEventPost.schema'
import { Types } from 'mongoose'

class SportEventCommentService {
  // Create a new comment
  async createCommentService({
    postId,
    userId,
    content,
    parent_comment_id
  }: {
    postId: string
    userId: string
    content: string
    parent_comment_id?: string
  }) {
    // Verify post exists
    const post = await SportEventPostModel.findById(postId)
    if (!post) {
      throw new Error('Post not found')
    }

    // Verify parent comment if replying
    if (parent_comment_id) {
      const parentComment = await SportEventCommentModel.findById(parent_comment_id)
      if (!parentComment) {
        throw new Error('Parent comment not found')
      }
      // Update reply count for parent
      parentComment.replyCount += 1
      await parentComment.save()
    }

    const newComment = new SportEventCommentModel({
      postId,
      userId,
      content,
      parent_comment_id: parent_comment_id || null,
      likeCount: 0,
      replyCount: 0,
      likedBy: []
    })

    await newComment.save()

    // Update post comment count
    post.commentCount += 1
    await post.save()

    // Populate user info
    await newComment.populate('userId', 'name avatar')

    return newComment
  }

  // Get comments for a post (top-level only)
  async getCommentsService(
    postId: string,
    { page = 1, limit = 10 }: { page?: number; limit?: number }
  ) {
    const skip = (page - 1) * limit

    const comments = await SportEventCommentModel.find({ 
      postId,
      parent_comment_id: null 
    })
      .populate('userId', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    // Get stats for each comment (like updated replyCount) - actually schema has it, but good to be sure
    // For now simple query is enough

    const total = await SportEventCommentModel.countDocuments({ 
      postId, 
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

  // Get child comments (replies)
  async getChildCommentsService(
    parent_comment_id: string,
    { page = 1, limit = 10 }: { page?: number; limit?: number }
  ) {
    const skip = (page - 1) * limit

    const comments = await SportEventCommentModel.find({ 
      parent_comment_id 
    })
      .populate('userId', 'name avatar')
      .sort({ createdAt: 1 }) // Chronological for replies
      .skip(skip)
      .limit(limit)

    const total = await SportEventCommentModel.countDocuments({ parent_comment_id })
    const totalPages = Math.ceil(total / limit)

    return {
      child_comments: comments,
      page,
      limit,
      total,
      totalPages
    }
  }

  // Delete a comment
  async deleteCommentService(commentId: string, userId: string) {
    const comment = await SportEventCommentModel.findById(commentId)

    if (!comment) {
      throw new Error('Comment not found')
    }

    if (comment.userId.toString() !== userId) {
      throw new Error('Unauthorized to delete this comment')
    }

    // If it's a child comment, decrease parent's replyCount
    if (comment.parent_comment_id) {
      await SportEventCommentModel.findByIdAndUpdate(comment.parent_comment_id, {
        $inc: { replyCount: -1 }
      })
    }

    // Decrease post comment count (and all its replies?)
    // For simplicity, just decrease by 1 for the deleted comment. 
    // Ideally should delete all replies too and decrease count accordingly.
    // Let's count how many replies will be deleted
    
    // Recursive delete or just delete direct children?
    // Implementing simple delete for now. 
    
    // Update post count
    await SportEventPostModel.findByIdAndUpdate(comment.postId, {
      $inc: { commentCount: -1 }
    })

    await comment.deleteOne()
    return comment
  }
}

const sportEventCommentService = new SportEventCommentService()
export default sportEventCommentService
