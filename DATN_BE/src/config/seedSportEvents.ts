import SportEventModel from '~/models/schemas/sportEvent.schema'
import { Types } from 'mongoose'
import fs from 'fs'
import path from 'path'
import UserModel from '~/models/schemas/user.schema'

// ============================================================
// Data sự kiện thể thao mới - cập nhật ngày 2026
// ============================================================
type RawSeedEvent = {
  name: string
  description?: string
  category?: string
  startDate: string
  endDate: string
  location?: string
  maxParticipants?: number
  image?: string
  eventType?: string
  creatorEmail?: string
  createdAt?: string
  participants?: number
  participants_ids?: string[]
}

const INDOOR_CATEGORIES = new Set([
  'Yoga',
  'Fitness',
  'Gym / Fitness',
  'Pilates',
  'Thiền',
  'Dance / Aerobics',
  'Khiêu vũ',
  'Cardio',
  'Zumba',
  'HIIT',
  'Kickboxing',
  'Stretching'
])

function normalizeEventType(rawEvent: RawSeedEvent): 'Trong nhà' | 'Ngoài trời' {
  if (rawEvent.eventType === 'online') return 'Trong nhà'
  if (rawEvent.eventType === 'offline') return 'Ngoài trời'
  if (INDOOR_CATEGORIES.has(rawEvent.category || '')) return 'Trong nhà'
  return 'Ngoài trời'
}

function loadSportEventsSeed(): RawSeedEvent[] {
  try {
    const seedFilePath = path.join(__dirname, '../../data/sport-events.seed.json')
    const raw = fs.readFileSync(seedFilePath, 'utf8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as RawSeedEvent[]) : []
  } catch (error) {
    console.error('❌ Không đọc được file sport-events.seed.json:', error)
    return []
  }
}

// ============================================================
// Hàm seed chính – luôn xóa data cũ và import lại data mới
// ============================================================
export const seedSportEventsData = async () => {
  try {
    console.log('🗑️  Xóa toàn bộ sport events cũ...')
    await SportEventModel.deleteMany({})

    console.log('🏃 Đang import sport events mới vào database...')

    // Get distinct emails
    const sportEventsData = loadSportEventsSeed()
    const emails = [...new Set(sportEventsData.map(e => e.creatorEmail).filter(Boolean))] as string[]
    const users = await UserModel.find({ email: { $in: emails } })
    const userMap = new Map(users.map(u => [u.email, u._id]))

    const adminUserId = new Types.ObjectId('507f1f77bcf86cd799439011')

    const eventsToInsert = sportEventsData.map((event) => {
      const creatorId = event.creatorEmail ? userMap.get(event.creatorEmail) || adminUserId : adminUserId
      return {
        name: event.name,
        description: event.description || '',
        category: event.category || 'Chạy bộ',
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate),
        createdAt: event.createdAt ? new Date(event.createdAt) : new Date(),
        location: event.location || 'Online',
        maxParticipants: Math.max(1, Number(event.maxParticipants) || 1),
        participants: Math.max(0, Number(event.participants) || 0),
        image: event.image || '',
        eventType: normalizeEventType(event),
        participants_ids: [],
        createdBy: creatorId
      }
    })

    await SportEventModel.insertMany(eventsToInsert)
    console.log(`✅ Đã import thành công ${eventsToInsert.length} sport events mới vào database!`)
  } catch (error) {
    console.error('❌ Lỗi khi seed sport events:', error)
  }
}

export default seedSportEventsData
