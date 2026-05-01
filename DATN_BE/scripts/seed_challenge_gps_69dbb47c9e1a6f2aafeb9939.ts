import mongoose, { Types } from 'mongoose'
import dotenv from 'dotenv'
import moment from 'moment'

// Đảm bảo lấy route thực tế
process.env.SEED_SKIP_OSRM = '0'

import ChallengeModel from '../src/models/schemas/challenge.schema'
import ChallengeParticipantModel from '../src/models/schemas/challengeParticipant.schema'
import ChallengeProgressModel from '../src/models/schemas/challengeProgress.schema'
import ActivityTrackingModel from '../src/models/schemas/activityTracking.schema'
import { buildGpsRouteForSeed } from './osrmGpsRoute'

dotenv.config()

const MONGODB_URL = process.env.MONGODB_URL || ''
const CHALLENGE_ID = '69dbb47c9e1a6f2aafeb9939'

const BASE_LAT = 10.783 // Trung tâm TP.HCM
const BASE_LNG = 106.695

function prand(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (1664525 * s + 1013904223) >>> 0
    return s / 4294967296
  }
}

function rand(min: number, max: number, rng: () => number) {
  return rng() * (max - min) + min
}

async function seed() {
  try {
    await mongoose.connect(MONGODB_URL)
    console.log('✅ Đã kết nối DB')

    const challenge = await ChallengeModel.findById(CHALLENGE_ID)
    if (!challenge) {
      console.log('❌ Không tìm thấy Challenge!')
      process.exit(1)
    }

    const participants = await ChallengeParticipantModel.find({ challenge_id: challenge._id })
    console.log(`📋 Tìm thấy ${participants.length} người tham gia thử thách "${challenge.title}"`)

    if (participants.length === 0) {
      process.exit(0)
    }

    const startDate = moment(challenge.start_date).startOf('day')
    const today = moment().startOf('day')
    const daysToSeed: Date[] = []

    for (let d = startDate.clone(); d.isSameOrBefore(today); d.add(1, 'days')) {
      daysToSeed.push(d.toDate())
    }

    console.log(`🗓️ Cần seed ${daysToSeed.length} ngày cho mỗi người. Tổng cộng: ${daysToSeed.length * participants.length} activities...`)

    let totalActivities = 0
    let lastLog = Date.now()

    for (const p of participants) {
      const rng = prand(hashMod(p.user_id.toString(), 10000))
      
      let currentValue = p.current_value || 0
      const activeDaysSet = new Set(p.active_days || [])
      const completedDaysSet = new Set(p.completed_days || [])
      let streak = p.streak_count || 0

      for (const day of daysToSeed) {
        const dateStr = moment(day).format('YYYY-MM-DD')
        // Bỏ qua nếu đã có tiến độ trong ngày này
        if (activeDaysSet.has(dateStr)) {
          continue
        }

        // Tốc độ đi bộ đường dài khoảng 4-6 km/h (1.11 - 1.66 m/s)
        const avgSpeedMs = rand(1.11, 1.66, rng)
        // Mục tiêu 8km, random từ 8.0 đến 8.5 km
        const targetKm = rand(challenge.goal_value, challenge.goal_value + 0.5, rng)
        const distanceM = targetKm * 1000
        const totalDurationS = Math.round(distanceM / avgSpeedMs)
        const calories = Math.round(targetKm * (challenge.kcal_per_unit || 60))
        
        // Thời gian bắt đầu: Random 5h - 7h sáng hoặc 17h - 19h chiều
        const startH = rng() > 0.5 ? Math.floor(rand(5, 7, rng)) : Math.floor(rand(17, 19, rng))
        const startM = Math.floor(rand(0, 59, rng))
        const startTime = moment(day).hours(startH).minutes(startM).seconds(0).toDate()
        const endTime = moment(startTime).add(totalDurationS, 'seconds').toDate()

        const baseLatOff = BASE_LAT + (rng() - 0.5) * 0.05
        const baseLngOff = BASE_LNG + (rng() - 0.5) * 0.05
        const bearingDeg = Math.floor(rand(0, 360, rng))

        const { points, lengthM } = await buildGpsRouteForSeed({
          baseLat: baseLatOff,
          baseLng: baseLngOff,
          targetKm: targetKm,
          bearingDeg,
          category: challenge.category,
          startMs: startTime.getTime(),
          endMs: endTime.getTime(),
          avgSpeedMs,
          altBase: 20,
          altAmp: 5,
          seed: rng() * 1000000
        })

        const actualDistanceKm = Number((lengthM / 1000).toFixed(2))

        const activity = await ActivityTrackingModel.create({
          challengeId: challenge._id,
          userId: p.user_id,
          activityType: challenge.category,
          name: `Hoạt động thử thách: ${challenge.title}`,
          status: 'completed',
          startTime,
          endTime,
          totalDuration: totalDurationS,
          totalDistance: lengthM,
          avgSpeed: avgSpeedMs,
          maxSpeed: avgSpeedMs * 1.2,
          avgPace: (totalDurationS / 60) / actualDistanceKm,
          calories,
          gpsRoute: points as any,
          pauseIntervals: [],
          source: 'app'
        })

        await ChallengeProgressModel.create({
          challenge_id: challenge._id,
          user_id: p.user_id,
          date: startTime,
          challenge_type: challenge.challenge_type,
          value: actualDistanceKm,
          unit: 'km',
          notes: `Đi bộ ${actualDistanceKm}km`,
          distance: actualDistanceKm,
          duration_minutes: Math.round(totalDurationS / 60),
          avg_speed: avgSpeedMs,
          calories,
          source: 'gps_tracking',
          activity_id: activity._id,
          validation_status: 'valid'
        })

        activeDaysSet.add(dateStr)
        if (actualDistanceKm >= challenge.goal_value) {
          completedDaysSet.add(dateStr)
        }
        currentValue += actualDistanceKm
        streak++
        totalActivities++

        if (Date.now() - lastLog > 3000) {
          console.log(`⏳ Đang xử lý... Đã tạo ${totalActivities} activities`)
          lastLog = Date.now()
        }
      }

      p.active_days = Array.from(activeDaysSet).sort()
      p.completed_days = Array.from(completedDaysSet).sort()
      p.current_value = Number(currentValue.toFixed(2))
      p.streak_count = p.completed_days.length
      
      if (p.current_value >= (challenge.goal_value * daysToSeed.length)) {
         // Maybe completed if it's total goal, but this is daily_km so it never "completes" until endDate?
         // We just keep it in_progress
      }

      await p.save()
    }

    console.log(`✅ Hoàn thành! Đã sinh ra ${totalActivities} activities GPS chân thực.`)

  } catch (error) {
    console.error('❌ Lỗi:', error)
  } finally {
    mongoose.disconnect()
    process.exit(0)
  }
}

function hashMod(str: string, mod: number) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  return h % mod
}

seed()
