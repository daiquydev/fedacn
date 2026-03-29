const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config({ path: 'c:/DATN/fedacn/DATN_BE/.env' });

const uri = process.env.MONGODB_URL || '';

async function run() {
  try {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    
    const user = await db.collection('users').findOne({ email: 'quy.tranquil@gmail.com' });
    
    const eventId = new mongoose.Types.ObjectId('69ab3e1a00e50d111a22e623');
    
    const activities = await db.collection('activity_tracking').find({
      userId: user._id,
      eventId: eventId
    }).toArray();
    
    const progresses = await db.collection('sport_event_progress').find({
      userId: user._id,
      eventId: eventId
    }).toArray();
    
    fs.writeFileSync('c:/DATN/fedacn/DATN_BE/output.json', JSON.stringify({
       activities: activities.map(a => ({ _id: a._id.toString(), totalDistance: a.totalDistance, totalDuration: a.totalDuration, avgSpeed: a.avgSpeed, maxSpeed: a.maxSpeed, createdAt: a.createdAt })),
       progresses: progresses.map(p => ({ _id: p._id.toString(), distance: p.distance, time: p.time, source: p.source, date: p.date }))
    }, null, 2));
    
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

run();
