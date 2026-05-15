import mongoose from 'mongoose'
import { envConfig } from '../constants/config'
import SportEventModel from '../models/schemas/sportEvent.schema'
import SportEventProgressModel from '../models/schemas/sportEventProgress.schema'
import SportCategoryModel from '../models/schemas/sportCategory.schema'

async function seedIndoorProgress() {
  await mongoose.connect(envConfig.mongoURL)
  console.log('Connected to MongoDB')

  const eventId = new mongoose.Types.ObjectId('69f473aee783662ba43977e2')
  const event = await SportEventModel.findById(eventId)
  if (!event) {
    console.error('Event not found')
    await mongoose.disconnect()
    return
  }

  const participants = event.participants_ids || []
  console.log(`Found ${participants.length} participants for event: ${event.name}`)

  const category = await SportCategoryModel.findOne({ name: event.category })
  const kcalPerMinute = category?.kcal_per_unit || 10 // Default if not found
  console.log(`Using kcal_per_unit: ${kcalPerMinute} (kcal/phút) for ${event.category}`)

  const evidencePhotos = [
    "https://res.cloudinary.com/da9cghklv/image/upload/v1778676758/video-call-screenshots/fwapltlhmxu8asynpqne.jpg",
    "https://res.cloudinary.com/da9cghklv/image/upload/v1778676767/video-call-screenshots/fw1ahyu6n779wrnofluz.jpg",
    "https://res.cloudinary.com/da9cghklv/image/upload/v1778676778/video-call-screenshots/lgqdlk260yawjojlo0vz.jpg",
    "https://res.cloudinary.com/da9cghklv/image/upload/v1778676790/video-call-screenshots/gy1tpdsjhr86qmuwn5cv.jpg",
    "https://res.cloudinary.com/da9cghklv/image/upload/v1778676799/video-call-screenshots/sl4kj6wljdyiioqdhv09.jpg",
    "https://res.cloudinary.com/da9cghklv/image/upload/v1778676807/video-call-screenshots/on8vve4n9qreer14qj6f.jpg",
    "https://res.cloudinary.com/da9cghklv/image/upload/v1778676815/video-call-screenshots/o58s8lyuapst1x05c6t5.jpg",
    "https://res.cloudinary.com/da9cghklv/image/upload/v1778676823/video-call-screenshots/iz5scyic1p89k6z25shj.jpg",
    "https://res.cloudinary.com/da9cghklv/image/upload/v1778676831/video-call-screenshots/vj60rpx8x724bttz6sqv.jpg",
    "https://res.cloudinary.com/da9cghklv/image/upload/v1778676839/video-call-screenshots/v649lyis732w92ayluep.jpg"
  ]

  // Clear existing data for this event to avoid duplicates
  await SportEventProgressModel.deleteMany({ eventId })
  console.log('Cleared existing progress data for this event')

  const startDate = new Date(event.startDate)
  const today = new Date()
  today.setHours(23, 59, 59, 999)

  for (const userId of participants) {
    console.log(`Seeding progress for user: ${userId}`)
    let currentDate = new Date(startDate)

    while (currentDate <= today) {
      // 90% chance to participate each day for realism
      if (Math.random() > 0.1) {
        const startTime = new Date(currentDate)
        // Each day participation starts from the event's start time onwards
        // But let's randomize the start hour between 18:00 and 21:00 (evening classes)
        startTime.setHours(18 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60), 0)

        const durationMinutes = 30 + Math.floor(Math.random() * 31) // 30-60 minutes
        const aiRatingPercentage = 80 + Math.floor(Math.random() * 21) // 80-100%
        
        const activeMinutes = durationMinutes * (aiRatingPercentage / 100)
        // Formula: kcal = time (minutes) * kcal_index
        // Using user's mentioned formula if they meant index is hourly: (activeMinutes * (kcalPerMinute * 60) / 60)
        // Which simplifies to activeMinutes * kcalPerMinute
        const calories = Math.round(activeMinutes * kcalPerMinute)

        // Select 2-4 random photos
        const shuffled = [...evidencePhotos].sort(() => 0.5 - Math.random())
        const selectedPhotos = shuffled.slice(0, 2 + Math.floor(Math.random() * 3))

        await SportEventProgressModel.create({
          eventId,
          userId,
          date: startTime,
          value: aiRatingPercentage,
          unit: '%',
          time: `${durationMinutes} phút`,
          calories,
          proofImage: selectedPhotos[0], // Primary proof
          notes: `Hoàn thành buổi tập với đánh giá AI: ${aiRatingPercentage}%`,
          source: 'video_call',
          activeSeconds: Math.round(activeMinutes * 60)
        })
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }
  }

  console.log('Seeding completed successfully!')
  await mongoose.disconnect()
}

seedIndoorProgress().catch(console.error)
