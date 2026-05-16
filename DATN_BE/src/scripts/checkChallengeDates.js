
const mongoose = require('mongoose');

async function debug() {
    try {
        const url = "mongodb+srv://daiquy:10102003@cluster0.cxzaocf.mongodb.net/?appName=Cluster0";
        await mongoose.connect(url);
        
        const challengeId = '6a0742825539b91f032bf2e1';
        const challenge = await mongoose.connection.db.collection('challenges').findOne({ _id: new mongoose.Types.ObjectId(challengeId) });
        
        console.log('--- Challenge Info ---');
        console.log(JSON.stringify(challenge, null, 2));

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

debug();
