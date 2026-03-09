import { Router } from 'express'
import {
    getEquipmentController,
    createEquipmentController,
    updateEquipmentController,
    deleteEquipmentController
} from '~/controllers/adminControllers/equipment.controller'
import { accessTokenValidator } from '~/middlewares/authUser.middleware'
import { checkRole } from '~/middlewares/roles.middleware'
import { UserRoles } from '~/constants/enums'
import { wrapRequestHandler } from '~/utils/handler'

const adminEquipmentRouter = Router()

adminEquipmentRouter.use(accessTokenValidator, wrapRequestHandler(checkRole([UserRoles.admin])))

adminEquipmentRouter.get('/', wrapRequestHandler(getEquipmentController))
adminEquipmentRouter.post('/', wrapRequestHandler(createEquipmentController))
adminEquipmentRouter.put('/:id', wrapRequestHandler(updateEquipmentController))
adminEquipmentRouter.delete('/:id', wrapRequestHandler(deleteEquipmentController))

export default adminEquipmentRouter
