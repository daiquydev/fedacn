
const mongoose = require('mongoose');

async function debug() {
    try {
        const url = "mongodb+srv://daiquy:10102003@cluster0.cxzaocf.mongodb.net/?appName=Cluster0";
        await mongoose.connect(url);
        
        const challengeId = '6a0742825539b91f032bf2e1';
        const userEmail = 'vukhanhly08@gmail.com'; 

        const user = await mongoose.connection.db.collection('users').findOne({ email: userEmail });
        
        const participant = await mongoose.connection.db.collection('challenge_participants').findOne({ 
            challenge_id: new mongoose.Types.ObjectId(challengeId),
            user_id: user._id 
        });

        console.log(`\n--- Participant Data for ${user.name} ---`);
        console.log(`Current Value: ${participant?.current_value}`);
        console.log(`Goal Value: ${participant?.goal_value}`);
        console.log(`Completed Days Count: ${participant?.completed_days?.length || 0}`);

        const progress = await mongoose.connection.db.collection('challenge_progress').find({
            challenge_id: new mongoose.Types.ObjectId(challengeId),
            user_id: user._id,
            is_deleted: { $ne: true }
        }).sort({ date: 1 }).toArray();

        console.log(`\n--- Progress Records (${progress.length}) ---`);
        const progressByDate = {};
        progress.forEach(p => {
            const d = p.date.toISOString().split('T')[0];
            if (!progressByDate[d]) progressByDate[d] = [];
            progressByDate[d].push(p);
        });

        const days = Object.keys(progressByDate).sort();
        days.forEach(day => {
            const entries = progressByDate[day];
            const firstCal = entries[0].calories;
            console.log(`${day}: ${entries.length} meals (Sample Cal: ${firstCal})`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

debug();
