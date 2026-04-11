const mongoose = require('mongoose');
require('dotenv').config({ path: 'c:/DATN/fedacn/DATN_BE/.env' });

console.log('Connecting to db:', process.env.MONGODB_URL);
mongoose.connect(process.env.MONGODB_URL).then(async () => {
    console.log('Connected!');
    
    const db = mongoose.connection.db;
    
    try {
        const events = await db.collection('sport_events').find({}).toArray();
        console.log('Total events:', events.length);
        
        const users = await db.collection('users').find({}).limit(10).toArray();
        console.log('Sample users count:', users.length);
        
        let countFixed = 0;
        let modified = 0;
        
        if (users.length > 0) {
            for (const event of events) {
                const currentIds = event.participants_ids ? event.participants_ids.map(id => id.toString()) : [];
                let pcount = currentIds.length;
                let added = false;
                
                // Add users if there are very few participants
                if (pcount < 3) {
                    const randomUser = users[Math.floor(Math.random() * users.length)];
                    const userId = randomUser._id;
                    
                    if (!currentIds.includes(userId.toString())) {
                        await db.collection('sport_events').updateOne(
                            { _id: event._id },
                            { 
                                $push: { participants_ids: userId },
                            }
                        );
                        console.log('Added demo participant to event ' + event.name);
                        added = true;
                        pcount += 1;
                        modified++;
                    }
                }
                
                // Always sync the count
                if (event.participants !== pcount || added) {
                    await db.collection('sport_events').updateOne(
                        { _id: event._id },
                        { $set: { participants: pcount } }
                    );
                    if (event.participants !== pcount) {
                        console.log('Fixed count mismatch for event ' + event.name + ': ' + event.participants + ' -> ' + pcount);
                        countFixed++;
                    }
                }
            }
        }
        
        console.log('Total events augmented:', modified);
        console.log('Total events fixed count:', countFixed);
        
    } catch (e) {
        console.error('Error:', e);
    } finally {
        mongoose.disconnect();
    }
}).catch(console.error);
