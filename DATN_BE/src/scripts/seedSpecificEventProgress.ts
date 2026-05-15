import mongoose from 'mongoose'
import fs from 'fs'
import { envConfig } from '../constants/config'
import ActivityTrackingModel from '../models/schemas/activityTracking.schema'
import SportEventProgressModel from '../models/schemas/sportEventProgress.schema'
import SportEventModel from '../models/schemas/sportEvent.schema'

async function seedEventProgress() {
  await mongoose.connect(envConfig.mongoURL)
  console.log('Connected to MongoDB')

  const eventId = new mongoose.Types.ObjectId('69f45e77977df80dd23b0591')
  const event = await SportEventModel.findById(eventId)
  if (!event) {
    console.error('Event not found')
    await mongoose.disconnect()
    return
  }

  const participants = event.participants_ids || []
  console.log(`Found ${participants.length} participants`)

  const masterRoute = JSON.parse(fs.readFileSync('c:/DATN/fedacn/DATN_BE/src/scripts/master_route_thong_nhat.json', 'utf8'))
  const totalLoopDistanceM = 5065.66
  const caloriesPerKm = 65

  // Delete existing data for this event to re-seed with randomized data
  await ActivityTrackingModel.deleteMany({ eventId })
  await SportEventProgressModel.deleteMany({ eventId })
  console.log('Cleared existing data for this event')

  const startDate = new Date('2026-04-15T00:00:00Z')
  const today = new Date()
  today.setHours(23, 59, 59, 999)

  for (const userId of participants) {
    console.log(`Seeding randomized data for user: ${userId}`)
    let currentDate = new Date(startDate)

    while (currentDate <= today) {
      // User has 60% chance to run on any given day
      if (Math.random() > 0.4) {
        const startTime = new Date(currentDate)
        
        // Randomize session: 60% Morning (5-9 AM), 40% Evening (4-7 PM)
        const isEvening = Math.random() > 0.6;
        const startHour = isEvening ? 16 + Math.floor(Math.random() * 3) : 5 + Math.floor(Math.random() * 4);
        startTime.setHours(startHour, Math.floor(Math.random() * 60), Math.floor(Math.random() * 60))
        
        // Randomize distance: between 0.4 and 1.6 loops (approx 2km to 8km)
        const distanceFactor = 0.4 + Math.random() * 1.2
        const currentDistanceM = totalLoopDistanceM * distanceFactor
        
        const avgSpeed = 2.0 + Math.random() * 1.8 // 7.2 km/h - 13.6 km/h
        const currentDuration = Math.round(currentDistanceM / avgSpeed)
        
        // Random start index on the master loop (circular shift)
        const startIndex = Math.floor(Math.random() * masterRoute.length)
        const numPointsNeeded = Math.max(10, Math.round(masterRoute.length * distanceFactor))
        
        // Global jitter for the whole route to avoid users starting at the same exact spot
        const userJitterLat = (Math.random() - 0.5) * 0.0002
        const userJitterLng = (Math.random() - 0.5) * 0.0002
        
        const gpsRoute = []
        for (let i = 0; i < numPointsNeeded; i++) {
          const originalPoint = masterRoute[(startIndex + i) % masterRoute.length]
          // Point-level jitter for GPS noise
          const pointJitterLat = (Math.random() - 0.5) * 0.00005
          const pointJitterLng = (Math.random() - 0.5) * 0.00005
          
          gpsRoute.push({
            lat: Number((originalPoint.lat + userJitterLat + pointJitterLat).toFixed(6)),
            lng: Number((originalPoint.lng + userJitterLng + pointJitterLng).toFixed(6)),
            timestamp: startTime.getTime() + Math.round((i / numPointsNeeded) * currentDuration * 1000),
            speed: Number((avgSpeed * (0.85 + Math.random() * 0.3)).toFixed(2))
          })
        }

        const activity = await ActivityTrackingModel.create({
          eventId,
          userId,
          activityType: 'Chạy bộ',
          status: 'completed',
          startTime,
          endTime: new Date(startTime.getTime() + currentDuration * 1000),
          totalDuration: currentDuration,
          totalDistance: currentDistanceM,
          avgSpeed: Number(avgSpeed.toFixed(2)),
          maxSpeed: Number((avgSpeed * (1.2 + Math.random() * 0.3)).toFixed(2)),
          avgPace: Number(((currentDuration / 60) / (currentDistanceM / 1000)).toFixed(2)),
          calories: Math.round((currentDistanceM / 1000) * caloriesPerKm),
          gpsRoute,
          source: 'app'
        })

        await SportEventProgressModel.create({
          eventId,
          userId,
          date: startTime,
          value: currentDistanceM / 1000,
          unit: 'km',
          distance: currentDistanceM / 1000,
          calories: Math.round((currentDistanceM / 1000) * caloriesPerKm),
          time: `${Math.round(currentDuration / 60)} phút`,
          source: 'gps',
          sessionId: null,
          activityTrackingId: activity._id
        })
      }

      currentDate.setDate(currentDate.getDate() + 1)
    }
  }

  console.log('Randomized seeding completed successfully!')
  await mongoose.disconnect()
}

seedEventProgress().catch(console.error)
