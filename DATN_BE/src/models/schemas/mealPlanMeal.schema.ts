import mongoose, { Types } from 'mongoose'
import { MealType } from '~/constants/enums'

export interface MealPlanMeal {
  meal_plan_day_id: Types.ObjectId
  meal_type: MealType
  
  // Reference to existing recipe (Option 1)
  recipe_id?: Types.ObjectId // Liên kết đến recipe có sẵn
  servings?: number // Khẩu phần (có thể override từ recipe)
  
  // Custom meal data (Option 2 - khi không có recipe_id)
  name?: string // Tên món (bắt buộc nếu không có recipe_id)
  description?: string
  ingredients?: {
    name: string
    quantity: number
    unit: string
    calories: number
  }[]
  instructions?: string // Cách chế biến
  prep_time?: number // Thời gian chuẩn bị (phút)
  cook_time?: number // Thời gian nấu (phút)
  image?: string
  
  // Nutritional info (có thể override từ recipe hoặc tự định nghĩa)
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  fiber?: number
  sugar?: number
  sodium?: number
  
  // Meal settings
  meal_order: number // Thứ tự trong ngày
  is_optional: boolean // Món ăn tùy chọn
  alternatives?: Types.ObjectId[] // Món thay thế [recipe_id1, recipe_id2]
  notes?: string // Ghi chú thêm
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
    // Reference to existing recipe
    recipe_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'recipes',
      default: null
    },
    servings: { type: Number, default: 1, min: 0.1 },
    
    // Custom meal data (required if no recipe_id)
    name: {
      type: String,
      maxlength: 255,
      required: function() {
        return !this.recipe_id; // Bắt buộc nếu không có recipe_id
      }
    },
    description: { type: String, default: '' },
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
    image: { type: String, default: '' },
    
    // Nutritional info (can override from recipe)
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
    fiber: { type: Number, default: 0 },
    sugar: { type: Number, default: 0 },
    sodium: { type: Number, default: 0 },
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