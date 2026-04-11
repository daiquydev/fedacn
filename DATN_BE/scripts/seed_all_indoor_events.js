/**
 * Seed script: Video sessions + Progress cho TẤT CẢ sự kiện trong nhà đã bắt đầu
 *
 * Quy tắc:
 * - Mỗi ngày 1 buổi video call / người, vào đúng giờ diễn ra của sự kiện (±vài phút)
 * - Mỗi call 10-15 phút (totalSeconds)
 * - AI xác nhận có mặt = 80-100% thời gian thực (activeSeconds)
 * - kcal = (activeSeconds / 60) × kcal_per_unit của danh mục
 * - Sau khi tính tổng kcal trung bình, cập nhật targetValue sự kiện sao cho
 *   tiến độ cá nhân đạt 90-100%
 * - Ảnh screenshot dùng ảnh đã upload sẵn lên Cloudinary
 */

const mongoose = require('mongoose')

const MONGODB_URL = 'mongodb+srv://daiquy:10102003@cluster0.cxzaocf.mongodb.net/?appName=Cluster0'
const SCREENSHOT_URL = 'https://res.cloudinary.com/da9cghklv/image/upload/v1775914539/screenshots/screenshots/yoga_session_1775914536673.jpg'
const DEFAULT_KCAL_PER_MIN = 5
const TODAY = new Date('2026-04-11T23:59:59Z')

// === Mongoose Schemas ===
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
const ProgressModel = mongoose.model('sport_event_progress', ProgressSchema)

// === Helpers ===
function rand(min, max) { return Math.random() * (max - min) + min }
function randInt(min, max) { return Math.floor(rand(min, max + 1)) }
function roundKcal(v) { return Math.round(v * 10) / 10 }

/**
 * Xây dựng list ngày từ startDate đến today (không vượt endDate)
 */
function buildDayRange(startDate, endDate) {
  const days = []
  const cur = new Date(startDate)
  cur.setUTCHours(0, 0, 0, 0)
  const end = new Date(Math.min(new Date(endDate), TODAY))
  end.setUTCHours(23, 59, 59, 999)
  while (cur <= end) {
    days.push(new Date(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return days
}

/**
 * Tạo joinedAt cho ngày cụ thể dựa trên giờ bắt đầu của sự kiện
 * offset ngẫu nhiên ±5 phút để tự nhiên hơn
 */
function getSessionTime(dayDate, eventStartDate) {
  const startUTC = new Date(eventStartDate)
  const sessionTime = new Date(dayDate)
  // Lấy giờ:phút:giây từ event startDate
  sessionTime.setUTCHours(
    startUTC.getUTCHours(),
    startUTC.getUTCMinutes(),
    startUTC.getUTCSeconds(),
    0
  )
  // Random offset ±5 phút
  const offsetSeconds = randInt(-300, 300)
  sessionTime.setTime(sessionTime.getTime() + offsetSeconds * 1000)
  return sessionTime
}

/**
 * Tính progress value theo targetUnit của sự kiện
 */
function calcProgressValue(targetUnit, activeSeconds, caloriesBurned) {
  const unit = (targetUnit || '').toLowerCase().trim()
  if (unit === 'phút' || unit === 'minutes' || unit === 'min') return Math.round(activeSeconds / 60)
  if (unit === 'giờ' || unit === 'hours' || unit === 'h') return Math.round((activeSeconds / 3600) * 10) / 10
  if (unit === 'buổi' || unit === 'sessions' || unit === 'session') return 1
  if (unit === 'kcal' || unit === 'calo' || unit === 'calories' || unit === 'cal') return caloriesBurned
  return Math.round(activeSeconds / 60) // mặc định phút
}

async function seedEvent(db, event) {
  const eventId = event._id
  const eventName = event.name
  const participants = event.participants_ids || []
  const maxParticipants = event.maxParticipants || participants.length || 1

  console.log(`\n${'='.repeat(60)}`)
  console.log(`📋 ${eventName}`)
  console.log(`   ID: ${eventId}`)
  console.log(`   Danh mục: ${event.category}`)
  console.log(`   Giờ bắt đầu: ${new Date(event.startDate).toISOString()} (UTC)`)
  console.log(`   Participants: ${participants.length} / max ${maxParticipants}`)
  console.log(`   TargetUnit: ${event.targetUnit}`)

  // Lấy kcal/phút từ danh mục
  const cat = await db.collection('sport_categories').findOne({ name: event.category, isDeleted: { $ne: true } })
  const kcalPerMin = (cat && cat.kcal_per_unit > 0) ? cat.kcal_per_unit : DEFAULT_KCAL_PER_MIN
  console.log(`   kcal/phút: ${kcalPerMin}`)

  // Xây dựng range ngày
  const days = buildDayRange(event.startDate, event.endDate)
  console.log(`   Số ngày seed: ${days.length} ngày`)

  if (days.length === 0) {
    console.log('   ⚠️  Sự kiện chưa bắt đầu hoặc không có ngày hợp lệ. Bỏ qua.')
    return null
  }

  // Xóa dữ liệu cũ
  const delVS = await VideoSessionModel.deleteMany({ eventId })
  const delProg = await ProgressModel.deleteMany({ eventId })
  console.log(`   🧹 Xóa: ${delVS.deletedCount} video sessions, ${delProg.deletedCount} progress`)

  let allKcalPerPerson = []
  let totalSessions = 0

  for (const participant of participants) {
    const userId = new mongoose.Types.ObjectId(participant.toString())
    let personTotalKcal = 0
    let personTotalActiveMin = 0

    for (const dayDate of days) {
      // Thời gian join = đúng giờ sự kiện ± 5 phút
      const joinedAt = getSessionTime(dayDate, event.startDate)

      // Thời lượng call: 10-15 phút
      const totalMinutes = rand(10, 15)
      const totalSeconds = Math.round(totalMinutes * 60)

      // AI xác nhận có mặt: 80-100% thời gian thực
      const aiRatio = rand(0.80, 1.00)
      const activeSeconds = Math.round(totalSeconds * aiRatio)

      // Tính kcal
      const caloriesBurned = roundKcal((activeSeconds / 60) * kcalPerMin)

      // Giá trị progress theo targetUnit
      const progressValue = calcProgressValue(event.targetUnit, activeSeconds, caloriesBurned)

      const endedAt = new Date(joinedAt.getTime() + totalSeconds * 1000)
      const activeMin = Math.round(activeSeconds / 60)
      const aiPct = Math.round((activeSeconds / totalSeconds) * 100)

      // Tạo VideoSession
      const vs = await VideoSessionModel.create({
        eventId,
        sessionId: null,
        userId,
        joinedAt,
        endedAt,
        activeSeconds,
        totalSeconds,
        caloriesBurned,
        status: 'ended',
        screenshots: [SCREENSHOT_URL],
        progressId: null,
        is_deleted: false
      })

      // Tạo Progress
      const prog = await ProgressModel.create({
        eventId,
        userId,
        date: joinedAt,
        value: progressValue,
        unit: event.targetUnit || 'calories',
        distance: null,
        time: `${activeMin} phút`,
        calories: caloriesBurned,
        proofImage: SCREENSHOT_URL,
        notes: `Yoga video call — ${activeMin}p (AI ${aiPct}%)`,
        source: 'video_call',
        sessionId: null,
        activeSeconds,
        is_deleted: false
      })

      // Link progress → video session
      await VideoSessionModel.findByIdAndUpdate(vs._id, { progressId: prog._id })

      personTotalKcal += caloriesBurned
      personTotalActiveMin += activeSeconds / 60
      totalSessions++
    }

    allKcalPerPerson.push(personTotalKcal)
  }

  // Thống kê
  const avgKcal = allKcalPerPerson.reduce((a, b) => a + b, 0) / allKcalPerPerson.length
  const minKcal = Math.min(...allKcalPerPerson)
  const maxKcal = Math.max(...allKcalPerPerson)

  console.log(`\n   ✅ Tạo xong: ${totalSessions} sessions`)
  console.log(`   📊 kcal/người: avg=${avgKcal.toFixed(1)}, min=${minKcal.toFixed(1)}, max=${maxKcal.toFixed(1)}`)

  // Tính targetValue mới sao cho tiến độ cá nhân đạt 90-100%
  // progressPercent = totalPersonKcal / (targetValue / maxParticipants) * 100
  // Muốn = 90-100% → targetValue/maxParticipants = totalPersonKcal / (0.90 to 1.00)
  // Dùng avgKcal, đặt perPersonTarget = avgKcal / rand(0.92, 0.98) để hầu hết 90-100%
  const targetRatio = rand(0.92, 0.98)
  const perPersonTarget = avgKcal / targetRatio
  const newTargetValue = Math.round(perPersonTarget * maxParticipants)

  console.log(`   🎯 targetValue mới = ${newTargetValue} (perPerson=${perPersonTarget.toFixed(1)} kcal, ratio=${(targetRatio * 100).toFixed(0)}%)`)

  // Cập nhật targetValue sự kiện
  await db.collection('sport_events').updateOne(
    { _id: eventId },
    { $set: { targetValue: newTargetValue, targetUnit: 'calories' } }
  )
  console.log(`   ✅ Đã cập nhật targetValue: ${event.targetValue} → ${newTargetValue} calories`)

  // Kiểm tra % tiến độ mẫu
  const perPersonNew = newTargetValue / maxParticipants
  const progressSamples = allKcalPerPerson.slice(0, 5).map(k =>
    `${Math.min(100, Math.round(k / perPersonNew * 100))}%`
  )
  console.log(`   📈 Mẫu tiến độ (5 người đầu): ${progressSamples.join(', ')}`)

  return {
    eventId,
    eventName,
    totalSessions,
    avgKcal: avgKcal.toFixed(1),
    newTargetValue,
    participants: participants.length,
    days: days.length
  }
}

async function main() {
  try {
    console.log('🔗 Kết nối MongoDB...')
    await mongoose.connect(MONGODB_URL)
    console.log('✅ Đã kết nối\n')

    const db = mongoose.connection.db

    // Lấy tất cả sự kiện trong nhà đã bắt đầu (startDate <= today)
    const events = await db.collection('sport_events').find({
      eventType: 'Trong nhà',
      isDeleted: { $ne: true },
      startDate: { $lte: TODAY }
    }).toArray()

    console.log(`🏠 Sự kiện trong nhà đã bắt đầu: ${events.length}`)
    for (const e of events) {
      console.log(`  - ${e.name} [${e._id}]`)
    }

    const results = []
    for (const event of events) {
      const result = await seedEvent(db, event)
      if (result) results.push(result)
    }

    // Tổng kết
    console.log(`\n${'='.repeat(60)}`)
    console.log('🎉 TẤT CẢ HOÀN THÀNH!\n')
    console.log('Tổng kết:')
    for (const r of results) {
      console.log(`  [${r.eventName}]`)
      console.log(`    Participants: ${r.participants} | Ngày: ${r.days} | Sessions: ${r.totalSessions}`)
      console.log(`    Avg kcal/người: ${r.avgKcal} | targetValue mới: ${r.newTargetValue} calories`)
    }

  } catch (err) {
    console.error('❌ Lỗi:', err.message)
    console.error(err.stack)
  } finally {
    await mongoose.disconnect()
    console.log('\n🔌 Đã ngắt kết nối')
    process.exit(0)
  }
}

main()
