import mongoose, { Types } from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import SportEventModel from '../src/models/schemas/sportEvent.schema'
import SportEventProgressModel from '../src/models/schemas/sportEventProgress.schema'
import ActivityTrackingModel from '../src/models/schemas/activityTracking.schema'
import SportCategoryModel from '../src/models/schemas/sportCategory.schema'
import UserModel from '../src/models/schemas/user.schema'
import moment from 'moment'

dotenv.config()

const MONGODB_URL = process.env.MONGODB_URL || ''

const CREATOR_EMAILS = ['user1@gmail.com', 'quy.tranquil@gmail.com', 'phamquocdung04@gmail.com']

const SPEED_PROFILES: Record<string, { minMs: number; maxMs: number; distMin: number; distMax: number }> = {
  'Chạy bộ': { minMs: 2.22, maxMs: 3.33, distMin: 2, distMax: 5 },
  'Đạp xe': { minMs: 4.17, maxMs: 6.94, distMin: 5, distMax: 15 },
  'Đi bộ': { minMs: 1.11, maxMs: 1.67, distMin: 1, distMax: 3 },
  'Chạy trail': { minMs: 1.67, maxMs: 2.78, distMin: 3, distMax: 7 },
  'Bơi lội': { minMs: 0.56, maxMs: 1.11, distMin: 0.5, distMax: 2 },
  default: { minMs: 2.22, maxMs: 3.33, distMin: 2, distMax: 5 }
}

const DEFAULT_KCAL_PER_KM = 60

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
      const k = Math.min(Math.floor(rand(2, 4)), daysInWeek.length)
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
  return DEFAULT_COORDS
}

async function getKcalPerKm(category: string): Promise<number> {
  const cat = await SportCategoryModel.findOne({ name: category, isDeleted: { $ne: true } })
  if (cat && cat.kcal_per_unit > 0) return cat.kcal_per_unit
  return DEFAULT_KCAL_PER_KM
}

const EVENTS_TO_CREATE = [
  { category: 'Chạy bộ', name: 'Chạy bộ cộng đồng vì sức khỏe', location: 'Công viên Thống Nhất, Hà Nội', kmPerPerson: 150, image: 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=1200&q=80' },
  { category: 'Đạp xe', name: 'Đạp xe xuyên thành phố', location: 'Khu đô thị Sala, TP.HCM', kmPerPerson: 500, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80' },
  { category: 'Đi bộ', name: 'Đi bộ khám phá Hồ Tây', location: 'Hồ Tây, Hà Nội', kmPerPerson: 80, image: 'https://images.unsplash.com/photo-1510020553968-60b3e6745184?w=1200&q=80' },
  { category: 'Bơi lội', name: 'Bơi lội mùa hè', location: 'Bể bơi Mỹ Đình, Hà Nội', kmPerPerson: 40, image: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=1200&q=80' },
  { category: 'Chạy trail', name: 'Chinh phục đỉnh núi Bạch Mã', location: 'Khu du lịch sinh thái', kmPerPerson: 200, image: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1200&q=80' }
]

const seed = async () => {
  try {
    console.log('🔗 Đang kết nối MongoDB...')
    await mongoose.connect(MONGODB_URL)
    console.log('✅ Kết nối thành công!')

    const creators = await UserModel.find({ email: { $in: CREATOR_EMAILS } })
    if (creators.length === 0) {
      console.log('❌ Không tìm thấy user tạo sự kiện')
      process.exit(1)
    }

    const allUsers = await UserModel.find({ isDeleted: { $ne: true } })
    if (allUsers.length === 0) {
      console.log('❌ Không tìm thấy user nào!')
      process.exit(1)
    }

    // Select random ~85% users
    const shuffledUsers = allUsers.sort(() => 0.5 - Math.random())
    const numParticipants = Math.floor(allUsers.length * 0.85)
    let participantIds = shuffledUsers.slice(0, numParticipants).map(u => u._id as Types.ObjectId)
    
    // Ensure the creators are in the participant list too
    const creatorIds = creators.map(c => c._id as Types.ObjectId)
    for (const cid of creatorIds) {
      if (!participantIds.some(pid => pid.toString() === cid.toString())) {
        participantIds.push(cid)
      }
    }

    console.log(`👥 Đã chọn ${participantIds.length} người tham gia (tổng: ${allUsers.length})`)

    const startDate = new Date('2026-04-15T00:00:00.000Z')
    const endDate = new Date('2026-06-30T23:59:59.000Z')
    const now = moment()

    for (const evtDef of EVENTS_TO_CREATE) {
      console.log(`\n${'═'.repeat(60)}`)
      console.log(`Tạo sự kiện: ${evtDef.name} (${evtDef.category})`)
      
      const creator = creators[Math.floor(Math.random() * creators.length)]
      
      // Target is kmPerPerson * 50
      const targetValue = evtDef.kmPerPerson * 50
      
      const sportEvent = await SportEventModel.create({
        name: evtDef.name,
        description: `Sự kiện ${evtDef.category} cộng đồng dành cho tất cả mọi người. Diễn ra từ 15/4 đến 30/6.`,
        detailedDescription: `Sự kiện này sẽ diễn ra từ ngày 15/4 đến 30/6. Các bạn sẽ được tham gia ${evtDef.category.toLowerCase()} tại ${evtDef.location}. Mỗi tuần sẽ có một lịch trình cụ thể. Các bạn cần phải có trang phục thể thao phù hợp để tham gia.`,
        category: evtDef.category,
        startDate,
        endDate,
        location: evtDef.location,
        maxParticipants: 50,
        participants: participantIds.length,
        participants_ids: participantIds,
        image: evtDef.image,
        eventType: 'Ngoài trời',
        createdBy: creator._id,
        targetValue,
        targetUnit: 'km',
        requirements: `Các bạn cần phải biết cách ${evtDef.category.toLowerCase()} và có trang phục phù hợp.`,
        benefits: `Cơ hội tham gia ${evtDef.category.toLowerCase()} cộng đồng, đạt được mục tiêu chung ${targetValue} km và nhận được quà tặng từ nhà tài trợ.`
      })

      console.log(`✅ Đã tạo sự kiện ID: ${sportEvent._id}`)

      // Seed activities
      const category = evtDef.category
      const profile = SPEED_PROFILES[category] || SPEED_PROFILES['default']
      const kcalPerKm = await getKcalPerKm(category)
      const baseCoords = getBaseCoords(evtDef.location)

      const loopStart = startDate
      const loopEnd = endDate < now.toDate() ? endDate : now.toDate()

      const runDays = pickWeeklyRunDays(loopStart, loopEnd)
      
      let activityBatch: any[] = []
      let progressBatch: any[] = []
      let eventCount = 0

      for (const userId of participantIds) {
        const userHash = hashMod(String(userId), 360)
        const baseLat = baseCoords.lat + (hashMod(String(userId) + 'lat', 200) / 100000 - 0.001) * 0.5
        const baseLng = baseCoords.lng + (hashMod(String(userId) + 'lng', 200) / 100000 - 0.001) * 0.5
        const baseBearing = (hashMod(String(sportEvent._id) + String(userId), 360) + userHash * 0.01) % 360

        const actTimes: moment.Moment[] = []
        for (const day of runDays) {
          const sessions = Math.random() > 0.6 ? 2 : 1
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
          const targetUnit = (sportEvent.targetUnit || '').toLowerCase();
          
          if (targetUnit.includes('kcal') || targetUnit.includes('calo')) {
            progressValue = calories;
            progressUnit = sportEvent.targetUnit;
          } else if (targetUnit.includes('giờ') || targetUnit.includes('hour')) {
            progressValue = totalDuration / 3600;
            progressUnit = sportEvent.targetUnit;
          } else if (targetUnit.includes('phút') || targetUnit.includes('minute')) {
            progressValue = totalDuration / 60;
            progressUnit = sportEvent.targetUnit;
          } else {
            progressValue = distanceKm;
            progressUnit = sportEvent.targetUnit || 'km';
          }

          activityBatch.push({
            eventId: sportEvent._id,
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
            eventId: sportEvent._id,
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
          
          if (activityBatch.length >= 2000) {
            await ActivityTrackingModel.insertMany(activityBatch)
            await SportEventProgressModel.insertMany(progressBatch)
            activityBatch = []
            progressBatch = []
          }
        }
      }

      if (activityBatch.length > 0) {
        await ActivityTrackingModel.insertMany(activityBatch)
        await SportEventProgressModel.insertMany(progressBatch)
      }

      console.log(`✅ Đã tạo ${eventCount} hoạt động cho sự kiện này.`)
    }

    console.log('\n🎉 Hoàn tất!')
  } catch (error) {
    console.error('❌ Lỗi:', error)
  } finally {
    setTimeout(() => {
      mongoose.disconnect()
      process.exit(0)
    }, 1000)
  }
}

seed()
