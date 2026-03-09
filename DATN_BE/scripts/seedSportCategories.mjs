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
        type: { type: String, enum: ['Ngoài trời', 'Trong nhà'], required: true }
    },
    { timestamps: true, collection: 'sport_categories' }
)

const SportCategoryModel = mongoose.model('SportCategorySeeder', SportCategorySchema)

const defaultCategories = [
    { name: 'Chạy bộ', type: 'Ngoài trời' },
    { name: 'Yoga', type: 'Trong nhà' },
    { name: 'Bơi lội', type: 'Ngoài trời' },
    { name: 'Bóng rổ', type: 'Ngoài trời' },
    { name: 'Cầu lông', type: 'Trong nhà' },
    { name: 'Gym / Fitness', type: 'Trong nhà' },
    { name: 'Đạp xe', type: 'Ngoài trời' },
    { name: 'Bóng đá', type: 'Ngoài trời' },
    { name: 'Pilates', type: 'Trong nhà' },
    { name: 'Leo núi', type: 'Ngoài trời' },
    { name: 'Bơi lội', type: 'Ngoài trời' },
    { name: 'Đánh tennis', type: 'Ngoài trời' },
    { name: 'Zumba', type: 'Trong nhà' }
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
