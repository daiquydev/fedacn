import mongoose from 'mongoose'
import dotenv from 'dotenv'
import SportEventModel from '../src/models/schemas/sportEvent.schema'
import SportEventProgressModel from '../src/models/schemas/sportEventProgress.schema'
import ActivityTrackingModel from '../src/models/schemas/activityTracking.schema'
import SportCategoryModel from '../src/models/schemas/sportCategory.schema'
import moment from 'moment'

dotenv.config()

const DEFAULT_KCAL_PER_KM = 60
const MONGODB_URL = process.env.MONGODB_URL || ''
const eventIdStr = '69ab3e1a00e50d111a22e622'

// ─── Ho Chi Minh City running routes (base coordinates) ───
const RUNNING_ROUTES = [
  { baseLat: 10.7738, baseLng: 106.7028, name: 'Nguyen Hue' },
]

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function generateGpsRoute(distanceKm: number, startTime: Date, avgSpeedMs: number) {
  const route = RUNNING_ROUTES[0]
  const distanceM = distanceKm * 1000
  const totalDurationS = distanceM / avgSpeedMs

  // Number of GPS points (1 every ~5 seconds)
  const numPoints = Math.max(10, Math.floor(totalDurationS / 5))
  const segmentDistM = distanceM / numPoints

  const points: Array<{
    lat: number
    lng: number
    timestamp: number
    speed: number
    altitude: number
  }> = []

  let currentLat = route.baseLat + rand(-0.002, 0.002)
  let currentLng = route.baseLng + rand(-0.002, 0.002)
  let bearing = rand(0, 360) 
  const startTs = startTime.getTime()

  for (let i = 0; i < numPoints; i++) {
    bearing += rand(-15, 15)
    const bearingRad = (bearing * Math.PI) / 180

    const dLat = (segmentDistM * Math.cos(bearingRad)) / 111320
    const dLng = (segmentDistM * Math.sin(bearingRad)) / (111320 * Math.cos((currentLat * Math.PI) / 180))

    currentLat += dLat
    currentLng += dLng
    const pointSpeed = avgSpeedMs * rand(0.8, 1.2)

    points.push({
      lat: Number(currentLat.toFixed(6)),
      lng: Number(currentLng.toFixed(6)),
      timestamp: Math.round(startTs + (i * totalDurationS * 1000) / numPoints),
      speed: Number(pointSpeed.toFixed(2)),
      altitude: Number(rand(3, 12).toFixed(1))
    })
  }

  return points
}

async function getKcalPerKm(category: string): Promise<number> {
  const cat = await SportCategoryModel.findOne({ name: category, isDeleted: { $ne: true } })
  if (cat && cat.kcal_per_unit > 0) return cat.kcal_per_unit
  return DEFAULT_KCAL_PER_KM
}

const seedProgress10kmForAll = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URL)
    console.log('✅ Connected to MongoDB')

    const event = await SportEventModel.findById(eventIdStr)
    if (!event) throw new Error(`Event ${eventIdStr} not found!`)
    
    console.log(`📅 Found Event: ${event.name}`)

    const kcalPerKm = await getKcalPerKm(event.category || 'Chạy bộ')
    const participants = event.participants_ids || []
    
    if (participants.length === 0) {
        console.log('❌ No participants found!')
        return
    }
    
    console.log(`👥 Found ${participants.length} participants in the event. Processing each...`)

    for (const userId of participants) {
        console.log(`\n-----------------------------------`)
        console.log(`👤 Processing user: ${userId}`)
        // ─── Delete old data FIRST for this user ───
        console.log(`🧹 Cleaning old activities for user ${userId}...`)
        await ActivityTrackingModel.deleteMany({ eventId: event._id, userId: userId })
        await SportEventProgressModel.deleteMany({ eventId: event._id, userId: userId })
        console.log('✅ Cleaned')

        // ─── DATE RANGE: 10/3/2026 → 11/4/2026 ───
        const startDate = moment('2026-03-10', 'YYYY-MM-DD')
        const endDate = moment('2026-04-11', 'YYYY-MM-DD')
        const totalDays = endDate.diff(startDate, 'days') + 1

        let targetTotalKm = 10.00
        let activitiesAccumulatedKm = 0
        let totalActivities = 0
        const activitiesToGenerate = []

        for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
          const currentDay = startDate.clone().add(dayOffset, 'days')
          
          // We will do 2 or 3 runs per day
          const dailyRuns = rand(0, 1) > 0.5 ? 2 : 3
          
          for(let r = 0; r < dailyRuns; r++) {
             const runTime = currentDay.clone().hours(Math.floor(rand(6, 19))).minutes(Math.floor(rand(0, 59)))
             activitiesToGenerate.push(runTime)
          }
        }
        
        console.log(`Generating ${activitiesToGenerate.length} activities... (target total = 10km)`)

        for (let i = 0; i < activitiesToGenerate.length; i++) {
          let isLast = i === activitiesToGenerate.length - 1
          let runTime = activitiesToGenerate[i]
          
          let distanceKm = 0
          if (isLast) {
              distanceKm = targetTotalKm - activitiesAccumulatedKm
              distanceKm = Number(distanceKm.toFixed(2))
          } else {
              const avgPerActivity = targetTotalKm / activitiesToGenerate.length
              const minD = avgPerActivity * 0.7
              const maxD = avgPerActivity * 1.3
              distanceKm = Number(rand(minD, maxD).toFixed(2))
              
              if(activitiesAccumulatedKm + distanceKm >= targetTotalKm) {
                  distanceKm = targetTotalKm - activitiesAccumulatedKm
                  distanceKm = Number(distanceKm.toFixed(2))
              }
          }
          
          if (distanceKm <= 0) continue;

          activitiesAccumulatedKm += distanceKm
          
          const distanceM = Math.round(distanceKm * 1000)
          const avgSpeedMs = Number(rand(1.94, 3.06).toFixed(2))
          const maxSpeedMs = Number((avgSpeedMs * rand(1.15, 1.35)).toFixed(2))
          const totalDuration = Math.max(60, Math.round(distanceM / avgSpeedMs))
          const avgPace = Number(((totalDuration / 60) / distanceKm).toFixed(2))
          const calories = Math.round(distanceKm * kcalPerKm)
          
          const startTimeDate = runTime.toDate()
          const endTimeDate = moment(startTimeDate).add(totalDuration, 'seconds').toDate()
          const gpsRoute = generateGpsRoute(distanceKm, startTimeDate, avgSpeedMs)
          
          const durationMin = Math.floor(totalDuration / 60)

          await ActivityTrackingModel.create({
            eventId: event._id,
            userId: userId,
            activityType: event.category || 'Chạy bộ',
            status: 'completed',
            startTime: startTimeDate,
            endTime: endTimeDate,
            totalDuration: totalDuration,  
            totalDistance: distanceM,       
            avgSpeed: avgSpeedMs,           
            maxSpeed: maxSpeedMs,           
            avgPace: avgPace,               
            calories: calories,
            gpsRoute: gpsRoute,
            pauseIntervals: []
          })

          await SportEventProgressModel.create({
            eventId: event._id,
            userId: userId,
            date: startTimeDate,
            value: distanceKm,
            unit: 'km',
            distance: distanceKm,
            calories: calories,
            time: `${durationMin} phút`,
            source: 'gps',
            notes: `Hoạt động tự động: ${distanceKm}km trong ${durationMin} phút`
          })

          totalActivities++
        }

        const insertedProgresses = await SportEventProgressModel.find({ eventId: event._id, userId: userId })
        const finalTotal = insertedProgresses.reduce((sum, p) => sum + p.value, 0)
        console.log(`✅ User ${userId} successfully got ${finalTotal.toFixed(2)} km across ${totalActivities} activities.`)
    }

    console.log(`\n🎉 Done! All ${participants.length} participants have been seeded exactly 10.00 km.`)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    setTimeout(() => {
      mongoose.disconnect()
      console.log('🔌 Disconnected')
      process.exit(0)
    }, 1000)
  }
}

seedProgress10kmForAll()
