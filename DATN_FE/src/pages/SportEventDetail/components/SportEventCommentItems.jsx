import moment from 'moment'
import useravatar from '../../../assets/images/useravatar.jpg'
import { useContext, useState } from 'react'
import InputEmoji from '../../../components/InputComponents/InputEmoji'
import ShowMoreContent from '../../../components/GlobalComponents/ShowMoreContent/ShowMoreContent'
import { createEventComment, deleteEventComment, getEventChildComments } from '../../../apis/sportEventApi'
import { keepPreviousData, useInfiniteQuery, useMutation } from '@tanstack/react-query'
import { queryClient } from '../../../main'
import { AppContext } from '../../../contexts/app.context'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { SocketContext } from '../../../contexts/socket.context'
import { FaCheckCircle, FaTrash, FaEllipsisH } from 'react-icons/fa'
import { getImageUrl } from '../../../utils/imageUrl'

// Custom SimpleThreeDot without HeadlessUI
function SimpleThreeDot({ isPending, userID, post, handleDeletePost }) {
  const [isOpen, setIsOpen] = useState(false)
  const { profile } = useContext(AppContext)
  
  if (profile?._id !== userID) return null

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center rounded-full text-gray-400 hover:text-gray-600 focus:outline-none"
      >
        <FaEllipsisH className="h-4 w-4" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="absolute right-0 z-20 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1">
              <button
                onClick={() => {
                  handleDeletePost()
                  setIsOpen(false)
                }}
                disabled={isPending}
                className="hover:bg-gray-100 text-gray-700 flex w-full px-4 py-2 text-sm items-center gap-2"
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

export default function SportEventCommentItems({ comment, post }) {
  const [showReply, setShowReply] = useState(false)
  const [content, setContent] = useState('')
  const { profile } = useContext(AppContext)
  const { newSocket } = useContext(SocketContext)
  const navigate = useNavigate()

  const checkNavigateUser = () => {
    if (profile?._id === comment.userId?._id) {
      navigate('/me')
    } else {
      navigate(`/user/${comment.userId?._id}`)
    }
  }

  const fetchChildComment = async ({ pageParam }) => {
    return await getEventChildComments(comment._id, { page: pageParam })
  }

  const { data, fetchNextPage, isFetchingNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ['eventChildComments', comment._id],
    queryFn: fetchChildComment,
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const nextPage = lastPage.data.result.child_comments?.length ? allPages.length + 1 : undefined
      return nextPage
    },
    placeholderData: keepPreviousData,
    enabled: showReply
  })

  const commentMutation = useMutation({
    mutationFn: (body) => createEventComment(post._id, body)
  })

  const handleShowReply = () => {
    setShowReply(!showReply)
  }

  const handleCreateChildComment = async (e) => {
    if (content.trim() === '') return
    e.preventDefault()
    commentMutation.mutate(
      {
        postId: post._id,
        content: content,
        parent_comment_id: comment._id
      },
      {
        onSuccess: async () => {
        //   newSocket.emit('comment child post', {
        //     content: 'Đã trả lời bình luận của bạn',
        //     to: comment.userId._id,
        //     name: profile.name,
        //     avatar: profile.avatar
        //   })
          await Promise.all([
            queryClient.invalidateQueries({
              queryKey: ['eventComments', post._id]
            }),
            queryClient.invalidateQueries({
              queryKey: ['eventPosts']
            }),
            queryClient.invalidateQueries({
              queryKey: ['eventChildComments', comment._id]
            })
          ])
          setContent('')
        },
        onError: () => {
          console.log('error')
        }
      }
    )
  }
  
  const contentChildComment = data?.pages.map((dataChildComments) =>
    dataChildComments?.data?.result?.child_comments?.map((child_comment) => {
      return (
        <CommentChildItems
          post={post}
          navigate={navigate}
          profile={profile}
          comment={child_comment}
          key={child_comment._id}
        />
      )
    })
  )

  const deleteCommentMutation = useMutation({
    mutationFn: () => deleteEventComment(comment._id)
  })

  const handleDeleteComment = async () => {
    deleteCommentMutation.mutate(undefined, {
        onSuccess: async () => {
          await Promise.all([
            queryClient.invalidateQueries({
              queryKey: ['eventComments', post._id]
            }),
            queryClient.invalidateQueries({
              queryKey: ['eventPosts']
            })
          ])
          toast.success('Xóa bình luận thành công')
        },
        onError: () => {
          console.log('error')
        }
    })
  }

  return (
    <div className=' flex pb-4'>
      <div onClick={checkNavigateUser} className='inline-block mr-4 cursor-pointer'>
        <img
          className='rounded-full max-w-none w-10 h-10 object-cover'
          src={!comment.userId?.avatar ? useravatar : getImageUrl(comment.userId.avatar)}
        />
      </div>
      <div className='w-full'>
          <div onClick={checkNavigateUser} className='flex items-center gap-1 mr-2'>
            <span className='hover:underline cursor-pointer text-base font-bold dark:text-gray-200'> {comment.userId?.name}</span>
            {comment.userId?.role === 1 && (
              <div className='text-blue-400 rounded-full flex justify-center items-center '>
                <FaCheckCircle size={12} />
              </div>
            )}
            <span className='text-slate-500 text-xs dark:text-slate-400'>{moment(comment.createdAt).fromNow()}</span>
          </div>
        <ShowMoreContent className='text-sm dark:text-gray-300' lines={2}>
          <p className=''>{comment.content}</p>
        </ShowMoreContent>

        <div className='mt-2 mb-2 flex items-center gap-4'>
          <div
            className='inline-flex hover:text-blue-400 cursor-pointer text-sm items-center dark:text-gray-400'
            onClick={handleShowReply}
          >
            <span className='font-medium'>{comment.replyCount} lượt phản hồi</span>
          </div>
          <button
            onClick={handleShowReply}
            className='py-1 px-3 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition'
          >
            Trả lời
          </button>
        </div>
        {showReply && (
          <div className='pl-4 border-l-2 border-gray-100 dark:border-gray-700'>
            {contentChildComment}
            <div className="mt-4">
                <InputEmoji content={content} setContent={setContent} handleCreateComment={handleCreateChildComment} />
            </div>
            <div className='w-full mt-3'>
              <button
                className='py-1 px-4 w-full hover:text-blue-600 block text-center rounded-lg font-medium transition ease-in-out delay-75 text-sm text-gray-500'
                disabled={!hasNextPage || isFetchingNextPage}
                onClick={() => fetchNextPage()}
              >
                {isFetchingNextPage ? 'Đang tải...' : hasNextPage ? 'Xem thêm phản hồi' : ''}
              </button>
            </div>
          </div>
        )}
      </div>
      <div>
        <SimpleThreeDot
          isPending={deleteCommentMutation.isPending}
          userID={comment.userId?._id}
          post={post}
          handleDeletePost={handleDeleteComment}
        />
      </div>
    </div>
  )
}

function CommentChildItems({ comment, profile, navigate, post }) {
  const checkNavigateUser = () => {
    if (profile?._id === comment.userId?._id) {
      navigate('/me')
    } else {
      navigate(`/user/${comment.userId?._id}`)
    }
  }
  const deleteChildCommentMutation = useMutation({
    mutationFn: () => deleteEventComment(comment._id)
  })

  const handleDeleteChildComment = async () => {
    deleteChildCommentMutation.mutate(undefined, {
      onSuccess: async () => {
          await Promise.all([
            queryClient.invalidateQueries({
              queryKey: ['eventComments', post._id]
            }),
            queryClient.invalidateQueries({
              queryKey: ['eventPosts']
            }),
            queryClient.invalidateQueries({
              queryKey: ['eventChildComments', comment.parent_comment_id]
            })
          ])
          toast.success('Xóa bình luận thành công')
        },
        onError: () => {
          console.log('error')
        }
    })
  }
  
  return (
    <div className='mt-4'>
      <div className='pb-4 flex justify-between'>
        <div className='media flex w-full'>
          <div onClick={checkNavigateUser} className='mr-4 cursor-pointer'>
            <img
              className='rounded-full max-w-none w-8 h-8 object-cover'
              src={!comment.userId?.avatar ? useravatar : getImageUrl(comment.userId.avatar)}
            />
          </div>
          <div className='media-body w-full'>
            <div>
              <div onClick={checkNavigateUser} className='flex items-center gap-1 flex-wrap mr-2'>
                <span className='hover:underline cursor-pointer text-sm font-bold dark:text-gray-200'> {comment.userId?.name}</span>
                {comment.userId?.role === 1 && (
                  <div className='text-blue-400 rounded-full flex justify-center items-center '>
                    <FaCheckCircle size={10} />
                  </div>
                )}
                <span className='text-slate-500 text-xs dark:text-slate-400'>
                  {moment(comment.createdAt).fromNow()}
                </span>
              </div>
            </div>
            <ShowMoreContent className='text-sm dark:text-gray-300' lines={2}>
              <p className='text-sm'>{comment.content}</p>
            </ShowMoreContent>
          </div>
        </div>

        <div>
          <SimpleThreeDot
            isPending={deleteChildCommentMutation.isPending}
            post={post}
            userID={comment.userId?._id}
            handleDeletePost={handleDeleteChildComment}
          />
        </div>
      </div>
    </div>
  )
}
