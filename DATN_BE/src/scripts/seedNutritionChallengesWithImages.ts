import mongoose from 'mongoose'
import moment from 'moment'
import { envConfig } from '../constants/config'
import ChallengeModel from '../models/schemas/challenge.schema'
import ChallengeParticipantModel from '../models/schemas/challengeParticipant.schema'
import ChallengeProgressModel from '../models/schemas/challengeProgress.schema'
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

const IMAGE_SETS: any = {
  'Eat Clean 30 Ngày': [
    { url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop", name: "Salad cá hồi và hạt quinoa" },
    { url: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=800&auto=format&fit=crop", name: "Bát cơm gạo lứt và ức gà áp chảo" },
    { url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop", name: "Salad rau củ tổng hợp" },
    { url: "https://images.unsplash.com/photo-1543353071-10c8ba85a904?q=80&w=800&auto=format&fit=crop", name: "Sinh tố xanh Eat Clean" },
    { url: "https://images.unsplash.com/photo-1540420754564-b004df99196b?q=80&w=800&auto=format&fit=crop", name: "Súp lơ xanh hấp và trứng luộc" }
  ],
  'Ăn Chay Buổi Trưa': [
    { url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop", name: "Salad đậu và rau mầm" },
    { url: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=800&auto=format&fit=crop", name: "Mì ý rau củ sốt cà chua" },
    { url: "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?q=80&w=800&auto=format&fit=crop", name: "Cơm chay thập cẩm" },
    { url: "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?q=80&w=800&auto=format&fit=crop", name: "Đậu phụ sốt tương và rau xanh" }
  ],
  'Ăn rau mỗi ngày': [
    { url: "https://images.unsplash.com/photo-1540420754564-b004df99196b?q=80&w=800&auto=format&fit=crop", name: "Đĩa rau củ luộc thập cẩm" },
    { url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=800&auto=format&fit=crop", name: "Salad bơ và cà chua bi" },
    { url: "https://images.unsplash.com/photo-1592417817098-8fd3d9ebc4a5?q=80&w=800&auto=format&fit=crop", name: "Súp rau củ thanh đạm" },
    { url: "https://images.unsplash.com/photo-1515541589424-b847253368f3?q=80&w=800&auto=format&fit=crop", name: "Rau chân vịt xào tỏi" }
  ],
  'Ăn Hạn Chế Tinh Bột': [
    { url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&auto=format&fit=crop", name: "Bít tết bò và măng tây" },
    { url: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=800&auto=format&fit=crop", name: "Cá hồi nướng và rau chân vịt" },
    { url: "https://images.unsplash.com/photo-1532980400857-e8d9d275d858?q=80&w=800&auto=format&fit=crop", name: "Ức gà áp chảo và súp lơ" },
    { url: "https://images.unsplash.com/photo-1432139509613-5c4255815697?q=80&w=800&auto=format&fit=crop", name: "Thịt ba chỉ nướng và xà lách" }
  ]
};

async function run() {
  try {
    await mongoose.connect(envConfig.mongoURL);
    console.log('Connected to MongoDB');

    const users = await UserModel.find({ email: { $in: TARGET_EMAILS } });
    console.log(`Found ${users.length} target users.`);
    const userIds = users.map(u => u._id);

    const nutritionChallenges = await ChallengeModel.find({ 
      challenge_type: 'nutrition', 
      is_deleted: false 
    });
    console.log(`Found ${nutritionChallenges.length} nutrition challenges.`);

    const today = moment();

    for (const challenge of nutritionChallenges) {
      console.log(`\n--- Processing Nutrition Challenge: ${challenge.title} ---`);
      
      const imageSet = IMAGE_SETS[challenge.title] || IMAGE_SETS['Eat Clean 30 Ngày'];

      for (const user of users) {
        // Ensure participation
        let participant = await ChallengeParticipantModel.findOne({ 
          challenge_id: challenge._id, 
          user_id: user._id 
        });

        if (!participant) {
          participant = await ChallengeParticipantModel.create({
            challenge_id: challenge._id,
            user_id: user._id,
            goal_value: challenge.goal_value,
            joined_at: challenge.start_date,
            status: 'in_progress',
            is_completed: false,
            current_value: 0
          });
        }

        // Clear previous progress for this challenge and user
        await ChallengeProgressModel.deleteMany({ 
          challenge_id: challenge._id, 
          user_id: user._id 
        });

        const start = moment(challenge.start_date);
        const end = moment(challenge.end_date);
        const limitDate = today.isBefore(end) ? today : end;

        let totalMealsCount = 0;
        const activeDays = new Set<string>();
        const completedDays = new Set<string>();
        let currentDate = moment(start);

        while (currentDate.isSameOrBefore(limitDate)) {
          const dateStr = currentDate.format('YYYY-MM-DD');
          activeDays.add(dateStr);

          // Number of meals to log per day (based on goal or 3 for general)
          const mealsToLog = challenge.goal_value > 3 ? 3 : challenge.goal_value;
          
          for (let m = 0; m < mealsToLog; m++) {
            const mealTime = currentDate.clone().hour(7 + m * 5).minute(Math.floor(Math.random() * 60));
            const mealInfo = imageSet[Math.floor(Math.random() * imageSet.length)];

            await ChallengeProgressModel.create({
              challenge_id: challenge._id,
              user_id: user._id,
              date: mealTime.toDate(),
              challenge_type: 'nutrition',
              value: 1,
              unit: challenge.goal_unit || 'bữa ăn',
              food_name: mealInfo.name,
              proof_image: mealInfo.url,
              ai_review_valid: true,
              source: 'photo_checkin',
              createdAt: mealTime.toDate(),
              updatedAt: mealTime.toDate()
            });
            totalMealsCount++;
          }

          completedDays.add(dateStr);
          currentDate.add(1, 'day');
        }

        // Update Participant status
        // For nutrition, current_value might be total meals or total days
        // Usually it's days if it's a daily streak thing, but let's see goal_type
        let finalProgressValue = totalMealsCount;
        if (challenge.goal_type === 'meals_logged_daily') {
          finalProgressValue = completedDays.size;
        }

        const isCompleted = finalProgressValue >= participant.goal_value;
        
        await ChallengeParticipantModel.updateOne(
          { _id: participant._id },
          {
            $set: {
              current_value: finalProgressValue,
              active_days: Array.from(activeDays),
              completed_days: Array.from(completedDays),
              streak_count: completedDays.size,
              last_activity_at: activeDays.size > 0 ? moment(Array.from(activeDays).pop()).toDate() : null,
              status: isCompleted ? 'completed' : 'in_progress',
              is_completed: isCompleted,
              updatedAt: new Date()
            }
          }
        );
      }
      
      // Update challenge participants count
      const count = await ChallengeParticipantModel.countDocuments({ challenge_id: challenge._id });
      await ChallengeModel.updateOne({ _id: challenge._id }, { participants_count: count });
    }

    console.log('\nNutrition challenge progress seeding with real images completed!');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await mongoose.disconnect();
  }
}

run();
