import { useState, useRef, useEffect } from 'react'

const PRESETS = [
  { label: 'Hôm nay', value: 'today' },
  { label: '7 ngày', value: '7d' },
  { label: '1 tháng', value: '1m' },
  { label: '6 tháng', value: '6m' },
  { label: 'Toàn bộ', value: 'all' },
  { label: 'Tùy chỉnh...', value: 'custom' }
]

function parseDateInput(text) {
  // Accept DD/MM/YYYY or YYYY-MM-DD
  if (!text) return ''
  const ddmm = text.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/)
  if (ddmm) return `${ddmm[3]}-${ddmm[2].padStart(2, '0')}-${ddmm[1].padStart(2, '0')}`
  const iso = text.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})$/)
  if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`
  return ''
}

export default function TimeRangeFilter({ value = '7d', onChange }) {
  const [showCustom, setShowCustom] = useState(value === 'custom')
  const [startText, setStartText] = useState('')
  const [endText, setEndText] = useState('')
  const startRef = useRef(null)
  const endRef = useRef(null)

  const handlePresetChange = (e) => {
    const v = e.target.value
    if (v === 'custom') {
      setShowCustom(true)
    } else {
      setShowCustom(false)
      setStartText('')
      setEndText('')
      onChange({ period: v })
    }
  }

  const handleApplyCustom = () => {
    const start = parseDateInput(startText)
    const end = parseDateInput(endText)
    if (start && end) {
      onChange({ startDate: start, endDate: end })
    }
  }

  // Try to show native date picker on click
  const handleCalendarClick = (ref) => {
    if (ref.current) {
      ref.current.focus()
      ref.current.select()
    }
  }

  return (
    <div className='flex items-center gap-2 flex-wrap'>
      <select
        className='text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-indigo-300 outline-none cursor-pointer'
        value={showCustom ? 'custom' : value}
        onChange={handlePresetChange}
      >
        {PRESETS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>

      {showCustom && (
        <div className='flex items-center gap-1.5'>
          <div className='relative'>
            <input
              ref={startRef}
              type='text'
              placeholder='DD/MM/YYYY'
              className='text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 w-[120px] bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-indigo-300'
              value={startText}
              onChange={(e) => setStartText(e.target.value)}
              onClick={() => handleCalendarClick(startRef)}
            />
          </div>
          <span className='text-gray-400 text-xs'>→</span>
          <div className='relative'>
            <input
              ref={endRef}
              type='text'
              placeholder='DD/MM/YYYY'
              className='text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 w-[120px] bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-indigo-300'
              value={endText}
              onChange={(e) => setEndText(e.target.value)}
              onClick={() => handleCalendarClick(endRef)}
            />
          </div>
          <button
            onClick={handleApplyCustom}
            disabled={!parseDateInput(startText) || !parseDateInput(endText)}
            className='text-sm bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300 text-white px-3 py-1.5 rounded-lg transition-colors font-medium'
          >
            Áp dụng
          </button>
        </div>
      )}
    </div>
  )
}
