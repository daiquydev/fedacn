import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FaDumbbell, FaClock, FaCalendarAlt, FaHistory, FaFire, FaRedo, FaChevronDown, FaChevronUp, FaCheckCircle } from 'react-icons/fa'
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

const EXERCISES_PREVIEW_LIMIT = 3

function SessionCard({ session }) {
  const [expanded, setExpanded] = useState(false)
  const exercises = session.exercises || []
  const visibleExercises = expanded ? exercises : exercises.slice(0, EXERCISES_PREVIEW_LIMIT)
  const hasMore = exercises.length > EXERCISES_PREVIEW_LIMIT

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
      <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-gray-700/60 border-b border-gray-50 dark:border-gray-700/60">
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
      </div>

      {/* Exercises list */}
      {exercises.length > 0 && (
        <div className="px-5 py-3">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
            <MdFitnessCenter className="inline mr-1" />Bài tập
          </p>
          <div className="space-y-1.5">
            {visibleExercises.map((ex, idx) => (
              <div key={idx} className="flex items-center gap-2.5 py-1.5 px-3 rounded-lg bg-gray-50 dark:bg-gray-700/40 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                  {idx + 1}
                </span>
                <span className="text-sm text-gray-700 dark:text-gray-200 font-medium flex-1 truncate">
                  {ex.exercise_name}
                </span>
                {ex.sets?.length > 0 && (
                  <span className="text-[10px] text-gray-400 flex-shrink-0 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-1.5 py-0.5 rounded-full">
                    {ex.sets.length} set
                  </span>
                )}
                <FaCheckCircle className="text-green-400 text-xs flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>

          {hasMore && (
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded(v => !v) }}
              className="mt-2 flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
            >
              {expanded
                ? <><FaChevronUp className="text-[10px]" /> Thu gọn</>
                : <><FaChevronDown className="text-[10px]" /> Xem thêm {exercises.length - EXERCISES_PREVIEW_LIMIT} bài tập</>
              }
            </button>
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