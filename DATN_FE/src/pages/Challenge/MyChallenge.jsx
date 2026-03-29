import { useSafeMutation } from '../../hooks/useSafeMutation'
import React, { useState } from 'react'
import DeleteConfirmBox from '../../components/GlobalComponents/DeleteConfirmBox'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  FaEdit, FaTrash, FaArrowLeft, FaCalendarAlt, FaUsers,
  FaPlus, FaTrophy, FaEye, FaUtensils, FaRunning, FaDumbbell, FaFire, FaClock
} from 'react-icons/fa'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import { getMyCreatedChallenges, getMyChallenges, deleteChallenge } from '../../apis/challengeApi'
import { getImageUrl } from '../../utils/imageUrl'
import toast from 'react-hot-toast'
import EditChallengeModal from './components/EditChallengeModal'
import CreateChallengeModal from './components/CreateChallengeModal'

const TYPE_CONFIG = {
  nutrition: { icon: <FaUtensils />, label: 'Ăn uống', gradient: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300' },
  outdoor_activity: { icon: <FaRunning />, label: 'Ngoài trời', gradient: 'from-blue-500 to-cyan-600', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
  fitness: { icon: <FaDumbbell />, label: 'Thể dục', gradient: 'from-purple-500 to-pink-600', bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300' }
}

export default function MyChallenge() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState('created')
  const [openDeleteBox, setOpenDeleteBox] = useState(false)
  const [selectedInfo, setSelectedInfo] = useState({ id: null, name: '' })
  const [editChallenge, setEditChallenge] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Fetch created challenges
  const {
    data: createdData,
    isLoading: isLoadingCreated
  } = useQuery({
    queryKey: ['my-created-challenges'],
    queryFn: () => getMyCreatedChallenges({ page: 1, limit: 100 }),
    staleTime: 1000
  })
  const createdChallenges = createdData?.data?.result?.challenges || []

  // Fetch joined challenges (always, so badge count is correct on first render)
  const {
    data: joinedData,
    isLoading: isLoadingJoined
  } = useQuery({
    queryKey: ['my-challenges'],
    queryFn: () => getMyChallenges({ limit: 100 }),
    staleTime: 1000
  })
  const joinedParticipations = joinedData?.data?.result?.participations || []

  // Delete mutation
  const deleteMutation = useSafeMutation({
    mutationFn: (id) => deleteChallenge(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-created-challenges'] })
      queryClient.invalidateQueries({ queryKey: ['challenges'] })
      toast.success('Đã xóa thử thách thành công!')
      setOpenDeleteBox(false)
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Không thể xóa thử thách')
      setOpenDeleteBox(false)
    }
  })

  const handleDeleteClick = (id, name) => {
    setSelectedInfo({ id, name })
    setOpenDeleteBox(true)
  }

  const confirmDelete = () => {
    if (selectedInfo.id) {
      deleteMutation.mutate(selectedInfo.id)
    }
  }

  // Stats
  const totalCreated = createdChallenges.length
  const totalJoined = joinedParticipations.length

  // ===================== CARD COMPONENTS =====================
  const CreatedChallengeCard = ({ challenge }) => {
    const config = TYPE_CONFIG[challenge.challenge_type] || TYPE_CONFIG.fitness
    const now = new Date()
    const startDate = new Date(challenge.start_date)
    const endDate = new Date(challenge.end_date)
    const isOngoing = now >= startDate && now <= endDate
    const isUpcoming = now < startDate
    const isEnded = now > endDate

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-md transition group">
        <div className="flex flex-col md:flex-row">
          {/* Image */}
          <div className="md:w-1/3 relative">
            {challenge.image ? (
              <img src={getImageUrl(challenge.image)} alt={challenge.title} className="w-full h-48 md:h-full object-cover" />
            ) : (
              <div className={`w-full h-48 md:h-full bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
                <span className="text-6xl opacity-30">{challenge.badge_emoji || '🏆'}</span>
              </div>
            )}
            {/* Status Badge */}
            <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold text-white ${isOngoing ? 'bg-green-500' : isUpcoming ? 'bg-blue-500' : 'bg-gray-500'
              }`}>
              {isOngoing ? '🟢 Đang diễn ra' : isUpcoming ? '⏰ Sắp diễn ra' : '✓ Đã kết thúc'}
            </div>
          </div>

          {/* Details */}
          <div className="p-6 md:w-2/3 flex flex-col justify-between">
            <div>
              {/* Title & Type */}
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-1">
                  {challenge.title}
                </h3>
                <span className={`ml-2 px-3 py-1 ${config.bg} ${config.text} rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1`}>
                  {config.icon} {config.label}
                </span>
              </div>

              {/* Description */}
              {challenge.description && (
                <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {challenge.description}
                </p>
              )}

              {/* Meta Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center">
                  <FaCalendarAlt className="mr-2 text-blue-500" />
                  <span>Bắt đầu: {new Date(challenge.start_date).toLocaleDateString('vi-VN')}</span>
                </div>
                <div className="flex items-center">
                  <FaCalendarAlt className="mr-2 text-red-400" />
                  <span>Kết thúc: {new Date(challenge.end_date).toLocaleDateString('vi-VN')}</span>
                </div>
                <div className="flex items-center">
                  <FaFire className="mr-2 text-orange-500" />
                  <span>Mục tiêu/ngày: {challenge.goal_value} {challenge.goal_unit}</span>
                </div>
                <div className="flex items-center">
                  <FaUsers className="mr-2 text-yellow-500" />
                  <span>{challenge.participants_count || 0} người tham gia</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
              <button
                onClick={() => navigate(`/challenge/${challenge._id}`)}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition"
              >
                <FaEye /> Xem chi tiết
              </button>
              <button
                onClick={() => setEditChallenge(challenge)}
                className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition"
              >
                <FaEdit /> Sửa
              </button>
              <button
                onClick={() => handleDeleteClick(challenge._id, challenge.title)}
                disabled={deleteMutation.isPending}
                className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition disabled:opacity-50"
              >
                {deleteMutation.isPending ? (
                  <AiOutlineLoading3Quarters className="animate-spin" />
                ) : (
                  <FaTrash />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const JoinedChallengeCard = ({ participation }) => {
    const challenge = participation.challenge_id
    if (!challenge) return null
    const config = TYPE_CONFIG[challenge.challenge_type] || TYPE_CONFIG.fitness

    const now = new Date()
    const startDate = new Date(challenge.start_date)
    const endDate = new Date(challenge.end_date)
    const isOngoing = now >= startDate && now <= endDate
    const isUpcoming = now < startDate
    const daysLeft = Math.max(0, Math.ceil((endDate - now) / (24 * 60 * 60 * 1000)))

    // Progress calculation
    const safeStart = new Date(challenge.start_date); safeStart.setHours(0, 0, 0, 0)
    const safeEnd = new Date(challenge.end_date); safeEnd.setHours(0, 0, 0, 0)
    const totalRequiredDays = Math.max(1, Math.ceil((safeEnd.getTime() - safeStart.getTime()) / (1000 * 60 * 60 * 24)) + 1)
    const progress = participation.goal_value > 0 ? Math.min(Math.round((participation.current_value / totalRequiredDays) * 100), 100) : 0

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-md transition group">
        <div className="flex flex-col md:flex-row">
          {/* Image */}
          <div className="md:w-1/3 relative">
            {challenge.image ? (
              <img src={getImageUrl(challenge.image)} alt={challenge.title} className="w-full h-48 md:h-full object-cover" />
            ) : (
              <div className={`w-full h-48 md:h-full bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
                <span className="text-6xl opacity-30">{challenge.badge_emoji || '🏆'}</span>
              </div>
            )}
            {/* Status Badge */}
            <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold text-white ${isOngoing ? 'bg-green-500' : isUpcoming ? 'bg-blue-500' : 'bg-gray-500'
              }`}>
              {isOngoing ? '🟢 Đang diễn ra' : isUpcoming ? '⏰ Sắp diễn ra' : '✓ Đã kết thúc'}
            </div>
          </div>

          {/* Details */}
          <div className="p-6 md:w-2/3 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-1">
                  {challenge.title}
                </h3>
                <span className={`ml-2 px-3 py-1 ${config.bg} ${config.text} rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1`}>
                  {config.icon} {config.label}
                </span>
              </div>

              {challenge.description && (
                <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {challenge.description}
                </p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center">
                  <FaCalendarAlt className="mr-2 text-blue-500" />
                  <span>Bắt đầu: {new Date(challenge.start_date).toLocaleDateString('vi-VN')}</span>
                </div>
                <div className="flex items-center">
                  <FaCalendarAlt className="mr-2 text-red-400" />
                  <span>Kết thúc: {new Date(challenge.end_date).toLocaleDateString('vi-VN')}</span>
                </div>
                <div className="flex items-center">
                  <FaFire className="mr-2 text-orange-500" />
                  <span>Mục tiêu/ngày: {challenge.goal_value} {challenge.goal_unit}</span>
                </div>
                {daysLeft > 0 && (
                  <div className="flex items-center">
                    <FaClock className="mr-2 text-yellow-500" />
                    <span>Còn {daysLeft} ngày</span>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-500">
                    {participation.current_value} / {totalRequiredDays} ngày hoàn thành
                  </span>
                  <span className={`text-xs font-bold ${progress >= 100 ? 'text-green-600' : 'text-gray-700 dark:text-gray-300'}`}>
                    {progress}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${config.gradient} transition-all duration-500`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                {participation.streak_count > 0 && <span>🔥 Streak: {participation.streak_count} ngày</span>}
                {participation.active_days?.length > 0 && <span>📅 {participation.active_days.length} ngày hoạt động</span>}
                {participation.is_completed && <span className="text-green-600 font-bold">✅ Hoàn thành!</span>}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
              <button
                onClick={() => navigate(`/challenge/${challenge._id}`)}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition"
              >
                <FaEye /> Xem chi tiết
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ===================== SKELETON =====================
  const SkeletonCard = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 animate-pulse">
      <div className="flex flex-col md:flex-row">
        <div className="md:w-1/3 h-48 md:h-64 bg-gray-300 dark:bg-gray-700" />
        <div className="p-6 md:w-2/3 space-y-4">
          <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full" />
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-2/3" />
          <div className="grid grid-cols-2 gap-2">
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded" />
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded" />
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Page Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-amber-600 to-orange-500 px-6 py-4">
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 container mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
              <FaTrophy className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Quản lý Thử thách</h1>
              <p className="text-white/75 text-xs mt-0.5">Theo dõi và quản lý các thử thách của bạn</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => navigate('/challenge')}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2 text-sm"
            >
              <FaArrowLeft /> Quay lại danh sách
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-white hover:bg-gray-50 text-orange-600 px-4 py-2 rounded-xl font-semibold transition shadow-lg hover:shadow-xl flex items-center gap-2 text-sm"
            >
              <FaPlus /> Tạo thử thách mới
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-6">

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-t-lg border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('created')}
              className={`flex-1 md:flex-none px-6 py-4 font-semibold transition ${activeTab === 'created'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
            >
              Thử thách đã tạo ({totalCreated})
            </button>
            <button
              onClick={() => setActiveTab('joined')}
              className={`flex-1 md:flex-none px-6 py-4 font-semibold transition ${activeTab === 'joined'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
            >
              Đã tham gia ({totalJoined})
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-800 rounded-b-lg shadow-md p-6 mb-8">
          {activeTab === 'created' ? (
            isLoadingCreated ? (
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : createdChallenges.length > 0 ? (
              <div className="space-y-6">
                {createdChallenges.map((challenge) => (
                  <CreatedChallengeCard key={challenge._id} challenge={challenge} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <FaTrophy className="mx-auto text-gray-400 text-6xl mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  Bạn chưa tạo thử thách nào
                </h3>
                <p className="text-gray-500 dark:text-gray-500 mb-6">
                  Hãy tạo thử thách đầu tiên của bạn ngay!
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                >
                  <FaPlus />
                  Tạo thử thách mới
                </button>
              </div>
            )
          ) : (
            isLoadingJoined ? (
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : joinedParticipations.length > 0 ? (
              <div className="space-y-6">
                {joinedParticipations.map((p) => (
                  <JoinedChallengeCard key={p._id} participation={p} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <FaTrophy className="mx-auto text-gray-400 text-6xl mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  Bạn chưa tham gia thử thách nào
                </h3>
                <p className="text-gray-500 dark:text-gray-500 mb-6">
                  Khám phá và tham gia các thử thách thú vị ngay!
                </p>
                <Link
                  to="/challenge"
                  className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                >
                  Khám phá thử thách
                </Link>
              </div>
            )
          )}
        </div>
      </div>

      {/* Delete Confirm */}
      {openDeleteBox && (
        <DeleteConfirmBox
          title='Xóa thử thách'
          subtitle={`Bạn chắc chắn muốn xóa thử thách "${selectedInfo.name}"?`}
          handleDelete={confirmDelete}
          closeModal={() => setOpenDeleteBox(false)}
          isPending={deleteMutation.isPending}
        />
      )}

      {/* Create Modal */}
      <CreateChallengeModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {/* Edit Modal */}
      <EditChallengeModal
        open={!!editChallenge}
        onClose={() => setEditChallenge(null)}
        challenge={editChallenge}
      />
    </div>
  )
}
