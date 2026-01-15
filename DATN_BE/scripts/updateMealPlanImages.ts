import fs from 'fs'
import path from 'path'
import { EJSON } from 'bson'

// Unsplash access key: fallback to provided key, override via env UNSPLASH_KEY or CLI arg --key <key>
const DEFAULT_ACCESS_KEY = 'zS8dTa3CxlAN1_twdyOfWVH6h1Mx2PewqCNdDIpTThU'
const keyArgIndex = process.argv.indexOf('--key')
const ACCESS_KEY =
  (keyArgIndex !== -1 ? process.argv[keyArgIndex + 1] : undefined) ||
  process.env.UNSPLASH_KEY ||
  DEFAULT_ACCESS_KEY

const dataDir = path.join(__dirname, '../data/generated-meal-plans')
const mealPlansPath = path.join(dataDir, 'meal_plans.json')
const mealPlanMealsPath = path.join(dataDir, 'meal_plan_meals.json')

const buildUrl = (query: string) =>
  `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&client_id=${ACCESS_KEY}&orientation=landscape&w=1200&h=800&fit=max`

const planQueries = [
  'healthy meal prep',
  'high protein meal',
  'clean eating bowl',
  'vegetarian food plate',
  'low carb lunch',
  'keto dinner',
  'diabetes friendly meal',
  'heart healthy meal',
  'weight gain meal',
  'fitness meal'
]

const loadJson = (filePath: string) => {
  const raw = fs.readFileSync(filePath, 'utf-8')
  return EJSON.parse(raw, { relaxed: false }) as any[]
}

const writeJson = (filePath: string, data: any[]) => {
  const json = JSON.stringify(JSON.parse(EJSON.stringify(data, { relaxed: false })), null, 2)
  fs.writeFileSync(filePath, json)
}

const updateImages = () => {
  const mealPlans = loadJson(mealPlansPath)
  const mealPlanMeals = loadJson(mealPlanMealsPath)

  mealPlans.forEach((plan, idx) => {
    const query = planQueries[idx % planQueries.length]
    plan.image = buildUrl(query)
    if (Array.isArray(plan.images)) {
      plan.images = [plan.image]
    }
  })

  mealPlanMeals.forEach((meal) => {
    const name = meal.name || 'healthy meal'
    meal.image = buildUrl(name)
  })

  writeJson(mealPlansPath, mealPlans)
  writeJson(mealPlanMealsPath, mealPlanMeals)
}

updateImages()
console.log('✅ Updated images in meal_plans.json and meal_plan_meals.json using Unsplash random URLs')