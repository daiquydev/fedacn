import mongoose, { Types } from 'mongoose'

export interface CheckInRecord {
  checkInTime: Date
  checkOutTime?: Date
}

export interface SportEventAttendance {
  _id?: Types.ObjectId
  sessionId: Types.ObjectId
  userId: Types.ObjectId
  checkInTime?: Date
  checkOutTime?: Date
  totalDuration: number // in minutes
  checkInHistory: CheckInRecord[]
  createdAt?: Date
  updatedAt?: Date
}

const CheckInRecordSchema = new mongoose.Schema<CheckInRecord>(
  {
    checkInTime: { type: Date, required: true },
    checkOutTime: { type: Date }
  },
  { _id: false }
)

const SportEventAttendanceSchema = new mongoose.Schema<SportEventAttendance>(
  {
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'sport_event_sessions', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    checkInTime: { type: Date },
    checkOutTime: { type: Date },
    totalDuration: { type: Number, default: 0 },
    checkInHistory: [CheckInRecordSchema]
  },
  {
    timestamps: true,
    collection: 'sport_event_attendance'
  }
)

// Create compound index for efficient querying
SportEventAttendanceSchema.index({ sessionId: 1, userId: 1 }, { unique: true })
SportEventAttendanceSchema.index({ sessionId: 1 })

const SportEventAttendanceModel = mongoose.model('sport_event_attendance', SportEventAttendanceSchema)

export default SportEventAttendanceModel
