/**
 * Script: Thêm tất cả 3 user vào sự kiện ngoài trời + tạo hoạt động GPS
 * Chạy: npx ts-node -r tsconfig-paths/register scripts/seedOutdoorEventActivities.ts
 */
import mongoose, { Types } from 'mongoose'
import dotenv from 'dotenv'
import SportEventModel from '../src/models/schemas/sportEvent.schema'
import SportEventProgressModel from '../src/models/schemas/sportEventProgress.schema'
import ActivityTrackingModel from '../src/models/schemas/activityTracking.schema'
import SportCategoryModel from '../src/models/schemas/sportCategory.schema'
import UserModel from '../src/models/schemas/user.schema'
import moment from 'moment'

dotenv.config()

const MONGODB_URL = process.env.MONGODB_URL || ''
// Lấy toàn bộ user trong hệ thống (không bị xóa)

// ─── Speed profiles per sport category (m/s) ───
const SPEED_PROFILES: Record<string, { minMs: number; maxMs: number; distMin: number; distMax: number }> = {
  'Chạy bộ': { minMs: 2.22, maxMs: 3.33, distMin: 2, distMax: 5 },
  'Đạp xe': { minMs: 4.17, maxMs: 6.94, distMin: 5, distMax: 15 },
  'Đi bộ': { minMs: 1.11, maxMs: 1.67, distMin: 1, distMax: 3 },
  'Đi bộ đường dài': { minMs: 1.0, maxMs: 1.5, distMin: 3, distMax: 8 },
  'Chạy địa hình': { minMs: 1.67, maxMs: 2.78, distMin: 3, distMax: 7 },
  'Trượt patin': { minMs: 2.78, maxMs: 5.0, distMin: 2, distMax: 6 },
  'Chạy bộ đường dài': { minMs: 2.0, maxMs: 2.78, distMin: 5, distMax: 15 },
  'Bơi lội': { minMs: 0.56, maxMs: 1.11, distMin: 0.5, distMax: 2 },
  default: { minMs: 2.22, maxMs: 3.33, distMin: 2, distMax: 5 }
}

const DEFAULT_KCAL_PER_KM = 60

// ─── GPS base coordinates mapped to event locations ───
const LOCATION_COORDS: Record<string, { lat: number; lng: number }> = {
  'Công viên Thống Nhất, Hà Nội': { lat: 21.0117, lng: 105.8443 },
  'Hồ Tây, Hà Nội': { lat: 21.0535, lng: 105.8199 },
  'Khu đô thị Sala, TP.HCM': { lat: 10.7721, lng: 106.7228 },
  'Công viên Gia Định, TP.HCM': { lat: 10.8121, lng: 106.6800 },
  'Phố đi bộ Nguyễn Huệ, TP.HCM': { lat: 10.7738, lng: 106.7028 },
  'Hồ Gươm, Hà Nội': { lat: 21.0285, lng: 105.8525 },
  'Khu du lịch sinh thái': { lat: 10.801, lng: 106.665 }
}
const DEFAULT_COORDS = { lat: 10.783, lng: 106.695 }

const R_EARTH = 6371000

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function hashMod(str: string, mod: number) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  return h % mod
}

function destinationPoint(latDeg: number, lngDeg: number, bearingDeg: number, distM: number) {
  const phi1 = (latDeg * Math.PI) / 180
  const lambda1 = (lngDeg * Math.PI) / 180
  const theta = (bearingDeg * Math.PI) / 180
  const delta = distM / R_EARTH
  const sinPhi2 = Math.sin(phi1) * Math.cos(delta) + Math.cos(phi1) * Math.sin(delta) * Math.cos(theta)
  const phi2 = Math.asin(sinPhi2)
  const y = Math.sin(theta) * Math.sin(delta) * Math.cos(phi1)
  const x = Math.cos(delta) - Math.sin(phi1) * sinPhi2
  const lambda2 = lambda1 + Math.atan2(y, x)
  return {
    lat: (phi2 * 180) / Math.PI,
    lng: (((lambda2 * 180) / Math.PI + 540) % 360) - 180
  }
}

function perpendicularOffset(latDeg: number, lngDeg: number, bearingDeg: number, offsetM: number) {
  return destinationPoint(latDeg, lngDeg, bearingDeg + 90, offsetM)
}

function generateGpsRoute(
  distanceKm: number,
  startTime: Date,
  avgSpeedMs: number,
  baseLat: number,
  baseLng: number,
  bearingDeg: number
) {
  const distanceM = distanceKm * 1000
  const totalDurationS = distanceM / avgSpeedMs
  const halfM = distanceM / 2
  const numPoints = Math.max(12, Math.floor(totalDurationS / 5))
  const halfN = Math.max(6, Math.floor(numPoints / 2))

  const forward: { lat: number; lng: number }[] = []
  for (let i = 0; i < halfN; i++) {
    const frac = halfN <= 1 ? 0 : i / (halfN - 1)
    const d = frac * halfM
    let p = destinationPoint(baseLat, baseLng, bearingDeg, d)
    const jm = rand(-4, 4)
    if (Math.abs(jm) > 0.5) p = perpendicularOffset(p.lat, p.lng, bearingDeg, jm)
    forward.push(p)
  }

  const backward: { lat: number; lng: number }[] = []
  for (let i = forward.length - 2; i >= 0; i--) {
    const p = { ...forward[i] }
    const jm = rand(-4, 4)
    const adjusted = Math.abs(jm) > 0.5 ? perpendicularOffset(p.lat, p.lng, bearingDeg, jm) : p
    backward.push(adjusted)
  }

  const path = [...forward, ...backward]
  const startTs = startTime.getTime()
  const points: any[] = []

  for (let i = 0; i < path.length; i++) {
    const t = (i / (path.length - 1 || 1)) * totalDurationS
    points.push({
      lat: Number(path[i].lat.toFixed(6)),
      lng: Number(path[i].lng.toFixed(6)),
      timestamp: Math.round(startTs + t * 1000),
      speed: Number((avgSpeedMs * rand(0.88, 1.12)).toFixed(2)),
      altitude: Number(rand(3, 15).toFixed(1))
    })
  }
  return points
}

function startOfWeekMonday(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const dow = x.getDay()
  const diff = dow === 0 ? -6 : 1 - dow
  x.setDate(x.getDate() + diff)
  x.setHours(0, 0, 0, 0)
  return x
}

function pickWeeklyRunDays(loopStart: Date, loopEnd: Date): Date[] {
  const picked = new Map<string, Date>()
  let weekStart = startOfWeekMonday(loopStart)

  while (weekStart <= loopEnd) {
    const weekEndDate = new Date(weekStart)
    weekEndDate.setDate(weekEndDate.getDate() + 6)
    weekEndDate.setHours(23, 59, 59, 999)

    const daysInWeek: Date[] = []
    for (let t = new Date(weekStart); t <= weekEndDate && t <= loopEnd; t.setDate(t.getDate() + 1)) {
      const day = new Date(t.getFullYear(), t.getMonth(), t.getDate(), 12, 0, 0, 0)
      if (day < loopStart || day > loopEnd) continue
      daysInWeek.push(new Date(day))
    }

    if (daysInWeek.length > 0) {
      const k = Math.min(Math.floor(rand(2, 5)), daysInWeek.length)
      const shuffled = [...daysInWeek].sort(() => Math.random() - 0.5)
      for (let i = 0; i < k; i++) {
        const d = shuffled[i]
        const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
        picked.set(key, d)
      }
    }

    weekStart = new Date(weekStart)
    weekStart.setDate(weekStart.getDate() + 7)
  }

  return Array.from(picked.values()).sort((a, b) => a.getTime() - b.getTime())
}

function getBaseCoords(location: string): { lat: number; lng: number } {
  for (const [key, coords] of Object.entries(LOCATION_COORDS)) {
    if (location.includes(key) || key.includes(location)) return coords
  }
  // Partial match
  const locLower = location.toLowerCase()
  if (locLower.includes('hà nội')) return LOCATION_COORDS['Hồ Gươm, Hà Nội']
  if (locLower.includes('tp.hcm') || locLower.includes('hồ chí minh'))
    return LOCATION_COORDS['Phố đi bộ Nguyễn Huệ, TP.HCM']
  return DEFAULT_COORDS
}

async function getKcalPerKm(category: string): Promise<number> {
  const cat = await SportCategoryModel.findOne({ name: category, isDeleted: { $ne: true } })
  if (cat && cat.kcal_per_unit > 0) return cat.kcal_per_unit
  return DEFAULT_KCAL_PER_KM
}

const seed = async () => {
  try {
    console.log('🔗 Đang kết nối MongoDB...')
    await mongoose.connect(MONGODB_URL)
    console.log('✅ Kết nối thành công!')

    // Find all active users in the system
    const users = await UserModel.find({ isDeleted: { $ne: true } })
    if (users.length === 0) {
      console.log('❌ Không tìm thấy user nào!')
      process.exit(1)
    }
    console.log(`👥 Tìm thấy ${users.length} users trong hệ thống:`)
    users.forEach((u) => console.log(`   - ${u.name} (${u.email}) [${u._id}]`))

    const userIds = users.map((u) => u._id)

    // Find all outdoor events (ended + ongoing, skip upcoming)
    const now = moment()
    const outdoorEvents = await SportEventModel.find({
      eventType: 'Ngoài trời',
      isDeleted: { $ne: true },
      startDate: { $lte: now.toDate() } // only events that have started
    }).sort({ startDate: 1 })

    if (outdoorEvents.length === 0) {
      console.log('❌ Không tìm thấy sự kiện ngoài trời nào đã bắt đầu!')
      process.exit(0)
    }

    console.log(`\n📋 Tìm thấy ${outdoorEvents.length} sự kiện ngoài trời đã/đang diễn ra:`)
    outdoorEvents.forEach((e, i) =>
      console.log(
        `  ${i + 1}. ${e.name} (${e.category}) | ${moment(e.startDate).format('DD/MM')} → ${moment(e.endDate).format('DD/MM')} | ${e.location}`
      )
    )

    let totalActivities = 0

    for (const event of outdoorEvents) {
      console.log(`\n${'═'.repeat(60)}`)
      console.log(`🏟️  Đang xử lý: "${event.name}" (${event.category})`)
      console.log(`${'═'.repeat(60)}`)

      const category = event.category || 'Chạy bộ'
      const profile = SPEED_PROFILES[category] || SPEED_PROFILES['default']
      const kcalPerKm = await getKcalPerKm(category)

      console.log(`   Tốc độ: ${(profile.minMs * 3.6).toFixed(1)}-${(profile.maxMs * 3.6).toFixed(1)} km/h`)
      console.log(`   Quãng đường: ${profile.distMin}-${profile.distMax} km/lần`)
      console.log(`   Calories: ${kcalPerKm} kcal/km`)

      // Step 1: Add all users as participants
      const existingParticipantIds = (event.participants_ids || []).map((id) => String(id))
      const newParticipantIds = userIds.filter((uid) => !existingParticipantIds.includes(String(uid)))

      if (newParticipantIds.length > 0) {
        await SportEventModel.updateOne(
          { _id: event._id },
          {
            $addToSet: { participants_ids: { $each: newParticipantIds } },
            $inc: { participants: newParticipantIds.length }
          }
        )
        console.log(`   ✅ Thêm ${newParticipantIds.length} người tham gia mới`)
      }

      // Step 2: Calculate date range
      const eventStart = moment(event.startDate)
      const eventEnd = moment.min(moment(event.endDate), now)
      const loopStart = eventStart.clone().startOf('day').toDate()
      const loopEnd = eventEnd.clone().endOf('day').toDate()

      if (loopStart > loopEnd) {
        console.log(`   ⚠️ Chưa tới ngày bắt đầu, bỏ qua`)
        continue
      }

      const runDays = pickWeeklyRunDays(loopStart, loopEnd)
      console.log(
        `   Khoảng thời gian: ${moment(loopStart).format('DD/MM')} → ${moment(loopEnd).format('DD/MM')} | ${runDays.length} ngày tập`
      )

      // Step 3: Clean old activity data for this event
      await ActivityTrackingModel.deleteMany({ eventId: event._id })
      await SportEventProgressModel.deleteMany({ eventId: event._id })
      console.log(`   🧹 Đã xóa dữ liệu hoạt động cũ`)

      // Step 4: Get base GPS coords from event location
      const baseCoords = getBaseCoords(event.location || '')
      console.log(`   📍 Tọa độ GPS: ${baseCoords.lat}, ${baseCoords.lng}`)

      // Step 5: Create activities for each user
      let eventCount = 0
      const activityBatch: any[] = []
      const progressBatch: any[] = []

      for (const userId of userIds) {
        // Each user gets a slightly different start point and bearing
        const userHash = hashMod(String(userId), 360)
        const baseLat = baseCoords.lat + (hashMod(String(userId) + 'lat', 200) / 100000 - 0.001) * 0.5
        const baseLng = baseCoords.lng + (hashMod(String(userId) + 'lng', 200) / 100000 - 0.001) * 0.5
        const baseBearing = (hashMod(String(event._id) + String(userId), 360) + userHash * 0.01) % 360

        // Generate run times (1-2 sessions per run day)
        const actTimes: moment.Moment[] = []
        for (const day of runDays) {
          const sessions = Math.random() > 0.4 ? 1 : 2
          const slots = [
            { h: Math.floor(rand(5, 8)), m: Math.floor(rand(0, 60)) },
            { h: Math.floor(rand(17, 20)), m: Math.floor(rand(0, 60)) }
          ]
          for (let s = 0; s < sessions; s++) {
            const t = moment(day).hours(slots[s].h).minutes(slots[s].m).seconds(Math.floor(rand(0, 60)))
            if (t.toDate() >= loopStart && t.toDate() <= loopEnd) actTimes.push(t)
          }
        }
        actTimes.sort((a, b) => a.valueOf() - b.valueOf())

        for (const runTime of actTimes) {
          const distanceKm = Number(rand(profile.distMin, profile.distMax).toFixed(2))
          const distanceM = distanceKm * 1000
          const avgSpeedMs = Number(rand(profile.minMs, profile.maxMs).toFixed(2))
          const maxSpeedMs = Number((avgSpeedMs * rand(1.15, 1.35)).toFixed(2))
          const totalDuration = Math.round(distanceM / avgSpeedMs)
          const avgPace = Number(((totalDuration / 60) / distanceKm).toFixed(2))
          const calories = Math.round(distanceKm * kcalPerKm)

          const startTimeDate = runTime.toDate()
          const endTimeDate = moment(startTimeDate).add(totalDuration, 'seconds').toDate()
          const bearingThisRun = (baseBearing + rand(-15, 15) + 360) % 360
          const gpsRoute = generateGpsRoute(distanceKm, startTimeDate, avgSpeedMs, baseLat, baseLng, bearingThisRun)

          const durationMin = Math.floor(totalDuration / 60)

          let progressValue = distanceKm;
          let progressUnit = 'km';
          const targetUnit = (event.targetUnit || '').toLowerCase();
          
          if (targetUnit.includes('kcal') || targetUnit.includes('calo')) {
            progressValue = calories;
            progressUnit = event.targetUnit;
          } else if (targetUnit.includes('giờ') || targetUnit.includes('hour')) {
            progressValue = totalDuration / 3600;
            progressUnit = event.targetUnit;
          } else if (targetUnit.includes('phút') || targetUnit.includes('minute')) {
            progressValue = totalDuration / 60;
            progressUnit = event.targetUnit;
          } else {
            progressValue = distanceKm;
            progressUnit = event.targetUnit || 'km';
          }

          activityBatch.push({
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

          progressBatch.push({
            eventId: event._id,
            userId,
            date: startTimeDate,
            value: progressValue,
            unit: progressUnit,
            distance: distanceKm,
            calories,
            time: `${durationMin} phút`,
            source: 'gps',
            notes: `Hoạt động ${category} - ${distanceKm}km trong ${durationMin} phút`
          })

          eventCount++
        }
      }

      // Batch insert for performance
      if (activityBatch.length > 0) {
        await ActivityTrackingModel.insertMany(activityBatch)
        await SportEventProgressModel.insertMany(progressBatch)
      }

      totalActivities += eventCount
      console.log(`   ✅ Đã tạo ${eventCount} hoạt động cho ${userIds.length} người`)
    }

    console.log(`\n🎉 Hoàn tất! Tổng cộng: ${totalActivities} hoạt động`)
  } catch (error) {
    console.error('❌ Lỗi:', error)
  } finally {
    setTimeout(() => {
      mongoose.disconnect()
      console.log('🔌 Đã ngắt kết nối MongoDB')
      process.exit(0)
    }, 1000)
  }
}

seed()
