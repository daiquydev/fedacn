import { Request, Response } from 'express'
import sportEventService from '~/services/userServices/sportEvent.services'

export const getAllSportEventsController = async (req: Request, res: Response) => {
  try {
    const { page, limit, search, category, sortBy, eventType, status, dateFrom, dateTo, joined } = req.query
    const userId = (req as any).decoded?.user_id
    const result = await sportEventService.getAllSportEventsService({
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      search: search as string,
      category: category as string,
      sortBy: sortBy as string,
      userId,
      eventType: eventType as string,
      status: status as string,
      dateFrom: dateFrom as string,
      dateTo: dateTo as string,
      joined: joined as string
    })
    return res.json({
      result,
      message: 'Get all sport events successfully'
    })
  } catch (error) {
    return res.status(500).json({
      message: (error as Error).message
    })
  }
}

export const getSportEventController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = (req as any).decoded?.user_id
    const event = await sportEventService.getSportEventService(id, userId)
    return res.json({
      result: event,
      message: 'Get sport event successfully'
    })
  } catch (error: any) {
    // Return 410 Gone if the event was soft-deleted (vs 404 for truly missing)
    if (error?.isDeleted) {
      return res.status(410).json({
        message: 'Sport event has been deleted',
        isDeleted: true
      })
    }
    return res.status(404).json({
      message: (error as Error).message
    })
  }
}

export const createSportEventController = async (req: Request, res: Response) => {
  try {
    const { name, description, detailedDescription, category, startDate, endDate, location, maxParticipants, image, eventType, targetValue, targetUnit, requirements, benefits } = req.body
    const decoded = (req as any).decoded
    const userId = decoded?.user_id

    if (!userId) {
      console.error('❌ No user ID in decoded token:', decoded)
      return res.status(401).json({
        message: 'Unauthorized: No user ID found'
      })
    }

    // Validate required fields
    if (!name || !description || !category || !startDate || !endDate || !location || !maxParticipants || !eventType) {
      return res.status(400).json({
        message: 'Missing required fields: name, description, category, startDate, endDate, location, maxParticipants, eventType'
      })
    }

    const event = await sportEventService.createSportEventService({
      name,
      description,
      detailedDescription,
      category,
      startDate,
      endDate,
      location,
      maxParticipants,
      image,
      createdBy: userId,
      eventType,
      targetValue: targetValue !== undefined ? Number(targetValue) : undefined,
      targetUnit,
      requirements,
      benefits
    })

    return res.status(201).json({
      result: event,
      message: 'Sport event created successfully'
    })
  } catch (error) {
    console.error('Error in createSportEventController:', error)
    return res.status(400).json({
      message: (error as Error).message || 'Error creating sport event'
    })
  }
}

export const updateSportEventController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = (req as any).decoded?.user_id
    const updateData = req.body

    // Check if user is the creator
    const event = await sportEventService.getSportEventService(id)
    const creatorId = (event.createdBy as any)._id || event.createdBy
    if (creatorId.toString() !== userId) {
      return res.status(403).json({
        message: 'You are not authorized to update this event'
      })
    }

    const updatedEvent = await sportEventService.updateSportEventService(id, updateData)
    return res.json({
      result: updatedEvent,
      message: 'Sport event updated successfully'
    })
  } catch (error) {
    return res.status(400).json({
      message: (error as Error).message
    })
  }
}

export const deleteSportEventController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = (req as any).decoded?.user_id

    // Check if user is the creator
    const event = await sportEventService.getSportEventService(id)
    const creatorId = (event.createdBy as any)._id || event.createdBy
    if (creatorId.toString() !== userId) {
      return res.status(403).json({
        message: 'You are not authorized to delete this event'
      })
    }

    await sportEventService.deleteSportEventService(id)
    return res.json({
      message: 'Sport event deleted successfully'
    })
  } catch (error) {
    return res.status(400).json({
      message: (error as Error).message
    })
  }
}

export const joinSportEventController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = (req as any).decoded?.user_id

    if (!userId) {
      return res.status(401).json({
        message: 'Unauthorized'
      })
    }

    const event = await sportEventService.joinSportEventService(id, userId)
    return res.json({
      result: event,
      message: 'Joined sport event successfully'
    })
  } catch (error) {
    return res.status(400).json({
      message: (error as Error).message
    })
  }
}

export const leaveSportEventController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = (req as any).decoded?.user_id

    if (!userId) {
      return res.status(401).json({
        message: 'Unauthorized'
      })
    }

    const event = await sportEventService.leaveSportEventService(id, userId)
    return res.json({
      result: event,
      message: 'Left sport event successfully'
    })
  } catch (error) {
    return res.status(400).json({
      message: (error as Error).message
    })
  }
}

export const getMyEventsController = async (req: Request, res: Response) => {
  try {
    const { page, limit } = req.query
    const userId = (req as any).decoded?.user_id

    if (!userId) {
      return res.status(401).json({
        message: 'Unauthorized'
      })
    }

    const result = await sportEventService.getMyEventsService(userId, Number(page) || 1, Number(limit) || 10)
    return res.json({
      result,
      message: 'Get my sport events successfully'
    })
  } catch (error) {
    return res.status(500).json({
      message: (error as Error).message
    })
  }
}

export const getJoinedEventsController = async (req: Request, res: Response) => {
  try {
    const { page, limit, status } = req.query
    const userId = (req as any).decoded?.user_id

    if (!userId) {
      return res.status(401).json({
        message: 'Unauthorized'
      })
    }

    const result = await sportEventService.getJoinedEventsService(userId, Number(page) || 1, Number(limit) || 10, status as string)
    return res.json({
      result,
      message: 'Get joined sport events successfully'
    })
  } catch (error) {
    return res.status(500).json({
      message: (error as Error).message
    })
  }
}

export const inviteFriendToEventController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { friendId } = req.body
    const userId = (req as any).decoded?.user_id

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' })
    }
    if (!friendId) {
      return res.status(400).json({ message: 'friendId is required' })
    }

    const result = await sportEventService.inviteFriendToEventService(id, userId, friendId)
    return res.json({
      result,
      message: 'Invitation sent successfully'
    })
  } catch (error) {
    return res.status(400).json({
      message: (error as Error).message
    })
  }
}

export const getPublicUserEventsController = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params
    const { page, limit } = req.query

    const result = await sportEventService.getJoinedEventsService(userId, Number(page) || 1, Number(limit) || 20)
    return res.json({
      result,
      message: 'Get user joined events successfully'
    })
  } catch (error) {
    return res.status(500).json({
      message: (error as Error).message
    })
  }
}

export const removeParticipantController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { targetUserId } = req.body
    const userId = (req as any).decoded?.user_id

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' })
    }
    if (!targetUserId) {
      return res.status(400).json({ message: 'targetUserId is required' })
    }

    const result = await sportEventService.removeParticipantService(id, userId, targetUserId)
    return res.json({
      result,
      message: 'Participant removed successfully'
    })
  } catch (error) {
    return res.status(400).json({
      message: (error as Error).message
    })
  }
}
