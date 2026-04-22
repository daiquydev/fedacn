import { useSafeMutation } from '../../../hooks/useSafeMutation'
import { formatRelativeTimeVi } from '../../../utils/formatRelativeTimeVi'
import useravatar from '../../../assets/images/useravatar.jpg'
import { useContext, useState } from 'react'
import InputEmoji from '../../../components/InputComponents/InputEmoji'
import ShowMoreContent from '../../../components/GlobalComponents/ShowMoreContent/ShowMoreContent'
import { createChallengeDayComment, deleteChallengeDayComment, getChallengeDayChildComments } from '../../../apis/challengeApi'
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query'
import { queryClient } from '../../../main'
import { AppContext } from '../../../contexts/app.context'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { FaCheckCircle, FaTrash, FaEllipsisH } from 'react-icons/fa'
import { getImageUrl } from '../../../utils/imageUrl'

function SimpleThreeDot({ isPending, userID, handleDeleteComment }) {
  const [isOpen, setIsOpen] = useState(false)
  const { profile } = useContext(AppContext)

  if (profile?._id !== userID) return null

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center rounded-full text-gray-400 hover:text-gray-600 focus:outline-none"
      >
        <FaEllipsisH className="h-3.5 w-3.5" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="absolute right-0 z-20 mt-2 w-44 origin-top-right rounded-lg bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1">
              <button
                onClick={() => {
                  handleDeleteComment()
                  setIsOpen(false)
                }}
                disabled={isPending}
                className="hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex w-full px-4 py-2 text-sm items-center gap-2"
              >
                <FaTrash className="text-red-500" />
                <span>Xóa bình luận</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function ChallengeDayCommentItems({ comment, challengeId, targetUserId, date }) {
  const [showReply, setShowReply] = useState(false)
  const [content, setContent] = useState('')
  const { profile } = useContext(AppContext)
  const navigate = useNavigate()

  const commentKey = `challenge-day-comments-${challengeId}-${targetUserId}-${date}`
  const childKey = `challenge-day-child-comments-${comment._id}`

  const checkNavigateUser = () => {
    if (profile?._id === comment.userId?._id) {
      navigate('/me')
    } else {
      navigate(`/user/${comment.userId?._id}`)
    }
  }

  const fetchChildComment = async ({ pageParam }) => {
    return await getChallengeDayChildComments(challengeId, comment._id, { page: pageParam })
  }

  const { data, fetchNextPage, isFetchingNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: [childKey],
    queryFn: fetchChildComment,
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const nextPage = lastPage.data.result.child_comments?.length ? allPages.length + 1 : undefined
      return nextPage
    },
    placeholderData: keepPreviousData,
    enabled: showReply
  })

  const commentMutation = useSafeMutation({
    mutationFn: (body) => createChallengeDayComment(challengeId, body)
  })

  const handleShowReply = () => {
    setShowReply(!showReply)
  }

  const handleCreateChildComment = async (e) => {
    if (content.trim() === '') return
    e.preventDefault()
    commentMutation.mutate(
      {
        targetUserId,
        date,
        content: content,
        parent_comment_id: comment._id
      },
      {
        onSuccess: async () => {
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: [commentKey] }),
            queryClient.invalidateQueries({ queryKey: [childKey] })
          ])
          setContent('')
        },
        onError: () => {
          toast.error('Có lỗi xảy ra khi bình luận')
        }
      }
    )
  }

  const contentChildComment = data?.pages.map((dataChildComments) =>
    dataChildComments?.data?.result?.child_comments?.map((child_comment) => {
      return (
        <CommentChildItem
          key={child_comment._id}
          comment={child_comment}
          challengeId={challengeId}
          targetUserId={targetUserId}
          date={date}
          parentCommentId={comment._id}
        />
      )
    })
  )

  const deleteCommentMutation = useSafeMutation({
    mutationFn: () => deleteChallengeDayComment(challengeId, comment._id)
  })

  const handleDeleteComment = async () => {
    deleteCommentMutation.mutate(undefined, {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [commentKey] })
        toast.success('Xóa bình luận thành công')
      },
      onError: () => {
        toast.error('Có lỗi xảy ra khi xóa')
      }
    })
  }

  return (
    <div className='flex pb-4'>
      <div onClick={checkNavigateUser} className='inline-block mr-3 cursor-pointer shrink-0'>
        <img
          className='rounded-full w-8 h-8 object-cover'
          src={!comment.userId?.avatar ? useravatar : getImageUrl(comment.userId.avatar)}
          onError={e => { e.target.onerror = null; e.target.src = useravatar }}
        />
      </div>
      <div className='w-full min-w-0'>
        <div onClick={checkNavigateUser} className='flex items-center gap-1 mr-2 cursor-pointer'>
          <span className='hover:underline text-sm font-bold dark:text-gray-200 truncate'>{comment.userId?.name}</span>
          {comment.userId?.role === 1 && (
            <div className='text-blue-400 rounded-full flex justify-center items-center'>
              <FaCheckCircle size={10} />
            </div>
          )}
          <span className='text-slate-500 text-[10px] dark:text-slate-400 whitespace-nowrap'>{formatRelativeTimeVi(comment.createdAt)}</span>
        </div>
        <ShowMoreContent className='text-sm dark:text-gray-300 whitespace-pre-line' lines={3}>
          <p>{comment.content}</p>
        </ShowMoreContent>

        <div className='mt-1.5 mb-1.5 flex items-center gap-3'>
          <div
            className='inline-flex hover:text-blue-400 cursor-pointer text-xs items-center dark:text-gray-400'
            onClick={handleShowReply}
          >
            <span className='font-medium'>{comment.replyCount} phản hồi</span>
          </div>
          <button
            onClick={handleShowReply}
            className='py-0.5 px-2 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition'
          >
            Trả lời
          </button>
        </div>
        {showReply && (
          <div className='pl-3 border-l-2 border-gray-100 dark:border-gray-700'>
            {contentChildComment}
            <div className="mt-3">
              <InputEmoji content={content} setContent={setContent} handleCreateComment={handleCreateChildComment} />
            </div>
            <div className='w-full mt-2'>
              <button
                className='py-1 px-4 w-full hover:text-blue-600 block text-center rounded-lg font-medium transition ease-in-out delay-75 text-xs text-gray-500'
                disabled={!hasNextPage || isFetchingNextPage}
                onClick={() => fetchNextPage()}
              >
                {isFetchingNextPage ? 'Đang tải...' : hasNextPage ? 'Xem thêm phản hồi' : ''}
              </button>
            </div>
          </div>
        )}
      </div>
      <div className='shrink-0'>
        <SimpleThreeDot
          isPending={deleteCommentMutation.isPending}
          userID={comment.userId?._id}
          handleDeleteComment={handleDeleteComment}
        />
      </div>
    </div>
  )
}

function CommentChildItem({ comment, challengeId, targetUserId, date, parentCommentId }) {
  const { profile } = useContext(AppContext)
  const navigate = useNavigate()

  const commentKey = `challenge-day-comments-${challengeId}-${targetUserId}-${date}`
  const childKey = `challenge-day-child-comments-${parentCommentId}`

  const checkNavigateUser = () => {
    if (profile?._id === comment.userId?._id) {
      navigate('/me')
    } else {
      navigate(`/user/${comment.userId?._id}`)
    }
  }

  const deleteChildCommentMutation = useSafeMutation({
    mutationFn: () => deleteChallengeDayComment(challengeId, comment._id)
  })

  const handleDeleteChildComment = async () => {
    deleteChildCommentMutation.mutate(undefined, {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: [commentKey] }),
          queryClient.invalidateQueries({ queryKey: [childKey] })
        ])
        toast.success('Xóa bình luận thành công')
      },
      onError: () => {
        toast.error('Có lỗi xảy ra khi xóa')
      }
    })
  }

  return (
    <div className='mt-3'>
      <div className='pb-3 flex justify-between'>
        <div className='flex w-full'>
          <div onClick={checkNavigateUser} className='mr-2.5 cursor-pointer shrink-0'>
            <img
              className='rounded-full w-7 h-7 object-cover'
              src={!comment.userId?.avatar ? useravatar : getImageUrl(comment.userId.avatar)}
              onError={e => { e.target.onerror = null; e.target.src = useravatar }}
            />
          </div>
          <div className='w-full min-w-0'>
            <div>
              <div onClick={checkNavigateUser} className='flex items-center gap-1 flex-wrap mr-2 cursor-pointer'>
                <span className='hover:underline text-xs font-bold dark:text-gray-200'>{comment.userId?.name}</span>
                {comment.userId?.role === 1 && (
                  <div className='text-blue-400 rounded-full flex justify-center items-center'>
                    <FaCheckCircle size={9} />
                  </div>
                )}
                <span className='text-slate-500 text-[9px] dark:text-slate-400'>
                  {formatRelativeTimeVi(comment.createdAt)}
                </span>
              </div>
            </div>
            <ShowMoreContent className='text-xs dark:text-gray-300 whitespace-pre-line' lines={2}>
              <p className='text-xs'>{comment.content}</p>
            </ShowMoreContent>
          </div>
        </div>

        <div className='shrink-0'>
          <SimpleThreeDot
            isPending={deleteChildCommentMutation.isPending}
            userID={comment.userId?._id}
            handleDeleteComment={handleDeleteChildComment}
          />
        </div>
      </div>
    </div>
  )
}
