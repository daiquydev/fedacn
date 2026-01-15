import { ObjectId } from 'mongodb'
import PostModel from '~/models/schemas/post.schema'
import LikePostModel from '~/models/schemas/likePost.schema'
import CommentPostModel from '~/models/schemas/commentPost.schema'
import UserMealScheduleModel from '~/models/schemas/userMealSchedule.schema'
import UserMealItemModel from '~/models/schemas/userMealItem.schema'
import MealPlanModel from '~/models/schemas/mealPlan.schema'
import UserModel from '~/models/schemas/user.schema'
import { ScheduleStatus, MealItemStatus } from '~/constants/enums'

class PersonalDashboardService {
  async getPersonalDashboardStats(userId: string) {
    const userObjectId = new ObjectId(userId)
    
    // Get posts stats
    const [totalPosts, totalPostLikes, totalComments] = await Promise.all([
      PostModel.countDocuments({ user_id: userObjectId }),
      LikePostModel.countDocuments({ 
        post_id: { $in: await PostModel.find({ user_id: userObjectId }).distinct('_id') }
      }),
      CommentPostModel.countDocuments({ 
        post_id: { $in: await PostModel.find({ user_id: userObjectId }).distinct('_id') }
      })
    ])

    // Get meal plan stats
    const [totalMealPlans, appliedMealPlans, activeMealSchedule] = await Promise.all([
      MealPlanModel.countDocuments({ author_id: userObjectId }),
      UserMealScheduleModel.countDocuments({ user_id: userObjectId }),
      UserMealScheduleModel.findOne({ 
        user_id: userObjectId, 
        status: ScheduleStatus.active 
      }).populate('meal_plan_id')
    ])

    // Get completed meals count from UserMealItemModel
    const totalCompletedMeals = await UserMealItemModel.countDocuments({
      user_meal_schedule_id: { 
        $in: await UserMealScheduleModel.find({ user_id: userObjectId }).distinct('_id') 
      },
      status: MealItemStatus.completed
    })

    // Calculate total calories consumed
    const caloriesAgg = await UserMealItemModel.aggregate([
      { 
        $match: { 
          user_meal_schedule_id: { 
            $in: (await UserMealScheduleModel.find({ user_id: userObjectId }).distinct('_id')).map((id: any) => new ObjectId(id))
          },
          status: MealItemStatus.completed
        } 
      },
      { 
        $group: { 
          _id: null, 
          totalCalories: { $sum: { $ifNull: ['$actual_calories', '$calories'] } } 
        } 
      }
    ])
    const totalCaloriesConsumed = Math.round(caloriesAgg[0]?.totalCalories || 0)

    // Get user info for goals
    const user = await UserModel.findById(userObjectId)
    const dailyCalorieGoal = user?.BMR || 2000

    return {
      posts: {
        total: totalPosts,
        totalLikes: totalPostLikes,
        totalComments: totalComments
      },
      mealPlans: {
        created: totalMealPlans,
        applied: appliedMealPlans,
        hasActive: !!activeMealSchedule,
        activePlan: activeMealSchedule ? {
          _id: activeMealSchedule._id,
          title: (activeMealSchedule.meal_plan_id as any)?.title || 'Thực đơn',
          startDate: activeMealSchedule.start_date,
          endDate: activeMealSchedule.end_date,
          progress: activeMealSchedule.progress || 0
        } : null
      },
      nutrition: {
        totalCompletedMeals,
        totalCaloriesConsumed,
        dailyCalorieGoal
      }
    }
  }

  async getCaloriesHistory(userId: string, days: number = 30) {
    const userObjectId = new ObjectId(userId)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    // Get all schedule IDs for this user
    const scheduleIds = await UserMealScheduleModel.find({ user_id: userObjectId }).distinct('_id')

    const caloriesData = await UserMealItemModel.aggregate([
      { 
        $match: { 
          user_meal_schedule_id: { $in: scheduleIds.map((id: any) => new ObjectId(id)) },
          scheduled_date: { $gte: startDate }
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$scheduled_date' } },
          calories: { $sum: { $ifNull: ['$actual_calories', '$calories'] } },
          protein: { $sum: '$protein' },
          carbs: { $sum: '$carbs' },
          fat: { $sum: '$fat' },
          mealsCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])

    // Fill in missing days with 0
    const result = []
    const currentDate = new Date(startDate)
    const endDate = new Date()
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const dayData = caloriesData.find((d: any) => d._id === dateStr)
      result.push({
        date: dateStr,
        calories: Math.round(dayData?.calories || 0),
        protein: Math.round(dayData?.protein || 0),
        carbs: Math.round(dayData?.carbs || 0),
        fat: Math.round(dayData?.fat || 0),
        mealsCount: dayData?.mealsCount || 0
      })
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return result
  }

  async getTodayMeals(userId: string) {
    const userObjectId = new ObjectId(userId)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const activeSchedule = await UserMealScheduleModel.findOne({
      user_id: userObjectId,
      status: ScheduleStatus.active
    })

    if (!activeSchedule) {
      return {
        hasActiveSchedule: false,
        meals: [],
        todayNutrition: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          completed: 0,
          total: 0
        }
      }
    }

    // Get today's meals from UserMealItemModel
    const todayMeals = await UserMealItemModel.find({
      user_meal_schedule_id: activeSchedule._id,
      scheduled_date: { $gte: today, $lt: tomorrow }
    }).populate({
      path: 'recipe_id',
      select: 'title image thumbnail calories protein carbs fat cooking_time'
    }).sort({ meal_type: 1 })

    const mealTypeLabels: Record<number, string> = {
      0: 'breakfast',
      1: 'lunch', 
      2: 'dinner',
      3: 'snack'
    }

    const meals = todayMeals.map(meal => ({
      _id: meal._id,
      type: mealTypeLabels[meal.meal_type] || 'meal',
      name: meal.name || (meal.recipe_id as any)?.title || 'Món ăn',
      recipe: meal.recipe_id,
      status: meal.status === MealItemStatus.completed ? 'completed' : 
              meal.status === MealItemStatus.skipped ? 'skipped' : 'pending',
      scheduled_time: meal.scheduled_time,
      nutrition: {
        calories: meal.actual_calories || meal.calories || (meal.recipe_id as any)?.calories || 0,
        protein: meal.protein || (meal.recipe_id as any)?.protein || 0,
        carbs: meal.carbs || (meal.recipe_id as any)?.carbs || 0,
        fat: meal.fat || (meal.recipe_id as any)?.fat || 0
      }
    }))

    // Calculate today's nutrition (from completed meals)
    const completedMeals = meals.filter(m => m.status === 'completed')
    const todayNutrition = {
      calories: Math.round(completedMeals.reduce((sum, m) => sum + (m.nutrition?.calories || 0), 0)),
      protein: Math.round(completedMeals.reduce((sum, m) => sum + (m.nutrition?.protein || 0), 0)),
      carbs: Math.round(completedMeals.reduce((sum, m) => sum + (m.nutrition?.carbs || 0), 0)),
      fat: Math.round(completedMeals.reduce((sum, m) => sum + (m.nutrition?.fat || 0), 0)),
      completed: completedMeals.length,
      total: meals.length
    }

    return {
      hasActiveSchedule: true,
      meals,
      todayNutrition
    }
  }

  async getMealPlanHistory(userId: string, page: number = 1, limit: number = 10) {
    const userObjectId = new ObjectId(userId)
    const skip = (page - 1) * limit

    const [schedules, total] = await Promise.all([
      UserMealScheduleModel.find({ user_id: userObjectId })
        .populate({
          path: 'meal_plan_id',
          select: 'title description image category duration total_calories'
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      UserMealScheduleModel.countDocuments({ user_id: userObjectId })
    ])

    const history = await Promise.all(schedules.map(async (schedule) => {
      // Get stats from UserMealItemModel for this schedule
      const [totalMeals, completedMeals, caloriesAgg] = await Promise.all([
        UserMealItemModel.countDocuments({ user_meal_schedule_id: schedule._id }),
        UserMealItemModel.countDocuments({ 
          user_meal_schedule_id: schedule._id, 
          status: MealItemStatus.completed 
        }),
        UserMealItemModel.aggregate([
          { 
            $match: { 
              user_meal_schedule_id: schedule._id,
              status: MealItemStatus.completed
            } 
          },
          { 
            $group: { 
              _id: null, 
              total: { $sum: { $ifNull: ['$actual_calories', '$calories'] } } 
            } 
          }
        ])
      ])

      const statusLabels: Record<number, string> = {
        [ScheduleStatus.active]: 'active',
        [ScheduleStatus.paused]: 'paused',
        [ScheduleStatus.completed]: 'completed',
        [ScheduleStatus.cancelled]: 'cancelled'
      }

      return {
        _id: schedule._id,
        mealPlan: schedule.meal_plan_id,
        status: statusLabels[schedule.status] || 'active',
        startDate: schedule.start_date,
        endDate: schedule.end_date,
        progress: schedule.progress || (totalMeals > 0 ? Math.round((completedMeals / totalMeals) * 100) : 0),
        stats: {
          totalMeals,
          completedMeals,
          totalCaloriesConsumed: Math.round(caloriesAgg[0]?.total || 0)
        },
        createdAt: (schedule as any).createdAt
      }
    }))

    return {
      history,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  async getPersonalPostsStats(userId: string) {
    const userObjectId = new ObjectId(userId)

    // Get posts with engagement data
    const posts = await PostModel.find({ user_id: userObjectId })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('content createdAt')

    // Early return if no posts
    if (!posts || posts.length === 0) {
      return {
        recentPosts: [],
        topPosts: [],
        engagementByDay: [],
        summary: {
          totalPosts: 0,
          totalLikes: 0,
          totalComments: 0,
          averageLikesPerPost: 0
        }
      }
    }

    const postIds = posts.map(p => p._id)

    // Get likes and comments counts for each post
    const [likesPerPost, commentsPerPost] = await Promise.all([
      LikePostModel.aggregate([
        { $match: { post_id: { $in: postIds } } },
        { $group: { _id: '$post_id', count: { $sum: 1 } } }
      ]),
      CommentPostModel.aggregate([
        { $match: { post_id: { $in: postIds } } },
        { $group: { _id: '$post_id', count: { $sum: 1 } } }
      ])
    ])

    const likesMap = new Map((likesPerPost || []).map((l: any) => [l._id.toString(), l.count]))
    const commentsMap = new Map((commentsPerPost || []).map((c: any) => [c._id.toString(), c.count]))

    const postsWithEngagement = posts.map(post => ({
      _id: post._id,
      content: post.content,
      createdAt: (post as any).createdAt,
      likes: likesMap.get(post._id.toString()) || 0,
      comments: commentsMap.get(post._id.toString()) || 0
    }))

    // Filter out documents that lack a valid createdAt to avoid date parsing errors
    const isValidDate = (d: any) => {
      const dt = new Date(d)
      return !isNaN(dt.getTime())
    }
    const postsWithValidDates = postsWithEngagement.filter(p => isValidDate(p.createdAt))

    // Calculate totals
    const totalLikes = postsWithEngagement.reduce((sum, p) => sum + p.likes, 0)
    const totalComments = postsWithEngagement.reduce((sum, p) => sum + p.comments, 0)

    // Get top posts by likes
    const topPosts = [...postsWithEngagement]
      .sort((a, b) => b.likes - a.likes)
      .slice(0, 5)

    // Calculate engagement over time
    const last30Days = new Date()
    last30Days.setDate(last30Days.getDate() - 30)

    const recentPosts = postsWithValidDates.filter(p => 
      new Date((p as any).createdAt) >= last30Days
    )

    const engagementByDay = recentPosts.reduce((acc: any[], post) => {
      const dateStr = new Date((post as any).createdAt).toISOString().split('T')[0]
      const existing = acc.find(d => d._id === dateStr)
      if (existing) {
        existing.posts += 1
        existing.likes += post.likes
        existing.comments += post.comments
      } else {
        acc.push({
          _id: dateStr,
          posts: 1,
          likes: post.likes,
          comments: post.comments
        })
      }
      return acc
    }, []).sort((a, b) => a._id.localeCompare(b._id))

    return {
      recentPosts: postsWithEngagement.slice(0, 10),
      topPosts,
      engagementByDay,
      summary: {
        totalPosts: posts.length,
        totalLikes,
        totalComments,
        averageLikesPerPost: posts.length > 0 ? Math.round(totalLikes / posts.length) : 0
      }
    }
  }

  async getNutritionTrend(userId: string, days: number = 7) {
    const userObjectId = new ObjectId(userId)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    // Get user's daily goal
    const user = await UserModel.findById(userObjectId)
    const dailyGoal = {
      calories: user?.BMR || 2000,
      protein: Math.round((user?.BMR || 2000) * 0.3 / 4), // 30% from protein
      carbs: Math.round((user?.BMR || 2000) * 0.4 / 4), // 40% from carbs
      fat: Math.round((user?.BMR || 2000) * 0.3 / 9) // 30% from fat
    }

    // Get all schedule IDs for this user
    const scheduleIds = await UserMealScheduleModel.find({ user_id: userObjectId }).distinct('_id')

    const nutritionData = await UserMealItemModel.aggregate([
      { 
        $match: { 
          user_meal_schedule_id: { $in: scheduleIds.map((id: any) => new ObjectId(id)) },
          scheduled_date: { $gte: startDate }
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$scheduled_date' } },
          calories: { $sum: { $ifNull: ['$actual_calories', '$calories'] } },
          protein: { $sum: '$protein' },
          carbs: { $sum: '$carbs' },
          fat: { $sum: '$fat' }
        }
      },
      { $sort: { _id: 1 } }
    ])

    // Fill in missing days
    const result = []
    const currentDate = new Date(startDate)
    const endDate = new Date()
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const dayData = nutritionData.find((d: any) => d._id === dateStr)
      result.push({
        date: dateStr,
        actual: {
          calories: Math.round(dayData?.calories || 0),
          protein: Math.round(dayData?.protein || 0),
          carbs: Math.round(dayData?.carbs || 0),
          fat: Math.round(dayData?.fat || 0)
        },
        goal: dailyGoal,
        percentage: {
          calories: Math.round(((dayData?.calories || 0) / dailyGoal.calories) * 100),
          protein: Math.round(((dayData?.protein || 0) / dailyGoal.protein) * 100),
          carbs: Math.round(((dayData?.carbs || 0) / dailyGoal.carbs) * 100),
          fat: Math.round(((dayData?.fat || 0) / dailyGoal.fat) * 100)
        }
      })
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return {
      trend: result,
      dailyGoal,
      averages: {
        calories: Math.round(result.reduce((sum, d) => sum + d.actual.calories, 0) / result.length),
        protein: Math.round(result.reduce((sum, d) => sum + d.actual.protein, 0) / result.length),
        carbs: Math.round(result.reduce((sum, d) => sum + d.actual.carbs, 0) / result.length),
        fat: Math.round(result.reduce((sum, d) => sum + d.actual.fat, 0) / result.length)
      }
    }
  }
}

const personalDashboardService = new PersonalDashboardService()
export default personalDashboardService
