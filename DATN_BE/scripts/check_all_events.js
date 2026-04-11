const mongoose = require('mongoose')
const MONGODB_URL = 'mongodb+srv://daiquy:10102003@cluster0.cxzaocf.mongodb.net/?appName=Cluster0'

mongoose.connect(MONGODB_URL).then(async () => {
  const db = mongoose.connection.db

  // Get all outdoor events
  const events = await db.collection('sport_events').find({
    eventType: 'Ngoài trời',
    isDeleted: { $ne: true }
  }).toArray()

  console.log(`\n🏟️  Tổng số sự kiện Ngoài trời: ${events.length}\n`)

  // Get all sport categories
  const cats = await db.collection('sport_categories').find({ isDeleted: { $ne: true } }).toArray()
  const catMap = {}
  cats.forEach(c => { catMap[c.name] = c })

  for (const ev of events) {
    const cat = catMap[ev.category] || {}
    const kcal = cat.kcal_per_unit || '?'
    const unit = cat.unit || ev.targetUnit || 'km'

    // Count participants with progress
    const progAgg = await db.collection('sport_event_progress').aggregate([
      { $match: { eventId: ev._id, is_deleted: { $ne: true } } },
      { $group: { _id: '$userId', total: { $sum: '$value' } } }
    ]).toArray()

    const participantIds = ev.participants_ids || []
    const withProgress = progAgg.filter(p => p.total > 0).length
    const withoutProgress = participantIds.length - withProgress

    console.log(`📌 [${ev._id}] ${ev.name}`)
    console.log(`   Category: ${ev.category} | kcal/${unit}: ${kcal}`)
    console.log(`   Dates: ${ev.startDate ? new Date(ev.startDate).toLocaleDateString('vi-VN') : '?'} → ${ev.endDate ? new Date(ev.endDate).toLocaleDateString('vi-VN') : '?'}`)
    console.log(`   Target: ${ev.targetValue || '?'} ${ev.targetUnit || 'km'}`)
    console.log(`   Participants: ${participantIds.length} total | ${withProgress} có data | ${withoutProgress} chưa có`)
    console.log()
  }

  mongoose.disconnect()
}).catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
