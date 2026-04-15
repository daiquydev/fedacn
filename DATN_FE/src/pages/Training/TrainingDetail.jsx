import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AiFillHeart } from 'react-icons/ai'
import { CiHeart } from 'react-icons/ci'
import { FaCheckCircle, FaUserFriends, FaMedal, FaTrophy, FaShare, FaCloudUploadAlt, FaRegEdit, FaChartLine, FaDoorOpen, FaTimes, FaCopy, FaFacebook, FaTwitter } from 'react-icons/fa'
import { BsPersonBadge } from 'react-icons/bs'
import moment from 'moment'
import useravatar from '../../assets/images/useravatar.jpg'
import { getImageUrl } from '../../utils/imageUrl'
import TrainingLeaderboard from './components/TrainingLeaderboard'
import TrainingPosts from './components/TrainingPosts'
import ModalUploadTrainingPost from './components/ModalUploadTrainingPost'
import SmartWatchSync from './components/SmartWatchSync'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { currentAccount } from '../../apis/userApi'
import { toast } from 'react-hot-toast'
import DeleteConfirmBox from '../../components/GlobalComponents/DeleteConfirmBox'
import { getTraining, joinTraining, quitTraining } from '../../apis/trainingApi'

export default function TrainingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isLiked, setIsLiked] = useState(false)
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false)
  const [showUserProgress, setShowUserProgress] = useState(false)
  const [createPostModalOpen, setCreatePostModalOpen] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)

  // Lấy thông tin người dùng hiện tại
  const { data: userData } = useQuery({
    queryKey: ['me'],
    queryFn: () => currentAccount(),
    staleTime: 1000
  })

  const userProfile = userData?.data?.result?.[0] || { name: "Người dùng", avatar: "" }

  // Lấy chi tiết thử thách từ database
  const { data: TrainingData, isLoading, isError } = useQuery({
    queryKey: ['Training', id],
    queryFn: () => getTraining(id),
    staleTime: 1000,
    enabled: !!id
  })



  // Map API data into Training object
  const rawTraining = TrainingData?.data?.result
  const participantsList = rawTraining?.participants_list || []
  const checkins = []

  const Training = rawTraining ? {
    ...rawTraining,
    _id: rawTraining._id,
    title: rawTraining.title || '',
    startDate: rawTraining.start_date || rawTraining.startDate,
    endDate: rawTraining.end_date || rawTraining.endDate,
    category: rawTraining.category || '',
    description: rawTraining.description || '',
    targetValue: rawTraining.target_value || rawTraining.duration_days || 0,
    targetUnit: rawTraining.target_unit || 'ngày',
    rules: rawTraining.rules || [],
    rewards: rawTraining.rewards || [],
    image: rawTraining.image || 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5',
    creator: rawTraining.creator_info || rawTraining.creator || { name: 'Ẩn danh', avatar: '' },
    participants: rawTraining.participant_count || rawTraining.participants || 0,
    maxParticipants: rawTraining.max_participants || 500,
    progress: rawTraining.user_progress?.progress || 0,
    isJoined: rawTraining.is_joined || false,
    likes: rawTraining.likes || 0,
    shares: rawTraining.shares || 0,
    posts: rawTraining.posts || 0,
    badges: rawTraining.badges || [],
    participantsList: participantsList.map(p => ({
      id: p._id || p.user_id,
      name: p.name || p.user_name || 'Ẩn danh',
      avatar: p.avatar || '',
      isFollowing: p.is_following || false,
      progress: p.progress || 0
    })),
    userProgress: rawTraining.is_joined ? {
      currentValue: rawTraining.user_progress?.current_value || 0,
      targetValue: rawTraining.target_value || rawTraining.duration_days || 0,
      streak: rawTraining.user_progress?.streak || 0,
      lastUpdate: rawTraining.user_progress?.last_update || new Date().toISOString(),
      rank: rawTraining.user_progress?.rank || 0,
      achievements: rawTraining.user_progress?.achievements || [],
      recentActivities: checkins.map(c => ({
        id: c._id,
        date: c.created_at,
        value: 1,
        unit: rawTraining.target_unit || 'ngày',
        evidence: c.image_url || ''
      }))
    } : null
  } : null

  // Mutation: Tham gia thử thách
  const joinMutation = useMutation({
    mutationFn: () => joinTraining(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['Training', id] })
      toast.success('Đã tham gia thử thách!')
      setTimeout(() => {
        navigate('/training/my-trainings')
      }, 1000)
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Không thể tham gia thử thách')
    }
  })

  // Mutation: Rời thử thách
  const leaveMutation = useMutation({
    mutationFn: () => quitTraining(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['Training', id] })
      toast.success('Đã rời khỏi thử thách')
      setLeaveConfirmOpen(false)
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Không thể rời thử thách')
    }
  })

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 flex justify-center items-center h-64">
        <div className="text-xl text-gray-600 dark:text-gray-400">Đang tải thông tin thử thách...</div>
      </div>
    )
  }

  // Error state
  if (isError || !Training) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col justify-center items-center h-64">
        <div className="text-xl text-red-500 mb-4">Không tìm thấy thử thách</div>
        <button onClick={() => navigate('/training')} className="text-blue-600 hover:underline">
          Quay lại danh sách
        </button>
      </div>
    )
  }

  const handleJoinTraining = () => {
    if (Training.isJoined) return
    joinMutation.mutate()
  }

  const handleLeaveTraining = () => {
    leaveMutation.mutate()
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
    const newValue = (Training.userProgress?.currentValue || 0) + data.value;
    const newProgress = Math.min(100, Math.round((newValue / Training.targetValue) * 100));

    // Tính toán streak
    const lastActivity = Training.userProgress?.recentActivities?.[0];
    const lastActivityDate = lastActivity ? moment(lastActivity.date) : null;
    const today = moment();
    const isConsecutiveDay = lastActivityDate &&
      today.diff(lastActivityDate, 'days') <= 1;

    const newStreak = isConsecutiveDay
      ? (Training.userProgress?.streak || 0) + 1
      : 1;

    // Cập nhật dữ liệu thử thách
    setTraining(prev => ({
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
    toast.success(`Đã cập nhật tiến độ: +${data.value} ${Training.targetUnit}`);
  }

  const toggleUserProgress = () => {
    setShowUserProgress(!showUserProgress);
  }

  const checkTrainingStatus = () => {
    if (Training && moment().isAfter(moment(Training.endDate))) {
      // Cập nhật UI khi thử thách đã kết thúc
      return "ended"; // hoặc lưu vào state để xử lý hiển thị
    }
    return Training?.status || "ongoing";
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
            src={Training.image}
            alt={Training.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">{Training.title}</h1>
                <div className="flex items-center text-white/90 space-x-4">
                  <span>
                    {moment(Training.startDate).format('DD/MM/YYYY')} - {moment(Training.endDate).format('DD/MM/YYYY')}
                  </span>
                  <span>•</span>
                  <span>{Training.participants} người tham gia</span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleLike}
                  className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {isLiked ? <AiFillHeart className="text-red-500" /> : <CiHeart />}
                  <span>{Training.likes}</span>
                </button>
                <button
                  onClick={handleOpenShareModal}
                  className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <FaShare />
                  <span>{Training.shares}</span>
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
                src={Training.creator.avatar ? getImageUrl(Training.creator.avatar) : useravatar}
                alt={Training.creator.name}
                className="w-12 h-12 rounded-full"
              />
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-lg">{Training.creator.name}</span>
                  {Training.creator.isVerified && (
                    <FaCheckCircle className="text-blue-400" size={15} />
                  )}
                </div>
                <span className="text-gray-500 dark:text-gray-400">Người tạo thử thách</span>
              </div>
            </div>

            {/* Hiển thị nút tham gia hoặc các tùy chọn khi đã tham gia */}
            {Training.isJoined ? (
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
            ) : (Training.endDate && moment().startOf('day').isAfter(moment(Training.endDate).endOf('day'))) ? (
              <button
                onClick={() => { }}
                className="px-6 py-2 rounded-lg font-medium bg-gray-200 text-gray-500 cursor-default transition-colors flex items-center justify-center dark:bg-gray-700 dark:text-gray-400"
              >
                Đã kết thúc
              </button>
            ) : (Training.startDate && moment().startOf('day').isBefore(moment(Training.startDate).startOf('day'))) ? (
              <button
                onClick={() => { }}
                className="px-6 py-2 rounded-lg font-medium bg-gray-200 text-gray-500 cursor-default transition-colors flex items-center justify-center dark:bg-gray-700 dark:text-gray-400"
              >
                Chưa bắt đầu
              </button>
            ) : (
              <button
                onClick={handleJoinTraining}
                className="px-6 py-2 rounded-lg font-medium bg-green-600 hover:bg-green-700 text-white transition-colors flex items-center justify-center"
              >
                Tham gia ngay
              </button>
            )}
          </div>

          {/* Hiển thị Component SmartWatchSync khi đã tham gia */}
          {Training.isJoined && <SmartWatchSync
            Training={Training}
            onActivityComplete={(activityData) => {
              // Cập nhật tiến độ của thử thách với dữ liệu mới từ hoạt động
              const newValue = (Training.userProgress?.currentValue || 0) + activityData.value;
              const newProgress = Math.min(100, Math.round((newValue / Training.targetValue) * 100));

              // Tính toán streak
              const lastActivity = Training.userProgress?.recentActivities?.[0];
              const lastActivityDate = lastActivity ? moment(lastActivity.date) : null;
              const today = moment();
              const isConsecutiveDay = lastActivityDate &&
                today.diff(lastActivityDate, 'days') <= 1;

              const newStreak = isConsecutiveDay
                ? (Training.userProgress?.streak || 0) + 1
                : 1;

              // Cập nhật dữ liệu thử thách
              setTraining(prev => ({
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
              toast.success(`Đã cập nhật tiến độ: +${activityData.value} ${Training.targetUnit}`);
            }}
          />}

          {/* User Progress Section (hiển thị khi đã tham gia và khi showUserProgress = true) */}
          {Training.isJoined && showUserProgress && Training.userProgress && (
            <div className="mb-8 p-6 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold text-green-800 dark:text-green-300">Tiến độ của bạn</h2>
                <div className="flex items-center space-x-2">
                  <div className="bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                    <BsPersonBadge className="mr-1" />
                    Xếp hạng #{Training.userProgress.rank}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  {/* Progress Bar */}
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Tiến độ: {Training.userProgress.currentValue}/{Training.targetValue} {Training.targetUnit}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {Training.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div
                        className="bg-green-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${Training.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Recent Activities */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Hoạt động gần đây</h3>
                    <div className="space-y-3">
                      {Training.userProgress.recentActivities.map(activity => (
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
                      {Training.userProgress.achievements.map(achievement => (
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
                          {Training.userProgress.streak}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Streak (ngày)</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                          {Training.userProgress.achievements.length}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Thành tích</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Training Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="md:col-span-2 space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-3">Mô tả thử thách</h2>
                <p className="text-gray-600 dark:text-gray-300">{Training.description}</p>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">Luật chơi</h2>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                  {Training.rules.map((rule, index) => (
                    <li key={index}>{rule}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">Phần thưởng</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Training.rewards
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
                {Training.participantsList && (
                  <div className="space-y-3">
                    {/* Sắp xếp để hiển thị người follow trước */}
                    {[...Training.participantsList]
                      .sort((a, b) => (b.isFollowing ? 1 : 0) - (a.isFollowing ? 1 : 0))
                      .map((participant) => (
                        <div key={participant.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <img
                              src={participant.avatar ? getImageUrl(participant.avatar) : useravatar}
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
                      {Training.targetValue} {Training.targetUnit}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Thời gian còn lại</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {moment().isAfter(moment(Training.endDate))
                        ? 'Đã kết thúc'
                        : moment().isBefore(moment(Training.startDate))
                          ? `Bắt đầu sau ${moment(Training.startDate).diff(moment(), 'days')} ngày`
                          : `${Math.max(0, moment(Training.endDate).diff(moment(), 'days'))} ngày`
                      }
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Người tham gia</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {Training.participants}/{Training.maxParticipants}
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5 mt-2">
                      <div
                        className="bg-green-600 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${(Training.participants / Training.maxParticipants) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {Training.badges.length > 0 && (
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Huy hiệu có thể nhận</div>
                      <div className="flex flex-wrap gap-2">
                        {Training.badges.map((badge, index) => (
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
              {Training.isJoined && (
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
              {Training.isJoined && (
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
            <TrainingLeaderboard
              TrainingId={id}
              userRank={Training.isJoined ? Training.userProgress?.rank : null}
            />
          </div>

          {/* Posts */}
          <div>
            <TrainingPosts
              TrainingId={id}
              canPost={Training.isJoined}
              userProgress={Training.isJoined ? Training.userProgress : null}
            />
          </div>
        </div>
      </div>

      {/* Modal Confirm Leave Training */}
      {leaveConfirmOpen && (
        <DeleteConfirmBox
          title='Xác nhận rời thử thách'
          subtitle='Bạn có chắc chắn muốn rời khỏi thử thách này? Mọi tiến độ và thành tích của bạn sẽ bị mất. Hành động này không thể hoàn tác.'
          handleDelete={handleLeaveTraining}
          closeModal={() => setLeaveConfirmOpen(false)}
          tilteButton='Rời thử thách'
        />
      )}

      {/* Modal Upload Training Post */}
      {createPostModalOpen && (
        <ModalUploadTrainingPost
          closeModalPost={() => setCreatePostModalOpen(false)}
          profile={userProfile}
          Training={Training}
          userProgress={Training.userProgress}
        />
      )}

      {/* Modal Share Training */}
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