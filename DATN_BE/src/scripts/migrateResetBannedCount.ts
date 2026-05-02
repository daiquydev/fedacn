import mongoose from 'mongoose'
import { envConfig } from '../constants/config'
import UserModel from '../models/schemas/user.schema'

/**
 * Đặt banned_count (lượt vi phạm) = 0 cho tất cả user.
 * Chạy: npx ts-node -r tsconfig-paths/register ./src/scripts/migrateResetBannedCount.ts
 */
async function migrate() {
  await mongoose.connect(envConfig.mongoURL)
  console.log('Connected to MongoDB')

  const res = await UserModel.updateMany({}, { $set: { banned_count: 0 } })
  console.log(`matchedCount=${res.matchedCount}, modifiedCount=${res.modifiedCount}`)

  await mongoose.disconnect()
  process.exit(0)
}

migrate().catch((e) => {
  console.error(e)
  process.exit(1)
})
