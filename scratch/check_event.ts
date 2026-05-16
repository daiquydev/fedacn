import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'

// Try to find .env in DATN_BE
dotenv.config({ path: path.join(__dirname, '../../DATN_BE/.env') })

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/fedacn'
const EVENT_ID = '69f45e77977df80dd23b0591'

async function checkEvent() {
  try {
    await mongoose.connect(MONGO_URI)
    console.log('Connected to MongoDB')

    const db = mongoose.connection.db
    const event = await db.collection('sport_events').findOne({ _id: new mongoose.Types.ObjectId(EVENT_ID) })

    if (!event) {
      console.log('Event not found')
      return
    }

    console.log('Event found:', JSON.stringify(event, null, 2))
    
    if (event.eventType === 'Trong nhà') {
        const sessions = await db.collection('sport_event_sessions').find({ eventId: event._id }).toArray()
        console.log('Sessions count:', sessions.length)
        if (sessions.length > 0) {
            console.log('Sample session:', JSON.stringify(sessions[0], null, 2))
        }
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await mongoose.disconnect()
  }
}

checkEvent()
