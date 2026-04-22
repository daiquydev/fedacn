/**
 * Seed script: Tạo sự kiện trong nhà đầy đủ 6 danh mục + seed tiến độ
 *
 * Danh mục:  Cardio (10), Thiền (1.5), Khiêu vũ (8), Pilates (5), Yoga (10), Gym/Fitness (7)
 * Quy tắc:
 *  - Mỗi ngày 1 video call / người đúng giờ sự kiện (±5 phút)
 *  - 10-15 phút/call, AI xác nhận 80-100%
 *  - kcal theo công thức (activeMin × kcal_per_unit)
 *  - Sự kiện đã bắt đầu: seed đầy đủ rồi cập nhật targetValue
 *  - Sự kiện upcoming: ước tính targetValue theo tổng kỳ vọng
 */

const mongoose = require('mongoose')
const MONGODB_URL = 'mongodb+srv://daiquy:10102003@cluster0.cxzaocf.mongodb.net/?appName=Cluster0'
const TODAY       = new Date('2026-04-11T23:59:59Z')
const CREATOR_ID  = '69be58e7aa34f4c650caa9d8' // Quý Trần Đại

const SCREENSHOT = 'https://res.cloudinary.com/da9cghklv/image/upload/v1775914539/screenshots/screenshots/yoga_session_1775914536673.jpg'

// ─── Tất cả user IDs ─────────────────────────────────────────────────────────
const ALL_USERS = [
  '697d97a91e44e30bb8bfa514',  // User1
  '697dca55fe5889e975b06772',  // User2
  '69aafef7f8e0d40a86aed7f0',  // Admin_123
  '69ab296b480fdcb74631467d',  // Test User
  '69ab2e04480fdcb746314821',  // Tester
  '69b0085f757f75f0b0cba205',  // user3
  '69b18e922566b962357452c9',  // Nguyễn Văn An
  '69b18ea62566b962357452cc',  // Trần Thị Bình
  '69b18eb22566b962357452cf',  // Lê Minh Châu
  '69b18ec22566b962357452d2',  // Phạm Quốc Dũng
  '69b18ed32566b962357452d5',  // Hoàng Gia Hân
  '69b18ee22566b962357452d8',  // Đặng Tuấn Kiệt
  '69b18eee2566b962357452db',  // Bùi Thanh Long
  '69b18efa2566b962357452de',  // Vũ Khánh Ly
  '69b18f082566b962357452e1',  // Đỗ Minh Nhật
  '69b18f162566b962357452e4',  // Phan Gia Bảo
  '69b7c23c831e33fa6f997682',  // User 4
  '69bd5857aeee2a01d966e4ed',  // Quý Đại
  '69be58e7aa34f4c650caa9d8',  // Quý Trần Đại (creator)
  '69d7b5bfbf53782b1825f01a',  // Đẹp zai Quý
  '69d7b77b78ac73853766f8f5',  // trần quý
]

// Chọn N users ngẫu nhiên, luôn bao gồm CREATOR_ID
function pickUsers(n) {
  const pool = ALL_USERS.filter(u => u !== CREATOR_ID)
  const shuffled = pool.sort(() => Math.random() - 0.5)
  const selected = shuffled.slice(0, n - 1)
  return [CREATOR_ID, ...selected]
}

// ─── Định nghĩa sự kiện ───────────────────────────────────────────────────────
// startDate UTC, endDate UTC
// hoursUTC = giờ bắt đầu call mỗi ngày (UTC)
const EVENT_PLANS = [
  // ── ĐÃ BẮT ĐẦU ───────────────────────────────────────────────────────────────
  {
    name: 'Cardio - Thách thức đốt cháy calories',
    description: 'Cùng nhau đốt cháy calories với các bài tập cardio cường độ cao trực tuyến. Phù hợp mọi lứa tuổi, không cần thiết bị.',
    detailedDescription: 'Khóa học Cardio trực tuyến hàng ngày giúp bạn đốt cháy calories, cải thiện sức bền tim mạch và duy trì vóc dáng cân đối. Mỗi buổi học 10-15 phút, dễ dàng kết hợp vào lịch sinh hoạt hàng ngày.',
    category: 'Cardio',
    startDate: new Date('2026-03-12T10:30:00Z'), // 17:30 VN
    endDate:   new Date('2026-04-18T16:59:00Z'),
    location: 'CLB Thể dục Online / Zoom',
    address: 'Online',
    maxParticipants: 25,
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b',
    targetUnit: 'calories',
    difficulty: 'Trung bình',
    requirements: 'Không gian rộng rãi, thảm tập, giày thể thao.',
    benefits: 'Tăng sức bền, đốt mỡ hiệu quả, cải thiện sức khỏe tim mạch.',
    nParticipants: 18,
    callHourUTC: 10, callMinUTC: 30, // 17:30 VN
  },
  {
    name: 'Thiền - Hành trình tĩnh tâm 30 ngày',
    description: 'Khóa thiền định 30 ngày giúp bạn giảm stress, cân bằng tâm trí và tìm lại sự bình yên nội tâm.',
    detailedDescription: 'Hành trình thiền định hàng ngày với các kỹ thuật thở và mindfulness. Phù hợp người mới bắt đầu đến nâng cao. Mỗi buổi 10-15 phút vào buổi sáng sớm.',
    category: 'Thiền',
    startDate: new Date('2026-03-15T23:00:00Z'), // 06:00 VN ngày 16/3
    endDate:   new Date('2026-04-20T16:59:00Z'),
    location: 'Zoom / Google Meet',
    address: 'Online - Toàn quốc',
    maxParticipants: 20,
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773',
    targetUnit: 'calories',
    difficulty: 'Dễ',
    requirements: 'Không gian yên tĩnh, gối ngồi thiền (tùy chọn).',
    benefits: 'Giảm stress, cải thiện giấc ngủ, tập trung tốt hơn.',
    nParticipants: 16,
    callHourUTC: 23, callMinUTC: 0, // 06:00 VN
  },
  {
    name: 'Khiêu vũ - Nhịp điệu vui vẻ',
    description: 'Lớp học khiêu vũ online kết hợp các phong cách Salsa, Rumba và nhảy hiện đại. Vui vẻ, năng động!',
    detailedDescription: 'Khóa học khiêu vũ trực tuyến năng động với nhạc sôi động. Học các vũ điệu Latin cơ bản đến nâng cao. Đốt calo trong khi vui vẻ cùng cộng đồng.',
    category: 'Khiêu vũ',
    startDate: new Date('2026-03-20T12:00:00Z'), // 19:00 VN
    endDate:   new Date('2026-04-22T16:59:00Z'),
    location: 'Studio Dance Online',
    address: 'Online',
    maxParticipants: 22,
    image: 'https://images.unsplash.com/photo-1504609813442-a8924e83f76e',
    targetUnit: 'calories',
    difficulty: 'Trung bình',
    requirements: 'Không gian 2m², giày mềm đế phẳng, âm nhạc đủ nghe.',
    benefits: 'Tăng sự linh hoạt, đốt calories, cải thiện nhịp điệu và tâm trạng.',
    nParticipants: 19,
    callHourUTC: 12, callMinUTC: 0, // 19:00 VN
  },
  {
    name: 'Pilates - Cân bằng và sức mạnh cốt lõi',
    description: 'Chương trình Pilates 45 ngày tập trung vào core strength, sự cân bằng và linh hoạt của cơ thể.',
    detailedDescription: 'Pilates trực tuyến với huấn luyện viên chứng chỉ quốc tế. Tập trung vào sức mạnh core, tư thế đúng và breathing technique. Thích hợp phục hồi chấn thương và tăng sức mạnh.',
    category: 'Pilates',
    startDate: new Date('2026-03-18T00:00:00Z'), // 07:00 VN
    endDate:   new Date('2026-05-02T16:59:00Z'),
    location: 'Pilates Studio Online',
    address: 'Online',
    maxParticipants: 20,
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a',
    targetUnit: 'calories',
    difficulty: 'Trung bình',
    requirements: 'Thảm Pilates, không gian yên tĩnh.',
    benefits: 'Tăng sức mạnh core, cải thiện tư thế, giảm đau lưng.',
    nParticipants: 17,
    callHourUTC: 0, callMinUTC: 0, // 07:00 VN
  },

  // ── UPCOMING (từ 20/4 → tháng 7) ────────────────────────────────────────────
  {
    name: 'Cardio - Bùng nổ sức mạnh mùa hè',
    description: 'Thử thách cardio 30 ngày cường độ cao cho mùa hè năng động. HIIT, Jumping Jack, Burpees và nhiều hơn nữa!',
    detailedDescription: 'Chương trình HIIT Cardio 30 ngày cường độ cao giúp đốt cháy tối đa calories. Mỗi buổi 10-15 phút nhưng hiệu quả tương đương 1 giờ tập thông thường.',
    category: 'Cardio',
    startDate: new Date('2026-04-20T10:00:00Z'),
    endDate:   new Date('2026-05-20T16:59:00Z'),
    location: 'Online HIIT Studio',
    address: 'Online',
    maxParticipants: 30,
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438',
    targetUnit: 'calories',
    difficulty: 'Khó',
    requirements: 'Thể lực tốt, không gian rộng, thảm tập.',
    benefits: 'Đốt mỡ tối đa, tăng metabolism, cải thiện sức bền.',
    nParticipants: 21,
    callHourUTC: 10, callMinUTC: 0,
  },
  {
    name: 'Thiền - Bình an nội tâm tháng 5',
    description: 'Hành trình thiền định tháng 5 với kỹ thuật thiền Vipassana và Mindfulness. Tìm lại sự cân bằng.',
    detailedDescription: 'Khóa thiền định chuyên sâu kết hợp Vipassana, Mindfulness và thở hộp (box breathing). Hướng dẫn bởi thiền sư có kinh nghiệm 10 năm.',
    category: 'Thiền',
    startDate: new Date('2026-05-01T23:00:00Z'),
    endDate:   new Date('2026-06-01T16:59:00Z'),
    location: 'Zoom Meditation Room',
    address: 'Online',
    maxParticipants: 25,
    image: 'https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7',
    targetUnit: 'calories',
    difficulty: 'Dễ',
    requirements: 'Không gian yên tĩnh, gối thiền.',
    benefits: 'Giảm lo âu, cải thiện giấc ngủ sâu, tăng khả năng tập trung.',
    nParticipants: 18,
    callHourUTC: 23, callMinUTC: 0,
  },
  {
    name: 'Khiêu vũ - Dance Fitness Summer Challenge',
    description: 'Đón hè với khóa Dance Fitness kết hợp Zumba, Aerobics và K-Pop Dance. Năng động, vui vẻ!',
    detailedDescription: 'Dance Fitness tổng hợp Zumba Latin, K-Pop Dance và Dance Aerobics. Vừa học vũ đạo vừa đốt calo. Cộng đồng 20+ vũ công online sôi động.',
    category: 'Khiêu vũ',
    startDate: new Date('2026-05-10T12:00:00Z'),
    endDate:   new Date('2026-06-10T16:59:00Z'),
    location: 'Dance Studio Online',
    address: 'Online',
    maxParticipants: 28,
    image: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0',
    targetUnit: 'calories',
    difficulty: 'Trung bình',
    requirements: 'Giày nhảy, không gian 2x2m.',
    benefits: 'Đốt 300-400 kcal/buổi, tăng sự tự tin, kết nối cộng đồng.',
    nParticipants: 20,
    callHourUTC: 12, callMinUTC: 0,
  },
  {
    name: 'Pilates - Power Core tháng 6',
    description: 'Chương trình Pilates nâng cao tháng 6 tập trung vào core power, sự dẻo dai và phục hồi cơ thể.',
    detailedDescription: 'Power Pilates tháng 6 với bài tập cường độ cao hơn, kết hợp resistance band và foam roller. Thích hợp người đã có nền tảng Pilates cơ bản.',
    category: 'Pilates',
    startDate: new Date('2026-05-15T00:00:00Z'),
    endDate:   new Date('2026-06-15T16:59:00Z'),
    location: 'Pilates Power Online',
    address: 'Online',
    maxParticipants: 22,
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a',
    targetUnit: 'calories',
    difficulty: 'Khó',
    requirements: 'Đã có kinh nghiệm Pilates cơ bản, resistance band.',
    benefits: 'Tăng sức mạnh cốt lõi tối đa, cơ thể săn chắc.',
    nParticipants: 17,
    callHourUTC: 0, callMinUTC: 0,
  },
  {
    name: 'Yoga - Năng lượng buổi sáng tháng 6',
    description: 'Bắt đầu mỗi ngày với 10-15 phút Yoga buổi sáng. Tăng năng lượng, linh hoạt và tinh thần tích cực.',
    detailedDescription: 'Morning Yoga Flow 30 ngày. Kết hợp Sun Salutation, Vinyasa và Pranayama để khởi đầu ngày mới tràn đầy năng lượng. Mọi cấp độ đều phù hợp.',
    category: 'Yoga',
    startDate: new Date('2026-06-01T01:00:00Z'), // 08:00 VN
    endDate:   new Date('2026-07-01T16:59:00Z'),
    location: 'Yoga Morning Studio Online',
    address: 'Online',
    maxParticipants: 25,
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b',
    targetUnit: 'calories',
    difficulty: 'Dễ',
    requirements: 'Thảm Yoga, không gian yên tĩnh buổi sáng.',
    benefits: 'Tăng năng lượng buổi sáng, cải thiện sự linh hoạt, giảm stress.',
    nParticipants: 19,
    callHourUTC: 1, callMinUTC: 0,
  },
  {
    name: 'Gym / Fitness - Summer Body Challenge',
    description: 'Thử thách 30 ngày xây dựng body mùa hè. Kết hợp strength training, HIIT và nutrition coaching.',
    detailedDescription: 'Chương trình toàn diện 30 ngày kết hợp tập luyện sức mạnh, cardio HIIT và tư vấn dinh dưỡng. Mục tiêu: giảm mỡ, tăng cơ, có body đẹp cho mùa hè.',
    category: 'Gym / Fitness',
    startDate: new Date('2026-06-15T03:00:00Z'), // 10:00 VN
    endDate:   new Date('2026-07-15T16:59:00Z'),
    location: 'FitConnect Gym Online',
    address: 'Online',
    maxParticipants: 30,
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48',
    targetUnit: 'calories',
    difficulty: 'Khó',
    requirements: 'Tạ tay, dây kháng lực, thảm tập.',
    benefits: 'Giảm mỡ, tăng cơ bắp, tự tin với body mùa hè.',
    nParticipants: 21,
    callHourUTC: 3, callMinUTC: 0,
  },
]

// ─── Schemas ──────────────────────────────────────────────────────────────────
const VideoSessionSchema = new mongoose.Schema({
  eventId: mongoose.Schema.Types.ObjectId,
  sessionId: { type: mongoose.Schema.Types.ObjectId, default: null },
  userId: mongoose.Schema.Types.ObjectId,
  joinedAt: Date,
  endedAt: { type: Date, default: null },
  activeSeconds: { type: Number, default: 0 },
  totalSeconds: { type: Number, default: 0 },
  caloriesBurned: { type: Number, default: 0 },
  status: { type: String, default: 'ended' },
  screenshots: { type: [String], default: [] },
  progressId: { type: mongoose.Schema.Types.ObjectId, default: null },
  is_deleted: { type: Boolean, default: false }
}, { timestamps: true, collection: 'sport_event_video_sessions' })

const ProgressSchema = new mongoose.Schema({
  eventId: mongoose.Schema.Types.ObjectId,
  userId: mongoose.Schema.Types.ObjectId,
  date: Date,
  value: Number,
  unit: String,
  distance: { type: Number, default: null },
  time: String,
  calories: Number,
  proofImage: { type: String, default: '' },
  notes: { type: String, default: '' },
  source: { type: String, default: 'video_call' },
  sessionId: { type: mongoose.Schema.Types.ObjectId, default: null },
  activeSeconds: { type: Number, default: null },
  is_deleted: { type: Boolean, default: false }
}, { timestamps: true, collection: 'sport_event_progress' })

const VideoSessionModel = mongoose.model('sport_event_video_sessions', VideoSessionSchema)
const ProgressModel     = mongoose.model('sport_event_progress', ProgressSchema)

// ─── Helpers ──────────────────────────────────────────────────────────────────
function rand(min, max) { return Math.random() * (max - min) + min }
function roundKcal(v)   { return Math.round(v * 10) / 10 }

function buildDayRange(startDate, endDate) {
  const days = []
  const cur = new Date(startDate)
  cur.setUTCHours(0, 0, 0, 0)
  const end = new Date(Math.min(new Date(endDate), TODAY))
  end.setUTCHours(23, 59, 59, 999)
  while (cur <= end) { days.push(new Date(cur)); cur.setDate(cur.getDate() + 1) }
  return days
}

function getSessionTime(dayDate, hUTC, mUTC) {
  const t = new Date(dayDate)
  t.setUTCHours(hUTC, mUTC, 0, 0)
  // ±5 phút random
  t.setTime(t.getTime() + Math.round(rand(-300, 300)) * 1000)
  return t
}

function calcProgressValue(targetUnit, activeSeconds, caloriesBurned) {
  const u = (targetUnit || '').toLowerCase().trim()
  if (u === 'phút' || u === 'minutes' || u === 'min') return Math.round(activeSeconds / 60)
  if (u === 'giờ' || u === 'hours' || u === 'h') return Math.round((activeSeconds / 3600) * 10) / 10
  if (u === 'buổi' || u === 'sessions' || u === 'session') return 1
  // kcal / calo / calories / cal
  return caloriesBurned
}

// Seed tiến độ cho 1 sự kiện đã bắt đầu
async function seedProgress(db, eventId, participants, startDate, endDate, kcalPerMin, targetUnit, callHourUTC, callMinUTC) {
  const days = buildDayRange(startDate, endDate)
  if (days.length === 0) return { days: 0, sessions: 0, avgKcal: 0 }

  const allKcalPerPerson = []
  let totalSessions = 0

  for (const uid of participants) {
    const userId = new mongoose.Types.ObjectId(uid)
    let personKcal = 0

    for (const dayDate of days) {
      const joinedAt = getSessionTime(dayDate, callHourUTC, callMinUTC)
      const totalSeconds  = Math.round(rand(10, 15) * 60)
      const aiRatio       = rand(0.80, 1.00)
      const activeSeconds = Math.round(totalSeconds * aiRatio)
      const caloriesBurned = roundKcal((activeSeconds / 60) * kcalPerMin)
      const progressValue  = calcProgressValue(targetUnit, activeSeconds, caloriesBurned)
      const endedAt        = new Date(joinedAt.getTime() + totalSeconds * 1000)
      const activeMin      = Math.round(activeSeconds / 60)
      const aiPct          = Math.round((activeSeconds / totalSeconds) * 100)

      const vs = await VideoSessionModel.create({
        eventId, sessionId: null, userId, joinedAt, endedAt,
        activeSeconds, totalSeconds, caloriesBurned, status: 'ended',
        screenshots: [SCREENSHOT], progressId: null, is_deleted: false
      })

      const prog = await ProgressModel.create({
        eventId, userId, date: joinedAt,
        value: progressValue, unit: targetUnit || 'calories',
        distance: null, time: `${activeMin} phút`, calories: caloriesBurned,
        proofImage: SCREENSHOT,
        notes: `${targetUnit || 'calories'} video call — ${activeMin}p (AI ${aiPct}%)`,
        source: 'video_call', sessionId: null, activeSeconds, is_deleted: false
      })

      await VideoSessionModel.findByIdAndUpdate(vs._id, { progressId: prog._id })

      personKcal += caloriesBurned
      totalSessions++
    }

    allKcalPerPerson.push(personKcal)
  }

  const avgKcal = allKcalPerPerson.reduce((a, b) => a + b, 0) / allKcalPerPerson.length
  return { days: days.length, sessions: totalSessions, avgKcal, allKcalPerPerson }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🔗 Kết nối MongoDB...')
  await mongoose.connect(MONGODB_URL)
  console.log('✅ Đã kết nối\n')

  const db = mongoose.connection.db

  // Lấy kcal_per_unit của tất cả danh mục
  const cats = await db.collection('sport_categories').find({ isDeleted: { $ne: true } }).toArray()
  const kcalMap = {}
  for (const c of cats) kcalMap[c.name] = c.kcal_per_unit || 5

  const summary = []

  for (const plan of EVENT_PLANS) {
    const participants = pickUsers(plan.nParticipants)
    const kcalPerMin   = kcalMap[plan.category] || 5
    const isStarted    = new Date(plan.startDate) <= TODAY

    console.log(`\n${'─'.repeat(60)}`)
    console.log(`📌 ${plan.name}`)
    console.log(`   Danh mục: ${plan.category} (${kcalPerMin} kcal/phút)`)
    console.log(`   ${new Date(plan.startDate).toISOString().slice(0, 10)} → ${new Date(plan.endDate).toISOString().slice(0, 10)}`)
    console.log(`   Participants: ${participants.length} / max ${plan.maxParticipants}`)
    console.log(`   Đã bắt đầu: ${isStarted ? '✅ Có' : '⏳ Chưa'}`)

    // Tạo sport_event document
    const eventDoc = {
      name: plan.name,
      description: plan.description,
      detailedDescription: plan.detailedDescription,
      category: plan.category,
      startDate: plan.startDate,
      endDate: plan.endDate,
      location: plan.location,
      address: plan.address,
      distance: '',
      maxParticipants: plan.maxParticipants,
      participants: participants.length,
      image: plan.image,
      createdBy: new mongoose.Types.ObjectId(CREATOR_ID),
      eventType: 'Trong nhà',
      participants_ids: participants.map(u => new mongoose.Types.ObjectId(u)),
      requirements: plan.requirements,
      benefits: plan.benefits,
      organizer: 'FitConnect Club',
      targetValue: 0, // sẽ cập nhật sau
      targetUnit: plan.targetUnit,
      difficulty: plan.difficulty,
      isDeleted: false,
      deletedAt: null,
    }

    const inserted = await db.collection('sport_events').insertOne(eventDoc)
    const eventId  = inserted.insertedId
    console.log(`   ✅ Đã tạo event: ${eventId}`)

    let targetValue = 0

    if (isStarted) {
      // Seed tiến độ
      const result = await seedProgress(
        db, eventId, participants,
        plan.startDate, plan.endDate, kcalPerMin,
        plan.targetUnit, plan.callHourUTC, plan.callMinUTC
      )
      console.log(`   📊 Seeded: ${result.sessions} sessions | ${result.days} ngày | avg kcal=${result.avgKcal.toFixed(1)}`)

      // targetValue = avgKcal × maxParticipants / rand(0.92-0.98) → mỗi người đạt ~90-100%
      const ratio = rand(0.92, 0.98)
      const perPersonTarget = result.avgKcal / ratio
      targetValue = Math.round(perPersonTarget * plan.maxParticipants)

      // Mẫu tiến độ
      const perP = targetValue / plan.maxParticipants
      const samples = (result.allKcalPerPerson || []).slice(0, 5)
        .map(k => `${Math.min(100, Math.round(k / perP * 100))}%`)
      console.log(`   📈 Tiến độ mẫu: ${samples.join(', ')}`)
    } else {
      // Ước tính targetValue theo kỳ vọng
      const durationDays = Math.round((plan.endDate - plan.startDate) / (1000 * 60 * 60 * 24))
      const avgActiveMin = 12.5 * 0.9 // 12.5 phút avg × 90% AI ratio
      const kcalPerSession = avgActiveMin * kcalPerMin
      const totalPerPerson = durationDays * kcalPerSession
      targetValue = Math.round(totalPerPerson * plan.maxParticipants)
      console.log(`   📐 Ước tính: ${durationDays} ngày × ${kcalPerSession.toFixed(1)} kcal/ngày × ${plan.maxParticipants} người = ${targetValue}`)
    }

    // Cập nhật targetValue
    await db.collection('sport_events').updateOne(
      { _id: eventId },
      { $set: { targetValue } }
    )
    console.log(`   🎯 targetValue = ${targetValue} ${plan.targetUnit}`)

    summary.push({
      name: plan.name, category: plan.category,
      isStarted, participants: participants.length,
      targetValue, targetUnit: plan.targetUnit
    })
  }

  // Tổng kết
  console.log(`\n${'='.repeat(60)}`)
  console.log('🎉 HOÀN THÀNH TẤT CẢ!\n')
  console.log('SỰ KIỆN ĐÃ TẠO:')
  for (const s of summary) {
    const status = s.isStarted ? '🟢 ĐÃ BẮT ĐẦU' : '🔵 UPCOMING'
    console.log(`  ${status} [${s.category}] ${s.name}`)
    console.log(`    Participants: ${s.participants} | Target: ${s.targetValue} ${s.targetUnit}`)
  }

  await mongoose.disconnect()
  console.log('\n🔌 Đã ngắt kết nối')
  process.exit(0)
}

main().catch(err => {
  console.error('❌ Lỗi:', err.message)
  console.error(err.stack)
  mongoose.disconnect()
  process.exit(1)
})
