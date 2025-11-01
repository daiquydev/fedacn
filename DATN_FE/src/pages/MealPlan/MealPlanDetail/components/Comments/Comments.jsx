import { useState, useEffect } from 'react'
import { FaRegComment, FaReply, FaUser, FaHeart, FaRegHeart } from 'react-icons/fa'
import { MdSend } from 'react-icons/md'
import { toast } from 'react-toastify'
import mealPlanApi from '../../../../../apis/mealPlanApi'

export default function Comments({ mealPlanId }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  const [replyContent, setReplyContent] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  // Fetch comments
  useEffect(() => {
    fetchComments()
  }, [mealPlanId])

  const fetchComments = async (pageNum = 1) => {
    try {
      setLoading(true)
      const response = await mealPlanApi.getMealPlanComments(mealPlanId, {
        page: pageNum,
        limit: 10
      })
      
      const newComments = response.data.result.comments || []
      
      if (pageNum === 1) {
        setComments(newComments)
      } else {
        setComments(prev => [...prev, ...newComments])
      }
      
      setHasMore(newComments.length === 10)
      setPage(pageNum)
    } catch (err) {
      toast.error('Không thể tải bình luận')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return

    try {
      await mealPlanApi.commentMealPlan(mealPlanId, newComment.trim())
      setNewComment('')
      toast.success('Đã thêm bình luận!')
      // Refresh comments
      fetchComments(1)
    } catch (err) {
      toast.error('Không thể thêm bình luận')
    }
  }

  const handleSubmitReply = async (e, parentId) => {
    e.preventDefault()
    if (!replyContent.trim()) return

    try {
      await mealPlanApi.commentMealPlan(mealPlanId, replyContent.trim(), parentId)
      setReplyContent('')
      setReplyTo(null)
      toast.success('Đã thêm phản hồi!')
      // Refresh comments
      fetchComments(1)
    } catch (err) {
      toast.error('Không thể thêm phản hồi')
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchComments(page + 1)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
        <FaRegComment className="mr-2 text-green-600" />
        Bình luận ({comments.length})
      </h3>

      {/* Comment form */}
      <form onSubmit={handleSubmitComment} className="mb-6">
        <div className="flex space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
              <FaUser className="text-gray-600 dark:text-gray-300" />
            </div>
          </div>
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Viết bình luận của bạn..."
              rows={3}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-green-500"
            />
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg flex items-center transition-colors"
              >
                <MdSend className="mr-1" />
                Gửi
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Comments list */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment._id} className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <div className="flex space-x-3">
              <div className="flex-shrink-0">
                <img
                  src={comment.user_id?.avatar || '/default-avatar.png'}
                  alt={comment.user_id?.name}
                  className="w-10 h-10 rounded-full"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {comment.user_id?.name || 'Người dùng'}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(comment.createdAt)}
                  </span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  {comment.content}
                </p>
                <div className="flex items-center space-x-4">
                  <button className="text-sm text-gray-500 hover:text-green-600 flex items-center">
                    <FaRegHeart className="mr-1" />
                    Thích
                  </button>
                  <button
                    onClick={() => setReplyTo(replyTo === comment._id ? null : comment._id)}
                    className="text-sm text-gray-500 hover:text-green-600 flex items-center"
                  >
                    <FaReply className="mr-1" />
                    Phản hồi
                  </button>
                </div>

                {/* Reply form */}
                {replyTo === comment._id && (
                  <form onSubmit={(e) => handleSubmitReply(e, comment._id)} className="mt-3">
                    <div className="flex space-x-2">
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Viết phản hồi..."
                        rows={2}
                        className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none text-sm"
                      />
                      <button
                        type="submit"
                        disabled={!replyContent.trim()}
                        className="px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg text-sm"
                      >
                        Gửi
                      </button>
                    </div>
                  </form>
                )}

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-3 pl-4 border-l-2 border-gray-200 dark:border-gray-600 space-y-3">
                    {comment.replies.map((reply) => (
                      <div key={reply._id} className="flex space-x-2">
                        <img
                          src={reply.user_id?.avatar || '/default-avatar.png'}
                          alt={reply.user_id?.name}
                          className="w-8 h-8 rounded-full"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-sm text-gray-900 dark:text-white">
                              {reply.user_id?.name || 'Người dùng'}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(reply.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {reply.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load more button */}
      {hasMore && (
        <div className="text-center mt-6">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-4 py-2 text-green-600 hover:text-green-700 disabled:text-gray-400"
          >
            {loading ? 'Đang tải...' : 'Xem thêm bình luận'}
          </button>
        </div>
      )}

      {comments.length === 0 && !loading && (
        <div className="text-center py-8">
          <FaRegComment className="mx-auto text-4xl text-gray-400 mb-2" />
          <p className="text-gray-500 dark:text-gray-400">
            Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
          </p>
        </div>
      )}
    </div>
  )
}
