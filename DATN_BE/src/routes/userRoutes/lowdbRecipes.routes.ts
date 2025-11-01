import { Router } from 'express'
import {
  getAllRecipesController,
  getRecipeDetailController,
  createRecipeController,
  updateRecipeController,
  deleteRecipeController,
  searchRecipesController,
  getRecipesByCategoryController,
  getRecipesByAuthorController,
  getAllCategoriesController,
  getAllCuisinesController,
  getFeaturedRecipesController,
  calculateNutritionController
} from '~/controllers/userControllers/lowdbRecipe.controller'
import { accessTokenValidator } from '~/middlewares/authUser.middleware'
import { wrapRequestHandler } from '~/utils/handler'

const lowdbRecipesRouter = Router()

// Public routes
lowdbRecipesRouter.get('/categories', wrapRequestHandler(getAllCategoriesController))
lowdbRecipesRouter.get('/cuisines', wrapRequestHandler(getAllCuisinesController))
lowdbRecipesRouter.get('/featured', wrapRequestHandler(getFeaturedRecipesController))
lowdbRecipesRouter.get('/search', wrapRequestHandler(searchRecipesController))
lowdbRecipesRouter.get('/category/:category', wrapRequestHandler(getRecipesByCategoryController))
lowdbRecipesRouter.get('/author/:author', wrapRequestHandler(getRecipesByAuthorController))
lowdbRecipesRouter.get('/:id', wrapRequestHandler(getRecipeDetailController))
lowdbRecipesRouter.get('/', wrapRequestHandler(getAllRecipesController))

// Utility routes
lowdbRecipesRouter.post('/calculate-nutrition', wrapRequestHandler(calculateNutritionController))

// Protected routes (require authentication)
lowdbRecipesRouter.post(
  '/',
  accessTokenValidator,
  wrapRequestHandler(createRecipeController)
)

lowdbRecipesRouter.put(
  '/:id',
  accessTokenValidator,
  wrapRequestHandler(updateRecipeController)
)

lowdbRecipesRouter.delete(
  '/:id',
  accessTokenValidator,
  wrapRequestHandler(deleteRecipeController)
)

export default lowdbRecipesRouter
