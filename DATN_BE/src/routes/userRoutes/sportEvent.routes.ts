import { Router } from 'express'
import {
  getAllSportEventsController,
  getSportEventController,
  createSportEventController,
  updateSportEventController,
  deleteSportEventController,
  joinSportEventController,
  leaveSportEventController,
  getMyEventsController,
  getJoinedEventsController
} from '~/controllers/userControllers/sportEvent.controller'
import { verifyToken, verifyTokenOptional } from '~/middlewares/authUser.middleware'
import { wrapRequestHandler } from '~/utils/handler'
import sportEventSessionRouter from './sportEventSession.routes'
import sportEventProgressRouter from './sportEventProgress.routes'
import sportEventPostRouter from './sportEventPost.routes'
import sportEventAttendanceRouter from './sportEventAttendance.routes'
import {
  createEventCommentController,
  getEventCommentsController,
  getEventChildCommentsController,
  deleteEventCommentController
} from '~/controllers/userControllers/sportEventComment.controller'
import {
  shareEventPostController
} from '~/controllers/userControllers/sportEventPost.controller'

const sportEventRouter = Router()

// Protected routes - MUST come before /:id routes
sportEventRouter.get('/user/my-events', verifyToken, wrapRequestHandler(getMyEventsController))
sportEventRouter.get('/user/joined-events', verifyToken, wrapRequestHandler(getJoinedEventsController))

// Public routes (with optional auth for isJoined status)
sportEventRouter.get('/', verifyTokenOptional, wrapRequestHandler(getAllSportEventsController))
sportEventRouter.get('/:id', verifyTokenOptional, wrapRequestHandler(getSportEventController))

// Protected routes - modify specific events
sportEventRouter.post('/', verifyToken, wrapRequestHandler(createSportEventController))
sportEventRouter.put('/:id', verifyToken, wrapRequestHandler(updateSportEventController))
sportEventRouter.delete('/:id', verifyToken, wrapRequestHandler(deleteSportEventController))
sportEventRouter.post('/:id/join', verifyToken, wrapRequestHandler(joinSportEventController))
sportEventRouter.post('/:id/leave', verifyToken, wrapRequestHandler(leaveSportEventController))

// Post Comments Routes
sportEventRouter.post('/posts/:postId/comments', verifyToken, wrapRequestHandler(createEventCommentController))
sportEventRouter.get('/posts/:postId/comments', wrapRequestHandler(getEventCommentsController))
sportEventRouter.get('/comments/:commentId/replies', wrapRequestHandler(getEventChildCommentsController))
sportEventRouter.delete('/comments/:commentId', verifyToken, wrapRequestHandler(deleteEventCommentController))

// Post Share Route
sportEventRouter.post('/posts/:postId/share', verifyToken, wrapRequestHandler(shareEventPostController))

// Sub-routers for event features
sportEventRouter.use('/:eventId/sessions', sportEventSessionRouter)
sportEventRouter.use('/:eventId/progress', sportEventProgressRouter)
sportEventRouter.use('/:eventId/posts', sportEventPostRouter)
sportEventRouter.use('/:eventId/sessions/:sessionId', sportEventAttendanceRouter)

export default sportEventRouter

