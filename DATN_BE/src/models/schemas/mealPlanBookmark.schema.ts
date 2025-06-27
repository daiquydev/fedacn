import mongoose, { Types } from 'mongoose'

export interface MealPlanBookmark {
  user_id: Types.ObjectId
  meal_plan_id: Types.ObjectId
  folder_name: string
  notes?: string
}

const MealPlanBookmarkSchema = new mongoose.Schema<MealPlanBookmark>(
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
    },
    folder_name: {
      type: String,
      default: 'Mặc định',
      maxlength: 100
    },
    notes: { type: String, default: '' }
  },
  {
    timestamps: true,
    collection: 'meal_plan_bookmarks'
  }
)

// Compound unique index để tránh duplicate bookmarks
MealPlanBookmarkSchema.index({ user_id: 1, meal_plan_id: 1 }, { unique: true })
MealPlanBookmarkSchema.index({ user_id: 1, folder_name: 1 })
MealPlanBookmarkSchema.index({ meal_plan_id: 1 })

const MealPlanBookmarkModel = mongoose.model('meal_plan_bookmarks', MealPlanBookmarkSchema)

export default MealPlanBookmarkModel 