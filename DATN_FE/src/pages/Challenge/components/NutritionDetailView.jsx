import React from 'react'
import { FaTimes, FaUtensils, FaRobot, FaCheckCircle, FaTimesCircle } from 'react-icons/fa'
import { getImageUrl } from '../../../utils/imageUrl'

/**
 * NutritionDetailView
 * Shows detail for a nutrition challenge progress entry:
 * - Meal type (parsed from notes prefix)
 * - Proof image (food photo)
 * - Calorie value
 * - Notes
 */
export default function NutritionDetailView({ entry, onClose }) {
    // Parse meal type from notes (e.g. "Bữa sáng: Cơm gà")
    const notesParts = (entry.notes || '').split(':')
    const mealType = notesParts[0]?.trim() || 'Bữa ăn'
    const detailedNotes = notesParts.length > 1 ? notesParts.slice(1).join(':').trim() : ''

    const imageUrl = entry.proof_image ? getImageUrl(entry.proof_image) : null

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 backdrop-blur-sm p-4" onClick={onClose}>
            <div
                className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4 flex items-center justify-between flex-shrink-0">
                    <h3 className="font-bold text-white text-base flex items-center gap-2">
                        <FaUtensils /> Chi tiết check-in
                    </h3>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 text-white transition">
                        <FaTimes size={14} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {/* Meal type + Food name */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-xl">
                            🥗
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Loại bữa ăn</p>
                            <p className="text-base font-bold text-gray-800 dark:text-white">{mealType}</p>
                            {entry.food_name && (
                                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">🍽️ {entry.food_name}</p>
                            )}
                        </div>
                    </div>

                    {/* Result badge */}
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-4 text-center border border-emerald-200 dark:border-emerald-800">
                        <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                            +{entry.value} {entry.unit}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Đóng góp vào mục tiêu</p>
                    </div>

                    {/* Image */}
                    {imageUrl && (
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold mb-2">📸 Ảnh bữa ăn</p>
                            <img
                                src={imageUrl}
                                alt="Check-in bữa ăn"
                                className="w-full h-64 object-cover rounded-xl border-2 border-gray-200 dark:border-gray-700"
                                onError={e => { e.target.style.display = 'none' }}
                            />
                        </div>
                    )}

                    {/* Calories */}
                    {entry.calories > 0 && (
                        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 text-center">
                            <p className="text-xs text-orange-600 dark:text-orange-400 font-bold mb-1">🔥 Năng lượng</p>
                            <p className="text-2xl font-black text-orange-700 dark:text-orange-300">
                                {Math.round(entry.calories)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">kcal</p>
                        </div>
                    )}

                    {/* AI Review Badge */}
                    {entry.ai_review_valid !== null && entry.ai_review_valid !== undefined && (
                        <div className={`flex items-start gap-2 px-3 py-2.5 rounded-lg border text-sm ${
                            entry.ai_review_valid
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
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
                                    AI xác minh: {entry.ai_review_valid ? 'Ảnh hợp lệ' : 'Ảnh không hợp lệ'}
                                </span>
                                {entry.ai_review_reason && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{entry.ai_review_reason}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Notes / Mô tả */}
                    {detailedNotes && (
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                            <p className="text-xs text-gray-500 font-bold mb-1">📝 Mô tả</p>
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
