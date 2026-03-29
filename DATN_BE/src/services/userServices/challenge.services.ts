import { Types } from 'mongoose'
import ChallengeModel from '~/models/schemas/challenge.schema'
import ChallengeParticipantModel from '~/models/schemas/challengeParticipant.schema'
import ChallengeProgressModel from '~/models/schemas/challengeProgress.schema'
import ActivityTrackingModel from '~/models/schemas/activityTracking.schema'
import NotificationModel from '~/models/schemas/notification.schema'
import FollowModel from '~/models/schemas/follow.schema'
import { NotificationTypes } from '~/constants/enums'

class ChallengeService {
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
        visibility
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
    }) {
        if (!title || !title.trim()) throw new Error('Tên thử thách không được để trống')
        if (!challenge_type) throw new Error('Vui lòng chọn loại thử thách')
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
            linked_meal_plan_id: linked_meal_plan_id ? new Types.ObjectId(linked_meal_plan_id) : null,
            category: category || '',
            kcal_per_unit: kcal_per_unit || 0
        })

        await challenge.save()

        // Auto-join the creator
        await this.joinChallenge(challenge._id.toString(), creator_id)

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

        if (search) condition.$text = { $search: search }
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

            resultChallenges = resultChallenges.map((c: any) => ({
                ...c,
                isJoined: joinedMap.has(c._id.toString()),
                myProgress: joinedMap.get(c._id.toString()) || null
            }))
        }

        return { challenges: resultChallenges, totalPage, page, limit, total }
    }

    async getChallenge(challengeId: string, userId?: string) {
        const challenge = await ChallengeModel.findOne({ _id: challengeId, is_deleted: { $ne: true } })
            .populate('creator_id', 'name avatar email')
        if (!challenge) throw new Error('Thử thách không tồn tại')

        const result: any = challenge.toObject()

        // Calculate time remaining
        const now = new Date()
        const endDate = new Date(challenge.end_date)
        const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)))
        result.days_remaining = daysRemaining
        result.is_expired = now > endDate

        if (userId) {
            const participation = await ChallengeParticipantModel.findOne({
                challenge_id: new Types.ObjectId(challengeId),
                user_id: new Types.ObjectId(userId),
                status: { $ne: 'quit' }
            })
            result.isJoined = !!participation
            result.participation = participation ? participation.toObject() : null
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
            'start_date', 'end_date', 'visibility'
        ]
        const safeUpdate: any = {}
        for (const key of allowedFields) {
            if (updateData[key] !== undefined) safeUpdate[key] = updateData[key]
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
        await challenge.save()
        return challenge
    }

    // ==================== PARTICIPATION ====================

    async joinChallenge(challengeId: string, userId: string) {
        const challenge = await ChallengeModel.findById(challengeId)
        if (!challenge) throw new Error('Thử thách không tồn tại')
        if (challenge.status !== 'active') throw new Error('Thử thách đã kết thúc')

        if (new Date() > new Date(challenge.end_date)) {
            throw new Error('Thử thách đã hết hạn')
        }

        const existing = await ChallengeParticipantModel.findOne({
            challenge_id: new Types.ObjectId(challengeId),
            user_id: new Types.ObjectId(userId),
            status: { $ne: 'quit' }
        })
        if (existing) throw new Error('Bạn đã tham gia thử thách này rồi')

        const participant = new ChallengeParticipantModel({
            challenge_id: new Types.ObjectId(challengeId),
            user_id: new Types.ObjectId(userId),
            current_value: 0,
            goal_value: challenge.goal_value,
            is_completed: false,
            completed_at: null,
            last_activity_at: null,
            active_days: [],
            streak_count: 0,
            status: 'in_progress'
        })
        await participant.save()

        challenge.participants_count += 1
        await challenge.save()

        return participant
    }

    async quitChallenge(challengeId: string, userId: string) {
        const participant = await ChallengeParticipantModel.findOne({
            challenge_id: new Types.ObjectId(challengeId),
            user_id: new Types.ObjectId(userId),
            status: 'in_progress'
        })
        if (!participant) throw new Error('Bạn chưa tham gia thử thách này')

        participant.status = 'quit'
        await participant.save()

        await ChallengeModel.findByIdAndUpdate(challengeId, { $inc: { participants_count: -1 } })

        return participant
    }

    async getMyCreatedChallenges(userId: string, page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit
        const condition = { creator_id: new Types.ObjectId(userId), is_deleted: { $ne: true } }

        const challenges = await ChallengeModel.find(condition)
            .populate('creator_id', 'name avatar')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })

        const total = await ChallengeModel.countDocuments(condition)
        const totalPage = Math.ceil(total / limit)

        return { challenges, totalPage, page, limit, total }
    }

    async getMyChallenges(userId: string, page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit

        const participations = await ChallengeParticipantModel.find({
            user_id: new Types.ObjectId(userId),
            status: { $ne: 'quit' }
        })
            .populate({
                path: 'challenge_id',
                populate: { path: 'creator_id', select: 'name avatar' }
            })
            .skip(skip)
            .limit(limit)
            .sort({ joined_at: -1 })

        const total = await ChallengeParticipantModel.countDocuments({
            user_id: new Types.ObjectId(userId),
            status: { $ne: 'quit' }
        })
        const totalPage = Math.ceil(total / limit)

        return { participations, totalPage, page, limit, total }
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

        const participant = await ChallengeParticipantModel.findOne({
            challenge_id: new Types.ObjectId(challengeId),
            user_id: new Types.ObjectId(userId),
            status: 'in_progress'
        })
        if (!participant) throw new Error('Bạn chưa tham gia thử thách này')

        // Determine source based on challenge_type
        let source = data.source || 'manual'
        if (challenge.challenge_type === 'nutrition') source = 'photo_checkin'
        else if (challenge.challenge_type === 'outdoor_activity') source = 'gps_tracking'
        else if (challenge.challenge_type === 'fitness') source = 'workout_session'

        // If GPS tracking, always create an ActivityTracking document (even with empty route)
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
            source,
            activity_id: activityId
        })
        await progress.save()

        // Update participant progress
        const today = this.getTodayString()
        participant.last_activity_at = new Date()

        // Track active days
        if (!participant.active_days.includes(today)) {
            participant.active_days.push(today)
        }

        // Check if today's goal is met
        const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999);

        const todaysProgressList = await ChallengeProgressModel.find({
            challenge_id: new Types.ObjectId(challengeId),
            user_id: new Types.ObjectId(userId),
            date: { $gte: startOfDay, $lte: endOfDay },
            is_deleted: { $ne: true }
        });
        const todaySum = todaysProgressList.reduce((sum, p) => sum + p.value, 0);

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

        await participant.save()

        return { progress, participant }
    }

    async getProgress(challengeId: string, userId?: string, page: number = 1, limit: number = 20) {
        const condition: any = { challenge_id: new Types.ObjectId(challengeId), is_deleted: { $ne: true } }
        if (userId) condition.user_id = new Types.ObjectId(userId)

        const skip = (page - 1) * limit

        const progressList = await ChallengeProgressModel.find(condition)
            .populate('user_id', 'name avatar')
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
        if (!activity) throw new Error('Hoạt động không tồn tại')
        return activity
    }

    // ==================== LEADERBOARD ====================

    async getLeaderboard(challengeId: string, page: number = 1, limit: number = 50) {
        const skip = (page - 1) * limit

        const challenge = await ChallengeModel.findById(challengeId)
        if (!challenge) throw new Error('Thử thách không tồn tại')

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

        const participants = await ChallengeParticipantModel.find({
            challenge_id: new Types.ObjectId(challengeId),
            status: { $ne: 'quit' }
        })
            .populate('user_id', 'name avatar')
            .sort({ current_value: -1, joined_at: 1 })

        // Total required days for this challenge
        const safeStart = new Date(challenge.start_date); safeStart.setHours(0, 0, 0, 0)
        const safeEnd = new Date(challenge.end_date); safeEnd.setHours(0, 0, 0, 0)
        const totalRequiredDays = Math.max(1, Math.ceil((safeEnd.getTime() - safeStart.getTime()) / (1000 * 60 * 60 * 24)) + 1)

        // Bulk-fetch today's check-in sums for all participants in one aggregation
        const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999)
        const userIds = participants.map(p => p.user_id instanceof Types.ObjectId ? p.user_id : (p.user_id as any)?._id)

        const todayAgg = await ChallengeProgressModel.aggregate([
            {
                $match: {
                    challenge_id: new Types.ObjectId(challengeId),
                    user_id: { $in: userIds.map(id => new Types.ObjectId(id.toString())) },
                    date: { $gte: startOfDay, $lte: endOfDay },
                    is_deleted: { $ne: true }
                }
            },
            {
                $group: {
                    _id: '$user_id',
                    today_sum: { $sum: '$value' }
                }
            }
        ])
        const todayMap = new Map<string, number>()
        todayAgg.forEach(row => todayMap.set(row._id.toString(), row.today_sum))

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

        return {
            participant: {
                user: participant.user_id,
                current_value: participant.current_value,
                goal_value: participant.goal_value,
                progress_percent: participant.goal_value > 0
                    ? Math.min(Math.round((participant.current_value / participant.goal_value) * 100), 100) : 0,
                is_completed: participant.is_completed,
                streak_count: participant.streak_count,
                active_days: participant.active_days,
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
            is_deleted: { $ne: true }
        })

        // Recalculate active_days and completed_days
        const dayMap = new Map<string, number>()
        allEntries.forEach(e => {
            const vnOffset = 7 * 60 * 60 * 1000
            const vnDate = new Date(new Date(e.date).getTime() + vnOffset)
            const dayStr = vnDate.toISOString().split('T')[0]
            dayMap.set(dayStr, (dayMap.get(dayStr) || 0) + e.value)
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
        search
    }: {
        scope?: 'public' | 'friends' | 'mine'
        userId?: string
        page?: number
        limit?: number
        challenge_type?: string
        search?: string
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
        const condition: any = { status: 'active', is_deleted: { $ne: true } }

        if (scope === 'public') {
            condition.is_public = true
        } else if (challengeIds !== null) {
            condition._id = { $in: challengeIds }
        }

        if (challenge_type && challenge_type !== 'all') condition.challenge_type = challenge_type
        if (search) condition.$text = { $search: search }

        const total = await ChallengeModel.countDocuments(condition)
        const totalPage = Math.ceil(total / limit) || 0

        const challenges = await ChallengeModel.find(condition)
            .populate('creator_id', 'name avatar')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })

        let resultChallenges = challenges.map(c => c.toObject())

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

            resultChallenges = resultChallenges.map((c: any) => ({
                ...c,
                isJoined: joinedMap.has(c._id.toString()),
                myProgress: joinedMap.get(c._id.toString()) || null
            }))
        }

        return { challenges: resultChallenges, totalPage, page, limit, total }
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
