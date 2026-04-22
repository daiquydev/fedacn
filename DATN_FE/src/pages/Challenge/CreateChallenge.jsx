import { useLocation, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import CreateChallengeModal from './components/CreateChallengeModal'

/**
 * Trang tạo thử thách (full page) — cùng luồng form với modal, bố cục giống Tạo sự kiện thể thao.
 */
export default function CreateChallenge() {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const from = location.state?.from || '/challenge/my-challenges'

  const handleClose = () => {
    queryClient.invalidateQueries({ queryKey: ['challenges-feed'] })
    navigate(from, { replace: true })
  }

  return (
    <CreateChallengeModal layout="page" open onClose={handleClose} />
  )
}
