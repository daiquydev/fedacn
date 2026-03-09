/**
 * Script: Xóa data sport events cũ và import data mới vào MongoDB
 * Chạy: npm run seed:sport-events
 */
import mongoose from 'mongoose'
import { config } from 'dotenv'
import { seedSportEventsData } from '../src/config/seedSportEvents'

config()

// Dùng cùng env var với project: MONGODB_URL
const MONGODB_URI =
    process.env.MONGODB_URL ||
    'mongodb+srv://yugi:yugi01@datn.zqrquqt.mongodb.net/test?retryWrites=true&w=majority'

const run = async () => {
    try {
        console.log('🔌 Đang kết nối MongoDB...')
        await mongoose.connect(MONGODB_URI)
        console.log('✅ Kết nối MongoDB thành công!')

        await seedSportEventsData()

        await mongoose.disconnect()
        console.log('🔌 Đã ngắt kết nối MongoDB.')
        process.exit(0)
    } catch (err) {
        console.error('❌ Lỗi khi chạy reseed:', err)
        await mongoose.disconnect()
        process.exit(1)
    }
}

run()
