import { Types } from 'mongoose'
import ChallengeModel, { DURATION_MAP } from '~/models/schemas/challenge.schema'
import ChallengeParticipantModel from '~/models/schemas/challengeParticipant.schema'
import NotificationModel from '~/models/schemas/notification.schema'
import { NotificationTypes } from '~/constants/enums'

class ChallengeService {
  // ==================== CHALLENGE CRUD ====================

  async createChallenge({
    creator_id,
    title,
    description,
    image,
    goal_type,
    goal_value,
    duration_type,
    is_public,
    difficulty,
    badge_emoji
  }: {
    creator_id: string
    title: string
    description?: string
    image?: string
    goal_type: string
    goal_value: number
    duration_type?: string
    is_public?: boolean
    difficulty?: string
    badge_emoji?: string
  }) {
    if (!title || !title.trim()) throw new Error('Tên thử thách không được để trống')
    if (!goal_type) throw new Error('Vui lòng chọn loại mục tiêu')
    if (!goal_value || goal_value <= 0) throw new Error('Giá trị mục tiêu phải lớn hơn 0')

    const dtype = duration_type || '1_month'
    const durationDays = DURATION_MAP[dtype] || 30
    const startDate = new Date()
    const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000)

    const challenge = new ChallengeModel({
      creator_id: new Types.ObjectId(creator_id),
      title: title.trim(),
      description: description || '',
      image: image || '',
      goal_type,
      goal_value,
      duration_type: dtype,
      start_date: startDate,
      end_date: endDate,
      is_public: is_public !== false,
      difficulty: difficulty || 'medium',
      status: 'active',
      participants_count: 0,
      badge_emoji: badge_emoji || '🏆'
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
    const challenge = await ChallengeModel.findById(challengeId)
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

    // Only allow updating certain fields
    const allowedFields = ['title', 'description', 'image', 'is_public', 'badge_emoji']
    const safeUpdate: any = {}
    for (const key of allowedFields) {
      if (updateData[key] !== undefined) safeUpdate[key] = updateData[key]
    }

    const updated = await ChallengeModel.findByIdAndUpdate(challengeId, safeUpdate, { new: true })
      .populate('creator_id', 'name avatar')
    return updated
  }

  async deleteChallenge(challengeId: string, userId: string) {
    const challenge = await ChallengeModel.findById(challengeId)
    if (!challenge) throw new Error('Thử thách không tồn tại')
    if (challenge.creator_id.toString() !== userId) throw new Error('Bạn không có quyền xóa thử thách này')

    challenge.status = 'cancelled'
    await challenge.save()
    return challenge
  }

  // ==================== PARTICIPATION ====================

  async joinChallenge(challengeId: string, userId: string) {
    const challenge = await ChallengeModel.findById(challengeId)
    if (!challenge) throw new Error('Thử thách không tồn tại')
    if (challenge.status !== 'active') throw new Error('Thử thách đã kết thúc')

    // Check if end date has passed
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

  // ==================== LEADERBOARD ====================

  async getLeaderboard(challengeId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit

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
   * Auto-updates progress for ALL active challenges the user has joined.
   */
  async updateProgressOnWorkoutComplete(
    userId: string,
    workoutSession: {
      total_calories: number
      duration_minutes: number
      finished_at?: Date
    }
  ) {
    // Find all active challenges the user is participating in
    const participations = await ChallengeParticipantModel.find({
      user_id: new Types.ObjectId(userId),
      status: 'in_progress'
    }).populate('challenge_id')

    const today = this.getTodayString()

    for (const participation of participations) {
      const challenge = participation.challenge_id as any
      if (!challenge || challenge.status !== 'active') continue

      // Check if challenge hasn't expired
      if (new Date() > new Date(challenge.end_date)) continue

      let increment = 0

      switch (challenge.goal_type) {
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

const challengeService = new ChallengeService()
export default challengeService
