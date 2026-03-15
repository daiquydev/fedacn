/**
 * Migration: Cập nhật icon cho các danh mục thể thao hiện tại trong DB.
 * Map tên category -> icon key phù hợp.
 *
 * Chạy: node scripts/migrate-sport-category-icons.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const mongoose = require('mongoose')

const MONGODB_URL = process.env.MONGODB_URL
if (!MONGODB_URL) {
  console.error('❌ MONGODB_URL not found in .env')
  process.exit(1)
}

// Map tên category (lowercase) -> icon key
const NAME_TO_ICON = {
  'chạy bộ': 'running',
  'đạp xe': 'cycling',
  'dua xe': 'cycling',
  'leo núi': 'hiking',
  'bóng rổ': 'basketball',
  'bóng đá': 'soccer',
  'bơi lội': 'swimming',
  'cầu lông': 'badminton',
  'yoga': 'yoga',
  'gym / fitness': 'fitness',
  'gym/fitness': 'fitness',
  'pilates': 'pilates',
  'quần vợt': 'tennis',
  'bóng chuyền': 'volleyball',
  'bóng bàn': 'tabletennis',
  'trượt băng': 'skating',
  'golf': 'golf',
  'võ thuật': 'martial_arts',
}

async function migrate() {
  console.log('🔗 Connecting to MongoDB...')
  await mongoose.connect(MONGODB_URL)
  console.log('✅ Connected!')

  const collection = mongoose.connection.db.collection('sport_categories')
  const categories = await collection.find({}).toArray()

  console.log(`\n📋 Found ${categories.length} categories:\n`)

  let updated = 0
  for (const cat of categories) {
    const nameKey = cat.name.toLowerCase().trim()
    const newIcon = NAME_TO_ICON[nameKey]

    if (newIcon && cat.icon !== newIcon) {
      await collection.updateOne(
        { _id: cat._id },
        { $set: { icon: newIcon } }
      )
      console.log(`  ✅ "${cat.name}" : "${cat.icon || 'N/A'}" → "${newIcon}"`)
      updated++
    } else if (newIcon) {
      console.log(`  ⏭️  "${cat.name}" : already "${cat.icon}" (correct)`)
    } else {
      console.log(`  ⚠️  "${cat.name}" : no mapping found, keeping "${cat.icon || 'sport'}"`)
    }
  }

  console.log(`\n✅ Updated ${updated} categories.`)
  await mongoose.disconnect()
  console.log('🔌 Disconnected.')
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err)
  process.exit(1)
})
