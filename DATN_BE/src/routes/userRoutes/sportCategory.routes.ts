import { Router } from 'express'
import { getSportCategoriesController } from '~/controllers/sportCategory.controllers'

import { wrapRequestHandler } from '~/utils/handler'

const sportCategoryRouter = Router()

// Public route to get sport categories
sportCategoryRouter.get('/', wrapRequestHandler(getSportCategoriesController))

export default sportCategoryRouter
