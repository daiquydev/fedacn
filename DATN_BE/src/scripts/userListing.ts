import mongoose from 'mongoose'
import { envConfig } from '../constants/config'
import UserModel from '../models/schemas/user.schema'
import { UserRoles } from '../constants/enums'

async function task() {
  try {
    await mongoose.connect(envConfig.mongoURL)
    
    const allUsers = await UserModel.find({ isDeleted: { $ne: true } }).lean()
    
    const filteredUsers = allUsers.filter(u => 
      u.role !== UserRoles.admin && 
      u.name !== u.email
    )

    console.log('JSON_START')
    console.log(JSON.stringify({
      total: allUsers.length,
      filteredCount: filteredUsers.length,
      users: filteredUsers.map(u => ({
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role
      }))
    }))
    console.log('JSON_END')

    await mongoose.disconnect()
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

task()
