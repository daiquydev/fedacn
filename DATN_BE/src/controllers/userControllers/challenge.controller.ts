import { Request, Response } from 'express'
import challengeService from '~/services/userServices/challenge.services'

export const getChallengesController = async (req: Request, res: Response) => {
  const { page, limit, search, goal_type, difficulty } = req.query
  const userId = (req as any).decoded?.user_id || (req as any).decoded_authorization?.user_id

  const result = await challengeService.getChallenges({
    page: Number(page) || 1,
    limit: Number(limit) || 12,
    search: search as string,
    goal_type: goal_type as string,
    difficulty: difficulty as string,
    userId
  })

  return res.json({ message: 'Lấy danh sách thử thách thành công', result })
}

export const getChallengeController = async (req: Request, res: Response) => {
  const { id } = req.params
  const userId = (req as any).decoded?.user_id || (req as any).decoded_authorization?.user_id

  const result = await challengeService.getChallenge(id, userId)

  return res.json({ message: 'Lấy thử thách thành công', result })
}

export const createChallengeController = async (req: Request, res: Response) => {
  const userId = (req as any).decoded_authorization.user_id
  const { title, description, image, goal_type, goal_value, duration_type, is_public, difficulty, badge_emoji } =
    req.body

  const result = await challengeService.createChallenge({
    creator_id: userId,
    title,
    description,
    image,
    goal_type,
    goal_value: Number(goal_value),
    duration_type,
    is_public,
    difficulty,
    badge_emoji
  })

  return res.json({ message: 'Tạo thử thách thành công', result })
}

export const updateChallengeController = async (req: Request, res: Response) => {
  const { id } = req.params
  const userId = (req as any).decoded_authorization.user_id

  const result = await challengeService.updateChallenge(id, userId, req.body)

  return res.json({ message: 'Cập nhật thử thách thành công', result })
}

export const deleteChallengeController = async (req: Request, res: Response) => {
  const { id } = req.params
  const userId = (req as any).decoded_authorization.user_id

  const result = await challengeService.deleteChallenge(id, userId)

  return res.json({ message: 'Đã xóa thử thách', result })
}

export const joinChallengeController = async (req: Request, res: Response) => {
  const { id } = req.params
  const userId = (req as any).decoded_authorization.user_id

  const result = await challengeService.joinChallenge(id, userId)

  return res.json({ message: 'Đã tham gia thử thách!', result })
}

export const quitChallengeController = async (req: Request, res: Response) => {
  const { id } = req.params
  const userId = (req as any).decoded_authorization.user_id

  const result = await challengeService.quitChallenge(id, userId)

  return res.json({ message: 'Đã rời thử thách', result })
}

export const getMyChallengesController = async (req: Request, res: Response) => {
  const userId = (req as any).decoded_authorization.user_id
  const { page, limit } = req.query

  const result = await challengeService.getMyChallenges(userId, Number(page) || 1, Number(limit) || 20)

  return res.json({ message: 'Lấy thử thách của tôi thành công', result })
}

export const getLeaderboardController = async (req: Request, res: Response) => {
  const { id } = req.params
  const { page, limit } = req.query

  const result = await challengeService.getLeaderboard(id, Number(page) || 1, Number(limit) || 50)

  return res.json({ message: 'Lấy bảng xếp hạng thành công', result })
}
