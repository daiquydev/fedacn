import mongoose, { Types } from 'mongoose'

export interface MealPlanRating {
  user_id: Types.ObjectId
  meal_plan_id: Types.ObjectId
  rating: number
}

const MealPlanRatingSchema = new mongoose.Schema<MealPlanRating>(
  {
    user_id: { type: mongoose.SchemaTypes.ObjectId, ref: 'users', required: true },
    meal_plan_id: { type: mongoose.SchemaTypes.ObjectId, ref: 'meal_plans', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 }
  },
  {
    timestamps: true,
    collection: 'meal_plan_ratings'
  }
)

MealPlanRatingSchema.index({ user_id: 1, meal_plan_id: 1 }, { unique: true })

const MealPlanRatingModel = mongoose.model('meal_plan_ratings', MealPlanRatingSchema)

export default MealPlanRatingModel
