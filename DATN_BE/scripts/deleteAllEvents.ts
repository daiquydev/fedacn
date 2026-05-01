import mongoose from 'mongoose'
import { config } from 'dotenv'
import path from 'path'
import SportEventModel from '../src/models/schemas/sportEvent.schema'
import SportEventAttendanceModel from '../src/models/schemas/sportEventAttendance.schema'
import SportEventProgressModel from '../src/models/schemas/sportEventProgress.schema'

config({ path: path.join(__dirname, '../.env') })

const MONGODB_URI = process.env.MONGODB_URL || ''

async function run() {
  try {
    console.log('🔌 Đang kết nối MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Kết nối thành công!')

    console.log('🗑️ Bắt đầu xóa dữ liệu sự kiện thể thao...')

    const deleteEvents = await SportEventModel.deleteMany({})
    console.log(`- Đã xóa ${deleteEvents.deletedCount} sự kiện thể thao.`)

    const deleteAttendances = await SportEventAttendanceModel.deleteMany({})
    console.log(`- Đã xóa ${deleteAttendances.deletedCount} người tham gia sự kiện.`)

    const deleteProgress = await SportEventProgressModel.deleteMany({})
    console.log(`- Đã xóa ${deleteProgress.deletedCount} tiến độ sự kiện.`)

    console.log(`✅ Hoàn tất xóa dữ liệu!`)

    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error('❌ Lỗi:', error)
    process.exit(1)
  }
}

run()
