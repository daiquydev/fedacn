import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env') })

import ChallengeModel from '../src/models/schemas/challenge.schema'
import ChallengeParticipantModel from '../src/models/schemas/challengeParticipant.schema'
import connectDB from '../src/services/database.services'

async function run() {
  try {
    await connectDB()
    console.log('Connected to database')

    const challenges = await ChallengeModel.find({}).lean()
    const challengeIds = challenges.map((c: any) => c._id)

    const participants = await ChallengeParticipantModel.find({
      challenge_id: { $in: challengeIds },
      status: { $ne: 'quit' }
    }).lean()

    let countDeleted = 0

    for (const challenge of challenges as any[]) {
      const cParts = participants.filter((p: any) => String(p.challenge_id) === String(challenge._id))

      let progressPercent = 0
      let totalCurrentValue = 0

      const startDate = new Date(challenge.start_date || new Date())
      const endDate = new Date(challenge.end_date || new Date())
      startDate.setHours(0, 0, 0, 0)
      endDate.setHours(0, 0, 0, 0)
      const totalRequiredDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1)

      if (cParts.length > 0) {
        let totalPct = 0
        cParts.forEach((p: any) => {
          const val = typeof p.current_value === 'number' ? p.current_value : 0
          const pct = Math.min(Math.round((val / totalRequiredDays) * 100), 100)
          totalPct += pct
          totalCurrentValue += val
        })
        progressPercent = Math.round(totalPct / cParts.length)
      }

      // Progress is 0 when either no participants or total progress is 0.
      if (progressPercent === 0) {
        console.log(`Deleting challenge: ${challenge.title} (Progress: 0%, Participants: ${cParts.length})`)
        await ChallengeModel.deleteOne({ _id: challenge._id })
        await ChallengeParticipantModel.deleteMany({ challenge_id: challenge._id })
        countDeleted++
      }
    }

    console.log(`Successfully deleted ${countDeleted} challenges with 0% progress.`)
    process.exit(0)
  } catch (err) {
    console.error('Error:', err)
    process.exit(1)
  }
}

run()
