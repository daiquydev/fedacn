import React from 'react'
import { FaTimes, FaDumbbell, FaClock, FaFire } from 'react-icons/fa'

/**
 * FitnessDetailView
 * Shows detail for a fitness challenge progress entry:
 * - Workout type (parsed from notes prefix)
 * - Duration + calories stats
 * - Notes
 */
export default function FitnessDetailView({ entry, onClose }) {
    // Parse workout type from notes (e.g. "Cardio: 30 phút chạy bộ")
    const notesParts = (entry.notes || '').split(':')
    const workoutType = notesParts[0]?.trim() || 'Tập luyện'
    const detailedNotes = notesParts.length > 1 ? notesParts.slice(1).join(':').trim() : ''

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 backdrop-blur-sm p-4" onClick={onClose}>
            <div
                className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4 flex items-center justify-between flex-shrink-0">
                    <h3 className="font-bold text-white text-base flex items-center gap-2">
                        <FaDumbbell /> Chi tiết buổi tập
                    </h3>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 text-white transition">
                        <FaTimes size={14} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {/* Workout type */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-xl">
                            💪
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Loại bài tập</p>
                            <p className="text-base font-bold text-gray-800 dark:text-white">{workoutType}</p>
                        </div>
                    </div>

                    {/* Result badge */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 text-center border border-purple-200 dark:border-purple-800">
                        <p className="text-3xl font-black text-purple-600 dark:text-purple-400">
                            +{entry.value} {entry.unit}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Đóng góp vào mục tiêu</p>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 text-center">
                            <p className="text-xs text-purple-600 dark:text-purple-400 font-bold mb-1 flex items-center justify-center gap-1">
                                <FaClock size={12} /> Thời gian
                            </p>
                            <p className="text-2xl font-black text-purple-700 dark:text-purple-300">
                                {entry.duration_minutes || 0}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">phút</p>
                        </div>
                        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 text-center">
                            <p className="text-xs text-orange-600 dark:text-orange-400 font-bold mb-1 flex items-center justify-center gap-1">
                                <FaFire size={12} /> Calo đốt
                            </p>
                            <p className="text-2xl font-black text-orange-700 dark:text-orange-300">
                                {entry.calories || 0}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">kcal</p>
                        </div>
                    </div>

                    {/* Exercises count if available */}
                    {entry.exercises_count > 0 && (
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3 flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Số bài tập</span>
                            <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{entry.exercises_count}</span>
                        </div>
                    )}

                    {/* Notes */}
                    {detailedNotes && (
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                            <p className="text-xs text-gray-500 font-bold mb-1">📝 Ghi chú</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{detailedNotes}</p>
                        </div>
                    )}

                    {/* Timestamp */}
                    <p className="text-xs text-gray-400 text-center">
                        {new Date(entry.date || entry.createdAt).toLocaleString('vi-VN')}
                    </p>
                </div>

                {/* Footer */}
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
