/**
 * Seed stravaTypes cho các sport categories ngoài trời hiện có
 * Chạy 1 lần: npx ts-node src/scripts/seedStravaTypes.ts
 */
import mongoose from 'mongoose'
import { config } from 'dotenv'
config()

const MONGO_URL = process.env.MONGODB_URL || ''

const CATEGORY_STRAVA_MAP: Record<string, string[]> = {
  'Chạy bộ': ['Run', 'Walk', 'TrailRun', 'VirtualRun'],
  'Đạp xe': ['Ride', 'MountainBikeRide', 'GravelRide', 'VirtualRide', 'EBikeRide'],
  'Bơi lội': ['Swim'],
  'Leo núi': ['Hike', 'RockClimbing', 'AlpineSki'],
  'Đi bộ': ['Walk', 'Hike'],
}

async function main() {
  await mongoose.connect(MONGO_URL)
  console.log('Connected to MongoDB')

  const db = mongoose.connection.db!
  const collection = db.collection('sport_categories')

  for (const [name, stravaTypes] of Object.entries(CATEGORY_STRAVA_MAP)) {
    const result = await collection.updateMany(
      { name, type: 'Ngoài trời', $or: [{ stravaTypes: { $exists: false } }, { stravaTypes: { $size: 0 } }] },
      { $set: { stravaTypes } }
    )
    if (result.modifiedCount > 0) {
      console.log(`✅ ${name} → ${stravaTypes.join(', ')} (${result.modifiedCount} updated)`)
    } else {
      console.log(`⏭️  ${name} — already configured or not found`)
    }
  }

  await mongoose.disconnect()
  console.log('\nDone! Disconnected.')
}

main().catch(err => { console.error(err); process.exit(1) })
