import moment from 'moment-timezone'

/** Múi giờ Việt Nam — dùng thống nhất cho thử thách & sự kiện thể thao */
export const TZ_VN = 'Asia/Ho_Chi_Minh'

/** Moment theo giờ VN; không truyền arg = thời điểm hiện tại tại VN */
export function vnMoment(input) {
  if (input == null || input === '') return moment.tz(TZ_VN)
  const m = moment(input)
  return m.isValid() ? m.tz(TZ_VN) : moment.tz(TZ_VN)
}

export function getTodayDateVN() {
  return vnMoment().format('YYYY-MM-DD')
}

/** ISO từ API → YYYY-MM-DD (input type="date") */
export function isoToDateInputVN(isoStr) {
  if (isoStr == null || isoStr === '') return ''
  const m = vnMoment(isoStr)
  return m.isValid() ? m.format('YYYY-MM-DD') : ''
}

/** ISO từ API → HH:mm */
export function isoToTimeInputVN(isoStr) {
  if (isoStr == null || isoStr === '') return ''
  const m = vnMoment(isoStr)
  return m.isValid() ? m.format('HH:mm') : ''
}

export function formatDateVN(value, pattern = 'DD/MM/YYYY') {
  const m = vnMoment(value)
  return m.isValid() ? m.format(pattern) : ''
}

/** Thử thách: nửa đêm (VN) → ISO UTC */
export function challengeDateToIsoVN(dateISO) {
  if (!dateISO || dateISO.length !== 10) return null
  return moment.tz(dateISO, 'YYYY-MM-DD', TZ_VN).startOf('day').toISOString()
}

/** Sự kiện: ngày + giờ (VN) → ISO UTC */
export function sportDateTimeToIsoVN(dateISO, timeStr = '00:00') {
  if (!dateISO || dateISO.length !== 10) return null
  return moment.tz(`${dateISO} ${timeStr}`, 'YYYY-MM-DD HH:mm', TZ_VN).toISOString()
}

export function isValidDateISO(val) {
  if (!val || val.length !== 10) return false
  return moment.tz(val, 'YYYY-MM-DD', TZ_VN).isValid()
}

export function isPastDateVN(dateISO) {
  if (!isValidDateISO(dateISO)) return false
  const d = moment.tz(dateISO, 'YYYY-MM-DD', TZ_VN).startOf('day')
  return d.isBefore(vnMoment().startOf('day'))
}

export function isTodayVN(dateISO) {
  if (!isValidDateISO(dateISO)) return false
  return dateISO === getTodayDateVN()
}

/** So sánh hai chuỗi YYYY-MM-DD theo lịch VN; âm = a trước b */
export function compareDateInputVN(a, b) {
  if (!isValidDateISO(a) || !isValidDateISO(b)) return 0
  return moment.tz(a, 'YYYY-MM-DD', TZ_VN).diff(moment.tz(b, 'YYYY-MM-DD', TZ_VN))
}

/** Khóa ngày YYYY-MM-DD (lịch VN) — dùng filter / dashboard */
export function dateKeyVN(value) {
  return isoToDateInputVN(value)
}

/** Date cho date-fns (ngày dương lịch theo VN); nhận ISO API hoặc YYYY-MM-DD */
export function vnStartOfDayDate(isoStr) {
  const key =
    typeof isoStr === 'string' && isoStr.length === 10 && !isoStr.includes('T')
      ? isoStr
      : isoToDateInputVN(isoStr)
  if (!key) return null
  const [y, mo, d] = key.split('-').map(Number)
  return new Date(y, mo - 1, d)
}

export function todayStartOfDayDate() {
  return vnStartOfDayDate(getTodayDateVN())
}

export function timestampFromIsoVN(isoStr) {
  const m = vnMoment(isoStr)
  return m.isValid() ? m.valueOf() : null
}

export function isPastTimeVN(timeStr, dateISO) {
  if (!timeStr || timeStr.length !== 5 || !isValidDateISO(dateISO)) return false
  if (dateISO !== getTodayDateVN()) return false
  const [h, min] = timeStr.split(':').map(Number)
  const now = vnMoment()
  return h < now.hour() || (h === now.hour() && min < now.minute())
}
