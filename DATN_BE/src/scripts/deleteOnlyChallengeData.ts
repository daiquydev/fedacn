import mongoose from 'mongoose'
import { envConfig } from '../constants/config'
import { NotificationTypes } from '../constants/enums'

async function deleteOnlyChallengeData() {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(envConfig.mongoURL)
    const db = mongoose.connection.db
    if (!db) {
      throw new Error('Database connection failed')
    }

    const challengeCollections = [
      'challenges',
      'challenge_participants',
      'challenge_progress',
      'challenge_day_comments',
      'challenge_templates',
      'challenge_activities',
      'challenge_invitations',
      'challenge_ratings',
      'challengesessions',
      'habit_challenges',
      'habit_challenge_participants'
    ]

    console.log('\n--- STARTING DELETION ---')

    for (const collectionName of challengeCollections) {
      const result = await db.collection(collectionName).deleteMany({})
      console.log(`✅ Deleted ${result.deletedCount} documents from ${collectionName}`)
    }

    // Delete challenge-related notifications
    // challengeJoined: 33, challengeCompleted: 34, challengeMilestone: 35, challengeInvite: 36, reportChallenge: 38
    const challengeNotificationTypes = [
      NotificationTypes.challengeJoined,
      NotificationTypes.challengeCompleted,
      NotificationTypes.challengeMilestone,
      NotificationTypes.challengeInvite,
      NotificationTypes.reportChallenge
    ]

    const notifyResult = await db.collection('notifications').deleteMany({
      type: { $in: challengeNotificationTypes }
    })
    console.log(`✅ Deleted ${notifyResult.deletedCount} challenge-related notifications`)

    console.log('--- DELETION COMPLETE ---')

  } catch (error) {
    console.error('❌ Error during deletion:', error)
  } finally {
    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
  }
}

deleteOnlyChallengeData()
