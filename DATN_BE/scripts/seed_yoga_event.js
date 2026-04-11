/**
 * Seed script: Video sessions + Progress cho sự kiện Yoga trong nhà
 * Event: 69d7bc52841f30b2f9d06378 - "Yoga - Khám phá giới hạn mới 7"
 * Loại sự kiện: Trong nhà (Indoor) - mỗi ngày 1 video call theo giờ sự kiện
 * Thời gian: từ startDate (08/04/2026) đến hôm nay (11/04/2026) = 4 ngày
 *
 * Ghi chú:
 * - kcal tính theo Yoga = 10 kcal/phút
 * - perPersonTarget = 131 / 22 = 5.9545 kcal → mỗi người chỉ cần ~6 kcal
 *   Do targetValue nhỏ, mỗi session yoga 30-45 phút đủ để đạt 100%
 * - activeSeconds = 80-100% totalSeconds (AI xác nhận có mặt)
 * - Screenshots dùng ảnh đã upload lên Cloudinary
 */

const mongoose = require('mongoose')

const MONGODB_URL = 'mongodb+srv://daiquy:10102003@cluster0.cxzaocf.mongodb.net/?appName=Cluster0'
const EVENT_ID = '69d7bc52841f30b2f9d06378'
const KCAL_PER_MINUTE = 10 // Yoga category
const SCREENSHOT_URL = 'https://res.cloudinary.com/da9cghklv/image/upload/v1775914539/screenshots/screenshots/yoga_session_1775914536673.jpg'

// === Mongoose Schemas ===
const SportEventVideoSessionSchema = new mongoose.Schema({
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

const SportEventProgressSchema = new mongoose.Schema({
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

const VideoSessionModel = mongoose.model('sport_event_video_sessions', SportEventVideoSessionSchema)
const ProgressModel = mongoose.model('sport_event_progress', SportEventProgressSchema)

// === Helpers ===
function rand(min, max) {
  return Math.random() * (max - min) + min
}

function randInt(min, max) {
  return Math.floor(rand(min, max + 1))
}

function roundKcal(v) {
  return Math.round(v * 10) / 10
}

// Tạo thời gian joinedAt cho mỗi ngày (quanh giờ bắt đầu sự kiện)
// Event startDate = 2026-04-08T11:37:00Z (18:37 VN)
// Cho phép join từ 10 phút trước = 11:27Z → session random 11:27-12:30Z
function getSessionTimeForDay(dayDate) {
  const sessionStart = new Date(dayDate)
  // Thêm random phút: từ 11:27 đến 12:35 UTC (ứng với 18:27-19:35 VN)
  const minuteOffset = randInt(0, 68) // 0-68 phút sau 11:27
  sessionStart.setUTCHours(11, 27 + minuteOffset, randInt(0, 59), 0)
  return sessionStart
}

// Xây dựng list ngày từ startDate đến hôm nay
function buildDayRange(startDate, endDate) {
  const days = []
  const cur = new Date(startDate)
  cur.setUTCHours(0, 0, 0, 0)
  const end = new Date(endDate)
  end.setUTCHours(23, 59, 59, 999)

  while (cur <= end) {
    days.push(new Date(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return days
}

async function seed() {
  try {
    console.log('🔗 Kết nối MongoDB...')
    await mongoose.connect(MONGODB_URL)
    console.log('✅ Đã kết nối')

    const db = mongoose.connection.db
    const eventId = new mongoose.Types.ObjectId(EVENT_ID)

    // Lấy thông tin sự kiện
    const event = await db.collection('sport_events').findOne({ _id: eventId })
    if (!event) throw new Error('Không tìm thấy sự kiện!')
    console.log(`\n📋 Sự kiện: ${event.name}`)
    console.log(`   Loại: ${event.eventType}`)
    console.log(`   Danh mục: ${event.category}`)
    console.log(`   Bắt đầu: ${new Date(event.startDate).toLocaleString('vi-VN')}`)
    console.log(`   Kết thúc: ${new Date(event.endDate).toLocaleString('vi-VN')}`)
    console.log(`   Mục tiêu: ${event.targetValue} ${event.targetUnit}`)
    console.log(`   Số người tham gia tối đa: ${event.maxParticipants}`)
    console.log(`   Số người đã tham gia: ${event.participants_ids.length}`)

    const perPersonTarget = event.targetValue / event.maxParticipants
    console.log(`\n🎯 Mục tiêu cá nhân = ${event.targetValue}/${event.maxParticipants} = ${perPersonTarget.toFixed(2)} kcal`)

    // Xác nhận danh mục thể thao
    const cat = await db.collection('sport_categories').findOne({ name: event.category })
    const kcalPerMin = (cat && cat.kcal_per_unit > 0) ? cat.kcal_per_unit : KCAL_PER_MINUTE
    console.log(`⚡ kcal/phút: ${kcalPerMin} (từ danh mục "${event.category}")`)

    // Xây dựng range ngày
    const today = new Date('2026-04-11T23:59:59Z')
    const days = buildDayRange(event.startDate, today)
    console.log(`\n📅 Số ngày seed: ${days.length} ngày (${days[0].toISOString().slice(0, 10)} → ${days[days.length - 1].toISOString().slice(0, 10)})`)

    // Xóa dữ liệu cũ
    const delVS = await VideoSessionModel.deleteMany({ eventId })
    const delProg = await ProgressModel.deleteMany({ eventId })
    console.log(`🧹 Đã xóa: ${delVS.deletedCount} video sessions, ${delProg.deletedCount} progress records`)

    const participants = event.participants_ids
    console.log(`\n👥 Số người tham gia: ${participants.length}`)

    let totalSessionsCreated = 0
    let totalProgressCreated = 0

    for (let pi = 0; pi < participants.length; pi++) {
      const userId = new mongoose.Types.ObjectId(participants[pi].toString())

      // Mục tiêu cá nhân: random 90-100% của perPersonTarget
      // Với targetUnit='calories' và perPersonTarget=5.95, các session yoga thực tế
      // sẽ tạo ra nhiều hơn nhiều → progress đạt 100%
      // Vẫn để random để thêm tính tự nhiên cho dữ liệu
      const targetRatio = rand(0.90, 1.00)
      const totalTargetKcal = perPersonTarget * targetRatio

      // Thiết kế sessions yoga thực tế: 25-50 phút/buổi
      // Mỗi ngày 1 buổi, tổng kcal sẽ vượt mục tiêu nhiều → ring hiển thị 100%
      // Điều này là tự nhiên vì mục tiêu sự kiện quá nhỏ
      const sessionsData = []

      for (let di = 0; di < days.length; di++) {
        const dayDate = days[di]

        // Random thời gian session quanh giờ bắt đầu sự kiện (18:27-19:35 VN)
        const joinedAt = getSessionTimeForDay(dayDate)

        // Thời gian yoga thực tế: 25-50 phút
        const totalMinutes = rand(25, 50)
        const totalSeconds = Math.round(totalMinutes * 60)

        // AI xác nhận có mặt: 80-100% thời gian thực
        const aiRatio = rand(0.80, 1.00)
        const activeSeconds = Math.round(totalSeconds * aiRatio)

        // Tính kcal từ công thức: (activeSeconds / 60) × kcal/phút
        const caloriesBurned = roundKcal((activeSeconds / 60) * kcalPerMin)

        // Giá trị progress (targetUnit = 'calories' → value = caloriesBurned)
        const progressValue = caloriesBurned

        const endedAt = new Date(joinedAt.getTime() + totalSeconds * 1000)

        sessionsData.push({
          joinedAt,
          endedAt,
          totalSeconds,
          activeSeconds,
          caloriesBurned,
          progressValue,
          totalMinutes,
          aiPercent: Math.round(aiRatio * 100)
        })
      }

      // Tạo video sessions và progress
      for (const s of sessionsData) {
        // Tạo SportEventVideoSession
        const vs = await VideoSessionModel.create({
          eventId,
          sessionId: null,
          userId,
          joinedAt: s.joinedAt,
          endedAt: s.endedAt,
          activeSeconds: s.activeSeconds,
          totalSeconds: s.totalSeconds,
          caloriesBurned: s.caloriesBurned,
          status: 'ended',
          screenshots: [SCREENSHOT_URL],
          progressId: null,
          is_deleted: false
        })

        // Tạo SportEventProgress tương ứng
        const durationMin = Math.round(s.activeSeconds / 60)
        const prog = await ProgressModel.create({
          eventId,
          userId,
          date: s.joinedAt,
          value: s.progressValue,
          unit: event.targetUnit || 'calories',
          distance: null,
          time: `${durationMin} phút`,
          calories: s.caloriesBurned,
          proofImage: SCREENSHOT_URL,
          notes: `Yoga video call — ${durationMin} phút (AI xác nhận ${s.aiPercent}%)`,
          source: 'video_call',
          sessionId: null,
          activeSeconds: s.activeSeconds,
          is_deleted: false
        })

        // Link progress vào video session
        await VideoSessionModel.findByIdAndUpdate(vs._id, { progressId: prog._id })

        totalSessionsCreated++
        totalProgressCreated++
      }

      // Tính tổng kcal của người này
      const totalKcal = sessionsData.reduce((s, x) => s + x.caloriesBurned, 0)
      const totalActiveMin = sessionsData.reduce((s, x) => s + x.activeSeconds / 60, 0)
      const progressPct = Math.min(Math.round((totalKcal / perPersonTarget) * 100), 100)

      if (pi % 5 === 0 || pi === participants.length - 1) {
        console.log(`  👤 Người ${pi + 1}/${participants.length}: ${days.length} sessions | Tổng kcal=${totalKcal.toFixed(1)} | Active=${totalActiveMin.toFixed(1)}p | Tiến độ=${progressPct}%`)
      }
    }

    // === Tổng kết ===
    console.log(`\n🎉 Hoàn thành!`)
    console.log(`   Tổng video sessions: ${totalSessionsCreated}`)
    console.log(`   Tổng progress records: ${totalProgressCreated}`)
    console.log(`   Trung bình: ${(totalSessionsCreated / participants.length).toFixed(1)} sessions/người`)

    // Xác minh dữ liệu
    const verifyVS = await VideoSessionModel.countDocuments({ eventId, is_deleted: false, status: 'ended' })
    const verifyProg = await ProgressModel.countDocuments({ eventId, is_deleted: false })
    console.log(`\n✅ Xác minh trong DB:`)
    console.log(`   sport_event_video_sessions: ${verifyVS} bản ghi`)
    console.log(`   sport_event_progress: ${verifyProg} bản ghi`)

    // Sample stats cho 1 người
    const sampleUserId = new mongoose.Types.ObjectId(participants[0].toString())
    const sampleSessions = await VideoSessionModel.find({
      eventId,
      userId: sampleUserId,
      status: 'ended',
      is_deleted: false
    }).sort({ joinedAt: 1 })

    console.log(`\n📊 Mẫu dữ liệu người 1 (${sampleSessions.length} sessions):`)
    for (const ss of sampleSessions) {
      const dateStr = new Date(ss.joinedAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
      const aiPct = ss.totalSeconds > 0 ? Math.round((ss.activeSeconds / ss.totalSeconds) * 100) : 0
      console.log(`   ${dateStr} | ${Math.round(ss.totalSeconds / 60)}p total | ${Math.round(ss.activeSeconds / 60)}p active (${aiPct}%) | ${ss.caloriesBurned} kcal`)
    }
    const totalKcal1 = sampleSessions.reduce((s, x) => s + x.caloriesBurned, 0)
    const pct1 = Math.min(Math.round((totalKcal1 / perPersonTarget) * 100), 100)
    console.log(`   → Tổng: ${totalKcal1.toFixed(1)} kcal | Tiến độ: ${pct1}% (cap 100%)`)

  } catch (err) {
    console.error('❌ Lỗi:', err.message)
    console.error(err.stack)
  } finally {
    await mongoose.disconnect()
    console.log('\n🔌 Đã ngắt kết nối')
    process.exit(0)
  }
}

seed()
