/**
 * true = không cho người tạo xóa (soft-delete), trừ gỡ do kiểm duyệt báo cáo.
 * Cùng tinh thần sportEventHasStartedForDelete: dùng start_date; nếu thiếu start_date
 * nhưng end_date đã qua → coi là đã từng diễn ra.
 */
export function challengeHasStartedForDelete(challenge: {
  start_date?: Date | null
  end_date?: Date | null
}): boolean {
  if (challenge.start_date != null) {
    const t = new Date(challenge.start_date).getTime()
    if (Number.isNaN(t)) return true
    return t <= Date.now()
  }
  if (challenge.end_date != null) {
    const end = new Date(challenge.end_date).getTime()
    if (!Number.isNaN(end) && end < Date.now()) return true
  }
  return false
}
