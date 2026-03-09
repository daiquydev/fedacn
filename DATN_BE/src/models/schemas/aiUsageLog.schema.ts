import mongoose from 'mongoose'

export type AIFeatureType = 'create_post' | 'analyze_fitness' | 'analyze_workout'

export interface AIUsageLog {
    feature: AIFeatureType
    user_id?: mongoose.Types.ObjectId
    createdAt?: Date
}

const AIUsageLogSchema = new mongoose.Schema<AIUsageLog>(
    {
        feature: {
            type: String,
            enum: ['create_post', 'analyze_fitness', 'analyze_workout'],
            required: true
        },
        user_id: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'users',
            default: null
        }
    },
    {
        timestamps: true,
        collection: 'ai_usage_logs'
    }
)

const AIUsageLogModel = mongoose.model<AIUsageLog>('ai_usage_logs', AIUsageLogSchema)

export default AIUsageLogModel
