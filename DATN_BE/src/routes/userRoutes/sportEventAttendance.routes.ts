import { Router } from 'express'
import {
  checkInController,
  checkOutController,
  getUserAttendanceController,
  getSessionAttendanceController,
  getAttendanceSummaryController,
  isCheckedInController
} from '~/controllers/userControllers/sportEventAttendance.controller'
import { verifyToken } from '~/middlewares/authUser.middleware'
import { wrapRequestHandler } from '~/utils/handler'

const sportEventAttendanceRouter = Router({ mergeParams: true })

// All attendance routes require authentication
sportEventAttendanceRouter.post('/check-in', verifyToken, wrapRequestHandler(checkInController))
sportEventAttendanceRouter.post('/check-out', verifyToken, wrapRequestHandler(checkOutController))
sportEventAttendanceRouter.get('/my-attendance', verifyToken, wrapRequestHandler(getUserAttendanceController))
sportEventAttendanceRouter.get('/is-checked-in', verifyToken, wrapRequestHandler(isCheckedInController))
sportEventAttendanceRouter.get('/attendance', wrapRequestHandler(getSessionAttendanceController))
sportEventAttendanceRouter.get('/summary', wrapRequestHandler(getAttendanceSummaryController))

export default sportEventAttendanceRouter
