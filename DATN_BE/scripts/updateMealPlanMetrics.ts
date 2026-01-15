import fs from 'fs'
import path from 'path'
import { EJSON } from 'bson'

const dataDir = path.join(__dirname, '../data/generated-meal-plans')
const mealPlansPath = path.join(dataDir, 'meal_plans.json')

const loadPlans = () => {
  const raw = fs.readFileSync(mealPlansPath, 'utf-8')
  return EJSON.parse(raw, { relaxed: false }) as any[]
}

const writePlans = (plans: any[]) => {
  const json = JSON.stringify(JSON.parse(EJSON.stringify(plans, { relaxed: false })), null, 2)
  fs.writeFileSync(mealPlansPath, json)
}

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

const updateMetrics = () => {
  const plans = loadPlans()

  plans.forEach((plan) => {
    plan.likes_count = rand(5, 120)
    plan.applied_count = rand(3, 80)
    plan.shared_count = rand(1, 50)
    plan.views_count = Math.max(plan.views_count || 0, plan.likes_count * rand(3, 8))
    plan.rating = (rand(38, 50) / 10).toFixed(1) // 3.8 - 5.0
    plan.rating = Number(plan.rating)
    plan.rating_count = rand(3, 60)
  })

  writePlans(plans)
}

updateMetrics()
console.log('✅ Updated likes/applied/shared/rating for meal_plans.json')