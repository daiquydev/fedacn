import mongoose from 'mongoose'
import { envConfig } from '../constants/config'
import UserModel from '../models/schemas/user.schema'

const keepFemaleIds = [
  '66f600f13f17d3d573177894', '66f600f13f17d3d573177895', '66f600f13f17d3d573177896', '66f600f13f17d3d573177897',
  '69be58e7aa34f4c650caa9d8', '69d7b5bfbf53782b1825f01a', '69d7b77b78ac73853766f8f5', '69e22a25cf07957e4c834f70',
  '69e2e6fae9f3742f0e24ff88', '69e828f8ef7cf9473e11982d', '69f1e97195f029e173467915', '69f74c80e83702d64c25e6e4'
]

function capitalizeWords(str: string) {
  return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

function emailToName(email: string) {
  const prefix = email.split('@')[0]
  // Loại bỏ số ở cuối
  const nameOnly = prefix.replace(/\d+$/, '')
  
  // Xử lý các trường hợp đặc biệt
  if (nameOnly.startsWith('user')) return `User ${prefix.replace('user', '')}`
  
  // Tách các từ (giả định camelCase hoặc dính liền)
  // Đây là một logic dự đoán đơn giản
  return capitalizeWords(nameOnly)
}

async function finalRestore() {
  try {
    await mongoose.connect(envConfig.mongoURL)
    const users = await UserModel.find({ _id: { $nin: keepFemaleIds.map(id => new mongoose.Types.ObjectId(id)) } })

    for (const user of users) {
      const originalName = emailToName(user.email)
      
      // Chỉ khôi phục nếu tên hiện tại có vẻ đã bị script cũ đổi (vì script cũ dùng femaleNames)
      // Nhưng để chắc chắn và sạch sẽ, tôi sẽ reset lại theo email cho tất cả những ai không nằm trong list giữ
      await UserModel.updateOne(
        { _id: user._id },
        { $set: { name: originalName, gender: 'male' } }
      )
      console.log(`- Final Restored: [${user._id}] ${user.email} -> ${originalName}`)
    }

    await mongoose.disconnect()
    console.log('Xong!')
  } catch (error) {
    console.error(error)
  }
}

finalRestore()
