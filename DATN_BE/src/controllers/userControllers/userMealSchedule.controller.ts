import { Request, Response } from 'express'
import { USER_MEAL_SCHEDULE_MESSAGE } from '~/constants/messages'
import { TokenPayload } from '~/models/requests/authUser.request'
import userMealScheduleServices from '~/services/userServices/userMealSchedule.services'

// Lấy danh sách lịch thực đơn của user
export const getUserMealSchedulesController = async (req: Request, res: Response) => {
  const user = req.decoded_authorization as TokenPayload
  const { page, limit, status } = req.query

  const result = await userMealScheduleServices.getUserMealSchedulesService({
    user_id: user.user_id,
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    status: status ? Number(status) : undefined
  })

  return res.json({
    result,
    message: USER_MEAL_SCHEDULE_MESSAGE.GET_USER_MEAL_SCHEDULES_SUCCESS
  })
}

// Lấy lịch thực đơn đang hoạt động
export const getActiveMealScheduleController = async (req: Request, res: Response) => {
  const user = req.decoded_authorization as TokenPayload

  const result = await userMealScheduleServices.getActiveMealScheduleService({
    user_id: user.user_id
  })

  return res.json({
    result,
    message: USER_MEAL_SCHEDULE_MESSAGE.GET_ACTIVE_MEAL_SCHEDULE_SUCCESS
  })
}

// Lấy chi tiết lịch thực đơn
export const getUserMealScheduleDetailController = async (req: Request, res: Response) => {
  const { id } = req.params
  const user = req.decoded_authorization as TokenPayload

  const result = await userMealScheduleServices.getUserMealScheduleDetailService({
    schedule_id: id,
    user_id: user.user_id
  })

  return res.json({
    result,
    message: USER_MEAL_SCHEDULE_MESSAGE.GET_USER_MEAL_SCHEDULE_DETAIL_SUCCESS
  })
}

// Cập nhật lịch thực đơn
export const updateUserMealScheduleController = async (req: Request, res: Response) => {
  const { id } = req.params
  const user = req.decoded_authorization as TokenPayload

  const result = await userMealScheduleServices.updateUserMealScheduleService({
    schedule_id: id,
    user_id: user.user_id,
    updateData: req.body
  })

  return res.json({
    result,
    message: USER_MEAL_SCHEDULE_MESSAGE.UPDATE_USER_MEAL_SCHEDULE_SUCCESS
  })
}

// Xóa lịch thực đơn
export const deleteUserMealScheduleController = async (req: Request, res: Response) => {
  const { id } = req.params
  const user = req.decoded_authorization as TokenPayload

  const result = await userMealScheduleServices.deleteUserMealScheduleService({
    schedule_id: id,
    user_id: user.user_id
  })

  return res.json({
    result,
    message: USER_MEAL_SCHEDULE_MESSAGE.DELETE_USER_MEAL_SCHEDULE_SUCCESS
  })
}

// Lấy meal items theo ngày
export const getDayMealItemsController = async (req: Request, res: Response) => {
  const { schedule_id, date, day_number } = req.query
  const user = req.decoded_authorization as TokenPayload

  const result = await userMealScheduleServices.getMealItemsByDayService({
    schedule_id: schedule_id as string,
    user_id: user.user_id,
    date: date as string,
    day_number: day_number ? Number(day_number) : undefined
  })

  return res.json({
    result,
    message: USER_MEAL_SCHEDULE_MESSAGE.GET_DAY_MEAL_ITEMS_SUCCESS
  })
}

// Đánh dấu hoàn thành meal item
export const completeMealItemController = async (req: Request, res: Response) => {
  const { meal_item_id, actual_servings, actual_calories, rating, review, notes, images, location, mood, hunger_before, satisfaction_after } = req.body
  const user = req.decoded_authorization as TokenPayload

  const result = await userMealScheduleServices.completeMealItemService({
    meal_item_id,
    user_id: user.user_id,
    rating,
    review,
    completed_image: images?.[0] // Chỉ lấy ảnh đầu tiên
  })

  return res.json({
    result,
    message: USER_MEAL_SCHEDULE_MESSAGE.COMPLETE_MEAL_ITEM_SUCCESS
  })
}

// Skip meal item
export const skipMealItemController = async (req: Request, res: Response) => {
  const { meal_item_id, notes } = req.body
  const user = req.decoded_authorization as TokenPayload

  const result = await userMealScheduleServices.skipMealItemService({
    meal_item_id,
    user_id: user.user_id,
    skip_reason: notes
  })

  return res.json({
    result,
    message: USER_MEAL_SCHEDULE_MESSAGE.SKIP_MEAL_ITEM_SUCCESS
  })
}

// Thay thế meal item bằng recipe khác
export const substituteMealItemController = async (req: Request, res: Response) => {
  const { meal_item_id, substitute_recipe_id, notes } = req.body
  const user = req.decoded_authorization as TokenPayload

  const result = await userMealScheduleServices.substituteMealItemService({
    meal_item_id,
    user_id: user.user_id,
    new_recipe_id: substitute_recipe_id,
    substitute_reason: notes
  })

  return res.json({
    result,
    message: USER_MEAL_SCHEDULE_MESSAGE.SUBSTITUTE_MEAL_ITEM_SUCCESS
  })
}

// Lấy thống kê dinh dưỡng theo ngày
export const getDayNutritionStatsController = async (req: Request, res: Response) => {
  const { schedule_id, date } = req.query
  const user = req.decoded_authorization as TokenPayload

  const result = await userMealScheduleServices.getDailyNutritionStatsService({
    schedule_id: schedule_id as string,
    user_id: user.user_id,
    date: date as string
  })

  return res.json({
    result,
    message: USER_MEAL_SCHEDULE_MESSAGE.GET_DAY_NUTRITION_STATS_SUCCESS
  })
}

// Lấy thống kê tổng quan schedule
export const getScheduleOverviewStatsController = async (req: Request, res: Response) => {
  const { schedule_id } = req.params
  const user = req.decoded_authorization as TokenPayload

  const result = await userMealScheduleServices.getProgressStatsService({
    schedule_id,
    user_id: user.user_id
  })

  return res.json({
    result,
    message: USER_MEAL_SCHEDULE_MESSAGE.GET_SCHEDULE_OVERVIEW_SUCCESS
  })
}

// Lấy lịch sử meal items đã hoàn thành
export const getCompletedMealItemsController = async (req: Request, res: Response) => {
  const user = req.decoded_authorization as TokenPayload
  const { page, limit, date_from, date_to } = req.query

  const result = await userMealScheduleServices.getCompletedMealItemsService({
    user_id: user.user_id,
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    date_from: date_from as string,
    date_to: date_to as string
  })

  return res.json({
    result,
    message: USER_MEAL_SCHEDULE_MESSAGE.GET_COMPLETED_MEAL_ITEMS_SUCCESS
  })
}

// Cập nhật reminders
export const updateRemindersController = async (req: Request, res: Response) => {
  const { schedule_id } = req.params
  const { reminders } = req.body
  const user = req.decoded_authorization as TokenPayload

  const result = await userMealScheduleServices.updateRemindersService({
    schedule_id,
    user_id: user.user_id,
    reminders
  })

  return res.json({
    result,
    message: USER_MEAL_SCHEDULE_MESSAGE.UPDATE_REMINDERS_SUCCESS
  })
}

// Reschedule meal item
export const rescheduleMealItemController = async (req: Request, res: Response) => {
  const { meal_item_id, new_date, new_time } = req.body
  const user = req.decoded_authorization as TokenPayload

  const result = await userMealScheduleServices.rescheduleMealItemService({
    meal_item_id,
    user_id: user.user_id,
    new_date,
    new_time
  })

  return res.json({
    result,
    message: USER_MEAL_SCHEDULE_MESSAGE.RESCHEDULE_MEAL_ITEM_SUCCESS
  })
}

// Swap meal items
export const swapMealItemsController = async (req: Request, res: Response) => {
  const { meal_item_id_1, meal_item_id_2 } = req.body
  const user = req.decoded_authorization as TokenPayload

  const result = await userMealScheduleServices.swapMealItemsService({
    meal_item_id_1,
    meal_item_id_2,
    user_id: user.user_id
  })

  return res.json({
    result,
    message: USER_MEAL_SCHEDULE_MESSAGE.SWAP_MEAL_ITEMS_SUCCESS
  })
}

// Add meal item to schedule
export const addMealItemController = async (req: Request, res: Response) => {
  const { schedule_id, meal_data } = req.body
  const user = req.decoded_authorization as TokenPayload

  const result = await userMealScheduleServices.addMealItemToScheduleService({
    schedule_id,
    user_id: user.user_id,
    meal_data
  })

  return res.json({
    result,
    message: USER_MEAL_SCHEDULE_MESSAGE.ADD_MEAL_ITEM_SUCCESS
  })
}

// Remove meal item from schedule
export const removeMealItemController = async (req: Request, res: Response) => {
  const { meal_item_id } = req.body
  const user = req.decoded_authorization as TokenPayload

  const result = await userMealScheduleServices.removeMealItemFromScheduleService({
    meal_item_id,
    user_id: user.user_id
  })

  return res.json({
    result,
    message: USER_MEAL_SCHEDULE_MESSAGE.REMOVE_MEAL_ITEM_SUCCESS
  })
}

// Update meal item details
export const updateMealItemController = async (req: Request, res: Response) => {
  const { meal_item_id, updateData } = req.body
  const user = req.decoded_authorization as TokenPayload

  const result = await userMealScheduleServices.updateMealItemService({
    meal_item_id,
    user_id: user.user_id,
    updateData
  })

  return res.json({
    result,
    message: USER_MEAL_SCHEDULE_MESSAGE.UPDATE_MEAL_ITEM_SUCCESS
  })
}

// Lấy progress report
export const getProgressReportController = async (req: Request, res: Response) => {
  const { schedule_id } = req.params
  const user = req.decoded_authorization as TokenPayload

  const result = await userMealScheduleServices.getProgressStatsService({
    schedule_id,
    user_id: user.user_id
  })

  return res.json({
    result,
    message: USER_MEAL_SCHEDULE_MESSAGE.GET_PROGRESS_REPORT_SUCCESS
  })
} 