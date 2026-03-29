import { Router } from 'express'
import { UserRoles } from '~/constants/enums'
import {
  acceptRequestUpgradeController,
  banUserByIdController,
  createWritterAndInspectorController,
  dashboardController,
  deleteUserByIdController,
  getAllUserController,
  getRequestUpgradeController,
  getUserByIdController,
  getUserStatsController,
  rejectRequestUpgradeController,
  restoreUserByIdController,
  unbanUserByIdController
} from '~/controllers/adminControllers/userAdmin.controller'
import {
  getAIUsageAnalyticsController,
  getCommunityAnalyticsController
} from '~/controllers/adminControllers/analytics.controller'
import { accessTokenValidator } from '~/middlewares/authUser.middleware'
import { checkRole } from '~/middlewares/roles.middleware'
import { createWritterAndInspectorValidator } from '~/middlewares/userAdmin.middleware'
import { wrapRequestHandler } from '~/utils/handler'

const userAdminRouter = Router()

userAdminRouter.get(
  '/',
  accessTokenValidator,
  wrapRequestHandler(checkRole([UserRoles.admin])),
  wrapRequestHandler(getAllUserController)
)



userAdminRouter.put(
  '/ban',
  accessTokenValidator,
  wrapRequestHandler(checkRole([UserRoles.admin])),
  wrapRequestHandler(banUserByIdController)
)

userAdminRouter.put(
  '/unban',
  accessTokenValidator,
  wrapRequestHandler(checkRole([UserRoles.admin])),
  wrapRequestHandler(unbanUserByIdController)
)

userAdminRouter.put(
  '/restore',
  accessTokenValidator,
  wrapRequestHandler(checkRole([UserRoles.admin])),
  wrapRequestHandler(restoreUserByIdController)
)

userAdminRouter.get(
  '/stats',
  accessTokenValidator,
  wrapRequestHandler(checkRole([UserRoles.admin])),
  wrapRequestHandler(getUserStatsController)
)

userAdminRouter.post(
  '/create-user',
  accessTokenValidator,
  wrapRequestHandler(checkRole([UserRoles.admin])),
  createWritterAndInspectorValidator,
  wrapRequestHandler(createWritterAndInspectorController)
)

userAdminRouter.get(
  '/request/upgrade-to-chef',
  accessTokenValidator,
  wrapRequestHandler(checkRole([UserRoles.admin])),
  wrapRequestHandler(getRequestUpgradeController)
)

userAdminRouter.put(
  '/request/reject-upgrade-to-chef',
  accessTokenValidator,
  wrapRequestHandler(checkRole([UserRoles.admin])),
  wrapRequestHandler(rejectRequestUpgradeController)
)

userAdminRouter.put(
  '/request/accept-upgrade-to-chef',
  accessTokenValidator,
  wrapRequestHandler(checkRole([UserRoles.admin])),
  wrapRequestHandler(acceptRequestUpgradeController)
)

userAdminRouter.get(
  '/analytics/ai-usage',
  accessTokenValidator,
  wrapRequestHandler(checkRole([UserRoles.admin])),
  wrapRequestHandler(getAIUsageAnalyticsController)
)

userAdminRouter.get(
  '/analytics/community',
  accessTokenValidator,
  wrapRequestHandler(checkRole([UserRoles.admin])),
  wrapRequestHandler(getCommunityAnalyticsController)
)

userAdminRouter.get(
  '/home/dashboard',
  accessTokenValidator,
  wrapRequestHandler(checkRole([UserRoles.admin])),
  wrapRequestHandler(dashboardController)
)

userAdminRouter.get(
  '/:id([0-9a-fA-F]{24})',
  accessTokenValidator,
  wrapRequestHandler(checkRole([UserRoles.admin])),
  wrapRequestHandler(getUserByIdController)
)

userAdminRouter.delete(
  '/:id([0-9a-fA-F]{24})',
  accessTokenValidator,
  wrapRequestHandler(checkRole([UserRoles.admin])),
  wrapRequestHandler(deleteUserByIdController)
)

export default userAdminRouter
