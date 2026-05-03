import mongoose from 'mongoose'
import { envConfig } from '../src/constants/config'
import UserModel from '../src/models/schemas/user.schema'
import ChallengeModel from '../src/models/schemas/challenge.schema'
import ChallengeParticipantModel from '../src/models/schemas/challengeParticipant.schema'

async function discover() {
    try {
        await mongoose.connect(envConfig.mongoURL)
        console.log('Connected to MongoDB')

        const user = await UserModel.findOne({ email: 'user1@gmail.com' })
        if (!user) {
            console.error('User not found: user1@gmail.com')
            return
        }
        console.log('User found:', { id: user._id, name: user.name, email: user.email })

        const challengeId = '69dbb47c9e1a6f2aafeb9927'
        const challenge = await ChallengeModel.findById(challengeId)
        if (!challenge) {
            console.error('Challenge not found:', challengeId)
            return
        }
        console.log('Challenge found:', { 
            id: challenge._id, 
            title: challenge.title, 
            startDate: challenge.startDate, 
            endDate: challenge.endDate,
            goals: challenge.goals,
            type: challenge.type
        })

        const participant = await ChallengeParticipantModel.findOne({ 
            challenge_id: challengeId, 
            user_id: user._id 
        })
        
        if (participant) {
            console.log('Participant found:', {
                id: participant._id,
                joinedAt: participant.joined_at,
                status: participant.status
            })
        } else {
            console.log('User is NOT a participant of this challenge.')
        }

        await mongoose.disconnect()
    } catch (error) {
        console.error('Error:', error)
    }
}

discover()
