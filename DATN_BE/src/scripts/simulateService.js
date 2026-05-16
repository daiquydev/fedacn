
const mongoose = require('mongoose');

async function debug() {
    try {
        const url = "mongodb+srv://daiquy:10102003@cluster0.cxzaocf.mongodb.net/?appName=Cluster0";
        await mongoose.connect(url);
        
        const challengeId = '6a0742825539b91f032bf2e1';
        const userEmail = 'vukhanhly08@gmail.com'; 

        const user = await mongoose.connection.db.collection('users').findOne({ email: userEmail });
        
        const progressEntries = await mongoose.connection.db.collection('challenge_progress').find({
            challenge_id: new mongoose.Types.ObjectId(challengeId),
            user_id: user._id,
            is_deleted: { $ne: true }
        }).sort({ date: 1 }).toArray();

        console.log('Total Progress Entries:', progressEntries.length);
        console.log('First Entry Date:', progressEntries[0].date);
        console.log('Last Entry Date:', progressEntries[progressEntries.length - 1].date);

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

debug();
