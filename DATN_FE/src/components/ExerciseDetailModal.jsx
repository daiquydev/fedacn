import { FaTimes } from 'react-icons/fa'
import { GiBiceps } from 'react-icons/gi'
import { formatExerciseCategoryVi, formatExerciseDifficultyVi } from '../utils/exerciseLabels'

export function getExerciseYouTubeId(url) {
  if (!url) return null
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/)
  return m ? m[1] : null
}

/**
 * Modal chi tiết bài tập — dùng chung (Tập luyện, AI phân tích, v.v.)
 * @param {{ exercise: object | null, onClose: () => void, aiReason?: string }} props
 */
export default function ExerciseDetailModal({ exercise, onClose, aiReason }) {
  if (!exercise) return null
  const detailEx = exercise
  const yt = getExerciseYouTubeId(detailEx.video_url)
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        {detailEx.video_url && yt ? (
          <div className="w-full aspect-video rounded-t-2xl overflow-hidden bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${yt}`}
              className="w-full h-full" frameBorder="0" allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        ) : detailEx.video_url ? (
          <div className="w-full aspect-video rounded-t-2xl overflow-hidden bg-gray-900 flex items-center justify-center">
            <a href={detailEx.video_url} target="_blank" rel="noopener noreferrer"
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium flex items-center gap-2 hover:bg-blue-700 transition">
              🎬 Xem video hướng dẫn
            </a>
          </div>
        ) : (
          <div className="w-full h-32 rounded-t-2xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <GiBiceps className="text-5xl text-white/80" />
          </div>
        )}

        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold">{detailEx.name}</h3>
              {detailEx.name_vi && <p className="text-sm text-gray-500 mt-0.5">{detailEx.name_vi}</p>}
            </div>
            <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><FaTimes /></button>
          </div>

          <div className="flex gap-2 flex-wrap">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${detailEx.difficulty === 'beginner' ? 'bg-green-100 text-green-700' : detailEx.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{formatExerciseDifficultyVi(detailEx.difficulty)}</span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">{formatExerciseCategoryVi(detailEx.category)}</span>
            {(() => {
              const cpu = detailEx.default_sets?.[0]?.calories_per_unit ?? null
              return cpu != null
                ? <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">🔥 {cpu} kcal/đơn vị</span>
                : null
            })()}
          </div>

          {aiReason && (
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">💡 Lý do gợi ý (AI)</p>
              <p className="text-sm text-amber-800 dark:text-amber-200">{aiReason}</p>
            </div>
          )}

          {detailEx.instructions?.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Hướng dẫn thực hiện</p>
              <ol className="text-sm space-y-2">
                {detailEx.instructions.map((inst, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                    <span className="pt-0.5">{inst}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {detailEx.tips && (
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">💡 Mẹo</p>
              <p className="text-sm">{detailEx.tips}</p>
            </div>
          )}

          {detailEx.default_sets?.length > 0 && (
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl p-4">
              <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-3">📋 Set tập mặc định</p>
              <div className="overflow-hidden rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="grid grid-cols-4 gap-px bg-orange-200 dark:bg-orange-800">
                  {['Set', 'Reps (Số lần)', 'Weight (Mức tạ)', 'kcal'].map(h => (
                    <div key={h} className="bg-orange-100 dark:bg-orange-900/60 px-3 py-2 text-[11px] font-bold text-orange-700 dark:text-orange-300 text-center">{h}</div>
                  ))}
                </div>
                {detailEx.default_sets.map((s, i) => (
                  <div key={i} className="grid grid-cols-4 gap-px bg-orange-200 dark:bg-orange-800">
                    <div className="bg-white dark:bg-gray-800 px-3 py-2 text-sm text-center font-bold text-blue-600">{s.set_number}</div>
                    <div className="bg-white dark:bg-gray-800 px-3 py-2 text-sm text-center">{s.reps} lần</div>
                    <div className="bg-white dark:bg-gray-800 px-3 py-2 text-sm text-center">{s.weight} kg</div>
                    <div className="bg-white dark:bg-gray-800 px-3 py-2 text-sm text-center font-bold text-orange-600">{((s.reps || 0) * (s.weight || 0) * (s.calories_per_unit ?? 10)).toFixed(0)} kcal</div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-orange-500 mt-2 text-center">kcal = Reps × Weight × kcal/đơn vị</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
