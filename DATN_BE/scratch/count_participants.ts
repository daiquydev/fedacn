import mongoose from 'mongoose'
import { envConfig } from '../src/constants/config'
import ChallengeParticipantModel from '../src/models/schemas/challengeParticipant.schema'

async function countParticipants() {
    try {
        await mongoose.connect(envConfig.mongoURL)
        const challengeId = '69dbb47c9e1a6f2aafeb9927'
        const count = await ChallengeParticipantModel.countDocuments({ challenge_id: challengeId })
        console.log(`Total participants in challenge ${challengeId}: ${count}`)
        await mongoose.disconnect()
    } catch (error) {
        console.error('Error:', error)
    }
}

countParticipants()
