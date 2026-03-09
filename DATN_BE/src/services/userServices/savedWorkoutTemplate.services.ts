import { ObjectId } from 'mongodb'
import { CreateSavedWorkoutBody, UpdateSavedWorkoutScheduleBody } from '~/models/requests/savedWorkoutTemplate.request'
import SavedWorkoutTemplateModel from '~/models/schemas/savedWorkoutTemplate.schema'

class SavedWorkoutTemplateService {
    async createSavedWorkout(body: CreateSavedWorkoutBody) {
        const { user_id, name, exercises, schedule } = body

        const processedSchedule = schedule
            ? {
                days_of_week: schedule.days_of_week,
                time_of_day: schedule.time_of_day,
                start_date: schedule.start_date ? new Date(schedule.start_date) : undefined,
                end_date: schedule.end_date ? new Date(schedule.end_date) : undefined,
                reminder: schedule.reminder
            }
            : null

        const template = await SavedWorkoutTemplateModel.create({
            user_id: new ObjectId(user_id),
            name: name.trim(),
            exercises: exercises.map((ex) => ({
                exercise_id: new ObjectId(ex.exercise_id),
                exercise_name: ex.exercise_name,
                exercise_name_vi: ex.exercise_name_vi || '',
                sets: ex.sets.map((s) => ({
                    set_number: s.set_number,
                    reps: s.reps,
                    weight: s.weight,
                    calories_per_unit: s.calories_per_unit
                }))
            })),
            schedule: processedSchedule,
            saved_at: new Date()
        })

        return template
    }

    async getUserSavedWorkouts(user_id: string) {
        const templates = await SavedWorkoutTemplateModel.find({ user_id: new ObjectId(user_id) })
            .sort({ saved_at: -1 })
            .exec()
        return templates
    }

    async updateSchedule({ id, user_id, schedule }: UpdateSavedWorkoutScheduleBody) {
        const processedSchedule = schedule
            ? {
                days_of_week: schedule.days_of_week,
                time_of_day: schedule.time_of_day,
                start_date: schedule.start_date ? new Date(schedule.start_date) : undefined,
                end_date: schedule.end_date ? new Date(schedule.end_date) : undefined,
                reminder: schedule.reminder
            }
            : null

        const updated = await SavedWorkoutTemplateModel.findOneAndUpdate(
            { _id: new ObjectId(id), user_id: new ObjectId(user_id) },
            { $set: { schedule: processedSchedule } },
            { new: true }
        )
        return updated
    }

    async deleteSavedWorkout({ id, user_id }: { id: string; user_id: string }) {
        await SavedWorkoutTemplateModel.findOneAndDelete({
            _id: new ObjectId(id),
            user_id: new ObjectId(user_id)
        })
        return true
    }
    async getWorkoutEventsForCalendar({
        user_id,
        start_date,
        end_date
    }: {
        user_id: string
        start_date: string
        end_date: string
    }) {
        // Fetch all templates that have a schedule
        const templates = await SavedWorkoutTemplateModel.find({
            user_id: new ObjectId(user_id),
            schedule: { $ne: null }
        })
            .sort({ saved_at: -1 })
            .exec()

        const rangeStart = new Date(start_date)
        const rangeEnd = new Date(end_date)
        // Normalize rangeEnd to end of day
        rangeEnd.setHours(23, 59, 59, 999)

        const events: Array<{
            id: string
            workout_id: string
            workout_name: string
            date: string
            time_of_day: string
            exercises: Array<{
                exercise_name: string
                exercise_name_vi?: string
                sets: Array<{ set_number: number; reps: number; weight: number; calories_per_unit: number }>
            }>
            reminder: boolean
        }> = []

        for (const template of templates) {
            const schedule = template.schedule
            if (!schedule || !schedule.days_of_week || schedule.days_of_week.length === 0) continue

            // Effective date range is intersection of schedule validity and requested range
            const effectiveStart = schedule.start_date && schedule.start_date > rangeStart ? schedule.start_date : rangeStart
            const effectiveEnd = schedule.end_date && schedule.end_date < rangeEnd ? schedule.end_date : rangeEnd

            if (effectiveStart > effectiveEnd) continue

            // Walk each day in the effective range
            const cursor = new Date(effectiveStart)
            cursor.setHours(0, 0, 0, 0)

            while (cursor <= effectiveEnd) {
                // getDay() returns 0=Sun, 1=Mon ... 6=Sat — same convention as days_of_week
                const dayOfWeek = cursor.getDay()
                if (schedule.days_of_week.includes(dayOfWeek)) {
                    const y = cursor.getFullYear()
                    const m = `${cursor.getMonth() + 1}`.padStart(2, '0')
                    const d = `${cursor.getDate()}`.padStart(2, '0')
                    const dateKey = `${y}-${m}-${d}`

                    events.push({
                        id: `workout-${template._id}-${dateKey}`,
                        workout_id: template._id.toString(),
                        workout_name: template.name,
                        date: dateKey,
                        time_of_day: schedule.time_of_day || '07:00',
                        exercises: template.exercises.map((ex) => ({
                            exercise_name: ex.exercise_name,
                            exercise_name_vi: ex.exercise_name_vi,
                            sets: ex.sets
                        })),
                        reminder: schedule.reminder || false
                    })
                }
                cursor.setDate(cursor.getDate() + 1)
            }
        }

        return events
    }
}

const savedWorkoutTemplateService = new SavedWorkoutTemplateService()
export default savedWorkoutTemplateService
