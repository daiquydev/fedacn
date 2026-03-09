import React from 'react'
import { FaFire, FaClock, FaTrophy, FaBrain, FaTimes } from 'react-icons/fa'
import { MdVideocam, MdCheckCircle } from 'react-icons/md'

// ─── Helpers ─────────────────────────────────────────────────────────────────
function padTime(n) { return String(n).padStart(2, '0') }
function formatTime(seconds) {
    if (!seconds || seconds <= 0) return '0:00'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    if (h > 0) return `${padTime(h)}:${padTime(m)}:${padTime(s)}`
    return `${padTime(m)}:${padTime(s)}`
}

/**
 * VideoCallResult
 * Props:
 *  result: {
 *    activeSeconds, totalSeconds, caloriesBurned,
 *    progressValue, progressUnit, aiAccuracyPercent
 *  }
 *  event: full event object
 *  onClose: () => void
 */
export default function VideoCallResult({ result, event, onClose }) {
    if (!result) return null

    const {
        activeSeconds = 0,
        totalSeconds = 0,
        caloriesBurned = 0,
        progressValue = 0,
        progressUnit = 'phút',
        aiAccuracyPercent = 0
    } = result

    const targetValue = event?.targetValue || 0
    const progressPct = targetValue > 0
        ? Math.min(Math.round((progressValue / targetValue) * 100), 100)
        : 0

    const getAiQuality = (pct) => {
        if (pct >= 90) return { label: 'Xuất sắc', color: 'text-green-400' }
        if (pct >= 70) return { label: 'Tốt', color: 'text-blue-400' }
        if (pct >= 50) return { label: 'Trung bình', color: 'text-yellow-400' }
        return { label: 'Thấp', color: 'text-red-400' }
    }
    const aiQuality = getAiQuality(aiAccuracyPercent)

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">

                {/* ── Header ── */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white text-center relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/60 hover:text-white transition"
                    >
                        <FaTimes />
                    </button>
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <MdCheckCircle className="text-4xl text-white" />
                    </div>
                    <h2 className="text-2xl font-bold">Chúc mừng! 🎉</h2>
                    <p className="text-white/80 text-sm mt-1">Buổi học đã được ghi nhận thành công</p>
                </div>

                {/* ── Stats ── */}
                <div className="p-6 space-y-4">

                    {/* Time row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-4 text-center">
                            <MdVideocam className="text-blue-500 text-2xl mx-auto mb-1" />
                            <p className="font-mono text-2xl font-bold text-gray-900 dark:text-white">
                                {formatTime(totalSeconds)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Tổng thời gian</p>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4 text-center border border-green-100 dark:border-green-800">
                            <FaClock className="text-green-500 text-2xl mx-auto mb-1" />
                            <p className="font-mono text-2xl font-bold text-green-600 dark:text-green-400">
                                {formatTime(activeSeconds)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Active (AI xác nhận)</p>
                        </div>
                    </div>

                    {/* Calories */}
                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl p-4 flex items-center gap-4
                          border border-orange-100 dark:border-orange-800">
                        <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/40 rounded-xl
                            flex items-center justify-center flex-shrink-0">
                            <FaFire className="text-orange-500 text-xl" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Calo tiêu thụ</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {caloriesBurned} <span className="text-base font-normal text-gray-500">kcal</span>
                            </p>
                        </div>
                    </div>

                    {/* Progress toward target */}
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl p-4
                          border border-yellow-100 dark:border-yellow-800">
                        <div className="flex items-center gap-2 mb-2">
                            <FaTrophy className="text-yellow-500" />
                            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Tiến độ ghi nhận</p>
                        </div>
                        <div className="flex items-end justify-between mb-2">
                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                                +{progressValue} <span className="text-sm font-normal text-gray-500">{progressUnit}</span>
                            </p>
                            <p className="text-sm text-yellow-600 dark:text-yellow-400 font-bold">{progressPct}% mục tiêu</p>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                            <div
                                className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2.5 rounded-full transition-all"
                                style={{ width: `${progressPct}%` }}
                            />
                        </div>
                        {targetValue > 0 && (
                            <p className="text-xs text-gray-400 mt-2">
                                Mục tiêu: {targetValue} {progressUnit}
                            </p>
                        )}
                    </div>

                    {/* AI Accuracy */}
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-xl
                            flex items-center justify-center flex-shrink-0">
                            <FaBrain className="text-gray-500 text-lg" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-gray-500 uppercase font-bold">AI Accuracy</p>
                            <div className="flex items-center gap-2">
                                <p className={`text-lg font-bold ${aiQuality.color}`}>{aiAccuracyPercent}%</p>
                                <span className={`text-xs font-medium ${aiQuality.color}`}>({aiQuality.label})</span>
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 max-w-[100px] text-right">
                            Thời gian bạn thực sự có mặt
                        </p>
                    </div>

                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600
                       hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl
                       font-bold text-base transition shadow-lg shadow-blue-500/30"
                    >
                        Hoàn thành
                    </button>
                </div>
            </div>
        </div>
    )
}
