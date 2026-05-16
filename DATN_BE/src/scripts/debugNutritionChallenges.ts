import mongoose from 'mongoose'
import { envConfig } from '../constants/config'
import ChallengeModel from '../models/schemas/challenge.schema'

async function debugNutritionChallenges() {
  await mongoose.connect(envConfig.mongoURL);
  const challenges = await ChallengeModel.find({ challenge_type: 'nutrition', is_deleted: false });
  console.log(JSON.stringify(challenges.map(c => ({
    _id: c._id,
    title: c.title,
    goal_type: c.goal_type,
    goal_value: c.goal_value,
    goal_unit: c.goal_unit,
    start_date: c.start_date,
    end_date: c.end_date
  })), null, 2));
  await mongoose.disconnect();
}

debugNutritionChallenges();
