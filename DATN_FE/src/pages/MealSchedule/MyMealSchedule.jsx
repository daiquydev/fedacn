import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaArrowLeft, FaArrowRight, FaCheckCircle, FaRegClock, FaList, FaRegCalendarCheck, FaExclamationCircle, FaUtensils, FaChartLine, FaCheckSquare, FaBell, FaRegEdit, FaCalendarDay } from 'react-icons/fa';
import MealProgress from './components/MealProgress';

export default function MyMealSchedule() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeMealPlans, setActiveMealPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(getCurrentWeek());
  const [daysInWeek, setDaysInWeek] = useState([]);
  const [recentDays, setRecentDays] = useState([]);

  // Lấy ngày đầu tiên của tuần hiện tại
  function getCurrentWeek() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 for Sunday, 1 for Monday, etc.
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust for Monday as first day
    return new Date(now.setDate(diff));
  }

  // Lấy danh sách các ngày trong tuần
  function getDaysInWeek(startOfWeek) {
    const days = [];
    const start = new Date(startOfWeek);
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(day.getDate() + i);
      days.push(day);
    }
    
    return days;
  }

  // Kiểm tra ngày có phải là hôm nay
  function isToday(date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  }

  // Kiểm tra ngày có nằm trong khoảng áp dụng thực đơn
  function isDateInMealPlan(date, mealPlan) {
    const planStart = new Date(mealPlan.startDate);
    const planEnd = new Date(mealPlan.endDate);
    return date >= planStart && date <= planEnd;
  }

  // Format date
  function formatDate(date) {
    return date.toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: 'numeric',
      month: 'numeric'
    });
  }

  // Di chuyển đến tuần trước
  function goToPreviousWeek() {
    const prevWeek = new Date(currentWeek);
    prevWeek.setDate(prevWeek.getDate() - 7);
    setCurrentWeek(prevWeek);
  }

  // Di chuyển đến tuần sau
  function goToNextWeek() {
    const nextWeek = new Date(currentWeek);
    nextWeek.setDate(nextWeek.getDate() + 7);
    setCurrentWeek(nextWeek);
  }

  // Xử lý khi chọn ngày
  function handleSelectDay(day) {
    if (selectedPlan) {
      navigate(`/schedule/eat-schedule/day/${day.getFullYear()}-${day.getMonth() + 1}-${day.getDate()}`);
    } else {
      alert('Vui lòng chọn một thực đơn để xem chi tiết ngày');
    }
  }

  // Tính ngày trong tuần
  function getDayOfWeek(date) {
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    return days[date.getDay()];
  }

  // Mô phỏng fetch dữ liệu
  useEffect(() => {
    setTimeout(() => {
      const mockData = [
        {
          id: 1,
          title: 'Thực đơn giảm cân 7 ngày',
          image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
          startDate: '2024-01-10T00:00:00Z',
          endDate: '2024-01-16T23:59:59Z',
          duration: 7,
          progress: 40,
          completedDays: 2,
          totalDays: 7,
          category: 'Giảm cân',
          calories: 1500,
          activeDay: '2024-01-15T00:00:00Z',
          todayMeals: [
            {id: 1, type: 'Sáng', name: 'Yến mạch sữa hạnh nhân với trái cây', calories: 350, completed: true},
            {id: 2, type: 'Trưa', name: 'Salad gà nướng với rau xanh', calories: 450, completed: false},
            {id: 3, type: 'Tối', name: 'Cá hồi nướng với măng tây', calories: 480, completed: false},
            {id: 4, type: 'Snack', name: 'Sữa chua Hy Lạp với hỗn hợp quả mọng', calories: 180, completed: true}
          ]
        },
        {
          id: 2,
          title: 'Thực đơn tăng cơ 14 ngày',
          image: 'https://images.unsplash.com/photo-1547592180-85f173990554',
          startDate: '2024-01-05T00:00:00Z',
          endDate: '2024-01-18T23:59:59Z',
          duration: 14,
          progress: 70,
          completedDays: 10,
          totalDays: 14,
          category: 'Tăng cơ',
          calories: 2500,
          activeDay: '2024-01-16T00:00:00Z',
          todayMeals: [
            {id: 1, type: 'Sáng', name: 'Smoothie protein với chuối và bơ', calories: 550, completed: true},
            {id: 2, type: 'Trưa', name: 'Cơm gạo lứt với ức gà và rau', calories: 650, completed: true},
            {id: 3, type: 'Tối', name: 'Bít tết bò với khoai lang nướng', calories: 750, completed: false},
            {id: 4, type: 'Snack', name: 'Sữa và một nắm hạt', calories: 300, completed: true}
          ]
        }
      ];
      
      // Generate recent days data
      const today = new Date();
      const recentDaysData = [];
      
      for (let i = 4; i >= 0; i--) {
        const day = new Date(today);
        day.setDate(day.getDate() - i);
        
        const randomCompletion = Math.floor(Math.random() * 101);
        const isCompleted = randomCompletion > 70;
        
        recentDaysData.push({
          date: day,
          percentage: randomCompletion,
          isCompleted: isCompleted
        });
      }
      
      setRecentDays(recentDaysData);
      setActiveMealPlans(mockData);
      setSelectedPlan(mockData[0]);
      setLoading(false);
    }, 800);
  }, []);

  // Cập nhật danh sách các ngày trong tuần khi currentWeek thay đổi
  useEffect(() => {
    setDaysInWeek(getDaysInWeek(currentWeek));
  }, [currentWeek]);

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
          <FaCalendarAlt className="mr-2 text-green-600" /> Lịch thực đơn của tôi
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Theo dõi và quản lý thực đơn hàng ngày của bạn
        </p>
      </div>

      {activeMealPlans.length > 0 ? (
        <div className="space-y-6">
          {/* Meal Plan Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Thực đơn đang áp dụng</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeMealPlans.map((plan) => (
                <div 
                  key={plan.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedPlan?.id === plan.id 
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700'
                  }`}
                  onClick={() => setSelectedPlan(plan)}
                >
                  <div className="flex items-center mb-3">
                    <img 
                      src={plan.image} 
                      alt={plan.title} 
                      className="w-12 h-12 rounded-full object-cover mr-3"
                    />
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white line-clamp-1">{plan.title}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {plan.category} • {plan.calories} kcal
                      </p>
                    </div>
                  </div>
                  
                  <MealProgress 
                    progress={plan.progress} 
                    completedDays={plan.completedDays}
                    totalDays={plan.totalDays}
                  />
                  
                  <div className="mt-2 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>Bắt đầu: {new Date(plan.startDate).toLocaleDateString('vi-VN')}</span>
                    <span>Kết thúc: {new Date(plan.endDate).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedPlan && (
            <>
              {/* Calendar Navigation */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
                <div className="flex justify-between items-center mb-4">
                  <button 
                    onClick={goToPreviousWeek}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <FaArrowLeft className="text-gray-600 dark:text-gray-400" />
                  </button>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {currentWeek.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                  </h3>
                  <button 
                    onClick={goToNextWeek}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <FaArrowRight className="text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
                
                {/* Week Calendar */}
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {daysInWeek.map((day, index) => {
                    const isInMealPlan = isDateInMealPlan(day, selectedPlan);
                    const isTodayDate = isToday(day);
                    
                    return (
                      <div 
                        key={index}
                        className={`text-center p-2 rounded-lg ${
                          isInMealPlan 
                            ? isTodayDate
                              ? 'bg-green-600 text-white'
                              : 'bg-green-100 dark:bg-green-900/30 cursor-pointer hover:bg-green-200 dark:hover:bg-green-800/40'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                        }`}
                        onClick={() => isInMealPlan && handleSelectDay(day)}
                      >
                        <div className="text-xs mb-1">{day.toLocaleDateString('vi-VN', { weekday: 'short' })}</div>
                        <div className={`text-lg font-semibold ${isTodayDate && isInMealPlan ? 'text-white' : ''}`}>
                          {day.getDate()}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="flex justify-center space-x-4 text-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-600 rounded-full mr-2"></div>
                    <span className="text-gray-700 dark:text-gray-300">Hôm nay</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-100 dark:bg-green-900/30 rounded-full mr-2"></div>
                    <span className="text-gray-700 dark:text-gray-300">Ngày trong thực đơn</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-gray-100 dark:bg-gray-700 rounded-full mr-2"></div>
                    <span className="text-gray-700 dark:text-gray-300">Ngày không áp dụng</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-4">Hành động nhanh</h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <button 
                    onClick={() => navigate(`/schedule/eat-schedule/day/${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()}`)}
                    className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-center hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors"
                  >
                    <FaUtensils className="text-blue-600 dark:text-blue-400 text-2xl mx-auto mb-2" />
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Bữa ăn hôm nay</span>
                  </button>
                  
                  <button 
                    onClick={() => navigate('/schedule/eat-schedule/stats')}
                    className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-center hover:bg-purple-100 dark:hover:bg-purple-800/30 transition-colors"
                  >
                    <FaChartLine className="text-purple-600 dark:text-purple-400 text-2xl mx-auto mb-2" />
                    <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Thống kê</span>
                  </button>
                  
                  <button 
                    onClick={() => navigate('/schedule/eat-schedule/completed')}
                    className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 text-center hover:bg-green-100 dark:hover:bg-green-800/30 transition-colors"
                  >
                    <FaCheckSquare className="text-green-600 dark:text-green-400 text-2xl mx-auto mb-2" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">Đã hoàn thành</span>
                  </button>
                  
                  <button 
                    onClick={() => navigate('/schedule/eat-schedule/reminders')}
                    className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-center hover:bg-yellow-100 dark:hover:bg-yellow-800/30 transition-colors"
                  >
                    <FaBell className="text-yellow-600 dark:text-yellow-400 text-2xl mx-auto mb-2" />
                    <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Nhắc nhở</span>
                  </button>
                </div>
              </div>

              {/* Today's meals */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Today Column */}
                <div className="lg:col-span-2">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
                        <FaCalendarDay className="mr-2 text-green-600" /> 
                        Hôm nay, {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </h3>
                      <button
                        onClick={() => navigate(`/schedule/eat-schedule/day/${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()}`)}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Xem chi tiết
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {selectedPlan.todayMeals.map((meal) => (
                        <div 
                          key={meal.id}
                          className={`p-3 rounded-lg border ${
                            meal.completed 
                              ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/10' 
                              : 'border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              {meal.completed && (
                                <div className="mr-2 text-green-600 dark:text-green-400">
                                  <FaCheckCircle />
                                </div>
                              )}
                              <div>
                                <h4 className="font-medium text-gray-900 dark:text-white">{meal.type}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{meal.name}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">{meal.calories} kcal</span>
                              {!meal.completed && (
                                <button 
                                  className="block mt-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                  onClick={() => navigate(`/schedule/eat-schedule/mark-complete/${meal.id}`)}
                                >
                                  Đánh dấu hoàn thành
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 flex justify-between">
                      <button
                        onClick={() => navigate(`/schedule/eat-schedule/edit-today`)}
                        className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      >
                        <FaRegEdit className="mr-1" /> Điều chỉnh các bữa ăn
                      </button>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium text-green-600 dark:text-green-400">
                          {selectedPlan.todayMeals.filter(m => m.completed).length}/{selectedPlan.todayMeals.length}
                        </span> bữa ăn đã hoàn thành
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Stats Column */}
                <div className="lg:col-span-1">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 h-full">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                      <FaChartLine className="mr-2 text-purple-600" /> Thống kê
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">Tiến độ tổng quan</h4>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600 dark:text-gray-400">Hoàn thành</span>
                          <span className="font-medium text-blue-600 dark:text-blue-400">{selectedPlan.progress}%</span>
                        </div>
                        <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                          <div 
                            className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full" 
                            style={{ width: `${selectedPlan.progress}%` }}
                          />
                        </div>
                        <p className="mt-2 text-xs text-blue-700 dark:text-blue-300">
                          {selectedPlan.completedDays}/{selectedPlan.totalDays} ngày đã hoàn thành
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">Các ngày gần đây</h4>
                        {recentDays.map((day, index) => (
                          <div 
                            key={index}
                            className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                          >
                            <div className="flex items-center">
                              {day.isCompleted ? (
                                <FaCheckCircle className="text-green-500 dark:text-green-400 mr-2" />
                              ) : (
                                <FaExclamationCircle className="text-yellow-500 dark:text-yellow-400 mr-2" />
                              )}
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {formatDate(day.date)}
                              </span>
                            </div>
                            <div className="text-sm font-medium">
                              <span className={day.percentage >= 70 ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400"}>
                                {day.percentage}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                        <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">Hiệu suất</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white dark:bg-gray-800 p-2 rounded">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Ngày liên tiếp</p>
                            <p className="text-xl font-bold text-purple-600 dark:text-purple-400">4</p>
                          </div>
                          <div className="bg-white dark:bg-gray-800 p-2 rounded">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Hoàn thành</p>
                            <p className="text-xl font-bold text-green-600 dark:text-green-400">86%</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 text-center">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaRegCalendarCheck className="text-gray-500 dark:text-gray-400 text-3xl" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Chưa có thực đơn nào đang được áp dụng
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Bạn chưa áp dụng thực đơn nào. Hãy khám phá và áp dụng thực đơn để theo dõi bữa ăn hàng ngày.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/meal-plan')}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              Khám phá thực đơn
            </button>
            <button
              onClick={() => navigate('/meal-plan/saved')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Thực đơn đã lưu
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 