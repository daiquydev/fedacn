const { MongoClient, ObjectId } = require('mongodb');

const uri = "mongodb://localhost:27017/fedacn";
const eventId = "69f45e77977df80dd23b0591";

async function run() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db("fedacn");
        const event = await db.collection("sport_events").findOne({ _id: new ObjectId(eventId) });
        console.log("Event:", JSON.stringify(event, null, 2));
        
        if (event && event.eventType === "Trong nhà") {
            const sessions = await db.collection("sport_event_sessions").find({ eventId: event._id }).toArray();
            console.log("Sessions:", JSON.stringify(sessions, null, 2));
        }
    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}
run();
