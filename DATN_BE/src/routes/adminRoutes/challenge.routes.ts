import { Router } from 'express'
import {
    adminGetChallengesController,
    adminGetChallengeStatsController,
    adminDeleteChallengeController,
    adminRestoreChallengeController
} from '~/controllers/adminControllers/adminChallenge.controller'
import { accessTokenValidator } from '~/middlewares/authUser.middleware'
import { checkRole } from '~/middlewares/roles.middleware'
import { UserRoles } from '~/constants/enums'
import { wrapRequestHandler } from '~/utils/handler'
import {
    getParticipantsController,
    getLeaderboardController
} from '~/controllers/userControllers/challenge.controller'

const adminChallengeRouter = Router()

// All routes require admin auth
adminChallengeRouter.use(accessTokenValidator, wrapRequestHandler(checkRole([UserRoles.admin])))

adminChallengeRouter.get('/stats', wrapRequestHandler(adminGetChallengeStatsController))
adminChallengeRouter.get('/', wrapRequestHandler(adminGetChallengesController))
adminChallengeRouter.delete('/:id', wrapRequestHandler(adminDeleteChallengeController))
adminChallengeRouter.patch('/:id/restore', wrapRequestHandler(adminRestoreChallengeController))
adminChallengeRouter.get('/:id/participants', wrapRequestHandler(getParticipantsController))
adminChallengeRouter.get('/:id/leaderboard', wrapRequestHandler(getLeaderboardController))

export default adminChallengeRouter
