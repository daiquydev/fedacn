import mongoose from 'mongoose'
import { envConfig } from '../constants/config'
import ChallengeParticipantModel from '../models/schemas/challengeParticipant.schema'
import UserModel from '../models/schemas/user.schema'

async function debugParticipant() {
  await mongoose.connect(envConfig.mongoURL);
  const user = await UserModel.findOne({ email: 'phangiabao10@gmail.com' });
  if (!user) return;

  const participant = await ChallengeParticipantModel.findOne({ 
    challenge_id: '6a0742825539b91f032bf2e1',
    user_id: user._id
  });

  console.log(JSON.stringify(participant, null, 2));
  await mongoose.disconnect();
}

debugParticipant();
