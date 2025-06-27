import mongoose, { Types } from 'mongoose'
import { ScheduleStatus } from '~/constants/enums'

export interface UserMealSchedule {
  user_id: Types.ObjectId
  meal_plan_id: Types.ObjectId
  title: string
  start_date: Date
  end_date: Date
  status: ScheduleStatus
  progress: number // Phần trăm hoàn thành (0-100)
  current_day: number // Ngày hiện tại đang thực hiện
  total_completed_meals: number
  total_meals: number
  target_weight?: number // Cân nặng mục tiêu
  current_weight?: number // Cân nặng hiện tại
  notes?: string
  reminders?: {
    time: string
    enabled: boolean
    meal_type?: number
  }[]
  customizations?: any // Tùy chỉnh cá nhân
}

const UserMealScheduleSchema = new mongoose.Schema<UserMealSchedule>(
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
    title: {
      type: String,
      required: true,
      maxlength: 255
    },
    start_date: {
      type: Date,
      required: true
    },
    end_date: {
      type: Date,
      required: true
    },
    status: {
      type: Number,
      default: ScheduleStatus.active
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    current_day: {
      type: Number,
      default: 1,
      min: 1
    },
    total_completed_meals: {
      type: Number,
      default: 0
    },
    total_meals: {
      type: Number,
      default: 0
    },
    target_weight: { type: Number, default: null },
    current_weight: { type: Number, default: null },
    notes: { type: String, default: '' },
    reminders: [
      {
        time: { type: String, required: true },
        enabled: { type: Boolean, default: true },
        meal_type: { type: Number, default: null }
      }
    ],
    customizations: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  {
    timestamps: true,
    collection: 'user_meal_schedules'
  }
)

UserMealScheduleSchema.index({ user_id: 1, status: 1 })
UserMealScheduleSchema.index({ user_id: 1, start_date: 1 })
UserMealScheduleSchema.index({ meal_plan_id: 1 })

const UserMealScheduleModel = mongoose.model('user_meal_schedules', UserMealScheduleSchema)

export default UserMealScheduleModel 