import mongoose from 'mongoose'
import { envConfig } from '../constants/config'

async function getChallenge() {
  await mongoose.connect(envConfig.mongoURL)
  const db = mongoose.connection.db
  if (!db) {
    console.error('Database connection failed')
    return
  }
  const c = await db.collection('challenges').findOne({ _id: new mongoose.Types.ObjectId('69dbb47c9e1a6f2aafeb9927') })
  console.log(JSON.stringify(c, null, 2))
  await mongoose.disconnect()
}

getChallenge().catch(console.error)
