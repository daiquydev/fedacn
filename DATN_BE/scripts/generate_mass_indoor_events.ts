import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const DB_URI = process.env.MONGODB_URL as string;

// Define schemas
const UserSchema = new mongoose.Schema({ email: String, avatar: String }, { collection: 'users' });
const UserModel = mongoose.models.users || mongoose.model('users', UserSchema);

const SportEventSchema = new mongoose.Schema({ 
    name: String,
    description: String,
    eventType: String,
    location: String,
    startDate: Date, 
    endDate: Date,
    targetValue: Number,
    targetUnit: String, 
    maxParticipants: Number,
    participants_ids: [mongoose.Schema.Types.ObjectId],
    participants: Number,
    category: String,
    createdBy: mongoose.Schema.Types.ObjectId,
    image: String,
    status: String,
    isDeleted: Boolean
}, { collection: 'sport_events', timestamps: true });
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

const NEW_EVENTS = [
  {
    name: "Yoga buổi sáng",
    category: "Yoga",
    targetUnit: "giờ",
    perPersonTarget: 10,
    image: "https://res.cloudinary.com/da9cghklv/image/upload/v1711200000/sport_events/yoga.jpg"
  },
  {
    name: "Thử thách Zumba",
    category: "Zumba",
    targetUnit: "giờ",
    perPersonTarget: 8,
    image: "https://res.cloudinary.com/da9cghklv/image/upload/v1711200000/sport_events/zumba.jpg"
  },
  {
    name: "Tập Gym tại nhà",
    category: "Thể hình / Gym",
    targetUnit: "giờ",
    perPersonTarget: 15,
    image: "https://res.cloudinary.com/da9cghklv/image/upload/v1711200000/sport_events/gym.jpg"
  },
  {
    name: "HIIT Đốt mỡ thần tốc",
    category: "HIIT (Cường độ cao)",
    targetUnit: "kcal",
    perPersonTarget: 3000,
    image: "https://res.cloudinary.com/da9cghklv/image/upload/v1711200000/sport_events/hiit.jpg"
  }
];

const seedMass = async () => {
    try {
        await mongoose.connect(DB_URI);
        console.log('Connected to MongoDB');

        const creatorEmails = ['user1@gmail.com', 'quy.tranquil@gmail.com', 'phamquocdung04@gmail.com'];
        const creators = await UserModel.find({ email: { $in: creatorEmails } });
        if (creators.length === 0) throw new Error('No creators found');

        // Fetch all active users to participate
        const allUsers = await UserModel.find({ isDeleted: { $ne: true } });
        if (allUsers.length === 0) throw new Error('No users found!');

        const now = new Date();
        const start = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000); // 15 days ago
        const end = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000); // 15 days later

        for (const evDef of NEW_EVENTS) {
            console.log(`\n--- Creating Event: ${evDef.name} ---`);
            const creator = creators[Math.floor(Math.random() * creators.length)];
            
            // Shuffle and pick 70% of users
            const numToPick = Math.max(1, Math.floor(allUsers.length * 0.7));
            const shuffledUsers = [...allUsers].sort(() => 0.5 - Math.random());
            const selectedUsers = shuffledUsers.slice(0, numToPick);
            const selectedUserIds = selectedUsers.map(u => u._id);

            // Add creator to participants if not already
            if (!selectedUserIds.find(id => id.toString() === creator._id.toString())) {
                selectedUsers.push(creator);
                selectedUserIds.push(creator._id);
            }

            const maxParticipants = 30;
            const targetValue = evDef.perPersonTarget * selectedUserIds.length;

            const event = new SportEventModel({
                name: evDef.name,
                description: `Sự kiện ${evDef.category} tự động được tạo. Mọi người cùng tập luyện nhé!`,
                eventType: 'Trong nhà',
                location: 'https://meet.google.com/abc-defg-hij',
                startDate: start,
                endDate: end,
                targetValue: targetValue,
                targetUnit: evDef.targetUnit,
                maxParticipants: maxParticipants,
                participants_ids: selectedUserIds,
                participants: selectedUserIds.length,
                category: evDef.category,
                createdBy: creator._id,
                image: evDef.image,
                status: 'published',
                isDeleted: false
            });
            await event.save();
            console.log(`Event created with ID: ${event._id}`);

            // Determine rate
            let kcalPerMinute = 5; // fallback
            const categoryDocs = await mongoose.connection.collection('sport_categories').find({ name: event.category, isDeleted: { $ne: true } }).toArray();
            if (categoryDocs.length > 0 && categoryDocs[0].kcal_per_unit > 0) {
                kcalPerMinute = categoryDocs[0].kcal_per_unit;
            }
            console.log(`Using rate: ${kcalPerMinute} kcal/phút`);

            // Generate dates from start to now
            const days: Date[] = [];
            const iterDate = new Date(start);
            iterDate.setHours(0, 0, 0, 0);
            while (iterDate <= now) {
                days.push(new Date(iterDate));
                iterDate.setDate(iterDate.getDate() + 1);
            }

            let totalSessionsCreated = 0;

            for (const user of selectedUsers) {
                let userSessionCount = 0;

                for (const day of days) {
                    // Give user a 40% chance to participate on any given day
                    if (Math.random() > 0.4) continue;

                    const hour = Math.floor(Math.random() * (22 - 17 + 1)) + 17;
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
                        notes: `AI Video Call Verification (${event.category})`
                    });
                    await progress.save();

                    session.progressId = progress._id;
                    await session.save();

                    userSessionCount++;
                    totalSessionsCreated++;
                }
            }
            console.log(`🎉 Generated ${totalSessionsCreated} activities for ${selectedUsers.length} users in event ${event.name}`);
        }

        console.log(`\n🎉 All events and activities generated successfully!`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedMass();
