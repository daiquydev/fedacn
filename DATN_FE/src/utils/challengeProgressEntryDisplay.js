/**
 * Resolve workout session object from a challenge progress entry (populate từ API).
 */
export function getProgressWorkoutSession(entry) {
  const ws = entry?.workout_session_id
  return ws && typeof ws === 'object' && !Array.isArray(ws) ? ws : null
}

export function getEntryDurationMinutes(entry) {
  const session = getProgressWorkoutSession(entry)
  const v = entry?.duration_minutes ?? session?.duration_minutes
  if (v == null || v === '') return 0
  const n = Number(v)
  return Number.isFinite(n) ? Math.max(0, n) : 0
}

export function getEntryCalories(entry) {
  const session = getProgressWorkoutSession(entry)
  const v = entry?.calories ?? session?.total_calories
  if (v == null || v === '') return 0
  const n = Number(v)
  return Number.isFinite(n) ? Math.max(0, n) : 0
}
