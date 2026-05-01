import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env') })

import SportEventProgressModel from '../src/models/schemas/sportEventProgress.schema'
import ActivityTrackingModel from '../src/models/schemas/activityTracking.schema'

const mongoURI = process.env.MONGODB_URL

async function mapActivityIds() {
  if (!mongoURI) {
    console.error('Missing MONGODB_URL')
    return
  }

  await mongoose.connect(mongoURI)
  console.log('Connected to MongoDB')

  // Find all progress entries from GPS without activityTrackingId
  const progressEntries = await SportEventProgressModel.find({
    source: 'gps',
    activityTrackingId: null
  })

  console.log(`Found ${progressEntries.length} progress entries from GPS without activityTrackingId`)

  let matched = 0
  let unmatch = 0

  for (const progress of progressEntries) {
    // Find matching activity tracking
    // The date in progress is created around the same time as the end time of the activity tracking
    const progressDate = new Date(progress.date)
    
    // Look for activity tracking with same user, event, and startTime within a 1-minute window of progress date
    const activity = await ActivityTrackingModel.findOne({
      userId: progress.userId,
      eventId: progress.eventId,
      status: 'completed',
      startTime: {
        $gte: new Date(progressDate.getTime() - 60000),
        $lte: new Date(progressDate.getTime() + 60000)
      }
    })

    if (activity) {
      progress.activityTrackingId = activity._id as any
      await progress.save()
      matched++
      console.log(`Matched progress ${progress._id} with activity ${activity._id}`)
    } else {
      unmatch++
      console.log(`Could not find match for progress ${progress._id} (user: ${progress.userId}, event: ${progress.eventId}, date: ${progress.date})`)
    }
  }

  console.log(`Done! Matched: ${matched}, Unmatched: ${unmatch}`)
  await mongoose.disconnect()
}

mapActivityIds().catch(console.error)
