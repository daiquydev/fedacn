import mongoose, { Types } from 'mongoose'

export interface WorkoutSet {
    set_number: number
    reps: number
    weight: number
    calories_per_unit: number
    completed: boolean
}

export interface WorkoutExercise {
    exercise_id: Types.ObjectId
    exercise_name: string
    sets: WorkoutSet[]
}

export interface MetricsInput {
    weight?: number
    height?: number
    age?: number
    gender?: string
    activity_level?: number
    duration_minutes_target?: number
    bmr?: number
    tdee?: number
}

export interface WorkoutSession {
    user_id: Types.ObjectId
    started_at: Date
    finished_at?: Date
    equipment_used: string[]
    muscles_targeted: string[]
    exercises: WorkoutExercise[]
    total_volume: number
    total_sets: number
    total_reps: number
    total_calories: number
    duration_minutes: number
    status: string
    // Smart workout fields
    is_smart_mode?: boolean
    target_kcal?: number
    metrics_input?: MetricsInput
}

const WorkoutSetSchema = new mongoose.Schema<WorkoutSet>(
    {
        set_number: { type: Number, required: true },
        reps: { type: Number, default: 0 },
        weight: { type: Number, default: 0 },
        calories_per_unit: { type: Number, default: 10 },
        completed: { type: Boolean, default: false }
    },
    { _id: false }
)

const WorkoutExerciseSchema = new mongoose.Schema<WorkoutExercise>(
    {
        exercise_id: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'exercises',
            required: true
        },
        exercise_name: { type: String, required: true },
        sets: { type: [WorkoutSetSchema], default: [] }
    },
    { _id: false }
)

const WorkoutSessionSchema = new mongoose.Schema<WorkoutSession>(
    {
        user_id: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'users',
            required: true
        },
        started_at: {
            type: Date,
            default: Date.now
        },
        finished_at: {
            type: Date
        },
        equipment_used: {
            type: [String],
            default: []
        },
        muscles_targeted: {
            type: [String],
            default: []
        },
        exercises: {
            type: [WorkoutExerciseSchema],
            default: []
        },
        total_volume: {
            type: Number,
            default: 0
        },
        total_sets: {
            type: Number,
            default: 0
        },
        total_reps: {
            type: Number,
            default: 0
        },
        total_calories: {
            type: Number,
            default: 0
        },
        duration_minutes: {
            type: Number,
            default: 0
        },
        status: {
            type: String,
            enum: ['in_progress', 'completed', 'quit'],
            default: 'in_progress'
        },
        is_smart_mode: { type: Boolean, default: false },
        target_kcal: { type: Number, default: null },
        metrics_input: {
            type: {
                weight: { type: Number },
                height: { type: Number },
                age: { type: Number },
                gender: { type: String },
                activity_level: { type: Number },
                duration_minutes_target: { type: Number },
                bmr: { type: Number },
                tdee: { type: Number }
            },
            default: null
        }
    },
    {
        timestamps: true,
        collection: 'workout_sessions'
    }
)

const WorkoutSessionModel = mongoose.model('workout_sessions', WorkoutSessionSchema)

export default WorkoutSessionModel
