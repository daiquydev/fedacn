import fs from 'fs'
import path from 'path'
import mongoose from 'mongoose'
import { EJSON } from 'bson'

const MONGODB_URI = process.env.MONGODB_URL || 'mongodb+srv://yugi:yugi01@datn.zqrquqt.mongodb.net/test?retryWrites=true&w=majority'
const FALLBACK_IMAGE = process.env.MEAL_IMAGE_URL || 'https://placehold.co/800x600?text=Meal'

const dataDir = path.join(__dirname, '../data/generated-meal-plans')
const mealsPath = path.join(dataDir, 'meal_plan_meals.json')

const loadMeals = () => {
  const raw = fs.readFileSync(mealsPath, 'utf-8')
  return EJSON.parse(raw, { relaxed: false }) as any[]
}

const writeMeals = (meals: any[]) => {
  const json = JSON.stringify(JSON.parse(EJSON.stringify(meals, { relaxed: false })), null, 2)
  fs.writeFileSync(mealsPath, json)
}

const main = async () => {
  await mongoose.connect(MONGODB_URI)
  console.log('✅ Connected to MongoDB')

  const recipes = await mongoose.connection
    .collection('recipes')
    .find({}, { projection: { image: 1, title: 1 } })
    .toArray()

  const imageMap = new Map<string, string>()
  recipes.forEach((r: any) => {
    if (r._id && r.image) {
      imageMap.set(r._id.toString(), r.image)
    }
  })

  const meals = loadMeals()
  let updated = 0

  meals.forEach((meal) => {
    const rid = meal.recipe_id?.$oid || meal.recipe_id?.toString?.()
    if (rid && imageMap.has(rid)) {
      meal.image = imageMap.get(rid)
      updated++
    } else if (!meal.image) {
      meal.image = FALLBACK_IMAGE
    }
  })

  writeMeals(meals)
  console.log(`✅ Updated ${updated} meals with recipe images; set fallback for others if missing`)
}

main()
  .then(async () => {
    await mongoose.disconnect()
    console.log('👋 Done')
    process.exit(0)
  })
  .catch(async (err) => {
    console.error('❌ Error:', err)
    await mongoose.disconnect()
    process.exit(1)
  })