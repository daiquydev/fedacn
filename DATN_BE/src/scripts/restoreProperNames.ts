import mongoose from 'mongoose'
import { envConfig } from '../constants/config'
import UserModel from '../models/schemas/user.schema'

const nameMap: { [key: string]: string } = {
  'phangiabao10@gmail.com': 'Phan Gia Bảo',
  'dominhnhat09@gmail.com': 'Đỗ Minh Nhật',
  'vukhanhly08@gmail.com': 'Vũ Khánh Ly',
  'buithanhlong07@gmail.com': 'Bùi Thanh Long',
  'dangtuankiet06@gmail.com': 'Đặng Tuấn Kiệt',
  'hoanggiahan05@gmail.com': 'Hoàng Gia Hân',
  'phamquocdung04@gmail.com': 'Phạm Quốc Dũng',
  'leminhchau03@gmail.com': 'Lê Minh Châu',
  'tranthibinh02@gmail.com': 'Trần Thị Bình',
  'nguyenvanan01@gmail.com': 'Nguyễn Văn An',
  'mkquybonghau10102003@gmail.com': 'Quý Đại',
  'user4@gmail.com': 'User 4'
}

const keepFemaleIds = [
  '66f600f13f17d3d573177894', '66f600f13f17d3d573177895', '66f600f13f17d3d573177896', '66f600f13f17d3d573177897',
  '69be58e7aa34f4c650caa9d8', '69d7b5bfbf53782b1825f01a', '69d7b77b78ac73853766f8f5', '69e22a25cf07957e4c834f70',
  '69e2e6fae9f3742f0e24ff88', '69e828f8ef7cf9473e11982d', '69f1e97195f029e173467915', '69f74c80e83702d64c25e6e4'
]

async function restoreProperNames() {
  try {
    await mongoose.connect(envConfig.mongoURL)
    console.log('Connected to MongoDB.')

    for (const [email, name] of Object.entries(nameMap)) {
      const result = await UserModel.updateOne(
        { 
          email: email,
          _id: { $nin: keepFemaleIds.map(id => new mongoose.Types.ObjectId(id)) }
        },
        { $set: { name: name, gender: 'male' } }
      )
      if (result.modifiedCount > 0) {
        console.log(`- Restored Proper Name: ${email} -> ${name}`)
      }
    }

    await mongoose.disconnect()
    console.log('Khôi phục tên có dấu hoàn tất!')
  } catch (error) {
    console.error(error)
  }
}

restoreProperNames()
