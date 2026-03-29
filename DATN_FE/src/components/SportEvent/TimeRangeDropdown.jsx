import { useState, useRef } from 'react'
import { FaCalendarAlt } from 'react-icons/fa'

const PRESETS = [
  { label: '24h', value: '24h' },
  { label: '7 ngày', value: '7d' },
  { label: '1 tháng', value: '1m' },
  { label: '6 tháng', value: '6m' },
  { label: 'Tất cả', value: 'all' },
  { label: 'Tùy chỉnh...', value: 'custom' }
]

function parseDateInput(text) {
  if (!text) return ''
  const ddmm = text.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/)
  if (ddmm) return `${ddmm[3]}-${ddmm[2].padStart(2, '0')}-${ddmm[1].padStart(2, '0')}`
  const iso = text.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})$/)
  if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`
  return ''
}

/**
 * Dropdown time range filter — styled for User FE.
 * @param {string} value - current filter value (e.g. '7d', '1m', 'all')
 * @param {function} onChange - called with { period } or { startDate, endDate }
 * @param {string} accentColor - tailwind color for active accent (default: 'blue')
 */
export default function TimeRangeDropdown({ value = '7d', onChange, accentColor = 'blue' }) {
  const [showCustom, setShowCustom] = useState(false)
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
      setShowCustom(false)
    }
  }

  const accentMap = {
    blue: {
      select: 'focus:ring-blue-300 focus:border-blue-400',
      btn: 'bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300'
    },
    red: {
      select: 'focus:ring-red-300 focus:border-red-400',
      btn: 'bg-red-500 hover:bg-red-600 disabled:bg-gray-300'
    },
    indigo: {
      select: 'focus:ring-indigo-300 focus:border-indigo-400',
      btn: 'bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300'
    }
  }

  const accent = accentMap[accentColor] || accentMap.blue

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Dropdown select */}
      <div className="relative">
        <select
          className={`appearance-none text-sm border border-gray-200 dark:border-gray-600 rounded-xl pl-9 pr-8 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 outline-none cursor-pointer transition-all shadow-sm hover:shadow-md font-medium ${accent.select}`}
          value={showCustom ? 'custom' : value}
          onChange={handlePresetChange}
        >
          {PRESETS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        {/* Calendar icon overlay */}
        <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-xs pointer-events-none" />
        {/* Chevron icon */}
        <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Custom date range inputs */}
      {showCustom && (
        <div className="flex items-center gap-1.5 animate-fadeIn">
          <input
            ref={startRef}
            type="text"
            placeholder="DD/MM/YYYY"
            className="text-sm border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 w-[120px] bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-300 shadow-sm"
            value={startText}
            onChange={(e) => setStartText(e.target.value)}
            onClick={() => startRef.current?.select()}
          />
          <span className="text-gray-400 dark:text-gray-500 text-xs font-medium">→</span>
          <input
            ref={endRef}
            type="text"
            placeholder="DD/MM/YYYY"
            className="text-sm border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 w-[120px] bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-300 shadow-sm"
            value={endText}
            onChange={(e) => setEndText(e.target.value)}
            onClick={() => endRef.current?.select()}
          />
          <button
            onClick={handleApplyCustom}
            disabled={!parseDateInput(startText) || !parseDateInput(endText)}
            className={`text-sm text-white px-4 py-2 rounded-xl transition-all font-semibold shadow-sm hover:shadow-md disabled:cursor-not-allowed ${accent.btn}`}
          >
            Áp dụng
          </button>
        </div>
      )}
    </div>
  )
}
