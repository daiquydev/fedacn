const mongoose = require('mongoose');
const { envConfig } = require('./src/constants/config');

async function listChallenges() {
  await mongoose.connect(envConfig.mongoURL);
  const challenges = await mongoose.connection.db.collection('challenges').find({}).toArray();
  console.log(`Found ${challenges.length} challenges:`);
  challenges.forEach(c => {
    console.log(`- ID: ${c._id}, Name: ${c.name}, GoalType: ${c.goalType}, Category: ${c.category}`);
  });
  await mongoose.disconnect();
}

listChallenges().catch(console.error);
