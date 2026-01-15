import { Router } from 'express'
import {
  createPostCommentController,
  createPostController,
  createReportPostController,
  deleteChildCommentPostController,
  deleteCommentPostController,
  deletePostForEachUserController,
  getMePostsController,
  getNewFeedsController,
  getPostChildCommentsController,
  getPostCommentsController,
  getPostController,
  getPostsWithMealPlanController,
  getPublicPostsController,
  getPublicPostDetailController,
  getUserPostController,
  likePostController,
  sharePostController,
  shareMealPlanToPostController,
  uploadPostImageController,
  unLikePostController
} from '~/controllers/userControllers/post.controller'
import { accessTokenValidator } from '~/middlewares/authUser.middleware'
import { commentPostValidator, limitAndPageValidator } from '~/middlewares/post.middleware'
import { wrapRequestHandler } from '~/utils/handler'
import upload from '~/utils/multer'

const postsRouter = Router()

// Public routes (no authentication required)
postsRouter.get('/public', limitAndPageValidator, wrapRequestHandler(getPublicPostsController))
postsRouter.get('/public/:post_id', wrapRequestHandler(getPublicPostDetailController))

postsRouter.post('/upload', accessTokenValidator, upload.single('image'), wrapRequestHandler(uploadPostImageController))
postsRouter.post('/', accessTokenValidator, upload.array('image', 5), wrapRequestHandler(createPostController))
postsRouter.post('/actions/like', accessTokenValidator, wrapRequestHandler(likePostController))
postsRouter.post('/actions/unlike', accessTokenValidator, wrapRequestHandler(unLikePostController))
postsRouter.post('/actions/share', accessTokenValidator, wrapRequestHandler(sharePostController))
postsRouter.get('/:post_id', accessTokenValidator, wrapRequestHandler(getPostController))
postsRouter.get('/', accessTokenValidator, limitAndPageValidator, wrapRequestHandler(getNewFeedsController))
postsRouter.post(
  '/actions/comment',
  accessTokenValidator,
  commentPostValidator,
  wrapRequestHandler(createPostCommentController)
)
postsRouter.get(
  '/actions/comment',
  accessTokenValidator,
  limitAndPageValidator,
  wrapRequestHandler(getPostCommentsController)
)
postsRouter.get(
  '/actions/child-comment',
  accessTokenValidator,
  limitAndPageValidator,
  wrapRequestHandler(getPostChildCommentsController)
)
postsRouter.post('/actions/delete-post', accessTokenValidator, wrapRequestHandler(deletePostForEachUserController))
postsRouter.post('/actions/delete-comment', accessTokenValidator, wrapRequestHandler(deleteCommentPostController))
postsRouter.post(
  '/actions/delete-child-comment',
  accessTokenValidator,
  wrapRequestHandler(deleteChildCommentPostController)
)
postsRouter.post('/actions/report', accessTokenValidator, wrapRequestHandler(createReportPostController))
postsRouter.post('/actions/share-meal-plan', accessTokenValidator, wrapRequestHandler(shareMealPlanToPostController))
postsRouter.get('/meal-plans/list', accessTokenValidator, limitAndPageValidator, wrapRequestHandler(getPostsWithMealPlanController))
postsRouter.get(
  '/me/get-me-posts',
  accessTokenValidator,
  limitAndPageValidator,
  wrapRequestHandler(getMePostsController)
)
postsRouter.get('/user/:id', accessTokenValidator, limitAndPageValidator, wrapRequestHandler(getUserPostController))

export default postsRouter
