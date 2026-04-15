import { Router } from 'express'
import {
    adminGetAllSportEventsController,
    adminGetEventStatsController,
    adminGetSportEventParticipantsController,
    adminCreateSportEventController,
    adminUpdateSportEventController,
    adminDeleteSportEventController,
    adminRestoreSportEventController,
    adminHardDeleteSportEventController
} from '~/controllers/adminControllers/adminSportEvent.controller'
import { accessTokenValidator } from '~/middlewares/authUser.middleware'
import { checkRole } from '~/middlewares/roles.middleware'
import { UserRoles } from '~/constants/enums'
import { wrapRequestHandler } from '~/utils/handler'

const adminSportEventRouter = Router()

// All routes require admin role
adminSportEventRouter.use(accessTokenValidator, wrapRequestHandler(checkRole([UserRoles.admin])))

adminSportEventRouter.get('/stats', wrapRequestHandler(adminGetEventStatsController))
adminSportEventRouter.get('/:id/participants', wrapRequestHandler(adminGetSportEventParticipantsController))
adminSportEventRouter.get('/', wrapRequestHandler(adminGetAllSportEventsController))
adminSportEventRouter.post('/', wrapRequestHandler(adminCreateSportEventController))
adminSportEventRouter.put('/:id', wrapRequestHandler(adminUpdateSportEventController))
adminSportEventRouter.delete('/:id', wrapRequestHandler(adminDeleteSportEventController))
adminSportEventRouter.patch('/:id/restore', wrapRequestHandler(adminRestoreSportEventController))
adminSportEventRouter.delete('/:id/hard', wrapRequestHandler(adminHardDeleteSportEventController))

export default adminSportEventRouter
