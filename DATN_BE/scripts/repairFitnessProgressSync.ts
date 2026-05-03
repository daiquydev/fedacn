import mongoose from 'mongoose'
import path from 'path'
import { config } from 'dotenv'
import ChallengeProgressModel from '../src/models/schemas/challengeProgress.schema'
import WorkoutSessionModel from '../src/models/schemas/workoutSession.schema'

config({ path: path.join(__dirname, '../.env') })

const MONGODB_URL = process.env.MONGODB_URL || ''

async function run() {
    try {
        await mongoose.connect(MONGODB_URL)
        console.log('Connected to MongoDB')

        const fitnessProgs = await ChallengeProgressModel.find({
            challenge_type: 'fitness',
            workout_session_id: { $ne: null }
        })

        console.log(`Found ${fitnessProgs.length} fitness progress records to check.`)

        let updatedCount = 0
        for (const prog of fitnessProgs) {
            const session = await WorkoutSessionModel.findById(prog.workout_session_id)
            if (session) {
                let changed = false
                if (prog.duration_minutes !== session.duration_minutes) {
                    prog.duration_minutes = session.duration_minutes
                    changed = true
                }
                if (prog.calories !== session.total_calories) {
                    prog.calories = session.total_calories
                    changed = true
                }

                if (changed) {
                    await prog.save()
                    updatedCount++
                }
            }
        }

        console.log(`Successfully updated ${updatedCount} records.`)
        await mongoose.disconnect()
    } catch (error) {
        console.error('Error:', error)
    }
}

run()
