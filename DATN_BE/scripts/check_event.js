const mongoose = require('mongoose')
const MONGODB_URL = 'mongodb+srv://daiquy:10102003@cluster0.cxzaocf.mongodb.net/?appName=Cluster0'

mongoose.connect(MONGODB_URL).then(async () => {
  const db = mongoose.connection.db
  const eventId = new mongoose.Types.ObjectId('69aed3edc0bc684ba23f7cad')
  const userId = new mongoose.Types.ObjectId('697d97a91e44e30bb8bfa514')
  
  // Check sport_event_progress for User1
  const progressCount = await db.collection('sport_event_progress').countDocuments({ eventId, userId })
  console.log(`User1 sport_event_progress count: ${progressCount}`)

  const sample = await db.collection('sport_event_progress').findOne({ eventId, userId })
  if (sample) {
    console.log('Sample progress:', JSON.stringify({
      eventId: sample.eventId,
      userId: sample.userId,
      date: sample.date,
      value: sample.value,
      unit: sample.unit,
      source: sample.source,
      is_deleted: sample.is_deleted
    }, null, 2))
  }

  // Check activity_tracking for User1
  const actCount = await db.collection('activity_tracking').countDocuments({ eventId, userId })
  console.log(`\nUser1 activity_tracking count: ${actCount}`)

  const actSample = await db.collection('activity_tracking').findOne({ eventId, userId })
  if (actSample) {
    console.log('Sample activity:', JSON.stringify({
      eventId: actSample.eventId,
      userId: actSample.userId,
      startTime: actSample.startTime,
      totalDistance: actSample.totalDistance,
      hasGpsRoute: !!(actSample.gpsRoute && actSample.gpsRoute.length > 0),
      gpsRoutePoints: actSample.gpsRoute?.length
    }, null, 2))
  }

  // Total km for User1
  const totalAgg = await db.collection('sport_event_progress').aggregate([
    { $match: { eventId, userId, is_deleted: { $ne: true } } },
    { $group: { _id: null, total: { $sum: '$value' } } }
  ]).toArray()
  console.log(`\nTotal km for User1: ${totalAgg[0]?.total?.toFixed(2) || 0}`)

  // Check what event startDate is (as stored)
  const event = await db.collection('sport_events').findOne({ _id: eventId })
  console.log(`\nEvent startDate: ${event.startDate}`)
  
  // How many User1 activities are after event startDate?
  const afterStart = await db.collection('sport_event_progress').countDocuments({ 
    eventId, userId, 
    date: { $gte: event.startDate }
  })
  console.log(`User1 activities after event startDate: ${afterStart}`)

  mongoose.disconnect()
}).catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
