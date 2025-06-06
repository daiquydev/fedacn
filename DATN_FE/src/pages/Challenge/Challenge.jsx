import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FaSearch, FaTrophy, FaRunning, FaBiking, FaSwimmer, FaDumbbell, FaCalendarAlt } from 'react-icons/fa'
import { MdDirectionsWalk } from 'react-icons/md'

// Import các components có sẵn từ thư mục components
import ChallengeCard from './components/ChallengeCard'
import ChallengeFilters from './components/ChallengeFilters'
import { getCategoryIcon, getPeriodicLabel } from './components/ChallengeUtils'

// Sử dụng ngày giả lập để kiểm tra trạng thái thử thách
const SIMULATED_CURRENT_DATE = new Date('2025-04-29T14:00:00');  // Ngày giả lập: 29/04/2025 14:00

// Mock data
const mockChallenges = [
  // Đã kết thúc (completed)
  {
    id: 1,
    title: 'Thử thách chạy bộ 5K mỗi ngày (Đã kết thúc)',
    description: 'Thử thách này đã kết thúc vào ngày 15/04/2025. Người tham gia đã chạy bộ 5km mỗi ngày để tăng cường sức khỏe tim mạch và sức bền',
    category: 'running',
    startDate: '2025-03-15',
    endDate: '2025-04-15',
    participants: 245,
    createdBy: 'CLB Chạy bộ Sài Gòn',
    image: 'https://images.unsplash.com/photo-1513593771513-7b58b6c4af38',
    rewards: 'Huy hiệu Đôi chân thép + 500 điểm',
    rules: 'Chạy bộ ít nhất 5km mỗi ngày, đăng bằng chứng hoàn thành từ ứng dụng theo dõi',
    progress: 85,
    isJoined: true,
    status: 'completed',
    isPeriodic: false
  },
  {
    id: 11,
    title: 'Thử thách bơi lội 30 ngày (Đã kết thúc)',
    description: 'Thử thách đã kết thúc vào ngày 20/04/2025. Bơi ít nhất 500m mỗi ngày để cải thiện sức khỏe tim mạch và sức bền',
    category: 'swimming',
    startDate: '2025-03-01',
    endDate: '2025-04-20',
    participants: 178,
    createdBy: 'CLB Bơi lội Hà Nội',
    image: 'https://images.unsplash.com/photo-1560090995-01632a28895b',
    rewards: 'Huy hiệu Người cá + 400 điểm',
    rules: 'Bơi ít nhất 500m mỗi ngày, đăng bằng chứng hoàn thành',
    progress: 0,
    isJoined: false,
    status: 'completed',
    isPeriodic: false
  },
  
  // Đang diễn ra (ongoing)
  {
    id: 12,
    title: 'Thử thách 10K bước chân mỗi ngày (Đang diễn ra)',
    description: 'Đi bộ 10.000 bước mỗi ngày để duy trì lối sống năng động. Thử thách bắt đầu từ 10/04 và kéo dài đến 10/05',
    category: 'walking',
    startDate: '2025-04-10',
    endDate: '2025-05-10',
    participants: 312,
    createdBy: 'Ứng dụng Sức khỏe Việt',
    image: 'https://images.unsplash.com/photo-1487956382158-bb926046304a',
    rewards: 'Huy hiệu Người đi bộ + 300 điểm',
    rules: 'Đi bộ ít nhất 10.000 bước mỗi ngày, chia sẻ dữ liệu từ ứng dụng theo dõi',
    progress: 65,
    isJoined: true,
    status: 'ongoing',
    isPeriodic: true,
    periodicType: 'monthly'
  },
  {
    id: 13,
    title: 'Thử thách 30 phút tập thể dục mỗi ngày (Đang diễn ra)',
    description: 'Dành 30 phút mỗi ngày cho các hoạt động thể chất để duy trì sức khỏe. Thử thách bắt đầu từ 20/04 và kéo dài đến 20/05',
    category: 'fitness',
    startDate: '2025-04-20',
    endDate: '2025-05-20',
    participants: 245,
    createdBy: 'Trung tâm Fitness Plus',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd',
    rewards: 'Huy hiệu Người năng động + 350 điểm',
    rules: 'Tập thể dục ít nhất 30 phút mỗi ngày, ghi lại hoạt động',
    progress: 75,
    isJoined: true,
    status: 'ongoing',
    isPeriodic: false
  },
  {
    id: 14,
    title: 'Thử thách đạp xe 50km mỗi tuần (Đang diễn ra)',
    description: 'Đạp xe tích lũy 50km mỗi tuần để cải thiện sức khỏe tim mạch. Thử thách bắt đầu từ 05/04 và kéo dài đến 31/05',
    category: 'cycling',
    startDate: '2025-04-05',
    endDate: '2025-05-31',
    participants: 156,
    createdBy: 'CLB Đạp xe Đà Nẵng',
    image: 'https://images.unsplash.com/photo-1534787238916-9ba6764efd4f',
    rewards: 'Huy hiệu Tay đua + 450 điểm',
    rules: 'Đạp xe tích lũy đủ 50km mỗi tuần, chia sẻ lộ trình',
    progress: 40,
    isJoined: true,
    status: 'ongoing',
    isPeriodic: true,
    periodicType: 'weekly'
  },
  
  // Sắp diễn ra (upcoming)
  {
    id: 16,
    title: 'Thử thách chạy bộ mùa hè (Sắp diễn ra)',
    description: 'Chạy bộ tích lũy 100km trong mùa hè để nhận thưởng đặc biệt. Thử thách bắt đầu từ 05/05 và kéo dài đến 31/05',
    category: 'running',
    startDate: '2025-05-05',
    endDate: '2025-05-31',    
    participants: 87,
    createdBy: 'Marathon Việt Nam',
    image: 'https://images.unsplash.com/photo-1486218119243-13883505764c',
    rewards: 'Huy hiệu Mùa hè năng động + 500 điểm',
    rules: 'Chạy bộ tích lũy đủ 100km trong tháng 5, chia sẻ kết quả từ ứng dụng theo dõi',
    progress: 0,
    isJoined: false,
    status: 'upcoming',
    isPeriodic: false
  },
  {
    id: 17,
    title: 'Thử thách bơi lội hàng tuần (Sắp diễn ra)',
    description: 'Bơi ít nhất 2 lần mỗi tuần, mỗi lần 1000m để cải thiện kỹ thuật. Thử thách bắt đầu từ 10/05 và kéo dài đến 10/06',
    category: 'swimming',
    startDate: '2025-05-10',
    endDate: '2025-06-10',
    participants: 68,
    createdBy: 'HLV Bơi lội Thanh Thủy',
    image: 'https://images.unsplash.com/photo-1519315901367-f34ff9154487',
    rewards: 'Huy hiệu Kình ngư + 400 điểm',
    rules: 'Bơi ít nhất 2 lần mỗi tuần, mỗi lần 1000m, ghi lại thời gian',
    progress: 0,
    isJoined: false,
    status: 'upcoming',
    isPeriodic: true,
    periodicType: 'weekly'
  },
  {
    id: 18,
    title: 'Thử thách Gym 12 tuần (Sắp diễn ra)',
    description: 'Chương trình tập gym toàn diện trong 12 tuần để xây dựng cơ bắp. Thử thách bắt đầu từ 15/05 và kéo dài đến 15/08',
    category: 'gym',
    startDate: '2025-05-15',
    endDate: '2025-08-15',
    participants: 125,
    createdBy: 'PT Chuyên nghiệp Hoàng Anh',
    image: 'https://images.unsplash.com/photo-1517963879433-6ad2b056d712',
    rewards: 'Huy hiệu Người sắt + 600 điểm',
    rules: 'Tập gym theo lịch 4 buổi/tuần, chia sẻ hình ảnh trước và sau',
    progress: 0,
    isJoined: false,
    status: 'upcoming',
    isPeriodic: false
  }
];

const Challenge = () => {
  const [challenges, setChallenges] = useState([]);
  const [filteredChallenges, setFilteredChallenges] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState('popular');

  useEffect(() => {
    // Fetch challenges or use mock data
    // Add calculated status based on simulated date
    const challengesWithCalculatedStatus = mockChallenges.map(challenge => {
      const startDate = new Date(challenge.startDate);
      const endDate = new Date(challenge.endDate);
      const now = SIMULATED_CURRENT_DATE;
      
      let calculatedStatus;
      if (now < startDate) {
        calculatedStatus = 'upcoming';
      } else if (now > endDate) {
        calculatedStatus = 'completed';
      } else {
        calculatedStatus = 'ongoing';
      }
      
      return {
        ...challenge,
        calculatedStatus
      };
    });
    
    setChallenges(challengesWithCalculatedStatus);
    setFilteredChallenges(challengesWithCalculatedStatus);
  }, []);

  useEffect(() => {
    let filtered = challenges;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (challenge) =>
          challenge.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          challenge.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((challenge) => challenge.category === selectedCategory);
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter((challenge) => challenge.calculatedStatus === selectedStatus);
    }

    // Filter by type (periodic or regular)
    if (selectedType !== 'all') {
      if (selectedType === 'periodic') {
        filtered = filtered.filter((challenge) => challenge.isPeriodic);
      } else if (selectedType === 'regular') {
        filtered = filtered.filter((challenge) => !challenge.isPeriodic);
      }
    }

    // Sort challenges
    if (sortBy === 'popular') {
      filtered = [...filtered].sort((a, b) => b.participants - a.participants);
    } else if (sortBy === 'newest') {
      filtered = [...filtered].sort(
        (a, b) => new Date(b.startDate) - new Date(a.startDate)
      );
    } else if (sortBy === 'endingSoon') {
      filtered = [...filtered].sort(
        (a, b) => new Date(a.endDate) - new Date(b.endDate)
      );
    }

    setFilteredChallenges(filtered);
  }, [challenges, searchTerm, selectedCategory, selectedStatus, selectedType, sortBy]);

  // Các danh mục thể thao
  const categories = [
    { id: 'all', name: 'Tất cả', icon: <FaTrophy /> },
    { id: 'running', name: 'Chạy bộ', icon: <FaRunning /> },
    { id: 'cycling', name: 'Đạp xe', icon: <FaBiking /> },
    { id: 'swimming', name: 'Bơi lội', icon: <FaSwimmer /> },
    { id: 'gym', name: 'Gym', icon: <FaDumbbell /> },
    { id: 'walking', name: 'Đi bộ', icon: <MdDirectionsWalk /> }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Thử thách Cộng đồng</h1>
      
      {/* Simulated Date Display */}
      <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-center text-blue-700 dark:text-blue-300 font-medium">
          <FaCalendarAlt className="mr-2" />
          <span>
            Ngày hiện tại (giả lập): {new Date(SIMULATED_CURRENT_DATE).toLocaleDateString('vi-VN', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
        <p className="mt-1 text-sm text-blue-600 dark:text-blue-400">
          Các trạng thái thử thách được tính dựa trên ngày hiện tại giả lập này để dễ demo
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <Link
          to="/challenge/create"
          className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition"
        >
          Tạo thử thách mới
        </Link>
      </div>

      {/* Search bar */}
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Tìm kiếm thử thách..."
          className="w-full p-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-green-500 dark:focus:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-500 dark:focus:ring-green-400 pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      </div>

      {/* Sử dụng component ChallengeFilters */}
      <ChallengeFilters
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />

      {/* Category buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((category) => (
          <button
            key={category.id}
            className={`flex items-center px-4 py-2 rounded-full ${
              selectedCategory === category.id
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => setSelectedCategory(category.id)}
          >
            <span className="mr-2">{category.icon}</span> {category.name}
          </button>
        ))}
      </div>

      {/* Type filter buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          className={`px-4 py-2 rounded-full ${
            selectedType === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => setSelectedType('all')}
        >
          Tất cả các loại
        </button>
        <button
          className={`px-4 py-2 rounded-full ${
            selectedType === 'regular'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => setSelectedType('regular')}
        >
          Thử thách thường
        </button>
        <button
          className={`px-4 py-2 rounded-full ${
            selectedType === 'periodic'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => setSelectedType('periodic')}
        >
          Thử thách định kỳ
        </button>
      </div>

      {/* Challenges grid */}
      {filteredChallenges.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChallenges.map((challenge) => (
            <ChallengeCard 
              key={challenge.id} 
              challenge={challenge} 
              categoryIcon={getCategoryIcon(challenge.category)}
              periodicLabel={getPeriodicLabel(challenge)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FaTrophy className="mx-auto text-gray-400 text-5xl mb-4" />
          <h3 className="text-xl font-medium text-gray-600 dark:text-gray-400">
            Không tìm thấy thử thách phù hợp
          </h3>
          <p className="text-gray-500 mt-2">
            Hãy thử tìm kiếm với các bộ lọc khác
          </p>
        </div>
      )}
    </div>
  );
};

export default Challenge;