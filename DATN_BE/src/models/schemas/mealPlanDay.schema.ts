import mongoose, { Types } from 'mongoose'

export interface MealPlanDay {
  meal_plan_id: Types.ObjectId
  day_number: number // Ngày thứ mấy trong thực đơn (1, 2, 3...)
  title?: string // "Ngày 1: Khởi động", "Ngày 2: Tăng cường"...
  description?: string
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fat: number
  notes?: string
}

const MealPlanDaySchema = new mongoose.Schema<MealPlanDay>(
  {
    meal_plan_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'meal_plans',
      required: true
    },
    day_number: {
      type: Number,
      required: true,
      min: 1
    },
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    total_calories: { type: Number, default: 0 },
    total_protein: { type: Number, default: 0 },
    total_carbs: { type: Number, default: 0 },
    total_fat: { type: Number, default: 0 },
    notes: { type: String, default: '' }
  },
  {
    timestamps: true,
    collection: 'meal_plan_days'
  }
)

// Compound index để đảm bảo unique day trong meal plan
MealPlanDaySchema.index({ meal_plan_id: 1, day_number: 1 }, { unique: true })
MealPlanDaySchema.index({ meal_plan_id: 1 })

const MealPlanDayModel = mongoose.model('meal_plan_days', MealPlanDaySchema)

export default MealPlanDayModel 