import fs from 'fs'
import path from 'path'
import mongoose, { Types } from 'mongoose'
import { EJSON } from 'bson'

const MONGODB_URI = process.env.MONGODB_URL || 'mongodb+srv://yugi:yugi01@datn.zqrquqt.mongodb.net/test?retryWrites=true&w=majority'

const dataDir = path.join(__dirname, '../data/generated-meal-plans')
const mealPlansPath = path.join(dataDir, 'meal_plans.json')
const mealPlanDaysPath = path.join(dataDir, 'meal_plan_days.json')
const mealPlanMealsPath = path.join(dataDir, 'meal_plan_meals.json')

const loadIds = (filePath: string) => {
  const raw = fs.readFileSync(filePath, 'utf-8')
  const docs = EJSON.parse(raw, { relaxed: false }) as { _id: Types.ObjectId }[]
  return docs.map((d) => new Types.ObjectId(d._id))
}

async function clearIds() {
  const planIds = loadIds(mealPlansPath)
  const dayIds = loadIds(mealPlanDaysPath)
  const mealIds = loadIds(mealPlanMealsPath)

  await mongoose.connect(MONGODB_URI)
  console.log('✅ Connected to MongoDB')

  const db = mongoose.connection

  const planDel = await db.collection('meal_plans').deleteMany({ _id: { $in: planIds } })
  const dayDel = await db.collection('meal_plan_days').deleteMany({ _id: { $in: dayIds } })
  const mealDel = await db.collection('meal_plan_meals').deleteMany({ _id: { $in: mealIds } })

  console.log(`🗑️  Deleted plans: ${planDel.deletedCount}, days: ${dayDel.deletedCount}, meals: ${mealDel.deletedCount}`)
}

clearIds()
  .then(async () => {
    await mongoose.disconnect()
    console.log('👋 Done')
    process.exit(0)
  })
  .catch(async (err) => {
    console.error('❌ Failed to clear ids:', err)
    await mongoose.disconnect()
    process.exit(1)
  })