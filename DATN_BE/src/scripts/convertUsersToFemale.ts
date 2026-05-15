import mongoose from 'mongoose'
import { envConfig } from '../constants/config'
import UserModel from '../models/schemas/user.schema'
import { UserRoles, UserGender } from '../constants/enums'

const femaleNames = [
  'Nguyễn Thùy Chi',
  'Trần Thu Hà',
  'Lê Mỹ Linh',
  'Phạm Thanh Thảo',
  'Hoàng Minh Anh',
  'Đặng Thủy Tiên',
  'Bùi Phương Thảo',
  'Đỗ Hải Yến',
  'Ngô Bảo Ngọc',
  'Lý Nhã Kỳ',
  'Võ Hạ Trâm',
  'Trịnh Kim Chi',
  'Nguyễn Thị Mai',
  'Trần Diệu Nhi',
  'Lê Cát Trọng Lý'
]

async function convertToFemale() {
  try {
    await mongoose.connect(envConfig.mongoURL)
    console.log('Connected to MongoDB.')

    // Lấy danh sách người dùng thỏa mãn điều kiện cũ (để đảm bảo đúng đối tượng)
    const users = await UserModel.find({
      role: { $ne: UserRoles.admin },
      isDeleted: { $ne: true }
    })

    const filteredUsers = users.filter(user => user.name !== user.email)

    console.log(`Bắt đầu cập nhật ${filteredUsers.length} người dùng...`)

    for (let i = 0; i < filteredUsers.length; i++) {
      const user = filteredUsers[i]
      const oldName = user.name
      const newName = femaleNames[i % femaleNames.length]

      await UserModel.updateOne(
        { _id: user._id },
        { 
          $set: { 
            name: newName,
            gender: 'female' // Theo enum UserGender.female
          } 
        }
      )
      console.log(`- Updated: [${user._id}] ${oldName} -> ${newName} (Gender: female)`)
    }

    console.log('\nCập nhật hoàn tất!')
    await mongoose.disconnect()
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

convertToFemale()
