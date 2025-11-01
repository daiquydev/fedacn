import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBookmark, FaCalendarAlt, FaSearch, FaFilter, FaTimes, FaListUl } from 'react-icons/fa';
import { toast } from 'react-toastify';
import MealPlanCard from './components/MealPlanCard';
import { getBookmarkedMealPlans, unbookmarkMealPlan, applyMealPlan } from '../../../services/mealPlanService';
import { getImageUrl } from '../../../utils/imageUrl';

export default function MySavedMealPlans() {
  const navigate = useNavigate();
  const [savedMealPlans, setSavedMealPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedMealPlan, setSelectedMealPlan] = useState(null);
  const [startDate, setStartDate] = useState(getCurrentDate());
  const [applying, setApplying] = useState(false);

  // Hàm lấy ngày hiện tại theo định dạng YYYY-MM-DD
  function getCurrentDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Fetch bookmarked meal plans từ API
  useEffect(() => {
    const fetchBookmarkedMealPlans = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getBookmarkedMealPlans();
        
        // Transform data để match với UI
        const transformedPlans = response.data.result.meal_plans.map(plan => ({
          id: plan._id,
          title: plan.title,
          image: plan.image ? getImageUrl(plan.image) : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
          description: plan.description,
          duration: plan.duration,
          category: plan.category,
          calories: plan.nutrition_info?.total_calories || 0,
          savedAt: plan.bookmarked_at || plan.created_at,
          isApplied: false, // Sẽ được cập nhật từ applied meal plans
          author: {
            name: plan.author_id?.name || plan.author_id?.username || 'Unknown',
            avatar: plan.author_id?.avatar ? getImageUrl(plan.author_id.avatar) : 'https://randomuser.me/api/portraits/men/32.jpg'
          }
        }));
        
        setSavedMealPlans(transformedPlans);
      } catch (error) {
        console.error('Error fetching bookmarked meal plans:', error);
        setError('Không thể tải danh sách thực đơn đã lưu. Vui lòng thử lại.');
        toast.error('Không thể tải danh sách thực đơn đã lưu');
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarkedMealPlans();
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
  const confirmApply = async () => {
    if (!selectedMealPlan) return;
    
    try {
      setApplying(true);
      await applyMealPlan(
        selectedMealPlan.id,
        selectedMealPlan.title,
        startDate
      );
      
      // Cập nhật trạng thái trong state
      setSavedMealPlans(prev => 
        prev.map(plan => 
          plan.id === selectedMealPlan.id 
            ? {...plan, isApplied: true, startDate, progress: 0} 
            : plan
        )
      );
      
      toast.success('Áp dụng thực đơn thành công!');
      setShowApplyModal(false);
      navigate('/schedule/eat-schedule');
    } catch (error) {
      console.error('Error applying meal plan:', error);
      toast.error('Không thể áp dụng thực đơn. Vui lòng thử lại.');
    } finally {
      setApplying(false);
    }
  };

  // Xử lý xóa thực đơn đã lưu
  const handleRemoveSavedMealPlan = async (id) => {
    try {
      await unbookmarkMealPlan(id);
      setSavedMealPlans(prev => prev.filter(plan => plan.id !== id));
      toast.success('Đã xóa thực đơn khỏi danh sách lưu');
    } catch (error) {
      console.error('Error removing saved meal plan:', error);
      toast.error('Không thể xóa thực đơn. Vui lòng thử lại.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Đang tải thực đơn đã lưu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaTimes className="text-red-600 dark:text-red-400 text-3xl" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Có lỗi xảy ra</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            Thử lại
          </button>
        </div>
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
                disabled={applying}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors flex justify-center items-center"
              >
                {applying ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Đang áp dụng...
                  </>
                ) : (
                  <>
                    <FaCalendarAlt className="mr-2" />
                    Áp dụng thực đơn
                  </>
                )}
              </button>
              <button 
                onClick={() => setShowApplyModal(false)}
                disabled={applying}
                className="w-full py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 text-gray-800 dark:text-gray-200 rounded-lg font-medium transition-colors"
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