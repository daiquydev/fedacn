import 'dotenv/config'
import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URL

const LEVEL_UP_REGEX = /(level|th[aă]ng\s*c[aấ]p)/i

async function removeLevelUpNotifications() {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URL is missing. Please set it in environment or .env file.')
  }

  await mongoose.connect(MONGODB_URI)
  console.log('Connected to MongoDB')

  const notificationCollection = mongoose.connection.collection('notifications')

  const filter = {
    $or: [{ content: { $regex: LEVEL_UP_REGEX } }, { name_notification: { $regex: LEVEL_UP_REGEX } }]
  }

  const matchedCount = await notificationCollection.countDocuments(filter)
  const deleteResult = await notificationCollection.deleteMany(filter)

  console.log(`Matched: ${matchedCount}`)
  console.log(`Deleted: ${deleteResult.deletedCount}`)
}

removeLevelUpNotifications()
  .then(async () => {
    await mongoose.disconnect()
    console.log('Done')
    process.exit(0)
  })
  .catch(async (error) => {
    console.error('Failed to remove level-up notifications:', error)
    await mongoose.disconnect()
    process.exit(1)
  })
