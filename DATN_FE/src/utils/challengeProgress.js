import { isoToDateInputVN } from './vnDateUtils'

/**
 * Tổng số ngày của thử thách (khoảng start–end, tính cả hai đầu) — dùng chung feed, chi tiết, thẻ.
 */
export function getChallengeTotalRequiredDays(challenge) {
  if (!challenge) return 1
  const startKey = isoToDateInputVN(challenge.start_date)
  const endKey = isoToDateInputVN(challenge.end_date)
  if (!startKey || !endKey) return 1
  const start = new Date(`${startKey}T00:00:00`)
  const end = new Date(`${endKey}T00:00:00`)
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1)
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

/**
 * Chuỗi ngắn cho thử thách thể dục (theo danh sách bài tập), không dùng danh mục sự kiện trong/ngoài trời.
 * @param {Array<{ exercise_name_vi?: string, exercise_name?: string }>|undefined|null} exercises
 * @returns {string|null}
 */
export function formatFitnessExerciseListSummary(exercises) {
  if (!Array.isArray(exercises) || exercises.length === 0) return null
  const names = exercises
    .map((ex) => String(ex.exercise_name_vi || ex.exercise_name || '').trim())
    .filter(Boolean)
  if (names.length === 0) return `${exercises.length} bài tập`
  const sep = ' · '
  if (names.length <= 3) return names.join(sep)
  return `${names.slice(0, 2).join(sep)} · +${names.length - 2} bài`
}

/**
 * @param {Array<{ exercise_name_vi?: string, exercise_name?: string }>|undefined|null} exercises
 */
export function formatFitnessExerciseListTitle(exercises) {
  if (!Array.isArray(exercises) || exercises.length === 0) return ''
  return exercises
    .map((ex) => String(ex.exercise_name_vi || ex.exercise_name || 'Bài tập').trim())
    .filter(Boolean)
    .join(' · ')
}
