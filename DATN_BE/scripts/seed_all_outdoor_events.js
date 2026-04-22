/**
 * Seed hoạt động GPS cho mọi người tham gia sự kiện Ngoài trời.
 *
 * - Đọc MONGODB_URL từ DATN_BE/.env (chạy từ repo root: npm run seed:outdoor-event-activities).
 * - Ngày ghi nhận: từ 0h ngày bắt đầu sự kiện → hết ngày hiện tại (local).
 * - Mỗi tuần chọn ngẫu nhiên 2–4 ngày trong khoảng đó; mỗi ngày 1–2 buổi.
 * - GPS: ưu tiên lộ trình theo đường bộ qua OSRM (router.project-osrm.org), đi–về cùng trục;
 *   lỗi mạng/OSRM → fallback đường thẳng đi–về gần điểm xuất phát.
 * - Chạy lại: xóa activity_tracking + sport_event_progress cũ theo từng sự kiện rồi seed mới.
 *
 * Tuỳ chọn .env:
 *   OSRM_BASE_URL — mặc định https://router.project-osrm.org
 *   OSRM_DELAY_MS — khoảng cách tối thiểu giữa các request (mặc định 90)
 *   OSRM_USE_NEAREST=1 — gọi /nearest trước (chậm hơn, chính xác hơn). Mặc định không gọi (route đã snap).
 *   SEED_SKIP_OSRM=1 — bỏ OSRM, chỉ đường thẳng đi–về (seed rất nhanh).
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') })

const mongoose = require('mongoose')

const MONGODB_URL = process.env.MONGODB_URL || ''
/** Cuối ngày hôm nay (local) — mọi hoạt động seed không vượt quá hôm nay */
function endOfTodayLocal() {
  const d = new Date()
  d.setHours(23, 59, 59, 999)
  return d
}
const TODAY = endOfTodayLocal()

const OSRM_BASE = (process.env.OSRM_BASE_URL || 'https://router.project-osrm.org').replace(/\/$/, '')
const OSRM_DELAY_MS = Math.max(0, Number(process.env.OSRM_DELAY_MS) || 90)
const OSRM_USE_NEAREST = process.env.OSRM_USE_NEAREST === '1' || process.env.OSRM_USE_NEAREST === 'true'
const SEED_SKIP_OSRM = process.env.SEED_SKIP_OSRM === '1' || process.env.SEED_SKIP_OSRM === 'true'

const DEFAULT_KCAL = 60

const SPEED_RANGE = {
  'Chạy bộ': [2.0, 3.5],
  'Chạy bộ đường dài': [2.5, 4.0],
  'Chạy trail': [2.2, 3.8],
  'Đi bộ': [1.0, 1.8],
  'Đi bộ đường dài': [1.0, 1.8],
  'Đạp xe': [4.5, 8.0],
  'Trượt patin': [3.0, 6.0],
  'Lái xe': [6.0, 13.0],
  'Xe máy': [5.0, 12.0],
  'Bơi lội': [0.8, 1.5],
  default: [2.0, 4.0]
}

/** Góc tọa độ khu vực TP.HCM — mỗi sự kiện bám một khu (ổn định), không nhảy lung tung */
const HCM_AREAS = [
  { lat: 10.801, lng: 106.665, name: 'Tân Bình' },
  { lat: 10.796, lng: 106.658, name: 'Trường Chinh' },
  { lat: 10.7738, lng: 106.7028, name: 'Nguyễn Huệ' },
  { lat: 10.783, lng: 106.695, name: 'Quận 10' },
  { lat: 10.799, lng: 106.715, name: 'Gò Vấp' },
  { lat: 10.818, lng: 106.704, name: 'Bình Thạnh' },
  { lat: 10.754, lng: 106.672, name: 'Phú Nhuận' },
  { lat: 10.768, lng: 106.689, name: 'Quận 3' }
]

function rand(min, max) {
  return Math.random() * (max - min) + min
}
function randInt(min, max) {
  return Math.floor(rand(min, max + 1))
}

function hashMod(str, mod) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  return mod ? h % mod : h
}

function getSpeedRange(category) {
  return SPEED_RANGE[category] || SPEED_RANGE.default
}

/** Đầu tuần (Thứ Hai) 00:00 theo lịch local */
function startOfWeekMonday(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const dow = x.getDay()
  const diff = dow === 0 ? -6 : 1 - dow
  x.setDate(x.getDate() + diff)
  x.setHours(0, 0, 0, 0)
  return x
}

function dayKey(d) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

/**
 * Mỗi tuần calendar: chọn ngẫu nhiên 2–4 ngày nằm trong [loopStart, loopEnd].
 */
function pickWeeklyRunDays(loopStart, loopEnd) {
  const picked = new Map()
  let weekStart = startOfWeekMonday(loopStart)

  while (weekStart <= loopEnd) {
    const weekEndDate = new Date(weekStart)
    weekEndDate.setDate(weekEndDate.getDate() + 6)
    weekEndDate.setHours(23, 59, 59, 999)

    const daysInWeek = []
    for (let t = new Date(weekStart); t <= weekEndDate && t <= loopEnd; t.setDate(t.getDate() + 1)) {
      const day = new Date(t.getFullYear(), t.getMonth(), t.getDate(), 12, 0, 0, 0)
      if (day < loopStart || day > loopEnd) continue
      daysInWeek.push(new Date(day))
    }

    if (daysInWeek.length > 0) {
      const k = Math.min(randInt(2, 4), daysInWeek.length)
      const shuffled = daysInWeek.sort(() => Math.random() - 0.5)
      for (let i = 0; i < k; i++) {
        const d = shuffled[i]
        picked.set(dayKey(d), d)
      }
    }

    weekStart = new Date(weekStart)
    weekStart.setDate(weekStart.getDate() + 7)
  }

  return Array.from(picked.values()).sort((a, b) => a - b)
}

const R_EARTH = 6371000

/** Điểm đích cách (lat,lng) một khoảng mét, bearing độ (0=Bắc, 90=Đông) */
function destinationPoint(latDeg, lngDeg, bearingDeg, distM) {
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

/** Lệch vuông góc với hướng chạy (mét) — jitter làn đường / GPS */
function perpendicularOffset(latDeg, lngDeg, bearingDeg, offsetM) {
  const brng = bearingDeg + 90
  return destinationPoint(latDeg, lngDeg, brng, offsetM)
}

function haversineM(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function polylineLengthM(points) {
  let t = 0
  for (let i = 1; i < points.length; i++) t += haversineM(points[i - 1].lat, points[i - 1].lng, points[i].lat, points[i].lng)
  return t
}

function truncatePolylineToLength(points, maxM) {
  if (!points || points.length < 2) return points ? [...points] : []
  const out = [points[0]]
  let acc = 0
  for (let i = 1; i < points.length; i++) {
    const seg = haversineM(points[i - 1].lat, points[i - 1].lng, points[i].lat, points[i].lng)
    if (acc + seg >= maxM) {
      const need = maxM - acc
      const frac = seg > 0 ? need / seg : 0
      out.push({
        lat: points[i - 1].lat + frac * (points[i].lat - points[i - 1].lat),
        lng: points[i - 1].lng + frac * (points[i].lng - points[i - 1].lng)
      })
      break
    }
    acc += seg
    out.push(points[i])
  }
  return out
}

function osrmProfileForCategory(category) {
  const c = String(category || '')
  if (c.includes('Đạp xe')) return 'bike'
  if (c.includes('Xe máy') || c.includes('Lái xe')) return 'car'
  return 'foot'
}

let __osrmLast = 0
async function osrmThrottle() {
  if (SEED_SKIP_OSRM || OSRM_DELAY_MS <= 0) return
  const now = Date.now()
  const wait = OSRM_DELAY_MS - (now - __osrmLast)
  if (wait > 0) await new Promise((r) => setTimeout(r, wait))
  __osrmLast = Date.now()
}

async function fetchWithRetry(url, init = {}, retries = 3) {
  let lastErr
  const headers = { Accept: 'application/json', ...(init.headers || {}) }
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { ...init, headers })
      return res
    } catch (e) {
      lastErr = e
      await new Promise((r) => setTimeout(r, 350 * (i + 1)))
    }
  }
  throw lastErr
}

const __nearestCache = new Map()
async function osrmNearest(profile, lat, lng) {
  const key = `${profile}:${lat.toFixed(4)},${lng.toFixed(4)}`
  if (__nearestCache.has(key)) return __nearestCache.get(key)
  const url = `${OSRM_BASE}/nearest/v1/${profile}/${lng},${lat}?number=1`
  await osrmThrottle()
  const res = await fetchWithRetry(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) return null
  const j = await res.json()
  const loc = j.waypoints && j.waypoints[0] && j.waypoints[0].location
  if (!loc) return null
  const out = { lat: loc[1], lng: loc[0] }
  __nearestCache.set(key, out)
  return out
}

/** Trả về mảng {lat,lng} dọc theo đường OSRM, hoặc null */
async function osrmRouteLine(profile, lat1, lng1, lat2, lng2) {
  const url = `${OSRM_BASE}/route/v1/${profile}/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson&continue_straight=false`
  await osrmThrottle()
  const res = await fetchWithRetry(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) return null
  const j = await res.json()
  if (j.code !== 'Ok' || !j.routes || !j.routes[0] || !j.routes[0].geometry) return null
  const coords = j.routes[0].geometry.coordinates
  if (!coords || coords.length < 2) return null
  return coords.map(([lng, lat]) => ({ lat, lng }))
}

/** Tối đa 4 lần route (trước đây 7 + nearest → rất chậm với nhiều buổi) */
async function buildHalfLegOnRoad(profile, slat, slng, bearingDeg, halfMeters) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const crow = halfMeters * (1.35 + attempt * 0.55)
    const end = destinationPoint(slat, slng, bearingDeg, crow)
    const line = await osrmRouteLine(profile, slat, slng, end.lat, end.lng)
    if (!line || line.length < 2) continue
    const L = polylineLengthM(line)
    if (L >= halfMeters * 0.72) return truncatePolylineToLength(line, halfMeters)
  }
  return null
}

function resamplePathEvenly(points, targetCount) {
  if (!points || points.length === 0) return []
  const clean = points.filter((p) => p && Number.isFinite(p.lat) && Number.isFinite(p.lng))
  if (clean.length < 2) return clean.map((p) => ({ lat: p.lat, lng: p.lng }))

  let n = Math.floor(Number(targetCount))
  if (!Number.isFinite(n) || n < 2) n = 2
  if (clean.length <= n) return clean.map((p) => ({ lat: p.lat, lng: p.lng }))

  const cum = [0]
  for (let i = 1; i < clean.length; i++) {
    cum.push(cum[i - 1] + haversineM(clean[i - 1].lat, clean[i - 1].lng, clean[i].lat, clean[i].lng))
  }
  const total = cum[cum.length - 1]
  if (total < 1) return clean.map((p) => ({ lat: p.lat, lng: p.lng }))

  const last = clean.length - 1
  const out = []
  for (let k = 0; k < n; k++) {
    let d = (k * total) / Math.max(1, n - 1)
    if (d > total) d = total
    if (d < 0) d = 0

    let j = 0
    while (j < last && cum[j + 1] < d) j++
    j = Math.min(j, last - 1)

    const a = clean[j]
    const b = clean[j + 1]
    if (!a || !b || !Number.isFinite(a.lat) || !Number.isFinite(b.lat)) {
      out.push({ lat: clean[last].lat, lng: clean[last].lng })
      continue
    }
    const segLen = cum[j + 1] - cum[j]
    const frac = segLen > 1e-6 ? Math.min(1, Math.max(0, (d - cum[j]) / segLen)) : 0
    out.push({
      lat: a.lat + frac * (b.lat - a.lat),
      lng: a.lng + frac * (b.lng - a.lng)
    })
  }
  return out
}

/**
 * Fallback: đi–về thẳng (không OSRM).
 */
function generateGpsRouteStraightLine(distanceKm, startTime, avgSpeedMs, baseLat, baseLng, bearingDeg) {
  const distanceM = distanceKm * 1000
  const totalDurationS = distanceM / avgSpeedMs
  const halfM = distanceM / 2

  const numPoints = Math.max(12, Math.floor(totalDurationS / 5))
  const halfN = Math.max(6, Math.floor(numPoints / 2))

  const forward = []
  for (let i = 0; i < halfN; i++) {
    const frac = halfN <= 1 ? 0 : i / (halfN - 1)
    const d = frac * halfM
    let p = destinationPoint(baseLat, baseLng, bearingDeg, d)
    const jm = rand(-4, 4)
    if (Math.abs(jm) > 0.5) p = perpendicularOffset(p.lat, p.lng, bearingDeg, jm)
    forward.push(p)
  }

  const backward = []
  for (let i = forward.length - 2; i >= 0; i--) {
    let p = { ...forward[i] }
    const jm = rand(-4, 4)
    if (Math.abs(jm) > 0.5) p = perpendicularOffset(p.lat, p.lng, bearingDeg, jm)
    backward.push(p)
  }

  const path = [...forward, ...backward]
  const startTs = startTime.getTime()
  const points = []

  for (let i = 0; i < path.length; i++) {
    const t = (i / (path.length - 1 || 1)) * totalDurationS
    const ts = Math.round(startTs + t * 1000)
    const pointSpeed = Number((avgSpeedMs * rand(0.88, 1.12)).toFixed(2))
    points.push({
      lat: Number(path[i].lat.toFixed(6)),
      lng: Number(path[i].lng.toFixed(6)),
      timestamp: ts,
      speed: pointSpeed,
      altitude: Number(rand(3, 15).toFixed(1))
    })
  }

  return points
}

/**
 * GPS theo đường bộ (OSRM) đi–về; fallback straight-line.
 */
async function generateGpsRouteRoad(distanceKm, startTime, avgSpeedMs, baseLat, baseLng, bearingDeg, category) {
  if (SEED_SKIP_OSRM) {
    return generateGpsRouteStraightLine(distanceKm, startTime, avgSpeedMs, baseLat, baseLng, bearingDeg)
  }

  const distanceM = distanceKm * 1000
  const totalDurationS = distanceM / avgSpeedMs
  const halfM = distanceM / 2
  const profile = osrmProfileForCategory(category)

  let path = null
  try {
    let startLat = baseLat
    let startLng = baseLng
    if (OSRM_USE_NEAREST) {
      const snapped = await osrmNearest(profile, baseLat, baseLng)
      if (snapped) {
        startLat = snapped.lat
        startLng = snapped.lng
      }
    }
    const halfLeg = await buildHalfLegOnRoad(profile, startLat, startLng, bearingDeg, halfM)
    if (halfLeg && halfLeg.length >= 2) {
      const back = [...halfLeg].reverse()
      if (back.length > 1) back.shift()
      path = [...halfLeg, ...back]
    }
  } catch (e) {
    console.warn('   ⚠️ OSRM lỗi, dùng đường thẳng:', e.message || e)
  }

  if (!path || path.length < 4) {
    return generateGpsRouteStraightLine(distanceKm, startTime, avgSpeedMs, baseLat, baseLng, bearingDeg)
  }

  path = path.filter((p) => p && Number.isFinite(p.lat) && Number.isFinite(p.lng))
  if (path.length < 4) {
    return generateGpsRouteStraightLine(distanceKm, startTime, avgSpeedMs, baseLat, baseLng, bearingDeg)
  }

  let maxPts = Math.min(400, Math.max(14, Math.floor(totalDurationS / 4)))
  if (!Number.isFinite(maxPts) || maxPts < 2) maxPts = 14

  let sampled
  try {
    sampled = resamplePathEvenly(path, maxPts)
  } catch (e) {
    console.warn('   ⚠️ resamplePathEvenly lỗi, dùng đường thẳng:', e.message || e)
    return generateGpsRouteStraightLine(distanceKm, startTime, avgSpeedMs, baseLat, baseLng, bearingDeg)
  }
  if (!sampled || sampled.length < 2) {
    return generateGpsRouteStraightLine(distanceKm, startTime, avgSpeedMs, baseLat, baseLng, bearingDeg)
  }
  path = sampled

  const startTs = startTime.getTime()
  const points = []
  const n = path.length
  for (let i = 0; i < n; i++) {
    const pt = path[i]
    if (!pt || !Number.isFinite(pt.lat) || !Number.isFinite(pt.lng)) {
      return generateGpsRouteStraightLine(distanceKm, startTime, avgSpeedMs, baseLat, baseLng, bearingDeg)
    }
    const t = (i / (n - 1 || 1)) * totalDurationS
    points.push({
      lat: Number(pt.lat.toFixed(6)),
      lng: Number(pt.lng.toFixed(6)),
      timestamp: Math.round(startTs + t * 1000),
      speed: Number((avgSpeedMs * rand(0.88, 1.12)).toFixed(2)),
      altitude: Number(rand(3, 15).toFixed(1))
    })
  }
  return points
}

const ActivityTrackingSchema = new mongoose.Schema(
  {
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
  },
  { timestamps: true, collection: 'activity_tracking' }
)

const SportEventProgressSchema = new mongoose.Schema(
  {
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
  },
  { timestamps: true, collection: 'sport_event_progress' }
)

const ActivityModel = mongoose.model('activity_tracking_seed', ActivityTrackingSchema)
const ProgressModel = mongoose.model('sport_event_progress_seed', SportEventProgressSchema)

function baseAreaForEvent(ev) {
  const idStr = ev._id.toString()
  const idx = hashMod(idStr, HCM_AREAS.length)
  return HCM_AREAS[idx]
}

/** Điểm xuất phát ổn định quanh “địa điểm sự kiện” (hash) + lệch nhỏ theo user */
function startPointForUser(ev, userId) {
  const area = baseAreaForEvent(ev)
  const u = hashMod(userId.toString(), 360)
  const v = hashMod(userId.toString() + 'x', 200) / 100000
  const w = hashMod(userId.toString() + 'y', 200) / 100000
  return {
    lat: area.lat + (v - 0.001) * 0.5,
    lng: area.lng + (w - 0.001) * 0.5,
    bearing: (hashMod(ev._id.toString() + userId.toString(), 360) + u * 0.01) % 360
  }
}

async function seedUser(eventId, userId, event, kcalPerKm, targetKm) {
  const [speedMin, speedMax] = getSpeedRange(event.category)
  const { lat: baseLat, lng: baseLng, bearing: baseBearing } = startPointForUser(event, userId)

  const evStart = new Date(event.startDate)
  const evEnd = new Date(event.endDate)
  const todayEnd = endOfTodayLocal()
  /** Hoạt động chỉ trong [ngày bắt đầu sự kiện, min(ngày kết thúc sự kiện, hôm nay)] */
  const seedEnd = evEnd < todayEnd ? evEnd : todayEnd

  const loopStart = new Date(evStart)
  loopStart.setHours(0, 0, 0, 0)
  const loopEnd = new Date(seedEnd)
  loopEnd.setHours(23, 59, 59, 999)

  if (loopStart > loopEnd) return { created: 0, km: '0.00', target: 0 }

  const runDays = pickWeeklyRunDays(loopStart, loopEnd)
  const actTimes = []

  for (const day of runDays) {
    const sessions = rand(0, 1) > 0.35 ? 2 : 1
    const slots = [
      { h: randInt(5, 7), m: randInt(0, 59) },
      { h: randInt(17, 19), m: randInt(0, 59) }
    ]
    for (let s = 0; s < sessions; s++) {
      const t = new Date(day.getFullYear(), day.getMonth(), day.getDate(), slots[s].h, slots[s].m, randInt(0, 59), 0)
      if (t >= loopStart && t <= loopEnd) actTimes.push(t)
    }
  }

  actTimes.sort((a, b) => a - b)
  if (actTimes.length === 0) return { created: 0, km: '0.00', target: 0 }

  const finalTarget = Number((targetKm * rand(0.92, 1.08)).toFixed(2))
  let accumulated = 0
  let created = 0

  for (let i = 0; i < actTimes.length; i++) {
    const isLast = i === actTimes.length - 1
    let distKm

    if (isLast) {
      distKm = Number((finalTarget - accumulated).toFixed(2))
    } else {
      const avg = finalTarget / actTimes.length
      distKm = Number(rand(avg * 0.45, avg * 1.55).toFixed(2))
      if (accumulated + distKm >= finalTarget - 0.005) {
        distKm = Number((finalTarget - accumulated).toFixed(2))
      }
    }
    if (distKm < 0.05) continue

    accumulated += distKm
    const distM = Math.round(distKm * 1000)
    const avgSpd = Number(rand(speedMin, speedMax).toFixed(2))
    const maxSpd = Number((avgSpd * rand(1.1, 1.28)).toFixed(2))
    const dur = Math.max(45, Math.round(distM / avgSpd))
    const pace = Number(((dur / 60) / distKm).toFixed(2))
    const kcal = Math.round(distKm * kcalPerKm)
    const endT = new Date(actTimes[i].getTime() + dur * 1000)
    const bearingThisRun = (baseBearing + rand(-8, 8) + 360) % 360
    const gps = await generateGpsRouteRoad(distKm, actTimes[i], avgSpd, baseLat, baseLng, bearingThisRun, event.category)
    const durMin = Math.floor(dur / 60)

    await ActivityModel.create({
      eventId,
      userId,
      activityType: event.category,
      status: 'completed',
      startTime: actTimes[i],
      endTime: endT,
      totalDuration: dur,
      totalDistance: distM,
      avgSpeed: avgSpd,
      maxSpeed: maxSpd,
      avgPace: pace,
      calories: kcal,
      gpsRoute: gps,
      pauseIntervals: []
    })

    await ProgressModel.create({
      eventId,
      userId,
      date: actTimes[i],
      value: distKm,
      unit: 'km',
      distance: distKm,
      calories: kcal,
      time: `${durMin} phút`,
      source: 'gps',
      notes: `${event.category} ${distKm}km trong ${durMin} phút`,
      is_deleted: false
    })

    created++
    if (accumulated >= finalTarget) break
  }

  return { created, km: accumulated.toFixed(2), target: finalTarget }
}

async function main() {
  if (!MONGODB_URL) {
    console.error('❌ Thiếu MONGODB_URL trong .env')
    process.exit(1)
  }

  const t0 = Date.now()
  console.log('🔗 Đang kết nối MongoDB...')
  await mongoose.connect(MONGODB_URL)
  console.log('✅ Đã kết nối')
  console.log(`📅 Ngày seed hoạt động: từ ngày bắt đầu sự kiện → ${TODAY.toLocaleDateString('vi-VN')} (cuối ngày)`)
  console.log(
    `🗺️  ${SEED_SKIP_OSRM ? 'GPS: đường thẳng (SEED_SKIP_OSRM=1)' : `OSRM ${OSRM_BASE}`} | delay ${OSRM_DELAY_MS}ms | nearest=${OSRM_USE_NEAREST}`
  )
  console.log(`   Gợi ý nhanh: SEED_SKIP_OSRM=1 hoặc OSRM_DELAY_MS=0 (chỉ khi server OSRM cho phép)\n`)

  const db = mongoose.connection.db

  const events = await db
    .collection('sport_events')
    .find({ eventType: 'Ngoài trời', isDeleted: { $ne: true } })
    .toArray()

  const cats = await db.collection('sport_categories').find({ isDeleted: { $ne: true } }).toArray()
  const catMap = {}
  cats.forEach((c) => {
    catMap[c.name] = c
  })

  let totalEventsDone = 0
  let totalUsersSeeded = 0

  for (const ev of events) {
    const evId = ev._id
    const evStart = new Date(ev.startDate)
    const evEnd = new Date(ev.endDate)

    if (evStart > TODAY) {
      console.log(`⏭️  [TƯƠNG LAI] ${ev.name} (bắt đầu ${evStart.toLocaleDateString('vi-VN')})`)
      continue
    }

    const cat = catMap[ev.category] || {}
    const kcalPerKm = cat.kcal_per_unit > 0 ? cat.kcal_per_unit : DEFAULT_KCAL
    const maxPart = Math.max(ev.maxParticipants || 1, 1)
    const rawPerPerson = (ev.targetValue || 0) / maxPart
    const perPersonKm = Math.max(rawPerPerson, 0.8)

    const area = baseAreaForEvent(ev)
    console.log(`\n🏟️  ${ev.name}`)
    console.log(`   [${evId}]`)
    console.log(`   Danh mục: ${ev.category} | ${kcalPerKm} kcal/km`)
    console.log(`   Khu GPS cố định: ${area.name} (${area.lat.toFixed(4)}, ${area.lng.toFixed(4)})`)
    console.log(`   Mục tiêu gợi ý: ~${perPersonKm.toFixed(2)} km/người (theo target/maxParticipants)`)

    const delA = await ActivityModel.deleteMany({ eventId: evId })
    const delP = await ProgressModel.deleteMany({ eventId: evId })
    console.log(`   🧹 Đã xóa dữ liệu cũ: ${delA.deletedCount} activity, ${delP.deletedCount} progress`)

    const participants = ev.participants_ids || []
    let seeded = 0

    for (const uid of participants) {
      const userId = new mongoose.Types.ObjectId(uid.toString())
      const user = await db.collection('users').findOne({ _id: userId })
      const name = user ? user.name || user.username || String(uid) : String(uid)

      const result = await seedUser(evId, userId, ev, kcalPerKm, perPersonKm)
      if (result.created > 0) {
        console.log(`   ✅ ${name}: ${result.created} buổi, ${result.km}/${result.target} km`)
        seeded++
      } else {
        console.log(`   ⚠️  ${name}: không tạo được buổi nào (kiểm tra khoảng ngày sự kiện)`)
      }
    }

    console.log(`   📊 Đã seed ${seeded}/${participants.length} người`)
    totalEventsDone++
    totalUsersSeeded += seeded
  }

  console.log(`\n${'='.repeat(60)}`)
  console.log('🎉 Hoàn thành seed hoạt động Ngoài trời')
  console.log(`   Sự kiện đã xử lý: ${totalEventsDone}`)
  console.log(`   Tổng người có dữ liệu mới: ${totalUsersSeeded}`)
  console.log(`⏱️  Tổng thời gian: ${((Date.now() - t0) / 1000).toFixed(1)} giây`)
  console.log(`${'='.repeat(60)}`)

  setTimeout(() => {
    mongoose.disconnect()
    process.exit(0)
  }, 800)
}

/** Kiểm tra nhanh không cần MongoDB: node DATN_BE/scripts/seed_all_outdoor_events.js --selftest */
function runPathSelfTest() {
  const pts = []
  for (let i = 0; i < 500; i++) pts.push({ lat: 10.8 + i * 0.00005, lng: 106.7 + i * 0.00005 })
  const r = resamplePathEvenly(pts, 400)
  if (r.length !== 400) throw new Error(`resample length: want 400 got ${r.length}`)
  const tiny = Array.from({ length: 80 }, (_, i) => ({
    lat: 10.799 + i * 0.00001,
    lng: 106.715 + i * 0.00001
  }))
  const r2 = resamplePathEvenly(tiny, 50)
  if (r2.length !== 50) throw new Error(`tiny resample: want 50 got ${r2.length}`)
  for (const p of r2) {
    if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng)) throw new Error('NaN in resample')
  }
  console.log('✅ Selftest resamplePathEvenly: OK')
}

if (process.argv.includes('--selftest')) {
  try {
    runPathSelfTest()
    process.exit(0)
  } catch (e) {
    console.error('❌ Selftest:', e)
    process.exit(1)
  }
} else {
  main().catch((err) => {
    console.error('❌ Lỗi:', err)
    process.exit(1)
  })
}
