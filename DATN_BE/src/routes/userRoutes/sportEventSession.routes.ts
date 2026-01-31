import { Router } from 'express'
import {
  getEventSessionsController,
  getSessionController,
  createSessionController,
  updateSessionController,
  deleteSessionController,
  getNextSessionController,
  markSessionCompletedController
} from '~/controllers/userControllers/sportEventSession.controller'
import { verifyToken } from '~/middlewares/authUser.middleware'
import { wrapRequestHandler } from '~/utils/handler'

const sportEventSessionRouter = Router({ mergeParams: true })

// Public routes
sportEventSessionRouter.get('/', wrapRequestHandler(getEventSessionsController))
sportEventSessionRouter.get('/next', wrapRequestHandler(getNextSessionController))
sportEventSessionRouter.get('/:sessionId', wrapRequestHandler(getSessionController))

// Protected routes - creator only
sportEventSessionRouter.post('/', verifyToken, wrapRequestHandler(createSessionController))
sportEventSessionRouter.put('/:sessionId', verifyToken, wrapRequestHandler(updateSessionController))
sportEventSessionRouter.delete('/:sessionId', verifyToken, wrapRequestHandler(deleteSessionController))
sportEventSessionRouter.post('/:sessionId/complete', verifyToken, wrapRequestHandler(markSessionCompletedController))

export default sportEventSessionRouter
