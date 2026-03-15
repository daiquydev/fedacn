import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Filler
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import moment from 'moment'
import { FaWeight, FaHeartbeat, FaFire, FaDumbbell } from 'react-icons/fa'
import { GiBodyHeight, GiMuscleUp } from 'react-icons/gi'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title, Filler)

const TIME_RANGES = [
  { key: '1d', label: '1 ngày', days: 1 },
  { key: '7d', label: '7 ngày', days: 7 },
  { key: '1m', label: '1 tháng', days: 30 },
  { key: '6m', label: '6 tháng', days: 180 },
  { key: 'all', label: 'Tất cả', days: null },
  { key: 'custom', label: 'Tùy chọn', days: null }
]

const METRIC_CONFIGS = [
  { key: 'BMI', preKey: 'pre_BMI', label: 'BMI', unit: 'kg/m²', icon: <FaWeight />, gradient: 'from-orange-500 to-amber-400', color: 'rgb(249,115,22)', fillColor: 'rgba(249,115,22,0.1)', link: '/fitness/fitness-calculator/BMI' },
  { key: 'BMR', preKey: 'pre_BMR', label: 'BMR', unit: 'kcal', icon: <FaHeartbeat />, gradient: 'from-teal-500 to-cyan-400', color: 'rgb(20,184,166)', fillColor: 'rgba(20,184,166,0.1)', link: '/fitness/fitness-calculator/BMR' },
  { key: 'TDEE', preKey: 'pre_TDEE', label: 'TDEE', unit: 'kcal/ngày', icon: <FaFire />, gradient: 'from-green-500 to-emerald-400', color: 'rgb(34,197,94)', fillColor: 'rgba(34,197,94,0.1)', link: '/fitness/fitness-calculator/calories' },
  { key: 'body_fat', preKey: 'pre_body_fat', label: 'Body Fat', unit: '%', icon: <GiMuscleUp />, gradient: 'from-blue-500 to-cyan-400', color: 'rgb(59,130,246)', fillColor: 'rgba(59,130,246,0.1)', link: '/fitness/fitness-calculator/body-fat' },
  { key: 'LBM', preKey: 'pre_LBM', label: 'LBM', unit: 'kg', icon: <FaDumbbell />, gradient: 'from-violet-500 to-purple-400', color: 'rgb(139,92,246)', fillColor: 'rgba(139,92,246,0.1)', link: '/fitness/fitness-calculator/LBM' },
  { key: 'IBW', preKey: 'pre_IBW', label: 'IBW', unit: 'kg', icon: <GiBodyHeight />, gradient: 'from-red-600 to-rose-400', color: 'rgb(220,38,38)', fillColor: 'rgba(220,38,38,0.1)', link: '/fitness/fitness-calculator/IBW' }
]

function parseTextDate(str) {
  if (!str) return null
  const parts = str.split('/')
  if (parts.length !== 3) return null
  const [d, m, y] = parts
  if (!d || !m || !y || y.length !== 4) return null
  const date = moment(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`)
  return date.isValid() ? date : null
}

function filterByTime(arr, timeRange, customStart, customEnd) {
  if (!arr || arr.length === 0) return []
  const sorted = [...arr].sort((a, b) => new Date(a.date) - new Date(b.date))
  if (timeRange === 'all') return sorted
  if (timeRange === 'custom') {
    const start = parseTextDate(customStart)
    const end = parseTextDate(customEnd)
    if (!start || !end) return sorted
    return sorted.filter(item => {
      const d = moment(item.date)
      return d.isSameOrAfter(start.clone().startOf('day')) && d.isSameOrBefore(end.clone().endOf('day'))
    })
  }
  const range = TIME_RANGES.find(r => r.key === timeRange)
  if (!range?.days) return sorted
  const cutoff = moment().subtract(range.days, 'days').startOf('day')
  return sorted.filter(item => moment(item.date).isSameOrAfter(cutoff))
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(0,0,0,0.8)',
      titleFont: { size: 11 },
      bodyFont: { size: 10 },
      cornerRadius: 6,
      padding: 7
    }
  },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 9 }, maxTicksLimit: 7 } },
    y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 9 } } }
  }
}

function makeChartData(data, color, fillColor, isWeight) {
  return {
    labels: data.map(item => moment(item.date).format('DD/MM')),
    datasets: [{
      data: data.map(item => isWeight ? item.weight : item.value),
      fill: true,
      backgroundColor: fillColor,
      borderColor: color,
      borderWidth: 2,
      pointBackgroundColor: color,
      pointBorderColor: '#fff',
      pointBorderWidth: 1.5,
      pointRadius: 3,
      pointHoverRadius: 5,
      tension: 0.3
    }]
  }
}

function ChartCard({ icon, gradient, label, unit, data, color, fillColor, link, isWeight }) {
  return (
    <div className='bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden'>
      <div className={`h-0.5 bg-gradient-to-r ${gradient}`} />
      <div className='p-3'>
        <div className='flex items-center justify-between mb-2'>
          <div className='flex items-center gap-1.5'>
            <div className={`w-6 h-6 rounded-md bg-gradient-to-r ${gradient} flex items-center justify-center text-white text-[10px]`}>
              {icon}
            </div>
            <span className='text-xs font-bold text-gray-700 dark:text-gray-300'>{label}</span>
            <span className='text-[10px] text-gray-400'>({unit})</span>
          </div>
          {link && (
            <Link to={link} className='text-[10px] text-indigo-500 hover:text-indigo-600 font-medium'>
              Cập nhật →
            </Link>
          )}
        </div>
        <div className='h-[150px]'>
          {data && data.length > 0 ? (
            <Line options={chartOptions} data={makeChartData(data, color, fillColor, isWeight)} />
          ) : (
            <div className='h-full flex items-center justify-center'>
              <p className='text-[11px] text-gray-400 italic'>Chưa có lịch sử</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function LineChart({ profile }) {
  const [timeRange, setTimeRange] = useState('all')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const filteredWeight = useMemo(
    () => filterByTime(profile?.pre_weight || [], timeRange, customStart, customEnd),
    [profile?.pre_weight, timeRange, customStart, customEnd]
  )

  const metricData = useMemo(() => {
    const result = {}
    METRIC_CONFIGS.forEach(cfg => {
      result[cfg.key] = filterByTime(profile?.[cfg.preKey] || [], timeRange, customStart, customEnd)
    })
    return result
  }, [profile, timeRange, customStart, customEnd])

  return (
    <div className='space-y-5'>
      {/* ── Section 1: Chỉ số sức khỏe hiện tại ── */}
      <div>
        <div className='flex items-center gap-2 mb-2'>
          <div className='w-1 h-4 rounded-full bg-gradient-to-b from-indigo-500 to-purple-500' />
          <h3 className='text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide'>
            Chỉ số sức khỏe hiện tại
          </h3>
        </div>
        <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2'>
          {METRIC_CONFIGS.map(cfg => {
            const val = profile?.[cfg.key]
            const hasValue = val !== null && val !== undefined
            return (
              <Link
                key={cfg.key}
                to={cfg.link}
                className='relative rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800 p-2.5 transition-all hover:shadow-md hover:-translate-y-0.5 group'
              >
                <div className={`h-0.5 absolute top-0 left-0 right-0 bg-gradient-to-r ${cfg.gradient}`} />
                <div className='flex items-center gap-1.5 mb-1 mt-0.5'>
                  <div className={`w-5 h-5 rounded-md bg-gradient-to-r ${cfg.gradient} flex items-center justify-center text-white text-[9px]`}>
                    {cfg.icon}
                  </div>
                  <span className='text-[10px] font-semibold text-gray-400 uppercase tracking-wide'>{cfg.label}</span>
                </div>
                {hasValue ? (
                  <div className='flex items-baseline gap-1'>
                    <span className='text-sm font-bold text-gray-800 dark:text-gray-200'>{val}</span>
                    <span className='text-[9px] text-gray-400'>{cfg.unit}</span>
                  </div>
                ) : (
                  <span className='text-[10px] text-gray-400 italic'>Chưa tính</span>
                )}
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── Section 2: Biểu đồ theo dõi ── */}
      <div>
        <div className='flex items-center gap-2 mb-3'>
          <div className='w-1 h-4 rounded-full bg-gradient-to-b from-indigo-500 to-purple-500' />
          <h3 className='text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide'>
            Biểu đồ theo dõi theo thời gian
          </h3>
        </div>

        {/* Weight chart + filter panel side by side */}
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3'>
          <ChartCard
            icon={<FaWeight />}
            gradient='from-indigo-500 to-purple-500'
            label='Cân nặng'
            unit='kg'
            data={filteredWeight}
            color='rgb(99,102,241)'
            fillColor='rgba(99,102,241,0.1)'
            link={null}
            isWeight={true}
          />

          {/* Filter panel */}
          <div className='bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex flex-col gap-3'>
            <p className='text-xs font-bold text-gray-600 dark:text-gray-300'>Bộ lọc thời gian</p>

            <div className='flex flex-wrap gap-1.5'>
              {TIME_RANGES.map(r => (
                <button
                  key={r.key}
                  onClick={() => setTimeRange(r.key)}
                  className={`px-3 py-1.5 text-xs rounded-lg whitespace-nowrap font-medium transition-all ${
                    timeRange === r.key
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {timeRange === 'custom' ? (
              <div className='flex flex-col gap-2 pt-2 border-t border-gray-100 dark:border-gray-700'>
                <p className='text-[10px] text-gray-400'>Nhập ngày theo định dạng DD/MM/YYYY</p>
                <div className='flex items-center gap-2'>
                  <input
                    type='text'
                    value={customStart}
                    onChange={e => setCustomStart(e.target.value)}
                    placeholder='Bắt đầu: 01/01/2025'
                    maxLength={10}
                    className='flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none'
                  />
                  <span className='text-gray-400 text-xs'>→</span>
                  <input
                    type='text'
                    value={customEnd}
                    onChange={e => setCustomEnd(e.target.value)}
                    placeholder='Kết thúc: 31/12/2025'
                    maxLength={10}
                    className='flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none'
                  />
                </div>
              </div>
            ) : (
              <div className='mt-auto text-[10px] text-gray-400 italic pt-2 border-t border-gray-100 dark:border-gray-700'>
                Chọn "Tùy chọn" để lọc theo ngày cụ thể
              </div>
            )}
          </div>
        </div>

        {/* 6 Metric Charts — 2 per row */}
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
          {METRIC_CONFIGS.map(cfg => (
            <ChartCard
              key={cfg.key}
              icon={cfg.icon}
              gradient={cfg.gradient}
              label={cfg.label}
              unit={cfg.unit}
              data={metricData[cfg.key]}
              color={cfg.color}
              fillColor={cfg.fillColor}
              link={cfg.link}
              isWeight={false}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
