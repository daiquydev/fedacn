import { Router } from 'express'
import {
    joinVideoSessionController,
    endVideoSessionController,
    getVideoSessionsController,
    getVideoSessionByIdController,
    getActiveVideoSessionController,
    getVideoSessionStatsController,
    softDeleteVideoSessionController
} from '~/controllers/userControllers/sportEventVideoSession.controller'
import { verifyToken } from '~/middlewares/authUser.middleware'
import { wrapRequestHandler } from '~/utils/handler'

const videoSessionRouter = Router({ mergeParams: true })

// All video-session routes require authentication
videoSessionRouter.post('/join', verifyToken, wrapRequestHandler(joinVideoSessionController))
videoSessionRouter.get('/active', verifyToken, wrapRequestHandler(getActiveVideoSessionController))
videoSessionRouter.get('/stats', verifyToken, wrapRequestHandler(getVideoSessionStatsController))
videoSessionRouter.get('/:vsId', verifyToken, wrapRequestHandler(getVideoSessionByIdController))
videoSessionRouter.get('/', verifyToken, wrapRequestHandler(getVideoSessionsController))
videoSessionRouter.post('/:vsId/end', verifyToken, wrapRequestHandler(endVideoSessionController))
videoSessionRouter.patch('/:vsId/soft-delete', verifyToken, wrapRequestHandler(softDeleteVideoSessionController))

export default videoSessionRouter
