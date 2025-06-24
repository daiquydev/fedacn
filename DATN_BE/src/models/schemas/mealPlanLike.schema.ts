import mongoose, { Types } from 'mongoose'

export interface MealPlanLike {
  user_id: Types.ObjectId
  meal_plan_id: Types.ObjectId
}

const MealPlanLikeSchema = new mongoose.Schema<MealPlanLike>(
  {
    user_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'users',
      required: true
    },
    meal_plan_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'meal_plans',
      required: true
    }
  },
  {
    timestamps: true,
    collection: 'meal_plan_likes'
  }
)

// Compound unique index để tránh duplicate likes
MealPlanLikeSchema.index({ user_id: 1, meal_plan_id: 1 }, { unique: true })
MealPlanLikeSchema.index({ meal_plan_id: 1 })
MealPlanLikeSchema.index({ user_id: 1 })

const MealPlanLikeModel = mongoose.model('meal_plan_likes', MealPlanLikeSchema)

export default MealPlanLikeModel 