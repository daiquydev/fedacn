import { useEffect, useState } from 'react'
import { FaShareAlt, FaCamera, FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import { MdVideocam } from 'react-icons/md'
import moment from 'moment'
import 'moment/dist/locale/vi'
import './IndoorDetailModal.css'

// Set Vietnamese locale globally for this module
moment.locale('vi')

function padTime(n) {
  return String(n).padStart(2, '0')
}

function formatTime(seconds) {
  if (!seconds || seconds <= 0) return '00:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${padTime(h)}:${padTime(m)}:${padTime(s)}`
  return `${padTime(m)}:${padTime(s)}`
}

/**
 * IndoorDetailModal
 * Modal hiển thị chi tiết buổi video call — stats + screenshot carousel
 *
 * Props:
 *  session: video session object (from getVideoSessions)
 *  event: sport event object
 *  isCompletion: boolean — true = just finished, false = viewing from history
 *  onClose: () => void
 */
export default function IndoorDetailModal({ session, event, isCompletion = false, onClose, onShare }) {
  const [carouselIdx, setCarouselIdx] = useState(0)

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  if (!session) return null

  const {
    activeSeconds = 0,
    totalSeconds = 0,
    caloriesBurned = 0,
    screenshots = []
  } = session

  const aiAccuracy = totalSeconds > 0 ? Math.round((activeSeconds / totalSeconds) * 100) : 0

  const getAiLabel = (pct) => {
    if (pct >= 90) return 'Xuất sắc'
    if (pct >= 70) return 'Tốt'
    if (pct >= 50) return 'TB'
    return 'Thấp'
  }

  const activityTypeLabel = event?.category || 'Video Call'
  const dateStr = session.joinedAt
    ? moment(session.joinedAt).locale('vi').format('dddd, DD [tháng] MM, YYYY • HH:mm')
    : ''

  const headerMode = isCompletion ? 'completion' : 'history'
  const hasScreenshots = screenshots.length > 0

  const prevSlide = () => setCarouselIdx((i) => (i <= 0 ? screenshots.length - 1 : i - 1))
  const nextSlide = () => setCarouselIdx((i) => (i >= screenshots.length - 1 ? 0 : i + 1))

  return (
    <div className='indoor-detail-overlay' onClick={onClose}>
      <div className='indoor-detail-card' onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={`idm-header ${headerMode}`}>
          <div className='idm-header-pattern' />
          <button className='idm-close-btn' onClick={onClose}>✕</button>
          <div className='idm-check-icon'>
            {isCompletion ? '✓' : <MdVideocam />}
          </div>
          <h2>{isCompletion ? 'Hoàn thành! 🎉' : 'Chi tiết buổi học'}</h2>
          <p className='idm-subtitle'>{activityTypeLabel} • {dateStr}</p>
        </div>

        {/* Stats */}
        <div className='idm-stats'>
          <div className='idm-stat-item'>
            <div className='idm-stat-icon time'>🎥</div>
            <div>
              <p className='idm-stat-val'>{formatTime(totalSeconds)}</p>
              <p className='idm-stat-lbl'>Tổng thời gian</p>
            </div>
          </div>
          <div className='idm-stat-item'>
            <div className='idm-stat-icon active'>⏱</div>
            <div>
              <p className='idm-stat-val'>{formatTime(activeSeconds)}</p>
              <p className='idm-stat-lbl'>AI xác nhận</p>
            </div>
          </div>
          <div className='idm-stat-item'>
            <div className='idm-stat-icon calories'>🔥</div>
            <div>
              <p className='idm-stat-val'>{(Math.round((caloriesBurned || 0) * 100) / 100).toFixed(2)}</p>
              <p className='idm-stat-lbl'>kcal</p>
            </div>
          </div>
          <div className='idm-stat-item'>
            <div className='idm-stat-icon ai'>🤖</div>
            <div>
              <p className='idm-stat-val'>{aiAccuracy}%</p>
              <p className='idm-stat-lbl'>AI ({getAiLabel(aiAccuracy)})</p>
            </div>
          </div>
        </div>

        {/* Screenshot Carousel */}
        <div className='idm-screenshots-section'>
          <div className='idm-screenshots-label'>
            <span className='idm-screenshots-label-dot' />
            Ảnh chụp trong buổi học
          </div>

          {hasScreenshots ? (
            <div className='idm-carousel'>
              <div
                className='idm-carousel-track'
                style={{ transform: `translateX(-${carouselIdx * 100}%)` }}
              >
                {screenshots.map((url, idx) => (
                  <div className='idm-carousel-slide' key={idx}>
                    <img
                      src={url}
                      alt={`Ảnh chụp ${idx + 1}`}
                      loading='lazy'
                    />
                  </div>
                ))}
              </div>

              {/* Nav arrows */}
              {screenshots.length > 1 && (
                <>
                  <button className='idm-carousel-arrow prev' onClick={prevSlide}>
                    <FaChevronLeft size={12} />
                  </button>
                  <button className='idm-carousel-arrow next' onClick={nextSlide}>
                    <FaChevronRight size={12} />
                  </button>
                </>
              )}

              {/* Dots */}
              {screenshots.length > 1 && (
                <div className='idm-carousel-dots'>
                  {screenshots.map((_, idx) => (
                    <button
                      key={idx}
                      className={`idm-carousel-dot ${idx === carouselIdx ? 'active' : ''}`}
                      onClick={() => setCarouselIdx(idx)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className='idm-no-screenshots'>
              <FaCamera className='idm-no-screenshots-icon' />
              <p>Không có ảnh chụp</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className='idm-actions'>
          <button className='idm-btn idm-btn-share' onClick={() => onShare && onShare(session)}>
            <FaShareAlt size={14} />
            Chia sẻ
          </button>
          <button className='idm-btn idm-btn-close' onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
