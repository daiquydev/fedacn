import { checkSchema } from 'express-validator'
import { MEAL_PLAN_MESSAGE } from '~/constants/messages'
import { validate } from '~/utils/validation'

export const getMealPlanSocialContextValidator = validate(
  checkSchema(
    {
      meal_plan_id: {
        in: ['params'],
        notEmpty: {
          errorMessage: MEAL_PLAN_MESSAGE.MEAL_PLAN_NOT_FOUND
        },
        isMongoId: {
          errorMessage: MEAL_PLAN_MESSAGE.MEAL_PLAN_NOT_FOUND
        }
      }
    },
    ['params']
  )
)

export const inviteFriendToMealPlanValidator = validate(
  checkSchema(
    {
      meal_plan_id: {
        in: ['params'],
        notEmpty: {
          errorMessage: MEAL_PLAN_MESSAGE.MEAL_PLAN_NOT_FOUND
        },
        isMongoId: {
          errorMessage: MEAL_PLAN_MESSAGE.MEAL_PLAN_NOT_FOUND
        }
      },
      friend_id: {
        in: ['body'],
        notEmpty: {
          errorMessage: MEAL_PLAN_MESSAGE.INVITE_TARGET_NOT_FRIEND
        },
        isMongoId: {
          errorMessage: MEAL_PLAN_MESSAGE.INVITE_TARGET_NOT_FRIEND
        }
      },
      note: {
        in: ['body'],
        optional: true,
        isString: {
          errorMessage: 'Ghi chú không hợp lệ'
        },
        trim: true,
        isLength: {
          options: { max: 300 },
          errorMessage: 'Ghi chú tối đa 300 ký tự'
        }
      }
    },
    ['params', 'body']
  )
)
