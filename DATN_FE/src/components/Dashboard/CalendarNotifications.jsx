import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    FaDumbbell, FaRunning, FaArrowRight, FaBell,
    FaClock, FaMapMarkerAlt, FaCalendarAlt
} from 'react-icons/fa'
import { getWorkoutCalendarEvents } from '../../apis/savedWorkoutApi'
import { getJoinedEventsForCalendar } from '../../apis/sportEventApi'
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

const CompactItem = ({ item, onClick }) => {
    const isWorkout = item.type === 'workout'
    return (
        <div
            onClick={onClick}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all group
                hover:bg-white/10 border border-white/10 hover:border-white/25 flex-1 min-w-0`}
        >
            <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-[10px]
                ${isWorkout
                    ? 'bg-orange-400/20 text-orange-200'
                    : 'bg-emerald-400/20 text-emerald-200'}`}>
                {isWorkout ? <FaDumbbell /> : <FaRunning />}
            </div>
            <div className='flex-1 min-w-0'>
                <p className='text-xs font-semibold text-white truncate leading-tight'>
                    {item.title}
                </p>
                <span className={`inline-flex items-center gap-1 text-[10px] font-medium text-white/60`}>
                    <FaClock className='shrink-0' />
                    {formatTime(item.dateKey, item.startTime)}
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
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            try {
                const today = new Date()
                const from = getDateKey(today)
                const to = getDateKey(today) // Chỉ lấy ngày hôm nay

                const [wRes, sRes] = await Promise.all([
                    getWorkoutCalendarEvents(from, to).catch(() => null),
                    getJoinedEventsForCalendar().catch(() => null)
                ])

                const now = new Date()

                const mapped_w = (wRes?.data?.result || [])
                    .map(ev => ({
                        id: ev.id || ev.workout_id,
                        type: 'workout',
                        title: ev.workout_name || 'Lịch tập luyện',
                        dateKey: ev.date,
                        startTime: ev.time_of_day || '',
                        location: null,
                        navigateTo: '/challenge'
                    }))
                    .filter(ev => ev.dateKey >= from && ev.dateKey <= to)
                    .sort((a, b) => (a.dateKey + a.startTime).localeCompare(b.dateKey + b.startTime))
                    .slice(0, 6)

                const mapped_s = (sRes?.data?.result?.events || [])
                    .filter(ev => new Date(ev.endDate) >= now)
                    .map(ev => {
                        const start = new Date(ev.startDate)
                        return {
                            id: ev._id,
                            type: 'event',
                            title: ev.name,
                            dateKey: getDateKey(start),
                            startTime: `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`,
                            location: ev.location || null,
                            navigateTo: `/sport-event/${ev._id}`
                        }
                    })
                    .filter(ev => ev.dateKey >= from && ev.dateKey <= to)
                    .sort((a, b) => (a.dateKey + a.startTime).localeCompare(b.dateKey + b.startTime))
                    .slice(0, 6)

                setEvents(mapped_s)
                setWorkouts(mapped_w)
            } catch (e) {
                console.error('CalendarNotifications error:', e)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    const list = activeTab === 'event' ? events : workouts
    const visibleItems = list.slice(0, 2)
    const remainingCount = Math.max(0, list.length - 2)

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
                    {[
                        { key: 'event', label: 'Sự kiện', icon: FaRunning },
                        { key: 'workout', label: 'Tập luyện', icon: FaDumbbell }
                    ].map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all
                                ${activeTab === key
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                        >
                            <Icon className='text-[10px]' /> {label}
                            <span className={`text-[9px] rounded-full px-1.5 font-bold ${activeTab === key ? 'bg-indigo-100 text-indigo-600' : 'bg-white/15 text-white/80'}`}>
                                {key === 'event' ? events.length : workouts.length}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Right: Inline items or empty state — HIDDEN on mobile */}
                <div className='flex-1 min-w-0 hidden md:flex items-center gap-2 overflow-hidden'>
                    {loading ? (
                        <div className='flex gap-2 flex-1'>
                            <div className='h-8 flex-1 rounded-lg bg-white/10 animate-pulse' />
                            <div className='h-8 flex-1 rounded-lg bg-white/10 animate-pulse' />
                        </div>
                    ) : list.length === 0 ? (
                        <div className='flex items-center gap-2 px-2'>
                            <span className='text-xs text-yellow-200 font-medium'>Không có lịch hôm nay</span>
                        </div>
                    ) : (
                        <>
                            {visibleItems.map(item => (
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

                {/* Far right: CTA */}
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
