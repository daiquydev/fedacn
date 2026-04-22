import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FaArrowLeft } from 'react-icons/fa'
import { getChallenge } from '../../apis/challengeApi'
import EditChallengeModal from './components/EditChallengeModal'

/**
 * Trang chỉnh sửa thử thách (full page) — đồng bộ trải nghiệm với Chỉnh sửa sự kiện.
 */
export default function EditChallenge() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const from = location.state?.from || '/challenge/my-challenges'

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['challenge', id],
    queryFn: () => getChallenge(id),
    enabled: Boolean(id)
  })

  const challenge = data?.data?.result

  const handleClose = () => {
    queryClient.invalidateQueries({ queryKey: ['challenge', id] })
    navigate(from, { replace: true })
  }

  if (!id) {
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center gap-4 px-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Đang tải thử thách...</p>
      </div>
    )
  }

  if (isError || !challenge) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-10">
        <div className="max-w-lg mx-auto bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 text-center shadow-sm">
          <p className="text-red-600 dark:text-red-400 font-semibold mb-2">Không thể tải thử thách</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {error?.response?.data?.message || 'Thử thách không tồn tại hoặc bạn không có quyền xem.'}
          </p>
          <button
            type="button"
            onClick={() => navigate(from)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition"
          >
            <FaArrowLeft className="text-xs" /> Quay lại
          </button>
        </div>
      </div>
    )
  }

  return (
    <EditChallengeModal layout="page" open challenge={challenge} onClose={handleClose} />
  )
}
