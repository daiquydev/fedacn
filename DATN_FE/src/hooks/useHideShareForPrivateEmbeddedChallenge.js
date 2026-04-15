import { useQuery } from '@tanstack/react-query'
import { getChallenge } from '../apis/challengeApi'
import { extractEmbeddedChallengeIdFromPostContent } from '../utils/postEmbeddedChallengeId'

/**
 * Bài có nhúng thử thách (marker) + visibility private → không cho chia sẻ lại bài.
 * Hoặc GET challenge 403 (không được xem) → ẩn chia sẻ, tránh thao tác vô nghĩa / lỗi.
 */
export function useHideShareForPrivateEmbeddedChallenge(content) {
  const challengeId = extractEmbeddedChallengeIdFromPostContent(content)

  const { data, isError, error, isFetched } = useQuery({
    queryKey: ['challenge-preview', challengeId],
    queryFn: () => getChallenge(challengeId),
    enabled: Boolean(challengeId),
    staleTime: 60_000,
    retry: false
  })

  const visibility = data?.data?.result?.visibility
  const status = error?.response?.status
  const forbidden = isError && (status === 403 || status === 401)
  const isPrivate = visibility === 'private'

  const hideShare =
    Boolean(challengeId) &&
    (forbidden || (isFetched && !isError && isPrivate))

  return hideShare
}
