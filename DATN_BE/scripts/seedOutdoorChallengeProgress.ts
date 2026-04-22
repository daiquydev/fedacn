/**
 * Seed tiến độ thử thách ngoài trời: challenge_progress + activity_tracking (GPS route, quãng đường, tốc độ, calo)
 * theo từng bộ môn (category). Từ ngày bắt đầu đến “hôm nay” (VN), nhiều kiểu người.
 *
 * Luồng thật (FE + BE):
 * - OutdoorCheckinModal: nhập tay (value = km, source manual_input → BE lưu source = manual) hoặc
 *   ChallengeTracking: GPS (value = km, gps_route, source gps_tracking).
 * - addProgress: outdoor + gps_tracking → tạo ActivityTracking (totalDistance mét, gpsRoute, …) + progress.activity_id.
 *   Nhập tay không tạo ActivityTracking (activity_id null).
 * - Mỗi ngày (VN): todaySum = TỔNG progress.value (km) trong ngày. todaySum >= challenge.goal_value → completed_days.
 *
 * Script này: mỗi phiên có km > 0 đều có ActivityTracking + gpsRoute (bản đồ VN); calo = km × kcal_per_unit trên từng challenge.
 * Người chơi xoay vòng theo pattern: đủ ngày / thiếu km / bỏ ngày / gần đích mới fail / v.v.
 *
 * Chạy sau: npm run seed:challenges && npm run seed:challenge-participants
 *   npm run seed:outdoor-progress
 *
 * GPS theo đường bộ (OSRM), fallback đường thẳng — giống seed sự kiện ngoài trời.
 * Chạy nhanh (không gọi OSRM):
 *   npm run seed:outdoor-progress:fast
 *   hoặc SEED_SKIP_OSRM=1 npm run seed:outdoor-progress
 *
 * Ghi đè (nên bật khi chạy lại — tránh nhân đôi bản ghi và làm chậm aggregate):
 *   SEED_OUTDOOR_REPLACE=1 npm run seed:outdoor-progress
 *
 * Hiệu năng: mỗi người tham gia ghi 1 lần insertMany(activity) + insertMany(progress),
 * không còn hàng nghìn create() tuần tự (trước đây dễ >30 phút với Atlas).
 * Neo ngày:
 *   SEED_OUTDOOR_AS_OF=2026-04-12 npm run seed:outdoor-progress
 * Mọi thử thách outdoor (không chỉ bản ghi seed ‖fedacn-seed‖):
 *   SEED_OUTDOOR_ALL=1 npm run seed:outdoor-progress
 */
import mongoose from 'mongoose'
import { config } from 'dotenv'
import path from 'path'

import { buildGpsRouteForSeed } from './osrmGpsRoute'

import ChallengeModel from '../src/models/schemas/challenge.schema'
import ChallengeProgressModel from '../src/models/schemas/challengeProgress.schema'
import ChallengeParticipantModel from '../src/models/schemas/challengeParticipant.schema'
import ActivityTrackingModel from '../src/models/schemas/activityTracking.schema'

config({ path: path.join(__dirname, '../.env') })

const MONGODB_URL = process.env.MONGODB_URL || ''
const REPLACE = process.env.SEED_OUTDOOR_REPLACE === '1' || process.env.SEED_OUTDOOR_REPLACE === 'true'
const SEED_ALL_OUTDOOR = process.env.SEED_OUTDOOR_ALL === '1' || process.env.SEED_OUTDOOR_ALL === 'true'
const SEED_MARKER = '\n\n‖fedacn-seed‖'
const MAX_USERS = Math.max(6, parseInt(process.env.SEED_OUTDOOR_MAX_USERS_PER_CHALLENGE || '24', 10) || 24)

type OutdoorChallengeLean = {
  _id: mongoose.Types.ObjectId
  title: string
  category: string
  challenge_type: string
  goal_type: string
  goal_value: number
  goal_unit: string
  kcal_per_unit: number
  start_date: Date
  end_date: Date
}

type GpsPoint = { lat: number; lng: number; timestamp: number; speed?: number; altitude?: number }

type SportProfile = { avgKmh: number; maxKmh: number; altBase: number; altAmp: number }

function toVNDateKey(d: Date): string {
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' })
}

function addOneVNKey(key: string): string {
  const t = new Date(`${key}T12:00:00+07:00`)
  t.setDate(t.getDate() + 1)
  return toVNDateKey(t)
}

/** Cộng trừ N ngày theo lịch VN (chuỗi YYYY-MM-DD). */
function addVNKeyDays(key: string, deltaDays: number): string {
  const t = new Date(`${key}T12:00:00+07:00`)
  t.setDate(t.getDate() + deltaDays)
  return toVNDateKey(t)
}

function vnCalendarDaysBetween(laterKey: string, earlierKey: string): number {
  const a = new Date(`${laterKey}T12:00:00+07:00`).getTime()
  const b = new Date(`${earlierKey}T12:00:00+07:00`).getTime()
  return Math.round((a - b) / (24 * 60 * 60 * 1000))
}

function enumerateVNKeys(first: string, last: string): string[] {
  const out: string[] = []
  let k = first
  while (k <= last) {
    out.push(k)
    k = addOneVNKey(k)
  }
  return out
}

function atVN(key: string, hourVN: number, minuteVN: number): Date {
  const pad = (n: number) => String(n).padStart(2, '0')
  return new Date(`${key}T${pad(hourVN)}:${pad(minuteVN)}:00+07:00`)
}

/** Neo GPS theo bộ môn — khu vực VN khác nhau để bản đồ / route không trùng. */
function anchorForCategory(category: string): { lat: number; lng: number; label: string } {
  const c = category || ''
  const map: Record<string, { lat: number; lng: number; label: string }> = {
    'Chạy bộ': { lat: 21.0245, lng: 105.8412, label: 'Hồ Gươm, Hà Nội' },
    'Đạp xe': { lat: 10.7296, lng: 106.7221, label: 'Khu đô thị Nam Sài Gòn' },
    'Đi bộ': { lat: 16.0544, lng: 108.2022, label: 'Bãi biển Mỹ Khê, Đà Nẵng' },
    'Đi bộ đường dài': { lat: 12.2594, lng: 109.1101, label: 'Đồi núi Đà Lạt' },
    'Chạy trail': { lat: 21.1785, lng: 105.8038, label: 'Ngoại ô Ba Vì / HN' },
    'Trượt patin': { lat: 10.7827, lng: 106.6984, label: 'Công viên Tao Đàn, TP.HCM' },
    'Chạy bộ đường dài': { lat: 21.0169, lng: 105.8253, label: 'Long Biên — sông Hồng' }
  }
  return map[c] || { lat: 10.7769, lng: 106.7009, label: 'Trung tâm TP.HCM' }
}

function sportProfile(category: string): SportProfile {
  const c = category || ''
  if (c.includes('Đạp')) return { avgKmh: 22, maxKmh: 38, altBase: 6, altAmp: 4 }
  if (c.includes('Đi bộ') && c.includes('dài')) return { avgKmh: 4.2, maxKmh: 7.5, altBase: 1200, altAmp: 85 }
  if (c.includes('Đi bộ')) return { avgKmh: 5.2, maxKmh: 9, altBase: 8, altAmp: 3 }
  if (c.includes('trail')) return { avgKmh: 9.5, maxKmh: 17, altBase: 180, altAmp: 45 }
  if (c.includes('patin')) return { avgKmh: 12, maxKmh: 24, altBase: 5, altAmp: 2 }
  if (c.includes('Chạy') && c.includes('dài')) return { avgKmh: 10.5, maxKmh: 16, altBase: 12, altAmp: 6 }
  if (c.includes('Chạy')) return { avgKmh: 11.2, maxKmh: 17, altBase: 15, altAmp: 8 }
  return { avgKmh: 10, maxKmh: 18, altBase: 10, altAmp: 6 }
}

function roundKcal(n: number): number {
  return Math.round(n)
}

function titleFlavorOutdoor(title: string): string {
  const t = title || ''
  if (/Tháng 4|April|Pedal|Walk|Trail|Roll/i.test(t)) return ' Đúng tinh thần thử thách tháng 4 ngoài trời.'
  if (/Rủ hội|Team|Crew|Hẹn bạn|Cùng cộng đồng/i.test(t)) return ' Log nhóm / cộng đồng — minh bạch km.'
  if (/Cá nhân|riêng tư|Solo|chỉ mình|kín/i.test(t)) return ' Nhật ký cá nhân — đúng tiêu đề challenge.'
  return ''
}

function outdoorNotes(
  ch: OutdoorChallengeLean,
  km: number,
  mode: 'gps' | 'manual',
  anchorLabel: string,
  sessionLabel: string
): string {
  const base =
    mode === 'gps'
      ? `Ghi GPS (${sessionLabel}): ${km.toFixed(2)} km quanh ${anchorLabel} — ${ch.category}. Lộ trình đủ điểm để hiển thị bản đồ.`
      : `Nhập tay: ${km.toFixed(2)} km — ${ch.category} (không gắn track GPS).`
  return (base + titleFlavorOutdoor(ch.title)).trim()
}

function calculateStreak(completedDays: string[]): number {
  if (completedDays.length === 0) return 0
  const sorted = [...completedDays].sort().reverse()
  const today = toVNDateKey(new Date())
  const yesterdayStr = addVNKeyDays(today, -1)
  let streak = 1
  if (sorted[0] !== today) {
    if (sorted[0] !== yesterdayStr) return 0
  }
  for (let i = 1; i < sorted.length; i++) {
    const diff = vnCalendarDaysBetween(sorted[i - 1], sorted[i])
    if (diff === 1) streak++
    else break
  }
  return streak
}

async function recalculateParticipantOutdoor(ch: OutdoorChallengeLean, userId: mongoose.Types.ObjectId) {
  const participant = await ChallengeParticipantModel.findOne({
    challenge_id: ch._id,
    user_id: userId,
    status: { $ne: 'quit' }
  })
  if (!participant) return

  const allEntries = await ChallengeProgressModel.find({
    challenge_id: ch._id,
    user_id: userId,
    is_deleted: { $ne: true },
    validation_status: { $ne: 'invalid_time' },
    ai_review_valid: { $ne: false }
  })

  const dayMap = new Map<string, number>()
  for (const e of allEntries) {
    const dayStr = toVNDateKey(new Date(e.date))
    dayMap.set(dayStr, (dayMap.get(dayStr) || 0) + (e.value || 0))
  }

  const activeDays = Array.from(dayMap.keys()).sort()
  const completedDays = activeDays.filter((d) => (dayMap.get(d) || 0) >= ch.goal_value)

  participant.active_days = activeDays
  participant.completed_days = completedDays
  participant.current_value = completedDays.length
  participant.streak_count = calculateStreak(completedDays)
  participant.last_activity_at =
    allEntries.length > 0 ? new Date(Math.max(...allEntries.map((e) => new Date(e.date).getTime()))) : null

  const safeStart = new Date(ch.start_date)
  const safeEnd = new Date(ch.end_date)
  safeStart.setHours(0, 0, 0, 0)
  safeEnd.setHours(0, 0, 0, 0)
  const totalRequiredDays = Math.max(1, Math.ceil((safeEnd.getTime() - safeStart.getTime()) / (1000 * 60 * 60 * 24)) + 1)

  if (completedDays.length >= totalRequiredDays) {
    participant.is_completed = true
    participant.completed_at = participant.completed_at || new Date()
    participant.status = 'completed'
  } else {
    participant.is_completed = false
    participant.completed_at = null
    participant.status = 'in_progress'
  }

  await participant.save()
}

type PatternKind =
  | 'perfect'
  | 'skip_days'
  | 'short_distance'
  | 'split_sessions'
  | 'almost_end'
  | 'random_miss'
  | 'mix_manual'
  /** Phần lớn ngày dưới goal; thỉnh thoảng một ngày đủ (vẫn có GPS). */
  | 'chronic_fail'
  /** Theo từng ngày: bỏ hẳn / chưa đủ goal / đủ / vượt — trộn giống người chơi thật. */
  | 'random_daily'

const PATTERNS: PatternKind[] = [
  'perfect',
  'skip_days',
  'short_distance',
  'split_sessions',
  'almost_end',
  'random_miss',
  'mix_manual',
  'chronic_fail',
  'random_daily'
]

/** Mỗi segment sau khi seed đều được gắn ActivityTracking + polyline GPS (insertSession). */
type DayPlan = Array<{ km: number; label: string }>

function planDay(
  goalKm: number,
  pattern: PatternKind,
  dayIndex: number,
  totalDays: number,
  dayKey: string
): DayPlan | null {
  const h = (dayKey + pattern).split('').reduce((a, c) => a + c.charCodeAt(0), 0)

  if (pattern === 'skip_days') {
    const skip = new Set([
      Math.min(totalDays - 1, Math.floor(totalDays * 0.12)),
      Math.min(totalDays - 1, Math.floor(totalDays * 0.42)),
      Math.min(totalDays - 1, Math.floor(totalDays * 0.76))
    ])
    if (skip.has(dayIndex)) return null
    return [{ km: goalKm, label: 'Buổi chính — đủ mục tiêu ngày' }]
  }

  if (pattern === 'short_distance') {
    const fail = dayIndex % 5 === 2
    if (fail) return [{ km: Math.max(0.3, goalKm * 0.55), label: 'Thiếu km soạn seed (dưới goal ngày)' }]
    return [{ km: goalKm + (h % 3) * 0.15, label: 'Đủ / vượt nhẹ mục tiêu' }]
  }

  if (pattern === 'split_sessions') {
    const a = Math.round((goalKm / 2) * 100) / 100
    const b = Math.max(0.1, Math.round((goalKm - a) * 100) / 100)
    return [
      { km: a, label: 'Slot sáng (GPS)' },
      { km: b, label: 'Slot chiều (GPS)' }
    ]
  }

  if (pattern === 'almost_end') {
    if (dayIndex >= totalDays - 2)
      return [{ km: goalKm * 0.5, label: 'Cuối chuỗi — không đạt ngày' }]
    return [{ km: goalKm, label: 'Buổi chính — đủ mục tiêu' }]
  }

  if (pattern === 'random_miss') {
    if (h % 11 === 0) return null
    if (h % 17 === 0) return [{ km: goalKm * 0.62, label: 'Ngẫu nhiên thiếu goal' }]
    return [{ km: goalKm + (h % 4) * 0.08, label: 'Buổi chính — đủ' }]
  }

  if (pattern === 'mix_manual') {
    const pseudoManual = h % 5 === 0
    return [
      {
        km: goalKm,
        label: pseudoManual
          ? 'Có log tay — vẫn kèm track GPS (seed demo)'
          : 'GPS ngoài trời trực tiếp'
      }
    ]
  }

  if (pattern === 'chronic_fail') {
    if (dayIndex % 5 === 0)
      return [{ km: Math.min(goalKm * 1.05, goalKm + 0.4), label: 'Thỉnh thoảng đủ goal' }]
    return [{ km: Math.max(0.25, goalKm * 0.38), label: 'Phần lớn ngày không đạt' }]
  }

  if (pattern === 'random_daily') {
    const h =
      (dayKey + pattern + String(dayIndex)).split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 1000 / 1000
    if (h < 0.11) return null
    if (h < 0.38) return [{ km: Math.max(0.2, goalKm * (0.28 + h * 0.45)), label: 'Chưa đạt goal ngày' }]
    if (h < 0.91) return [{ km: Math.round((goalKm + h * 0.25) * 100) / 100, label: 'Đạt goal ngày' }]
    return [{ km: Math.round(goalKm * (1.04 + h * 0.06) * 100) / 100, label: 'Vượt nhẹ goal' }]
  }

  return [{ km: goalKm + (dayIndex % 3) * 0.1, label: 'Buổi chính — đủ tốt' }]
}

/** Một phiên — chỉ build object, không ghi DB (để insertMany theo lô). */
async function buildSessionPair(
  ch: OutdoorChallengeLean,
  userId: mongoose.Types.ObjectId,
  dayKey: string,
  slotIdx: number,
  pIndex: number,
  dayIdx: number,
  km: number,
  sessionLabel: string,
  anchor: { lat: number; lng: number; label: string },
  profile: SportProfile
): Promise<{ activityDoc: Record<string, unknown> | null; progressDoc: Record<string, unknown> }> {
  const hourVN = 5 + ((dayIdx + slotIdx * 2 + pIndex) % 14)
  const minuteVN = 8 + ((dayIdx * 7 + slotIdx * 11 + pIndex) % 48)
  const endTime = atVN(dayKey, hourVN, minuteVN)
  const durationMin = Math.max(8, Math.round((km / profile.avgKmh) * 60 * (0.95 + (pIndex % 5) * 0.02)))
  const startMs = endTime.getTime() - durationMin * 60 * 1000
  const avgKmh = Math.min(profile.maxKmh, Math.max(2, km / (durationMin / 60)))
  const maxKmh = Math.min(profile.maxKmh, avgKmh * 1.18)
  const kcalPerKm = ch.kcal_per_unit ?? 0
  const kcal = roundKcal(km * (kcalPerKm > 0 ? kcalPerKm : 60))

  let source: 'gps_tracking' | 'manual' = 'manual'
  let activityDoc: Record<string, unknown> | null = null

  if (km > 0) {
    const seed = dayIdx * 1000 + slotIdx * 100 + pIndex * 17
    const jitterLat = anchor.lat + (seed % 7) * 0.0004 - 0.0012
    const jitterLng = anchor.lng + (seed % 5) * 0.0004 - 0.0008
    const bearingDeg = 28 + (seed % 130)
    const avgSpeedMs = avgKmh / 3.6
    const { points, lengthM } = await buildGpsRouteForSeed({
      baseLat: jitterLat,
      baseLng: jitterLng,
      targetKm: km,
      bearingDeg,
      category: ch.category || '',
      startMs,
      endMs: endTime.getTime(),
      avgSpeedMs,
      altBase: profile.altBase,
      altAmp: profile.altAmp,
      seed
    })
    const distM = lengthM > 200 ? lengthM : km * 1000
    const durSec = durationMin * 60
    activityDoc = {
      challengeId: ch._id,
      userId,
      activityType: ch.category || 'Ngoài trời',
      name: `${ch.category} — ${sessionLabel}`,
      status: 'completed',
      startTime: new Date(startMs),
      endTime,
      totalDuration: durSec,
      totalDistance: distM,
      avgSpeed: avgKmh / 3.6,
      maxSpeed: maxKmh / 3.6,
      avgPace: avgKmh > 0 ? 3600 / avgKmh : 0,
      calories: kcal,
      gpsRoute: points,
      pauseIntervals: [],
      source: 'challenge_seed'
    }
    source = 'gps_tracking'
  }

  const notes = outdoorNotes(ch, km, km > 0 ? 'gps' : 'manual', anchor.label, sessionLabel)

  const progressDoc: Record<string, unknown> = {
    challenge_id: ch._id,
    user_id: userId,
    date: endTime,
    challenge_type: 'outdoor_activity',
    value: Math.round(km * 100) / 100,
    unit: ch.goal_unit,
    notes,
    proof_image: '',
    food_name: '',
    ai_review_valid: null,
    ai_review_reason: '',
    distance: Math.round(km * 100) / 100,
    duration_minutes: durationMin,
    avg_speed: Math.round(avgKmh * 10) / 10,
    calories: kcal,
    workout_session_id: null,
    exercises_count: null,
    completed_exercises: [],
    source,
    activity_id: null,
    validation_status: 'valid',
    is_deleted: false
  }

  return { activityDoc, progressDoc }
}

/** Ghi theo lô: 2 round-trip Mongo thay vì 2 × N lần create. */
async function flushParticipantSessions(
  activityDocs: Record<string, unknown>[],
  progressRows: { doc: Record<string, unknown>; activityIndex: number | null }[]
) {
  if (progressRows.length === 0) return
  let insertedIds: mongoose.Types.ObjectId[] = []
  if (activityDocs.length > 0) {
    const inserted = await ActivityTrackingModel.insertMany(activityDocs, { ordered: true })
    insertedIds = inserted.map((d) => d._id as mongoose.Types.ObjectId)
  }
  for (const row of progressRows) {
    if (row.activityIndex != null && insertedIds[row.activityIndex]) {
      row.doc.activity_id = insertedIds[row.activityIndex]
    }
  }
  await ChallengeProgressModel.insertMany(progressRows.map((r) => r.doc))
}

async function main() {
  if (!MONGODB_URL) {
    console.error('Thiếu MONGODB_URL trong .env')
    process.exit(1)
  }

  const t0 = Date.now()
  await mongoose.connect(MONGODB_URL)
  console.log('Đã kết nối MongoDB')
  console.log(
    `GPS: SEED_SKIP_OSRM=${process.env.SEED_SKIP_OSRM || '(unset)'} (1 = bỏ OSRM) | OSRM_DELAY_MS=${process.env.OSRM_DELAY_MS ?? '90'}`
  )

  const asOf = process.env.SEED_OUTDOOR_AS_OF ? new Date(process.env.SEED_OUTDOOR_AS_OF) : new Date()
  const lastVN = toVNDateKey(asOf)

  const outdoorQuery: Record<string, unknown> = {
    challenge_type: 'outdoor_activity',
    is_deleted: { $ne: true }
  }
  if (!SEED_ALL_OUTDOOR) {
    outdoorQuery.description = new RegExp(`${SEED_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`)
  }

  const outdoorChallenges = await ChallengeModel.find(outdoorQuery).lean()

  if (outdoorChallenges.length === 0) {
    console.log(
      SEED_ALL_OUTDOOR
        ? 'Không có thử thách outdoor_activity nào trong DB.'
        : 'Không có thử thách ngoài trời seed (marker ‖fedacn-seed‖). Gợi ý: SEED_OUTDOOR_ALL=1 để seed mọi challenge outdoor.'
    )
    await mongoose.disconnect()
    return
  }

  const chIds = outdoorChallenges.map((c) => c._id as mongoose.Types.ObjectId)

  if (REPLACE) {
    const rows = await ChallengeProgressModel.find({
      challenge_id: { $in: chIds },
      challenge_type: 'outdoor_activity',
      activity_id: { $ne: null }
    })
      .select('activity_id')
      .lean()
    const actIds = [...new Set(rows.map((r: { activity_id?: unknown }) => r.activity_id).filter(Boolean))]
    const delP = await ChallengeProgressModel.deleteMany({ challenge_id: { $in: chIds }, challenge_type: 'outdoor_activity' })
    console.log(`Đã xóa ${delP.deletedCount} challenge_progress outdoor`)
    if (actIds.length) {
      const delA = await ActivityTrackingModel.deleteMany({ _id: { $in: actIds } })
      console.log(`Đã xóa ${delA.deletedCount} activity_tracking liên quan`)
    }
  }

  let sessions = 0
  let progressRows = 0

  for (const raw of outdoorChallenges) {
    const ch = raw as unknown as OutdoorChallengeLean
    const unit = String(ch.goal_unit || 'km').toLowerCase()
    if (unit !== 'km') {
      console.warn(
        `Bỏ qua "${ch.title}" (${String(ch._id)}): goal_unit="${ch.goal_unit}" — seed outdoor chỉ ghi progress theo km/ngày.`
      )
      continue
    }
    const goalKm = ch.goal_value
    const anchor = anchorForCategory(ch.category || '')
    const profile = sportProfile(ch.category || '')

    const firstKey = toVNDateKey(new Date(ch.start_date))
    let endKey = toVNDateKey(new Date(ch.end_date))
    if (endKey > lastVN) endKey = lastVN
    if (firstKey > endKey) continue

    const dayKeys = enumerateVNKeys(firstKey, endKey)
    const totalDays = dayKeys.length

    const parts = await ChallengeParticipantModel.find({
      challenge_id: ch._id,
      status: { $ne: 'quit' }
    })
      .sort({ joined_at: 1 })
      .limit(MAX_USERS)
      .lean()

    console.log(`→ "${ch.title}" (${String(ch._id)}): ${parts.length} người × ${totalDays} ngày — ghi theo lô (insertMany)`)

    let pIndex = 0
    for (const p of parts) {
      /** Mỗi người một “kiểu chơi” ngẫu nhiên → có ngày đủ goal, có ngày thiếu / bỏ */
      const pattern = PATTERNS[Math.floor(Math.random() * PATTERNS.length)]
      pIndex++
      const uid = p.user_id as mongoose.Types.ObjectId
      const tUser = Date.now()

      const activityDocs: Record<string, unknown>[] = []
      const batchProgress: { doc: Record<string, unknown>; activityIndex: number | null }[] = []

      for (let dayIdx = 0; dayIdx < dayKeys.length; dayIdx++) {
        const dayKey = dayKeys[dayIdx]
        const plan = planDay(goalKm, pattern, dayIdx, totalDays, dayKey)
        if (!plan) continue

        let slot = 0
        for (const seg of plan) {
          const pair = await buildSessionPair(ch, uid, dayKey, slot, pIndex, dayIdx, seg.km, seg.label, anchor, profile)
          let activityIndex: number | null = null
          if (pair.activityDoc) {
            activityIndex = activityDocs.length
            activityDocs.push(pair.activityDoc)
          }
          batchProgress.push({ doc: pair.progressDoc, activityIndex })
          progressRows++
          if (seg.km > 0) sessions++
          slot++
        }
      }

      await flushParticipantSessions(activityDocs, batchProgress)
      await recalculateParticipantOutdoor(ch, uid)
      console.log(
        `   [${pIndex}/${parts.length}] user ${String(uid).slice(-6)}… ${batchProgress.length} progress, ${activityDocs.length} activity — ${((Date.now() - tUser) / 1000).toFixed(1)}s`
      )
    }
  }

  console.log(`Đã tạo ~${sessions} activity GPS + ${progressRows} challenge_progress outdoor.`)
  console.log(`Thời gian chạy: ${((Date.now() - t0) / 1000).toFixed(1)} giây`)
  await mongoose.disconnect()
  console.log('Đã ngắt kết nối.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
