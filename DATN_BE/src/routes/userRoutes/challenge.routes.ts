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
    getMyCreatedChallengesController,
    getChallengeStatsController,
    addProgressController,
    getProgressController,
    getLeaderboardController,
    getParticipantsController,
    getUserProgressController,
    getChallengeActivityController,
    getChallengeProgressEntryController,
    deleteProgressController,
    getPublicUserChallengesController,
    getFeedController,
    inviteFriendToChallengeController,
    reportChallengeController
} from '~/controllers/userControllers/challenge.controller'
import {
    createChallengeDayCommentController,
    getChallengeDayCommentsController,
    getChallengeDayChildCommentsController,
    deleteChallengeDayCommentController
} from '~/controllers/userControllers/challengeDayComment.controller'
import { verifyToken, verifyTokenOptional } from '~/middlewares/authUser.middleware'
import { wrapRequestHandler } from '~/utils/handler'

const challengeRouter = Router()

// Protected user-specific routes — MUST come before /:id
challengeRouter.get('/stats', verifyToken, wrapRequestHandler(getChallengeStatsController))
challengeRouter.get('/my', verifyToken, wrapRequestHandler(getMyChallengesController))
challengeRouter.get('/my-created', verifyToken, wrapRequestHandler(getMyCreatedChallengesController))
challengeRouter.get('/user/:userId/joined', wrapRequestHandler(getPublicUserChallengesController))
// Feed endpoint - scope-based (public/friends/mine)
challengeRouter.get('/feed', verifyTokenOptional, wrapRequestHandler(getFeedController))

// Public routes (with optional auth for isJoined status)
challengeRouter.get('/', verifyTokenOptional, wrapRequestHandler(getChallengesController))
challengeRouter.get('/:id', verifyTokenOptional, wrapRequestHandler(getChallengeController))

// Protected CRUD
challengeRouter.post('/', verifyToken, wrapRequestHandler(createChallengeController))
challengeRouter.put('/:id', verifyToken, wrapRequestHandler(updateChallengeController))
challengeRouter.delete('/:id', verifyToken, wrapRequestHandler(deleteChallengeController))

// Report (moderation) — before other /:id POST handlers
challengeRouter.post('/:id/report', verifyToken, wrapRequestHandler(reportChallengeController))

// Participation
challengeRouter.post('/:id/join', verifyToken, wrapRequestHandler(joinChallengeController))
challengeRouter.post('/:id/quit', verifyToken, wrapRequestHandler(quitChallengeController))
challengeRouter.post('/:id/invite', verifyToken, wrapRequestHandler(inviteFriendToChallengeController))

// Progress
challengeRouter.post('/:id/progress', verifyToken, wrapRequestHandler(addProgressController))
challengeRouter.get('/:id/progress', verifyTokenOptional, wrapRequestHandler(getProgressController))
challengeRouter.patch('/:id/progress/:progressId/soft-delete', verifyToken, wrapRequestHandler(deleteProgressController))

// Leaderboard
challengeRouter.get('/:id/leaderboard', verifyTokenOptional, wrapRequestHandler(getLeaderboardController))

// Participants
challengeRouter.get('/:id/participants', verifyTokenOptional, wrapRequestHandler(getParticipantsController))
challengeRouter.get('/:id/progress-entry/:progressId', verifyTokenOptional, wrapRequestHandler(getChallengeProgressEntryController))
challengeRouter.get('/:id/progress/:userId', verifyTokenOptional, wrapRequestHandler(getUserProgressController))

// GPS Activity detail (for map modal)
challengeRouter.get('/:id/activity/:activityId', verifyTokenOptional, wrapRequestHandler(getChallengeActivityController))

// Day Comments
challengeRouter.post('/:id/day-comments', verifyToken, wrapRequestHandler(createChallengeDayCommentController))
challengeRouter.get('/:id/day-comments', verifyTokenOptional, wrapRequestHandler(getChallengeDayCommentsController))
challengeRouter.get('/:id/day-comments/:commentId/replies', verifyTokenOptional, wrapRequestHandler(getChallengeDayChildCommentsController))
challengeRouter.delete('/:id/day-comments/:commentId', verifyToken, wrapRequestHandler(deleteChallengeDayCommentController))

export default challengeRouter
