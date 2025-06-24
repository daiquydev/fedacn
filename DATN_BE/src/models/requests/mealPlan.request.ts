export interface CreateMealPlanBody {
  title: string
  description?: string
  duration: number
  category: number
  target_calories?: number
  target_protein?: number
  target_carbs?: number
  target_fat?: number
  image?: string
  images?: string[]
  is_public?: boolean
  difficulty_level?: number
  price_range?: string
  suitable_for?: string[]
  restrictions?: string[]
  tags?: string[]
  days: CreateMealPlanDayBody[]
}

export interface CreateMealPlanDayBody {
  day_number: number
  title?: string
  description?: string
  notes?: string
  meals: CreateMealPlanMealBody[]
}

export interface CreateMealPlanMealBody {
  meal_type: number
  name: string
  description?: string
  recipe_id?: string
  ingredients?: {
    name: string
    quantity: number
    unit: string
    calories: number
  }[]
  instructions?: string
  prep_time?: number
  cook_time?: number
  servings?: number
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  fiber?: number
  sugar?: number
  sodium?: number
  image?: string
  meal_order?: number
  is_optional?: boolean
  alternatives?: string[]
  notes?: string
}

export interface UpdateMealPlanBody {
  title?: string
  description?: string
  target_calories?: number
  target_protein?: number
  target_carbs?: number
  target_fat?: number
  image?: string
  images?: string[]
  is_public?: boolean
  difficulty_level?: number
  price_range?: string
  suitable_for?: string[]
  restrictions?: string[]
  tags?: string[]
  status?: number
}

export interface GetPublicMealPlansQuery {
  page?: number
  limit?: number
  category?: number
  difficulty_level?: number
  duration?: number
  sort?: string
  search?: string
}

export interface GetMyMealPlansQuery {
  page?: number
  limit?: number
  status?: number
}

export interface LikeMealPlanBody {
  meal_plan_id: string
}

export interface BookmarkMealPlanBody {
  meal_plan_id: string
  folder_name?: string
  notes?: string
}

export interface CommentMealPlanBody {
  meal_plan_id: string
  content: string
  parent_id?: string
}

export interface ApplyMealPlanBody {
  meal_plan_id: string
  title: string
  start_date: Date
  target_weight?: number
  notes?: string
  reminders?: {
    time: string
    enabled: boolean
    meal_type?: number
  }[]
}

export interface GetMealPlanCommentsQuery {
  page?: number
  limit?: number
}

export interface GetBookmarkedMealPlansQuery {
  page?: number
  limit?: number
  folder_name?: string
}

export interface GetFeaturedMealPlansQuery {
  limit?: number
}

export interface GetTrendingMealPlansQuery {
  limit?: number
  days?: number
} 