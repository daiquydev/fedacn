/**
 * Seed script: Add 9-10km running activities for User1 in "Giải Chạy Bộ Vì Cộng Đồng"
 * Event: 69aed3edc0bc684ba23f7cad
 * User: User1 (697d97a91e44e30bb8bfa514)
 * Date range: 10/03/2026 -> 11/04/2026 (32 days)
 * 2-3 activities per day, total random 9-10km, with GPS route data
 */

const mongoose = require('mongoose')

const MONGODB_URL = 'mongodb+srv://daiquy:10102003@cluster0.cxzaocf.mongodb.net/?appName=Cluster0'
const EVENT_ID = '69aed3edc0bc684ba23f7cad'
const USER_ID = '697d97a91e44e30bb8bfa514'
const DEFAULT_KCAL_PER_KM = 60

// HCM running routes near Tân Sơn Nhất, Tân Bình
const RUNNING_ROUTES = [
  { baseLat: 10.8010, baseLng: 106.6650, name: 'Tân Sơn Nhất' },
  { baseLat: 10.7960, baseLng: 106.6580, name: 'Trường Chinh' },
  { baseLat: 10.8050, baseLng: 106.6750, name: 'Cộng Hòa' },
  { baseLat: 10.7900, baseLng: 106.6720, name: 'Lý Thường Kiệt' },
  { baseLat: 10.8100, baseLng: 106.6600, name: 'Quang Trung' },
]

function rand(min, max) {
  return Math.random() * (max - min) + min
}

function randInt(min, max) {
  return Math.floor(rand(min, max + 1))
}

function generateGpsRoute(distanceKm, startTime, avgSpeedMs) {
  const route = RUNNING_ROUTES[Math.floor(Math.random() * RUNNING_ROUTES.length)]
  const distanceM = distanceKm * 1000
  const totalDurationS = distanceM / avgSpeedMs

  // ~1 GPS point every 5 seconds
  const numPoints = Math.max(10, Math.floor(totalDurationS / 5))
  const segmentDistM = distanceM / numPoints

  const points = []
  let currentLat = route.baseLat + rand(-0.003, 0.003)
  let currentLng = route.baseLng + rand(-0.003, 0.003)
  let bearing = rand(0, 360)
  const startTs = startTime.getTime()

  for (let i = 0; i < numPoints; i++) {
    bearing += rand(-20, 20)
    const bearingRad = (bearing * Math.PI) / 180

    const dLat = (segmentDistM * Math.cos(bearingRad)) / 111320
    const dLng = (segmentDistM * Math.sin(bearingRad)) / (111320 * Math.cos((currentLat * Math.PI) / 180))

    currentLat += dLat
    currentLng += dLng
    const pointSpeed = avgSpeedMs * rand(0.75, 1.25)

    points.push({
      lat: Number(currentLat.toFixed(6)),
      lng: Number(currentLng.toFixed(6)),
      timestamp: Math.round(startTs + (i * totalDurationS * 1000) / numPoints),
      speed: Number(pointSpeed.toFixed(2)),
      altitude: Number(rand(2, 15).toFixed(1))
    })
  }

  return points
}

const ActivityTrackingSchema = new mongoose.Schema({
  eventId: mongoose.Schema.Types.ObjectId,
  userId: mongoose.Schema.Types.ObjectId,
  activityType: String,
  status: String,
  startTime: Date,
  endTime: Date,
  totalDuration: Number,
  totalDistance: Number,
  avgSpeed: Number,
  maxSpeed: Number,
  avgPace: Number,
  calories: Number,
  gpsRoute: Array,
  pauseIntervals: Array
}, { timestamps: true, collection: 'activity_tracking' })

const SportEventProgressSchema = new mongoose.Schema({
  eventId: mongoose.Schema.Types.ObjectId,
  userId: mongoose.Schema.Types.ObjectId,
  date: Date,
  value: Number,
  unit: String,
  distance: Number,
  calories: Number,
  time: String,
  source: String,
  notes: String,
  is_deleted: Boolean
}, { timestamps: true, collection: 'sport_event_progress' })

const ActivityTrackingModel = mongoose.model('activity_tracking', ActivityTrackingSchema)
const SportEventProgressModel = mongoose.model('sport_event_progress', SportEventProgressSchema)

async function seed() {
  try {
    console.log('🔗 Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URL)
    console.log('✅ Connected')

    const db = mongoose.connection.db
    const eventId = new mongoose.Types.ObjectId(EVENT_ID)
    const userId = new mongoose.Types.ObjectId(USER_ID)

    const event = await db.collection('sport_events').findOne({ _id: eventId })
    if (!event) throw new Error('Event not found')
    console.log(`📅 Event: ${event.name}`)

    // Get kcal per km from sport_categories
    const cat = await db.collection('sport_categories').findOne({ name: event.category })
    const kcalPerKm = (cat && cat.kcal_per_unit > 0) ? cat.kcal_per_unit : DEFAULT_KCAL_PER_KM
    console.log(`⚡ kcal/km: ${kcalPerKm}`)

    // Clean old data for this user in this event
    const deletedAct = await ActivityTrackingModel.deleteMany({ eventId, userId })
    const deletedProg = await SportEventProgressModel.deleteMany({ eventId, userId })
    console.log(`🧹 Deleted: ${deletedAct.deletedCount} activities, ${deletedProg.deletedCount} progress records`)

    // Target: random 9-10 km
    const targetTotalKm = Number((rand(9, 10)).toFixed(2))
    console.log(`🎯 Target total: ${targetTotalKm} km`)

    // Date range: Mar 10 to Apr 11, 2026
    const startDate = new Date('2026-03-10T00:00:00+07:00')
    const endDate = new Date('2026-04-11T23:59:59+07:00')

    // Build list of activity times (2-3 per day)
    const activityTimes = []
    const currentDay = new Date(startDate)
    while (currentDay <= endDate) {
      const dailyRuns = rand(0, 1) > 0.4 ? 2 : 3 // 60% chance of 2 runs, 40% of 3 runs
      
      // Morning run: 5:30 - 7:30
      // Afternoon run: 17:00 - 19:00
      // Evening run: 19:00 - 21:00 (3rd run)
      const times = [
        { hour: randInt(5, 7), minute: randInt(0, 59) },
        { hour: randInt(17, 18), minute: randInt(0, 59) },
        { hour: randInt(19, 20), minute: randInt(0, 59) }
      ]
      
      for (let i = 0; i < dailyRuns; i++) {
        const runTime = new Date(currentDay)
        runTime.setHours(times[i].hour, times[i].minute, randInt(0, 59), 0)
        activityTimes.push(runTime)
      }

      currentDay.setDate(currentDay.getDate() + 1)
    }

    console.log(`📊 Total activities to generate: ${activityTimes.length} (${Math.round(activityTimes.length / 32)} avg/day)`)

    let accumulatedKm = 0
    let totalActivitiesCreated = 0

    for (let i = 0; i < activityTimes.length; i++) {
      const isLast = i === activityTimes.length - 1
      const startTimeDate = activityTimes[i]

      let distanceKm
      if (isLast) {
        distanceKm = Number((targetTotalKm - accumulatedKm).toFixed(2))
      } else {
        const avgPerActivity = targetTotalKm / activityTimes.length
        const minD = avgPerActivity * 0.6
        const maxD = avgPerActivity * 1.5
        distanceKm = Number(rand(minD, maxD).toFixed(2))

        if (accumulatedKm + distanceKm >= targetTotalKm - 0.01) {
          distanceKm = Number((targetTotalKm - accumulatedKm).toFixed(2))
        }
      }

      if (distanceKm <= 0.01) continue

      accumulatedKm += distanceKm

      const distanceM = Math.round(distanceKm * 1000)
      const avgSpeedMs = Number(rand(2.0, 3.2).toFixed(2)) // 7-16 km/h (jogging/running)
      const maxSpeedMs = Number((avgSpeedMs * rand(1.1, 1.3)).toFixed(2))
      const totalDuration = Math.max(60, Math.round(distanceM / avgSpeedMs))
      const avgPace = Number(((totalDuration / 60) / distanceKm).toFixed(2))
      const calories = Math.round(distanceKm * kcalPerKm)
      const endTimeDate = new Date(startTimeDate.getTime() + totalDuration * 1000)
      const gpsRoute = generateGpsRoute(distanceKm, startTimeDate, avgSpeedMs)
      const durationMin = Math.floor(totalDuration / 60)

      await ActivityTrackingModel.create({
        eventId,
        userId,
        activityType: event.category || 'Chạy bộ',
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
        eventId,
        userId,
        date: startTimeDate,
        value: distanceKm,
        unit: 'km',
        distance: distanceKm,
        calories,
        time: `${durationMin} phút`,
        source: 'gps',
        notes: `Chạy bộ ${distanceKm}km trong ${durationMin} phút`,
        is_deleted: false
      })

      totalActivitiesCreated++

      if (totalActivitiesCreated % 10 === 0) {
        console.log(`  ✅ Created ${totalActivitiesCreated} activities... (${accumulatedKm.toFixed(2)}/${targetTotalKm} km)`)
      }

      // Stop if we've reached target
      if (accumulatedKm >= targetTotalKm) {
        console.log(`  🏁 Reached target at activity ${i + 1}`)
        break
      }
    }

    // Verify
    const finalProgresses = await SportEventProgressModel.find({ eventId, userId, is_deleted: { $ne: true } })
    const finalTotal = finalProgresses.reduce((s, p) => s + p.value, 0)
    console.log(`\n🎉 Done!`)
    console.log(`   Total activities: ${totalActivitiesCreated}`)
    console.log(`   Total distance: ${finalTotal.toFixed(2)} km`)
    console.log(`   Target was: ${targetTotalKm} km`)

  } catch (err) {
    console.error('❌ Error:', err.message)
  } finally {
    setTimeout(() => {
      mongoose.disconnect()
      console.log('🔌 Disconnected')
      process.exit(0)
    }, 1000)
  }
}

seed()
