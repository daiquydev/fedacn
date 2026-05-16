
const mongoose = require('mongoose');

async function debug() {
    try {
        const url = "mongodb+srv://daiquy:10102003@cluster0.cxzaocf.mongodb.net/?appName=Cluster0";
        await mongoose.connect(url);
        console.log('Connected to MongoDB');

        const users = await mongoose.connection.db.collection('users').find({}).limit(20).toArray();
        console.log('Users in DB:');
        users.forEach(u => console.log(`- ${u.email} (${u.name})`));

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

debug();
