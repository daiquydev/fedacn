import mongoose from 'mongoose'
import moment from 'moment'
import { envConfig } from '../constants/config'
import ChallengeModel from '../models/schemas/challenge.schema'
import ChallengeParticipantModel from '../models/schemas/challengeParticipant.schema'
import ChallengeProgressModel from '../models/schemas/challengeProgress.schema'
import WorkoutSessionModel from '../models/schemas/workoutSession.schema'
import ExerciseModel from '../models/schemas/exercise.schema'
import UserModel from '../models/schemas/user.schema'

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

async function run() {
  try {
    await mongoose.connect(envConfig.mongoURL);
    console.log('Connected to MongoDB');

    const users = await UserModel.find({ email: { $in: TARGET_EMAILS } });
    console.log(`Found ${users.length} target users.`);
    const userIds = users.map(u => u._id);

    const fitnessChallenges = await ChallengeModel.find({ challenge_type: 'fitness', is_deleted: false });
    console.log(`Found ${fitnessChallenges.length} fitness challenges.`);

    const today = moment();

    for (const challenge of fitnessChallenges) {
      console.log(`\n--- Processing Fitness Challenge: ${challenge.title} ---`);

      // 1. Ensure participation
      for (const user of users) {
        const existing = await ChallengeParticipantModel.findOne({ challenge_id: challenge._id, user_id: user._id });
        if (!existing) {
          await ChallengeParticipantModel.create({
            challenge_id: challenge._id,
            user_id: user._id,
            goal_value: challenge.goal_value,
            joined_at: challenge.start_date,
            status: 'in_progress',
            is_completed: false,
            current_value: 0
          });
        }
      }

      const participants = await ChallengeParticipantModel.find({
        challenge_id: challenge._id,
        user_id: { $in: userIds }
      });

      const start = moment(challenge.start_date);
      const end = moment(challenge.end_date);
      const limitDate = today.isBefore(end) ? today : end;

      for (const participant of participants) {
        console.log(`  Generating data for user: ${participant.user_id}`);
        
        // Clear previous progress and workout sessions linked to this challenge
        // Note: WorkoutSession doesn't have a challenge_id field directly in its schema, 
        // but ChallengeProgress links to it. We'll find sessions via ChallengeProgress.
        const oldProgress = await ChallengeProgressModel.find({ 
          challenge_id: challenge._id, 
          user_id: participant.user_id,
          challenge_type: 'fitness'
        });
        
        const oldSessionIds = oldProgress.map(p => p.workout_session_id).filter(id => id);
        await WorkoutSessionModel.deleteMany({ _id: { $in: oldSessionIds } });
        await ChallengeProgressModel.deleteMany({ challenge_id: challenge._id, user_id: participant.user_id });

        let totalKcalAccumulated = 0;
        const activeDays = new Set<string>();
        const completedDays = new Set<string>();
        let currentDate = moment(start);

        while (currentDate.isSameOrBefore(limitDate)) {
          const dateStr = currentDate.format('YYYY-MM-DD');
          activeDays.add(dateStr);

          // 50-80% chance of completing the challenge on a given day to make it look realistic
          // But user wants "tiến độ mỗi ngày", so let's make it 100% for seed data consistency
          const workoutTime = currentDate.clone().hour(16 + Math.floor(Math.random() * 5)).minute(Math.floor(Math.random() * 60));
          
          let sessionTotalKcal = 0;
          let sessionTotalVolume = 0;
          let sessionTotalReps = 0;
          let sessionTotalSets = 0;
          let sessionTotalSeconds = 0;

          const sessionExercises = await Promise.all((challenge.exercises || []).map(async (ex: any) => {
            const exerciseDetail = await ExerciseModel.findById(ex.exercise_id);
            const secPerRep = exerciseDetail?.duration_default || 3;
            const restSec = exerciseDetail?.rest_time_default || 0;

            const exerciseSets = (ex.sets || []).map((s: any) => {
              const reps = s.reps || 10;
              const weight = s.weight || 0;
              const kcalPerRep = s.calories_per_unit || 0.02;
              const kcal = reps * weight * kcalPerRep;
              
              sessionTotalKcal += kcal;
              sessionTotalVolume += (reps * weight);
              sessionTotalReps += reps;
              sessionTotalSets += 1;
              sessionTotalSeconds += (reps * secPerRep);

              return {
                set_number: s.set_number,
                reps: reps,
                weight: weight,
                calories_per_unit: kcalPerRep,
                completed: true,
                skipped: false
              };
            });

            // Add rest time between sets
            if (exerciseSets.length > 1) {
              sessionTotalSeconds += (exerciseSets.length - 1) * restSec;
            }

            return {
              exercise_id: ex.exercise_id,
              exercise_name: ex.exercise_name,
              sets: exerciseSets
            };
          }));

          const sessionDurationMinutes = Math.max(1, Math.round(sessionTotalSeconds / 60));

          // Create Workout Session
          const session = new WorkoutSessionModel({
            user_id: participant.user_id,
            started_at: workoutTime.toDate(),
            finished_at: moment(workoutTime).add(sessionDurationMinutes, 'minutes').toDate(),
            exercises: sessionExercises,
            total_calories: Number(sessionTotalKcal.toFixed(2)),
            total_volume: sessionTotalVolume,
            total_reps: sessionTotalReps,
            total_sets: sessionTotalSets,
            duration_minutes: sessionDurationMinutes,
            status: 'completed',
            createdAt: workoutTime.toDate(),
            updatedAt: workoutTime.toDate()
          });
          await session.save();

          // Create Challenge Progress
          const progress = new ChallengeProgressModel({
            challenge_id: challenge._id,
            user_id: participant.user_id,
            date: workoutTime.toDate(),
            challenge_type: 'fitness',
            value: sessionExercises.length,
            unit: challenge.goal_unit || 'bài tập',
            calories: Number(sessionTotalKcal.toFixed(2)),
            duration_minutes: sessionDurationMinutes,
            workout_session_id: session._id,
            exercises_count: sessionExercises.length,
            completed_exercises: sessionExercises.map(ex => ({
              exercise_id: ex.exercise_id,
              exercise_name: ex.exercise_name,
              completed: true
            })),
            source: 'workout_session',
            createdAt: workoutTime.toDate(),
            updatedAt: workoutTime.toDate()
          });
          await progress.save();

          totalKcalAccumulated += sessionTotalKcal;
          completedDays.add(dateStr);
          currentDate.add(1, 'day');
        }

        // Update Participant status
        // For daily challenges, current_value should be the number of days completed
        const finalProgressValue = completedDays.size;
        const isCompleted = finalProgressValue >= participant.goal_value;
        
        await ChallengeParticipantModel.updateOne(
          { _id: participant._id },
          {
            $set: {
              current_value: finalProgressValue,
              active_days: Array.from(activeDays),
              completed_days: Array.from(completedDays),
              streak_count: completedDays.size, 
              last_activity_at: moment(Array.from(activeDays).pop()).toDate(),
              status: isCompleted ? 'completed' : 'in_progress',
              is_completed: isCompleted,
              createdAt: moment(start).toDate(), // Set to start of challenge
              updatedAt: moment(limitDate).toDate()
            }
          }
        );
      }
      
      // Update challenge participants count
      const count = await ChallengeParticipantModel.countDocuments({ challenge_id: challenge._id });
      await ChallengeModel.updateOne({ _id: challenge._id }, { participants_count: count });
    }

    console.log('\nFitness challenge progress seeding completed!');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await mongoose.disconnect();
  }
}

run();
