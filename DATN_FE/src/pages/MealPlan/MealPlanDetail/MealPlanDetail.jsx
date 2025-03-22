import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FaArrowLeft, FaRegHeart, FaHeart, FaRegComment, FaCheckCircle, FaRegClock, FaShare, FaStar, FaPrint, FaBookmark, FaRegBookmark } from 'react-icons/fa'
import { MdFastfood } from 'react-icons/md'
import { IoMdTime } from 'react-icons/io'
import NutritionChart from './components/NutritionChart'
import DayMealPlan from './components/DayMealPlan'

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
  
  // Mock data - in a real app, this would be fetched from an API
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      try {
        // This is sample data - would come from an API in production
        const mealPlanData = {
          id: parseInt(id),
          title: 'Thực đơn giảm cân 7 ngày',
          description: 'Thực đơn giảm cân lành mạnh với đầy đủ dinh dưỡng cho 7 ngày, giúp bạn đạt được mục tiêu giảm cân một cách khoa học và bền vững.',
          author: {
            id: 1,
            name: 'Nguyễn Văn A',
            avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
            isVerified: true
          },
          duration: 7,
          category: 'Giảm cân',
          likes: 120,
          comments: 24,
          rating: 4.7,
          ratingCount: 48,
          createdAt: '2023-12-15T09:00:00Z',
          image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000',
          notes: '<p>Thực đơn này được thiết kế để cung cấp đủ dinh dưỡng trong khi giúp bạn tạo ra sự thiếu hụt calo để giảm cân. Uống ít nhất 2 lít nước mỗi ngày và kết hợp với tập thể dục 30 phút mỗi ngày để có kết quả tốt nhất.</p><p>Bạn có thể điều chỉnh khẩu phần ăn tùy theo nhu cầu calo cá nhân. Nếu bạn cảm thấy đói, hãy thêm protein và rau xanh thay vì carbs.</p>',
          averageNutrition: {
            calories: 1500,
            protein: 90,
            carbs: 150,
            fat: 50
          },
          days: [
            {
              day: 1,
              meals: [
                {
                  type: 'Sáng',
                  content: 'Yến mạch nấu với sữa hạnh nhân + 1 quả chuối + 5 quả hạnh nhân',
                  calories: 320,
                  protein: 12,
                  carbs: 45,
                  fat: 10
                },
                {
                  type: 'Trưa',
                  content: 'Salad gà nướng với rau xanh, cà chua, dưa chuột, dầu olive',
                  calories: 450,
                  protein: 35,
                  carbs: 25,
                  fat: 20
                },
                {
                  type: 'Tối',
                  content: 'Cá hồi nướng với măng tây và khoai lang nướng',
                  calories: 480,
                  protein: 30,
                  carbs: 40,
                  fat: 15
                },
                {
                  type: 'Snack',
                  content: 'Sữa chua Hy Lạp với hỗn hợp quả mọng',
                  calories: 180,
                  protein: 15,
                  carbs: 15,
                  fat: 5
                }
              ]
            },
            {
              day: 2,
              meals: [
                {
                  type: 'Sáng',
                  content: 'Sinh tố protein với sữa, chuối, bơ và bột protein',
                  calories: 350,
                  protein: 25,
                  carbs: 30,
                  fat: 12
                },
                {
                  type: 'Trưa',
                  content: 'Bún trộn thịt bò xào với nhiều rau sống và ít bún',
                  calories: 420,
                  protein: 30,
                  carbs: 35,
                  fat: 15
                },
                {
                  type: 'Tối',
                  content: 'Đậu hũ sốt cà chua với cơm gạo lứt',
                  calories: 380,
                  protein: 20,
                  carbs: 50,
                  fat: 10
                },
                {
                  type: 'Snack',
                  content: 'Táo xanh với 1 muỗng bơ đậu phộng',
                  calories: 200,
                  protein: 5,
                  carbs: 20,
                  fat: 10
                }
              ]
            },
            // Days 3-7 would be similar structures
          ]
        };
        
        setMealPlan(mealPlanData);
        setLikesCount(mealPlanData.likes);
        setLoading(false);
      } catch (err) {
        setError('Không thể tải thông tin thực đơn. Vui lòng thử lại sau.');
        setLoading(false);
      }
    }, 500);
  }, [id]);

  const handleLike = () => {
    if (liked) {
      setLikesCount(prev => prev - 1);
    } else {
      setLikesCount(prev => prev + 1);
    }
    setLiked(!liked);
  };

  const handleSave = () => {
    setSaved(!saved);
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
                  <span className="flex items-center text-sm">
                    <IoMdTime className="mr-1" /> {mealPlan.duration} ngày
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
                  <span>Lưu</span>
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
            
            {/* Day tabs */}
            <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto">
              {mealPlan.days.map((day) => (
                <button
                  key={day.day}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    activeDay === day.day 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  onClick={() => setActiveDay(day.day)}
                >
                  Ngày {day.day}
                </button>
              ))}
            </div>
            
            {/* Active day meals */}
            {mealPlan.days.map((day) => (
              day.day === activeDay && (
                <DayMealPlan key={day.day} day={day} />
              )
            ))}
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
                <p className="text-xs text-gray-500 dark:text-gray-400">{Math.round(mealPlan.averageNutrition.protein * 4 / mealPlan.averageNutrition.calories * 100)}% calories</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Carbs</p>
                <p className="text-xl font-bold text-gray-800 dark:text-white">{mealPlan.averageNutrition.carbs}g</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{Math.round(mealPlan.averageNutrition.carbs * 4 / mealPlan.averageNutrition.calories * 100)}% calories</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Chất béo</p>
                <p className="text-xl font-bold text-gray-800 dark:text-white">{mealPlan.averageNutrition.fat}g</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{Math.round(mealPlan.averageNutrition.fat * 9 / mealPlan.averageNutrition.calories * 100)}% calories</p>
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
    </div>
  )
} 