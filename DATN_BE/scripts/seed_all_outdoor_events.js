/**
 * Seed script: Add GPS activities for ALL participants in ALL outdoor events
 *
 * Tính năng:
 * - Tự động lấy kcal/đơn vị từ Danh mục Thể thao admin
 * - Vận tốc phù hợp từng loại thể thao
 * - Khoảng cách per-person = targetValue / maxParticipants (±10-15%)
 * - Ngày hoạt động từ event.startDate → min(endDate, today)
 * - Bỏ qua sự kiện chưa bắt đầu
 * - Bỏ qua người đã có dữ liệu
 * - GPS routes theo khu vực phù hợp
 */

const mongoose = require('mongoose')

const MONGODB_URL = 'mongodb+srv://daiquy:10102003@cluster0.cxzaocf.mongodb.net/?appName=Cluster0'
const TODAY = new Date('2026-04-11T23:59:59+07:00')
const DEFAULT_KCAL = 60

// Vận tốc theo loại thể thao (m/s): [min, max]
const SPEED_RANGE = {
  'Chạy bộ':            [2.0, 3.5],   // 7–12 km/h
  'Chạy bộ đường dài':  [2.5, 4.0],   // 9–14 km/h
  'Đi bộ':              [1.0, 1.8],   // 3.5–6.5 km/h
  'Đạp xe':             [4.5, 8.0],   // 16–29 km/h
  'Trượt patin':        [3.0, 6.0],   // 11–22 km/h
  'Lái xe':             [6.0, 13.0],  // 22–47 km/h
  'Xe máy':             [5.0, 12.0],  // 18–43 km/h
  'Bơi lội':            [0.8, 1.5],   // 3–5 km/h (ngoài trời)
  'default':            [2.0, 4.0],
}

// GPS base coords theo khu vực HCM
const HCM_AREAS = [
  { lat: 10.8010, lng: 106.6650, name: 'Tân Bình' },
  { lat: 10.7960, lng: 106.6580, name: 'Trường Chinh' },
  { lat: 10.7738, lng: 106.7028, name: 'Nguyễn Huệ' },
  { lat: 10.7830, lng: 106.6950, name: 'Quận 10' },
  { lat: 10.7990, lng: 106.7150, name: 'Gò Vấp' },
  { lat: 10.8180, lng: 106.7040, name: 'Bình Thạnh' },
  { lat: 10.7540, lng: 106.6720, name: 'Phú Nhuận' },
  { lat: 10.7680, lng: 106.6890, name: 'Quận 3' },
]

function rand(min, max) { return Math.random() * (max - min) + min }
function randInt(min, max) { return Math.floor(rand(min, max + 1)) }

function getSpeedRange(category) {
  return SPEED_RANGE[category] || SPEED_RANGE['default']
}

function generateGpsRoute(distanceKm, startTime, avgSpeedMs) {
  const area = HCM_AREAS[Math.floor(Math.random() * HCM_AREAS.length)]
  const distanceM = distanceKm * 1000
  const totalDurationS = distanceM / avgSpeedMs
  const numPoints = Math.max(8, Math.floor(totalDurationS / 5))
  const segmentDistM = distanceM / numPoints

  const points = []
  let lat = area.lat + rand(-0.004, 0.004)
  let lng = area.lng + rand(-0.004, 0.004)
  let bearing = rand(0, 360)
  const startTs = startTime.getTime()

  for (let i = 0; i < numPoints; i++) {
    bearing += rand(-25, 25)
    const rad = (bearing * Math.PI) / 180
    lat += (segmentDistM * Math.cos(rad)) / 111320
    lng += (segmentDistM * Math.sin(rad)) / (111320 * Math.cos((lat * Math.PI) / 180))

    points.push({
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      timestamp: Math.round(startTs + (i * totalDurationS * 1000) / numPoints),
      speed: Number((avgSpeedMs * rand(0.75, 1.25)).toFixed(2)),
      altitude: Number(rand(2, 20).toFixed(1))
    })
  }
  return points
}

const ActivityTrackingSchema = new mongoose.Schema({
  eventId: mongoose.Schema.Types.ObjectId,
  userId: mongoose.Schema.Types.ObjectId,
  activityType: String,
  status: String,
  startTime: Date, endTime: Date,
  totalDuration: Number, totalDistance: Number,
  avgSpeed: Number, maxSpeed: Number, avgPace: Number,
  calories: Number, gpsRoute: Array, pauseIntervals: Array
}, { timestamps: true, collection: 'activity_tracking' })

const SportEventProgressSchema = new mongoose.Schema({
  eventId: mongoose.Schema.Types.ObjectId,
  userId: mongoose.Schema.Types.ObjectId,
  date: Date, value: Number, unit: String,
  distance: Number, calories: Number,
  time: String, source: String, notes: String, is_deleted: Boolean
}, { timestamps: true, collection: 'sport_event_progress' })

const ActivityModel = mongoose.model('activity_tracking', ActivityTrackingSchema)
const ProgressModel = mongoose.model('sport_event_progress', SportEventProgressSchema)

// ── Seed hoạt động cho 1 user trong 1 event ──
async function seedUser(eventId, userId, userName, event, kcalPerKm, targetKm) {
  const [speedMin, speedMax] = getSpeedRange(event.category)

  // Xác định ngày bắt đầu và kết thúc thực tế
  const evStart = new Date(event.startDate)
  const evEnd   = new Date(event.endDate)
  const seedEnd = evEnd < TODAY ? evEnd : TODAY  // không seed future

  // Chuyển về đầu/cuối ngày (giờ VN)
  const loopStart = new Date(evStart)
  loopStart.setHours(0, 0, 0, 0)
  const loopEnd = new Date(seedEnd)
  loopEnd.setHours(23, 59, 59, 999)

  const totalDays = Math.max(1, Math.round((loopEnd - loopStart) / 86400000) + 1)

  // Build danh sách thời gian chạy (2-3/ngày)
  const actTimes = []
  const cur = new Date(loopStart)
  while (cur <= loopEnd) {
    const dailyRuns = rand(0, 1) > 0.4 ? 2 : 3
    const slots = [
      { h: randInt(5, 7),  m: randInt(0, 59) },
      { h: randInt(17, 18), m: randInt(0, 59) },
      { h: randInt(19, 20), m: randInt(0, 59) }
    ]
    for (let i = 0; i < dailyRuns; i++) {
      const t = new Date(cur)
      t.setHours(slots[i].h, slots[i].m, randInt(0, 59), 0)
      if (t <= loopEnd) actTimes.push(t)
    }
    cur.setDate(cur.getDate() + 1)
  }

  if (actTimes.length === 0) return 0

  // Random target trong khoảng ±10%
  const finalTarget = Number((targetKm * rand(0.90, 1.10)).toFixed(2))

  let accumulated = 0
  let created = 0

  for (let i = 0; i < actTimes.length; i++) {
    const isLast = (i === actTimes.length - 1)
    let distKm

    if (isLast) {
      distKm = Number((finalTarget - accumulated).toFixed(2))
    } else {
      const avg = finalTarget / actTimes.length
      distKm = Number(rand(avg * 0.55, avg * 1.55).toFixed(2))
      if (accumulated + distKm >= finalTarget - 0.005) {
        distKm = Number((finalTarget - accumulated).toFixed(2))
      }
    }
    if (distKm < 0.01) continue

    accumulated += distKm
    const distM   = Math.round(distKm * 1000)
    const avgSpd  = Number(rand(speedMin, speedMax).toFixed(2))
    const maxSpd  = Number((avgSpd * rand(1.1, 1.3)).toFixed(2))
    const dur     = Math.max(30, Math.round(distM / avgSpd))
    const pace    = Number(((dur / 60) / distKm).toFixed(2))
    const kcal    = Math.round(distKm * kcalPerKm)
    const endT    = new Date(actTimes[i].getTime() + dur * 1000)
    const gps     = generateGpsRoute(distKm, actTimes[i], avgSpd)
    const durMin  = Math.floor(dur / 60)

    await ActivityModel.create({
      eventId, userId,
      activityType: event.category,
      status: 'completed',
      startTime: actTimes[i], endTime: endT,
      totalDuration: dur, totalDistance: distM,
      avgSpeed: avgSpd, maxSpeed: maxSpd, avgPace: pace,
      calories: kcal, gpsRoute: gps, pauseIntervals: []
    })

    await ProgressModel.create({
      eventId, userId,
      date: actTimes[i],
      value: distKm, unit: 'km',
      distance: distKm, calories: kcal,
      time: `${durMin} phút`, source: 'gps',
      notes: `${event.category} ${distKm}km trong ${durMin} phút`,
      is_deleted: false
    })

    created++
    if (accumulated >= finalTarget) break
  }

  return { created, km: accumulated.toFixed(2), target: finalTarget }
}

// ── Main ──
async function main() {
  console.log('🔗 Connecting to MongoDB...')
  await mongoose.connect(MONGODB_URL)
  console.log('✅ Connected\n')

  const db = mongoose.connection.db

  // Lấy tất cả sự kiện Ngoài trời
  const events = await db.collection('sport_events').find({
    eventType: 'Ngoài trời',
    isDeleted: { $ne: true }
  }).toArray()

  // Lấy map danh mục thể thao
  const cats = await db.collection('sport_categories').find({ isDeleted: { $ne: true } }).toArray()
  const catMap = {}
  cats.forEach(c => { catMap[c.name] = c })

  let totalEventsDone = 0
  let totalUsersSeeded = 0
  let totalUsersSkipped = 0

  for (const ev of events) {
    const evId = ev._id
    const evStart = new Date(ev.startDate)
    const evEnd   = new Date(ev.endDate)

    // Bỏ qua sự kiện chưa bắt đầu
    if (evStart > TODAY) {
      console.log(`⏭️  [FUTURE] ${ev.name} (bắt đầu ${evStart.toLocaleDateString('vi-VN')})`)
      continue
    }

    const cat       = catMap[ev.category] || {}
    const kcalPerKm = (cat.kcal_per_unit > 0) ? cat.kcal_per_unit : DEFAULT_KCAL
    const maxPart   = Math.max(ev.maxParticipants || 1, 1)

    // Per-person target = targetValue / maxParticipants, tối thiểu 0.5 km
    const rawPerPerson = (ev.targetValue || 0) / maxPart
    const perPersonKm  = Math.max(rawPerPerson, 0.5)

    const seedEndDate = evEnd < TODAY ? evEnd : TODAY
    const totalDays   = Math.max(1, Math.round((seedEndDate - evStart) / 86400000) + 1)

    console.log(`\n🏟️  ${ev.name}`)
    console.log(`   [${evId}]`)
    console.log(`   Category: ${ev.category} | ${kcalPerKm} kcal/km`)
    console.log(`   Dates: ${evStart.toLocaleDateString('vi-VN')} → ${evEnd.toLocaleDateString('vi-VN')} (seed đến ${seedEndDate.toLocaleDateString('vi-VN')}, ${totalDays} ngày)`)
    console.log(`   Target: ${ev.targetValue} km / ${maxPart} người = ${perPersonKm.toFixed(2)} km/người`)

    const participants = ev.participants_ids || []
    let seeded = 0, skipped = 0

    for (const uid of participants) {
      const userId = new mongoose.Types.ObjectId(uid.toString())
      const user   = await db.collection('users').findOne({ _id: userId })
      const name   = user ? (user.name || user.username || String(uid)) : String(uid)

      // Kiểm tra đã có data chưa
      const agg = await ProgressModel.aggregate([
        { $match: { eventId: evId, userId, is_deleted: { $ne: true } } },
        { $group: { _id: null, total: { $sum: '$value' } } }
      ])
      if ((agg[0]?.total || 0) > 0) {
        console.log(`   ⏭️  ${name}: bỏ qua (${agg[0].total.toFixed(2)} km)`)
        skipped++
        continue
      }

      const result = await seedUser(evId, userId, name, ev, kcalPerKm, perPersonKm)
      if (result && result.created > 0) {
        console.log(`   ✅ ${name}: ${result.created} acts, ${result.km}/${result.target} km`)
        seeded++
      } else {
        console.log(`   ⚠️  ${name}: không có act nào được tạo`)
      }
    }

    console.log(`   📊 Kết quả: seed ${seeded} | bỏ qua ${skipped}`)
    totalEventsDone++
    totalUsersSeeded += seeded
    totalUsersSkipped += skipped
  }

  console.log(`\n${'='.repeat(60)}`)
  console.log(`🎉 HOÀN THÀNH!`)
  console.log(`   Sự kiện đã xử lý : ${totalEventsDone}`)
  console.log(`   Người được seed   : ${totalUsersSeeded}`)
  console.log(`   Người bỏ qua      : ${totalUsersSkipped}`)
  console.log(`${'='.repeat(60)}`)

  setTimeout(() => { mongoose.disconnect(); process.exit(0) }, 1000)
}

main().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
