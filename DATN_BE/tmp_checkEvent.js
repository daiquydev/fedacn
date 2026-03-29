const mongoose = require('mongoose');
require('dotenv').config({ path: 'c:/DATN/fedacn/DATN_BE/.env' });

const uri = process.env.MONGODB_URL || '';

async function run() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const event = await db.collection('sport_events').findOne({ _id: new mongoose.Types.ObjectId('69ad37c08530ab567e585987') });
  console.log('Event:', event);
  if (event) {
     let category;
     if (mongoose.Types.ObjectId.isValid(event.category)) {
         category = await db.collection('sport_categories').findOne({ _id: new mongoose.Types.ObjectId(event.category) });
     } else {
         category = await db.collection('sport_categories').findOne({ name: event.category });
     }
     console.log('Category:', category);
  }
  process.exit(0);
}

run().catch(console.error);
