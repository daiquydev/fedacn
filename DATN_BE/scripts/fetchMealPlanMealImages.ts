import fs from 'fs'
import path from 'path'
import axios from 'axios'
import { EJSON } from 'bson'

const DEFAULT_KEY = '9LHAt86ingHTxZnoCZsPCBO_xvhhRmPHEvIZKqwiou8'
const keyArgIndex = process.argv.indexOf('--key')
const ACCESS_KEY =
  (keyArgIndex !== -1 ? process.argv[keyArgIndex + 1] : undefined) ||
  process.env.UNSPLASH_KEY ||
  DEFAULT_KEY
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

const fetchImage = async (query: string) => {
  const url = 'https://api.unsplash.com/search/photos'
  const params = {
    query,
    per_page: 1,
    orientation: 'landscape',
    content_filter: 'high'
  }
  const res = await axios.get(url, {
    params,
    headers: {
      Authorization: `Client-ID ${ACCESS_KEY}`,
      'Accept-Version': 'v1'
    }
  })
  const first = res.data?.results?.[0]
  return first?.urls?.regular || first?.urls?.full || ''
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const main = async () => {
  const meals = loadMeals()
  const cache = new Map<string, string>()

  const fallbackMap: Record<string, string> = {
    'Bún xào': 'stir fried noodles Vietnam',
    'Cơm tấm Sài Gòn': 'broken rice pork chop vietnam',
    'Rau Muống Xào Tỏi': 'stir fried morning glory garlic',
    'Cơm Tấm Sườn Bì Chả': 'broken rice pork chop shredded pork vietnam',
    'Bún chả giò': 'vermicelli with fried spring rolls vietnam'
  }

  const uniqueNames = Array.from(
    new Set(
      meals.map((m) => (m.name && typeof m.name === 'string' ? m.name.trim() : 'healthy meal'))
    )
  )

  for (let i = 0; i < uniqueNames.length; i++) {
    const name = uniqueNames[i]
    if (cache.has(name)) continue

    try {
      const fallback = fallbackMap[name]
      let img = await fetchImage(name)
      if (!img) {
        img = await fetchImage(`${name} food`)
      }
      if (!img && fallback) {
        img = await fetchImage(fallback)
      }
      if (img) {
        cache.set(name, img)
        console.log(`✅ ${i + 1}/${uniqueNames.length} ${name}`)
      } else {
        console.warn(`⚠️  No image for ${name}`)
      }
    } catch (err) {
      console.warn(`⚠️  Failed ${name}: ${(err as any).message}`)
    }

    await sleep(700) // avoid rate limits
  }

  meals.forEach((meal) => {
    const name = meal.name && typeof meal.name === 'string' ? meal.name.trim() : 'healthy meal'
    if (cache.has(name)) {
      meal.image = cache.get(name)
    }
  })

  writeMeals(meals)
  console.log('✅ Updated meal_plan_meals.json images from Unsplash')
}

main().catch((err) => {
  console.error('❌ Error:', err)
  process.exit(1)
})