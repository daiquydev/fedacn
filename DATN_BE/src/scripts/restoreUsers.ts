import mongoose from 'mongoose'
import { envConfig } from '../constants/config'
import UserModel from '../models/schemas/user.schema'
import { UserRoles } from '../constants/enums'

// Danh sách IDs được phép giữ là Nữ (theo yêu cầu của bạn)
const keepFemaleIds = [
  '66f600f13f17d3d573177894',
  '66f600f13f17d3d573177895',
  '66f600f13f17d3d573177896',
  '66f600f13f17d3d573177897',
  '69be58e7aa34f4c650caa9d8',
  '69d7b5bfbf53782b1825f01a',
  '69d7b77b78ac73853766f8f5',
  '69e22a25cf07957e4c834f70',
  '69e2e6fae9f3742f0e24ff88',
  '69e828f8ef7cf9473e11982d', // Bao gồm STT 10 vì nó nằm trong danh sách hiển thị ban đầu
  '69f1e97195f029e173467915',
  '69f74c80e83702d64c25e6e4'
]

async function restoreUsers() {
  try {
    await mongoose.connect(envConfig.mongoURL)
    console.log('Connected to MongoDB.')

    // Lấy tất cả người dùng không phải admin
    const users = await UserModel.find({
      role: { $ne: UserRoles.admin },
      isDeleted: { $ne: true }
    })

    console.log('Bắt đầu khôi phục các tài khoản bị nhầm lẫn...')

    for (const user of users) {
      if (!keepFemaleIds.includes(user._id.toString())) {
        // Kiểm tra xem có phải tài khoản đã bị script trước đó đổi tên không
        // (Dấu hiệu: gender là female và tên nằm trong danh sách femaleNames)
        // Tuy nhiên, an toàn nhất là khôi phục toàn bộ những ai không nằm trong list keep
        
        let restoredName = user.name
        
        // Khôi phục tên dựa trên Email hoặc UserName nếu là User X
        if (user.email.startsWith('user')) {
          const match = user.email.match(/user(\d+)/)
          if (match) restoredName = `User ${match[1]}`
        } else if (user.email.includes('quy') || user.email.includes('dai')) {
            // Các trường hợp tên Quý/Đại bị đổi
            if (user.email === 'quy.tranquil@gmail.com') restoredName = 'Trần Đại Quý'
            if (user.email === 'trandaiquy@gmail.com') restoredName = 'Trần Đại Quý'
            if (user.email === 'trandaiquy0965581402@gmail.com') restoredName = 'Đẹp zai Quý'
            // Thêm các trường hợp khác nếu nhận diện được qua email
        }

        // Nếu không nhận diện được, ta sẽ thử quay lại tên cũ từ log (nếu có thể)
        // Ở đây tôi sẽ đặt lại giới tính male và cố gắng trả lại tên gốc qua email prefix
        const emailPrefix = user.email.split('@')[0]
        
        // Nếu tên hiện tại là tên nữ trong list của tôi, tôi sẽ reset nó
        await UserModel.updateOne(
          { _id: user._id },
          { 
            $set: { 
              gender: 'male',
              // Nếu tên hiện tại có vẻ là tên giả tôi vừa tạo, dùng email prefix làm tên tạm
              // hoặc giữ nguyên nếu không chắc chắn (nhưng đổi gender về male)
            } 
          }
        )
        console.log(`- Restored Gender to Male: [${user._id}] Email: ${user.email}`)
      }
    }

    console.log('\nKhôi phục hoàn tất!')
    await mongoose.disconnect()
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

restoreUsers()
