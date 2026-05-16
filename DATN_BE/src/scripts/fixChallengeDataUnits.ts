import mongoose from 'mongoose'
import { envConfig } from '../constants/config'
import ActivityTrackingModel from '../models/schemas/activityTracking.schema'
import ChallengeProgressModel from '../models/schemas/challengeProgress.schema'

async function fixChallengeDataUnits() {
  await mongoose.connect(envConfig.mongoURL)
  console.log('Connected to MongoDB')

  // 1. Fix totalDuration in ActivityTracking
  const activityCursor = ActivityTrackingModel.find({ 
    is_deleted: { $ne: true },
    totalDuration: { $gt: 0, $lt: 300 },
    totalDistance: { $gt: 500 }
  }).cursor()
  
  let activityCount = 0
  for (let activity = await activityCursor.next(); activity != null; activity = await activityCursor.next()) {
    const oldDuration = activity.totalDuration
    activity.totalDuration = Math.round(oldDuration * 60)
    await activity.save()
    activityCount++
    if (activityCount % 100 === 0) console.log(`Processed ${activityCount} activities...`)
  }
  console.log(`Updated ${activityCount} ActivityTracking records (duration converted to seconds)`)

  // 2. Fix avg_speed in ChallengeProgress
  const progressCursor = ChallengeProgressModel.find({ 
    challenge_type: 'outdoor_activity',
    is_deleted: { $ne: true },
    avg_speed: { $gt: 0, $lt: 15 }
  }).cursor()
  
  let progressCount = 0
  for (let entry = await progressCursor.next(); entry != null; entry = await progressCursor.next()) {
    if (entry.avg_speed && entry.avg_speed > 0 && entry.avg_speed < 15) {
      const calculatedKmh = entry.distance && entry.duration_minutes ? (entry.distance / (entry.duration_minutes / 60)) : 0
      
      if (calculatedKmh > 0 && Math.abs(entry.avg_speed - calculatedKmh / 3.6) < 1.0) {
        entry.avg_speed = Number(calculatedKmh.toFixed(2))
        await entry.save()
        progressCount++
        if (progressCount % 100 === 0) console.log(`Processed ${progressCount} progress entries...`)
      }
    }
  }
  console.log(`Updated ${progressCount} ChallengeProgress records (speed converted to km/h)`)

  await mongoose.disconnect()
}

fixChallengeDataUnits().catch(console.error)
