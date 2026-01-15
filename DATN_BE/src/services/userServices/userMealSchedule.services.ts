import { ObjectId } from 'mongodb'
import HTTP_STATUS from '~/constants/httpStatus'
import { USER_MEAL_SCHEDULE_MESSAGE } from '~/constants/messages'
import { ScheduleStatus, MealType, MealItemStatus } from '~/constants/enums'
import UserMealScheduleModel from '~/models/schemas/userMealSchedule.schema'
import UserMealItemModel from '~/models/schemas/userMealItem.schema'
import MealPlanModel from '~/models/schemas/mealPlan.schema'
import MealPlanDayModel from '~/models/schemas/mealPlanDay.schema'
import MealPlanMealModel from '~/models/schemas/mealPlanMeal.schema'
import { ErrorWithStatus } from '~/utils/error'

const summarizeMeals = (meals: any[] = []) =>
  meals.reduce(
    (acc, item) => {
      const recipe = item.recipe_id || {}
      acc.calories += item.calories ?? recipe.calories ?? 0
      acc.protein += item.protein ?? recipe.protein ?? 0
      acc.carbs += item.carbs ?? recipe.carbs ?? recipe.carbohydrate ?? 0
      acc.fat += item.fat ?? recipe.fat ?? 0
      return acc
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

const calculateStreak = (mealsByDate: Record<string, any[]>, todayKey: string) => {
  if (!mealsByDate) return 0
  const candidates = Object.keys(mealsByDate)
    .filter((date) => !todayKey || date <= todayKey)
    .sort()
  let streak = 0
  for (let index = candidates.length - 1; index >= 0; index -= 1) {
    const dayMeals = mealsByDate[candidates[index]] || []
    if (!dayMeals.length) {
      continue
    }
    const completedDay = dayMeals.every((meal) => {
      const statusValue = typeof meal.status === 'string' ? meal.status : Number(meal.status)
      return statusValue === MealItemStatus.completed || statusValue === 'completed' || statusValue === 1
    })
    if (completedDay) {
      streak += 1
    } else {
      break
    }
  }
  return streak
}

const getDayNumber = (startDate?: Date | string, dateValue?: string) => {
  if (!startDate || !dateValue) return null
  const start = new Date(startDate)
  const target = new Date(dateValue)
  const diff = target.getTime() - start.getTime()
  if (!Number.isFinite(diff)) return null
  return Math.max(1, Math.round(diff / (24 * 60 * 60 * 1000)) + 1)
}

const formatDateKey = (value?: Date | string) => {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().split('T')[0]
}

const resolveMealItemDate = (item: any) => item?.scheduled_date || item?.schedule_date || item?.date || null

class UserMealScheduleService {
  // Lấy lịch thực đơn của user
  async getUserMealSchedulesService({ user_id, page, limit, status }: any) {
    const skip = (page - 1) * limit
    const query: any = { user_id: new ObjectId(user_id) }
    
    if (status) query.status = status

    const schedules = await UserMealScheduleModel.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .populate('meal_plan_id', 'title description duration image')
      .exec()

    const total = await UserMealScheduleModel.countDocuments(query)

    return {
      schedules,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: limit
      }
    }
  }

  // Lấy lịch thực đơn đang hoạt động kèm tổng quan
  async getActiveMealScheduleService({ user_id }: { user_id: string }) {
    const schedule = await UserMealScheduleModel.findOne({
      user_id: new ObjectId(user_id),
      status: ScheduleStatus.active
    })
      .sort({ updated_at: -1, created_at: -1 })
      .populate('meal_plan_id')
      .exec()

    if (!schedule) {
      return null
    }

    const scheduleId = (schedule as any)._id?.toString()

    if (!scheduleId) {
      throw new ErrorWithStatus({
        message: USER_MEAL_SCHEDULE_MESSAGE.SCHEDULE_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const detail = await this.getUserMealScheduleDetailService({
      schedule_id: scheduleId,
      user_id
    })

    const mealsByDate = detail.meals_by_date || {}
    const timelineDates = Object.keys(mealsByDate).sort()
    const scheduleStartKey = formatDateKey(
      detail.start_date || (detail as any).startDate || (detail as any).applied_start_date
    )
    const todayKey = formatDateKey(new Date())
    const todayDate = timelineDates.find((date) => date === todayKey) || scheduleStartKey || timelineDates[0] || ''
    const todayIndex = todayDate ? timelineDates.indexOf(todayDate) : -1
    const nextDateCandidate = timelineDates.find((date) => date > todayKey)
    const nextDate =
      nextDateCandidate ||
      (todayIndex >= 0 ? timelineDates[todayIndex + 1] : timelineDates[1]) ||
      ''
    const todayMeals = todayDate ? mealsByDate[todayDate] || [] : []
    const upcomingMeals = nextDate ? mealsByDate[nextDate] || [] : []

    const overview = await this.getProgressStatsService({
      schedule_id: scheduleId,
      user_id
    })

    return {
      schedule: detail,
      overview,
      timeline_dates: timelineDates,
      today: {
        date: todayDate,
        meals: todayMeals,
        nutrition: summarizeMeals(todayMeals)
      },
      upcoming: {
        date: nextDate,
        meals: upcomingMeals,
        nutrition: summarizeMeals(upcomingMeals)
      },
      meta: {
        streak_days: calculateStreak(mealsByDate, todayKey),
        total_days: timelineDates.length,
        today_index: getDayNumber(detail.start_date || timelineDates[0], todayDate) || 1
      }
    }
  }

  // Lấy chi tiết lịch thực đơn
  async getUserMealScheduleDetailService({ schedule_id, user_id }: any) {
    const schedule = await UserMealScheduleModel.findOne({
      _id: new ObjectId(schedule_id),
      user_id: new ObjectId(user_id)
    })
      .populate('meal_plan_id')
      .exec()

    if (!schedule) {
      throw new ErrorWithStatus({
        message: USER_MEAL_SCHEDULE_MESSAGE.SCHEDULE_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Lấy các meal items của schedule
    const mealItems = await UserMealItemModel.find({
      user_meal_schedule_id: new ObjectId(schedule_id)
    })
      .populate(
        'recipe_id',
        [
          'title',
          'image',
          'ingredients',
          'hero_image',
          'thumbnail',
          'calories',
          'protein',
          'carbohydrate',
          'carbs',
          'fat',
          'difficulty_level',
          'time',
          'instructions',
          'content',
          'description',
          'summary',
          'steps'
        ].join(' ')
      )
      .sort({ scheduled_date: 1, meal_type: 1 })
      .lean({ virtuals: true })
      .exec()

    // Group meal items by date
    const mealsByDate = mealItems.reduce((acc: Record<string, any[]>, item: any) => {
      const dateKey = formatDateKey(resolveMealItemDate(item))
      if (!dateKey) {
        return acc
      }
      if (!acc[dateKey]) {
        acc[dateKey] = []
      }
      acc[dateKey].push(item)
      return acc
    }, {})

    return {
      ...schedule.toObject(),
      meals_by_date: mealsByDate
    }
  }

  // Cập nhật lịch thực đơn
  async updateUserMealScheduleService({ schedule_id, user_id, updateData }: any) {
    const schedule = await UserMealScheduleModel.findOne({
      _id: new ObjectId(schedule_id),
      user_id: new ObjectId(user_id)
    })

    if (!schedule) {
      throw new ErrorWithStatus({
        message: USER_MEAL_SCHEDULE_MESSAGE.SCHEDULE_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const updatedSchedule = await UserMealScheduleModel.findByIdAndUpdate(
      schedule_id,
      updateData,
      { new: true }
    )

    return updatedSchedule
  }

  // Xóa lịch thực đơn
  async deleteUserMealScheduleService({ schedule_id, user_id }: any) {
    const schedule = await UserMealScheduleModel.findOne({
      _id: new ObjectId(schedule_id),
      user_id: new ObjectId(user_id)
    })

    if (!schedule) {
      throw new ErrorWithStatus({
        message: USER_MEAL_SCHEDULE_MESSAGE.SCHEDULE_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Xóa schedule và các meal items liên quan
    await UserMealScheduleModel.findByIdAndDelete(schedule_id)
    await UserMealItemModel.deleteMany({ user_meal_schedule_id: new ObjectId(schedule_id) })

    return { message: USER_MEAL_SCHEDULE_MESSAGE.DELETE_USER_MEAL_SCHEDULE_SUCCESS }
  }

  // Lấy meal items theo ngày
  async getMealItemsByDayService({ schedule_id, user_id, date, day_number }: any) {
    const schedule = await UserMealScheduleModel.findOne({
      _id: new ObjectId(schedule_id),
      user_id: new ObjectId(user_id)
    })

    if (!schedule) {
      throw new ErrorWithStatus({
        message: USER_MEAL_SCHEDULE_MESSAGE.SCHEDULE_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    if (!date && !Number.isFinite(day_number)) {
      throw new ErrorWithStatus({
        message: 'Vui lòng cung cấp ngày hoặc số thứ tự của ngày trong thực đơn',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    let targetDate = date ? new Date(date) : null

    if (!targetDate || Number.isNaN(targetDate.getTime())) {
      if (Number.isFinite(day_number)) {
        const baseStartDate =
          (schedule as any).start_date || (schedule as any).startDate || (schedule as any).applied_start_date
        if (!baseStartDate) {
          throw new ErrorWithStatus({
            message: 'Không xác định được ngày bắt đầu của lịch',
            status: HTTP_STATUS.UNPROCESSABLE_ENTITY
          })
        }
        targetDate = new Date(baseStartDate)
        targetDate.setHours(0, 0, 0, 0)
        targetDate.setDate(targetDate.getDate() + (Math.max(1, Number(day_number)) - 1))
      }
    }

    if (!targetDate || Number.isNaN(targetDate.getTime())) {
      throw new ErrorWithStatus({
        message: 'Ngày yêu cầu không hợp lệ',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(startOfDay)
    endOfDay.setDate(endOfDay.getDate() + 1)

    // Nếu chưa có meal items (lịch cũ), tạo từ meal plan rồi lấy lại
    const existingCount = await UserMealItemModel.countDocuments({
      user_meal_schedule_id: new ObjectId(schedule_id)
    })
    if (existingCount === 0 && schedule.meal_plan_id && schedule.start_date) {
      await new UserMealScheduleService().createMealItemsFromPlanService({
        schedule_id,
        meal_plan_id: schedule.meal_plan_id,
        start_date: schedule.start_date
      })
    }

    const mealItems = await UserMealItemModel.find({
      user_meal_schedule_id: new ObjectId(schedule_id),
      scheduled_date: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    })
      .populate('recipe_id', 'title image calories difficulty_level time instructions ingredients')
      .sort({ scheduled_date: 1, meal_type: 1 })
      .lean({ virtuals: true })
      .exec()

    return mealItems
  }

  // Cập nhật meal item
  async updateMealItemService({ meal_item_id, user_id, updateData }: any) {
    const mealItem = await UserMealItemModel.findById(meal_item_id)

    if (!mealItem) {
      throw new ErrorWithStatus({
        message: USER_MEAL_SCHEDULE_MESSAGE.MEAL_ITEM_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Kiểm tra quyền truy cập thông qua schedule với type casting
    const schedule = await UserMealScheduleModel.findOne({
      _id: (mealItem as any).user_meal_schedule_id,
      user_id: new ObjectId(user_id)
    })

    if (!schedule) {
      throw new ErrorWithStatus({
        message: USER_MEAL_SCHEDULE_MESSAGE.UNAUTHORIZED_ACCESS,
        status: HTTP_STATUS.FORBIDDEN
      })
    }

    const updatedMealItem = await UserMealItemModel.findByIdAndUpdate(
      meal_item_id,
      updateData,
      { new: true }
    )
      .populate('recipe_id', 'title image calories')

    return updatedMealItem
  }

  // Complete meal item
  async completeMealItemService({ meal_item_id, user_id, rating, review, completed_image }: any) {
    const mealItem = await UserMealItemModel.findById(meal_item_id)

    if (!mealItem) {
      throw new ErrorWithStatus({
        message: USER_MEAL_SCHEDULE_MESSAGE.MEAL_ITEM_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Kiểm tra quyền truy cập thông qua schedule với type casting
    const schedule = await UserMealScheduleModel.findOne({
      _id: (mealItem as any).user_meal_schedule_id,
      user_id: new ObjectId(user_id)
    })

    if (!schedule) {
      throw new ErrorWithStatus({
        message: USER_MEAL_SCHEDULE_MESSAGE.UNAUTHORIZED_ACCESS,
        status: HTTP_STATUS.FORBIDDEN
      })
    }

    const updatedMealItem = await UserMealItemModel.findByIdAndUpdate(
      meal_item_id,
      {
        status: MealItemStatus.completed,
        completed_at: new Date(),
        rating,
        review,
        completed_image
      },
      { new: true }
    )
      .populate('recipe_id', 'title image calories')

    return updatedMealItem
  }

  // Skip meal item
  async skipMealItemService({ meal_item_id, user_id, skip_reason }: any) {
    const mealItem = await UserMealItemModel.findById(meal_item_id)

    if (!mealItem) {
      throw new ErrorWithStatus({
        message: USER_MEAL_SCHEDULE_MESSAGE.MEAL_ITEM_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Kiểm tra quyền truy cập thông qua schedule với type casting
    const schedule = await UserMealScheduleModel.findOne({
      _id: (mealItem as any).user_meal_schedule_id,
      user_id: new ObjectId(user_id)
    })

    if (!schedule) {
      throw new ErrorWithStatus({
        message: USER_MEAL_SCHEDULE_MESSAGE.UNAUTHORIZED_ACCESS,
        status: HTTP_STATUS.FORBIDDEN
      })
    }

    const updatedMealItem = await UserMealItemModel.findByIdAndUpdate(
      meal_item_id,
      {
        status: MealItemStatus.skipped,
        skip_reason,
        skipped_at: new Date()
      },
      { new: true }
    )
      .populate('recipe_id', 'title image calories')

    return updatedMealItem
  }

  // Substitute meal item
  async substituteMealItemService({ meal_item_id, user_id, new_recipe_id, substitute_reason }: any) {
    const mealItem = await UserMealItemModel.findById(meal_item_id)

    if (!mealItem) {
      throw new ErrorWithStatus({
        message: USER_MEAL_SCHEDULE_MESSAGE.MEAL_ITEM_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Kiểm tra quyền truy cập thông qua schedule với type casting
    const schedule = await UserMealScheduleModel.findOne({
      _id: (mealItem as any).schedule_id,
      user_id: new ObjectId(user_id)
    })

    if (!schedule) {
      throw new ErrorWithStatus({
        message: USER_MEAL_SCHEDULE_MESSAGE.UNAUTHORIZED_ACCESS,
        status: HTTP_STATUS.FORBIDDEN
      })
    }

    const updatedMealItem = await UserMealItemModel.findByIdAndUpdate(
      meal_item_id,
      {
        original_recipe_id: (mealItem as any).recipe_id,
        recipe_id: new ObjectId(new_recipe_id),
        substitute_reason,
        substituted_at: new Date()
      },
      { new: true }
    )
      .populate('recipe_id', 'title image calories')
      .populate('original_recipe_id', 'title image calories')

    return updatedMealItem
  }

  // Lấy thống kê dinh dưỡng theo ngày
  async getDailyNutritionStatsService({ schedule_id, user_id, date }: any) {
    const schedule = await UserMealScheduleModel.findOne({
      _id: new ObjectId(schedule_id),
      user_id: new ObjectId(user_id)
    })

    if (!schedule) {
      throw new ErrorWithStatus({
        message: USER_MEAL_SCHEDULE_MESSAGE.SCHEDULE_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const mealItems = await UserMealItemModel.find({
      user_meal_schedule_id: new ObjectId(schedule_id),
      scheduled_date: {
        $gte: new Date(date),
        $lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000)
      },
      status: MealItemStatus.completed
    })

    const totalStats = mealItems.reduce((acc: any, item: any) => {
      acc.calories += item.calories || 0
      acc.protein += item.protein || 0
      acc.carbs += item.carbs || 0
      acc.fat += item.fat || 0
      return acc
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 })

    return {
      date,
      total_meals: mealItems.length,
      nutrition: totalStats
    }
  }

  // Lấy thống kê tiến độ
  async getProgressStatsService({ schedule_id, user_id }: any) {
    const schedule = await UserMealScheduleModel.findOne({
      _id: new ObjectId(schedule_id),
      user_id: new ObjectId(user_id)
    })

    if (!schedule) {
      throw new ErrorWithStatus({
        message: USER_MEAL_SCHEDULE_MESSAGE.SCHEDULE_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const totalMeals = await UserMealItemModel.countDocuments({
      user_meal_schedule_id: new ObjectId(schedule_id)
    })

    const completedMeals = await UserMealItemModel.countDocuments({
      user_meal_schedule_id: new ObjectId(schedule_id),
      status: MealItemStatus.completed
    })

    const skippedMeals = await UserMealItemModel.countDocuments({
      user_meal_schedule_id: new ObjectId(schedule_id),
      status: MealItemStatus.skipped
    })

    const completionRate = totalMeals > 0 ? (completedMeals / totalMeals) * 100 : 0

    return {
      total_meals: totalMeals,
      completed_meals: completedMeals,
      skipped_meals: skippedMeals,
      pending_meals: totalMeals - completedMeals - skippedMeals,
      completion_rate: Math.round(completionRate * 100) / 100
    }
  }

  // Tạo meal items từ meal plan khi apply
  async createMealItemsFromPlanService({ schedule_id, meal_plan_id, start_date }: any) {
    // Lấy thông tin meal plan
    const mealPlan = await MealPlanModel.findById(meal_plan_id)
    if (!mealPlan) {
      throw new ErrorWithStatus({
        message: 'Không tìm thấy thực đơn',
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Lấy các ngày trong meal plan
    const days = await MealPlanDayModel.find({ meal_plan_id })
      .sort({ day_number: 1 })
      .exec()

    const mealItems = []

    for (const day of days) {
      // Tạo date cho ngày này
      const scheduleDate = new Date(start_date)
      scheduleDate.setDate(scheduleDate.getDate() + (day.day_number - 1))

      // Lấy các bữa ăn trong ngày
      const meals = await MealPlanMealModel.find({ meal_plan_day_id: day._id })
        .sort({ meal_type: 1 })
        .populate({
          path: 'recipe_id',
          select: 'title image calories protein carbohydrate fat',
          strictPopulate: false // cho phép populate dù schema strict
        })
        .exec()

      for (const meal of meals) {
        const recipe = (meal as any).recipe_id || {}
        const mealName = meal.name || recipe.title || 'Món ăn'

        const mealItem = await UserMealItemModel.create({
          user_meal_schedule_id: new ObjectId(schedule_id),
          meal_plan_meal_id: new ObjectId(meal._id),
          // lưu kèm recipe_id nếu schema cho phép (schema hiện strict sẽ bỏ qua nếu không khai báo)
          recipe_id: recipe?._id ? new ObjectId(recipe._id) : undefined,
          name: mealName,
          meal_type: meal.meal_type,
          scheduled_date: scheduleDate,
          calories: meal.calories ?? recipe.calories ?? 0,
          protein: meal.protein ?? recipe.protein ?? 0,
          carbs: meal.carbs ?? recipe.carbohydrate ?? 0,
          fat: meal.fat ?? recipe.fat ?? 0,
          status: MealItemStatus.pending
        })

        mealItems.push(mealItem)
      }
    }

    return mealItems
  }

  // Lấy lịch sử meal items đã hoàn thành
  async getCompletedMealItemsService({ user_id, page, limit, date_from, date_to }: any) {
    const skip = (page - 1) * limit
    const query: any = { 
      status: MealItemStatus.completed
    }

    // Tìm tất cả schedules của user
    const userSchedules = await UserMealScheduleModel.find({ 
      user_id: new ObjectId(user_id) 
    }).select('_id')
    
    const scheduleIds = userSchedules.map(s => s._id)
    query.user_meal_schedule_id = { $in: scheduleIds }

    if (date_from && date_to) {
      query.completed_at = {
        $gte: new Date(date_from),
        $lte: new Date(date_to)
      }
    }

    const completedItems = await UserMealItemModel.find(query)
      .sort({ completed_at: -1 })
      .skip(skip)
      .limit(limit)
      .populate('recipe_id', 'title image calories')
      .populate('user_meal_schedule_id', 'title')
      .exec()

    const total = await UserMealItemModel.countDocuments(query)

    return {
      completed_items: completedItems,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: limit
      }
    }
  }

  // Cập nhật reminders
  async updateRemindersService({ schedule_id, user_id, reminders }: any) {
    const schedule = await UserMealScheduleModel.findOne({
      _id: new ObjectId(schedule_id),
      user_id: new ObjectId(user_id)
    })

    if (!schedule) {
      throw new ErrorWithStatus({
        message: USER_MEAL_SCHEDULE_MESSAGE.SCHEDULE_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const updatedSchedule = await UserMealScheduleModel.findByIdAndUpdate(
      schedule_id,
      { reminders },
      { new: true }
    )

    return updatedSchedule
  }

  // Reschedule meal item to different date/time
  async rescheduleMealItemService({ meal_item_id, user_id, new_date, new_time }: any) {
    const mealItem = await UserMealItemModel.findById(meal_item_id)

    if (!mealItem) {
      throw new ErrorWithStatus({
        message: USER_MEAL_SCHEDULE_MESSAGE.MEAL_ITEM_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Kiểm tra quyền truy cập thông qua schedule với type casting
    const schedule = await UserMealScheduleModel.findOne({
      _id: (mealItem as any).user_meal_schedule_id,
      user_id: new ObjectId(user_id)
    })

    if (!schedule) {
      throw new ErrorWithStatus({
        message: USER_MEAL_SCHEDULE_MESSAGE.UNAUTHORIZED_ACCESS,
        status: HTTP_STATUS.FORBIDDEN
      })
    }

    const updateData: any = {}
    if (new_date) {
      updateData.scheduled_date = new Date(new_date)
    }
    if (new_time) {
      updateData.scheduled_time = new_time
    }
    updateData.rescheduled_at = new Date()

    const updatedMealItem = await UserMealItemModel.findByIdAndUpdate(
      meal_item_id,
      updateData,
      { new: true }
    )
      .populate('recipe_id', 'title image calories')

    return updatedMealItem
  }

  // Swap two meal items between dates
  async swapMealItemsService({ meal_item_id_1, meal_item_id_2, user_id }: any) {
    const [mealItem1, mealItem2] = await Promise.all([
      UserMealItemModel.findById(meal_item_id_1),
      UserMealItemModel.findById(meal_item_id_2)
    ])

    if (!mealItem1 || !mealItem2) {
      throw new ErrorWithStatus({
        message: USER_MEAL_SCHEDULE_MESSAGE.MEAL_ITEM_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Kiểm tra quyền truy cập
    const [schedule1, schedule2] = await Promise.all([
      UserMealScheduleModel.findOne({
        _id: (mealItem1 as any).user_meal_schedule_id,
        user_id: new ObjectId(user_id)
      }),
      UserMealScheduleModel.findOne({
        _id: (mealItem2 as any).user_meal_schedule_id,
        user_id: new ObjectId(user_id)
      })
    ])

    if (!schedule1 || !schedule2) {
      throw new ErrorWithStatus({
        message: USER_MEAL_SCHEDULE_MESSAGE.UNAUTHORIZED_ACCESS,
        status: HTTP_STATUS.FORBIDDEN
      })
    }

    // Hoán đổi ngày và thời gian
    const temp_date = (mealItem1 as any).scheduled_date || (mealItem1 as any).schedule_date
    const temp_time = (mealItem1 as any).scheduled_time

    await Promise.all([
      UserMealItemModel.findByIdAndUpdate(meal_item_id_1, {
        scheduled_date: (mealItem2 as any).scheduled_date || (mealItem2 as any).schedule_date,
        scheduled_time: (mealItem2 as any).scheduled_time,
        swapped_at: new Date()
      }),
      UserMealItemModel.findByIdAndUpdate(meal_item_id_2, {
        scheduled_date: temp_date,
        scheduled_time: temp_time,
        swapped_at: new Date()
      })
    ])

    return { message: 'Hoán đổi thành công' }
  }

  // Add meal item to existing schedule
  async addMealItemToScheduleService({ schedule_id, user_id, meal_data }: any) {
    const schedule = await UserMealScheduleModel.findOne({
      _id: new ObjectId(schedule_id),
      user_id: new ObjectId(user_id)
    })

    if (!schedule) {
      throw new ErrorWithStatus({
        message: USER_MEAL_SCHEDULE_MESSAGE.SCHEDULE_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Validate: phải có recipe_id HOẶC name
    if (!meal_data.recipe_id && !meal_data.name) {
      throw new ErrorWithStatus({
        message: 'Món ăn phải có recipe_id hoặc name',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const newMealItem = await UserMealItemModel.create({
      user_meal_schedule_id: new ObjectId(schedule_id),
      recipe_id: meal_data.recipe_id ? new ObjectId(meal_data.recipe_id) : null,
      name: meal_data.name || 'Món ăn tùy chỉnh',
      meal_type: meal_data.meal_type,
      scheduled_date: new Date(meal_data.schedule_date),
      scheduled_time: meal_data.scheduled_time,
      calories: meal_data.calories || 0,
      protein: meal_data.protein || 0,
      carbs: meal_data.carbs || 0,
      fat: meal_data.fat || 0,
      status: MealItemStatus.pending
    })

    return newMealItem
  }

  // Remove meal item from schedule
  async removeMealItemFromScheduleService({ meal_item_id, user_id }: any) {
    const mealItem = await UserMealItemModel.findById(meal_item_id)

    if (!mealItem) {
      throw new ErrorWithStatus({
        message: USER_MEAL_SCHEDULE_MESSAGE.MEAL_ITEM_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Kiểm tra quyền truy cập
    const schedule = await UserMealScheduleModel.findOne({
      _id: (mealItem as any).user_meal_schedule_id,
      user_id: new ObjectId(user_id)
    })

    if (!schedule) {
      throw new ErrorWithStatus({
        message: USER_MEAL_SCHEDULE_MESSAGE.UNAUTHORIZED_ACCESS,
        status: HTTP_STATUS.FORBIDDEN
      })
    }

    await UserMealItemModel.findByIdAndDelete(meal_item_id)
    return { message: 'Xóa món ăn thành công' }
  }
}

const userMealScheduleServices = new UserMealScheduleService()
export default userMealScheduleServices 