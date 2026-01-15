import mongoose, { Types } from 'mongoose'
import { MealType, MealItemStatus } from '~/constants/enums'

export interface UserMealItem {
  user_meal_schedule_id: Types.ObjectId
  meal_plan_meal_id: Types.ObjectId
  recipe_id?: Types.ObjectId
  scheduled_date: Date
  scheduled_time?: string
  meal_type: MealType
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  status: MealItemStatus
  completed_at?: Date
  actual_servings?: number // Khẩu phần thực tế ăn
  actual_calories?: number // Calories thực tế
  substituted_with_recipe_id?: Types.ObjectId // Thay thế bằng recipe khác
  notes?: string
  rating?: number // Đánh giá món ăn từ 1-5
  review?: string // Nhận xét chi tiết
  images?: string[] // Ảnh món ăn thực tế
  location?: string // Địa điểm ăn
  mood?: string // Tâm trạng khi ăn: happy, neutral, sad
  hunger_before?: number // Mức đói trước khi ăn (1-10)
  satisfaction_after?: number // Mức no sau khi ăn (1-10)
}

const UserMealItemSchema = new mongoose.Schema<UserMealItem>(
  {
    user_meal_schedule_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'user_meal_schedules',
      required: true
    },
    meal_plan_meal_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'meal_plan_meals',
      required: true
    },
    recipe_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'recipes',
      default: null
    },
    scheduled_date: {
      type: Date,
      required: true
    },
    scheduled_time: { type: String, default: null },
    meal_type: {
      type: Number,
      required: true
    },
    name: {
      type: String,
      required: true,
      maxlength: 255
    },
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
    status: {
      type: Number,
      default: MealItemStatus.pending
    },
    completed_at: { type: Date, default: null },
    actual_servings: { type: Number, default: null },
    actual_calories: { type: Number, default: null },
    substituted_with_recipe_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'recipes',
      default: null
    },
    notes: { type: String, default: '' },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    review: { type: String, default: '' },
    images: [{ type: String }],
    location: { type: String, default: '' },
    mood: { type: String, default: '' },
    hunger_before: {
      type: Number,
      min: 1,
      max: 10,
      default: null
    },
    satisfaction_after: {
      type: Number,
      min: 1,
      max: 10,
      default: null
    }
  },
  {
    timestamps: true,
    collection: 'user_meal_items'
  }
)

UserMealItemSchema.index({ user_meal_schedule_id: 1, scheduled_date: 1 })
UserMealItemSchema.index({ user_meal_schedule_id: 1, status: 1 })
UserMealItemSchema.index({ user_meal_schedule_id: 1, meal_type: 1 })
UserMealItemSchema.index({ meal_plan_meal_id: 1 })
UserMealItemSchema.index({ completed_at: 1 })

const UserMealItemModel = mongoose.model('user_meal_items', UserMealItemSchema)

export default UserMealItemModel 