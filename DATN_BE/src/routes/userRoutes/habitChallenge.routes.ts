import { Router } from 'express'
import {
  getAllHabitChallengesController,
  getHabitChallengeController,
  createHabitChallengeController,
  updateHabitChallengeController,
  deleteHabitChallengeController,
  joinHabitChallengeController,
  quitHabitChallengeController,
  setBuddyController,
  getMyHabitChallengesController,
  checkinController,
  getCheckinsController,
  getCheckinFeedController,
  likeCheckinController,
  getParticipantsController,
  getUserBadgesController,
  getBadgesForChallengeController,
  getUserChallengeProfileController,
  getLeaderboardController,
  useStreakFreezeController
} from '~/controllers/userControllers/habitChallenge.controller'
import { verifyToken, verifyTokenOptional } from '~/middlewares/authUser.middleware'
import { wrapRequestHandler } from '~/utils/handler'

const habitChallengeRouter = Router()

// Protected user-specific routes — MUST come before /:id
habitChallengeRouter.get('/user/my-challenges', verifyToken, wrapRequestHandler(getMyHabitChallengesController))
habitChallengeRouter.get('/user/badges', verifyToken, wrapRequestHandler(getUserBadgesController))
habitChallengeRouter.get('/user/profile', verifyToken, wrapRequestHandler(getUserChallengeProfileController))

// Leaderboard (with optional auth)
habitChallengeRouter.get('/leaderboard', verifyTokenOptional, wrapRequestHandler(getLeaderboardController))

// Public routes (with optional auth for isJoined status)
habitChallengeRouter.get('/', verifyTokenOptional, wrapRequestHandler(getAllHabitChallengesController))
habitChallengeRouter.get('/:id', verifyTokenOptional, wrapRequestHandler(getHabitChallengeController))

// Protected CRUD
habitChallengeRouter.post('/', verifyToken, wrapRequestHandler(createHabitChallengeController))
habitChallengeRouter.put('/:id', verifyToken, wrapRequestHandler(updateHabitChallengeController))
habitChallengeRouter.delete('/:id', verifyToken, wrapRequestHandler(deleteHabitChallengeController))

// Participation
habitChallengeRouter.post('/:id/join', verifyToken, wrapRequestHandler(joinHabitChallengeController))
habitChallengeRouter.post('/:id/quit', verifyToken, wrapRequestHandler(quitHabitChallengeController))
habitChallengeRouter.post('/:id/set-buddy', verifyToken, wrapRequestHandler(setBuddyController))
habitChallengeRouter.get('/:id/participants', verifyToken, wrapRequestHandler(getParticipantsController))

// Streak Freeze
habitChallengeRouter.post('/:id/streak-freeze', verifyToken, wrapRequestHandler(useStreakFreezeController))

// Check-in
habitChallengeRouter.post('/:id/checkin', verifyToken, wrapRequestHandler(checkinController))
habitChallengeRouter.get('/:id/checkins', verifyToken, wrapRequestHandler(getCheckinsController))
habitChallengeRouter.get('/:id/checkins/feed', verifyTokenOptional, wrapRequestHandler(getCheckinFeedController))
habitChallengeRouter.post('/:id/checkins/:checkinId/like', verifyToken, wrapRequestHandler(likeCheckinController))

// Badges
habitChallengeRouter.get('/:id/badges', verifyToken, wrapRequestHandler(getBadgesForChallengeController))

export default habitChallengeRouter
