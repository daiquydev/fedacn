import mongoose from 'mongoose'
import moment from 'moment'
import { envConfig } from '../constants/config'
import ChallengeProgressModel from '../models/schemas/challengeProgress.schema'
import UserModel from '../models/schemas/user.schema'

async function debugUserProgress() {
  await mongoose.connect(envConfig.mongoURL);
  const user = await UserModel.findOne({ email: 'phangiabao10@gmail.com' });
  if (!user) return;

  const progress = await ChallengeProgressModel.find({ 
    challenge_id: '6a0742825539b91f032bf2e1',
    user_id: user._id
  }).sort({ date: 1 });

  console.log(`Found ${progress.length} records for phangiabao10`);
  progress.slice(0, 10).forEach(p => {
    console.log(`Date: ${p.date.toISOString()}, Value: ${p.value}, Food: ${p.food_name}`);
  });
  
  await mongoose.disconnect();
}

debugUserProgress();
