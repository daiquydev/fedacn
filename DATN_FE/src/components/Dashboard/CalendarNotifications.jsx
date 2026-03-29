import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    FaDumbbell, FaRunning, FaArrowRight, FaBell,
    FaClock, FaCalendarAlt, FaTrophy, FaCheckCircle, FaExclamationCircle
} from 'react-icons/fa'
import { getWorkoutCalendarEvents } from '../../apis/savedWorkoutApi'
import { getJoinedEventsForCalendar } from '../../apis/sportEventApi'
import { getMyChallenges } from '../../apis/challengeApi'
import { addDays, format, isSameDay } from 'date-fns'
import { vi } from 'date-fns/locale'

const getDateKey = (value) => {
    if (!value) return ''
    const d = value instanceof Date ? value : new Date(value)
    return isNaN(d) ? '' : format(d, 'yyyy-MM-dd')
}

const formatTime = (dateKey, time) => {
    if (!dateKey) return ''
    try {
        const d = new Date(`${dateKey}T00:00:00`)
        if (isSameDay(d, new Date())) return `Hôm nay${time ? ' · ' + time : ''}`
        if (isSameDay(d, addDays(new Date(), 1))) return `Ngày mai${time ? ' · ' + time : ''}`
        return format(d, 'EEE dd/MM', { locale: vi }) + (time ? ' · ' + time : '')
    } catch { return dateKey }
}

// Today's date key in VN timezone
const getTodayVN = () => {
    const vnOffset = 7 * 60 * 60 * 1000
    return new Date(Date.now() + vnOffset).toISOString().split('T')[0]
}

const CompactItem = ({ item, onClick }) => {
    const isWorkout = item.type === 'workout'
    const isChallenge = item.type === 'challenge'

    const iconBg = isChallenge
        ? item.checkedIn ? 'bg-emerald-400/20 text-emerald-200' : 'bg-amber-400/20 text-amber-200'
        : isWorkout ? 'bg-orange-400/20 text-orange-200' : 'bg-emerald-400/20 text-emerald-200'

    const icon = isChallenge
        ? (item.checkedIn ? <FaCheckCircle /> : <FaTrophy />)
        : isWorkout ? <FaDumbbell /> : <FaRunning />

    return (
        <div
            onClick={onClick}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all group
                hover:bg-white/10 border flex-1 min-w-0
                ${isChallenge && !item.checkedIn
                    ? 'border-amber-400/30 hover:border-amber-400/50'
                    : 'border-white/10 hover:border-white/25'}`}
        >
            <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-[10px] ${iconBg}`}>
                {icon}
            </div>
            <div className='flex-1 min-w-0'>
                <p className='text-xs font-semibold text-white truncate leading-tight'>
                    {item.title}
                </p>
                <span className='inline-flex items-center gap-1 text-[10px] font-medium text-white/60'>
                    <FaClock className='shrink-0' />
                    {isChallenge
                        ? formatTime(item.endDateKey, '')
                        : formatTime(item.dateKey, item.startTime)}
                    {isChallenge && (
                        <span className={`inline-flex items-center gap-0.5 font-semibold
                            ${item.checkedIn ? 'text-emerald-300' : 'text-amber-300'}`}>
                            · {item.checkedIn
                                ? <><FaCheckCircle className='shrink-0' /> Đã check-in</>
                                : <><FaExclamationCircle className='shrink-0' /> Chưa check-in</>}
                        </span>
                    )}
                </span>
            </div>
            <FaArrowRight className='text-white/30 group-hover:text-white/60 text-[10px] flex-shrink-0 transition-colors' />
        </div>
    )
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
                const today = new Date()
                const from = getDateKey(today)
                const to = getDateKey(today)
                const todayVN = getTodayVN()

                const [wRes, sRes, cRes] = await Promise.all([
                    getWorkoutCalendarEvents(from, to).catch(() => null),
                    getJoinedEventsForCalendar().catch(() => null),
                    getMyChallenges({ limit: 50 }).catch(() => null)
                ])

                const now = new Date()

                // Workouts
                const mapped_w = (wRes?.data?.result || [])
                    .map(ev => ({
                        id: ev.id || ev.workout_id,
                        type: 'workout',
                        title: ev.workout_name || 'Lịch tập luyện',
                        dateKey: ev.date,
                        startTime: ev.time_of_day || '',
                        navigateTo: '/training'
                    }))
                    .filter(ev => ev.dateKey >= from && ev.dateKey <= to)
                    .sort((a, b) => (a.dateKey + a.startTime).localeCompare(b.dateKey + b.startTime))
                    .slice(0, 6)

                // Sport Events
                const mapped_s = (sRes?.data?.result?.events || [])
                    .filter(ev => new Date(ev.endDate) >= now)
                    .map(ev => {
                        const start = new Date(ev.startDate)
                        const endDateKey = getDateKey(new Date(ev.endDate))
                        return {
                            id: ev._id,
                            type: 'event',
                            title: ev.name,
                            dateKey: getDateKey(start),
                            endDateKey,
                            startTime: `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`,
                            navigateTo: `/sport-event/${ev._id}`
                        }
                    })
                    .filter(ev => ev.dateKey <= to && ev.endDateKey >= from)
                    .sort((a, b) => (a.dateKey + a.startTime).localeCompare(b.dateKey + b.startTime))
                    .slice(0, 6)

                // Challenges — filter active ones, detect today's check-in
                const participations = cRes?.data?.result?.participations || []
                const mapped_c = participations
                    .filter(p => {
                        const ch = p.challenge_id
                        if (!ch) return false
                        const endDate = new Date(ch.end_date)
                        endDate.setHours(23, 59, 59, 999)
                        return endDate >= now && ch.status !== 'cancelled'
                    })
                    .map(p => {
                        const ch = p.challenge_id
                        const activeDays = p.active_days || []
                        const checkedIn = activeDays.includes(todayVN)
                        return {
                            id: ch._id,
                            type: 'challenge',
                            title: ch.title,
                            challenge_type: ch.challenge_type,
                            checkedIn,
                            endDateKey: getDateKey(new Date(ch.end_date)),
                            navigateTo: `/challenge/${ch._id}`
                        }
                    })
                    // Sort: unchecked first (urgent), then checked
                    .sort((a, b) => {
                        if (a.checkedIn === b.checkedIn) return 0
                        return a.checkedIn ? 1 : -1
                    })
                    .slice(0, 6)

                setEvents(mapped_s)
                setWorkouts(mapped_w)
                setChallenges(mapped_c)
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

    // Option D: count of unchecked challenges for badge
    const uncheckedCount = challenges.filter(c => !c.checkedIn).length

    const tabs = [
        { key: 'event', label: 'Sự kiện', icon: FaRunning, count: events.length, urgent: 0 },
        { key: 'workout', label: 'Tập luyện', icon: FaDumbbell, count: workouts.length, urgent: 0 },
        { key: 'challenge', label: 'Thử thách', icon: FaTrophy, count: challenges.length, urgent: uncheckedCount }
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
                    {tabs.map(({ key, label, icon: Icon, count, urgent }) => (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key)}
                            className={`relative flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all
                                ${activeTab === key
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                        >
                            <Icon className='text-[10px]' /> {label}
                            <span className={`text-[9px] rounded-full px-1.5 font-bold ${activeTab === key ? 'bg-indigo-100 text-indigo-600' : 'bg-white/15 text-white/80'}`}>
                                {count}
                            </span>
                            {/* Option D: urgent badge for unchecked challenges */}
                            {urgent > 0 && (
                                <span className='absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center shadow-sm animate-pulse'>
                                    {urgent}
                                </span>
                            )}
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
                                {activeTab === 'challenge' ? 'Không có thử thách đang tham gia' : 'Không có lịch hôm nay'}
                            </span>
                        </div>
                    ) : (
                        <>
                            {visibleItems.map(item => (
                                <CompactItem
                                    key={`${item.type}-${item.id}`}
                                    item={item}
                                    onClick={() => navigate(item.navigateTo)}
                                />
                            ))}
                            {remainingCount > 0 && (
                                <button
                                    onClick={() => navigate(activeTab === 'challenge' ? '/challenge/my-challenges' : '/user-calendar')}
                                    className='flex-shrink-0 text-[11px] font-semibold text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-lg transition-all'
                                >
                                    +{remainingCount}
                                </button>
                            )}
                        </>
                    )}
                </div>

                {/* Far right: CTA */}
                <button
                    onClick={() => navigate(activeTab === 'challenge' ? '/challenge/my-challenges' : '/user-calendar')}
                    className='flex-shrink-0 ml-auto inline-flex items-center gap-1 text-[11px] text-white/70 hover:text-white font-medium transition-colors'
                >
                    <FaCalendarAlt className='text-[10px]' />
                    <span className='hidden sm:inline'>{activeTab === 'challenge' ? 'Xem thử thách' : 'Xem lịch'}</span>
                    <FaArrowRight className='text-[9px]' />
                </button>
            </div>
        </div>
    )
}
