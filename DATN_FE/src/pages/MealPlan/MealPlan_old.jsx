import { useState, useEffect, useRef } from 'react'
import { FaPlus, FaUtensils, FaSortAmountDown, FaFilter, FaCalendarAlt, FaTimes } from 'react-icons/fa'
import { IoMdTime } from 'react-icons/io'
import { useNavigate } from 'react-router-dom'
import { AiOutlineSearch } from 'react-icons/ai'
import CreateMealPlanModal from './components/CreateMealPlanModal/CreateMealPlanModal'
import MealPlanCard from './components/MealPlanCard/MealPlanCard'
import { useMealPlans } from '../../hooks/useMealPlans'

export default function MealPlan() {
  const navigate = useNavigate()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState({
    sort_by: 'created_at',
    sort_order: 'desc',
    duration_filter: '',
    category: '',
    page: 1,
    limit: 12
  })
  const createModalRef = useRef(null)

  // Sử dụng custom hook
  const {
    mealPlans,
    loading,
    error,
    pagination,
    fetchMealPlans,
    createMealPlan,
    likeMealPlan,
    unlikeMealPlan,
    bookmarkMealPlan,
    unbookmarkMealPlan
  } = useMealPlans()

  // Fetch dữ liệu khi component mount và khi filter thay đổi
  useEffect(() => {
    const params = {
      page: filter.page,
      limit: filter.limit,
      sort_by: filter.sort_by,
      sort_order: filter.sort_order,
      search: searchTerm || undefined,
      category: filter.category || undefined,
      duration_filter: filter.duration_filter || undefined
    }

    // Debounce search
    const timeoutId = setTimeout(() => {
      fetchMealPlans(params)
    }, searchTerm ? 500 : 0)

    return () => clearTimeout(timeoutId)
  }, [filter, searchTerm, fetchMealPlans])

  // Convert category name to category ID (based on API enum)
  const getCategoryId = (categoryName) => {
    const categoryMap = {
      'giảm cân': 1,
      'tăng cân': 2,
      'ăn sạch': 3,
      'thuần chay': 4,
      'gia đình': 5,
      'keto': 6,
      'tăng cơ': 7
    }
    return categoryMap[categoryName.toLowerCase()]
  }

  // Xử lý click bên ngoài modal để đóng
  useEffect(() => {
    function handleClickOutside(event) {
      if (createModalRef.current && !createModalRef.current.contains(event.target)) {
        setShowCreateModal(false);
      }
    }
    if (showCreateModal) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCreateModal]);

  const handleOpenCreateModal = () => {
    setShowCreateModal(true);
  }

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
  }

  const handleFilterChange = (type, value) => {
    let newFilter = { ...filter, page: 1 } // Reset về trang đầu khi filter

    if (type === 'sort') {
      if (value === 'newest') {
        newFilter.sort_by = 'created_at'
        newFilter.sort_order = 'desc'
      } else if (value === 'oldest') {
        newFilter.sort_by = 'created_at'
        newFilter.sort_order = 'asc'
      } else if (value === 'popular') {
        newFilter.sort_by = 'total_likes'
        newFilter.sort_order = 'desc'
      }
    } else if (type === 'duration') {
      newFilter.duration_filter = value === 'all' ? '' : value
    } else if (type === 'category') {
      newFilter.category = value === 'all' ? '' : getCategoryId(value)
    }

    setFilter(newFilter)
  }

  const handleLoadMore = () => {
    if (pagination.current_page < pagination.total_pages) {
      setFilter(prev => ({
        ...prev,
        page: prev.page + 1
      }))
    }
  }

  const handleMealPlanAction = async (action, planId, data = {}) => {
    switch (action) {
      case 'like':
        await likeMealPlan(planId)
        break
      case 'unlike':
        await unlikeMealPlan(planId)
        break
      case 'bookmark':
        await bookmarkMealPlan(planId, data.folder_name, data.notes)
        break
      case 'unbookmark':
        await unbookmarkMealPlan(planId)
        break
      default:
        break
    }
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 col-span-full lg:col-span-2">
            {/* Sort filter */}
            <div className="relative w-full">
              <select
                className="appearance-none w-full pl-10 pr-8 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 text-sm"
                value={`${filter.sort_by}_${filter.sort_order}`}
                onChange={(e) => {
                  const [sort_by, sort_order] = e.target.value.split('_')
                  if (sort_by === 'created' && sort_order === 'desc') {
                    handleFilterChange('sort', 'newest')
                  } else if (sort_by === 'created' && sort_order === 'asc') {
                    handleFilterChange('sort', 'oldest')
                  } else if (sort_by === 'total' && sort_order === 'desc') {
                    handleFilterChange('sort', 'popular')
                  }
                }}
              >
                <option value="created_at_desc">Mới nhất</option>
                <option value="created_at_asc">Cũ nhất</option>
                <option value="total_likes_desc">Phổ biến nhất</option>
              </select>
              <FaSortAmountDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none" />
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="w-4 h-4 fill-current text-gray-500 dark:text-gray-400" viewBox="0 0 20 20">
                  <path d="M5.516 7.548c.436-.446 1.043-.481 1.576 0L10 10.405l2.908-2.857c.533-.481 1.141-.446 1.574 0 .436.445.408 1.197 0 1.615l-3.71 3.916c-.533.531-1.391.531-1.924 0l-3.71-3.916c-.408-.418-.436-1.17 0-1.615z"/>
                </svg>
              </div>
            </div>

            {/* Duration filter */}
            <div className="relative w-full">
              <select
                className="appearance-none w-full pl-10 pr-8 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 text-sm"
                value={filter.duration_filter}
                onChange={(e) => handleFilterChange('duration', e.target.value)}
              >
                <option value="">Tất cả thời gian</option>
                <option value="short">Ngắn (≤ 3 ngày)</option>
                <option value="medium">Trung bình (4-7 ngày)</option>
                <option value="long">Dài ({'>'} 7 ngày)</option>
              </select>
              <IoMdTime className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none" />
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="w-4 h-4 fill-current text-gray-500 dark:text-gray-400" viewBox="0 0 20 20">
                  <path d="M5.516 7.548c.436-.446 1.043-.481 1.576 0L10 10.405l2.908-2.857c.533-.481 1.141-.446 1.574 0 .436.445.408 1.197 0 1.615l-3.71 3.916c-.533.531-1.391.531-1.924 0l-3.71-3.916c-.408-.418-.436-1.17 0-1.615z"/>
                </svg>
              </div>
            </div>

            {/* Category filter */}
            <div className="relative w-full">
              <select
                className="appearance-none w-full pl-10 pr-8 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 text-sm"
                value={filter.category || 'all'}
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <option value="all">Tất cả loại</option>
                <option value="giảm cân">Giảm cân</option>
                <option value="tăng cân">Tăng cân</option>
                <option value="ăn sạch">Ăn sạch</option>
                <option value="thuần chay">Thuần chay</option>
                <option value="gia đình">Gia đình</option>
                <option value="keto">Keto</option>
                <option value="tăng cơ">Tăng cơ</option>
              </select>
              <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none" />
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="w-4 h-4 fill-current text-gray-500 dark:text-gray-400" viewBox="0 0 20 20">
                  <path d="M5.516 7.548c.436-.446 1.043-.481 1.576 0L10 10.405l2.908-2.857c.533-.481 1.141-.446 1.574 0 .436.445.408 1.197 0 1.615l-3.71 3.916c-.533.531-1.391.531-1.924 0l-3.71-3.916c-.408-.418-.436-1.17 0-1.615z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
            </div>

            {/* Duration filter */}
            <div className="relative w-full">
              <select
                className="appearance-none w-full pl-10 pr-8 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 text-sm"
                value={filter.duration}
                onChange={(e) => handleFilterChange('duration', e.target.value)}
              >
                <option value="all">Tất cả thời gian</option>
                <option value="short">Ngắn (≤ 3 ngày)</option>
                <option value="medium">Trung bình (4-7 ngày)</option>
                <option value="long">Dài ({'>'} 7 ngày)</option>
              </select>
              <IoMdTime className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none" />
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="w-4 h-4 fill-current text-gray-500 dark:text-gray-400" viewBox="0 0 20 20"><path d="M5.516 7.548c.436-.446 1.043-.481 1.576 0L10 10.405l2.908-2.857c.533-.481 1.141-.446 1.574 0 .436.445.408 1.197 0 1.615l-3.71 3.916c-.533.531-1.391.531-1.924 0l-3.71-3.916c-.408-.418-.436-1.17 0-1.615z"/></svg>
              </div>
            </div>

            {/* Category filter */}
            <div className="relative w-full">
              <select
                className="appearance-none w-full pl-10 pr-8 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 text-sm"
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
              <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none" />
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="w-4 h-4 fill-current text-gray-500 dark:text-gray-400" viewBox="0 0 20 20"><path d="M5.516 7.548c.436-.446 1.043-.481 1.576 0L10 10.405l2.908-2.857c.533-.481 1.141-.446 1.574 0 .436.445.408 1.197 0 1.615l-3.71 3.916c-.533.531-1.391.531-1.924 0l-3.71-3.916c-.408-.418-.436-1.17 0-1.615z"/></svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-20">
          <div className="text-red-500 mb-4">Đã xảy ra lỗi: {error}</div>
          <button 
            onClick={() => fetchMealPlans()}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Meal Plans Grid */}
      {!loading && !error && (
        <>
          {mealPlans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mealPlans.map(plan => (
                <MealPlanCard 
                  key={plan._id} 
                  plan={plan} 
                  onClick={() => navigate(`/meal-plan/${plan._id}`)}
                  onAction={handleMealPlanAction}
                />
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

          {/* Load more button */}
          {pagination && pagination.current_page < pagination.total_pages && (
            <div className="flex justify-center mt-8">
              <button 
                onClick={handleLoadMore}
                disabled={loading}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Đang tải...' : 'Xem thêm'}
              </button>
            </div>
          )}
        </>
      )}

      {/* Create Meal Plan Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center transform translate-x-20">
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm" 
            onClick={() => setShowCreateModal(false)}
          ></div>
          
          {/* Modal Content */}
          <div 
            ref={createModalRef} 
            className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl mx-auto my-4 z-20 max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <FaPlus className="mr-2 text-green-500" /> Tạo Thực Đơn Mới
              </h2>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <FaTimes size={20} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-4 sm:p-6">
              {/* Nội dung form tạo thực đơn */}
              <CreateMealPlanModal onClose={handleCloseCreateModal} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 