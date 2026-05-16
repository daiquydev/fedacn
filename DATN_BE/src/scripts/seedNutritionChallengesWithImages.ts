
import mongoose from 'mongoose'
import moment from 'moment-timezone'
import { envConfig } from '../constants/config'
import ChallengeModel from '../models/schemas/challenge.schema'
import ChallengeParticipantModel from '../models/schemas/challengeParticipant.schema'
import ChallengeProgressModel from '../models/schemas/challengeProgress.schema'
import UserModel from '../models/schemas/user.schema'

const TZ_VN = 'Asia/Ho_Chi_Minh'

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

const IMAGE_SETS: any = {
  'Eat Clean 30 Ngày': [
    { url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop", name: "Salad cá hồi và hạt quinoa" },
    { url: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=800&auto=format&fit=crop", name: "Bát cơm gạo lứt và ức gà áp chảo" },
    { url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop", name: "Salad rau củ tổng hợp" }
  ],
  'Ăn Chay Buổi Trưa': [
    { url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop", name: "Salad đậu và rau mầm" },
    { url: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=800&auto=format&fit=crop", name: "Mì ý rau củ sốt cà chua" }
  ],
  'Ăn rau mỗi ngày': [
    { url: "https://images.unsplash.com/photo-1540420754564-b004df99196b?q=80&w=800&auto=format&fit=crop", name: "Đĩa rau củ luộc thập cẩm" },
    { url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=800&auto=format&fit=crop", name: "Salad bơ và cà chua bi" }
  ],
  'Ăn Hạn Chế Tinh Bột': [
    { url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&auto=format&fit=crop", name: "Bít tết bò và măng tây" },
    { url: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=800&auto=format&fit=crop", name: "Cá hồi nướng và rau chân vịt" }
  ]
};

async function run() {
  try {
    await mongoose.connect(envConfig.mongoURL);
    console.log('Connected to MongoDB');

    const users = await UserModel.find({ email: { $in: TARGET_EMAILS } });
    const nutritionChallenges = await ChallengeModel.find({ 
      challenge_type: 'nutrition', 
      is_deleted: false 
    });

    const nowVN = moment().tz(TZ_VN);
    const todayStr = nowVN.format('YYYY-MM-DD');

    for (const challenge of nutritionChallenges) {
      console.log(`\n--- Synchronizing Data for: ${challenge.title} ---`);
      
      const imageSet = IMAGE_SETS[challenge.title] || IMAGE_SETS['Eat Clean 30 Ngày'];
      
      // Start/End in VN Time
      const startVN = moment.tz(challenge.start_date, TZ_VN).startOf('day');
      const endVN = moment.tz(challenge.end_date, TZ_VN).startOf('day');
      const totalDurationDays = endVN.diff(startVN, 'days') + 1;
      
      console.log(`Challenge Duration: ${totalDurationDays} days (${startVN.format('YYYY-MM-DD')} to ${endVN.format('YYYY-MM-DD')})`);

      for (const user of users) {
        // 1. Purge ALL existing progress (clean slate)
        await ChallengeProgressModel.deleteMany({ 
          challenge_id: challenge._id, 
          user_id: user._id 
        });

        const activeDays: string[] = [];
        const completedDays: string[] = [];
        
        let cursor = startVN.clone();
        const limitVN = nowVN.isBefore(endVN) ? nowVN : endVN;

        while (cursor.isSameOrBefore(limitVN, 'day')) {
          const dateStr = cursor.format('YYYY-MM-DD');
          activeDays.push(dateStr);
          completedDays.push(dateStr);

          // Log meals for this day
          const mealsToLog = challenge.goal_value || 1;
          for (let m = 0; m < mealsToLog; m++) {
            // Distribute meals throughout the day (VN Time)
            const mealTime = cursor.clone().hour(7 + m * 5).minute(Math.floor(Math.random() * 60));
            const mealInfo = imageSet[Math.floor(Math.random() * imageSet.length)];

            // Determine realistic calorie range based on challenge title
            const title = challenge.title?.toLowerCase() || '';
            let calMin = 350, calMax = 600;
            if (title.includes('rau')) {
              calMin = 100; calMax = 250; // Veggies are lighter
            } else if (title.includes('chay')) {
              calMin = 300; calMax = 500;
            }

            await ChallengeProgressModel.create({
              challenge_id: challenge._id,
              user_id: user._id,
              date: mealTime.toDate(), // Save as UTC Date object
              challenge_type: 'nutrition',
              value: 1,
              unit: challenge.goal_unit || 'bữa',
              food_name: mealInfo.name,
              proof_image: mealInfo.url,
              calories: Math.floor(Math.random() * (calMax - calMin + 1)) + calMin,
              ai_review_valid: true,
              validation_status: 'valid',
              source: 'photo_checkin',
              createdAt: mealTime.toDate(),
              updatedAt: mealTime.toDate()
            });
          }
          cursor.add(1, 'day');
        }

        // 2. Synchronize Participant Record
        const currentProgressCount = completedDays.length;
        const isCompleted = currentProgressCount >= totalDurationDays;
        
        await ChallengeParticipantModel.findOneAndUpdate(
          { challenge_id: challenge._id, user_id: user._id },
          {
            $set: {
              current_value: currentProgressCount,
              goal_value: totalDurationDays, // Crucial for "32%" display
              active_days: activeDays,
              completed_days: completedDays,
              streak_count: currentProgressCount,
              last_activity_at: limitVN.toDate(),
              status: isCompleted ? 'completed' : 'in_progress',
              is_completed: isCompleted,
              updatedAt: new Date()
            }
          },
          { upsert: true }
        );
      }
      
      // Update challenge participant count
      const count = await ChallengeParticipantModel.countDocuments({ challenge_id: challenge._id, status: { $ne: 'quit' } });
      await ChallengeModel.updateOne({ _id: challenge._id }, { participants_count: count });
      console.log(`Synced ${users.length} users for ${challenge.title}. Total participants: ${count}`);
    }

    console.log('\nAll nutrition challenge data synchronized successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

run();
