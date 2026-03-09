import mongoose, { Types } from 'mongoose'

export interface SportEventVideoSession {
    _id?: Types.ObjectId
    eventId: Types.ObjectId
    sessionId?: Types.ObjectId // ref to sport_event_sessions (optional)
    userId: Types.ObjectId
    joinedAt: Date
    endedAt?: Date
    activeSeconds: number // seconds with confirmed face presence
    totalSeconds: number // total call seconds
    caloriesBurned: number
    status: 'active' | 'ending' | 'ended'
    progressId?: Types.ObjectId // auto-linked sport_event_progress entry
    createdAt?: Date
    updatedAt?: Date
}

const SportEventVideoSessionSchema = new mongoose.Schema<SportEventVideoSession>(
    {
        eventId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'sport_events',
            required: true
        },
        sessionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'sport_event_sessions',
            default: null
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
            required: true
        },
        joinedAt: {
            type: Date,
            default: Date.now
        },
        endedAt: {
            type: Date,
            default: null
        },
        activeSeconds: {
            type: Number,
            default: 0,
            min: 0
        },
        totalSeconds: {
            type: Number,
            default: 0,
            min: 0
        },
        caloriesBurned: {
            type: Number,
            default: 0,
            min: 0
        },
        status: {
            type: String,
            enum: ['active', 'ending', 'ended'],  // 'ending' = trạng thái khóa trung gian, không hiển thị
            default: 'active'
        },
        progressId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'sport_event_progress',
            default: null
        }
    },
    {
        timestamps: true,
        collection: 'sport_event_video_sessions'
    }
)

// Indexes
SportEventVideoSessionSchema.index({ eventId: 1, userId: 1, status: 1 })
SportEventVideoSessionSchema.index({ eventId: 1, userId: 1, joinedAt: -1 })
SportEventVideoSessionSchema.index({ userId: 1, status: 1 })

const SportEventVideoSessionModel = mongoose.model(
    'sport_event_video_sessions',
    SportEventVideoSessionSchema
)

export default SportEventVideoSessionModel
