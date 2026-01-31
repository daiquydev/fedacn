import SportEventProgressModel, { SportEventProgress } from '~/models/schemas/sportEventProgress.schema'
import SportEventModel from '~/models/schemas/sportEvent.schema'
import { Types } from 'mongoose'

class SportEventProgressService {
  // Add progress entry
  async addProgressService({
    eventId,
    userId,
    value,
    unit,
    distance,
    time,
    calories,
    proofImage,
    notes
  }: {
    eventId: string
    userId: string
    value: number
    unit: string
    distance?: number
    time?: string
    calories?: number
    proofImage?: string
    notes?: string
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
      date: new Date(),
      value,
      unit,
      distance,
      time,
      calories,
      proofImage,
      notes
    })

    await newProgress.save()
    return newProgress
  }

  // Get user's progress history for an event
  async getUserProgressService(eventId: string, userId: string) {
    const progressHistory = await SportEventProgressModel.find({
      eventId,
      userId
    })
      .sort({ date: -1 })
      .exec()

    // Calculate total progress
    const totalProgress = progressHistory.reduce((sum, entry) => sum + entry.value, 0)

    return {
      progressHistory,
      totalProgress,
      totalEntries: progressHistory.length
    }
  }

  // Get leaderboard for an event
  async getLeaderboardService(eventId: string, sortBy: string = 'totalProgress') {
    // Aggregate progress by user
    const leaderboardData = await SportEventProgressModel.aggregate([
      { $match: { eventId: new Types.ObjectId(eventId) } },
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

    // Sort based on sortBy parameter
    if (sortBy === 'totalDistance') {
      leaderboardData.sort((a, b) => (b.totalDistance || 0) - (a.totalDistance || 0))
    } else if (sortBy === 'totalCalories') {
      leaderboardData.sort((a, b) => (b.totalCalories || 0) - (a.totalCalories || 0))
    } else {
      leaderboardData.sort((a, b) => b.totalProgress - a.totalProgress)
    }

    // Add rank
    const leaderboard = leaderboardData.map((entry, index) => ({
      rank: index + 1,
      ...entry
    }))

    return {
      leaderboard,
      totalParticipants: leaderboard.length
    }
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

    // Get progress data for all participants
    const progressData = await SportEventProgressModel.aggregate([
      { $match: { eventId: new Types.ObjectId(eventId) } },
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

    // Create a map for quick lookup
    const progressMap = new Map()
    progressData.forEach((item) => {
      progressMap.set(item._id.toString(), item)
    })

    // Get event target for percentage calculation
    const targetValue = event.targetValue || 100

    // Combine participant data with progress
    let participants = (event.participants_ids as any[])?.map((user) => {
      const progress = progressMap.get(user._id.toString()) || {
        totalProgress: 0,
        totalDistance: 0,
        totalCalories: 0
      }

      const progressPercentage = Math.round((progress.totalProgress / targetValue) * 100)

      return {
        userId: user._id,
        name: user.name,
        avatar: user.avatar,
        totalProgress: progress.totalProgress,
        totalDistance: progress.totalDistance || 0,
        totalCalories: progress.totalCalories || 0,
        progressPercentage: Math.min(progressPercentage, 100),
        lastUpdate: progress.lastUpdate
      }
    }) || []

    // Apply search filter
    if (search) {
      participants = participants.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    }

    // Sort by total progress (desc)
    participants.sort((a, b) => b.totalProgress - a.totalProgress)

    // Add rank
    participants = participants.map((p, index) => ({
      rank: index + 1,
      ...p
    }))

    // Apply pagination
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
}

const sportEventProgressService = new SportEventProgressService()
export default sportEventProgressService
