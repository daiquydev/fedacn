import { Router } from 'express'
import {
    createWorkoutSessionController,
    updateWorkoutSessionController,
    completeWorkoutSessionController,
    getWorkoutHistoryController,
    getWorkoutSessionByIdController,
    quitWorkoutSessionController
} from '~/controllers/userControllers/workoutSession.controller'
import { verifyToken } from '~/middlewares/authUser.middleware'
import { wrapRequestHandler } from '~/utils/handler'

const workoutSessionRouter = Router()

// All routes require authentication
workoutSessionRouter.get('/history', verifyToken, wrapRequestHandler(getWorkoutHistoryController))
workoutSessionRouter.get('/:id', verifyToken, wrapRequestHandler(getWorkoutSessionByIdController))
workoutSessionRouter.post('/', verifyToken, wrapRequestHandler(createWorkoutSessionController))
workoutSessionRouter.put('/:id', verifyToken, wrapRequestHandler(updateWorkoutSessionController))
workoutSessionRouter.put('/:id/complete', verifyToken, wrapRequestHandler(completeWorkoutSessionController))
workoutSessionRouter.put('/:id/quit', verifyToken, wrapRequestHandler(quitWorkoutSessionController))

export default workoutSessionRouter
