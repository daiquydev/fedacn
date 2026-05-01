/**
 * Script: Chỉnh sửa thời gian sự kiện sắp diễn ra thành đang diễn ra & Cập nhật mục tiêu (targetValue)
 * Chạy: npx ts-node -r tsconfig-paths/register scripts/updateEventTargets.ts
 */
import mongoose from 'mongoose'
import { config } from 'dotenv'
import path from 'path'
import moment from 'moment'
import SportEventModel from '../src/models/schemas/sportEvent.schema'

config({ path: path.join(__dirname, '../.env') })

const MONGODB_URI = process.env.MONGODB_URL || ''

const EXPECTED_DAILY_VALUE: Record<string, number> = {
  'Chạy bộ': 3.5,
  'Đạp xe': 10,
  'Đi bộ': 2,
  'Đi bộ đường dài': 5.5,
  'Chạy địa hình': 5,
  'Trượt patin': 4,
  'Chạy bộ đường dài': 10,
  'Bơi lội': 1,
  'DEFAULT_OUTDOOR': 3,
  'DEFAULT_INDOOR': 30 // phút
}

async function run() {
  try {
    console.log('🔌 Đang kết nối MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Kết nối thành công!')

    const events = await SportEventModel.find({ isDeleted: { $ne: true } })
    console.log(`📋 Tìm thấy ${events.length} sự kiện. Đang xử lý...`)

    const now = moment()
    let updatedDatesCount = 0
    let updatedTargetsCount = 0

    for (const event of events) {
      let isModified = false

      // 1. Chỉnh thời gian sự kiện: Bắt đầu từ giữa T4, kết thúc cuối T6
      // (Bỏ qua sự kiện đã kết thúc hẳn trong quá khứ nếu không muốn, nhưng user bảo "Đối với các sự kiện đang diễn ra...")
      // Các sự kiện "Đang diễn ra" là event có endDate >= now. Chúng ta sẽ đặt lại:
      // startDate: random 10/04 - 18/04
      // endDate: random 20/06 - 30/06
      
      if (moment(event.endDate).isSameOrAfter(now, 'day')) {
        const startDay = Math.floor(Math.random() * (18 - 10 + 1)) + 10;
        const endDay = Math.floor(Math.random() * (30 - 20 + 1)) + 20;
        
        event.startDate = moment(`2026-04-${startDay.toString().padStart(2, '0')}T00:00:00+07:00`).toDate();
        event.endDate = moment(`2026-06-${endDay.toString().padStart(2, '0')}T23:59:59+07:00`).toDate();
        
        isModified = true
        updatedDatesCount++
      }

      // 2. Tính lại mục tiêu
      const durationDays = Math.max(1, moment(event.endDate).diff(moment(event.startDate), 'days'))
      const participants = event.participants || 0

      let dailyExpected = 0
      if (event.eventType === 'Ngoài trời') {
        dailyExpected = EXPECTED_DAILY_VALUE[event.category] || EXPECTED_DAILY_VALUE['DEFAULT_OUTDOOR']
      } else {
        dailyExpected = EXPECTED_DAILY_VALUE['DEFAULT_INDOOR']
      }

      // targetValue = loại môn thể thao * thời gian * số lượng người
      const newTarget = Math.round(dailyExpected * durationDays * participants)
      
      if (event.targetValue !== newTarget) {
        event.targetValue = newTarget
        isModified = true
        updatedTargetsCount++
      }

      if (isModified) {
        await event.save()
      }
    }

    console.log(`✅ Hoàn tất cập nhật!`)
    console.log(`   - Dịch chuyển ${updatedDatesCount} sự kiện sắp diễn ra thành đang diễn ra.`)
    console.log(`   - Cập nhật mục tiêu cho ${updatedTargetsCount} sự kiện.`)

    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error('❌ Lỗi:', error)
    process.exit(1)
  }
}

run()
