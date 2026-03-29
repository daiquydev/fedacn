import SportEventVideoSessionModel from '~/models/schemas/sportEventVideoSession.schema'
import SportEventProgressModel from '~/models/schemas/sportEventProgress.schema'
import SportEventModel from '~/models/schemas/sportEvent.schema'
import SportEventSessionModel from '~/models/schemas/sportEventSession.schema'
import SportCategoryModel from '~/models/schemas/sportCategory.schema'
import { Types } from 'mongoose'

// ==================== CALORIE CALCULATION ====================
// Lấy kcal_per_unit từ SportCategory (kcal/phút cho Trong nhà)
// Fallback 4 kcal/phút nếu không tìm thấy danh mục
const DEFAULT_KCAL_PER_MINUTE = 4

async function getKcalPerMinute(category: string): Promise<number> {
    const cat = await SportCategoryModel.findOne({ name: category, isDeleted: { $ne: true } })
    if (cat && cat.kcal_per_unit > 0) return cat.kcal_per_unit
    return DEFAULT_KCAL_PER_MINUTE
}

function calcCalories(kcalPerMinute: number, activeSeconds: number): number {
    return Math.round((activeSeconds / 60) * kcalPerMinute)
}

// Derive progress value based on event's targetUnit
function calcProgressValue(targetUnit: string, activeSeconds: number, caloriesBurned: number): number {
    const unit = (targetUnit || '').toLowerCase().trim()
    if (unit === 'phút' || unit === 'minutes' || unit === 'min') {
        return Math.round(activeSeconds / 60)
    }
    if (unit === 'giờ' || unit === 'hours' || unit === 'h') {
        return Math.round((activeSeconds / 3600) * 10) / 10 // 1 decimal
    }
    if (unit === 'buổi' || unit === 'sessions' || unit === 'session') {
        return 1
    }
    if (unit === 'kcal' || unit === 'calo' || unit === 'calories' || unit === 'cal') {
        return caloriesBurned
    }
    // Default: return minutes
    return Math.round(activeSeconds / 60)
}

class SportEventVideoSessionService {
    // ─── Join Video Session ─────────────────────────────────────────────────────
    async joinVideoSessionService(eventId: string, userId: string, sessionId?: string) {
        // 1. Verify event exists and user is a participant
        const event = await SportEventModel.findById(eventId)
        if (!event) throw new Error('Sự kiện không tồn tại')

        const isParticipant = event.participants_ids?.some((id) => id.toString() === userId)
        if (!isParticipant) {
            throw new Error('Bạn cần tham gia sự kiện trước khi vào video call')
        }

        // 2. Auto-end any existing active session for this user/event (edge case: page reload)
        const existingActive = await SportEventVideoSessionModel.findOne({
            eventId,
            userId,
            status: 'active'
        })

        if (existingActive) {
            // Force-end the stale session without creating progress (totalSeconds = 0 means abandoned)
            await SportEventVideoSessionModel.findByIdAndUpdate(existingActive._id, {
                status: 'ended',
                endedAt: new Date(),
                totalSeconds: 0,
                activeSeconds: 0,
                caloriesBurned: 0
            })
        }

        // 3. Optionally validate sessionId
        let validSessionId: Types.ObjectId | undefined
        if (sessionId) {
            const session = await SportEventSessionModel.findOne({ _id: sessionId, eventId })
            if (session) validSessionId = session._id as Types.ObjectId
        }

        // 4. Create new active video session record
        const videoSession = await SportEventVideoSessionModel.create({
            eventId: new Types.ObjectId(eventId),
            sessionId: validSessionId || null,
            userId: new Types.ObjectId(userId),
            joinedAt: new Date(),
            status: 'active',
            activeSeconds: 0,
            totalSeconds: 0,
            caloriesBurned: 0
        })

        return videoSession
    }

    // ─── End Video Session ──────────────────────────────────────────────────────
    async endVideoSessionService(
        eventId: string,
        vsId: string,
        userId: string,
        activeSeconds: number,
        totalSeconds: number,
        screenshots: string[] = []
    ) {
        // 1. Atomic lock: chỉ cho phép end session khi status = 'active'
        // Dùng findOneAndUpdate thay vì find + update riêng biệt để tránh race condition
        // (hai request gần nhau cùng thấy status = 'active' rồi cả hai tạo progress)
        const lockedSession = await SportEventVideoSessionModel.findOneAndUpdate(
            { _id: vsId, eventId, userId, status: 'active' },
            { status: 'ending' },  // trạng thái trung gian để lock
            { new: false }         // trả về document TRƯỚC khi update
        )

        if (!lockedSession) {
            throw new Error('Không tìm thấy video session đang hoạt động')
        }

        // 2. Fetch event for category and targetUnit
        const event = await SportEventModel.findById(eventId)
        if (!event) throw new Error('Sự kiện không tồn tại')

        // 3. Calculate derived values
        const safeTotalSeconds = Math.max(totalSeconds, activeSeconds, 0)
        const safeActiveSeconds = Math.min(activeSeconds, safeTotalSeconds)
        const kcalPerMinute = await getKcalPerMinute(event.category || '')
        const caloriesBurned = calcCalories(kcalPerMinute, safeActiveSeconds)
        const progressValue = calcProgressValue(event.targetUnit || '', safeActiveSeconds, caloriesBurned)

        // 4. Auto-create progress entry (chỉ chạy khi lock thành công)
        const progress = await SportEventProgressModel.create({
            eventId: new Types.ObjectId(eventId),
            userId: new Types.ObjectId(userId),
            date: new Date(),
            value: progressValue,
            unit: event.targetUnit || 'phút',
            calories: caloriesBurned,
            source: 'video_call',
            sessionId: lockedSession.sessionId || null,
            activeSeconds: safeActiveSeconds,
            notes: `Video call — ${Math.round(safeActiveSeconds / 60)} phút tham gia tích cực`
        })

        // 5. Finalize: cập nhật session về 'ended' với đầy đủ thông tin
        const updatedVS = await SportEventVideoSessionModel.findByIdAndUpdate(
            vsId,
            {
                status: 'ended',
                endedAt: new Date(),
                activeSeconds: safeActiveSeconds,
                totalSeconds: safeTotalSeconds,
                caloriesBurned,
                screenshots: screenshots.slice(0, 5),
                progressId: progress._id
            },
            { new: true }
        )

        return {
            videoSession: updatedVS,
            progress,
            summary: {
                activeSeconds: safeActiveSeconds,
                totalSeconds: safeTotalSeconds,
                caloriesBurned,
                progressValue,
                progressUnit: event.targetUnit || 'phút',
                aiAccuracyPercent: safeTotalSeconds > 0
                    ? Math.round((safeActiveSeconds / safeTotalSeconds) * 100)
                    : 0,
                screenshots: screenshots.slice(0, 5)
            }
        }
    }

    // ─── Soft-delete a Video Session ────────────────────────────────────────────
    async softDeleteVideoSessionService(eventId: string, vsId: string, userId: string) {
        const session = await SportEventVideoSessionModel.findOne({
            _id: vsId,
            eventId,
            userId,
            is_deleted: { $ne: true }
        })
        if (!session) throw new Error('Buổi học không tồn tại')

        session.is_deleted = true
        await session.save()

        // Also soft-delete related sport_event_progress
        if (session.progressId) {
            await SportEventProgressModel.updateOne(
                { _id: session.progressId },
                { is_deleted: true }
            )
        }

        return session
    }

    // ─── Get Video Sessions (history) ──────────────────────────────────────────
    async getVideoSessionsService(eventId: string, userId: string) {
        const sessions = await SportEventVideoSessionModel
            .find({ eventId, userId, is_deleted: { $ne: true } })
            .populate('sessionId', 'title sessionNumber sessionDate')
            .sort({ joinedAt: -1 })
            .exec()

        return sessions
    }

    // ─── Get Active Video Session ───────────────────────────────────────────────
    async getActiveVideoSessionService(eventId: string, userId: string) {
        const session = await SportEventVideoSessionModel.findOne({
            eventId,
            userId,
            status: 'active'
        })

        return session
    }

    // ─── Aggregate stats ────────────────────────────────────────────────────────
    async getVideoSessionStatsService(eventId: string, userId: string) {
        const stats = await SportEventVideoSessionModel.aggregate([
            {
                $match: {
                    eventId: new Types.ObjectId(eventId),
                    userId: new Types.ObjectId(userId),
                    status: 'ended',
                    is_deleted: { $ne: true }
                }
            },
            {
                $group: {
                    _id: null,
                    totalSessions: { $sum: 1 },
                    totalActiveSeconds: { $sum: '$activeSeconds' },
                    totalTotalSeconds: { $sum: '$totalSeconds' },
                    totalCalories: { $sum: '$caloriesBurned' }
                }
            }
        ])

        if (stats.length === 0) {
            return {
                totalSessions: 0,
                totalActiveSeconds: 0,
                totalTotalSeconds: 0,
                totalCalories: 0
            }
        }

        return stats[0]
    }
}

const sportEventVideoSessionService = new SportEventVideoSessionService()
export default sportEventVideoSessionService
