import mongoose from 'mongoose'
import { config } from 'dotenv'
import * as path from 'path'

// Load .env from the BE project root
config({ path: path.resolve(__dirname, '../.env') })

const MONGODB_URI = process.env.MONGODB_URL || 'mongodb://localhost:27017/test'
const CHALLENGE_ID = '69c7ac419919710f9e2b5a5e'

// ─── GPS Route Generators (Ho Chi Minh City area) ───────────────────────────
// Each generates a realistic running path with lat/lng/timestamp/speed/altitude

function generateGpsRoute(
    startLat: number, startLng: number,
    distanceKm: number, durationMinutes: number,
    baseTimestamp: number
): any[] {
    const points: any[] = []
    const totalPoints = Math.max(20, Math.floor(distanceKm * 15)) // ~15 points/km
    const intervalMs = (durationMinutes * 60 * 1000) / totalPoints
    const stepDistance = (distanceKm / totalPoints) * 0.009 // rough degree per km

    let lat = startLat
    let lng = startLng

    for (let i = 0; i < totalPoints; i++) {
        // Add some natural variation to simulate a real running path
        const angle = Math.random() * Math.PI * 2
        const jitter = 0.00005 + Math.random() * 0.0001

        lat += stepDistance * Math.cos(angle) + jitter * (Math.random() > 0.5 ? 1 : -1)
        lng += stepDistance * Math.sin(angle) + jitter * (Math.random() > 0.5 ? 1 : -1)

        const speed = 2.0 + Math.random() * 2.5 // 2.0 - 4.5 m/s (running speed)
        const altitude = 5 + Math.random() * 10 // 5-15m (HCM is flat)

        points.push({
            lat: parseFloat(lat.toFixed(7)),
            lng: parseFloat(lng.toFixed(7)),
            timestamp: baseTimestamp + i * intervalMs,
            speed: parseFloat(speed.toFixed(2)),
            altitude: parseFloat(altitude.toFixed(1))
        })
    }
    return points
}

// ─── Route Start Points (various locations in HCM City) ─────────────────────
const START_POINTS = [
    // Công viên Gia Định
    { lat: 10.8137, lng: 106.6782 },
    // Hồ Kỳ Hòa
    { lat: 10.7777, lng: 106.6645 },
    // Công viên Tao Đàn
    { lat: 10.7747, lng: 106.6936 },
    // Công viên Lê Thị Riêng
    { lat: 10.7753, lng: 106.6827 },
    // Kênh Nhiêu Lộc
    { lat: 10.7875, lng: 106.6801 },
    // Thảo Cầm Viên
    { lat: 10.7876, lng: 106.7055 },
    // Phú Mỹ Hưng
    { lat: 10.7285, lng: 106.7195 },
    // Công viên Hoàng Văn Thụ
    { lat: 10.8045, lng: 106.6670 },
    // Hồ Con Rùa
    { lat: 10.7809, lng: 106.6956 },
    // Bờ kè Thủ Thiêm
    { lat: 10.7850, lng: 106.7230 },
    // Công viên bờ sông Sài Gòn
    { lat: 10.7920, lng: 106.7150 },
    // Đại học Bách Khoa
    { lat: 10.7725, lng: 106.6578 },
    // Landmark 81
    { lat: 10.7952, lng: 106.7220 }
]

// ─── Activity Data Definition ───────────────────────────────────────────────

interface ActivityDef {
    distanceKm: number
    durationMinutes: number
    startHour: number
    startMinute: number
    startPointIndex: number
}

interface DayDef {
    date: string        // 'YYYY-MM-DD'
    dateObj: Date
    activities: ActivityDef[]
    totalKm: number
    meetsGoal: boolean  // does totalKm >= 10?
}

const days: DayDef[] = [
    {
        date: '2026-03-26',
        dateObj: new Date('2026-03-26T00:00:00+07:00'),
        totalKm: 10,
        meetsGoal: true,
        activities: [
            { distanceKm: 3.0, durationMinutes: 18, startHour: 6, startMinute: 0, startPointIndex: 0 },
            { distanceKm: 2.5, durationMinutes: 15, startHour: 7, startMinute: 30, startPointIndex: 1 },
            { distanceKm: 2.0, durationMinutes: 12, startHour: 16, startMinute: 0, startPointIndex: 2 },
            { distanceKm: 2.5, durationMinutes: 14, startHour: 18, startMinute: 30, startPointIndex: 3 }
        ]
    },
    {
        date: '2026-03-27',
        dateObj: new Date('2026-03-27T00:00:00+07:00'),
        totalKm: 5,
        meetsGoal: false,
        activities: [
            { distanceKm: 3.0, durationMinutes: 17, startHour: 6, startMinute: 15, startPointIndex: 4 },
            { distanceKm: 2.0, durationMinutes: 12, startHour: 17, startMinute: 0, startPointIndex: 5 }
        ]
    },
    {
        date: '2026-03-28',
        dateObj: new Date('2026-03-28T00:00:00+07:00'),
        totalKm: 20,
        meetsGoal: true,
        activities: [
            { distanceKm: 5.0, durationMinutes: 28, startHour: 5, startMinute: 30, startPointIndex: 6 },
            { distanceKm: 4.0, durationMinutes: 22, startHour: 7, startMinute: 0, startPointIndex: 7 },
            { distanceKm: 3.5, durationMinutes: 20, startHour: 10, startMinute: 0, startPointIndex: 8 },
            { distanceKm: 4.0, durationMinutes: 23, startHour: 16, startMinute: 0, startPointIndex: 9 },
            { distanceKm: 3.5, durationMinutes: 19, startHour: 19, startMinute: 0, startPointIndex: 10 }
        ]
    },
    {
        date: '2026-03-29',
        dateObj: new Date('2026-03-29T00:00:00+07:00'),
        totalKm: 2,
        meetsGoal: false,
        activities: [
            { distanceKm: 1.2, durationMinutes: 8, startHour: 6, startMinute: 30, startPointIndex: 11 },
            { distanceKm: 0.8, durationMinutes: 5, startHour: 14, startMinute: 0, startPointIndex: 12 }
        ]
    }
]

// ─── Main Seed Function ─────────────────────────────────────────────────────

async function seed() {
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    const db = mongoose.connection.db!
    const challengeId = new mongoose.Types.ObjectId(CHALLENGE_ID)

    // 1. Get the challenge to verify it exists and get category
    const challenge = await db.collection('challenges').findOne({ _id: challengeId })
    if (!challenge) {
        throw new Error(`Challenge ${CHALLENGE_ID} not found!`)
    }
    console.log(`📌 Challenge: "${challenge.title}" (${challenge.challenge_type}, goal: ${challenge.goal_value} ${challenge.goal_unit}/day)`)

    // 2. Find the first participant (the current user)
    const participant = await db.collection('challenge_participants').findOne({
        challenge_id: challengeId,
        status: 'in_progress'
    })
    if (!participant) {
        throw new Error('No participant found for this challenge! Make sure you have joined the challenge first.')
    }
    const userId = participant.user_id
    console.log(`👤 User ID: ${userId}`)

    // 3. Clean old progress data for this user in this challenge
    const oldActivities = await db.collection('activity_tracking').find({
        challengeId: challengeId,
        userId: userId
    }).toArray()
    const oldActivityIds = oldActivities.map(a => a._id)

    await db.collection('challenge_progress').deleteMany({
        challenge_id: challengeId,
        user_id: userId
    })
    if (oldActivityIds.length > 0) {
        await db.collection('activity_tracking').deleteMany({
            _id: { $in: oldActivityIds }
        })
    }
    console.log(`🧹 Cleaned old data: ${oldActivityIds.length} activities, progress entries removed`)

    // 4. Insert new data for each day
    const activeDays: string[] = []
    const completedDays: string[] = []
    let totalActivities = 0

    for (const day of days) {
        console.log(`\n📅 ${day.date} — ${day.activities.length} activities, ${day.totalKm}km ${day.meetsGoal ? '✅ GOAL MET' : '⚠️ under goal'}`)

        for (let i = 0; i < day.activities.length; i++) {
            const act = day.activities[i]
            const startPoint = START_POINTS[act.startPointIndex]

            // Calculate times
            const startTime = new Date(day.dateObj)
            startTime.setHours(act.startHour, act.startMinute, 0, 0)
            const endTime = new Date(startTime.getTime() + act.durationMinutes * 60 * 1000)

            // Generate realistic GPS route
            const gpsRoute = generateGpsRoute(
                startPoint.lat, startPoint.lng,
                act.distanceKm, act.durationMinutes,
                startTime.getTime()
            )

            // Calculate metrics
            const distanceMeters = act.distanceKm * 1000
            const durationSeconds = act.durationMinutes * 60
            const avgSpeedMs = distanceMeters / durationSeconds
            const maxSpeedMs = avgSpeedMs * 1.3 + Math.random() * 0.5
            const avgPace = durationSeconds / 60 / act.distanceKm // min/km
            const calories = Math.round(act.distanceKm * 65 + Math.random() * 20)

            // Insert ActivityTracking
            const activityResult = await db.collection('activity_tracking').insertOne({
                challengeId: challengeId,
                userId: userId,
                activityType: challenge.category || 'Chạy bộ',
                status: 'completed',
                startTime: startTime,
                endTime: endTime,
                totalDuration: durationSeconds,
                totalDistance: distanceMeters,
                avgSpeed: parseFloat(avgSpeedMs.toFixed(3)),
                maxSpeed: parseFloat(maxSpeedMs.toFixed(3)),
                avgPace: parseFloat(avgPace.toFixed(2)),
                calories: calories,
                gpsRoute: gpsRoute,
                pauseIntervals: [],
                createdAt: startTime,
                updatedAt: endTime
            })

            // Insert ChallengeProgress
            const avgSpeedKmh = (avgSpeedMs * 3.6)
            await db.collection('challenge_progress').insertOne({
                challenge_id: challengeId,
                user_id: userId,
                date: startTime,
                challenge_type: 'outdoor_activity',
                value: act.distanceKm,
                unit: challenge.goal_unit || 'km',
                notes: '',
                proof_image: '',
                distance: act.distanceKm,
                duration_minutes: act.durationMinutes,
                avg_speed: parseFloat(avgSpeedKmh.toFixed(1)),
                calories: calories,
                workout_session_id: null,
                exercises_count: null,
                source: 'gps_tracking',
                activity_id: activityResult.insertedId,
                createdAt: startTime,
                updatedAt: endTime
            })

            totalActivities++
            console.log(`   ▸ Activity ${i + 1}: ${act.distanceKm}km in ${act.durationMinutes}min (${avgSpeedKmh.toFixed(1)} km/h) — ${gpsRoute.length} GPS points`)
        }

        // Track active/completed days
        if (!activeDays.includes(day.date)) {
            activeDays.push(day.date)
        }
        if (day.meetsGoal && !completedDays.includes(day.date)) {
            completedDays.push(day.date)
        }
    }

    // 5. Update participant record
    // Calculate streak from completed_days
    const sortedCompleted = [...completedDays].sort()
    let streak = 0
    const today = '2026-03-29'

    // Walk backward from today
    const dateToCheck = new Date(today + 'T00:00:00+07:00')
    for (let d = 0; d < 30; d++) {
        const checkStr = dateToCheck.toISOString().slice(0, 10)
        if (sortedCompleted.includes(checkStr)) {
            streak++
        } else if (d > 0) {
            break // streak broken
        }
        dateToCheck.setDate(dateToCheck.getDate() - 1)
    }

    await db.collection('challenge_participants').updateOne(
        { _id: participant._id },
        {
            $set: {
                active_days: activeDays,
                completed_days: completedDays,
                current_value: completedDays.length,
                streak_count: streak,
                last_activity_at: new Date('2026-03-29T14:05:00+07:00'),
                updatedAt: new Date()
            }
        }
    )

    console.log(`\n─────────────────────────────────────────────`)
    console.log(`✅ Seeded ${totalActivities} activities across ${days.length} days`)
    console.log(`   Active days: ${activeDays.join(', ')}`)
    console.log(`   Completed days (met 10km goal): ${completedDays.join(', ')}`)
    console.log(`   Streak: ${streak}`)
    console.log(`─────────────────────────────────────────────`)
}

seed()
    .then(async () => {
        await mongoose.disconnect()
        console.log('\n👋 Done! Disconnect from DB.')
        process.exit(0)
    })
    .catch(async (err) => {
        console.error('💥 Seed failed:', err)
        await mongoose.disconnect()
        process.exit(1)
    })
