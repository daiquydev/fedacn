/**
 * Migration: Tính lại calories đúng cho tất cả ActivityTracking + Progress outdoor
 *
 * Root cause: seedEventProgress.ts dùng công thức sai:
 *   Math.floor(distance * 60) + random (60 kcal/km)
 * Đúng: Chạy bộ = 65 kcal/km, Đạp xe = 30 kcal/km (từ SportCategory Admin)
 *
 * Lưu ý: Real GPS data từ user thực tế không bị ảnh hưởng vì frontend tự tính
 * và gửi lên backend. Script này chỉ sửa seed/mock data.
 */

import 'dotenv/config'
import mongoose from 'mongoose'

import ActivityTrackingModel from '../src/models/schemas/activityTracking.schema'
import SportEventProgressModel from '../src/models/schemas/sportEventProgress.schema'
import SportEventModel from '../src/models/schemas/sportEvent.schema'
import SportCategoryModel from '../src/models/schemas/sportCategory.schema'

const DEFAULT_KCAL_PER_KM = 60

async function getKcalPerKm(category: string): Promise<number> {
    // Outdoor categories: kcal_per_unit là kcal/km
    const cat = await SportCategoryModel.findOne({ name: category, isDeleted: { $ne: true } })
    if (cat && cat.kcal_per_unit > 0) return cat.kcal_per_unit
    return DEFAULT_KCAL_PER_KM
}

async function main() {
    console.log('🔗 Connecting to MongoDB...')
    await mongoose.connect(process.env.MONGODB_URL as string)
    console.log('✅ Connected')

    const events = await SportEventModel.find({ eventType: 'Ngoài trời' })
    console.log(`\n📋 Tìm thấy ${events.length} Outdoor events`)

    let totalActUpdated = 0
    let totalProgUpdated = 0

    for (const event of events) {
        const kcalPerKm = await getKcalPerKm(event.category || '')
        console.log(`\n🎯 Event: "${event.name}" | Category: ${event.category} | Rate: ${kcalPerKm} kcal/km`)

        // --- Sửa ActivityTracking records ---
        const activities = await ActivityTrackingModel.find({
            eventId: event._id,
            status: 'completed',
            totalDistance: { $gt: 0 }
        })

        console.log(`   🏃 Tìm thấy ${activities.length} activities`)

        for (const act of activities) {
            const distanceKm = act.totalDistance / 1000
            const correctCalories = Math.round(distanceKm * kcalPerKm)
            const oldCalories = act.calories || 0

            if (correctCalories === oldCalories) continue

            const diff = correctCalories - oldCalories
            console.log(
                `   → Activity ${act._id} | ${distanceKm.toFixed(2)}km | ` +
                `${oldCalories} → ${correctCalories} kcal (${diff >= 0 ? '+' : ''}${diff})`
            )

            await ActivityTrackingModel.findByIdAndUpdate(act._id, {
                calories: correctCalories
            })
            totalActUpdated++
        }

        // --- Sửa SportEventProgress records (source = manual/auto) ---
        const progressEntries = await SportEventProgressModel.find({
            eventId: event._id,
            $or: [
                { notes: /Auto generated/i },
                { source: 'manual' },
                { distance: { $gt: 0 } }
            ]
        })

        for (const prog of progressEntries) {
            const distanceKm = prog.distance || prog.value || 0
            if (distanceKm <= 0) continue

            const correctCalories = Math.round(distanceKm * kcalPerKm)
            if (correctCalories === (prog.calories || 0)) continue

            console.log(
                `   → Progress ${prog._id} | ${distanceKm}km | ` +
                `calories: ${prog.calories} → ${correctCalories}`
            )
            await SportEventProgressModel.findByIdAndUpdate(prog._id, {
                calories: correctCalories
            })
            totalProgUpdated++
        }
    }

    console.log(`\n✅ Hoàn thành!`)
    console.log(`   ActivityTracking updated: ${totalActUpdated}`)
    console.log(`   Progress records updated: ${totalProgUpdated}`)

    await mongoose.disconnect()
    console.log('🔌 Disconnected')
}

main().catch(err => {
    console.error('❌ Error:', err)
    process.exit(1)
})
