import mongoose from 'mongoose'
import { envConfig } from '../constants/config'
import { UserStatus } from '../constants/enums'
import UserModel from '../models/schemas/user.schema'

/**
 * One-time migration: bỏ trạng thái "khóa tài khoản" (status=banned), chỉ dùng xóa mềm (isDeleted).
 * Chạy: npx ts-node -r tsconfig-paths/register ./src/scripts/migrateRemoveUserAccountBan.ts
 */
async function migrate() {
  await mongoose.connect(envConfig.mongoURL)
  console.log('Connected to MongoDB')

  const res = await UserModel.updateMany({ status: UserStatus.banned }, { $set: { status: UserStatus.active } })
  console.log(`Updated ${res.modifiedCount} user(s): status banned → active`)

  await mongoose.disconnect()
  process.exit(0)
}

migrate().catch((e) => {
  console.error(e)
  process.exit(1)
})
