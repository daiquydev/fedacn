import { Request, Response } from 'express'
import challengeService from '~/services/userServices/challenge.services'

export const getChallengesController = async (req: Request, res: Response) => {
    const { page, limit, search, challenge_type, difficulty } = req.query
    const userId = (req as any).decoded?.user_id || (req as any).decoded_authorization?.user_id

    const result = await challengeService.getChallenges({
        page: Number(page) || 1,
        limit: Number(limit) || 12,
        search: search as string,
        challenge_type: challenge_type as string,
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
    const userId = (req as any).decoded.user_id
    const {
        title, description, image, challenge_type,
        goal_type, goal_value, goal_unit,
        is_public,
        badge_emoji, linked_meal_plan_id,
        category, kcal_per_unit,
        start_date_iso, end_date_iso, visibility,
        nutrition_sub_type, time_window_start, time_window_end,
        exercises
    } = req.body

    const result = await challengeService.createChallenge({
        creator_id: userId,
        title,
        description,
        image,
        challenge_type,
        goal_type,
        goal_value: Number(goal_value),
        goal_unit,

        is_public,
        badge_emoji,
        linked_meal_plan_id,
        category,
        kcal_per_unit: kcal_per_unit ? Number(kcal_per_unit) : undefined,
        start_date_iso,
        end_date_iso,
        visibility,
        nutrition_sub_type,
        time_window_start,
        time_window_end,
        exercises
    })

    return res.json({ message: 'Tạo thử thách thành công', result })
}

export const updateChallengeController = async (req: Request, res: Response) => {
    const { id } = req.params
    const userId = (req as any).decoded.user_id

    const result = await challengeService.updateChallenge(id, userId, req.body)

    return res.json({ message: 'Cập nhật thử thách thành công', result })
}

export const deleteChallengeController = async (req: Request, res: Response) => {
    const { id } = req.params
    const userId = (req as any).decoded.user_id

    const result = await challengeService.deleteChallenge(id, userId)

    return res.json({ message: 'Đã xóa thử thách', result })
}

export const joinChallengeController = async (req: Request, res: Response) => {
    const { id } = req.params
    const userId = (req as any).decoded.user_id

    const result = await challengeService.joinChallenge(id, userId)

    return res.json({ message: 'Đã tham gia thử thách!', result })
}

export const quitChallengeController = async (req: Request, res: Response) => {
    const { id } = req.params
    const userId = (req as any).decoded.user_id

    const result = await challengeService.quitChallenge(id, userId)

    return res.json({ message: 'Đã rời thử thách', result })
}

export const getMyCreatedChallengesController = async (req: Request, res: Response) => {
    const userId = (req as any).decoded.user_id
    const { page, limit, status } = req.query

    const result = await challengeService.getMyCreatedChallenges(userId, Number(page) || 1, Number(limit) || 20, status as string)

    return res.json({ message: 'Lấy thử thách đã tạo thành công', result })
}

export const getMyChallengesController = async (req: Request, res: Response) => {
    const userId = (req as any).decoded.user_id
    const { page, limit, status } = req.query

    const result = await challengeService.getMyChallenges(userId, Number(page) || 1, Number(limit) || 20, status as string)

    return res.json({ message: 'Lấy thử thách của tôi thành công', result })
}

export const getChallengeStatsController = async (req: Request, res: Response) => {
    const userId = (req as any).decoded.user_id
    const { type } = req.query

    const result = await challengeService.getChallengeStats(userId, type as string)

    return res.json({ message: 'Lấy thống kê thử thách thành công', result })
}

export const addProgressController = async (req: Request, res: Response) => {
    const { id } = req.params
    const userId = (req as any).decoded.user_id

    const result = await challengeService.addProgress(id, userId, req.body)

    return res.json({ message: 'Ghi nhận tiến độ thành công', result })
}

export const getProgressController = async (req: Request, res: Response) => {
    const { id } = req.params
    const { page, limit, user_id } = req.query
    const currentUserId = (req as any).decoded?.user_id || (req as any).decoded_authorization?.user_id

    const result = await challengeService.getProgress(
        id,
        (user_id as string) || currentUserId,
        Number(page) || 1,
        Number(limit) || 20
    )

    return res.json({ message: 'Lấy tiến độ thành công', result })
}

export const getLeaderboardController = async (req: Request, res: Response) => {
    const { id } = req.params
    const { page, limit } = req.query

    const result = await challengeService.getLeaderboard(id, Number(page) || 1, Number(limit) || 50)

    return res.json({ message: 'Lấy bảng xếp hạng thành công', result })
}

export const getParticipantsController = async (req: Request, res: Response) => {
    const { id } = req.params

    const result = await challengeService.getParticipants(id)

    return res.json({ message: 'Lấy danh sách người tham gia thành công', result })
}

export const getUserProgressController = async (req: Request, res: Response) => {
    const { id, userId } = req.params

    const result = await challengeService.getUserProgress(id, userId)

    return res.json({ message: 'Lấy tiến độ người dùng thành công', result })
}

export const getChallengeActivityController = async (req: Request, res: Response) => {
    const { id, activityId } = req.params

    const result = await challengeService.getChallengeActivity(id, activityId)

    return res.json({ message: 'Lấy hoạt động thành công', result })
}

export const getChallengeProgressEntryController = async (req: Request, res: Response) => {
    const { id, progressId } = req.params

    const result = await challengeService.getChallengeProgressEntry(id, progressId)

    return res.json({ message: 'Lấy tiến độ thành công', result })
}

export const deleteProgressController = async (req: Request, res: Response) => {
    const { id, progressId } = req.params
    const userId = (req as any).decoded.user_id

    const result = await challengeService.deleteProgress(id, progressId, userId)

    return res.json({ message: 'Đã xóa hoạt động thành công', result })
}

export const getPublicUserChallengesController = async (req: Request, res: Response) => {
    const { userId } = req.params
    const { page, limit } = req.query

    const result = await challengeService.getMyChallenges(userId, Number(page) || 1, Number(limit) || 20)

    return res.json({ message: 'Lấy thử thách người dùng thành công', result })
}

export const getFeedController = async (req: Request, res: Response) => {
    const { scope, challenge_type, search, page, limit, sortBy, status, dateFrom, dateTo, category } = req.query
    const userId = (req as any).decoded?.user_id || (req as any).decoded_authorization?.user_id

    const result = await challengeService.getChallengeFeed({
        scope: (scope as 'public' | 'friends' | 'mine') || 'public',
        userId,
        challenge_type: challenge_type as string,
        search: search as string,
        page: Number(page) || 1,
        limit: Number(limit) || 9,
        sortBy: sortBy as string,
        status: status as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
        category: category as string
    })

    return res.json({ message: 'Lấy feed thử thách thành công', result })
}

export const inviteFriendToChallengeController = async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        const { friendId } = req.body
        const userId = (req as any).decoded?.user_id

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' })
        }
        if (!friendId) {
            return res.status(400).json({ message: 'friendId is required' })
        }

        const result = await challengeService.inviteFriendToChallenge(id, userId, friendId)
        return res.json({
            result,
            message: 'Đã gửi lời mời thành công'
        })
    } catch (error) {
        return res.status(400).json({
            message: (error as Error).message
        })
    }
}
