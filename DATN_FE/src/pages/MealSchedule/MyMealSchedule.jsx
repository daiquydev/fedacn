import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaArrowLeft, FaArrowRight, FaCheckCircle, FaRegClock, FaList, FaRegCalendarCheck, FaExclamationCircle, FaUtensils, FaChartLine, FaCheckSquare, FaBell, FaRegEdit, FaCalendarDay, FaUsers, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import MealProgress from './components/MealProgress';
import { toast } from 'react-hot-toast';

export default function MyMealSchedule() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeMealPlans, setActiveMealPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(getCurrentWeek());
  const [daysInWeek, setDaysInWeek] = useState([]);
  const [recentDays, setRecentDays] = useState([]);
  const [currentMeals, setCurrentMeals] = useState([]);
  
  // Thêm state cho modal hiển thị cách chế biến
  const [showCookingModal, setShowCookingModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);

  // Thêm state và ref để theo dõi bữa ăn đã hoàn thành
  const [completedMealIds, setCompletedMealIds] = useState(() => {
    const saved = localStorage.getItem('completedMealIds');
    return saved ? JSON.parse(saved) : [];
  });
  const completedMealIdsRef = useRef(completedMealIds);
  
  // Cập nhật ref khi state thay đổi
  useEffect(() => {
    completedMealIdsRef.current = completedMealIds;
    localStorage.setItem('completedMealIds', JSON.stringify(completedMealIds));
  }, [completedMealIds]);
  
  // Hàm đánh dấu bữa ăn hoàn thành
  const markMealAsCompleted = (mealId) => {
    // Cập nhật state với bản sao mới
    const newCompletedMealIds = [...completedMealIdsRef.current, mealId];
    setCompletedMealIds(newCompletedMealIds);
    
    // Cập nhật meals state
    setCurrentMeals(prevMeals => 
      prevMeals.map(item => 
        item.id === mealId ? { ...item, completed: true } : item
      )
    );
    
    // Hiển thị thông báo
    toast.success('Đã hoàn thành!');
    
    // Force re-render nếu cần
    setForceUpdate(prev => prev + 1);
  };
  
  // Thêm state riêng biệt để force re-render
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // Kiểm tra xem bữa ăn có hoàn thành hay không
  const isMealCompleted = (mealId) => {
    return completedMealIds.includes(mealId) && 
           currentMeals.some(meal => meal.id === mealId && meal.completed);
  };

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
          startDate: '2025-04-02T00:00:00Z',
          endDate: '2025-04-08T23:59:59Z',
          duration: 7,
          progress: 40,
          completedDays: 2,
          totalDays: 7,
          category: 'Giảm cân',
          calories: 1500,
          activeDay: '2024-01-15T00:00:00Z',
          activeUsers: 245,
          activeUsersTrend: 15, // Tăng 15 người so với hôm qua
          todayMeals: [
            {id: 1, type: 'Sáng', name: 'Yến mạch sữa hạnh nhân với trái cây', calories: 350, completed: true, 
             cooking: '<p><strong>Cách chế biến:</strong></p><ol><li>Nấu 50g yến mạch với 250ml sữa hạnh nhân trong 3-5 phút.</li><li>Thêm 1/2 thìa cafe mật ong (tùy chọn).</li><li>Thái chuối thành lát và rắc lên trên.</li><li>Đập nhỏ hạnh nhân và rắc lên trên cùng.</li></ol>'},
            {id: 2, type: 'Trưa', name: 'Salad gà nướng với rau xanh', calories: 450, completed: false,
             cooking: '<p><strong>Cách chế biến:</strong></p><ol><li>Ướp ức gà với muối, tiêu, bột tỏi, và một ít dầu olive trong 15 phút.</li><li>Nướng gà ở 200°C trong 15-20 phút hoặc đến khi chín.</li><li>Để nguội và cắt thành lát nhỏ.</li><li>Trộn rau xanh, cà chua, dưa chuột trong tô lớn.</li><li>Thêm gà nướng đã cắt lát.</li><li>Rưới dầu olive và chanh, thêm muối và tiêu vừa đủ.</li></ol>'},
            {id: 3, type: 'Tối', name: 'Cá hồi nướng với măng tây', calories: 480, completed: false,
             cooking: '<p><strong>Cách chế biến:</strong></p><ol><li>Ướp cá hồi với muối, tiêu, chanh trong 30 phút.</li><li>Nướng cá hồi ở 180°C trong 12-15 phút.</li><li>Cắt khoai lang thành miếng vừa, thấm khô, trộn với dầu olive, muối, tiêu.</li><li>Nướng khoai lang ở 200°C trong 25-30 phút, đảo một lần giữa chừng.</li><li>Luộc măng tây trong 3-4 phút, sau đó ngâm ngay vào nước đá.</li><li>Xào nhanh măng tây với một ít dầu olive và tỏi.</li></ol>'},
            {id: 4, type: 'Snack', name: 'Sữa chua Hy Lạp với hỗn hợp quả mọng', calories: 180, completed: true,
             cooking: '<p><strong>Cách chế biến:</strong></p><ol><li>Cho 150g sữa chua Hy Lạp vào bát.</li><li>Thêm hỗn hợp các loại quả mọng (dâu tây, việt quất, mâm xôi).</li><li>Có thể thêm một ít hạt chia và mật ong (tùy chọn).</li></ol>'}
          ]
        },
        {
          id: 2,
          title: 'Thực đơn tăng cơ 14 ngày',
          image: 'https://images.unsplash.com/photo-1547592180-85f173990554',
          startDate: '2025-04-05T00:00:00Z',
          endDate: '2025-04-18T23:59:59Z',
          duration: 14,
          progress: 70,
          completedDays: 10,
          totalDays: 14,
          category: 'Tăng cơ',
          calories: 2500,
          activeDay: '2024-01-16T00:00:00Z',
          activeUsers: 173,
          activeUsersTrend: -8, // Giảm 8 người so với hôm qua
          todayMeals: [
            {id: 1, type: 'Sáng', name: 'Smoothie protein với chuối và bơ', calories: 550, completed: true,
             cooking: '<p><strong>Cách chế biến:</strong></p><ol><li>Cho vào máy xay: 1 chuối, 1/2 quả bơ, 1 muỗng bột protein, 240ml sữa hạnh nhân.</li><li>Thêm đá nếu thích đồ uống lạnh.</li><li>Xay đến khi hỗn hợp mịn.</li><li>Có thể thêm mật ong hoặc quế để tăng hương vị.</li></ol>'},
            {id: 2, type: 'Trưa', name: 'Cơm gạo lứt với ức gà và rau', calories: 650, completed: true,
             cooking: '<p><strong>Cách chế biến:</strong></p><ol><li>Nấu gạo lứt với tỉ lệ 1:2 (gạo:nước).</li><li>Ướp ức gà với muối, tiêu, bột tỏi, và dầu olive.</li><li>Nướng hoặc áp chảo ức gà đến khi chín.</li><li>Cắt ức gà thành miếng vừa ăn.</li><li>Xào rau củ với dầu olive và tỏi.</li><li>Trình bày gạo lứt, ức gà và rau củ trên đĩa.</li></ol>'},
            {id: 3, type: 'Tối', name: 'Bít tết bò với khoai lang nướng', calories: 750, completed: false,
             cooking: '<p><strong>Cách chế biến:</strong></p><ol><li>Ướp thịt bò với muối, tiêu, tỏi, và một chút dầu olive trong 30 phút.</li><li>Rửa sạch và cắt khoai lang thành miếng vừa.</li><li>Trộn khoai lang với dầu olive, muối, tiêu, bột paprika.</li><li>Nướng khoai lang ở 200°C trong 25-30 phút.</li><li>Nướng hoặc áp chảo thịt bò theo mức độ chín mong muốn.</li><li>Để thịt nghỉ trong 5 phút trước khi cắt và phục vụ.</li></ol>'},
            {id: 4, type: 'Snack', name: 'Sữa và một nắm hạt', calories: 300, completed: true,
             cooking: '<p><strong>Cách chế biến:</strong></p><ol><li>Chuẩn bị một ly sữa tươi hoặc sữa hạnh nhân không đường.</li><li>Trộn các loại hạt như hạnh nhân, hạt điều, óc chó, và hạt bí ngô.</li><li>Có thể rang nhẹ các loại hạt trước khi ăn để tăng hương vị.</li></ol>'}
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
      setCurrentMeals(mockData[0].todayMeals);
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
          <FaCalendarAlt className="mr-2 text-green-600" /> Thực đơn của tôi
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

              {/* Phần người dùng đang áp dụng - đặt ngay sau phần hành động nhanh */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl shadow-md p-5 mb-6 border border-blue-100 dark:border-blue-800">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
                    <FaUsers className="mr-2 text-blue-600 dark:text-blue-400" /> 
                    Người dùng cùng áp dụng
                  </h3>
                  <div className={`flex items-center text-sm font-medium ${selectedPlan.activeUsersTrend > 0 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'}`}>
                    {selectedPlan.activeUsersTrend > 0 
                      ? <FaArrowUp className="mr-1" /> 
                      : <FaArrowDown className="mr-1" />}
                    {Math.abs(selectedPlan.activeUsersTrend)} so với hôm qua
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline">
                    <div className="text-4xl font-bold text-blue-700 dark:text-blue-300">
                      {selectedPlan.activeUsers.toLocaleString()}
                    </div>
                    <div className="ml-2 text-base text-blue-600 dark:text-blue-400">
                      người đang theo dõi hôm nay
                    </div>
                  </div>
                  
                  <div className="w-1/3">
                    <div className="flex space-x-1">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div 
                          key={i} 
                          className={`h-2 flex-1 rounded-full ${
                            i < Math.ceil(selectedPlan.activeUsers / 50) 
                              ? 'bg-blue-600 dark:bg-blue-400' 
                              : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="mt-1 text-xs text-blue-700 dark:text-blue-300 text-right">
                      Thực đơn này đang được cộng đồng ưa chuộng
                    </p>
                  </div>
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
                            isMealCompleted(meal.id) 
                              ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/10' 
                              : 'border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              {isMealCompleted(meal.id) && (
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
                              <div className="flex mt-1 space-x-2 justify-end">
                                {!isMealCompleted(meal.id) ? (
                                  <button 
                                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                    onClick={() => markMealAsCompleted(meal.id)}
                                  >
                                    Đánh dấu hoàn thành
                                  </button>
                                ) : (
                                  <span className="text-xs text-green-600 dark:text-green-400 flex items-center">
                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                    </svg>
                                    Đã hoàn thành
                                  </span>
                                )}
                                {meal.cooking && (
                                  <button 
                                    className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedMeal(meal);
                                      setShowCookingModal(true);
                                    }}
                                  >
                                    Cách chế biến
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 flex justify-between">
                      <button
                        onClick={() => {
                          // Lấy ngày hiện tại và định dạng thành YYYY-MM-DD
                          const today = new Date().toISOString().split('T')[0];
                          
                          // Điều hướng đến trang edit với tham số ngày hiện tại
                          navigate(`/schedule/eat-schedule/edit/${today}`);
                        }}
                        className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      >
                        <FaRegEdit className="mr-1" /> Điều chỉnh các bữa ăn
                      </button>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium text-green-600 dark:text-green-400">
                          {selectedPlan.todayMeals.filter(m => isMealCompleted(m.id)).length}/{selectedPlan.todayMeals.length}
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

      {/* Modal cách chế biến */}
      {showCookingModal && selectedMeal && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex justify-center items-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-auto">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {selectedMeal.name} - {selectedMeal.type}
              </h3>
              <button 
                onClick={() => {
                  setShowCookingModal(false);
                  setSelectedMeal(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div 
                className="prose dark:prose-invert prose-sm max-w-none" 
                dangerouslySetInnerHTML={{ __html: selectedMeal.cooking }}
              />
              <div className="mt-4 py-2 px-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-800 dark:text-blue-300">
                <div className="flex items-start">
                  <svg className="w-5 h-5 mr-2 flex-shrink-0 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                  </svg>
                  <p>
                    Món ăn này cung cấp {selectedMeal.calories} calo, góp phần vào chế độ dinh dưỡng hàng ngày của bạn.
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => {
                  setShowCookingModal(false);
                  setSelectedMeal(null);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 