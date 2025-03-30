import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaSearch, FaFilter, FaHeart, FaBookmark, FaEllipsisV, FaEdit, FaTrash, FaShare, FaRegCalendarAlt, FaUtensils, FaFire, FaCheck } from 'react-icons/fa';

export default function MealPlanManagement() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [mealPlans, setMealPlans] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  
  // Mô phỏng fetch dữ liệu
  useEffect(() => {
    setTimeout(() => {
      const mockMealPlans = [
        {
          id: 1,
          title: 'Thực đơn giảm cân 7 ngày',
          description: 'Thực đơn giảm cân lành mạnh với nhiều protein và ít carb để hỗ trợ giảm cân nhanh chóng',
          image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
          type: 'Giảm cân',
          duration: 7,
          totalCalories: 1430,
          author: 'Jane Fitness',
          authorId: 101,
          authorAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
          createdAt: '2024-01-05T12:30:00Z',
          bookmarked: true,
          likes: 342,
          active: true,
          progress: 40,
          daysCompleted: 4,
          startDate: '2024-01-10T00:00:00Z'
        },
        {
          id: 2,
          title: 'Thực đơn tăng cơ 14 ngày',
          description: 'Thực đơn giàu protein với lượng calo cao giúp tăng cơ hiệu quả kết hợp với tập luyện',
          image: 'https://images.unsplash.com/photo-1547592180-85f173990554',
          type: 'Tăng cơ',
          duration: 14,
          totalCalories: 2100,
          author: 'Alex Strength',
          authorId: 102,
          authorAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
          createdAt: '2023-12-20T10:15:00Z',
          bookmarked: false,
          likes: 256,
          active: false,
          progress: 0,
          daysCompleted: 0,
          startDate: null
        },
        {
          id: 3,
          title: 'Thực đơn Keto 30 ngày',
          description: 'Thực đơn ít carb, giàu chất béo lành mạnh theo phương pháp Keto giúp đốt mỡ nhanh',
          image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061',
          type: 'Keto',
          duration: 30,
          totalCalories: 1800,
          author: 'Maria Nutrition',
          authorId: 103,
          authorAvatar: 'https://randomuser.me/api/portraits/women/68.jpg',
          createdAt: '2023-11-15T09:45:00Z',
          bookmarked: true,
          likes: 528,
          active: false,
          progress: 0,
          daysCompleted: 0,
          startDate: null
        },
        {
          id: 4,
          title: 'Thực đơn ăn sạch 21 ngày',
          description: 'Thực đơn lành mạnh với thực phẩm tự nhiên, không chế biến sẵn giúp detox cơ thể',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd',
          type: 'Ăn sạch',
          duration: 21,
          totalCalories: 1650,
          author: 'Tom Healthy',
          authorId: 104,
          authorAvatar: 'https://randomuser.me/api/portraits/men/22.jpg',
          createdAt: '2023-12-05T11:20:00Z',
          bookmarked: false,
          likes: 312,
          active: false,
          progress: 0,
          daysCompleted: 0,
          startDate: null
        }
      ];
      
      setMealPlans(mockMealPlans);
      setLoading(false);
    }, 800);
  }, []);
  
  // Filter meal plans based on search query and filter type
  const getFilteredMealPlans = () => {
    return mealPlans.filter(plan => {
      // Filter by search query
      if (searchQuery && !plan.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Filter by type
      if (filterType === 'active' && !plan.active) {
        return false;
      } else if (filterType === 'bookmarked' && !plan.bookmarked) {
        return false;
      } else if (filterType !== 'all' && filterType !== 'active' && filterType !== 'bookmarked' && plan.type !== filterType) {
        return false;
      }
      
      return true;
    });
  };
  
  // Toggle bookmark status
  const handleToggleBookmark = (id) => {
    setMealPlans(prevPlans => prevPlans.map(plan => 
      plan.id === id ? { ...plan, bookmarked: !plan.bookmarked } : plan
    ));
  };
  
  // Toggle like status
  const handleToggleLike = (id) => {
    setMealPlans(prevPlans => prevPlans.map(plan => {
      if (plan.id === id) {
        const newLikes = plan.liked ? plan.likes - 1 : plan.likes + 1;
        return { ...plan, likes: newLikes, liked: !plan.liked };
      }
      return plan;
    }));
  };
  
  // Start a meal plan
  const handleStartPlan = (id) => {
    // In a real app, you would call an API to start the plan
    // For this demo, we'll just update the local state
    const today = new Date().toISOString();
    
    setMealPlans(prevPlans => prevPlans.map(plan => 
      plan.id === id ? { 
        ...plan, 
        active: true, 
        startDate: today,
        progress: 0,
        daysCompleted: 0
      } : plan
    ));
    
    // Navigate to the meal schedule page
    navigate('/schedule/my-eat-schedule');
  };
  
  const filteredMealPlans = getFilteredMealPlans();
  
  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen py-6 px-4 md:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Quản lý thực đơn
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Khám phá và quản lý các kế hoạch thực đơn của bạn
          </p>
        </div>
      </div>
      
      {/* Search and filters */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm thực đơn..."
            className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        
        <div className="relative">
          <button
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center"
          >
            <FaFilter className="mr-2" /> 
            {filterType === 'all' ? 'Tất cả thực đơn' : 
             filterType === 'active' ? 'Đang theo dõi' : 
             filterType === 'bookmarked' ? 'Đã lưu' : filterType}
            {showFilterMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 shadow-lg rounded-lg py-1 z-10 border border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setFilterType('all');
                    setShowFilterMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Tất cả thực đơn
                </button>
                <button
                  onClick={() => {
                    setFilterType('active');
                    setShowFilterMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Đang theo dõi
                </button>
                <button
                  onClick={() => {
                    setFilterType('bookmarked');
                    setShowFilterMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Đã lưu
                </button>
                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                <button
                  onClick={() => {
                    setFilterType('Giảm cân');
                    setShowFilterMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Giảm cân
                </button>
                <button
                  onClick={() => {
                    setFilterType('Tăng cơ');
                    setShowFilterMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Tăng cơ
                </button>
                <button
                  onClick={() => {
                    setFilterType('Keto');
                    setShowFilterMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Keto
                </button>
                <button
                  onClick={() => {
                    setFilterType('Ăn sạch');
                    setShowFilterMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Ăn sạch
                </button>
              </div>
            )}
          </button>
        </div>
      </div>
      
      {/* Meal Plans Grid */}
      {filteredMealPlans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMealPlans.map((plan) => (
            <div 
              key={plan.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
            >
              <div className="relative">
                <img 
                  src={plan.image} 
                  alt={plan.title} 
                  className="w-full h-40 object-cover"
                />
                <div className="absolute top-2 right-2 flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleBookmark(plan.id);
                    }}
                    className={`p-2 rounded-full ${
                      plan.bookmarked 
                        ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-gray-800/40 text-white hover:bg-gray-800/60'
                    }`}
                    aria-label={plan.bookmarked ? 'Bỏ lưu' : 'Lưu'}
                  >
                    <FaBookmark />
                  </button>
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Toggle menu
                      }}
                      className="p-2 rounded-full bg-gray-800/40 text-white hover:bg-gray-800/60"
                      aria-label="Menu"
                    >
                      <FaEllipsisV />
                    </button>
                    {/* Dropdown menu would go here */}
                  </div>
                </div>
                <div className="absolute top-2 left-2">
                  <span className="px-2 py-1 text-xs bg-blue-600/90 text-white rounded-lg">
                    {plan.type}
                  </span>
                </div>
                {plan.active && (
                  <div className="absolute bottom-0 left-0 right-0 bg-green-600/90 text-white py-1 text-center text-sm">
                    Đang theo dõi
                  </div>
                )}
              </div>
              <div className="p-4">
                <h2 
                  className="text-lg font-semibold text-gray-900 dark:text-white mb-1 cursor-pointer hover:text-green-600 dark:hover:text-green-400"
                  onClick={() => navigate(`/meal-plan/${plan.id}`)}
                >
                  {plan.title}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {plan.description}
                </p>
                
                <div className="flex items-center mb-4">
                  <img 
                    src={plan.authorAvatar} 
                    alt={plan.author} 
                    className="w-6 h-6 rounded-full mr-2"
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {plan.author} · {new Date(plan.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center p-1.5 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <FaRegCalendarAlt className="mx-auto text-blue-500 dark:text-blue-400 mb-1" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">Thời gian</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{plan.duration} ngày</p>
                  </div>
                  <div className="text-center p-1.5 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <FaUtensils className="mx-auto text-green-500 dark:text-green-400 mb-1" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">Bữa ăn</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">4 bữa/ngày</p>
                  </div>
                  <div className="text-center p-1.5 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <FaFire className="mx-auto text-orange-500 dark:text-orange-400 mb-1" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">Calo</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{plan.totalCalories}</p>
                  </div>
                </div>
                
                {plan.active ? (
                  <div>
                    <div className="mb-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600 dark:text-gray-400">Tiến độ</span>
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          {plan.daysCompleted}/{plan.duration} ngày ({plan.progress}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                        <div 
                          className="bg-green-600 h-1.5 rounded-full" 
                          style={{ width: `${plan.progress}%` }}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/schedule/my-eat-schedule')}
                      className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors flex items-center justify-center"
                    >
                      <FaCheck className="mr-1" /> Xem lịch ăn
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleStartPlan(plan.id)}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                  >
                    Bắt đầu ngay
                  </button>
                )}
                
                <div className="flex justify-between items-center mt-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleLike(plan.id);
                    }}
                    className={`flex items-center text-sm ${
                      plan.liked 
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400'
                    }`}
                  >
                    <FaHeart className="mr-1" /> {plan.likes}
                  </button>
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/schedule/eat-plan/edit/${plan.id}`);
                      }}
                      className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full"
                      aria-label="Chỉnh sửa"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Share functionality
                      }}
                      className="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full"
                      aria-label="Chia sẻ"
                    >
                      <FaShare />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md">
          <FaSearch className="mx-auto text-gray-400 text-4xl mb-4" />
          <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            Không tìm thấy thực đơn
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Không tìm thấy thực đơn phù hợp với tìm kiếm hoặc bộ lọc của bạn.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterType('all');
            }}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            Xóa bộ lọc
          </button>
        </div>
      )}
    </div>
  );
}