/**
 * Sửa thử thách bị kẹt: is_deleted + deleted_from_report_moderation (410 "gỡ do vi phạm")
 * sau khi đã khôi phục trên Admin nhưng DB chưa đồng bộ (chạy code restore cũ).
 *
 * Dùng: npx ts-node -r tsconfig-paths/register ./scripts/fixStuckChallengeModerationFlags.ts <challengeId>
 */
import dotenv from 'dotenv'
import path from 'path'
import mongoose from 'mongoose'

dotenv.config({ path: path.resolve(__dirname, '../.env') })

import connectDB from '../src/services/database.services'
import ChallengeModel from '../src/models/schemas/challenge.schema'
import UserModel from '../src/models/schemas/user.schema'

async function run() {
  const id = process.argv[2]?.trim()
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    console.error('Cách dùng: npx ts-node -r tsconfig-paths/register ./scripts/fixStuckChallengeModerationFlags.ts <challengeId>')
    process.exit(1)
  }

  await connectDB()

  const existing = await ChallengeModel.findById(id)
    .select('title is_deleted deleted_from_report_moderation creator_id status')
    .lean()

  if (!existing) {
    console.error('Không tìm thấy thử thách:', id)
    process.exit(1)
  }

  console.log('Trước khi sửa:', JSON.stringify(existing, null, 2))

  const wasModerationRemoval =
    existing.is_deleted === true && existing.deleted_from_report_moderation === true
  const creatorId = existing.creator_id ? String(existing.creator_id) : ''

  const updated = await ChallengeModel.findByIdAndUpdate(
    id,
    {
      $set: {
        is_deleted: false,
        deleted_from_report_moderation: false,
        deleted_at: null,
        status: 'active'
      }
    },
    { new: true }
  )
    .select('title is_deleted deleted_from_report_moderation status')
    .lean()

  if (wasModerationRemoval && creatorId && mongoose.Types.ObjectId.isValid(creatorId)) {
    await UserModel.updateOne(
      { _id: new mongoose.Types.ObjectId(creatorId) },
      [{ $set: { banned_count: { $max: [0, { $subtract: [{ $ifNull: ['$banned_count', 0] }, 1] }] } } }]
    )
    console.log('Đã giảm banned_count của chủ thử thách (nếu > 0).')
  }

  console.log('Sau khi sửa:', JSON.stringify(updated, null, 2))
  await mongoose.disconnect()
  process.exit(0)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
