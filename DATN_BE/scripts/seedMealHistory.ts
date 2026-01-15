import mongoose from 'mongoose'
import * as fs from 'fs'
import * as path from 'path'
import UserMealScheduleModel from '../src/models/schemas/userMealSchedule.schema'
import UserMealItemModel from '../src/models/schemas/userMealItem.schema'

const seedFilePath = path.join(__dirname, '../../data/user_meal_history_seed.json')
const seedPayload = JSON.parse(fs.readFileSync(seedFilePath, 'utf-8'))

const MONGODB_URI = 'mongodb+srv://yugi:yugi01@datn.zqrquqt.mongodb.net/test?retryWrites=true&w=majority'

const parseOid = (value: any) =>
  value && typeof value === 'object' && value.$oid ? new mongoose.Types.ObjectId(value.$oid) : value

const parseDate = (value: any) =>
  value && typeof value === 'object' && value.$date ? new Date(value.$date) : value

const normalizeSchedule = (entry: any) => {
  const {
    _id,
    user_id,
    meal_plan_id,
    start_date,
    end_date,
    createdAt,
    updatedAt,
    reminders,
    ...rest
  } = entry

  return {
    ...rest,
    ...(parseOid(_id) ? { _id: parseOid(_id) } : {}),
    user_id: parseOid(user_id),
    meal_plan_id: parseOid(meal_plan_id),
    start_date: parseDate(start_date),
    end_date: parseDate(end_date),
    createdAt: parseDate(createdAt),
    updatedAt: parseDate(updatedAt),
    reminders: Array.isArray(reminders) ? reminders : []
  }
}

const normalizeMealItem = (entry: any) => {
  const {
    _id,
    user_meal_schedule_id,
    meal_plan_meal_id,
    recipe_id,
    substituted_with_recipe_id,
    completed_at,
    scheduled_date,
    createdAt,
    updatedAt,
    images,
    ...rest
  } = entry

  return {
    ...rest,
    ...(parseOid(_id) ? { _id: parseOid(_id) } : {}),
    user_meal_schedule_id: parseOid(user_meal_schedule_id),
    meal_plan_meal_id: parseOid(meal_plan_meal_id),
    recipe_id: parseOid(recipe_id),
    substituted_with_recipe_id: parseOid(substituted_with_recipe_id),
    scheduled_date: parseDate(scheduled_date),
    completed_at: parseDate(completed_at),
    createdAt: parseDate(createdAt),
    updatedAt: parseDate(updatedAt),
    images: Array.isArray(images) ? images : []
  }
}

async function seedMealHistory() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    const schedules = (seedPayload.user_meal_schedules || []).map(normalizeSchedule)
    const mealItems = (seedPayload.user_meal_items || []).map(normalizeMealItem)

    if (!schedules.length || !mealItems.length) {
      console.log('ℹ️  No data found in seed payload. Abort seeding.')
      return
    }

    const scheduleIds = schedules.map((schedule: any) => schedule._id?.toString()).filter(Boolean)
    const mealItemIds = mealItems.map((item: any) => item._id?.toString()).filter(Boolean)

    if (scheduleIds.length) {
      const deleteSchedules = await UserMealScheduleModel.deleteMany({ _id: { $in: scheduleIds } })
      console.log(`🗑️  Removed ${deleteSchedules.deletedCount} existing schedules`)
    }

    if (mealItemIds.length) {
      const deleteMealItems = await UserMealItemModel.deleteMany({ _id: { $in: mealItemIds } })
      console.log(`🗑️  Removed ${deleteMealItems.deletedCount} existing meal items`)
    }

    await UserMealScheduleModel.insertMany(schedules)
    console.log(`✅ Inserted ${schedules.length} user meal schedule(s)`) 

    await UserMealItemModel.insertMany(mealItems)
    console.log(`✅ Inserted ${mealItems.length} meal item(s)`)
  } catch (error) {
    console.error('❌ Error seeding meal history:', error)
    throw error
  } finally {
    await mongoose.disconnect()
    console.log('👋 Disconnected from MongoDB')
  }
}

seedMealHistory()
  .then(() => {
    console.log('✨ Meal history seeding completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Meal history seeding failed:', error)
    process.exit(1)
  })
