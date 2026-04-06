import { roundKcal } from '../../utils/mathUtils'
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  FaDumbbell, FaClock, FaCalendarAlt, FaHistory, FaFire, FaRedo,
  FaChevronDown, FaChevronUp, FaCheck, FaTimes, FaRunning
} from 'react-icons/fa'
import { GiWeightLiftingUp, GiMuscleUp } from 'react-icons/gi'
import { MdFitnessCenter } from 'react-icons/md'
import { getWorkoutHistory } from '../../apis/workoutSessionApi'
import moment from 'moment'
import 'moment/locale/vi'

moment.locale('vi')

const MUSCLE_LABELS = {
  'chest': 'Ngực', 'abs': 'Bụng', 'obliques': 'Chéo bụng',
  'biceps': 'Bắp tay trước', 'forearm': 'Cẳng tay',
  'front-deltoids': 'Vai trước', 'quadriceps': 'Đùi trước', 'adductor': 'Đùi trong',
  'trapezius': 'Cơ thang', 'upper-back': 'Lưng trên', 'lower-back': 'Lưng dưới',
  'back-deltoids': 'Vai sau', 'triceps': 'Bắp tay sau',
  'hamstring': 'Đùi sau', 'calves': 'Bắp chân',
  'gluteal': 'Mông', 'abductors': 'Đùi ngoài'
}

const EQUIPMENT_LABELS = {
  'bodyweight': 'Cơ thể', 'dumbbell': 'Tạ tay', 'barbell': 'Tạ đòn',
  'kettlebell': 'Tạ ấm', 'band': 'Dây kháng lực', 'plate': 'Máy / Đĩa tạ',
  'pull-up-bar': 'Xà đơn', 'bench': 'Ghế tập'
}

// Expandable exercise card with set details
function ExerciseDetailCard({ exercise, index }) {
  const [expanded, setExpanded] = useState(false)
  const sets = exercise.sets || []
  const completedSets = sets.filter(s => s.completed)
  const skippedSets = sets.filter(s => s.skipped)
  const totalKcal = completedSets.reduce((sum, s) => sum + (s.reps || 0) * (s.weight || 0) * (s.calories_per_unit || 10), 0)
  const totalReps = completedSets.reduce((sum, s) => sum + (s.reps || 0), 0)
  const allDone = sets.length > 0 && sets.every(s => s.completed || s.skipped)
  const allCompleted = sets.length > 0 && sets.every(s => s.completed)

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all">
      {/* Exercise header — clickable */}
      <button
        onClick={() => setExpanded(v => !v)}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
          ${expanded ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-gray-800 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'}`}
      >
        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
          ${allCompleted ? 'bg-green-500 text-white' : allDone ? 'bg-yellow-500 text-white' : 'bg-blue-500 text-white'}`}>
          {allCompleted ? <FaCheck /> : index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-gray-800 dark:text-gray-100 truncate">{exercise.exercise_name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-gray-400">{completedSets.length}/{sets.length} sets</span>
            {skippedSets.length > 0 && (
              <span className="text-[10px] text-red-400">• {skippedSets.length} bỏ</span>
            )}
            <span className="text-[10px] text-orange-500 font-medium">• {roundKcal(totalKcal)} kcal</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {skippedSets.length > 0 && (
            <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded text-[9px] font-bold">
              {skippedSets.length} BỎ
            </span>
          )}
          {expanded ? <FaChevronUp className="text-xs text-gray-400" /> : <FaChevronDown className="text-xs text-gray-400" />}
        </div>
      </button>

      {/* Expanded: set details */}
      {expanded && (
        <div className="px-4 py-3 bg-white dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-700">
          <div className="space-y-1.5">
            {sets.map((set, si) => {
              const kcal = (set.reps || 0) * (set.weight || 0) * (set.calories_per_unit || 10)
              return (
                <div key={si} className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm
                  ${set.completed
                    ? 'bg-green-50 dark:bg-green-900/15 border border-green-200 dark:border-green-800'
                    : set.skipped
                      ? 'bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-800 opacity-70'
                      : 'bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 opacity-50'
                  }`}>
                  {/* Status icon */}
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0
                    ${set.completed ? 'bg-green-500 text-white' : set.skipped ? 'bg-red-400 text-white' : 'bg-gray-300 text-white'}`}>
                    {set.completed ? <FaCheck /> : set.skipped ? <FaTimes /> : set.set_number}
                  </span>

                  {/* Set label */}
                  <span className="text-xs font-medium text-gray-500 w-12 flex-shrink-0">Set {set.set_number}</span>

                  {/* Values */}
                  <div className={`flex-1 flex items-center gap-3 ${set.skipped ? 'line-through text-gray-400' : ''}`}>
                    <span className="text-xs">
                      <span className="font-semibold text-gray-700 dark:text-gray-200">{set.reps}</span>
                      <span className="text-gray-400 ml-0.5">lần</span>
                    </span>
                    <span className="text-gray-300 dark:text-gray-600 text-[10px]">×</span>
                    <span className="text-xs">
                      <span className="font-semibold text-gray-700 dark:text-gray-200">{set.weight}</span>
                      <span className="text-gray-400 ml-0.5">kg</span>
                    </span>
                    <span className="text-gray-300 dark:text-gray-600 text-[10px]">=</span>
                    <span className="text-xs font-bold text-orange-600">{roundKcal(kcal)} kcal</span>
                  </div>

                  {/* Status badge */}
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0
                    ${set.completed
                      ? 'text-green-600 bg-green-100 dark:bg-green-900/30'
                      : set.skipped
                        ? 'text-red-500 bg-red-100 dark:bg-red-900/30'
                        : 'text-gray-400 bg-gray-100 dark:bg-gray-700'
                    }`}>
                    {set.completed ? 'XONG' : set.skipped ? 'BỎ' : '—'}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Summary row */}
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <span className="text-gray-500">
                <FaRunning className="inline mr-1 text-[10px]" />
                {totalReps} reps
              </span>
              <span className="text-orange-600 font-semibold">
                🔥 {roundKcal(totalKcal)} kcal
              </span>
            </div>
            <div className="flex items-center gap-2">
              {completedSets.length > 0 && (
                <span className="text-green-600 font-medium">{completedSets.length} hoàn thành</span>
              )}
              {skippedSets.length > 0 && (
                <span className="text-red-500 font-medium">{skippedSets.length} bỏ</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SessionCard({ session }) {
  const [expanded, setExpanded] = useState(false)
  const exercises = session.exercises || []

  const statusConfig = {
    completed: {
      icon: <GiWeightLiftingUp />,
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-600 dark:text-green-400',
      badge: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
      label: 'Hoàn thành',
      dot: 'bg-green-500'
    },
    quit: {
      icon: <FaRedo />,
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-500 dark:text-red-400',
      badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
      label: 'Đã hủy',
      dot: 'bg-red-500'
    }
  }
  const cfg = statusConfig[session.status] || statusConfig.quit

  // Calculate skipped from exercises data if total_skipped_sets not available
  const totalSkipped = session.total_skipped_sets ?? exercises.reduce((sum, ex) =>
    sum + (ex.sets?.filter(s => s.skipped)?.length || 0), 0)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* Card Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-50 dark:border-gray-700/60">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${cfg.bg} ${cfg.text}`}>
            {cfg.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
                {exercises.length > 0 ? `${exercises.length} bài tập` : 'Phiên tập'}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.badge}`}>
                {cfg.label}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
              <FaCalendarAlt className="text-[10px]" />
              <span>{moment(session.createdAt).format('dddd, DD/MM/YYYY – HH:mm')}</span>
            </div>
          </div>
        </div>
        <span className="text-xs text-gray-400 hidden sm:block">
          {moment(session.createdAt).fromNow()}
        </span>
      </div>

      {/* Stats Row */}
      <div className={`grid ${totalSkipped > 0 ? 'grid-cols-4' : 'grid-cols-3'} divide-x divide-gray-100 dark:divide-gray-700/60 border-b border-gray-50 dark:border-gray-700/60`}>
        <div className="flex flex-col items-center py-3 gap-0.5">
          <div className="flex items-center gap-1 text-blue-500">
            <FaDumbbell className="text-xs" />
            <span className="font-bold text-gray-800 dark:text-gray-100 text-base">{session.total_sets || 0}</span>
          </div>
          <span className="text-[10px] text-gray-400 uppercase tracking-wide">Sets</span>
        </div>
        <div className="flex flex-col items-center py-3 gap-0.5">
          <div className="flex items-center gap-1 text-orange-500">
            <FaFire className="text-xs" />
            <span className="font-bold text-gray-800 dark:text-gray-100 text-base">{(session.total_calories || 0).toLocaleString()}</span>
          </div>
          <span className="text-[10px] text-gray-400 uppercase tracking-wide">Kcal</span>
        </div>
        <div className="flex flex-col items-center py-3 gap-0.5">
          <div className="flex items-center gap-1 text-indigo-500">
            <FaClock className="text-xs" />
            <span className="font-bold text-gray-800 dark:text-gray-100 text-base">{session.duration_minutes || 0}</span>
          </div>
          <span className="text-[10px] text-gray-400 uppercase tracking-wide">Phút</span>
        </div>
        {totalSkipped > 0 && (
          <div className="flex flex-col items-center py-3 gap-0.5">
            <div className="flex items-center gap-1 text-red-500">
              <FaTimes className="text-xs" />
              <span className="font-bold text-gray-800 dark:text-gray-100 text-base">{totalSkipped}</span>
            </div>
            <span className="text-[10px] text-gray-400 uppercase tracking-wide">Bỏ</span>
          </div>
        )}
      </div>

      {/* Exercises section */}
      {exercises.length > 0 && (
        <div className="px-5 py-3">
          <button
            onClick={() => setExpanded(v => !v)}
            className="w-full flex items-center justify-between mb-2 group"
          >
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
              <MdFitnessCenter className="inline mr-1" />Chi tiết bài tập
            </p>
            <span className="text-[10px] text-blue-500 font-medium group-hover:underline flex items-center gap-1">
              {expanded ? <><FaChevronUp className="text-[8px]" /> Thu gọn</> : <><FaChevronDown className="text-[8px]" /> Xem chi tiết</>}
            </span>
          </button>

          {expanded ? (
            <div className="space-y-2">
              {exercises.map((ex, idx) => (
                <ExerciseDetailCard key={idx} exercise={ex} index={idx} />
              ))}
            </div>
          ) : (
            // Compact list when collapsed
            <div className="space-y-1.5">
              {exercises.map((ex, idx) => {
                const sets = ex.sets || []
                const completedSets = sets.filter(s => s.completed)
                const skippedSets = sets.filter(s => s.skipped)
                return (
                  <div key={idx} className="flex items-center gap-2.5 py-1.5 px-3 rounded-lg bg-gray-50 dark:bg-gray-700/40">
                    <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0
                      ${completedSets.length === sets.length ? 'bg-green-500 text-white' : 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300'}`}>
                      {completedSets.length === sets.length ? <FaCheck /> : idx + 1}
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-200 font-medium flex-1 truncate">
                      {ex.exercise_name}
                    </span>
                    <span className="text-[10px] text-gray-400 flex-shrink-0">
                      {completedSets.length}/{sets.length} set
                    </span>
                    {skippedSets.length > 0 && (
                      <span className="text-[9px] text-red-400 font-bold flex-shrink-0">
                        {skippedSets.length} bỏ
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Muscles & Equipment tags */}
      {((session.muscles_targeted?.length > 0) || (session.equipment_used?.length > 0)) && (
        <div className="px-5 pb-4 flex flex-wrap gap-1.5">
          {session.muscles_targeted?.map(m => (
            <span key={m} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-full text-[10px] font-medium border border-blue-100 dark:border-blue-800">
              💪 {MUSCLE_LABELS[m] || m}
            </span>
          ))}
          {session.equipment_used?.map(eq => (
            <span key={eq} className="px-2 py-0.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 rounded-full text-[10px] font-medium border border-purple-100 dark:border-purple-800">
              🏋️ {EQUIPMENT_LABELS[eq] || eq}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default function MyTraining() {
  const [page, setPage] = useState(1)

  const { data: historyData, isLoading } = useQuery({
    queryKey: ['workoutHistory', page],
    queryFn: () => getWorkoutHistory({ page, limit: 10 })
  })

  const sessions = historyData?.data?.result?.sessions || []
  const total = historyData?.data?.result?.total || 0

  return (
    <div>
      {/* Page Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-6">
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
              <FaHistory className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Lịch sử tập luyện</h1>
              <p className="text-white/75 text-sm mt-0.5">Tổng cộng {total} phiên tập đã thực hiện</p>
            </div>
          </div>
          <Link
            to="/training"
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-xl transition backdrop-blur self-start sm:self-auto"
          >
            <GiWeightLiftingUp /> Tập mới
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-3xl px-4 py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4" />
            <p className="text-gray-500">Đang tải...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-16">
            <GiMuscleUp className="mx-auto text-6xl text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-medium text-gray-600 dark:text-gray-400 mb-2">Chưa có phiên tập nào</h3>
            <p className="text-gray-400 mb-6">Bắt đầu bài tập đầu tiên của bạn ngay!</p>
            <Link to="/training" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700">
              <FaDumbbell /> Bắt đầu tập
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <SessionCard key={session._id} session={session} />
            ))}

            {/* Pagination */}
            {total > 10 && (
              <div className="flex justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 disabled:opacity-30 text-sm font-medium"
                >
                  Trước
                </button>
                <span className="px-4 py-2 text-sm text-gray-500">
                  Trang {page} / {Math.ceil(total / 10)}
                </span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= Math.ceil(total / 10)}
                  className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 disabled:opacity-30 text-sm font-medium"
                >
                  Sau
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}