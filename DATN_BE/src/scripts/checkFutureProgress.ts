import mongoose from 'mongoose'
import { envConfig } from '../constants/config'
import ChallengeProgressModel from '../models/schemas/challengeProgress.schema'

async function checkFutureProgress() {
  await mongoose.connect(envConfig.mongoURL);
  const futureRecords = await ChallengeProgressModel.countDocuments({ 
    date: { $gt: new Date() } 
  });
  console.log(`Found ${futureRecords} future progress records`);
  
  const latest = await ChallengeProgressModel.findOne().sort({ date: -1 });
  console.log(`Latest record date: ${latest?.date.toISOString()}`);
  
  await mongoose.disconnect();
}

checkFutureProgress();
