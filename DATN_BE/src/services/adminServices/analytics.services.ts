import AIUsageLogModel from '~/models/schemas/aiUsageLog.schema'
import PostModel from '~/models/schemas/post.schema'
import CommentPostModel from '~/models/schemas/commentPost.schema'
import SportEventModel from '~/models/schemas/sportEvent.schema'
import SportEventAttendanceModel from '~/models/schemas/sportEventAttendance.schema'
import WorkoutSessionModel from '~/models/schemas/workoutSession.schema'
import UserModel from '~/models/schemas/user.schema'
import { UserRoles } from '~/constants/enums'

function getDateRange(period?: string, startDate?: string, endDate?: string): { from: Date | null; to: Date } {
  const now = new Date()
  const to = endDate ? new Date(endDate + 'T23:59:59.999Z') : now

  if (startDate && endDate) {
    return { from: new Date(startDate + 'T00:00:00.000Z'), to }
  }

  switch (period) {
    case '24h': {
      const d = new Date(now)
      d.setHours(d.getHours() - 24)
      return { from: d, to: now }
    }
    case '7d': {
      const d = new Date(now)
      d.setDate(d.getDate() - 7)
      return { from: d, to: now }
    }
    case '1m': {
      const d = new Date(now)
      d.setMonth(d.getMonth() - 1)
      return { from: d, to: now }
    }
    case '6m': {
      const d = new Date(now)
      d.setMonth(d.getMonth() - 6)
      return { from: d, to: now }
    }
    case 'all':
      return { from: null, to: now }
    default: {
      // default 7 days
      const d = new Date(now)
      d.setDate(d.getDate() - 7)
      return { from: d, to: now }
    }
  }
}

class AnalyticsService {
  async getAIUsageAnalytics(period?: string, startDate?: string, endDate?: string) {
    const { from, to } = getDateRange(period, startDate, endDate)
    const dateMatch: any = {}
    if (from) dateMatch.createdAt = { $gte: from, $lte: to }

    // Totals per feature in range
    const [createPost, analyzeFitness, analyzeWorkout] = await Promise.all([
      AIUsageLogModel.countDocuments({ feature: 'create_post', ...dateMatch }),
      AIUsageLogModel.countDocuments({ feature: 'analyze_fitness', ...dateMatch }),
      AIUsageLogModel.countDocuments({ feature: 'analyze_workout', ...dateMatch })
    ])

    // Daily series grouped by date+feature
    const dailyRaw = await AIUsageLogModel.aggregate([
      { $match: { ...dateMatch } },
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

    const dailyCreatePost = dailyRaw
      .filter((d: any) => d._id.feature === 'create_post')
      .map((d: any) => ({ _id: d._id.date, count: d.count }))
    const dailyAnalyzeFitness = dailyRaw
      .filter((d: any) => d._id.feature === 'analyze_fitness')
      .map((d: any) => ({ _id: d._id.date, count: d.count }))
    const dailyAnalyzeWorkout = dailyRaw
      .filter((d: any) => d._id.feature === 'analyze_workout')
      .map((d: any) => ({ _id: d._id.date, count: d.count }))

    const total = createPost + analyzeFitness + analyzeWorkout

    return {
      createPost,
      analyzeFitness,
      analyzeWorkout,
      total,
      dailyCreatePost,
      dailyAnalyzeFitness,
      dailyAnalyzeWorkout
    }
  }

  async getCommunityAnalytics(period?: string, startDate?: string, endDate?: string) {
    const { from, to } = getDateRange(period, startDate, endDate)
    const dateMatch: any = {}
    if (from) dateMatch.createdAt = { $gte: from, $lte: to }

    // ── Top 3 users per category ──
    const topPostUsers = await PostModel.aggregate([
      { $match: { is_banned: false, ...dateMatch } },
      { $group: { _id: '$user_id', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 },
      {
        $lookup: {
          from: 'users',
          let: { uid: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$uid'] } } },
            { $project: { name: 1, avatar: 1, user_name: 1 } }
          ],
          as: 'user'
        }
      },
      { $unwind: '$user' },
      { $project: { _id: 0, user: 1, count: 1 } }
    ])

    const topCommentUsers = await CommentPostModel.aggregate([
      { $match: { is_banned: false, ...dateMatch } },
      { $group: { _id: '$user_id', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 },
      {
        $lookup: {
          from: 'users',
          let: { uid: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$uid'] } } },
            { $project: { name: 1, avatar: 1, user_name: 1 } }
          ],
          as: 'user'
        }
      },
      { $unwind: '$user' },
      { $project: { _id: 0, user: 1, count: 1 } }
    ])

    const sportEventMatchForUsers: any = { isDeleted: { $ne: true }, 'participants_ids.0': { $exists: true } }
    if (from) sportEventMatchForUsers.createdAt = { $gte: from, $lte: to }

    const topEventUsers = await SportEventModel.aggregate([
      { $match: sportEventMatchForUsers },
      { $unwind: '$participants_ids' },
      { $group: { _id: '$participants_ids', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 },
      {
        $lookup: {
          from: 'users',
          let: { uid: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$uid'] } } },
            { $project: { name: 1, avatar: 1, user_name: 1 } }
          ],
          as: 'user'
        }
      },
      { $unwind: '$user' },
      { $project: { _id: 0, user: 1, count: 1 } }
    ])

    const workoutDateMatch: any = {}
    if (from) workoutDateMatch.finished_at = { $gte: from, $lte: to }

    const topWorkoutUsers = await WorkoutSessionModel.aggregate([
      { $match: { status: 'completed', ...workoutDateMatch } },
      { $group: { _id: '$user_id', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 },
      {
        $lookup: {
          from: 'users',
          let: { uid: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$uid'] } } },
            { $project: { name: 1, avatar: 1, user_name: 1 } }
          ],
          as: 'user'
        }
      },
      { $unwind: '$user' },
      { $project: { _id: 0, user: 1, count: 1 } }
    ])

    // ── Platform Activity daily series ──
    // Chart 1: Posts + New Users
    const dailyPosts = await PostModel.aggregate([
      { $match: { is_banned: false, ...dateMatch } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ])

    const dailyNewUsers = await UserModel.aggregate([
      { $match: { role: UserRoles.user, ...dateMatch } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ])

    // Chart 2: Events created + Participant joins
    const sportEventDateMatch: any = { isDeleted: { $ne: true } }
    if (from) sportEventDateMatch.createdAt = { $gte: from, $lte: to }

    const dailyOutdoorEvents = await SportEventModel.aggregate([
      { $match: { ...sportEventDateMatch, eventType: 'Ngoài trời' } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ])

    const dailyIndoorEvents = await SportEventModel.aggregate([
      { $match: { ...sportEventDateMatch, eventType: 'Trong nhà' } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ])

    // Daily participant joins (Option C: unwind participants_ids, group by event createdAt)
    const dailyOutdoorJoins = await SportEventModel.aggregate([
      { $match: { ...sportEventDateMatch, eventType: 'Ngoài trời', 'participants_ids.0': { $exists: true } } },
      { $unwind: '$participants_ids' },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ])

    const dailyIndoorJoins = await SportEventModel.aggregate([
      { $match: { ...sportEventDateMatch, eventType: 'Trong nhà', 'participants_ids.0': { $exists: true } } },
      { $unwind: '$participants_ids' },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ])

    // Totals
    const [totalPosts, totalNewUsers, totalOutdoor, totalIndoor] = await Promise.all([
      PostModel.countDocuments({ is_banned: false, ...dateMatch }),
      UserModel.countDocuments({ role: UserRoles.user, ...dateMatch }),
      SportEventModel.countDocuments({ ...sportEventDateMatch, eventType: 'Ngoài trời' }),
      SportEventModel.countDocuments({ ...sportEventDateMatch, eventType: 'Trong nhà' })
    ])

    // Total participant joins
    const [totalOutdoorJoins, totalIndoorJoins] = await Promise.all([
      SportEventModel.aggregate([
        { $match: { ...sportEventDateMatch, eventType: 'Ngoài trời' } },
        { $project: { count: { $size: { $ifNull: ['$participants_ids', []] } } } },
        { $group: { _id: null, total: { $sum: '$count' } } }
      ]).then((r: any[]) => r[0]?.total || 0),
      SportEventModel.aggregate([
        { $match: { ...sportEventDateMatch, eventType: 'Trong nhà' } },
        { $project: { count: { $size: { $ifNull: ['$participants_ids', []] } } } },
        { $group: { _id: null, total: { $sum: '$count' } } }
      ]).then((r: any[]) => r[0]?.total || 0)
    ])

    return {
      topUsers: {
        posts: topPostUsers,
        comments: topCommentUsers,
        events: topEventUsers,
        workouts: topWorkoutUsers
      },
      communityActivity: {
        totals: { posts: totalPosts, newUsers: totalNewUsers },
        dailyPosts,
        dailyNewUsers
      },
      eventActivity: {
        totals: { outdoorEvents: totalOutdoor, indoorEvents: totalIndoor, outdoorJoins: totalOutdoorJoins, indoorJoins: totalIndoorJoins },
        dailyOutdoorEvents,
        dailyIndoorEvents,
        dailyOutdoorJoins,
        dailyIndoorJoins
      }
    }
  }
}

const analyticsService = new AnalyticsService()
export default analyticsService
