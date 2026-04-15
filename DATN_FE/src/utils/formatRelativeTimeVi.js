/**
 * Thời gian tương đối tiếng Việt (vd. "5 phút trước", "trong 2 ngày").
 * Không phụ thuộc locale của moment — tránh chuỗi kiểu "a day ago".
 */
function toTimestampMs(input) {
  if (input == null || input === '') return null
  if (typeof input === 'number' && Number.isFinite(input)) return input
  if (input instanceof Date) {
    const t = input.getTime()
    return Number.isNaN(t) ? null : t
  }
  if (typeof input === 'object' && typeof input?.valueOf === 'function') {
    const v = input.valueOf()
    if (typeof v === 'number' && Number.isFinite(v)) return v
  }
  const t = new Date(input).getTime()
  return Number.isNaN(t) ? null : t
}

export function formatRelativeTimeVi(input) {
  const targetMs = toTimestampMs(input)
  if (targetMs == null) return ''

  const nowMs = Date.now()
  const diffMs = targetMs - nowMs
  const absSec = Math.abs(diffMs) / 1000
  const absMin = absSec / 60
  const absHour = absMin / 60
  const absDay = absHour / 24
  const absMonth = absDay / 30
  const absYear = absDay / 365
  const future = diffMs > 0

  let str
  if (absSec < 45) str = 'vài giây'
  else if (absSec < 90) str = '1 phút'
  else if (absMin < 45) str = `${Math.round(absMin)} phút`
  else if (absMin < 90) str = '1 giờ'
  else if (absHour < 22) str = `${Math.round(absHour)} giờ`
  else if (absHour < 36) str = '1 ngày'
  else if (absDay < 25) str = `${Math.round(absDay)} ngày`
  else if (absDay < 45) str = '1 tháng'
  else if (absDay < 345) str = `${Math.round(absMonth)} tháng`
  else if (absDay < 545) str = '1 năm'
  else str = `${Math.round(absYear)} năm`

  return future ? `trong ${str}` : `${str} trước`
}
