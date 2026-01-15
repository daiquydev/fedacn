import mongoose from 'mongoose'

// Fallback image URL (override via env MEAL_IMAGE_URL or CLI arg --url)
const FALLBACK_IMAGE = process.env.MEAL_IMAGE_URL || 'https://placehold.co/600x400?text=Meal'
const MONGODB_URI = process.env.MONGODB_URL || 'mongodb+srv://yugi:yugi01@datn.zqrquqt.mongodb.net/test?retryWrites=true&w=majority'

// CLI: --url <url>
const urlArgIndex = process.argv.indexOf('--url')
const customUrl = urlArgIndex !== -1 ? process.argv[urlArgIndex + 1] : undefined
const targetUrl = customUrl || FALLBACK_IMAGE

const needsReplaceQuery = {
  $or: [
    { image: { $exists: false } },
    { image: '' },
    { image: null }
  ]
}

async function run() {
  await mongoose.connect(MONGODB_URI)
  console.log('✅ Connected to MongoDB')

  const plans = mongoose.connection.collection('meal_plans')
  const planMeals = mongoose.connection.collection('meal_plan_meals')

  const planResult = await plans.updateMany(needsReplaceQuery, { $set: { image: targetUrl } })
  const mealResult = await planMeals.updateMany(needsReplaceQuery, { $set: { image: targetUrl } })

  console.log(`🖼️  Updated meal_plans: ${planResult.modifiedCount}`)
  console.log(`🖼️  Updated meal_plan_meals: ${mealResult.modifiedCount}`)
}

run()
  .then(async () => {
    await mongoose.disconnect()
    console.log('👋 Done')
    process.exit(0)
  })
  .catch(async (err) => {
    console.error('❌ Failed:', err)
    await mongoose.disconnect()
    process.exit(1)
  })