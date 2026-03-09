import { Router } from 'express'
import {
    startActivityController,
    updateActivityController,
    completeActivityController,
    discardActivityController,
    getActivityController,
    getUserActivitiesController
} from '~/controllers/userControllers/activityTracking.controller'
import { verifyToken } from '~/middlewares/authUser.middleware'
import { wrapRequestHandler } from '~/utils/handler'

const activityTrackingRouter = Router({ mergeParams: true })

// All routes require authentication
activityTrackingRouter.post('/', verifyToken, wrapRequestHandler(startActivityController))
activityTrackingRouter.get('/', verifyToken, wrapRequestHandler(getUserActivitiesController))
activityTrackingRouter.get('/:id', verifyToken, wrapRequestHandler(getActivityController))
activityTrackingRouter.put('/:id', verifyToken, wrapRequestHandler(updateActivityController))
activityTrackingRouter.post('/:id/complete', verifyToken, wrapRequestHandler(completeActivityController))
activityTrackingRouter.post('/:id/discard', verifyToken, wrapRequestHandler(discardActivityController))

export default activityTrackingRouter
