import mongoose from 'mongoose'
import { envConfig } from '../constants/config'

async function checkCollections() {
  await mongoose.connect(envConfig.mongoURL)
  const db = mongoose.connection.db
  if (!db) {
    console.error('DB not connected')
    process.exit(1)
  }

  const collections = await db.listCollections().toArray()
  const names = collections.map(c => c.name)
  console.log('All collections:', names)

  const challengeRelated = names.filter(n => 
    n.includes('challenge') || 
    n.includes('training') || 
    n.includes('sport_event')
  )

  console.log('\nCounts for related collections:')
  for (const name of challengeRelated) {
    const count = await db.collection(name).countDocuments()
    console.log(`- ${name}: ${count}`)
  }

  await mongoose.disconnect()
}

checkCollections().catch(console.error)
