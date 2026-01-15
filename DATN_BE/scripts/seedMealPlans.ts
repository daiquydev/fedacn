import fs from 'fs'
import path from 'path'
import mongoose from 'mongoose'
import { EJSON } from 'bson'

// Reuse same URI style as other seed scripts
const MONGODB_URI = process.env.MONGODB_URL || 'mongodb+srv://yugi:yugi01@datn.zqrquqt.mongodb.net/test?retryWrites=true&w=majority'

const mealPlansPath = path.join(__dirname, '../data/generated-meal-plans/meal_plans.json')
const mealPlanDaysPath = path.join(__dirname, '../data/generated-meal-plans/meal_plan_days.json')
const mealPlanMealsPath = path.join(__dirname, '../data/generated-meal-plans/meal_plan_meals.json')

const loadJson = (filePath: string) => {
  const raw = fs.readFileSync(filePath, 'utf-8')
  // Use Extended JSON parsing to keep ObjectId
  return EJSON.parse(raw, { relaxed: false }) as any[]
}

async function seedMealPlans() {
  const dropFirst = process.argv.includes('--drop')

  console.log('🚀 Seeding meal plans from pre-generated JSON files...')
  console.log('   Files:')
  console.log(`   - ${mealPlansPath}`)
  console.log(`   - ${mealPlanDaysPath}`)
  console.log(`   - ${mealPlanMealsPath}`)

  const mealPlans = loadJson(mealPlansPath)
  const mealPlanDays = loadJson(mealPlanDaysPath)
  const mealPlanMeals = loadJson(mealPlanMealsPath)

  console.log(`   Loaded ${mealPlans.length} meal_plans, ${mealPlanDays.length} meal_plan_days, ${mealPlanMeals.length} meal_plan_meals`)

  if (!mealPlans.length || !mealPlanDays.length || !mealPlanMeals.length) {
    throw new Error('One of the JSON files is empty. Aborting to avoid partial seed.')
  }

  await mongoose.connect(MONGODB_URI)
  console.log('✅ Connected to MongoDB')

  if (dropFirst) {
    console.log('🗑️  Dropping existing meal plan collections...')
    await mongoose.connection.collection('meal_plans').deleteMany({})
    await mongoose.connection.collection('meal_plan_days').deleteMany({})
    await mongoose.connection.collection('meal_plan_meals').deleteMany({})
  }

  await mongoose.connection.collection('meal_plans').insertMany(mealPlans)
  await mongoose.connection.collection('meal_plan_days').insertMany(mealPlanDays)
  await mongoose.connection.collection('meal_plan_meals').insertMany(mealPlanMeals)

  console.log('✅ Seeded meal plan data successfully')
}

seedMealPlans()
  .then(async () => {
    await mongoose.disconnect()
    console.log('👋 Disconnected')
    process.exit(0)
  })
  .catch(async (error) => {
    console.error('❌ Error seeding meal plans:', error)
    await mongoose.disconnect()
    process.exit(1)
  })