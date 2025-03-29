import { useState } from 'react'
import { AiFillHeart } from 'react-icons/ai'
import { CiHeart } from 'react-icons/ci'
import { FaCheckCircle, FaUserFriends, FaRunning, FaStopwatch, FaFireAlt, FaRegEdit } from 'react-icons/fa'
import { MdPublic } from 'react-icons/md'
import { PiShareFatLight } from 'react-icons/pi'
import { LiaComments } from 'react-icons/lia'
import moment from 'moment'
import useravatar from '../../../assets/images/useravatar.jpg'
import ModalUploadChallengePost from './ModalUploadChallengePost'

// Mock data
const mockPosts = [
  {
    id: 1,
    content: "Hoàn thành 5km sáng nay! 💪",
    createdAt: "2024-03-20T08:00:00Z",
    user: {
      id: 1,
      name: "John Runner",
      avatar: "",
      role: 1
    },
    likes: 24,
    comments: 5,
    shares: 2,
    isLiked: false,
    status: 0,
    images: [
      "https://images.unsplash.com/photo-1552674605-db6ffd4facb5"
    ],
    evidence: {
      type: "run",
      distance: 5,
      duration: "00:30:15",
      pace: "6:03",
      calories: 350
    }
  },
  // Thêm mock data khác...
]

export default function ChallengePosts({ challengeId, userProgress, canPost }) {
  const [posts, setPosts] = useState(mockPosts)
  const [createPostModalOpen, setCreatePostModalOpen] = useState(false)

  const handleLike = (postId) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          isLiked: !post.isLiked,
          likes: post.isLiked ? post.likes - 1 : post.likes + 1
        }
      }
      return post
    }))
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold mb-6 flex items-center">
        <span>Bài đăng cộng đồng</span>
        {canPost && (
          <button
            onClick={() => setCreatePostModalOpen(true)}
            className="ml-auto text-sm bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-3 py-1 rounded-full flex items-center"
          >
            <FaRegEdit className="mr-1" /> 
            Tạo bài viết
          </button>
        )}
      </h2>
      
      <div className="space-y-6">
        {posts.map(post => (
          <article key={post.id} className="bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              {/* User Info */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <img
                    src={post.user.avatar || useravatar}
                    alt={post.user.name}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <div className="flex items-center">
                      <span className="font-semibold text-lg mr-2">{post.user.name}</span>
                      {post.user.role === 1 && (
                        <FaCheckCircle className="text-blue-400" size={15} />
                      )}
                    </div>
                    <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
                      <span>{moment(post.createdAt).fromNow()}</span>
                      <span className="mx-2">•</span>
                      {post.status === 0 && <MdPublic />}
                      {post.status === 1 && <FaUserFriends />}
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <p className="text-gray-800 dark:text-gray-200 mb-4">{post.content}</p>

              {/* Evidence Card */}
              {post.evidence && (
                <div className="mb-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center mb-2">
                    <FaRunning className="text-green-500 mr-2" />
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      Minh chứng hoạt động
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col items-center p-2 bg-white dark:bg-gray-700 rounded-lg">
                      <FaRunning className="text-green-500 mb-1" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">Khoảng cách</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{post.evidence.distance} km</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-white dark:bg-gray-700 rounded-lg">
                      <FaStopwatch className="text-green-500 mb-1" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">Thời gian</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{post.evidence.duration}</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-white dark:bg-gray-700 rounded-lg">
                      <FaFireAlt className="text-green-500 mb-1" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">Calories</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{post.evidence.calories}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Images */}
              {post.images.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {post.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Post image ${index + 1}`}
                      className="rounded-lg w-full h-48 object-cover"
                    />
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="flex justify-between items-center mb-4">
                <div className="inline-flex items-center">
                  <AiFillHeart className="mr-1 text-red-500" size={20} />
                  <span className="font-bold">{post.likes}</span>
                  <span className="ml-1 md:ml-2">Lượt thích</span>
                </div>
                <div className="flex gap-3 items-center">
                  <div className="hover:text-green-600 cursor-pointer transition-all">
                    {post.comments} bình luận
                  </div>
                  {post.status === 0 && (
                    <div className="hover:text-green-600 cursor-pointer transition-all">
                      {post.shares} lượt chia sẻ
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex justify-around">
                  <button
                    onClick={() => handleLike(post.id)}
                    className="flex items-center justify-center hover:text-red-700 transition-all duration-150"
                  >
                    {post.isLiked ? (
                      <>
                        <AiFillHeart className="mr-1 text-red-500" size={20} />
                        <span className="font-medium">Đã thích</span>
                      </>
                    ) : (
                      <>
                        <CiHeart className="mr-1" size={20} />
                        <span className="font-medium">Thích</span>
                      </>
                    )}
                  </button>
                  <button className="flex items-center justify-center hover:text-green-700 transition-all duration-150">
                    <LiaComments className="mr-1" size={20} />
                    <span className="font-medium">Bình luận</span>
                  </button>
                  {post.status === 0 && (
                    <button className="flex items-center justify-center hover:text-green-700 transition-all duration-150">
                      <PiShareFatLight className="mr-1" size={20} />
                      <span className="font-medium">Chia sẻ</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Modal tạo bài đăng - nếu được gọi từ component này */}
      {createPostModalOpen && (
        <ModalUploadChallengePost
          closeModalPost={() => setCreatePostModalOpen(false)}
          profile={userProfile} // Sẽ cần truyền từ component cha hoặc lấy từ context
          challenge={challenge} // Sẽ cần truyền từ component cha
          userProgress={userProgress}
        />
      )}
    </div>
  )
} 