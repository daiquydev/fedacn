import { Request, Response } from 'express'
import sportEventCommentService from '~/services/userServices/sportEventComment.services'

export const createEventCommentController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).decoded?.user_id
    const { postId, content, parent_comment_id } = req.body

    const comment = await sportEventCommentService.createCommentService({
      postId,
      userId,
      content,
      parent_comment_id
    })

    return res.status(201).json({
      result: comment,
      message: 'Comment created successfully'
    })
  } catch (error) {
    return res.status(400).json({
      message: (error as Error).message
    })
  }
}

export const getEventCommentsController = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params
    const { page, limit } = req.query

    const commentsData = await sportEventCommentService.getCommentsService(postId, {
      page: Number(page) || 1,
      limit: Number(limit) || 10
    })

    return res.json({
      result: commentsData,
      message: 'Get comments successfully'
    })
  } catch (error) {
    return res.status(500).json({
      message: (error as Error).message
    })
  }
}

export const getEventChildCommentsController = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params
    const { page, limit } = req.query

    const commentsData = await sportEventCommentService.getChildCommentsService(commentId, {
      page: Number(page) || 1,
      limit: Number(limit) || 10
    })

    return res.json({
      result: commentsData,
      message: 'Get child comments successfully'
    })
  } catch (error) {
    return res.status(500).json({
      message: (error as Error).message
    })
  }
}

export const deleteEventCommentController = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params
    const userId = (req as any).decoded?.user_id

    await sportEventCommentService.deleteCommentService(commentId, userId)

    return res.json({
      message: 'Comment deleted successfully'
    })
  } catch (error) {
    return res.status(400).json({
      message: (error as Error).message
    })
  }
}
