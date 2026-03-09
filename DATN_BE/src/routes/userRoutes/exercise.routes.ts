import { Router } from 'express'
import {
    getAllExercisesController,
    filterExercisesController,
    getExerciseByIdController,
    suggestExercisesByKcalController
} from '~/controllers/userControllers/exercise.controller'
import { wrapRequestHandler } from '~/utils/handler'

const exerciseRouter = Router()

// Public routes - no auth needed
exerciseRouter.get('/', wrapRequestHandler(getAllExercisesController))
exerciseRouter.get('/filter', wrapRequestHandler(filterExercisesController))
exerciseRouter.post('/suggest-by-kcal', wrapRequestHandler(suggestExercisesByKcalController))
exerciseRouter.get('/:id', wrapRequestHandler(getExerciseByIdController))

export default exerciseRouter
