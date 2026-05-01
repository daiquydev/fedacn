import mongoose from 'mongoose'
import dotenv from 'dotenv'
import ChallengeModel from './src/models/schemas/challenge.schema'
import ChallengeParticipantModel from './src/models/schemas/challengeParticipant.schema'

dotenv.config()

async function check() {
  await mongoose.connect(process.env.MONGODB_URL || '')
  const ev = await ChallengeModel.findById('69dbb47c9e1a6f2aafeb9939')
  if (ev) {
    console.log('Challenge found:', ev.toObject())
    // Check participants
    const participants = await ChallengeParticipantModel.find({ challengeId: ev._id })
    console.log('Participants count:', participants.length)
  } else {
    console.log('Challenge NOT found!')
  }
  process.exit(0)
}
check()
