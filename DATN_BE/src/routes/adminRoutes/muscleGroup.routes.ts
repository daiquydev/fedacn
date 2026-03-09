import { Router } from 'express'
import {
    getMuscleGroupsController,
    createMuscleGroupController,
    updateMuscleGroupController,
    deleteMuscleGroupController
} from '~/controllers/adminControllers/muscleGroup.controller'
import { accessTokenValidator } from '~/middlewares/authUser.middleware'
import { checkRole } from '~/middlewares/roles.middleware'
import { UserRoles } from '~/constants/enums'
import { wrapRequestHandler } from '~/utils/handler'

const adminMuscleGroupRouter = Router()

adminMuscleGroupRouter.use(accessTokenValidator, wrapRequestHandler(checkRole([UserRoles.admin])))

adminMuscleGroupRouter.get('/', wrapRequestHandler(getMuscleGroupsController))
adminMuscleGroupRouter.post('/', wrapRequestHandler(createMuscleGroupController))
adminMuscleGroupRouter.put('/:id', wrapRequestHandler(updateMuscleGroupController))
adminMuscleGroupRouter.delete('/:id', wrapRequestHandler(deleteMuscleGroupController))

export default adminMuscleGroupRouter
