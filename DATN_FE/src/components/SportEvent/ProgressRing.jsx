import { useMemo } from 'react'

/**
 * ProgressRing — Reusable SVG circular progress component
 * Inspired by Apple Fitness Activity Rings
 *
 * @param {number}  percent     — 0-100 progress percentage
 * @param {number}  size        — diameter in px (default 120)
 * @param {number}  strokeWidth — ring thickness (default 10)
 * @param {string}  color       — gradient start color (default '#3b82f6')
 * @param {string}  colorEnd    — gradient end color (auto-derived if omitted)
 * @param {string}  trackColor  — background ring color
 * @param {string}  label       — center main text (e.g. "75%")
 * @param {string}  sublabel    — center secondary text (e.g. "hoàn thành")
 * @param {string}  icon        — emoji/icon above label
 * @param {boolean} showPercent — auto-display percent in center (default true)
 * @param {boolean} animated    — enable stroke animation (default true)
 * @param {string}  className   — wrapper className
 */
export default function ProgressRing({
  percent = 0,
  size = 120,
  strokeWidth = 10,
  color = '#3b82f6',
  colorEnd,
  trackColor,
  label,
  sublabel,
  icon,
  showPercent = true,
  animated = true,
  className = ''
}) {
  const safePercent = Math.max(0, Math.min(isNaN(percent) ? 0 : percent, 100))

  const { radius, circumference, offset, center, gradientId } = useMemo(() => {
    const r = (size - strokeWidth) / 2
    const c = 2 * Math.PI * r
    const id = `ring-grad-${Math.random().toString(36).slice(2, 8)}`
    return {
      radius: r,
      circumference: c,
      offset: c - (safePercent / 100) * c,
      center: size / 2,
      gradientId: id
    }
  }, [size, strokeWidth, safePercent])

  // Auto-derive end color: shift hue toward green as percent increases
  const resolvedColorEnd = colorEnd || (safePercent >= 100 ? '#22c55e' : color)

  // Auto-derive track color for dark/light mode
  const resolvedTrackColor = trackColor || 'rgba(148, 163, 184, 0.15)'

  // Determine center display
  const centerLabel = label ?? (showPercent ? `${Math.round(safePercent)}%` : '')

  return (
    <div className={`inline-flex flex-col items-center ${className}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Gradient definition */}
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={resolvedColorEnd} />
          </linearGradient>
        </defs>

        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={resolvedTrackColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Progress arc */}
        {safePercent > 0 && (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={animated ? {
              transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)'
            } : undefined}
          />
        )}

        {/* Glow effect at high progress */}
        {safePercent >= 80 && (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth + 4}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            opacity={0.15}
            style={animated ? {
              transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)'
            } : undefined}
          />
        )}
      </svg>

      {/* Center text overlay */}
      <div
        className="absolute flex flex-col items-center justify-center"
        style={{ width: size, height: size }}
      >
        {icon && <span className="text-lg mb-0.5">{icon}</span>}
        {centerLabel && (
          <span
            className="font-black text-gray-800 dark:text-white leading-none"
            style={{ fontSize: size * 0.2 }}
          >
            {centerLabel}
          </span>
        )}
        {sublabel && (
          <span
            className="text-gray-500 dark:text-gray-400 font-medium mt-0.5"
            style={{ fontSize: Math.max(size * 0.09, 10) }}
          >
            {sublabel}
          </span>
        )}
      </div>
    </div>
  )
}

/**
 * ActivityRings — 3 concentric rings like Apple Fitness
 * @param {Array} rings — [{ percent, color, colorEnd, label }]
 * @param {number} size — outer diameter
 */
export function ActivityRings({
  rings = [],
  size = 160,
  strokeWidth = 10,
  gap = 4,
  className = '',
  centerContent
}) {
  const ringData = useMemo(() => {
    return rings.map((ring, i) => {
      const sw = strokeWidth
      const r = (size - sw) / 2 - i * (sw + gap)
      const c = 2 * Math.PI * r
      const pct = Math.max(0, Math.min(isNaN(ring.percent) ? 0 : ring.percent, 100))
      const id = `aring-${i}-${Math.random().toString(36).slice(2, 8)}`
      return { ...ring, radius: r, circumference: c, offset: c - (pct / 100) * c, pct, gradientId: id }
    })
  }, [rings, size, strokeWidth, gap])

  const center = size / 2

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {ringData.map((r, i) => (
          <g key={i}>
            <defs>
              <linearGradient id={r.gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={r.color || '#3b82f6'} />
                <stop offset="100%" stopColor={r.colorEnd || r.color || '#3b82f6'} />
              </linearGradient>
            </defs>
            {/* Track */}
            <circle
              cx={center}
              cy={center}
              r={r.radius}
              fill="none"
              stroke="rgba(148, 163, 184, 0.12)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            {/* Progress */}
            {r.pct > 0 && (
              <circle
                cx={center}
                cy={center}
                r={r.radius}
                fill="none"
                stroke={`url(#${r.gradientId})`}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={r.circumference}
                strokeDashoffset={r.offset}
                style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
              />
            )}
          </g>
        ))}
      </svg>

      {/* Center content */}
      {centerContent && (
        <div className="absolute inset-0 flex items-center justify-center">
          {centerContent}
        </div>
      )}
    </div>
  )
}
