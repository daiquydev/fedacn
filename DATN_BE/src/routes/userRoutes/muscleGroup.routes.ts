import { Router } from 'express'
import { getActiveMuscleGroupsController } from '~/controllers/adminControllers/muscleGroup.controller'
import { wrapRequestHandler } from '~/utils/handler'

const publicMuscleGroupRouter = Router()

// Public: get active muscle groups (no auth required)
publicMuscleGroupRouter.get('/', wrapRequestHandler(getActiveMuscleGroupsController))

export default publicMuscleGroupRouter
