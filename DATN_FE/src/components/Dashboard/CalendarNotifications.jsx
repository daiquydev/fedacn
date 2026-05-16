import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FaDumbbell,
  FaRunning,
  FaArrowRight,
  FaBell,
  FaClock,
  FaCalendarAlt,
  FaTrophy,
  FaCheckCircle,
  FaExclamationCircle
} from 'react-icons/fa'
import moment from 'moment-timezone'
import { getWorkoutCalendarEvents } from '../../apis/savedWorkoutApi'
import { getJoinedEventsForCalendar } from '../../apis/sportEventApi'
import { getMyChallenges } from '../../apis/challengeApi'
import { dateKeyVN, getTodayDateVN, TZ_VN } from '../../utils/vnDateUtils'

const getTodayVN = getTodayDateVN

const formatTime = (dateKey, time) => {
  if (!dateKey) return ''
  try {
    const today = getTodayVN()
    const tomorrow = moment().tz(TZ_VN).clone().add(1, 'day').format('YYYY-MM-DD')
    if (dateKey === today) return `Hôm nay${time ? ' · ' + time : ''}`
    if (dateKey === tomorrow) return `Ngày mai${time ? ' · ' + time : ''}`
    return moment.tz(dateKey, 'YYYY-MM-DD', TZ_VN).format('ddd DD/MM') + (time ? ' · ' + time : '')
  } catch {
    return dateKey
  }
}

const CompactItem = ({ item, onClick }) => {
  const isWorkout = item.type === 'workout'
  const isChallenge = item.type === 'challenge'

  const iconBg = isChallenge
    ? item.checkedIn
      ? 'bg-emerald-400/20 text-emerald-200'
      : 'bg-amber-400/20 text-amber-200'
    : isWorkout
    ? 'bg-orange-400/20 text-orange-200'
    : 'bg-emerald-400/20 text-emerald-200'

  const icon = isChallenge ? (
    item.checkedIn ? (
      <FaCheckCircle />
    ) : (
      <FaTrophy />
    )
  ) : isWorkout ? (
    <FaDumbbell />
  ) : (
    <FaRunning />
  )

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all group
                hover:bg-white/10 border flex-1 min-w-0
                ${
                  isChallenge && !item.checkedIn
                    ? 'border-amber-400/30 hover:border-amber-400/50'
                    : 'border-white/10 hover:border-white/25'
                }`}
    >
      <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-[10px] ${iconBg}`}>
        {icon}
      </div>
      <div className='flex-1 min-w-0'>
        <p className='text-xs font-semibold text-white truncate leading-tight'>{item.title}</p>
        <span className='inline-flex items-center gap-1 text-[10px] font-medium text-white/60'>
          <FaClock className='shrink-0' />
          {isChallenge ? formatTime(item.dateKey, '') : formatTime(item.dateKey, item.startTime)}
          {isChallenge && (
            <span
              className={`inline-flex items-center gap-0.5 font-semibold
                            ${item.checkedIn ? 'text-emerald-300' : 'text-amber-300'}`}
            >
              ·{' '}
              {item.checkedIn ? (
                <>
                  <FaCheckCircle className='shrink-0' /> Đã check-in
                </>
              ) : (
                <>
                  <FaExclamationCircle className='shrink-0' /> Chưa check-in
                </>
              )}
            </span>
          )}
        </span>
      </div>
      <FaArrowRight className='text-white/30 group-hover:text-white/60 text-[10px] flex-shrink-0 transition-colors' />
    </div>
  )
}

/** Một reducer: cùng nguồn dữ liệu cho đếm và preview (theo ngày VN). */
function buildTodayCalendarState({ wRes, sRes, cRes, todayVN }) {
  const mapped_w = (wRes?.data?.result || [])
    .map((ev) => ({
      id: ev.id || ev.workout_id,
      type: 'workout',
      title: ev.workout_name || 'Lịch tập luyện',
      dateKey: ev.date,
      startTime: ev.time_of_day || '',
      navigateTo: '/training'
    }))
    .filter((ev) => ev.dateKey === todayVN)
    .sort((a, b) => (a.dateKey + a.startTime).localeCompare(b.dateKey + b.startTime))

  const mapped_s = (sRes?.data?.result?.events || [])
    .filter((ev) => {
      if (!ev?.startDate || !ev?.endDate) return false
      const startKey = dateKeyVN(ev.startDate)
      const endKey = dateKeyVN(ev.endDate)
      return startKey <= todayVN && endKey >= todayVN
    })
    .map((ev) => {
      const start = moment(ev.startDate).tz(TZ_VN)
      const endDateKey = dateKeyVN(ev.endDate)
      return {
        id: ev._id,
        type: 'event',
        title: ev.name,
        dateKey: todayVN,
        endDateKey,
        startTime: start.format('HH:mm'),
        navigateTo: `/sport-event/${ev._id}`
      }
    })
    .sort((a, b) => (a.dateKey + a.startTime).localeCompare(b.dateKey + b.startTime))

  const participations = cRes?.data?.result?.participations || []
  const mapped_c = participations
    .filter((p) => {
      const ch = p.challenge_id
      if (!ch) return false
      const startKey = dateKeyVN(ch.start_date)
      const endKey = dateKeyVN(ch.end_date)
      if (!startKey || !endKey) return false
      if (todayVN < startKey || todayVN > endKey) return false
      if (ch.status !== 'active') return false
      if (ch.is_deleted) return false
      return true
    })
    .map((p) => {
      const ch = p.challenge_id
      const activeDays = p.active_days || []
      const checkedIn = activeDays.includes(todayVN)
      return {
        id: ch._id,
        type: 'challenge',
        title: ch.title,
        challenge_type: ch.challenge_type,
        checkedIn,
        dateKey: todayVN,
        endDateKey: dateKeyVN(ch.end_date),
        navigateTo: `/challenge/${ch._id}`
      }
    })
    .sort((a, b) => {
      if (a.checkedIn === b.checkedIn) return 0
      return a.checkedIn ? 1 : -1
    })

  return { events: mapped_s, workouts: mapped_w, challenges: mapped_c }
}

export default function CalendarNotifications() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('event')
  const [events, setEvents] = useState([])
  const [workouts, setWorkouts] = useState([])
  const [challenges, setChallenges] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const todayVN = getTodayVN()

        const [wRes, sRes, cRes] = await Promise.all([
          getWorkoutCalendarEvents(todayVN, todayVN).catch(() => null),
          getJoinedEventsForCalendar().catch(() => null),
          getMyChallenges({ limit: 200, page: 1 }).catch(() => null)
        ])

        const {
          events: e,
          workouts: w,
          challenges: c
        } = buildTodayCalendarState({
          wRes,
          sRes,
          cRes,
          todayVN
        })

        setEvents(e)
        setWorkouts(w)
        setChallenges(c)
      } catch (e) {
        console.error('CalendarNotifications error:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const tabData = {
    event: events,
    workout: workouts,
    challenge: challenges
  }
  const list = tabData[activeTab] || []
  const visibleItems = list.slice(0, 2)
  const remainingCount = Math.max(0, list.length - 2)

  const tabs = [
    { key: 'event', label: 'Sự kiện', icon: FaRunning, count: events.length },
    { key: 'workout', label: 'Tập luyện', icon: FaDumbbell, count: workouts.length },
    { key: 'challenge', label: 'Thử thách', icon: FaTrophy, count: challenges.length }
  ]

  return (
    <div className='w-full bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 rounded-2xl shadow-lg overflow-hidden'>
      <div className='flex items-center gap-3 px-4 h-[52px]'>
        {/* Left: Icon + Title */}
        <div className='flex items-center gap-2 flex-shrink-0'>
          <div className='w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center'>
            <FaBell className='text-white text-sm' />
          </div>
          <div className='hidden sm:block'>
            <h3 className='text-sm font-semibold text-white leading-tight'>Lịch hôm nay</h3>
            <p className='text-[10px] text-white/50'>Sự kiện & tập luyện</p>
          </div>
        </div>

        {/* Center: Tabs */}
        <div className='flex items-center gap-0.5 bg-white/10 rounded-full p-0.5 flex-shrink-0'>
          {tabs.map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all
                                ${
                                  activeTab === key
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-white/70 hover:text-white hover:bg-white/10'
                                }`}
            >
              <Icon className='text-[10px]' /> {label}
              <span
                className={`text-[9px] rounded-full px-1.5 font-bold ${
                  activeTab === key ? 'bg-indigo-100 text-indigo-600' : 'bg-white/15 text-white/80'
                }`}
              >
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Right: Inline items — HIDDEN on mobile */}
        <div className='flex-1 min-w-0 hidden md:flex items-center gap-2 overflow-hidden'>
          {loading ? (
            <div className='flex gap-2 flex-1'>
              <div className='h-8 flex-1 rounded-lg bg-white/10 animate-pulse' />
              <div className='h-8 flex-1 rounded-lg bg-white/10 animate-pulse' />
            </div>
          ) : list.length === 0 ? (
            <div className='flex items-center gap-2 px-2'>
              <span className='text-xs text-yellow-200 font-medium'>
                {activeTab === 'challenge' ? 'Không có thử thách đang tham gia hôm nay' : 'Không có lịch hôm nay'}
              </span>
            </div>
          ) : (
            <>
              {visibleItems.map((item) => (
                <CompactItem key={`${item.type}-${item.id}`} item={item} onClick={() => navigate(item.navigateTo)} />
              ))}
              {remainingCount > 0 && (
                <button
                  onClick={() => navigate('/user-calendar')}
                  className='flex-shrink-0 text-[11px] font-semibold text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-lg transition-all'
                >
                  +{remainingCount}
                </button>
              )}
            </>
          )}
        </div>

        {/* Far right: CTA — luôn mở Lịch cá nhân (đồng bộ với tiêu đề "Lịch hôm nay") */}
        <button
          onClick={() => navigate('/user-calendar')}
          className='flex-shrink-0 ml-auto inline-flex items-center gap-1 text-[11px] text-white/70 hover:text-white font-medium transition-colors'
        >
          <FaCalendarAlt className='text-[10px]' />
          <span className='hidden sm:inline'>Xem lịch</span>
          <FaArrowRight className='text-[9px]' />
        </button>
      </div>
    </div>
  )
}
