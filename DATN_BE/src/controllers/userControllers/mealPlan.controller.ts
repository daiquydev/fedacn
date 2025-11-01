import { Request, Response } from 'express'
import { MEAL_PLAN_MESSAGE } from '~/constants/messages'
import { TokenPayload } from '~/models/requests/authUser.request'
import mealPlanServices from '~/services/userServices/mealPlan.services'

// Tạo meal plan mới
export const createMealPlanController = async (req: Request, res: Response) => {
  const user = req.decoded_authorization as TokenPayload
  const mealPlanData = {
    ...req.body,
    author_id: user.user_id
  }

  const result = await mealPlanServices.createMealPlanService(mealPlanData)

  return res.json({
    result,
    message: MEAL_PLAN_MESSAGE.CREATE_MEAL_PLAN_SUCCESS
  })
}

// Lấy danh sách meal plans công khai
export const getPublicMealPlansController = async (req: Request, res: Response) => {
  const { page, limit, category, difficulty_level, duration, sort, search } = req.query

  const result = await mealPlanServices.getPublicMealPlansService({
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    category: category ? Number(category) : undefined,
    difficulty_level: difficulty_level ? Number(difficulty_level) : undefined,
    duration: duration ? Number(duration) : undefined,
    sort: sort as string,
    search: search as string
  })

  return res.json({
    result,
    message: MEAL_PLAN_MESSAGE.GET_MEAL_PLANS_SUCCESS
  })
}

// Lấy meal plans của tác giả
export const getMyMealPlansController = async (req: Request, res: Response) => {
  const user = req.decoded_authorization as TokenPayload
  const { page, limit, status } = req.query

  const result = await mealPlanServices.getMyMealPlansService({
    author_id: user.user_id,
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    status: status ? Number(status) : undefined
  })

  return res.json({
    result,
    message: MEAL_PLAN_MESSAGE.GET_MY_MEAL_PLANS_SUCCESS
  })
}

// Lấy chi tiết meal plan
export const getMealPlanDetailController = async (req: Request, res: Response) => {
  const { id } = req.params
  const user = req.decoded_authorization as TokenPayload

  const result = await mealPlanServices.getMealPlanDetailService({
    meal_plan_id: id,
    user_id: user?.user_id
  })

  return res.json({
    result,
    message: MEAL_PLAN_MESSAGE.GET_MEAL_PLAN_DETAIL_SUCCESS
  })
}

// Cập nhật meal plan
export const updateMealPlanController = async (req: Request, res: Response) => {
  const { id } = req.params
  const user = req.decoded_authorization as TokenPayload

  const result = await mealPlanServices.updateMealPlanService({
    meal_plan_id: id,
    author_id: user.user_id,
    updateData: req.body
  })

  return res.json({
    result,
    message: MEAL_PLAN_MESSAGE.UPDATE_MEAL_PLAN_SUCCESS
  })
}

// Xóa meal plan
export const deleteMealPlanController = async (req: Request, res: Response) => {
  const { id } = req.params
  const user = req.decoded_authorization as TokenPayload

  const result = await mealPlanServices.deleteMealPlanService({
    meal_plan_id: id,
    author_id: user.user_id
  })

  return res.json({
    result,
    message: MEAL_PLAN_MESSAGE.DELETE_MEAL_PLAN_SUCCESS
  })
}

// Like meal plan
export const likeMealPlanController = async (req: Request, res: Response) => {
  const { meal_plan_id } = req.body
  const user = req.decoded_authorization as TokenPayload

  const result = await mealPlanServices.likeMealPlanService({
    user_id: user.user_id,
    meal_plan_id
  })

  return res.json({
    result,
    message: MEAL_PLAN_MESSAGE.LIKE_MEAL_PLAN_SUCCESS
  })
}

// Unlike meal plan
export const unlikeMealPlanController = async (req: Request, res: Response) => {
  const { meal_plan_id } = req.body
  const user = req.decoded_authorization as TokenPayload

  const result = await mealPlanServices.unlikeMealPlanService({
    user_id: user.user_id,
    meal_plan_id
  })

  return res.json({
    result,
    message: MEAL_PLAN_MESSAGE.UNLIKE_MEAL_PLAN_SUCCESS
  })
}

// Bookmark meal plan
export const bookmarkMealPlanController = async (req: Request, res: Response) => {
  const { meal_plan_id, folder_name, notes } = req.body
  const user = req.decoded_authorization as TokenPayload

  const result = await mealPlanServices.bookmarkMealPlanService({
    user_id: user.user_id,
    meal_plan_id,
    folder_name,
    notes
  })

  return res.json({
    result,
    message: MEAL_PLAN_MESSAGE.BOOKMARK_MEAL_PLAN_SUCCESS
  })
}

// Unbookmark meal plan
export const unbookmarkMealPlanController = async (req: Request, res: Response) => {
  const { meal_plan_id } = req.body
  const user = req.decoded_authorization as TokenPayload

  const result = await mealPlanServices.unbookmarkMealPlanService({
    user_id: user.user_id,
    meal_plan_id
  })

  return res.json({
    result,
    message: MEAL_PLAN_MESSAGE.UNBOOKMARK_MEAL_PLAN_SUCCESS
  })
}

// Lấy bookmarked meal plans
export const getBookmarkedMealPlansController = async (req: Request, res: Response) => {
  const user = req.decoded_authorization as TokenPayload
  const { page, limit, folder_name } = req.query

  const result = await mealPlanServices.getBookmarkedMealPlansService({
    user_id: user.user_id,
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    folder_name: folder_name as string
  })

  // Transform bookmarks to meal_plans for frontend compatibility
  const transformedResult = {
    meal_plans: result.bookmarks.map((bookmark: any) => ({
      ...bookmark.meal_plan_id._doc,
      bookmarked_at: bookmark.created_at,
      bookmark_folder: bookmark.folder_name,
      bookmark_notes: bookmark.notes
    })),
    pagination: result.pagination
  }

  return res.json({
    result: transformedResult,
    message: MEAL_PLAN_MESSAGE.GET_BOOKMARKED_MEAL_PLANS_SUCCESS
  })
}

// Comment meal plan
export const commentMealPlanController = async (req: Request, res: Response) => {
  const { meal_plan_id, content, parent_id } = req.body
  const user = req.decoded_authorization as TokenPayload

  const result = await mealPlanServices.commentMealPlanService({
    user_id: user.user_id,
    meal_plan_id,
    content,
    parent_id
  })

  return res.json({
    result,
    message: MEAL_PLAN_MESSAGE.COMMENT_MEAL_PLAN_SUCCESS
  })
}

// Lấy comments của meal plan
export const getMealPlanCommentsController = async (req: Request, res: Response) => {
  const { meal_plan_id } = req.params
  const { page, limit } = req.query

  const result = await mealPlanServices.getMealPlanCommentsService({
    meal_plan_id,
    page: Number(page) || 1,
    limit: Number(limit) || 10
  })

  return res.json({
    result,
    message: MEAL_PLAN_MESSAGE.GET_MEAL_PLAN_COMMENTS_SUCCESS
  })
}

// Áp dụng meal plan vào lịch cá nhân
export const applyMealPlanController = async (req: Request, res: Response) => {
  const { meal_plan_id, title, start_date, target_weight, notes, reminders } = req.body
  const user = req.decoded_authorization as TokenPayload

  const result = await mealPlanServices.applyMealPlanService({
    user_id: user.user_id,
    meal_plan_id,
    title,
    start_date: new Date(start_date),
    target_weight,
    notes,
    reminders
  })

  return res.json({
    result,
    message: MEAL_PLAN_MESSAGE.APPLY_MEAL_PLAN_SUCCESS
  })
}

// Lấy featured meal plans
export const getFeaturedMealPlansController = async (req: Request, res: Response) => {
  const { limit } = req.query

  const result = await mealPlanServices.getFeaturedMealPlansService({
    limit: Number(limit) || 10
  })

  return res.json({
    result,
    message: MEAL_PLAN_MESSAGE.GET_FEATURED_MEAL_PLANS_SUCCESS
  })
}

// Lấy trending meal plans
export const getTrendingMealPlansController = async (req: Request, res: Response) => {
  const { limit, days } = req.query

  const result = await mealPlanServices.getTrendingMealPlansService({
    limit: Number(limit) || 10,
    days: Number(days) || 7
  })

  return res.json({
    result,
    message: MEAL_PLAN_MESSAGE.GET_TRENDING_MEAL_PLANS_SUCCESS
  })
} 