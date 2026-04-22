import React, { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FaArrowLeft } from 'react-icons/fa'
import { getChallenge, getChallengeParticipants } from '../../apis/challengeApi'
import ParticipantProgressModal from './components/ParticipantProgressModal'

export default function ChallengeParticipantProgress() {
  const { id, userId } = useParams()
  const navigate = useNavigate()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['challenge', id],
    queryFn: () => getChallenge(id),
    staleTime: 1000,
    enabled: Boolean(id)
  })
  const challenge = data?.data?.result

  const { data: participantsData, isLoading: participantsLoading } = useQuery({
    queryKey: ['challenge-participants', id],
    queryFn: () => getChallengeParticipants(id),
    staleTime: 1000,
    enabled: Boolean(id)
  })
  const participantsList = participantsData?.data?.result?.participants || []

  const participantFromList = useMemo(
    () => participantsList.find(p => String(p.user?._id || p._id) === String(userId)),
    [participantsList, userId]
  )

  const participant = useMemo(() => {
    if (participantFromList) return participantFromList
    return { user: { _id: userId } }
  }, [participantFromList, userId])

  const handleBack = () => navigate(`/challenge/${id}`)

  if (!id || !userId) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10">
        <p className="text-gray-600 dark:text-gray-400">Liên kết không hợp lệ.</p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-orange-600 hover:text-orange-700"
        >
          <FaArrowLeft /> Quay lại
        </button>
      </div>
    )
  }

  if (isLoading || participantsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-10 h-10 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (isError || !challenge) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10">
        <button
          type="button"
          onClick={handleBack}
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-orange-600"
        >
          <FaArrowLeft /> Về thử thách
        </button>
        <p className="text-gray-600 dark:text-gray-400">Không tải được thử thách hoặc bạn không có quyền xem.</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-4 py-4 pb-12">
      <ParticipantProgressModal
        layout="page"
        participant={participant}
        challenge={challenge}
        onClose={handleBack}
      />
    </div>
  )
}
