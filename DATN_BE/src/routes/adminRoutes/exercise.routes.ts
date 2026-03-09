import { Router } from 'express'
import {
    getExercisesAdminController,
    getExerciseByIdAdminController,
    createExerciseAdminController,
    updateExerciseAdminController,
    deleteExerciseAdminController
} from '~/controllers/adminControllers/exercise.controller'
import { accessTokenValidator } from '~/middlewares/authUser.middleware'
import { checkRole } from '~/middlewares/roles.middleware'
import { UserRoles } from '~/constants/enums'
import { wrapRequestHandler } from '~/utils/handler'

const adminExerciseRouter = Router()

adminExerciseRouter.use(accessTokenValidator, wrapRequestHandler(checkRole([UserRoles.admin])))

adminExerciseRouter.get('/', wrapRequestHandler(getExercisesAdminController))
adminExerciseRouter.get('/:id', wrapRequestHandler(getExerciseByIdAdminController))
adminExerciseRouter.post('/', wrapRequestHandler(createExerciseAdminController))
adminExerciseRouter.put('/:id', wrapRequestHandler(updateExerciseAdminController))
adminExerciseRouter.delete('/:id', wrapRequestHandler(deleteExerciseAdminController))

export default adminExerciseRouter
