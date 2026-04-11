const mongoose = require('mongoose')
const MONGODB_URL = 'mongodb+srv://daiquy:10102003@cluster0.cxzaocf.mongodb.net/?appName=Cluster0'

mongoose.connect(MONGODB_URL).then(async () => {
  const db = mongoose.connection.db

  // Sport categories indoor
  const cats = await db.collection('sport_categories').find({ type: 'Trong nhà', isDeleted: { $ne: true } }).toArray()
  console.log('=== DANH MỤC THỂ THAO TRONG NHÀ ===')
  for (const c of cats) {
    console.log(`  [${c._id}] ${c.name} | kcal/phút: ${c.kcal_per_unit} | icon: ${c.icon}`)
  }

  // Existing indoor events
  const events = await db.collection('sport_events').find({ eventType: 'Trong nhà', isDeleted: { $ne: true } }).toArray()
  console.log('\n=== SỰ KIỆN TRONG NHÀ HIỆN CÓ ===')
  const catCounts = {}
  for (const e of events) {
    if (!catCounts[e.category]) catCounts[e.category] = 0
    catCounts[e.category]++
    const start = new Date(e.startDate).toLocaleDateString('vi-VN')
    const end = new Date(e.endDate).toLocaleDateString('vi-VN')
    console.log(`  ${e.category}: "${e.name}" (${start} → ${end}) target=${e.targetValue} ${e.targetUnit}`)
  }

  console.log('\n=== SỰ KIỆN THEO DANH MỤC ===')
  for (const [cat, count] of Object.entries(catCounts)) {
    console.log(`  ${cat}: ${count} sự kiện`)
  }

  // Users list for participants
  const users = await db.collection('users').find({}, { projection: { _id: 1, name: 1, avatar: 1 } }).limit(30).toArray()
  console.log(`\n=== USERS (${users.length} users) ===`)
  for (const u of users) {
    console.log(`  [${u._id}] ${u.name}`)
  }

  // Get admin/creator user
  const admin = await db.collection('users').findOne({ role: 'admin' })
  if (admin) console.log(`\nAdmin: [${admin._id}] ${admin.name}`)

  process.exit(0)
}).catch(e => { console.error(e); process.exit(1) })
