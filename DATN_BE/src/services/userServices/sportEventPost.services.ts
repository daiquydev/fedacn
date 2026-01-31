import SportEventPostModel, { SportEventPost } from '~/models/schemas/sportEventPost.schema'
import SportEventModel from '~/models/schemas/sportEvent.schema'
import { Types } from 'mongoose'

class SportEventPostService {
  // Create a new event post
  async createPostService({
    eventId,
    userId,
    content,
    images
  }: {
    eventId: string
    userId: string
    content: string
    images?: string[]
  }) {
    // Verify event exists
    const event = await SportEventModel.findById(eventId)
    if (!event) {
      throw new Error('Event not found')
    }

    // Optionally verify user is a participant
    const isParticipant = event.participants_ids?.some((id) => id.toString() === userId)
    if (!isParticipant) {
      throw new Error('Only event participants can post')
    }

    const newPost = new SportEventPostModel({
      eventId,
      userId,
      content,
      images: images || [],
      likeCount: 0,
      commentCount: 0,
      likedBy: []
    })

    await newPost.save()

    // Populate user info before returning
    const populatedPost = await newPost.populate('userId', 'name avatar')

    return populatedPost
  }

  // Get all posts for an event (paginated)
  async getEventPostsService(
    eventId: string,
    { page = 1, limit = 10 }: { page?: number; limit?: number }
  ) {
    const skip = (page - 1) * limit

    const posts = await SportEventPostModel.find({ eventId })
      .populate('userId', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec()

    const total = await SportEventPostModel.countDocuments({ eventId })
    const totalPages = Math.ceil(total / limit)

    return {
      posts,
      page,
      limit,
      total,
      totalPages
    }
  }

  // Update a post
  async updatePostService(
    postId: string,
    userId: string,
    updateData: { content?: string; images?: string[] }
  ) {
    const post = await SportEventPostModel.findOne({
      _id: postId,
      userId
    })

    if (!post) {
      throw new Error('Post not found or unauthorized')
    }

    if (updateData.content) post.content = updateData.content
    if (updateData.images) post.images = updateData.images

    await post.save()
    await post.populate('userId', 'name avatar')

    return post
  }

  // Delete a post
  async deletePostService(postId: string, userId: string, isEventCreator: boolean = false) {
    const post = await SportEventPostModel.findById(postId)

    if (!post) {
      throw new Error('Post not found')
    }

    // Only post author or event creator can delete
    if (post.userId.toString() !== userId && !isEventCreator) {
      throw new Error('Unauthorized to delete this post')
    }

    await post.deleteOne()
    return post
  }

  // Like/Unlike a post
  async toggleLikePostService(postId: string, userId: string) {
    const post = await SportEventPostModel.findById(postId)

    if (!post) {
      throw new Error('Post not found')
    }

    const userObjectId = new Types.ObjectId(userId)
    const likeIndex = post.likedBy.findIndex((id) => id.toString() === userId)

    if (likeIndex === -1) {
      // Like the post
      post.likedBy.push(userObjectId)
      post.likeCount += 1
    } else {
      // Unlike the post
      post.likedBy.splice(likeIndex, 1)
      post.likeCount -= 1
    }

    await post.save()
    await post.populate('userId', 'name avatar')

    return {
      post,
      isLiked: likeIndex === -1
    }
  }

  // Get single post
  async getPostService(postId: string) {
    const post = await SportEventPostModel.findById(postId).populate('userId', 'name avatar')

    if (!post) {
      throw new Error('Post not found')
    }

    return post
  }

  // Check if user liked a post
  async checkUserLikedService(postId: string, userId: string) {
    const post = await SportEventPostModel.findById(postId)

    if (!post) {
      throw new Error('Post not found')
    }

    const isLiked = post.likedBy.some((id) => id.toString() === userId)
    return isLiked
  }

  // Share a post
  async sharePostService(postId: string, userId: string) {
    const post = await SportEventPostModel.findById(postId)

    if (!post) {
      throw new Error('Post not found')
    }

    // Add user to shares list if not already there (or allow multiple shares?)
    // Usually shares are just a count + list of who shared. 
    // Let's allow multiple shares by same user (e.g. sharing to different platforms) 
    // OR just track unique sharers. Let's track unique sharers for now.

    const userObjectId = new Types.ObjectId(userId)
    if (!post.shares) post.shares = []
    
    if (!post.shares.includes(userObjectId)) {
      post.shares.push(userObjectId)
    }
    
    post.shareCount += 1
    await post.save()

    return post
  }
}

const sportEventPostService = new SportEventPostService()
export default sportEventPostService
