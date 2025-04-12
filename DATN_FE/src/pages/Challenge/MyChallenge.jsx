import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaTrophy, FaRunning, FaCalendarAlt, FaUpload, FaMedal, FaCamera, FaTimes, FaCloudUploadAlt, FaCheck } from 'react-icons/fa'
import moment from 'moment'
import ChallengeProgress from './components/ChallengeProgress'
import toast from 'react-hot-toast'

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

// Thêm một modal component để upload evidence
const EvidenceUploadModal = ({ isOpen, onClose, onSubmit, challengeId }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    // Chỉ cho phép upload tối đa 5 file
    if (selectedFiles.length + files.length > 5) {
      toast.error('Chỉ được tải lên tối đa 5 file!');
      return;
    }
    
    // Kiểm tra kích thước file (tối đa 5MB mỗi file)
    const validFiles = files.filter(file => file.size <= 5 * 1024 * 1024);
    if (validFiles.length < files.length) {
      toast.error('Một số file quá lớn, kích thước tối đa là 5MB!');
    }
    
    // Tạo preview URLs cho các file hình ảnh
    const newFiles = validFiles.map(file => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      type: file.type.startsWith('image/') ? 'image' : 'video'
    }));
    
    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => {
      const newFiles = [...prev];
      // Giải phóng URL object để tránh memory leak
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      toast.error('Vui lòng tải lên ít nhất một bằng chứng!');
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Tạo FormData để gửi lên server
      const formData = new FormData();
      formData.append('challengeId', challengeId);
      formData.append('caption', caption);
      
      selectedFiles.forEach((fileObj, index) => {
        formData.append(`file${index}`, fileObj.file);
      });
      
      // Giả lập API call
      setTimeout(() => {
        // Đây là nơi bạn sẽ gọi API thực tế
        // await challengeApi.uploadEvidence(formData);
        
        toast.success('Tải lên bằng chứng thành công!');
        
        // Cleanup
        selectedFiles.forEach(fileObj => {
          if (fileObj.preview) {
            URL.revokeObjectURL(fileObj.preview);
          }
        });
        
        // Đóng modal và cập nhật state
        onSubmit(challengeId, {
          id: Date.now(),
          files: selectedFiles.map(f => ({
            url: f.preview || '',
            type: f.type
          })),
          caption,
          timestamp: new Date().toISOString()
        });
        
        setIsUploading(false);
        setSelectedFiles([]);
        setCaption('');
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error uploading evidence:', error);
      toast.error('Có lỗi xảy ra khi tải lên bằng chứng!');
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-xl overflow-hidden">
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Tải lên bằng chứng hoàn thành
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <FaTimes />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mô tả (không bắt buộc)
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Mô tả về bằng chứng hoàn thành của bạn..."
              rows="3"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tải lên hình ảnh/video
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedFiles.map((fileObj, index) => (
                <div key={index} className="relative w-24 h-24 border rounded overflow-hidden">
                  {fileObj.type === 'image' ? (
                    <img 
                      src={fileObj.preview} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400 text-center p-1">
                        Video
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl"
                  >
                    <FaTimes size={12} />
                  </button>
                </div>
              ))}
              
              {selectedFiles.length < 5 && (
                <label className="w-24 h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded flex items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                  <FaCamera className="text-gray-400" />
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="hidden"
                    multiple
                  />
                </label>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Tối đa 5 file, mỗi file không quá 5MB. Định dạng hỗ trợ: JPEG, PNG, GIF, MP4.
            </p>
          </div>
          
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md mr-2 hover:bg-gray-300 dark:hover:bg-gray-600"
              disabled={isUploading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <span className="animate-spin mr-2">
                    <FaCloudUploadAlt />
                  </span>
                  Đang tải lên...
                </>
              ) : (
                <>
                  <FaCloudUploadAlt className="mr-2" />
                  Tải lên
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function MyChallenge() {
  const navigate = useNavigate()
  const [myChallenges, setMyChallenges] = useState(mockMyChallenges)
  const [activeTab, setActiveTab] = useState('active') // active, completed
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedChallengeId, setSelectedChallengeId] = useState(null);
  const [evidences, setEvidences] = useState({});

  const filteredChallenges = myChallenges.filter(challenge => {
    if (activeTab === 'active') {
      return moment(challenge.endDate).isAfter(moment())
    }
    return moment(challenge.endDate).isBefore(moment())
  })

  const handleUploadEvidence = (challengeId) => {
    setSelectedChallengeId(challengeId);
    setUploadModalOpen(true);
  }

  const handleEvidenceSubmitted = (challengeId, evidenceData) => {
    setEvidences(prev => ({
      ...prev,
      [challengeId]: [...(prev[challengeId] || []), evidenceData]
    }));
    
    const updatedChallenges = myChallenges.map(challenge => {
      if (challenge.id === challengeId) {
        const newProgress = Math.min(100, challenge.progress + 10);
        return { ...challenge, progress: newProgress };
      }
      return challenge;
    });
    
    setMyChallenges(updatedChallenges);
    
    toast.success('Bằng chứng đã được cập nhật!');
  }

  const handleRemoveChallenge = (challengeId) => {
    setMyChallenges(prev => prev.filter(c => c.id !== challengeId))
  }

  const renderEvidences = (challengeId) => {
    const challengeEvidences = evidences[challengeId] || [];
    if (challengeEvidences.length === 0) return null;
    
    return (
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Bằng chứng đã nộp
        </h4>
        <div className="flex flex-wrap gap-2">
          {challengeEvidences.map((evidence, index) => (
            <div key={index} className="relative w-16 h-16 border rounded overflow-hidden">
              {evidence.files[0]?.type === 'image' ? (
                <img 
                  src={evidence.files[0]?.url} 
                  alt="Evidence" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Video</span>
                </div>
              )}
              {evidence.files.length > 1 && (
                <div className="absolute bottom-0 right-0 bg-black bg-opacity-60 text-white text-xs px-1">
                  +{evidence.files.length - 1}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
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
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md overflow-hidden"
              >
                <div className="relative h-48">
                  <img
                    src={challenge.image}
                    alt={challenge.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-black/50 text-white text-xs py-1 px-2 rounded-full">
                    Hạng {challenge.rank}/{challenge.totalParticipants}
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {challenge.title}
                  </h3>

                  <ChallengeProgress
                    currentValue={challenge.currentValue}
                    targetValue={challenge.targetValue}
                    targetUnit={challenge.targetUnit}
                    progress={challenge.progress}
                  />

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <FaCalendarAlt className="mr-2 text-green-500" />
                      {moment(challenge.endDate).format('DD/MM/YYYY')}
                    </div>

                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <FaRunning className="mr-2 text-green-500" />
                      Chuỗi ngày: {challenge.streak} ngày
                    </div>

                    {/* Achievements */}
                    {challenge.achievements.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {challenge.achievements.map(achievement => (
                          <div
                            key={achievement.id}
                            className="flex items-center bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full"
                            title={achievement.description}
                          >
                            <span className="mr-1">{achievement.icon}</span>
                            {achievement.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={() => navigate(`/challenge/${challenge.status === 'completed' ? 1 : 0}`)}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Chi tiết
                    </button>
                    {challenge.status !== 'completed' && (
                      <button
                        onClick={() => handleUploadEvidence(challenge.id)}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        <FaUpload />
                      </button>
                    )}
                  </div>

                  {renderEvidences(challenge.id)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal upload evidence */}
      <EvidenceUploadModal 
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSubmit={handleEvidenceSubmitted}
        challengeId={selectedChallengeId}
      />
    </div>
  )
} 