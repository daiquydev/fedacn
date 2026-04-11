const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URL).then(async () => {
    const db = mongoose.connection.db;
    
    // Get all users
    const users = await db.collection('users').find({}).toArray();
    console.log('Total users found:', users.length);
    
    // Get all events
    const events = await db.collection('sport_events').find({ isDeleted: { $ne: true } }).toArray();
    console.log('Total events found:', events.length);
    
    // Map of all valid user IDs
    const userIds = users.map(u => u._id);
    
    let updatedEventsCount = 0;
    
    for (const event of events) {
        // We will add ALL users to EVERY event up to maxParticipants (if defined, else add all)
        const currentPidsStr = (event.participants_ids || []).map(id => id.toString());
        
        let newPids = [...(event.participants_ids || [])];
        let addedToEvent = 0;
        
        for (const uid of userIds) {
            const uidStr = uid.toString();
            if (!currentPidsStr.includes(uidStr)) {
                newPids.push(uid);
                addedToEvent++;
            }
        }
        
        if (addedToEvent > 0) {
            // Check max limits
            if (event.maxParticipants && newPids.length > event.maxParticipants) {
                newPids = newPids.slice(0, event.maxParticipants);
            }
            
            // Clean up non-ObjectIds just in case
            const cleanedPids = newPids.filter(id => {
               try {
                  new mongoose.Types.ObjectId(id.toString());
                  return true;
               } catch (e) { return false; }
            }).map(id => typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id);
            
            await db.collection('sport_events').updateOne(
                { _id: event._id },
                { 
                    $set: { 
                        participants_ids: cleanedPids,
                        participants: cleanedPids.length
                    }
                }
            );
            updatedEventsCount++;
            console.log(`+ Synced event: ${event.name} - now has ${cleanedPids.length} participants`);
        } else if (event.participants !== newPids.length) {
            // Just fix the count if it's wrong
            await db.collection('sport_events').updateOne(
                { _id: event._id },
                { $set: { participants: newPids.length } }
            );
            console.log(`~ Fixed counter for event: ${event.name}`);
        }
    }
    
    console.log(`\nSuccessfully applied bulk participation fix to ${updatedEventsCount} events.`);
    mongoose.disconnect();
}).catch(e => { console.error(e); mongoose.disconnect(); });
