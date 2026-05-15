import mongoose from 'mongoose'
import { envConfig } from '../constants/config'
import UserModel from '../models/schemas/user.schema'

const userRenameMap: { [key: string]: string } = {
  'user1@gmail.com': 'Nguyễn Thùy Lâm',
  'user2@gmail.com': 'Lê Khánh Chi',
  'user3@gmail.com': 'Phạm Minh Hà',
  'tester@gmail.com': 'Trần Thu Thảo',
  'test88@gmail.com': 'Đỗ Hải Yến'
}

// Tìm các user dựa trên username hoặc email nếu email không khớp hoàn toàn
const usernames = ['user1', 'user2', 'user3', 'tester', 'test88']

async function renameGenericUsers() {
  try {
    await mongoose.connect(envConfig.mongoURL)
    console.log('Connected to MongoDB.')

    for (const username of usernames) {
      const newName = userRenameMap[`${username}@gmail.com`]
      const result = await UserModel.updateOne(
        { 
          $or: [
            { user_name: username },
            { email: new RegExp(`^${username}@`, 'i') }
          ]
        },
        { 
          $set: { 
            name: newName,
            gender: 'female' 
          } 
        }
      )
      if (result.modifiedCount > 0) {
        console.log(`- Renamed Generic User: ${username} -> ${newName}`)
      }
    }

    await mongoose.disconnect()
    console.log('Đổi tên các tài khoản User/Test hoàn tất!')
  } catch (error) {
    console.error(error)
  }
}

renameGenericUsers()
