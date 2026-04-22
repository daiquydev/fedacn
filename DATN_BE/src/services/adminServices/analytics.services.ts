import AIUsageLogModel from '~/models/schemas/aiUsageLog.schema'
import ChallengeModel from '~/models/schemas/challenge.schema'
import ChallengeParticipantModel from '~/models/schemas/challengeParticipant.schema'
import PostModel from '~/models/schemas/post.schema'
import SportEventModel from '~/models/schemas/sportEvent.schema'
import SportEventAttendanceModel from '~/models/schemas/sportEventAttendance.schema'
import WorkoutSessionModel from '~/models/schemas/workoutSession.schema'
import UserModel from '~/models/schemas/user.schema'
import CommentPostModel from '~/models/schemas/commentPost.schema'
import LikePostModel from '~/models/schemas/likePost.schema'
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

  async getChallengeAnalytics(period?: string, startDate?: string, endDate?: string) {
    const { from, to } = getDateRange(period, startDate, endDate)
    const dateMatch: any = {}
    if (from) dateMatch.createdAt = { $gte: from, $lte: to }

    const baseMatch = { is_deleted: { $ne: true }, ...dateMatch }

    const [nutrition, outdoorActivity, fitness] = await Promise.all([
      ChallengeModel.countDocuments({ ...baseMatch, challenge_type: 'nutrition' }),
      ChallengeModel.countDocuments({ ...baseMatch, challenge_type: 'outdoor_activity' }),
      ChallengeModel.countDocuments({ ...baseMatch, challenge_type: 'fitness' })
    ])

    const dailyRaw = await ChallengeModel.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            challenge_type: '$challenge_type'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ])

    const dailyNutrition = dailyRaw
      .filter((d: any) => d._id.challenge_type === 'nutrition')
      .map((d: any) => ({ _id: d._id.date, count: d.count }))
    const dailyOutdoorActivity = dailyRaw
      .filter((d: any) => d._id.challenge_type === 'outdoor_activity')
      .map((d: any) => ({ _id: d._id.date, count: d.count }))
    const dailyFitness = dailyRaw
      .filter((d: any) => d._id.challenge_type === 'fitness')
      .map((d: any) => ({ _id: d._id.date, count: d.count }))

    const total = nutrition + outdoorActivity + fitness

    return {
      nutrition,
      outdoorActivity,
      fitness,
      total,
      dailyNutrition,
      dailyOutdoorActivity,
      dailyFitness
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

    const challengeJoinDateMatch: any = {}
    if (from) challengeJoinDateMatch.joined_at = { $gte: from, $lte: to }

    const topChallengeUsers = await ChallengeParticipantModel.aggregate([
      { $match: challengeJoinDateMatch },
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
        challenges: topChallengeUsers,
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

  /** Thống kê sức khỏe cộng đồng: người hoạt động, hoàn thành thử thách, sự kiện. */
  async getCommunityHealthAnalytics(period?: string, startDate?: string, endDate?: string) {
    const { from, to } = getDateRange(period, startDate, endDate)
    const createdRange = from ? { createdAt: { $gte: from, $lte: to } } : {}

    const mergeDailyUserSets = (rowsList: { _id: string; u: unknown[] }[][]) => {
      const merged = new Map<string, Set<string>>()
      for (const rows of rowsList) {
        for (const row of rows) {
          if (!row?._id) continue
          if (!merged.has(row._id)) merged.set(row._id, new Set())
          for (const id of row.u || []) merged.get(row._id)!.add(String(id))
        }
      }
      return [...merged.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([d, set]) => ({ _id: d, count: set.size }))
    }

    const postMatch = { is_banned: false, ...createdRange }
    const commentMatch = { is_banned: false, ...createdRange }
    const likeMatch = { ...createdRange }
    const workoutMatch: Record<string, unknown> = { status: 'completed' }
    if (from) workoutMatch.finished_at = { $gte: from, $lte: to }

    const cpMatch: Record<string, unknown> = { last_activity_at: { $ne: null } }
    if (from) (cpMatch.last_activity_at as Record<string, Date>) = { $gte: from, $lte: to }

    const attMatch: Record<string, unknown> = {}
    if (from) attMatch.updatedAt = { $gte: from, $lte: to }

    const [
      postsDaily,
      commentsDaily,
      likesDaily,
      workoutsDaily,
      cpDaily,
      attDaily,
      overallCompletion,
      byTypeCompletion,
      topByParticipants,
      topByCheckins
    ] = await Promise.all([
      PostModel.aggregate([
        { $match: postMatch },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            u: { $addToSet: '$user_id' }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      CommentPostModel.aggregate([
        { $match: commentMatch },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            u: { $addToSet: '$user_id' }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      LikePostModel.aggregate([
        { $match: likeMatch },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            u: { $addToSet: '$user_id' }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      WorkoutSessionModel.aggregate([
        { $match: workoutMatch },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$finished_at' } },
            u: { $addToSet: '$user_id' }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      ChallengeParticipantModel.aggregate([
        { $match: cpMatch },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$last_activity_at' } },
            u: { $addToSet: '$user_id' }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      SportEventAttendanceModel.aggregate([
        { $match: attMatch },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' } },
            u: { $addToSet: '$userId' }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      ChallengeParticipantModel.aggregate([
        { $match: { status: { $ne: 'quit' } } },
        {
          $lookup: {
            from: 'challenges',
            localField: 'challenge_id',
            foreignField: '_id',
            as: 'ch'
          }
        },
        { $unwind: '$ch' },
        { $match: { 'ch.is_deleted': { $ne: true } } },
        {
          $group: {
            _id: null,
            completed: {
              $sum: {
                $cond: [{ $or: [{ $eq: ['$is_completed', true] }, { $eq: ['$status', 'completed'] }] }, 1, 0]
              }
            },
            total: { $sum: 1 }
          }
        }
      ]),
      ChallengeParticipantModel.aggregate([
        { $match: { status: { $ne: 'quit' } } },
        {
          $lookup: {
            from: 'challenges',
            localField: 'challenge_id',
            foreignField: '_id',
            as: 'ch'
          }
        },
        { $unwind: '$ch' },
        { $match: { 'ch.is_deleted': { $ne: true } } },
        {
          $group: {
            _id: '$ch.challenge_type',
            completed: {
              $sum: {
                $cond: [{ $or: [{ $eq: ['$is_completed', true] }, { $eq: ['$status', 'completed'] }] }, 1, 0]
              }
            },
            total: { $sum: 1 }
          }
        }
      ]),
      SportEventModel.aggregate([
        { $match: { isDeleted: { $ne: true } } },
        {
          $addFields: {
            participantCount: { $size: { $ifNull: ['$participants_ids', []] } }
          }
        },
        { $sort: { participantCount: -1 } },
        { $limit: 8 },
        {
          $project: {
            _id: 1,
            name: 1,
            category: 1,
            eventType: 1,
            participantCount: 1
          }
        }
      ]),
      (() => {
        const attendanceCheckinPipeline: Record<string, unknown>[] = []
        if (from) {
          attendanceCheckinPipeline.push({ $match: { updatedAt: { $gte: from, $lte: to } } })
        }
        attendanceCheckinPipeline.push(
          {
            $lookup: {
              from: 'sport_event_sessions',
              localField: 'sessionId',
              foreignField: '_id',
              as: 'sess'
            }
          },
          { $unwind: '$sess' },
          { $group: { _id: '$sess.eventId', checkins: { $sum: 1 } } },
          { $sort: { checkins: -1 } },
          { $limit: 8 },
          {
            $lookup: {
              from: 'sport_events',
              localField: '_id',
              foreignField: '_id',
              as: 'ev'
            }
          },
          { $unwind: { path: '$ev', preserveNullAndEmptyArrays: true } },
          { $match: { 'ev.isDeleted': { $ne: true } } },
          {
            $project: {
              _id: 1,
              name: '$ev.name',
              category: '$ev.category',
              eventType: '$ev.eventType',
              checkins: 1
            }
          }
        )
        return SportEventAttendanceModel.aggregate(attendanceCheckinPipeline as any[])
      })()
    ])

    const dailyActiveUsers = mergeDailyUserSets([
      postsDaily as { _id: string; u: unknown[] }[],
      commentsDaily as { _id: string; u: unknown[] }[],
      likesDaily as { _id: string; u: unknown[] }[],
      workoutsDaily as { _id: string; u: unknown[] }[],
      cpDaily as { _id: string; u: unknown[] }[],
      attDaily as { _id: string; u: unknown[] }[]
    ])

    const peakDau = dailyActiveUsers.reduce((m, d) => Math.max(m, d.count), 0)
    const avgDau =
      dailyActiveUsers.length > 0
        ? Math.round((dailyActiveUsers.reduce((s, d) => s + d.count, 0) / dailyActiveUsers.length) * 10) / 10
        : 0

    const [pu, cu, lu, wu, chu, au] = await Promise.all([
      PostModel.distinct('user_id', postMatch),
      CommentPostModel.distinct('user_id', commentMatch),
      LikePostModel.distinct('user_id', likeMatch),
      WorkoutSessionModel.distinct('user_id', workoutMatch),
      ChallengeParticipantModel.distinct('user_id', cpMatch),
      SportEventAttendanceModel.distinct('userId', attMatch)
    ])
    const distinctActiveUsers = new Set<string>()
    ;[pu, cu, lu, wu, chu, au].forEach((arr) => (arr || []).forEach((id: any) => distinctActiveUsers.add(String(id))))

    const oc = (overallCompletion as any[])[0] || { completed: 0, total: 0 }
    const overallRatePercent =
      oc.total > 0 ? Math.round((oc.completed / oc.total) * 1000) / 10 : 0

    const byChallengeType = (byTypeCompletion as any[]).map((row) => ({
      challenge_type: row._id,
      completed: row.completed,
      total: row.total,
      ratePercent: row.total > 0 ? Math.round((row.completed / row.total) * 1000) / 10 : 0
    }))

    return {
      userActivity: {
        dailyActiveUsers,
        peakDau,
        avgDau,
        distinctActiveUsersInPeriod: distinctActiveUsers.size
      },
      challengeCompletion: {
        completedParticipants: oc.completed,
        denominatorParticipants: oc.total,
        overallRatePercent,
        byChallengeType
      },
      eventEngagement: {
        topByParticipants,
        topByCheckins
      }
    }
  }
}

const analyticsService = new AnalyticsService()
export default analyticsService
