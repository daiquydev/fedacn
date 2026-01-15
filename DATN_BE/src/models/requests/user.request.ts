export interface UpdateUserBody {
  user_id: string
  name?: string
  user_name?: string
  birthday?: Date
  address?: string
}

export interface RequestUserBody {
  user_id: string
  reason?: string
  proof?: string
}

export interface UpdateHealthProfileBody {
  user_id: string
  gender?: string
  age?: number
  height?: number
  weight?: number
  target_weight?: number
  activity_level?: string
  health_goal?: string
  dietary_preferences?: string
  allergies?: string
  bmi?: number
  bmr?: number
  tdee?: number
}
