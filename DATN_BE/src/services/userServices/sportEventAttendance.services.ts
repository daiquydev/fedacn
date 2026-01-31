import SportEventAttendanceModel, { SportEventAttendance } from '~/models/schemas/sportEventAttendance.schema'
import SportEventSessionModel from '~/models/schemas/sportEventSession.schema'

class SportEventAttendanceService {
  // Check in to a session
  async checkInService(sessionId: string, userId: string) {
    // Verify session exists
    const session = await SportEventSessionModel.findById(sessionId)
    if (!session) {
      throw new Error('Session not found')
    }

    // Check if session is currently active
    const now = new Date()
    const sessionStart = new Date(session.sessionDate)
    const sessionEnd = new Date(sessionStart.getTime() + session.durationHours * 60 * 60 * 1000)

    if (now < sessionStart) {
      throw new Error('Session has not started yet')
    }

    if (now > sessionEnd) {
      throw new Error('Session has already ended')
    }

    // Find or create attendance record
    let attendance = await SportEventAttendanceModel.findOne({
      sessionId,
      userId
    })

    if (!attendance) {
      // First check-in - create new attendance record
      attendance = new SportEventAttendanceModel({
        sessionId,
        userId,
        checkInTime: now,
        totalDuration: 0,
        checkInHistory: [{ checkInTime: now }]
      })
    } else {
      // Subsequent check-in - verify they're not already checked in
      const lastRecord = attendance.checkInHistory[attendance.checkInHistory.length - 1]
      if (lastRecord && !lastRecord.checkOutTime) {
        throw new Error('You are already checked in')
      }

      // Add new check-in record
      attendance.checkInHistory.push({ checkInTime: now })
    }

    await attendance.save()
    return attendance
  }

  // Check out from a session
  async checkOutService(sessionId: string, userId: string) {
    const attendance = await SportEventAttendanceModel.findOne({
      sessionId,
      userId
    })

    if (!attendance) {
      throw new Error('No check-in record found')
    }

    // Find the last check-in record without a check-out
    const lastRecord = attendance.checkInHistory[attendance.checkInHistory.length - 1]
    if (!lastRecord || lastRecord.checkOutTime) {
      throw new Error('You are not currently checked in')
    }

    // Update check-out time
    const now = new Date()
    lastRecord.checkOutTime = now

    // Calculate duration for this check-in/check-out pair
    const durationMinutes = Math.floor(
      (now.getTime() - lastRecord.checkInTime.getTime()) / (1000 * 60)
    )

    // Update total duration
    attendance.totalDuration += durationMinutes
    attendance.checkOutTime = now

    await attendance.save()
    return attendance
  }

  // Get attendance record for a user in a session
  async getUserAttendanceService(sessionId: string, userId: string) {
    const attendance = await SportEventAttendanceModel.findOne({
      sessionId,
      userId
    })

    if (!attendance) {
      return null
    }

    return attendance
  }

  // Get all attendance records for a session
  async getSessionAttendanceService(sessionId: string) {
    const attendanceRecords = await SportEventAttendanceModel.find({ sessionId })
      .populate('userId', 'name avatar')
      .sort({ totalDuration: -1 })
      .exec()

    return {
      attendanceRecords,
      totalAttendees: attendanceRecords.length
    }
  }

  // Get attendance summary for a session
  async getAttendanceSummaryService(sessionId: string) {
    const session = await SportEventSessionModel.findById(sessionId)
    if (!session) {
      throw new Error('Session not found')
    }

    const attendanceRecords = await SportEventAttendanceModel.find({ sessionId })

    const totalAttendees = attendanceRecords.length
    const averageDuration =
      totalAttendees > 0
        ? attendanceRecords.reduce((sum, record) => sum + record.totalDuration, 0) / totalAttendees
        : 0

    // Calculate attendance rate (if we have max participants)
    const sessionDuration = session.durationHours * 60 // in minutes
    const fullAttendance = attendanceRecords.filter(
      (record) => record.totalDuration >= sessionDuration * 0.8
    ).length

    return {
      sessionId,
      sessionTitle: session.title,
      sessionDate: session.sessionDate,
      totalAttendees,
      fullAttendance,
      averageDuration: Math.round(averageDuration),
      sessionDuration
    }
  }

  // Check if user is currently checked in
  async isCheckedInService(sessionId: string, userId: string): Promise<boolean> {
    const attendance = await SportEventAttendanceModel.findOne({
      sessionId,
      userId
    })

    if (!attendance || attendance.checkInHistory.length === 0) {
      return false
    }

    const lastRecord = attendance.checkInHistory[attendance.checkInHistory.length - 1]
    return lastRecord && !lastRecord.checkOutTime
  }
}

const sportEventAttendanceService = new SportEventAttendanceService()
export default sportEventAttendanceService
