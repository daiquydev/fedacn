import { Request, Response } from 'express'
import sportEventPostService from '~/services/userServices/sportEventPost.services'
import SportEventModel from '~/models/schemas/sportEvent.schema'

export const createEventPostController = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params
    const userId = (req as any).decoded?.user_id
    const { content, images } = req.body

    if (!content || !content.trim()) {
      return res.status(400).json({
        message: 'Post content is required'
      })
    }

    const post = await sportEventPostService.createPostService({
      eventId,
      userId,
      content,
      images
    })

    return res.status(201).json({
      result: post,
      message: 'Post created successfully'
    })
  } catch (error) {
    return res.status(400).json({
      message: (error as Error).message
    })
  }
}

export const getEventPostsController = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params
    const { page, limit } = req.query

    const postsData = await sportEventPostService.getEventPostsService(eventId, {
      page: Number(page) || 1,
      limit: Number(limit) || 10
    })

    return res.json({
      result: postsData,
      message: 'Get event posts successfully'
    })
  } catch (error) {
    return res.status(500).json({
      message: (error as Error).message
    })
  }
}

export const updateEventPostController = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params
    const userId = (req as any).decoded?.user_id
    const { content, images } = req.body

    const post = await sportEventPostService.updatePostService(postId, userId, {
      content,
      images
    })

    return res.json({
      result: post,
      message: 'Post updated successfully'
    })
  } catch (error) {
    return res.status(400).json({
      message: (error as Error).message
    })
  }
}

export const deleteEventPostController = async (req: Request, res: Response) => {
  try {
    const { eventId, postId } = req.params
    const userId = (req as any).decoded?.user_id

    // Check if user is event creator
    const event = await SportEventModel.findById(eventId)
    const isEventCreator = event?.createdBy.toString() === userId

    await sportEventPostService.deletePostService(postId, userId, isEventCreator)

    return res.json({
      message: 'Post deleted successfully'
    })
  } catch (error) {
    return res.status(400).json({
      message: (error as Error).message
    })
  }
}

export const toggleLikePostController = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params
    const userId = (req as any).decoded?.user_id

    const result = await sportEventPostService.toggleLikePostService(postId, userId)

    return res.json({
      result,
      message: result.isLiked ? 'Post liked successfully' : 'Post unliked successfully'
    })
  } catch (error) {
    return res.status(400).json({
      message: (error as Error).message
    })
  }
}

export const getEventPostController = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params

    const post = await sportEventPostService.getPostService(postId)

    return res.json({
      result: post,
      message: 'Get post successfully'
    })
  } catch (error) {
    return res.status(404).json({
      message: (error as Error).message
    })
  }
}

export const shareEventPostController = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params
    const userId = (req as any).decoded?.user_id

    const post = await sportEventPostService.sharePostService(postId, userId)

    return res.json({
      result: post,
      message: 'Post shared successfully'
    })
  } catch (error) {
    return res.status(400).json({
      message: (error as Error).message
    })
  }
}
