import mongoose from 'mongoose'
import { config } from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

config({ path: path.join(__dirname, '../.env') })

const MONGODB_URL = process.env.MONGODB_URL || ''

const SportCategorySchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        type: { type: String, enum: ['Ngoài trời', 'Trong nhà'], required: true },
        kcal_per_unit: { type: Number, default: 0, min: 0 },
        icon: { type: String, default: 'sport' }
    },
    { timestamps: true, collection: 'sport_categories' }
)

const SportCategoryModel = mongoose.model('SportCategorySeeder', SportCategorySchema)

// Ngoài trời: kcal_per_unit = kcal/km (track quãng đường)
// Trong nhà: kcal_per_unit = kcal/phút (track thời gian video)
const defaultCategories = [
    // ──── NGOÀI TRỜI (Track km) ────
    { name: 'Chạy bộ', type: 'Ngoài trời', kcal_per_unit: 65, icon: 'running' },
    { name: 'Đạp xe', type: 'Ngoài trời', kcal_per_unit: 30, icon: 'cycling' },
    { name: 'Đi bộ', type: 'Ngoài trời', kcal_per_unit: 50, icon: 'walking' },
    { name: 'Đi bộ đường dài', type: 'Ngoài trời', kcal_per_unit: 62, icon: 'hiking' },
    { name: 'Chạy trail', type: 'Ngoài trời', kcal_per_unit: 80, icon: 'trail' },
    { name: 'Trượt patin', type: 'Ngoài trời', kcal_per_unit: 40, icon: 'skating' },
    { name: 'Chạy bộ đường dài', type: 'Ngoài trời', kcal_per_unit: 70, icon: 'marathon' },

    // ──── TRONG NHÀ (Tập theo video/phút) ────
    { name: 'Yoga', type: 'Trong nhà', kcal_per_unit: 4, icon: 'yoga' },
    { name: 'Gym / Fitness', type: 'Trong nhà', kcal_per_unit: 7, icon: 'gym' },
    { name: 'Pilates', type: 'Trong nhà', kcal_per_unit: 5, icon: 'pilates' },
    { name: 'Zumba', type: 'Trong nhà', kcal_per_unit: 9, icon: 'zumba' },
    { name: 'HIIT', type: 'Trong nhà', kcal_per_unit: 12, icon: 'hiit' },
    { name: 'Kickboxing', type: 'Trong nhà', kcal_per_unit: 9, icon: 'kickboxing' },
    { name: 'Dance / Aerobics', type: 'Trong nhà', kcal_per_unit: 8, icon: 'dance' },
    { name: 'Stretching', type: 'Trong nhà', kcal_per_unit: 3, icon: 'stretching' },
    { name: 'Meditation', type: 'Trong nhà', kcal_per_unit: 1.5, icon: 'meditation' },
    { name: 'Bơi lội', type: 'Trong nhà', kcal_per_unit: 7, icon: 'swimming' },
    { name: 'Cardio', type: 'Trong nhà', kcal_per_unit: 10, icon: 'cardio' },
    { name: 'Bodyweight', type: 'Trong nhà', kcal_per_unit: 6, icon: 'bodyweight' }
]

async function seedSportCategories() {
    try {
        await mongoose.connect(MONGODB_URL)
        console.log('✅ Connected to MongoDB')

        const count = await SportCategoryModel.countDocuments()
        console.log(`📊 Current sport categories count: ${count}`)

        if (count === 0) {
            await SportCategoryModel.insertMany(defaultCategories)
            console.log(`✅ Seeded ${defaultCategories.length} sport categories!`)
        } else {
            console.log(`ℹ️ Already has ${count} categories, skipping seed`)
        }

        const docs = await SportCategoryModel.find().sort({ name: 1 })
        console.log('\n📋 All categories:')
        docs.forEach((d) => console.log(`  ${d._id} | ${d.name} | ${d.type}`))
    } catch (err) {
        console.error('❌ Error:', err)
    } finally {
        await mongoose.disconnect()
        console.log('\n🔌 Disconnected from MongoDB')
    }
}

seedSportCategories()
