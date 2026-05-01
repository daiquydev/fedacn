import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const DB_URI = process.env.MONGODB_URL as string;

const fixOutdoorProgressValues = async () => {
    try {
        await mongoose.connect(DB_URI);
        console.log('Connected to MongoDB');

        // Get all events
        const events = await mongoose.connection.collection('sport_events').find().toArray();
        const eventMap = new Map();
        for (const e of events) {
            eventMap.set(e._id.toString(), e);
        }

        const progresses = await mongoose.connection.collection('sport_event_progress').find({ 
            source: 'gps' 
        }).toArray();

        let updated = 0;
        for (const p of progresses) {
            const event = eventMap.get(p.eventId.toString());
            if (!event) continue;

            const targetUnit = (event.targetUnit || '').toLowerCase();
            let newValue = p.distance; // default km
            let newUnit = targetUnit || 'km';

            if (targetUnit.includes('kcal') || targetUnit.includes('calo')) {
                newValue = p.calories;
            } else if (targetUnit.includes('giờ') || targetUnit.includes('hour')) {
                if (p.time && p.time.includes('phút')) {
                    const min = parseInt(p.time.split(' ')[0]);
                    newValue = min / 60;
                }
            } else if (targetUnit.includes('phút') || targetUnit.includes('minute')) {
                if (p.time && p.time.includes('phút')) {
                    const min = parseInt(p.time.split(' ')[0]);
                    newValue = min;
                }
            } else {
                newValue = p.distance;
                newUnit = targetUnit || 'km';
            }

            if (p.value !== newValue || p.unit !== newUnit) {
                await mongoose.connection.collection('sport_event_progress').updateOne(
                    { _id: p._id },
                    { $set: { value: newValue, unit: newUnit } }
                );
                updated++;
            }
        }

        console.log(`Updated ${updated} GPS progress records to correct units!`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

fixOutdoorProgressValues();
