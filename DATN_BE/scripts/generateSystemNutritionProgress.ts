import mongoose from 'mongoose'
import path from 'path'
import { config } from 'dotenv'
import ChallengeModel from '../src/models/schemas/challenge.schema'
import ChallengeProgressModel from '../src/models/schemas/challengeProgress.schema'
import ChallengeParticipantModel from '../src/models/schemas/challengeParticipant.schema'
import UserModel from '../src/models/schemas/user.schema'

config({ path: path.join(__dirname, '../.env') })

const MONGODB_URL = process.env.MONGODB_URL || ''

const MEAL_IMAGES = [
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=900&q=85',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=900&q=85',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=900&q=85',
  'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=900&q=85',
  'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=900&q=85',
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=900&q=85',
  'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=900&q=85',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=900&q=85'
]

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
        dayMap.set(dayStr, (dayMap.get(dayStr) || 0) + e.value)
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

        const nutritionChallenges = await ChallengeModel.find({ 
            challenge_type: 'nutrition',
            is_deleted: { $ne: true }
        }).lean()
        
        console.log(`Processing ${nutritionChallenges.length} nutrition challenges.`)

        for (let cIdx = 0; cIdx < nutritionChallenges.length; cIdx++) {
            const challenge = nutritionChallenges[cIdx]
            const challengeId = challenge._id as mongoose.Types.ObjectId
            
            console.log(`\n--- Challenge [${cIdx + 1}/${nutritionChallenges.length}]: "${challenge.title}" ---`)

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
                await ChallengeProgressModel.deleteMany({ challenge_id: challengeId, user_id: userId })

                for (let dIdx = 0; dIdx < dayKeys.length; dIdx++) {
                    const dayKey = dayKeys[dIdx]
                    
                    // Goal value
                    const goalValue = challenge.goal_type === 'kcal_target' ? challenge.goal_value : 1
                    const numEntries = challenge.goal_type === 'meals_logged' ? challenge.goal_value : 1
                    
                    for (let s = 0; s < numEntries; s++) {
                        const hourVN = 7 + s * 5 + (pIdx % 3)
                        const minuteVN = 15 + (dIdx % 30)
                        const checkinTime = atVN(dayKey, hourVN, minuteVN)
                        
                        const img = MEAL_IMAGES[(dIdx + s + pIdx + cIdx) % MEAL_IMAGES.length]
                        
                        await ChallengeProgressModel.create({
                            challenge_id: challengeId,
                            user_id: userId,
                            date: checkinTime,
                            challenge_type: 'nutrition',
                            value: challenge.goal_type === 'kcal_target' ? (goalValue / numEntries) : 1,
                            unit: challenge.goal_unit,
                            notes: `Bữa ăn lành mạnh ngày ${dIdx + 1} - Check-in tự động`,
                            proof_image: img,
                            food_name: 'Bữa ăn dinh dưỡng',
                            ai_review_valid: true,
                            ai_review_reason: 'AI: Ảnh rõ nét, nhận diện món ăn phù hợp.',
                            source: 'photo_checkin',
                            validation_status: 'valid'
                        })
                    }
                }

                await recalculateParticipant(challengeId, userId)
                if (pIdx % 5 === 0) console.log(`   Processed participant ${pIdx + 1}/${participants.length}`)
            }
        }

        console.log('\nSuccessfully generated data for ALL nutrition challenges.')
        await mongoose.disconnect()
    } catch (error) {
        console.error('Error:', error)
    }
}

run()
