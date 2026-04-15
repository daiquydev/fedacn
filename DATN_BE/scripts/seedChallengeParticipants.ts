/**
 * - Mỗi thử thách visibility=public: chọn ngẫu nhiên ~2/3 tổng số user (trừ creator) tham gia.
 * - Mỗi thử thách visibility=friends: chọn ngẫu nhiên ~2/3 số bạn bè lẫn nhau (mutual follow) của creator (trừ creator).
 *
 * Ghi trực tiếp challenge_participants + đồng bộ participants_count (bỏ qua check hạn join API).
 *
 * Chạy: npx ts-node -r tsconfig-paths/register ./scripts/seedChallengeParticipants.ts
 */
import mongoose from 'mongoose'
import { config } from 'dotenv'
import path from 'path'

import ChallengeModel from '../src/models/schemas/challenge.schema'
import ChallengeParticipantModel from '../src/models/schemas/challengeParticipant.schema'
import UserModel from '../src/models/schemas/user.schema'
import FollowModel from '../src/models/schemas/follow.schema'

config({ path: path.join(__dirname, '../.env') })

const MONGODB_URL = process.env.MONGODB_URL || ''

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function twoThirdsCount(n: number): number {
  if (n <= 0) return 0
  return Math.max(0, Math.floor((n * 2) / 3))
}

async function getMutualFriendIds(creatorId: mongoose.Types.ObjectId): Promise<mongoose.Types.ObjectId[]> {
  const iFollow = await FollowModel.find({ user_id: creatorId }).select('follow_id').lean()
  const iFollowIds = iFollow.map((f) => f.follow_id.toString())
  if (iFollowIds.length === 0) return []

  const followMeBack = await FollowModel.find({
    user_id: { $in: iFollowIds.map((id) => new mongoose.Types.ObjectId(id)) },
    follow_id: creatorId
  })
    .select('user_id')
    .lean()

  return followMeBack.map((f) => new mongoose.Types.ObjectId(String(f.user_id)))
}

async function ensureParticipant(
  challengeId: mongoose.Types.ObjectId,
  userId: mongoose.Types.ObjectId,
  goalValue: number
): Promise<boolean> {
  const exists = await ChallengeParticipantModel.findOne({
    challenge_id: challengeId,
    user_id: userId,
    status: { $ne: 'quit' }
  })
    .select('_id')
    .lean()
  if (exists) return false

  await ChallengeParticipantModel.create({
    challenge_id: challengeId,
    user_id: userId,
    current_value: 0,
    goal_value: goalValue,
    is_completed: false,
    completed_at: null,
    last_activity_at: null,
    active_days: [],
    completed_days: [],
    streak_count: 0,
    status: 'in_progress'
  })
  return true
}

async function syncParticipantCount(challengeId: mongoose.Types.ObjectId) {
  const n = await ChallengeParticipantModel.countDocuments({
    challenge_id: challengeId,
    status: { $ne: 'quit' }
  })
  await ChallengeModel.updateOne({ _id: challengeId }, { $set: { participants_count: n } })
}

async function main() {
  if (!MONGODB_URL) {
    console.error('Thiếu MONGODB_URL trong .env')
    process.exit(1)
  }

  await mongoose.connect(MONGODB_URL)
  console.log('Đã kết nối MongoDB')

  const allUsers = await UserModel.find({}).select('_id').lean()
  const allUserIds = allUsers.map((u) => new mongoose.Types.ObjectId(String(u._id)))
  const totalUsers = allUserIds.length
  const publicPoolSize = twoThirdsCount(totalUsers)
  console.log(`Tổng user: ${totalUsers} → mỗi thử thách public sẽ mời tối đa ${publicPoolSize} người (2/3, làm tròn xuống)`)

  const publicChallenges = await ChallengeModel.find({
    visibility: 'public',
    status: 'active',
    is_deleted: { $ne: true }
  }).lean()

  const friendsChallenges = await ChallengeModel.find({
    visibility: 'friends',
    status: 'active',
    is_deleted: { $ne: true }
  }).lean()

  let added = 0

  for (const ch of publicChallenges) {
    const cid = new mongoose.Types.ObjectId(String(ch._id))
    const creatorId = new mongoose.Types.ObjectId(String(ch.creator_id))
    const pool = allUserIds.filter((id) => !id.equals(creatorId))
    const k = twoThirdsCount(pool.length)
    if (k === 0) continue
    const picked = shuffle(pool).slice(0, k)
    const gv = ch.goal_value
    for (const uid of picked) {
      if (await ensureParticipant(cid, uid, gv)) added++
    }
    await syncParticipantCount(cid)
  }

  console.log(`Public challenges: ${publicChallenges.length} — đã thêm ${added} participation (ước lượng, có thể trùng user giữa các challenge)`)

  let friendsAdded = 0
  for (const ch of friendsChallenges) {
    const cid = new mongoose.Types.ObjectId(String(ch._id))
    const creatorId = new mongoose.Types.ObjectId(String(ch.creator_id))
    const mutual = (await getMutualFriendIds(creatorId)).filter((id) => !id.equals(creatorId))
    const k = twoThirdsCount(mutual.length)
    if (k === 0) {
      await syncParticipantCount(cid)
      continue
    }
    const picked = shuffle(mutual).slice(0, k)
    const gv = ch.goal_value
    for (const uid of picked) {
      if (await ensureParticipant(cid, uid, gv)) friendsAdded++
    }
    await syncParticipantCount(cid)
  }

  console.log(`Friends challenges: ${friendsChallenges.length} — đã thêm ${friendsAdded} participation mới (nếu chưa tham gia)`)

  await mongoose.disconnect()
  console.log('Đã ngắt kết nối.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
