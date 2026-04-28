import { roundKcal } from '../../utils/mathUtils'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useQuery } from '@tanstack/react-query'
import goongjs from '@goongmaps/goong-js'
import { getActivity } from '../../apis/sportEventApi'
import { getChallengeActivity } from '../../apis/challengeApi'
import { formatDuration, formatPace } from '../../hooks/useActivityTracking'
import { FaShareAlt, FaRoute, FaExpand, FaCompress } from 'react-icons/fa'
import moment from 'moment'
import '@goongmaps/goong-js/dist/goong-js.css'
import './ActivityDetailModal.css'

goongjs.accessToken = import.meta.env.VITE_GOONG_MAPTILES_KEY

export default function ActivityDetailModal({
  activityId,
  eventId,
  challengeId,
  event,
  isCompletion = false,
  onClose,
  onShare
}) {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const [mapExpanded, setMapExpanded] = useState(false)

  // Determine which API to use
  const sourceId = eventId || challengeId
  const sourceType = eventId ? 'event' : 'challenge'

  // Fetch full activity data (includes gpsRoute)
  const { data, isLoading } = useQuery({
    queryKey: ['activityDetail', sourceType, sourceId, activityId],
    queryFn: () => sourceType === 'event'
      ? getActivity(eventId, activityId)
      : getChallengeActivity(challengeId, activityId),
    enabled: !!activityId && !!sourceId,
    staleTime: 30000,
    retry: false
  })

  const activity = data?.data?.result

  // Initialize map when activity data is loaded
  useEffect(() => {
    if (!activity || !mapContainerRef.current || mapRef.current) return

    const routePositions = (activity.gpsRoute || []).map((p) => [p.lng, p.lat])
    if (routePositions.length === 0) return

    const lngs = routePositions.map((p) => p[0])
    const lats = routePositions.map((p) => p[1])
    const center = [(Math.min(...lngs) + Math.max(...lngs)) / 2, (Math.min(...lats) + Math.max(...lats)) / 2]

    const map = new goongjs.Map({
      container: mapContainerRef.current,
      style: 'https://tiles.goong.io/assets/goong_map_web.json',
      center,
      zoom: 15,
      attributionControl: false,
      interactive: true
    })

    map.on('load', () => {
      if (routePositions.length > 1) {
        map.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates: routePositions }
          }
        })

        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': isCompletion ? '#22c55e' : '#3b82f6',
            'line-width': 5,
            'line-opacity': 0.85
          }
        })

        // Fit bounds to show full route
        const bounds = routePositions.reduce(
          (b, c) => b.extend(c),
          new goongjs.LngLatBounds(routePositions[0], routePositions[0])
        )
        map.fitBounds(bounds, { padding: 40 })
      }

      // Start marker (green)
      const startEl = document.createElement('div')
      startEl.style.cssText =
        'width:14px;height:14px;border-radius:50%;background:#4caf50;border:3px solid #fff;box-shadow:0 0 8px rgba(76,175,80,0.5);'
      new goongjs.Marker(startEl).setLngLat(routePositions[0]).addTo(map)

      // End marker (red)
      if (routePositions.length > 1) {
        const endEl = document.createElement('div')
        endEl.style.cssText =
          'width:14px;height:14px;border-radius:50%;background:#e74c3c;border:3px solid #fff;box-shadow:0 0 8px rgba(231,76,60,0.5);'
        new goongjs.Marker(endEl).setLngLat(routePositions[routePositions.length - 1]).addTo(map)
      }
    })

    mapRef.current = map

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [activity, isCompletion])

  useEffect(() => {
    if (!mapRef.current || !mapExpanded || !activity) return
    const map = mapRef.current
    const routePositions = (activity.gpsRoute || []).map((p) => [p.lng, p.lat])
    const t = window.setTimeout(() => {
      try {
        map.resize()
        if (routePositions.length > 1) {
          const bounds = routePositions.reduce(
            (b, c) => b.extend(c),
            new goongjs.LngLatBounds(routePositions[0], routePositions[0])
          )
          map.fitBounds(bounds, { padding: 48, maxZoom: 17 })
        }
      } catch { /* ignore */ }
    }, 120)
    return () => window.clearTimeout(t)
  }, [mapExpanded, activity])

  useEffect(() => {
    if (!mapExpanded) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [mapExpanded])

  useEffect(() => {
    if (mapExpanded || !mapRef.current) return
    const t = window.setTimeout(() => {
      try {
        mapRef.current?.resize()
      } catch { /* ignore */ }
    }, 150)
    return () => window.clearTimeout(t)
  }, [mapExpanded])

  // Close on Escape (thu map trước, rồi mới đóng modal)
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key !== 'Escape') return
      if (mapExpanded) {
        e.preventDefault()
        setMapExpanded(false)
        return
      }
      onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose, mapExpanded])

  // Computed values
  const distanceKm = activity ? (activity.totalDistance / 1000).toFixed(2) : '0.00'
  const activityTypeLabel = event?.category || activity?.activityType || 'Hoạt động'
  const dateStr = activity
    ? moment(activity.startTime).format('dddd, DD [tháng] MM, YYYY • HH:mm')
    : ''
  const hasRoute = (activity?.gpsRoute || []).length > 0

  const headerMode = isCompletion ? 'completion' : 'history'

  const modalContent = (
    <div className='activity-detail-overlay' onClick={onClose}>
      <div className='activity-detail-card' onClick={(e) => e.stopPropagation()}>
        {isLoading ? (
          <div className='adm-loading'>
            <div className='adm-loading-spinner' />
            <p>Đang tải kết quả...</p>
          </div>
        ) : !activity ? (
          <div className='adm-loading'>
            <p>Không tìm thấy hoạt động</p>
            <button className='adm-btn adm-btn-close' onClick={onClose}>
              Đóng
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className={`adm-header ${headerMode}`}>
              <div className='adm-header-pattern' />
              <button className='adm-close-btn' onClick={onClose}>
                ✕
              </button>
              <div className='adm-check-icon'>
                {isCompletion ? '✓' : '📊'}
              </div>
              <h2>{isCompletion ? 'Hoàn thành! 🎉' : 'Chi tiết hoạt động'}</h2>
              <p className='adm-subtitle'>
                {activityTypeLabel} • {dateStr}
              </p>
            </div>

            {/* Distance */}
            <div className='adm-distance'>
              <span className='adm-distance-val'>{distanceKm}</span>
              <span className='adm-distance-unit'>km</span>
            </div>

            {/* Stats Grid */}
            <div className='adm-stats'>
              <div className='adm-stat-item'>
                <div className='adm-stat-icon time'>⏱</div>
                <div>
                  <p className='adm-stat-val'>{formatDuration(Math.round(activity.totalDuration))}</p>
                  <p className='adm-stat-lbl'>Thời gian</p>
                </div>
              </div>

              <div className='adm-stat-item'>
                <div className='adm-stat-icon calories'>🔥</div>
                <div>
                  <p className='adm-stat-val'>{roundKcal(activity.calories)}</p>
                  <p className='adm-stat-lbl'>Kcal</p>
                </div>
              </div>

              <div className='adm-stat-item'>
                <div className='adm-stat-icon pace'>⚡</div>
                <div>
                  <p className='adm-stat-val'>
                    {activity.avgSpeed ? (activity.avgSpeed * 3.6).toFixed(2) : '0'} <small>km/h</small>
                  </p>
                  <p className='adm-stat-lbl'>Vận tốc</p>
                </div>
              </div>

              <div className='adm-stat-item'>
                <div className='adm-stat-icon speed'>🚀</div>
                <div>
                  <p className='adm-stat-val'>
                    {activity.maxSpeed ? `${(activity.maxSpeed * 3.6).toFixed(2)}` : '0'} <small>km/h</small>
                  </p>
                  <p className='adm-stat-lbl'>Vận tốc tối đa</p>
                </div>
              </div>
            </div>

            {/* Route Map */}
            <div className='adm-map-section'>
              <div className='adm-map-label'>
                <span className='adm-map-label-dot' />
                Lộ trình đã ghi
              </div>
              <div className={`adm-map-outer${mapExpanded ? ' adm-map-outer--fullscreen' : ''}`}>
                {hasRoute && (
                  <button
                    type='button'
                    className='adm-map-fs-toggle'
                    onClick={() => setMapExpanded((v) => !v)}
                    aria-label={mapExpanded ? 'Thu nhỏ bản đồ' : 'Phóng to bản đồ'}
                    title={mapExpanded ? 'Thu nhỏ bản đồ' : 'Phóng to bản đồ'}
                  >
                    {mapExpanded ? <FaCompress size={18} /> : <FaExpand size={16} />}
                  </button>
                )}
                <div className='adm-map-container'>
                  {hasRoute ? (
                    <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
                  ) : (
                    <div className='adm-no-route'>
                      <FaRoute className='adm-no-route-icon' />
                      <p>Không có dữ liệu lộ trình</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className='adm-actions'>
              <button className='adm-btn adm-btn-share' onClick={() => onShare && onShare(activity)}>
                <FaShareAlt size={14} />
                Chia sẻ
              </button>
              <button className='adm-btn adm-btn-close' onClick={onClose}>
                Đóng
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
