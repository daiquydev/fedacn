import mongoose from 'mongoose'
import { envConfig } from '../constants/config'
import ChallengeModel from '../models/schemas/challenge.schema'

async function listNutritionChallenges() {
  await mongoose.connect(envConfig.mongoURL);
  const challenges = await ChallengeModel.find({ challenge_type: 'nutrition', is_deleted: false });
  challenges.forEach(c => {
    console.log(`ID: ${c._id}, Title: ${c.title}, Category: ${c.category}, Goal: ${c.goal_value} ${c.goal_unit}`);
  });
  await mongoose.disconnect();
}

listNutritionChallenges();
