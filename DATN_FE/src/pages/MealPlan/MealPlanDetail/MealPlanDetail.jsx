import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FaArrowLeft, FaRegHeart, FaHeart, FaRegComment, FaCheckCircle, FaRegClock, FaShare, FaStar, FaPrint, FaBookmark, FaRegBookmark, FaCalendarAlt, FaCheckSquare, FaBell, FaClipboardList, FaUtensils, FaFire, FaInfoCircle } from 'react-icons/fa'
import { MdFastfood, MdClose, MdSchedule, MdDateRange } from 'react-icons/md'
import { IoMdTime } from 'react-icons/io'
import { toast } from 'react-toastify'
import NutritionChart from './components/NutritionChart'
import DayMealPlan from './components/DayMealPlan'
import Comments from './components/Comments/Comments'
import { getMealPlanDetail, likeMealPlan, unlikeMealPlan, bookmarkMealPlan, unbookmarkMealPlan, applyMealPlan } from '../../../services/mealPlanService'
import { getImageUrl } from '../../../utils/imageUrl'
import { MEAL_PLAN_CATEGORIES } from '../../../constants/mealPlan'

export default function MealPlanDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [mealPlan, setMealPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeDay, setActiveDay] = useState(1)
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  
  // Thêm các state mới
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [startDate, setStartDate] = useState(getCurrentDate())
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [bookmarkData, setBookmarkData] = useState({
    folder_name: '',
    notes: ''
  })
  
  // Thêm state để quản lý modal cách chế biến
  const [showCookingModal, setShowCookingModal] = useState(false)
  const [activeMeal, setActiveMeal] = useState(null)

  // Fetch meal plan data from API
  useEffect(() => {
    const fetchMealPlan = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await getMealPlanDetail(id)
        const mealPlanData = response.data.result
        
        // Transform API data to match component structure
        const transformedData = {
          id: mealPlanData._id,
          title: mealPlanData.title,
          description: mealPlanData.description,
          author: {
            id: mealPlanData.author_id._id,
            name: mealPlanData.author_id.name,
            avatar: getImageUrl(mealPlanData.author_id.avatar) || 'https://randomuser.me/api/portraits/men/32.jpg',
            isVerified: false // You can add this logic based on your backend
          },
          duration: mealPlanData.duration,
          category: MEAL_PLAN_CATEGORIES[mealPlanData.category] || 'Khác',
          likes: mealPlanData.likes_count,
          comments: mealPlanData.comments_count,
          rating: mealPlanData.rating || 0,
          ratingCount: mealPlanData.rating_count || 0,
          createdAt: mealPlanData.createdAt,
          image: getImageUrl(mealPlanData.image) || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
          notes: mealPlanData.description, // Use description as notes for now
          averageNutrition: {
            calories: mealPlanData.target_calories || calculateAverageNutrition(mealPlanData.days).calories,
            protein: mealPlanData.target_protein || calculateAverageNutrition(mealPlanData.days).protein,
            carbs: mealPlanData.target_carbs || calculateAverageNutrition(mealPlanData.days).carbs,
            fat: mealPlanData.target_fat || calculateAverageNutrition(mealPlanData.days).fat
          },
          days: mealPlanData.days.map(day => ({
            id: day._id,
            day: day.day_number,
            meals: day.meals.map(meal => ({
              type: getMealTypeName(meal.meal_type),
              content: meal.name,
              calories: meal.calories || 0,
              protein: meal.protein || 0,
              carbs: meal.carbs || 0,
              fat: meal.fat || 0,
              image: getImageUrl(meal.image) || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
              cooking: meal.instructions || '<p>Hướng dẫn chế biến sẽ được cập nhật sớm.</p>'
            }))
          }))
        }
        
        setMealPlan(transformedData)
        setLikesCount(transformedData.likes)
        setLiked(mealPlanData.is_liked || false)
        setSaved(mealPlanData.is_bookmarked || false)
        setLoading(false)
      } catch (err) {
        setError('Không thể tải thông tin thực đơn. Vui lòng thử lại sau.')
        setLoading(false)
        toast.error('Không thể tải thông tin thực đơn')
      }
    }

    if (id) {
      fetchMealPlan()
    }
  }, [id])

  // Helper function to calculate average nutrition from days
  const calculateAverageNutrition = (days) => {
    if (!days || days.length === 0) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 }
    }

    const totalNutrition = days.reduce((total, day) => {
      const dayNutrition = day.meals.reduce((dayTotal, meal) => ({
        calories: dayTotal.calories + (meal.calories || 0),
        protein: dayTotal.protein + (meal.protein || 0),
        carbs: dayTotal.carbs + (meal.carbs || 0),
        fat: dayTotal.fat + (meal.fat || 0)
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

      return {
        calories: total.calories + dayNutrition.calories,
        protein: total.protein + dayNutrition.protein,
        carbs: total.carbs + dayNutrition.carbs,
        fat: total.fat + dayNutrition.fat
      }
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 })

    return {
      calories: Math.round(totalNutrition.calories / days.length),
      protein: Math.round(totalNutrition.protein / days.length),
      carbs: Math.round(totalNutrition.carbs / days.length),
      fat: Math.round(totalNutrition.fat / days.length)
    }
  }

  // Helper function to convert meal type number to name
  const getMealTypeName = (mealType) => {
    const mealTypeMap = {
      1: 'Sáng',
      2: 'Trưa', 
      3: 'Tối',
      4: 'Xế'
    }
    return mealTypeMap[mealType] || 'Khác'
  }

  // Hàm lấy ngày hiện tại theo format YYYY-MM-DD
  function getCurrentDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const handleLike = async () => {
    try {
      if (liked) {
        await mealPlanApi.unlikeMealPlan(id)
        setLikesCount(prev => Math.max(prev - 1, 0))
        setLiked(false)
        toast.success('Đã bỏ thích thực đơn!')
      } else {
        await mealPlanApi.likeMealPlan(id)
        setLikesCount(prev => prev + 1)
        setLiked(true)
        toast.success('Đã thích thực đơn!')
      }
    } catch (err) {
      toast.error('Không thể thực hiện thao tác này')
    }
  }

  // Cập nhật hàm handleSave để mở modal
  const handleSave = () => {
    if (!saved) {
      setShowSaveModal(true)
    } else {
      handleUnsave()
    }
  }

  // Hàm bỏ lưu thực đơn
  const handleUnsave = async () => {
    try {
      await mealPlanApi.unbookmarkMealPlan(id)
      setSaved(false)
      toast.success('Đã bỏ lưu thực đơn!')
    } catch (err) {
      toast.error('Không thể bỏ lưu thực đơn')
    }
  }

  // Xác nhận lưu thực đơn
  const confirmSave = async () => {
    try {
      await mealPlanApi.bookmarkMealPlan(id, bookmarkData.folder_name, bookmarkData.notes)
      setSaved(true)
      setShowSaveModal(false)
      setBookmarkData({ folder_name: '', notes: '' }) // Reset form
      toast.success('Đã lưu thực đơn!')
    } catch (err) {
      toast.error('Không thể lưu thực đơn')
    }
  }

  // Mở modal áp dụng thực đơn
  const openApplyModal = () => {
    setShowSaveModal(false);
    setShowApplyModal(true);
  };

  // Xác nhận áp dụng thực đơn
  const confirmApply = async () => {
    try {
      await mealPlanApi.applyMealPlan(id, { start_date: startDate })
      setShowApplyModal(false)
      setShowSuccessModal(true)
      toast.success('Đã áp dụng thực đơn thành công!')
    } catch (err) {
      toast.error('Không thể áp dụng thực đơn')
    }
  }

  // Chuyển hướng đến trang lịch thực đơn
  const goToMealSchedule = () => {
    setShowSuccessModal(false);
    navigate('/schedule/my-eat-schedule');
  };

  const handleShare = () => {
    // Implement share functionality here
    alert('Tính năng chia sẻ đang được phát triển');
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }).format(date);
  };

  // Hàm mở modal cách chế biến
  const handleOpenCookingModal = (meal) => {
    setActiveMeal(meal);
    setShowCookingModal(true);
  };

  // Hàm đóng modal cách chế biến
  const handleCloseCookingModal = () => {
    setShowCookingModal(false);
    setActiveMeal(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={() => navigate('/meal-plan')}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow"
          >
            Quay lại danh sách thực đơn
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6 px-4 md:px-6 print:px-0">
      {/* Back button - hide when printing */}
      <button 
        onClick={() => navigate('/meal-plan')}
        className="mb-6 flex items-center text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 print:hidden"
      >
        <FaArrowLeft className="mr-2" /> Quay lại danh sách thực đơn
      </button>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content - 2/3 width on desktop */}
        <div className="lg:col-span-2">
          {/* Header with image */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden mb-6">
            <div className="relative h-64 md:h-80">
              <img 
                src={mealPlan.image} 
                alt={mealPlan.title} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-6">
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  {mealPlan.title}
                </h1>
                <div className="flex items-center text-white mb-2">
                  <div className="flex mr-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FaStar 
                        key={star}
                        className={`w-4 h-4 ${star <= Math.round(mealPlan.rating) ? 'text-yellow-400' : 'text-gray-400'}`}
                      />
                    ))}
                    <span className="ml-1 text-sm">{mealPlan.rating} ({mealPlan.ratingCount})</span>
                  </div>
                  <span className="flex items-center text-sm mr-4">
                    <IoMdTime className="mr-1" /> {mealPlan.duration} ngày
                  </span>
                  <span className="text-sm bg-green-600 px-2 py-1 rounded-full">
                    {mealPlan.category}
                  </span>
                </div>
                <div className="flex items-center">
                  <img 
                    src={mealPlan.author.avatar} 
                    alt={mealPlan.author.name} 
                    className="w-8 h-8 rounded-full mr-2"
                  />
                  <div>
                    <div className="flex items-center">
                      <span className="text-white text-sm">{mealPlan.author.name}</span>
                      {mealPlan.author.isVerified && (
                        <FaCheckCircle className="ml-1 text-blue-500 w-3 h-3" />
                      )}
                    </div>
                    <span className="text-gray-300 text-xs">
                      {formatDate(mealPlan.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Description */}
            <div className="p-6">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {mealPlan.description}
              </p>
              
              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 print:hidden">
                <button 
                  onClick={handleLike}
                  className="flex items-center px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {liked ? (
                    <FaHeart className="mr-1 text-red-500" />
                  ) : (
                    <FaRegHeart className="mr-1" />
                  )}
                  <span>{likesCount}</span>
                </button>
                
                <button className="flex items-center px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <FaRegComment className="mr-1" />
                  <span>{mealPlan.comments}</span>
                </button>
                
                <button 
                  onClick={handleSave}
                  className="flex items-center px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {saved ? (
                    <FaBookmark className="mr-1 text-green-500" />
                  ) : (
                    <FaRegBookmark className="mr-1" />
                  )}
                  <span>{saved ? "Đã lưu" : "Lưu"}</span>
                </button>
                
                <button 
                  onClick={handleShare}
                  className="flex items-center px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <FaShare className="mr-1" />
                  <span>Chia sẻ</span>
                </button>
                
                <button 
                  onClick={handlePrint}
                  className="flex items-center px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <FaPrint className="mr-1" />
                  <span>In</span>
                </button>
                
                {/* Nút áp dụng thực đơn - chỉ hiển thị khi đã lưu */}
                {saved && (
                  <button 
                    onClick={() => setShowApplyModal(true)}
                    className="flex items-center px-3 py-1.5 rounded-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    <FaCalendarAlt className="mr-1" />
                    <span>Áp dụng thực đơn</span>
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Notes section */}
          {mealPlan.notes && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Ghi chú</h2>
              <div 
                className="prose max-w-none dark:prose-invert" 
                dangerouslySetInnerHTML={{ __html: mealPlan.notes }}
              />
            </div>
          )}
          
          {/* Daily meal plans */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <MdFastfood className="mr-2 text-green-600" /> Kế hoạch bữa ăn theo ngày
            </h2>
            
            {/* Thay đổi từ nút ngày sang select dropdown */}
            <div className="mb-6">
              <div className="max-w-xs mx-auto">
                <label htmlFor="day-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Chọn ngày thực đơn (Tổng số ngày: {mealPlan.duration})
                </label>
                <div className="relative">
                  <select
                    id="day-select"
                    className="block w-full p-3 pl-4 pr-10 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:focus:ring-green-600 dark:focus:border-green-600 appearance-none transition-colors"
                    value={activeDay}
                    onChange={(e) => setActiveDay(Number(e.target.value))}
                  >
                    {mealPlan.days.map((day) => (
                      <option key={day.day} value={day.day}>
                        Ngày {day.day} - {day.day === 1 ? 'Bắt đầu' : day.day === mealPlan.duration ? 'Kết thúc' : `Ngày ${day.day}/${mealPlan.duration}`}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                </div>
                {/* <div className="mt-2 flex flex-wrap gap-2">
                  {mealPlan.days.map((day) => (
                    <button 
                      key={day.day}
                      onClick={() => setActiveDay(day.day)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                        activeDay === day.day 
                          ? 'bg-green-600 text-white shadow-md' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {day.day}
                    </button>
                  ))}
                </div> */}
              </div>
            </div>
            
            {/* Active day meals */}
            {mealPlan.days.map((day) => (
              day.day === activeDay && (
                <DayMealPlan 
                  key={day.day} 
                  day={day} 
                  onViewCooking={handleOpenCookingModal} 
                />
              )
            ))}
          </div>
          
          {/* Comments section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <FaRegComment className="mr-2 text-green-600" /> Bình luận
            </h2>
            <Comments mealPlanId={id} />
          </div>
        </div>
        
        {/* Sidebar - 1/3 width on desktop */}
        <div className="lg:col-span-1 space-y-6">
          {/* Nutrition summary card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Thông tin dinh dưỡng</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Trung bình mỗi ngày
            </p>
            
            {/* Nutrition data */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Calories</p>
                <p className="text-xl font-bold text-gray-800 dark:text-white">{mealPlan.averageNutrition.calories}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">kcal/ngày</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Protein</p>
                <p className="text-xl font-bold text-gray-800 dark:text-white">{mealPlan.averageNutrition.protein}g</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{Math.round(mealPlan.averageNutrition.protein * 4 / mealPlan.averageNutrition.calories * 100)}%</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Carbs</p>
                <p className="text-xl font-bold text-gray-800 dark:text-white">{mealPlan.averageNutrition.carbs}g</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{Math.round(mealPlan.averageNutrition.carbs * 4 / mealPlan.averageNutrition.calories * 100)}%</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Chất béo</p>
                <p className="text-xl font-bold text-gray-800 dark:text-white">{mealPlan.averageNutrition.fat}g</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{Math.round(mealPlan.averageNutrition.fat * 9 / mealPlan.averageNutrition.calories * 100)}%</p>
              </div>
            </div>
            
            {/* Macro distribution chart */}
            <div className="h-64">
              <NutritionChart 
                protein={mealPlan.averageNutrition.protein} 
                carbs={mealPlan.averageNutrition.carbs} 
                fat={mealPlan.averageNutrition.fat} 
              />
            </div>
          </div>
          
          {/* Tips card */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-400 mb-3">
              Mẹo thực hiện thực đơn
            </h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="text-green-600 dark:text-green-400 mr-2">•</span>
                <span className="text-green-800 dark:text-green-300 text-sm">Chuẩn bị thực phẩm trước cho 2-3 ngày để tiết kiệm thời gian</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 dark:text-green-400 mr-2">•</span>
                <span className="text-green-800 dark:text-green-300 text-sm">Uống ít nhất 2 lít nước mỗi ngày</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 dark:text-green-400 mr-2">•</span>
                <span className="text-green-800 dark:text-green-300 text-sm">Kết hợp với 30 phút tập thể dục mỗi ngày để tăng hiệu quả</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 dark:text-green-400 mr-2">•</span>
                <span className="text-green-800 dark:text-green-300 text-sm">Điều chỉnh khẩu phần theo nhu cầu calo cá nhân</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 dark:text-green-400 mr-2">•</span>
                <span className="text-green-800 dark:text-green-300 text-sm">Thay thế thực phẩm bằng các lựa chọn tương tự nếu cần</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modal Lưu thực đơn */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Lưu thực đơn</h3>
              <button 
                onClick={() => setShowSaveModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <MdClose size={24} />
              </button>
            </div>
            
            <div className="mb-6 text-center">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaBookmark className="text-green-600 dark:text-green-400 text-3xl" />
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Lưu "{mealPlan.title}" vào danh sách thực đơn của bạn
              </p>
              
              {/* Form input */}
              <div className="space-y-4 text-left">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Thư mục (không bắt buộc)
                  </label>
                  <input
                    type="text"
                    value={bookmarkData.folder_name}
                    onChange={(e) => setBookmarkData(prev => ({ ...prev, folder_name: e.target.value }))}
                    placeholder="VD: Thực đơn giảm cân"
                    className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ghi chú (không bắt buộc)
                  </label>
                  <textarea
                    value={bookmarkData.notes}
                    onChange={(e) => setBookmarkData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="VD: Dành cho tháng 4"
                    rows={3}
                    className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex flex-col space-y-3">
              <button 
                onClick={confirmSave}
                className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                Lưu thực đơn
              </button>
              <button 
                onClick={openApplyModal}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Lưu và áp dụng ngay
              </button>
              <button 
                onClick={() => setShowSaveModal(false)}
                className="w-full py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium transition-colors"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Áp dụng thực đơn */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Áp dụng thực đơn</h3>
              <button 
                onClick={() => setShowApplyModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <MdClose size={24} />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <MdSchedule className="text-blue-600 dark:text-blue-400 text-3xl" />
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-4 text-center">
                Chọn ngày bắt đầu áp dụng "{mealPlan.title}"
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
                <div className="flex items-start">
                  <FaBell className="text-yellow-600 dark:text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    Bạn sẽ nhận được nhắc nhở hàng ngày về các bữa ăn theo thực đơn này. Bạn có thể điều chỉnh thiết lập nhắc nhở trong phần Cài đặt.
                  </p>
                </div>
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

      {/* Modal Áp dụng thành công */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCheckSquare className="text-green-600 dark:text-green-400 text-3xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Áp dụng thành công!
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Thực đơn "{mealPlan.title}" đã được áp dụng từ ngày {new Date(startDate).toLocaleDateString('vi-VN')}
              </p>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
              <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center">
                <FaClipboardList className="mr-2" /> Tiếp theo bạn có thể:
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
                  <span className="text-blue-800 dark:text-blue-300">Xem lịch thực đơn hàng ngày của bạn</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
                  <span className="text-blue-800 dark:text-blue-300">Đánh dấu các bữa ăn đã hoàn thành</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
                  <span className="text-blue-800 dark:text-blue-300">Ghi chú cảm nhận về mỗi món ăn</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
                  <span className="text-blue-800 dark:text-blue-300">Theo dõi tiến trình áp dụng thực đơn</span>
                </li>
              </ul>
            </div>
            
            <div className="flex flex-col space-y-3">
              <button 
                onClick={goToMealSchedule}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex justify-center items-center"
              >
                <MdDateRange className="mr-2" />
                Đi đến trang thực đơn của tôi
              </button>
              <button 
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium transition-colors"
              >
                Ở lại trang này
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal hiển thị cách chế biến */}
      {showCookingModal && activeMeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white dark:bg-gray-800 pb-2 border-b dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <FaUtensils className="text-green-600 mr-2" /> 
                Cách chế biến: {activeMeal.type}
              </h3>
              <button 
                onClick={handleCloseCookingModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <MdClose size={24} />
              </button>
            </div>
            
            <div className="mb-4">
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Thành phần:</h4>
              <div className="bg-gray-50 dark:bg-gray-750 p-3 rounded-lg mb-4">
                <p className="text-gray-700 dark:text-gray-300">{activeMeal.content}</p>
              </div>
            </div>
            
            <div className="mb-4">
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Thông tin dinh dưỡng:</h4>
              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="bg-gray-50 dark:bg-gray-750 p-2 rounded text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Calories</p>
                  <p className="font-bold text-gray-800 dark:text-white">{activeMeal.calories}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-750 p-2 rounded text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Protein</p>
                  <p className="font-bold text-gray-800 dark:text-white">{activeMeal.protein}g</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-750 p-2 rounded text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Carbs</p>
                  <p className="font-bold text-gray-800 dark:text-white">{activeMeal.carbs}g</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-750 p-2 rounded text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Chất béo</p>
                  <p className="font-bold text-gray-800 dark:text-white">{activeMeal.fat}g</p>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Hướng dẫn chi tiết:</h4>
              <div 
                className="prose prose-sm max-w-none dark:prose-invert bg-gray-50 dark:bg-gray-750 p-4 rounded-lg" 
                dangerouslySetInnerHTML={{ __html: activeMeal.cooking }}
              />
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleCloseCookingModal}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}