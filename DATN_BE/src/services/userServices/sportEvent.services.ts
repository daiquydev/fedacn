import SportEventModel, { SportEvent } from '~/models/schemas/sportEvent.schema'
import SportEventSessionModel from '~/models/schemas/sportEventSession.schema'
import SportEventProgressModel from '~/models/schemas/sportEventProgress.schema'
import SportEventVideoSessionModel from '~/models/schemas/sportEventVideoSession.schema'
import NotificationModel from '~/models/schemas/notification.schema'
import PostModel from '~/models/schemas/post.schema'
import { NotificationTypes } from '~/constants/enums'
import { Types } from 'mongoose'
import { ErrorWithStatus } from '~/utils/error'
import HTTP_STATUS from '~/constants/httpStatus'

// Mirror of sportEventProgress.services.ts isKcalUnit (avoids circular import)
function isKcalUnit(targetUnit: string): boolean {
  const u = (targetUnit || '').toLowerCase().trim()
  return u === 'kcal' || u === 'calo' || u === 'calories' || u === 'cal'
}

class SportEventService {
  // Get all sport events
  async getAllSportEventsService({
    page = 1,
    limit = 10,
    search,
    category,
    sortBy = 'popular',
    userId,
    eventType,
    status,
    dateFrom,
    dateTo,
    joined
  }: {
    page?: number
    limit?: number
    search?: string
    category?: string
    sortBy?: string
    userId?: string
    eventType?: string
    status?: string
    dateFrom?: string
    dateTo?: string
    joined?: string
  }) {
    const condition: any = { isDeleted: { $ne: true } }

    if (search) {
      condition.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ]
    }

    if (category && category !== 'all') {
      condition.category = category
    }

    if (eventType && eventType !== 'all') {
      condition.eventType = eventType
    }

    // Status filter: ongoing, ended, upcoming
    const now = new Date()
    if (status === 'ongoing') {
      condition.startDate = { $lte: now }
      condition.endDate = { $gte: now }
    } else if (status === 'ended') {
      condition.endDate = { $lt: now }
    } else if (status === 'upcoming') {
      condition.startDate = { $gt: now }
    }

    // Date range filter
    if (dateFrom) {
      condition.startDate = { ...condition.startDate, $gte: new Date(dateFrom) }
    }
    if (dateTo) {
      condition.startDate = { ...condition.startDate, $lte: new Date(dateTo + 'T23:59:59') }
    }

    // Joined filter
    if (joined === 'true' && userId) {
      condition.participants_ids = new Types.ObjectId(userId)
    }

    const skip = (page - 1) * limit

    // For 'popular' (smart default): sort by status priority (ongoing → upcoming → ended),
    // then by startDate ascending within each group.
    // Uses aggregation to compute statusOrder at query time.
    if (sortBy === 'popular') {
      const aggregationPipeline: any[] = [
        { $match: condition },
        {
          $addFields: {
            statusOrder: {
              $switch: {
                branches: [
                  {
                    case: { $and: [{ $lte: ['$startDate', now] }, { $gte: ['$endDate', now] }] },
                    then: 0 // ongoing
                  },
                  {
                    case: { $gt: ['$startDate', now] },
                    then: 1 // upcoming
                  }
                ],
                default: 2 // ended
              }
            }
          }
        },
        { $sort: { statusOrder: 1, startDate: 1, _id: 1 } }
      ]

      const [countResult, rawEvents] = await Promise.all([
        SportEventModel.aggregate([...aggregationPipeline, { $count: 'total' }]),
        SportEventModel.aggregate([
          ...aggregationPipeline,
          { $skip: skip },
          { $limit: limit },
          {
            $lookup: {
              from: 'users',
              localField: 'createdBy',
              foreignField: '_id',
              as: '_createdByArr',
              pipeline: [{ $project: { name: 1, avatar: 1 } }]
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: 'participants_ids',
              foreignField: '_id',
              as: 'participants_ids',
              pipeline: [{ $project: { name: 1, avatar: 1 } }]
            }
          },
          {
            $addFields: {
              createdBy: { $arrayElemAt: ['$_createdByArr', 0] }
            }
          },
          { $project: { _createdByArr: 0, statusOrder: 0 } }
        ])
      ])

      const total = countResult[0]?.total || 0
      const totalPage = Math.ceil(total / limit)

      let resultEvents = rawEvents.map((eventObj: any) => {
        if (userId && eventObj.participants_ids) {
          eventObj.isJoined = eventObj.participants_ids.some((participant: any) => {
            const id = participant._id ? participant._id.toString() : participant.toString()
            return id === userId
          })
        } else {
          eventObj.isJoined = false
        }
        return eventObj
      })

      // Inject eventProgress for joined events
      if (userId) {
        const joinedEvents = resultEvents.filter((e: any) => e.isJoined)
        const joinedEventIds = joinedEvents.map((e: any) => new Types.ObjectId(e._id.toString()))

        if (joinedEventIds.length > 0) {
          const progressMap = new Map<string, number>()

          const indoorKcalEvents = joinedEvents.filter((e: any) => e.eventType === 'Trong nhà' && isKcalUnit(e.targetUnit || ''))
          const otherEvents = joinedEvents.filter((e: any) => !(e.eventType === 'Trong nhà' && isKcalUnit(e.targetUnit || '')))

          if (indoorKcalEvents.length > 0) {
            const vsDateConditions = indoorKcalEvents.map((e: any) => {
              const cond: any = { eventId: new Types.ObjectId(e._id.toString()) }
              if (e.startDate) cond.joinedAt = { $gte: new Date(e.startDate) }
              return cond
            })
            const vsAgg = await SportEventVideoSessionModel.aggregate([
              {
                $match: {
                  $and: [
                    { $or: vsDateConditions },
                    { $or: [{ totalSeconds: { $gt: 0 } }, { activeSeconds: { $gt: 0 } }] }
                  ],
                  status: 'ended',
                  is_deleted: { $ne: true }
                }
              },
              { $group: { _id: '$eventId', totalGroupProgress: { $sum: '$caloriesBurned' } } }
            ])
            vsAgg.forEach((row: any) => progressMap.set(row._id.toString(), row.totalGroupProgress))
          }

          if (otherEvents.length > 0) {
            const dateConditions = otherEvents.map((e: any) => {
              const cond: any = { eventId: new Types.ObjectId(e._id.toString()) }
              if (e.startDate) cond.date = { $gte: new Date(e.startDate) }
              return cond
            })
            const progressAgg = await SportEventProgressModel.aggregate([
              {
                $match: {
                  $or: dateConditions,
                  is_deleted: { $ne: true }
                }
              },
              { $group: { _id: '$eventId', totalGroupProgress: { $sum: '$value' } } }
            ])
            progressAgg.forEach((row: any) => progressMap.set(row._id.toString(), row.totalGroupProgress))
          }

          resultEvents = resultEvents.map((e: any) => {
            if (!e.isJoined) return e
            const eid = e._id.toString()
            const totalGroupProgress = progressMap.get(eid) || 0
            const targetValue = e.targetValue || 0
            const progressPercent = targetValue > 0
              ? Math.min(Math.round((totalGroupProgress / targetValue) * 100), 100)
              : 0
            return { ...e, myProgress: { totalGroupProgress, targetValue, progressPercent } }
          })
        }
      }

      return { events: resultEvents, totalPage, page, limit, total }
    }

    // Non-popular sorts: use find().sort() as before
    let sortOption: any = { createdAt: -1 }
    if (sortBy === 'newest') sortOption = { createdAt: -1 }
    else if (sortBy === 'oldest') sortOption = { createdAt: 1 }
    else if (sortBy === 'soonest') sortOption = { startDate: 1 }
    else if (sortBy === 'earliest') sortOption = { startDate: 1 }
    else if (sortBy === 'ongoing') sortOption = { endDate: 1 }
    else if (sortBy === 'ended') sortOption = { endDate: -1 }

    const [events, total] = await Promise.all([
      SportEventModel.find(condition)
        .populate('createdBy', 'name avatar')
        .populate('participants_ids', 'name avatar')
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .exec(),
      SportEventModel.countDocuments(condition)
    ])

    const totalPage = Math.ceil(total / limit)

    // Calculate isJoined if userId is provided
    let resultEvents = events.map((event) => {
      const eventObj = event.toObject() as any
      if (userId && eventObj.participants_ids) {
        eventObj.isJoined = eventObj.participants_ids.some((participant: any) => {
          const id = participant._id ? participant._id.toString() : participant.toString()
          return id === userId
        })
      } else {
        eventObj.isJoined = false
      }
      return eventObj
    })

    // Inject eventProgress (group progress) for joined events
    // Mirrors getEventOverallProgressService: indoor kcal → VideoSession, others → SportEventProgress
    if (userId) {
      const joinedEvents = resultEvents.filter((e: any) => e.isJoined)
      const joinedEventIds = joinedEvents.map((e: any) => new Types.ObjectId(e._id.toString()))

      if (joinedEventIds.length > 0) {
        const progressMap = new Map<string, number>()

        // Split events into two groups by data source
        const indoorKcalEvents = joinedEvents.filter((e: any) => e.eventType === 'Trong nhà' && isKcalUnit(e.targetUnit || ''))
        const otherEvents = joinedEvents.filter((e: any) => !(e.eventType === 'Trong nhà' && isKcalUnit(e.targetUnit || '')))

        // ── Indoor kcal: aggregate caloriesBurned from VideoSession (same as getEventOverallProgressService)
        if (indoorKcalEvents.length > 0) {
          const vsDateConditions = indoorKcalEvents.map((e: any) => {
            const cond: any = { eventId: new Types.ObjectId(e._id.toString()) }
            if (e.startDate) cond.joinedAt = { $gte: new Date(e.startDate) }
            return cond
          })
          const vsAgg = await SportEventVideoSessionModel.aggregate([
            {
              $match: {
                $and: [
                  { $or: vsDateConditions },
                  { $or: [{ totalSeconds: { $gt: 0 } }, { activeSeconds: { $gt: 0 } }] }
                ],
                status: 'ended',
                is_deleted: { $ne: true }
              }
            },
            { $group: { _id: '$eventId', totalGroupProgress: { $sum: '$caloriesBurned' } } }
          ])
          vsAgg.forEach((row: any) => progressMap.set(row._id.toString(), row.totalGroupProgress))
        }

        // ── Other events: aggregate value from SportEventProgress (outdoor GPS + indoor non-kcal)
        if (otherEvents.length > 0) {
          const dateConditions = otherEvents.map((e: any) => {
            const cond: any = { eventId: new Types.ObjectId(e._id.toString()) }
            if (e.startDate) cond.date = { $gte: new Date(e.startDate) }
            return cond
          })
          const progressAgg = await SportEventProgressModel.aggregate([
            {
              $match: {
                $or: dateConditions,
                is_deleted: { $ne: true }
              }
            },
            { $group: { _id: '$eventId', totalGroupProgress: { $sum: '$value' } } }
          ])
          progressAgg.forEach((row: any) => progressMap.set(row._id.toString(), row.totalGroupProgress))
        }

        resultEvents = resultEvents.map((e: any) => {
          if (!e.isJoined) return e
          const eid = e._id.toString()
          const totalGroupProgress = progressMap.get(eid) || 0
          const targetValue = e.targetValue || 0
          const progressPercent = targetValue > 0
            ? Math.min(Math.round((totalGroupProgress / targetValue) * 100), 100)
            : 0
          return {
            ...e,
            myProgress: { totalGroupProgress, targetValue, progressPercent }
          }
        })
      }
    }

    return { events: resultEvents, totalPage, page, limit, total }
  }

  // Get single sport event
  async getSportEventService(eventId: string, userId?: string) {
    const event = await SportEventModel.findById(eventId)
      .populate('createdBy', 'name avatar email')
      .populate('participants_ids', 'name avatar')

    if (!event) {
      throw new ErrorWithStatus({ message: 'Sự kiện thể thao không tồn tại', status: HTTP_STATUS.NOT_FOUND })
    }

    if (event.isDeleted) {
      throw new ErrorWithStatus({ message: 'Sự kiện thể thao đã bị xóa', status: HTTP_STATUS.NOT_FOUND })
    }

    const eventObj = event.toObject() as SportEvent
    if (userId && eventObj.participants_ids) {
      eventObj.isJoined = eventObj.participants_ids.some((participant: any) => {
        const id = participant._id ? participant._id.toString() : participant.toString()
        return id === userId
      })
    } else {
      eventObj.isJoined = false
    }

    return eventObj
  }

  // Create sport event
  async createSportEventService({
    name,
    description,
    detailedDescription,
    category,
    startDate,
    endDate,
    location,
    maxParticipants,
    image,
    createdBy,
    eventType,
    targetValue,
    targetUnit,
    requirements,
    benefits
  }: {
    name: string
    description: string
    detailedDescription?: string
    category: string
    startDate: Date
    endDate: Date
    location: string
    maxParticipants: number
    image: string
    createdBy: string
    eventType: 'Ngoài trời' | 'Trong nhà'
    targetValue?: number
    targetUnit?: string
    requirements?: string
    benefits?: string
  }) {
    // Validate dates
    const start = new Date(startDate)
    const end = new Date(endDate)
    const now = new Date()

    if (start < now) {
      throw new Error('Ngày bắt đầu không thể nằm trong quá khứ')
    }

    if (end <= start) {
      throw new Error('Ngày kết thúc phải sau ngày bắt đầu')
    }

    if (!name || !name.trim()) {
      throw new Error('Tên sự kiện không được để trống')
    }

    if (maxParticipants < 1) {
      throw new Error('Số người tham gia tối thiểu là 1')
    }

    const newEvent = new SportEventModel({
      name,
      description,
      detailedDescription: detailedDescription || '',
      category,
      startDate: start,
      endDate: end,
      location,
      maxParticipants,
      image,
      createdBy,
      eventType,
      targetValue: targetValue !== undefined ? targetValue : undefined,
      targetUnit: targetUnit || '',
      requirements: requirements || '',
      benefits: benefits || '',
      participants: 1,
      participants_ids: [createdBy]
    })

    try {
      await newEvent.save()

      // Auto-generate sessions for Trong nhà events
      if (eventType === 'Trong nhà') {
        console.log('Creating Trong nhà Event - Generating Sessions...')
        const sessions = []
        let currentDate = new Date(start)
        // Reset time to start time for consistency if needed, or keep as is
        let sessionCount = 1

        while (currentDate <= end) {
          console.log(`Generating session ${sessionCount} for date ${currentDate}`)
          // Create a new date object for this session to avoid reference issues
          const sessionDate = new Date(currentDate)

          sessions.push({
            eventId: newEvent._id,
            sessionNumber: sessionCount,
            title: `Buổi học ${sessionCount}`,
            description: `Buổi học trực tuyến ngày ${sessionDate.toLocaleDateString('vi-VN')}`,
            sessionDate: sessionDate, // Mongoose handles Date objects
            durationHours: 2, // Default duration
            videoCallUrl: (location && typeof location === 'string' && location.startsWith('http')) ? location : '', // Use location as link if it is a URL
            isCompleted: false
          })

          // Next day
          currentDate.setDate(currentDate.getDate() + 1)
          sessionCount++
        }

        if (sessions.length > 0) {
          console.log(`Attempting to save ${sessions.length} sessions...`)
          try {
            await SportEventSessionModel.insertMany(sessions)
            console.log('Sessions saved successfully')
          } catch (sessionError: any) {
            console.error('Error saving sessions (InsertMany):', sessionError)

            // Try fallback but still throw if that fails too, or just throw immediately to identify issue
            // Let's throw immediately to alert the user
            throw new Error(`Failed to generate sessions: ${sessionError.message || sessionError}`)
          }
        }
      }

      return newEvent
    } catch (error: any) {
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map((e: any) => e.message)
        throw new Error(`Validation error: ${messages.join(', ')}`)
      }
      throw error
    }
  }

  // Update sport event
  async updateSportEventService(eventId: string, updateData: Partial<SportEvent>) {
    // Prevent updating a soft-deleted event
    const existing = await SportEventModel.findById(eventId)
    if (!existing) throw new Error('Sport event not found')
    if (existing.isDeleted) throw new Error('Cannot update a deleted sport event')

    const event = await SportEventModel.findByIdAndUpdate(eventId, updateData, { new: true })
      .populate('createdBy', 'name avatar')
      .populate('participants_ids', 'name avatar')

    if (!event) {
      throw new Error('Sport event not found')
    }

    return event
  }

  // Soft delete sport event
  async deleteSportEventService(eventId: string) {
    const event = await SportEventModel.findByIdAndUpdate(
      eventId,
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    )

    if (!event) {
      throw new Error('Sport event not found')
    }

    // Clean up all post markers referencing this event
    // Markers: [sport-event:ID], [activity:*:ID], [indoor-session:*:ID]
    const markerRegex = `\\[sport-event:${eventId}\\]|\\[activity:[a-f0-9]{24}:${eventId}\\]|\\[indoor-session:[a-f0-9]{24}:${eventId}\\]`
    try {
      const postsWithMarker = await PostModel.find({ content: { $regex: markerRegex, $options: 'i' } })
      for (const post of postsWithMarker) {
        post.content = (post.content || '')
          .replace(new RegExp(`\\n?\\[sport-event:${eventId}\\]`, 'gi'), '')
          .replace(new RegExp(`\\n?\\[activity:[a-f0-9]{24}:${eventId}\\]`, 'gi'), '')
          .replace(new RegExp(`\\n?\\[indoor-session:[a-f0-9]{24}:${eventId}\\]`, 'gi'), '')
          .trim()
        await post.save()
      }
    } catch (err) {
      // Non-critical: don't break delete if cleanup fails
      console.error('Failed to clean post markers for sport event:', eventId, err)
    }

    return event
  }

  // Join sport event
  async joinSportEventService(eventId: string, userId: string) {
    const event = await SportEventModel.findById(eventId)

    if (!event) {
      throw new Error('Sport event not found')
    }

    if (event.participants_ids?.includes(new Types.ObjectId(userId))) {
      throw new Error('Already joined this event')
    }

    if (event.participants >= event.maxParticipants) {
      throw new Error('Event is full')
    }

    // Block joining ended events
    if (event.endDate && new Date(event.endDate) < new Date()) {
      throw new Error('Sự kiện đã kết thúc, không thể tham gia')
    }

    event.participants_ids?.push(new Types.ObjectId(userId))
    event.participants += 1

    await event.save()
    return event
  }

  // Leave sport event
  async leaveSportEventService(eventId: string, userId: string) {
    const event = await SportEventModel.findById(eventId)

    if (!event) {
      throw new Error('Sport event not found')
    }

    // Block creator from leaving — they must manage the event
    if (event.createdBy?.toString() === userId) {
      throw new Error('Người tạo sự kiện không thể rời khỏi sự kiện')
    }

    const index = event.participants_ids?.findIndex((id) => id.toString() === userId)

    if (index === undefined || index === -1) {
      throw new Error('Not joined this event')
    }

    event.participants_ids?.splice(index, 1)
    event.participants -= 1

    await event.save()
    return event
  }

  // Get my sport events
  async getMyEventsService(userId: string, page: number = 1, limit: number = 10, status?: string, search?: string) {
    const skip = (page - 1) * limit

    const condition: any = { createdBy: userId, isDeleted: { $ne: true } }

    if (search) {
      condition.name = { $regex: search, $options: 'i' }
    }

    const now = new Date()
    if (status === 'ongoing') {
      condition.startDate = { $lte: now }
      condition.endDate = { $gte: now }
    } else if (status === 'ended') {
      condition.endDate = { $lt: now }
    } else if (status === 'upcoming') {
      condition.startDate = { $gt: now }
    }

    const [events, total] = await Promise.all([
      SportEventModel.find(condition)
        .populate('createdBy', 'name avatar')
        .populate('participants_ids', 'name avatar')
        .skip(skip)
        .limit(limit)
        .sort({ startDate: status === 'ended' ? -1 : 1 })
        .exec(),
      SportEventModel.countDocuments(condition)
    ])

    const totalPage = Math.ceil(total / limit)

    return { events, totalPage, page, limit, total }
  }

  // Get event stats
  async getEventStatsService(userId: string, type: 'created' | 'joined') {
    const condition: any = { isDeleted: { $ne: true } }
    if (type === 'created') {
      condition.createdBy = userId
    } else {
      condition.participants_ids = new Types.ObjectId(userId)
    }

    const now = new Date()

    const [total, ongoing, upcoming, ended] = await Promise.all([
      SportEventModel.countDocuments(condition),
      SportEventModel.countDocuments({ ...condition, startDate: { $lte: now }, endDate: { $gte: now } }),
      SportEventModel.countDocuments({ ...condition, startDate: { $gt: now } }),
      SportEventModel.countDocuments({ ...condition, endDate: { $lt: now } })
    ])

    return { total, ongoing, upcoming, ended }
  }

  // Get joined sport events
  async getJoinedEventsService(userId: string, page: number = 1, limit: number = 10, status?: string, search?: string) {
    const skip = (page - 1) * limit

    const condition: any = { participants_ids: new Types.ObjectId(userId), isDeleted: { $ne: true } }

    // Search filter
    if (search) {
      condition.name = { $regex: search, $options: 'i' }
    }

    // Status filter
    const now = new Date()
    if (status === 'ongoing') {
      condition.startDate = { $lte: now }
      condition.endDate = { $gte: now }
    } else if (status === 'ended') {
      condition.endDate = { $lt: now }
    } else if (status === 'upcoming') {
      condition.startDate = { $gt: now }
    }

    const [events, total] = await Promise.all([
      SportEventModel.find(condition)
        .populate('createdBy', 'name avatar')
        .populate('participants_ids', 'name avatar')
        .skip(skip)
        .limit(limit)
        .sort({ startDate: status === 'ended' ? -1 : 1 })
        .exec(),
      SportEventModel.countDocuments(condition)
    ])

    const totalPage = Math.ceil(total / limit)

    return { events, totalPage, page, limit, total }
  }

  // Invite friend to sport event (creates a notification for the friend)
  async inviteFriendToEventService(eventId: string, inviterId: string, friendId: string) {
    const event = await SportEventModel.findById(eventId).populate('createdBy', 'name avatar')
    if (!event) {
      throw new Error('Sport event not found')
    }

    // Create notification for the friend
    const notification = new NotificationModel({
      sender_id: new Types.ObjectId(inviterId),
      receiver_id: new Types.ObjectId(friendId),
      content: `đã mời bạn tham gia sự kiện thể thao "${event.name}"`,
      name_notification: `Lời mời tham gia: ${event.name}`,
      link_id: eventId,
      type: NotificationTypes.sportEventInvite,
      is_read: false
    })

    await notification.save()
    return { notificationId: notification._id, eventId, friendId }
  }

  // Remove participant from sport event (creator only)
  async removeParticipantService(eventId: string, creatorId: string, targetUserId: string) {
    const event = await SportEventModel.findById(eventId)
    if (!event) {
      throw new Error('Sport event not found')
    }

    // Verify the requester is the event creator
    const eventCreatorId = event.createdBy?.toString()
    if (eventCreatorId !== creatorId) {
      throw new Error('Only the event creator can remove participants')
    }

    // Prevent kicking the event creator
    if (targetUserId === eventCreatorId) {
      throw new Error('Không thể xóa người tạo sự kiện')
    }

    // Check if the target user is actually a participant
    const index = event.participants_ids?.findIndex((id) => id.toString() === targetUserId)
    if (index === undefined || index === -1) {
      throw new Error('User is not a participant of this event')
    }

    // Remove participant
    event.participants_ids?.splice(index, 1)
    event.participants = Math.max(0, event.participants - 1)
    await event.save()

    // Send notification to the removed user
    const notification = new NotificationModel({
      sender_id: new Types.ObjectId(creatorId),
      receiver_id: new Types.ObjectId(targetUserId),
      content: `đã xóa bạn khỏi sự kiện thể thao "${event.name}"`,
      name_notification: `Bạn đã bị xóa khỏi sự kiện: ${event.name}`,
      link_id: eventId,
      type: NotificationTypes.sportEventInvite,
      is_read: false
    })
    await notification.save()

    // Return updated event with populated fields
    const updatedEvent = await SportEventModel.findById(eventId)
      .populate('createdBy', 'name avatar')
      .populate('participants_ids', 'name avatar')

    return updatedEvent
  }
}

const sportEventService = new SportEventService()
export default sportEventService
