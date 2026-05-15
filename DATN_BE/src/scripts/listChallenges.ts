import mongoose from 'mongoose'
import { envConfig } from '../constants/config'
import ChallengeModel from '../models/schemas/challenge.schema'

async function listChallenges() {
  await mongoose.connect(envConfig.mongoURL)
  const challenges = await ChallengeModel.find({})
  console.log(`Found ${challenges.length} challenges:`)
  challenges.forEach(c => {
    console.log(`- ID: ${c._id}, Title: ${c.title}, GoalType: ${c.goal_type}, Category: ${c.category}`)
  })
  await mongoose.disconnect()
}

listChallenges().catch(console.error)
