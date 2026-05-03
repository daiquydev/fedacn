import mongoose from 'mongoose'
import { envConfig } from '../src/constants/config'
import ChallengeModel from '../src/models/schemas/challenge.schema'

async function listOutdoorChallenges() {
    try {
        await mongoose.connect(envConfig.mongoURL)
        const challenges = await ChallengeModel.find({ 
            challenge_type: 'outdoor_activity',
            is_deleted: { $ne: true }
        })
        console.log(`Found ${challenges.length} active outdoor challenges:`)
        challenges.forEach(c => {
            console.log(`- ${c.title} (${c._id}) [${c.category}]`)
        })
        await mongoose.disconnect()
    } catch (error) {
        console.error('Error:', error)
    }
}

listOutdoorChallenges()
