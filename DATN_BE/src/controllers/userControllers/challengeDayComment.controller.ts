import { Request, Response } from 'express'
import challengeDayCommentService from '~/services/userServices/challengeDayComment.services'

export const createChallengeDayCommentController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).decoded?.user_id
    const { id: challengeId } = req.params
    const { targetUserId, date, content, parent_comment_id } = req.body

    const comment = await challengeDayCommentService.createComment({
      challengeId,
      targetUserId,
      date,
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

export const getChallengeDayCommentsController = async (req: Request, res: Response) => {
  try {
    const { id: challengeId } = req.params
    const { targetUserId, date, page, limit } = req.query

    if (!targetUserId || !date) {
      return res.status(400).json({ message: 'targetUserId and date are required' })
    }

    const commentsData = await challengeDayCommentService.getComments(
      challengeId,
      targetUserId as string,
      date as string,
      {
        page: Number(page) || 1,
        limit: Number(limit) || 10
      }
    )

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

export const getChallengeDayChildCommentsController = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params
    const { page, limit } = req.query

    const commentsData = await challengeDayCommentService.getChildComments(commentId, {
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

export const deleteChallengeDayCommentController = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params
    const userId = (req as any).decoded?.user_id

    await challengeDayCommentService.deleteComment(commentId, userId)

    return res.json({
      message: 'Comment deleted successfully'
    })
  } catch (error) {
    return res.status(400).json({
      message: (error as Error).message
    })
  }
}
