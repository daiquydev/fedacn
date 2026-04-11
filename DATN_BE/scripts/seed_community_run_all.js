/**
 * Seed script: Add 9-10km running activities for ALL participants (with 0 km)
 * in "Giải Chạy Bộ Vì Cộng Đồng" event (69aed3edc0bc684ba23f7cad)
 *
 * - Skip users who already have progress data
 * - Date range: 10/03/2026 -> 11/04/2026 (33 days)
 * - 2-3 activities/day, total random 9-10 km per user
 * - GPS route data included (near Tân Sơn Nhất, Tân Bình, HCM)
 * - Calories = distance × kcal_per_km from admin sport_categories (65 kcal/km for Chạy bộ)
 */

const mongoose = require('mongoose')

const MONGODB_URL = 'mongodb+srv://daiquy:10102003@cluster0.cxzaocf.mongodb.net/?appName=Cluster0'
const EVENT_ID = '69aed3edc0bc684ba23f7cad'
const DEFAULT_KCAL_PER_KM = 65

// HCM running routes near Tân Sơn Nhất, Tân Bình
const RUNNING_ROUTES = [
  { baseLat: 10.8010, baseLng: 106.6650, name: 'Tân Sơn Nhất' },
  { baseLat: 10.7960, baseLng: 106.6580, name: 'Trường Chinh' },
  { baseLat: 10.8050, baseLng: 106.6750, name: 'Cộng Hòa' },
  { baseLat: 10.7900, baseLng: 106.6720, name: 'Lý Thường Kiệt' },
  { baseLat: 10.8100, baseLng: 106.6600, name: 'Quang Trung' },
  { baseLat: 10.7850, baseLng: 106.6800, name: 'Phan Đình Phùng' },
  { baseLat: 10.8020, baseLng: 106.6900, name: 'Hoàng Văn Thụ' },
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

async function seedForUser(db, event, userId, userName, kcalPerKm) {
  const eventId = event._id

  // Check existing progress
  const existingCount = await SportEventProgressModel.countDocuments({
    eventId, userId, is_deleted: { $ne: true }
  })
  if (existingCount > 0) {
    const existingTotal = await SportEventProgressModel.aggregate([
      { $match: { eventId, userId, is_deleted: { $ne: true } } },
      { $group: { _id: null, total: { $sum: '$value' } } }
    ])
    const total = existingTotal[0]?.total?.toFixed(2) || 0
    console.log(`  ⏭️  ${userName}: skipped (already has ${existingCount} records = ${total} km)`)
    return
  }

  // Target: random 9-10 km
  const targetTotalKm = Number(rand(9.0, 10.0).toFixed(2))

  // Date range: Mar 10 to Apr 11, 2026
  const startDate = new Date('2026-03-10T00:00:00+07:00')
  const endDate = new Date('2026-04-11T23:59:59+07:00')

  // Build list of activity times (2-3 per day), with slight variation per user
  const activityTimes = []
  const currentDay = new Date(startDate)
  while (currentDay <= endDate) {
    // Mix of 2 or 3 runs depending on random chance
    const dailyRuns = rand(0, 1) > 0.4 ? 2 : 3

    // Time slots: morning (5-8h), afternoon/evening (17-21h)
    const slots = [
      { hour: randInt(5, 7), minute: randInt(0, 59) },
      { hour: randInt(17, 18), minute: randInt(0, 59) },
      { hour: randInt(19, 20), minute: randInt(0, 59) }
    ]

    for (let i = 0; i < dailyRuns; i++) {
      const runTime = new Date(currentDay)
      runTime.setHours(slots[i].hour, slots[i].minute, randInt(0, 59), 0)
      activityTimes.push(runTime)
    }

    currentDay.setDate(currentDay.getDate() + 1)
  }

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
      distanceKm = Number(rand(avgPerActivity * 0.6, avgPerActivity * 1.5).toFixed(2))
      if (accumulatedKm + distanceKm >= targetTotalKm - 0.01) {
        distanceKm = Number((targetTotalKm - accumulatedKm).toFixed(2))
      }
    }

    if (distanceKm <= 0.01) continue

    accumulatedKm += distanceKm

    const distanceM = Math.round(distanceKm * 1000)
    const avgSpeedMs = Number(rand(2.0, 3.2).toFixed(2))
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

    if (accumulatedKm >= targetTotalKm) break
  }

  console.log(`  ✅ ${userName}: ${totalActivitiesCreated} hoạt động, tổng ${accumulatedKm.toFixed(2)} km (mục tiêu: ${targetTotalKm} km), ${Math.round(accumulatedKm * kcalPerKm)} kcal`)
}

async function seedAll() {
  try {
    console.log('🔗 Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URL)
    console.log('✅ Connected\n')

    const db = mongoose.connection.db
    const eventId = new mongoose.Types.ObjectId(EVENT_ID)

    const event = await db.collection('sport_events').findOne({ _id: eventId })
    if (!event) throw new Error('Event not found')
    console.log(`📅 Event: ${event.name}`)
    console.log(`📆 ${new Date(event.startDate).toLocaleDateString('vi-VN')} → ${new Date(event.endDate).toLocaleDateString('vi-VN')}`)
    console.log(`🏷️  Category: ${event.category}`)

    // Get kcal/km from admin sport_categories
    const cat = await db.collection('sport_categories').findOne({ name: event.category, isDeleted: { $ne: true } })
    const kcalPerKm = (cat && cat.kcal_per_unit > 0) ? cat.kcal_per_unit : DEFAULT_KCAL_PER_KM
    console.log(`⚡ kcal/km: ${kcalPerKm} (từ danh mục "${event.category}")\n`)

    const participantIds = event.participants_ids || []
    console.log(`👥 Tổng số người tham gia: ${participantIds.length}\n`)

    let seededCount = 0
    let skippedCount = 0

    for (const uid of participantIds) {
      const userId = new mongoose.Types.ObjectId(uid.toString())
      const user = await db.collection('users').findOne({ _id: userId })
      const userName = user ? (user.name || user.username || String(uid)) : String(uid)

      // Check existing (skip if > 0 km)
      const existingAgg = await SportEventProgressModel.aggregate([
        { $match: { eventId, userId, is_deleted: { $ne: true } } },
        { $group: { _id: null, total: { $sum: '$value' } } }
      ])
      const existingKm = existingAgg[0]?.total || 0

      if (existingKm > 0) {
        console.log(`  ⏭️  ${userName}: bỏ qua (đã có ${existingKm.toFixed(2)} km)`)
        skippedCount++
        continue
      }

      await seedForUser(db, { ...event, _id: eventId }, userId, userName, kcalPerKm)
      seededCount++
    }

    console.log(`\n📊 Kết quả:`)
    console.log(`   ✅ Đã seed: ${seededCount} người`)
    console.log(`   ⏭️  Bỏ qua:  ${skippedCount} người (đã có dữ liệu)`)

    // Final summary
    console.log('\n📈 Tiến độ cuối cùng:')
    const finalAgg = await SportEventProgressModel.aggregate([
      { $match: { eventId, is_deleted: { $ne: true } } },
      { $group: { _id: '$userId', total: { $sum: '$value' } } },
      { $sort: { total: -1 } }
    ])
    for (const p of finalAgg) {
      const user = await db.collection('users').findOne({ _id: p._id })
      const name = user ? (user.name || user.username || String(p._id)) : String(p._id)
      console.log(`   ${name}: ${p.total.toFixed(2)} km`)
    }

  } catch (err) {
    console.error('❌ Error:', err.message)
  } finally {
    setTimeout(() => {
      mongoose.disconnect()
      console.log('\n🔌 Disconnected')
      process.exit(0)
    }, 1000)
  }
}

seedAll()
