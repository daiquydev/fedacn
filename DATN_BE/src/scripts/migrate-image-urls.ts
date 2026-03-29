/**
 * Script: migrate-image-urls.ts
 *
 * Migrate legacy relative image paths in MongoDB to empty strings.
 * Cloudinary URLs (https://res.cloudinary.com/...) are preserved as-is.
 * Broken relative paths (e.g., /uploads/image.jpg) are cleared to ''
 * so the frontend getImageUrl() fallback handles them correctly.
 *
 * Usage:
 *   npx ts-node ./src/scripts/migrate-image-urls.ts          # Dry run (preview)
 *   npx ts-node ./src/scripts/migrate-image-urls.ts --write   # Actual migration
 */

import mongoose from 'mongoose'
import { config } from 'dotenv'
config()

import { envConfig } from '../constants/config'

// ─── Collections & fields to migrate ────────────────────────────────────────

interface MigrationTarget {
  modelName: string
  collectionName: string
  /** Single string fields */
  fields: string[]
  /** Array-of-string fields */
  arrayFields?: string[]
}

const TARGETS: MigrationTarget[] = [
  { modelName: 'users', collectionName: 'users', fields: ['avatar', 'cover_avatar'] },
  { modelName: 'image_posts', collectionName: 'image_posts', fields: ['url'] },
  { modelName: 'recipes', collectionName: 'recipes', fields: ['image'] },
  { modelName: 'blogs', collectionName: 'blogs', fields: ['image'] },
  { modelName: 'albums', collectionName: 'albums', fields: ['image'] },
  { modelName: 'trainings', collectionName: 'trainings', fields: ['image'] },
  { modelName: 'sport_events', collectionName: 'sport_events', fields: ['image'] },
  { modelName: 'meal_plans', collectionName: 'meal_plans', fields: ['image'], arrayFields: ['images'] },

  { modelName: 'habit_checkins', collectionName: 'habit_checkins', fields: ['image_url'] }
]

// ─── Helpers ────────────────────────────────────────────────────────────────

const isLegacyPath = (val: unknown): boolean => {
  if (typeof val !== 'string') return false
  const trimmed = val.trim()
  if (!trimmed) return false
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) return false
  // It's a relative/legacy path
  return true
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function migrateImageUrls() {
  const isWriteMode = process.argv.includes('--write')

  console.log('╔══════════════════════════════════════════════════════════╗')
  console.log(`║  Image URL Migration — ${isWriteMode ? '🔴 WRITE MODE' : '🟢 DRY RUN (preview only)'}`)
  console.log('╚══════════════════════════════════════════════════════════╝\n')

  try {
    await mongoose.connect(envConfig.mongoURL)
    console.log('✅ Kết nối MongoDB thành công\n')

    const db = mongoose.connection.db
    if (!db) throw new Error('Database connection not established')

    let totalUpdated = 0

    for (const target of TARGETS) {
      const collection = db.collection(target.collectionName)
      const count = await collection.countDocuments()
      console.log(`\n📦 ${target.collectionName} (${count} documents)`)

      // ── Process single string fields ──────────────────────────────
      for (const field of target.fields) {
        // Find docs where this field exists, is non-empty, and is NOT an absolute URL
        const filter = {
          [field]: {
            $exists: true,
            $ne: '',
            $not: { $regex: /^https?:\/\// }
          }
        }

        const affected = await collection.countDocuments(filter)

        if (affected === 0) {
          console.log(`   ✅ ${field}: OK (no legacy paths)`)
          continue
        }

        // Preview up to 5 examples
        const examples = await collection.find(filter, { projection: { _id: 1, [field]: 1 } }).limit(5).toArray()
        console.log(`   ⚠️  ${field}: ${affected} document(s) with legacy paths`)
        for (const doc of examples) {
          console.log(`      • ${doc._id} → "${(doc as any)[field]}"`)
        }

        if (isWriteMode) {
          const result = await collection.updateMany(filter, { $set: { [field]: '' } })
          console.log(`   🔧 Updated ${result.modifiedCount} document(s)`)
          totalUpdated += result.modifiedCount
        }
      }

      // ── Process array fields (e.g., images: string[]) ─────────────
      if (target.arrayFields) {
        for (const field of target.arrayFields) {
          // Find docs where the array contains at least one legacy path
          const filter = {
            [field]: {
              $elemMatch: {
                $ne: '',
                $not: { $regex: /^https?:\/\// }
              }
            }
          }

          const affected = await collection.countDocuments(filter)

          if (affected === 0) {
            console.log(`   ✅ ${field}[]: OK (no legacy paths in arrays)`)
            continue
          }

          console.log(`   ⚠️  ${field}[]: ${affected} document(s) with legacy paths in array`)

          if (isWriteMode) {
            // Pull all non-URL entries from the array
            const docs = await collection.find(filter).toArray()
            let arrayUpdated = 0

            for (const doc of docs) {
              const arr = (doc as any)[field] as string[]
              if (!Array.isArray(arr)) continue

              const cleaned = arr.filter((v: string) => !isLegacyPath(v))
              await collection.updateOne({ _id: doc._id }, { $set: { [field]: cleaned } })
              arrayUpdated++
            }

            console.log(`   🔧 Cleaned arrays in ${arrayUpdated} document(s)`)
            totalUpdated += arrayUpdated
          }
        }
      }
    }

    // ── Summary ──────────────────────────────────────────────────────
    console.log('\n' + '═'.repeat(55))
    if (isWriteMode) {
      console.log(`🎉 Migration hoàn tất! Tổng cộng đã cập nhật: ${totalUpdated} field(s)`)
      console.log('   Chạy lại dry-run để xác nhận không còn legacy paths.')
    } else {
      console.log('📋 Dry run hoàn tất. Chạy lại với --write để thực hiện migration.')
    }
  } catch (error) {
    console.error('❌ Lỗi khi chạy migration:', error)
  } finally {
    await mongoose.disconnect()
    console.log('\n🔌 Ngắt kết nối MongoDB')
  }
}

migrateImageUrls()
