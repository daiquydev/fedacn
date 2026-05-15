import mongoose from 'mongoose'
import moment from 'moment'
import { envConfig } from '../constants/config'
import ActivityTrackingModel from '../models/schemas/activityTracking.schema'
import ChallengeModel from '../models/schemas/challenge.schema'
import ChallengeParticipantModel from '../models/schemas/challengeParticipant.schema'
import ChallengeProgressModel from '../models/schemas/challengeProgress.schema'
import UserModel from '../models/schemas/user.schema'
import fs from 'fs'
import path from 'path'

const TARGET_EMAILS = [
  'phangiabao10@gmail.com',
  'dominhnhat09@gmail.com',
  'vukhanhly08@gmail.com',
  'buithanhlong07@gmail.com',
  'dangtuankiet06@gmail.com',
  'hoanggiahan05@gmail.com',
  'phamquocdung04@gmail.com',
  'leminhchau03@gmail.com',
  'tranthibinh02@gmail.com',
  'nguyenvanan01@gmail.com',
  'quy.tranquil@hcmut.edu.vn',
  'quy.tranquil@gmail.com',
  'user2@gmail.com',
  'user1@gmail.com'
];

const CONFIG: any = {
  'Đi bộ đường dài': { avgSpeed: 1.5, speedVar: 0.4, calPerKm: 55 },
  'Đua xe': { avgSpeed: 7.0, speedVar: 2.0, calPerKm: 35 },
  'Chạy bộ': { avgSpeed: 2.8, speedVar: 1.0, calPerKm: 65 },
  'default': { avgSpeed: 2.5, speedVar: 1.0, calPerKm: 60 }
}

const EVIDENCE_PHOTOS = [
  "https://res.cloudinary.com/da9cghklv/image/upload/v1778676758/video-call-screenshots/fwapltlhmxu8asynpqne.jpg",
  "https://res.cloudinary.com/da9cghklv/image/upload/v1778676767/video-call-screenshots/fw1ahyu6n779wrnofluz.jpg",
  "https://res.cloudinary.com/da9cghklv/image/upload/v1778676778/video-call-screenshots/lgqdlk260yawjojlo0vz.jpg",
  "https://res.cloudinary.com/da9cghklv/image/upload/v1778676790/video-call-screenshots/gy1tpdsjhr86qmuwn5cv.jpg",
  "https://res.cloudinary.com/da9cghklv/image/upload/v1778676799/video-call-screenshots/sl4kj6wljdyiioqdhv09.jpg"
];

function haversineDistM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // metres
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function generateRealisticRoute(masterRoute: any[], startIdx: number, targetDistanceM: number, durationSecs: number, speed: number, startTimeMs: number) {
  const gpsRoute = [];
  let currentDist = 0;
  let currIdx = startIdx;

  gpsRoute.push({
    lat: Number(masterRoute[currIdx].lat.toFixed(6)),
    lng: Number(masterRoute[currIdx].lng.toFixed(6)),
    timestamp: startTimeMs,
    speed: Number(speed.toFixed(2))
  });

  while (currentDist < targetDistanceM) {
    const nextIdx = (currIdx + 1) % masterRoute.length;
    const p1 = masterRoute[currIdx];
    const p2 = masterRoute[nextIdx];

    const segmentDist = haversineDistM(p1.lat, p1.lng, p2.lat, p2.lng);
    if (segmentDist === 0) { currIdx = nextIdx; continue; }

    if (currentDist + segmentDist > targetDistanceM) {
      const remaining = targetDistanceM - currentDist;
      const ratio = remaining / segmentDist;
      const finalLat = p1.lat + (p2.lat - p1.lat) * ratio;
      const finalLng = p1.lng + (p2.lng - p1.lng) * ratio;

      gpsRoute.push({
        lat: Number(finalLat.toFixed(6)),
        lng: Number(finalLng.toFixed(6)),
        timestamp: startTimeMs + durationSecs * 1000,
        speed: Number(speed.toFixed(2))
      });
      break;
    } else {
      currentDist += segmentDist;
      currIdx = nextIdx;

      const timeRatio = currentDist / targetDistanceM;
      gpsRoute.push({
        lat: Number(p2.lat.toFixed(6)),
        lng: Number(p2.lng.toFixed(6)),
        timestamp: startTimeMs + Math.round(timeRatio * durationSecs * 1000),
        speed: Number((speed * (0.8 + Math.random() * 0.4)).toFixed(2))
      });
    }
  }

  if (gpsRoute.length > 200) {
    const sampled = [];
    const step = Math.ceil(gpsRoute.length / 100);
    for (let i = 0; i < gpsRoute.length; i += step) { sampled.push(gpsRoute[i]); }
    if (sampled[sampled.length - 1] !== gpsRoute[gpsRoute.length - 1]) { sampled.push(gpsRoute[gpsRoute.length - 1]); }
    return { route: sampled, endIdx: currIdx };
  }

  return { route: gpsRoute, endIdx: currIdx };
}

async function run() {
  await mongoose.connect(envConfig.mongoURL);
  console.log('Connected to MongoDB');

  const users = await UserModel.find({ email: { $in: TARGET_EMAILS } });
  console.log(`Found ${users.length} target users.`);
  const userIds = users.map(u => u._id);

  const masterRoutePath = path.join(__dirname, 'master_route_thong_nhat.json');
  const masterRoute = JSON.parse(fs.readFileSync(masterRoutePath, 'utf8'));

  const challenges = await ChallengeModel.find({});
  console.log(`Found ${challenges.length} total challenges.`);

  // Step 1: Ensure all 14 users join EVERY challenge and Update participants_count
  for (const challenge of challenges) {
    console.log(`Ensuring participation for: ${challenge.title}`);
    for (const user of users) {
      const existing = await ChallengeParticipantModel.findOne({ challenge_id: challenge._id, user_id: user._id });
      if (!existing) {
        await ChallengeParticipantModel.create({
          challenge_id: challenge._id,
          user_id: user._id,
          goal_value: challenge.goal_value,
          joined_at: challenge.start_date,
          status: 'in_progress'
        });
      }
    }
    const count = await ChallengeParticipantModel.countDocuments({ challenge_id: challenge._id });
    await ChallengeModel.updateOne({ _id: challenge._id }, { participants_count: count });
  }

  // Step 2: Generate data for all challenges
  const today = moment();
  
  for (const challenge of challenges) {
    console.log(`\n--- Generating progress for: ${challenge.title} (${challenge.challenge_type}) ---`);
    
    const participants = await ChallengeParticipantModel.find({
      challenge_id: challenge._id,
      user_id: { $in: userIds }
    });

    const start = moment(challenge.start_date);
    const end = moment(challenge.end_date);
    const limitDate = today.isBefore(end) ? today : end;

    const challengeDurationDays = Math.max(1, end.diff(start, 'days') + 1);
    let dailyTargetValue = challenge.goal_value;
    if (challenge.goal_type && challenge.goal_type.startsWith('total_')) {
      dailyTargetValue = challenge.goal_value / challengeDurationDays;
    }

    for (const participant of participants) {
      // Clear previous progress
      await ChallengeProgressModel.deleteMany({ challenge_id: challenge._id, user_id: participant.user_id });
      if (challenge.challenge_type === 'outdoor_activity') {
        await ActivityTrackingModel.deleteMany({ challengeId: challenge._id, userId: participant.user_id });
      }

      let totalValue = 0;
      let totalDistanceKm = 0;
      let totalCalories = 0;
      const activeDays = new Set<string>();
      const completedDays = new Set<string>();
      let currentDate = moment(start);
      let lastRouteIdx = Math.floor(Math.random() * masterRoute.length);

      while (currentDate.isSameOrBefore(limitDate)) {
        const dateStr = currentDate.format('YYYY-MM-DD');
        activeDays.add(dateStr);
        let dayValue = 0;

        if (challenge.challenge_type === 'outdoor_activity') {
          const config = CONFIG[challenge.category] || CONFIG['default'];
          let targetDistDaily = challenge.goal_unit.toLowerCase() === 'km' ? dailyTargetValue : dailyTargetValue / config.calPerKm;
          
          const numSessions = Math.floor(Math.random() * 2) + 1;
          for (let s = 0; s < numSessions; s++) {
            const startTime = currentDate.clone().hour(6 + Math.floor(Math.random() * 12)).minute(Math.floor(Math.random() * 60));
            const sessionDistKmRaw = (targetDistDaily / numSessions) * (1.0 + Math.random() * 0.05);
            const speed = config.avgSpeed + (Math.random() - 0.5) * config.speedVar;
            const sessionKm = Number(sessionDistKmRaw.toFixed(2));
            const kcal = Number((sessionKm * config.calPerKm).toFixed(2));
            const duration = Math.round((sessionKm * 1000) / speed);
            const { route, endIdx } = generateRealisticRoute(masterRoute, lastRouteIdx, sessionKm * 1000, duration, speed, startTime.valueOf());
            lastRouteIdx = endIdx;

            const activity = await ActivityTrackingModel.create({
              challengeId: challenge._id, userId: participant.user_id,
              activityType: challenge.category || 'Ngoài trời', status: 'completed',
              startTime: startTime.toDate(), endTime: moment(startTime).add(duration, 'seconds').toDate(),
              totalDuration: Number((duration / 60).toFixed(2)), totalDistance: Number((sessionKm * 1000).toFixed(2)),
              avgSpeed: Number(speed.toFixed(2)), calories: kcal, gpsRoute: route, source: 'app'
            });

            const val = (challenge.goal_unit.toLowerCase() === 'km') ? sessionKm : kcal;
            await ChallengeProgressModel.create({
              challenge_id: challenge._id, user_id: participant.user_id, date: startTime.toDate(),
              challenge_type: 'outdoor_activity', value: Number(val.toFixed(2)), unit: challenge.goal_unit,
              distance: sessionKm, duration_minutes: Number((duration / 60).toFixed(2)),
              avg_speed: Number(speed.toFixed(2)), calories: kcal, source: 'gps_tracking', activity_id: activity._id
            });
            dayValue += val;
            totalDistanceKm = Number((totalDistanceKm + sessionKm).toFixed(2));
            totalCalories = Number((totalCalories + kcal).toFixed(2));
          }
        } 
        else if (challenge.challenge_type === 'nutrition') {
          // Log 3 meals per day
          for (let m = 0; m < 3; m++) {
            const mealTime = currentDate.clone().hour(7 + m * 5).minute(Math.floor(Math.random() * 60));
            await ChallengeProgressModel.create({
              challenge_id: challenge._id, user_id: participant.user_id, date: mealTime.toDate(),
              challenge_type: 'nutrition', value: 1, unit: 'bữa ăn',
              food_name: m === 0 ? 'Bữa sáng lành mạnh' : (m === 1 ? 'Bữa trưa dinh dưỡng' : 'Bữa tối Eat Clean'),
              proof_image: EVIDENCE_PHOTOS[Math.floor(Math.random() * EVIDENCE_PHOTOS.length)],
              ai_review_valid: true, source: 'photo_checkin'
            });
            dayValue += 1;
          }
        }
        else if (challenge.challenge_type === 'fitness') {
          // Log exercise sessions
          const workoutTime = currentDate.clone().hour(17 + Math.floor(Math.random() * 4));
          const exercisesCount = challenge.exercises?.length || 5;
          await ChallengeProgressModel.create({
            challenge_id: challenge._id, user_id: participant.user_id, date: workoutTime.toDate(),
            challenge_type: 'fitness', value: exercisesCount, unit: 'bài tập',
            exercises_count: exercisesCount,
            completed_exercises: (challenge.exercises || []).map((ex: any) => ({
              exercise_id: ex.exercise_id, exercise_name: ex.exercise_name, completed: true
            })),
            source: 'workout_session'
          });
          dayValue += exercisesCount;
        }

        if (dayValue >= dailyTargetValue * 0.95) { completedDays.add(dateStr); }
        totalValue += dayValue;
        currentDate.add(1, 'day');
      }

      // Final update for participant
      let streak = 0;
      let checkDate = moment(limitDate);
      const completedSet = new Set(Array.from(completedDays));
      while (completedSet.has(checkDate.format('YYYY-MM-DD'))) { streak++; checkDate.subtract(1, 'day'); }

      let finalProgressValue = totalValue;
      if (challenge.goal_type === 'daily_km' || challenge.goal_type === 'daily_calories' || challenge.goal_type === 'meals_logged_daily') {
        finalProgressValue = completedDays.size;
      }

      const isCompleted = finalProgressValue >= participant.goal_value;
      await ChallengeParticipantModel.updateOne(
        { _id: participant._id },
        {
          $set: {
            current_value: Number(finalProgressValue.toFixed(2)),
            active_days: Array.from(activeDays),
            completed_days: Array.from(completedDays),
            streak_count: streak,
            last_activity_at: activeDays.size > 0 ? moment(Array.from(activeDays).pop()).toDate() : null,
            status: isCompleted ? 'completed' : 'in_progress',
            is_completed: isCompleted
          }
        }
      );
    }
  }

  console.log('\nAll challenges updated with participation and progress data!');
  await mongoose.disconnect();
}

run().catch(console.error);
