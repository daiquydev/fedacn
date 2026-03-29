const mongoose = require('mongoose');
require('dotenv').config({ path: 'c:/DATN/fedacn/DATN_BE/.env' });

const uri = process.env.MONGODB_URL || '';

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const proofImages = [
  "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=500",
  "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=500",
  "https://images.unsplash.com/photo-1599901860904-17e086208be1?q=80&w=500",
  "https://images.unsplash.com/photo-1588286840104-a690bfdfbc74?q=80&w=500"
];

async function generateData() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const eventIdParams = new mongoose.Types.ObjectId('69ad37c08530ab567e585987');

  const event = await db.collection('sport_events').findOne({ _id: eventIdParams });
  if (!event) {
    console.error('Event not found');
    process.exit(1);
  }

  let category;
  if (mongoose.Types.ObjectId.isValid(event.category)) {
      category = await db.collection('sport_categories').findOne({ _id: new mongoose.Types.ObjectId(event.category) });
  } else {
      category = await db.collection('sport_categories').findOne({ name: event.category });
  }

  if (!category) {
    console.error('Category not found');
    process.exit(1);
  }

  const kcalPerMin = category.kcal_per_unit || 4;
  const participants = event.participants_ids || [];

  if (participants.length === 0) {
    console.warn('No participants to generate progress for.');
    process.exit(0);
  }

  // 2026-01-02 to now (assumed 2026-03-29 based on system prompt)
  const startDate = new Date('2026-01-02T00:00:00Z');
  const endDate = new Date(); // current date
  
  let currentDateObj = new Date(startDate);
  
  let videoSessionsToInsert = [];
  let progressesToInsert = [];

  while (currentDateObj <= endDate) {
    // For each participant, insert 2 sessions / day
    for (const userId of participants) {
      for (let sessionIndex = 1; sessionIndex <= 2; sessionIndex++) {
        // distribute the sessions arbitrarily, say 8 AM and 5 PM
        const hour = sessionIndex === 1 ? 8 : 17;
        const joinedAt = new Date(currentDateObj);
        joinedAt.setUTCHours(hour, 0, 0, 0);

        if (joinedAt > endDate) continue; // Don't generate for future if partial day

        const totalSeconds = 1800; // 30 minutes
        const activeSecondsPercentage = getRandomInt(80, 100);
        const activeSeconds = Math.floor(totalSeconds * (activeSecondsPercentage / 100));

        // Active minutes for calorie calculation
        const activeMinutes = activeSeconds / 60;
        const caloriesBurned = Math.round(activeMinutes * kcalPerMin);

        const endedAt = new Date(joinedAt);
        endedAt.setUTCMinutes(endedAt.getUTCMinutes() + 30);
        
        const randomImage = proofImages[getRandomInt(0, proofImages.length - 1)];

        const videoSessionId = new mongoose.Types.ObjectId();
        const progressId = new mongoose.Types.ObjectId();

        const videoSession = {
          _id: videoSessionId,
          eventId: eventIdParams,
          sessionId: null,
          userId: userId,
          joinedAt: joinedAt,
          endedAt: endedAt,
          activeSeconds: activeSeconds,
          totalSeconds: totalSeconds,
          caloriesBurned: caloriesBurned,
          status: 'ended',
          screenshots: [randomImage],
          progressId: progressId,
          is_deleted: false,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const progress = {
          _id: progressId,
          eventId: eventIdParams,
          userId: userId,
          date: joinedAt,
          value: activeSeconds,
          unit: 'giây',
          distance: 0,
          time: '30p 00s',
          calories: caloriesBurned,
          proofImage: randomImage,
          notes: 'Auto generated AI recognition session',
          source: 'video_call',
          sessionId: null, // No exact session defined
          activeSeconds: activeSeconds,
          is_deleted: false,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        videoSessionsToInsert.push(videoSession);
        progressesToInsert.push(progress);
      }
    }
    // advance 1 day
    currentDateObj.setUTCDate(currentDateObj.getUTCDate() + 1);
  }

  console.log(`Prepared ${videoSessionsToInsert.length} video sessions and progress records to insert.`);
  
  if (videoSessionsToInsert.length > 0) {
      await db.collection('sport_event_video_sessions').insertMany(videoSessionsToInsert);
      await db.collection('sport_event_progress').insertMany(progressesToInsert);
      console.log('Inserted successfully.');
  }

  process.exit(0);
}

generateData().catch((err) => {
  console.error(err);
  process.exit(1);
});
