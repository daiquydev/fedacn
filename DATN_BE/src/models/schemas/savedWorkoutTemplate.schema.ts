import mongoose, { Types } from 'mongoose'

export interface SavedWorkoutSet {
    set_number: number
    reps: number
    weight: number
    calories_per_unit: number
}

export interface SavedWorkoutExercise {
    exercise_id: Types.ObjectId
    exercise_name: string
    exercise_name_vi?: string
    sets: SavedWorkoutSet[]
}

export interface SavedWorkoutSchedule {
    days_of_week: number[]
    time_of_day: string
    start_date?: Date
    end_date?: Date
    reminder: boolean
}

export interface SavedWorkoutTemplate {
    user_id: Types.ObjectId
    name: string
    exercises: SavedWorkoutExercise[]
    schedule?: SavedWorkoutSchedule | null
    saved_at: Date
}

const SavedWorkoutSetSchema = new mongoose.Schema<SavedWorkoutSet>(
    {
        set_number: { type: Number, required: true },
        reps: { type: Number, default: 10 },
        weight: { type: Number, default: 0 },
        calories_per_unit: { type: Number, default: 10 }
    },
    { _id: false }
)

const SavedWorkoutExerciseSchema = new mongoose.Schema<SavedWorkoutExercise>(
    {
        exercise_id: { type: mongoose.SchemaTypes.ObjectId, ref: 'exercises', required: true },
        exercise_name: { type: String, required: true },
        exercise_name_vi: { type: String, default: '' },
        sets: { type: [SavedWorkoutSetSchema], default: [] }
    },
    { _id: false }
)

const SavedWorkoutScheduleSchema = new mongoose.Schema<SavedWorkoutSchedule>(
    {
        days_of_week: { type: [Number], default: [] },
        time_of_day: { type: String, default: '07:00' },
        start_date: { type: Date, default: null },
        end_date: { type: Date, default: null },
        reminder: { type: Boolean, default: false }
    },
    { _id: false }
)

const SavedWorkoutTemplateSchema = new mongoose.Schema<SavedWorkoutTemplate>(
    {
        user_id: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'users',
            required: true
        },
        name: { type: String, required: true, trim: true },
        exercises: { type: [SavedWorkoutExerciseSchema], default: [] },
        schedule: { type: SavedWorkoutScheduleSchema, default: null },
        saved_at: { type: Date, default: Date.now }
    },
    {
        timestamps: true,
        collection: 'saved_workout_templates'
    }
)

const SavedWorkoutTemplateModel = mongoose.model('saved_workout_templates', SavedWorkoutTemplateSchema)

export default SavedWorkoutTemplateModel
