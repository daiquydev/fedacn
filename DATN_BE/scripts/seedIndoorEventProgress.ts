import 'dotenv/config'
import mongoose from 'mongoose'
import moment from 'moment'
import dotenv from 'dotenv'
dotenv.config()

import SportEventModel from '../src/models/schemas/sportEvent.schema'
import SportEventProgressModel from '../src/models/schemas/sportEventProgress.schema'
import SportEventVideoSessionModel from '../src/models/schemas/sportEventVideoSession.schema'
import UserModel from '../src/models/schemas/user.schema'
import SportCategoryModel from '../src/models/schemas/sportCategory.schema'

const DEFAULT_KCAL_PER_MINUTE = 4

async function getKcalPerMinute(category: string): Promise<number> {
  const cat = await SportCategoryModel.findOne({ name: category, isDeleted: { $ne: true } })
  if (cat && cat.kcal_per_unit > 0) return cat.kcal_per_unit
  return DEFAULT_KCAL_PER_MINUTE
}

const INDOOR_EVENT_ID = '69ad37c08530ab567e585987'
const TARGET_USER_EMAIL = 'user1@gmail.com'
const DAYS_BACK = 15
const SESSIONS_PER_DAY = 1 // 1 video call session per day

async function main() {
  console.log('🔗 Connecting to MongoDB...')
  await mongoose.connect(process.env.MONGODB_URL as string)
  console.log('✅ Connected to MongoDB')

  const event = await SportEventModel.findById(INDOOR_EVENT_ID)
  if (!event) {
    console.log('❌ Event not found!')
    process.exit(1)
  }
  console.log(`📅 Found Event: ${event.name}`)
  console.log(`🎯 Target Unit: ${event.targetUnit}`)

  // Lấy kcal rate đúng từ SportCategory
  const kcalPerMinute = await getKcalPerMinute(event.category || '')
  console.log(`💪 Rate: ${kcalPerMinute} kcal/phút (category: ${event.category})`)

  const targetUser = await UserModel.findOne({ email: TARGET_USER_EMAIL })
  if (!targetUser) {
    console.log('❌ user1@gmail.com not found!')
    process.exit(1)
  }
  console.log(`👤 Found user1: ${targetUser._id} (${targetUser.name})`)

  const participants = event.participants_ids || []
  if (participants.length === 0) {
    console.log('❌ No participants found!')
    process.exit(1)
  }
  console.log(`👥 Total participants to seed: ${participants.length}`)

  // Clean up old generated data
  console.log('🧹 Cleaning up old generated data...')
  await SportEventProgressModel.deleteMany({
    eventId: event._id,
    notes: 'Auto generated indoor session'
  })
  await SportEventVideoSessionModel.deleteMany({
    eventId: event._id
  })
  console.log('🧹 Cleaned up. Generating...')

  let insertedCount = 0

  for (const userId of participants) {
    console.log(`Processing user: ${userId}`)

    for (let day = DAYS_BACK - 1; day >= 0; day--) {
      const sessionDate = moment().subtract(day, 'days').set({
        hour: 7 + Math.floor(Math.random() * 4), // 7:00 ~ 11:00
        minute: Math.floor(Math.random() * 60),
        second: 0
      }).toDate()

      // Randomize: 25~55 minutes active, 85~95% AI presence ratio
      const activeSeconds = (25 + Math.floor(Math.random() * 30)) * 60
      const presenceRatio = 0.85 + Math.random() * 0.1
      const totalSeconds = Math.round(activeSeconds / presenceRatio)
      // Tính calories đúng: activeSeconds/60 × kcal/phút từ SportCategory
      const caloriesBurned = Math.round((activeSeconds / 60) * kcalPerMinute)

      const endedAt = moment(sessionDate).add(totalSeconds, 'seconds').toDate()

      // 1. Create SportEventProgress (progress entry)
      //    For kcal events, value = caloriesBurned. For minute events, value = minutes
      const isKcal = (event.targetUnit || '').toLowerCase().includes('kcal')
      const progressValue = isKcal ? caloriesBurned : Math.round(activeSeconds / 60)

      const progressEntry = await SportEventProgressModel.create({
        eventId: event._id,
        userId,
        date: sessionDate,
        value: progressValue,
        unit: event.targetUnit || 'kcal',
        calories: caloriesBurned,
        activeSeconds,
        source: 'video_call',
        notes: 'Auto generated indoor session'
      })

      // 2. Create VideoSession linked to that progress entry
      await SportEventVideoSessionModel.create({
        eventId: event._id,
        userId,
        joinedAt: sessionDate,
        endedAt,
        activeSeconds,
        totalSeconds,
        caloriesBurned,
        status: 'ended',
        progressId: progressEntry._id
      })

      insertedCount++
    }
  }

  console.log(`✅ Successfully inserted ${insertedCount} session pairs (VideoSession + Progress)!`)
  await mongoose.disconnect()
  console.log('🔌 Disconnected from MongoDB')
}

main().catch((err) => {
  console.error('❌ Error:', err)
  process.exit(1)
})
