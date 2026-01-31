import SportEventModel, { SportEvent } from '~/models/schemas/sportEvent.schema'
import SportEventSessionModel from '~/models/schemas/sportEventSession.schema'
import { Types } from 'mongoose'

class SportEventService {
  // Get all sport events
  async getAllSportEventsService({
    page = 1,
    limit = 10,
    search,
    category,
    sortBy = 'popular',
    userId
  }: {
    page?: number
    limit?: number
    search?: string
    category?: string
    sortBy?: string
    userId?: string
  }) {
    const condition: any = {}

    if (search) {
      condition.$text = { $search: search }
    }

    if (category && category !== 'all') {
      condition.category = category
    }

    const skip = (page - 1) * limit

    let query = SportEventModel.find(condition)
      .populate('createdBy', 'name avatar')
      .populate('participants_ids', 'name avatar')
      .skip(skip)
      .limit(limit)

    // Sort logic
    if (sortBy === 'popular') {
      query = query.sort({ participants: -1 })
    } else if (sortBy === 'newest') {
      query = query.sort({ createdAt: -1 })
    } else if (sortBy === 'earliest') {
      query = query.sort({ startDate: 1 })
    }

    const events = await query.exec()
    const total = await SportEventModel.countDocuments(condition)
    const totalPage = Math.ceil(total / limit)

    // Calculate isJoined if userId is provided
    const resultEvents = events.map((event) => {
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
    })

    return { events: resultEvents, totalPage, page, limit, total }
  }

  // Get single sport event
  async getSportEventService(eventId: string, userId?: string) {
    const event = await SportEventModel.findById(eventId)
      .populate('createdBy', 'name avatar email')
      .populate('participants_ids', 'name avatar')

    if (!event) {
      throw new Error('Sport event not found')
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
    category,
    startDate,
    endDate,
    location,
    maxParticipants,
    image,
    createdBy,
    eventType
  }: {
    name: string
    description: string
    category: string
    startDate: Date
    endDate: Date
    location: string
    maxParticipants: number
    image: string
    createdBy: string
    eventType: 'online' | 'offline'
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
      category,
      startDate: start,
      endDate: end,
      location,
      maxParticipants,
      image,
      createdBy,
      eventType,
      participants: 0,
      participants_ids: []
    })

    try {
      await newEvent.save()

      // Auto-generate sessions for Online events
      if (eventType === 'online') {
        console.log('Creating Online Event - Generating Sessions...')
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
    const event = await SportEventModel.findByIdAndUpdate(eventId, updateData, { new: true })
      .populate('createdBy', 'name avatar')
      .populate('participants_ids', 'name avatar')

    if (!event) {
      throw new Error('Sport event not found')
    }

    return event
  }

  // Delete sport event
  async deleteSportEventService(eventId: string) {
    const event = await SportEventModel.findByIdAndDelete(eventId)

    if (!event) {
      throw new Error('Sport event not found')
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
  async getMyEventsService(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit

    const events = await SportEventModel.find({ createdBy: userId })
      .populate('createdBy', 'name avatar')
      .populate('participants_ids', 'name avatar')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })

    const total = await SportEventModel.countDocuments({ createdBy: userId })
    const totalPage = Math.ceil(total / limit)

    return { events, totalPage, page, limit, total }
  }

  // Get joined sport events
  async getJoinedEventsService(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit

    const events = await SportEventModel.find({ participants_ids: new Types.ObjectId(userId) })
      .populate('createdBy', 'name avatar')
      .populate('participants_ids', 'name avatar')
      .skip(skip)
      .limit(limit)
      .sort({ startDate: 1 })

    const total = await SportEventModel.countDocuments({ participants_ids: new Types.ObjectId(userId) })
    const totalPage = Math.ceil(total / limit)

    return { events, totalPage, page, limit, total }
  }
}

const sportEventService = new SportEventService()
export default sportEventService
