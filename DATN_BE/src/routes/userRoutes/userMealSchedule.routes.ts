import { Router } from 'express'
import {
  getUserMealSchedulesController,
  getUserMealScheduleDetailController,
  updateUserMealScheduleController,
  deleteUserMealScheduleController,
  getDayMealItemsController,
  completeMealItemController,
  skipMealItemController,
  substituteMealItemController,
  rescheduleMealItemController,
  swapMealItemsController,
  addMealItemController,
  removeMealItemController,
  updateMealItemController,
  getDayNutritionStatsController,
  getScheduleOverviewStatsController,
  getCompletedMealItemsController,
  updateRemindersController,
  getProgressReportController
} from '~/controllers/userControllers/userMealSchedule.controller'
import { accessTokenValidator } from '~/middlewares/authUser.middleware'
import { wrapRequestHandler } from '~/utils/handler'

const userMealScheduleRouter = Router()

/**
 * Description: Get user meal schedules
 * Path: /user-meal-schedules
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 * Query: { page?, limit?, status? }
 */
userMealScheduleRouter.get('/', accessTokenValidator, wrapRequestHandler(getUserMealSchedulesController))

/**
 * Description: Get user meal schedule detail
 * Path: /user-meal-schedules/:id
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 */
userMealScheduleRouter.get('/:id', accessTokenValidator, wrapRequestHandler(getUserMealScheduleDetailController))

/**
 * Description: Update user meal schedule
 * Path: /user-meal-schedules/:id
 * Method: PUT
 * Header: { Authorization: Bearer <access_token> }
 * Body: UpdateScheduleData
 */
userMealScheduleRouter.put('/:id', accessTokenValidator, wrapRequestHandler(updateUserMealScheduleController))

/**
 * Description: Delete user meal schedule
 * Path: /user-meal-schedules/:id
 * Method: DELETE
 * Header: { Authorization: Bearer <access_token> }
 */
userMealScheduleRouter.delete('/:id', accessTokenValidator, wrapRequestHandler(deleteUserMealScheduleController))

/**
 * Description: Get schedule overview stats
 * Path: /user-meal-schedules/:schedule_id/overview
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 */
userMealScheduleRouter.get('/:schedule_id/overview', accessTokenValidator, wrapRequestHandler(getScheduleOverviewStatsController))

/**
 * Description: Get progress report
 * Path: /user-meal-schedules/:schedule_id/progress
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 */
userMealScheduleRouter.get('/:schedule_id/progress', accessTokenValidator, wrapRequestHandler(getProgressReportController))

/**
 * Description: Update reminders
 * Path: /user-meal-schedules/:schedule_id/reminders
 * Method: PUT
 * Header: { Authorization: Bearer <access_token> }
 * Body: { reminders: Array }
 */
userMealScheduleRouter.put('/:schedule_id/reminders', accessTokenValidator, wrapRequestHandler(updateRemindersController))

/**
 * Description: Get day meal items
 * Path: /user-meal-schedules/meal-items/day
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 * Query: { schedule_id: string, date: string }
 */
userMealScheduleRouter.get('/meal-items/day', accessTokenValidator, wrapRequestHandler(getDayMealItemsController))

/**
 * Description: Get day nutrition stats
 * Path: /user-meal-schedules/nutrition/day
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 * Query: { schedule_id: string, date: string }
 */
userMealScheduleRouter.get('/nutrition/day', accessTokenValidator, wrapRequestHandler(getDayNutritionStatsController))

/**
 * Description: Get completed meal items history
 * Path: /user-meal-schedules/meal-items/completed
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 * Query: { page?, limit?, date_from?, date_to? }
 */
userMealScheduleRouter.get('/meal-items/completed', accessTokenValidator, wrapRequestHandler(getCompletedMealItemsController))

/**
 * Description: Complete meal item
 * Path: /user-meal-schedules/meal-items/complete
 * Method: POST
 * Header: { Authorization: Bearer <access_token> }
 * Body: CompleteMealItemData
 */
userMealScheduleRouter.post('/meal-items/complete', accessTokenValidator, wrapRequestHandler(completeMealItemController))

/**
 * Description: Skip meal item
 * Path: /user-meal-schedules/meal-items/skip
 * Method: POST
 * Header: { Authorization: Bearer <access_token> }
 * Body: { meal_item_id: string, notes?: string }
 */
userMealScheduleRouter.post('/meal-items/skip', accessTokenValidator, wrapRequestHandler(skipMealItemController))

/**
 * Description: Substitute meal item
 * Path: /user-meal-schedules/meal-items/substitute
 * Method: POST
 * Header: { Authorization: Bearer <access_token> }
 * Body: { meal_item_id: string, substitute_recipe_id: string, notes?: string }
 */
userMealScheduleRouter.post('/meal-items/substitute', accessTokenValidator, wrapRequestHandler(substituteMealItemController))

/**
 * Description: Reschedule meal item
 * Path: /user-meal-schedules/meal-items/reschedule
 * Method: POST
 * Header: { Authorization: Bearer <access_token> }
 * Body: { meal_item_id: string, new_date?: string, new_time?: string }
 */
userMealScheduleRouter.post('/meal-items/reschedule', accessTokenValidator, wrapRequestHandler(rescheduleMealItemController))

/**
 * Description: Swap two meal items
 * Path: /user-meal-schedules/meal-items/swap
 * Method: POST
 * Header: { Authorization: Bearer <access_token> }
 * Body: { meal_item_id_1: string, meal_item_id_2: string }
 */
userMealScheduleRouter.post('/meal-items/swap', accessTokenValidator, wrapRequestHandler(swapMealItemsController))

/**
 * Description: Add meal item to schedule
 * Path: /user-meal-schedules/meal-items/add
 * Method: POST
 * Header: { Authorization: Bearer <access_token> }
 * Body: { schedule_id: string, meal_data: object }
 */
userMealScheduleRouter.post('/meal-items/add', accessTokenValidator, wrapRequestHandler(addMealItemController))

/**
 * Description: Remove meal item from schedule
 * Path: /user-meal-schedules/meal-items/remove
 * Method: DELETE
 * Header: { Authorization: Bearer <access_token> }
 * Body: { meal_item_id: string }
 */
userMealScheduleRouter.delete('/meal-items/remove', accessTokenValidator, wrapRequestHandler(removeMealItemController))

/**
 * Description: Update meal item details
 * Path: /user-meal-schedules/meal-items/update
 * Method: PUT
 * Header: { Authorization: Bearer <access_token> }
 * Body: { meal_item_id: string, updateData: object }
 */
userMealScheduleRouter.put('/meal-items/update', accessTokenValidator, wrapRequestHandler(updateMealItemController))

export default userMealScheduleRouter