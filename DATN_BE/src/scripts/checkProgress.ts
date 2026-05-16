import mongoose from 'mongoose'
import { envConfig } from '../constants/config'
import ChallengeProgressModel from '../models/schemas/challengeProgress.schema'

async function checkProgress() {
  await mongoose.connect(envConfig.mongoURL);
  const progress = await ChallengeProgressModel.find({ 
    challenge_id: '6a0742825539b91f032bf2e1' 
  }).limit(5);
  console.log(JSON.stringify(progress, null, 2));
  await mongoose.disconnect();
}

checkProgress();
