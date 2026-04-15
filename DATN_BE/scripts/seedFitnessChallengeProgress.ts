/**
 * Seed tiến độ thử thách tập luyện (fitness): ghi challenge_progress + workout_sessions,
 * từ ngày bắt đầu thử thách đến “hôm nay” (VN), nhiều kiểu người (đủ ngày / miss ngày / miss bài / gần đủ).
 *
 * Cách hoạt động (đối chiếu FE + BE):
 * - FE: Challenge fitness → FitnessCheckinModal điều hướng /training với challengeExercises;
 *   khi hoàn tất buổi tập, gọi addChallengeProgress với completed_exercises + workout_session_id (Training.jsx).
 * - BE (challenge.services addProgress): mỗi ngày (timezone VN) tính todaySum = số exercise_id KHÁC NHAU
 *   có completed: true trong completed_exercises của mọi progress entry trong ngày đó.
 *   Nếu todaySum >= challenge.goal_value → ngày đó được thêm vào completed_days.
 *   Hoàn thành thử thách khi completed_days.length >= totalRequiredDays (theo start_date/end_date).
 *
 * Chạy sau: npm run seed:challenges && npm run seed:challenge-participants
 *   npm run seed:fitness-progress
 *
 * Ghi đè:
 *   SEED_FITNESS_REPLACE=1 npm run seed:fitness-progress
 *
 * Neo “đến nay”:
 *   SEED_FITNESS_AS_OF=2026-04-12 npm run seed:fitness-progress
 */
import mongoose from 'mongoose'
import { config } from 'dotenv'
import path from 'path'

import ChallengeModel from '../src/models/schemas/challenge.schema'
import ChallengeProgressModel from '../src/models/schemas/challengeProgress.schema'
import ChallengeParticipantModel from '../src/models/schemas/challengeParticipant.schema'
import WorkoutSessionModel from '../src/models/schemas/workoutSession.schema'

config({ path: path.join(__dirname, '../.env') })

const MONGODB_URL = process.env.MONGODB_URL || ''
const REPLACE = process.env.SEED_FITNESS_REPLACE === '1' || process.env.SEED_FITNESS_REPLACE === 'true'
const SEED_MARKER = '\n\n‖fedacn-seed‖'
const MAX_USERS = Math.max(6, parseInt(process.env.SEED_FITNESS_MAX_USERS_PER_CHALLENGE || '24', 10) || 24)

type ExBlock = { exercise_id: mongoose.Types.ObjectId; exercise_name: string }

type FitnessChallengeLean = {
  _id: mongoose.Types.ObjectId
  title: string
  category: string
  challenge_type: string
  goal_type: string
  goal_value: number
  goal_unit: string
  start_date: Date
  end_date: Date
  exercises: ExBlock[]
}

function toVNDateKey(d: Date): string {
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' })
}

function addOneVNKey(key: string): string {
  const t = new Date(`${key}T12:00:00+07:00`)
  t.setDate(t.getDate() + 1)
  return toVNDateKey(t)
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

function titleFlavorFitness(title: string): string {
  const t = title || ''
  if (/Tháng 4 săn form|cộng đồng 30 ngày/i.test(t)) return ' Đúng vibe “tháng 4 săn form” trong tiêu đề.'
  if (/Rủ hội|gym bro|wholesome|meme/i.test(t)) return ' Nhóm tập vui — đúng bản challenge bạn bè.'
  if (/Training kín|không cần khoe PR|nhật ký riêng/i.test(t)) return ' Nhật ký tập kín như tiêu đề thử thách.'
  return ''
}

function workoutNotes(ch: FitnessChallengeLean, exNames: string[], allCompleted: boolean): string {
  const names = exNames.join(', ')
  const base = allCompleted
    ? `Buổi tập từ Training — hoàn thành bài chủ đạo: ${names}. Khởi động + hạ nhiệt đủ như mô tả thử thách.`
    : `Buổi tập từ Training — log bài ${names} (một phần set chưa hoàn thành / bỏ qua), không đủ điều kiện tính ngày đạt mục tiêu.`
  return (base + titleFlavorFitness(ch.title)).trim()
}

function calculateStreak(completedDays: string[]): number {
  if (completedDays.length === 0) return 0
  const sorted = [...completedDays].sort().reverse()
  const vnOffset = 7 * 60 * 60 * 1000
  const now = new Date()
  const vnNow = new Date(now.getTime() + vnOffset)
  const today = vnNow.toISOString().split('T')[0]
  const vnYesterday = new Date(now.getTime() + vnOffset - 24 * 60 * 60 * 1000)
  const yesterdayStr = vnYesterday.toISOString().split('T')[0]

  let streak = 1
  if (sorted[0] !== today) {
    if (sorted[0] !== yesterdayStr) return 0
  }
  for (let i = 1; i < sorted.length; i++) {
    const cur = new Date(sorted[i - 1])
    const prev = new Date(sorted[i])
    const diff = Math.round((cur.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000))
    if (diff === 1) streak++
    else break
  }
  return streak
}

async function recalculateParticipantFitness(ch: FitnessChallengeLean, userId: mongoose.Types.ObjectId) {
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

  const vnOffset = 7 * 60 * 60 * 1000
  const dayExerciseMap = new Map<string, Set<string>>()
  const dayMap = new Map<string, number>()

  for (const e of allEntries) {
    const vnDate = new Date(new Date(e.date).getTime() + vnOffset)
    const dayStr = vnDate.toISOString().split('T')[0]
    if (!dayExerciseMap.has(dayStr)) dayExerciseMap.set(dayStr, new Set())
    const exSet = dayExerciseMap.get(dayStr)!
    for (const ce of e.completed_exercises || []) {
      if (ce.completed) exSet.add(ce.exercise_id.toString())
    }
    dayMap.set(dayStr, exSet.size)
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
  | 'logged_but_not_completed'
  | 'almost_end'
  | 'random_light_miss'
  | 'partial_exercises'

const PATTERNS: PatternKind[] = [
  'perfect',
  'skip_days',
  'logged_but_not_completed',
  'almost_end',
  'random_light_miss',
  'partial_exercises'
]

function shouldLogWorkout(
  pattern: PatternKind,
  dayIndex: number,
  totalDays: number,
  dayKey: string
): 'skip' | 'full_pass' | 'logged_fail' | 'partial_if_multi' {
  if (pattern === 'skip_days') {
    const skipIdx = new Set([
      Math.min(totalDays - 1, Math.floor(totalDays * 0.12)),
      Math.min(totalDays - 1, Math.floor(totalDays * 0.44)),
      Math.min(totalDays - 1, Math.floor(totalDays * 0.78))
    ])
    if (skipIdx.has(dayIndex)) return 'skip'
    return 'full_pass'
  }
  if (pattern === 'logged_but_not_completed') {
    const failIdx = new Set([
      Math.min(totalDays - 1, Math.floor(totalDays * 0.25)),
      Math.min(totalDays - 1, Math.floor(totalDays * 0.55))
    ])
    if (failIdx.has(dayIndex)) return 'logged_fail'
    return 'full_pass'
  }
  if (pattern === 'almost_end') {
    if (dayIndex >= totalDays - 2) return 'logged_fail'
    return 'full_pass'
  }
  if (pattern === 'random_light_miss') {
    const h = (dayKey + pattern).split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    if (h % 10 === 0) return 'skip'
    if (h % 13 === 0) return 'logged_fail'
    return 'full_pass'
  }
  if (pattern === 'partial_exercises') {
    if (dayIndex % 6 === 0) return 'logged_fail'
    return 'partial_if_multi'
  }
  return 'full_pass'
}

function buildCompletedExercises(
  blocks: ExBlock[],
  mode: 'full_pass' | 'logged_fail' | 'partial_if_multi'
): { list: Array<{ exercise_id: mongoose.Types.ObjectId; exercise_name: string; completed: boolean }>; allCompleted: boolean } {
  if (mode === 'logged_fail') {
    return {
      list: blocks.map((b) => ({
        exercise_id: new mongoose.Types.ObjectId(b.exercise_id),
        exercise_name: b.exercise_name,
        completed: false
      })),
      allCompleted: false
    }
  }
  if (mode === 'partial_if_multi' && blocks.length >= 2) {
    return {
      list: blocks.map((b, i) => ({
        exercise_id: new mongoose.Types.ObjectId(b.exercise_id),
        exercise_name: b.exercise_name,
        completed: i < blocks.length - 1
      })),
      allCompleted: false
    }
  }
  return {
    list: blocks.map((b) => ({
      exercise_id: new mongoose.Types.ObjectId(b.exercise_id),
      exercise_name: b.exercise_name,
      completed: true
    })),
    allCompleted: true
  }
}

async function createWorkoutSession(
  userId: mongoose.Types.ObjectId,
  blocks: ExBlock[],
  finishedAt: Date,
  durationMin: number,
  calories: number,
  category: string
): Promise<mongoose.Types.ObjectId> {
  const exercises = blocks.map((ex) => ({
    exercise_id: new mongoose.Types.ObjectId(ex.exercise_id),
    exercise_name: ex.exercise_name,
    sets: [
      { set_number: 1, reps: 12, weight: 0, calories_per_unit: 10, completed: true, skipped: false },
      { set_number: 2, reps: 10, weight: 0, calories_per_unit: 10, completed: true, skipped: false }
    ]
  }))
  const started = new Date(finishedAt.getTime() - durationMin * 60 * 1000)
  const row = await WorkoutSessionModel.create({
    user_id: userId,
    started_at: started,
    finished_at: finishedAt,
    equipment_used: [],
    muscles_targeted: category ? [category] : ['Toàn thân'],
    exercises,
    total_volume: 0,
    total_sets: exercises.length * 2,
    total_reps: exercises.length * 22,
    total_calories: calories,
    total_skipped_sets: 0,
    duration_minutes: durationMin,
    status: 'completed'
  })
  return row._id as mongoose.Types.ObjectId
}

async function main() {
  if (!MONGODB_URL) {
    console.error('Thiếu MONGODB_URL trong .env')
    process.exit(1)
  }

  await mongoose.connect(MONGODB_URL)
  console.log('Đã kết nối MongoDB')

  const asOf = process.env.SEED_FITNESS_AS_OF ? new Date(process.env.SEED_FITNESS_AS_OF) : new Date()
  const lastVN = toVNDateKey(asOf)

  const fitnessChallenges = await ChallengeModel.find({
    challenge_type: 'fitness',
    is_deleted: { $ne: true },
    description: new RegExp(`${SEED_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`)
  }).lean()

  if (fitnessChallenges.length === 0) {
    console.log('Không có thử thách fitness seed (marker ‖fedacn-seed‖). Chạy seed:challenges trước.')
    await mongoose.disconnect()
    return
  }

  const chIds = fitnessChallenges.map((c) => c._id as mongoose.Types.ObjectId)

  if (REPLACE) {
    const existing = await ChallengeProgressModel.find({
      challenge_id: { $in: chIds },
      challenge_type: 'fitness',
      workout_session_id: { $ne: null }
    })
      .select('workout_session_id')
      .lean()
    const sessionIds = [...new Set(existing.map((x: { workout_session_id?: unknown }) => x.workout_session_id).filter(Boolean))]
    const delP = await ChallengeProgressModel.deleteMany({ challenge_id: { $in: chIds }, challenge_type: 'fitness' })
    console.log(`Đã xóa ${delP.deletedCount} challenge_progress fitness (SEED_FITNESS_REPLACE=1)`)
    if (sessionIds.length) {
      const delS = await WorkoutSessionModel.deleteMany({ _id: { $in: sessionIds } })
      console.log(`Đã xóa ${delS.deletedCount} workout_sessions gắn seed cũ`)
    }
  }

  let insertedProg = 0
  let insertedSess = 0

  for (const raw of fitnessChallenges) {
    const ch = raw as unknown as FitnessChallengeLean
    const blocks: ExBlock[] = (ch.exercises || []).map((e: any) => ({
      exercise_id: new mongoose.Types.ObjectId(String(e.exercise_id)),
      exercise_name: String(e.exercise_name || 'Bài tập')
    }))

    if (blocks.length === 0) {
      console.warn('Bỏ qua challenge không có exercises:', ch.title)
      continue
    }

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

    let pIndex = 0
    for (const p of parts) {
      const pattern = PATTERNS[pIndex % PATTERNS.length]
      pIndex++
      const uid = p.user_id as mongoose.Types.ObjectId

      for (let dayIdx = 0; dayIdx < dayKeys.length; dayIdx++) {
        const dayKey = dayKeys[dayIdx]
        const logKind = shouldLogWorkout(pattern, dayIdx, totalDays, dayKey)
        if (logKind === 'skip') continue

        const mode =
          logKind === 'full_pass'
            ? 'full_pass'
            : logKind === 'logged_fail'
              ? 'logged_fail'
              : logKind === 'partial_if_multi'
                ? 'partial_if_multi'
                : 'full_pass'

        const { list: completed_exercises, allCompleted } = buildCompletedExercises(blocks, mode)
        const numCompleted = completed_exercises.filter((x) => x.completed).length
        const hourVN = 6 + ((dayIdx + pIndex) % 14)
        const minuteVN = 10 + ((dayIdx * 3 + pIndex) % 45)
        const finishedAt = atVN(dayKey, hourVN, minuteVN)
        const durationMin = 25 + ((dayIdx + pIndex) % 35)
        const calories = 80 + ((dayIdx * 17 + pIndex * 11) % 220)

        const sessionId = await createWorkoutSession(uid, blocks, finishedAt, durationMin, calories, ch.category || '')
        insertedSess++

        await ChallengeProgressModel.create({
          challenge_id: ch._id,
          user_id: uid,
          date: finishedAt,
          challenge_type: 'fitness',
          value: numCompleted > 0 ? numCompleted : 1,
          unit: ch.goal_unit,
          notes: workoutNotes(
            ch,
            blocks.map((b) => b.exercise_name),
            allCompleted
          ),
          proof_image: '',
          food_name: '',
          ai_review_valid: null,
          ai_review_reason: '',
          distance: null,
          duration_minutes: durationMin,
          avg_speed: null,
          calories,
          workout_session_id: sessionId,
          exercises_count: blocks.length,
          completed_exercises,
          source: 'workout_session',
          activity_id: null,
          validation_status: 'valid',
          is_deleted: false
        })
        insertedProg++
      }

      await recalculateParticipantFitness(ch, uid)
    }
  }

  console.log(`Đã tạo ${insertedSess} workout_sessions và ${insertedProg} challenge_progress fitness.`)
  await mongoose.disconnect()
  console.log('Đã ngắt kết nối.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
