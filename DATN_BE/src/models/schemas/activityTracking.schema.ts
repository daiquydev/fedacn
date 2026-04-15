import mongoose, { Types } from 'mongoose'

export interface GpsPoint {
    lat: number
    lng: number
    timestamp: number
    speed?: number
    altitude?: number
}

export interface PauseInterval {
    start: number
    end: number
}

export interface ActivityTracking {
    _id?: Types.ObjectId
    eventId?: Types.ObjectId
    challengeId?: Types.ObjectId
    userId: Types.ObjectId
    activityType: string
    name?: string
    status: 'active' | 'paused' | 'completed' | 'discarded'
    startTime: Date
    endTime?: Date
    totalDuration: number
    totalDistance: number
    avgSpeed: number
    maxSpeed: number
    avgPace: number
    calories: number
    gpsRoute: GpsPoint[]
    pauseIntervals: PauseInterval[]
    source?: string
    is_deleted?: boolean
    createdAt?: Date
    updatedAt?: Date
}

const GpsPointSchema = new mongoose.Schema(
    {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        timestamp: { type: Number, required: true },
        speed: { type: Number },
        altitude: { type: Number }
    },
    { _id: false }
)

const PauseIntervalSchema = new mongoose.Schema(
    {
        start: { type: Number, required: true },
        end: { type: Number }
    },
    { _id: false }
)

const ActivityTrackingSchema = new mongoose.Schema<ActivityTracking>(
    {
        eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'sport_events', default: null },
        challengeId: { type: mongoose.Schema.Types.ObjectId, ref: 'challenges', default: null },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
        activityType: {
            type: String,
            default: 'Chạy bộ'
        },
        name: {
            type: String,
            default: 'Hoạt động cá nhân'
        },
        status: {
            type: String,
            enum: ['active', 'paused', 'completed', 'discarded'],
            default: 'active'
        },
        startTime: { type: Date, required: true, default: Date.now },
        endTime: { type: Date },
        totalDuration: { type: Number, default: 0 },
        totalDistance: { type: Number, default: 0 },
        avgSpeed: { type: Number, default: 0 },
        maxSpeed: { type: Number, default: 0 },
        avgPace: { type: Number, default: 0 },
        calories: { type: Number, default: 0 },
        gpsRoute: [GpsPointSchema],
        pauseIntervals: [PauseIntervalSchema],
        source: { type: String, default: 'app' },
        is_deleted: { type: Boolean, default: false }
    },
    {
        timestamps: true,
        collection: 'activity_tracking'
    }
)

// Indexes
ActivityTrackingSchema.index({ eventId: 1, userId: 1, status: 1 })
ActivityTrackingSchema.index({ challengeId: 1, userId: 1, status: 1 })
ActivityTrackingSchema.index({ userId: 1, createdAt: -1 })
ActivityTrackingSchema.index({ eventId: 1, status: 1, totalDistance: -1 })

const ActivityTrackingModel = mongoose.model('activity_tracking', ActivityTrackingSchema)

export default ActivityTrackingModel
