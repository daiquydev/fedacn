/**
 * Tổng số ngày của thử thách (khoảng start–end, tính cả hai đầu) — dùng chung feed, chi tiết, thẻ.
 */
export function getChallengeTotalRequiredDays(challenge) {
  if (!challenge) return 1
  const safeStart = new Date(challenge.start_date || new Date())
  const safeEnd = new Date(challenge.end_date || new Date())
  safeStart.setHours(0, 0, 0, 0)
  safeEnd.setHours(0, 0, 0, 0)
  return Math.max(1, Math.ceil((safeEnd.getTime() - safeStart.getTime()) / (1000 * 60 * 60 * 24)) + 1)
}

/**
 * % tiến độ cá nhân: số ngày đạt mục (current_value) / tổng ngày thử thách.
 * participationRecord: bản ghi tham gia (feed: myProgress, chi tiết: participation, hoặc object có current_value).
 */
export function getChallengePersonalProgressPercent(challenge, participationRecord) {
  if (!challenge) return 0
  const total = getChallengeTotalRequiredDays(challenge)
  const rec = participationRecord ?? challenge.myProgress ?? challenge.participation
  const current = Number(rec?.current_value) || 0
  return Math.min(Math.round((current / total) * 100), 100)
}
