import { Request, Response } from 'express'
import sportEventService from '~/services/userServices/sportEvent.services'

export const getAllSportEventsController = async (req: Request, res: Response) => {
  try {
    const { page, limit, search, category, sortBy } = req.query
    const userId = (req as any).decoded?.user_id
    const result = await sportEventService.getAllSportEventsService({
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      search: search as string,
      category: category as string,
      sortBy: sortBy as string,
      userId
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
  } catch (error) {
    return res.status(404).json({
      message: (error as Error).message
    })
  }
}

export const createSportEventController = async (req: Request, res: Response) => {
  try {
    const { name, description, category, startDate, endDate, location, maxParticipants, image, eventType } = req.body
    const decoded = (req as any).decoded
    console.log('📋 Create Sport Event - Decoded token:', { user_id: decoded?.user_id, role: decoded?.role })
    
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
      category,
      startDate,
      endDate,
      location,
      maxParticipants,
      image,
      createdBy: userId,
      eventType
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
    const { page, limit } = req.query
    const userId = (req as any).decoded?.user_id

    if (!userId) {
      return res.status(401).json({
        message: 'Unauthorized'
      })
    }

    const result = await sportEventService.getJoinedEventsService(userId, Number(page) || 1, Number(limit) || 10)
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
