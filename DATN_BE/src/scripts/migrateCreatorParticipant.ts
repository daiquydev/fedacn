import mongoose from 'mongoose'
import { envConfig } from '../constants/config'
import SportEventModel from '../models/schemas/sportEvent.schema'

/**
 * Migration: Patch existing sport events so that the creator (createdBy)
 * is always included in participants_ids.
 *
 * Run once: npx ts-node src/scripts/migrateCreatorParticipant.ts
 */
async function migrate() {
  await mongoose.connect(envConfig.mongoURL)
  console.log('Connected to MongoDB')

  // Find all events where createdBy is NOT in participants_ids
  const events = await SportEventModel.find({
    createdBy: { $exists: true },
    $expr: {
      $not: { $in: ['$createdBy', { $ifNull: ['$participants_ids', []] }] }
    }
  })

  console.log(`Found ${events.length} events needing migration`)

  let patched = 0
  for (const event of events) {
    await SportEventModel.updateOne(
      { _id: event._id },
      {
        $addToSet: { participants_ids: event.createdBy },
        $inc: { participants: 1 }
      }
    )
    patched++
    console.log(`  Patched event "${event.name}" (${event._id})`)
  }

  console.log(`\nMigration complete: ${patched}/${events.length} events patched`)
  await mongoose.disconnect()
  process.exit(0)
}

migrate().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
