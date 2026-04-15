/**
 * Ghi check-in dinh dưỡng (challenge_progress) từ ngày bắt đầu thử thách đến “hôm nay” (VN),
 * kèm ảnh món + ai_review_valid / ai_review_reason. Tên món & ghi chú bám theo tiêu đề / chủ đề thử thách.
 *
 * Chạy sau: seed:challenges + seed:challenge-participants
 *   npm run seed:nutrition-progress
 *
 * Ghi đè progress dinh dưỡng seed cũ:
 *   SEED_NUTRITION_REPLACE=1 npm run seed:nutrition-progress
 *
 * Neo thời điểm “đến nay” (ISO), mặc định = thời điểm chạy script:
 *   SEED_NUTRITION_AS_OF=2026-04-12 npm run seed:nutrition-progress
 */
import mongoose from 'mongoose'
import { config } from 'dotenv'
import path from 'path'

import ChallengeModel from '../src/models/schemas/challenge.schema'
import ChallengeProgressModel from '../src/models/schemas/challengeProgress.schema'
import ChallengeParticipantModel from '../src/models/schemas/challengeParticipant.schema'

config({ path: path.join(__dirname, '../.env') })

const MONGODB_URL = process.env.MONGODB_URL || ''
const REPLACE = process.env.SEED_NUTRITION_REPLACE === '1' || process.env.SEED_NUTRITION_REPLACE === 'true'
const SEED_MARKER = '\n\n‖fedacn-seed‖'
const MAX_USERS = Math.max(6, parseInt(process.env.SEED_NUTRITION_MAX_USERS_PER_CHALLENGE || '24', 10) || 24)

const MEAL_IMAGES = [
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=900&q=85',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=900&q=85',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=900&q=85',
  'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=900&q=85',
  'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=900&q=85',
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=900&q=85',
  'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=900&q=85',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=900&q=85'
] as const

type ChallengeLean = {
  _id: mongoose.Types.ObjectId
  title: string
  category: string
  challenge_type: string
  goal_type: string
  goal_value: number
  goal_unit: string
  nutrition_sub_type?: string
  time_window_start?: string | null
  time_window_end?: string | null
  start_date: Date
  end_date: Date
  description?: string
}

type MealDef = { food_name: string; notes: string; hourVN: number; minuteVN: number }

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

/** Bám biến thể tiêu đề (công khai / bạn bè / riêng tư) của cùng một chủ đề. */
function titleFlavor(title: string): string {
  const t = title || ''
  if (/bếp nhà|thắng delivery/i.test(t)) return ' Đúng tinh thần “bếp nhà thắng delivery” trong tiêu đề thử thách.'
  if (/Nhóm bạn|Squad|hội|Team|rủ hội|Cùng bạn|Cùng nhau/i.test(t))
    return ' Phù hợp bản challenge cho nhóm bạn — log minh bạch, không toxic diet.'
  if (/Riêng tư|cá nhân|kín|một mình|chỉ mình/i.test(t))
    return ' Nhật ký riêng như tiêu đề thử thách — món thật, không sống ảo.'
  if (/Breakfast club|Khung sáng|7h|10h|trước 10h/i.test(t))
    return ' Trong khung sáng 7h–10h (giờ VN) như tiêu đề thử thách.'
  if (/2000\s*kcal|TDEE|Team 2000/i.test(t)) return ' Bám mục tiêu ~2000 kcal/ngày trong tiêu đề thử thách.'
  if (/Ngày chuẩn|nhật ký ăn uống|check-in.*ngày/i.test(t))
    return ' Một dấu mỗi ngày đạt chuẩn — đúng “Ngày chuẩn dinh dưỡng” trong tiêu đề.'
  return ''
}

/** Nội dung món ăn bám chủ đề thử thách (category / goal / tiêu đề). */
function mealDefsForChallenge(ch: ChallengeLean, slotIndex: number, dayKey: string): MealDef {
  const title = (ch.title || '').toLowerCase()
  const cat = ch.category || ''
  const seed = (dayKey + slotIndex).split('').reduce((a, c) => a + c.charCodeAt(0), 0)

  const pick = <T,>(arr: T[]) => arr[seed % arr.length]

  // —— Theo dõi dinh dưỡng: phân nhánh theo goal_type ——
  if (cat === 'Theo dõi dinh dưỡng') {
    if (ch.goal_type === 'kcal_target') {
      const meals: MealDef[] = [
        {
          food_name: 'Bữa sáng ~650 kcal: phở tái bò + rau thêm',
          notes:
            'Gần mục tiêu 2000 kcal/ngày — palm protein + fist carb; không dồn calo tối. Đúng tinh thần challenge kiểm soát TDEE trong tiêu đề thử thách.',
          hourVN: 7,
          minuteVN: 20
        },
        {
          food_name: 'Bữa trưa ~700 kcal: cơm tấm sườn nướng, bì chả, dưa chua',
          notes:
            'Ước lượng ~700 kcal; giữ tổng ngày quanh 2000 như “Mục tiêu 2000 kcal/ngày” — linh hoạt macro, cứng calo.',
          hourVN: 12,
          minuteVN: 15
        },
        {
          food_name: 'Bữa tối ~650 kcal: cá lóc kho tộ, rau luộc, cơm gạo lứt',
          notes:
            'Khép ngày đủ nhóm chất; tổng ba bữa ~2000 kcal phù hợp mô tả thử thách (không nhịn để dồn tối).',
          hourVN: 18,
          minuteVN: 45
        }
      ]
      return meals[slotIndex % meals.length]
    }
    if (ch.goal_type === 'days_completed') {
      return {
        food_name: 'Check-in “ngày chuẩn dinh dưỡng”: tổng hợp 3 bữa + đủ nước',
        notes:
          'Hôm nay đạt chuẩn tự đặt như thử thách: đủ 3 bữa thật, ~2L nước lọc, hạn chế đồ siêu chế biến — log một lần minh bạch như mô tả “Ngày chuẩn dinh dưỡng”.',
        hourVN: 20,
        minuteVN: 30
      }
    }
    if (ch.nutrition_sub_type === 'time_window' && ch.goal_type === 'meals_logged') {
      const pair: MealDef[] = [
        {
          food_name: 'Cà phê đen / cold brew không đường + bánh mì ốp la pate nhẹ',
          notes:
            'Check-in trong khung 7h–10h (giờ VN) như “Breakfast club” / khung sáng trong tiêu đề — protein sáng tránh “crash” 11h.',
          hourVN: 7,
          minuteVN: 35
        },
        {
          food_name: 'Phở gà / bún riêu không thêm đường — bữa chính buổi sáng',
          notes:
            'Bữa thứ 2 trước 10h; đúng yêu cầu 2 bữa log trong khung sáng của thử thách (ảnh rõ món + bối cảnh bữa sáng).',
          hourVN: 9,
          minuteVN: 10
        }
      ]
      return pair[slotIndex % pair.length]
    }
  }

  // —— 7 chủ đề NUTRITION_THEMES ——
  if (cat === 'Ăn sạch' || title.includes('bếp nhà') || title.includes('ăn sạch')) {
    const opts: MealDef[] = [
      {
        food_name: 'Cháo yến mạch, trứng luộc, cà chua bi — bữa sáng bếp nhà',
        notes:
          'Ưu tiên rau + đạm lean như mô tả “bếp nhà thắng delivery” / reset ăn sạch — ít dầu, no cảm giác vừa (~7/10).',
        hourVN: 7,
        minuteVN: 15
      },
      {
        food_name: 'Cơm nhà: cá thu kho cà, rau luộc cải ngọt, canh chua nhẹ',
        notes:
          'Bữa trưa “ăn sạch có chủ đích”: tinh bột vừa phải, không chiên nhiều — phù hợp spirit challenge trong tiêu đề.',
        hourVN: 12,
        minuteVN: 20
      },
      {
        food_name: 'Ức gà áp chảo, salad dầu olive, khoai lang hấp',
        notes:
          'Tối nhẹ bếp nhà; ghi nhận portion thật — đúng hướng dẫn log 3 bữa/ngày của thử thách ăn sạch.',
        hourVN: 18,
        minuteVN: 50
      }
    ]
    return opts[slotIndex % opts.length]
  }

  if (cat === 'Giảm cân' || title.includes('cut nhẹ') || title.includes('giảm cân')) {
    const opts: MealDef[] = [
      {
        food_name: 'Sữa chua Hy Lạp không đường, hạt óc chó, dâu tây',
        notes:
          'Cut nhẹ / deficit thông minh: protein + chất xơ buổi sáng — không bỏ bữa (đúng lời khuyên trong mô tả thử thách giảm cân).',
        hourVN: 7,
        minuteVN: 30
      },
      {
        food_name: 'Salad ức gà nướng, đậu đen, sốt mù tạt mật ong ít calo',
        notes:
          'Bữa trưa low-cal thật (không body shame) — phù hợp “Squad giảm cân” / hành trình cá nhân trong tiêu đề challenge.',
        hourVN: 12,
        minuteVN: 10
      },
      {
        food_name: 'Cá điêu hồng hấp gừng, súp nấm, rau cải xào tỏi',
        notes:
          'Tối no lâu, ít dầu; ghi chú cảm giác thèm ăn đêm nếu có — như gợi ý trong phần mô tả thử thách.',
        hourVN: 18,
        minuteVN: 40
      }
    ]
    return opts[slotIndex % opts.length]
  }

  if (cat === 'Detox nhẹ' || title.includes('detox')) {
    const opts: MealDef[] = [
      {
        food_name: 'Cháo rau củ, trà xanh không đường',
        notes:
          'Detox nhẹ kiểu “bác sĩ không cấm”: nhiều nước, ít chiên — không juice ép sẵn đường, đúng mô tả thử thách.',
        hourVN: 7,
        minuteVN: 45
      },
      {
        food_name: 'Cơm gạo lứt, đậu hũ sốt cà chua, rau luộc thập cẩm',
        notes:
          'Trưa nhiều chất xơ whole food; tránh đồ chiên — bám “nhiều rau xanh, trái cây nguyên quả” trong spirit challenge.',
        hourVN: 12,
        minuteVN: 25
      },
      {
        food_name: 'Canh bí đao thịt bằm, salad dưa leo, táo hoặc bưởi nguyên miếng',
        notes:
          'Tối thanh, whole fruit — không sugar bomb; phù hợp detox nhẹ / reset sau Tết trong tiêu đề.',
        hourVN: 18,
        minuteVN: 55
      }
    ]
    return opts[slotIndex % opts.length]
  }

  if (cat === 'Chay' || title.includes('chay')) {
    const opts: MealDef[] = [
      {
        food_name: 'Phở chay nấm hương, đậu hũ non, rau thơm',
        notes:
          'Ăn chay có kế hoạch: đủ đạm thực vật — không chỉ rau + cơm trắng (đúng mô tả thử thách chay).',
        hourVN: 7,
        minuteVN: 25
      },
      {
        food_name: 'Cơm chay: chả chay từ nấm + đậu, canh rong biển đậu hũ',
        notes:
          'Trưa chay flexitarian: tempeh/đậu — tránh chay giả nhiều dầu như cảnh báo trong challenge.',
        hourVN: 12,
        minuteVN: 5
      },
      {
        food_name: 'Bún riêu chay đậu hũ, rau muống luộc, đậu phộng rang',
        notes:
          'Tối đủ B12 qua supplement (ngoài bữa); log minh bạch — phù hợp “30 ngày chay” / nhóm chay trong tiêu đề.',
        hourVN: 18,
        minuteVN: 35
      }
    ]
    return opts[slotIndex % opts.length]
  }

  if (cat === 'Ít đường' || title.includes('sugar') || title.includes('đường')) {
    const opts: MealDef[] = [
      {
        food_name: 'Bánh mì thịt nướng rau dưa, trà đá chanh không đường',
        notes:
          'Sugar-aware: không nước ngọt có ga; đồ uống minh bạch — đúng “cắt đồ ngọt thừa” / team bỏ nước ngọt trong mô tả challenge.',
        hourVN: 7,
        minuteVN: 40
      },
      {
        food_name: 'Cơm tấm bì chả — sốt không thêm đường, thêm dưa chua',
        notes:
          'Trưa tránh “đường ẩn” trong sốt; đọc nhãn tương tự gợi ý trong tiêu đề thử thách ít đường.',
        hourVN: 12,
        minuteVN: 30
      },
      {
        food_name: 'Sữa chua không đường + hạt chia, dưa hấu',
        notes:
          'Tối ngọt nhẹ từ trái cây whole; không dessert kem đường — phù hợp giảm đường / craving note trong mô tả.',
        hourVN: 19,
        minuteVN: 0
      }
    ]
    return opts[slotIndex % opts.length]
  }

  if (cat === 'Tăng cơ' || title.includes('bulk') || title.includes('tăng cơ')) {
    const four: MealDef[] = [
      {
        food_name: 'Pre-gym: chuối + 2 lát bánh mì nguyên cám, cafe đen',
        notes:
          'Bulk sạch mini: carb quanh buổi tập như mô tả “pre + post workout” trong tiêu đề thử thách tăng cơ.',
        hourVN: 6,
        minuteVN: 45
      },
      {
        food_name: 'Post-workout: cơm gà nướng cơm gạo, dưa chuột',
        notes:
          'Đạm cao sau tập; chia đều protein các bữa — đúng “4 bữa log/ngày” và tinh thần gym-bếp trong challenge.',
        hourVN: 8,
        minuteVN: 30
      },
      {
        food_name: 'Trưa meal prep: thịt heo nạc xào ớt chuông + cơm + rau',
        notes:
          'Lean gain: whole food, không lạm shake — phù hợp “Hội gym-bếp” / lean gain trong mô tả thử thách.',
        hourVN: 12,
        minuteVN: 15
      },
      {
        food_name: 'Tối: cá hồi áp chảo, khoai lang, salad cà chua dưa leo',
        notes:
          'Khép 4 bữa đủ calo + đạm; ngủ đủ để tối ưu gain — nhắc đúng phần mô tả challenge tăng cơ.',
        hourVN: 19,
        minuteVN: 15
      }
    ]
    return four[slotIndex % four.length]
  }

  if (cat === 'Cân bằng' || title.includes('harvard') || title.includes('cân bằng')) {
    const opts: MealDef[] = [
      {
        food_name: 'Đĩa sáng cân bằng: yến mạch, sữa, trái cây + hạt',
        notes:
          'Gần tỉ lệ Harvard 1/2 rau-trái, 1/4 đạm, 1/4 tinh bột — đúng “Đĩa cân bằng Harvard-style” trong tiêu đề.',
        hourVN: 7,
        minuteVN: 50
      },
      {
        food_name: 'Cơm tấm “rainbow”: sườn + dưa chua + cải chíp luộc + cà pháo',
        notes:
          'Trưa ≥3 màu rau như “Rainbow plate” / ăn đủ nhóm chất trong mô tả challenge cân bằng.',
        hourVN: 12,
        minuteVN: 40
      },
      {
        food_name: 'Phở bò tái + thêm rau húng giá — chỉnh phần bánh ít hơn',
        notes:
          'Tối linh hoạt ngoài hàng nhưng nhận thức phần ăn — đúng hướng dẫn “áp dụng cơm tấm, phở” trong thử thách.',
        hourVN: 18,
        minuteVN: 25
      }
    ]
    return opts[slotIndex % opts.length]
  }

  // Fallback: dinh dưỡng chung — dẫn chi tiết tiêu đề
  const shortTitle = (ch.title || 'Thử thách dinh dưỡng').slice(0, 100)
  return {
    food_name: pick(['Cơm nhà thập cẩm', 'Bún chả ít mỡ', 'Salad trộn đậu']),
    notes: `Món thật, ảnh rõ — log cho thử thách: “${shortTitle}”.`,
    hourVN: [7, 12, 18][slotIndex % 3],
    minuteVN: 10 + (seed % 40)
  }
}

function notesForChallenge(ch: ChallengeLean, defNotes: string): string {
  return (defNotes + titleFlavor(ch.title)).trim()
}

function calculateStreak(sortedCompletedDays: string[]): number {
  if (sortedCompletedDays.length === 0) return 0
  const sorted = [...sortedCompletedDays].sort().reverse()
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

async function recalculateParticipant(challenge: ChallengeLean, userId: mongoose.Types.ObjectId) {
  const participant = await ChallengeParticipantModel.findOne({
    challenge_id: challenge._id,
    user_id: userId,
    status: { $ne: 'quit' }
  })
  if (!participant) return

  const allEntries = await ChallengeProgressModel.find({
    challenge_id: challenge._id,
    user_id: userId,
    is_deleted: { $ne: true },
    validation_status: { $ne: 'invalid_time' },
    ai_review_valid: { $ne: false }
  })

  const vnOffset = 7 * 60 * 60 * 1000
  const dayMap = new Map<string, number>()
  for (const e of allEntries) {
    const vnDate = new Date(new Date(e.date).getTime() + vnOffset)
    const dayStr = vnDate.toISOString().split('T')[0]
    dayMap.set(dayStr, (dayMap.get(dayStr) || 0) + e.value)
  }

  const activeDays = Array.from(dayMap.keys()).sort()
  const completedDays = activeDays.filter((d) => (dayMap.get(d) || 0) >= challenge.goal_value)

  participant.active_days = activeDays
  participant.completed_days = completedDays
  participant.current_value = completedDays.length
  participant.streak_count = calculateStreak(completedDays)
  participant.last_activity_at =
    allEntries.length > 0 ? new Date(Math.max(...allEntries.map((e) => new Date(e.date).getTime()))) : null

  const safeStart = new Date(challenge.start_date)
  const safeEnd = new Date(challenge.end_date)
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
  | 'one_meal_short'
  | 'almost_end'
  | 'ai_reject_some_days'
  | 'random_light_miss'

const PATTERNS: PatternKind[] = [
  'perfect',
  'skip_days',
  'one_meal_short',
  'almost_end',
  'ai_reject_some_days',
  'random_light_miss'
]

function mealsTargetForDay(
  ch: ChallengeLean,
  pattern: PatternKind,
  dayKey: string,
  dayIndex: number,
  totalDays: number
): { count: number; kcalValues?: number[] } {
  const g = ch.goal_value
  const gt = ch.goal_type

  if (gt === 'kcal_target') {
    if (pattern === 'one_meal_short') {
      return { count: 3, kcalValues: [500, 400, 200] }
    }
    return { count: 3, kcalValues: [650, 700, 650] }
  }
  if (gt === 'days_completed') {
    return { count: 1, kcalValues: undefined }
  }

  const base = g
  if (pattern === 'perfect') return { count: base }
  if (pattern === 'skip_days') {
    const skipIdx = new Set([
      Math.min(totalDays - 1, Math.floor(totalDays * 0.15)),
      Math.min(totalDays - 1, Math.floor(totalDays * 0.45)),
      Math.min(totalDays - 1, Math.floor(totalDays * 0.72))
    ])
    if (skipIdx.has(dayIndex)) return { count: 0 }
    return { count: base }
  }
  if (pattern === 'one_meal_short') {
    return { count: Math.max(1, base - 1) }
  }
  if (pattern === 'almost_end') {
    if (dayIndex >= totalDays - 2) return { count: Math.max(1, base - 1) }
    return { count: base }
  }
  if (pattern === 'ai_reject_some_days') {
    return { count: base }
  }
  if (pattern === 'random_light_miss') {
    const h = (dayKey + pattern).split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    if (h % 9 === 0) return { count: Math.max(1, base - 2) }
    if (h % 11 === 0) return { count: Math.max(1, base - 1) }
    return { count: base }
  }
  return { count: base }
}

function aiForSlot(
  pattern: PatternKind,
  dayKey: string,
  slot: number,
  mealsThisDay: number
): { valid: boolean; reason: string } {
  if (pattern === 'ai_reject_some_days') {
    const mid = dayKey.endsWith('2') || dayKey.endsWith('5') || dayKey.endsWith('8')
    if (mid && slot === mealsThisDay - 1) {
      return {
        valid: false,
        reason:
          'AI: ảnh mờ / không thấy rõ món ăn hoặc nghi ngờ không phải thực phẩm — không tính vào tiến độ (đối chiếu cảnh báo trên app).'
      }
    }
  }
  const okReason =
    'AI: ảnh rõ đĩa ăn, nhận diện món phù hợp check-in dinh dưỡng — hợp lệ để tính tiến độ.'
  return { valid: true, reason: okReason }
}

async function main() {
  if (!MONGODB_URL) {
    console.error('Thiếu MONGODB_URL trong .env')
    process.exit(1)
  }

  await mongoose.connect(MONGODB_URL)
  console.log('Đã kết nối MongoDB')

  const asOf = process.env.SEED_NUTRITION_AS_OF ? new Date(process.env.SEED_NUTRITION_AS_OF) : new Date()
  const lastVN = toVNDateKey(asOf)

  const nutritionChallenges = await ChallengeModel.find({
    challenge_type: 'nutrition',
    is_deleted: { $ne: true },
    description: new RegExp(`${SEED_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`)
  }).lean()

  if (nutritionChallenges.length === 0) {
    console.log('Không có thử thách dinh dưỡng seed (marker ‖fedacn-seed‖). Chạy seed:challenges trước.')
    await mongoose.disconnect()
    return
  }

  const chIds = nutritionChallenges.map((c) => c._id as mongoose.Types.ObjectId)
  if (REPLACE) {
    const del = await ChallengeProgressModel.deleteMany({
      challenge_id: { $in: chIds },
      challenge_type: 'nutrition'
    })
    console.log(`Đã xóa ${del.deletedCount} bản ghi challenge_progress dinh dưỡng (SEED_NUTRITION_REPLACE=1)`)
  }

  let inserted = 0
  let participantsTouched = new Set<string>()

  for (const raw of nutritionChallenges) {
    const ch = raw as unknown as ChallengeLean
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

      const docs: Record<string, unknown>[] = []
      for (let dayIdx = 0; dayIdx < dayKeys.length; dayIdx++) {
        const dayKey = dayKeys[dayIdx]
        const { count: nMeals, kcalValues } = mealsTargetForDay(ch, pattern, dayKey, dayIdx, totalDays)

        if (nMeals <= 0) continue

        if (ch.goal_type === 'kcal_target' && kcalValues) {
          for (let s = 0; s < kcalValues.length; s++) {
            const def = mealDefsForChallenge(ch, s, dayKey)
            const { valid, reason } = aiForSlot(pattern, dayKey, s, kcalValues.length)
            const img = MEAL_IMAGES[(dayIdx + s + pIndex) % MEAL_IMAGES.length]
            docs.push({
              challenge_id: ch._id,
              user_id: uid,
              date: atVN(dayKey, def.hourVN, def.minuteVN + s * 3),
              challenge_type: 'nutrition',
              value: kcalValues[s],
              unit: ch.goal_unit,
              notes: notesForChallenge(ch, def.notes),
              proof_image: img,
              food_name: def.food_name,
              ai_review_valid: valid,
              ai_review_reason: reason,
              distance: null,
              duration_minutes: null,
              avg_speed: null,
              calories: null,
              workout_session_id: null,
              exercises_count: null,
              completed_exercises: [],
              source: 'photo_checkin',
              activity_id: null,
              validation_status: 'valid',
              is_deleted: false
            })
          }
          continue
        }

        if (ch.goal_type === 'days_completed' && nMeals >= 1) {
          const def = mealDefsForChallenge(ch, 0, dayKey)
          const { valid, reason } = aiForSlot(pattern, dayKey, 0, 1)
          docs.push({
            challenge_id: ch._id,
            user_id: uid,
            date: atVN(dayKey, def.hourVN, def.minuteVN),
            challenge_type: 'nutrition',
            value: 1,
            unit: ch.goal_unit,
            notes: notesForChallenge(ch, def.notes),
            proof_image: MEAL_IMAGES[(dayIdx + pIndex) % MEAL_IMAGES.length],
            food_name: def.food_name,
            ai_review_valid: valid,
            ai_review_reason: reason,
            distance: null,
            duration_minutes: null,
            avg_speed: null,
            calories: null,
            workout_session_id: null,
            exercises_count: null,
            completed_exercises: [],
            source: 'photo_checkin',
            activity_id: null,
            validation_status: 'valid',
            is_deleted: false
          })
          continue
        }

        for (let s = 0; s < nMeals; s++) {
          const def = mealDefsForChallenge(ch, s, dayKey)
          const { valid, reason } = aiForSlot(pattern, dayKey, s, nMeals)
          docs.push({
            challenge_id: ch._id,
            user_id: uid,
            date: atVN(dayKey, def.hourVN, def.minuteVN + s * 2),
            challenge_type: 'nutrition',
            value: 1,
            unit: ch.goal_unit,
            notes: notesForChallenge(ch, def.notes),
            proof_image: MEAL_IMAGES[(dayIdx + s + pIndex) % MEAL_IMAGES.length],
            food_name: def.food_name,
            ai_review_valid: valid,
            ai_review_reason: reason,
            distance: null,
            duration_minutes: null,
            avg_speed: null,
            calories: null,
            workout_session_id: null,
            exercises_count: null,
            completed_exercises: [],
            source: 'photo_checkin',
            activity_id: null,
            validation_status: 'valid',
            is_deleted: false
          })
        }
      }

      if (docs.length) {
        await ChallengeProgressModel.insertMany(docs)
        inserted += docs.length
        participantsTouched.add(`${ch._id}:${uid}`)
        await recalculateParticipant(ch, uid)
      }
    }
  }

  console.log(`Đã chèn ${inserted} check-in dinh dưỡng; cập nhật ${participantsTouched.size} participant(s).`)
  await mongoose.disconnect()
  console.log('Đã ngắt kết nối.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
