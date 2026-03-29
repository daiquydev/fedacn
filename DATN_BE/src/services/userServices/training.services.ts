import { Types } from 'mongoose'
import TrainingModel from '~/models/schemas/training.schema'
import TrainingParticipantModel from '~/models/schemas/trainingParticipant.schema'
import NotificationModel from '~/models/schemas/notification.schema'
import { NotificationTypes } from '~/constants/enums'

class TrainingService {
    // ==================== TRAINING CRUD ====================

    async createTraining({
        creator_id,
        title,
        description,
        image,
        goal_type,
        goal_value,
        is_public,
        difficulty,
        badge_emoji,
        start_date_iso,
        end_date_iso
    }: {
        creator_id: string
        title: string
        description?: string
        image?: string
        goal_type: string
        goal_value: number
        is_public?: boolean
        difficulty?: string
        badge_emoji?: string
        start_date_iso?: string
        end_date_iso?: string
    }) {
        if (!title || !title.trim()) throw new Error('Tên bài tập luyện không được để trống')
        if (!goal_type) throw new Error('Vui lòng chọn loại mục tiêu')
        if (!goal_value || goal_value <= 0) throw new Error('Giá trị mục tiêu phải lớn hơn 0')

        const startDate = start_date_iso ? new Date(start_date_iso) : new Date()
        if (!end_date_iso) throw new Error('Vui lòng chọn ngày kết thúc')
        const endDate = new Date(end_date_iso)

        const training = new TrainingModel({
            creator_id: new Types.ObjectId(creator_id),
            title: title.trim(),
            description: description || '',
            image: image || '',
            goal_type,
            goal_value,
            start_date: startDate,
            end_date: endDate,
            is_public: is_public !== false,
            difficulty: difficulty || 'medium',
            status: 'active',
            participants_count: 0,
            badge_emoji: badge_emoji || '🏆'
        })

        await training.save()

        // Auto-join the creator
        await this.joinTraining(training._id.toString(), creator_id)

        return training
    }

    async getTrainings({
        page = 1,
        limit = 12,
        search,
        goal_type,
        difficulty,
        userId
    }: {
        page?: number
        limit?: number
        search?: string
        goal_type?: string
        difficulty?: string
        userId?: string
    }) {
        const condition: any = { status: 'active', is_public: true }

        if (search) condition.$text = { $search: search }
        if (goal_type && goal_type !== 'all') condition.goal_type = goal_type
        if (difficulty && difficulty !== 'all') condition.difficulty = difficulty

        const skip = (page - 1) * limit

        const trainings = await TrainingModel.find(condition)
            .populate('creator_id', 'name avatar')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })

        const total = await TrainingModel.countDocuments(condition)
        const totalPage = Math.ceil(total / limit)

        let resultTrainings = trainings.map((c) => c.toObject())

        if (userId) {
            const participations = await TrainingParticipantModel.find({
                user_id: new Types.ObjectId(userId),
                training_id: { $in: trainings.map((c) => c._id) },
                status: { $ne: 'quit' }
            })
            const joinedMap = new Map<string, any>()
            participations.forEach((p) => {
                joinedMap.set(p.training_id.toString(), p.toObject())
            })

            resultTrainings = resultTrainings.map((c: any) => ({
                ...c,
                isJoined: joinedMap.has(c._id.toString()),
                myProgress: joinedMap.get(c._id.toString()) || null
            }))
        }

        return { trainings: resultTrainings, totalPage, page, limit, total }
    }

    async getTraining(trainingId: string, userId?: string) {
        const training = await TrainingModel.findById(trainingId)
            .populate('creator_id', 'name avatar email')
        if (!training) throw new Error('Bài tập luyện không tồn tại')

        const result: any = training.toObject()

        // Calculate time remaining
        const now = new Date()
        const endDate = new Date(training.end_date)
        const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)))
        result.days_remaining = daysRemaining
        result.is_expired = now > endDate

        if (userId) {
            const participation = await TrainingParticipantModel.findOne({
                training_id: new Types.ObjectId(trainingId),
                user_id: new Types.ObjectId(userId),
                status: { $ne: 'quit' }
            })
            result.isJoined = !!participation
            result.participation = participation ? participation.toObject() : null
        }

        return result
    }

    async updateTraining(trainingId: string, userId: string, updateData: any) {
        const training = await TrainingModel.findById(trainingId)
        if (!training) throw new Error('Bài tập luyện không tồn tại')
        if (training.creator_id.toString() !== userId) throw new Error('Bạn không có quyền sửa bài tập luyện này')

        // Only allow updating certain fields
        const allowedFields = ['title', 'description', 'image', 'is_public', 'badge_emoji']
        const safeUpdate: any = {}
        for (const key of allowedFields) {
            if (updateData[key] !== undefined) safeUpdate[key] = updateData[key]
        }

        const updated = await TrainingModel.findByIdAndUpdate(trainingId, safeUpdate, { new: true })
            .populate('creator_id', 'name avatar')
        return updated
    }

    async deleteTraining(trainingId: string, userId: string) {
        const training = await TrainingModel.findById(trainingId)
        if (!training) throw new Error('Bài tập luyện không tồn tại')
        if (training.creator_id.toString() !== userId) throw new Error('Bạn không có quyền xóa bài tập luyện này')

        training.status = 'cancelled'
        await training.save()
        return training
    }

    // ==================== PARTICIPATION ====================

    async joinTraining(trainingId: string, userId: string) {
        const training = await TrainingModel.findById(trainingId)
        if (!training) throw new Error('Bài tập luyện không tồn tại')
        if (training.status !== 'active') throw new Error('Bài tập luyện đã kết thúc')

        // Check if end date has passed
        if (new Date() > new Date(training.end_date)) {
            throw new Error('Bài tập luyện đã hết hạn')
        }

        const existing = await TrainingParticipantModel.findOne({
            training_id: new Types.ObjectId(trainingId),
            user_id: new Types.ObjectId(userId),
            status: { $ne: 'quit' }
        })
        if (existing) throw new Error('Bạn đã tham gia bài tập luyện này rồi')

        const participant = new TrainingParticipantModel({
            training_id: new Types.ObjectId(trainingId),
            user_id: new Types.ObjectId(userId),
            current_value: 0,
            goal_value: training.goal_value,
            is_completed: false,
            completed_at: null,
            last_activity_at: null,
            active_days: [],
            status: 'in_progress'
        })
        await participant.save()

        training.participants_count += 1
        await training.save()

        return participant
    }

    async quitTraining(trainingId: string, userId: string) {
        const participant = await TrainingParticipantModel.findOne({
            training_id: new Types.ObjectId(trainingId),
            user_id: new Types.ObjectId(userId),
            status: 'in_progress'
        })
        if (!participant) throw new Error('Bạn chưa tham gia bài tập luyện này')

        participant.status = 'quit'
        await participant.save()

        await TrainingModel.findByIdAndUpdate(trainingId, { $inc: { participants_count: -1 } })

        return participant
    }

    async getMyTrainings(userId: string, page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit

        const participations = await TrainingParticipantModel.find({
            user_id: new Types.ObjectId(userId),
            status: { $ne: 'quit' }
        })
            .populate({
                path: 'training_id',
                populate: { path: 'creator_id', select: 'name avatar' }
            })
            .skip(skip)
            .limit(limit)
            .sort({ joined_at: -1 })

        const total = await TrainingParticipantModel.countDocuments({
            user_id: new Types.ObjectId(userId),
            status: { $ne: 'quit' }
        })
        const totalPage = Math.ceil(total / limit)

        return { participations, totalPage, page, limit, total }
    }

    // ==================== LEADERBOARD ====================

    async getLeaderboard(trainingId: string, page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit

        const participants = await TrainingParticipantModel.find({
            training_id: new Types.ObjectId(trainingId),
            status: { $ne: 'quit' }
        })
            .populate('user_id', 'name avatar')
            .sort({ current_value: -1, joined_at: 1 })
            .skip(skip)
            .limit(limit)

        const total = await TrainingParticipantModel.countDocuments({
            training_id: new Types.ObjectId(trainingId),
            status: { $ne: 'quit' }
        })

        return {
            leaderboard: participants.map((p, index) => ({
                rank: skip + index + 1,
                user: p.user_id,
                current_value: p.current_value,
                goal_value: p.goal_value,
                progress_percent: p.goal_value > 0 ? Math.min(Math.round((p.current_value / p.goal_value) * 100), 100) : 0,
                is_completed: p.is_completed,
                joined_at: p.joined_at
            })),
            total,
            page,
            limit
        }
    }

    // ==================== AUTO-TRACKING (CORE) ====================

    /**
     * Called after a workout session is completed.
     * Auto-updates progress for ALL active trainings the user has joined.
     */
    async updateProgressOnWorkoutComplete(
        userId: string,
        workoutSession: {
            total_calories: number
            duration_minutes: number
            finished_at?: Date
        }
    ) {
        // Find all active trainings the user is participating in
        const participations = await TrainingParticipantModel.find({
            user_id: new Types.ObjectId(userId),
            status: 'in_progress'
        }).populate('training_id')

        const today = this.getTodayString()

        for (const participation of participations) {
            const training = participation.training_id as any
            if (!training || training.status !== 'active') continue

            // Check if training hasn't expired
            if (new Date() > new Date(training.end_date)) continue

            let increment = 0

            switch (training.goal_type) {
                case 'total_kcal':
                    increment = workoutSession.total_calories || 0
                    break
                case 'total_minutes':
                    increment = workoutSession.duration_minutes || 0
                    break
                case 'workout_count':
                    increment = 1
                    break
                case 'days_active':
                    // Only count once per day
                    if (!participation.active_days.includes(today)) {
                        participation.active_days.push(today)
                        increment = 1
                    }
                    break
            }

            if (increment > 0) {
                participation.current_value += increment
                participation.last_activity_at = new Date()

                // Check completion
                if (participation.current_value >= participation.goal_value && !participation.is_completed) {
                    participation.is_completed = true
                    participation.completed_at = new Date()
                    participation.status = 'completed'

                    // Send completion notification
                    try {
                        await new NotificationModel({
                            sender_id: null,
                            receiver_id: new Types.ObjectId(userId),
                            content: `Chúc mừng! Bạn đã hoàn thành bài tập luyện "${training.title}" ${training.badge_emoji}`,
                            name_notification: 'Hoàn thành bài tập luyện!',
                            link_id: training._id.toString(),
                            type: NotificationTypes.trainingCompleted,
                            is_read: false
                        }).save()
                    } catch {
                        // Notification errors should not break the flow
                    }
                }

                await participation.save()
            }
        }
    }

    // ==================== HELPERS ====================

    private getTodayString(): string {
        // Vietnam timezone (UTC+7)
        const now = new Date()
        const vnOffset = 7 * 60 * 60 * 1000
        const vnNow = new Date(now.getTime() + vnOffset)
        return vnNow.toISOString().split('T')[0] // 'YYYY-MM-DD'
    }
}

const trainingService = new TrainingService()
export default trainingService
