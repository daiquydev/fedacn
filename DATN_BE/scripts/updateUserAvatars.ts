import mongoose from 'mongoose'
import { config } from 'dotenv'
import path from 'path'

import UserModel from '../src/models/schemas/user.schema'

config({ path: path.join(__dirname, '../.env') })

const MONGODB_URL = process.env.MONGODB_URL || ''

async function main() {
  if (!MONGODB_URL) {
    console.error('Thiếu MONGODB_URL trong .env')
    process.exit(1)
  }

  await mongoose.connect(MONGODB_URL)
  console.log('Đã kết nối MongoDB')

  // Find all users who don't have an avatar or it's an empty string
  const users = await UserModel.find({
    $or: [
      { avatar: { $exists: false } },
      { avatar: null },
      { avatar: '' }
    ]
  })

  console.log(`Tìm thấy ${users.length} users chưa có avatar. Tiến hành cập nhật...`)

  let updatedCount = 0

  for (const user of users) {
    // Generate avatar using ui-avatars.com
    const nameStr = user.name || user.user_name || 'User'
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(nameStr)}&background=random`
    
    user.avatar = avatarUrl
    await user.save()
    updatedCount++
  }

  console.log(`Đã cập nhật avatar thành công cho ${updatedCount} users.`)

  await mongoose.disconnect()
  console.log('Đã ngắt kết nối.')
}

main().catch((e) => {
  console.error('Lỗi xảy ra:', e)
  process.exit(1)
})
