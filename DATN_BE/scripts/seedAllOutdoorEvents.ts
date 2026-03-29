import mongoose from 'mongoose'
import dotenv from 'dotenv'
import SportEventModel from '../src/models/schemas/sportEvent.schema'
import SportEventProgressModel from '../src/models/schemas/sportEventProgress.schema'
import ActivityTrackingModel from '../src/models/schemas/activityTracking.schema'
import SportCategoryModel from '../src/models/schemas/sportCategory.schema'
import UserModel from '../src/models/schemas/user.schema'
import moment from 'moment'

dotenv.config()

const MONGODB_URL = process.env.MONGODB_URL || ''
const TARGET_EMAIL = 'quy.tranquil@gmail.com'
const ALREADY_SEEDED = '69ab3e1a00e50d111a22e622' // skip this one, already done

// ─── Speed profiles per sport category (m/s) ───
// Running: 7-11 km/h = 1.94-3.06 m/s
// Cycling: 15-25 km/h = 4.17-6.94 m/s
// Walking: 4-6 km/h = 1.11-1.67 m/s
// Swimming: 2-4 km/h = 0.56-1.11 m/s (not GPS but just in case)
const SPEED_PROFILES: Record<string, { minMs: number; maxMs: number; distMin: number; distMax: number }> = {
  'Chạy bộ': { minMs: 1.94, maxMs: 3.06, distMin: 0.3, distMax: 0.6 },
  'Đạp xe': { minMs: 4.17, maxMs: 6.94, distMin: 1.0, distMax: 3.0 },
  'Đi bộ': { minMs: 1.11, maxMs: 1.67, distMin: 0.2, distMax: 0.5 },
  'Bơi lội': { minMs: 0.56, maxMs: 1.11, distMin: 0.1, distMax: 0.3 },
  'default': { minMs: 1.94, maxMs: 3.06, distMin: 0.3, distMax: 0.6 },
}

const DEFAULT_KCAL_PER_KM = 60

const RUNNING_ROUTES = [
  { baseLat: 10.7725, baseLng: 106.6911 },
  { baseLat: 10.7738, baseLng: 106.7028 },
  { baseLat: 10.7685, baseLng: 106.6897 },
  { baseLat: 10.7645, baseLng: 106.6602 },
  { baseLat: 10.8012, baseLng: 106.7121 },
]

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function generateGpsRoute(distanceKm: number, startTime: Date, avgSpeedMs: number) {
  const route = RUNNING_ROUTES[Math.floor(Math.random() * RUNNING_ROUTES.length)]
  const distanceM = distanceKm * 1000
  const totalDurationS = distanceM / avgSpeedMs
  const numPoints = Math.max(10, Math.floor(totalDurationS / 5))
  const segmentDistM = distanceM / numPoints
  const points: any[] = []

  let currentLat = route.baseLat + rand(-0.002, 0.002)
  let currentLng = route.baseLng + rand(-0.002, 0.002)
  let bearing = rand(0, 360)
  const startTs = startTime.getTime()

  for (let i = 0; i < numPoints; i++) {
    bearing += rand(-15, 15)
    const bearingRad = (bearing * Math.PI) / 180
    const dLat = (segmentDistM * Math.cos(bearingRad)) / 111320
    const dLng = (segmentDistM * Math.sin(bearingRad)) / (111320 * Math.cos((currentLat * Math.PI) / 180))
    currentLat += dLat
    currentLng += dLng
    const pointSpeed = avgSpeedMs * rand(0.8, 1.2)

    points.push({
      lat: Number(currentLat.toFixed(6)),
      lng: Number(currentLng.toFixed(6)),
      timestamp: Math.round(startTs + (i * totalDurationS * 1000) / numPoints),
      speed: Number(pointSpeed.toFixed(2)),
      altitude: Number(rand(3, 12).toFixed(1))
    })
  }
  return points
}

async function getKcalPerKm(category: string): Promise<number> {
  const cat = await SportCategoryModel.findOne({ name: category, isDeleted: { $ne: true } })
  if (cat && cat.kcal_per_unit > 0) return cat.kcal_per_unit
  return DEFAULT_KCAL_PER_KM
}

const seed = async () => {
  try {
    console.log('🔗 Connecting...')
    await mongoose.connect(MONGODB_URL)
    console.log('✅ Connected')

    // Find target user
    const user = await UserModel.findOne({ email: TARGET_EMAIL })
    if (!user) {
      console.log(`❌ User ${TARGET_EMAIL} not found!`)
      process.exit(1)
    }
    console.log(`👤 Found user: ${user.name} (${user._id})`)

    // Find all outdoor events where user is participant (excluding already seeded)
    const events = await SportEventModel.find({
      eventType: 'Ngoài trời',
      participants_ids: user._id,
      _id: { $ne: ALREADY_SEEDED }
    })

    if (events.length === 0) {
      console.log('❌ No other outdoor events found for this user')
      process.exit(0)
    }

    console.log(`\n📋 Found ${events.length} outdoor events to seed:`)
    events.forEach((e, i) => console.log(`  ${i + 1}. ${e.name} (${e.category}) [${e._id}]`))

    for (const event of events) {
      console.log(`\n${'═'.repeat(60)}`)
      console.log(`🏟️  Seeding: "${event.name}" (${event.category})`)
      console.log(`${'═'.repeat(60)}`)

      const category = event.category || 'Chạy bộ'
      const profile = SPEED_PROFILES[category] || SPEED_PROFILES['default']
      const kcalPerKm = await getKcalPerKm(category)

      console.log(`   Speed: ${(profile.minMs * 3.6).toFixed(1)}-${(profile.maxMs * 3.6).toFixed(1)} km/h`)
      console.log(`   Distance: ${profile.distMin}-${profile.distMax} km/run`)
      console.log(`   Calories: ${kcalPerKm} kcal/km`)

      // Date range: event start_date → min(event end_date, today)
      const eventStart = moment(event.start_date || '2026-03-01')
      const eventEnd = moment.min(moment(event.end_date || '2026-03-29'), moment('2026-03-29'))
      
      // Don't go further back than 21 days for reasonable data
      const dataStart = moment.max(eventStart, moment('2026-03-09'))
      const totalDays = eventEnd.diff(dataStart, 'days') + 1

      if (totalDays <= 0) {
        console.log(`   ⚠️ No valid date range, skipping`)
        continue
      }

      console.log(`   Date range: ${dataStart.format('DD/MM')} → ${eventEnd.format('DD/MM')} (${totalDays} days)`)

      // Get all participants for this event
      const participants = event.participants_ids || []
      console.log(`   Participants: ${participants.length}`)

      // Clean old data for this event
      await ActivityTrackingModel.deleteMany({ eventId: event._id })
      await SportEventProgressModel.deleteMany({ eventId: event._id })
      console.log(`   🧹 Cleaned old data`)

      let count = 0
      for (const userId of participants) {
        for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
          const currentDay = dataStart.clone().add(dayOffset, 'days')

          // 2 runs per day
          const runTimes = [
            currentDay.clone().hours(Math.floor(rand(6, 8))).minutes(Math.floor(rand(0, 59))),
            currentDay.clone().hours(Math.floor(rand(17, 19))).minutes(Math.floor(rand(0, 59)))
          ]

          for (const runTime of runTimes) {
            const distanceKm = Number(rand(profile.distMin, profile.distMax).toFixed(2))
            const distanceM = distanceKm * 1000
            const avgSpeedMs = Number(rand(profile.minMs, profile.maxMs).toFixed(2))
            const maxSpeedMs = Number((avgSpeedMs * rand(1.15, 1.35)).toFixed(2))
            const totalDuration = Math.round(distanceM / avgSpeedMs)
            const avgPace = Number(((totalDuration / 60) / distanceKm).toFixed(2))
            const calories = Math.round(distanceKm * kcalPerKm)

            const startTimeDate = runTime.toDate()
            const endTimeDate = moment(startTimeDate).add(totalDuration, 'seconds').toDate()
            const gpsRoute = generateGpsRoute(distanceKm, startTimeDate, avgSpeedMs)

            const durationMin = Math.floor(totalDuration / 60)

            await ActivityTrackingModel.create({
              eventId: event._id,
              userId,
              activityType: category,
              status: 'completed',
              startTime: startTimeDate,
              endTime: endTimeDate,
              totalDuration,
              totalDistance: distanceM,
              avgSpeed: avgSpeedMs,
              maxSpeed: maxSpeedMs,
              avgPace,
              calories,
              gpsRoute,
              pauseIntervals: []
            })

            await SportEventProgressModel.create({
              eventId: event._id,
              userId,
              date: startTimeDate,
              value: distanceKm,
              unit: 'km',
              distance: distanceKm,
              calories,
              time: `${durationMin} phút`,
              source: 'gps',
              notes: `Hoạt động ${category} - ${distanceKm}km trong ${durationMin} phút`
            })

            count++
          }
        }
      }

      console.log(`   ✅ Seeded ${count} activities`)
    }

    console.log(`\n🎉 All done!`)

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

seed()
