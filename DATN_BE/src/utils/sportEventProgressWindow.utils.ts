import moment from 'moment'

/** Cho phép ghi tiến độ ngoài trời / join video từ N ms trước `startDate` (đúng ngày + giờ sự kiện). */
export const SPORT_EVENT_PROGRESS_JOIN_LEAD_MS = 10 * 60 * 1000

export function getEarliestSportEventProgressMs(startDate: Date | string | undefined | null): number | null {
  if (startDate == null || startDate === '') return null
  const t = new Date(startDate).getTime()
  if (Number.isNaN(t)) return null
  return t - SPORT_EVENT_PROGRESS_JOIN_LEAD_MS
}

/** Mốc $gte khi đếm/lọc tiến độ & video (khớp thời điểm được phép ghi: T − 10 phút). */
export function getSportEventProgressCountFromDate(startDate: Date | string | undefined | null): Date | null {
  const ms = getEarliestSportEventProgressMs(startDate)
  return ms == null ? null : new Date(ms)
}

/**
 * Sự kiện nhiều ngày (trong nhà hoặc ngoài trời): mỗi ngày trong [startDate … endDate]
 * chỉ ghi / join từ (giờ:phút lấy theo startDate) − 10 phút trong ngày đó.
 */
export function isDailySportEventProgressAllowedAt(
  startDate: Date | string | undefined | null,
  endDate: Date | string | undefined | null,
  when: Date = new Date()
): boolean {
  if (startDate == null || startDate === '') return false
  const t0 = moment(startDate)
  if (!t0.isValid()) return false
  const now = moment(when)
  const endM = endDate != null && endDate !== '' ? moment(endDate).endOf('day') : null
  if (endM && now.isAfter(endM)) return false
  if (now.clone().startOf('day').isBefore(t0.clone().startOf('day'))) return false

  const leadMin = SPORT_EVENT_PROGRESS_JOIN_LEAD_MS / (60 * 1000)
  const todayOpen = now
    .clone()
    .startOf('day')
    .hour(t0.hour())
    .minute(t0.minute())
    .second(t0.second())
    .millisecond(t0.millisecond())
    .subtract(leadMin, 'minutes')

  return now.isSameOrAfter(todayOpen)
}
