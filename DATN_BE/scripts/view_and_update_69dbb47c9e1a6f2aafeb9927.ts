import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config()

const CHALLENGE_ID = '69dbb47c9e1a6f2aafeb9927'

async function run() {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(process.env.MONGODB_URL as string)
    console.log('✅ Connected to MongoDB')

    const db = mongoose.connection.db
    const col = db.collection('challenges')

    const doc = await col.findOne({ _id: new mongoose.Types.ObjectId(CHALLENGE_ID) })
    console.log('DOCUMENT DATA:', JSON.stringify(doc, null, 2))

    // Let's force-update the fields to make it perfectly active and public
    if (doc) {
        const updateResult = await col.updateOne(
            { _id: new mongoose.Types.ObjectId(CHALLENGE_ID) },
            {
                $set: {
                    status: 'active',
                    is_deleted: false,
                    deleted_from_report_moderation: false,
                    deleted_at: null,
                    is_public: true,
                    visibility: 'public'
                }
            }
        )
        console.log('Update Result:', updateResult.modifiedCount, 'documents modified')
    } else {
        console.log('Document not found!')
    }

    await mongoose.disconnect()
}

run().catch(err => {
    console.error(err)
    process.exit(1)
})
