import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const DB_URI = process.env.MONGODB_URL as string;

// Define schemas
const UserSchema = new mongoose.Schema({ email: String, avatar: String }, { collection: 'users' });
const UserModel = mongoose.models.users || mongoose.model('users', UserSchema);

const SportEventSchema = new mongoose.Schema({ 
    startDate: Date, 
    endDate: Date,
    targetUnit: String, 
    participants_ids: [mongoose.Schema.Types.ObjectId],
    participants: Number,
    category: String
}, { collection: 'sport_events' });
const SportEventModel = mongoose.models.sport_events || mongoose.model('sport_events', SportEventSchema);

const SportEventVideoSessionSchema = new mongoose.Schema({
    eventId: mongoose.Schema.Types.ObjectId,
    userId: mongoose.Schema.Types.ObjectId,
    joinedAt: Date,
    endedAt: Date,
    activeSeconds: Number,
    totalSeconds: Number,
    caloriesBurned: Number,
    status: String,
    screenshots: [String],
    progressId: mongoose.Schema.Types.ObjectId,
}, { collection: 'sport_event_video_sessions', timestamps: true });
const SportEventVideoSessionModel = mongoose.models.sport_event_video_sessions || mongoose.model('sport_event_video_sessions', SportEventVideoSessionSchema);

const SportEventProgressSchema = new mongoose.Schema({
    eventId: mongoose.Schema.Types.ObjectId,
    userId: mongoose.Schema.Types.ObjectId,
    date: Date,
    value: Number,
    unit: String,
    time: String,
    calories: Number,
    proofImage: String,
    source: String,
    sessionId: mongoose.Schema.Types.ObjectId,
    activeSeconds: Number,
    notes: String,
}, { collection: 'sport_event_progress', timestamps: true });
const SportEventProgressModel = mongoose.models.sport_event_progress || mongoose.model('sport_event_progress', SportEventProgressSchema);

const PROOF_IMAGES = [
  "https://res.cloudinary.com/da9cghklv/image/upload/v1777625419/webcam_screenshots/entzfvvuwufsm8wkpc9d.png",
  "https://res.cloudinary.com/da9cghklv/image/upload/v1777625422/webcam_screenshots/botrhszjn9wraccvmaxt.png",
  "https://res.cloudinary.com/da9cghklv/image/upload/v1777625420/webcam_screenshots/nyjm3oyhdlxxeqgt7fyh.png",
  "https://res.cloudinary.com/da9cghklv/image/upload/v1777625423/webcam_screenshots/ysiyisofnqpaj4qgsnxo.png"
];

const seedMass = async () => {
    try {
        await mongoose.connect(DB_URI);
        console.log('Connected to MongoDB');

        const eventIdStr = '69f46280fbe1f95a1f8a0e22'; // Thiền tịnh tâm
        const event = await SportEventModel.findById(eventIdStr);
        if (!event) throw new Error('Event not found');

        // Fetch all active users (exclude user1 to not overwrite their existing records)
        const allUsers = await UserModel.find({ isDeleted: { $ne: true }, email: { $ne: 'user1@gmail.com' } });
        if (allUsers.length === 0) {
            console.log('No users found!');
            process.exit(1);
        }

        // Shuffle and pick 70%
        const numToPick = Math.max(1, Math.floor(allUsers.length * 0.7));
        const shuffledUsers = allUsers.sort(() => 0.5 - Math.random());
        const selectedUsers = shuffledUsers.slice(0, numToPick);
        console.log(`Selected ${selectedUsers.length} users out of ${allUsers.length} (70%)`);

        // Update event participants list
        const existingParticipantIds = (event.participants_ids || []).map((id: any) => String(id));
        const newParticipantIds = selectedUsers.map((u: any) => u._id).filter((id: any) => !existingParticipantIds.includes(String(id)));

        if (newParticipantIds.length > 0) {
            await SportEventModel.updateOne(
                { _id: event._id },
                {
                    $addToSet: { participants_ids: { $each: newParticipantIds } },
                    $inc: { participants: newParticipantIds.length }
                }
            );
            console.log(`Added ${newParticipantIds.length} new participants to the event.`);
        }

        // Determine rate
        let kcalPerMinute = 1.5; // default for Thiền
        if (event.category) {
            const categoryDocs = await mongoose.connection.collection('sport_categories').find({ name: event.category }).toArray();
            if (categoryDocs.length > 0 && categoryDocs[0].kcal_per_unit > 0) {
                kcalPerMinute = categoryDocs[0].kcal_per_unit;
            }
        }
        console.log(`Using rate: ${kcalPerMinute} kcal/phút`);

        // Generate dates
        const startDate = new Date(event.startDate);
        const now = new Date();
        const endDate = new Date(Math.min(now.getTime(), new Date(event.endDate || now).getTime()));

        const days: Date[] = [];
        const iterDate = new Date(startDate);
        iterDate.setHours(0, 0, 0, 0); // start of day
        while (iterDate <= endDate) {
            days.push(new Date(iterDate));
            iterDate.setDate(iterDate.getDate() + 1);
        }

        let totalSessionsCreated = 0;

        for (const user of selectedUsers) {
            // Clean up previous mass test data for this user to avoid duplicates
            await SportEventVideoSessionModel.deleteMany({ eventId: event._id, userId: user._id });
            await SportEventProgressModel.deleteMany({ eventId: event._id, userId: user._id, source: 'video_call' });

            let userSessionCount = 0;

            for (const day of days) {
                // Give user a 60% chance to participate on any given day
                if (Math.random() > 0.6) continue;

                // Random time between 18:00 and 22:00
                const hour = Math.floor(Math.random() * (22 - 18 + 1)) + 18;
                const minute = Math.floor(Math.random() * 60);
                const joinTime = new Date(day);
                joinTime.setHours(hour, minute, 0, 0);
                if (joinTime > now) continue;

                const totalSeconds = 30 * 60; // 30 mins standard session
                const minActive = 20 * 60;
                const maxActive = 30 * 60;
                const activeSeconds = Math.floor(Math.random() * (maxActive - minActive + 1) + minActive);
                
                const calories = Number(((activeSeconds / 60) * kcalPerMinute).toFixed(2));
                const endedAt = new Date(joinTime.getTime() + totalSeconds * 1000);

                const proofImg = PROOF_IMAGES[Math.floor(Math.random() * PROOF_IMAGES.length)];

                const session = new SportEventVideoSessionModel({
                    eventId: event._id,
                    userId: user._id,
                    joinedAt: joinTime,
                    endedAt: endedAt,
                    activeSeconds: activeSeconds,
                    totalSeconds: totalSeconds,
                    caloriesBurned: calories,
                    status: 'ended',
                    screenshots: [proofImg]
                });
                await session.save();

                let value = activeSeconds / 60;
                if (event.targetUnit === 'giờ' || event.targetUnit === 'hour') {
                    value = activeSeconds / 3600;
                } else if (event.targetUnit === 'kcal' || event.targetUnit === 'calo') {
                    value = calories;
                }
                
                const progress = new SportEventProgressModel({
                    eventId: event._id,
                    userId: user._id,
                    date: endedAt,
                    value: value,
                    unit: event.targetUnit || 'phút',
                    time: '00:30:00',
                    calories: calories,
                    proofImage: proofImg,
                    source: 'video_call',
                    sessionId: session._id,
                    activeSeconds: activeSeconds,
                    notes: 'AI Video Call Verification (Thiền)'
                });
                await progress.save();

                session.progressId = progress._id;
                await session.save();

                userSessionCount++;
                totalSessionsCreated++;
            }
            console.log(`Generated ${userSessionCount} activities for user: ${user.email}`);
        }

        console.log(`\n🎉 Success! Generated a total of ${totalSessionsCreated} activities across ${selectedUsers.length} users.`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedMass();
