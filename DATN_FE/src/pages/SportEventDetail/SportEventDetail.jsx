import { useState } from 'react'
import { AiFillHeart } from 'react-icons/ai'
import { CiHeart } from 'react-icons/ci'
import { FaCheckCircle, FaUserFriends, FaMedal, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa'
import { MdPublic } from 'react-icons/md'
import moment from 'moment'
import useravatar from '../../assets/images/useravatar.jpg'
import { RiGitRepositoryPrivateFill } from 'react-icons/ri'
import { PiShareFatLight } from 'react-icons/pi'
import { LiaComments } from 'react-icons/lia'
import Comments from '../../pages/Home/components/Comments'

// Mock data for demonstration
const mockEvent = {
  id: 1,
  name: "10K Morning Run Challenge",
  createdAt: "2024-03-19T08:00:00Z",
  creator: {
    id: 1,
    name: "John Runner",
    avatar: "",
    role: 1,
    username: "johnrunner"
  },
  views: 1200,
  saves: 45,
  likes: 89,
  posts: 23,
  backgroundImage: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5",
  description: "Join us for an energizing morning run! This event is perfect for both beginners and experienced runners. Let's achieve our fitness goals together!",
  video: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  category: "Running",
  location: "Central Park Track",
  progress: 75,
  isLiked: false
}

// Enhanced mock data with more participants
const mockLeaderboard = {
  participants: [
    { rank: 1, name: "Sarah Smith", calories: 450, time: "45:30", distance: 8.5, avatar: "" },
    { rank: 2, name: "Mike Johnson", calories: 420, time: "46:15", distance: 8.2, avatar: "" },
    { rank: 3, name: "Emma Davis", calories: 400, time: "47:00", distance: 8.0, avatar: "" },
    { rank: 4, name: "John Doe", calories: 380, time: "47:30", distance: 7.8, avatar: "" },
    { rank: 5, name: "Lisa Wilson", calories: 375, time: "48:00", distance: 7.5, avatar: "" },
    { rank: 6, name: "Tom Brown", calories: 360, time: "48:45", distance: 7.2, avatar: "" },
    { rank: 7, name: "Anna Lee", calories: 350, time: "49:15", distance: 7.0, avatar: "" },
    { rank: 8, name: "David Clark", calories: 340, time: "50:00", distance: 6.8, avatar: "" }
  ],
  totalParticipants: 156,
  totalCaloriesBurned: 45600
}

// Mock data for posts
const mockPosts = [
  {
    _id: '1',
    content: 'Just completed my first 5K in this event! Feeling accomplished 🏃‍♂️',
    createdAt: '2024-03-19T10:00:00Z',
    user: {
      _id: '1',
      name: 'John Runner',
      avatar: '',
      role: 1
    },
    like_count: 24,
    comment_count: 5,
    share_count: 2,
    is_like: false,
    status: 0,
    images: [
      'https://images.unsplash.com/photo-1552674605-db6ffd4facb5',
      'https://images.unsplash.com/photo-1571008887538-b36bb32f4571'
    ]
  },
  {
    _id: '2',
    content: 'Great atmosphere at the event! Everyone is so supportive 🎉',
    createdAt: '2024-03-19T09:30:00Z',
    user: {
      _id: '2',
      name: 'Sarah Smith',
      avatar: '',
      role: 0
    },
    like_count: 18,
    comment_count: 3,
    share_count: 1,
    is_like: false,
    status: 0,
    images: []
  }
]

export default function SportEventDetail() {
  const [isLiked, setIsLiked] = useState(mockEvent.isLiked)
  const [likeCount, setLikeCount] = useState(mockEvent.likes)
  const [sortField, setSortField] = useState('rank')
  const [sortDirection, setSortDirection] = useState('asc')
  const [participants, setParticipants] = useState(mockLeaderboard.participants)
  const [searchTerm, setSearchTerm] = useState('')
  const [posts, setPosts] = useState(mockPosts)

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1)
  }

  const handleSort = (field) => {
    const isAsc = sortField === field && sortDirection === 'asc'
    const direction = isAsc ? 'desc' : 'asc'
    
    const sortedParticipants = [...participants].sort((a, b) => {
      if (field === 'time') {
        // Convert time strings to minutes for comparison
        const timeToMinutes = (timeStr) => {
          const [min, sec] = timeStr.split(':').map(Number)
          return min + sec / 60
        }
        const timeA = timeToMinutes(a.time)
        const timeB = timeToMinutes(b.time)
        return direction === 'asc' ? timeA - timeB : timeB - timeA
      }
      
      return direction === 'asc' 
        ? a[field] - b[field]
        : b[field] - a[field]
    })

    setParticipants(sortedParticipants)
    setSortField(field)
    setSortDirection(direction)
  }

  const getSortIcon = (field) => {
    if (sortField !== field) return <FaSort className="text-gray-400" />
    return sortDirection === 'asc' ? 
      <FaSortUp className="text-red-500" /> : 
      <FaSortDown className="text-red-500" />
  }

  const filteredParticipants = participants.filter(participant =>
    participant.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handlePostLike = (postId) => {
    setPosts(posts.map(post => {
      if (post._id === postId) {
        const newIsLike = !post.is_like
        return {
          ...post,
          is_like: newIsLike,
          like_count: newIsLike ? post.like_count + 1 : post.like_count - 1
        }
      }
      return post
    }))
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Event Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="relative h-96">
          <img
            src={mockEvent.backgroundImage}
            alt={mockEvent.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
            <h1 className="text-4xl font-bold text-white mb-2">{mockEvent.name}</h1>
            <div className="flex items-center text-white/90 space-x-2">
              <span>{moment(mockEvent.createdAt).format('dddd, MMMM D, YYYY [at] h:mm A')}</span>
            </div>
          </div>
        </div>

        {/* Event Info */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <img
                src={mockEvent.creator.avatar || useravatar}
                alt={mockEvent.creator.name}
                className="w-12 h-12 rounded-full"
              />
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-lg">{mockEvent.creator.name}</span>
                  {mockEvent.creator.role === 1 && (
                    <FaCheckCircle className="text-blue-400" size={15} />
                  )}
                </div>
                <span className="text-gray-500 dark:text-gray-400">@{mockEvent.creator.username}</span>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <button onClick={handleLike}>
                  {isLiked ? (
                    <AiFillHeart className="text-red-500 w-6 h-6" />
                  ) : (
                    <CiHeart className="text-red-500 w-6 h-6" />
                  )}
                </button>
                <span>{likeCount}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MdPublic className="w-6 h-6" />
                <span>{mockEvent.views} views</span>
              </div>
              <div className="flex items-center space-x-2">
                <FaUserFriends className="w-6 h-6" />
                <span>{mockEvent.posts} posts</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Description</h2>
              <p className="text-gray-600 dark:text-gray-300">{mockEvent.description}</p>
            </div>

            {mockEvent.video && (
              <div>
                <h2 className="text-xl font-semibold mb-2">Event Video</h2>
                <div className="aspect-w-16 aspect-h-9">
                  <iframe
                    src={mockEvent.video}
                    className="w-full h-[400px]"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h2 className="text-xl font-semibold mb-2">Event Details</h2>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Category:</span> {mockEvent.category}
                  </div>
                  <div>
                    <span className="font-medium">Location:</span> {mockEvent.location}
                  </div>
                  <div>
                    <span className="font-medium">Progress:</span>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                      <div
                        className="bg-red-600 h-2.5 rounded-full"
                        style={{ width: `${mockEvent.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Leaderboard */}
              <div>
                <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold">Leaderboard</h2>
                    <div className="mt-2">
                      <input
                        type="text"
                        placeholder="Search participants..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-800 dark:text-gray-200"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Rank
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Participant
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('calories')}>
                            <div className="flex items-center space-x-1">
                              <span>Calories</span>
                              {getSortIcon('calories')}
                            </div>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('time')}>
                            <div className="flex items-center space-x-1">
                              <span>Time</span>
                              {getSortIcon('time')}
                            </div>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('distance')}>
                            <div className="flex items-center space-x-1">
                              <span>Distance</span>
                              {getSortIcon('distance')}
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredParticipants.map((participant) => (
                          <tr key={participant.rank} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {participant.rank <= 3 ? (
                                  <FaMedal
                                    className={`mr-2 ${
                                      participant.rank === 1 ? 'text-yellow-400' :
                                      participant.rank === 2 ? 'text-gray-400' :
                                      'text-orange-600'
                                    }`}
                                  />
                                ) : (
                                  <span className="ml-8">{participant.rank}</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <img
                                  src={participant.avatar || useravatar}
                                  alt={participant.name}
                                  className="w-8 h-8 rounded-full mr-3"
                                />
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-200">
                                  {participant.name}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                              {participant.calories} cal
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                              {participant.time}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                              {participant.distance} km
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <div className="font-medium">Total Participants</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-200">
                          {mockLeaderboard.totalParticipants}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <div className="font-medium">Total Calories Burned</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-200">
                          {mockLeaderboard.totalCaloriesBurned.toLocaleString()} cal
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Posts Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Posts</h2>
        <div className="space-y-4">
          {posts.map(post => (
            <article key={post._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <div className="inline-block mr-4">
                      <img
                        className="rounded-full object-cover max-w-none w-12 h-12 md:w-14 md:h-14"
                        src={post.user.avatar || useravatar}
                        alt={post.user.name}
                      />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center">
                        <div className="flex items-center gap-2 text-lg font-bold mr-2">
                          {post.user.name}
                          {post.user.role === 1 && (
                            <div className="text-blue-400">
                              <FaCheckCircle size={15} />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 items-center">
                        <div className="text-slate-500 dark:text-slate-300">
                          {moment(post.createdAt).fromNow()}
                        </div>
                        {post.status === 0 && <MdPublic />}
                        {post.status === 1 && <FaUserFriends />}
                        {post.status === 2 && <RiGitRepositoryPrivateFill />}
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-gray-800 dark:text-gray-200 mb-4">{post.content}</p>

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

                <div className="flex justify-between items-center mb-4">
                  <div className="inline-flex items-center">
                    <AiFillHeart className="mr-1 text-red-500 dark:text-pink-600" size={20} />
                    <span className="font-bold">{post.like_count}</span>
                    <span className="ml-1 md:ml-2">Lượt thích</span>
                  </div>
                  <div className="flex gap-3 items-center">
                    <div className="hover:text-red-600 dark:hover:text-pink-600 cursor-pointer transition-all">
                      {post.comment_count} bình luận
                    </div>
                    {post.status === 0 && (
                      <div className="hover:text-red-600 dark:hover:text-pink-600 cursor-pointer transition-all">
                        {post.share_count} lượt chia sẻ
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex justify-around">
                    <button
                      onClick={() => handlePostLike(post._id)}
                      className="flex items-center justify-center hover:text-red-700 dark:hover:text-pink-500 transition-all duration-150"
                    >
                      {post.is_like ? (
                        <>
                          <AiFillHeart className="mr-1 text-red-500 dark:text-pink-600" size={20} />
                          <span className="font-medium">Đã thích</span>
                        </>
                      ) : (
                        <>
                          <CiHeart className="mr-1" size={20} />
                          <span className="font-medium">Thích</span>
                        </>
                      )}
                    </button>
                    <button className="flex items-center justify-center hover:text-red-700 dark:hover:text-pink-500 transition-all duration-150">
                      <LiaComments className="mr-1" size={20} />
                      <span className="font-medium">Bình luận</span>
                    </button>
                    {post.status === 0 && (
                      <button className="flex items-center justify-center hover:text-red-700 dark:hover:text-pink-500 transition-all duration-150">
                        <PiShareFatLight className="mr-1" size={20} />
                        <span className="font-medium">Chia sẻ</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Comments Section */}
                <Comments post={post} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
} 