import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function checkDeletedEvents() {
  try {
    const mongoUrl = process.env.MONGODB_URL || process.env.MONGODB_URI;
    await mongoose.connect(mongoUrl!);
    const db = mongoose.connection.db;
    const deletedEvents = await db!.collection('sport_events').find({ isDeleted: true }).toArray();
    console.log('Deleted Events:', JSON.stringify(deletedEvents.map(e => ({ id: e._id, name: e.name })), null, 2));
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkDeletedEvents();
