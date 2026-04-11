import { useSafeMutation } from '../../../hooks/useSafeMutation'
import { createChallengeDayComment, getChallengeDayComments } from '../../../apis/challengeApi'
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query'
import ChallengeDayCommentItems from './ChallengeDayCommentItems'
import Loading from '../../../components/GlobalComponents/Loading'
import { useContext, useState } from 'react'
import InputEmoji from '../../../components/InputComponents/InputEmoji'
import { queryClient } from '../../../main'
import { AppContext } from '../../../contexts/app.context'
import { toast } from 'react-hot-toast'
import { FaComments } from 'react-icons/fa'

export default function ChallengeDayComments({ challengeId, targetUserId, date }) {
  const [content, setContent] = useState('')
  const { profile } = useContext(AppContext)

  const commentKey = `challenge-day-comments-${challengeId}-${targetUserId}-${date}`

  const fetchComment = async ({ pageParam }) => {
    return await getChallengeDayComments(challengeId, {
      targetUserId,
      date,
      page: pageParam
    })
  }

  const commentMutation = useSafeMutation({
    mutationFn: (body) => createChallengeDayComment(challengeId, body)
  })

  const handleCreateComment = async (e) => {
    if (content.trim() === '') return
    e.preventDefault()
    commentMutation.mutate(
      {
        targetUserId,
        date,
        content: content
      },
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries({ queryKey: [commentKey] })
          setContent('')
        },
        onError: () => {
          toast.error('Có lỗi xảy ra khi bình luận')
        }
      }
    )
  }

  const { data, status, fetchNextPage, isFetchingNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: [commentKey],
    queryFn: fetchComment,
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const nextPage = lastPage.data.result.comments?.length ? allPages.length + 1 : undefined
      return nextPage
    },
    placeholderData: keepPreviousData
  })

  const totalComments = data?.pages?.[0]?.data?.result?.total || 0

  const contentComment = data?.pages.map((dataComments) =>
    dataComments?.data?.result?.comments?.map((comment) => {
      return (
        <ChallengeDayCommentItems
          key={comment._id}
          comment={comment}
          challengeId={challengeId}
          targetUserId={targetUserId}
          date={date}
        />
      )
    })
  )

  if (status === 'pending') {
    return <Loading className='w-full flex justify-center mt-4' />
  }

  return (
    <div className='mt-4 pt-4 border-t border-gray-200 dark:border-gray-600'>
      {/* Header */}
      <div className='flex items-center gap-2 mb-3'>
        <FaComments className='text-orange-500 text-sm' />
        <h5 className='text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider'>
          Bình luận {totalComments > 0 && `(${totalComments})`}
        </h5>
      </div>

      {/* Input */}
      {profile && (
        <div className='mb-4'>
          <InputEmoji content={content} setContent={setContent} handleCreateComment={handleCreateComment} />
        </div>
      )}

      {/* Comments list */}
      <div>
        {contentComment}
        {totalComments > 0 && (
          <div className='w-full'>
            <button
              className='py-2 px-4 w-full block bg-gray-50 dark:bg-gray-700 text-center rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-600 transition text-xs text-gray-500 dark:text-gray-400'
              disabled={!hasNextPage || isFetchingNextPage}
              onClick={() => fetchNextPage()}
            >
              {isFetchingNextPage ? 'Đang tải ...' : hasNextPage ? 'Xem thêm bình luận' : 'Không còn bình luận nào'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
