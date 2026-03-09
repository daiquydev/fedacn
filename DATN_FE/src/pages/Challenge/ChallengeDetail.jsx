import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AiFillHeart } from 'react-icons/ai'
import { CiHeart } from 'react-icons/ci'
import { FaCheckCircle, FaUserFriends, FaMedal, FaTrophy, FaShare, FaCloudUploadAlt, FaRegEdit, FaChartLine, FaDoorOpen, FaTimes, FaCopy, FaFacebook, FaTwitter } from 'react-icons/fa'
import { BsPersonBadge } from 'react-icons/bs'
import moment from 'moment'
import useravatar from '../../assets/images/useravatar.jpg'
import ChallengeLeaderboard from './components/ChallengeLeaderboard'
import ChallengePosts from './components/ChallengePosts'
import ModalUploadChallengePost from './components/ModalUploadChallengePost'
import SmartWatchSync from './components/SmartWatchSync'
import { useQuery } from '@tanstack/react-query'
import { currentAccount } from '../../apis/userApi'
import { toast } from 'react-hot-toast'

// Mock data 1 (id = 1)
const mockChallenge1 = {
  id: 1,
  title: "30 Days Running Challenge",
  startDate: "2025-04-20T00:00:00Z",
  endDate: "2025-05-20T23:59:59Z",
  category: "Running",
  description: "Thử thách chạy bộ 100km trong 30 ngày. Cải thiện sức khỏe và nhận huy hiệu đặc biệt!",
  targetValue: 100,
  targetUnit: "km",
  rules: [
    "Chạy ít nhất 3km mỗi ngày",
    "Upload ảnh màn hình từ ứng dụng theo dõi",
    "Hoàn thành trong thời gian quy định"
  ],
  rewards: [
    "10 điểm thành tích",
    "Cơ hội nhận quà từ nhà tài trợ"
  ],
  image: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5",
  creator: {
    id: 1,
    name: "John Runner",
    avatar: "",
    isVerified: true
  },
  participants: 215,
  maxParticipants: 500,
  progress: 65,
  isJoined: true,
  likes: 89,
  shares: 45,
  posts: 23,
  badges: ["marathon-bronze", "early-bird"],
  sponsorLogos: [
    "sponsor1.png",
    "sponsor2.png"
  ],
  participantsList: [
    { id: 101, name: "Nguyễn Văn A", avatar: "", isFollowing: true, progress: 75 },
    { id: 102, name: "Trần Thị B", avatar: "", isFollowing: true, progress: 60 },
    { id: 103, name: "Lê Văn C", avatar: "", isFollowing: false, progress: 80 },
    { id: 104, name: "Phạm Thị D", avatar: "", isFollowing: false, progress: 45 },
    { id: 105, name: "Hoàng Văn E", avatar: "", isFollowing: true, progress: 30 }
  ],
  userProgress: {
    currentValue: 65,
    targetValue: 100,
    streak: 5,
    lastUpdate: "2025-03-20T10:30:00Z",
    rank: 23,
    achievements: [
      { id: 1, name: "First Mile", icon: "🏃‍♂️", description: "Completed first mile", dateEarned: "2025-03-03T08:15:00Z" },
      { id: 2, name: "Early Bird", icon: "🌅", description: "5 morning runs", dateEarned: "2025-03-10T06:30:00Z" }
    ],
    recentActivities: [
      { id: 1, date: "2025-03-20T10:30:00Z", value: 5, unit: "km", evidence: "run_track_1.jpg" },
      { id: 2, date: "2025-03-19T09:15:00Z", value: 4.2, unit: "km", evidence: "run_track_2.jpg" }
    ]
  }
}

// Mock data 2 (id = 2)
const mockChallenge2 = {
  id: 2,
  title: "Cycling Adventure Challenge",
  startDate: "2025-03-10T00:00:00Z",
  endDate: "2025-05-10T23:59:59Z",
  category: "Cycling",
  description: "Thử thách đạp xe 300km trong 30 ngày. Khám phá những cung đường mới và kết nối với cộng đồng đạp xe!",
  targetValue: 300,
  targetUnit: "km",
  rules: [
    "Đạp xe ít nhất 10km mỗi ngày",
    "Khuyến khích đạp xe ở địa điểm mới mỗi tuần",
    "Chia sẻ hình ảnh cung đường đẹp"
  ],
  rewards: [
    "15 điểm thành tích",
    "Phần quà từ nhà tài trợ"
  ],
  image: "https://images.unsplash.com/photo-1541625602330-2277a4c46182",
  creator: {
    id: 2,
    name: "Mai Linh",
    avatar: "",
    isVerified: true
  },
  participants: 178,
  maxParticipants: 400,
  progress: 40,
  isJoined: false,
  likes: 67,
  shares: 32,
  posts: 18,
  badges: ["road-explorer", "hill-climber"],
  sponsorLogos: [
    "sponsor3.png",
    "sponsor4.png"
  ],
  participantsList: [
    { id: 201, name: "Vũ Thị F", avatar: "", isFollowing: true, progress: 65 },
    { id: 202, name: "Ngô Văn G", avatar: "", isFollowing: false, progress: 55 },
    { id: 203, name: "Đặng Thị H", avatar: "", isFollowing: true, progress: 70 },
    { id: 204, name: "Bùi Văn I", avatar: "", isFollowing: false, progress: 40 },
    { id: 205, name: "Phan Thị K", avatar: "", isFollowing: true, progress: 85 }
  ]
}

const mockChallenge3 = {
  id: 33,
  title: "Cycling Adventure Challenge",
  startDate: "2024-04-10T00:00:00Z",
  endDate: "2024-05-10T23:59:59Z",
  category: "Cycling",
  description: "Thử thách đạp xe 300km trong 30 ngày. Khám phá những cung đường mới và kết nối với cộng đồng đạp xe!",
  targetValue: 300,
  targetUnit: "km",
  rules: [
    "Đạp xe ít nhất 10km mỗi ngày",
    "Khuyến khích đạp xe ở địa điểm mới mỗi tuần",
    "Chia sẻ hình ảnh cung đường đẹp"
  ],
  rewards: [
    "15 điểm thành tích",
    "Phần quà từ nhà tài trợ"
  ],
  image: "https://images.unsplash.com/photo-1541625602330-2277a4c46182",
  creator: {
    id: 2,
    name: "Mai Linh",
    avatar: "",
    isVerified: true
  },
  participants: 178,
  maxParticipants: 400,
  progress: 40,
  isJoined: false,
  likes: 67,
  shares: 32,
  posts: 18,
  badges: ["road-explorer", "hill-climber"],
  sponsorLogos: [
    "sponsor3.png",
    "sponsor4.png"
  ],
  participantsList: [
    { id: 301, name: "Trương Văn L", avatar: "", isFollowing: true, progress: 60 },
    { id: 302, name: "Lý Thị M", avatar: "", isFollowing: false, progress: 50 },
    { id: 303, name: "Dương Văn N", avatar: "", isFollowing: true, progress: 75 },
    { id: 304, name: "Hồ Thị P", avatar: "", isFollowing: false, progress: 35 },
    { id: 305, name: "Đinh Văn Q", avatar: "", isFollowing: true, progress: 80 }
  ]
}

// Modal xác nhận rời thử thách
const LeaveConfirmModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-4">Xác nhận rời thử thách</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Bạn có chắc chắn muốn rời khỏi thử thách này? Mọi tiến độ và thành tích của bạn sẽ bị mất. Hành động này không thể hoàn tác.
        </p>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white"
          >
            Rời thử thách
          </button>
        </div>
      </div>
    </div>
  );
};

export default function ChallengeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [challenge, setChallenge] = useState(null)
  const [isLiked, setIsLiked] = useState(false)
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false)
  const [showUserProgress, setShowUserProgress] = useState(false)
  const [createPostModalOpen, setCreatePostModalOpen] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)

  // Lấy thông tin người dùng hiện tại
  const { data: userData } = useQuery({
    queryKey: ['me'],
    queryFn: () => {
      return currentAccount()
    },
    staleTime: 1000
  })

  const userProfile = userData?.data?.result?.[0] || { name: "Người dùng", avatar: "" }

  useEffect(() => {
    // Lựa chọn mockdata dựa vào id từ URL
    if (id === '0') {
      setChallenge(mockChallenge1)
    }
    else if (id === '1') {
      setChallenge(mockChallenge3)
    }
    else {
      setChallenge(mockChallenge2)
    }
  }, [id])

  useEffect(() => {
    if (challenge?.isJoined && !challenge.userProgress) {
      // Nếu isJoined=true nhưng không có userProgress, tạo dữ liệu mặc định
      setChallenge(prev => ({
        ...prev,
        userProgress: {
          currentValue: 0,
          targetValue: prev.targetValue,
          streak: 0,
          lastUpdate: new Date().toISOString(),
          rank: prev.participants,
          achievements: [],
          recentActivities: []
        }
      }));
    }
  }, [challenge]);

  // Nếu chưa có dữ liệu, hiển thị trạng thái loading
  if (!challenge) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 flex justify-center items-center h-64">
        <div className="text-xl text-gray-600 dark:text-gray-400">Đang tải thông tin thử thách...</div>
      </div>
    )
  }

  const handleJoinChallenge = () => {
    if (challenge.isJoined) return

    setChallenge(prev => ({
      ...prev,
      isJoined: true,
      participants: prev.participants + 1
    }))

    // Hiệu ứng animation khi tham gia
    // Sau đó chuyển hướng đến trang My Challenges
    setTimeout(() => {
      navigate('/challenge/my-challenges')
    }, 1000)
  }

  const handleLeaveChallenge = () => {
    setChallenge(prev => ({
      ...prev,
      isJoined: false,
      participants: prev.participants - 1
    }))
    setLeaveConfirmOpen(false)
  }

  const handleLike = () => {
    setIsLiked(!isLiked)
  }

  const handleShare = () => {
    // Implement share functionality
  }

  const handleEvidenceUpload = (data) => {
    // Kiểm tra dữ liệu đầu vào
    if (!data.value || isNaN(data.value)) return;

    // Cập nhật tiến độ và thông tin người dùng
    const newValue = (challenge.userProgress?.currentValue || 0) + data.value;
    const newProgress = Math.min(100, Math.round((newValue / challenge.targetValue) * 100));

    // Tính toán streak
    const lastActivity = challenge.userProgress?.recentActivities?.[0];
    const lastActivityDate = lastActivity ? moment(lastActivity.date) : null;
    const today = moment();
    const isConsecutiveDay = lastActivityDate &&
      today.diff(lastActivityDate, 'days') <= 1;

    const newStreak = isConsecutiveDay
      ? (challenge.userProgress?.streak || 0) + 1
      : 1;

    // Cập nhật dữ liệu thử thách
    setChallenge(prev => ({
      ...prev,
      progress: newProgress,
      userProgress: {
        ...prev.userProgress,
        currentValue: newValue,
        streak: newStreak,
        lastUpdate: data.date,
        recentActivities: [
          {
            id: Date.now(),
            date: data.date,
            value: data.value,
            unit: prev.targetUnit,
            evidence: data.files[0]?.name || "evidence.jpg"
          },
          ...(prev.userProgress?.recentActivities || [])
        ]
      }
    }));

    // Thông báo thành công
    toast.success(`Đã cập nhật tiến độ: +${data.value} ${challenge.targetUnit}`);
  }

  const toggleUserProgress = () => {
    setShowUserProgress(!showUserProgress);
  }

  const checkChallengeStatus = () => {
    if (challenge && moment().isAfter(moment(challenge.endDate))) {
      // Cập nhật UI khi thử thách đã kết thúc
      return "ended"; // hoặc lưu vào state để xử lý hiển thị
    }
    return challenge?.status || "ongoing";
  };

  const handleOpenShareModal = () => {
    setShareModalOpen(true);
  };

  const handleCloseShareModal = () => {
    setShareModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="relative h-96">
          <img
            src={challenge.image}
            alt={challenge.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">{challenge.title}</h1>
                <div className="flex items-center text-white/90 space-x-4">
                  <span>
                    {moment(challenge.startDate).format('DD/MM/YYYY')} - {moment(challenge.endDate).format('DD/MM/YYYY')}
                  </span>
                  <span>•</span>
                  <span>{challenge.participants} người tham gia</span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleLike}
                  className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {isLiked ? <AiFillHeart className="text-red-500" /> : <CiHeart />}
                  <span>{challenge.likes}</span>
                </button>
                <button
                  onClick={handleOpenShareModal}
                  className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <FaShare />
                  <span>{challenge.shares}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Creator Info */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <img
                src={challenge.creator.avatar || useravatar}
                alt={challenge.creator.name}
                className="w-12 h-12 rounded-full"
              />
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-lg">{challenge.creator.name}</span>
                  {challenge.creator.isVerified && (
                    <FaCheckCircle className="text-blue-400" size={15} />
                  )}
                </div>
                <span className="text-gray-500 dark:text-gray-400">Người tạo thử thách</span>
              </div>
            </div>

            {/* Hiển thị nút tham gia hoặc các tùy chọn khi đã tham gia */}
            {challenge.isJoined ? (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setCreatePostModalOpen(true)}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <FaRegEdit />
                  <span>Đăng bài</span>
                </button>
                <button
                  onClick={toggleUserProgress}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <FaChartLine />
                  <span>Tiến độ</span>
                </button>
                <button
                  onClick={() => setLeaveConfirmOpen(true)}
                  className="flex items-center space-x-2 bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg transition-colors"
                >
                  <FaDoorOpen />
                </button>
              </div>
            ) : (challenge.endDate && moment().startOf('day').isAfter(moment(challenge.endDate).endOf('day'))) ? (
              <button
                onClick={() => { }}
                className="px-6 py-2 rounded-lg font-medium bg-gray-200 text-gray-500 cursor-default transition-colors flex items-center justify-center dark:bg-gray-700 dark:text-gray-400"
              >
                Đã kết thúc
              </button>
            ) : (challenge.startDate && moment().startOf('day').isBefore(moment(challenge.startDate).startOf('day'))) ? (
              <button
                onClick={() => { }}
                className="px-6 py-2 rounded-lg font-medium bg-gray-200 text-gray-500 cursor-default transition-colors flex items-center justify-center dark:bg-gray-700 dark:text-gray-400"
              >
                Chưa bắt đầu
              </button>
            ) : (
              <button
                onClick={handleJoinChallenge}
                className="px-6 py-2 rounded-lg font-medium bg-green-600 hover:bg-green-700 text-white transition-colors flex items-center justify-center"
              >
                Tham gia ngay
              </button>
            )}
          </div>

          {/* Hiển thị Component SmartWatchSync khi đã tham gia */}
          {challenge.isJoined && <SmartWatchSync
            challenge={challenge}
            onActivityComplete={(activityData) => {
              // Cập nhật tiến độ của thử thách với dữ liệu mới từ hoạt động
              const newValue = (challenge.userProgress?.currentValue || 0) + activityData.value;
              const newProgress = Math.min(100, Math.round((newValue / challenge.targetValue) * 100));

              // Tính toán streak
              const lastActivity = challenge.userProgress?.recentActivities?.[0];
              const lastActivityDate = lastActivity ? moment(lastActivity.date) : null;
              const today = moment();
              const isConsecutiveDay = lastActivityDate &&
                today.diff(lastActivityDate, 'days') <= 1;

              const newStreak = isConsecutiveDay
                ? (challenge.userProgress?.streak || 0) + 1
                : 1;

              // Cập nhật dữ liệu thử thách
              setChallenge(prev => ({
                ...prev,
                progress: newProgress,
                userProgress: {
                  ...prev.userProgress,
                  currentValue: newValue,
                  streak: newStreak,
                  lastUpdate: activityData.date,
                  recentActivities: [
                    {
                      id: activityData.id,
                      date: activityData.date,
                      value: activityData.value,
                      unit: activityData.unit,
                      evidence: `${activityData.category.toLowerCase()}_activity.jpg`
                    },
                    ...(prev.userProgress?.recentActivities || [])
                  ]
                }
              }));

              // Thông báo thành công
              toast.success(`Đã cập nhật tiến độ: +${activityData.value} ${challenge.targetUnit}`);
            }}
          />}

          {/* User Progress Section (hiển thị khi đã tham gia và khi showUserProgress = true) */}
          {challenge.isJoined && showUserProgress && challenge.userProgress && (
            <div className="mb-8 p-6 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold text-green-800 dark:text-green-300">Tiến độ của bạn</h2>
                <div className="flex items-center space-x-2">
                  <div className="bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                    <BsPersonBadge className="mr-1" />
                    Xếp hạng #{challenge.userProgress.rank}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  {/* Progress Bar */}
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Tiến độ: {challenge.userProgress.currentValue}/{challenge.targetValue} {challenge.targetUnit}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {challenge.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div
                        className="bg-green-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${challenge.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Recent Activities */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Hoạt động gần đây</h3>
                    <div className="space-y-3">
                      {challenge.userProgress.recentActivities.map(activity => (
                        <div key={activity.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                              <img
                                src={`/images/${activity.evidence}`}
                                alt="Evidence"
                                onError={(e) => { e.target.src = 'https://via.placeholder.com/100'; }}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <div className="font-medium">
                                +{activity.value} {activity.unit}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {moment(activity.date).format('DD/MM/YYYY HH:mm')}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Stats and Achievements */}
                <div className="space-y-6">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold mb-3">Thành tích</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {challenge.userProgress.achievements.map(achievement => (
                        <div key={achievement.id} className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-lg flex items-center">
                          <span className="text-2xl mr-3">{achievement.icon}</span>
                          <div>
                            <div className="font-medium">{achievement.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {achievement.description}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold mb-3">Thống kê</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                          {challenge.userProgress.streak}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Streak (ngày)</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                          {challenge.userProgress.achievements.length}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Thành tích</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Challenge Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="md:col-span-2 space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-3">Mô tả thử thách</h2>
                <p className="text-gray-600 dark:text-gray-300">{challenge.description}</p>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">Luật chơi</h2>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                  {challenge.rules.map((rule, index) => (
                    <li key={index}>{rule}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">Phần thưởng</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {challenge.rewards
                    .filter(reward => reward.includes("điểm thành tích"))
                    .map((reward, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <FaTrophy className="text-yellow-500" size={20} />
                        <span className="text-gray-700 dark:text-gray-300">{reward}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Phần người tham gia chi tiết */}
              <div>
                <h2 className="text-xl font-semibold mb-3">Người tham gia</h2>
                {challenge.participantsList && (
                  <div className="space-y-3">
                    {/* Sắp xếp để hiển thị người follow trước */}
                    {[...challenge.participantsList]
                      .sort((a, b) => (b.isFollowing ? 1 : 0) - (a.isFollowing ? 1 : 0))
                      .map((participant) => (
                        <div key={participant.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <img
                              src={participant.avatar || useravatar}
                              alt={participant.name}
                              className="w-10 h-10 rounded-full"
                            />
                            <div>
                              <div className="font-medium">{participant.name}</div>
                              {participant.isFollowing && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                  Đang theo dõi
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="text-sm text-gray-500">
                              {participant.progress}%
                            </div>
                            <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${participant.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Thông tin thử thách</h2>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Mục tiêu</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {challenge.targetValue} {challenge.targetUnit}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Thời gian còn lại</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {moment().isAfter(moment(challenge.endDate))
                        ? 'Đã kết thúc'
                        : moment().isBefore(moment(challenge.startDate))
                          ? `Bắt đầu sau ${moment(challenge.startDate).diff(moment(), 'days')} ngày`
                          : `${Math.max(0, moment(challenge.endDate).diff(moment(), 'days'))} ngày`
                      }
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Người tham gia</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {challenge.participants}/{challenge.maxParticipants}
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5 mt-2">
                      <div
                        className="bg-green-600 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${(challenge.participants / challenge.maxParticipants) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {challenge.badges.length > 0 && (
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Huy hiệu có thể nhận</div>
                      <div className="flex flex-wrap gap-2">
                        {challenge.badges.map((badge, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800"
                          >
                            🏅 {badge}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Nút nộp bằng chứng và xem tiến độ khi đã tham gia - phiên bản mobile */}
              {challenge.isJoined && (
                <div className="md:hidden bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-800">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setCreatePostModalOpen(true)}
                      className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors"
                    >
                      <FaCloudUploadAlt className="mr-1" />
                      <span>Nộp bằng chứng</span>
                    </button>
                    <button
                      onClick={toggleUserProgress}
                      className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors"
                    >
                      <FaChartLine className="mr-1" />
                      <span>Tiến độ</span>
                    </button>
                  </div>
                  <div className="mt-3">
                    <button
                      onClick={() => setLeaveConfirmOpen(true)}
                      className="w-full flex items-center justify-center space-x-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-red-600 dark:text-red-400 px-3 py-2 rounded-lg transition-colors"
                    >
                      <FaDoorOpen className="mr-1" />
                      <span>Rời khỏi thử thách</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Hiển thị nút tạo bài viết khi đã tham gia */}
              {challenge.isJoined && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold mb-3">Chia sẻ với cộng đồng</h3>
                  <button
                    onClick={() => setCreatePostModalOpen(true)}
                    className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-3 rounded-lg transition-colors"
                  >
                    <FaRegEdit className="mr-2" />
                    <span>Tạo bài viết mới</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Leaderboard */}
          <div className="mb-8">
            <ChallengeLeaderboard
              challengeId={id}
              userRank={challenge.isJoined ? challenge.userProgress?.rank : null}
            />
          </div>

          {/* Posts */}
          <div>
            <ChallengePosts
              challengeId={id}
              canPost={challenge.isJoined}
              userProgress={challenge.isJoined ? challenge.userProgress : null}
            />
          </div>
        </div>
      </div>

      {/* Modal Confirm Leave Challenge */}
      <LeaveConfirmModal
        isOpen={leaveConfirmOpen}
        onClose={() => setLeaveConfirmOpen(false)}
        onConfirm={handleLeaveChallenge}
      />

      {/* Modal Upload Challenge Post */}
      {createPostModalOpen && (
        <ModalUploadChallengePost
          closeModalPost={() => setCreatePostModalOpen(false)}
          profile={userProfile}
          challenge={challenge}
          userProgress={challenge.userProgress}
        />
      )}

      {/* Modal Share Challenge */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg dark:bg-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Chia sẻ thử thách
              </h3>
              <button
                onClick={handleCloseShareModal}
                className="text-gray-400 hover:text-gray-500"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="mb-2 text-gray-700 dark:text-gray-300">
                Chia sẻ thử thách này với bạn bè của bạn:
              </p>
              <div className="p-3 bg-gray-100 rounded-md dark:bg-gray-700">
                <p className="text-gray-800 dark:text-gray-200">
                  {'https://sharelink/test'}
                </p>
              </div>
            </div>

            <div className="mb-4 flex space-x-2">
              <button className="flex-1 flex justify-center items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded">
                <FaFacebook />
                <span>Facebook</span>
              </button>
              <button className="flex-1 flex justify-center items-center space-x-2 bg-blue-400 hover:bg-blue-500 text-white p-2 rounded">
                <FaTwitter />
                <span>Twitter</span>
              </button>
            </div>

            <button
              className="w-full flex justify-center items-center space-x-2 bg-gray-200 hover:bg-gray-300 text-gray-800 p-2 rounded"
              onClick={() => {
                navigator.clipboard.writeText('https://sharelink/test');
                toast.success('Đã sao chép đường dẫn');
              }}
            >
              <FaCopy />
              <span>Sao chép liên kết</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}