
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { ChallengeProgressModel } from './models/schemas/challengeProgress.schema';
import { ChallengeModel } from './models/schemas/challenge.schema';
import { UserModel } from './models/schemas/user.schema';
import { ChallengeParticipantModel } from './models/schemas/challengeParticipant.schema';

dotenv.config();

async function debug() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fedacn');
    console.log('Connected to MongoDB');

    const challengeId = '6a0742825539b91f032bf2e1'; // "Ăn rau mỗi ngày"
    const userEmail = 'vukhanhly@gmail.com'; 

    const user = await UserModel.findOne({ email: userEmail });
    if (!user) {
        console.log('User not found');
        return;
    }

    const participant = await ChallengeParticipantModel.findOne({ 
        challenge_id: new mongoose.Types.ObjectId(challengeId),
        user_id: user._id 
    });

    console.log(`\n--- Participant Data for ${user.name} ---`);
    console.log(`Current Value: ${participant?.current_value}`);
    console.log(`Goal Value: ${participant?.goal_value}`);
    console.log(`Completed Days: ${participant?.completed_days?.length}`);
    console.log(`Active Days: ${participant?.active_days?.length}`);

    const progress = await ChallengeProgressModel.find({
        challenge_id: new mongoose.Types.ObjectId(challengeId),
        user_id: user._id
    }).sort({ date: 1 });

    console.log(`\n--- Progress Records (${progress.length}) ---`);
    const dayMap: any = {};
    progress.forEach(p => {
        const d = p.date.toISOString().split('T')[0];
        if (!dayMap[d]) dayMap[d] = 0;
        dayMap[d]++;
    });

    Object.keys(dayMap).sort().forEach(d => {
        console.log(`${d}: ${dayMap[d]} meals`);
    });

    await mongoose.disconnect();
}

debug();
