import mongoose from 'mongoose'
import { envConfig } from '../constants/config'
import UserModel from '../models/schemas/user.schema'

const moreFemaleNames = [
  'Phan Hoàng Yến',
  'Trần Thu Trang',
  'Nguyễn Bảo Châu',
  'Lê Thị Thanh Vân',
  'Phạm Bích Thủy',
  'Vũ Thu Phương',
  'Đỗ Quyên',
  'Hoàng Xuân Sính',
  'Bùi Thị Xuân',
  'Ngô Phương Lan'
]

async function fixUser4AndDuplicates() {
  try {
    await mongoose.connect(envConfig.mongoURL)
    console.log('Connected to MongoDB.')

    // 1. Fix User 4
    const user4Result = await UserModel.updateOne(
      { $or: [{ user_name: 'user4' }, { email: /user4@/i }] },
      { $set: { name: 'Phan Hoàng Yến', gender: 'female' } }
    )
    if (user4Result.modifiedCount > 0) {
      console.log('- Renamed User 4 -> Phan Hoàng Yến')
    }

    // 2. Fix users with name === email
    const duplicateUsers = await UserModel.find({
      $expr: { $eq: ['$name', '$email'] },
      isDeleted: { $ne: true }
    })

    console.log(`Tìm thấy ${duplicateUsers.length} người dùng có tên trùng email.`)

    for (let i = 0; i < duplicateUsers.length; i++) {
      const user = duplicateUsers[i]
      const newName = moreFemaleNames[i % moreFemaleNames.length]
      
      await UserModel.updateOne(
        { _id: user._id },
        { $set: { name: newName, gender: 'female' } }
      )
      console.log(`- Renamed Duplicate: ${user.email} -> ${newName}`)
    }

    await mongoose.disconnect()
    console.log('Hoàn tất xử lý User 4 và các tài khoản trùng tên!')
  } catch (error) {
    console.error(error)
  }
}

fixUser4AndDuplicates()
