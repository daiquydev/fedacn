import { Router } from 'express'
import { getActiveEquipmentController } from '~/controllers/adminControllers/equipment.controller'
import { wrapRequestHandler } from '~/utils/handler'

const publicEquipmentRouter = Router()

// Public: get active equipment (no auth required)
publicEquipmentRouter.get('/', wrapRequestHandler(getActiveEquipmentController))

export default publicEquipmentRouter
