import mongoose from 'mongoose'
import axios from 'axios'
import moment from 'moment'
import { envConfig } from '../constants/config'
import ActivityTrackingModel from '../models/schemas/activityTracking.schema'
import ChallengeModel from '../models/schemas/challenge.schema'
import ChallengeParticipantModel from '../models/schemas/challengeParticipant.schema'
import ChallengeProgressModel from '../models/schemas/challengeProgress.schema'

// Activity configuration
const CONFIG: any = {
  'Đi bộ đường dài': { avgSpeed: 1.5, speedVar: 0.4, calPerKm: 55, icon: '🚶' },
  'Đua xe': { avgSpeed: 7.0, speedVar: 2.0, calPerKm: 35, icon: '🚴' },
  'Chạy bộ': { avgSpeed: 2.8, speedVar: 1.0, calPerKm: 65, icon: '🏃' },
  'default': { avgSpeed: 2.5, speedVar: 1.0, calPerKm: 60, icon: '🔥' }
}

async function getSyntheticRoute(lat: number, lng: number, factor: number = 1.0) {
  const points = []
  const numPoints = 20 + Math.floor(Math.random() * 10)
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2
    points.push({
      lat: lat + Math.sin(angle) * 0.005 * factor,
      lng: lng + Math.cos(angle) * 0.005 * factor
    })
  }
  points.push(points[0])
  return points
}

async function seedAllOutdoorChallenges() {
  await mongoose.connect(envConfig.mongoURL)
  console.log('Connected to MongoDB')

  const challenges = await ChallengeModel.find({ challenge_type: 'outdoor_activity' })
  console.log(`Processing ${challenges.length} outdoor challenges`)

  for (const challenge of challenges) {
    console.log(`--- Challenge: ${challenge.title} (${challenge.category}) ---`)
    
    // Cleanup existing progress for this challenge
    await ChallengeProgressModel.deleteMany({ challenge_id: challenge._id })
    await ActivityTrackingModel.deleteMany({ challengeId: challenge._id })
    console.log(`Cleared existing data for challenge ${challenge._id}`)

    const participants = await ChallengeParticipantModel.find({ challenge_id: challenge._id })
    console.log(`Found ${participants.length} participants`)

    // Determine location center
    let centerLat = 21.0285; let centerLng = 105.8542;
    if (challenge.title.includes('trekking')) { centerLat = 16.1972; centerLng = 107.8597; } // Bach Ma
    else if (challenge.category.includes('Đua xe')) { centerLat = 21.0583; centerLng = 105.8250; } // West Lake
    else if (challenge.category.includes('Chạy bộ')) { centerLat = 10.7744; centerLng = 106.6924; } // Tao Dan

    const masterRoute = await getSyntheticRoute(centerLat, centerLng)
    let loopDistM = 0
    for (let i = 0; i < masterRoute.length - 1; i++) {
      const p1 = masterRoute[i], p2 = masterRoute[i+1]
      loopDistM += Math.sqrt(Math.pow(p1.lat-p2.lat,2) + Math.pow(p1.lng-p2.lng,2)) * 111319
    }

    const config = CONFIG[challenge.category] || CONFIG['default']
    const start = moment(challenge.start_date)
    const end = moment(challenge.end_date)
    const today = moment()
    const limitDate = today.isBefore(end) ? today : end

    for (const participant of participants) {
      let currentVal = 0
      const activeDays = new Set<string>()
      const completedDays = new Set<string>()
      let currentDate = moment(start)

      while (currentDate.isSameOrBefore(limitDate)) {
        const dateStr = currentDate.format('YYYY-MM-DD')
        
        // 75% chance of activity today
        if (Math.random() > 0.25) {
          // 1-3 sessions per day
          const numSessions = Math.floor(Math.random() * 3) + 1
          let dayValue = 0

          for (let s = 0; s < numSessions; s++) {
            const startTime = currentDate.clone().hour(5 + Math.floor(Math.random() * 14)).minute(Math.floor(Math.random() * 60))
            const distanceFactor = 0.2 + Math.random() * 0.8
            const distM = loopDistM * distanceFactor
            const speed = config.avgSpeed + (Math.random() - 0.5) * config.speedVar
            const duration = Math.round(distM / speed)

            const gpsRoute = []
            const startIdx = Math.floor(Math.random() * masterRoute.length)
            const numPts = Math.max(5, Math.round(masterRoute.length * distanceFactor))
            for (let i = 0; i < numPts; i++) {
              const p = masterRoute[(startIdx + i) % masterRoute.length]
              gpsRoute.push({
                lat: Number((p.lat + (Math.random()-0.5)*0.0001).toFixed(6)),
                lng: Number((p.lng + (Math.random()-0.5)*0.0001).toFixed(6)),
                timestamp: startTime.valueOf() + Math.round((i/numPts)*duration*1000),
                speed: Number((speed * (0.8 + Math.random()*0.4)).toFixed(2))
              })
            }

            const activity = await ActivityTrackingModel.create({
              challengeId: challenge._id,
              userId: participant.user_id,
              activityType: challenge.category || 'Ngoài trời',
              status: 'completed',
              startTime: startTime.toDate(),
              endTime: moment(startTime).add(duration, 'seconds').toDate(),
              totalDuration: duration,
              totalDistance: distM,
              avgSpeed: Number(speed.toFixed(2)),
              calories: Math.round((distM / 1000) * config.calPerKm),
              gpsRoute,
              source: 'app'
            })

            await ChallengeProgressModel.create({
              challenge_id: challenge._id,
              user_id: participant.user_id,
              date: startTime.toDate(),
              challenge_type: 'outdoor_activity',
              value: distM / 1000,
              unit: 'km',
              distance: distM / 1000,
              duration_minutes: Math.round(duration / 60),
              avg_speed: Number((speed * 3.6).toFixed(2)),
              calories: Math.round((distM / 1000) * config.calPerKm),
              source: 'gps_tracking',
              activity_id: activity._id
            })

            dayValue += (distM / 1000)
            currentVal += (distM / 1000)
          }

          activeDays.add(dateStr)
          // Assume daily goal is challenge.goal_value / duration_in_days (rough guess) or just fixed 2km
          if (dayValue >= 2) completedDays.add(dateStr)
        }

        currentDate.add(1, 'day')
      }

      // Update participant stats
      await ChallengeParticipantModel.updateOne(
        { _id: participant._id },
        {
          $set: {
            current_value: Number(currentVal.toFixed(2)),
            active_days: Array.from(activeDays),
            completed_days: Array.from(completedDays),
            last_activity_at: activeDays.size > 0 ? moment(Array.from(activeDays).pop()).toDate() : null,
            is_completed: currentVal >= participant.goal_value,
            completed_at: currentVal >= participant.goal_value ? new Date() : null,
            status: currentVal >= participant.goal_value ? 'completed' : 'in_progress'
          }
        }
      )
    }
    console.log(`Seeded ${participants.length} participants for ${challenge.title}`)
  }

  console.log('ALL outdoor challenges seeded successfully!')
  await mongoose.disconnect()
}

seedAllOutdoorChallenges().catch(console.error)
