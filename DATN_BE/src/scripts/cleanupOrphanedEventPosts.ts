/**
 * Script: cleanupOrphanedEventPosts.ts
 *
 * Xóa tất cả các bài đăng cộng đồng (posts) có chứa marker [sport-event:<id>]
 * trỏ đến các sự kiện thể thao đã bị xóa cứng khỏi database.
 *
 * Chạy: npx ts-node ./src/scripts/cleanupOrphanedEventPosts.ts
 */

import mongoose from 'mongoose'
import { config } from 'dotenv'
config()

import PostModel from '../models/schemas/post.schema'
import SportEventModel from '../models/schemas/sportEvent.schema'
import { envConfig } from '../constants/config'

async function cleanupOrphanedEventPosts() {
    try {
        await mongoose.connect(envConfig.mongoURL)
        console.log('✅ Đã kết nối MongoDB')

        // 1. Tìm tất cả posts có marker [sport-event:...]
        const postsWithEventMaker = await PostModel.find({
            content: { $regex: /\[sport-event:[a-f0-9]{24}\]/i }
        })

        console.log(`\n🔍 Tìm thấy ${postsWithEventMaker.length} bài post có chứa marker sự kiện thể thao`)

        if (postsWithEventMaker.length === 0) {
            console.log('✅ Không có post nào cần dọn dẹp')
            return
        }

        // 2. Kiểm tra từng post xem event ID có còn tồn tại không
        let deletedCount = 0
        let validCount = 0
        const orphanedIds: mongoose.Types.ObjectId[] = []

        for (const post of postsWithEventMaker) {
            const match = post.content?.match(/\[sport-event:([a-f0-9]{24})\]/i)
            if (!match) continue

            const eventId = match[1]

            // Kiểm tra xem event còn tồn tại và chưa bị soft-delete không
            const event = await SportEventModel.findById(eventId)

            if (!event) {
                console.log(`❌ Post "${post._id}" → Event "${eventId}" không còn tồn tại (đã xóa cứng)`)
                orphanedIds.push(post._id as mongoose.Types.ObjectId)
            } else if (event.isDeleted) {
                console.log(`🗑️  Post "${post._id}" → Event "${eventId}" đã bị xóa mềm`)
                orphanedIds.push(post._id as mongoose.Types.ObjectId)
            } else {
                console.log(`✅ Post "${post._id}" → Event "${eventId}" còn hợp lệ`)
                validCount++
            }
        }

        // 3. Xóa các post có event không còn tồn tại
        if (orphanedIds.length > 0) {
            console.log(`\n🗑️  Xóa ${orphanedIds.length} bài post có event không còn tồn tại...`)
            const result = await PostModel.deleteMany({ _id: { $in: orphanedIds } })
            console.log(`✅ Đã xóa ${result.deletedCount} bài post`)
            deletedCount = result.deletedCount
        }

        console.log('\n📊 Tóm tắt:')
        console.log(`   - Tổng post có marker: ${postsWithEventMaker.length}`)
        console.log(`   - Post hợp lệ (còn event): ${validCount}`)
        console.log(`   - Post đã xóa (event không còn): ${deletedCount}`)
    } catch (error) {
        console.error('❌ Lỗi khi chạy script:', error)
    } finally {
        await mongoose.disconnect()
        console.log('\n🔌 Ngắt kết nối MongoDB')
    }
}

cleanupOrphanedEventPosts()
