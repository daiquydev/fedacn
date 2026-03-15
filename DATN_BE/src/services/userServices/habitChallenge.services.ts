import { Types } from 'mongoose'
import HabitChallengeModel from '~/models/schemas/habitChallenge.schema'
import HabitChallengeParticipantModel from '~/models/schemas/habitChallengeParticipant.schema'
import HabitCheckinModel from '~/models/schemas/habitCheckin.schema'
import HabitBadgeModel from '~/models/schemas/habitBadge.schema'
import UserChallengeProfileModel from '~/models/schemas/userChallengeProfile.schema'
import NotificationModel from '~/models/schemas/notification.schema'
import { NotificationTypes, XP_REWARDS, CHALLENGE_LEVEL_THRESHOLDS } from '~/constants/enums'

// ==================== HELPERS ====================

function getDifficultyMultiplier(difficulty: string): number {
  switch (difficulty) {
    case 'hard': return XP_REWARDS.hard_multiplier
    case 'easy': return XP_REWARDS.easy_multiplier
    default: return XP_REWARDS.medium_multiplier
  }
}

function calculateLevelFromXP(xp: number): { level: number; title: string } {
  let result = CHALLENGE_LEVEL_THRESHOLDS[0]
  for (const threshold of CHALLENGE_LEVEL_THRESHOLDS) {
    if (xp >= threshold.xp) {
      result = threshold
    }
  }
  return { level: result.level, title: result.title }
}

function getVNToday() {
  const now = new Date()
  const vnOffset = 7 * 60 * 60 * 1000
  const vnNow = new Date(now.getTime() + vnOffset)
  const todayStart = new Date(vnNow.getFullYear(), vnNow.getMonth(), vnNow.getDate())
  const todayStartUTC = new Date(todayStart.getTime() - vnOffset)
  const tomorrowStartUTC = new Date(todayStartUTC.getTime() + 24 * 60 * 60 * 1000)
  const yesterdayStartUTC = new Date(todayStartUTC.getTime() - 24 * 60 * 60 * 1000)
  return { todayStartUTC, tomorrowStartUTC, yesterdayStartUTC }
}

class HabitChallengeService {
  // ==================== XP ENGINE ====================

  private async getOrCreateProfile(userId: string) {
    let profile = await UserChallengeProfileModel.findOne({ user_id: new Types.ObjectId(userId) })
    if (!profile) {
      profile = await UserChallengeProfileModel.create({ user_id: new Types.ObjectId(userId) })
    }
    return profile
  }

  private async awardXP(userId: string, amount: number, difficulty: string = 'medium') {
    const multiplier = getDifficultyMultiplier(difficulty)
    const xpToAdd = Math.round(amount * multiplier)

    const profile = await this.getOrCreateProfile(userId)
    profile.total_xp += xpToAdd

    const { level, title } = calculateLevelFromXP(profile.total_xp)
    const leveledUp = level > profile.level
    profile.level = level
    profile.title = title
    await profile.save()

    return { xpToAdd, leveledUp, newLevel: level, newTitle: title, totalXP: profile.total_xp }
  }

  private async updateProfileStats(userId: string, updates: Partial<{
    challenges_joined: number
    challenges_completed: number
    total_checkins: number
    longest_streak_ever: number
    perfect_challenges: number
  }>) {
    const profile = await this.getOrCreateProfile(userId)
    if (updates.challenges_joined) profile.challenges_joined += updates.challenges_joined
    if (updates.challenges_completed) profile.challenges_completed += updates.challenges_completed
    if (updates.total_checkins) profile.total_checkins += updates.total_checkins
    if (updates.longest_streak_ever && updates.longest_streak_ever > profile.longest_streak_ever) {
      profile.longest_streak_ever = updates.longest_streak_ever
    }
    if (updates.perfect_challenges) profile.perfect_challenges += updates.perfect_challenges
    await profile.save()
  }

  // ==================== CHALLENGE CRUD ====================

  async getAllChallengesService({
    page = 1,
    limit = 10,
    search,
    category,
    challenge_type,
    difficulty,
    userId
  }: {
    page?: number
    limit?: number
    search?: string
    category?: string
    challenge_type?: string
    difficulty?: string
    userId?: string
  }) {
    const condition: any = { status: 'active', is_public: true }

    if (search) condition.$text = { $search: search }
    if (category && category !== 'all') condition.category = category
    if (challenge_type && challenge_type !== 'all') condition.challenge_type = challenge_type
    if (difficulty && difficulty !== 'all') condition.difficulty = difficulty

    const skip = (page - 1) * limit

    const challenges = await HabitChallengeModel.find(condition)
      .populate('creator_id', 'name avatar')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })

    const total = await HabitChallengeModel.countDocuments(condition)
    const totalPage = Math.ceil(total / limit)

    let resultChallenges = challenges.map((c) => c.toObject())
    if (userId) {
      const participations = await HabitChallengeParticipantModel.find({
        user_id: new Types.ObjectId(userId),
        challenge_id: { $in: challenges.map((c) => c._id) },
        status: { $ne: 'quit' }
      })
      const joinedIds = new Set(participations.map((p) => p.challenge_id.toString()))
      resultChallenges = resultChallenges.map((c: any) => ({
        ...c,
        isJoined: joinedIds.has(c._id.toString())
      }))
    }

    return { challenges: resultChallenges, totalPage, page, limit, total }
  }

  async getChallengeService(challengeId: string, userId?: string) {
    const challenge = await HabitChallengeModel.findById(challengeId).populate('creator_id', 'name avatar email')
    if (!challenge) throw new Error('Thử thách không tồn tại')

    const result: any = challenge.toObject()

    if (userId) {
      const participation = await HabitChallengeParticipantModel.findOne({
        challenge_id: new Types.ObjectId(challengeId),
        user_id: new Types.ObjectId(userId),
        status: { $ne: 'quit' }
      }).populate('buddy_id', 'name avatar')
      result.isJoined = !!participation
      result.participation = participation ? participation.toObject() : null
    }

    return result
  }

  async createChallengeService({
    creator_id, title, description, category, challenge_type, difficulty,
    duration_days, image, is_public, max_participants, min_level, rules, team_size
  }: {
    creator_id: string
    title: string
    description: string
    category: string
    challenge_type?: string
    difficulty?: string
    duration_days: number
    image: string
    is_public: boolean
    max_participants?: number
    min_level?: number
    rules?: any
    team_size?: number
  }) {
    if (!title || !title.trim()) throw new Error('Tên thử thách không được để trống')

    const durationDays = Math.min(Math.max(duration_days || 21, 3), 90)
    const startDate = new Date()
    const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000)

    const challenge = new HabitChallengeModel({
      creator_id: new Types.ObjectId(creator_id),
      title: title.trim(),
      description: description || '',
      category: category || 'other',
      challenge_type: challenge_type || 'solo',
      difficulty: difficulty || 'medium',
      duration_days: durationDays,
      image: image || '',
      is_public: is_public !== false,
      participants_count: 0,
      max_participants: max_participants || 0,
      min_level: min_level || 1,
      status: 'active',
      end_date: endDate,
      rules: {
        checkin_frequency: rules?.checkin_frequency || 'daily',
        require_image: rules?.require_image !== false,
        require_note: rules?.require_note === true,
        streak_freeze_allowed: Math.min(rules?.streak_freeze_allowed ?? 1, 3),
        grace_period_hours: Math.min(rules?.grace_period_hours ?? 0, 12),
        target_checkins: rules?.target_checkins || 0,
        completion_type: rules?.completion_type || 'percentage'
      },
      team_size: challenge_type === 'team' ? (team_size || 5) : 0
    })

    await challenge.save()
    return challenge
  }

  async updateChallengeService(challengeId: string, userId: string, updateData: any) {
    const challenge = await HabitChallengeModel.findById(challengeId)
    if (!challenge) throw new Error('Thử thách không tồn tại')
    if (challenge.creator_id.toString() !== userId) throw new Error('Bạn không có quyền sửa thử thách này')

    const updated = await HabitChallengeModel.findByIdAndUpdate(challengeId, updateData, { new: true })
      .populate('creator_id', 'name avatar')
    return updated
  }

  async deleteChallengeService(challengeId: string, userId: string) {
    const challenge = await HabitChallengeModel.findById(challengeId)
    if (!challenge) throw new Error('Thử thách không tồn tại')
    if (challenge.creator_id.toString() !== userId) throw new Error('Bạn không có quyền xóa thử thách này')

    challenge.status = 'cancelled'
    await challenge.save()
    return challenge
  }

  // ==================== PARTICIPATION ====================

  async joinChallengeService(challengeId: string, userId: string) {
    const challenge = await HabitChallengeModel.findById(challengeId)
    if (!challenge) throw new Error('Thử thách không tồn tại')
    if (challenge.status !== 'active') throw new Error('Thử thách đã kết thúc')

    // Check max participants
    if (challenge.max_participants > 0 && challenge.participants_count >= challenge.max_participants) {
      throw new Error('Thử thách đã đầy')
    }

    // Check min level
    if (challenge.min_level > 1) {
      const profile = await this.getOrCreateProfile(userId)
      if (profile.level < challenge.min_level) {
        throw new Error(`Bạn cần đạt level ${challenge.min_level} để tham gia thử thách này`)
      }
    }

    const existing = await HabitChallengeParticipantModel.findOne({
      challenge_id: new Types.ObjectId(challengeId),
      user_id: new Types.ObjectId(userId),
      status: { $ne: 'quit' }
    })
    if (existing) throw new Error('Bạn đã tham gia thử thách này rồi')

    const streakFreezeAvailable = challenge.rules?.streak_freeze_allowed ?? 1

    const participant = new HabitChallengeParticipantModel({
      challenge_id: new Types.ObjectId(challengeId),
      user_id: new Types.ObjectId(userId),
      start_date: new Date(),
      current_streak: 0,
      longest_streak: 0,
      total_checkins: 0,
      xp_earned: 0,
      streak_freezes_used: 0,
      streak_freeze_available: streakFreezeAvailable,
      last_checkin_date: null,
      completion_percentage: 0,
      status: 'in_progress'
    })
    await participant.save()

    challenge.participants_count += 1
    await challenge.save()

    // Update profile stats
    await this.updateProfileStats(userId, { challenges_joined: 1 })

    return participant
  }

  async quitChallengeService(challengeId: string, userId: string) {
    const participant = await HabitChallengeParticipantModel.findOne({
      challenge_id: new Types.ObjectId(challengeId),
      user_id: new Types.ObjectId(userId),
      status: 'in_progress'
    })
    if (!participant) throw new Error('Bạn chưa tham gia thử thách này')

    participant.status = 'quit'
    await participant.save()

    await HabitChallengeModel.findByIdAndUpdate(challengeId, { $inc: { participants_count: -1 } })

    return participant
  }

  async setBuddyService(challengeId: string, userId: string, buddyId: string) {
    const participant = await HabitChallengeParticipantModel.findOne({
      challenge_id: new Types.ObjectId(challengeId),
      user_id: new Types.ObjectId(userId),
      status: 'in_progress'
    })
    if (!participant) throw new Error('Bạn chưa tham gia thử thách này')

    participant.buddy_id = new Types.ObjectId(buddyId)
    await participant.save()

    const challenge = await HabitChallengeModel.findById(challengeId)
    await new NotificationModel({
      sender_id: new Types.ObjectId(userId),
      receiver_id: new Types.ObjectId(buddyId),
      content: `đã mời bạn làm đối tác trong thử thách "${challenge?.title}"`,
      name_notification: `Đối tác thử thách: ${challenge?.title}`,
      link_id: challengeId,
      type: NotificationTypes.habitChallengeInvite,
      is_read: false
    }).save()

    return participant
  }

  async getMyChallengesService(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit

    const participations = await HabitChallengeParticipantModel.find({
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

    const total = await HabitChallengeParticipantModel.countDocuments({
      user_id: new Types.ObjectId(userId),
      status: { $ne: 'quit' }
    })
    const totalPage = Math.ceil(total / limit)

    return { participations, totalPage, page, limit, total }
  }

  async getParticipantsService(challengeId: string) {
    const participants = await HabitChallengeParticipantModel.find({
      challenge_id: new Types.ObjectId(challengeId),
      status: { $ne: 'quit' }
    })
      .populate('user_id', 'name avatar')
      .populate('buddy_id', 'name avatar')
      .sort({ xp_earned: -1, current_streak: -1 })

    return participants
  }

  // ==================== CHECK-IN (with XP + Rules Engine) ====================

  async checkinService(challengeId: string, userId: string, imageUrl: string, note: string) {
    const challenge = await HabitChallengeModel.findById(challengeId)
    if (!challenge) throw new Error('Thử thách không tồn tại')

    const rules = challenge.rules || {}

    // Rules Engine: validate requirements
    if (rules.require_image && !imageUrl) throw new Error('Vui lòng chụp ảnh bằng chứng')
    if (rules.require_note && (!note || !note.trim())) throw new Error('Vui lòng viết ghi chú')

    const participant = await HabitChallengeParticipantModel.findOne({
      challenge_id: new Types.ObjectId(challengeId),
      user_id: new Types.ObjectId(userId),
      status: 'in_progress'
    })
    if (!participant) throw new Error('Bạn chưa tham gia thử thách này')

    // Check duplicate check-in today
    const { todayStartUTC, tomorrowStartUTC, yesterdayStartUTC } = getVNToday()

    const existingCheckin = await HabitCheckinModel.findOne({
      challenge_id: new Types.ObjectId(challengeId),
      user_id: new Types.ObjectId(userId),
      checkin_date: { $gte: todayStartUTC, $lt: tomorrowStartUTC }
    })
    if (existingCheckin) throw new Error('Bạn đã check-in hôm nay rồi!')

    // Check frequency rules
    if (rules.checkin_frequency === 'weekly_3' || rules.checkin_frequency === 'weekly_5') {
      const weekStart = new Date(todayStartUTC)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 7)

      const weekCheckins = await HabitCheckinModel.countDocuments({
        challenge_id: new Types.ObjectId(challengeId),
        user_id: new Types.ObjectId(userId),
        checkin_date: { $gte: weekStart, $lt: weekEnd }
      })

      const maxPerWeek = rules.checkin_frequency === 'weekly_3' ? 3 : 5
      if (weekCheckins >= maxPerWeek) {
        throw new Error(`Bạn đã check-in đủ ${maxPerWeek} lần tuần này rồi!`)
      }
    }

    const dayNumber = participant.total_checkins + 1

    // Streak calculation with grace period
    const gracePeriodMs = (rules.grace_period_hours || 0) * 60 * 60 * 1000
    const graceDeadline = new Date(todayStartUTC.getTime() - gracePeriodMs)

    const yesterdayCheckin = await HabitCheckinModel.findOne({
      challenge_id: new Types.ObjectId(challengeId),
      user_id: new Types.ObjectId(userId),
      checkin_date: { $gte: yesterdayStartUTC, $lt: todayStartUTC }
    })

    let newStreak: number
    if (yesterdayCheckin) {
      newStreak = participant.current_streak + 1
    } else if (participant.current_streak > 0 && gracePeriodMs > 0) {
      // Grace period: check if last checkin is within grace window
      const lastCheckin = participant.last_checkin_date
      if (lastCheckin && lastCheckin >= graceDeadline) {
        newStreak = participant.current_streak + 1
      } else {
        newStreak = 1
      }
    } else {
      newStreak = 1
    }

    // Create checkin record
    const checkin = new HabitCheckinModel({
      challenge_id: new Types.ObjectId(challengeId),
      user_id: new Types.ObjectId(userId),
      image_url: imageUrl || '',
      note: note || '',
      day_number: dayNumber,
      checkin_date: todayStartUTC,
      likes: []
    })
    await checkin.save()

    // Update participant
    participant.current_streak = newStreak
    participant.longest_streak = Math.max(participant.longest_streak, newStreak)
    participant.total_checkins = dayNumber
    participant.last_checkin_date = todayStartUTC
    participant.completion_percentage = Math.round((dayNumber / challenge.duration_days) * 100)

    // ======= XP CALCULATION =======
    let totalXPEarned = 0
    const difficulty = challenge.difficulty || 'medium'

    // Base check-in XP
    totalXPEarned += XP_REWARDS.checkin

    // Streak bonuses
    if (newStreak === 3) totalXPEarned += XP_REWARDS.streak_3
    if (newStreak === 7) totalXPEarned += XP_REWARDS.streak_7
    if (newStreak >= 14 && newStreak % 7 === 0) totalXPEarned += XP_REWARDS.streak_14

    // Check completion
    let isCompleted = false
    if (dayNumber >= challenge.duration_days) {
      participant.status = 'completed'
      isCompleted = true
      totalXPEarned += XP_REWARDS.challenge_complete

      if (newStreak >= challenge.duration_days) {
        totalXPEarned += XP_REWARDS.perfect_streak
      }
    }

    participant.xp_earned += Math.round(totalXPEarned * getDifficultyMultiplier(difficulty))
    await participant.save()

    // Award global XP
    const xpResult = await this.awardXP(userId, totalXPEarned, difficulty)

    // Update profile stats
    await this.updateProfileStats(userId, {
      total_checkins: 1,
      longest_streak_ever: newStreak,
      ...(isCompleted ? { challenges_completed: 1 } : {}),
      ...(isCompleted && newStreak >= challenge.duration_days ? { perfect_challenges: 1 } : {})
    })

    // Notify buddy
    if (participant.buddy_id) {
      await new NotificationModel({
        sender_id: new Types.ObjectId(userId),
        receiver_id: participant.buddy_id,
        content: `đã check-in ngày ${dayNumber} trong thử thách "${challenge?.title}" 🔥`,
        name_notification: `Check-in thử thách`,
        link_id: challengeId,
        type: NotificationTypes.habitChallengeInvite,
        is_read: false
      }).save()
    }

    // Streak milestone notifications
    if ([7, 14, 21, 30].includes(newStreak)) {
      await new NotificationModel({
        sender_id: null,
        receiver_id: new Types.ObjectId(userId),
        content: `Chúc mừng! Bạn đã duy trì streak ${newStreak} ngày trong "${challenge?.title}" 🏆`,
        name_notification: `Streak milestone!`,
        link_id: challengeId,
        type: NotificationTypes.habitStreakMilestone,
        is_read: false
      }).save()
    }

    // Award tiered badges
    const newBadges = await this.checkAndAwardTieredBadges(challengeId, userId, newStreak, dayNumber, challenge)

    return {
      checkin,
      current_streak: newStreak,
      longest_streak: participant.longest_streak,
      total_checkins: dayNumber,
      completion_percentage: participant.completion_percentage,
      is_completed: isCompleted,
      xp_earned: xpResult.xpToAdd,
      total_xp: xpResult.totalXP,
      leveled_up: xpResult.leveledUp,
      new_level: xpResult.newLevel,
      new_title: xpResult.newTitle,
      new_badges: newBadges
    }
  }

  // ==================== STREAK FREEZE ====================

  async useStreakFreezeService(challengeId: string, userId: string) {
    const participant = await HabitChallengeParticipantModel.findOne({
      challenge_id: new Types.ObjectId(challengeId),
      user_id: new Types.ObjectId(userId),
      status: 'in_progress'
    })
    if (!participant) throw new Error('Bạn chưa tham gia thử thách này')

    if (participant.streak_freezes_used >= participant.streak_freeze_available) {
      throw new Error('Bạn đã dùng hết lượt đóng băng streak')
    }

    // Check if already checked in today (no need to freeze)
    const { todayStartUTC, tomorrowStartUTC } = getVNToday()
    const todayCheckin = await HabitCheckinModel.findOne({
      challenge_id: new Types.ObjectId(challengeId),
      user_id: new Types.ObjectId(userId),
      checkin_date: { $gte: todayStartUTC, $lt: tomorrowStartUTC }
    })
    if (todayCheckin) throw new Error('Bạn đã check-in hôm nay, không cần đóng băng')

    // Use streak freeze — keep current streak
    participant.streak_freezes_used += 1
    participant.last_checkin_date = todayStartUTC // Mark as "covered" so streak doesn't break
    await participant.save()

    return {
      streak_freezes_used: participant.streak_freezes_used,
      streak_freeze_available: participant.streak_freeze_available,
      remaining: participant.streak_freeze_available - participant.streak_freezes_used,
      current_streak: participant.current_streak
    }
  }

  // ==================== TIERED BADGES ====================

  private async checkAndAwardTieredBadges(
    challengeId: string,
    userId: string,
    streak: number,
    totalCheckins: number,
    challenge: any
  ) {
    const newBadges: Array<{ badge_type: string; tier: string }> = []
    const profile = await this.getOrCreateProfile(userId)

    const badgesToTry: Array<{ badge_type: string; tier: string }> = []

    // First check-in badge
    if (totalCheckins === 1) badgesToTry.push({ badge_type: 'first_checkin', tier: 'bronze' })

    // Streak warrior — tiered
    if (streak >= 7) badgesToTry.push({ badge_type: 'streak_warrior', tier: 'bronze' })
    if (streak >= 21) badgesToTry.push({ badge_type: 'streak_warrior', tier: 'silver' })
    if (streak >= 60) badgesToTry.push({ badge_type: 'streak_warrior', tier: 'gold' })

    // Challenge master — based on global completed count
    if (profile.challenges_completed >= 1) badgesToTry.push({ badge_type: 'challenge_master', tier: 'bronze' })
    if (profile.challenges_completed >= 5) badgesToTry.push({ badge_type: 'challenge_master', tier: 'silver' })
    if (profile.challenges_completed >= 15) badgesToTry.push({ badge_type: 'challenge_master', tier: 'gold' })

    // XP collector — based on total XP
    if (profile.total_xp >= 100) badgesToTry.push({ badge_type: 'xp_collector', tier: 'bronze' })
    if (profile.total_xp >= 500) badgesToTry.push({ badge_type: 'xp_collector', tier: 'silver' })
    if (profile.total_xp >= 1500) badgesToTry.push({ badge_type: 'xp_collector', tier: 'gold' })

    // Challenge specific
    if (challenge && totalCheckins >= challenge.duration_days) {
      badgesToTry.push({ badge_type: 'challenge_complete', tier: 'bronze' })
      if (streak >= challenge.duration_days) {
        badgesToTry.push({ badge_type: 'perfect_streak', tier: 'gold' })
      }
    }

    for (const badge of badgesToTry) {
      try {
        await HabitBadgeModel.create({
          user_id: new Types.ObjectId(userId),
          challenge_id: new Types.ObjectId(challengeId),
          badge_type: badge.badge_type,
          tier: badge.tier,
          earned_at: new Date()
        })
        newBadges.push(badge)
      } catch {
        // Duplicate — skip
      }
    }

    return newBadges
  }

  // ==================== CHECK-IN FEED & HISTORY ====================

  async getCheckinsService(challengeId: string, userId: string, page: number = 1, limit: number = 30) {
    const skip = (page - 1) * limit

    const checkins = await HabitCheckinModel.find({
      challenge_id: new Types.ObjectId(challengeId),
      user_id: new Types.ObjectId(userId)
    })
      .sort({ checkin_date: -1 })
      .skip(skip)
      .limit(limit)

    const total = await HabitCheckinModel.countDocuments({
      challenge_id: new Types.ObjectId(challengeId),
      user_id: new Types.ObjectId(userId)
    })

    return { checkins, total, page, limit }
  }

  async getCheckinFeedService(challengeId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit

    const checkins = await HabitCheckinModel.find({
      challenge_id: new Types.ObjectId(challengeId)
    })
      .populate('user_id', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await HabitCheckinModel.countDocuments({
      challenge_id: new Types.ObjectId(challengeId)
    })
    const totalPage = Math.ceil(total / limit)

    return { checkins, totalPage, page, limit, total }
  }

  async likeCheckinService(challengeId: string, checkinId: string, userId: string) {
    const checkin = await HabitCheckinModel.findById(checkinId)
    if (!checkin) throw new Error('Check-in không tồn tại')

    const userObjId = new Types.ObjectId(userId)
    const alreadyLiked = checkin.likes.some((id) => id.toString() === userId)

    if (alreadyLiked) {
      checkin.likes = checkin.likes.filter((id) => id.toString() !== userId) as Types.ObjectId[]
    } else {
      checkin.likes.push(userObjId)

      if (checkin.user_id.toString() !== userId) {
        await new NotificationModel({
          sender_id: userObjId,
          receiver_id: checkin.user_id,
          content: `đã thích check-in của bạn`,
          name_notification: 'Thích check-in',
          link_id: challengeId,
          type: NotificationTypes.habitCheckinLike,
          is_read: false
        }).save()
      }
    }

    await checkin.save()
    return { likes_count: checkin.likes.length, is_liked: !alreadyLiked }
  }

  // ==================== BADGES ====================

  async getUserBadgesService(userId: string) {
    const badges = await HabitBadgeModel.find({ user_id: new Types.ObjectId(userId) })
      .populate('challenge_id', 'title category image')
      .sort({ tier: -1, earned_at: -1 })
    return badges
  }

  async getBadgesForChallengeService(challengeId: string, userId: string) {
    const badges = await HabitBadgeModel.find({
      challenge_id: new Types.ObjectId(challengeId),
      user_id: new Types.ObjectId(userId)
    }).sort({ tier: -1, earned_at: -1 })
    return badges
  }

  // ==================== USER CHALLENGE PROFILE ====================

  async getUserChallengeProfileService(userId: string) {
    const profile = await this.getOrCreateProfile(userId)
    return profile
  }

  // ==================== LEADERBOARD ====================

  async getLeaderboardService({
    challengeId,
    sort_by = 'xp',
    page = 1,
    limit = 20
  }: {
    challengeId?: string
    sort_by?: string
    page?: number
    limit?: number
  }) {
    const skip = (page - 1) * limit

    if (challengeId) {
      // Challenge-specific leaderboard
      let sortOption: any = { xp_earned: -1 }
      if (sort_by === 'streak') sortOption = { current_streak: -1 }
      if (sort_by === 'checkins') sortOption = { total_checkins: -1 }
      if (sort_by === 'completion') sortOption = { completion_percentage: -1 }

      const participants = await HabitChallengeParticipantModel.find({
        challenge_id: new Types.ObjectId(challengeId),
        status: { $ne: 'quit' }
      })
        .populate('user_id', 'name avatar')
        .sort(sortOption)
        .skip(skip)
        .limit(limit)

      const total = await HabitChallengeParticipantModel.countDocuments({
        challenge_id: new Types.ObjectId(challengeId),
        status: { $ne: 'quit' }
      })

      return {
        leaderboard: participants.map((p, index) => ({
          rank: skip + index + 1,
          user: p.user_id,
          xp_earned: p.xp_earned,
          current_streak: p.current_streak,
          total_checkins: p.total_checkins,
          completion_percentage: p.completion_percentage
        })),
        total,
        page,
        limit
      }
    } else {
      // Global leaderboard by total XP
      const profiles = await UserChallengeProfileModel.find()
        .populate('user_id', 'name avatar')
        .sort({ total_xp: -1 })
        .skip(skip)
        .limit(limit)

      const total = await UserChallengeProfileModel.countDocuments()

      return {
        leaderboard: profiles.map((p, index) => ({
          rank: skip + index + 1,
          user: p.user_id,
          total_xp: p.total_xp,
          level: p.level,
          title: p.title,
          challenges_completed: p.challenges_completed,
          longest_streak_ever: p.longest_streak_ever
        })),
        total,
        page,
        limit
      }
    }
  }
}

const habitChallengeService = new HabitChallengeService()
export default habitChallengeService
