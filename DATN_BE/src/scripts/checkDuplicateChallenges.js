
const mongoose = require('mongoose');

async function debug() {
    try {
        const url = "mongodb+srv://daiquy:10102003@cluster0.cxzaocf.mongodb.net/?appName=Cluster0";
        await mongoose.connect(url);
        
        const challenges = await mongoose.connection.db.collection('challenges').find({ 
            title: "Ăn rau mỗi ngày",
            is_deleted: false 
        }).toArray();
        
        console.log(`Found ${challenges.length} challenges with title "Ăn rau mỗi ngày"`);
        challenges.forEach(c => {
            console.log(`- ID: ${c._id}, Type: ${c.challenge_type}, CreatedAt: ${c.createdAt}`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

debug();
