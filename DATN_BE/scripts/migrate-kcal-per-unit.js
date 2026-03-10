/**
 * Migration script: Thêm kcal_per_unit cho các SportCategory hiện tại
 * Chuyển đổi từ CALORIE_TABLE cũ (kcal/giờ cho ~70kg) sang kcal/phút (Trong nhà) hoặc kcal/km (Ngoài trời)
 *
 * Chạy: node scripts/migrate-kcal-per-unit.js
 */
require('dotenv').config()
const mongoose = require('mongoose')

const MONGODB_URL = process.env.MONGODB_URL

// Giá trị mặc định dựa trên CALORIE_TABLE cũ, chuyển đổi sang đơn vị phù hợp
// Trong nhà: kcal/giờ ÷ 60 = kcal/phút
// Ngoài trời: kcal/km (ước tính dựa trên tốc độ trung bình)
const DEFAULT_VALUES = {
    // Trong nhà (kcal/phút)
    'Yoga': 3.3,           // 200 kcal/h ÷ 60
    'Pilates': 3.3,        // 200 kcal/h ÷ 60
    'Thiền': 2,            // 120 kcal/h ÷ 60
    'Zumba': 6.7,          // 400 kcal/h ÷ 60
    'Nhảy': 6.3,           // 380 kcal/h ÷ 60
    'Khiêu vũ': 6.3,
    'Gym / Fitness': 5.8,  // 350 kcal/h ÷ 60
    'Thể dục thể hình': 5.8,
    'Cầu lông': 7.5,
    'Tennis': 7.5,
    'Bóng bàn': 5,
    'Bóng rổ': 7.5,
    'Bóng đá': 7.5,
    'Bóng chuyền': 5.8,
    'Bơi lội': 8.3,
    'Kickboxing': 9.2,
    'Võ thuật': 8.3,
    'Taekwondo': 8.3,
    'Boxing': 9.2,
    // Ngoài trời (kcal/km)
    'Chạy bộ': 60,        // ~60 kcal/km trung bình
    'Đạp xe': 30,          // ~30 kcal/km trung bình
    'Đi bộ': 40,           // ~40 kcal/km trung bình
    'Leo núi': 70,         // ~70 kcal/km trung bình
}

async function migrate() {
    if (!MONGODB_URL) {
        console.error('❌ MONGODB_URL not found in .env')
        process.exit(1)
    }

    await mongoose.connect(MONGODB_URL)
    console.log('✅ Connected to MongoDB')

    const db = mongoose.connection.db
    const collection = db.collection('sport_categories')

    const categories = await collection.find({}).toArray()
    console.log(`📋 Found ${categories.length} categories to update`)

    let updated = 0
    for (const cat of categories) {
        if (cat.kcal_per_unit !== undefined && cat.kcal_per_unit !== null) {
            console.log(`  ⏭️  ${cat.name}: already has kcal_per_unit = ${cat.kcal_per_unit}`)
            continue
        }

        const defaultVal = DEFAULT_VALUES[cat.name]
        const kcalPerUnit = defaultVal || (cat.type === 'Ngoài trời' ? 50 : 4)

        await collection.updateOne(
            { _id: cat._id },
            { $set: { kcal_per_unit: kcalPerUnit } }
        )
        console.log(`  ✅ ${cat.name} (${cat.type}): set kcal_per_unit = ${kcalPerUnit}`)
        updated++
    }

    console.log(`\n🎉 Migration complete: ${updated}/${categories.length} categories updated`)
    await mongoose.disconnect()
    process.exit(0)
}

migrate().catch(err => {
    console.error('❌ Migration failed:', err)
    process.exit(1)
})
