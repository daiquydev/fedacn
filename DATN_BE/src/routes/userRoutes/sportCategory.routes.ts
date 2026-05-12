import { Router } from 'express'
import { getSportCategoriesController, getSportCategoriesWithStatusController } from '~/controllers/sportCategory.controllers'

import { wrapRequestHandler } from '~/utils/handler'

const sportCategoryRouter = Router()

// Public route to get sport categories (non-deleted only — dùng cho dropdown, filter)
sportCategoryRouter.get('/', wrapRequestHandler(getSportCategoriesController))

// Public route to get all categories kèm trạng thái isDeleted (dùng để resolve tên danh mục trên UI)
sportCategoryRouter.get('/all', wrapRequestHandler(getSportCategoriesWithStatusController))

export default sportCategoryRouter
