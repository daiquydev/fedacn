import { Router } from 'express'
import {
    createSavedWorkoutController,
    getUserSavedWorkoutsController,
    updateSavedWorkoutScheduleController,
    deleteSavedWorkoutController,
    getWorkoutCalendarEventsController
} from '~/controllers/userControllers/savedWorkoutTemplate.controller'
import { verifyToken } from '~/middlewares/authUser.middleware'
import { wrapRequestHandler } from '~/utils/handler'

const savedWorkoutTemplateRouter = Router()

savedWorkoutTemplateRouter.get('/', verifyToken, wrapRequestHandler(getUserSavedWorkoutsController))
savedWorkoutTemplateRouter.post('/', verifyToken, wrapRequestHandler(createSavedWorkoutController))
// /calendar must be before /:id to avoid conflict
savedWorkoutTemplateRouter.get('/calendar', verifyToken, wrapRequestHandler(getWorkoutCalendarEventsController))
savedWorkoutTemplateRouter.patch('/:id/schedule', verifyToken, wrapRequestHandler(updateSavedWorkoutScheduleController))
savedWorkoutTemplateRouter.delete('/:id', verifyToken, wrapRequestHandler(deleteSavedWorkoutController))

export default savedWorkoutTemplateRouter

