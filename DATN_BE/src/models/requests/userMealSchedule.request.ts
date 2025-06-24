export interface GetUserMealSchedulesQuery {
  page?: number
  limit?: number
  status?: number
}

export interface UpdateUserMealScheduleBody {
  title?: string
  end_date?: Date
  status?: number
  target_weight?: number
  current_weight?: number
  notes?: string
}

export interface GetDayMealItemsQuery {
  schedule_id: string
  date: string
}

export interface CompleteMealItemBody {
  meal_item_id: string
  actual_servings?: number
  actual_calories?: number
  rating?: number
  review?: string
  notes?: string
  images?: string[]
  location?: string
  mood?: string
  hunger_before?: number
  satisfaction_after?: number
}

export interface SkipMealItemBody {
  meal_item_id: string
  notes?: string
}

export interface SubstituteMealItemBody {
  meal_item_id: string
  substitute_recipe_id: string
  notes?: string
}

export interface GetDayNutritionStatsQuery {
  schedule_id: string
  date: string
}

export interface GetCompletedMealItemsQuery {
  page?: number
  limit?: number
  date_from?: string
  date_to?: string
}

export interface UpdateRemindersBody {
  reminders: {
    time: string
    enabled: boolean
    meal_type?: number
  }[]
} 