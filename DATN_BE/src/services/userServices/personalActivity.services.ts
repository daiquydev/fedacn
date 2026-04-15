import ActivityTrackingModel from '~/models/schemas/activityTracking.schema'
import { roundKcal } from '~/utils/math.utils'
import { buildTrainingCreatedAtFilter } from '~/utils/trainingDateRange.utils'

class PersonalActivityService {
    async startActivityService({
        userId,
        name,
        activityType,
        startLat,
        startLng
    }: {
        userId: string
        name?: string
        activityType?: string
        startLat?: number
        startLng?: number
    }) {
        const existingActivity = await ActivityTrackingModel.findOne({
            userId,
            eventId: null,
            challengeId: null,
            status: { $in: ['active', 'paused'] }
        })

        if (existingActivity) return existingActivity

        const gpsRoute =
            startLat && startLng
                ? [
                    {
                        lat: startLat,
                        lng: startLng,
                        timestamp: Date.now(),
                        speed: 0
                    }
                ]
                : []

        const newActivity = new ActivityTrackingModel({
            eventId: null,
            challengeId: null,
            userId,
            name: name || 'Hoạt động cá nhân',
            activityType: activityType || 'Chạy bộ',
            status: 'active',
            startTime: new Date(),
            totalDuration: 0,
            totalDistance: 0,
            avgSpeed: 0,
            maxSpeed: 0,
            avgPace: 0,
            calories: 0,
            gpsRoute,
            pauseIntervals: []
        })

        await newActivity.save()
        return newActivity
    }

    async updateActivityService(
        activityId: string,
        userId: string,
        updateData: {
            gpsRoute?: any[]
            totalDistance?: number
            totalDuration?: number
            avgSpeed?: number
            maxSpeed?: number
            avgPace?: number
            calories?: number
            status?: string
            pauseIntervals?: any[]
        }
    ) {
        const activity = await ActivityTrackingModel.findOne({
            _id: activityId,
            userId,
            eventId: null,
            challengeId: null,
            status: { $in: ['active', 'paused'] }
        })

        if (!activity) throw new Error('Không tìm thấy hoạt động cá nhân hoặc đã kết thúc/hủy')

        if (updateData.gpsRoute && updateData.gpsRoute.length > 0) activity.gpsRoute = updateData.gpsRoute
        if (updateData.totalDistance !== undefined) activity.totalDistance = updateData.totalDistance
        if (updateData.totalDuration !== undefined) activity.totalDuration = updateData.totalDuration
        if (updateData.avgSpeed !== undefined) activity.avgSpeed = updateData.avgSpeed
        if (updateData.maxSpeed !== undefined) activity.maxSpeed = updateData.maxSpeed
        if (updateData.avgPace !== undefined) activity.avgPace = updateData.avgPace
        if (updateData.calories !== undefined) activity.calories = updateData.calories
        if (updateData.status === 'paused' || updateData.status === 'active') activity.status = updateData.status
        if (updateData.pauseIntervals) activity.pauseIntervals = updateData.pauseIntervals

        await activity.save()
        return activity
    }

    async completeActivityService(
        activityId: string,
        userId: string,
        finalData: {
            gpsRoute?: any[]
            totalDistance?: number
            totalDuration?: number
            avgSpeed?: number
            maxSpeed?: number
            avgPace?: number
            calories?: number
        }
    ) {
        const activity = await ActivityTrackingModel.findOne({
            _id: activityId,
            userId,
            eventId: null,
            challengeId: null,
            status: { $in: ['active', 'paused'] }
        })

        if (!activity) throw new Error('Không tìm thấy hoạt động cá nhân hoặc đã kết thúc/hủy')

        if (finalData.gpsRoute) activity.gpsRoute = finalData.gpsRoute
        if (finalData.totalDistance !== undefined) activity.totalDistance = finalData.totalDistance
        if (finalData.totalDuration !== undefined) activity.totalDuration = finalData.totalDuration
        if (finalData.avgSpeed !== undefined) activity.avgSpeed = finalData.avgSpeed
        if (finalData.maxSpeed !== undefined) activity.maxSpeed = finalData.maxSpeed
        if (finalData.avgPace !== undefined) activity.avgPace = finalData.avgPace
        if (finalData.calories !== undefined) activity.calories = finalData.calories

        activity.status = 'completed'
        activity.endTime = new Date()

        await activity.save()
        return activity
    }

    async discardActivityService(activityId: string, userId: string) {
        const activity = await ActivityTrackingModel.findOne({
            _id: activityId,
            userId,
            eventId: null,
            challengeId: null,
            status: { $in: ['active', 'paused'] }
        })

        if (!activity) throw new Error('Không tìm thấy hoạt động cá nhân hoặc đã kết thúc/hủy')

        activity.status = 'discarded'
        activity.endTime = new Date()
        await activity.save()

        return activity
    }

    async getUserActivitiesService(
        userId: string,
        page: number = 1,
        limit: number = 10,
        range: string = 'all',
        startDateStr?: string,
        endDateStr?: string
    ) {
        const skip = (page - 1) * limit

        const baseQuery: Record<string, unknown> = {
            userId,
            eventId: null,
            challengeId: null,
            status: 'completed',
            is_deleted: { $ne: true }
        }
        Object.assign(baseQuery, buildTrainingCreatedAtFilter(range, startDateStr, endDateStr))

        const [activities, total] = await Promise.all([
            ActivityTrackingModel.find(baseQuery)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select('-gpsRoute')
                .lean(),
            ActivityTrackingModel.countDocuments(baseQuery)
        ])

        return {
            activities,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    }
}

const personalActivityService = new PersonalActivityService()
export default personalActivityService
