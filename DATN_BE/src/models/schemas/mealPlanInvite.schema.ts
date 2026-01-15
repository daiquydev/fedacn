import mongoose, { Types } from 'mongoose'
import { MealPlanInviteStatus } from '~/constants/enums'

const mealPlanInviteStatusValues = Object.values(MealPlanInviteStatus).filter(
  (value) => typeof value === 'number'
)

export interface MealPlanInvite {
  meal_plan_id: Types.ObjectId
  sender_id: Types.ObjectId
  receiver_id: Types.ObjectId
  status: MealPlanInviteStatus
  note?: string
}

const MealPlanInviteSchema = new mongoose.Schema<MealPlanInvite>(
  {
    meal_plan_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'meal_plans',
      required: true
    },
    sender_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'users',
      required: true
    },
    receiver_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'users',
      required: true
    },
    status: {
      type: Number,
      enum: mealPlanInviteStatusValues,
      default: MealPlanInviteStatus.pending
    },
    note: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true,
    collection: 'meal_plan_invites'
  }
)

MealPlanInviteSchema.index({ sender_id: 1, receiver_id: 1, meal_plan_id: 1, status: 1 })
MealPlanInviteSchema.index({ meal_plan_id: 1, receiver_id: 1 })

const MealPlanInviteModel = mongoose.model('meal_plan_invites', MealPlanInviteSchema)

export default MealPlanInviteModel
