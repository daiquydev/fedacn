import { ObjectId } from 'mongodb'
import HTTP_STATUS from '~/constants/httpStatus'
import { MEAL_PLAN_MESSAGE } from '~/constants/messages'
import { MealPlanCategory, MealPlanStatus, MealPlanInviteStatus, NotificationTypes, ScheduleStatus, UserStatus } from '~/constants/enums'
import MealPlanModel from '~/models/schemas/mealPlan.schema'
import MealPlanDayModel from '~/models/schemas/mealPlanDay.schema'
import MealPlanMealModel from '~/models/schemas/mealPlanMeal.schema'
import MealPlanLikeModel from '~/models/schemas/mealPlanLike.schema'
import MealPlanBookmarkModel from '~/models/schemas/mealPlanBookmark.schema'
import MealPlanCommentModel from '~/models/schemas/mealPlanComment.schema'
import MealPlanRatingModel from '~/models/schemas/mealPlanRating.schema'
import UserMealScheduleModel from '~/models/schemas/userMealSchedule.schema'
import userMealScheduleServices from './userMealSchedule.services'
import FollowModel from '~/models/schemas/follow.schema'
import UserModel from '~/models/schemas/user.schema'
import MealPlanInviteModel from '~/models/schemas/mealPlanInvite.schema'
import NotificationModel from '~/models/schemas/notification.schema'
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
        // Validate: phải có recipe_id HOẶC name
        if (!mealData.recipe_id && !mealData.name) {
          throw new ErrorWithStatus({
            message: 'Món ăn phải có recipe_id hoặc name',
            status: HTTP_STATUS.BAD_REQUEST
          })
        }

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

    let sortOption: any = { createdAt: -1 }
    if (sort === 'popular') sortOption = { likes_count: -1 }
    if (sort === 'newest') sortOption = { createdAt: -1 }

    console.log('Query:', query, 'Sort:', sortOption, 'Skip:', skip, 'Limit:', limit)

    const [mealPlans, total] = await Promise.all([
      MealPlanModel.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .select('_id title description duration category image status is_public difficulty_level likes_count comments_count bookmarks_count rating createdAt author_id')
        .populate({
          path: 'author_id',
          select: 'name avatar',
          options: { lean: true }
        })
        .lean()
        .exec(),
      MealPlanModel.countDocuments(query)
    ])

    console.log('Found meal plans:', mealPlans.length)

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
          .populate(
            'recipe_id',
            'title image difficulty_level time content ingredients energy protein fat carbohydrate instructions processing_food'
          )
          .sort({ meal_type: 1 })
          .exec()

        const enrichedMeals = meals.map((mealDoc) => {
          const meal = mealDoc.toObject()
          const cooking = buildMealCookingPayload(meal)

          return {
            ...meal,
            cooking_steps: cooking.steps,
            cooking_html: cooking.html,
            has_cooking: cooking.hasInstructions,
            cooking_source: cooking.source
          }
        })
        
        return {
          ...day.toObject(),
          meals: enrichedMeals
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

  async getMealCookingInstructionsService({
    meal_plan_id,
    meal_id
  }: {
    meal_plan_id: string
    meal_id: string
    user_id?: string
  }) {
    const meal = await MealPlanMealModel.findById(meal_id)
      .populate(
        'recipe_id',
        'title image instructions content ingredients energy protein fat carbohydrate difficult_level processing_food'
      )
      .exec()

    if (!meal) {
      throw new ErrorWithStatus({
        message: MEAL_PLAN_MESSAGE.MEAL_PLAN_MEAL_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const day = await MealPlanDayModel.findById(meal.meal_plan_day_id).select('meal_plan_id day_number title').exec()
    if (!day || day.meal_plan_id.toString() !== meal_plan_id) {
      throw new ErrorWithStatus({
        message: MEAL_PLAN_MESSAGE.MEAL_PLAN_MEAL_MISMATCH,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    type PopulatedRecipe = {
      _id: ObjectId
      title?: string
      image?: string
      instructions?: any
      content?: string
      processing_food?: string
    }

    const recipeCandidate = meal.recipe_id as unknown
    const recipeDoc =
      recipeCandidate && typeof recipeCandidate === 'object' && recipeCandidate !== null && 'instructions' in (recipeCandidate as Record<string, unknown>)
        ? (recipeCandidate as PopulatedRecipe)
        : null

    const mealObject = meal.toObject ? meal.toObject() : meal
    const cookingPayload = buildMealCookingPayload(mealObject)
    const ingredients = normalizeMealIngredientsForResponse(meal)

    return {
      meal: {
        id: meal._id,
        meal_type: meal.meal_type,
        day_number: day.day_number,
        title: meal.name || recipeDoc?.title || '',
        image: meal.image || recipeDoc?.image || '',
        recipe_id: recipeDoc?._id || meal.recipe_id || null
      },
      cooking: {
        steps: cookingPayload.steps,
        html: cookingPayload.html,
        ingredients
      }
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

    const startDateObj = new Date(start_date)
    const endDateObj = new Date(startDateObj.getTime() + (mealPlan.duration - 1) * 24 * 60 * 60 * 1000)

    const newSchedule = await UserMealScheduleModel.create({
      user_id: new ObjectId(user_id),
      meal_plan_id: new ObjectId(meal_plan_id),
      title,
      start_date: startDateObj,
      end_date: endDateObj,
      target_weight,
      notes,
      reminders
    })

    // Tạo danh sách món ăn theo plan cho toàn bộ ngày
    await userMealScheduleServices.createMealItemsFromPlanService({
      schedule_id: newSchedule._id,
      meal_plan_id,
      start_date: startDateObj
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

  async getMealPlanSocialContextService({ user_id, meal_plan_id }: any) {
    const userObjectId = new ObjectId(user_id)
    const mealPlanObjectId = new ObjectId(meal_plan_id)

    const mealPlanExists = await MealPlanModel.exists({ _id: mealPlanObjectId })
    if (!mealPlanExists) {
      throw new ErrorWithStatus({
        message: MEAL_PLAN_MESSAGE.MEAL_PLAN_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const mutualFriendIds = await findMutualFriendIds(userObjectId)
    if (!mutualFriendIds.length) {
      return {
        friends_applying: [],
        invite_candidates: [],
        invites: []
      }
    }

    const schedules = await UserMealScheduleModel.find({
      user_id: { $in: mutualFriendIds },
      meal_plan_id: mealPlanObjectId,
      status: { $in: [ScheduleStatus.active, ScheduleStatus.paused] }
    })
      .select('user_id start_date end_date progress status updatedAt')
      .populate('user_id', 'name avatar email')
      .exec()

    const friendsApplying = schedules.map((schedule) => {
      const scheduleDoc = schedule as any
      const userDoc = scheduleDoc.user_id as any
      return {
        user_id: userDoc._id,
        name: userDoc.name,
        avatar: userDoc.avatar,
        email: userDoc.email,
        start_date: scheduleDoc.start_date,
        end_date: scheduleDoc.end_date,
        progress: scheduleDoc.progress || 0,
        status: scheduleDoc.status,
        updated_at: scheduleDoc.updatedAt || scheduleDoc.updated_at
      }
    })

    const applyingIdSet = new Set(friendsApplying.map((item) => item.user_id.toString()))

    const pendingInvites = await MealPlanInviteModel.find({
      sender_id: userObjectId,
      meal_plan_id: mealPlanObjectId,
      status: MealPlanInviteStatus.pending
    })
      .populate('receiver_id', 'name avatar email')
      .exec()

    const pendingInviteMap = new Map(
      pendingInvites.map((invite) => [invite.receiver_id._id.toString(), invite])
    )

    const candidateIds = mutualFriendIds.filter((id) => !applyingIdSet.has(id.toString()))

    const inviteCandidatesDocs = await UserModel.find({
      _id: { $in: candidateIds },
      status: UserStatus.active
    })
      .select('name avatar email')
      .exec()

    const inviteCandidates = inviteCandidatesDocs.map((user) => ({
      user_id: user._id,
      name: user.name,
      avatar: user.avatar,
      email: user.email,
      already_invited: pendingInviteMap.has(user._id.toString())
    }))

    const invites = pendingInvites.map((invite) => {
      const inviteDoc = invite as any
      const receiverDoc = inviteDoc.receiver_id as any
      return {
        invite_id: inviteDoc._id,
        receiver: {
          user_id: receiverDoc._id,
          name: receiverDoc.name,
          avatar: receiverDoc.avatar,
          email: receiverDoc.email
        },
        status: inviteDoc.status,
        created_at: inviteDoc.createdAt || inviteDoc.created_at
      }
    })

    return {
      friends_applying: friendsApplying,
      invite_candidates: inviteCandidates,
      invites
    }
  }

  async inviteFriendToMealPlanService({ user_id, friend_id, meal_plan_id, note }: any) {
    if (user_id === friend_id) {
      throw new ErrorWithStatus({
        message: MEAL_PLAN_MESSAGE.INVITE_SELF_NOT_ALLOWED,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const mealPlan = await MealPlanModel.findById(meal_plan_id)
    if (!mealPlan) {
      throw new ErrorWithStatus({
        message: MEAL_PLAN_MESSAGE.MEAL_PLAN_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const userObjectId = new ObjectId(user_id)
    const friendObjectId = new ObjectId(friend_id)
    const mealPlanObjectId = new ObjectId(meal_plan_id)

    const mutualFriendIds = await findMutualFriendIds(userObjectId)
    const isMutual = mutualFriendIds.some((id) => id.equals(friendObjectId))
    if (!isMutual) {
      throw new ErrorWithStatus({
        message: MEAL_PLAN_MESSAGE.INVITE_TARGET_NOT_FRIEND,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const existingSchedule = await UserMealScheduleModel.findOne({
      user_id: friendObjectId,
      meal_plan_id: mealPlanObjectId,
      status: { $in: [ScheduleStatus.active, ScheduleStatus.paused] }
    })

    if (existingSchedule) {
      throw new ErrorWithStatus({
        message: MEAL_PLAN_MESSAGE.FRIEND_ALREADY_APPLYING,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const existingInvite = await MealPlanInviteModel.findOne({
      sender_id: userObjectId,
      receiver_id: friendObjectId,
      meal_plan_id: mealPlanObjectId,
      status: MealPlanInviteStatus.pending
    })

    if (existingInvite) {
      throw new ErrorWithStatus({
        message: MEAL_PLAN_MESSAGE.INVITE_ALREADY_SENT,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const invite = await MealPlanInviteModel.create({
      sender_id: userObjectId,
      receiver_id: friendObjectId,
      meal_plan_id: mealPlanObjectId,
      status: MealPlanInviteStatus.pending,
      note
    })

    await NotificationModel.create({
      sender_id: userObjectId,
      receiver_id: friendObjectId,
      type: NotificationTypes.mealPlanInvite,
      link_id: mealPlanObjectId,
      content: `${mealPlan.title}`,
      metadata: {
        invite_id: invite._id,
        meal_plan_id: mealPlanObjectId
      }
    })

    return invite
  }

  async rateMealPlanService({ user_id, meal_plan_id, rating }: any) {
    const numericRating = Number(rating)
    if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
      throw new ErrorWithStatus({
        message: MEAL_PLAN_MESSAGE.RATING_INVALID,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const mealPlanObjectId = new ObjectId(meal_plan_id)
    const userObjectId = new ObjectId(user_id)

    const mealPlan = await MealPlanModel.findById(mealPlanObjectId)
    if (!mealPlan) {
      throw new ErrorWithStatus({
        message: MEAL_PLAN_MESSAGE.MEAL_PLAN_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const existingRating = await MealPlanRatingModel.findOne({
      user_id: userObjectId,
      meal_plan_id: mealPlanObjectId
    })

    let updatedRatingCount = mealPlan.rating_count
    let updatedAverage = mealPlan.rating

    if (existingRating) {
      const previous = existingRating.rating
      existingRating.rating = numericRating
      await existingRating.save()

      if (updatedRatingCount === 0) {
        updatedAverage = numericRating
      } else {
        updatedAverage = (mealPlan.rating * updatedRatingCount - previous + numericRating) / updatedRatingCount
      }
    } else {
      await MealPlanRatingModel.create({
        user_id: userObjectId,
        meal_plan_id: mealPlanObjectId,
        rating: numericRating
      })

      updatedRatingCount += 1
      updatedAverage = (mealPlan.rating * mealPlan.rating_count + numericRating) / updatedRatingCount
    }

    mealPlan.rating = Number(updatedAverage.toFixed(2))
    mealPlan.rating_count = updatedRatingCount
    await mealPlan.save()

    return {
      rating: mealPlan.rating,
      rating_count: mealPlan.rating_count
    }
  }

  async reportMealPlanService({ user_id, meal_plan_id, reason }: { user_id: string; meal_plan_id: string; reason: string }) {
    const normalizedReason = typeof reason === 'string' ? reason.trim() : ''
    if (!normalizedReason) {
      throw new ErrorWithStatus({
        message: MEAL_PLAN_MESSAGE.REASON_REQUIRED,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const mealPlanObjectId = new ObjectId(meal_plan_id)
    const userObjectId = new ObjectId(user_id)

    const mealPlan = await MealPlanModel.findById(mealPlanObjectId)
    if (!mealPlan) {
      throw new ErrorWithStatus({
        message: MEAL_PLAN_MESSAGE.MEAL_PLAN_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const alreadyReported = (mealPlan.report_meal_plan || []).some((entry: any) =>
      entry.user_id?.toString() === userObjectId.toString()
    )

    if (alreadyReported) {
      throw new ErrorWithStatus({
        message: MEAL_PLAN_MESSAGE.ALREADY_REPORTED,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    await MealPlanModel.updateOne(
      { _id: mealPlanObjectId },
      {
        $push: {
          report_meal_plan: {
            user_id: userObjectId,
            reason: normalizedReason,
            created_at: new Date()
          }
        }
      }
    )

    return {
      message: MEAL_PLAN_MESSAGE.REPORT_MEAL_PLAN_SUCCESS
    }
  }
}

// Helper functions for meal plan services
const findMutualFriendIds = async (userId: ObjectId) => {
  const followers = await FollowModel.find({ follow_id: userId }).select('user_id')
  if (!followers.length) return [] as ObjectId[]

  const followerIdSet = new Set(followers.map((doc) => doc.user_id.toString()))

  const followings = await FollowModel.find({ user_id: userId }).select('follow_id')

  const mutualIds = followings
    .map((doc) => doc.follow_id.toString())
    .filter((id) => followerIdSet.has(id))

  return mutualIds.map((id) => new ObjectId(id))
}

const normalizeInstructionInput = (source: any): string[] => {
  if (!source) return []

  const extractFromEntry = (entry: any): string => {
    if (typeof entry === 'string') return entry.trim()
    if (entry && typeof entry === 'object') {
      if (typeof entry.instruction === 'string') return entry.instruction.trim()
      if (typeof entry.description === 'string') return entry.description.trim()
      if (typeof entry.step === 'string') return entry.step.trim()
      if (typeof entry.note === 'string') return entry.note.trim()
    }
    return ''
  }

  if (Array.isArray(source)) {
    return source.map(extractFromEntry).filter(Boolean)
  }

  if (typeof source === 'string') {
    const trimmed = source.trim()
    if (!trimmed) return []

    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) {
          return parsed.map(extractFromEntry).filter(Boolean)
        }
      } catch (error) {
        // ignore parse errors and fall back to plain text splitting
      }
    }

    return trimmed
      .split(/\r?\n+/)
      .map((line) => line.replace(/^[0-9]+[\.\)\-]\s*/, '').trim())
      .filter(Boolean)
  }

  return []
}

const buildInstructionHtml = (steps: string[]) => {
  if (!steps.length) return ''

  const items = steps
    .map(
      (step, index) =>
        `<li class="leading-relaxed"><span class="font-semibold text-green-700 mr-2">Bước ${index + 1}:</span>${escapeHtml(step)}</li>`
    )
    .join('')

  return `<ol class="list-decimal pl-5 space-y-2 text-gray-800">${items}</ol>`
}

const escapeHtml = (text = '') =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const resolveFallbackHtml = (meal: any) => {
  const recipeInstructions = normalizeInstructionInput((meal.recipe_id as any)?.instructions)
  if (recipeInstructions.length) {
    return buildInstructionHtml(recipeInstructions)
  }

  const fallbackCandidates = [
    typeof meal.instructions === 'string' ? meal.instructions : '',
    typeof (meal.recipe_id as any)?.content === 'string' ? (meal.recipe_id as any)?.content : '',
    typeof meal.description === 'string' ? meal.description : ''
  ]

  const resolved = fallbackCandidates.find((value) => typeof value === 'string' && value.trim())
  return resolved?.trim() || '<p>Hướng dẫn chế biến sẽ được cập nhật sớm.</p>'
}

const buildMealCookingPayload = (meal: any) => {
  const recipeSteps = normalizeInstructionInput((meal.recipe_id as any)?.instructions)
  const customSteps = normalizeInstructionInput(meal.instructions)
  const hasRecipeSteps = recipeSteps.length > 0
  const hasCustomSteps = customSteps.length > 0

  if (hasRecipeSteps || hasCustomSteps) {
    const steps = hasRecipeSteps ? recipeSteps : customSteps

    return {
      steps,
      html: buildInstructionHtml(steps),
      hasInstructions: true,
      source: hasRecipeSteps ? 'recipe' : 'custom'
    }
  }

  return {
    steps: [],
    html: resolveFallbackHtml(meal),
    hasInstructions: false,
    source: 'fallback'
  }
}

const normalizeMealIngredientsForResponse = (meal: any) => {
  const customIngredients = Array.isArray(meal.ingredients) ? meal.ingredients : []
  const recipeIngredients = Array.isArray(meal.recipe_id?.ingredients) ? meal.recipe_id.ingredients : []
  const source = customIngredients.length ? customIngredients : recipeIngredients

  return source
    .map((ingredient: any) => {
      const amountValue = ingredient.amount ?? ingredient.quantity ?? ingredient.qty ?? ingredient.value ?? ''
      const parsedAmount =
        amountValue === '' || amountValue === null || typeof amountValue === 'undefined' ? '' : String(amountValue)

      return {
        name: ingredient.name || ingredient.title || '',
        amount: parsedAmount,
        unit: ingredient.unit || ingredient.unit_name || ingredient.measure || ''
      }
    })
    .filter((ingredient: any) => Boolean(ingredient.name))
}

const mealPlanServices = new MealPlanService()
export default mealPlanServices 