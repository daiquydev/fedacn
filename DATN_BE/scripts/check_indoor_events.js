const mongoose = require('mongoose')
const MONGODB_URL = 'mongodb+srv://daiquy:10102003@cluster0.cxzaocf.mongodb.net/?appName=Cluster0'

mongoose.connect(MONGODB_URL).then(async () => {
  const db = mongoose.connection.db

  // Lấy tất cả sự kiện trong nhà chưa xóa
  const events = await db.collection('sport_events').find({
    eventType: 'Trong nhà',
    isDeleted: { $ne: true }
  }).toArray()

  console.log(`Tổng số sự kiện trong nhà: ${events.length}\n`)

  const now = new Date('2026-04-11T23:59:59Z')

  for (const e of events) {
    const startDate = new Date(e.startDate)
    const endDate = new Date(e.endDate)
    const isStarted = startDate <= now
    const daysFromStart = isStarted
      ? Math.floor((Math.min(now, endDate) - startDate) / (1000 * 60 * 60 * 24)) + 1
      : 0

    // Check existing video sessions
    const vsCount = await db.collection('sport_event_video_sessions').countDocuments({
      eventId: e._id,
      is_deleted: { $ne: true }
    })

    // Get category kcal_per_unit
    const cat = await db.collection('sport_categories').findOne({ name: e.category })
    const kcalPerMin = cat ? cat.kcal_per_unit : '?'

    console.log(`[${e._id}]`)
    console.log(`  Tên: ${e.name}`)
    console.log(`  Danh mục: ${e.category} (${kcalPerMin} kcal/phút)`)
    console.log(`  Loại: ${e.eventType}`)
    console.log(`  Bắt đầu: ${startDate.toLocaleString('vi-VN')} | Kết thúc: ${endDate.toLocaleString('vi-VN')}`)
    console.log(`  Giờ bắt đầu (UTC): ${startDate.toISOString()}`)
    console.log(`  Mục tiêu: ${e.targetValue} ${e.targetUnit}`)
    console.log(`  maxParticipants: ${e.maxParticipants} | participants: ${e.participants} (${e.participants_ids.length} IDs)`)
    console.log(`  Đã bắt đầu: ${isStarted ? 'Có' : 'Không'} | Số ngày cần seed: ${daysFromStart}`)
    console.log(`  Video sessions hiện có: ${vsCount}`)
    console.log()
  }

  process.exit(0)
}).catch(e => { console.error(e); process.exit(1) })
