import mongoose from 'mongoose'
import { envConfig } from '../constants/config'
import UserModel from '../models/schemas/user.schema'

async function checkDuplicates() {
  await mongoose.connect(envConfig.mongoURL)
  const allUsers = await UserModel.find({ isDeleted: { $ne: true } }).lean()
  const same = allUsers.filter(u => u.name.toLowerCase() === u.email.toLowerCase())
  console.log(`Found ${same.length} users with name == email`)
  same.forEach(u => console.log(`- ${u.email} : ${u.name}`))
  await mongoose.disconnect()
}

checkDuplicates()
