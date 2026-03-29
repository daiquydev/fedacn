/**
 * Migration: Rename challenge collections to training
 * Run: npx ts-node -r tsconfig-paths/register src/scripts/migrate-challenge-to-training.ts
 */
import mongoose from 'mongoose'

const MONGODB_URL = process.argv[2] || process.env.MONGODB_URL || ''

async function migrate() {
    if (!MONGODB_URL) {
        console.error('Usage: npx ts-node ... <MONGODB_URL>')
        process.exit(1)
    }

    await mongoose.connect(MONGODB_URL)
    const db = mongoose.connection.db!
    console.log('Connected to MongoDB')

    // 1. Rename collections
    const renames = [
        { from: 'challenges', to: 'trainings' },
        { from: 'challenge_participants', to: 'training_participants' },
        { from: 'user_challenge_profiles', to: 'user_training_profiles' }
    ]

    for (const { from, to } of renames) {
        try {
            const collections = await db.listCollections({ name: from }).toArray()
            if (collections.length > 0) {
                await db.collection(from).rename(to)
                console.log(`✅ Renamed collection: ${from} → ${to}`)
            } else {
                console.log(`⏭️ Collection ${from} not found, skipping`)
            }
        } catch (err: any) {
            if (err.code === 48) {
                console.log(`⚠️ Target collection ${to} already exists, skipping rename of ${from}`)
            } else {
                console.error(`❌ Error renaming ${from}:`, err.message)
            }
        }
    }

    // 2. Rename fields in user_training_profiles
    try {
        const result = await db.collection('user_training_profiles').updateMany(
            { challenges_joined: { $exists: true } },
            {
                $rename: {
                    challenges_joined: 'trainings_joined',
                    challenges_completed: 'trainings_completed',
                    perfect_challenges: 'perfect_trainings'
                }
            }
        )
        console.log(`✅ Renamed fields in user_training_profiles: ${result.modifiedCount} documents updated`)
    } catch (err: any) {
        console.log(`⚠️ Field rename in user_training_profiles: ${err.message}`)
    }

    await mongoose.disconnect()
    console.log('Migration complete!')
}

migrate().catch(console.error)
