import React, { useMemo, useState } from 'react'
import { FaTimes, FaFire, FaCheck, FaCalendarCheck, FaChevronRight } from 'react-icons/fa'
import { useQuery } from '@tanstack/react-query'
import { getUserChallengeProgress } from '../../../apis/challengeApi'
import useravatar from '../../../assets/images/useravatar.jpg'
import { getImageUrl } from '../../../utils/imageUrl'
import { format } from 'date-fns'
import ActivityEntryDetailView from './ActivityEntryDetailView'
import NutritionDetailView from './NutritionDetailView'
import FitnessDetailView from './FitnessDetailView'

const GRADIENT_MAP = {
  nutrition: 'from-emerald-500 to-teal-600',
  outdoor_activity: 'from-blue-500 to-cyan-600',
  fitness: 'from-purple-500 to-pink-600'
}

function getDateString(date) {
  const d = new Date(date)
  const offset = 7 * 60 * 60 * 1000
  const vn = new Date(d.getTime() + offset)
  return vn.toISOString().split('T')[0]
}

function getTodayString() {
  const offset = 7 * 60 * 60 * 1000
  const vn = new Date(Date.now() + offset)
  return vn.toISOString().split('T')[0]
}

function generateDaysList(startDate, endDate) {
  const days = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  const current = new Date(start)
  while (current <= end) {
    days.push(getDateString(current))
    current.setDate(current.getDate() + 1)
  }
  return days
}

export default function ParticipantProgressModal({
  participant,
  challenge,
  onClose
}) {
  const challengeType = challenge?.challenge_type || 'fitness'
  const gradient = GRADIENT_MAP[challengeType] || GRADIENT_MAP.fitness
  const user = participant?.user || {}
  const userId = user._id

  const [selectedDayDetail, setSelectedDayDetail] = useState(null)
  const [selectedEntry, setSelectedEntry] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['user-challenge-progress', challenge?._id, userId],
    queryFn: () => getUserChallengeProgress(challenge._id, userId),
    staleTime: 1000,
    enabled: !!challenge?._id && !!userId
  })

  const result = data?.data?.result
  const participantData = result?.participant || participant
  const progressEntries = result?.progress || []
  const activeDays = participantData?.active_days || []
  const activeSet = useMemo(() => new Set(activeDays), [activeDays])
  const today = getTodayString()

  const allDays = useMemo(() => {
    if (!challenge?.start_date || !challenge?.end_date) return []
    return generateDaysList(challenge.start_date, challenge.end_date)
  }, [challenge?.start_date, challenge?.end_date])

  // Group progress entries by date
  const progressByDate = useMemo(() => {
    const map = {}
    progressEntries.forEach(entry => {
      const dateStr = format(new Date(entry.date || entry.createdAt), 'yyyy-MM-dd')
      if (!map[dateStr]) map[dateStr] = []
      map[dateStr].push(entry)
    })
    return map
  }, [progressEntries])

  const pct = participantData?.progress_percent || 0

  // Entries to show: filtered by selected day or all
  const displayEntries = useMemo(() => {
    if (selectedDayDetail) {
      return progressByDate[selectedDayDetail] || []
    }
    return progressEntries.slice(0, 15)
  }, [selectedDayDetail, progressByDate, progressEntries])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={`bg-gradient-to-r ${gradient} px-6 py-4 flex items-center justify-between flex-shrink-0`}>
          <div className="flex items-center gap-3">
            <img
              src={user.avatar ? getImageUrl(user.avatar) : useravatar}
              alt={user.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-white/50"
              onError={e => { e.target.onerror = null; e.target.src = useravatar }}
            />
            <div>
              <h3 className="font-bold text-white text-sm">{user.name || 'Ẩn danh'}</h3>
              <p className="text-white/70 text-[11px]">
                {participantData?.current_value || 0}/{participantData?.goal_value || 0} {challenge?.goal_unit}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 text-white transition"><FaTimes /></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Progress summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-center">
                  <p className={`text-xl font-black ${pct >= 100 ? 'text-green-500' : 'text-gray-800 dark:text-white'}`}>{pct}%</p>
                  <p className="text-[10px] text-gray-500">Hoàn thành</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-center">
                  <p className="text-xl font-black text-orange-500">{participantData?.streak_count || 0}</p>
                  <p className="text-[10px] text-gray-500">🔥 Streak</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-center">
                  <p className="text-xl font-black text-gray-800 dark:text-white">{activeDays.length}</p>
                  <p className="text-[10px] text-gray-500">Ngày tham gia</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-700`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              {/* Mini calendar — CLICKABLE */}
              <div className="bg-gray-50 dark:bg-gray-750 rounded-xl p-3">
                <h4 className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1">
                  <FaCalendarCheck /> Lịch tham gia
                </h4>
                <p className="text-[9px] text-gray-400 mb-2">👆 Nhấn vào một ngày để xem chi tiết</p>
                <div className="grid grid-cols-10 gap-1">
                  {allDays.map((day, idx) => {
                    const isActive = activeSet.has(day)
                    const isToday = day === today
                    const isFuture = day > today
                    const isSelected = day === selectedDayDetail
                    const dayEntries = progressByDate[day] || []

                    return (
                      <div
                        key={day}
                        title={`Ngày ${idx + 1} (${day}) — ${dayEntries.length} lần thực hiện`}
                        onClick={() => setSelectedDayDetail(isSelected ? null : day)}
                        className={`aspect-square rounded-md flex items-center justify-center text-[8px] font-bold cursor-pointer transition-all hover:scale-110 ${isSelected
                            ? 'ring-2 ring-orange-500 shadow-md scale-110'
                            : ''
                          } ${isActive
                            ? `bg-gradient-to-br ${gradient} text-white`
                            : isToday
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 ring-1 ring-blue-400'
                              : isFuture
                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-300 dark:text-gray-600'
                                : 'bg-red-50 dark:bg-red-900/10 text-red-300'
                          }`}
                      >
                        {isActive ? '✓' : new Date(day + 'T00:00:00').getDate()}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Selected day detail or all entries */}
              {selectedDayDetail && (
                <div className="bg-orange-50 dark:bg-orange-900/10 rounded-xl p-3 border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-orange-700 dark:text-orange-400 flex items-center gap-1">
                      📅 Ngày {new Date(selectedDayDetail + 'T00:00:00').getDate()} — {displayEntries.length} lần thực hiện
                    </h4>
                    <button
                      onClick={() => setSelectedDayDetail(null)}
                      className="text-[10px] text-gray-400 hover:text-gray-600 font-bold px-2 py-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                      ✕ Tất cả
                    </button>
                  </div>
                  {displayEntries.length === 0 && (
                    <p className="text-[10px] text-gray-400 text-center py-3">Không có hoạt động nào vào ngày này</p>
                  )}
                </div>
              )}

              {/* Entries list — clickable */}
              {displayEntries.length > 0 && (
                <div>
                  {!selectedDayDetail && (
                    <h4 className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-2">📋 Tất cả check-in</h4>
                  )}
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {displayEntries.map(entry => (
                      <button
                        key={entry._id}
                        onClick={() => setSelectedEntry(entry)}
                        className="w-full text-left flex items-center justify-between p-2.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600 hover:shadow-sm transition-all group"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-md bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-[9px] font-bold`}>
                            {new Date(entry.date).getDate()}
                          </div>
                          <div>
                            <p className="text-[11px] font-medium text-gray-700 dark:text-gray-300">
                              +{entry.value} {entry.unit}
                            </p>
                            {entry.notes && (
                              <p className="text-[9px] text-gray-400 truncate max-w-[200px]">{entry.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-2 text-[9px] text-gray-400">
                            {entry.distance && <span>📍{entry.distance}km</span>}
                            {entry.duration_minutes && <span>⏱️{entry.duration_minutes}p</span>}
                            {entry.calories && <span>🔥{entry.calories}</span>}
                          </div>
                          <FaChevronRight className="text-[10px] text-gray-300 group-hover:text-orange-400 transition" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {progressEntries.length === 0 && !selectedDayDetail && (
                <div className="text-center py-6 text-gray-400 text-xs">
                  Người dùng chưa có lần check-in nào
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 font-medium text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition">
            Đóng
          </button>
        </div>
      </div>

      {/* Entry Detail Modal */}
      {selectedEntry && (
        challengeType === 'outdoor_activity'
          ? <ActivityEntryDetailView entry={selectedEntry} challenge={challenge} onClose={() => setSelectedEntry(null)} />
          : challengeType === 'nutrition'
            ? <NutritionDetailView entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
            : <FitnessDetailView entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
      )}
    </div>
  )
}
