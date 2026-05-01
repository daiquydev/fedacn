import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const DB_URI = process.env.MONGODB_URL as string;

// Define schemas locally to avoid any import issues if models are complex
const UserSchema = new mongoose.Schema({ email: String, avatar: String }, { collection: 'users' });
const UserModel = mongoose.models.users || mongoose.model('users', UserSchema);

const SportEventSchema = new mongoose.Schema({ startDate: Date, targetUnit: String }, { collection: 'sport_events' });
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

const seed = async () => {
    try {
        await mongoose.connect(DB_URI);
        console.log('Connected to MongoDB');

        const userEmail = 'user1@gmail.com';
        const eventIdStr = '69f46280fbe1f95a1f8a0e22';

        const user = await UserModel.findOne({ email: userEmail });
        if (!user) throw new Error('User not found');

        const event = await SportEventModel.findById(eventIdStr);
        if (!event) throw new Error('Event not found');

        // Clean up previous test data if any
        await SportEventVideoSessionModel.deleteMany({ eventId: event._id, userId: user._id });
        await SportEventProgressModel.deleteMany({ eventId: event._id, userId: user._id, source: 'video_call' });

        const startDate = new Date(event.startDate);
        const now = new Date();
        
        const days: Date[] = [];
        const iterDate = new Date(startDate);
        iterDate.setHours(15, 23, 0, 0); // ~15:23
        
        while (iterDate <= now) {
            days.push(new Date(iterDate));
            iterDate.setDate(iterDate.getDate() + 1);
        }

        // Use user avatar or a default image for proof
        const defaultImg = 'https://res.cloudinary.com/dwyz14tbd/image/upload/v1714445839/cld-sample-4.jpg';
        const proofImg = user.avatar ? user.avatar : defaultImg;

        let createdCount = 0;
        for (const day of days) {
            // "thời gian tham gia tầm 30 phút"
            const totalSeconds = 30 * 60; 
            
            // "thời gian thực tế random từ 20 tới 30 phút"
            const minActive = 20 * 60;
            const maxActive = 30 * 60;
            const activeSeconds = Math.floor(Math.random() * (maxActive - minActive + 1) + minActive);
            
            // Fetch sport category rate if we haven't already
            let kcalPerMinute = 1.5; // default fallback
            if (event.category) {
                const categoryDocs = await mongoose.connection.collection('sport_categories').find({ name: event.category }).toArray();
                if (categoryDocs.length > 0 && categoryDocs[0].kcal_per_unit > 0) {
                    kcalPerMinute = categoryDocs[0].kcal_per_unit;
                }
            }

            // Tỷ lệ nhận diện = activeSeconds / totalSeconds
            // Kcal được lấy tự động từ danh mục
            const calories = Number(((activeSeconds / 60) * kcalPerMinute).toFixed(2));

            const endedAt = new Date(day.getTime() + totalSeconds * 1000);

            const session = new SportEventVideoSessionModel({
                eventId: event._id,
                userId: user._id,
                joinedAt: day,
                endedAt: endedAt,
                activeSeconds: activeSeconds,
                totalSeconds: totalSeconds,
                caloriesBurned: calories,
                status: 'ended',
                screenshots: [proofImg]
            });

            await session.save();

            // Progress value should typically be minutes or kcals depending on targetUnit
            let value = activeSeconds / 60;
            if (event.targetUnit === 'giờ' || event.targetUnit === 'hour') {
                value = activeSeconds / 3600;
            } else if (event.targetUnit === 'kcal' || event.targetUnit === 'calo') {
                value = calories;
            }
            
            // format time string: hh:mm:ss based on activeSeconds or totalSeconds? Usually total.
            const timeString = '00:30:00';
            
            const progress = new SportEventProgressModel({
                eventId: event._id,
                userId: user._id,
                date: endedAt,
                value: value,
                unit: event.targetUnit || 'phút',
                time: timeString,
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

            createdCount++;
        }

        console.log(`Successfully created ${createdCount} video call activities for user ${userEmail} in event ${eventIdStr}`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seed();
