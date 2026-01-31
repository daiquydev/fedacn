import { Request, Response } from 'express'
import sportEventAttendanceService from '~/services/userServices/sportEventAttendance.services'

export const checkInController = async (req: Request, res: Response) => {
  try {
    const { eventId, sessionId } = req.params
    const userId = (req as any).decoded?.user_id

    const attendance = await sportEventAttendanceService.checkInService(sessionId, userId)

    return res.json({
      result: attendance,
      message: 'Checked in successfully'
    })
  } catch (error) {
    return res.status(400).json({
      message: (error as Error).message
    })
  }
}

export const checkOutController = async (req: Request, res: Response) => {
  try {
    const { eventId, sessionId } = req.params
    const userId = (req as any).decoded?.user_id

    const attendance = await sportEventAttendanceService.checkOutService(sessionId, userId)

    return res.json({
      result: attendance,
      message: 'Checked out successfully'
    })
  } catch (error) {
    return res.status(400).json({
      message: (error as Error).message
    })
  }
}

export const getUserAttendanceController = async (req: Request, res: Response) => {
  try {
    const { eventId, sessionId } = req.params
    const userId = (req as any).decoded?.user_id

    const attendance = await sportEventAttendanceService.getUserAttendanceService(sessionId, userId)

    return res.json({
      result: attendance,
      message: 'Get user attendance successfully'
    })
  } catch (error) {
    return res.status(500).json({
      message: (error as Error).message
    })
  }
}

export const getSessionAttendanceController = async (req: Request, res: Response) => {
  try {
    const { eventId, sessionId } = req.params

    const attendanceData = await sportEventAttendanceService.getSessionAttendanceService(sessionId)

    return res.json({
      result: attendanceData,
      message: 'Get session attendance successfully'
    })
  } catch (error) {
    return res.status(500).json({
      message: (error as Error).message
    })
  }
}

export const getAttendanceSummaryController = async (req: Request, res: Response) => {
  try {
    const { eventId, sessionId } = req.params

    const summary = await sportEventAttendanceService.getAttendanceSummaryService(sessionId)

    return res.json({
      result: summary,
      message: 'Get attendance summary successfully'
    })
  } catch (error) {
    return res.status(500).json({
      message: (error as Error).message
    })
  }
}

export const isCheckedInController = async (req: Request, res: Response) => {
  try {
    const { eventId, sessionId } = req.params
    const userId = (req as any).decoded?.user_id

    const isCheckedIn = await sportEventAttendanceService.isCheckedInService(sessionId, userId)

    return res.json({
      result: { isCheckedIn },
      message: 'Check-in status retrieved successfully'
    })
  } catch (error) {
    return res.status(500).json({
      message: (error as Error).message
    })
  }
}
