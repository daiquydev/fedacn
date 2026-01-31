import { createEventComment, getEventComments } from '../../../apis/sportEventApi'
import { keepPreviousData, useInfiniteQuery, useMutation } from '@tanstack/react-query'
import SportEventCommentItems from './SportEventCommentItems'
import Loading from '../../../components/GlobalComponents/Loading'
import { useContext, useState } from 'react'
import InputEmoji from '../../../components/InputComponents/InputEmoji'
import { queryClient } from '../../../main'
import { AppContext } from '../../../contexts/app.context'
import { SocketContext } from '../../../contexts/socket.context'

export default function SportEventComments({ post }) {
  const [content, setContent] = useState('')
  const { profile } = useContext(AppContext)
  const { newSocket } = useContext(SocketContext)

  const fetchComment = async ({ pageParam }) => {
    return await getEventComments(post._id, { page: pageParam })
  }
  const commentMutation = useMutation({
    mutationFn: (body) => createEventComment(post._id, body)
  })

  const handleCreateComment = async (e) => {
    if (content.trim() === '') return
    e.preventDefault()
    commentMutation.mutate(
      {
        postId: post._id,
        content: content
      },
      {
        onSuccess: async () => {
        //   newSocket.emit('comment post', {
        //     content: 'Đã bình luận về bài viết của bạn',
        //     to: post.userId._id, // Updated to match schema population
        //     name: profile.name,
        //     avatar: profile.avatar
        //   })
          await Promise.all([
            queryClient.invalidateQueries({
              queryKey: ['eventComments', post._id]
            }),
            queryClient.invalidateQueries({
              queryKey: ['eventPosts']
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

  const { data, status, fetchNextPage, isFetchingNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ['eventComments', post._id],
    queryFn: fetchComment,
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const nextPage = lastPage.data.result.comments?.length ? allPages.length + 1 : undefined
      return nextPage
    },
    placeholderData: keepPreviousData
  })

  const contentComment = data?.pages.map((dataComments) =>
    dataComments?.data?.result?.comments?.map((comment) => {
      return <SportEventCommentItems post={post} comment={comment} key={comment._id} />
    })
  )

  if (status === 'pending') {
    return <Loading className='w-full flex justify-center mt-5' />
  }

  return (
    <div className='pt-4 px-4 md:px-0'>
      <InputEmoji content={content} setContent={setContent} handleCreateComment={handleCreateComment} />
      <div className='pt-6'>
        {contentComment}
        <div className='w-full'>
          <button
            className='py-3 px-4 w-full block bg-slate-100 dark:bg-slate-700 text-center rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition ease-in-out delay-75'
            disabled={!hasNextPage || isFetchingNextPage}
            onClick={() => fetchNextPage()}
          >
            {isFetchingNextPage ? 'Đang tải ...' : hasNextPage ? 'Xem thêm bình luận' : 'Không còn bình luận nào'}
          </button>
        </div>
      </div>
    </div>
  )
}
