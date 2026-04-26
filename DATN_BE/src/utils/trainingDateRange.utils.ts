/**
 * MongoDB filter for createdAt based on training history range presets or custom YYYY-MM-DD.
 */
export function buildTrainingCreatedAtFilter(
  range: string,
  startDateStr?: string,
  endDateStr?: string
): { createdAt: { $gte: Date; $lte?: Date } } | Record<string, never> {
  if (startDateStr && endDateStr) {
    const from = new Date(startDateStr)
    from.setHours(0, 0, 0, 0)
    const to = new Date(endDateStr)
    to.setHours(23, 59, 59, 999)
    return { createdAt: { $gte: from, $lte: to } }
  }

  if (!range || range === 'all') {
    return {}
  }

  const from = new Date()
  const r = range === '24h' ? 'today' : range
  if (r === 'today') {
    from.setHours(0, 0, 0, 0)
    const to = new Date()
    to.setHours(23, 59, 59, 999)
    return { createdAt: { $gte: from, $lte: to } }
  }
  if (r === '7days') {
    from.setDate(from.getDate() - 7)
  } else if (r === '1month') {
    from.setMonth(from.getMonth() - 1)
  } else if (r === '6months') {
    from.setMonth(from.getMonth() - 6)
  } else {
    return {}
  }

  return { createdAt: { $gte: from } }
}
