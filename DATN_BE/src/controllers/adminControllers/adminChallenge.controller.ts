import { Request, Response } from 'express'
import { Types } from 'mongoose'
import ChallengeModel from '~/models/schemas/challenge.schema'
import ChallengeParticipantModel from '~/models/schemas/challengeParticipant.schema'
import UserModel from '~/models/schemas/user.schema'
import challengeService from '~/services/userServices/challenge.services'

// GET /api/admin/challenges?page=&limit=&search=&challenge_type=&visibility=&status=&show_deleted=&dateFrom=&dateTo=&sortBy=
export const adminGetChallengesController = async (req: Request, res: Response) => {
    const { page, limit, search, challenge_type, visibility, status, show_deleted, dateFrom, dateTo, sortBy } = req.query
    const p = Number(page) || 1
    const lim = Number(limit) || 20
    const skip = (p - 1) * lim

    const condition: any = {}

    if (show_deleted === 'true') {
        condition.is_deleted = true
    } else {
        condition.is_deleted = { $ne: true }
    }

    const normalizedSearch = typeof search === 'string' ? search.trim() : ''
    if (normalizedSearch) condition.$text = { $search: normalizedSearch }
    if (challenge_type && challenge_type !== 'all') condition.challenge_type = challenge_type
    if (visibility && visibility !== 'all') condition.visibility = visibility
    if (status && status !== 'all') condition.status = status
    if (dateFrom) condition.start_date = { ...(condition.start_date || {}), $gte: new Date(dateFrom as string) }
    if (dateTo) condition.end_date = { ...(condition.end_date || {}), $lte: new Date(dateTo as string) }

    let sortOption: Record<string, 1 | -1> = { createdAt: -1 }
    if (sortBy === 'oldest') sortOption = { createdAt: 1 }
    else if (sortBy === 'popular') sortOption = { participants_count: -1 }
    else if (sortBy === 'earliest') sortOption = { start_date: 1 }

    const [challengesRaw, total] = await Promise.all([
        ChallengeModel.find(condition)
            .populate('creator_id', 'name avatar username')
            .skip(skip)
            .limit(lim)
            .sort(sortOption)
            .lean(),
        ChallengeModel.countDocuments(condition)
    ])

    const challengeIds = challengesRaw.map(c => c._id)
    await challengeService.syncCreatorParticipantsForChallenges(challengeIds)

    const participants = await ChallengeParticipantModel.find({
        challenge_id: { $in: challengeIds },
        status: { $ne: 'quit' }
    }).lean()

    const challenges = challengesRaw.map(challenge => {
        const cParts = participants.filter(p => String(p.challenge_id) === String(challenge._id))
        
        let progressPercent = 0
        let totalCurrentValue = 0

        const startDate = new Date(challenge.start_date || new Date())
        const endDate = new Date(challenge.end_date || new Date())
        startDate.setHours(0, 0, 0, 0)
        endDate.setHours(0, 0, 0, 0)
        const totalRequiredDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1)

        if (cParts.length > 0) {
            let totalPct = 0
            cParts.forEach(p => {
                const val = typeof p.current_value === 'number' ? p.current_value : 0
                const pct = Math.min(Math.round((val / totalRequiredDays) * 100), 100)
                totalPct += pct
                totalCurrentValue += val
            })
            progressPercent = Math.round(totalPct / cParts.length)
        }

        return {
            ...challenge,
            participants_count: cParts.length,
            progressPercent,
            progressTotal: totalCurrentValue, 
            targetValue: totalRequiredDays * cParts.length, 
            targetUnit: challenge.goal_unit
        }
    })

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
    const now = new Date()

    const [total, active, completed, cancelled, nutrition, outdoor, fitness, ongoing] = await Promise.all([
        ChallengeModel.countDocuments(notDeleted),
        ChallengeModel.countDocuments({ ...notDeleted, status: 'active' }),
        ChallengeModel.countDocuments({ ...notDeleted, status: 'completed' }),
        ChallengeModel.countDocuments({ ...notDeleted, status: 'cancelled' }),
        ChallengeModel.countDocuments({ ...notDeleted, challenge_type: 'nutrition' }),
        ChallengeModel.countDocuments({ ...notDeleted, challenge_type: 'outdoor_activity' }),
        ChallengeModel.countDocuments({ ...notDeleted, challenge_type: 'fitness' }),
        ChallengeModel.countDocuments({
            ...notDeleted,
            start_date: { $lte: now },
            end_date: { $gt: now }
        })
    ])

    const activeChallengeIds = await ChallengeModel.find(notDeleted).distinct('_id')
    const totalParticipants = activeChallengeIds.length
        ? await ChallengeParticipantModel.countDocuments({
            challenge_id: { $in: activeChallengeIds },
            status: { $ne: 'quit' }
        })
        : 0

    // Tổng số Đã xóa (để admin biết)
    const deletedCount = await ChallengeModel.countDocuments({ is_deleted: true })

    const avgParticipantsPerChallenge = total > 0 ? Math.round(totalParticipants / total) : 0

    const monthRanges = Array.from({ length: 6 }, (_, idx) => {
        const offset = 5 - idx
        const d = new Date(now.getFullYear(), now.getMonth() - offset, 1)
        return {
            start: new Date(d.getFullYear(), d.getMonth(), 1),
            end: new Date(d.getFullYear(), d.getMonth() + 1, 1)
        }
    })
    const createdCountsLast6Months = await Promise.all(
        monthRanges.map(({ start, end }) =>
            ChallengeModel.countDocuments({
                ...notDeleted,
                createdAt: { $gte: start, $lt: end }
            })
        )
    )

    return res.json({
        message: 'Lấy thống kê thử thách thành công',
        result: {
            total, active, completed, cancelled,
            byType: { nutrition, outdoor_activity: outdoor, fitness },
            totalParticipants,
            deleted: deletedCount,
            ongoing,
            avgParticipantsPerChallenge,
            createdCountsLast6Months
        }
    })
}

// DELETE /api/admin/challenges/:id  — soft delete (xóa mềm)
export const adminDeleteChallengeController = async (req: Request, res: Response) => {
    const { id } = req.params

    const challenge = await ChallengeModel.findOneAndUpdate(
        { _id: new Types.ObjectId(id), is_deleted: { $ne: true } },
        {
            status: 'cancelled',
            is_deleted: true,
            deleted_from_report_moderation: false,
            deleted_at: new Date()
        },
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

    const existing = await ChallengeModel.findById(id)
        .select('is_deleted deleted_from_report_moderation creator_id')
        .lean()
    if (!existing?.is_deleted) {
        return res.status(404).json({ message: 'Thử thách không tồn tại hoặc chưa bị xóa' })
    }

    const shouldDecrementViolations =
        existing.deleted_from_report_moderation === true && Boolean(existing.creator_id)

    const challenge = await ChallengeModel.findOneAndUpdate(
        { _id: new Types.ObjectId(id), is_deleted: true },
        {
            $set: {
                status: 'active',
                is_deleted: false,
                deleted_from_report_moderation: false,
                deleted_at: null
            }
        },
        { new: true }
    )

    if (!challenge) {
        return res.status(404).json({ message: 'Thử thách không tồn tại hoặc chưa bị xóa' })
    }

    if (shouldDecrementViolations && existing.creator_id) {
        await UserModel.updateOne(
            { _id: new Types.ObjectId(String(existing.creator_id)) },
            [{ $set: { banned_count: { $max: [0, { $subtract: [{ $ifNull: ['$banned_count', 0] }, 1] }] } } }]
        )
    }

    return res.json({ message: 'Đã khôi phục thử thách thành công', result: challenge })
}

// POST /api/admin/challenges — Admin tạo thử thách (luôn public)
export const adminCreateChallengeController = async (req: Request, res: Response) => {
    const adminUserId = (req as any).decoded.user_id
    const {
        title, description, image, challenge_type,
        goal_type, goal_value, goal_unit,
        badge_emoji, category, kcal_per_unit,
        start_date_iso, end_date_iso,
        nutrition_sub_type, time_window_start, time_window_end,
        exercises
    } = req.body

    const result = await challengeService.createChallenge({
        creator_id: adminUserId,
        title,
        description,
        image,
        challenge_type,
        goal_type,
        goal_value: Number(goal_value),
        goal_unit,
        is_public: true,
        badge_emoji,
        category,
        kcal_per_unit: kcal_per_unit ? Number(kcal_per_unit) : undefined,
        start_date_iso,
        end_date_iso,
        visibility: 'public',
        nutrition_sub_type,
        time_window_start,
        time_window_end,
        exercises
    })

    return res.json({ message: 'Admin tạo thử thách thành công', result })
}

// PUT /api/admin/challenges/:id — Admin sửa bất kỳ thử thách nào
export const adminUpdateChallengeController = async (req: Request, res: Response) => {
    const { id } = req.params

    const challenge = await ChallengeModel.findById(id)
    if (!challenge) {
        return res.status(404).json({ message: 'Thử thách không tồn tại' })
    }

    const updateData = req.body

    // Không cho phép đổi challenge_type
    delete updateData.challenge_type

    const allowedFields = [
        'title', 'description', 'image', 'is_public', 'badge_emoji',
        'category', 'kcal_per_unit', 'goal_type', 'goal_value', 'goal_unit',
        'start_date', 'end_date', 'visibility', 'difficulty',
        'nutrition_sub_type', 'time_window_start', 'time_window_end',
        'exercises'
    ]
    const safeUpdate: any = {}
    for (const key of allowedFields) {
        if (updateData[key] !== undefined) safeUpdate[key] = updateData[key]
    }

    // Fitness: đồng bộ goal_value theo số lượng exercises nếu exercises thay đổi
    if (safeUpdate.exercises && Array.isArray(safeUpdate.exercises) && challenge.challenge_type === 'fitness') {
        safeUpdate.goal_value = safeUpdate.exercises.length
        safeUpdate.goal_unit = 'bài tập'
    }

    const updated = await ChallengeModel.findByIdAndUpdate(id, safeUpdate, { new: true })
        .populate('creator_id', 'name avatar username')

    return res.json({ message: 'Admin cập nhật thử thách thành công', result: updated })
}
