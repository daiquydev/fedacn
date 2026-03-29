import mongoose from 'mongoose'
import dotenv from 'dotenv'
import SportEventModel from '../src/models/schemas/sportEvent.schema'
import SportEventProgressModel from '../src/models/schemas/sportEventProgress.schema'
import ActivityTrackingModel from '../src/models/schemas/activityTracking.schema'
import SportCategoryModel from '../src/models/schemas/sportCategory.schema'
import moment from 'moment'

dotenv.config()

const DEFAULT_KCAL_PER_KM = 60
const MONGODB_URL = process.env.MONGODB_URL || ''
const targetEventId = '69ab3e1a00e50d111a22e622'

// ─── Ho Chi Minh City running routes (base coordinates) ───
const RUNNING_ROUTES = [
  // Route 1: Around Tao Dan Park
  { baseLat: 10.7725, baseLng: 106.6911, name: 'Tao Dan Park' },
  // Route 2: Along Nguyen Hue Walking Street
  { baseLat: 10.7738, baseLng: 106.7028, name: 'Nguyen Hue' },
  // Route 3: Around September 23 Park
  { baseLat: 10.7685, baseLng: 106.6897, name: '23/9 Park' },
  // Route 4: Phu Tho area
  { baseLat: 10.7645, baseLng: 106.6602, name: 'Phu Tho' },
  // Route 5: Binh Thanh district
  { baseLat: 10.8012, baseLng: 106.7121, name: 'Binh Thanh' },
]

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

/**
 * Generate a realistic GPS running route
 * @param distanceKm - target distance in km
 * @param startTime - Date object for the start time
 * @param avgSpeedMs - average speed in m/s
 * @returns array of GpsPoints
 */
function generateGpsRoute(distanceKm: number, startTime: Date, avgSpeedMs: number) {
  const route = RUNNING_ROUTES[Math.floor(Math.random() * RUNNING_ROUTES.length)]
  const distanceM = distanceKm * 1000
  const totalDurationS = distanceM / avgSpeedMs

  // Number of GPS points (1 every ~5 seconds)
  const numPoints = Math.max(10, Math.floor(totalDurationS / 5))
  const segmentDistM = distanceM / numPoints

  const points: Array<{
    lat: number
    lng: number
    timestamp: number
    speed: number
    altitude: number
  }> = []

  let currentLat = route.baseLat + rand(-0.002, 0.002)
  let currentLng = route.baseLng + rand(-0.002, 0.002)
  let bearing = rand(0, 360) // random initial direction in degrees
  const startTs = startTime.getTime()

  for (let i = 0; i < numPoints; i++) {
    // Slight direction change each step (simulate turning on a path)
    bearing += rand(-15, 15)
    const bearingRad = (bearing * Math.PI) / 180

    // Move ~segmentDistM in the bearing direction
    // 1 degree lat ≈ 111,320 meters, 1 degree lng ≈ 111,320 * cos(lat) meters
    const dLat = (segmentDistM * Math.cos(bearingRad)) / 111320
    const dLng = (segmentDistM * Math.sin(bearingRad)) / (111320 * Math.cos((currentLat * Math.PI) / 180))

    currentLat += dLat
    currentLng += dLng

    // Vary speed ±20% for realism
    const pointSpeed = avgSpeedMs * rand(0.8, 1.2)

    points.push({
      lat: Number(currentLat.toFixed(6)),
      lng: Number(currentLng.toFixed(6)),
      timestamp: Math.round(startTs + (i * totalDurationS * 1000) / numPoints),
      speed: Number(pointSpeed.toFixed(2)),
      altitude: Number(rand(3, 12).toFixed(1)) // HCMC is flat, 3-12m
    })
  }

  return points
}

async function getKcalPerKm(category: string): Promise<number> {
  const cat = await SportCategoryModel.findOne({ name: category, isDeleted: { $ne: true } })
  if (cat && cat.kcal_per_unit > 0) return cat.kcal_per_unit
  return DEFAULT_KCAL_PER_KM
}

const seedProgress = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URL)
    console.log('✅ Connected to MongoDB')

    const event = await SportEventModel.findById(targetEventId)
    if (!event) {
      console.log(`❌ Event ${targetEventId} not found!`)
      process.exit(1)
    }

    console.log(`📅 Found Event: ${event.name}`)

    const kcalPerKm = await getKcalPerKm(event.category || '')
    console.log(`💪 kcal rate: ${kcalPerKm} kcal/km (category: ${event.category})`)

    const participants = event.participants_ids || []
    if (participants.length === 0) {
      console.log('❌ No participants found!')
      process.exit(1)
    }
    console.log(`👥 Participants: ${participants.length}`)

    // ─── CLEAN OLD DATA ───
    console.log('🧹 Cleaning old activity_tracking & sport_event_progress for this event...')
    await ActivityTrackingModel.deleteMany({ eventId: event._id })
    await SportEventProgressModel.deleteMany({ eventId: event._id })
    console.log('✅ Cleaned')

    // ─── DATE RANGE: 9/3/2026 → today (29/3/2026) ───
    const startDate = moment('2026-03-09', 'YYYY-MM-DD')
    const endDate = moment('2026-03-29', 'YYYY-MM-DD')
    const totalDays = endDate.diff(startDate, 'days') + 1
    console.log(`📆 Generating data from ${startDate.format('DD/MM')} to ${endDate.format('DD/MM')} (${totalDays} days)`)

    let totalActivities = 0

    for (const userId of participants) {
      console.log(`\n👤 Processing user: ${userId}`)

      for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
        const currentDay = startDate.clone().add(dayOffset, 'days')

        // 2 runs per day: morning (6-8am) and evening (5-7pm)
        const runTimes = [
          currentDay.clone().hours(Math.floor(rand(6, 8))).minutes(Math.floor(rand(0, 59))),
          currentDay.clone().hours(Math.floor(rand(17, 19))).minutes(Math.floor(rand(0, 59)))
        ]

        for (const runTime of runTimes) {
          // Distance: 0.3 - 0.6 km
          const distanceKm = Number(rand(0.3, 0.6).toFixed(2))
          const distanceM = distanceKm * 1000

          // Realistic jogging speed: 7-11 km/h = 1.94-3.06 m/s
          const avgSpeedMs = Number(rand(1.94, 3.06).toFixed(2))
          const maxSpeedMs = Number((avgSpeedMs * rand(1.15, 1.35)).toFixed(2))

          // Duration in seconds
          const totalDuration = Math.round(distanceM / avgSpeedMs)

          // Pace: min/km
          const avgPace = Number(((totalDuration / 60) / distanceKm).toFixed(2))

          // Calories
          const calories = Math.round(distanceKm * kcalPerKm)

          // Generate GPS route
          const startTimeDate = runTime.toDate()
          const endTimeDate = moment(startTimeDate).add(totalDuration, 'seconds').toDate()
          const gpsRoute = generateGpsRoute(distanceKm, startTimeDate, avgSpeedMs)

          // Duration string for progress
          const durationMin = Math.floor(totalDuration / 60)
          const durationSec = totalDuration % 60

          // ─── Insert ActivityTracking ───
          const activity = await ActivityTrackingModel.create({
            eventId: event._id,
            userId: userId,
            activityType: event.category || 'Chạy bộ',
            status: 'completed',
            startTime: startTimeDate,
            endTime: endTimeDate,
            totalDuration: totalDuration,     // seconds
            totalDistance: distanceM,          // meters
            avgSpeed: avgSpeedMs,             // m/s (matches useActivityTracking.js)
            maxSpeed: maxSpeedMs,             // m/s
            avgPace: avgPace,                 // min/km
            calories: calories,
            gpsRoute: gpsRoute,
            pauseIntervals: []
          })

          // ─── Insert SportEventProgress ───
          await SportEventProgressModel.create({
            eventId: event._id,
            userId: userId,
            date: startTimeDate,
            value: distanceKm,
            unit: 'km',
            distance: distanceKm,
            calories: calories,
            time: `${durationMin} phút`,
            source: 'gps',
            notes: `Hoạt động ${event.category || 'Chạy bộ'} - ${distanceKm}km trong ${durationMin} phút`
          })

          totalActivities++
        }
      }
    }

    console.log(`\n🎉 Done! Seeded ${totalActivities} activities across ${participants.length} users × ${totalDays} days × 2 runs/day`)
    console.log(`📊 Expected distance per user: ~${(totalDays * 2 * 0.45).toFixed(1)} km`)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    setTimeout(() => {
      mongoose.disconnect()
      console.log('🔌 Disconnected')
      process.exit(0)
    }, 1000)
  }
}

seedProgress()
