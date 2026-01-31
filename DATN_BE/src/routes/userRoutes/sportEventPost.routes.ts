import { Router } from 'express'
import {
  createEventPostController,
  getEventPostsController,
  getEventPostController,
  updateEventPostController,
  deleteEventPostController,
  toggleLikePostController
} from '~/controllers/userControllers/sportEventPost.controller'
import { verifyToken } from '~/middlewares/authUser.middleware'
import { wrapRequestHandler } from '~/utils/handler'

const sportEventPostRouter = Router({ mergeParams: true })

// Public routes
sportEventPostRouter.get('/', wrapRequestHandler(getEventPostsController))
sportEventPostRouter.get('/:postId', wrapRequestHandler(getEventPostController))

// Protected routes
sportEventPostRouter.post('/', verifyToken, wrapRequestHandler(createEventPostController))
sportEventPostRouter.put('/:postId', verifyToken, wrapRequestHandler(updateEventPostController))
sportEventPostRouter.delete('/:postId', verifyToken, wrapRequestHandler(deleteEventPostController))
sportEventPostRouter.post('/:postId/like', verifyToken, wrapRequestHandler(toggleLikePostController))

export default sportEventPostRouter
