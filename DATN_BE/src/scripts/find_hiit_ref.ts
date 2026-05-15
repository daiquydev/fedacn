import mongoose from 'mongoose'
import { envConfig } from '../constants/config'
import SportEventProgressModel from '../models/schemas/sportEventProgress.schema'
import SportEventModel from '../models/schemas/sportEvent.schema'
import SportCategoryModel from '../models/schemas/sportCategory.schema'
import SportEventSessionModel from '../models/schemas/sportEventSession.schema'
import SportEventVideoSessionModel from '../models/schemas/sportEventVideoSession.schema'

async function findData() {
  await mongoose.connect(envConfig.mongoURL)
  console.log('Connected to MongoDB')

  // 1. Find HIIT reference photos in SportEventVideoSession
  const hiitDateStart = new Date('2026-05-13T00:00:00Z')
  const hiitDateEnd = new Date('2026-05-13T23:59:59Z')
  
  // Search for sessions titled HIIT on that day
  const sessions = await SportEventSessionModel.find({
    title: { $regex: /HIIT/i },
    sessionDate: { $gte: hiitDateStart, $lte: hiitDateEnd }
  }).lean()

  console.log(`Found ${sessions.length} HIIT sessions on 2026-05-13`)

  let evidencePhotos: string[] = []

  if (sessions.length > 0) {
    const sessionIds = sessions.map(s => s._id)
    const videoSessions = await SportEventVideoSessionModel.find({
      sessionId: { $in: sessionIds }
    }).limit(5).lean()

    for (const vs of videoSessions) {
      if (vs.screenshots && vs.screenshots.length > 0) {
        evidencePhotos = [...evidencePhotos, ...vs.screenshots]
      }
    }
  }

  // If still empty, search all video sessions on that day
  if (evidencePhotos.length === 0) {
    const broadVideoSessions = await SportEventVideoSessionModel.find({
      joinedAt: { $gte: hiitDateStart, $lte: hiitDateEnd }
    }).limit(10).lean()
    
    for (const vs of broadVideoSessions) {
        if (vs.screenshots && vs.screenshots.length > 0) {
          evidencePhotos = [...evidencePhotos, ...vs.screenshots]
        }
      }
  }

  console.log('Evidence Photos Found:', evidencePhotos.length)
  console.log(JSON.stringify(evidencePhotos.slice(0, 5), null, 2))

  // 2. Get Event Info
  const eventId = '69f473aee783662ba43977e2'
  const event = await SportEventModel.findById(eventId).lean()
  if (event) {
    console.log('Target Event Found:', event.name)
    console.log('Category string:', event.category)
    console.log('Participants count:', event.participants_ids?.length)

    // 3. Get Sport Category Info by Name
    const category = await SportCategoryModel.findOne({ name: event.category }).lean()
    if (category) {
      console.log('Sport Category Found:', category.name)
      console.log('kcal_per_unit:', category.kcal_per_unit)
    } else {
        console.log('Sport Category NOT found for name:', event.category)
        // List some categories to see what names are available
        const allCats = await SportCategoryModel.find({}).limit(5).lean()
        console.log('Available categories:', allCats.map(c => c.name))
    }
  }

  await mongoose.disconnect()
}

findData().catch(console.error)
