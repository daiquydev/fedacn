import { useState } from 'react'
import { FaPlus, FaUtensils, FaSortAmountDown, FaFilter, FaCalendarAlt } from 'react-icons/fa'
import { IoMdTime } from 'react-icons/io'
import { useNavigate } from 'react-router-dom'
import { AiOutlineSearch } from 'react-icons/ai'
import CreateMealPlanModal from './components/CreateMealPlanModal/CreateMealPlanModal'
import MealPlanCard from './components/MealPlanCard/MealPlanCard'

export default function MealPlan() {
  const navigate = useNavigate()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState({
    sort: 'newest',
    duration: 'all',
    category: 'all'
  })

  // Mock data for meal plans
  const mealPlans = [
    {
      id: 1,
      title: 'Thực đơn giảm cân 7 ngày',
      description: 'Thực đơn giảm cân lành mạnh với đầy đủ dinh dưỡng cho 7 ngày',
      author: {
        name: 'Nguyễn Văn A',
        avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
        isVerified: true
      },
      duration: 7,
      category: 'Giảm cân',
      likes: 120,
      comments: 24,
      createdAt: '2023-12-15T09:00:00Z',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000'
    },
    {
      id: 2,
      title: 'Thực đơn ăn sạch 3 ngày',
      description: 'Thực đơn ăn sạch không chất bảo quản, đường và chất béo xấu',
      author: {
        name: 'Trần Thị B',
        avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
        isVerified: false
      },
      duration: 3,
      category: 'Ăn sạch',
      likes: 85,
      comments: 12,
      createdAt: '2023-12-19T14:30:00Z',
      image: 'https://images.unsplash.com/photo-1493770348161-369560ae357d?q=80&w=1000'
    },
    {
      id: 3,
      title: 'Thực đơn thuần chay 5 ngày',
      description: 'Thực đơn thuần chay giàu protein từ thực vật cho 5 ngày',
      author: {
        name: 'Lê Văn C',
        avatar: 'https://randomuser.me/api/portraits/men/67.jpg',
        isVerified: true
      },
      duration: 5,
      category: 'Thuần chay',
      likes: 210,
      comments: 43,
      createdAt: '2023-12-01T11:15:00Z',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1000'
    },
    {
      id: 4,
      title: 'Thực đơn tăng cơ 14 ngày',
      description: 'Thực đơn tăng cơ giàu protein và carbohydrate phức hợp',
      author: {
        name: 'Phạm Thị D',
        avatar: 'https://randomuser.me/api/portraits/women/23.jpg',
        isVerified: false
      },
      duration: 14,
      category: 'Tăng cơ',
      likes: 156,
      comments: 31,
      createdAt: '2023-12-10T08:45:00Z',
      image: 'https://images.unsplash.com/photo-1566740933430-b5e70b20d1ad?q=80&w=1000'
    },
    {
      id: 5,
      title: 'Thực đơn gia đình 1 tuần',
      description: 'Thực đơn đa dạng, phù hợp cho cả gia đình với các món truyền thống Việt Nam',
      author: {
        name: 'Hoàng Văn E',
        avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
        isVerified: true
      },
      duration: 7,
      category: 'Gia đình',
      likes: 180,
      comments: 28,
      createdAt: '2023-12-05T16:20:00Z',
      image: 'https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=1000'
    },
    {
      id: 6,
      title: 'Thực đơn Keto 10 ngày',
      description: 'Thực đơn keto giàu chất béo lành mạnh, ít carbohydrate',
      author: {
        name: 'Nguyễn Thị F',
        avatar: 'https://randomuser.me/api/portraits/women/57.jpg',
        isVerified: true
      },
      duration: 10,
      category: 'Keto',
      likes: 142,
      comments: 19,
      createdAt: '2023-12-20T10:30:00Z',
      image: 'https://images.unsplash.com/photo-1559847844-5315695dadae?q=80&w=1000'
    }
  ]

  // Filter meal plans based on search term and filters
  const filteredMealPlans = mealPlans
    .filter(plan => 
      plan.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      plan.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(plan => {
      if (filter.duration === 'all') return true;
      if (filter.duration === 'short') return plan.duration <= 3;
      if (filter.duration === 'medium') return plan.duration > 3 && plan.duration <= 7;
      if (filter.duration === 'long') return plan.duration > 7;
      return true;
    })
    .filter(plan => {
      if (filter.category === 'all') return true;
      return plan.category.toLowerCase() === filter.category.toLowerCase();
    })
    .sort((a, b) => {
      if (filter.sort === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (filter.sort === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (filter.sort === 'popular') return b.likes - a.likes;
      return 0;
    });

  const handleOpenCreateModal = () => {
    setShowCreateModal(true);
  }

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
  }

  const handleFilterChange = (type, value) => {
    setFilter(prev => ({
      ...prev,
      [type]: value
    }));
  }

  return (
    <div className="min-h-screen py-6 px-4 md:px-6">
      {/* Header with title and create button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white flex items-center">
            <FaUtensils className="mr-2 text-green-600 dark:text-green-400" />
            Thực Đơn Cộng Đồng
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Khám phá và chia sẻ các thực đơn dinh dưỡng từ cộng đồng
          </p>
        </div>
        <button 
          onClick={handleOpenCreateModal}
          className="mt-4 md:mt-0 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow flex items-center transition-colors"
        >
          <FaPlus className="mr-2" /> Tạo Thực Đơn Mới
        </button>
      </div>

      {/* Search and filter section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Search input */}
          <div className="lg:col-span-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm thực đơn..."
                className="w-full py-2 pl-10 pr-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <AiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-xl" />
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-2 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-3">
            {/* Sort filter */}
            <div className="relative">
              <select
                className="appearance-none w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
                value={filter.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="popular">Phổ biến nhất</option>
              </select>
              <FaSortAmountDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
            </div>

            {/* Duration filter */}
            <div className="relative">
              <select
                className="appearance-none w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
                value={filter.duration}
                onChange={(e) => handleFilterChange('duration', e.target.value)}
              >
                <option value="all">Tất cả thời gian</option>
                <option value="short">Ngắn (≤ 3 ngày)</option>
                <option value="medium">Trung bình (4-7 ngày)</option>
                <option value="long">Dài ({'>'} 7 ngày)</option>
              </select>
              <IoMdTime className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
            </div>

            {/* Category filter */}
            <div className="relative">
              <select
                className="appearance-none w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
                value={filter.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <option value="all">Tất cả loại</option>
                <option value="giảm cân">Giảm cân</option>
                <option value="ăn sạch">Ăn sạch</option>
                <option value="thuần chay">Thuần chay</option>
                <option value="tăng cơ">Tăng cơ</option>
                <option value="gia đình">Gia đình</option>
                <option value="keto">Keto</option>
              </select>
              <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Meal Plans Grid */}
      {filteredMealPlans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMealPlans.map(plan => (
            <MealPlanCard key={plan.id} plan={plan} onClick={() => navigate(`/meal-plan/${plan.id}`)} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <FaCalendarAlt className="mx-auto text-5xl text-gray-400 dark:text-gray-600 mb-4" />
          <h3 className="text-xl font-medium text-gray-500 dark:text-gray-400">Không tìm thấy thực đơn nào</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Thử điều chỉnh bộ lọc hoặc tạo thực đơn mới</p>
          <button 
            onClick={handleOpenCreateModal}
            className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow flex items-center transition-colors mx-auto"
          >
            <FaPlus className="mr-2" /> Tạo Thực Đơn Mới
          </button>
        </div>
      )}

      {/* Load more button (simplified, would need pagination logic in a real implementation) */}
      {filteredMealPlans.length >= 6 && (
        <div className="flex justify-center mt-8">
          <button className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            Xem thêm
          </button>
        </div>
      )}

      {/* Create Meal Plan Modal */}
      {showCreateModal && (
        <CreateMealPlanModal onClose={handleCloseCreateModal} />
      )}
    </div>
  )
} 