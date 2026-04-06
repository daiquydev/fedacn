import { roundKcal } from '../../../utils/mathUtils'
import React from 'react'
import { FaTimes, FaUtensils, FaRobot, FaCheckCircle, FaTimesCircle, FaFire, FaClock, FaCheck } from 'react-icons/fa'
import { getImageUrl } from '../../../utils/imageUrl'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

/**
 * NutritionDetailView v2
 * Hero food image + AI badge overlay + meal info + calories + progress context bar
 */
export default function NutritionDetailView({ entry, challenge, dayTotal, onClose }) {
    const notesParts = (entry.notes || '').split(':')
    const mealType = notesParts[0]?.trim() || 'Bữa ăn'
    const detailedNotes = notesParts.length > 1 ? notesParts.slice(1).join(':').trim() : ''
    const imageUrl = entry.proof_image ? getImageUrl(entry.proof_image) : null
    const goalValue = challenge?.goal_value || 1
    const goalUnit = challenge?.goal_unit || 'lần'

    const timeStr = (() => {
        try {
            const d = new Date(entry.date || entry.createdAt)
            return format(d, 'HH:mm • dd/MM/yyyy', { locale: vi })
        } catch {
            return ''
        }
    })()

    const isLate = entry.validation_status === 'invalid_time'
    const isInvalidAI = entry.ai_review_valid === false
    const isInvalid = isLate || isInvalidAI

    const progressPercent = dayTotal != null && goalValue > 0
        ? Math.min(Math.round((dayTotal / goalValue) * 100), 100)
        : null

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
            <div
                className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* ── Hero Food Image ── */}
                {imageUrl ? (
                    <div className="relative flex-shrink-0">
                        <img
                            src={imageUrl}
                            alt="Check-in bữa ăn"
                            className="w-full h-56 object-cover"
                            onError={e => { e.target.style.display = 'none' }}
                        />
                        {/* Gradient overlay for text legibility */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                        {/* Close button */}
                        <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition">
                            <FaTimes size={14} />
                        </button>

                        {/* AI Badge overlay on image */}
                        {entry.ai_review_valid !== null && entry.ai_review_valid !== undefined && (
                            <div className={`absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg backdrop-blur-md text-xs font-bold ${
                                entry.ai_review_valid
                                    ? 'bg-emerald-500/80 text-white'
                                    : 'bg-red-500/80 text-white'
                            }`}>
                                <FaRobot size={10} />
                                {entry.ai_review_valid ? '✓ AI Verified' : '⚠️ Lỗi AI / Không hợp lệ'}
                            </div>
                        )}

                        {/* Meal info overlay */}
                        <div className="absolute bottom-3 left-4">
                            <h3 className="font-bold text-white text-lg leading-tight drop-shadow">
                                {entry.food_name || mealType}
                            </h3>
                            <p className="text-white/80 text-xs mt-0.5 drop-shadow">{timeStr}</p>
                        </div>
                    </div>
                ) : (
                    /* No image — fallback header */
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-4 flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-lg">🥗</div>
                            <div>
                                <h3 className="font-bold text-white text-base">{entry.food_name || mealType}</h3>
                                <p className="text-white/70 text-xs mt-0.5">{timeStr}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 text-white transition">
                            <FaTimes size={14} />
                        </button>
                    </div>
                )}

                {/* ── Content ── */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {/* Meal type + Food name (when image exists, this adds extra info) */}
                    {imageUrl && entry.food_name && mealType !== entry.food_name && (
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-xl">
                                🍽️
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Loại bữa ăn</p>
                                <p className="text-sm font-bold text-gray-800 dark:text-white">{mealType}</p>
                            </div>
                        </div>
                    )}

                    {/* Result + Calories Card */}
                    <div className={`rounded-xl p-4 border ${isInvalid ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700' : 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200/50 dark:border-emerald-800/50'}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-xs font-bold mb-1 flex items-center gap-1 ${isInvalid ? 'text-gray-500 dark:text-gray-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                    {isInvalid ? <FaTimesCircle size={10} /> : <FaCheck size={10} />} Đóng góp
                                </p>
                                <p className={`text-2xl font-black flex items-center gap-2 ${isInvalid ? 'text-gray-500 dark:text-gray-400' : 'text-emerald-700 dark:text-emerald-300'}`}>
                                    +{isInvalid ? 0 : entry.value} <span className="text-base font-bold">{entry.unit}</span>
                                    {isInvalid && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded uppercase font-bold">Không tính</span>}
                                </p>
                            </div>
                            {entry.calories > 0 && (
                                <div className="text-center">
                                    <p className="text-xs text-orange-600 dark:text-orange-400 font-bold mb-1 flex items-center gap-1">
                                        <FaFire size={10} /> Năng lượng
                                    </p>
                                    <p className="text-2xl font-black text-orange-700 dark:text-orange-300">
                                        {roundKcal(entry.calories)}
                                    </p>
                                    <p className="text-[10px] text-gray-500">kcal</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* AI Review Detail */}
                    {entry.ai_review_valid !== null && entry.ai_review_valid !== undefined && entry.ai_review_reason && (
                        <div className={`flex items-start gap-2.5 px-3.5 py-3 rounded-xl border text-sm ${
                            entry.ai_review_valid
                                ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800'
                                : 'bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                        }`}>
                            {entry.ai_review_valid
                                ? <FaCheckCircle className="text-emerald-500 shrink-0 mt-0.5" size={14} />
                                : <FaTimesCircle className="text-red-500 shrink-0 mt-0.5" size={14} />
                            }
                            <div>
                                <span className={`text-xs font-bold ${
                                    entry.ai_review_valid
                                        ? 'text-emerald-700 dark:text-emerald-400'
                                        : 'text-red-700 dark:text-red-400'
                                }`}>
                                    <FaRobot className="inline mr-1" size={10} />
                                    AI nhận xét
                                </span>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 leading-relaxed">{entry.ai_review_reason}</p>
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    {detailedNotes && (
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3.5">
                            <p className="text-xs text-gray-500 font-bold mb-1">📝 Mô tả</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{detailedNotes}</p>
                        </div>
                    )}

                    {/* ── Progress Context Bar ── */}
                    {progressPercent !== null && (
                        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/15 dark:to-teal-900/15 rounded-xl p-3.5 border border-emerald-100 dark:border-emerald-800/40">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                                    {progressPercent >= 100 ? '🎉 Hoàn thành mục tiêu ngày!' : '📊 Tiến độ hôm nay'}
                                </span>
                                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                                    {dayTotal}/{goalValue} {goalUnit}
                                </span>
                            </div>
                            <div className="h-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-700"
                                    style={{
                                        width: `${Math.max(progressPercent, 3)}%`,
                                        background: progressPercent >= 100
                                            ? 'linear-gradient(90deg, #22c55e, #10b981)'
                                            : 'linear-gradient(90deg, #10b981, #14b8a6)'
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
