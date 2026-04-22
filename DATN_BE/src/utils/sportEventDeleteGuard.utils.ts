/**
 * true = không cho user/admin/BTC xóa (trừ moderation với deletedFromReportModeration).
 * Dùng startDate; nếu thiếu startDate nhưng endDate đã qua → coi là đã từng diễn ra.
 */
export function sportEventHasStartedForDelete(existing: {
  startDate?: Date | null
  endDate?: Date | null
}): boolean {
  if (existing.startDate != null) {
    const t = new Date(existing.startDate).getTime()
    if (Number.isNaN(t)) return true
    return t <= Date.now()
  }
  if (existing.endDate != null) {
    const end = new Date(existing.endDate).getTime()
    if (!Number.isNaN(end) && end < Date.now()) return true
  }
  return false
}
