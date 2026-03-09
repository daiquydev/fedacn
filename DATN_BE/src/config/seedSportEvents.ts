import SportEventModel from '~/models/schemas/sportEvent.schema'
import { Types } from 'mongoose'

// ============================================================
// Data sự kiện thể thao mới - cập nhật ngày 2026
// ============================================================
const sportEventsData: any[] = []

// ============================================================
// Hàm seed chính – luôn xóa data cũ và import lại data mới
// ============================================================
export const seedSportEventsData = async () => {
  try {
    console.log('🗑️  Xóa toàn bộ sport events cũ...')
    await SportEventModel.deleteMany({})

    console.log('🏃 Đang import sport events mới vào database...')

    // ID placeholder cho createdBy – thay bằng ObjectId admin thật nếu cần
    const adminUserId = new Types.ObjectId('507f1f77bcf86cd799439011')

    const eventsToInsert = sportEventsData.map((event) => ({
      ...event,
      createdBy: adminUserId
    }))

    await SportEventModel.insertMany(eventsToInsert)
    console.log(`✅ Đã import thành công ${eventsToInsert.length} sport events mới vào database!`)
  } catch (error) {
    console.error('❌ Lỗi khi seed sport events:', error)
  }
}

export default seedSportEventsData
