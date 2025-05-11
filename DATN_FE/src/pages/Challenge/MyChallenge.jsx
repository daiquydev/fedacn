import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaTrophy, FaCalendarAlt, FaRunning, FaSwimmer, FaBiking, FaDumbbell, FaMedal, FaUpload, FaImage, FaVideo, FaCheck, FaChartBar, FaCloudUploadAlt, FaTimes, FaSync } from 'react-icons/fa'
import { MdDirectionsWalk } from 'react-icons/md'
import moment from 'moment'
import { toast } from 'react-hot-toast'
import ChallengeProgress from './components/ChallengeProgress'
import SmartWatchSync from './components/SmartWatchSync'

// Mock data
const mockMyChallenges = [
  {
    id: 1,
    title: "30 Days Running Challenge",
    startDate: "2025-03-30T00:00:00Z",
    endDate: "2025-04-30T23:59:59Z",
    category: "Running",
    targetValue: 100,
    targetUnit: "km",
    currentValue: 65,
    progress: 65,
    image: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5",
    streak: 5,
    lastUpdate: "2025-04-01T10:00:00Z",
    rank: 3,
    totalParticipants: 215,
    achievements: [
      { id: 1, name: "First Mile", icon: "🏃‍♂️", description: "Completed first mile" },
      { id: 2, name: "Early Bird", icon: "🌅", description: "5 morning runs" }
    ],
    recentActivities: [
      {
        id: 1,
        date: "2025-04-01T10:00:00Z",
        value: 5,
        unit: "km",
        evidence: "activity1.jpg"
      }
    ],
    status: "ongoing"
  },
  
  // Thêm 2 thử thách đang tham gia
  {
    id: 2,
    title: "Cycling Adventure Challenge",
    startDate: "2025-03-10T00:00:00Z",
    endDate: "2025-05-10T23:59:59Z",
    category: "Cycling",
    targetValue: 300,
    targetUnit: "km",
    currentValue: 120,
    progress: 40,
    image: "https://images.unsplash.com/photo-1541625602330-2277a4c46182",
    streak: 3,
    lastUpdate: "2025-04-15T16:30:00Z",
    rank: 12,
    totalParticipants: 176,
    achievements: [
      { id: 1, name: "Weekend Rider", icon: "🚴", description: "Completed 3 weekend rides" },
      { id: 2, name: "Hill Climber", icon: "⛰️", description: "Climbed 500m elevation" }
    ],
    recentActivities: [
      {
        id: 1,
        date: "2025-03-15T16:30:00Z",
        value: 25,
        unit: "km",
        evidence: "cycling_route.jpg"
      },
      {
        id: 2,
        date: "2025-04-13T09:15:00Z",
        value: 18,
        unit: "km",
        evidence: "mountain_path.jpg"
      }
    ],
    status: "ongoing"
  },
  {
    id: 3,
    title: "Daily Yoga Practice",
    startDate: "2025-03-15T00:00:00Z",
    endDate: "2025-05-15T23:59:59Z",
    category: "Yoga",
    targetValue: 60,
    targetUnit: "sessions",
    currentValue: 28,
    progress: 47,
    image: "https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b",
    streak: 7,
    lastUpdate: "2025-03-18T06:45:00Z",
    rank: 5,
    totalParticipants: 320,
    achievements: [
      { id: 1, name: "Morning Flow", icon: "🧘‍♀️", description: "7 consecutive morning practices" },
      { id: 2, name: "Flexible Mind", icon: "🧠", description: "Tried 5 different yoga styles" },
      { id: 3, name: "Balanced Life", icon: "☯️", description: "20 total sessions completed" }
    ],
    recentActivities: [
      {
        id: 1,
        date: "2024-04-18T06:45:00Z",
        value: 1,
        unit: "session",
        evidence: "morning_yoga.jpg"
      },
      {
        id: 2,
        date: "2024-04-17T07:00:00Z",
        value: 1,
        unit: "session",
        evidence: "yoga_pose.jpg"
      }
    ],
    status: "ongoing"
  },
  
  // Thêm 3 thử thách đã kết thúc
  {
    id: 4,
    title: "Winter Swimming Challenge",
    startDate: "2024-01-01T00:00:00Z",
    endDate: "2024-02-29T23:59:59Z",
    category: "Swimming",
    targetValue: 30,
    targetUnit: "km",
    currentValue: 30,
    progress: 100,
    image: "https://images.unsplash.com/photo-1560090995-01632a28895b",
    streak: 12,
    lastUpdate: "2024-02-27T14:20:00Z",
    rank: 2,
    totalParticipants: 148,
    achievements: [
      { id: 1, name: "Cold Warrior", icon: "❄️", description: "Swam in temperatures below 20°C" },
      { id: 2, name: "Distance Master", icon: "🏊‍♂️", description: "Swam 30km total" },
      { id: 3, name: "Consistency King", icon: "👑", description: "Maintained 10+ day streak" }
    ],
    recentActivities: [
      {
        id: 1,
        date: "2024-02-27T14:20:00Z",
        value: 1.5,
        unit: "km",
        evidence: "pool_finish.jpg"
      }
    ],
    status: "completed"
  },
  {
    id: 5,
    title: "30-Day Plank Challenge",
    startDate: "2024-02-01T00:00:00Z",
    endDate: "2024-03-01T23:59:59Z",
    category: "Strength",
    targetValue: 30,
    targetUnit: "days",
    currentValue: 25,
    progress: 83,
    image: "https://images.unsplash.com/photo-1566241142559-40e1dab266c6",
    streak: 0,
    lastUpdate: "2024-02-25T20:10:00Z",
    rank: 45,
    totalParticipants: 523,
    achievements: [
      { id: 1, name: "Core Starter", icon: "💪", description: "Completed first week of planks" },
      { id: 2, name: "Mid-challenge Warrior", icon: "⚔️", description: "Reached 2-minute plank" }
    ],
    recentActivities: [
      {
        id: 1,
        date: "2024-02-25T20:10:00Z",
        value: 1,
        unit: "day",
        evidence: "plank_position.jpg"
      }
    ],
    status: "completed"
  },
  {
    id: 6,
    title: "Spring 10K Steps Challenge",
    startDate: "2024-03-01T00:00:00Z",
    endDate: "2024-03-31T23:59:59Z",
    category: "Walking",
    targetValue: 300000,
    targetUnit: "steps",
    currentValue: 287500,
    progress: 96,
    image: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8",
    streak: 0,
    lastUpdate: "2024-03-30T22:00:00Z",
    rank: 8,
    totalParticipants: 412,
    achievements: [
      { id: 1, name: "Explorer", icon: "🧭", description: "Walked in 5 different locations" },
      { id: 2, name: "Dedicated Walker", icon: "👣", description: "Reached 200,000 steps" },
      { id: 3, name: "Urban Trekker", icon: "🏙️", description: "Completed 10 city walks" }
    ],
    recentActivities: [
      {
        id: 1,
        date: "2024-03-30T22:00:00Z",
        value: 12500,
        unit: "steps",
        evidence: "step_counter.jpg"
      },
      {
        id: 2,
        date: "2024-03-29T21:15:00Z",
        value: 9800,
        unit: "steps",
        evidence: "evening_walk.jpg"
      }
    ],
    status: "completed"
  }
];

export default function MyChallenge() {
  const navigate = useNavigate()
  const [myChallenges, setMyChallenges] = useState(mockMyChallenges)
  const [activeTab, setActiveTab] = useState('active') // active, completed
  const [selectedChallengeId, setSelectedChallengeId] = useState(null);
  const [evidences, setEvidences] = useState({});

  const filteredChallenges = myChallenges.filter(challenge => {
    if (activeTab === 'active') {
      return moment(challenge.endDate).isAfter(moment())
    }
    return moment(challenge.endDate).isBefore(moment())
  })

  const handleRemoveChallenge = (challengeId) => {
    setMyChallenges(prev => prev.filter(c => c.id !== challengeId))
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <FaTrophy className="text-yellow-500 mr-3" size={30} />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Thử thách của tôi
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Theo dõi tiến độ và thành tích của bạn
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-4 mb-6">
            <button
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === 'active'
                  ? 'bg-green-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              onClick={() => setActiveTab('active')}
            >
              Đang tham gia
            </button>
            <button
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === 'completed'
                  ? 'bg-green-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              onClick={() => setActiveTab('completed')}
            >
              Đã hoàn thành
            </button>
          </div>

          {/* Challenges Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChallenges.map(challenge => (
              <div
                key={challenge.id}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md overflow-hidden flex flex-col"
              >
                <div className="relative h-40">
                  <img
                    src={challenge.image}
                    alt={challenge.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-black/50 text-white text-xs py-1 px-2 rounded-full">
                    Hạng {challenge.rank}/{challenge.totalParticipants}
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-1">
                    {challenge.title}
                  </h3>

                  <ChallengeProgress
                    currentValue={challenge.currentValue}
                    targetValue={challenge.targetValue}
                    targetUnit={challenge.targetUnit}
                    progress={challenge.progress}
                  />

                  <div className="mt-3 space-y-2 flex-1">
                    <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                      <FaCalendarAlt className="mr-2 text-green-500" />
                      {moment(challenge.endDate).format('DD/MM/YYYY')}
                    </div>

                    <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                      <FaRunning className="mr-2 text-green-500" />
                      Chuỗi ngày: {challenge.streak} ngày
                    </div>

                    {/* Achievements - Giới hạn hiển thị 2 thành tích */}
                    {challenge.achievements.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {challenge.achievements.slice(0, 2).map(achievement => (
                          <div
                            key={achievement.id}
                            className="flex items-center bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full"
                            title={achievement.description}
                          >
                            <span className="mr-1">{achievement.icon}</span>
                            {achievement.name}
                          </div>
                        ))}
                        {challenge.achievements.length > 2 && (
                          <div className="flex items-center bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded-full">
                            +{challenge.achievements.length - 2}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <button
                      onClick={() => navigate(`/challenge/${challenge.status === 'completed' ? 1 : 0}`)}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Chi tiết
                    </button>
                  </div>
                  
                  {challenge.status !== 'completed' && (
                    <div className="mt-3">
                      <SmartWatchSync 
                        challenge={challenge} 
                        onActivityComplete={(activityData) => {
                          // Cập nhật thách thức với dữ liệu mới từ hoạt động
                          const updatedChallenges = myChallenges.map(c => {
                            if (c.id === challenge.id) {
                              // Tính toán tiến độ mới
                              const newCurrentValue = c.currentValue + activityData.value;
                              const newProgress = Math.min(100, Math.round((newCurrentValue / c.targetValue) * 100));
                              
                              return {
                                ...c,
                                currentValue: newCurrentValue,
                                progress: newProgress,
                                lastUpdate: activityData.date,
                                // Thêm hoạt động mới vào đầu danh sách
                                recentActivities: [
                                  {
                                    id: activityData.id,
                                    date: activityData.date,
                                    value: activityData.value,
                                    unit: activityData.unit,
                                    source: activityData.source,
                                    deviceName: activityData.deviceName,
                                    evidence: activityData.category + '_activity.jpg'
                                  },
                                  ...(c.recentActivities || [])
                                ]
                              };
                            }
                            return c;
                          });
                          
                          // Cập nhật state với các thử thách đã được cập nhật
                          setMyChallenges(updatedChallenges);
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 