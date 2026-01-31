import SportEventSessionModel, { SportEventSession } from '~/models/schemas/sportEventSession.schema'
import SportEventModel from '~/models/schemas/sportEvent.schema'
import { Types } from 'mongoose'

class SportEventSessionService {
  // Get all sessions for an event
  async getEventSessionsService(eventId: string) {
    const sessions = await SportEventSessionModel.find({ eventId })
      .sort({ sessionDate: 1 })
      .exec()

    return sessions
  }

  // Get a specific session
  async getSessionService(eventId: string, sessionId: string) {
    const session = await SportEventSessionModel.findOne({
      _id: sessionId,
      eventId
    })

    if (!session) {
      throw new Error('Session not found')
    }

    return session
  }

  // Create a new session
  async createSessionService({
    eventId,
    sessionNumber,
    title,
    description,
    sessionDate,
    durationHours,
    videoCallUrl,
    maxParticipants
  }: {
    eventId: string
    sessionNumber: number
    title: string
    description?: string
    sessionDate: Date
    durationHours: number
    videoCallUrl?: string
    maxParticipants?: number
  }) {
    // Verify event exists and is online
    const event = await SportEventModel.findById(eventId)
    if (!event) {
      throw new Error('Event not found')
    }

    if (event.eventType !== 'online') {
      throw new Error('Sessions can only be created for online events')
    }

    // Check if session number already exists
    const existingSession = await SportEventSessionModel.findOne({
      eventId,
      sessionNumber
    })

    if (existingSession) {
      throw new Error(`Session number ${sessionNumber} already exists for this event`)
    }

    // Validate session date
    const sessionStart = new Date(sessionDate)
    const eventStart = new Date(event.startDate)
    const eventEnd = new Date(event.endDate)

    if (sessionStart < eventStart || sessionStart > eventEnd) {
      throw new Error('Session date must be within event start and end dates')
    }

    const newSession = new SportEventSessionModel({
      eventId,
      sessionNumber,
      title,
      description,
      sessionDate: sessionStart,
      durationHours,
      videoCallUrl,
      maxParticipants,
      isCompleted: false
    })

    await newSession.save()
    return newSession
  }

  // Update a session
  async updateSessionService(
    eventId: string,
    sessionId: string,
    updateData: Partial<SportEventSession>
  ) {
    const session = await SportEventSessionModel.findOneAndUpdate(
      { _id: sessionId, eventId },
      updateData,
      { new: true }
    )

    if (!session) {
      throw new Error('Session not found')
    }

    return session
  }

  // Delete a session
  async deleteSessionService(eventId: string, sessionId: string) {
    const session = await SportEventSessionModel.findOneAndDelete({
      _id: sessionId,
      eventId
    })

    if (!session) {
      throw new Error('Session not found')
    }

    return session
  }

  // Get next upcoming session for an event
  async getNextSessionService(eventId: string) {
    const now = new Date()

    const nextSession = await SportEventSessionModel.findOne({
      eventId,
      isCompleted: false,
      sessionDate: { $gte: now }
    })
      .sort({ sessionDate: 1 })
      .exec()

    return nextSession
  }

  // Mark session as completed
  async markSessionCompletedService(eventId: string, sessionId: string) {
    const session = await SportEventSessionModel.findOneAndUpdate(
      { _id: sessionId, eventId },
      { isCompleted: true },
      { new: true }
    )

    if (!session) {
      throw new Error('Session not found')
    }

    return session
  }
}

const sportEventSessionService = new SportEventSessionService()
export default sportEventSessionService
