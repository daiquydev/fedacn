/**
 * GPS seed theo đường bộ (OSRM) — dùng chung seed thử thách / sự kiện.
 * Biến môi trường: OSRM_BASE_URL, OSRM_DELAY_MS, SEED_SKIP_OSRM, OSRM_USE_NEAREST
 */

export type SeedGpsPoint = { lat: number; lng: number; timestamp: number; speed?: number; altitude?: number }

const R_EARTH = 6371000

const OSRM_BASE = (process.env.OSRM_BASE_URL || 'https://router.project-osrm.org').replace(/\/$/, '')
const OSRM_DELAY_MS = Math.max(0, Number(process.env.OSRM_DELAY_MS) || 90)
const OSRM_USE_NEAREST = process.env.OSRM_USE_NEAREST === '1' || process.env.OSRM_USE_NEAREST === 'true'
function skipOsrm() {
  return process.env.SEED_SKIP_OSRM === '1' || process.env.SEED_SKIP_OSRM === 'true'
}

function prand(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (1664525 * s + 1013904223) >>> 0
    return s / 4294967296
  }
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

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function polylineLengthM(points: { lat: number; lng: number }[]) {
  let t = 0
  for (let i = 1; i < points.length; i++) t += haversineM(points[i - 1].lat, points[i - 1].lng, points[i].lat, points[i].lng)
  return t
}

function truncatePolylineToLength(points: { lat: number; lng: number }[], maxM: number) {
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

function osrmProfileForCategory(category: string) {
  const c = String(category || '')
  if (c.includes('Đạp xe')) return 'bike'
  if (c.includes('Xe máy') || c.includes('Lái xe')) return 'car'
  return 'foot'
}

let __osrmLast = 0
async function osrmThrottle() {
  if (skipOsrm() || OSRM_DELAY_MS <= 0) return
  const now = Date.now()
  const wait = OSRM_DELAY_MS - (now - __osrmLast)
  if (wait > 0) await new Promise((r) => setTimeout(r, wait))
  __osrmLast = Date.now()
}

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  let lastErr: unknown
  for (let i = 0; i < retries; i++) {
    try {
      return await fetch(url, { headers: { Accept: 'application/json' } })
    } catch (e) {
      lastErr = e
      await new Promise((r) => setTimeout(r, 350 * (i + 1)))
    }
  }
  throw lastErr
}

const __nearestCache = new Map<string, { lat: number; lng: number }>()
async function osrmNearest(profile: string, lat: number, lng: number) {
  const key = `${profile}:${lat.toFixed(4)},${lng.toFixed(4)}`
  if (__nearestCache.has(key)) return __nearestCache.get(key)!
  const url = `${OSRM_BASE}/nearest/v1/${profile}/${lng},${lat}?number=1`
  await osrmThrottle()
  const res = await fetchWithRetry(url)
  if (!res.ok) return null
  const j = (await res.json()) as { waypoints?: { location: [number, number] }[] }
  const loc = j.waypoints?.[0]?.location
  if (!loc) return null
  const out = { lat: loc[1], lng: loc[0] }
  __nearestCache.set(key, out)
  return out
}

async function osrmRouteLine(profile: string, lat1: number, lng1: number, lat2: number, lng2: number) {
  const url = `${OSRM_BASE}/route/v1/${profile}/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson&continue_straight=false`
  await osrmThrottle()
  const res = await fetchWithRetry(url)
  if (!res.ok) return null
  const j = (await res.json()) as {
    code?: string
    routes?: { geometry: { coordinates: [number, number][] } }[]
  }
  if (j.code !== 'Ok' || !j.routes?.[0]?.geometry?.coordinates) return null
  const coords = j.routes[0].geometry.coordinates
  if (!coords || coords.length < 2) return null
  return coords.map(([lng, lat]) => ({ lat, lng }))
}

async function buildHalfLegOnRoad(profile: string, slat: number, slng: number, bearingDeg: number, halfMeters: number) {
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

function resamplePathEvenly(points: { lat: number; lng: number }[], targetCount: number) {
  if (!points || points.length === 0) return []
  const clean = points.filter((p) => p && Number.isFinite(p.lat) && Number.isFinite(p.lng))
  if (clean.length < 2) return clean.map((p) => ({ lat: p.lat, lng: p.lng }))

  let n = Math.floor(Number(targetCount))
  if (!Number.isFinite(n) || n < 2) n = 2
  if (clean.length <= n) return clean.map((p) => ({ lat: p.lat, lng: p.lng }))

  const cum: number[] = [0]
  for (let i = 1; i < clean.length; i++) {
    cum.push(cum[i - 1] + haversineM(clean[i - 1].lat, clean[i - 1].lng, clean[i].lat, clean[i].lng))
  }
  const total = cum[cum.length - 1]
  if (total < 1) return clean.map((p) => ({ lat: p.lat, lng: p.lng }))

  const last = clean.length - 1
  const out: { lat: number; lng: number }[] = []
  for (let k = 0; k < n; k++) {
    let d = (k * total) / Math.max(1, n - 1)
    if (d > total) d = total
    if (d < 0) d = 0
    let j = 0
    while (j < last && cum[j + 1]! < d) j++
    j = Math.min(j, last - 1)
    const a = clean[j]!
    const b = clean[j + 1]!
    if (!Number.isFinite(a.lat) || !Number.isFinite(b.lat)) {
      out.push({ lat: clean[last]!.lat, lng: clean[last]!.lng })
      continue
    }
    const segLen = cum[j + 1]! - cum[j]!
    const frac = segLen > 1e-6 ? Math.min(1, Math.max(0, (d - cum[j]!) / segLen)) : 0
    out.push({
      lat: a.lat + frac * (b.lat - a.lat),
      lng: a.lng + frac * (b.lng - a.lng)
    })
  }
  return out
}

function straightLineOutBack(
  distanceKm: number,
  baseLat: number,
  baseLng: number,
  bearingDeg: number,
  seed: number
): { lat: number; lng: number }[] {
  const rnd = prand(seed)
  const distanceM = distanceKm * 1000
  const halfM = distanceM / 2
  const numPoints = Math.max(14, Math.min(80, Math.round(distanceKm * 22)))
  const halfN = Math.max(7, Math.floor(numPoints / 2))
  const forward: { lat: number; lng: number }[] = []
  for (let i = 0; i < halfN; i++) {
    const frac = halfN <= 1 ? 0 : i / (halfN - 1)
    const d = frac * halfM
    let p = destinationPoint(baseLat, baseLng, bearingDeg, d)
    const jm = (rnd() - 0.5) * 8
    if (Math.abs(jm) > 0.5) p = perpendicularOffset(p.lat, p.lng, bearingDeg, jm)
    forward.push(p)
  }
  const backward: { lat: number; lng: number }[] = []
  for (let i = forward.length - 2; i >= 0; i--) {
    let p = { ...forward[i]! }
    const jm = (rnd() - 0.5) * 8
    if (Math.abs(jm) > 0.5) p = perpendicularOffset(p.lat, p.lng, bearingDeg, jm)
    backward.push(p)
  }
  return [...forward, ...backward]
}

function pathLength(points: { lat: number; lng: number }[]) {
  let t = 0
  for (let i = 1; i < points.length; i++) t += haversineM(points[i - 1]!.lat, points[i - 1]!.lng, points[i]!.lat, points[i]!.lng)
  return t
}

/**
 * Điểm GPS + tổng mét (haversine) cho một phiên challenge; OSRM hoặc fallback đi–về.
 */
export async function buildGpsRouteForSeed(opts: {
  baseLat: number
  baseLng: number
  targetKm: number
  bearingDeg: number
  category: string
  startMs: number
  endMs: number
  avgSpeedMs: number
  altBase: number
  altAmp: number
  seed: number
}): Promise<{ points: SeedGpsPoint[]; lengthM: number }> {
  const { baseLat, baseLng, targetKm, bearingDeg, category, startMs, endMs, avgSpeedMs, altBase, altAmp, seed } = opts
  const rnd = prand(seed + 17)
  const distanceM = targetKm * 1000
  /** Trải timestamp theo đúng khoảng wall-clock của phiên (khớp totalDuration ở activity) */
  const wallDurS = Math.max(30, (endMs - startMs) / 1000)

  let pathCoords: { lat: number; lng: number }[] | null = null

  if (!skipOsrm() && targetKm >= 0.08) {
    try {
      const profile = osrmProfileForCategory(category)
      let startLat = baseLat
      let startLng = baseLng
      if (OSRM_USE_NEAREST) {
        const snapped = await osrmNearest(profile, baseLat, baseLng)
        if (snapped) {
          startLat = snapped.lat
          startLng = snapped.lng
        }
      }
      const halfM = distanceM / 2
      const halfLeg = await buildHalfLegOnRoad(profile, startLat, startLng, bearingDeg, halfM)
      if (halfLeg && halfLeg.length >= 2) {
        const back = [...halfLeg].reverse()
        if (back.length > 1) back.shift()
        pathCoords = [...halfLeg, ...back]
      }
    } catch {
      pathCoords = null
    }
  }

  if (!pathCoords || pathCoords.length < 4) {
    pathCoords = straightLineOutBack(targetKm, baseLat, baseLng, bearingDeg, seed)
  }

  pathCoords = pathCoords.filter((p) => p && Number.isFinite(p.lat) && Number.isFinite(p.lng))
  let maxPts = Math.min(400, Math.max(14, Math.floor(wallDurS / 4)))
  if (!Number.isFinite(maxPts) || maxPts < 2) maxPts = 14
  try {
    if (pathCoords.length > maxPts) pathCoords = resamplePathEvenly(pathCoords, maxPts)
  } catch {
    /* giữ pathCoords */
  }

  const lengthM = pathLength(pathCoords)
  const n = pathCoords.length
  const points: SeedGpsPoint[] = []
  for (let i = 0; i < n; i++) {
    const pt = pathCoords[i]!
    if (!Number.isFinite(pt.lat) || !Number.isFinite(pt.lng)) continue
    const t = (i / (n - 1 || 1)) * wallDurS
    const f = i / (n - 1 || 1)
    const alt = altBase + altAmp * Math.sin(f * Math.PI * 4 + seed * 0.05)
    points.push({
      lat: Number(pt.lat.toFixed(6)),
      lng: Number(pt.lng.toFixed(6)),
      timestamp: Math.round(startMs + t * 1000),
      speed: Number((avgSpeedMs * (0.88 + rnd() * 0.24)).toFixed(2)),
      altitude: Number(alt.toFixed(1))
    })
  }

  const finalLen = points.length >= 2 ? pathLength(points) : lengthM
  return { points, lengthM: finalLen > 200 ? finalLen : distanceM }
}
