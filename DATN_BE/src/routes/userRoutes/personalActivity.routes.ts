import { Router } from 'express'
import {
    startPersonalActivityController,
    updatePersonalActivityController,
    completePersonalActivityController,
    discardPersonalActivityController,
    getUserPersonalActivitiesController
} from '~/controllers/userControllers/personalActivity.controller'
import { verifyToken } from '~/middlewares/authUser.middleware'
import { wrapRequestHandler } from '~/utils/handler'

const personalActivityRouter = Router()

// All routes require authentication
personalActivityRouter.post('/', verifyToken, wrapRequestHandler(startPersonalActivityController))
personalActivityRouter.get('/', verifyToken, wrapRequestHandler(getUserPersonalActivitiesController))
personalActivityRouter.put('/:id', verifyToken, wrapRequestHandler(updatePersonalActivityController))
personalActivityRouter.post('/:id/complete', verifyToken, wrapRequestHandler(completePersonalActivityController))
personalActivityRouter.post('/:id/discard', verifyToken, wrapRequestHandler(discardPersonalActivityController))

export default personalActivityRouter
