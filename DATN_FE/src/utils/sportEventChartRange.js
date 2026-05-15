import { vnMoment } from './vnDateUtils'

/** Khoảng ngày hiển thị biểu đồ (trừ "hôm nay" — xử lý riêng theo từng lần). */
export function getChartRangeBounds(timeFilter, customRange, event) {
  if (customRange?.startDate && customRange?.endDate) {
    return {
      start: vnMoment(customRange.startDate).startOf('day'),
      end: vnMoment(customRange.endDate).endOf('day')
    }
  }

  const end = vnMoment().endOf('day')

  if (timeFilter === 'all') {
    return {
      start: event?.startDate
        ? vnMoment(event.startDate).startOf('day')
        : vnMoment().subtract(11, 'months').startOf('day'),
      end
    }
  }

  let start
  switch (timeFilter) {
    case '7d':
      start = vnMoment().subtract(6, 'days').startOf('day')
      break
    case '1m':
      start = vnMoment().subtract(1, 'month').startOf('day')
      break
    case '6m':
      start = vnMoment().subtract(6, 'months').startOf('day')
      break
    case '1y':
      start = vnMoment().subtract(1, 'year').startOf('day')
      break
    default:
      start = vnMoment().subtract(6, 'days').startOf('day')
  }

  return { start, end }
}

/** Một cột biểu đồ cho mỗi ngày trong khoảng [start, end]. */
export function buildDailyChartSlots(start, end) {
  const startDay = start.clone().startOf('day')
  const endDay = end.clone().startOf('day')
  const totalDays = endDay.diff(startDay, 'days') + 1
  if (totalDays <= 0) return []

  return Array.from({ length: totalDays }, (_, i) => {
    const d = startDay.clone().add(i, 'days')
    return { date: d.format('DD/MM'), fullDate: d.format('YYYY-MM-DD') }
  })
}
