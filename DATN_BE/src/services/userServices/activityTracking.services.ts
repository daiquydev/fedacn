import ActivityTrackingModel, { ActivityTracking } from '~/models/schemas/activityTracking.schema'
import SportEventModel from '~/models/schemas/sportEvent.schema'
import SportEventProgressModel from '~/models/schemas/sportEventProgress.schema'
import { Types } from 'mongoose'

class ActivityTrackingService {
    // Start a new activity
    async startActivityService({
        eventId,
        userId,
        activityType,
        startLat,
        startLng
    }: {
        eventId: string
        userId: string
        activityType?: string
        startLat?: number
        startLng?: number
    }) {
        // Verify event exists and user is participant
        const event = await SportEventModel.findById(eventId)
        if (!event) {
            throw new Error('Event not found')
        }

        const isParticipant = event.participants_ids?.some((id) => id.toString() === userId)
        if (!isParticipant) {
            throw new Error('You must join the event first')
        }

        // Check if user has an active/paused activity for this event
        const existingActivity = await ActivityTrackingModel.findOne({
            eventId,
            userId,
            status: { $in: ['active', 'paused'] }
        })

        if (existingActivity) {
            // Return the existing activity so the user can resume
            return existingActivity
        }

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
            eventId,
            userId,
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

    // Update activity with new GPS data (auto-save)
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
            status: { $in: ['active', 'paused'] }
        })

        if (!activity) {
            throw new Error('Activity not found or already completed')
        }

        // Update fields
        if (updateData.gpsRoute && updateData.gpsRoute.length > 0) {
            activity.gpsRoute = updateData.gpsRoute
        }
        if (updateData.totalDistance !== undefined) activity.totalDistance = updateData.totalDistance
        if (updateData.totalDuration !== undefined) activity.totalDuration = updateData.totalDuration
        if (updateData.avgSpeed !== undefined) activity.avgSpeed = updateData.avgSpeed
        if (updateData.maxSpeed !== undefined) activity.maxSpeed = updateData.maxSpeed
        if (updateData.avgPace !== undefined) activity.avgPace = updateData.avgPace
        if (updateData.calories !== undefined) activity.calories = updateData.calories
        if (updateData.status === 'paused' || updateData.status === 'active') {
            activity.status = updateData.status
        }
        if (updateData.pauseIntervals) {
            activity.pauseIntervals = updateData.pauseIntervals
        }

        await activity.save()
        return activity
    }

    // Complete activity and create progress entry
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
            status: { $in: ['active', 'paused'] }
        })

        if (!activity) {
            throw new Error('Activity not found or already completed')
        }

        // Update with final data
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

        // Auto-create sport event progress entry
        const distanceKm = activity.totalDistance / 1000
        const durationMinutes = Math.round(activity.totalDuration / 60)

        if (distanceKm > 0) {
            const progressEntry = new SportEventProgressModel({
                eventId: activity.eventId,
                userId: activity.userId,
                date: new Date(),
                value: parseFloat(distanceKm.toFixed(2)),
                unit: 'km',
                distance: parseFloat(distanceKm.toFixed(2)),
                time: `${durationMinutes} phút`,
                calories: Math.round(activity.calories),
                notes: `Hoạt động ${activity.activityType} - ${distanceKm.toFixed(2)}km trong ${durationMinutes} phút`
            })

            await progressEntry.save()
        }

        return activity
    }

    // Discard activity
    async discardActivityService(activityId: string, userId: string) {
        const activity = await ActivityTrackingModel.findOne({
            _id: activityId,
            userId,
            status: { $in: ['active', 'paused'] }
        })

        if (!activity) {
            throw new Error('Activity not found or already completed')
        }

        activity.status = 'discarded'
        activity.endTime = new Date()
        await activity.save()

        return activity
    }

    // Get single activity
    async getActivityService(activityId: string, userId: string) {
        const activity = await ActivityTrackingModel.findOne({
            _id: activityId,
            userId
        })

        if (!activity) {
            throw new Error('Activity not found')
        }

        return activity
    }

    // Soft-delete an activity
    async softDeleteActivityService(activityId: string, userId: string) {
        const activity = await ActivityTrackingModel.findOne({
            _id: activityId,
            userId,
            is_deleted: { $ne: true }
        })
        if (!activity) throw new Error('Hoạt động không tồn tại')

        activity.is_deleted = true
        await activity.save()

        // Also soft-delete related sport_event_progress if this was event-linked
        if (activity.eventId) {
            await SportEventProgressModel.updateMany(
                {
                    eventId: activity.eventId,
                    userId: activity.userId,
                    date: {
                        $gte: new Date(activity.startTime.getTime() - 60000),
                        $lte: new Date((activity.endTime || activity.startTime).getTime() + 60000)
                    }
                },
                { is_deleted: true }
            )
        }

        return activity
    }

    // Get user's activities for an event
    async getUserActivitiesService(eventId: string, userId: string) {
        const activities = await ActivityTrackingModel.find({
            eventId,
            userId,
            status: { $in: ['completed', 'active', 'paused'] },
            is_deleted: { $ne: true }
        })
            .sort({ createdAt: -1 })
            .select('-gpsRoute')
            .exec()

        const totalDistance = activities
            .filter((a) => a.status === 'completed')
            .reduce((sum, a) => sum + a.totalDistance, 0)

        const totalDuration = activities
            .filter((a) => a.status === 'completed')
            .reduce((sum, a) => sum + a.totalDuration, 0)

        return {
            activities,
            totalDistance,
            totalDuration,
            totalActivities: activities.filter((a) => a.status === 'completed').length
        }
    }
}

const activityTrackingService = new ActivityTrackingService()
export default activityTrackingService
