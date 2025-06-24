import mongoose, { Types } from 'mongoose'

export interface MealPlanComment {
  user_id: Types.ObjectId
  meal_plan_id: Types.ObjectId
  content: string
  parent_id?: Types.ObjectId // Comment cha cho reply
  likes_count: number
  is_edited: boolean
}

const MealPlanCommentSchema = new mongoose.Schema<MealPlanComment>(
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
    content: {
      type: String,
      required: true,
      maxlength: 1000
    },
    parent_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'meal_plan_comments',
      default: null
    },
    likes_count: {
      type: Number,
      default: 0
    },
    is_edited: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    collection: 'meal_plan_comments'
  }
)

MealPlanCommentSchema.index({ meal_plan_id: 1, createdAt: -1 })
MealPlanCommentSchema.index({ user_id: 1 })
MealPlanCommentSchema.index({ parent_id: 1 })

const MealPlanCommentModel = mongoose.model('meal_plan_comments', MealPlanCommentSchema)

export default MealPlanCommentModel 