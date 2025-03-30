import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBookmark, FaCalendarAlt, FaSearch, FaFilter, FaTimes, FaListUl } from 'react-icons/fa';
import MealPlanCard from './components/MealPlanCard';

export default function MySavedMealPlans() {
  const navigate = useNavigate();
  const [savedMealPlans, setSavedMealPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedMealPlan, setSelectedMealPlan] = useState(null);
  const [startDate, setStartDate] = useState(getCurrentDate());

  // Hàm lấy ngày hiện tại theo định dạng YYYY-MM-DD
  function getCurrentDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Mô phỏng fetch dữ liệu
  useEffect(() => {
    // Trong ứng dụng thực tế, đây sẽ là API call
    setTimeout(() => {
      const mockData = [
        {
          id: 1,
          title: 'Thực đơn giảm cân 7 ngày',
          image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
          description: 'Thực đơn giảm cân lành mạnh với đầy đủ dinh dưỡng cho 7 ngày',
          duration: 7,
          category: 'Giảm cân',
          calories: 1500,
          savedAt: '2024-01-15T10:30:00Z',
          isApplied: false,
          author: {
            name: 'Nguyễn Văn A',
            avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
          }
        },
        {
          id: 2,
          title: 'Thực đơn tăng cơ 14 ngày',
          image: 'https://images.unsplash.com/photo-1547592180-85f173990554',
          description: 'Thực đơn tăng cơ giàu protein, đầy đủ dinh dưỡng',
          duration: 14,
          category: 'Tăng cơ',
          calories: 2500,
          savedAt: '2024-01-20T14:15:00Z',
          isApplied: true,
          progress: 30, // % hoàn thành
          startDate: '2024-01-25T00:00:00Z',
          endDate: '2024-02-08T00:00:00Z',
          author: {
            name: 'Trần Văn B',
            avatar: 'https://randomuser.me/api/portraits/men/44.jpg'
          }
        },
        {
          id: 3,
          title: 'Thực đơn Eat Clean 30 ngày',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd',
          description: 'Thực đơn Eat Clean với nguyên liệu tươi sạch, không chế biến',
          duration: 30,
          category: 'Eat Clean',
          calories: 1800,
          savedAt: '2024-01-10T09:45:00Z',
          isApplied: false,
          author: {
            name: 'Lê Thị C',
            avatar: 'https://randomuser.me/api/portraits/women/32.jpg'
          }
        }
      ];
      setSavedMealPlans(mockData);
      setLoading(false);
    }, 800);
  }, []);

  // Lọc danh sách thực đơn dựa trên filter và search
  const filteredMealPlans = savedMealPlans.filter(plan => {
    const matchesFilter = 
      activeFilter === 'all' || 
      (activeFilter === 'applied' && plan.isApplied) ||
      (activeFilter === 'not-applied' && !plan.isApplied);
    
    const matchesSearch = plan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  // Xử lý áp dụng thực đơn
  const handleApplyMealPlan = (plan) => {
    setSelectedMealPlan(plan);
    setShowApplyModal(true);
  };

  // Xác nhận áp dụng thực đơn
  const confirmApply = () => {
    // API call để áp dụng thực đơn
    console.log(`Áp dụng thực đơn ID ${selectedMealPlan.id} từ ngày ${startDate}`);
    
    // Cập nhật trạng thái trong state
    setSavedMealPlans(prev => 
      prev.map(plan => 
        plan.id === selectedMealPlan.id 
          ? {...plan, isApplied: true, startDate, progress: 0} 
          : plan
      )
    );
    
    setShowApplyModal(false);
    navigate('/schedule/eat-schedule');
  };

  // Xử lý xóa thực đơn đã lưu
  const handleRemoveSavedMealPlan = (id) => {
    // API call để xóa thực đơn đã lưu
    setSavedMealPlans(prev => prev.filter(plan => plan.id !== id));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6 px-4 md:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
          <FaBookmark className="mr-2 text-green-600" /> Thực đơn của tôi
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Quản lý các thực đơn đã lưu và theo dõi tiến trình
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Tìm kiếm thực đơn..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setSearchTerm('')}
            >
              <FaTimes className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" />
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2">
          <FaFilter className="text-gray-500 dark:text-gray-400" />
          <select
            className="bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white"
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
          >
            <option value="all">Tất cả thực đơn</option>
            <option value="applied">Đã áp dụng</option>
            <option value="not-applied">Chưa áp dụng</option>
          </select>
        </div>
      </div>

      {/* Meal Plans List */}
      {filteredMealPlans.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMealPlans.map((plan) => (
            <MealPlanCard
              key={plan.id}
              mealPlan={plan}
              onApply={() => handleApplyMealPlan(plan)}
              onRemove={() => handleRemoveSavedMealPlan(plan.id)}
              onView={() => navigate(`/meal-plan/${plan.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 text-center">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaListUl className="text-gray-500 dark:text-gray-400 text-3xl" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Chưa có thực đơn nào được lưu
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Hãy khám phá và lưu các thực đơn phù hợp với mục tiêu của bạn
          </p>
          <button
            onClick={() => navigate('/meal-plan')}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            Khám phá thực đơn
          </button>
        </div>
      )}

      {/* Modal Áp dụng thực đơn */}
      {showApplyModal && selectedMealPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Áp dụng thực đơn</h3>
              <button 
                onClick={() => setShowApplyModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <FaTimes size={24} />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCalendarAlt className="text-blue-600 dark:text-blue-400 text-3xl" />
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-4 text-center">
                Chọn ngày bắt đầu áp dụng "{selectedMealPlan.title}"
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ngày bắt đầu:
                </label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={getCurrentDate()}
                  className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg mb-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  Thực đơn này sẽ kéo dài {selectedMealPlan.duration} ngày, từ ngày {new Date(startDate).toLocaleDateString('vi-VN')} đến ngày {new Date(new Date(startDate).setDate(new Date(startDate).getDate() + selectedMealPlan.duration - 1)).toLocaleDateString('vi-VN')}.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col space-y-3">
              <button 
                onClick={confirmApply}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex justify-center items-center"
              >
                <FaCalendarAlt className="mr-2" />
                Áp dụng thực đơn
              </button>
              <button 
                onClick={() => setShowApplyModal(false)}
                className="w-full py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium transition-colors"
              >
                Để sau
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 