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

const EmptyState = ({ type }) => (
    <div className='flex flex-col items-center justify-center py-6 text-center gap-2'>
        <div className='w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center'>
            {type === 'event'
                ? <FaRunning className='text-gray-400 text-sm' />
                : <FaDumbbell className='text-gray-400 text-sm' />}
        </div>
        <p className='text-xs text-gray-400 dark:text-gray-500'>
            {type === 'event' ? 'Chưa có sự kiện sắp tới' : 'Chưa có lịch tập sắp tới'}
        </p>
    </div>
)

const ItemRow = ({ item, onClick }) => {
    const isWorkout = item.type === 'workout'
    return (
        <div
            onClick={onClick}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all group
        hover:bg-gray-50 dark:hover:bg-gray-800/60 border border-transparent
        hover:border-gray-100 dark:hover:border-gray-700`}
        >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs
        ${isWorkout
                    ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-500'
                    : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600'}`}>
                {isWorkout ? <FaDumbbell /> : <FaRunning />}
            </div>

            <div className='flex-1 min-w-0'>
                <p className='text-sm font-semibold text-gray-800 dark:text-gray-100 truncate leading-tight'>
                    {item.title}
                </p>
                <div className='flex items-center gap-2 mt-0.5 flex-wrap'>
                    <span className={`inline-flex items-center gap-1 text-[11px] font-medium
            ${isWorkout ? 'text-orange-500 dark:text-orange-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        <FaClock className='shrink-0' />
                        {formatTime(item.dateKey, item.startTime)}
                    </span>
                    {item.location && (
                        <span className='inline-flex items-center gap-1 text-[11px] text-gray-400 truncate max-w-[120px]'>
                            <FaMapMarkerAlt className='shrink-0' />
                            {item.location}
                        </span>
                    )}
                </div>
            </div>

            <FaArrowRight className='text-gray-300 dark:text-gray-600 group-hover:text-gray-500 text-xs flex-shrink-0 transition-colors' />
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

    return (
        <div className='w-full shadow bg-white rounded-3xl dark:bg-color-primary dark:border dark:border-gray-800 overflow-hidden'>
            {/* Header */}
            <div className='bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 py-3.5 px-5 flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                    <FaBell className='text-white text-base' />
                    <div>
                        <h3 className='text-sm md:text-base font-semibold text-white'>Thông báo Lịch Cá Nhân</h3>
                        <p className='text-[11px] text-white/70'>Sự kiện và lịch tập hôm nay</p>
                    </div>
                </div>
                {/* Tabs */}
                <div className='flex items-center gap-1 bg-white/15 rounded-full p-0.5'>
                    {[
                        { key: 'event', label: 'Sự kiện', icon: FaRunning },
                        { key: 'workout', label: 'Tập luyện', icon: FaDumbbell }
                    ].map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all
                ${activeTab === key
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-white/80 hover:text-white hover:bg-white/10'}`}
                        >
                            <Icon /> {label}
                            <span className={`text-[10px] rounded-full px-1.5 py-0 font-bold ${activeTab === key ? 'bg-indigo-100 text-indigo-600' : 'bg-white/20 text-white'}`}>
                                {key === 'event' ? events.length : workouts.length}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className='px-3 py-2'>
                {loading ? (
                    <div className='space-y-2 py-2'>
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className='h-12 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse' />
                        ))}
                    </div>
                ) : list.length === 0 ? (
                    <EmptyState type={activeTab} />
                ) : (
                    <div className='divide-y divide-gray-50 dark:divide-gray-800/60'>
                        {list.map(item => (
                            <ItemRow key={`${item.type}-${item.id}`} item={item} onClick={() => navigate(item.navigateTo)} />
                        ))}
                    </div>
                )}

                {/* Footer */}
                <div className='pt-1 pb-2 flex justify-end'>
                    <button
                        onClick={() => navigate('/user-calendar')}
                        className='inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-medium transition-colors'
                    >
                        <FaCalendarAlt className='text-[11px]' />
                        Xem lịch cá nhân <FaArrowRight className='text-[10px]' />
                    </button>
                </div>
            </div>
        </div>
    )
}
