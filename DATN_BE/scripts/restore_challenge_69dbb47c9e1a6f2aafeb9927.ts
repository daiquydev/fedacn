/**
 * Script: Khôi phục thử thách 69dbb47c9e1a6f2aafeb9927
 * Lý do: thử thách có is_deleted=true nhưng vẫn xuất hiện ở danh sách
 *        → reset về trạng thái active để hiển thị bình thường.
 */
import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config()

const CHALLENGE_ID = '69dbb47c9e1a6f2aafeb9927'

async function main() {
    await mongoose.connect(process.env.MONGODB_URL as string)
    console.log('✅ Connected to MongoDB')

    const db = mongoose.connection.db
    const col = db.collection('challenges')

    const before = await col.findOne({ _id: new mongoose.Types.ObjectId(CHALLENGE_ID) })
    if (!before) {
        console.error('❌ Không tìm thấy thử thách:', CHALLENGE_ID)
        process.exit(1)
    }

    console.log('📋 Trạng thái TRƯỚC:')
    console.log('  is_deleted:', before.is_deleted)
    console.log('  deleted_from_report_moderation:', before.deleted_from_report_moderation)
    console.log('  status:', before.status)
    console.log('  deleted_at:', before.deleted_at)

    const result = await col.updateOne(
        { _id: new mongoose.Types.ObjectId(CHALLENGE_ID) },
        {
            $set: {
                is_deleted: false,
                deleted_from_report_moderation: false,
                deleted_at: null,
                status: 'active'
            }
        }
    )

    console.log('\n🔄 Kết quả update:', result.modifiedCount, 'document(s) modified')

    const after = await col.findOne({ _id: new mongoose.Types.ObjectId(CHALLENGE_ID) })
    console.log('\n📋 Trạng thái SAU:')
    console.log('  is_deleted:', after?.is_deleted)
    console.log('  deleted_from_report_moderation:', after?.deleted_from_report_moderation)
    console.log('  status:', after?.status)
    console.log('  deleted_at:', after?.deleted_at)
    console.log('\n✅ Thử thách đã được khôi phục thành công!')

    await mongoose.disconnect()
}

main().catch(err => {
    console.error('❌ Lỗi:', err)
    process.exit(1)
})
