import { Router } from 'express'
import {
  addProgressController,
  getUserProgressController,
  getLeaderboardController,
  getParticipantsController,
  updateProgressController,
  deleteProgressController,
  getEventOverallProgressController,
  getParticipantProgressHistoryForCreatorController
} from '~/controllers/userControllers/sportEventProgress.controller'
import { verifyToken } from '~/middlewares/authUser.middleware'
import { wrapRequestHandler } from '~/utils/handler'

const sportEventProgressRouter = Router({ mergeParams: true })

// Protected routes - require authentication
sportEventProgressRouter.post('/', verifyToken, wrapRequestHandler(addProgressController))
sportEventProgressRouter.get('/', verifyToken, wrapRequestHandler(getUserProgressController))
sportEventProgressRouter.get(
  '/participant/:targetUserId',
  verifyToken,
  wrapRequestHandler(getParticipantProgressHistoryForCreatorController)
)
sportEventProgressRouter.put('/:progressId', verifyToken, wrapRequestHandler(updateProgressController))
sportEventProgressRouter.delete('/:progressId', verifyToken, wrapRequestHandler(deleteProgressController))

// Public routes for leaderboard, participants and overall progress
sportEventProgressRouter.get('/leaderboard', wrapRequestHandler(getLeaderboardController))
sportEventProgressRouter.get('/participants', wrapRequestHandler(getParticipantsController))
sportEventProgressRouter.get('/overall', wrapRequestHandler(getEventOverallProgressController))

export default sportEventProgressRouter
