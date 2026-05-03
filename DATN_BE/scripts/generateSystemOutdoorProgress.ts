import mongoose from 'mongoose'
import path from 'path'
import { config } from 'dotenv'
import { buildGpsRouteForSeed } from './osrmGpsRoute'
import ChallengeModel from '../src/models/schemas/challenge.schema'
import ChallengeProgressModel from '../src/models/schemas/challengeProgress.schema'
import ChallengeParticipantModel from '../src/models/schemas/challengeParticipant.schema'
import ActivityTrackingModel from '../src/models/schemas/activityTracking.schema'
import UserModel from '../src/models/schemas/user.schema'

config({ path: path.join(__dirname, '../.env') })

const MONGODB_URL = process.env.MONGODB_URL || ''

// Helper functions
function toVNDateKey(d: Date): string {
    return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' })
}

function addOneVNKey(key: string): string {
    const t = new Date(`${key}T12:00:00+07:00`)
    t.setDate(t.getDate() + 1)
    return toVNDateKey(t)
}

function enumerateVNKeys(first: string, last: string): string[] {
    const out: string[] = []
    let k = first
    while (k <= last) {
        out.push(k)
        k = addOneVNKey(k)
    }
    return out
}

function atVN(key: string, hourVN: number, minuteVN: number): Date {
    const pad = (n: number) => String(n).padStart(2, '0')
    return new Date(`${key}T${pad(hourVN)}:${pad(minuteVN)}:00+07:00`)
}

function anchorForCategory(category: string, userIndex: number, challengeIndex: number): { lat: number; lng: number; label: string } {
    const c = category || ''
    // Add offset based on userIndex and challengeIndex to spread them out
    const latOffset = ((userIndex + challengeIndex) % 8 - 4) * 0.005
    const lngOffset = (Math.floor((userIndex + challengeIndex) / 8) - 4) * 0.005

    const map: Record<string, { lat: number; lng: number; label: string }> = {
        'Chạy bộ': { lat: 21.0245 + latOffset, lng: 105.8412 + lngOffset, label: 'Khu vực Hà Nội' },
        'Đạp xe': { lat: 10.7296 + latOffset, lng: 106.7221 + lngOffset, label: 'Khu vực TP.HCM' },
        'Đi bộ': { lat: 10.7769 + latOffset, lng: 106.7009 + lngOffset, label: 'Khu vực TP.HCM' },
        'Đi bộ đường dài': { lat: 11.9404 + latOffset, lng: 108.4583 + lngOffset, label: 'Khu vực Đà Lạt' },
        'Trượt patin': { lat: 10.7827 + latOffset, lng: 106.6984 + lngOffset, label: 'Công viên Tao Đàn' },
        'Đua xe': { lat: 10.8231 + latOffset, lng: 106.6297 + lngOffset, label: 'Quận 12, TP.HCM' }
    }
    return map[c] || { lat: 10.7769 + latOffset, lng: 106.7009 + lngOffset, label: 'Trung tâm TP.HCM' }
}

async function recalculateParticipant(challengeId: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId) {
    const challenge = await ChallengeModel.findById(challengeId).lean()
    if (!challenge) return

    const participant = await ChallengeParticipantModel.findOne({
        challenge_id: challengeId,
        user_id: userId
    })
    if (!participant) return

    const allEntries = await ChallengeProgressModel.find({
        challenge_id: challengeId,
        user_id: userId,
        is_deleted: { $ne: true }
    })

    const dayMap = new Map<string, number>()
    for (const e of allEntries) {
        const dayStr = toVNDateKey(new Date(e.date))
        dayMap.set(dayStr, (dayMap.get(dayStr) || 0) + (e.value || 0))
    }

    const activeDays = Array.from(dayMap.keys()).sort()
    const completedDays = activeDays.filter((d) => (dayMap.get(d) || 0) >= challenge.goal_value)

    participant.active_days = activeDays
    participant.completed_days = completedDays
    participant.current_value = completedDays.length
    
    // Streak calc
    const sorted = [...completedDays].sort().reverse()
    let streak = 0
    if (sorted.length > 0) {
        streak = 1
        for (let i = 1; i < sorted.length; i++) {
            const d1 = new Date(sorted[i-1])
            const d2 = new Date(sorted[i])
            const diff = (d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24)
            if (Math.round(diff) === 1) streak++
            else break
        }
    }
    participant.streak_count = streak
    participant.last_activity_at = allEntries.length > 0 ? new Date(Math.max(...allEntries.map(e => new Date(e.date).getTime()))) : null

    const totalRequiredDays = Math.ceil((new Date(challenge.end_date).getTime() - new Date(challenge.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1
    if (completedDays.length >= totalRequiredDays) {
        participant.is_completed = true
        participant.status = 'completed'
        participant.completed_at = participant.completed_at || new Date()
    } else {
        participant.is_completed = false
        participant.status = 'in_progress'
    }

    await participant.save()
}

async function run() {
    try {
        await mongoose.connect(MONGODB_URL)
        console.log('Connected to MongoDB')

        const outdoorChallenges = await ChallengeModel.find({ 
            challenge_type: 'outdoor_activity',
            is_deleted: { $ne: true }
        }).lean()
        
        console.log(`Processing ${outdoorChallenges.length} outdoor challenges.`)

        for (let cIdx = 0; cIdx < outdoorChallenges.length; cIdx++) {
            const challenge = outdoorChallenges[cIdx]
            const challengeId = challenge._id as mongoose.Types.ObjectId
            
            console.log(`\n--- Challenge [${cIdx + 1}/${outdoorChallenges.length}]: "${challenge.title}" ---`)

            const participants = await ChallengeParticipantModel.find({ challenge_id: challengeId })
            console.log(`Participants: ${participants.length}`)

            const firstKey = toVNDateKey(new Date(challenge.start_date))
            let lastKey = toVNDateKey(new Date())
            const endKey = toVNDateKey(new Date(challenge.end_date))
            if (lastKey > endKey) lastKey = endKey
            const dayKeys = enumerateVNKeys(firstKey, lastKey)

            for (let pIdx = 0; pIdx < participants.length; pIdx++) {
                const p = participants[pIdx]
                const userId = p.user_id as mongoose.Types.ObjectId
                
                // Clear existing
                const oldProgress = await ChallengeProgressModel.find({ challenge_id: challengeId, user_id: userId })
                const activityIds = oldProgress.map(p => p.activity_id).filter(Boolean)
                await ChallengeProgressModel.deleteMany({ challenge_id: challengeId, user_id: userId })
                if (activityIds.length > 0) {
                    await ActivityTrackingModel.deleteMany({ _id: { $in: activityIds } })
                }

                const anchor = anchorForCategory(challenge.category, pIdx, cIdx)
                const goalKm = challenge.goal_value

                for (let dIdx = 0; dIdx < dayKeys.length; dIdx++) {
                    const dayKey = dayKeys[dIdx]
                    
                    const km = goalKm + (dIdx % 3) * 0.1 + (pIdx % 5) * 0.05
                    const hourVN = 5 + (dIdx % 10) + (pIdx % 4) // Varied time
                    if (hourVN >= 22) continue // skip late night
                    
                    const minuteVN = 10 + (dIdx * 7 + pIdx * 13) % 45
                    const endTime = atVN(dayKey, hourVN, minuteVN)
                    
                    const avgKmh = 10 + (Math.random() * 5)
                    const durationMin = Math.round((km / avgKmh) * 60)
                    const startMs = endTime.getTime() - durationMin * 60 * 1000
                    
                    const seed = cIdx * 5000 + pIdx * 200 + dIdx * 10
                    const { points, lengthM } = await buildGpsRouteForSeed({
                        baseLat: anchor.lat + (Math.random() - 0.5) * 0.003,
                        baseLng: anchor.lng + (Math.random() - 0.5) * 0.003,
                        targetKm: km,
                        bearingDeg: (pIdx * 60 + dIdx * 30) % 360,
                        category: challenge.category,
                        startMs,
                        endMs: endTime.getTime(),
                        avgSpeedMs: avgKmh / 3.6,
                        altBase: 5,
                        altAmp: 5,
                        seed
                    })

                    const kcal = Math.round(km * (challenge.kcal_per_unit || 65))

                    const activity = await ActivityTrackingModel.create({
                        challengeId,
                        userId,
                        activityType: challenge.category,
                        name: `${challenge.category} - ${dayKey}`,
                        status: 'completed',
                        startTime: new Date(startMs),
                        endTime,
                        totalDuration: durationMin * 60,
                        totalDistance: lengthM,
                        avgSpeed: avgKmh / 3.6,
                        maxSpeed: (avgKmh * 1.3) / 3.6,
                        avgPace: 3600 / avgKmh,
                        calories: kcal,
                        gpsRoute: points,
                        source: 'challenge_seed'
                    })

                    await ChallengeProgressModel.create({
                        challenge_id: challengeId,
                        user_id: userId,
                        date: endTime,
                        challenge_type: 'outdoor_activity',
                        value: km,
                        unit: challenge.goal_unit,
                        notes: `Seed data: ${km.toFixed(2)}km ${challenge.category}`,
                        distance: km,
                        duration_minutes: durationMin,
                        avg_speed: avgKmh,
                        calories: kcal,
                        source: 'gps_tracking',
                        activity_id: activity._id,
                        validation_status: 'valid'
                    })
                }

                await recalculateParticipant(challengeId, userId)
                if (pIdx % 5 === 0) console.log(`   Processed participant ${pIdx + 1}/${participants.length}`)
            }
        }

        console.log('\nSuccessfully generated data for ALL outdoor challenges.')
        await mongoose.disconnect()
    } catch (error) {
        console.error('Error:', error)
    }
}

run()
