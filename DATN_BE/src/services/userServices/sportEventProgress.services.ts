import SportEventProgressModel, { SportEventProgress } from '~/models/schemas/sportEventProgress.schema'
import SportEventVideoSessionModel from '~/models/schemas/sportEventVideoSession.schema'
import SportEventModel from '~/models/schemas/sportEvent.schema'
import { Types } from 'mongoose'

class SportEventProgressService {
  // Add progress entry
  async addProgressService({
    eventId,
    userId,
    date,
    value,
    unit,
    distance,
    time,
    calories,
    proofImage,
    notes,
    source = 'manual',
    stravaActivityId
  }: {
    eventId: string
    userId: string
    date?: Date
    value: number
    unit: string
    distance?: number
    time?: string
    calories?: number
    proofImage?: string
    notes?: string
    source?: 'manual' | 'video_call' | 'gps'
    stravaActivityId?: string
  }) {
    // Verify event exists and user is a participant
    const event = await SportEventModel.findById(eventId)
    if (!event) {
      throw new Error('Event not found')
    }

    const isParticipant = event.participants_ids?.some((id) => id.toString() === userId)
    if (!isParticipant) {
      throw new Error('You must join the event first before adding progress')
    }

    const newProgress = new SportEventProgressModel({
      eventId,
      userId,
      date: date || new Date(),
      value,
      unit,
      distance,
      time,
      calories,
      proofImage,
      notes,
      source,
      stravaActivityId
    })

    await newProgress.save()
    return newProgress
  }

  // Get user's progress history for an event
  async getUserProgressService(eventId: string, userId: string) {
    const event = await SportEventModel.findById(eventId)
    const startDate = event?.startDate ? new Date(event.startDate) : null
    const isKcal = this.isKcalUnit(event?.targetUnit || '')
    const isIndoor = event?.eventType === 'Trong nhà'

    const dateFilter = startDate ? { date: { $gte: startDate } } : {}

    const progressHistory = await SportEventProgressModel.find({
      eventId,
      userId,
      is_deleted: { $ne: true },
      ...dateFilter
    })
      .sort({ date: -1 })
      .exec()

    const totalProgress = progressHistory.reduce((sum, entry) => sum + entry.value, 0)
    const totalDistance = progressHistory.reduce((sum, entry) => sum + (entry.distance || 0), 0)

    let totalCalories = progressHistory.reduce((sum, entry) => sum + (entry.calories || 0), 0)

    // For indoor kcal events: override totalCalories from VideoSession (single source of truth)
    if (isIndoor && isKcal) {
      const vsDateMatch = startDate ? { joinedAt: { $gte: startDate } } : {}
      const vsAgg = await SportEventVideoSessionModel.aggregate([
        {
          $match: {
            eventId: new Types.ObjectId(eventId),
            userId: new Types.ObjectId(userId),
            status: 'ended',
            is_deleted: { $ne: true },
            $or: [{ totalSeconds: { $gt: 0 } }, { activeSeconds: { $gt: 0 } }],
            ...vsDateMatch
          }
        },
        { $group: { _id: null, totalCalories: { $sum: '$caloriesBurned' } } }
      ])
      totalCalories = vsAgg[0]?.totalCalories || 0
    }

    return {
      progressHistory,
      totalProgress,
      totalDistance,
      totalCalories,
      totalEntries: progressHistory.length
    }
  }

  // Determine whether a targetUnit is calorie-based
  private isKcalUnit(targetUnit: string): boolean {
    const u = (targetUnit || '').toLowerCase().trim()
    return u === 'kcal' || u === 'calo' || u === 'calories' || u === 'cal'
  }

  // Get leaderboard for an event
  async getLeaderboardService(eventId: string, sortBy: string = 'totalProgress') {
    const event = await SportEventModel.findById(eventId)
    const startDate = event?.startDate ? new Date(event.startDate) : null
    const isKcal = this.isKcalUnit(event?.targetUnit || '')
    const isIndoor = event?.eventType === 'Trong nhà'

    let leaderboardData: any[]

    if (isIndoor && isKcal) {
      // ── Indoor kcal events: aggregate directly from VideoSession table
      // This is the SAME source IndoorEventProgress uses, ensuring consistency
      const vsDateMatch = startDate ? { joinedAt: { $gte: startDate } } : {}
      leaderboardData = await SportEventVideoSessionModel.aggregate([
        {
          $match: {
            eventId: new Types.ObjectId(eventId),
            status: 'ended',
            is_deleted: { $ne: true },
            $or: [{ totalSeconds: { $gt: 0 } }, { activeSeconds: { $gt: 0 } }],
            ...vsDateMatch
          }
        },
        {
          $group: {
            _id: '$userId',
            totalCalories: { $sum: '$caloriesBurned' },
            totalActiveSeconds: { $sum: '$activeSeconds' },
            entriesCount: { $sum: 1 },
            lastUpdate: { $max: '$joinedAt' }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'userInfo'
          }
        },
        { $unwind: '$userInfo' },
        {
          $project: {
            userId: '$_id',
            name: '$userInfo.name',
            avatar: '$userInfo.avatar',
            totalProgress: '$totalCalories',
            totalCalories: 1,
            totalDistance: { $literal: 0 },
            entriesCount: 1,
            lastUpdate: 1
          }
        }
      ])
      leaderboardData.sort((a, b) => (b.totalCalories || 0) - (a.totalCalories || 0))
    } else {
      // ── Outdoor events (or non-kcal events): use SportEventProgress table
      const dateMatch = startDate ? { date: { $gte: startDate } } : {}
      leaderboardData = await SportEventProgressModel.aggregate([
        { $match: { eventId: new Types.ObjectId(eventId), is_deleted: { $ne: true }, ...dateMatch } },
        {
          $group: {
            _id: '$userId',
            totalProgress: { $sum: '$value' },
            totalDistance: { $sum: '$distance' },
            totalCalories: { $sum: '$calories' },
            entriesCount: { $sum: 1 },
            lastUpdate: { $max: '$date' }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'userInfo'
          }
        },
        { $unwind: '$userInfo' },
        {
          $project: {
            userId: '$_id',
            name: '$userInfo.name',
            avatar: '$userInfo.avatar',
            totalProgress: 1,
            totalDistance: 1,
            totalCalories: 1,
            entriesCount: 1,
            lastUpdate: 1
          }
        }
      ])
      // Sort: for outdoor events, always by totalProgress (value = correct targetUnit)
      if (sortBy === 'totalDistance') {
        leaderboardData.sort((a, b) => (b.totalDistance || 0) - (a.totalDistance || 0))
      } else if (sortBy === 'totalCalories') {
        leaderboardData.sort((a, b) => (b.totalCalories || 0) - (a.totalCalories || 0))
      } else {
        leaderboardData.sort((a, b) => b.totalProgress - a.totalProgress)
      }
    }

    // Add rank and displayValue
    const leaderboard = leaderboardData.map((entry, index) => ({
      rank: index + 1,
      ...entry,
      displayValue: entry.totalProgress  // value is always saved in correct targetUnit
    }))

    return { leaderboard, totalParticipants: leaderboard.length }
  }

  // Get detailed participant list with progress
  async getParticipantsService(
    eventId: string,
    { page = 1, limit = 20, search = '' }: { page?: number; limit?: number; search?: string }
  ) {
    const event = await SportEventModel.findById(eventId).populate('participants_ids', 'name avatar')

    if (!event) {
      throw new Error('Event not found')
    }

    const isKcal = this.isKcalUnit(event.targetUnit || '')
    const isIndoor = event.eventType === 'Trong nhà'
    const perPersonTarget = (event.targetValue || 0) / Math.max(event.maxParticipants || 1, 1)
    const startDate = event?.startDate ? new Date(event.startDate) : null

    // Build a userId → displayValue map
    const displayMap = new Map<string, { displayValue: number; totalDistance: number; totalCalories: number; lastUpdate?: Date }>()

    if (isIndoor && isKcal) {
      // ── Indoor kcal: aggregate from VideoSession table (same source as IndoorEventProgress)
      const vsDateMatch = startDate ? { joinedAt: { $gte: startDate } } : {}
      const vsData = await SportEventVideoSessionModel.aggregate([
        {
          $match: {
            eventId: new Types.ObjectId(eventId),
            status: 'ended',
            is_deleted: { $ne: true },
            $or: [{ totalSeconds: { $gt: 0 } }, { activeSeconds: { $gt: 0 } }],
            ...vsDateMatch
          }
        },
        {
          $group: {
            _id: '$userId',
            totalCalories: { $sum: '$caloriesBurned' },
            lastUpdate: { $max: '$joinedAt' }
          }
        }
      ])
      vsData.forEach((item) => {
        displayMap.set(item._id.toString(), {
          displayValue: item.totalCalories || 0,
          totalDistance: 0,
          totalCalories: item.totalCalories || 0,
          lastUpdate: item.lastUpdate
        })
      })
    } else {
      // ── Outdoor / non-kcal: aggregate from SportEventProgress table
      const dateMatch = startDate ? { date: { $gte: startDate } } : {}
      const progressData = await SportEventProgressModel.aggregate([
        { $match: { eventId: new Types.ObjectId(eventId), is_deleted: { $ne: true }, ...dateMatch } },
        {
          $group: {
            _id: '$userId',
            totalProgress: { $sum: '$value' },
            totalDistance: { $sum: '$distance' },
            totalCalories: { $sum: '$calories' },
            lastUpdate: { $max: '$date' }
          }
        }
      ])
      progressData.forEach((item) => {
        // For outdoor events: value is always saved in targetUnit (km, phút, kcal, etc.)
        // So totalProgress ($sum of value) is always the correct display metric
        displayMap.set(item._id.toString(), {
          displayValue: item.totalProgress,
          totalDistance: item.totalDistance || 0,
          totalCalories: item.totalCalories || 0,
          lastUpdate: item.lastUpdate
        })
      })
    }

    // Combine participant list with display values
    let participants = (event.participants_ids as any[])?.map((user) => {
      const data = displayMap.get(user._id.toString()) || { displayValue: 0, totalDistance: 0, totalCalories: 0 }
      const progressPercentage = perPersonTarget > 0
        ? Math.min(Math.round((data.displayValue / perPersonTarget) * 100), 100)
        : 0

      return {
        userId: user._id,
        name: user.name,
        avatar: user.avatar,
        totalProgress: data.displayValue,   // always the value matching targetUnit
        totalDistance: data.totalDistance,
        totalCalories: data.totalCalories,
        progressPercentage,
        lastUpdate: data.lastUpdate
      }
    }) || []

    // Search
    if (search) {
      participants = participants.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    }

    // Sort by display value (desc)
    participants.sort((a, b) => b.totalProgress - a.totalProgress)

    // Add rank
    participants = participants.map((p, index) => ({ rank: index + 1, ...p }))

    const skip = (page - 1) * limit
    const paginatedParticipants = participants.slice(skip, skip + limit)

    return {
      participants: paginatedParticipants,
      total: participants.length,
      page,
      limit,
      totalPages: Math.ceil(participants.length / limit)
    }
  }

  // Update progress entry
  async updateProgressService(progressId: string, userId: string, updateData: Partial<SportEventProgress>) {
    const progress = await SportEventProgressModel.findOne({
      _id: progressId,
      userId
    })

    if (!progress) {
      throw new Error('Progress entry not found or unauthorized')
    }

    Object.assign(progress, updateData)
    await progress.save()

    return progress
  }

  // Delete progress entry
  async deleteProgressService(progressId: string, userId: string) {
    const progress = await SportEventProgressModel.findOneAndDelete({
      _id: progressId,
      userId
    })

    if (!progress) {
      throw new Error('Progress entry not found or unauthorized')
    }

    return progress
  }

  // Get overall event progress (sum of all participants)
  async getEventOverallProgressService(eventId: string) {
    const event = await SportEventModel.findById(eventId)
    const startDate = event?.startDate ? new Date(event.startDate) : null
    const isKcal = this.isKcalUnit(event?.targetUnit || '')
    const isIndoor = event?.eventType === 'Trong nhà'

    if (isIndoor && isKcal) {
      // Indoor kcal: aggregate from VideoSession (same source as IndoorEventProgress)
      const vsDateMatch = startDate ? { joinedAt: { $gte: startDate } } : {}
      const result = await SportEventVideoSessionModel.aggregate([
        {
          $match: {
            eventId: new Types.ObjectId(eventId),
            status: 'ended',
            is_deleted: { $ne: true },
            $or: [{ totalSeconds: { $gt: 0 } }, { activeSeconds: { $gt: 0 } }],
            ...vsDateMatch
          }
        },
        {
          $group: {
            _id: null,
            totalGroupProgress: { $sum: '$caloriesBurned' },
            totalCalories: { $sum: '$caloriesBurned' },
            participantIds: { $addToSet: '$userId' },
            entriesCount: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            totalGroupProgress: 1,
            totalCalories: 1,
            totalDistance: { $literal: 0 },
            participantCount: { $size: '$participantIds' },
            entriesCount: 1
          }
        }
      ])
      return result[0] || { totalGroupProgress: 0, totalCalories: 0, totalDistance: 0, participantCount: 0, entriesCount: 0 }
    }

    // Outdoor / non-kcal: use SportEventProgress table
    const dateMatch = startDate ? { date: { $gte: startDate } } : {}
    const result = await SportEventProgressModel.aggregate([
      { $match: { eventId: new Types.ObjectId(eventId), is_deleted: { $ne: true }, ...dateMatch } },
      {
        $group: {
          _id: null,
          totalGroupProgress: { $sum: '$value' },
          totalCalories: { $sum: '$calories' },
          totalDistance: { $sum: '$distance' },
          participantIds: { $addToSet: '$userId' },
          entriesCount: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          totalGroupProgress: 1,
          totalCalories: 1,
          totalDistance: 1,
          participantCount: { $size: '$participantIds' },
          entriesCount: 1
        }
      }
    ])

    return result[0] || {
      totalGroupProgress: 0,
      totalCalories: 0,
      totalDistance: 0,
      participantCount: 0,
      entriesCount: 0
    }
  }
}

const sportEventProgressService = new SportEventProgressService()
export default sportEventProgressService
