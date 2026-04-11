import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function FitnessCheckinModal({ challenge, onClose }) {
  const navigate = useNavigate()

  useEffect(() => {
    onClose()
    navigate('/training', {
      state: {
        challengeId: challenge?._id,
        challengeTitle: challenge?.title,
        challengeExercises: challenge?.exercises || [],
        referrer: 'challenge'
      }
    })
  }, [])

  return null
}
