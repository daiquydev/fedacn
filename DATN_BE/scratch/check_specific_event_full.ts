import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function checkEvent() {
  try {
    const mongoUrl = process.env.MONGODB_URL || process.env.MONGODB_URI;
    await mongoose.connect(mongoUrl!);
    const db = mongoose.connection.db;
    const event = await db!.collection('sport_events').findOne({ _id: new mongoose.Types.ObjectId('69f5b0d5569b3eed8c95fd8c') });
    console.log('Event Data:', JSON.stringify(event, null, 2));
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkEvent();
