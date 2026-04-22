import SportEventSessionModel from '~/models/schemas/sportEventSession.schema'
import { Types } from 'mongoose'

/**
 * Gắn buổi học lịch (sport_event_sessions) khi join video:
 * - Nếu client gửi sessionId hợp lệ thuộc sự kiện → dùng.
 * - Nếu không: tự chọn buổi đang diễn ra (now nằm trong [sessionDate, sessionDate + duration)).
 */
export async function resolveIndoorSessionIdForJoin(
    eventId: string,
    clientSessionId: string | undefined,
    now: Date
): Promise<Types.ObjectId | undefined> {
    const eid = new Types.ObjectId(eventId)
    if (clientSessionId && Types.ObjectId.isValid(clientSessionId)) {
        const byClient = await SportEventSessionModel.findOne({
            _id: new Types.ObjectId(clientSessionId),
            eventId: eid
        })
        if (byClient) return byClient._id as Types.ObjectId
    }

    const sessions = await SportEventSessionModel.find({ eventId: eid }).sort({ sessionDate: 1 }).exec()
    const t = now.getTime()
    for (const s of sessions) {
        const start = new Date(s.sessionDate).getTime()
        const hours = Math.max(Number(s.durationHours) || 1, 1 / 60)
        const end = start + hours * 3600 * 1000
        if (t >= start && t <= end) return s._id as Types.ObjectId
    }
    return undefined
}

/**
 * Giới hạn active/total seconds theo thời gian treo tường (server) để chống gửi số ảo từ client.
 */
export const VIDEO_SESSION_END_SKEW_SECONDS = 15

export function capVideoSessionSeconds(
    joinedAt: Date,
    endedAt: Date,
    activeSeconds: number,
    totalSeconds: number,
    skewSeconds: number = VIDEO_SESSION_END_SKEW_SECONDS
): { safeTotalSeconds: number; safeActiveSeconds: number; maxElapsed: number } {
    const elapsedMs = endedAt.getTime() - joinedAt.getTime()
    const maxElapsed = Math.max(0, Math.floor(elapsedMs / 1000) + skewSeconds)
    const safeTotalSeconds = Math.min(Math.max(Number(totalSeconds) || 0, Number(activeSeconds) || 0, 0), maxElapsed)
    const safeActiveSeconds = Math.min(Math.max(Number(activeSeconds) || 0, 0), safeTotalSeconds)
    return { safeTotalSeconds, safeActiveSeconds, maxElapsed }
}
