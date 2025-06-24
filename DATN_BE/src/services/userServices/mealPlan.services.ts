import { ObjectId } from 'mongodb'
import HTTP_STATUS from '~/constants/httpStatus'
import { MEAL_PLAN_MESSAGE } from '~/constants/messages'
import { MealPlanCategory, MealPlanStatus } from '~/constants/enums'
import MealPlanModel from '~/models/schemas/mealPlan.schema'
import MealPlanDayModel from '~/models/schemas/mealPlanDay.schema'
import MealPlanMealModel from '~/models/schemas/mealPlanMeal.schema'
import MealPlanLikeModel from '~/models/schemas/mealPlanLike.schema'
import MealPlanBookmarkModel from '~/models/schemas/mealPlanBookmark.schema'
import MealPlanCommentModel from '~/models/schemas/mealPlanComment.schema'
import UserMealScheduleModel from '~/models/schemas/userMealSchedule.schema'
import { ErrorWithStatus } from '~/utils/error'

class MealPlanService {
  // Tạo meal plan mới
  async createMealPlanService(mealPlanData: any) {
    const { days, ...mealPlanInfo } = mealPlanData

    // Tạo meal plan
    const newMealPlan = await MealPlanModel.create({
      ...mealPlanInfo,
      status: MealPlanStatus.published
    })

    // Tạo các ngày trong meal plan
    for (const dayData of days) {
      const { meals, ...dayInfo } = dayData
      
      const newDay = await MealPlanDayModel.create({
        ...dayInfo,
        meal_plan_id: newMealPlan._id
      })

      // Tạo các bữa ăn trong ngày
      for (const mealData of meals) {
        await MealPlanMealModel.create({
          ...mealData,
          meal_plan_day_id: newDay._id
        })
      }
    }

    return newMealPlan
  }

  // Lấy danh sách meal plans công khai
  async getPublicMealPlansService({
    page,
    limit,
    category,
    difficulty_level,
    duration,
    sort,
    search
  }: any) {
    const skip = (page - 1) * limit
    const query: any = { 
      status: MealPlanStatus.published,
      is_public: true
    }

    if (category) query.category = category
    if (difficulty_level) query.difficulty_level = difficulty_level
    if (duration) query.duration = duration
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }

    let sortOption: any = { created_at: -1 }
    if (sort === 'popular') sortOption = { likes_count: -1 }
    if (sort === 'newest') sortOption = { created_at: -1 }

    const mealPlans = await MealPlanModel.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .populate('author_id', 'name avatar')
      .exec()

    const total = await MealPlanModel.countDocuments(query)

    return {
      meal_plans: mealPlans,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: limit
      }
    }
  }

  // Lấy meal plans của tác giả
  async getMyMealPlansService({ author_id, page, limit, status }: any) {
    const skip = (page - 1) * limit
    const query: any = { author_id: new ObjectId(author_id) }
    
    if (status) query.status = status

    const mealPlans = await MealPlanModel.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .exec()

    const total = await MealPlanModel.countDocuments(query)

    return {
      meal_plans: mealPlans,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: limit
      }
    }
  }

  // Lấy chi tiết meal plan
  async getMealPlanDetailService({ meal_plan_id, user_id }: any) {
    const mealPlan = await MealPlanModel.findById(meal_plan_id)
      .populate('author_id', 'name avatar')
      .exec()

    if (!mealPlan) {
      throw new ErrorWithStatus({
        message: MEAL_PLAN_MESSAGE.MEAL_PLAN_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Lấy các ngày và bữa ăn
    const days = await MealPlanDayModel.find({ meal_plan_id })
      .sort({ day_number: 1 })
      .exec()

    const daysWithMeals = await Promise.all(
      days.map(async (day) => {
        const meals = await MealPlanMealModel.find({ meal_plan_day_id: day._id })
          .populate('recipe_id', 'title image difficulty_level time')
          .sort({ meal_type: 1 })
          .exec()
        
        return {
          ...day.toObject(),
          meals
        }
      })
    )

    // Kiểm tra trạng thái like, bookmark của user
    let isLiked = false
    let isBookmarked = false

    if (user_id) {
      const like = await MealPlanLikeModel.findOne({
        user_id: new ObjectId(user_id),
        meal_plan_id: new ObjectId(meal_plan_id)
      })
      isLiked = !!like

      const bookmark = await MealPlanBookmarkModel.findOne({
        user_id: new ObjectId(user_id),
        meal_plan_id: new ObjectId(meal_plan_id)
      })
      isBookmarked = !!bookmark
    }

    return {
      ...mealPlan.toObject(),
      days: daysWithMeals,
      is_liked: isLiked,
      is_bookmarked: isBookmarked
    }
  }

  // Cập nhật meal plan
  async updateMealPlanService({ meal_plan_id, author_id, updateData }: any) {
    const mealPlan = await MealPlanModel.findOne({
      _id: new ObjectId(meal_plan_id),
      author_id: new ObjectId(author_id)
    })

    if (!mealPlan) {
      throw new ErrorWithStatus({
        message: MEAL_PLAN_MESSAGE.MEAL_PLAN_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const updatedMealPlan = await MealPlanModel.findByIdAndUpdate(
      meal_plan_id,
      updateData,
      { new: true }
    )

    return updatedMealPlan
  }

  // Xóa meal plan
  async deleteMealPlanService({ meal_plan_id, author_id }: any) {
    const mealPlan = await MealPlanModel.findOne({
      _id: new ObjectId(meal_plan_id),
      author_id: new ObjectId(author_id)
    })

    if (!mealPlan) {
      throw new ErrorWithStatus({
        message: MEAL_PLAN_MESSAGE.MEAL_PLAN_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Xóa meal plan và các dữ liệu liên quan
    await MealPlanModel.findByIdAndDelete(meal_plan_id)
    await MealPlanDayModel.deleteMany({ meal_plan_id: new ObjectId(meal_plan_id) })
    await MealPlanLikeModel.deleteMany({ meal_plan_id: new ObjectId(meal_plan_id) })
    await MealPlanBookmarkModel.deleteMany({ meal_plan_id: new ObjectId(meal_plan_id) })
    await MealPlanCommentModel.deleteMany({ meal_plan_id: new ObjectId(meal_plan_id) })

    return { message: MEAL_PLAN_MESSAGE.DELETE_MEAL_PLAN_SUCCESS }
  }

  // Like meal plan
  async likeMealPlanService({ user_id, meal_plan_id }: any) {
    const existingLike = await MealPlanLikeModel.findOne({
      user_id: new ObjectId(user_id),
      meal_plan_id: new ObjectId(meal_plan_id)
    })

    if (existingLike) {
      throw new ErrorWithStatus({
        message: MEAL_PLAN_MESSAGE.ALREADY_LIKED,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const newLike = await MealPlanLikeModel.create({
      user_id: new ObjectId(user_id),
      meal_plan_id: new ObjectId(meal_plan_id)
    })

    // Cập nhật likes_count
    await MealPlanModel.findByIdAndUpdate(
      meal_plan_id,
      { $inc: { likes_count: 1 } }
    )

    return newLike
  }

  // Unlike meal plan
  async unlikeMealPlanService({ user_id, meal_plan_id }: any) {
    const existingLike = await MealPlanLikeModel.findOneAndDelete({
      user_id: new ObjectId(user_id),
      meal_plan_id: new ObjectId(meal_plan_id)
    })

    if (!existingLike) {
      throw new ErrorWithStatus({
        message: MEAL_PLAN_MESSAGE.NOT_LIKED,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Cập nhật likes_count
    await MealPlanModel.findByIdAndUpdate(
      meal_plan_id,
      { $inc: { likes_count: -1 } }
    )

    return { message: MEAL_PLAN_MESSAGE.UNLIKE_MEAL_PLAN_SUCCESS }
  }

  // Bookmark meal plan
  async bookmarkMealPlanService({ user_id, meal_plan_id, folder_name, notes }: any) {
    const existingBookmark = await MealPlanBookmarkModel.findOne({
      user_id: new ObjectId(user_id),
      meal_plan_id: new ObjectId(meal_plan_id)
    })

    if (existingBookmark) {
      throw new ErrorWithStatus({
        message: MEAL_PLAN_MESSAGE.ALREADY_BOOKMARKED,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const newBookmark = await MealPlanBookmarkModel.create({
      user_id: new ObjectId(user_id),
      meal_plan_id: new ObjectId(meal_plan_id),
      folder_name: folder_name || 'Mặc định',
      notes
    })

    return newBookmark
  }

  // Unbookmark meal plan
  async unbookmarkMealPlanService({ user_id, meal_plan_id }: any) {
    const existingBookmark = await MealPlanBookmarkModel.findOneAndDelete({
      user_id: new ObjectId(user_id),
      meal_plan_id: new ObjectId(meal_plan_id)
    })

    if (!existingBookmark) {
      throw new ErrorWithStatus({
        message: MEAL_PLAN_MESSAGE.NOT_BOOKMARKED,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    return { message: MEAL_PLAN_MESSAGE.UNBOOKMARK_MEAL_PLAN_SUCCESS }
  }

  // Lấy bookmarked meal plans
  async getBookmarkedMealPlansService({ user_id, page, limit, folder_name }: any) {
    const skip = (page - 1) * limit
    const query: any = { user_id: new ObjectId(user_id) }
    
    if (folder_name) query.folder_name = folder_name

    const bookmarks = await MealPlanBookmarkModel.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'meal_plan_id',
        populate: {
          path: 'author_id',
          select: 'name avatar'
        }
      })
      .exec()

    const total = await MealPlanBookmarkModel.countDocuments(query)

    return {
      bookmarks,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: limit
      }
    }
  }

  // Comment meal plan
  async commentMealPlanService({ user_id, meal_plan_id, content, parent_id }: any) {
    const newComment = await MealPlanCommentModel.create({
      user_id: new ObjectId(user_id),
      meal_plan_id: new ObjectId(meal_plan_id),
      content,
      parent_id: parent_id ? new ObjectId(parent_id) : null
    })

    return newComment
  }

  // Lấy comments của meal plan
  async getMealPlanCommentsService({ meal_plan_id, page, limit }: any) {
    const skip = (page - 1) * limit

    const comments = await MealPlanCommentModel.find({
      meal_plan_id: new ObjectId(meal_plan_id),
      parent_id: null
    })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user_id', 'name avatar')
      .exec()

    // Lấy replies cho mỗi comment
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await MealPlanCommentModel.find({
          parent_id: comment._id
        })
          .sort({ created_at: 1 })
          .populate('user_id', 'name avatar')
          .exec()

        return {
          ...comment.toObject(),
          replies
        }
      })
    )

    const total = await MealPlanCommentModel.countDocuments({
      meal_plan_id: new ObjectId(meal_plan_id),
      parent_id: null
    })

    return {
      comments: commentsWithReplies,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: limit
      }
    }
  }

  // Áp dụng meal plan vào lịch cá nhân
  async applyMealPlanService({ user_id, meal_plan_id, title, start_date, target_weight, notes, reminders }: any) {
    const mealPlan = await MealPlanModel.findById(meal_plan_id)

    if (!mealPlan) {
      throw new ErrorWithStatus({
        message: MEAL_PLAN_MESSAGE.MEAL_PLAN_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const newSchedule = await UserMealScheduleModel.create({
      user_id: new ObjectId(user_id),
      meal_plan_id: new ObjectId(meal_plan_id),
      title,
      start_date: new Date(start_date),
      end_date: new Date(new Date(start_date).getTime() + (mealPlan.duration - 1) * 24 * 60 * 60 * 1000),
      target_weight,
      notes,
      reminders
    })

    return newSchedule
  }

  // Lấy featured meal plans
  async getFeaturedMealPlansService({ limit = 10 }: any) {
    const featuredMealPlans = await MealPlanModel.find({
      status: MealPlanStatus.published,
      is_public: true,
      is_featured: true
    })
      .sort({ likes_count: -1, created_at: -1 })
      .limit(limit)
      .populate('author_id', 'name avatar')
      .exec()

    return featuredMealPlans
  }

  // Lấy trending meal plans
  async getTrendingMealPlansService({ limit = 10, days = 7 }: any) {
    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - days)

    const trendingMealPlans = await MealPlanModel.find({
      status: MealPlanStatus.published,
      is_public: true,
      created_at: { $gte: fromDate }
    })
      .sort({ likes_count: -1, views_count: -1 })
      .limit(limit)
      .populate('author_id', 'name avatar')
      .exec()

    return trendingMealPlans
  }
}

const mealPlanServices = new MealPlanService()
export default mealPlanServices 