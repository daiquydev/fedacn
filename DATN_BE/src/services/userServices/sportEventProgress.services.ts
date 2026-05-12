import SportEventProgressModel, { SportEventProgress } from '~/models/schemas/sportEventProgress.schema'
import SportEventVideoSessionModel from '~/models/schemas/sportEventVideoSession.schema'
import SportEventModel from '~/models/schemas/sportEvent.schema'
import { Types, PipelineStage } from 'mongoose'
import {
  getSportEventProgressCountFromDate,
  isDailySportEventProgressAllowedAt
} from '~/utils/sportEventProgressWindow.utils'

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
    source = 'manual'
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
  }) {
    // Verify event exists and user is a participant
    const event = await SportEventModel.findById(eventId)
    if (!event) {
      throw new Error('Event not found')
    }
    if (event.isDeleted) {
      throw new Error('Sự kiện đã bị xóa')
    }

    const isParticipant = event.participants_ids?.some((id) => id.toString() === userId)
    if (!isParticipant) {
      throw new Error('You must join the event first before adding progress')
    }

    const progressDate = date ? new Date(date) : new Date()
    if (!isDailySportEventProgressAllowedAt(event.startDate, event.endDate, progressDate)) {
      throw new Error(
        'Chưa tới giờ ghi tiến độ trong ngày (mở từ 10 phút trước giờ diễn ra trong ngày đã chọn, trong khoảng ngày sự kiện)'
      )
    }
    if (event.endDate && progressDate > new Date(event.endDate)) {
      throw new Error('Sự kiện đã kết thúc, không thể ghi nhận tiến độ')
    }

    const newProgress = new SportEventProgressModel({
      eventId,
      userId,
      date: progressDate,
      value,
      unit,
      distance,
      time,
      calories,
      proofImage,
      notes,
      source
    })

    await newProgress.save()
    return newProgress
  }

  // Get user's progress history for an event
  async getUserProgressService(eventId: string, userId: string) {
    const event = await SportEventModel.findById(eventId)
    const countFrom = getSportEventProgressCountFromDate(event?.startDate)
    const isKcal = this.isKcalUnit(event?.targetUnit || '')
    const isIndoor = event?.eventType === 'Trong nhà'

    const dateFilter = countFrom ? { date: { $gte: countFrom } } : {}

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
      const vsDateMatch = countFrom ? { joinedAt: { $gte: countFrom } } : {}
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
    const countFrom = getSportEventProgressCountFromDate(event?.startDate)
    const isKcal = this.isKcalUnit(event?.targetUnit || '')
    const isIndoor = event?.eventType === 'Trong nhà'

    let leaderboardData: any[]

    if (isIndoor && isKcal) {
      // ── Indoor kcal events: aggregate directly from VideoSession table
      // This is the SAME source IndoorEventProgress uses, ensuring consistency
      const vsDateMatch = countFrom ? { joinedAt: { $gte: countFrom } } : {}
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
      const dateMatch = countFrom ? { date: { $gte: countFrom } } : {}
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
    opts: { page?: number; limit?: number; search?: string; status?: string; sort?: string }
  ) {
    const page = opts.page || 1
    const limit = opts.limit || 20
    const search = opts.search || ''
    const event = await SportEventModel.findById(eventId).populate('participants_ids', 'name avatar')

    if (!event) {
      throw new Error('Event not found')
    }

    const isKcal = this.isKcalUnit(event.targetUnit || '')
    const isIndoor = event.eventType === 'Trong nhà'
    const perPersonTarget = (event.targetValue || 0) / Math.max(event.maxParticipants || 1, 1)
    const countFrom = getSportEventProgressCountFromDate(event?.startDate)

    // Build a userId → displayValue map (+ time / entries / speed helpers)
    const displayMap = new Map<
      string,
      {
        displayValue: number
        totalDistance: number
        totalCalories: number
        totalSeconds: number
        entriesCount: number
        avgSpeedKmh: number | null
        lastUpdate?: Date
        aiConfirmedPercent?: number
      }
    >()

    if (isIndoor) {
      // ── Indoor events: aggregate from VideoSession for accurate time/calories
      const vsDateMatch = countFrom ? { joinedAt: { $gte: countFrom } } : {}
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
            totalActiveSeconds: { $sum: '$activeSeconds' },
            totalWallSeconds: { $sum: '$totalSeconds' },
            entriesCount: { $sum: 1 },
            lastUpdate: { $max: '$joinedAt' }
          }
        }
      ])

      // Also aggregate progress for totalProgress value matching targetUnit
      const dateMatchP = countFrom ? { date: { $gte: countFrom } } : {}
      const progressDataIndoor = await SportEventProgressModel.aggregate([
        { $match: { eventId: new Types.ObjectId(eventId), is_deleted: { $ne: true }, ...dateMatchP } },
        { $group: { _id: '$userId', totalProgress: { $sum: '$value' } } }
      ])
      const progressMapIndoor = new Map(progressDataIndoor.map(p => [p._id.toString(), p.totalProgress]))

      vsData.forEach((item) => {
        const progressValue = progressMapIndoor.get(item._id.toString()) ?? (isKcal ? item.totalCalories : item.totalActiveSeconds / 3600)
        const wall = item.totalWallSeconds || 0
        const active = item.totalActiveSeconds || 0
        const aiConfirmedPercent =
          wall > 0 ? Math.min(100, Math.round((active / wall) * 100)) : 0
        displayMap.set(item._id.toString(), {
          displayValue: progressValue || 0,
          totalDistance: 0,
          totalCalories: item.totalCalories || 0,
          totalSeconds: item.totalActiveSeconds || 0,
          entriesCount: item.entriesCount || 0,
          avgSpeedKmh: null,
          lastUpdate: item.lastUpdate,
          aiConfirmedPercent
        })
      })
    } else {
      // ── Outdoor / non-kcal: aggregate from SportEventProgress table
      const dateMatch = countFrom ? { date: { $gte: countFrom } } : {}
      const progressData = await SportEventProgressModel.aggregate([
        { $match: { eventId: new Types.ObjectId(eventId), is_deleted: { $ne: true }, ...dateMatch } },
        {
          $addFields: {
            _effSec: {
              $cond: [
                { $gt: [{ $ifNull: ['$activeSeconds', 0] }, 0] },
                '$activeSeconds',
                {
                  $multiply: [
                    {
                      $convert: {
                        input: {
                          $arrayElemAt: [{ $split: [{ $toString: { $ifNull: ['$time', ''] } }, ' '] }, 0]
                        },
                        to: 'double',
                        onError: 0,
                        onNull: 0
                      }
                    },
                    60
                  ]
                }
              ]
            }
          }
        },
        {
          $group: {
            _id: '$userId',
            totalProgress: { $sum: '$value' },
            totalDistance: { $sum: '$distance' },
            totalCalories: { $sum: '$calories' },
            totalSeconds: { $sum: '$_effSec' },
            entriesCount: { $sum: 1 },
            lastUpdate: { $max: '$date' }
          }
        }
      ])
      progressData.forEach((item) => {
        const totalSeconds = item.totalSeconds || 0
        const totalDistance = item.totalDistance || 0
        const avgSpeedKmh =
          totalSeconds > 0 && totalDistance > 0
            ? Math.round((totalDistance / (totalSeconds / 3600)) * 100) / 100
            : null
        displayMap.set(item._id.toString(), {
          displayValue: item.totalProgress,
          totalDistance,
          totalCalories: item.totalCalories || 0,
          totalSeconds,
          entriesCount: item.entriesCount || 0,
          avgSpeedKmh,
          lastUpdate: item.lastUpdate
        })
      })
    }

    // Combine participant list with display values
    let participants = (event.participants_ids as any[])?.map((user) => {
      const data = displayMap.get(user._id.toString()) || {
        displayValue: 0,
        totalDistance: 0,
        totalCalories: 0,
        totalSeconds: 0,
        entriesCount: 0,
        avgSpeedKmh: null as number | null,
        aiConfirmedPercent: isIndoor ? 0 : undefined
      }
      const progressPercentage = perPersonTarget > 0
        ? Math.min(Math.round((data.displayValue / perPersonTarget) * 100), 100)
        : 0

      return {
        userId: user._id,
        name: user.name,
        avatar: user.avatar,
        totalProgress: data.displayValue, // always the value matching targetUnit
        totalDistance: data.totalDistance,
        totalCalories: data.totalCalories,
        totalTimeSeconds: data.totalSeconds,
        entriesCount: data.entriesCount,
        avgSpeedKmh: data.avgSpeedKmh,
        progressPercentage,
        lastUpdate: data.lastUpdate,
        ...(isIndoor ? { aiConfirmedPercent: data.aiConfirmedPercent ?? 0 } : {})
      }
    }) || []

    // Search
    if (search) {
      participants = participants.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    }

    // Filter by status
    if (opts.status === 'completed') {
      participants = participants.filter((p) => (p.progressPercentage ?? 0) >= 100)
    } else if (opts.status === 'in_progress') {
      participants = participants.filter((p) => (p.progressPercentage ?? 0) < 100)
    }

    // Sort
    if (opts.sort === 'name_asc') {
      participants.sort((a, b) => a.name.localeCompare(b.name))
    } else if (opts.sort === 'name_desc') {
      participants.sort((a, b) => b.name.localeCompare(a.name))
    } else if (opts.sort === 'progress_asc') {
      participants.sort((a, b) => a.totalProgress - b.totalProgress)
    } else {
      // Default: progress_desc
      participants.sort((a, b) => b.totalProgress - a.totalProgress)
    }

    // Add rank (only makes sense if sorted by progress, but we assign rank based on current sort)
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
    const countFrom = getSportEventProgressCountFromDate(event?.startDate)
    const isKcal = this.isKcalUnit(event?.targetUnit || '')
    const isIndoor = event?.eventType === 'Trong nhà'

    if (isIndoor && isKcal) {
      // Indoor kcal: aggregate from VideoSession (same source as IndoorEventProgress)
      const vsDateMatch = countFrom ? { joinedAt: { $gte: countFrom } } : {}
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
    const dateMatch = countFrom ? { date: { $gte: countFrom } } : {}
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

  private buildParticipantProgressHistoryMatch(
    eventId: string,
    targetUserId: string,
    event: { startDate?: Date | null; endDate?: Date | null },
    fromDate?: string,
    toDate?: string
  ) {
    const match: Record<string, unknown> = {
      eventId: new Types.ObjectId(eventId),
      userId: new Types.ObjectId(targetUserId),
      is_deleted: { $ne: true }
    }
    const dateClause: Record<string, Date> = {}
    if (event.startDate) {
      const from = getSportEventProgressCountFromDate(event.startDate)
      if (from) dateClause.$gte = from
    }
    if (event.endDate) dateClause.$lte = new Date(event.endDate)
    if (fromDate) {
      const f = new Date(fromDate)
      f.setHours(0, 0, 0, 0)
      if (!dateClause.$gte || f > dateClause.$gte) dateClause.$gte = f
    }
    if (toDate) {
      const t = new Date(toDate)
      t.setHours(23, 59, 59, 999)
      if (!dateClause.$lte || t < dateClause.$lte) dateClause.$lte = t
    }
    if (Object.keys(dateClause).length > 0) {
      match.date = dateClause
    }
    return match
  }

  /** Buổi video trong nhà: lọc theo cùng khoảng ngày với nhật ký tiến độ (theo endedAt hoặc joinedAt). */
  private buildParticipantVideoSessionHistoryPipeline(
    eventId: string,
    targetUserId: string,
    event: { startDate?: Date | null; endDate?: Date | null },
    fromDate?: string,
    toDate?: string
  ) {
    const pipeline: PipelineStage[] = [
      {
        $match: {
          eventId: new Types.ObjectId(eventId),
          userId: new Types.ObjectId(targetUserId),
          status: 'ended',
          is_deleted: { $ne: true },
          $or: [{ totalSeconds: { $gt: 0 } }, { activeSeconds: { $gt: 0 } }]
        }
      },
      { $addFields: { _refEnd: { $ifNull: ['$endedAt', '$joinedAt'] } } }
    ]
    const dateClause: Record<string, Date> = {}
    if (event.startDate) {
      const from = getSportEventProgressCountFromDate(event.startDate)
      if (from) dateClause.$gte = from
    }
    if (event.endDate) dateClause.$lte = new Date(event.endDate)
    if (fromDate) {
      const f = new Date(fromDate)
      f.setHours(0, 0, 0, 0)
      if (!dateClause.$gte || f > dateClause.$gte) dateClause.$gte = f
    }
    if (toDate) {
      const t = new Date(toDate)
      t.setHours(23, 59, 59, 999)
      if (!dateClause.$lte || t < dateClause.$lte) dateClause.$lte = t
    }
    if (Object.keys(dateClause).length > 0) {
      pipeline.push({ $match: { _refEnd: dateClause } })
    }
    pipeline.push({
      $group: {
        _id: null,
        totalSessionSeconds: { $sum: '$totalSeconds' },
        totalAiConfirmedSeconds: { $sum: '$activeSeconds' }
      }
    })
    return pipeline
  }

  /** Người tạo sự kiện: xem nhật ký tiến độ + tổng hợp của một người tham gia (phân trang, lọc ngày) */
  async getParticipantProgressHistoryForCreatorService(
    eventId: string,
    targetUserId: string,
    creatorId: string,
    opts: { page?: number; limit?: number; fromDate?: string; toDate?: string }
  ) {
    const page = Math.max(1, opts.page || 1)
    const limit = Math.min(50, Math.max(1, opts.limit || 10))

    const event = await SportEventModel.findById(eventId).select('createdBy participants_ids startDate endDate eventType')
    if (!event) {
      throw new Error('Event not found')
    }
    if (event.createdBy.toString() !== creatorId) {
      throw new Error('Chỉ người tạo sự kiện mới xem được chi tiết tiến độ của người tham gia')
    }
    const participantIds = (event.participants_ids || []).map((id: Types.ObjectId) => id.toString())
    if (!participantIds.includes(targetUserId)) {
      throw new Error('Người dùng không thuộc sự kiện này')
    }

    const match = this.buildParticipantProgressHistoryMatch(eventId, targetUserId, event, opts.fromDate, opts.toDate)
    const matchOverall = this.buildParticipantProgressHistoryMatch(eventId, targetUserId, event)

    const addEffSecStage = {
      $addFields: {
        _effSec: {
          $cond: [
            { $gt: [{ $ifNull: ['$activeSeconds', 0] }, 0] },
            '$activeSeconds',
            {
              $multiply: [
                {
                  $convert: {
                    input: {
                      $arrayElemAt: [{ $split: [{ $toString: { $ifNull: ['$time', ''] } }, ' '] }, 0]
                    },
                    to: 'double',
                    onError: 0,
                    onNull: 0
                  }
                },
                60
              ]
            }
          ]
        }
      }
    }

    const [summaryAgg, overallAgg, total, rawRows] = await Promise.all([
      SportEventProgressModel.aggregate([
        { $match: match },
        addEffSecStage,
        {
          $group: {
            _id: null,
            totalEntries: { $sum: 1 },
            totalProgress: { $sum: '$value' },
            totalDistance: { $sum: { $ifNull: ['$distance', 0] } },
            totalCalories: { $sum: { $ifNull: ['$calories', 0] } },
            totalSeconds: { $sum: '$_effSec' }
          }
        }
      ]),
      SportEventProgressModel.aggregate([
        { $match: matchOverall },
        { $group: { _id: null, totalProgress: { $sum: '$value' } } }
      ]),
      SportEventProgressModel.countDocuments(match),
      SportEventProgressModel.find(match)
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec()
    ])

    const s = summaryAgg[0] || {
      totalEntries: 0,
      totalProgress: 0,
      totalDistance: 0,
      totalCalories: 0,
      totalSeconds: 0
    }
    const avgSpeedKmh =
      s.totalSeconds > 0 && s.totalDistance > 0
        ? Math.round((s.totalDistance / (s.totalSeconds / 3600)) * 100) / 100
        : null

    const videoProgressIds = rawRows
      .filter((d: Record<string, unknown>) => d.source === 'video_call')
      .map((d: Record<string, unknown>) => d._id as Types.ObjectId)

    const vsByProgressId = new Map<string, { totalSeconds: number; activeSeconds: number }>()
    if (videoProgressIds.length > 0) {
      const sessions = await SportEventVideoSessionModel.find({
        progressId: { $in: videoProgressIds },
        is_deleted: { $ne: true }
      })
        .select('progressId totalSeconds activeSeconds')
        .lean()
      for (const sess of sessions as { progressId?: Types.ObjectId; totalSeconds?: number; activeSeconds?: number }[]) {
        const pid = sess.progressId?.toString()
        if (pid) {
          vsByProgressId.set(pid, {
            totalSeconds: sess.totalSeconds || 0,
            activeSeconds: sess.activeSeconds || 0
          })
        }
      }
    }

    const entries = rawRows.map((doc: Record<string, unknown>) => {
      const activeSeconds = doc.activeSeconds as number | undefined
      const effectiveSeconds =
        activeSeconds && activeSeconds > 0
          ? activeSeconds
          : (() => {
              const first = String(doc.time || '')
                .trim()
                .split(/\s+/)[0]
              const n = parseFloat(first)
              return Number.isFinite(n) ? Math.round(n * 60) : 0
            })()

      let sessionTotalSeconds: number | null = null
      let sessionActiveSeconds: number | null = null
      let aiConfirmedPercentEntry: number | null = null
      if (doc.source === 'video_call') {
        const vsMeta = vsByProgressId.get(String(doc._id))
        const wall = vsMeta?.totalSeconds
        const act =
          vsMeta != null && vsMeta.activeSeconds != null
            ? vsMeta.activeSeconds
            : activeSeconds && activeSeconds > 0
              ? activeSeconds
              : null
        sessionTotalSeconds = wall != null ? wall : null
        sessionActiveSeconds = act != null ? act : null
        if (wall != null && wall > 0 && act != null) {
          aiConfirmedPercentEntry = Math.min(100, Math.round((act / wall) * 100))
        } else if (wall === 0) {
          aiConfirmedPercentEntry = 0
        }
      }

      return {
        _id: doc._id,
        date: doc.date,
        value: doc.value,
        unit: doc.unit,
        distance: doc.distance,
        time: doc.time,
        calories: doc.calories,
        source: doc.source,
        notes: doc.notes,
        proofImage: doc.proofImage,
        activeSeconds: doc.activeSeconds,
        effectiveSeconds,
        activityTrackingId: doc.activityTrackingId,
        sessionTotalSeconds,
        sessionActiveSeconds,
        aiConfirmedPercent: aiConfirmedPercentEntry
      }
    })

    const overallTotalProgress = overallAgg[0]?.totalProgress || 0

    let indoorVsSummary: {
      totalSessionSeconds: number
      totalAiConfirmedSeconds: number
      aiConfirmedPercent: number
    } | null = null
    if (event.eventType === 'Trong nhà') {
      const vsPipeline = this.buildParticipantVideoSessionHistoryPipeline(
        eventId,
        targetUserId,
        event,
        opts.fromDate,
        opts.toDate
      )
      const vsAgg = await SportEventVideoSessionModel.aggregate(vsPipeline)
      const row = vsAgg[0]
      const totalSessionSeconds = row?.totalSessionSeconds || 0
      const totalAiConfirmedSeconds = row?.totalAiConfirmedSeconds || 0
      indoorVsSummary = {
        totalSessionSeconds,
        totalAiConfirmedSeconds,
        aiConfirmedPercent:
          totalSessionSeconds > 0
            ? Math.min(100, Math.round((totalAiConfirmedSeconds / totalSessionSeconds) * 100))
            : 0
      }
    }

    return {
      entries,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      summary: {
        totalEntries: s.totalEntries || 0,
        totalProgress: s.totalProgress || 0,
        totalDistance: s.totalDistance || 0,
        totalCalories: s.totalCalories || 0,
        totalSeconds: s.totalSeconds || 0,
        avgSpeedKmh,
        ...(indoorVsSummary
          ? {
              totalSessionSeconds: indoorVsSummary.totalSessionSeconds,
              totalAiConfirmedSeconds: indoorVsSummary.totalAiConfirmedSeconds,
              aiConfirmedPercent: indoorVsSummary.aiConfirmedPercent
            }
          : {})
      },
      overallPersonalProgress: overallTotalProgress
    }
  }
}

const sportEventProgressService = new SportEventProgressService()
export default sportEventProgressService
