import { Router } from 'express'
import {
  getChallengesController,
  getChallengeController,
  createChallengeController,
  updateChallengeController,
  deleteChallengeController,
  joinChallengeController,
  quitChallengeController,
  getMyChallengesController,
  getLeaderboardController
} from '~/controllers/userControllers/challenge.controller'
import { verifyToken, verifyTokenOptional } from '~/middlewares/authUser.middleware'
import { wrapRequestHandler } from '~/utils/handler'

const challengeRouter = Router()

// Protected user-specific routes — MUST come before /:id
challengeRouter.get('/my', verifyToken, wrapRequestHandler(getMyChallengesController))

// Public routes (with optional auth for isJoined status)
challengeRouter.get('/', verifyTokenOptional, wrapRequestHandler(getChallengesController))
challengeRouter.get('/:id', verifyTokenOptional, wrapRequestHandler(getChallengeController))

// Protected CRUD
challengeRouter.post('/', verifyToken, wrapRequestHandler(createChallengeController))
challengeRouter.put('/:id', verifyToken, wrapRequestHandler(updateChallengeController))
challengeRouter.delete('/:id', verifyToken, wrapRequestHandler(deleteChallengeController))

// Participation
challengeRouter.post('/:id/join', verifyToken, wrapRequestHandler(joinChallengeController))
challengeRouter.post('/:id/quit', verifyToken, wrapRequestHandler(quitChallengeController))

// Leaderboard
challengeRouter.get('/:id/leaderboard', verifyTokenOptional, wrapRequestHandler(getLeaderboardController))

export default challengeRouter
