import WorkoutSessionModel from '~/models/schemas/workoutSession.schema'
import { Types } from 'mongoose'
import challengeService from '~/services/userServices/challenge.services'

class WorkoutSessionService {
    async createSession(userId: string, data: any) {
        const session = new WorkoutSessionModel({
            user_id: new Types.ObjectId(userId),
            started_at: new Date(),
            equipment_used: data.equipment_used || [],
            muscles_targeted: data.muscles_targeted || [],
            exercises: data.exercises || [],
            status: 'in_progress',
            // Smart workout fields
            is_smart_mode: data.is_smart_mode || false,
            target_kcal: data.target_kcal || null,
            metrics_input: data.metrics_input || null
        })
        return session.save()
    }

    async updateSession(sessionId: string, userId: string, data: any) {
        return WorkoutSessionModel.findOneAndUpdate(
            { _id: new Types.ObjectId(sessionId), user_id: new Types.ObjectId(userId) },
            { $set: data },
            { new: true }
        )
    }

    async completeSession(sessionId: string, userId: string, data: any) {
        const finishedAt = new Date()
        const session = await WorkoutSessionModel.findOne({
            _id: new Types.ObjectId(sessionId),
            user_id: new Types.ObjectId(userId)
        })

        if (!session) return null

        // Calculate totals
        let totalVolume = 0
        let totalSets = 0
        let totalReps = 0
        let totalCalories = 0

        const exercises = data.exercises || session.exercises
        exercises.forEach((ex: any) => {
            ex.sets?.forEach((set: any) => {
                if (set.completed) {
                    totalSets++
                    totalReps += set.reps || 0
                    totalVolume += (set.reps || 0) * (set.weight || 0)
                    totalCalories += (set.reps || 0) * (set.weight || 0) * (set.calories_per_unit || 10)
                }
            })
        })

        const startedAt = session.started_at || (session as any).createdAt
        const durationMinutes = Math.round((finishedAt.getTime() - new Date(startedAt).getTime()) / 60000)

        return WorkoutSessionModel.findOneAndUpdate(
            { _id: new Types.ObjectId(sessionId), user_id: new Types.ObjectId(userId) },
            {
                $set: {
                    exercises: exercises,
                    finished_at: finishedAt,
                    total_volume: totalVolume,
                    total_sets: totalSets,
                    total_reps: totalReps,
                    total_calories: Math.round(totalCalories),
                    duration_minutes: durationMinutes,
                    status: 'completed'
                }
            },
            { new: true }
        ).then(async (updatedSession) => {
            // Auto-track challenge progress (fire-and-forget)
            if (updatedSession) {
                challengeService.updateProgressOnWorkoutComplete(userId, {
                    total_calories: updatedSession.total_calories,
                    duration_minutes: updatedSession.duration_minutes,
                    finished_at: updatedSession.finished_at
                }).catch(() => {
                    // Challenge tracking errors should not affect workout completion
                })
            }
            return updatedSession
        })
    }

    async getHistory(userId: string, page: number = 1, limit: number = 10) {
        const skip = (page - 1) * limit
        const [sessions, total] = await Promise.all([
            WorkoutSessionModel.find({ user_id: new Types.ObjectId(userId) })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            WorkoutSessionModel.countDocuments({ user_id: new Types.ObjectId(userId) })
        ])
        return { sessions, total, page, limit }
    }

    async getSessionById(sessionId: string, userId: string) {
        return WorkoutSessionModel.findOne({
            _id: new Types.ObjectId(sessionId),
            user_id: new Types.ObjectId(userId)
        })
    }

    async quitSession(sessionId: string, userId: string) {
        return WorkoutSessionModel.findOneAndUpdate(
            { _id: new Types.ObjectId(sessionId), user_id: new Types.ObjectId(userId) },
            { $set: { status: 'quit', finished_at: new Date() } },
            { new: true }
        )
    }
}

const workoutSessionService = new WorkoutSessionService()
export default workoutSessionService
