import mongoose from 'mongoose'
import path from 'path'
import { config } from 'dotenv'
import ChallengeProgressModel from '../src/models/schemas/challengeProgress.schema'

config({ path: path.join(__dirname, '../.env') })

const MONGODB_URL = process.env.MONGODB_URL || ''

async function run() {
    await mongoose.connect(MONGODB_URL)
    const progs = await ChallengeProgressModel.find({ challenge_type: 'fitness' }).limit(5).lean()
    console.log(JSON.stringify(progs, null, 2))
    await mongoose.disconnect()
}

run()
