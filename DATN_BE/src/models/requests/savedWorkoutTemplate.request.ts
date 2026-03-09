export interface CreateSavedWorkoutBody {
    user_id: string
    name: string
    exercises: Array<{
        exercise_id: string
        exercise_name: string
        exercise_name_vi?: string
        sets: Array<{
            set_number: number
            reps: number
            weight: number
            calories_per_unit: number
        }>
    }>
    schedule?: {
        days_of_week: number[]
        time_of_day: string
        start_date?: string
        end_date?: string
        reminder: boolean
    } | null
}

export interface UpdateSavedWorkoutScheduleBody {
    id: string
    user_id: string
    schedule: {
        days_of_week: number[]
        time_of_day: string
        start_date?: string
        end_date?: string
        reminder: boolean
    } | null
}
