import React, { useCallback, useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useQuery } from '@tanstack/react-query'
import { vnMoment } from '../../utils/vnDateUtils'
import goongjs from '@goongmaps/goong-js'
import '@goongmaps/goong-js/dist/goong-js.css'
import {
  FaTimes,
  FaClock,
  FaFire,
  FaRoad,
  FaRunning,
  FaChartLine,
  FaChevronLeft,
  FaChevronRight,
  FaFilter,
  FaChevronDown,
  FaAngleRight,
  FaRoute,
  FaUserMinus,
  FaRobot,
  FaStopwatch
} from 'react-icons/fa'
import { MdVideocam, MdEdit, MdGpsFixed, MdMap } from 'react-icons/md'
import { getParticipantProgressHistory, getActivity } from '../../apis/sportEventApi'
import { roundKcal } from '../../utils/mathUtils'
import ProgressRing from './ProgressRing'
import TimeRangeDropdown from './TimeRangeDropdown'
import toast from 'react-hot-toast'

goongjs.accessToken = import.meta.env.VITE_GOONG_MAPTILES_KEY

const PAGE_SIZE = 10

function InlineActivityMap({ eventId, activityId }) {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)

  const { data, isLoading } = useQuery({
    queryKey: ['activityDetail', 'event', eventId, activityId],
    queryFn: () => getActivity(eventId, activityId),
    enabled: !!activityId && !!eventId,
    staleTime: 30000
  })

  const activity = data?.data?.result

  useEffect(() => {
    if (!activity || !mapContainerRef.current || mapRef.current) return
    const routePositions = (activity.gpsRoute || []).map((p) => [p.lng, p.lat])
    if (routePositions.length === 0) return

    const map = new goongjs.Map({
      container: mapContainerRef.current,
      style: 'https://tiles.goong.io/assets/goong_map_web.json',
      center: routePositions[0],
      zoom: 14
    })
    mapRef.current = map

    map.on('load', () => {
      map.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: routePositions }
        }
      })
      map.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#4f46e5', 'line-width': 4 }
      })

      const startEl = document.createElement('div')
      startEl.className = 'w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-md'
      new goongjs.Marker(startEl).setLngLat(routePositions[0]).addTo(map)

      const endEl = document.createElement('div')
      endEl.className = 'w-4 h-4 bg-red-500 border-2 border-white rounded-full shadow-md'
      new goongjs.Marker(endEl).setLngLat(routePositions[routePositions.length - 1]).addTo(map)

      const bounds = routePositions.reduce(
        (b, coord) => b.extend(coord),
        new goongjs.LngLatBounds(routePositions[0], routePositions[0])
      )
      map.fitBounds(bounds, { padding: 40 })
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [activity])

  if (isLoading) {
    return (
      <div className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse flex flex-col items-center justify-center border border-slate-200 dark:border-slate-700">
        <MdMap className="text-3xl text-slate-300 dark:text-slate-600 mb-3" />
        <p className="text-sm text-slate-500 font-medium">Đang tải bản đồ lộ trình...</p>
      </div>
    )
  }

  if (!activity || !activity.gpsRoute || activity.gpsRoute.length === 0) {
    return (
      <div className="h-64 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center border border-slate-200 dark:border-slate-700">
        <FaRoute className="text-3xl text-slate-300 dark:text-slate-600 mb-3" />
        <p className="text-sm text-slate-500 font-medium">Không có dữ liệu lộ trình GPS</p>
      </div>
    )
  }

  return (
    <div className="relative h-64 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 group shadow-sm">
      <div ref={mapContainerRef} className="absolute inset-0" />
      <div className="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm border border-slate-200/50 dark:border-slate-700/50 flex items-center gap-2">
        <MdGpsFixed className="text-indigo-600 dark:text-indigo-400 text-sm" />
        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
          GPS Route
        </span>
      </div>
    </div>
  )
}

function getAiQualityLabel(pct) {
  if (pct == null || !Number.isFinite(pct)) return '—'
  if (pct >= 90) return 'Xuất sắc'
  if (pct >= 70) return 'Tốt'
  if (pct >= 50) return 'Trung bình'
  return 'Thấp'
}

function formatDurationSeconds(seconds) {
  if (seconds == null || !Number.isFinite(seconds) || seconds <= 0) return '0p 00s'
  const s = Math.floor(seconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}g ${String(m).padStart(2, '0')}p ${String(sec).padStart(2, '0')}s`
  return `${m}p ${String(sec).padStart(2, '0')}s`
}

const SOURCE_META = {
  gps: { label: 'GPS', Icon: MdGpsFixed, className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-200' },
  video_call: { label: 'Video', Icon: MdVideocam, className: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300 border-violet-200' },
  manual: { label: 'Thủ công', Icon: MdEdit, className: 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300 border-slate-200' }
}

function SourceBadge({ source }) {
  const meta = SOURCE_META[source] || SOURCE_META.manual
  const Icon = meta.Icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${meta.className}`}>
      <Icon className="text-xs shrink-0" />
      {meta.label}
    </span>
  )
}

function StatCard({ icon: Icon, label, value, colorClass = "text-indigo-500", bgClass = "bg-indigo-50 dark:bg-indigo-500/10" }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 shadow-sm">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${bgClass} ${colorClass}`}>
        <Icon />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide truncate">{label}</p>
        <p className="text-base font-bold text-slate-900 dark:text-white truncate">{value}</p>
      </div>
    </div>
  )
}

export default function ParticipantProgressModal({ open, event, participant, onClose, onKickClick }) {
  const [page, setPage] = useState(1)
  const [appliedFrom, setAppliedFrom] = useState('')
  const [appliedTo, setAppliedTo] = useState('')
  const [timeFilter, setTimeFilter] = useState('all')
  
  const [selectedActivityId, setSelectedActivityId] = useState(null)

  const eventId = event?._id
  const userId = participant?.userId != null ? String(participant.userId) : ''

  useEffect(() => {
    if (!open) return
    setPage(1)
    setAppliedFrom('')
    setAppliedTo('')
    setTimeFilter('all')
  }, [open, userId])

  const handleTimeChange = useCallback(({ period, startDate, endDate }) => {
    if (period) {
      setTimeFilter(period)
      if (period === 'all') {
        setAppliedFrom('')
        setAppliedTo('')
      } else {
        const to = vnMoment().endOf('day').format('YYYY-MM-DD')
        let from = ''
        switch (period) {
          case 'today': from = vnMoment().startOf('day').format('YYYY-MM-DD'); break
          case '7d': from = vnMoment().subtract(7, 'days').format('YYYY-MM-DD'); break
          case '1m': from = vnMoment().subtract(1, 'month').format('YYYY-MM-DD'); break
          case '6m': from = vnMoment().subtract(6, 'months').format('YYYY-MM-DD'); break
          default: from = ''; break;
        }
        setAppliedFrom(from)
        setAppliedTo(to)
      }
      setPage(1)
    } else if (startDate && endDate) {
      if (startDate > endDate) {
        toast.error('Ngày bắt đầu không được sau ngày kết thúc')
        return
      }
      setTimeFilter('custom')
      setAppliedFrom(startDate)
      setAppliedTo(endDate)
      setPage(1)
    }
  }, [])

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['participantProgressHistory', eventId, userId, page, appliedFrom, appliedTo],
    queryFn: async () => {
      const res = await getParticipantProgressHistory(eventId, userId, {
        page,
        limit: PAGE_SIZE,
        ...(appliedFrom ? { fromDate: appliedFrom } : {}),
        ...(appliedTo ? { toDate: appliedTo } : {})
      })
      return res.data?.result
    },
    enabled: open && !!eventId && !!userId,
    staleTime: 30 * 1000
  })

  if (!open || typeof document === 'undefined') return null

  const summary = data?.summary
  const entries = data?.entries || []
  const totalPages = Math.max(1, data?.totalPages || 1)
  const targetUnit = event?.targetUnit || ''
  const isIndoor = event?.eventType === 'Trong nhà'
  const perPersonTarget =
    event?.targetValue && event?.maxParticipants ? event.targetValue / Math.max(event.maxParticipants, 1) : event?.targetValue || 0
  const overallProgressValue =
    data?.overallPersonalProgress != null ? Number(data.overallPersonalProgress) : Number(summary?.totalProgress ?? 0)
  const percent =
    perPersonTarget > 0 ? Math.min(Math.round((overallProgressValue / perPersonTarget) * 100), 100) : 0

  const avgSpeedDisplay =
    summary?.avgSpeedKmh != null && Number.isFinite(summary.avgSpeedKmh) ? `${summary.avgSpeedKmh} km/h` : '—'

  const hasFilter = appliedFrom || appliedTo

  const modalBody = (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="relative w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col rounded-3xl bg-slate-50 dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800"
        role="dialog"
        aria-modal="true"
        aria-labelledby="participant-progress-title"
      >
        <div className="relative px-6 py-5 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <h2 id="participant-progress-title" className="text-xl font-bold text-slate-900 dark:text-white truncate">
              Hoạt động của <span className="text-indigo-600 dark:text-indigo-400">{participant?.name || 'Người tham gia'}</span>
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {event?.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition shrink-0"
            aria-label="Đóng"
          >
            <FaTimes className="text-lg" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          <div className="p-6 space-y-8">
            
            {/* OVERVIEW SECTION */}
            <div className="flex flex-col md:flex-row gap-6 items-start">
              
              {/* Progress Ring Card */}
              {perPersonTarget > 0 && data && (
                <div className="w-full md:w-auto shrink-0 bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700/60 shadow-sm flex flex-col items-center justify-center">
                  <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-4 text-center">Tiến độ cá nhân</h3>
                  <ProgressRing
                    size={140}
                    strokeWidth={12}
                    percent={percent}
                    color="#4f46e5"
                    colorEnd={percent >= 100 ? '#10b981' : '#a855f7'}
                    label={`${percent}%`}
                    sublabel="hoàn thành"
                    showPercent={false}
                  />
                  <div className="mt-4 text-center">
                    <p className="text-2xl font-black text-slate-900 dark:text-white">
                      {overallProgressValue.toFixed(1)} <span className="text-sm font-medium text-slate-500">{targetUnit}</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Mục tiêu: {perPersonTarget.toFixed(1)} {targetUnit}</p>
                  </div>
                </div>
              )}

              {/* Stats Grid */}
              <div className="flex-1 w-full flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      Thống kê hoạt động
                      {hasFilter && <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold">Đã lọc</span>}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {hasFilter ? 'Dữ liệu hiển thị theo khoảng thời gian đã chọn.' : 'Tổng hợp toàn bộ hoạt động trong sự kiện.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Filter Toggle Button */}
                    <TimeRangeDropdown
                      value={timeFilter}
                      onChange={handleTimeChange}
                      accentColor="indigo"
                      allLabel="Toàn thời gian"
                    />
                    {/* Kick Button */}
                    {String(participant?.userId) !== String(event?.createdBy?._id || event?.createdBy) && onKickClick && (
                      <button
                        type="button"
                        onClick={() => onKickClick(participant.userId, participant.name)}
                        className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-600 border border-red-100 dark:border-red-900/30 transition shadow-sm"
                        title="Xóa khỏi sự kiện"
                        aria-label="Xóa khỏi sự kiện"
                      >
                        <FaUserMinus className="text-sm" />
                      </button>
                    )}
                  </div>
                </div>

                {summary && (
                  isIndoor ? (
                    <div className="space-y-3">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-slate-600 dark:text-slate-300">{summary.totalEntries ?? 0}</span> buổi trong khoảng lọc
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <StatCard
                          icon={MdVideocam}
                          label="Tổng thời gian"
                          value={formatDurationSeconds(summary.totalSessionSeconds ?? 0)}
                          colorClass="text-sky-600"
                          bgClass="bg-sky-50 dark:bg-sky-500/10"
                        />
                        <StatCard
                          icon={FaStopwatch}
                          label="AI xác nhận"
                          value={formatDurationSeconds(summary.totalAiConfirmedSeconds ?? 0)}
                          colorClass="text-emerald-600"
                          bgClass="bg-emerald-50 dark:bg-emerald-500/10"
                        />
                        <StatCard
                          icon={FaFire}
                          label="Tổng kcal"
                          value={roundKcal(summary.totalCalories)}
                          colorClass="text-orange-500"
                          bgClass="bg-orange-50 dark:bg-orange-500/10"
                        />
                        <StatCard
                          icon={FaRobot}
                          label={`AI (${getAiQualityLabel(summary.aiConfirmedPercent)})`}
                          value={`${summary.aiConfirmedPercent ?? 0}%`}
                          colorClass="text-violet-600"
                          bgClass="bg-violet-50 dark:bg-violet-500/10"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                      <StatCard
                        icon={FaChartLine}
                        label="Số buổi"
                        value={summary.totalEntries ?? 0}
                        colorClass="text-blue-500"
                        bgClass="bg-blue-50 dark:bg-blue-500/10"
                      />
                      <StatCard
                        icon={FaClock}
                        label="Tổng thời gian"
                        value={formatDurationSeconds(summary.totalSeconds)}
                        colorClass="text-purple-500"
                        bgClass="bg-purple-50 dark:bg-purple-500/10"
                      />
                      <StatCard
                        icon={FaFire}
                        label="Tổng kcal"
                        value={roundKcal(summary.totalCalories)}
                        colorClass="text-orange-500"
                        bgClass="bg-orange-50 dark:bg-orange-500/10"
                      />
                      <StatCard
                        icon={FaRoad}
                        label="Quãng đường"
                        value={`${Number(summary.totalDistance || 0).toFixed(2)} km`}
                        colorClass="text-emerald-500"
                        bgClass="bg-emerald-50 dark:bg-emerald-500/10"
                      />
                      <StatCard
                        icon={FaRunning}
                        label="Vận tốc TB"
                        value={avgSpeedDisplay}
                        colorClass="text-pink-500"
                        bgClass="bg-pink-50 dark:bg-pink-500/10"
                      />
                    </div>
                  )
                )}
              </div>
            </div>

            {/* LIST SECTION */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Nhật ký chi tiết</h3>
                <span className="text-xs text-slate-500 bg-slate-200/50 dark:bg-slate-800 px-2.5 py-1 rounded-full font-medium">
                  {summary?.totalEntries || 0} hoạt động
                </span>
              </div>
              
              {isLoading || isFetching ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/60 shadow-sm">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-indigo-500 mb-4" />
                  <p className="text-sm font-medium text-slate-500">Đang tải dữ liệu...</p>
                </div>
              ) : isError ? (
                <div className="py-16 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/60 shadow-sm">
                  <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">!</div>
                  <p className="text-sm font-medium text-red-500">Không thể tải nhật ký. Hãy thử lại sau.</p>
                </div>
              ) : entries.length === 0 ? (
                <div className="py-16 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/60 shadow-sm">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
                    <FaChartLine />
                  </div>
                  <p className="text-sm font-medium text-slate-500">Chưa có hoạt động nào được ghi nhận.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {entries.map((row) => {
                    const isGps = row.source === 'gps';
                    const isVideo = row.source === 'video_call';
                    const activityId = row.activityTrackingId || row._id;
                    const isExpanded = selectedActivityId === activityId;

                    return (
                      <div
                        key={row._id}
                        className={`group bg-white dark:bg-slate-800 rounded-2xl p-4 border transition-all duration-200 overflow-hidden
                          ${isGps || isVideo ? 'cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md' : 'opacity-90'}
                          ${isExpanded ? 'border-indigo-400 dark:border-indigo-500 shadow-md ring-2 ring-indigo-50 dark:ring-indigo-500/10' : 'border-slate-200 dark:border-slate-700'}
                        `}
                      >
                        <div 
                          className="flex justify-between items-start"
                          onClick={() => {
                            if (isGps || isVideo) {
                              setSelectedActivityId(isExpanded ? null : activityId)
                            }
                          }}
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md">
                                {vnMoment(row.date).format('DD/MM/YYYY')}
                              </span>
                              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                {vnMoment(row.date).format('HH:mm')}
                              </span>
                              <SourceBadge source={row.source} />
                            </div>

                            <p className="text-xl font-black text-slate-900 dark:text-white mb-2">
                              {Number(row.value ?? 0).toFixed(row.unit === 'giờ' ? 2 : 1)} <span className="text-sm font-medium text-slate-500">{row.unit || targetUnit}</span>
                            </p>

                            {isVideo && isIndoor ? (
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <div className="rounded-xl bg-slate-50 dark:bg-slate-700/35 border border-slate-100 dark:border-slate-600/50 px-2.5 py-2">
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Tổng thời gian</p>
                                  <p className="text-xs font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
                                    {row.sessionTotalSeconds != null ? formatDurationSeconds(row.sessionTotalSeconds) : '—'}
                                  </p>
                                </div>
                                <div className="rounded-xl bg-slate-50 dark:bg-slate-700/35 border border-slate-100 dark:border-slate-600/50 px-2.5 py-2">
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">AI xác nhận</p>
                                  <p className="text-xs font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
                                    {formatDurationSeconds(row.sessionActiveSeconds ?? row.effectiveSeconds)}
                                  </p>
                                </div>
                                <div className="rounded-xl bg-slate-50 dark:bg-slate-700/35 border border-slate-100 dark:border-slate-600/50 px-2.5 py-2">
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Kcal</p>
                                  <p className="text-xs font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
                                    {row.calories != null && row.calories > 0 ? roundKcal(row.calories) : '—'}
                                  </p>
                                </div>
                                <div className="rounded-xl bg-slate-50 dark:bg-slate-700/35 border border-slate-100 dark:border-slate-600/50 px-2.5 py-2">
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                    {row.aiConfirmedPercent != null
                                      ? `AI (${getAiQualityLabel(row.aiConfirmedPercent)})`
                                      : 'Phần trăm AI'}
                                  </p>
                                  <p className="text-xs font-bold text-violet-600 dark:text-violet-400 tabular-nums mt-0.5 flex items-center gap-1">
                                    <FaRobot className="text-[11px] opacity-80" />
                                    {row.aiConfirmedPercent != null ? `${row.aiConfirmedPercent}%` : '—'}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-600 dark:text-slate-400">
                                {row.distance != null && row.distance > 0 && (
                                  <span className="flex items-center gap-1.5"><FaRoad className="text-blue-500 opacity-70" /> {Number(row.distance).toFixed(2)} km</span>
                                )}
                                <span className="flex items-center gap-1.5"><FaClock className="text-purple-500 opacity-70" /> {formatDurationSeconds(row.effectiveSeconds)}</span>
                                {row.calories != null && row.calories > 0 && (
                                  <span className="flex items-center gap-1.5"><FaFire className="text-orange-500 opacity-70" /> {roundKcal(row.calories)} kcal</span>
                                )}
                              </div>
                            )}
                            
                            {row.notes && (
                              <div className="mt-2">
                                <p className="text-xs text-slate-500 dark:text-slate-400 italic">"{row.notes}"</p>
                              </div>
                            )}
                          </div>
                          
                          {(isGps || isVideo) && (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300 ${isExpanded ? 'rotate-90 bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' : 'bg-slate-50 text-slate-400 dark:bg-slate-700 group-hover:bg-indigo-50 group-hover:text-indigo-500'}`}>
                              <FaAngleRight />
                            </div>
                          )}
                        </div>

                        {/* Expandable Area */}
                        {isExpanded && isGps && (
                          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/60 animate-in fade-in slide-in-from-top-4 duration-300">
                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                              <FaRoute className="text-indigo-500" />
                              Bản đồ lộ trình
                            </h4>
                            <InlineActivityMap eventId={eventId} activityId={activityId} />
                          </div>
                        )}
                        {isExpanded && isVideo && row.proofImage && (
                          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/60 animate-in fade-in slide-in-from-top-4 duration-300">
                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                              <MdVideocam className="text-violet-500" />
                              Ảnh minh chứng AI
                            </h4>
                            <img
                              src={row.proofImage}
                              alt="Proof screenshot"
                              className="w-full max-h-72 object-cover rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm"
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            
          </div>
        </div>

        {/* FOOTER PAGINATION */}
        {totalPages > 1 && !isLoading && (
          <div className="px-6 py-4 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
            <span className="text-sm font-medium text-slate-500">
              Đang xem trang <span className="text-slate-900 dark:text-white font-bold">{page}</span> trên {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm"
                aria-label="Trang trước"
              >
                <FaChevronLeft className="text-xs" />
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm"
                aria-label="Trang sau"
              >
                <FaChevronRight className="text-xs" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(modalBody, document.body)
}

