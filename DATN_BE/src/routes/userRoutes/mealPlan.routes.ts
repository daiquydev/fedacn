import { Router } from 'express'
import {
  createMealPlanController,
  getPublicMealPlansController,
  getMyMealPlansController,
  getMealPlanDetailController,
  updateMealPlanController,
  deleteMealPlanController,
  likeMealPlanController,
  unlikeMealPlanController,
  bookmarkMealPlanController,
  unbookmarkMealPlanController,
  getBookmarkedMealPlansController,
  commentMealPlanController,
  getMealPlanCommentsController,
  applyMealPlanController,
  getFeaturedMealPlansController,
  getTrendingMealPlansController,
  getMealCookingInstructionsController,
  getMealPlanSocialContextController,
  inviteFriendToMealPlanController,
  rateMealPlanController,
  reportMealPlanController
} from '~/controllers/userControllers/mealPlan.controller'
import { accessTokenValidator, optionalAccessTokenValidator } from '~/middlewares/authUser.middleware'
import { getMealPlanSocialContextValidator, inviteFriendToMealPlanValidator } from '~/middlewares/mealPlan.middleware'
import { wrapRequestHandler } from '~/utils/handler'

const mealPlanRouter = Router()

/**
 * Description: Create a new meal plan
 * Path: /meal-plans
 * Method: POST
 * Header: { Authorization: Bearer <access_token> }
 * Body: MealPlanData
 */
mealPlanRouter.post('/', accessTokenValidator, wrapRequestHandler(createMealPlanController))

/**
 * Description: Get public meal plans with filters
 * Path: /meal-plans/public
 * Method: GET
 * Query: { page?, limit?, category?, difficulty_level?, duration?, sort?, search? }
 */
mealPlanRouter.get('/public', wrapRequestHandler(getPublicMealPlansController))

/**
 * Description: Get my meal plans
 * Path: /meal-plans/my
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 * Query: { page?, limit?, status? }
 */
mealPlanRouter.get('/my', accessTokenValidator, wrapRequestHandler(getMyMealPlansController))

/**
 * Description: Get featured meal plans
 * Path: /meal-plans/featured
 * Method: GET
 * Query: { limit? }
 */
mealPlanRouter.get('/featured', wrapRequestHandler(getFeaturedMealPlansController))

/**
 * Description: Get trending meal plans
 * Path: /meal-plans/trending
 * Method: GET
 * Query: { limit?, days? }
 */
mealPlanRouter.get('/trending', wrapRequestHandler(getTrendingMealPlansController))

/**
 * Description: Get social context (friends applying / invite candidates)
 * Path: /meal-plans/:meal_plan_id/social-context
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 */
mealPlanRouter.get(
  '/:meal_plan_id/social-context',
  accessTokenValidator,
  getMealPlanSocialContextValidator,
  wrapRequestHandler(getMealPlanSocialContextController)
)

/**
 * Description: Get bookmarked meal plans
 * Path: /meal-plans/bookmarked
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 * Query: { page?, limit?, folder_name? }
 */
mealPlanRouter.get('/bookmarked', accessTokenValidator, wrapRequestHandler(getBookmarkedMealPlansController))

/**
 * Description: Get cooking instructions for a meal inside a meal plan
 * Path: /meal-plans/:meal_plan_id/meals/:meal_id/cooking
 * Method: GET
 * Header: { Authorization: Bearer <access_token> } (optional)
 */
mealPlanRouter.get(
  '/:meal_plan_id/meals/:meal_id/cooking',
  optionalAccessTokenValidator,
  wrapRequestHandler(getMealCookingInstructionsController)
)

/**
 * Description: Get meal plan detail
 * Path: /meal-plans/:id
 * Method: GET
 * Header: { Authorization: Bearer <access_token> } (optional)
 */
mealPlanRouter.get('/:id', optionalAccessTokenValidator, wrapRequestHandler(getMealPlanDetailController))

/**
 * Description: Update meal plan
 * Path: /meal-plans/:id
 * Method: PUT
 * Header: { Authorization: Bearer <access_token> }
 * Body: UpdateMealPlanData
 */
mealPlanRouter.put('/:id', accessTokenValidator, wrapRequestHandler(updateMealPlanController))

/**
 * Description: Delete meal plan
 * Path: /meal-plans/:id
 * Method: DELETE
 * Header: { Authorization: Bearer <access_token> }
 */
mealPlanRouter.delete('/:id', accessTokenValidator, wrapRequestHandler(deleteMealPlanController))

/**
 * Description: Get meal plan comments
 * Path: /meal-plans/:meal_plan_id/comments
 * Method: GET
 * Query: { page?, limit? }
 */
mealPlanRouter.get('/:meal_plan_id/comments', wrapRequestHandler(getMealPlanCommentsController))

/**
 * Description: Like meal plan
 * Path: /meal-plans/actions/like
 * Method: POST
 * Header: { Authorization: Bearer <access_token> }
 * Body: { meal_plan_id: string }
 */
mealPlanRouter.post('/actions/like', accessTokenValidator, wrapRequestHandler(likeMealPlanController))

/**
 * Description: Unlike meal plan
 * Path: /meal-plans/actions/unlike
 * Method: POST
 * Header: { Authorization: Bearer <access_token> }
 * Body: { meal_plan_id: string }
 */
mealPlanRouter.post('/actions/unlike', accessTokenValidator, wrapRequestHandler(unlikeMealPlanController))

/**
 * Description: Bookmark meal plan
 * Path: /meal-plans/actions/bookmark
 * Method: POST
 * Header: { Authorization: Bearer <access_token> }
 * Body: { meal_plan_id: string, folder_name?: string, notes?: string }
 */
mealPlanRouter.post('/actions/bookmark', accessTokenValidator, wrapRequestHandler(bookmarkMealPlanController))

/**
 * Description: Unbookmark meal plan
 * Path: /meal-plans/actions/unbookmark
 * Method: POST
 * Header: { Authorization: Bearer <access_token> }
 * Body: { meal_plan_id: string }
 */
mealPlanRouter.post('/actions/unbookmark', accessTokenValidator, wrapRequestHandler(unbookmarkMealPlanController))

/**
 * Description: Comment on meal plan
 * Path: /meal-plans/actions/comment
 * Method: POST
 * Header: { Authorization: Bearer <access_token> }
 * Body: { meal_plan_id: string, content: string, parent_id?: string }
 */
mealPlanRouter.post('/actions/comment', accessTokenValidator, wrapRequestHandler(commentMealPlanController))

/**
 * Description: Rate meal plan
 * Path: /meal-plans/actions/rate
 * Method: POST
 * Header: { Authorization: Bearer <access_token> }
 * Body: { meal_plan_id: string, rating: number }
 */
mealPlanRouter.post('/actions/rate', accessTokenValidator, wrapRequestHandler(rateMealPlanController))

/**
 * Description: Report meal plan
 * Path: /meal-plans/actions/report
 * Method: POST
 * Header: { Authorization: Bearer <access_token> }
 * Body: { meal_plan_id: string, reason: string }
 */
mealPlanRouter.post('/actions/report', accessTokenValidator, wrapRequestHandler(reportMealPlanController))

/**
 * Description: Apply meal plan to personal schedule
 * Path: /meal-plans/actions/apply
 * Method: POST
 * Header: { Authorization: Bearer <access_token> }
 * Body: { meal_plan_id: string, title: string, start_date: Date, target_weight?: number, notes?: string, reminders?: any[] }
 */
mealPlanRouter.post('/actions/apply', accessTokenValidator, wrapRequestHandler(applyMealPlanController))

/**
 * Description: Invite a mutual friend to apply this meal plan
 * Path: /meal-plans/:meal_plan_id/invites
 * Method: POST
 * Header: { Authorization: Bearer <access_token> }
 * Body: { friend_id: string, note?: string }
 */
mealPlanRouter.post(
  '/:meal_plan_id/invites',
  accessTokenValidator,
  inviteFriendToMealPlanValidator,
  wrapRequestHandler(inviteFriendToMealPlanController)
)

export default mealPlanRouter 