import mongoose, { Types } from 'mongoose'
import { MealPlanCategory, MealPlanStatus, DifficultLevel } from '~/constants/enums'

export interface MealPlan {
  title: string
  description?: string
  author_id: Types.ObjectId
  duration: number // Số ngày của thực đơn
  category: MealPlanCategory
  target_calories?: number
  total_calories?: number
  target_protein?: number
  target_carbs?: number
  target_fat?: number
  image?: string
  images?: string[]
  status: MealPlanStatus
  is_public: boolean
  difficulty_level: DifficultLevel
  price_range?: string
  suitable_for?: string[] // ["diabetes", "hypertension", "pregnant"]
  restrictions?: string[] // ["no_dairy", "no_gluten", "halal"]
  tags?: string[]
  likes_count: number
  comments_count: number
  bookmarks_count: number
  applied_count: number
  rating: number
  rating_count: number
  views_count: number
  shared_count: number
  featured: boolean
  search_fields?: string
  report_meal_plan?: { user_id: Types.ObjectId; reason: string; created_at: Date }[]
}

const MealPlanSchema = new mongoose.Schema<MealPlan>(
  {
    title: { type: String, required: true, maxlength: 255 },
    description: { type: String, default: '' },
    author_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'users',
      required: true
    },
    duration: { type: Number, required: true, min: 1 },
    category: { type: Number, required: true },
    target_calories: { type: Number, default: 0 },
    total_calories: { type: Number, default: 0 },
    target_protein: { type: Number, default: 0 },
    target_carbs: { type: Number, default: 0 },
    target_fat: { type: Number, default: 0 },
    image: { type: String, default: '' },
    images: [{ type: String }],
    status: { type: Number, default: MealPlanStatus.draft },
    is_public: { type: Boolean, default: true },
    difficulty_level: { type: Number, default: DifficultLevel.easy },
    price_range: { type: String, default: '' },
    suitable_for: [{ type: String }],
    restrictions: [{ type: String }],
    tags: [{ type: String }],
    likes_count: { type: Number, default: 0 },
    comments_count: { type: Number, default: 0 },
    bookmarks_count: { type: Number, default: 0 },
    applied_count: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    rating_count: { type: Number, default: 0 },
    views_count: { type: Number, default: 0 },
    shared_count: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    search_fields: { type: String, default: '' },
    report_meal_plan: [
      {
        user_id: {
          type: mongoose.SchemaTypes.ObjectId,
          ref: 'users',
          default: null
        },
        reason: { type: String, default: '' },
        created_at: { type: Date, default: Date.now }
      }
    ]
  },
  {
    timestamps: true,
    collection: 'meal_plans'
  }
)

MealPlanSchema.pre('save', async function (next) {
  try {
    const tags = this.tags?.join(' ') || ''
    const suitable = this.suitable_for?.join(' ') || ''
    const restrictions = this.restrictions?.join(' ') || ''
    this.search_fields = `${this.title} ${this.description} ${tags} ${suitable} ${restrictions}`.toLowerCase()
    next()
  } catch (error: any) {
    next(error)
  }
})

MealPlanSchema.index({ search_fields: 'text' }, { default_language: 'none' })
MealPlanSchema.index({ author_id: 1, status: 1 })
MealPlanSchema.index({ category: 1, status: 1, is_public: 1 })
MealPlanSchema.index({ featured: 1, status: 1 })
MealPlanSchema.index({ rating: -1, rating_count: 1 })
// Critical indexes for public meal plans query performance
MealPlanSchema.index({ status: 1, is_public: 1, createdAt: -1 })
MealPlanSchema.index({ status: 1, is_public: 1, likes_count: -1 })

const MealPlanModel = mongoose.model('meal_plans', MealPlanSchema)

export default MealPlanModel 