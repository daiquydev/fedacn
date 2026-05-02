import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SportEventSchema = new mongoose.Schema({
  name: String,
  isDeleted: Boolean,
  createdBy: mongoose.Schema.Types.ObjectId,
  participants_ids: [mongoose.Schema.Types.ObjectId],
}, { strict: false });

const SportEvent = mongoose.model('SportEvent', SportEventSchema, 'sportevents');

async function checkEvent() {
  try {
    const mongoUrl = process.env.MONGODB_URL || process.env.MONGODB_URI;
    if (!mongoUrl) {
        console.error('MONGODB_URL not found in .env');
        return;
    }
    await mongoose.connect(mongoUrl);
    console.log('Connected to DB');
    const eventId = '69f5b0d5569b3eed8c95fd8c';
    const event = await SportEvent.findById(eventId);
    if (!event) {
        console.log('Event not found with ID:', eventId);
    } else {
        console.log('Event Data:');
        console.dir(event.toObject(), { depth: null });
    }
    await mongoose.disconnect();
  } catch (error) {
    console.error('Connection Error:', error);
  }
}

checkEvent();
