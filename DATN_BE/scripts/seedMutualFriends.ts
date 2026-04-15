/**
 * Chia đôi danh sách người dùng (trừ 2 tài khoản seed): một nửa kết bạn lẫn nhau với
 * quy.tranquil@gmail.com, nửa còn lại với phamquocdung04@gmail.com.
 * "Bạn bè" = theo dõi lẫn nhau (mutual follow), khớp logic FE (followers ∩ following).
 *
 * Chạy: npx ts-node -r tsconfig-paths/register ./scripts/seedMutualFriends.ts
 * Chỉ thêm follow còn thiếu, chạy lại an toàn (idempotent).
 */
import mongoose from 'mongoose'
import { config } from 'dotenv'
import path from 'path'

import UserModel from '../src/models/schemas/user.schema'
import FollowModel from '../src/models/schemas/follow.schema'

config({ path: path.join(__dirname, '../.env') })

const MONGODB_URL = process.env.MONGODB_URL || ''

const PAIR_EMAILS = ['quy.tranquil@gmail.com', 'phamquocdung04@gmail.com'] as const

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function findUserByEmail(email: string) {
  return UserModel.findOne({
    email: new RegExp(`^${escapeRegex(email)}$`, 'i')
  })
    .select('_id email')
    .lean()
}

async function ensureFollow(a: mongoose.Types.ObjectId, b: mongoose.Types.ObjectId): Promise<boolean> {
  const exists = await FollowModel.findOne({ user_id: a, follow_id: b }).select('_id').lean()
  if (exists) return false
  await FollowModel.create({ user_id: a, follow_id: b })
  return true
}

async function main() {
  if (!MONGODB_URL) {
    console.error('Thiếu MONGODB_URL trong .env')
    process.exit(1)
  }

  await mongoose.connect(MONGODB_URL)
  console.log('Đã kết nối MongoDB')

  const quy = await findUserByEmail(PAIR_EMAILS[0])
  const dung = await findUserByEmail(PAIR_EMAILS[1])

  if (!quy || !dung) {
    console.error(
      'Cần đủ 2 tài khoản trong DB:',
      PAIR_EMAILS.join(', '),
      '| Thiếu:',
      [!quy && PAIR_EMAILS[0], !dung && PAIR_EMAILS[1]].filter(Boolean).join(', ')
    )
    process.exit(1)
  }

  const quyId = new mongoose.Types.ObjectId(String(quy._id))
  const dungId = new mongoose.Types.ObjectId(String(dung._id))

  let created = 0
  if (await ensureFollow(quyId, dungId)) created++
  if (await ensureFollow(dungId, quyId)) created++
  if (created) console.log(`Hai tài khoản seed: đã đảm bảo follow lẫn nhau (+${created} bản ghi mới).`)

  const others = await UserModel.find({
    _id: { $nin: [quyId, dungId] }
  })
    .select('_id')
    .sort({ _id: 1 })
    .lean()

  const ids = others.map((u) => new mongoose.Types.ObjectId(String(u._id)))
  const mid = Math.floor(ids.length / 2)
  const forQuy = ids.slice(0, mid)
  const forDung = ids.slice(mid)

  console.log(`Tổng user khác (trừ 2 seed): ${ids.length}`)
  console.log(`→ ${forQuy.length} user mutual với ${PAIR_EMAILS[0]}`)
  console.log(`→ ${forDung.length} user mutual với ${PAIR_EMAILS[1]}`)

  for (const uid of forQuy) {
    if (await ensureFollow(quyId, uid)) created++
    if (await ensureFollow(uid, quyId)) created++
  }
  for (const uid of forDung) {
    if (await ensureFollow(dungId, uid)) created++
    if (await ensureFollow(uid, dungId)) created++
  }

  console.log(`Đã tạo mới ${created} bản ghi follow (còn lại đã tồn tại).`)

  await mongoose.disconnect()
  console.log('Đã ngắt kết nối.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
