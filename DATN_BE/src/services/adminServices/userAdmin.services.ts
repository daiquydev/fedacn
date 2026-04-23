import { omit } from 'lodash'
import { ObjectId } from 'mongodb'
import { roundKcal } from '~/utils/math.utils'
import { AlbumStatus, BlogStatus, RecipeStatus, RequestType, UserRoles } from '~/constants/enums'
import { CreateUserAdminBody, GetListUserAdminQuery } from '~/models/requests/userAdmin.request'
import AlbumModel from '~/models/schemas/album.schema'
import BlogModel from '~/models/schemas/blog.schema'
import CommentBlogModel from '~/models/schemas/commentBlog.schema'
import CommentPostModel from '~/models/schemas/commentPost.schema'
import LikePostModel from '~/models/schemas/likePost.schema'
import PostModel from '~/models/schemas/post.schema'
import RecipeModel from '~/models/schemas/recipe.schema'
import RefreshTokenModel from '~/models/schemas/refreshToken.schema'
import AIUsageLogModel from '~/models/schemas/aiUsageLog.schema'
import ChallengeModel from '~/models/schemas/challenge.schema'
import SportEventModel from '~/models/schemas/sportEvent.schema'
import UserModel from '~/models/schemas/user.schema'
import WorkoutSessionModel from '~/models/schemas/workoutSession.schema'
import { hashPassword } from '~/utils/crypto'
import { sendAcceptEmailNodeMailer, sendRejectEmailNodeMailer } from '~/utils/emailMailer'

class UserAdminService {
  async getAllUserService({
    page,
    limit,
    role,
    status,
    search,
    sort,
    isDeleted
  }: GetListUserAdminQuery & { isDeleted?: string }) {
    if (!page) {
      page = 1
    }
    if (!limit) {
      limit = 10
    }

    const condition: any = {}

    // Filter by role (only if explicitly provided)
    if (role !== undefined && role !== null && !isNaN(Number(role))) {
      condition.role = Number(role)
    } else {
      condition.role = UserRoles.user
    }

    if (status !== undefined && status !== null && !isNaN(Number(status))) {
      condition.status = Number(status)
    }

    if (isDeleted === 'true') {
      condition.isDeleted = true
    } else {
      condition.isDeleted = { $ne: true }
    }

    if (search) {
      condition.$text = { $search: search }
    }

    const users = await UserModel.find(condition)
      .sort({ createdAt: sort === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    const total = await UserModel.countDocuments(condition)
    const totalPage = Math.ceil(total / limit)
    return {
      users,
      total,
      limit,
      page,
      totalPage
    }
  }
  async getUserByIdService(user_id: string) {
    const user = await UserModel.aggregate([
      {
        $match: {
          _id: new ObjectId(user_id)
        }
      },
      // Followers
      {
        $lookup: {
          from: 'follows',
          localField: '_id',
          foreignField: 'follow_id',
          as: 'followers'
        }
      },
      {
        $addFields: {
          followers_count: { $size: '$followers' }
        }
      },
      // Posts
      {
        $lookup: {
          from: 'posts',
          let: { uid: '$_id' },
          pipeline: [{ $match: { $expr: { $eq: ['$user_id', '$$uid'] }, is_banned: false } }],
          as: 'posts'
        }
      },
      {
        $addFields: {
          posts_count: { $size: '$posts' }
        }
      },
      // Likes given by user
      {
        $lookup: {
          from: 'like_posts',
          localField: '_id',
          foreignField: 'user_id',
          as: 'likes'
        }
      },
      {
        $addFields: {
          likes_count: { $size: '$likes' }
        }
      },
      // Sport event attendance
      {
        $lookup: {
          from: 'sport_event_attendance',
          localField: '_id',
          foreignField: 'userId',
          as: 'event_attendance'
        }
      },
      {
        $addFields: {
          events_attended: { $size: '$event_attendance' }
        }
      },
      // Workout sessions (completed only)
      {
        $lookup: {
          from: 'workout_sessions',
          let: { uid: '$_id' },
          pipeline: [{ $match: { $expr: { $eq: ['$user_id', '$$uid'] }, status: 'completed' } }],
          as: 'workout_sessions'
        }
      },
      {
        $addFields: {
          workouts_completed: { $size: '$workout_sessions' },
          total_workout_kcal: {
            $reduce: {
              input: '$workout_sessions',
              initialValue: 0,
              in: { $add: ['$$value', { $ifNull: ['$$this.total_calories', 0] }] }
            }
          }
        }
      },
      // Challenge participation (bỏ quit — không còn coi là đang tham gia)
      {
        $lookup: {
          from: 'challenge_participants',
          let: { uid: '$_id' },
          pipeline: [{ $match: { $expr: { $eq: ['$user_id', '$$uid'] } } }],
          as: 'challenge_parts'
        }
      },
      {
        $addFields: {
          challenges_joined: {
            $size: {
              $filter: {
                input: '$challenge_parts',
                as: 'cp',
                cond: { $ne: ['$$cp.status', 'quit'] }
              }
            }
          },
          challenges_completed: {
            $size: {
              $filter: {
                input: '$challenge_parts',
                as: 'cp',
                cond: { $eq: ['$$cp.status', 'completed'] }
              }
            }
          }
        }
      },
      // Activity score calculation
      {
        $addFields: {
          activity_score: {
            $add: [
              { $multiply: ['$posts_count', 3] },
              { $multiply: ['$events_attended', 5] },
              { $multiply: ['$challenges_joined', 4] },
              { $multiply: ['$workouts_completed', 2] },
              { $multiply: ['$followers_count', 1] },
              { $multiply: ['$likes_count', 0.5] }
            ]
          }
        }
      },
      {
        $addFields: {
          activity_level: {
            $switch: {
              branches: [
                { case: { $gte: ['$activity_score', 50] }, then: 'very_active' },
                { case: { $gte: ['$activity_score', 20] }, then: 'active' },
                { case: { $gte: ['$activity_score', 5] }, then: 'low_activity' }
              ],
              default: 'inactive'
            }
          }
        }
      },
      // Clean up — remove raw arrays, keep only counts
      {
        $project: {
          password: 0,
          followers: 0,
          posts: 0,
          likes: 0,
          event_attendance: 0,
          workout_sessions: 0,
          challenge_parts: 0
        }
      }
    ])

    if (!user.length) {
      return user
    }

    const uid = new ObjectId(user_id)
    const truncateSummary = (text: string | undefined, max = 160) => {
      const s = (text ?? '').trim()
      if (!s) return ''
      if (s.length <= max) return s
      return `${s.slice(0, max)}…`
    }

    const [bannedPosts, modEvents, modChallenges] = await Promise.all([
      PostModel.find({ user_id: uid, is_banned: true })
        .sort({ updatedAt: -1 })
        .limit(40)
        .select({ content: 1, updatedAt: 1 })
        .lean(),
      SportEventModel.find({
        createdBy: uid,
        isDeleted: true,
        deletedFromReportModeration: true
      })
        .sort({ deletedAt: -1, updatedAt: -1 })
        .limit(40)
        .select({ name: 1, deletedAt: 1, updatedAt: 1 })
        .lean(),
      ChallengeModel.find({
        creator_id: uid,
        is_deleted: true,
        deleted_from_report_moderation: true
      })
        .sort({ deleted_at: -1, updatedAt: -1 })
        .limit(40)
        .select({ title: 1, deleted_at: 1, updatedAt: 1 })
        .lean()
    ])

    type ModerationViolation = {
      kind: 'post' | 'sport_event' | 'challenge'
      ref_id: string
      summary: string
      occurred_at?: Date | null
    }

    const moderation_violations: ModerationViolation[] = [
      ...bannedPosts.map((p) => {
        const preview = truncateSummary(p.content as string | undefined)
        return {
          kind: 'post' as const,
          ref_id: String(p._id),
          summary: preview || 'Bài viết không còn nội dung hiển thị',
          occurred_at: (p as { updatedAt?: Date }).updatedAt
        }
      }),
      ...modEvents.map((e) => ({
        kind: 'sport_event' as const,
        ref_id: String(e._id),
        summary: truncateSummary(e.name as string | undefined) || 'Sự kiện',
        occurred_at: (e.deletedAt as Date | null | undefined) ?? (e as { updatedAt?: Date }).updatedAt
      })),
      ...modChallenges.map((c) => ({
        kind: 'challenge' as const,
        ref_id: String(c._id),
        summary: truncateSummary(c.title as string | undefined) || 'Thử thách',
        occurred_at:
          (c.deleted_at as Date | null | undefined) ?? (c as { updatedAt?: Date }).updatedAt
      }))
    ].sort((a, b) => {
      const ta = a.occurred_at ? new Date(a.occurred_at).getTime() : 0
      const tb = b.occurred_at ? new Date(b.occurred_at).getTime() : 0
      return tb - ta
    })

    return [{ ...user[0], moderation_violations }]
  }
  async deleteUserByIdService(user_id: string) {
    const user = await UserModel.findById(user_id)
    if (user) {
      // Soft delete — mark as deleted, revoke tokens
      await RefreshTokenModel.deleteMany({ user_id })
      await UserModel.findByIdAndUpdate(user_id, { isDeleted: true })
      return true
    }
  }
  async restoreUserByIdService(user_id: string) {
    const user = await UserModel.findById(user_id)
    if (user) {
      await UserModel.findByIdAndUpdate(user_id, { isDeleted: false })
      return true
    }
  }
  async getUserStatsService() {
    const [active, deleted] = await Promise.all([
      UserModel.countDocuments({ role: UserRoles.user, isDeleted: { $ne: true } }),
      UserModel.countDocuments({ role: UserRoles.user, isDeleted: true })
    ])
    return { active, deleted, total: active }
  }
  async checkEmailExist(email: string) {
    const user = await UserModel.findOne({ email })
    return Boolean(user)
  }
  async checkUserNameExist(user_name: string) {
    const user = await UserModel.findOne({ user_name })
    return Boolean(user)
  }
  async createWritterAndInspectorService({ name, email, user_name, role }: CreateUserAdminBody) {
    const password = '123456789Dd@'
    const hashedPassword = await hashPassword(password)
    const user = await UserModel.create({ name, email, user_name, password: hashedPassword, role })
    const newUser = omit(user.toObject(), ['password'])
    return newUser
  }
  async getRequestUpgradeService({
    type,
    page,
    limit,
    search
  }: {
    type: number
    page: number
    limit: number
    search: string
  }) {
    console.log('type', type)
    if (!type) {
      type = RequestType.follow
    }
    if (!page) {
      page = 1
    }
    if (!limit) {
      limit = 10
    }
    const condition: any = {
      role: UserRoles.user
    }
    condition['upgrade_request.type'] = type
    console.log('condition', condition)
    if (search) {
      condition.$text = { $search: search }
    }

    const users = await UserModel.find(condition)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    const total = await UserModel.countDocuments(condition)
    const totalPage = Math.ceil(total / limit)

    return {
      users,
      limit,
      page,
      totalPage
    }
  }
  async rejectRequestUpgradeService(user_id: string) {
    const user = await UserModel.findByIdAndUpdate(
      user_id,
      {
        upgrade_request: {
          reason: null,
          proof: null,
          type: null
        }
      },
      { new: true }
    )
    // gửi email thông báo
    if (user) {
      await sendRejectEmailNodeMailer(user.email, user.name)
    }

    return user
  }
  async acceptRequestUpgradeService(user_id: string) {
    const user = await UserModel.findByIdAndUpdate(
      user_id,
      {
        role: UserRoles.chef,
        upgrade_request: {
          reason: null,
          proof: null,
          type: null
        }
      },
      { new: true }
    )
    if (user) {
      //xóa refresh token của user
      await RefreshTokenModel.deleteMany({ user_id })
      await sendAcceptEmailNodeMailer(user.email, user.name)
    }
    return user
  }
  async dashboardService() {
    // === ACCOUNT ===
    const [user, activeUser] = await Promise.all([
      UserModel.countDocuments({ role: UserRoles.user }),
      UserModel.countDocuments({ role: UserRoles.user, isDeleted: { $ne: true } })
    ])

    // === FOOD CONTENT ===
    const [activeRecipe, pendingRecipe, rejectRecipe] = await Promise.all([
      RecipeModel.countDocuments({ status: RecipeStatus.accepted }),
      RecipeModel.countDocuments({ status: RecipeStatus.pending }),
      RecipeModel.countDocuments({ status: RecipeStatus.rejected })
    ])
    const [activeAlbum, pendingAlbum, rejectAlbum] = await Promise.all([
      AlbumModel.countDocuments({ status: AlbumStatus.accepted }),
      AlbumModel.countDocuments({ status: AlbumStatus.pending }),
      AlbumModel.countDocuments({ status: AlbumStatus.rejected })
    ])
    const [activeBlog, pendingBlog, rejectBlog] = await Promise.all([
      BlogModel.countDocuments({ status: BlogStatus.accepted }),
      BlogModel.countDocuments({ status: BlogStatus.pending }),
      BlogModel.countDocuments({ status: BlogStatus.rejected })
    ])

    // === COMMUNITY STATS ===
    const tenDaysAgoCommunity = new Date()
    tenDaysAgoCommunity.setDate(tenDaysAgoCommunity.getDate() - 10)

    const [totalPosts, totalComments, totalLikes, reportedPosts] = await Promise.all([
      PostModel.countDocuments({ is_banned: false }),
      CommentPostModel.countDocuments({ is_banned: false }),
      LikePostModel.countDocuments({}),
      PostModel.countDocuments({ 'report_post.0': { $exists: true }, is_banned: false })
    ])

    // 10-ngày trend: posts mỗi ngày
    const posts = await PostModel.aggregate([
      { $match: { createdAt: { $gte: tenDaysAgoCommunity }, is_banned: false } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ])

    // 10-ngày trend: comments mỗi ngày
    const dailyComments = await CommentPostModel.aggregate([
      { $match: { createdAt: { $gte: tenDaysAgoCommunity }, is_banned: false } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ])

    // 10-ngày trend: likes mỗi ngày
    const dailyLikes = await LikePostModel.aggregate([
      { $match: { createdAt: { $gte: tenDaysAgoCommunity } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ])

    // === BMI DISTRIBUTION ===
    const bmiUsers = await UserModel.aggregate([
      {
        $match: {
          role: UserRoles.user,
          isDeleted: { $ne: true },
          BMI: { $ne: null, $exists: true }
        }
      },
      { $project: { BMI: 1 } }
    ])
    const underWeight = bmiUsers.filter((u) => u.BMI < 18.5).length
    const normal = bmiUsers.filter((u) => u.BMI >= 18.5 && u.BMI < 24.9).length
    const overWeight = bmiUsers.filter((u) => u.BMI >= 25 && u.BMI < 29.9).length
    const obesity = bmiUsers.filter((u) => u.BMI >= 30).length
    const totalBmiUsers = bmiUsers.length

    // === AI USAGE ===
    const tenDaysAgoAI = new Date()
    tenDaysAgoAI.setDate(tenDaysAgoAI.getDate() - 10)

    const [aiCreatePost, aiAnalyzeFitness, aiAnalyzeWorkout, aiDailyRaw] = await Promise.all([
      AIUsageLogModel.countDocuments({ feature: 'create_post' }),
      AIUsageLogModel.countDocuments({ feature: 'analyze_fitness' }),
      AIUsageLogModel.countDocuments({ feature: 'analyze_workout' }),
      AIUsageLogModel.aggregate([
        { $match: { createdAt: { $gte: tenDaysAgoAI } } },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              feature: '$feature'
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.date': 1 } }
      ])
    ])

    // Reshape: tách thành 3 series riêng
    const aiDailyCreatePost = aiDailyRaw
      .filter((d: any) => d._id.feature === 'create_post')
      .map((d: any) => ({ _id: d._id.date, count: d.count }))
    const aiDailyAnalyzeFitness = aiDailyRaw
      .filter((d: any) => d._id.feature === 'analyze_fitness')
      .map((d: any) => ({ _id: d._id.date, count: d.count }))
    const aiDailyAnalyzeWorkout = aiDailyRaw
      .filter((d: any) => d._id.feature === 'analyze_workout')
      .map((d: any) => ({ _id: d._id.date, count: d.count }))

    // === SPORT EVENTS & CHALLENGES ===
    const [totalEvents, outdoorEvents, indoorEvents, totalChallenges] = await Promise.all([
      SportEventModel.countDocuments({ isDeleted: { $ne: true } }),
      SportEventModel.countDocuments({ isDeleted: { $ne: true }, eventType: 'Ngoài trời' }),
      SportEventModel.countDocuments({ isDeleted: { $ne: true }, eventType: 'Trong nhà' }),
      ChallengeModel.countDocuments({ is_deleted: { $ne: true } })
    ])

    // Top 5 thể loại sport theo loại hình — đếm sự kiện + số người tham gia thực tế
    const [topOutdoorCategories, topIndoorCategories] = await Promise.all([
      SportEventModel.aggregate([
        { $match: { isDeleted: { $ne: true }, eventType: 'Ngoài trời' } },
        {
          $group: {
            _id: '$category',
            eventCount: { $sum: 1 },
            totalParticipants: { $sum: { $size: { $ifNull: ['$participants_ids', []] } } }
          }
        },
        { $sort: { eventCount: -1 } },
        { $limit: 5 },
        { $project: { _id: 0, category: '$_id', eventCount: 1, totalParticipants: 1 } }
      ]),
      SportEventModel.aggregate([
        { $match: { isDeleted: { $ne: true }, eventType: 'Trong nhà' } },
        {
          $group: {
            _id: '$category',
            eventCount: { $sum: 1 },
            totalParticipants: { $sum: { $size: { $ifNull: ['$participants_ids', []] } } }
          }
        },
        { $sort: { eventCount: -1 } },
        { $limit: 5 },
        { $project: { _id: 0, category: '$_id', eventCount: 1, totalParticipants: 1 } }
      ])
    ])

    // === WORKOUT SESSIONS ===
    const tenDaysAgo = new Date()
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10)

    const [totalSessions, totalKcalResult, dailySessions] = await Promise.all([
      WorkoutSessionModel.countDocuments({ status: 'completed' }),
      WorkoutSessionModel.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$total_calories' } } }
      ]),
      WorkoutSessionModel.aggregate([
        {
          $match: {
            status: 'completed',
            finished_at: { $gte: tenDaysAgo }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$finished_at' } },
            count: { $sum: 1 },
            totalKcal: { $sum: '$total_calories' }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ])

    const totalKcal = totalKcalResult?.[0]?.total ?? 0

    return {
      account: {
        users: { total: user, active: activeUser }
      },
      food: {
        recipes: { total: activeRecipe, pending: pendingRecipe, reject: rejectRecipe },
        albums: { total: activeAlbum, pending: pendingAlbum, reject: rejectAlbum },
        blogs: { total: activeBlog, pending: pendingBlog, reject: rejectBlog }
      },
      posts,
      usersBMI: { total: totalBmiUsers, underWeight, normal, overWeight, obesity },
      sportEvents: {
        total: totalEvents,
        outdoor: outdoorEvents,
        indoor: indoorEvents,
        topOutdoorCategories,
        topIndoorCategories
      },
      challenges: {
        total: totalChallenges
      },
      workoutStats: {
        totalSessions,
        totalKcal: roundKcal(totalKcal),
        dailySessions
      },
      communityStats: {
        totalPosts,
        totalComments,
        totalLikes,
        reportedPosts,
        dailyPosts: posts,
        dailyComments,
        dailyLikes
      },
      aiUsage: {
        createPost: aiCreatePost,
        analyzeFitness: aiAnalyzeFitness,
        analyzeWorkout: aiAnalyzeWorkout,
        total: aiCreatePost + aiAnalyzeFitness + aiAnalyzeWorkout,
        dailyCreatePost: aiDailyCreatePost,
        dailyAnalyzeFitness: aiDailyAnalyzeFitness,
        dailyAnalyzeWorkout: aiDailyAnalyzeWorkout
      }
    }
  }
}

const userAdminService = new UserAdminService()
export default userAdminService
