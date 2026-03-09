import { Router } from 'express'
import {
    createSportCategoryController,
    deleteSportCategoryController,
    getAllSportCategoriesAdminController,
    restoreSportCategoryController,
    softDeleteSportCategoryController,
    updateSportCategoryController
} from '~/controllers/sportCategory.controllers'
import { accessTokenValidator } from '~/middlewares/authUser.middleware'
import { checkRole } from '~/middlewares/roles.middleware'
import { UserRoles } from '~/constants/enums'
import { wrapRequestHandler } from '~/utils/handler'

const adminSportCategoryRouter = Router()

adminSportCategoryRouter.use(accessTokenValidator, wrapRequestHandler(checkRole([UserRoles.admin])))

// Get all (including deleted) for admin management
adminSportCategoryRouter.get('/', wrapRequestHandler(getAllSportCategoriesAdminController))
adminSportCategoryRouter.post('/', wrapRequestHandler(createSportCategoryController))
adminSportCategoryRouter.put('/:id', wrapRequestHandler(updateSportCategoryController))
// Soft delete (trash button)
adminSportCategoryRouter.delete('/:id', wrapRequestHandler(softDeleteSportCategoryController))
// Restore deleted category
adminSportCategoryRouter.patch('/:id/restore', wrapRequestHandler(restoreSportCategoryController))

export default adminSportCategoryRouter
