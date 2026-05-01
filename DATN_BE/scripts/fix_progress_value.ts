import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const DB_URI = process.env.MONGODB_URL as string;

const fixValues = async () => {
    try {
        await mongoose.connect(DB_URI);
        console.log('Connected to MongoDB');

        const eventId = new mongoose.Types.ObjectId('69f46280fbe1f95a1f8a0e22');
        const progresses = await mongoose.connection.collection('sport_event_progress').find({ 
            eventId, 
            source: 'video_call' 
        }).toArray();

        let updated = 0;
        for (const p of progresses) {
            if (p.activeSeconds) {
                // value was set to calories, we need to set it to hours (activeSeconds / 3600)
                const hours = p.activeSeconds / 3600;
                await mongoose.connection.collection('sport_event_progress').updateOne(
                    { _id: p._id },
                    { $set: { value: hours } }
                );
                updated++;
            }
        }

        console.log(`Updated ${updated} progress records to hours!`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

fixValues();
