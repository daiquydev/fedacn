import { roundKcal } from '../../../utils/mathUtils'
import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList
} from 'recharts'
import {
  FaFire,
  FaRoad,
  FaClock,
  FaTrophy,
  FaRunning,
  FaMapMarkerAlt,
  FaShareAlt,
  FaBolt,
  FaChartLine,
  FaTrash
} from 'react-icons/fa'
import { MdOutlineHistoryEdu } from 'react-icons/md'
import { SiStrava } from 'react-icons/si'
import moment from 'moment'
import toast from 'react-hot-toast'
import { getUserActivities, softDeleteActivity } from '../../../apis/sportEventApi'
import sportCategoryApi from '../../../apis/sportCategoryApi'
import StravaSyncModal from './StravaSyncModal'
import { getSportIcon } from '../../../utils/sportIcons'
import ActivityShareModal from '../../../components/SportEvent/ActivityShareModal'
import ActivityDetailModal from '../../../components/SportEvent/ActivityDetailModal'
import ProgressRing from '../../../components/SportEvent/ProgressRing'
import TimeRangeDropdown from '../../../components/SportEvent/TimeRangeDropdown'

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

const FILTER_LABELS = {
  '24h': '24 giờ gần nhất',
  '7d': '7 ngày gần nhất',
  '1m': '1 tháng gần nhất',
  '6m': '6 tháng gần nhất',
  '1y': '1 năm gần nhất',
  'all': 'Toàn bộ thời gian'
}

// metric key -> chart data field and display
const METRIC_CONFIG = {
  progress: { field: 'value', label: (unit) => unit, color: '#EF4444' },
  distance: { field: 'distance', label: () => 'km', color: '#3B82F6' },
  calories: { field: 'calories', label: () => 'kcal', color: '#F97316' },
  sessions: { field: 'sessions', label: () => 'lần', color: '#10B981' },
  speed: { field: 'avgSpeed', label: () => 'km/h', color: '#8B5CF6' }
}

// Category icon is now fetched from Admin's Sport Category config

// Định dạng giây → chuỗi rõ đơn vị: "48p 00s" hoặc "1g 01p 01s"
function formatDuration(seconds) {
  if (!seconds) return '0p 00s'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}g ${String(m).padStart(2, '0')}p ${String(s).padStart(2, '0')}s`
  return `${m}p ${String(s).padStart(2, '0')}s`
}

// Pace: phút/km → "5p 30s/km"
function formatPace(totalSeconds, distanceKm) {
  if (!distanceKm || distanceKm <= 0) return '—'
  const paceSeconds = totalSeconds / distanceKm
  const pm = Math.floor(paceSeconds / 60)
  const ps = Math.floor(paceSeconds % 60)
  return `${pm}p ${String(ps).padStart(2, '0')}s/km`
}

export default function SportEventProgress({
  event,
  userProgress
}) {
  const [timeFilter, setTimeFilter] = useState('7d')
  const [customRange, setCustomRange] = useState(null) // { startDate, endDate }
  const [highlightDate, setHighlightDate] = useState(null)
  const [activeMetric, setActiveMetric] = useState('progress') // 'progress' | 'distance' | 'calories'
  const [shareActivity, setShareActivity] = useState(null) // activity to share
  const [selectedActivityId, setSelectedActivityId] = useState(null)
  const [isCompletionModal, setIsCompletionModal] = useState(false)
  const [deleteActivity, setDeleteActivity] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const [isOpenStravaModal, setIsOpenStravaModal] = useState(false)
  const activityListRef = useRef(null)
  const activityItemRefs = useRef({})

  // Fetch sport categories to get the correct icon for this event's category
  const { data: categoriesData } = useQuery({
    queryKey: ['sportCategories'],
    queryFn: () => sportCategoryApi.getAll(),
    staleTime: 60 * 1000
  })
  const categoryIconKey = useMemo(() => {
    const cats = categoriesData?.data?.result || categoriesData?.data || []
    const matched = cats.find(c => c.name === event?.category)
    return matched?.icon || 'sport'
  }, [categoriesData, event?.category])
  const CategoryIcon = getSportIcon(categoryIconKey)

  // Auto-open modal when redirected from GPS tracking completion
  useEffect(() => {
    const completedId = searchParams.get('completed')
    if (completedId) {
      setSelectedActivityId(completedId)
      setIsCompletionModal(true)
      // Clean up the URL param without causing navigation
      searchParams.delete('completed')
      searchParams.delete('tab')
      setSearchParams(searchParams, { replace: true })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch user's GPS activities for this event
  const { data: activitiesData } = useQuery({
    queryKey: ['userActivities', id],
    queryFn: () => getUserActivities(id),
    enabled: !!id && event?.eventType === 'Ngoài trời'
  })
  const activitiesResult = activitiesData?.data?.result
  // Chỉ tính activities từ startDate hiện tại của sự kiện (fallback server-side filter)
  const completedActivities = useMemo(() => {
    const all = activitiesResult?.activities?.filter(a => a.status === 'completed') || []
    const eventStart = event?.startDate ? moment(event.startDate).startOf('day') : null
    if (!eventStart) return all
    return all.filter(a => moment(a.startTime).isSameOrAfter(eventStart))
  }, [activitiesResult, event?.startDate])

  // Share activity to community — open modal inline
  const handleShare = (e, activity) => {
    e.stopPropagation()
    setShareActivity(activity)
  }



  // Filter GPS activities by time range
  const filteredActivities = useMemo(() => {
    if (customRange) {
      const start = moment(customRange.startDate).startOf('day')
      const end = moment(customRange.endDate).endOf('day')
      return completedActivities.filter(a => moment(a.startTime).isBetween(start, end, null, '[]'))
    }
    if (timeFilter === 'all') return completedActivities
    let cutoff
    switch (timeFilter) {
      case '24h': cutoff = moment().subtract(24, 'hours'); break
      case '7d': cutoff = moment().subtract(7, 'days'); break
      case '1m': cutoff = moment().subtract(1, 'month'); break
      case '6m': cutoff = moment().subtract(6, 'months'); break
      case '1y': cutoff = moment().subtract(1, 'year'); break
      default: return completedActivities
    }
    return completedActivities.filter(a => moment(a.startTime).isAfter(cutoff))
  }, [completedActivities, timeFilter, customRange])

  // Today's GPS stats for the top banner (always today, unaffected by filter)
  const todayGpsStats = useMemo(() => {
    const today = moment().startOf('day')
    const todaysActivities = completedActivities.filter(a => moment(a.startTime).isSame(today, 'day'))

    const distance = todaysActivities.reduce((sum, a) => sum + parseFloat((a.totalDistance / 1000).toFixed(2)), 0)
    const duration = todaysActivities.reduce((sum, a) => sum + a.totalDuration, 0)
    return {
      totalSessions: todaysActivities.length,
      totalDistance: distance.toFixed(2),
      totalDuration: formatDuration(duration)
    }
  }, [completedActivities])

  // Aggregate stats from filtered GPS activities (react to time filter)
  const gpsStats = useMemo(() => {
    if (!filteredActivities.length) return null
    const totalDistance = filteredActivities.reduce((sum, a) => sum + parseFloat((a.totalDistance / 1000).toFixed(2)), 0)
    const totalCalories = filteredActivities.reduce((sum, a) => sum + roundKcal(a.calories), 0)
    const totalDuration = filteredActivities.reduce((sum, a) => sum + a.totalDuration, 0)
    const avgSpeed = totalDuration > 0 ? (totalDistance / (totalDuration / 3600)).toFixed(2) : 0

    // Weekly Streak (always from all activities)
    const weekSet = new Set()
    completedActivities.forEach(a => {
      weekSet.add(moment(a.startTime).format('YYYY-[W]WW'))
    })
    let streak = 0
    let checkWeek = moment()
    while (weekSet.has(checkWeek.format('YYYY-[W]WW'))) {
      streak++
      checkWeek = checkWeek.subtract(1, 'week')
    }

    return {
      totalSessions: filteredActivities.length,
      totalDistance: totalDistance.toFixed(2),
      totalCalories,
      totalDuration: formatDuration(totalDuration),
      avgSpeed,
      weeklyStreak: streak
    }
  }, [filteredActivities, completedActivities])

  // Total GPS stats for progress overview — always ALL activities (independent of time filter)
  const allTimeGpsStats = useMemo(() => {
    if (!completedActivities.length) return null
    const totalDistance = completedActivities.reduce((sum, a) => sum + parseFloat((a.totalDistance / 1000).toFixed(2)), 0)
    const totalCalories = completedActivities.reduce((sum, a) => sum + roundKcal(a.calories), 0)
    return { totalDistance, totalCalories, totalSessions: completedActivities.length }
  }, [completedActivities])

  // Calculate stats from userProgress — with NaN/zero guards
  const stats = useMemo(() => {
    if (!userProgress) return null
    const { totalProgress, totalDistance, totalCalories, totalEntries } = userProgress
    const maxParticipants = event?.maxParticipants > 0 ? event.maxParticipants : 1
    const perPersonTarget = (event?.targetValue && event.targetValue > 0) ? event.targetValue / maxParticipants : 0
    const rawPercent = perPersonTarget > 0 ? (totalProgress / perPersonTarget) * 100 : 0
    const progressPercent = isNaN(rawPercent) ? 0 : Math.min(Math.round(rawPercent), 100)
    return {
      totalProgress,
      progressPercent,
      perPersonTarget,
      totalDistance: totalDistance?.toFixed(2) || 0,
      totalCalories: totalCalories || 0,
      totalEntries
    }
  }, [userProgress, event])

  // Handle time filter change from dropdown
  const handleTimeChange = useCallback((filterObj) => {
    if (filterObj.period) {
      setTimeFilter(filterObj.period)
      setCustomRange(null)
    } else if (filterObj.startDate && filterObj.endDate) {
      setTimeFilter('custom')
      setCustomRange({ startDate: filterObj.startDate, endDate: filterObj.endDate })
    }
  }, [])

  // Filter subtitle
  const filterSubtitle = useMemo(() => {
    if (customRange) {
      const s = moment(customRange.startDate).format('DD/MM/YYYY')
      const e = moment(customRange.endDate).format('DD/MM/YYYY')
      return `${s} → ${e}`
    }
    return FILTER_LABELS[timeFilter] || ''
  }, [timeFilter, customRange])

  // Chart data computation
  const chartData = useMemo(() => {
    if (activeMetric !== 'progress' && event?.eventType === 'Ngoài trời') {
      // Build chart from GPS activities
      const field = activeMetric === 'distance' ? 'totalDistance' : 'calories'
      const divisor = activeMetric === 'distance' ? 1000 : 1
      const precision = activeMetric === 'distance' ? 2 : 0

      // 24h → show per-activity bars
      if (timeFilter === '24h' && !customRange) {
        const cutoff = moment().subtract(24, 'hours')
        const recentActivities = completedActivities
          .filter(a => moment(a.startTime).isAfter(cutoff))
          .sort((a, b) => moment(a.startTime).diff(moment(b.startTime)))

        return recentActivities.map(a => {
          const duration = a.totalDuration || 0
          const distance = parseFloat((a.totalDistance / 1000).toFixed(2))
          const avgSpeed = duration > 0 ? Number((distance / (duration / 3600)).toFixed(2)) : 0

          let value = 0
          switch (activeMetric) {
            case 'distance': value = Number(distance.toFixed(2)); break
            case 'calories': value = roundKcal(a.calories); break
            case 'sessions': value = 1; break
            case 'speed': value = avgSpeed; break
            default: value = 0
          }

          return {
            date: moment(a.startTime).format('HH:mm'),
            fullDate: moment(a.startTime).format('YYYY-MM-DD'),
            value: value,
            distance: Number(distance.toFixed(2)),
            calories: roundKcal(a.calories),
            sessions: 1,
            avgSpeed: avgSpeed,
            duration: duration
          }
        })
      }

      // Group by date with all 4 metrics
      const dayMap = {}
      completedActivities.forEach(a => {
        const d = moment(a.startTime).format('DD/MM')
        const fd = moment(a.startTime).format('YYYY-MM-DD')
        if (!dayMap[fd]) dayMap[fd] = { distance: 0, calories: 0, sessions: 0, duration: 0 }
        dayMap[fd].distance += parseFloat((a.totalDistance / 1000).toFixed(2))
        dayMap[fd].calories += roundKcal(a.calories)
        dayMap[fd].sessions += 1
        dayMap[fd].duration += a.totalDuration
      })

      Object.keys(dayMap).forEach(fd => {
        const { distance, duration } = dayMap[fd]
        dayMap[fd].avgSpeed = duration > 0 ? Number((distance / (duration / 3600)).toFixed(2)) : 0
        dayMap[fd].distance = Number(distance.toFixed(2))
      })

      const getValue = (fd) => {
        if (!dayMap[fd]) return 0
        switch (activeMetric) {
          case 'distance': return dayMap[fd].distance
          case 'calories': return dayMap[fd].calories
          case 'sessions': return dayMap[fd].sessions
          case 'speed': return dayMap[fd].avgSpeed
          default: return 0
        }
      }

      // Custom date range
      if (customRange) {
        const start = moment(customRange.startDate)
        const end = moment(customRange.endDate)
        const totalDays = end.diff(start, 'days') + 1
        return Array.from({ length: totalDays }, (_, i) => {
          const d = moment(start).add(i, 'days')
          const fd = d.format('YYYY-MM-DD')
          return {
            date: d.format('DD/MM'),
            fullDate: fd,
            value: getValue(fd),
            distance: dayMap[fd]?.distance || 0,
            calories: dayMap[fd]?.calories || 0,
            sessions: dayMap[fd]?.sessions || 0,
            avgSpeed: dayMap[fd]?.avgSpeed || 0
          }
        }).filter((_, i, arr) => arr.length <= 30 || i % Math.ceil(arr.length / 30) === 0)
      }

      // 7d → 7 cột theo ngày
      if (timeFilter === '7d') {
        return Array.from({ length: 7 }, (_, i) => {
          const d = moment().subtract(6 - i, 'days')
          const fd = d.format('YYYY-MM-DD')
          return {
            date: d.format('DD/MM'),
            fullDate: fd,
            value: getValue(fd),
            distance: dayMap[fd]?.distance || 0,
            calories: dayMap[fd]?.calories || 0,
            sessions: dayMap[fd]?.sessions || 0,
            avgSpeed: dayMap[fd]?.avgSpeed || 0
          }
        })
      }

      // all → group by tháng (≤12 cột)
      if (timeFilter === 'all') {
        const monthMap = {}
        Object.keys(dayMap).forEach(fd => {
          const key = moment(fd).format('MM/YY')
          if (!monthMap[key]) monthMap[key] = { date: key, fullDate: moment(fd).format('YYYY-MM'), distance: 0, calories: 0, sessions: 0, duration: 0 }
          monthMap[key].distance += dayMap[fd].distance
          monthMap[key].calories += dayMap[fd].calories
          monthMap[key].sessions += dayMap[fd].sessions
          monthMap[key].duration += dayMap[fd].duration
        })
        return Object.values(monthMap).map(m => {
          const avgSpd = m.duration > 0 ? Number((m.distance / (m.duration / 3600)).toFixed(2)) : 0
          const v = activeMetric === 'distance' ? m.distance : activeMetric === 'calories' ? m.calories : activeMetric === 'sessions' ? m.sessions : avgSpd
          return { ...m, avgSpeed: avgSpd, value: v }
        }).slice(-12)
      }

      // 1m → 5 tuần, 6m → 26 tuần, 1y → 52 tuần
      const numWeeks = timeFilter === '6m' ? 26 : timeFilter === '1y' ? 52 : 5
      const gpsWeeks = []
      for (let i = numWeeks - 1; i >= 0; i--) {
        const weekStart = moment().subtract(i * 7 + 6, 'days')
        const weekEnd = moment().subtract(i * 7, 'days')
        gpsWeeks.push({ date: weekStart.format('DD/MM'), fullDate: weekStart.format('YYYY-MM-DD'), weekEnd: weekEnd.format('YYYY-MM-DD'), distance: 0, calories: 0, sessions: 0, duration: 0 })
      }
      Object.keys(dayMap).forEach(fd => {
        const fdMoment = moment(fd)
        const week = gpsWeeks.find(w => fdMoment.isBetween(moment(w.fullDate), moment(w.weekEnd), 'day', '[]'))
        if (week) {
          week.distance += dayMap[fd].distance
          week.calories += dayMap[fd].calories
          week.sessions += dayMap[fd].sessions
          week.duration += dayMap[fd].duration
        }
      })
      return gpsWeeks.map(w => {
        const avgSpd = w.duration > 0 ? Number((w.distance / (w.duration / 3600)).toFixed(2)) : 0
        const v = activeMetric === 'distance' ? w.distance : activeMetric === 'calories' ? w.calories : activeMetric === 'sessions' ? w.sessions : avgSpd
        return { ...w, avgSpeed: avgSpd, value: v }
      })
    }

    // Default: use progressHistory
    if (!userProgress?.progressHistory) return []

    if (timeFilter === '24h' && !customRange) {
      const cutoff = moment().subtract(24, 'hours')
      const recentProgress = userProgress.progressHistory
        .filter(entry => moment(entry.date).isAfter(cutoff))
        .sort((a, b) => moment(a.date).diff(moment(b.date)))

      return recentProgress.map(entry => ({
        date: moment(entry.date).format('HH:mm'),
        fullDate: moment(entry.date).format('YYYY-MM-DD'),
        value: entry.value
      }))
    }

    // Custom date range
    if (customRange) {
      const start = moment(customRange.startDate)
      const end = moment(customRange.endDate)
      const totalDays = end.diff(start, 'days') + 1

      if (totalDays > 90) {
        // Group by month
        const monthMap = {}
        userProgress.progressHistory.forEach(entry => {
          const em = moment(entry.date)
          if (em.isBetween(start, end, 'day', '[]')) {
            const key = em.format('MM/YY')
            if (!monthMap[key]) monthMap[key] = { date: key, fullDate: em.format('YYYY-MM'), value: 0 }
            monthMap[key].value += entry.value
          }
        })
        return Object.values(monthMap)
      }

      const arr = Array.from({ length: totalDays }, (_, i) => {
        const d = moment(start).add(i, 'days')
        return { date: d.format('DD/MM'), fullDate: d.format('YYYY-MM-DD'), value: 0 }
      })
      userProgress.progressHistory.forEach(entry => {
        const entryDate = moment(entry.date).format('YYYY-MM-DD')
        const day = arr.find(d => d.fullDate === entryDate)
        if (day) day.value += entry.value
      })
      if (arr.length > 30) {
        const step = Math.ceil(arr.length / 30)
        return arr.filter((_, i) => i % step === 0)
      }
      return arr
    }

    const getDays = () => {
      switch (timeFilter) {
        case '24h': return 1
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

    // 7d → 7 cột theo ngày
    if (days === 7) {
      const arr = Array.from({ length: 7 }, (_, i) => {
        const d = moment().subtract(6 - i, 'days')
        return { date: d.format('DD/MM'), fullDate: d.format('YYYY-MM-DD'), value: 0 }
      })
      userProgress.progressHistory.forEach(entry => {
        const entryDate = moment(entry.date).format('YYYY-MM-DD')
        const day = arr.find(d => d.fullDate === entryDate)
        if (day) day.value += entry.value
      })
      return arr
    } else {
      // 1m → 5 tuần, 6m → 26 tuần, 1y → 52 tuần
      const numWeeks = days <= 31 ? 5 : Math.ceil(days / 7)
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
  }, [userProgress, timeFilter, activeMetric, completedActivities, customRange])

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

  // Determine displayed stats
  const isOutdoor = event?.eventType === 'Ngoài trời'
  const isEnded = event?.endDate ? moment().isAfter(moment(event.endDate)) : false
  const isNotStarted = event?.startDate ? moment().isBefore(moment(event.startDate)) : false
  
  // Progress overview: for outdoor events, use GPS total (matches "Quãng đường" when "Tất cả")
  const displayProgress = isOutdoor && allTimeGpsStats ? allTimeGpsStats.totalDistance : (stats?.totalProgress || 0)
  // Stats detail: time-filtered from GPS for outdoor, otherwise from SportEventProgress
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
          userProgress={userProgress}
          onClose={() => setShareActivity(null)}
        />
      )}

      {/* Strava Sync Modal */}
      <StravaSyncModal
        isOpen={isOpenStravaModal}
        onClose={() => setIsOpenStravaModal(false)}
        eventId={id}
        onImportSuccess={() => {
          queryClient.invalidateQueries(['userActivities', id])
          queryClient.invalidateQueries(['sportEvent', id])
        }}
      />

      {/* Activity Tracking Button - only for outdoor events */}
      {isOutdoor && (
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 shadow-lg text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold mb-1">🏃 Ghi hoạt động ngoài trời</h3>
              <p className="text-sm opacity-90">Bắt đầu ghi quãng đường và tốc độ khi bạn di chuyển trong ngày</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {gpsStats?.weeklyStreak > 0 && (
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2 text-center w-full sm:w-auto mb-2 sm:mb-0">
                  <p className="text-lg font-black">🔥 {gpsStats.weeklyStreak}</p>
                  <p className="text-[10px] opacity-80">tuần liên tiếp</p>
                </div>
              )}
              <div className="flex gap-2 w-full sm:w-auto">
                {isEnded || isNotStarted ? (
                  <div className="flex-1 sm:flex-none bg-white/20 px-4 py-3 rounded-xl font-bold text-sm text-center shadow-sm w-full flex items-center justify-center">
                    {isEnded ? 'Sự kiện đã kết thúc' : 'Sự kiện chưa bắt đầu'}
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => navigate(`/sport-event/${id}/tracking`)}
                      className="flex-1 sm:flex-none bg-white text-red-500 px-4 py-3 rounded-xl font-bold text-sm hover:bg-gray-100 transition shadow-lg flex items-center justify-center gap-2"
                    >
                      <FaMapMarkerAlt />
                      Bắt đầu ghi
                    </button>
                    <button
                      onClick={() => setIsOpenStravaModal(true)}
                      className="flex-1 sm:flex-none bg-[#fc4c02] text-white px-4 py-3 rounded-xl font-bold text-sm hover:bg-[#e34402] transition shadow-lg flex items-center justify-center gap-2 border border-white/20"
                      title="Đồng bộ dữ liệu từ Strava"
                    >
                      <svg className="w-5 h-5 fill-current text-white shrink-0" viewBox="0 0 24 24"><path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"></path></svg>
                      Đồng bộ Strava
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
          {todayGpsStats && (
            <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{todayGpsStats.totalSessions}</p>
                <p className="text-xs opacity-80">Lần hoạt động</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{todayGpsStats.totalDistance}</p>
                <p className="text-xs opacity-80">km tổng</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{todayGpsStats.totalDuration}</p>
                <p className="text-xs opacity-80">Thời gian</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 1. Progress Overview - Independent of Time Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 flex flex-col md:flex-row items-center gap-8">
          <div className="relative flex-shrink-0">
            {(() => {
              const progressPercent = isOutdoor && allTimeGpsStats && stats?.perPersonTarget > 0
                ? Math.min(Math.round((allTimeGpsStats.totalDistance / stats.perPersonTarget) * 100), 100)
                : (stats?.progressPercent || 0)
              return (
                <ProgressRing
                  size={180}
                  strokeWidth={16}
                  percent={progressPercent}
                  color="#ef4444"
                  colorEnd={progressPercent >= 100 ? '#22c55e' : '#f97316'}
                  label={`${progressPercent}%`}
                  sublabel="hoàn thành"
                  showPercent={false}
                />
              )
            })()}
          </div>
          <div className="flex-1 w-full">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Tiến độ tổng quan</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Mục tiêu cá nhân:{' '}
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {stats?.perPersonTarget > 0 ? `${stats.perPersonTarget.toFixed(2)} ${event.targetUnit}` : 'Chưa thiết lập'}
              </span>
            </p>
            <div
              onClick={() => setActiveMetric('progress')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all max-w-sm ${activeMetric === 'progress'
                ? 'border-red-400 bg-red-50 dark:bg-red-900/20 shadow-md ring-1 ring-red-400'
                : 'border-gray-100 dark:border-gray-700 hover:border-red-200 bg-gray-50 dark:bg-gray-800/50'
                }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 to-orange-500" />
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Tiến độ đạt được</span>
              </div>
              <p className="text-2xl font-black text-gray-800 dark:text-white">
                {Number(displayProgress || 0).toFixed(2)} <span className="text-sm font-medium text-gray-400">{event.targetUnit}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Activity Stats — Dropdown in header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mt-8">
        <div className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 px-6 py-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Thống kê chi tiết</h3>
            {filterSubtitle && <p className="text-gray-500 text-xs mt-0.5">📅 {filterSubtitle}</p>}
          </div>
          <TimeRangeDropdown
            value={timeFilter}
            onChange={handleTimeChange}
            accentColor="blue"
          />
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Distance stat */}
            <div
              onClick={() => setActiveMetric('distance')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${activeMetric === 'distance'
                ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 shadow-md ring-1 ring-blue-400'
                : 'border-gray-100 dark:border-gray-700 hover:border-blue-200 bg-white dark:bg-gray-800'
                }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" />
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Quãng đường</span>
              </div>
              <p className="text-xl font-black text-gray-800 dark:text-white">
                {displayDistance} <span className="text-sm font-medium text-gray-400">km</span>
              </p>
            </div>

            {/* Calories stat */}
            <div
              onClick={() => setActiveMetric('calories')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${activeMetric === 'calories'
                ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20 shadow-md ring-1 ring-orange-400'
                : 'border-gray-100 dark:border-gray-700 hover:border-orange-200 bg-white dark:bg-gray-800'
                }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-orange-500 to-yellow-500" />
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Calories</span>
              </div>
              <p className="text-xl font-black text-gray-800 dark:text-white">
                {displayCalories} <span className="text-sm font-medium text-gray-400">kcal</span>
              </p>
            </div>

            {/* Sessions stat */}
            <div
              onClick={() => setActiveMetric('sessions')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${activeMetric === 'sessions'
                ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 shadow-md ring-1 ring-emerald-400'
                : 'border-gray-100 dark:border-gray-700 hover:border-emerald-200 bg-white dark:bg-gray-800'
                }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Lần hoạt động</span>
              </div>
              <p className="text-xl font-black text-gray-800 dark:text-white">
                {displaySessions || 0} <span className="text-sm font-medium text-gray-400">lần</span>
              </p>
            </div>

            {/* Speed stat */}
            <div
              onClick={() => isOutdoor && setActiveMetric('speed')}
              className={`p-4 rounded-2xl border-2 transition-all ${!isOutdoor ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${activeMetric === 'speed'
                ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/20 shadow-md ring-1 ring-purple-400'
                : 'border-gray-100 dark:border-gray-700 hover:border-purple-200 bg-white dark:bg-gray-800'
                }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500" />
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Vận tốc TB</span>
              </div>
              <p className="text-xl font-black text-gray-800 dark:text-white">
                {isOutdoor && gpsStats ? gpsStats.avgSpeed : 0} <span className="text-sm font-medium text-gray-400">km/h</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 2. Chart Section */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">

            {/* Chart Header */}
            <div className="px-6 pt-6 pb-2 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg"
                  style={{ background: `linear-gradient(135deg, ${barColor}, ${barColor}99)` }}>
                  <FaChartLine />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                    Lịch sử
                    <span className="text-sm font-normal text-gray-400 ml-1">({metricUnit})</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {timeFilter === '24h'
                      ? 'Hiển thị từng hoạt động trong 24 giờ qua'
                      : 'Nhấn vào cột để xem chi tiết ngày đó'}
                  </p>
                </div>
              </div>
              {/* Legend dots */}
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: barColor }} />
                  Có dữ liệu
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-200 dark:bg-gray-600" />
                  Không có
                </span>
              </div>
            </div>

            <div className="px-6 pb-6 pt-2">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 28, right: 8, left: -8, bottom: 4 }}
                    barCategoryGap="20%"
                  >
                    <defs>
                      <linearGradient id="barGradientRed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#EF4444" stopOpacity={1} />
                        <stop offset="100%" stopColor="#F97316" stopOpacity={0.85} />
                      </linearGradient>
                      <linearGradient id="barGradientBlue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity={1} />
                        <stop offset="100%" stopColor="#06B6D4" stopOpacity={0.85} />
                      </linearGradient>
                      <linearGradient id="barGradientOrange" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F97316" stopOpacity={1} />
                        <stop offset="100%" stopColor="#FBBF24" stopOpacity={0.85} />
                      </linearGradient>
                      <linearGradient id="barGradientGreen" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity={1} />
                        <stop offset="100%" stopColor="#14B8A6" stopOpacity={0.85} />
                      </linearGradient>
                      <linearGradient id="barGradientPurple" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8B5CF6" stopOpacity={1} />
                        <stop offset="100%" stopColor="#6366F1" stopOpacity={0.85} />
                      </linearGradient>
                      <linearGradient id="barGradientHighlight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8B5CF6" stopOpacity={1} />
                        <stop offset="100%" stopColor="#A78BFA" stopOpacity={0.9} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="4 4"
                      vertical={false}
                      stroke="#E5E7EB"
                      strokeOpacity={0.6}
                    />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 500 }}
                      dy={8}
                      interval={chartData.length > 10 ? Math.floor(chartData.length / 7) : 0}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9CA3AF', fontSize: 11 }}
                      width={40}
                      tickFormatter={(v) => {
                        if (v >= 1000) return `${(v / 1000).toFixed(1)}k`
                        return v % 1 === 0 ? v : v.toFixed(1)
                      }}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(99, 102, 241, 0.06)', radius: 8 }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload
                          if (isOutdoor) {
                            const dayActs = completedActivities.filter(a => moment(a.startTime).format('YYYY-MM-DD') === d.fullDate)
                            const dist = d.distance != null ? d.distance : Number((dayActs.reduce((s, a) => s + a.totalDistance / 1000, 0)).toFixed(2))
                            const cal = d.calories != null ? d.calories : dayActs.reduce((s, a) => s + roundKcal(a.calories), 0)
                            const sess = d.sessions != null ? d.sessions : dayActs.length
                            const dur = dayActs.reduce((s, a) => s + a.totalDuration, 0)
                            const spd = d.avgSpeed != null ? d.avgSpeed : (dur > 0 ? Number((dist / (dur / 3600)).toFixed(2)) : 0)
                            return (
                              <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md p-4 shadow-2xl rounded-2xl border border-gray-100/50 dark:border-gray-700/50 text-sm min-w-[180px]">
                                <p className="font-bold text-gray-800 dark:text-white mb-3 pb-2 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full" style={{ background: barColor }} />
                                  {d.date}
                                </p>
                                <div className="space-y-2">
                                  <p className="flex justify-between items-center gap-4">
                                    <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><FaRoad className="text-blue-400 text-[10px]" />Quãng đường</span>
                                    <span className="font-bold text-blue-500">{dist} km</span>
                                  </p>
                                  <p className="flex justify-between items-center gap-4">
                                    <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><FaFire className="text-orange-400 text-[10px]" />Calories</span>
                                    <span className="font-bold text-orange-500">{cal} kcal</span>
                                  </p>
                                  <p className="flex justify-between items-center gap-4">
                                    <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><FaRunning className="text-emerald-400 text-[10px]" />Hoạt động</span>
                                    <span className="font-bold text-emerald-500">{sess} lần</span>
                                  </p>
                                  <p className="flex justify-between items-center gap-4">
                                    <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><FaBolt className="text-indigo-400 text-[10px]" />Vận tốc TB</span>
                                    <span className="font-bold text-indigo-500">{spd} km/h</span>
                                  </p>
                                </div>
                              </div>
                            )
                          }
                          return (
                            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md p-4 shadow-2xl rounded-2xl border border-gray-100/50 dark:border-gray-700/50 text-sm">
                              <p className="font-bold text-gray-800 dark:text-white mb-2 pb-2 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full" style={{ background: barColor }} />
                                {d.date}
                              </p>
                              <p className="font-bold" style={{ color: barColor }}>{d.value} {metricUnit}</p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Bar
                      dataKey="value"
                      radius={[6, 6, 0, 0]}
                      onClick={(data) => handleBarClick(data)}
                      style={{ cursor: 'pointer' }}
                      animationDuration={800}
                      animationEasing="ease-out"
                    >
                      <LabelList
                        dataKey="value"
                        position="top"
                        style={{ fontSize: 10, fontWeight: 600, fill: '#6B7280' }}
                        formatter={(v) => {
                          if (!v || v <= 0) return ''
                          if (v >= 1000) return `${(v / 1000).toFixed(1)}k`
                          return v % 1 === 0 ? v : v.toFixed(1)
                        }}
                        offset={6}
                      />
                      {chartData.map((entry, index) => {
                        const gradientMap = {
                          progress: 'url(#barGradientRed)',
                          distance: 'url(#barGradientBlue)',
                          calories: 'url(#barGradientOrange)',
                          sessions: 'url(#barGradientGreen)',
                          speed: 'url(#barGradientPurple)'
                        }
                        const isHighlighted = entry.fullDate === highlightDate
                        const isEmpty = !entry.value || entry.value <= 0
                        let fill = isEmpty ? '#F3F4F6' : (gradientMap[activeMetric] || 'url(#barGradientRed)')
                        if (isHighlighted) fill = 'url(#barGradientHighlight)'
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={fill}
                          />
                        )
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
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
                    const distKm = activity.totalDistance / 1000
                    const speedKmh = activity.avgSpeed ? (activity.avgSpeed * 3.6) : (activity.totalDuration > 0 ? (distKm / (activity.totalDuration / 3600)) : 0)
                    const pace = formatPace(activity.totalDuration, distKm)
                    return (
                      <div
                        key={activity._id}
                        ref={el => { activityItemRefs.current[activity._id] = el }}
                        data-date={actDate}
                        onClick={() => { setSelectedActivityId(activity._id); setIsCompletionModal(false) }}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${isHighlighted
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md ring-2 ring-blue-400'
                          : 'border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600'
                          }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${activity.source === 'strava'
                            ? 'bg-orange-50 dark:bg-orange-900/20 text-[#fc4c02]'
                            : 'bg-blue-50 dark:bg-blue-900/20 text-blue-500'
                            }`}>
                            {activity.source === 'strava' ? <SiStrava /> : <CategoryIcon />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate flex items-center gap-1.5">
                                {activity.source === 'strava' ? 'Strava' : (event?.category || activity.activityType)}
                              </h4>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <span className="text-xs text-gray-400">
                                  {moment(activity.startTime).format('DD/MM HH:mm')}
                                </span>
                                <button
                                  onClick={(e) => handleShare(e, activity)}
                                  title="Chia sẻ lên cộng đồng"
                                  className="p-1.5 rounded-lg transition-all bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-orange-100 hover:text-orange-500 dark:hover:bg-orange-900/20"
                                >
                                  <FaShareAlt className="text-xs" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setDeleteActivity(activity) }}
                                  title="Xóa hoạt động"
                                  className="p-1.5 rounded-lg transition-all bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/20"
                                >
                                  <FaTrash className="text-xs" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Row 2: stats chips */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 pl-[52px] text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <FaRoad className="text-[10px] text-blue-400" />
                            {distKm.toFixed(2)} km
                          </span>
                          <span className="flex items-center gap-1">
                            <FaBolt className="text-[10px] text-purple-400" />
                            {Number(speedKmh).toFixed(2)} km/h
                          </span>
                          <span className="flex items-center gap-1">
                            <FaFire className="text-[10px] text-orange-400" />
                            {roundKcal(activity.calories)} kcal
                          </span>
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

      {/* Activity Detail Modal */}
      {selectedActivityId && (
        <ActivityDetailModal
          activityId={selectedActivityId}
          eventId={id}
          event={event}
          isCompletion={isCompletionModal}
          onClose={() => { setSelectedActivityId(null); setIsCompletionModal(false) }}
          onShare={(activity) => {
            setSelectedActivityId(null)
            setIsCompletionModal(false)
            setShareActivity(activity)
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteActivity && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" onClick={() => !isDeleting && setDeleteActivity(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                <FaTrash className="text-red-500 text-xl" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Xóa hoạt động?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                <strong>{event?.category || deleteActivity.activityType} — {(deleteActivity.totalDistance / 1000).toFixed(2)} km</strong>
              </p>
              <p className="text-xs text-gray-400 mb-6">
                {moment(deleteActivity.startTime).format('HH:mm DD/MM/YYYY')} • {formatDuration(deleteActivity.totalDuration)} • {roundKcal(deleteActivity.calories)} kcal
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteActivity(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={async () => {
                  setIsDeleting(true)
                  try {
                    await softDeleteActivity(id, deleteActivity._id)
                    queryClient.invalidateQueries({ queryKey: ['userActivities', id] })
                    queryClient.invalidateQueries({ queryKey: ['userProgress', id] })
                    toast.success('Đã xóa hoạt động')
                    setDeleteActivity(null)
                  } catch (err) {
                    toast.error(err?.response?.data?.message || 'Xóa thất bại')
                  } finally {
                    setIsDeleting(false)
                  }
                }}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
