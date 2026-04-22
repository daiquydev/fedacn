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

const HCM_AREAS = [
  { lat: 10.801, lng: 106.665 },
  { lat: 10.796, lng: 106.658 },
  { lat: 10.7738, lng: 106.7028 },
  { lat: 10.783, lng: 106.695 },
  { lat: 10.799, lng: 106.715 },
  { lat: 10.818, lng: 106.704 },
  { lat: 10.754, lng: 106.672 },
  { lat: 10.768, lng: 106.689 }
]

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
  const φ1 = (latDeg * Math.PI) / 180
  const λ1 = (lngDeg * Math.PI) / 180
  const θ = (bearingDeg * Math.PI) / 180
  const δ = distM / R_EARTH
  const sinφ1 = Math.sin(φ1)
  const cosφ1 = Math.cos(φ1)
  const sinδ = Math.sin(δ)
  const cosδ = Math.cos(δ)
  const sinφ2 = sinφ1 * cosδ + cosφ1 * sinδ * Math.cos(θ)
  const φ2 = Math.asin(sinφ2)
  const y = Math.sin(θ) * sinδ * cosφ1
  const x = cosδ - sinφ1 * sinφ2
  const λ2 = λ1 + Math.atan2(y, x)
  return {
    lat: (φ2 * 180) / Math.PI,
    lng: (((λ2 * 180) / Math.PI + 540) % 360) - 180
  }
}

function perpendicularOffset(latDeg: number, lngDeg: number, bearingDeg: number, offsetM: number) {
  return destinationPoint(latDeg, lngDeg, bearingDeg + 90, offsetM)
}

/** Đường đi–về thẳng một trục từ điểm xuất phát (gần địa điểm, không random zigzag) */
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
    let p = { ...forward[i] }
    const jm = rand(-4, 4)
    if (Math.abs(jm) > 0.5) p = perpendicularOffset(p.lat, p.lng, bearingDeg, jm)
    backward.push(p)
  }

  const path = [...forward, ...backward]
  const startTs = startTime.getTime()
  const points: any[] = []
  const n = path.length

  for (let i = 0; i < n; i++) {
    const t = (i / (n - 1 || 1)) * totalDurationS
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

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
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
        picked.set(dayKey(d), d)
      }
    }

    weekStart = new Date(weekStart)
    weekStart.setDate(weekStart.getDate() + 7)
  }

  return Array.from(picked.values()).sort((a, b) => a.getTime() - b.getTime())
}

function startPointForEventUser(event: { _id: Types.ObjectId }, userId: Types.ObjectId) {
  const idx = hashMod(String(event._id), HCM_AREAS.length)
  const area = HCM_AREAS[idx]
  const u = hashMod(String(userId), 360)
  const v = hashMod(String(userId) + 'x', 200) / 100000
  const w = hashMod(String(userId) + 'y', 200) / 100000
  return {
    lat: area.lat + (v - 0.001) * 0.5,
    lng: area.lng + (w - 0.001) * 0.5,
    bearing: (hashMod(String(event._id) + String(userId), 360) + u * 0.01) % 360
  }
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

      const eventStart = moment(event.startDate)
      const eventEnd = moment.min(moment(event.endDate), moment())
      const loopStart = eventStart.clone().startOf('day').toDate()
      const loopEnd = eventEnd.clone().endOf('day').toDate()

      if (loopStart > loopEnd) {
        console.log(`   ⚠️ No valid date range, skipping`)
        continue
      }

      const runDays = pickWeeklyRunDays(loopStart, loopEnd)
      console.log(
        `   Date range: ${moment(loopStart).format('DD/MM')} → ${moment(loopEnd).format('DD/MM')} | ~${runDays.length} ngày chạy (random 2–4 ngày/tuần)`
      )

      // Get all participants for this event
      const participants = event.participants_ids || []
      console.log(`   Participants: ${participants.length}`)

      // Clean old data for this event
      await ActivityTrackingModel.deleteMany({ eventId: event._id })
      await SportEventProgressModel.deleteMany({ eventId: event._id })
      console.log(`   🧹 Cleaned old data`)

      let count = 0
      for (const userId of participants) {
        const { lat: baseLat, lng: baseLng, bearing: baseBearing } = startPointForEventUser(event, userId as Types.ObjectId)

        const actTimes: moment.Moment[] = []
        for (const day of runDays) {
          const sessions = Math.random() > 0.35 ? 2 : 1
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
          const bearingThisRun = (baseBearing + rand(-8, 8) + 360) % 360
          const gpsRoute = generateGpsRoute(distanceKm, startTimeDate, avgSpeedMs, baseLat, baseLng, bearingThisRun)

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
