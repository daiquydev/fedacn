import mongoose, { Types } from 'mongoose'
import { MealType } from '~/constants/enums'

export interface MealPlanMeal {
  meal_plan_day_id: Types.ObjectId
  meal_type: MealType
  name: string
  description?: string
  recipe_id?: Types.ObjectId // Liên kết đến recipe nếu có
  ingredients?: {
    name: string
    quantity: number
    unit: string
    calories: number
  }[]
  instructions?: string // Cách chế biến riêng
  prep_time: number // Thời gian chuẩn bị (phút)
  cook_time: number // Thời gian nấu (phút)
  servings: number // Khẩu phần
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sugar: number
  sodium: number
  image?: string
  meal_order: number // Thứ tự trong ngày (để sắp xếp)
  is_optional: boolean // Món ăn tùy chọn
  alternatives?: Types.ObjectId[] // Món thay thế [recipe_id1, recipe_id2]
  notes?: string
}

const MealPlanMealSchema = new mongoose.Schema<MealPlanMeal>(
  {
    meal_plan_day_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'meal_plan_days',
      required: true
    },
    meal_type: {
      type: Number,
      required: true
    },
    name: {
      type: String,
      required: true,
      maxlength: 255
    },
    description: { type: String, default: '' },
    recipe_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'recipes',
      default: null
    },
    ingredients: [
      {
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        unit: { type: String, required: true },
        calories: { type: Number, default: 0 }
      }
    ],
    instructions: { type: String, default: '' },
    prep_time: { type: Number, default: 0 },
    cook_time: { type: Number, default: 0 },
    servings: { type: Number, default: 1, min: 0.1 },
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
    fiber: { type: Number, default: 0 },
    sugar: { type: Number, default: 0 },
    sodium: { type: Number, default: 0 },
    image: { type: String, default: '' },
    meal_order: { type: Number, default: 1 },
    is_optional: { type: Boolean, default: false },
    alternatives: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'recipes'
      }
    ],
    notes: { type: String, default: '' }
  },
  {
    timestamps: true,
    collection: 'meal_plan_meals'
  }
)

MealPlanMealSchema.index({ meal_plan_day_id: 1, meal_order: 1 })
MealPlanMealSchema.index({ meal_plan_day_id: 1, meal_type: 1 })
MealPlanMealSchema.index({ recipe_id: 1 })

const MealPlanMealModel = mongoose.model('meal_plan_meals', MealPlanMealSchema)

export default MealPlanMealModel 