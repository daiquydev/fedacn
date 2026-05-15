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

    if (segmentDist === 0) {
      currIdx = nextIdx;
      continue;
    }

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

  // Downsample if too many points to avoid MongoDB document size issues
  if (gpsRoute.length > 200) {
    const sampled = [];
    const step = Math.ceil(gpsRoute.length / 100);
    for (let i = 0; i < gpsRoute.length; i += step) {
      sampled.push(gpsRoute[i]);
    }
    if (sampled[sampled.length - 1] !== gpsRoute[gpsRoute.length - 1]) {
      sampled.push(gpsRoute[gpsRoute.length - 1]);
    }
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

  // Step 1: Ensure all 14 users join EVERY challenge
  for (const challenge of challenges) {
    console.log(`Ensuring participation for challenge: ${challenge.title}`);
    for (const user of users) {
      const existing = await ChallengeParticipantModel.findOne({
        challenge_id: challenge._id,
        user_id: user._id
      });

      if (!existing) {
        await ChallengeParticipantModel.create({
          challenge_id: challenge._id,
          user_id: user._id,
          goal_value: challenge.goal_value,
          joined_at: challenge.start_date,
          status: 'in_progress'
        });
        console.log(`  - User ${user.email} joined challenge.`);
      }
    }
  }

  // Step 2: Generate data specifically for outdoor challenges
  const outdoorChallenges = await ChallengeModel.find({ challenge_type: 'outdoor_activity' });
  console.log(`\nProcessing ${outdoorChallenges.length} outdoor challenges for data generation.`);

  for (const challenge of outdoorChallenges) {
    console.log(`\n--- Outdoor Challenge: ${challenge.title} (${challenge.category}) ---`);

    const participants = await ChallengeParticipantModel.find({
      challenge_id: challenge._id,
      user_id: { $in: userIds }
    });

    if (participants.length === 0) {
      console.log(`No target participants found in this challenge. Skipping.`);
      continue;
    }

    const config = CONFIG[challenge.category] || CONFIG['default'];
    const challengeDurationDays = Math.max(1, moment(challenge.end_date).diff(moment(challenge.start_date), 'days') + 1);

    let effectiveGoalValue = challenge.goal_value;
    if (challenge.goal_type && challenge.goal_type.startsWith('total_')) {
      effectiveGoalValue = challenge.goal_value / challengeDurationDays;
    }

    let targetDistanceKmDaily = 0;
    let targetCaloriesDaily = 0;

    const unit = challenge.goal_unit.toLowerCase();
    if (unit === 'kcal' || unit === 'calo' || unit === 'calories') {
      targetCaloriesDaily = effectiveGoalValue;
      targetDistanceKmDaily = targetCaloriesDaily / config.calPerKm;
    } else if (unit === 'km') {
      targetDistanceKmDaily = effectiveGoalValue;
      targetCaloriesDaily = targetDistanceKmDaily * config.calPerKm;
    } else {
      targetDistanceKmDaily = effectiveGoalValue;
      targetCaloriesDaily = targetDistanceKmDaily * config.calPerKm;
    }

    console.log(`Daily Targets - Distance: ${targetDistanceKmDaily.toFixed(2)} km, Calories: ${targetCaloriesDaily.toFixed(2)} kcal`);

    const start = moment(challenge.start_date);
    const end = moment(challenge.end_date);
    const today = moment();
    const limitDate = today.isBefore(end) ? today : end;

    for (const participant of participants) {
      const user = users.find(u => u._id.toString() === participant.user_id.toString());
      console.log(`Processing user: ${user?.email}`);

      // Clear previous
      await ChallengeProgressModel.deleteMany({ challenge_id: challenge._id, user_id: participant.user_id });
      await ActivityTrackingModel.deleteMany({ challengeId: challenge._id, userId: participant.user_id });

      let totalDistanceKm = 0;
      let totalCalories = 0;
      const activeDays = new Set<string>();
      const completedDays = new Set<string>();
      let currentDate = moment(start);

      // We maintain a running index to make routes continuous across days
      let lastRouteIdx = Math.floor(Math.random() * masterRoute.length);

      while (currentDate.isSameOrBefore(limitDate)) {
        const dateStr = currentDate.format('YYYY-MM-DD');

        // Target users will complete their goals every day! (100% adherence up to limitDate)
        activeDays.add(dateStr);

        const numSessions = Math.floor(Math.random() * 2) + 1; // 1 or 2 sessions
        let dayTotalKm = 0;
        let dayTotalKcal = 0;

        for (let s = 0; s < numSessions; s++) {
          const startTime = currentDate.clone().hour(6 + Math.floor(Math.random() * 12)).minute(Math.floor(Math.random() * 60));

          // Each session covers a fraction of the daily target + small random surplus
          const sessionTargetKm = (targetDistanceKmDaily / numSessions) * (1.0 + Math.random() * 0.05);
          const distM = sessionTargetKm * 1000;

          const speed = config.avgSpeed + (Math.random() - 0.5) * config.speedVar;
          const duration = Math.round(distM / speed);

          const { route: gpsRoute, endIdx } = generateRealisticRoute(
            masterRoute,
            lastRouteIdx,
            distM,
            duration,
            speed,
            startTime.valueOf()
          );
          lastRouteIdx = endIdx;

          const sessionKm = Number((distM / 1000).toFixed(2));
          const sessionKcal = Number((sessionKm * config.calPerKm).toFixed(2));

          const activity = await ActivityTrackingModel.create({
            challengeId: challenge._id,
            userId: participant.user_id,
            activityType: challenge.category || 'Ngoài trời',
            status: 'completed',
            startTime: startTime.toDate(),
            endTime: moment(startTime).add(duration, 'seconds').toDate(),
            totalDuration: duration,
            totalDistance: sessionKm * 1000,
            avgSpeed: Number(speed.toFixed(2)),
            calories: sessionKcal,
            gpsRoute,
            source: 'app'
          });

          await ChallengeProgressModel.create({
            challenge_id: challenge._id,
            user_id: participant.user_id,
            date: startTime.toDate(),
            challenge_type: 'outdoor_activity',
            value: (unit === 'kcal' || unit === 'calo' || unit === 'calories') ? sessionKcal : sessionKm,
            unit: challenge.goal_unit,
            distance: sessionKm,
            duration_minutes: Number((duration / 60).toFixed(2)),
            avg_speed: Number(speed.toFixed(2)),
            calories: sessionKcal,
            source: 'gps_tracking',
            activity_id: activity._id
          });

          dayTotalKm += sessionKm;
          dayTotalKcal += sessionKcal;
          totalDistanceKm += sessionKm;
          totalCalories += sessionKcal;
        }

        // Verify daily completion
        const dayValue = (unit === 'kcal' || unit === 'calo' || unit === 'calories') ? dayTotalKcal : dayTotalKm;
        if (dayValue >= effectiveGoalValue) {
          completedDays.add(dateStr);
        }

        currentDate.add(1, 'day');
      }

      // Calculate streak
      let streak = 0;
      let checkDate = moment(limitDate);
      const completedSet = new Set(Array.from(completedDays));
      while (completedSet.has(checkDate.format('YYYY-MM-DD'))) {
        streak++;
        checkDate.subtract(1, 'day');
      }

      // Determine final progress value based on goal type
      let finalValue = 0;
      if (challenge.goal_type === 'daily_km' || challenge.goal_type === 'daily_calories') {
        finalValue = completedDays.size; // For daily goals, the progress is number of completed days
      } else {
        finalValue = (unit === 'kcal' || unit === 'calo' || unit === 'calories') ? totalCalories : totalDistanceKm;
      }

      const isCompleted = finalValue >= participant.goal_value;

      await ChallengeParticipantModel.updateOne(
        { _id: participant._id },
        {
          $set: {
            current_value: Number(finalValue.toFixed(2)),
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

  console.log('Outdoor challenges data generated successfully for target users!');
  await mongoose.disconnect();
}

run().catch(console.error);
