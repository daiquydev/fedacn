import React from 'react'
import { FaTimes, FaDumbbell, FaClock, FaFire, FaCheck, FaDotCircle } from 'react-icons/fa'
import { getImageUrl } from '../../../utils/imageUrl'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

/**
 * Format sets summary for an exercise.
 * e.g. "3×12 @ 40kg" or "3×12" (no weight) or "2×12, 1 skipped"
 */
function formatSetsSummary(sets = []) {
    if (!sets.length) return ''

    const completed = sets.filter(s => s.completed && !s.skipped)
    const skipped = sets.filter(s => s.skipped)

    if (completed.length === 0 && skipped.length > 0) {
        return `${skipped.length} set bỏ qua`
    }

    // Group by reps×weight for concise display
    const groups = {}
    completed.forEach(s => {
        const key = `${s.reps}×${s.weight || 0}`
        groups[key] = (groups[key] || 0) + 1
    })

    const parts = Object.entries(groups).map(([key, count]) => {
        const [reps, weight] = key.split('×')
        return Number(weight) > 0 ? `${count} hiệp, ${reps} lần @ ${weight}kg` : `${count} hiệp, ${reps} lần`
    })

    let result = parts.join('; ')
    if (skipped.length > 0) {
        result += ` • ${skipped.length} bỏ qua`
    }
    return result
}

/**
 * FitnessDetailView v2
 * Conditional rendering: full exercise list when workout session exists, summary when manual entry
 */
export default function FitnessDetailView({ entry, challenge, dayTotal, onClose }) {
    const notesParts = (entry.notes || '').split(':')
    const workoutType = notesParts[0]?.trim() || 'Tập luyện'
    const detailedNotes = notesParts.length > 1 ? notesParts.slice(1).join(':').trim() : ''

    const goalValue = challenge?.goal_value || 1
    const goalUnit = challenge?.goal_unit || 'lần'

    // Workout session data (populated from backend)
    const session = entry.workout_session_id && typeof entry.workout_session_id === 'object'
        ? entry.workout_session_id
        : null

    const exercises = session?.exercises || []
    const musclesTargeted = session?.muscles_targeted || []
    const totalVolume = session?.total_volume || 0

    const imageUrl = entry.proof_image ? getImageUrl(entry.proof_image) : null

    const timeStr = (() => {
        try {
            const d = new Date(entry.date || entry.createdAt)
            return format(d, 'HH:mm • dd/MM/yyyy', { locale: vi })
        } catch {
            return ''
        }
    })()

    const progressPercent = dayTotal != null && goalValue > 0
        ? Math.min(Math.round((dayTotal / goalValue) * 100), 100)
        : null

    // Stat cards data
    const statCards = [
        {
            icon: FaClock,
            value: entry.duration_minutes || (session?.duration_minutes) || 0,
            unit: 'phút',
            label: 'Thời gian',
            bgClass: 'bg-blue-50 dark:bg-blue-900/20',
            textClass: 'text-blue-600 dark:text-blue-400',
            valueClass: 'text-blue-700 dark:text-blue-300'
        },
        {
            icon: FaFire,
            value: entry.calories || (session?.total_calories) || 0,
            unit: 'kcal',
            label: 'Calo đốt',
            bgClass: 'bg-orange-50 dark:bg-orange-900/20',
            textClass: 'text-orange-600 dark:text-orange-400',
            valueClass: 'text-orange-700 dark:text-orange-300'
        }
    ]

    // Add exercises count card if available
    const exercisesCount = entry.exercises_count || exercises.length || 0
    if (exercisesCount > 0) {
        statCards.push({
            icon: FaDumbbell,
            value: exercisesCount,
            unit: 'bài tập',
            label: 'Bài tập',
            bgClass: 'bg-indigo-50 dark:bg-indigo-900/20',
            textClass: 'text-indigo-600 dark:text-indigo-400',
            valueClass: 'text-indigo-700 dark:text-indigo-300'
        })
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
            <div
                className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* ── Hero Header ── */}
                <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-5 py-4 relative flex-shrink-0">
                    <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition">
                        <FaTimes size={14} />
                    </button>
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">
                            💪
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-base leading-tight">{workoutType}</h3>
                            <p className="text-white/70 text-xs mt-0.5">{timeStr}</p>
                        </div>
                    </div>
                </div>

                {/* ── Content ── */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {/* ── Stat Cards Row ── */}
                    <div className={`grid gap-2.5 ${statCards.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                        {statCards.map((stat, idx) => (
                            <div key={idx} className={`${stat.bgClass} rounded-xl p-3 text-center`}>
                                <p className={`text-[10px] font-bold mb-1 flex items-center justify-center gap-1 ${stat.textClass}`}>
                                    <stat.icon size={10} /> {stat.label}
                                </p>
                                <p className={`text-xl font-black ${stat.valueClass}`}>
                                    {stat.value > 0 ? Math.round(stat.value) : 0}
                                </p>
                                <p className="text-[10px] text-gray-500 mt-0.5">{stat.unit}</p>
                            </div>
                        ))}
                    </div>

                    {/* ── Total Volume (when session exists) ── */}
                    {session && totalVolume > 0 && (
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-3.5 border border-purple-200/50 dark:border-purple-800/50">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-purple-600 dark:text-purple-400">🏋️ Tổng volume</span>
                                <span className="text-lg font-black text-purple-700 dark:text-purple-300">
                                    {totalVolume.toLocaleString()} <span className="text-xs font-bold">kg</span>
                                </span>
                            </div>
                        </div>
                    )}

                    {/* ── Exercise List (from workout session) ── */}
                    {exercises.length > 0 && (
                        <div>
                            <h5 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2.5">
                                📋 Danh sách bài tập ({exercises.length})
                            </h5>
                            <div className="space-y-2">
                                {exercises.map((ex, idx) => {
                                    const setsSummary = formatSetsSummary(ex.sets)
                                    const completedSets = (ex.sets || []).filter(s => s.completed && !s.skipped).length
                                    const totalSets = (ex.sets || []).length

                                    return (
                                        <div key={idx} className="flex items-start gap-3 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700">
                                            {/* Index */}
                                            <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-xs font-black text-purple-600 dark:text-purple-400 shrink-0 mt-0.5">
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-bold text-gray-800 dark:text-white truncate">
                                                        {ex.exercise_name}
                                                    </p>
                                                    {totalSets > 0 && (
                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                                            completedSets === totalSets
                                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                                                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                                                        }`}>
                                                            {completedSets}/{totalSets}
                                                        </span>
                                                    )}
                                                </div>
                                                {setsSummary && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                        {setsSummary}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── Muscle Group Tags ── */}
                    {musclesTargeted.length > 0 && (
                        <div>
                            <h5 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                🏷️ Nhóm cơ
                            </h5>
                            <div className="flex flex-wrap gap-1.5">
                                {musclesTargeted.map((muscle, idx) => (
                                    <span key={idx} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium">
                                        <FaDotCircle size={6} />
                                        {muscle}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Proof Image (optional, for future use) ── */}
                    {imageUrl && (
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold mb-2">📸 Ảnh buổi tập</p>
                            <img
                                src={imageUrl}
                                alt="Proof buổi tập"
                                className="w-full h-48 object-cover rounded-xl border-2 border-gray-200 dark:border-gray-700"
                                onError={e => { e.target.style.display = 'none' }}
                            />
                        </div>
                    )}

                    {/* ── Result Badge ── */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-3.5 text-center border border-purple-200/50 dark:border-purple-800/50">
                        <p className="text-2xl font-black text-purple-600 dark:text-purple-400">
                            +{entry.value} <span className="text-base font-bold">{entry.unit}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">Đóng góp vào mục tiêu</p>
                    </div>

                    {/* ── Notes ── */}
                    {detailedNotes && (
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3.5">
                            <p className="text-xs text-gray-500 font-bold mb-1">📝 Ghi chú</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{detailedNotes}</p>
                        </div>
                    )}

                    {/* ── Progress Context Bar ── */}
                    {progressPercent !== null && (
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/15 dark:to-pink-900/15 rounded-xl p-3.5 border border-purple-100 dark:border-purple-800/40">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                                    {progressPercent >= 100 ? '🎉 Hoàn thành mục tiêu ngày!' : '📊 Tiến độ hôm nay'}
                                </span>
                                <span className="text-xs font-black text-purple-600 dark:text-purple-400">
                                    {dayTotal}/{goalValue} {goalUnit}
                                </span>
                            </div>
                            <div className="h-2 bg-purple-100 dark:bg-purple-900/30 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-700"
                                    style={{
                                        width: `${Math.max(progressPercent, 3)}%`,
                                        background: progressPercent >= 100
                                            ? 'linear-gradient(90deg, #22c55e, #10b981)'
                                            : 'linear-gradient(90deg, #a855f7, #ec4899)'
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Footer ── */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 font-medium text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    )
}
