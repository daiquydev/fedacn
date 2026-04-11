import SportEventModel, { SportEvent } from '~/models/schemas/sportEvent.schema'
import SportEventSessionModel from '~/models/schemas/sportEventSession.schema'
import SportEventProgressModel from '~/models/schemas/sportEventProgress.schema'
import { Types } from 'mongoose'

class AdminSportEventService {
    // Get all sport events (admin can see all, including deleted)
    async getAllEventsAdmin({
        page = 1,
        limit = 10,
        search,
        category,
        eventType,
        status, // 'active' | 'deleted' | 'all'
        sortBy = 'newest'
    }: {
        page?: number
        limit?: number
        search?: string
        category?: string
        eventType?: string
        status?: string
        sortBy?: string
    }) {
        const condition: any = {}

        // Status filter
        if (status === 'deleted') {
            condition.isDeleted = true
        } else if (status === 'active' || !status || status === '') {
            condition.isDeleted = { $ne: true }
        }
        // status === 'all' => no filter

        if (search) {
            condition.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } }
            ]
        }

        if (category && category !== 'all') {
            condition.category = category
        }

        if (eventType && eventType !== 'all') {
            condition.eventType = eventType
        }

        const skip = (page - 1) * limit

        let query = SportEventModel.find(condition)
            .populate('createdBy', 'name avatar email')
            .populate('participants_ids', 'name avatar')
            .skip(skip)
            .limit(limit)

        if (sortBy === 'newest') {
            query = query.sort({ createdAt: -1 })
        } else if (sortBy === 'oldest') {
            query = query.sort({ createdAt: 1 })
        } else if (sortBy === 'popular') {
            query = query.sort({ participants: -1 })
        } else if (sortBy === 'earliest') {
            query = query.sort({ startDate: 1 })
        }

        const events = await query.exec()
        const total = await SportEventModel.countDocuments(condition)
        const totalPage = Math.ceil(total / limit)

        // Aggregate actual participants' progress from SportEventProgress
        const eventIds = events.map(e => e._id)
        const progressAgg = await SportEventProgressModel.aggregate([
            { $match: { eventId: { $in: eventIds } } },
            { $group: { _id: '$eventId', totalProgress: { $sum: '$value' } } }
        ])
        const progressMap = new Map(progressAgg.map(p => [p._id.toString(), p.totalProgress]))

        const eventsWithProgress = events.map(ev => {
            const evObj = ev.toObject ? ev.toObject() : ev
            const evId = (evObj._id as Types.ObjectId).toString()
            const progressSum = progressMap.get(evId) || 0
            const target = (evObj as any).targetValue || 0
            const progressPercent = target > 0 ? Math.min(Math.round((progressSum / target) * 100), 100) : 0
            return { ...evObj, progressTotal: progressSum, progressPercent }
        })

        return { events: eventsWithProgress, totalPage, page, limit, total }
    }

    // Get stats for admin dashboard
    async getEventStatsAdmin() {
        const [total, active, deleted, outdoor, indoor] = await Promise.all([
            SportEventModel.countDocuments({}),
            SportEventModel.countDocuments({ isDeleted: { $ne: true } }),
            SportEventModel.countDocuments({ isDeleted: true }),
            SportEventModel.countDocuments({ eventType: 'Ngoài trời', isDeleted: { $ne: true } }),
            SportEventModel.countDocuments({ eventType: 'Trong nhà', isDeleted: { $ne: true } })
        ])

        // Get events created in the last 30 days
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const recentCount = await SportEventModel.countDocuments({
            createdAt: { $gte: thirtyDaysAgo },
            isDeleted: { $ne: true }
        })

        return { total, active, deleted, outdoor, indoor, recentCount }
    }

    // Admin create event (bypass date validation)
    async createEventAdmin(
        data: Omit<SportEvent, '_id' | 'participants' | 'participants_ids' | 'isDeleted' | 'deletedAt' | 'createdAt' | 'updatedAt'>,
        adminId: string
    ) {
        const { name, description, detailedDescription, category, startDate, endDate, location, address, distance,
            maxParticipants, image, eventType, requirements, benefits, organizer, targetValue, targetUnit,
            difficulty, requireStrava } = data

        if (!name || !name.trim()) {
            throw new Error('Tên sự kiện không được để trống')
        }
        if (!category) throw new Error('Danh mục không được để trống')
        if (!startDate || !endDate) throw new Error('Ngày bắt đầu và kết thúc là bắt buộc')
        if (!location) throw new Error('Địa điểm không được để trống')
        if (!maxParticipants || maxParticipants < 1) throw new Error('Số người tham gia tối thiểu là 1')
        if (!eventType) throw new Error('Loại sự kiện là bắt buộc')

        const start = new Date(startDate)
        const end = new Date(endDate)

        if (end <= start) {
            throw new Error('Ngày kết thúc phải sau ngày bắt đầu')
        }

        const newEvent = new SportEventModel({
            name: name.trim(),
            description: description || '',
            detailedDescription: detailedDescription || '',
            category,
            startDate: start,
            endDate: end,
            location,
            address: address || '',
            distance: distance || '',
            maxParticipants,
            image: image || '',
            createdBy: new Types.ObjectId(adminId),
            eventType,
            requireStrava: eventType === 'Ngoài trời' ? Boolean(requireStrava) : false,
            participants: 0,
            participants_ids: [],
            requirements: requirements || '',
            benefits: benefits || '',
            organizer: organizer || '',
            targetValue: targetValue || undefined,
            targetUnit: targetUnit || '',
            difficulty: difficulty || ''
        })

        await newEvent.save()

        // Auto-generate sessions for Trong nhà events
        if (eventType === 'Trong nhà') {
            const sessions = []
            let currentDate = new Date(start)
            let sessionCount = 1

            while (currentDate <= end) {
                const sessionDate = new Date(currentDate)
                sessions.push({
                    eventId: newEvent._id,
                    sessionNumber: sessionCount,
                    title: `Buổi học ${sessionCount}`,
                    description: `Buổi học trực tuyến ngày ${sessionDate.toLocaleDateString('vi-VN')}`,
                    sessionDate,
                    durationHours: 2,
                    videoCallUrl: (location && typeof location === 'string' && location.startsWith('http')) ? location : '',
                    isCompleted: false
                })
                currentDate.setDate(currentDate.getDate() + 1)
                sessionCount++
            }

            if (sessions.length > 0) {
                await SportEventSessionModel.insertMany(sessions)
            }
        }

        return newEvent
    }

    // Admin update any event
    async updateEventAdmin(eventId: string, updateData: Partial<SportEvent>) {
        const existing = await SportEventModel.findById(eventId)
        if (!existing) throw new Error('Không tìm thấy sự kiện')

        // Prevent updating certain fields
        const { participants, participants_ids, createdBy, isDeleted, deletedAt, ...safeUpdateData } = updateData as any

        // Validate dates if provided
        if (safeUpdateData.startDate && safeUpdateData.endDate) {
            const start = new Date(safeUpdateData.startDate)
            const end = new Date(safeUpdateData.endDate)
            if (end <= start) throw new Error('Ngày kết thúc phải sau ngày bắt đầu')
        }

        const event = await SportEventModel.findByIdAndUpdate(
            eventId,
            { $set: safeUpdateData },
            { new: true }
        )
            .populate('createdBy', 'name avatar email')
            .populate('participants_ids', 'name avatar')

        if (!event) throw new Error('Không tìm thấy sự kiện')
        return event
    }

    // Admin soft delete
    async deleteEventAdmin(eventId: string) {
        const event = await SportEventModel.findByIdAndUpdate(
            eventId,
            { isDeleted: true, deletedAt: new Date() },
            { new: true }
        )
        if (!event) throw new Error('Không tìm thấy sự kiện')
        return event
    }

    // Admin restore soft-deleted event
    async restoreEventAdmin(eventId: string) {
        const event = await SportEventModel.findByIdAndUpdate(
            eventId,
            { isDeleted: false, deletedAt: null },
            { new: true }
        )
        if (!event) throw new Error('Không tìm thấy sự kiện')
        return event
    }

    // Admin hard delete (permanent)
    async hardDeleteEventAdmin(eventId: string) {
        const event = await SportEventModel.findByIdAndDelete(eventId)
        if (!event) throw new Error('Không tìm thấy sự kiện')
        // Also delete related sessions
        await SportEventSessionModel.deleteMany({ eventId: new Types.ObjectId(eventId) })
        return event
    }
}

const adminSportEventService = new AdminSportEventService()
export default adminSportEventService
