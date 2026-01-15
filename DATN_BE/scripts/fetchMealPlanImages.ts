import fs from 'fs'
import path from 'path'
import axios from 'axios'
import { EJSON } from 'bson'

const ACCESS_KEY = process.env.UNSPLASH_KEY || 'zS8dTa3CxlAN1_twdyOfWVH6h1Mx2PewqCNdDIpTThU'
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

const fetchImage = async (query: string) => {
  const url = 'https://api.unsplash.com/search/photos'
  const params = {
    query,
    per_page: 1,
    orientation: 'landscape',
    content_filter: 'high',
    client_id: ACCESS_KEY
  }
  const res = await axios.get(url, { params })
  const first = res.data?.results?.[0]
  return first?.urls?.regular || first?.urls?.full || ''
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const main = async () => {
  const plans = loadPlans()
  const cache = new Map<string, string>()

  const fallbacks: Record<string, string> = {
    'Thực đơn chay': 'vegetarian meal bowl',
    'Low Carb linh hoạt': 'low carb meal',
    'Keto gọn nhẹ': 'keto meal',
    'Kiểm soát đường huyết': 'diabetes friendly meal',
    'Tăng cân an toàn': 'high calorie healthy meal'
  }

  for (let i = 0; i < plans.length; i++) {
    const plan = plans[i]
    const query = plan.title || 'healthy meal plan'
    const fallbackQuery = Object.entries(fallbacks).find(([k]) => query.includes(k))?.[1]

    if (cache.has(query)) {
      plan.image = cache.get(query)
      plan.images = [plan.image]
      continue
    }

    try {
      let img = await fetchImage(query)
      if (!img && fallbackQuery) {
        img = await fetchImage(fallbackQuery)
      }
      if (img) {
        cache.set(query, img)
        plan.image = img
        plan.images = [img]
        console.log(`✅ ${i + 1}/${plans.length} ${query}`)
      } else {
        console.warn(`⚠️  No image for ${query}`)
      }
    } catch (err) {
      console.warn(`⚠️  Failed ${query}: ${(err as any).message}`)
    }

    // Small delay to be gentle with API rate limits
    await sleep(300)
  }

  writePlans(plans)
  console.log('✅ Updated meal plan images from Unsplash search')
}

main().catch((err) => {
  console.error('❌ Error:', err)
  process.exit(1)
})