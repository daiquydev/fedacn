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

// Helper functions from seedOutdoorChallengeProgress.ts
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

function anchorForCategory(category: string): { lat: number; lng: number; label: string } {
    const c = category || ''
    const map: Record<string, { lat: number; lng: number; label: string }> = {
        'Chạy bộ': { lat: 21.0245, lng: 105.8412, label: 'Hồ Gươm, Hà Nội' },
        'Đạp xe': { lat: 10.7296, lng: 106.7221, label: 'Khu đô thị Nam Sài Gòn' },
        'Đi bộ': { lat: 10.7769, lng: 106.7009, label: 'Quận 1, TP.HCM' }, // Adjusted to TP.HCM for variety
        'Đi bộ đường dài': { lat: 12.2594, lng: 109.1101, label: 'Đồi núi Đà Lạt' },
        'Chạy trail': { lat: 21.1785, lng: 105.8038, label: 'Ngoại ô Ba Vì / HN' },
        'Trượt patin': { lat: 10.7827, lng: 106.6984, label: 'Công viên Tao Đàn, TP.HCM' }
    }
    return map[c] || { lat: 10.7769, lng: 106.7009, label: 'Trung tâm TP.HCM' }
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
    
    // Simple streak calc
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

        const user = await UserModel.findOne({ email: 'user1@gmail.com' })
        if (!user) throw new Error('User not found')
        const userId = user._id as mongoose.Types.ObjectId

        const challengeId = new mongoose.Types.ObjectId('69dbb47c9e1a6f2aafeb9927')
        const challenge = await ChallengeModel.findById(challengeId).lean()
        if (!challenge) throw new Error('Challenge not found')

        console.log(`Target: ${user.email} in "${challenge.title}"`)

        // Delete existing data for this user in this challenge
        const oldProgress = await ChallengeProgressModel.find({ challenge_id: challengeId, user_id: userId })
        const activityIds = oldProgress.map(p => p.activity_id).filter(Boolean)
        
        await ChallengeProgressModel.deleteMany({ challenge_id: challengeId, user_id: userId })
        if (activityIds.length > 0) {
            await ActivityTrackingModel.deleteMany({ _id: { $in: activityIds } })
        }
        console.log(`Cleared ${oldProgress.length} existing progress records and ${activityIds.length} activities.`)

        const firstKey = toVNDateKey(new Date(challenge.start_date))
        let lastKey = toVNDateKey(new Date())
        const endKey = toVNDateKey(new Date(challenge.end_date))
        if (lastKey > endKey) lastKey = endKey

        const dayKeys = enumerateVNKeys(firstKey, lastKey)
        console.log(`Generating progress for ${dayKeys.length} days: ${firstKey} to ${lastKey}`)

        const anchor = anchorForCategory(challenge.category)
        const goalKm = challenge.goal_value

        for (let i = 0; i < dayKeys.length; i++) {
            const dayKey = dayKeys[i]
            console.log(`Processing day ${i + 1}/${dayKeys.length}: ${dayKey}`)

            // Generate 1 session per day that completes the goal
            const km = goalKm + (i % 3) * 0.2 // slightly more than goal
            const hourVN = 6 + (i % 3) // 6, 7, or 8 AM
            const minuteVN = 15 + (i % 30)
            const endTime = atVN(dayKey, hourVN, minuteVN)
            
            // Assume 10 km/h avg speed
            const avgKmh = 10 + (Math.random() * 2)
            const durationMin = Math.round((km / avgKmh) * 60)
            const startMs = endTime.getTime() - durationMin * 60 * 1000
            
            const seed = i * 100 + 42
            const { points, lengthM } = await buildGpsRouteForSeed({
                baseLat: anchor.lat + (Math.random() - 0.5) * 0.005,
                baseLng: anchor.lng + (Math.random() - 0.5) * 0.005,
                targetKm: km,
                bearingDeg: 45 + (i * 10) % 360,
                category: challenge.category,
                startMs,
                endMs: endTime.getTime(),
                avgSpeedMs: avgKmh / 3.6,
                altBase: 10,
                altAmp: 5,
                seed
            })

            const kcal = Math.round(km * (challenge.kcal_per_unit || 60))

            // Create ActivityTracking
            const activity = await ActivityTrackingModel.create({
                challengeId,
                userId,
                activityType: challenge.category,
                name: `${challenge.category} - Session ${i + 1}`,
                status: 'completed',
                startTime: new Date(startMs),
                endTime,
                totalDuration: durationMin * 60,
                totalDistance: lengthM,
                avgSpeed: avgKmh / 3.6,
                maxSpeed: (avgKmh * 1.2) / 3.6,
                avgPace: 3600 / avgKmh,
                calories: kcal,
                gpsRoute: points,
                source: 'challenge_seed'
            })

            // Create ChallengeProgress
            await ChallengeProgressModel.create({
                challenge_id: challengeId,
                user_id: userId,
                date: endTime,
                challenge_type: 'outdoor_activity',
                value: km,
                unit: challenge.goal_unit,
                notes: `Hoàn thành mục tiêu ngày ${i + 1} - ${km.toFixed(2)}km`,
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
        console.log('Successfully generated all data and updated participant status.')

        await mongoose.disconnect()
    } catch (error) {
        console.error('Error:', error)
    }
}

run()
