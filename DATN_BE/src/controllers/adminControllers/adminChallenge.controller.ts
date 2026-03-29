import { Request, Response } from 'express'
import { Types } from 'mongoose'
import ChallengeModel from '~/models/schemas/challenge.schema'
import ChallengeParticipantModel from '~/models/schemas/challengeParticipant.schema'

// GET /api/admin/challenges?page=&limit=&search=&challenge_type=&status=&show_deleted=
export const adminGetChallengesController = async (req: Request, res: Response) => {
    const { page, limit, search, challenge_type, status, show_deleted } = req.query
    const p = Number(page) || 1
    const lim = Number(limit) || 20
    const skip = (p - 1) * lim

    const condition: any = {}

    if (show_deleted === 'true') {
        // Chế độ xem riêng: chỉ hiển thị đã xóa mềm
        condition.is_deleted = true
    } else {
        // Mặc định: ẩn record đã xóa mềm
        condition.is_deleted = { $ne: true }
    }

    if (search) condition.$text = { $search: search }
    if (challenge_type && challenge_type !== 'all') condition.challenge_type = challenge_type
    if (status && status !== 'all') condition.status = status

    const [challenges, total] = await Promise.all([
        ChallengeModel.find(condition)
            .populate('creator_id', 'name avatar username')
            .skip(skip)
            .limit(lim)
            .sort({ createdAt: -1 }),
        ChallengeModel.countDocuments(condition)
    ])

    const totalPage = Math.ceil(total / lim) || 1

    return res.json({
        message: 'Lấy danh sách thử thách thành công',
        result: { challenges, totalPage, page: p, limit: lim, total }
    })
}

// GET /api/admin/challenges/stats
export const adminGetChallengeStatsController = async (_req: Request, res: Response) => {
    // Chỉ đếm các challenges KHÔNG bị xóa mềm
    const notDeleted = { is_deleted: { $ne: true } }

    const [total, active, completed, cancelled, nutrition, outdoor, fitness] = await Promise.all([
        ChallengeModel.countDocuments(notDeleted),
        ChallengeModel.countDocuments({ ...notDeleted, status: 'active' }),
        ChallengeModel.countDocuments({ ...notDeleted, status: 'completed' }),
        ChallengeModel.countDocuments({ ...notDeleted, status: 'cancelled' }),
        ChallengeModel.countDocuments({ ...notDeleted, challenge_type: 'nutrition' }),
        ChallengeModel.countDocuments({ ...notDeleted, challenge_type: 'outdoor_activity' }),
        ChallengeModel.countDocuments({ ...notDeleted, challenge_type: 'fitness' })
    ])

    const totalParticipants = await ChallengeModel.aggregate([
        { $match: notDeleted },
        { $group: { _id: null, total: { $sum: '$participants_count' } } }
    ])

    // Tổng số đã xóa mềm (để admin biết)
    const deletedCount = await ChallengeModel.countDocuments({ is_deleted: true })

    return res.json({
        message: 'Lấy thống kê thử thách thành công',
        result: {
            total, active, completed, cancelled,
            byType: { nutrition, outdoor_activity: outdoor, fitness },
            totalParticipants: totalParticipants[0]?.total || 0,
            deleted: deletedCount
        }
    })
}

// DELETE /api/admin/challenges/:id  — soft delete (xóa mềm)
export const adminDeleteChallengeController = async (req: Request, res: Response) => {
    const { id } = req.params

    const challenge = await ChallengeModel.findOneAndUpdate(
        { _id: new Types.ObjectId(id), is_deleted: { $ne: true } },
        { status: 'cancelled', is_deleted: true },
        { new: true }
    )

    if (!challenge) {
        return res.status(404).json({ message: 'Thử thách không tồn tại hoặc đã bị xóa' })
    }

    return res.json({ message: 'Đã xóa thử thách thành công' })
}

// PATCH /api/admin/challenges/:id/restore — khôi phục thử thách đã xóa
export const adminRestoreChallengeController = async (req: Request, res: Response) => {
    const { id } = req.params

    const challenge = await ChallengeModel.findOneAndUpdate(
        { _id: new Types.ObjectId(id), is_deleted: true },
        { status: 'active', is_deleted: false },
        { new: true }
    )

    if (!challenge) {
        return res.status(404).json({ message: 'Thử thách không tồn tại hoặc chưa bị xóa' })
    }

    return res.json({ message: 'Đã khôi phục thử thách thành công', result: challenge })
}
