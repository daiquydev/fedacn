import { Types } from 'mongoose'
import ChallengeModel from '~/models/schemas/challenge.schema'
import ChallengeParticipantModel from '~/models/schemas/challengeParticipant.schema'
import ChallengeProgressModel from '~/models/schemas/challengeProgress.schema'
import ActivityTrackingModel from '~/models/schemas/activityTracking.schema'
import NotificationModel from '~/models/schemas/notification.schema'
import FollowModel from '~/models/schemas/follow.schema'
import PostModel from '~/models/schemas/post.schema'
import { NotificationTypes } from '~/constants/enums'
import { CHALLENGE_MESSAGE } from '~/constants/messages'
import { ErrorWithStatus } from '~/utils/error'
import HTTP_STATUS from '~/constants/httpStatus'

class ChallengeService {
    private async cleanupChallengePostMarkers(challengeId: string) {
        const markerRegex = `\\[challenge:${challengeId}\\]|\\[challenge-activity:[a-f0-9]{24}:${challengeId}\\]|\\[challenge-progress:[a-f0-9]{24}:${challengeId}\\]`
        try {
            const postsWithMarker = await PostModel.find({ content: { $regex: markerRegex, $options: 'i' } })
            for (const post of postsWithMarker) {
                post.content = (post.content || '')
                    .replace(new RegExp(`\\n?\\[challenge:${challengeId}\\]`, 'gi'), '')
                    .replace(new RegExp(`\\n?\\[challenge-activity:[a-f0-9]{24}:${challengeId}\\]`, 'gi'), '')
                    .replace(new RegExp(`\\n?\\[challenge-progress:[a-f0-9]{24}:${challengeId}\\]`, 'gi'), '')
                    .trim()
                await post.save()
            }
        } catch (err) {
            console.error('Failed to clean post markers for challenge:', challengeId, err)
        }
    }

    /**
     * Tìm theo tiêu đề/mô tả: mỗi từ trong chuỗi đều phải xuất hiện (AND).
     * Tránh MongoDB $text (mặc định OR giữa các từ) khiến một từ trùng vẫn trả về kết quả không liên quan.
     */
    private buildChallengeTitleDescriptionSearchCondition(search?: string): Record<string, unknown> | null {
        const trimmed = typeof search === 'string' ? search.trim() : ''
        if (!trimmed) return null
        const words = trimmed.split(/\s+/).filter(Boolean)
        const perWord = words.map((word) => {
            const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            return {
                $or: [{ title: { $regex: escaped, $options: 'i' } }, { description: { $regex: escaped, $options: 'i' } }]
            }
        })
        if (perWord.length === 1) return perWord[0] as Record<string, unknown>
        return { $and: perWord }
    }

    /** Đếm participant thực tế (bảng challenge_participants, không tính đã rời). */
    private async getActiveParticipantCountsMap(challengeIds: Types.ObjectId[]): Promise<Map<string, number>> {
        if (!challengeIds.length) return new Map()
        const rows = await ChallengeParticipantModel.aggregate([
            { $match: { challenge_id: { $in: challengeIds }, status: { $ne: 'quit' } } },
            { $group: { _id: '$challenge_id', n: { $sum: 1 } } }
        ])
        return new Map(rows.map((r) => [r._id.toString(), r.n]))
    }

    /**
     * Chuẩn hóa participants_count trên document challenges theo collection (sửa lệch dữ liệu cũ / seed).
     * Trả về số đã đếm để gắn vào API response.
     */
    private async reconcileStoredParticipantsCount(challengeId: string): Promise<number> {
        const actual = await ChallengeParticipantModel.countDocuments({
            challenge_id: new Types.ObjectId(challengeId),
            status: { $ne: 'quit' }
        })
        await ChallengeModel.updateOne(
            { _id: new Types.ObjectId(challengeId), participants_count: { $ne: actual } },
            { $set: { participants_count: actual } }
        )
        return actual
    }

    // ==================== CRUD ====================

    async createChallenge({
        creator_id,
        title,
        description,
        image,
        challenge_type,
        goal_type,
        goal_value,
        goal_unit,

        is_public,
        badge_emoji,
        linked_meal_plan_id,
        category,
        kcal_per_unit,
        start_date_iso,
        end_date_iso,
        visibility,
        difficulty,
        nutrition_sub_type,
        time_window_start,
        time_window_end,
        exercises
    }: {
        creator_id: string
        title: string
        description?: string
        image?: string
        challenge_type: 'nutrition' | 'outdoor_activity' | 'fitness'
        goal_type: string
        goal_value: number
        goal_unit: string

        is_public?: boolean
        badge_emoji?: string
        linked_meal_plan_id?: string
        category?: string
        kcal_per_unit?: number
        start_date_iso?: string
        end_date_iso?: string
        visibility?: string
        difficulty?: 'easy' | 'medium' | 'hard'
        // nutrition time-window fields
        nutrition_sub_type?: 'free' | 'time_window'
        time_window_start?: string
        time_window_end?: string
        // fitness exercises
        exercises?: Array<{ exercise_id: string; exercise_name: string; sets?: Array<{ set_number: number; reps: number; weight: number; calories_per_unit: number }> }>
    }) {
        if (!title || !title.trim()) throw new Error('Tên thử thách không được để trống')
        if (!challenge_type) throw new Error('Vui lòng chọn loại thử thách')

        // Fitness: auto-set goal based on exercises count
        if (challenge_type === 'fitness') {
            if (!exercises || exercises.length === 0) throw new Error('Vui lòng chọn ít nhất 1 bài tập')
            goal_type = 'exercises_completed'
            goal_value = exercises.length
            goal_unit = 'bài tập'
        }

        if (!goal_type) throw new Error('Vui lòng chọn loại mục tiêu')
        if (!goal_value || goal_value <= 0) throw new Error('Giá trị mục tiêu phải lớn hơn 0')
        if (!goal_unit) throw new Error('Vui lòng chọn đơn vị mục tiêu')

        const startDate = start_date_iso ? new Date(start_date_iso) : new Date()
        if (!end_date_iso) throw new Error('Vui lòng chọn ngày kết thúc')
        const endDate = new Date(end_date_iso)

        const vis = visibility || (is_public === false ? 'private' : 'public')

        const challenge = new ChallengeModel({
            creator_id: new Types.ObjectId(creator_id),
            title: title.trim(),
            description: description || '',
            image: image || '',
            challenge_type,
            goal_type,
            goal_value,
            goal_unit,

            start_date: startDate,
            end_date: endDate,
            visibility: vis,
            is_public: vis !== 'private',
            status: 'active',
            participants_count: 0,
            badge_emoji: badge_emoji || '🏆',
            difficulty: difficulty || 'medium',
            linked_meal_plan_id: linked_meal_plan_id ? new Types.ObjectId(linked_meal_plan_id) : null,
            category: category || '',
            kcal_per_unit: kcal_per_unit || 0,
            // nutrition time-window
            nutrition_sub_type: challenge_type === 'nutrition' ? (nutrition_sub_type || 'free') : 'free',
            time_window_start: (challenge_type === 'nutrition' && nutrition_sub_type === 'time_window') ? (time_window_start || null) : null,
            time_window_end: (challenge_type === 'nutrition' && nutrition_sub_type === 'time_window') ? (time_window_end || null) : null,
            // fitness exercises
            exercises: challenge_type === 'fitness' && Array.isArray(exercises)
                ? exercises.map(ex => ({
                    exercise_id: new Types.ObjectId(ex.exercise_id),
                    exercise_name: ex.exercise_name,
                    sets: Array.isArray(ex.sets) && ex.sets.length > 0
                        ? ex.sets.map((s: any, idx: number) => ({ set_number: s.set_number || idx + 1, reps: s.reps || 10, weight: s.weight || 0, calories_per_unit: s.calories_per_unit || 10 }))
                        : [{ set_number: 1, reps: 10, weight: 0, calories_per_unit: 10 }]
                }))
                : []
        })

        await challenge.save()

        // Auto-join người tạo (bỏ qua check hạn — tránh lệch timezone khi end_date là 00:00 UTC trong cùng ngày)
        await this.addChallengeParticipantInternal(challenge._id.toString(), creator_id, { skipExpiryCheck: true })

        return challenge
    }

    async getChallenges({
        page = 1,
        limit = 12,
        search,
        challenge_type,
        difficulty,
        userId
    }: {
        page?: number
        limit?: number
        search?: string
        challenge_type?: string
        difficulty?: string
        userId?: string
    }) {
        const condition: any = { status: 'active', is_public: true, is_deleted: { $ne: true } }

        const searchCond = this.buildChallengeTitleDescriptionSearchCondition(search)
        if (searchCond) {
            condition.$and = [...(condition.$and || []), searchCond]
        }
        if (challenge_type && challenge_type !== 'all') condition.challenge_type = challenge_type
        if (difficulty && difficulty !== 'all') condition.difficulty = difficulty

        const skip = (page - 1) * limit

        const challenges = await ChallengeModel.find(condition)
            .populate('creator_id', 'name avatar')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })

        const total = await ChallengeModel.countDocuments(condition)
        const totalPage = Math.ceil(total / limit)

        let resultChallenges = challenges.map((c) => c.toObject())

        await Promise.all(
            resultChallenges.map((c: any) => this.ensureCreatorIsParticipant(c._id.toString()))
        )

        const listCountMap = await this.getActiveParticipantCountsMap(challenges.map((c) => c._id as Types.ObjectId))
        resultChallenges = resultChallenges.map((c: any) => ({
            ...c,
            participants_count: listCountMap.get(c._id.toString()) ?? 0
        }))

        if (userId) {
            const participations = await ChallengeParticipantModel.find({
                user_id: new Types.ObjectId(userId),
                challenge_id: { $in: challenges.map((c) => c._id) },
                status: { $ne: 'quit' }
            })
            const joinedMap = new Map<string, any>()
            participations.forEach((p) => {
                joinedMap.set(p.challenge_id.toString(), p.toObject())
            })

            const uid = String(userId)
            resultChallenges = resultChallenges.map((c: any) => ({
                ...c,
                isJoined: joinedMap.has(c._id.toString()) || this.feedChallengeCreatorId(c) === uid,
                myProgress: joinedMap.get(c._id.toString()) || null
            }))
        }

        return { challenges: resultChallenges, totalPage, page, limit, total }
    }

    async getChallenge(challengeId: string, userId?: string) {
        const challenge = await ChallengeModel.findById(challengeId).populate('creator_id', 'name avatar email')
        if (!challenge) {
            throw new ErrorWithStatus({ message: 'Thử thách không tồn tại', status: HTTP_STATUS.NOT_FOUND })
        }
        if (challenge.is_deleted) {
            if (challenge.deleted_from_report_moderation) {
                throw new ErrorWithStatus({
                    message: 'Thử thách đã bị gỡ do vi phạm nội dung',
                    status: HTTP_STATUS.GONE
                })
            }
            throw new ErrorWithStatus({ message: 'Thử thách không tồn tại', status: HTTP_STATUS.NOT_FOUND })
        }

        await this.assertUserCanViewChallenge(challenge, userId)

        await this.ensureCreatorIsParticipant(challengeId)

        const result: any = challenge.toObject()
        result.participants_count = await this.reconcileStoredParticipantsCount(challengeId)

        // Calculate time remaining
        const now = new Date()
        const endDate = new Date(challenge.end_date)
        const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)))
        result.days_remaining = daysRemaining
        result.is_expired = now > endDate

        if (userId) {
            const creatorIdStr = (() => {
                const c = challenge.creator_id as unknown as { _id?: Types.ObjectId } | Types.ObjectId
                if (c && typeof c === 'object' && '_id' in c && c._id) return c._id.toString()
                return (c as Types.ObjectId).toString()
            })()

            const participation = await ChallengeParticipantModel.findOne({
                challenge_id: new Types.ObjectId(challengeId),
                user_id: new Types.ObjectId(userId),
                status: { $ne: 'quit' }
            })

            result.isJoined = !!participation || userId === creatorIdStr
            result.participation = participation ? participation.toObject() : null

            if (!participation) {
                const quitParticipation = await ChallengeParticipantModel.findOne({
                    challenge_id: new Types.ObjectId(challengeId),
                    user_id: new Types.ObjectId(userId),
                    status: 'quit'
                })
                result.hasPreviouslyQuit = !!quitParticipation
            } else {
                result.hasPreviouslyQuit = false
            }
        }

        return result
    }

    async updateChallenge(challengeId: string, userId: string, updateData: any) {
        const challenge = await ChallengeModel.findById(challengeId)
        if (!challenge) throw new Error('Thử thách không tồn tại')
        if (challenge.creator_id.toString() !== userId) throw new Error('Bạn không có quyền sửa thử thách này')

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
        if (safeUpdate.exercises && Array.isArray(safeUpdate.exercises)) {
            const challenge = await ChallengeModel.findById(challengeId)
            if (challenge?.challenge_type === 'fitness') {
                safeUpdate.goal_value = safeUpdate.exercises.length
                safeUpdate.goal_unit = 'bài tập'
            }
        }

        const updated = await ChallengeModel.findByIdAndUpdate(challengeId, safeUpdate, { new: true })
            .populate('creator_id', 'name avatar')
        return updated
    }

    async deleteChallenge(challengeId: string, userId: string) {
        const challenge = await ChallengeModel.findOne({ _id: challengeId, is_deleted: { $ne: true } })
        if (!challenge) throw new Error('Thử thách không tồn tại')
        if (challenge.creator_id.toString() !== userId) throw new Error('Bạn không có quyền xóa thử thách này')

        challenge.status = 'cancelled'
        challenge.is_deleted = true
        challenge.deleted_from_report_moderation = false
        challenge.deleted_at = new Date()
        await challenge.save()

        await this.cleanupChallengePostMarkers(challengeId)

        return challenge
    }

    /** Gỡ thử thách khi kiểm duyệt từ chối báo cáo (không kiểm tra quyền người tạo) */
    async softDeleteChallengeFromModeration(challengeId: string) {
        const challenge = await ChallengeModel.findOne({ _id: challengeId, is_deleted: { $ne: true } })
        if (!challenge) throw new Error('Thử thách không tồn tại')

        challenge.status = 'cancelled'
        challenge.is_deleted = true
        challenge.deleted_from_report_moderation = true
        challenge.deleted_at = new Date()
        await challenge.save()

        await this.cleanupChallengePostMarkers(challengeId)

        return challenge
    }

    async createReportChallengeService({
        challenge_id,
        user_id,
        reason
    }: {
        challenge_id: string
        user_id: string
        reason: string
    }) {
        const existingReport = await ChallengeModel.findOne({
            _id: challenge_id,
            'report_challenge.user_id': user_id
        })
        if (existingReport) {
            throw new ErrorWithStatus({
                message: CHALLENGE_MESSAGE.REPORTED_CHALLENGE,
                status: HTTP_STATUS.BAD_REQUEST
            })
        }

        const updated = await ChallengeModel.findOneAndUpdate(
            { _id: challenge_id, is_deleted: { $ne: true } },
            {
                $push: {
                    report_challenge: {
                        user_id,
                        reason: reason || ''
                    }
                }
            },
            { new: true }
        ).populate('creator_id', 'name avatar')

        if (!updated) {
            throw new ErrorWithStatus({
                message: CHALLENGE_MESSAGE.CHALLENGE_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
            })
        }

        const creatorId =
            (updated.creator_id as any)?._id?.toString?.() || (updated as any).creator_id?.toString?.()
        if (creatorId && creatorId !== user_id) {
            await NotificationModel.create({
                receiver_id: creatorId,
                content: 'Thử thách của bạn đã bị báo cáo vi phạm',
                name_notification: reason || 'Vi phạm',
                link_id: challenge_id,
                type: NotificationTypes.reportChallenge
            })
        }

        return updated
    }

    // ==================== PARTICIPATION ====================

    /**
     * Thêm participant; skipExpiryCheck dùng cho auto-join người tạo (giống sự kiện: creator luôn trong danh sách).
     */
    private async addChallengeParticipantInternal(
        challengeId: string,
        userId: string,
        options: { skipExpiryCheck?: boolean } = {}
    ) {
        const challenge = await ChallengeModel.findById(challengeId)
        if (!challenge) throw new Error('Thử thách không tồn tại')
        if (challenge.status !== 'active') throw new Error('Thử thách đã kết thúc')

        if (!options.skipExpiryCheck && new Date() > new Date(challenge.end_date)) {
            throw new Error('Thử thách đã hết hạn')
        }

        let existing = await ChallengeParticipantModel.findOne({
            challenge_id: new Types.ObjectId(challengeId),
            user_id: new Types.ObjectId(userId)
        })

        if (existing) {
            if (existing.status !== 'quit') {
                return existing
            }
            // User had quit previously, let them rejoin
            existing.status = 'in_progress'
            existing.current_value = 0
            existing.goal_value = challenge.goal_value
            existing.is_completed = false
            existing.completed_at = null
            existing.last_activity_at = null
            existing.active_days = []
            existing.completed_days = []
            existing.streak_count = 0
            existing.joined_at = new Date()

            await existing.save()

            challenge.participants_count += 1
            await challenge.save()

            return existing
        }

        const participant = new ChallengeParticipantModel({
            challenge_id: new Types.ObjectId(challengeId),
            user_id: new Types.ObjectId(userId),
            current_value: 0,
            goal_value: challenge.goal_value,
            is_completed: false,
            completed_at: null,
            last_activity_at: null,
            active_days: [],
            completed_days: [],
            streak_count: 0,
            status: 'in_progress'
        })
        await participant.save()

        challenge.participants_count += 1
        await challenge.save()

        return participant
    }

    /** Hai user là bạn bè (theo dõi lẫn nhau) trong collection follows */
    private async areUsersMutualFriends(userId: string, otherUserId: string): Promise<boolean> {
        if (!userId || !otherUserId) return false
        if (userId === otherUserId) return true
        const [a, b] = await Promise.all([
            FollowModel.findOne({
                user_id: new Types.ObjectId(userId),
                follow_id: new Types.ObjectId(otherUserId)
            })
                .select('_id')
                .lean(),
            FollowModel.findOne({
                user_id: new Types.ObjectId(otherUserId),
                follow_id: new Types.ObjectId(userId)
            })
                .select('_id')
                .lean()
        ])
        return !!(a && b)
    }

    /**
     * "Chỉ mình tôi": không cho người khác tham gia qua link (chỉ người tạo, đã auto-tham gia).
     * "Bạn bè": chỉ mutual friends với người tạo mới được tham gia.
     */
    private async assertUserMayJoinChallenge(
        challenge: { creator_id: Types.ObjectId; visibility?: string },
        userId: string
    ): Promise<void> {
        const creatorId = challenge.creator_id.toString()
        if (userId === creatorId) return

        const visibility = challenge.visibility || 'public'
        if (visibility === 'public') return

        if (visibility === 'private') {
            throw new ErrorWithStatus({
                message:
                    'Thử thách ở chế độ chỉ mình tôi — không mở tham gia qua liên kết công khai.',
                status: HTTP_STATUS.FORBIDDEN
            })
        }

        if (visibility === 'friends') {
            const ok = await this.areUsersMutualFriends(userId, creatorId)
            if (!ok) {
                throw new ErrorWithStatus({
                    message: 'Chỉ bạn bè của người tạo mới có thể tham gia thử thách này.',
                    status: HTTP_STATUS.FORBIDDEN
                })
            }
        }
    }

    private async assertUserCanViewChallenge(challenge: any, userId?: string): Promise<void> {
        const visibility = challenge.visibility || 'public'
        if (visibility === 'public') return

        const creatorId = (() => {
            const c = challenge.creator_id as unknown as { _id?: Types.ObjectId } | Types.ObjectId
            if (c && typeof c === 'object' && '_id' in c && c._id) return c._id.toString()
            return (c as Types.ObjectId).toString()
        })()

        if (userId && userId === creatorId) return

        if (userId) {
            const participation = await ChallengeParticipantModel.findOne({
                challenge_id: challenge._id,
                user_id: new Types.ObjectId(userId),
                status: { $ne: 'quit' }
            })
                .select('_id')
                .lean()
            if (participation) return
        }

        if (visibility === 'private') {
            throw new ErrorWithStatus({
                message: 'Thử thách này ở chế độ chỉ mình tôi, không hiển thị cho người khác.',
                status: HTTP_STATUS.FORBIDDEN
            })
        }

        if (visibility === 'friends') {
            if (!userId) {
                throw new ErrorWithStatus({
                    message: 'Bạn cần đăng nhập để xem thử thách dành cho bạn bè.',
                    status: HTTP_STATUS.FORBIDDEN
                })
            }
            const ok = await this.areUsersMutualFriends(userId, creatorId)
            if (!ok) {
                throw new ErrorWithStatus({
                    message: 'Chỉ bạn bè của người tạo mới có thể xem thử thách này.',
                    status: HTTP_STATUS.FORBIDDEN
                })
            }
        }
    }

    async joinChallenge(challengeId: string, userId: string) {
        const challenge = await ChallengeModel.findOne({
            _id: new Types.ObjectId(challengeId),
            is_deleted: { $ne: true }
        })
        if (!challenge) {
            throw new ErrorWithStatus({
                message: 'Thử thách không tồn tại',
                status: HTTP_STATUS.NOT_FOUND
            })
        }
        if (challenge.status !== 'active') {
            throw new ErrorWithStatus({
                message: 'Thử thách đã kết thúc',
                status: HTTP_STATUS.BAD_REQUEST
            })
        }

        await this.assertUserMayJoinChallenge(challenge, userId)

        const existing = await ChallengeParticipantModel.findOne({
            challenge_id: new Types.ObjectId(challengeId),
            user_id: new Types.ObjectId(userId),
            status: { $ne: 'quit' }
        })
        if (existing) throw new Error('Bạn đã tham gia thử thách này rồi')

        return this.addChallengeParticipantInternal(challengeId, userId, { skipExpiryCheck: false })
    }

    /**
     * Giống sự kiện (creator nằm trong participants_ids): người tạo luôn có bản ghi participant nếu chưa có.
     */
    private async ensureCreatorIsParticipant(challengeId: string): Promise<void> {
        const challenge = await ChallengeModel.findOne({ _id: challengeId, is_deleted: { $ne: true } })
            .select('creator_id status')
            .lean()
        if (!challenge || challenge.status !== 'active') return

        const creatorId = challenge.creator_id.toString()
        const anyRow = await ChallengeParticipantModel.findOne({
            challenge_id: new Types.ObjectId(challengeId),
            user_id: new Types.ObjectId(creatorId)
        })
            .select('_id')
            .lean()

        if (anyRow) return

        try {
            await this.addChallengeParticipantInternal(challengeId, creatorId, { skipExpiryCheck: true })
        } catch (e) {
            console.warn('[challenge] ensureCreatorIsParticipant', challengeId, e)
        }
    }

    /**
     * Đồng bộ participant cho người tạo trước khi đếm (admin list, báo cáo).
     * Khớp với getParticipants / getLeaderboard — tránh lệch 0 trên bảng nhưng có 1 dòng trong tab thành viên.
     */
    async syncCreatorParticipantsForChallenges(challengeIds: Array<Types.ObjectId | string>): Promise<void> {
        if (!challengeIds.length) return
        await Promise.all(
            challengeIds.map((id) => this.ensureCreatorIsParticipant(typeof id === 'string' ? id : id.toString()))
        )
    }

    /** creator_id sau feed có thể là ObjectId hoặc object user đã lookup/populate */
    private feedChallengeCreatorId(c: any): string {
        const cr = c?.creator_id
        if (!cr) return ''
        if (typeof cr === 'object' && cr._id) return cr._id.toString()
        return cr.toString()
    }

    private mergeCreatorIntoParticipantsPreview(c: any, preview: any[]): any[] {
        const cr = c?.creator_id
        if (!cr || typeof cr !== 'object' || !cr._id) return preview
        const idStr = cr._id.toString()
        const exists = preview.some((u: any) => {
            const uid = u?._id ?? u
            return uid && uid.toString() === idStr
        })
        if (exists) return preview
        return [{ _id: cr._id, name: cr.name, avatar: cr.avatar }, ...preview].slice(0, 5)
    }

    async quitChallenge(challengeId: string, userId: string) {
        const challenge = await ChallengeModel.findById(challengeId)
        if (!challenge) throw new Error('Thử thách không tồn tại')
        
        if (challenge.creator_id.toString() === userId) {
            throw new Error('Người tạo không thể rời thử thách')
        }

        const participant = await ChallengeParticipantModel.findOne({
            challenge_id: new Types.ObjectId(challengeId),
            user_id: new Types.ObjectId(userId),
            status: 'in_progress'
        })
        if (!participant) throw new Error('Bạn chưa tham gia thử thách này')

        participant.status = 'quit'
        await participant.save()

        challenge.participants_count -= 1
        await challenge.save()

        return participant
    }

    async getMyCreatedChallenges(userId: string, page: number = 1, limit: number = 20, status?: string) {
        const skip = (page - 1) * limit
        const condition: any = { creator_id: new Types.ObjectId(userId), is_deleted: { $ne: true } }

        const now = new Date()
        if (status === 'ongoing') {
            condition.start_date = { $lte: now }
            condition.end_date = { $gte: now }
        } else if (status === 'ended') {
            condition.end_date = { $lt: now }
        } else if (status === 'upcoming') {
            condition.start_date = { $gt: now }
        }

        const challenges = await ChallengeModel.find(condition)
            .populate('creator_id', 'name avatar')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })

        const total = await ChallengeModel.countDocuments(condition)
        const totalPage = Math.ceil(total / limit)

        return { challenges, totalPage, page, limit, total }
    }

    async getMyChallenges(userId: string, page: number = 1, limit: number = 20, status?: string) {
        const skip = (page - 1) * limit

        let challengeMatchCondition: any = {}
        const now = new Date()
        if (status === 'ongoing') {
            challengeMatchCondition.start_date = { $lte: now }
            challengeMatchCondition.end_date = { $gte: now }
        } else if (status === 'ended') {
            challengeMatchCondition.end_date = { $lt: now }
        } else if (status === 'upcoming') {
            challengeMatchCondition.start_date = { $gt: now }
        }

        let validChallengeIds = null
        if (Object.keys(challengeMatchCondition).length > 0) {
            const matchingChallenges = await ChallengeModel.find(challengeMatchCondition, '_id')
            validChallengeIds = matchingChallenges.map(c => c._id)
        }

        const condition: any = {
            user_id: new Types.ObjectId(userId),
            status: { $ne: 'quit' }
        }
        if (validChallengeIds) {
            condition.challenge_id = { $in: validChallengeIds }
        }

        const participations = await ChallengeParticipantModel.find(condition)
            .populate({
                path: 'challenge_id',
                populate: { path: 'creator_id', select: 'name avatar' }
            })
            .skip(skip)
            .limit(limit)
            .sort({ joined_at: -1 })

        const total = await ChallengeParticipantModel.countDocuments(condition)
        const totalPage = Math.ceil(total / limit)

        return { participations, totalPage, page, limit, total }
    }

    async getChallengeStats(userId: string, type: string) {
        const now = new Date()
        let total = 0, ongoing = 0, upcoming = 0, ended = 0

        if (type === 'created') {
            const condition: any = { creator_id: new Types.ObjectId(userId), is_deleted: { $ne: true } }
            const [t, o, u, e] = await Promise.all([
                ChallengeModel.countDocuments(condition),
                ChallengeModel.countDocuments({ ...condition, start_date: { $lte: now }, end_date: { $gte: now } }),
                ChallengeModel.countDocuments({ ...condition, start_date: { $gt: now } }),
                ChallengeModel.countDocuments({ ...condition, end_date: { $lt: now } })
            ])
            total = t; ongoing = o; upcoming = u; ended = e;
        } else {
            const participations = await ChallengeParticipantModel.find({
                user_id: new Types.ObjectId(userId),
                status: { $ne: 'quit' }
            }).select('challenge_id')
            const challengeIds = participations.map((p: any) => p.challenge_id)
            const condition: any = { _id: { $in: challengeIds }, is_deleted: { $ne: true } }
            const [t, o, u, e] = await Promise.all([
                ChallengeModel.countDocuments(condition),
                ChallengeModel.countDocuments({ ...condition, start_date: { $lte: now }, end_date: { $gte: now } }),
                ChallengeModel.countDocuments({ ...condition, start_date: { $gt: now } }),
                ChallengeModel.countDocuments({ ...condition, end_date: { $lt: now } })
            ])
            total = t; ongoing = o; upcoming = u; ended = e;
        }

        return { total, ongoing, upcoming, ended }
    }

    // ==================== PROGRESS ====================

    async addProgress(challengeId: string, userId: string, data: {
        value: number
        notes?: string
        proof_image?: string
        food_name?: string
        ai_review_valid?: boolean
        ai_review_reason?: string
        distance?: number
        duration_minutes?: number
        avg_speed?: number
        calories?: number
        workout_session_id?: string
        exercises_count?: number
        completed_exercises?: Array<{ exercise_id: string; exercise_name?: string; completed?: boolean }>
        source?: string
        gps_route?: any[]
        max_speed?: number
        avg_pace?: number
        start_time?: string
        end_time?: string
    }) {
        const challenge = await ChallengeModel.findById(challengeId)
        if (!challenge) throw new Error('Thử thách không tồn tại')
        if (challenge.status !== 'active') throw new Error('Thử thách đã kết thúc')

        if (new Date() > new Date(challenge.end_date)) {
            throw new Error('Thử thách đã hết hạn')
        }

        let validationStatus = 'valid'

        // Time-window check for nutrition challenges
        if (challenge.challenge_type === 'nutrition' && challenge.nutrition_sub_type === 'time_window'
            && challenge.time_window_start && challenge.time_window_end) {
            // Get current time in Vietnam timezone (UTC+7)
            const nowVN = new Date(Date.now() + 7 * 60 * 60 * 1000)
            const currentMinutes = nowVN.getUTCHours() * 60 + nowVN.getUTCMinutes()
            const [startH, startM] = challenge.time_window_start.split(':').map(Number)
            const [endH, endM] = challenge.time_window_end.split(':').map(Number)
            const windowStart = startH * 60 + startM
            const windowEnd = endH * 60 + endM
            if (currentMinutes < windowStart || currentMinutes > windowEnd) {
                validationStatus = 'invalid_time'
            }
        }

        const participant = await ChallengeParticipantModel.findOne({
            challenge_id: new Types.ObjectId(challengeId),
            user_id: new Types.ObjectId(userId),
            status: 'in_progress'
        })
        if (!participant) throw new Error('Bạn chưa tham gia thử thách này')

        // Determine source based on challenge_type
        let source = data.source || 'manual'
        if (challenge.challenge_type === 'nutrition') source = 'photo_checkin'
        else if (challenge.challenge_type === 'fitness') source = 'workout_session'
        else if (challenge.challenge_type === 'outdoor_activity') {
            // Giữ source từ client: 'gps_tracking' (GPS thực) hoặc 'manual_input' (nhập tay)
            source = data.source === 'manual_input' ? 'manual_input' : 'gps_tracking'
        }

        // Chỉ tạo ActivityTracking khi có GPS thực (không tạo khi nhập tay)
        let activityId: Types.ObjectId | null = null
        if (source === 'gps_tracking') {
            const distanceMeters = (data.distance || 0) * 1000
            const durationSeconds = (data.duration_minutes || 0) * 60
            const activity = new ActivityTrackingModel({
                challengeId: new Types.ObjectId(challengeId),
                userId: new Types.ObjectId(userId),
                activityType: challenge.category || 'Chạy bộ',
                status: 'completed',
                startTime: data.start_time ? new Date(data.start_time) : new Date(Date.now() - durationSeconds * 1000),
                endTime: data.end_time ? new Date(data.end_time) : new Date(),
                totalDuration: durationSeconds,
                totalDistance: distanceMeters,
                avgSpeed: data.avg_speed ? data.avg_speed / 3.6 : 0,
                maxSpeed: data.max_speed ? data.max_speed / 3.6 : 0,
                avgPace: data.avg_pace || 0,
                calories: data.calories || 0,
                gpsRoute: data.gps_route || [],
                pauseIntervals: []
            })
            await activity.save()
            activityId = activity._id as Types.ObjectId
        }

        // Create progress entry
        const progress = new ChallengeProgressModel({
            challenge_id: new Types.ObjectId(challengeId),
            user_id: new Types.ObjectId(userId),
            date: new Date(),
            challenge_type: challenge.challenge_type,
            value: data.value,
            unit: challenge.goal_unit,
            notes: data.notes || '',
            proof_image: data.proof_image || '',
            food_name: data.food_name || '',
            ai_review_valid: data.ai_review_valid !== undefined ? data.ai_review_valid : null,
            ai_review_reason: data.ai_review_reason || '',
            distance: data.distance || null,
            duration_minutes: data.duration_minutes || null,
            avg_speed: data.avg_speed || null,
            calories: data.calories || null,
            workout_session_id: data.workout_session_id ? new Types.ObjectId(data.workout_session_id) : null,
            exercises_count: data.exercises_count || null,
            completed_exercises: Array.isArray(data.completed_exercises)
                ? data.completed_exercises.map((ex: any) => ({
                    exercise_id: new Types.ObjectId(ex.exercise_id),
                    exercise_name: ex.exercise_name || '',
                    completed: ex.completed !== false
                }))
                : [],
            source,
            activity_id: activityId,
            validation_status: validationStatus
        })
        await progress.save()

        // Update participant progress
        const today = this.getTodayString()
        participant.last_activity_at = new Date()

        if (validationStatus === 'valid') {
            // Track active days
            if (!participant.active_days.includes(today)) {
                participant.active_days.push(today)
            }

            // Check if today's goal is met — dùng VN offset UTC+7 để tránh lệch ngày khi server UTC
            const vnOffset = 7 * 60 * 60 * 1000
            const nowVNMs = Date.now() + vnOffset
            const startOfDayVN = new Date(nowVNMs - (nowVNMs % (24 * 60 * 60 * 1000)))
            const endOfDayVN = new Date(startOfDayVN.getTime() + 24 * 60 * 60 * 1000 - 1)
            // Chuyển lại UTC để query MongoDB
            const startOfDayUTC = new Date(startOfDayVN.getTime() - vnOffset)
            const endOfDayUTC = new Date(endOfDayVN.getTime() - vnOffset)

            const todaysProgressList = await ChallengeProgressModel.find({
                challenge_id: new Types.ObjectId(challengeId),
                user_id: new Types.ObjectId(userId),
                date: { $gte: startOfDayUTC, $lte: endOfDayUTC },
                is_deleted: { $ne: true },
                validation_status: { $ne: 'invalid_time' },
                ai_review_valid: { $ne: false }
            });

            // Fitness: count distinct completed exercises; Others: sum value
            let todaySum: number
            if (challenge.challenge_type === 'fitness') {
                const completedExerciseIds = new Set<string>()
                todaysProgressList.forEach(p => {
                    (p.completed_exercises || []).forEach(ce => {
                        if (ce.completed) completedExerciseIds.add(ce.exercise_id.toString())
                    })
                })
                todaySum = completedExerciseIds.size
            } else {
                todaySum = todaysProgressList.reduce((sum, p) => sum + p.value, 0);
            }

            if (!participant.completed_days) participant.completed_days = []
            if (todaySum >= challenge.goal_value && !participant.completed_days.includes(today)) {
                participant.completed_days.push(today)
                // Current value represents the number of successful days
                participant.current_value = participant.completed_days.length
            }

            // Recalculate streak based on completed_days (days that met the daily goal)
            participant.streak_count = this.calculateStreak(participant.completed_days || [])

            // Check completion based on total days requirement
            const safeStartDate = new Date(challenge.start_date)
            const safeEndDate = new Date(challenge.end_date)
            safeStartDate.setHours(0, 0, 0, 0)
            safeEndDate.setHours(0, 0, 0, 0)
            const totalRequiredDays = Math.max(1, Math.ceil((safeEndDate.getTime() - safeStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1)

            if (participant.completed_days.length >= totalRequiredDays && !participant.is_completed) {
                participant.is_completed = true
                participant.completed_at = new Date()
                participant.status = 'completed'

                // Send completion notification
                try {
                    await new NotificationModel({
                        sender_id: null,
                        receiver_id: new Types.ObjectId(userId),
                        content: `Chúc mừng! Bạn đã hoàn thành thử thách "${challenge.title}" ${challenge.badge_emoji}`,
                        name_notification: 'Hoàn thành thử thách!',
                        link_id: challenge._id.toString(),
                        type: NotificationTypes.challengeCompleted,
                        is_read: false
                    }).save()
                } catch {
                    // Notification errors should not break the flow
                }
            }
        }

        await participant.save()

        return { progress, participant }
    }

    async getProgress(challengeId: string, userId?: string, page: number = 1, limit: number = 20) {
        const condition: any = { challenge_id: new Types.ObjectId(challengeId), is_deleted: { $ne: true } }
        if (userId) condition.user_id = new Types.ObjectId(userId)

        const skip = (page - 1) * limit

        const progressList = await ChallengeProgressModel.find(condition)
            .populate('user_id', 'name avatar')
            .populate('workout_session_id')
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit)

        const total = await ChallengeProgressModel.countDocuments(condition)

        return { progress: progressList, total, page, limit }
    }

    async getChallengeActivity(challengeId: string, activityId: string) {
        const activity = await ActivityTrackingModel.findOne({
            _id: new Types.ObjectId(activityId),
            challengeId: new Types.ObjectId(challengeId)
        })
        if (!activity) throw new ErrorWithStatus({ message: 'Hoạt động không tồn tại', status: HTTP_STATUS.NOT_FOUND })
        return activity
    }

    async getChallengeProgressEntry(challengeId: string, progressId: string) {
        const entry = await ChallengeProgressModel.findOne({
            _id: new Types.ObjectId(progressId),
            challenge_id: new Types.ObjectId(challengeId),
            is_deleted: { $ne: true }
        })
            .populate('workout_session_id')
        if (!entry) throw new ErrorWithStatus({ message: 'Hoạt động không tồn tại', status: HTTP_STATUS.NOT_FOUND })
        return entry
    }

    // ==================== LEADERBOARD ====================

    async getLeaderboard(challengeId: string, page: number = 1, limit: number = 50) {
        const skip = (page - 1) * limit

        const challenge = await ChallengeModel.findById(challengeId)
        if (!challenge) throw new ErrorWithStatus({ message: 'Thử thách không tồn tại', status: HTTP_STATUS.NOT_FOUND })

        await this.ensureCreatorIsParticipant(challengeId)

        // Total required days for this challenge
        const safeStart = new Date(challenge.start_date); safeStart.setHours(0, 0, 0, 0)
        const safeEnd = new Date(challenge.end_date); safeEnd.setHours(0, 0, 0, 0)
        const totalRequiredDays = Math.max(1, Math.ceil((safeEnd.getTime() - safeStart.getTime()) / (1000 * 60 * 60 * 24)) + 1)

        const participants = await ChallengeParticipantModel.find({
            challenge_id: new Types.ObjectId(challengeId),
            status: { $ne: 'quit' }
        })
            .populate('user_id', 'name avatar')
            .sort({ current_value: -1, joined_at: 1 })
            .skip(skip)
            .limit(limit)

        const total = await ChallengeParticipantModel.countDocuments({
            challenge_id: new Types.ObjectId(challengeId),
            status: { $ne: 'quit' }
        })

        return {
            leaderboard: participants.map((p, index) => {
                const completedDays = (p as any).completed_days?.length || p.current_value
                return {
                    rank: skip + index + 1,
                    user: p.user_id,
                    current_value: completedDays,
                    goal_value: p.goal_value,
                    total_required_days: totalRequiredDays,
                    progress_percent: Math.min(Math.round((completedDays / totalRequiredDays) * 100), 100),
                    is_completed: p.is_completed,
                    streak_count: p.streak_count,
                    joined_at: p.joined_at
                }
            }),
            total,
            page,
            limit
        }
    }


    // ==================== PARTICIPANTS ====================

    async getParticipants(challengeId: string) {
        const challenge = await ChallengeModel.findById(challengeId)
        if (!challenge) throw new Error('Thử thách không tồn tại')

        await this.ensureCreatorIsParticipant(challengeId)

        const participants = await ChallengeParticipantModel.find({
            challenge_id: new Types.ObjectId(challengeId),
            status: { $ne: 'quit' }
        })
            .populate('user_id', 'name avatar email')
            .sort({ current_value: -1, joined_at: 1 })

        // Total required days for this challenge
        const safeStart = new Date(challenge.start_date); safeStart.setHours(0, 0, 0, 0)
        const safeEnd = new Date(challenge.end_date); safeEnd.setHours(0, 0, 0, 0)
        const totalRequiredDays = Math.max(1, Math.ceil((safeEnd.getTime() - safeStart.getTime()) / (1000 * 60 * 60 * 24)) + 1)

        // Bulk-fetch today's progress — dùng VN offset UTC+7
        const _vnOffset = 7 * 60 * 60 * 1000
        const _nowVNMs = Date.now() + _vnOffset
        const _startVN = new Date(_nowVNMs - (_nowVNMs % (24 * 60 * 60 * 1000)))
        const startOfDay = new Date(_startVN.getTime() - _vnOffset)
        const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1)
        const userIds = participants.map(p => p.user_id instanceof Types.ObjectId ? p.user_id : (p.user_id as any)?._id)

        let todayMap = new Map<string, number>()

        if (challenge.challenge_type === 'fitness') {
            // Fitness: count distinct completed exercises per user
            const fitAgg = await ChallengeProgressModel.aggregate([
                {
                    $match: {
                        challenge_id: new Types.ObjectId(challengeId),
                        user_id: { $in: userIds.map(id => new Types.ObjectId(id.toString())) },
                        date: { $gte: startOfDay, $lte: endOfDay },
                        is_deleted: { $ne: true },
                        validation_status: { $ne: 'invalid_time' },
                        ai_review_valid: { $ne: false }
                    }
                },
                { $unwind: { path: '$completed_exercises', preserveNullAndEmptyArrays: false } },
                { $match: { 'completed_exercises.completed': true } },
                {
                    $group: {
                        _id: '$user_id',
                        exercise_ids: { $addToSet: '$completed_exercises.exercise_id' }
                    }
                },
                {
                    $project: {
                        _id: 1,
                        today_sum: { $size: '$exercise_ids' }
                    }
                }
            ])
            fitAgg.forEach(row => todayMap.set(row._id.toString(), row.today_sum))
        } else {
            const todayAgg = await ChallengeProgressModel.aggregate([
                {
                    $match: {
                        challenge_id: new Types.ObjectId(challengeId),
                        user_id: { $in: userIds.map(id => new Types.ObjectId(id.toString())) },
                        date: { $gte: startOfDay, $lte: endOfDay },
                        is_deleted: { $ne: true },
                        validation_status: { $ne: 'invalid_time' },
                        ai_review_valid: { $ne: false }
                    }
                },
                {
                    $group: {
                        _id: '$user_id',
                        today_sum: { $sum: '$value' }
                    }
                }
            ])
            todayAgg.forEach(row => todayMap.set(row._id.toString(), row.today_sum))
        }

        return {
            participants: participants.map((p, index) => {
                const userId = p.user_id instanceof Types.ObjectId
                    ? p.user_id.toString()
                    : (p.user_id as any)?._id?.toString() || ''
                const completedDays = (p as any).completed_days?.length || p.current_value
                return {
                    rank: index + 1,
                    user: p.user_id,
                    current_value: completedDays,
                    goal_value: p.goal_value,
                    total_required_days: totalRequiredDays,
                    today_value: todayMap.get(userId) || 0,
                    progress_percent: Math.min(Math.round((completedDays / totalRequiredDays) * 100), 100),
                    is_completed: p.is_completed,
                    streak_count: p.streak_count,
                    active_days: p.active_days,
                    joined_at: p.joined_at,
                    last_activity_at: p.last_activity_at,
                    status: p.status
                }
            }),
            total: participants.length
        }
    }

    async getUserProgress(challengeId: string, userId: string) {
        const challenge = await ChallengeModel.findById(challengeId)
        if (!challenge) throw new Error('Thử thách không tồn tại')

        // Get participant info
        const participant = await ChallengeParticipantModel.findOne({
            challenge_id: new Types.ObjectId(challengeId),
            user_id: new Types.ObjectId(userId),
            status: { $ne: 'quit' }
        }).populate('user_id', 'name avatar')

        if (!participant) throw new Error('Người dùng chưa tham gia thử thách này')

        // Get all progress entries
        const progressEntries = await ChallengeProgressModel.find({
            challenge_id: new Types.ObjectId(challengeId),
            user_id: new Types.ObjectId(userId),
            is_deleted: { $ne: true }
        }).sort({ date: -1 })

        // Calculate totalRequiredDays (same logic as getLeaderboard & getParticipants)
        const safeStart = new Date(challenge.start_date); safeStart.setHours(0, 0, 0, 0)
        const safeEnd = new Date(challenge.end_date); safeEnd.setHours(0, 0, 0, 0)
        const totalRequiredDays = Math.max(1, Math.ceil((safeEnd.getTime() - safeStart.getTime()) / (1000 * 60 * 60 * 24)) + 1)

        // completedDays = number of days where daily goal was met
        const completedDays = (participant as any).completed_days?.length || participant.current_value
        const progressPercent = Math.min(Math.round((completedDays / totalRequiredDays) * 100), 100)

        return {
            participant: {
                user: participant.user_id,
                current_value: completedDays,
                daily_goal: challenge.goal_value,         // mục tiêu hằng ngày (vd: 5 km/ngày, 3 bữa/ngày)
                total_required_days: totalRequiredDays,   // tổng số ngày cần hoàn thành
                goal_value: totalRequiredDays,            // giữ lại để tương thích với code cũ
                progress_percent: progressPercent,
                is_completed: participant.is_completed,
                streak_count: participant.streak_count,
                active_days: participant.active_days,
                completed_days: (participant as any).completed_days || [],
                joined_at: participant.joined_at,
                last_activity_at: participant.last_activity_at
            },
            progress: progressEntries
        }
    }

    // ==================== DELETE PROGRESS ====================

    async deleteProgress(challengeId: string, progressId: string, userId: string) {
        const progress = await ChallengeProgressModel.findOne({
            _id: new Types.ObjectId(progressId),
            challenge_id: new Types.ObjectId(challengeId),
            user_id: new Types.ObjectId(userId),
            is_deleted: { $ne: true }
        })
        if (!progress) throw new Error('Hoạt động không tồn tại')

        progress.is_deleted = true
        await progress.save()

        // Also soft-delete linked ActivityTracking (if outdoor_activity)
        if (progress.activity_id) {
            await ActivityTrackingModel.updateOne(
                { _id: progress.activity_id },
                { is_deleted: true }
            )
        }

        // Recalculate participant stats
        const challenge = await ChallengeModel.findById(challengeId)
        if (!challenge) return progress

        const participant = await ChallengeParticipantModel.findOne({
            challenge_id: new Types.ObjectId(challengeId),
            user_id: new Types.ObjectId(userId),
            status: 'in_progress'
        })
        if (!participant) return progress

        // Get all non-deleted progress entries
        const allEntries = await ChallengeProgressModel.find({
            challenge_id: new Types.ObjectId(challengeId),
            user_id: new Types.ObjectId(userId),
            is_deleted: { $ne: true },
            validation_status: { $ne: 'invalid_time' },
            ai_review_valid: { $ne: false }
        })

        // Recalculate active_days and completed_days
        const dayMap = new Map<string, number>()
        const dayExerciseMap = new Map<string, Set<string>>()
        allEntries.forEach(e => {
            const vnOffset = 7 * 60 * 60 * 1000
            const vnDate = new Date(new Date(e.date).getTime() + vnOffset)
            const dayStr = vnDate.toISOString().split('T')[0]

            if (challenge && challenge.challenge_type === 'fitness') {
                // Fitness: count distinct completed exercises
                if (!dayExerciseMap.has(dayStr)) dayExerciseMap.set(dayStr, new Set())
                const exSet = dayExerciseMap.get(dayStr)!
                ;(e.completed_exercises || []).forEach(ce => {
                    if (ce.completed) exSet.add(ce.exercise_id.toString())
                })
                dayMap.set(dayStr, exSet.size)
            } else {
                dayMap.set(dayStr, (dayMap.get(dayStr) || 0) + e.value)
            }
        })

        const activeDays = Array.from(dayMap.keys()).sort()
        const completedDays = activeDays.filter(d => (dayMap.get(d) || 0) >= challenge.goal_value)

        participant.active_days = activeDays
        participant.completed_days = completedDays
        participant.current_value = completedDays.length
        participant.streak_count = this.calculateStreak(completedDays)
        participant.last_activity_at = allEntries.length > 0
            ? new Date(Math.max(...allEntries.map(e => new Date(e.date).getTime())))
            : null
        await participant.save()

        return progress
    }

    // ==================== FEED (scope-based) ====================

    async getChallengeFeed({
        scope = 'public',
        userId,
        page = 1,
        limit = 9,
        challenge_type,
        search,
        category,
        sortBy,
        status,
        dateFrom,
        dateTo,
        visibility
    }: {
        scope?: 'public' | 'friends' | 'mine'
        userId?: string
        page?: number
        limit?: number
        challenge_type?: string
        search?: string
        category?: string
        sortBy?: string
        status?: string
        dateFrom?: string
        dateTo?: string
        visibility?: string
    }) {
        const skip = (page - 1) * limit
        let challengeIds: Types.ObjectId[] | null = null
        let participations: any[] = []

        // ────────── scope: mine ──────────
        if (scope === 'mine') {
            if (!userId) return { challenges: [], totalPage: 0, page, limit, total: 0 }

            const myParticipations = await ChallengeParticipantModel.find({
                user_id: new Types.ObjectId(userId),
                status: { $ne: 'quit' }
            }).select('challenge_id current_value goal_value is_completed streak_count')

            challengeIds = myParticipations.map(p => p.challenge_id as Types.ObjectId)
            participations = myParticipations
        }

        // ────────── scope: friends ──────────
        if (scope === 'friends') {
            if (!userId) return { challenges: [], totalPage: 0, page, limit, total: 0 }

            // Find mutual friends (both sides follow each other)
            const iFollow = await FollowModel.find({ user_id: new Types.ObjectId(userId) }).select('follow_id')
            const iFollowIds = iFollow.map(f => f.follow_id.toString())

            const followMeBack = await FollowModel.find({
                user_id: { $in: iFollowIds.map(id => new Types.ObjectId(id)) },
                follow_id: new Types.ObjectId(userId)
            }).select('user_id')

            const mutualFriendIds = followMeBack.map(f => f.user_id)

            if (mutualFriendIds.length === 0) {
                return { challenges: [], totalPage: 0, page, limit, total: 0 }
            }

            // Challenges that friends are participating in
            const friendParticipations = await ChallengeParticipantModel.find({
                user_id: { $in: mutualFriendIds },
                status: { $ne: 'quit' }
            }).select('challenge_id user_id')

            challengeIds = [...new Set(friendParticipations.map(p => p.challenge_id.toString()))]
                .map(id => new Types.ObjectId(id))
        }

        // ────────── Build query ──────────
        const condition: any = { is_deleted: { $ne: true } }

        if (status === 'ongoing') {
            condition.start_date = { $lte: new Date() }
            condition.end_date = { $gte: new Date() }
            condition.status = 'active'
        } else if (status === 'ended') {
            condition.end_date = { $lt: new Date() }
        } else if (status === 'upcoming') {
            condition.start_date = { $gt: new Date() }
            condition.status = 'active'
        } else {
            condition.status = 'active'
        }

        if (dateFrom) condition.end_date = { ...condition.end_date, $gte: new Date(dateFrom) }
        if (dateTo) {
            const toDate = new Date(dateTo)
            toDate.setHours(23, 59, 59, 999)
            condition.start_date = { ...condition.start_date, $lte: toDate }
        }

        if (category && category !== 'all') condition.category = category

        if (scope === 'public') {
            // Công khai + bạn bè đều có is_public: true; riêng tư thì is_public: false.
            // User đã đăng nhập vẫn cần thấy thử thách "chỉ mình tôi" do chính họ tạo (lọc FE theo visibility).
            if (userId) {
                condition.$or = [
                    { is_public: true },
                    { visibility: 'private', creator_id: new Types.ObjectId(userId as string) }
                ]
            } else {
                condition.is_public = true
            }
        } else if (challengeIds !== null) {
            condition._id = { $in: challengeIds }
        }

        if (challenge_type && challenge_type !== 'all') condition.challenge_type = challenge_type
        if (visibility && visibility !== 'all') condition.visibility = visibility
        const searchCond = this.buildChallengeTitleDescriptionSearchCondition(search)
        if (searchCond) {
            condition.$and = [...(condition.$and || []), searchCond]
        }

        const total = await ChallengeModel.countDocuments(condition)
        const totalPage = Math.ceil(total / limit) || 0

        // For popular/default: sort by status priority (ongoing → upcoming → ended) via aggregation
        if (!sortBy || sortBy === 'popular') {
            const now = new Date()

            const rawChallenges = await ChallengeModel.aggregate([
                { $match: condition },
                {
                    $addFields: {
                        statusOrder: {
                            $switch: {
                                branches: [
                                    {
                                        case: { $and: [{ $lte: ['$start_date', now] }, { $gte: ['$end_date', now] }] },
                                        then: 0 // ongoing
                                    },
                                    {
                                        case: { $gt: ['$start_date', now] },
                                        then: 1 // upcoming
                                    }
                                ],
                                default: 2 // ended
                            }
                        }
                    }
                },
                // Cùng logic “Phổ biến” như sự kiện: nhóm trạng thái (đang → sắp → hết),
                // trong nhóm ưu tiên participants_count giảm dần rồi start_date tăng dần.
                { $sort: { statusOrder: 1, participants_count: -1, start_date: 1, _id: 1 } },
                { $skip: skip },
                { $limit: limit },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'creator_id',
                        foreignField: '_id',
                        as: '_creatorArr',
                        pipeline: [{ $project: { name: 1, avatar: 1, email: 1 } }]
                    }
                },
                { $addFields: { creator_id: { $arrayElemAt: ['$_creatorArr', 0] } } },
                { $project: { _creatorArr: 0, statusOrder: 0 } }
            ])

            await Promise.all(
                rawChallenges.map((c: any) => this.ensureCreatorIsParticipant(c._id.toString()))
            )

            let resultChallenges: any[] = rawChallenges

            // Inject isJoined + myProgress
            if (userId) {
                const userParticipations = participations.length > 0
                    ? participations
                    : await ChallengeParticipantModel.find({
                        user_id: new Types.ObjectId(userId),
                        challenge_id: { $in: rawChallenges.map((c: any) => c._id) },
                        status: { $ne: 'quit' }
                    })

                const joinedMap = new Map<string, any>()
                userParticipations.forEach((p: any) => {
                    joinedMap.set(p.challenge_id.toString(), p.toObject ? p.toObject() : p)
                })

                const uid = String(userId)
                resultChallenges = resultChallenges.map((c: any) => ({
                    ...c,
                    isJoined: joinedMap.has(c._id.toString()) || this.feedChallengeCreatorId(c) === uid,
                    myProgress: joinedMap.get(c._id.toString()) || null
                }))
            }

            // Inject participants_preview (top 5 users)
            const allChallengeIds = resultChallenges.map((c: any) => c._id)
            if (allChallengeIds.length > 0) {
                const allParticipants = await ChallengeParticipantModel.find({
                    challenge_id: { $in: allChallengeIds.map((id: any) => new Types.ObjectId(id.toString())) },
                    status: { $ne: 'quit' }
                })
                    .populate('user_id', 'name avatar')
                    .sort({ joined_at: 1 })
                    .lean()

                const previewMap = new Map<string, any[]>()
                allParticipants.forEach((p: any) => {
                    const cid = p.challenge_id.toString()
                    if (!previewMap.has(cid)) previewMap.set(cid, [])
                    const arr = previewMap.get(cid)!
                    if (arr.length < 5) arr.push(p.user_id)
                })

                const participantCountMap = new Map<string, number>()
                allParticipants.forEach((p: any) => {
                    const cid = p.challenge_id.toString()
                    participantCountMap.set(cid, (participantCountMap.get(cid) || 0) + 1)
                })

                resultChallenges = resultChallenges.map((c: any) => {
                    const base = previewMap.get(c._id.toString()) || []
                    return {
                        ...c,
                        participants_count: participantCountMap.get(c._id.toString()) ?? c.participants_count ?? 0,
                        participants_preview: this.mergeCreatorIntoParticipantsPreview(c, base)
                    }
                })
            }

            return { challenges: resultChallenges, totalPage, page, limit, total }
        }

        // Non-popular sorts: use find().sort() as before
        let sortOption: any = { createdAt: -1 }
        switch (sortBy) {
            case 'newest': sortOption = { createdAt: -1 }; break;
            case 'oldest': sortOption = { createdAt: 1 }; break;
            case 'soonest': sortOption = { start_date: 1 }; break;
            case 'ending_soon': sortOption = { end_date: 1 }; break;
            default: sortOption = { createdAt: -1 }; break;
        }

        const challenges = await ChallengeModel.find(condition)
            .populate('creator_id', 'name avatar email')
            .skip(skip)
            .limit(limit)
            .sort(sortOption)

        let resultChallenges = challenges.map(c => c.toObject())

        await Promise.all(
            resultChallenges.map((c: any) => this.ensureCreatorIsParticipant(c._id.toString()))
        )

        // Inject isJoined + myProgress for logged-in user
        if (userId) {
            const userParticipations = participations.length > 0
                ? participations
                : await ChallengeParticipantModel.find({
                    user_id: new Types.ObjectId(userId),
                    challenge_id: { $in: challenges.map(c => c._id) },
                    status: { $ne: 'quit' }
                })

            const joinedMap = new Map<string, any>()
            userParticipations.forEach((p: any) => {
                joinedMap.set(p.challenge_id.toString(), p.toObject ? p.toObject() : p)
            })

            const uid = String(userId)
            resultChallenges = resultChallenges.map((c: any) => ({
                ...c,
                isJoined: joinedMap.has(c._id.toString()) || this.feedChallengeCreatorId(c) === uid,
                myProgress: joinedMap.get(c._id.toString()) || null
            }))
        }

        // Inject participants_preview (top 5 users) for each challenge
        const allChallengeIds = resultChallenges.map((c: any) => c._id)
        if (allChallengeIds.length > 0) {
            const allParticipants = await ChallengeParticipantModel.find({
                challenge_id: { $in: allChallengeIds.map((id: any) => new Types.ObjectId(id.toString())) },
                status: { $ne: 'quit' }
            })
                .populate('user_id', 'name avatar')
                .sort({ joined_at: 1 })
                .lean()

            const previewMap = new Map<string, any[]>()
            allParticipants.forEach((p: any) => {
                const cid = p.challenge_id.toString()
                if (!previewMap.has(cid)) previewMap.set(cid, [])
                const arr = previewMap.get(cid)!
                if (arr.length < 5) arr.push(p.user_id)
            })

            const participantCountMap = new Map<string, number>()
            allParticipants.forEach((p: any) => {
                const cid = p.challenge_id.toString()
                participantCountMap.set(cid, (participantCountMap.get(cid) || 0) + 1)
            })

            resultChallenges = resultChallenges.map((c: any) => {
                const base = previewMap.get(c._id.toString()) || []
                return {
                    ...c,
                    participants_count: participantCountMap.get(c._id.toString()) ?? c.participants_count ?? 0,
                    participants_preview: this.mergeCreatorIntoParticipantsPreview(c, base)
                }
            })
        }

        return { challenges: resultChallenges, totalPage, page, limit, total }
    }

    // ==================== INVITE FRIEND ====================

    async inviteFriendToChallenge(challengeId: string, inviterId: string, friendId: string) {
        const challenge = await ChallengeModel.findOne({ _id: challengeId, is_deleted: { $ne: true } })
        if (!challenge) throw new Error('Thử thách không tồn tại')

        const notification = new NotificationModel({
            sender_id: new Types.ObjectId(inviterId),
            receiver_id: new Types.ObjectId(friendId),
            content: `đã mời bạn tham gia thử thách "${challenge.title}"`,
            name_notification: `Lời mời tham gia: ${challenge.title}`,
            link_id: challengeId,
            type: NotificationTypes.challengeInvite,
            is_read: false
        })

        await notification.save()
        return { notificationId: notification._id, challengeId, friendId }
    }

    // ==================== HELPERS ====================

    private getTodayString(): string {
        const now = new Date()
        const vnOffset = 7 * 60 * 60 * 1000
        const vnNow = new Date(now.getTime() + vnOffset)
        return vnNow.toISOString().split('T')[0]
    }

    private calculateStreak(activeDays: string[]): number {
        if (activeDays.length === 0) return 0

        const sorted = [...activeDays].sort().reverse()
        let streak = 1
        const today = this.getTodayString()

        // Start from today or the most recent day
        if (sorted[0] !== today) {
            // Check if yesterday was the last active day (use VN timezone)
            const now = new Date()
            const vnOffset = 7 * 60 * 60 * 1000
            const vnYesterday = new Date(now.getTime() + vnOffset - 24 * 60 * 60 * 1000)
            const yesterdayStr = vnYesterday.toISOString().split('T')[0]
            if (sorted[0] !== yesterdayStr) return 0
        }

        for (let i = 1; i < sorted.length; i++) {
            const current = new Date(sorted[i - 1])
            const prev = new Date(sorted[i])
            const diffDays = Math.round((current.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000))
            if (diffDays === 1) {
                streak++
            } else {
                break
            }
        }

        return streak
    }
}

const challengeService = new ChallengeService()
export default challengeService
