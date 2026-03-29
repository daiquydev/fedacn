import { Request, Response } from 'express'
import trainingService from '~/services/userServices/training.services'

export const getTrainingsController = async (req: Request, res: Response) => {
    const { page, limit, search, goal_type, difficulty } = req.query
    const userId = (req as any).decoded?.user_id || (req as any).decoded_authorization?.user_id

    const result = await trainingService.getTrainings({
        page: Number(page) || 1,
        limit: Number(limit) || 12,
        search: search as string,
        goal_type: goal_type as string,
        difficulty: difficulty as string,
        userId
    })

    return res.json({ message: 'Lấy danh sách bài tập luyện thành công', result })
}

export const getTrainingController = async (req: Request, res: Response) => {
    const { id } = req.params
    const userId = (req as any).decoded?.user_id || (req as any).decoded_authorization?.user_id

    const result = await trainingService.getTraining(id, userId)

    return res.json({ message: 'Lấy bài tập luyện thành công', result })
}

export const createTrainingController = async (req: Request, res: Response) => {
    const userId = (req as any).decoded_authorization.user_id
    const { title, description, image, goal_type, goal_value, is_public, difficulty, badge_emoji, start_date_iso, end_date_iso } =
        req.body

    const result = await trainingService.createTraining({
        creator_id: userId,
        title,
        description,
        image,
        goal_type,
        goal_value: Number(goal_value),
        is_public,
        difficulty,
        badge_emoji,
        start_date_iso,
        end_date_iso
    })

    return res.json({ message: 'Tạo bài tập luyện thành công', result })
}

export const updateTrainingController = async (req: Request, res: Response) => {
    const { id } = req.params
    const userId = (req as any).decoded_authorization.user_id

    const result = await trainingService.updateTraining(id, userId, req.body)

    return res.json({ message: 'Cập nhật bài tập luyện thành công', result })
}

export const deleteTrainingController = async (req: Request, res: Response) => {
    const { id } = req.params
    const userId = (req as any).decoded_authorization.user_id

    const result = await trainingService.deleteTraining(id, userId)

    return res.json({ message: 'Đã xóa bài tập luyện', result })
}

export const joinTrainingController = async (req: Request, res: Response) => {
    const { id } = req.params
    const userId = (req as any).decoded_authorization.user_id

    const result = await trainingService.joinTraining(id, userId)

    return res.json({ message: 'Đã tham gia bài tập luyện!', result })
}

export const quitTrainingController = async (req: Request, res: Response) => {
    const { id } = req.params
    const userId = (req as any).decoded_authorization.user_id

    const result = await trainingService.quitTraining(id, userId)

    return res.json({ message: 'Đã rời bài tập luyện', result })
}

export const getMyTrainingsController = async (req: Request, res: Response) => {
    const userId = (req as any).decoded_authorization.user_id
    const { page, limit } = req.query

    const result = await trainingService.getMyTrainings(userId, Number(page) || 1, Number(limit) || 20)

    return res.json({ message: 'Lấy bài tập luyện của tôi thành công', result })
}

export const getLeaderboardController = async (req: Request, res: Response) => {
    const { id } = req.params
    const { page, limit } = req.query

    const result = await trainingService.getLeaderboard(id, Number(page) || 1, Number(limit) || 50)

    return res.json({ message: 'Lấy bảng xếp hạng thành công', result })
}
