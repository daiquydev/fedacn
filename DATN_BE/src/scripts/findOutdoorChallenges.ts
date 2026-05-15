import mongoose from 'mongoose'
import { envConfig } from '../constants/config'
import ChallengeModel from '../models/schemas/challenge.schema'

async function findOutdoorChallenges() {
  await mongoose.connect(envConfig.mongoURL)
  const challenges = await ChallengeModel.find({ challenge_type: 'outdoor_activity' })
  console.log(`Found ${challenges.length} outdoor challenges:`)
  challenges.forEach(c => {
    console.log(`- ID: ${c._id}, Title: ${c.title}, Start: ${c.start_date}, End: ${c.end_date}, Category: ${c.category}`)
  })
  await mongoose.disconnect()
}

findOutdoorChallenges().catch(console.error)
