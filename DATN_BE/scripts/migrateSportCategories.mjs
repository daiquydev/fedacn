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
        icon: { type: String, default: 'sport' },
        isDeleted: { type: Boolean, default: false },
        deletedAt: { type: Date, default: null }
    },
    { timestamps: true, collection: 'sport_categories' }
)

const SportCategoryModel = mongoose.model('SportCategory', SportCategorySchema)

// Danh mục mới theo Option A
const newCategories = [
    // ──── NGOÀI TRỜI (kcal/km) ────
    { name: 'Chạy bộ', type: 'Ngoài trời', kcal_per_unit: 65, icon: 'running' },
    { name: 'Đạp xe', type: 'Ngoài trời', kcal_per_unit: 30, icon: 'cycling' },
    { name: 'Đi bộ', type: 'Ngoài trời', kcal_per_unit: 50, icon: 'walking' },
    { name: 'Đi bộ đường dài', type: 'Ngoài trời', kcal_per_unit: 62, icon: 'hiking' },
    { name: 'Chạy trail', type: 'Ngoài trời', kcal_per_unit: 80, icon: 'trail' },
    { name: 'Trượt patin', type: 'Ngoài trời', kcal_per_unit: 40, icon: 'skating' },
    { name: 'Chạy bộ đường dài', type: 'Ngoài trời', kcal_per_unit: 70, icon: 'marathon' },

    // ──── TRONG NHÀ (kcal/phút) ────
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

// Danh mục cần xóa (team sport không phù hợp)
const categoriesToRemove = ['Bóng rổ', 'Cầu lông', 'Bóng đá', 'Leo núi', 'Đánh tennis']

async function migrateSportCategories() {
    try {
        await mongoose.connect(MONGODB_URL)
        console.log('✅ Connected to MongoDB')

        // 1. Hiển thị data hiện tại
        const existing = await SportCategoryModel.find().sort({ type: 1, name: 1 })
        console.log(`\n📊 Hiện tại có ${existing.length} danh mục:`)
        existing.forEach((d) => console.log(`  ${d._id} | ${d.name} | ${d.type} | ${d.kcal_per_unit || 0} kcal | deleted=${d.isDeleted}`))

        // 2. Soft-delete các danh mục team sport
        console.log('\n🗑️  Soft-delete các danh mục không phù hợp...')
        for (const name of categoriesToRemove) {
            const result = await SportCategoryModel.updateMany(
                { name, isDeleted: { $ne: true } },
                { isDeleted: true, deletedAt: new Date() }
            )
            if (result.modifiedCount > 0) {
                console.log(`  ❌ Soft-deleted: ${name} (${result.modifiedCount} docs)`)
            } else {
                console.log(`  ⏭️  Skipped (not found/already deleted): ${name}`)
            }
        }

        // 3. Xóa bản trùng Bơi lội (giữ 1 bản, xóa còn lại)
        const boiLoiDocs = await SportCategoryModel.find({ name: 'Bơi lội' })
        if (boiLoiDocs.length > 1) {
            console.log(`\n🔄 Tìm thấy ${boiLoiDocs.length} bản Bơi lội, giữ 1 bản...`)
            for (let i = 1; i < boiLoiDocs.length; i++) {
                await SportCategoryModel.findByIdAndUpdate(boiLoiDocs[i]._id, {
                    isDeleted: true,
                    deletedAt: new Date()
                })
                console.log(`  ❌ Soft-deleted duplicate: ${boiLoiDocs[i]._id}`)
            }
        }

        // 4. Cập nhật danh mục đã có (sửa type, kcal, icon)
        console.log('\n🔄 Cập nhật danh mục đã có...')
        for (const cat of newCategories) {
            const existingCat = await SportCategoryModel.findOne({ name: cat.name, isDeleted: { $ne: true } })
            if (existingCat) {
                await SportCategoryModel.findByIdAndUpdate(existingCat._id, {
                    type: cat.type,
                    kcal_per_unit: cat.kcal_per_unit,
                    icon: cat.icon
                })
                console.log(`  ✏️  Updated: ${cat.name} → ${cat.type} | ${cat.kcal_per_unit} kcal | icon=${cat.icon}`)
            }
        }

        // 5. Thêm danh mục mới chưa có
        console.log('\n➕ Thêm danh mục mới...')
        for (const cat of newCategories) {
            const exists = await SportCategoryModel.findOne({ name: cat.name, isDeleted: { $ne: true } })
            if (!exists) {
                await SportCategoryModel.create(cat)
                console.log(`  ✅ Created: ${cat.name} (${cat.type}) | ${cat.kcal_per_unit} kcal`)
            }
        }

        // 6. Hiển thị kết quả cuối
        const final = await SportCategoryModel.find({ isDeleted: { $ne: true } }).sort({ type: 1, name: 1 })
        console.log(`\n📋 Kết quả sau migration (${final.length} active):`)
        console.log('  ── Ngoài trời ──')
        final.filter((d) => d.type === 'Ngoài trời').forEach((d) => console.log(`  🏃 ${d.name} | ${d.kcal_per_unit} kcal/km`))
        console.log('  ── Trong nhà ──')
        final.filter((d) => d.type === 'Trong nhà').forEach((d) => console.log(`  🏠 ${d.name} | ${d.kcal_per_unit} kcal/phút`))
    } catch (err) {
        console.error('❌ Error:', err)
    } finally {
        await mongoose.disconnect()
        console.log('\n🔌 Disconnected from MongoDB')
    }
}

migrateSportCategories()
