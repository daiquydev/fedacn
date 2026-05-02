import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function listRecentEvents() {
  try {
    const mongoUrl = process.env.MONGODB_URL || process.env.MONGODB_URI;
    await mongoose.connect(mongoUrl!);
    const db = mongoose.connection.db;
    if (!db) {
        console.error('DB not connected');
        return;
    }
    const events = await db.collection('sport_events').find({}).sort({ _id: -1 }).limit(10).toArray();
    console.log('Recent Events:', JSON.stringify(events.map(e => ({ id: e._id, name: e.name, isDeleted: e.isDeleted })), null, 2));
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

listRecentEvents();
