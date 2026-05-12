import moment from 'moment'

/** Đồng bộ với BE: mở ghi tiến độ / video call N phút trước giờ diễn ra trong ngày (lấy từ startDate). */
export const SPORT_EVENT_PROGRESS_JOIN_LEAD_MINUTES = 10

/** Mốc mở cửa sổ của lần diễn ra đầu tiên (ngày + giờ trong startDate, trừ N phút). */
export function sportProgressWindowOpensAt(startDate) {
  if (startDate == null || startDate === '') return null
  const m = moment(startDate)
  if (!m.isValid()) return null
  return m.clone().subtract(SPORT_EVENT_PROGRESS_JOIN_LEAD_MINUTES, 'minutes')
}

/**
 * Sự kiện nhiều ngày: mỗi ngày trong khoảng start…end chỉ được ghi / join từ
 * (giờ:phút theo startDate) − 10 phút trong ngày đó.
 * @param {string|Date|undefined|null} startDate
 * @param {string|Date|undefined|null} endDate
 * @param {import('moment').Moment} [now]
 */
export function isDailySportEventProgressAllowedAt(startDate, endDate, now = moment()) {
  if (startDate == null || startDate === '') return false
  const t0 = moment(startDate)
  if (!t0.isValid()) return false
  const endM = endDate != null && endDate !== '' ? moment(endDate).endOf('day') : null
  if (endM && now.isAfter(endM)) return false
  if (now.clone().startOf('day').isBefore(t0.clone().startOf('day'))) return false

  const todayOpen = now
    .clone()
    .startOf('day')
    .hour(t0.hour())
    .minute(t0.minute())
    .second(t0.second())
    .millisecond(t0.millisecond())
    .subtract(SPORT_EVENT_PROGRESS_JOIN_LEAD_MINUTES, 'minutes')

  return now.isSameOrAfter(todayOpen)
}

/**
 * Thời điểm mở cửa sổ ghi / video tiếp theo. Null nếu đang trong cửa sổ hoặc đã quá endDate.
 * @param {string|Date|undefined|null} startDate
 * @param {string|Date|undefined|null} endDate
 * @param {import('moment').Moment} [now]
 * @returns {import('moment').Moment | null}
 */
export function nextDailySportEventProgressWindowOpensAt(startDate, endDate, now = moment()) {
  if (startDate == null || startDate === '') return null
  const t0 = moment(startDate)
  if (!t0.isValid()) return null
  const endM = endDate != null && endDate !== '' ? moment(endDate).endOf('day') : null
  if (endM && now.isAfter(endM)) return null

  const firstOpen = t0.clone().subtract(SPORT_EVENT_PROGRESS_JOIN_LEAD_MINUTES, 'minutes')
  if (now.isBefore(firstOpen)) return firstOpen

  if (isDailySportEventProgressAllowedAt(startDate, endDate, now)) return null

  if (now.clone().startOf('day').isBefore(t0.clone().startOf('day'))) return firstOpen

  const todayOpen = now
    .clone()
    .startOf('day')
    .hour(t0.hour())
    .minute(t0.minute())
    .second(t0.second())
    .millisecond(t0.millisecond())
    .subtract(SPORT_EVENT_PROGRESS_JOIN_LEAD_MINUTES, 'minutes')

  if (now.isBefore(todayOpen)) return todayOpen

  return null
}

/** @param {string|Date|undefined|null} startDate @param {import('moment').Moment} [now] */
export function isBeforeSportProgressWindow(startDate, now = moment()) {
  const open = sportProgressWindowOpensAt(startDate)
  if (!open) return false
  return now.isBefore(open)
}
