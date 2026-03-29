import React from 'react'
import { FaTimes, FaMapMarkerAlt, FaClock, FaFire, FaBolt, FaChartLine } from 'react-icons/fa'
import ActivityDetailModal from '../../../components/SportEvent/ActivityDetailModal'

function fmtDuration(minutes) {
    if (!minutes) return '0 phút'
    const h = Math.floor(minutes / 60)
    const m = Math.round(minutes % 60)
    if (h > 0) return `${h} giờ ${m} phút`
    return `${m} phút`
}

/**
 * ActivityEntryDetailView
 * Shows detail for an outdoor_activity progress entry.
 * If entry has activity_id → opens GPS map (ActivityDetailModal).
 * Otherwise → shows manual stats.
 */
export default function ActivityEntryDetailView({ entry, challenge, onClose }) {
    // If GPS tracked (has activity_id), delegate to the existing map modal
    if (entry.activity_id) {
        return (
            <ActivityDetailModal
                activityId={entry.activity_id}
                challengeId={challenge?._id}
                event={{ category: challenge?.category || 'Chạy bộ' }}
                onClose={onClose}
                onShare={() => { }}
            />
        )
    }

    // Manual input — show stats card
    const distKm = entry.distance ? Number(entry.distance) : 0
    const durationMin = entry.duration_minutes || 0
    const speedKmh = entry.avg_speed
        ? Number(entry.avg_speed).toFixed(1)
        : durationMin > 0 && distKm > 0
            ? (distKm / (durationMin / 60)).toFixed(1)
            : null
    const pace = durationMin > 0 && distKm > 0
        ? (() => {
            const totalSec = durationMin * 60
            const paceS = totalSec / distKm
            const pm = Math.floor(paceS / 60)
            const ps = Math.floor(paceS % 60)
            return `${pm}'${String(ps).padStart(2, '0')}"/km`
        })()
        : null

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-cyan-600 px-6 py-4 flex items-center justify-between">
                    <h3 className="font-bold text-white text-base flex items-center gap-2">
                        <FaMapMarkerAlt /> Chi tiết hoạt động
                    </h3>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 text-white transition">
                        <FaTimes size={14} />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    {/* Activity type */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xl">
                            🏃
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Loại hoạt động</p>
                            <p className="text-base font-bold text-gray-800 dark:text-white">
                                {challenge?.category || 'Hoạt động ngoài trời'}
                            </p>
                        </div>
                    </div>

                    {/* Result badge */}
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-4 text-center border border-blue-200 dark:border-blue-800">
                        <p className="text-3xl font-black text-blue-600 dark:text-blue-400">
                            +{entry.value} {entry.unit || challenge?.goal_unit}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Đóng góp vào mục tiêu</p>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
                            <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold mb-1">📍 Khoảng cách</p>
                            <p className="text-lg font-black text-blue-700 dark:text-blue-300">{distKm.toFixed(2)}</p>
                            <p className="text-[9px] text-gray-500">km</p>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 text-center">
                            <p className="text-[10px] text-purple-600 dark:text-purple-400 font-bold mb-1">⏱️ Thời gian</p>
                            <p className="text-lg font-black text-purple-700 dark:text-purple-300">{durationMin}</p>
                            <p className="text-[9px] text-gray-500">phút</p>
                        </div>
                        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 text-center">
                            <p className="text-[10px] text-orange-600 dark:text-orange-400 font-bold mb-1">🔥 Calo</p>
                            <p className="text-lg font-black text-orange-700 dark:text-orange-300">{entry.calories || 0}</p>
                            <p className="text-[9px] text-gray-500">kcal</p>
                        </div>
                    </div>

                    {/* Calculated stats */}
                    {(speedKmh || pace) && (
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 space-y-2">
                            {speedKmh && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500 flex items-center gap-1.5"><FaBolt className="text-purple-400 text-xs" /> Tốc độ</span>
                                    <span className="font-bold text-gray-800 dark:text-white">{speedKmh} km/h</span>
                                </div>
                            )}
                            {pace && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500 flex items-center gap-1.5"><FaChartLine className="text-green-400 text-xs" /> Pace</span>
                                    <span className="font-bold text-gray-800 dark:text-white">{pace}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Notes */}
                    {entry.notes && (
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                            <p className="text-xs text-gray-500 font-bold mb-1">📝 Ghi chú</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{entry.notes}</p>
                        </div>
                    )}

                    {/* Timestamp */}
                    <p className="text-xs text-gray-400 text-center">
                        {new Date(entry.date || entry.createdAt).toLocaleString('vi-VN')}
                    </p>

                    {/* Close button */}
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
