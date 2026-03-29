import { Router } from 'express'
import {
    getTrainingsController,
    getTrainingController,
    createTrainingController,
    updateTrainingController,
    deleteTrainingController,
    joinTrainingController,
    quitTrainingController,
    getMyTrainingsController,
    getLeaderboardController
} from '~/controllers/userControllers/training.controller'
import { verifyToken, verifyTokenOptional } from '~/middlewares/authUser.middleware'
import { wrapRequestHandler } from '~/utils/handler'

const trainingRouter = Router()

// Protected user-specific routes — MUST come before /:id
trainingRouter.get('/my', verifyToken, wrapRequestHandler(getMyTrainingsController))

// Public routes (with optional auth for isJoined status)
trainingRouter.get('/', verifyTokenOptional, wrapRequestHandler(getTrainingsController))
trainingRouter.get('/:id', verifyTokenOptional, wrapRequestHandler(getTrainingController))

// Protected CRUD
trainingRouter.post('/', verifyToken, wrapRequestHandler(createTrainingController))
trainingRouter.put('/:id', verifyToken, wrapRequestHandler(updateTrainingController))
trainingRouter.delete('/:id', verifyToken, wrapRequestHandler(deleteTrainingController))

// Participation
trainingRouter.post('/:id/join', verifyToken, wrapRequestHandler(joinTrainingController))
trainingRouter.post('/:id/quit', verifyToken, wrapRequestHandler(quitTrainingController))

// Leaderboard
trainingRouter.get('/:id/leaderboard', verifyTokenOptional, wrapRequestHandler(getLeaderboardController))

export default trainingRouter
