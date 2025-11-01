import { Router } from 'express'
import {
  getAllCategoryIngredientsController,
  getListIngredientController,
  getIngredientDetailController,
  createIngredientController,
  updateIngredientController,
  deleteIngredientController,
  searchIngredientsController
} from '~/controllers/userControllers/ingredient.controller'
import { accessTokenValidator } from '~/middlewares/authUser.middleware'
import { wrapRequestHandler } from '~/utils/handler'

const ingredientsRouter = Router()

// Test logging to see which controllers are undefined
console.log('Ingredient controllers:', {
  getAllCategoryIngredientsController,
  getListIngredientController,
  getIngredientDetailController,
  createIngredientController,
  updateIngredientController,
  deleteIngredientController,
  searchIngredientsController
});

// Public routes
ingredientsRouter.get('/categories', wrapRequestHandler(getAllCategoryIngredientsController))
ingredientsRouter.get('/search', wrapRequestHandler(searchIngredientsController))
ingredientsRouter.get('/:id', wrapRequestHandler(getIngredientDetailController))
ingredientsRouter.get('/', wrapRequestHandler(getListIngredientController))

// Protected routes (require authentication)
ingredientsRouter.post(
  '/',
  accessTokenValidator,
  wrapRequestHandler(createIngredientController)
)

ingredientsRouter.put(
  '/:id',
  accessTokenValidator,
  wrapRequestHandler(updateIngredientController)
)

ingredientsRouter.delete(
  '/:id',
  accessTokenValidator,
  wrapRequestHandler(deleteIngredientController)
)

export default ingredientsRouter
