import { Request, Response } from 'express'
import habitChallengeService from '~/services/userServices/habitChallenge.services'

export const getAllHabitChallengesController = async (req: Request, res: Response) => {
  try {
    const { page, limit, search, category, challenge_type, difficulty } = req.query
    const userId = (req as any).decoded?.user_id
    const result = await habitChallengeService.getAllChallengesService({
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      search: search as string,
      category: category as string,
      challenge_type: challenge_type as string,
      difficulty: difficulty as string,
      userId
    })
    return res.json({ result, message: 'Lấy danh sách thử thách thành công' })
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message })
  }
}

export const getHabitChallengeController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = (req as any).decoded?.user_id
    const result = await habitChallengeService.getChallengeService(id, userId)
    return res.json({ result, message: 'Lấy chi tiết thử thách thành công' })
  } catch (error) {
    return res.status(404).json({ message: (error as Error).message })
  }
}

export const createHabitChallengeController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).decoded?.user_id
    if (!userId) return res.status(401).json({ message: 'Unauthorized' })

    const {
      title, description, category, challenge_type, difficulty,
      duration_days, image, is_public, max_participants, min_level, rules, team_size
    } = req.body
    if (!title) return res.status(400).json({ message: 'Tên thử thách không được để trống' })

    const result = await habitChallengeService.createChallengeService({
      creator_id: userId,
      title,
      description,
      category,
      challenge_type,
      difficulty,
      duration_days: Number(duration_days) || 21,
      image,
      is_public,
      max_participants: Number(max_participants) || 0,
      min_level: Number(min_level) || 1,
      rules,
      team_size: Number(team_size) || 0
    })
    return res.status(201).json({ result, message: 'Tạo thử thách thành công' })
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message })
  }
}

export const updateHabitChallengeController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = (req as any).decoded?.user_id
    if (!userId) return res.status(401).json({ message: 'Unauthorized' })

    const result = await habitChallengeService.updateChallengeService(id, userId, req.body)
    return res.json({ result, message: 'Cập nhật thử thách thành công' })
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message })
  }
}

export const deleteHabitChallengeController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = (req as any).decoded?.user_id
    if (!userId) return res.status(401).json({ message: 'Unauthorized' })

    await habitChallengeService.deleteChallengeService(id, userId)
    return res.json({ message: 'Xóa thử thách thành công' })
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message })
  }
}

export const joinHabitChallengeController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = (req as any).decoded?.user_id
    if (!userId) return res.status(401).json({ message: 'Unauthorized' })

    const result = await habitChallengeService.joinChallengeService(id, userId)
    return res.json({ result, message: 'Tham gia thử thách thành công' })
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message })
  }
}

export const quitHabitChallengeController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = (req as any).decoded?.user_id
    if (!userId) return res.status(401).json({ message: 'Unauthorized' })

    const result = await habitChallengeService.quitChallengeService(id, userId)
    return res.json({ result, message: 'Bỏ thử thách thành công' })
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message })
  }
}

export const setBuddyController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { buddyId } = req.body
    const userId = (req as any).decoded?.user_id
    if (!userId) return res.status(401).json({ message: 'Unauthorized' })
    if (!buddyId) return res.status(400).json({ message: 'buddyId is required' })

    const result = await habitChallengeService.setBuddyService(id, userId, buddyId)
    return res.json({ result, message: 'Đặt buddy thành công' })
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message })
  }
}

export const getMyHabitChallengesController = async (req: Request, res: Response) => {
  try {
    const { page, limit } = req.query
    const userId = (req as any).decoded?.user_id
    if (!userId) return res.status(401).json({ message: 'Unauthorized' })

    const result = await habitChallengeService.getMyChallengesService(userId, Number(page) || 1, Number(limit) || 10)
    return res.json({ result, message: 'Lấy danh sách thử thách của tôi thành công' })
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message })
  }
}

export const checkinController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { image_url, note } = req.body
    const userId = (req as any).decoded?.user_id
    if (!userId) return res.status(401).json({ message: 'Unauthorized' })

    const result = await habitChallengeService.checkinService(id, userId, image_url, note)
    return res.json({ result, message: 'Check-in thành công!' })
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message })
  }
}

export const getCheckinsController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { page, limit } = req.query
    const userId = (req as any).decoded?.user_id
    if (!userId) return res.status(401).json({ message: 'Unauthorized' })

    const result = await habitChallengeService.getCheckinsService(id, userId, Number(page) || 1, Number(limit) || 30)
    return res.json({ result, message: 'Lấy lịch sử check-in thành công' })
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message })
  }
}

export const getCheckinFeedController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { page, limit } = req.query

    const result = await habitChallengeService.getCheckinFeedService(id, Number(page) || 1, Number(limit) || 20)
    return res.json({ result, message: 'Lấy feed check-in thành công' })
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message })
  }
}

export const likeCheckinController = async (req: Request, res: Response) => {
  try {
    const { id, checkinId } = req.params
    const userId = (req as any).decoded?.user_id
    if (!userId) return res.status(401).json({ message: 'Unauthorized' })

    const result = await habitChallengeService.likeCheckinService(id, checkinId, userId)
    return res.json({ result, message: 'Thao tác thành công' })
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message })
  }
}

export const getParticipantsController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const result = await habitChallengeService.getParticipantsService(id)
    return res.json({ result, message: 'Lấy danh sách participants thành công' })
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message })
  }
}

export const getUserBadgesController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).decoded?.user_id
    if (!userId) return res.status(401).json({ message: 'Unauthorized' })

    const result = await habitChallengeService.getUserBadgesService(userId)
    return res.json({ result, message: 'Lấy danh sách huy hiệu thành công' })
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message })
  }
}

export const getBadgesForChallengeController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = (req as any).decoded?.user_id
    if (!userId) return res.status(401).json({ message: 'Unauthorized' })

    const result = await habitChallengeService.getBadgesForChallengeService(id, userId)
    return res.json({ result, message: 'Lấy huy hiệu thử thách thành công' })
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message })
  }
}

// ==================== NEW CONTROLLERS ====================

export const getUserChallengeProfileController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).decoded?.user_id
    if (!userId) return res.status(401).json({ message: 'Unauthorized' })

    const result = await habitChallengeService.getUserChallengeProfileService(userId)
    return res.json({ result, message: 'Lấy thông tin challenge profile thành công' })
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message })
  }
}

export const getLeaderboardController = async (req: Request, res: Response) => {
  try {
    const { challengeId, sort_by, page, limit } = req.query

    const result = await habitChallengeService.getLeaderboardService({
      challengeId: challengeId as string,
      sort_by: sort_by as string,
      page: Number(page) || 1,
      limit: Number(limit) || 20
    })
    return res.json({ result, message: 'Lấy bảng xếp hạng thành công' })
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message })
  }
}

export const useStreakFreezeController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = (req as any).decoded?.user_id
    if (!userId) return res.status(401).json({ message: 'Unauthorized' })

    const result = await habitChallengeService.useStreakFreezeService(id, userId)
    return res.json({ result, message: 'Đã đóng băng streak thành công! ❄️' })
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message })
  }
}
