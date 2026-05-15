import mongoose from 'mongoose'
import { envConfig } from '../constants/config'
import SportEventModel from '../models/schemas/sportEvent.schema'

async function countOutdoorEvents() {
  await mongoose.connect(envConfig.mongoURL)
  const events = await SportEventModel.find({ eventType: 'Ngoài trời' })
  console.log(`Found ${events.length} outdoor events:`)
  events.forEach(e => {
    console.log(`- ID: ${e._id}, Name: ${e.name}, Location: ${e.location}, Activity: ${e.category}`)
  })
  await mongoose.disconnect()
}

countOutdoorEvents().catch(console.error)
