const mongoose = require('mongoose')
const MONGODB_URL = 'mongodb+srv://daiquy:10102003@cluster0.cxzaocf.mongodb.net/?appName=Cluster0'

mongoose.connect(MONGODB_URL).then(async () => {
  const db = mongoose.connection.db
  const eventId = new mongoose.Types.ObjectId('69d7bc52841f30b2f9d06378')

  const sessions = await db.collection('sport_event_sessions').find({ eventId }).toArray()
  console.log('Sessions count:', sessions.length)
  if (sessions.length > 0) console.log('First session:', JSON.stringify(sessions[0], null, 2))

  const videoSessions = await db.collection('sport_event_video_sessions').find({ eventId, is_deleted: { $ne: true } }).toArray()
  console.log('Video sessions count:', videoSessions.length)
  if (videoSessions.length > 0) console.log('Sample video session:', JSON.stringify(videoSessions[0], null, 2))

  const progress = await db.collection('sport_event_progress').find({ eventId, is_deleted: { $ne: true } }).toArray()
  console.log('Progress records count:', progress.length)

  // List participants
  const event = await db.collection('sport_events').findOne({ _id: eventId })
  console.log('Participants:', event.participants_ids.length)

  process.exit(0)
}).catch(e => { console.error(e); process.exit(1) })
