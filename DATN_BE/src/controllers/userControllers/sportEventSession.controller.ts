import { Request, Response } from 'express'
import sportEventSessionService from '~/services/userServices/sportEventSession.services'
import SportEventModel from '~/models/schemas/sportEvent.schema'

export const getEventSessionsController = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params
    const sessions = await sportEventSessionService.getEventSessionsService(eventId)
    
    return res.json({
      result: sessions,
      message: 'Get event sessions successfully'
    })
  } catch (error) {
    return res.status(500).json({
      message: (error as Error).message
    })
  }
}

export const getSessionController = async (req: Request, res: Response) => {
  try {
    const { eventId, sessionId } = req.params
    const session = await sportEventSessionService.getSessionService(eventId, sessionId)
    
    return res.json({
      result: session,
      message: 'Get session successfully'
    })
  } catch (error) {
    return res.status(404).json({
      message: (error as Error).message
    })
  }
}

export const createSessionController = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params
    const userId = (req as any).decoded?.user_id
    const { sessionNumber, title, description, sessionDate, durationHours, videoCallUrl, maxParticipants } = req.body

    // Verify user is the event creator
    const event = await SportEventModel.findById(eventId)
    if (!event) {
      return res.status(404).json({ message: 'Event not found' })
    }

    if (event.createdBy.toString() !== userId) {
      return res.status(403).json({ message: 'Only event creator can create sessions' })
    }

    const session = await sportEventSessionService.createSessionService({
      eventId,
      sessionNumber,
      title,
      description,
      sessionDate,
      durationHours,
      videoCallUrl,
      maxParticipants
    })

    return res.status(201).json({
      result: session,
      message: 'Session created successfully'
    })
  } catch (error) {
    return res.status(400).json({
      message: (error as Error).message
    })
  }
}

export const updateSessionController = async (req: Request, res: Response) => {
  try {
    const { eventId, sessionId } = req.params
    const userId = (req as any).decoded?.user_id
    const updateData = req.body

    // Verify user is the event creator
    const event = await SportEventModel.findById(eventId)
    if (!event) {
      return res.status(404).json({ message: 'Event not found' })
    }

    if (event.createdBy.toString() !== userId) {
      return res.status(403).json({ message: 'Only event creator can update sessions' })
    }

    const session = await sportEventSessionService.updateSessionService(eventId, sessionId, updateData)

    return res.json({
      result: session,
      message: 'Session updated successfully'
    })
  } catch (error) {
    return res.status(400).json({
      message: (error as Error).message
    })
  }
}

export const deleteSessionController = async (req: Request, res: Response) => {
  try {
    const { eventId, sessionId } = req.params
    const userId = (req as any).decoded?.user_id

    // Verify user is the event creator
    const event = await SportEventModel.findById(eventId)
    if (!event) {
      return res.status(404).json({ message: 'Event not found' })
    }

    if (event.createdBy.toString() !== userId) {
      return res.status(403).json({ message: 'Only event creator can delete sessions' })
    }

    await sportEventSessionService.deleteSessionService(eventId, sessionId)

    return res.json({
      message: 'Session deleted successfully'
    })
  } catch (error) {
    return res.status(400).json({
      message: (error as Error).message
    })
  }
}

export const getNextSessionController = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params
    const nextSession = await sportEventSessionService.getNextSessionService(eventId)
    
    return res.json({
      result: nextSession,
      message: 'Get next session successfully'
    })
  } catch (error) {
    return res.status(500).json({
      message: (error as Error).message
    })
  }
}

export const markSessionCompletedController = async (req: Request, res: Response) => {
  try {
    const { eventId, sessionId } = req.params
    const userId = (req as any).decoded?.user_id

    // Verify user is the event creator
    const event = await SportEventModel.findById(eventId)
    if (!event) {
      return res.status(404).json({ message: 'Event not found' })
    }

    if (event.createdBy.toString() !== userId) {
      return res.status(403).json({ message: 'Only event creator can mark sessions as completed' })
    }

    const session = await sportEventSessionService.markSessionCompletedService(eventId, sessionId)

    return res.json({
      result: session,
      message: 'Session marked as completed'
    })
  } catch (error) {
    return res.status(400).json({
      message: (error as Error).message
    })
  }
}
