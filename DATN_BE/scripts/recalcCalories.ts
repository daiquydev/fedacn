/**
 * Migration: Tính lại caloriesBurned đúng cho tất cả VideoSession + Progress
 *
 * Root cause: seedIndoorEventProgress.ts dùng công thức sai:
 *   Math.round(activeSeconds / 60 * 5 + Math.random() * 20)
 * → Sai rate (5 kcal/phút thay vì lấy từ SportCategory) + thêm random 0-20 kcal
 *
 * Công thức đúng: Math.round(activeSeconds / 60 * kcalPerMinute)
 * Ví dụ Yoga: 4 kcal/phút → 48 phút → 192 kcal (không phải 240)
 */

import 'dotenv/config'
import mongoose from 'mongoose'

import SportEventVideoSessionModel from '../src/models/schemas/sportEventVideoSession.schema'
import SportEventProgressModel from '../src/models/schemas/sportEventProgress.schema'
import SportEventModel from '../src/models/schemas/sportEvent.schema'
import SportCategoryModel from '../src/models/schemas/sportCategory.schema'

const DEFAULT_KCAL_PER_MINUTE = 4

async function getKcalPerMinute(category: string): Promise<number> {
    const cat = await SportCategoryModel.findOne({ name: category, isDeleted: { $ne: true } })
    if (cat && cat.kcal_per_unit > 0) return cat.kcal_per_unit
    return DEFAULT_KCAL_PER_MINUTE
}

async function main() {
    console.log('🔗 Connecting to MongoDB...')
    await mongoose.connect(process.env.MONGODB_URL as string)
    console.log('✅ Connected')

    // Lấy tất cả events
    const events = await SportEventModel.find({ eventType: 'Trong nhà' })
    console.log(`\n📋 Tìm thấy ${events.length} Indoor events`)

    let totalVsUpdated = 0
    let totalProgUpdated = 0

    for (const event of events) {
        const kcalPerMinute = await getKcalPerMinute(event.category || '')
        console.log(`\n🎯 Event: "${event.name}" | Category: ${event.category} | Rate: ${kcalPerMinute} kcal/phút`)

        // Lấy tất cả VideoSessions của event này
        const sessions = await SportEventVideoSessionModel.find({
            eventId: event._id,
            status: 'ended',
            activeSeconds: { $gt: 0 }
        })

        console.log(`   📹 Tìm thấy ${sessions.length} sessions`)

        for (const vs of sessions) {
            const correctCalories = Math.round((vs.activeSeconds / 60) * kcalPerMinute)
            const oldCalories = vs.caloriesBurned || 0

            if (correctCalories === oldCalories) continue // không cần update

            const diff = correctCalories - oldCalories
            console.log(
                `   → Session ${vs._id} | ${Math.round(vs.activeSeconds / 60)}ph | ` +
                `${oldCalories} → ${correctCalories} kcal (${diff >= 0 ? '+' : ''}${diff})`
            )

            // 1. Cập nhật VideoSession
            await SportEventVideoSessionModel.findByIdAndUpdate(vs._id, {
                caloriesBurned: correctCalories
            })
            totalVsUpdated++

            // 2. Tìm và cập nhật Progress record liên kết (nếu có)
            if (vs.progressId) {
                const prog = await SportEventProgressModel.findById(vs.progressId)
                if (prog) {
                    const unit = (event.targetUnit || '').toLowerCase()
                    const isKcalTarget = unit.includes('kcal') || unit.includes('calo')

                    await SportEventProgressModel.findByIdAndUpdate(vs.progressId, {
                        calories: correctCalories,
                        // Nếu event tính theo kcal, cập nhật cả value
                        ...(isKcalTarget ? { value: correctCalories } : {})
                    })
                    totalProgUpdated++
                }
            } else {
                // Fallback: tìm progress khớp với activeSeconds và userId trong +/-5s
                const prog = await SportEventProgressModel.findOne({
                    eventId: event._id,
                    userId: vs.userId,
                    source: 'video_call',
                    activeSeconds: { $gte: vs.activeSeconds - 5, $lte: vs.activeSeconds + 5 },
                    date: { $gte: new Date(vs.joinedAt!.getTime() - 60000), $lte: new Date(vs.joinedAt!.getTime() + 120000 + vs.totalSeconds * 1000) }
                })
                if (prog) {
                    const unit = (event.targetUnit || '').toLowerCase()
                    const isKcalTarget = unit.includes('kcal') || unit.includes('calo')
                    await SportEventProgressModel.findByIdAndUpdate(prog._id, {
                        calories: correctCalories,
                        ...(isKcalTarget ? { value: correctCalories } : {})
                    })
                    totalProgUpdated++
                }
            }
        }

        // Xử lý Progress records được tạo bởi seed script (notes chứa "Auto generated")
        // mà không có progressId trên VideoSession
        const autoGenProgress = await SportEventProgressModel.find({
            eventId: event._id,
            source: 'video_call',
            $or: [
                { notes: /Auto generated/i },
                { activeSeconds: { $gt: 0 } }
            ]
        })

        for (const prog of autoGenProgress) {
            if (!prog.activeSeconds || prog.activeSeconds <= 0) continue
            const correctCalories = Math.round((prog.activeSeconds / 60) * kcalPerMinute)
            if (correctCalories === (prog.calories || 0)) continue

            const unit = (event.targetUnit || '').toLowerCase()
            const isKcalTarget = unit.includes('kcal') || unit.includes('calo')
            console.log(
                `   → Progress ${prog._id} | ${Math.round(prog.activeSeconds / 60)}ph | ` +
                `calories: ${prog.calories} → ${correctCalories}`
            )
            await SportEventProgressModel.findByIdAndUpdate(prog._id, {
                calories: correctCalories,
                ...(isKcalTarget ? { value: correctCalories } : {})
            })
            totalProgUpdated++
        }
    }

    console.log(`\n✅ Hoàn thành!`)
    console.log(`   VideoSessions updated: ${totalVsUpdated}`)
    console.log(`   Progress records updated: ${totalProgUpdated}`)

    await mongoose.disconnect()
    console.log('🔌 Disconnected')
}

main().catch(err => {
    console.error('❌ Error:', err)
    process.exit(1)
})
