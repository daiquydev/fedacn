/**
 * Migration script: Đổi eventType 'offline' -> 'Ngoài trời', 'online' -> 'Trong nhà'
 * Run: node scripts/migrate-event-type.js
 */

const mongoose = require('mongoose')
require('dotenv').config()

const MONGODB_URL = process.env.MONGODB_URL

async function migrate() {
    try {
        console.log('🔌 Connecting to MongoDB...')
        await mongoose.connect(MONGODB_URL)
        console.log('✅ Connected!')

        const db = mongoose.connection.db
        const collection = db.collection('sport_events')

        // Đếm số documents cần đổi
        const offlineCount = await collection.countDocuments({ eventType: 'offline' })
        const onlineCount = await collection.countDocuments({ eventType: 'online' })

        console.log(`\n📊 Tìm thấy:`)
        console.log(`   - ${offlineCount} sự kiện có eventType = 'offline'`)
        console.log(`   - ${onlineCount} sự kiện có eventType = 'online'`)

        if (offlineCount === 0 && onlineCount === 0) {
            console.log('\n✅ Không có dữ liệu cũ cần migrate!')
            await mongoose.disconnect()
            return
        }

        // Cập nhật 'offline' -> 'Ngoài trời'
        if (offlineCount > 0) {
            const result1 = await collection.updateMany(
                { eventType: 'offline' },
                { $set: { eventType: 'Ngoài trời' } }
            )
            console.log(`\n✅ Đã đổi ${result1.modifiedCount} sự kiện: offline → Ngoài trời`)
        }

        // Cập nhật 'online' -> 'Trong nhà'
        if (onlineCount > 0) {
            const result2 = await collection.updateMany(
                { eventType: 'online' },
                { $set: { eventType: 'Trong nhà' } }
            )
            console.log(`✅ Đã đổi ${result2.modifiedCount} sự kiện: online → Trong nhà`)
        }

        // Verify
        const remainingOffline = await collection.countDocuments({ eventType: 'offline' })
        const remainingOnline = await collection.countDocuments({ eventType: 'online' })
        const ngoaiTroi = await collection.countDocuments({ eventType: 'Ngoài trời' })
        const trongNha = await collection.countDocuments({ eventType: 'Trong nhà' })

        console.log(`\n📊 Kết quả sau migration:`)
        console.log(`   - 'offline' còn lại: ${remainingOffline}`)
        console.log(`   - 'online' còn lại: ${remainingOnline}`)
        console.log(`   - 'Ngoài trời': ${ngoaiTroi}`)
        console.log(`   - 'Trong nhà': ${trongNha}`)

        if (remainingOffline === 0 && remainingOnline === 0) {
            console.log('\n🎉 Migration hoàn tất thành công!')
        } else {
            console.log('\n⚠️ Vẫn còn dữ liệu chưa được migrate!')
        }

        await mongoose.disconnect()
        console.log('🔌 Disconnected.')
    } catch (error) {
        console.error('❌ Migration failed:', error)
        process.exit(1)
    }
}

migrate()
