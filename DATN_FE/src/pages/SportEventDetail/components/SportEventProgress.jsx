import React, { useState, useMemo, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'
import {
  FaFire,
  FaRoad,
  FaClock,
  FaTrophy,
  FaRunning,
  FaWalking,
  FaBicycle,
  FaMapMarkerAlt,
  FaShareAlt
} from 'react-icons/fa'
import { MdOutlineHistoryEdu } from 'react-icons/md'
import moment from 'moment'
import { getUserActivities } from '../../../apis/sportEventApi'
import ActivityShareModal from '../../../components/SportEvent/ActivityShareModal'

// Simple stat card — now clickable to select chart metric
const StatCard = ({ icon, label, value, subValue, colorClass, isActive, onClick }) => (
  <div
    onClick={onClick}
    className={`p-4 rounded-2xl shadow-sm border flex items-center gap-4 transition-all cursor-pointer
      ${isActive
        ? 'bg-red-50 dark:bg-red-900/20 border-red-400 ring-2 ring-red-400'
        : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:shadow-md'
      }`}
  >
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${colorClass} bg-opacity-10`}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <h4 className="text-xl font-bold text-gray-900 dark:text-white">{value}</h4>
      {subValue && <p className="text-xs text-gray-400">{subValue}</p>}
    </div>
  </div>
)

const TIME_FILTERS = [
  { key: '1d', label: '1 ngày' },
  { key: '7d', label: '7 ngày' },
  { key: '1m', label: '1 tháng' },
  { key: '6m', label: '6 tháng' },
  { key: '1y', label: '1 năm' },
  { key: 'all', label: 'Tất cả' }
]

// metric key -> chart data field and display
const METRIC_CONFIG = {
  progress: { field: 'value', label: (unit) => unit, color: '#EF4444' },
  distance: { field: 'distance', label: () => 'km', color: '#3B82F6' },
  calories: { field: 'calories', label: () => 'kcal', color: '#F97316' }
}

const ACTIVITY_TYPE_ICONS = {
  running: <FaRunning />,
  walking: <FaWalking />,
  cycling: <FaBicycle />
}

function formatActivityDuration(seconds) {
  if (!seconds) return '0:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function SportEventProgress({
  event,
  userProgress
}) {
  const [timeFilter, setTimeFilter] = useState('7d')
  const [highlightDate, setHighlightDate] = useState(null)
  const [activeMetric, setActiveMetric] = useState('progress') // 'progress' | 'distance' | 'calories'
  const [shareActivity, setShareActivity] = useState(null) // activity to share
  const navigate = useNavigate()
  const { id } = useParams()
  const activityListRef = useRef(null)
  const activityItemRefs = useRef({})

  // Fetch user's GPS activities for this event
  const { data: activitiesData } = useQuery({
    queryKey: ['userActivities', id],
    queryFn: () => getUserActivities(id),
    enabled: !!id && event?.eventType === 'Ngoài trời'
  })
  const activitiesResult = activitiesData?.data?.result
  const completedActivities = activitiesResult?.activities?.filter(a => a.status === 'completed') || []

  // Share activity to community — open modal inline
  const handleShare = (e, activity) => {
    e.stopPropagation()
    setShareActivity(activity)
  }

  // Aggregate stats from GPS activities (for outdoor events)
  const gpsStats = useMemo(() => {
    if (!completedActivities.length) return null
    const totalDistance = completedActivities.reduce((sum, a) => sum + a.totalDistance, 0) / 1000
    const totalCalories = completedActivities.reduce((sum, a) => sum + Math.round(a.calories), 0)
    const totalDuration = completedActivities.reduce((sum, a) => sum + a.totalDuration, 0)
    return {
      totalSessions: completedActivities.length,
      totalDistance: totalDistance.toFixed(1),
      totalCalories,
      totalDuration: formatActivityDuration(totalDuration)
    }
  }, [completedActivities])

  // Calculate stats from userProgress
  const stats = useMemo(() => {
    if (!userProgress) return null
    const { totalProgress, totalDistance, totalCalories, totalEntries } = userProgress
    // Tiến độ tối đa mỗi người = Mục tiêu sự kiện / Số người tối đa
    const maxParticipants = event?.maxParticipants > 0 ? event.maxParticipants : 1
    const perPersonTarget = event?.targetValue / maxParticipants
    const progressPercent = Math.min(Math.round((totalProgress / perPersonTarget) * 100), 100)
    return {
      totalProgress,
      progressPercent,
      perPersonTarget,
      totalDistance: totalDistance?.toFixed(1) || 0,
      totalCalories: totalCalories || 0,
      totalEntries
    }
  }, [userProgress, event])

  // Chart data computation
  const chartData = useMemo(() => {
    if (activeMetric !== 'progress' && event?.eventType === 'Ngoài trời') {
      // Build chart from GPS activities
      const field = activeMetric === 'distance' ? 'totalDistance' : 'calories'
      const divisor = activeMetric === 'distance' ? 1000 : 1
      const precision = activeMetric === 'distance' ? 2 : 0

      // Group by date
      const dayMap = {}
      completedActivities.forEach(a => {
        const d = moment(a.startTime).format('DD/MM')
        const fd = moment(a.startTime).format('YYYY-MM-DD')
        const v = parseFloat((a[field] / divisor).toFixed(precision))
        if (!dayMap[fd]) dayMap[fd] = { date: d, fullDate: fd, value: 0 }
        dayMap[fd].value += v
      })

      // Apply time filter
      const now = moment()
      let days = 7
      switch (timeFilter) {
        case '1d': days = 1; break
        case '7d': days = 7; break
        case '1m': days = 30; break
        case '6m': days = 180; break
        case '1y': days = 365; break
        default: days = 365
      }

      const result = Array.from({ length: timeFilter === 'all' ? 365 : days }, (_, i) => {
        const d = moment().subtract(days - 1 - i, 'days')
        const fd = d.format('YYYY-MM-DD')
        return {
          date: d.format('DD/MM'),
          fullDate: fd,
          value: dayMap[fd]?.value || 0
        }
      }).filter((_, i, arr) => timeFilter === 'all' || arr.length <= 30 || i % Math.ceil(arr.length / 30) === 0)

      return result
    }

    // Default: use progressHistory
    if (!userProgress?.progressHistory) return []

    const getDays = () => {
      switch (timeFilter) {
        case '1d': return 1
        case '7d': return 7
        case '1m': return 30
        case '6m': return 180
        case '1y': return 365
        default: return 0
      }
    }

    if (timeFilter === 'all') {
      const monthMap = {}
      userProgress.progressHistory.forEach(entry => {
        const key = moment(entry.date).format('MM/YY')
        if (!monthMap[key]) monthMap[key] = { date: key, fullDate: moment(entry.date).format('YYYY-MM'), value: 0 }
        monthMap[key].value += entry.value
      })
      return Object.values(monthMap).slice(-12)
    }

    const days = getDays()

    if (days <= 31) {
      const arr = Array.from({ length: days }, (_, i) => {
        const d = moment().subtract(days - 1 - i, 'days')
        return { date: d.format('DD/MM'), fullDate: d.format('YYYY-MM-DD'), value: 0 }
      })
      userProgress.progressHistory.forEach(entry => {
        const entryDate = moment(entry.date).format('YYYY-MM-DD')
        const day = arr.find(d => d.fullDate === entryDate)
        if (day) day.value += entry.value
      })
      return arr
    } else {
      const numWeeks = Math.ceil(days / 7)
      const weeks = []
      for (let i = numWeeks - 1; i >= 0; i--) {
        const weekStart = moment().subtract(i * 7 + 6, 'days')
        const weekEnd = moment().subtract(i * 7, 'days')
        weeks.push({ date: weekStart.format('DD/MM'), fullDate: weekStart.format('YYYY-MM-DD'), weekEnd: weekEnd.format('YYYY-MM-DD'), value: 0 })
      }
      userProgress.progressHistory.forEach(entry => {
        const em = moment(entry.date)
        const week = weeks.find(w => em.isBetween(moment(w.fullDate), moment(w.weekEnd), 'day', '[]'))
        if (week) week.value += entry.value
      })
      return weeks
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProgress, timeFilter, activeMetric, completedActivities])

  // Chart bar click → scroll to activity
  const handleBarClick = (data) => {
    if (!data || !data.fullDate) return
    setHighlightDate(data.fullDate)
    const matchingId = Object.keys(activityItemRefs.current).find(actId =>
      activityItemRefs.current[actId]?.dataset?.date === data.fullDate
    )
    if (matchingId && activityItemRefs.current[matchingId]) {
      activityItemRefs.current[matchingId].scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      setTimeout(() => setHighlightDate(null), 3000)
    }
  }

  if (!userProgress) return <div>Loading...</div>

  const metricUnit = METRIC_CONFIG[activeMetric]?.label(event?.targetUnit || '')
  const barColor = METRIC_CONFIG[activeMetric]?.color || '#EF4444'

  // Determine displayed stats — prefer GPS data for outdoor events
  const isOutdoor = event?.eventType === 'Ngoài trời'
  const displayProgress = stats?.totalProgress
  const displayDistance = isOutdoor && gpsStats ? gpsStats.totalDistance : stats?.totalDistance
  const displayCalories = isOutdoor && gpsStats ? gpsStats.totalCalories : stats?.totalCalories
  const displaySessions = isOutdoor && gpsStats ? gpsStats.totalSessions : stats?.totalEntries

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Activity Share Modal */}
      {shareActivity && (
        <ActivityShareModal
          activity={shareActivity}
          event={event}
          eventId={id}
          onClose={() => setShareActivity(null)}
        />
      )}

      {/* Activity Tracking Button - only for outdoor events */}
      {isOutdoor && (
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-1">🏃 Theo dõi hoạt động GPS</h3>
              <p className="text-sm opacity-90">Bắt đầu theo dõi quãng đường và tốc độ bằng GPS</p>
            </div>
            <button
              onClick={() => navigate(`/sport-event/${id}/tracking`)}
              className="flex-shrink-0 bg-white text-red-500 px-6 py-3 rounded-xl font-bold text-sm hover:bg-gray-100 transition shadow-lg flex items-center gap-2"
            >
              <FaMapMarkerAlt />
              Bắt đầu
            </button>
          </div>
          {gpsStats && (
            <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{gpsStats.totalSessions}</p>
                <p className="text-xs opacity-80">Buổi tập</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{gpsStats.totalDistance}</p>
                <p className="text-xs opacity-80">km tổng</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{gpsStats.totalDuration}</p>
                <p className="text-xs opacity-80">Thời gian</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 1. Summary Stats Section — clickable to switch chart metric */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<FaTrophy className="text-yellow-500" />}
          label="Tiến độ của bạn"
          value={`${displayProgress} / ${stats?.perPersonTarget?.toFixed(1) ?? event.targetValue} ${event.targetUnit}`}
          subValue={`${stats.progressPercent}% phần đóng góp của bạn`}
          colorClass="bg-yellow-100 text-yellow-600"
          isActive={activeMetric === 'progress'}
          onClick={() => setActiveMetric('progress')}
        />
        <StatCard
          icon={<FaRoad className="text-blue-500" />}
          label="Tổng quãng đường"
          value={`${displayDistance} km`}
          colorClass="bg-blue-100 text-blue-600"
          isActive={activeMetric === 'distance'}
          onClick={() => setActiveMetric('distance')}
        />
        <StatCard
          icon={<FaFire className="text-red-500" />}
          label="kcal tiêu thụ"
          value={`${displayCalories} kcal`}
          colorClass="bg-red-100 text-red-600"
          isActive={activeMetric === 'calories'}
          onClick={() => setActiveMetric('calories')}
        />
        <StatCard
          icon={<MdOutlineHistoryEdu className="text-purple-500" />}
          label="Số buổi tham gia"
          value={`${displaySessions} buổi`}
          colorClass="bg-purple-100 text-purple-600"
          isActive={false}
          onClick={() => { }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 2. Chart Section */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                Lịch sử{' '}
                <span className="text-sm font-normal text-gray-400">
                  ({activeMetric === 'progress' ? event.targetUnit : activeMetric === 'distance' ? 'km' : 'kcal'})
                </span>
              </h3>
              <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                {TIME_FILTERS.map(f => (
                  <button
                    key={f.key}
                    onClick={() => setTimeFilter(f.key)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${timeFilter === f.key
                      ? 'bg-red-500 text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 11 }}
                    dy={10}
                    interval={chartData.length > 10 ? Math.floor(chartData.length / 7) : 0}
                  />
                  <YAxis hide />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-gray-800 text-white text-xs py-1 px-2 rounded">
                            {`${payload[0].value} ${metricUnit}`}
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar
                    dataKey="value"
                    radius={[4, 4, 0, 0]}
                    onClick={(data) => handleBarClick(data)}
                    style={{ cursor: 'pointer' }}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.fullDate === highlightDate ? '#3B82F6' : (entry.value > 0 ? barColor : '#F3F4F6')}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 3. GPS Activity History (Right Col) - Scrollable + Share */}
        {isOutdoor && (
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 sticky top-24">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Hoạt động gần đây
              </h3>

              {completedActivities.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Chưa có hoạt động nào. Nhấn &quot;Bắt đầu&quot; để theo dõi!</p>
              ) : (
                <div
                  ref={activityListRef}
                  className="space-y-3 max-h-[380px] overflow-y-auto pr-1"
                  style={{ scrollbarWidth: 'thin' }}
                >
                  {completedActivities.map((activity) => {
                    const actDate = moment(activity.startTime).format('YYYY-MM-DD')
                    const isHighlighted = highlightDate === actDate
                    return (
                      <div
                        key={activity._id}
                        ref={el => { activityItemRefs.current[activity._id] = el }}
                        data-date={actDate}
                        onClick={() => navigate(`/sport-event/${id}/activity/${activity._id}`)}
                        className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${isHighlighted
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md ring-2 ring-blue-400'
                          : 'border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600'
                          }`}
                      >
                        {/* Activity type icon */}
                        <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500 text-lg flex-shrink-0">
                          {ACTIVITY_TYPE_ICONS[activity.activityType] || <FaRunning />}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                            {event?.category || activity.activityType} — {(activity.totalDistance / 1000).toFixed(2)} km
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                            <span className="flex items-center gap-0.5"><FaClock className="text-[10px]" />{formatActivityDuration(activity.totalDuration)}</span>
                            <span className="flex items-center gap-0.5"><FaFire className="text-[10px]" />{Math.round(activity.calories)} kcal</span>
                          </div>
                        </div>

                        {/* Date + Share button */}
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          <span className="text-xs text-gray-400">{moment(activity.startTime).format('DD/MM')}</span>
                          <button
                            onClick={(e) => handleShare(e, activity)}
                            title="Chia sẻ lên cộng đồng"
                            className="p-1.5 rounded-lg transition-all bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-orange-100 hover:text-orange-500 dark:hover:bg-orange-900/20"
                          >
                            <FaShareAlt className="text-xs" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
