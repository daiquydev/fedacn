/** Ngoài trời: không dùng phút/giờ làm đơn vị mục tiêu. Trong nhà: km → kcal. */
export function normalizeSportEventTargetUnit(
  eventType: 'Ngoài trời' | 'Trong nhà',
  targetUnit?: string
): string {
  let u = (targetUnit || '').trim()
  if (eventType === 'Ngoài trời') {
    if (u === 'phút' || u === 'giờ') return 'km'
    return u
  }
  if (u === 'km') return 'kcal'
  return u
}
