import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCheckCircle, FaCalendarDay, FaUtensils, FaSearch, FaFilter, FaCalendarAlt, FaTimes, FaChevronLeft, FaChevronRight, FaCalendarCheck } from 'react-icons/fa';

export default function MealCompleted() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [completedMeals, setCompletedMeals] = useState([]);
  const [filteredMeals, setFilteredMeals] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // all, week, month, custom
  
  // Thêm state mới cho tìm kiếm theo mốc thời gian
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const datePickerRef = useRef(null);
  
  // State cho calendar
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectingStart, setSelectingStart] = useState(true);
  
  // Mô phỏng fetch dữ liệu
  useEffect(() => {
    setTimeout(() => {
      // Helper để tạo ngày dựa trên số ngày trước đây
      const daysAgo = (days) => {
        const date = new Date();
        date.setDate(date.getDate() - days);
        
        // Format thành YYYY-MM-DD
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        
        // Format hiển thị
        const displayDate = `${dd} tháng ${mm}, ${yyyy}`;
        
        return {
          dateString: `${yyyy}-${mm}-${dd}`,
          displayDate
        };
      };
      
      // Mock data trong vòng 30 ngày
      const mockCompletedMeals = [
        {
          id: 1,
          date: daysAgo(2).dateString,
          displayDate: daysAgo(2).displayDate,
          type: 'Sáng',
          name: 'Yến mạch với sữa hạnh nhân và chuối',
          calories: 320,
          time: '7:30',
          note: 'Thêm chút mật ong làm món ăn ngon hơn rất nhiều',
        },
        {
          id: 2,
          date: daysAgo(2).dateString,
          displayDate: daysAgo(2).displayDate,
          type: 'Trưa',
          name: 'Salad gà nướng với rau xanh và sốt dầu olive',
          calories: 450,
          time: '12:15',
        },
        {
          id: 3,
          date: daysAgo(3).dateString,
          displayDate: daysAgo(3).displayDate,
          type: 'Tối',
          name: 'Cá hồi nướng với măng tây và khoai lang',
          calories: 480,
          time: '19:00',
          note: 'Nên ướp cá hồi với chanh và tiêu trước khi nướng',
        },
        {
          id: 4,
          date: daysAgo(3).dateString,
          displayDate: daysAgo(3).displayDate,
          type: 'Snack',
          name: 'Sữa chua Hy Lạp với hỗn hợp quả mọng',
          calories: 180,
          time: '15:30',
        },
        {
          id: 5,
          date: daysAgo(5).dateString,
          displayDate: daysAgo(5).displayDate,
          type: 'Sáng',
          name: 'Bánh mì nguyên cám với trứng và bơ',
          calories: 380,
          time: '7:45',
        },
        {
          id: 6,
          date: daysAgo(5).dateString,
          displayDate: daysAgo(5).displayDate,
          type: 'Trưa',
          name: 'Cơm gạo lứt với thịt gà và rau luộc',
          calories: 420,
          time: '12:30',
        },
        {
          id: 7,
          date: daysAgo(7).dateString,
          displayDate: daysAgo(7).displayDate,
          type: 'Tối',
          name: 'Súp rau củ với thịt gà xé',
          calories: 350,
          time: '18:45',
          note: 'Món này khá ngon và dễ ăn, phù hợp cho bữa tối',
        },
        {
          id: 8,
          date: daysAgo(8).dateString,
          displayDate: daysAgo(8).displayDate,
          type: 'Snack',
          name: 'Táo xanh với bơ đậu phộng',
          calories: 200,
          time: '16:00',
        },
        // Thêm mockdata mới
        {
          id: 9,
          date: daysAgo(1).dateString,
          displayDate: daysAgo(1).displayDate,
          type: 'Sáng',
          name: 'Smoothie chuối với bột protein và hạt chia',
          calories: 290,
          time: '7:15',
          note: 'Rất tốt trước khi tập thể dục buổi sáng',
        },
        {
          id: 10,
          date: daysAgo(1).dateString,
          displayDate: daysAgo(1).displayDate,
          type: 'Trưa',
          name: 'Bún trộn thịt bò và rau sống',
          calories: 420,
          time: '12:30',
        },
        {
          id: 11,
          date: daysAgo(1).dateString,
          displayDate: daysAgo(1).displayDate,
          type: 'Tối',
          name: 'Đậu hũ sốt cà chua với cơm gạo lứt',
          calories: 380,
          time: '19:00',
        },
        {
          id: 12,
          date: daysAgo(4).dateString,
          displayDate: daysAgo(4).displayDate,
          type: 'Sáng',
          name: 'Sinh tố protein với các loại quả mọng',
          calories: 310,
          time: '8:00',
        },
        {
          id: 13,
          date: daysAgo(4).dateString,
          displayDate: daysAgo(4).displayDate,
          type: 'Trưa',
          name: 'Cơm cuộn Hàn Quốc với rau và thịt gà',
          calories: 440,
          time: '12:00',
          note: 'Nên thêm sốt cay để tăng hương vị',
        },
        {
          id: 14,
          date: daysAgo(10).dateString,
          displayDate: daysAgo(10).displayDate,
          type: 'Sáng',
          name: 'Bánh kếp bột yến mạch với mật ong và quả mọng',
          calories: 340,
          time: '7:30',
        },
        {
          id: 15,
          date: daysAgo(10).dateString,
          displayDate: daysAgo(10).displayDate,
          type: 'Tối',
          name: 'Cá ngừ áp chảo với salad trộn',
          calories: 410,
          time: '18:30',
          note: 'Nên ăn cá ngừ chín tái để giữ độ mềm và ngọt',
        },
        {
          id: 16,
          date: daysAgo(12).dateString,
          displayDate: daysAgo(12).displayDate,
          type: 'Snack',
          name: 'Sữa chua Hy Lạp với hạt óc chó và mật ong',
          calories: 220,
          time: '15:00',
        },
        {
          id: 17,
          date: daysAgo(15).dateString,
          displayDate: daysAgo(15).displayDate,
          type: 'Trưa',
          name: 'Mì Ý sốt bò bằm với rau củ',
          calories: 520,
          time: '12:30',
          note: 'Phần này hơi nhiều calo, lần sau nên giảm lượng mì xuống',
        },
        {
          id: 18,
          date: daysAgo(18).dateString,
          displayDate: daysAgo(18).displayDate,
          type: 'Tối',
          name: 'Canh rau củ với thịt viên',
          calories: 320,
          time: '19:15',
        },
        {
          id: 19,
          date: daysAgo(21).dateString,
          displayDate: daysAgo(21).displayDate,
          type: 'Sáng',
          name: 'Bánh mì đen với trứng luộc và bơ',
          calories: 370,
          time: '7:45',
          note: 'Bánh mì đen giàu chất xơ, rất tốt cho tiêu hóa buổi sáng',
        },
        {
          id: 20,
          date: daysAgo(25).dateString,
          displayDate: daysAgo(25).displayDate,
          type: 'Snack',
          name: 'Chuối và một nắm hạnh nhân',
          calories: 190,
          time: '16:00',
        },
        {
          id: 21,
          date: daysAgo(28).dateString,
          displayDate: daysAgo(28).displayDate,
          type: 'Trưa',
          name: 'Salad cá hồi hun khói với rau trộn',
          calories: 380,
          time: '12:30',
        },
        {
          id: 22,
          date: daysAgo(0).dateString, // Hôm nay
          displayDate: daysAgo(0).displayDate,
          type: 'Sáng',
          name: 'Bột yến mạch nấu với sữa hạnh nhân và quả việt quất',
          calories: 330,
          time: '7:00',
          note: 'Bữa sáng hoàn hảo trước khi tập luyện buổi sáng',
        },
      ];
      
      setCompletedMeals(mockCompletedMeals);
      setFilteredMeals(mockCompletedMeals);
      setLoading(false);
    }, 800);
  }, []);
  
  // Xử lý click bên ngoài date picker
  useEffect(() => {
    function handleClickOutside(event) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowDatePicker(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Xử lý filter và search
  useEffect(() => {
    if (!completedMeals.length) return;
    
    let filtered = [...completedMeals];
    
    // Apply time filter
    if (activeFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      let startFilterDate, endFilterDate;
      
      if (activeFilter === 'week') {
        // Last 7 days
        startFilterDate = new Date(today);
        startFilterDate.setDate(startFilterDate.getDate() - 7);
        endFilterDate = today;
      } else if (activeFilter === 'month') {
        // Last 30 days
        startFilterDate = new Date(today);
        startFilterDate.setDate(startFilterDate.getDate() - 30);
        endFilterDate = today;
      } else if (activeFilter === 'custom' && startDate) {
        // Custom date range
        startFilterDate = new Date(startDate);
        endFilterDate = endDate ? new Date(endDate) : today;
        // Đặt giờ của endDate thành cuối ngày để bao gồm cả ngày kết thúc
        endFilterDate.setHours(23, 59, 59, 999);
      }
      
      filtered = filtered.filter(meal => {
        const mealDate = new Date(meal.date);
        return mealDate >= startFilterDate && mealDate <= endFilterDate;
      });
    }
    
    // Apply search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(meal => 
        meal.name.toLowerCase().includes(term) || 
        meal.type.toLowerCase().includes(term)
      );
    }
    
    setFilteredMeals(filtered);
  }, [searchTerm, activeFilter, completedMeals, startDate, endDate]);
  
  // Format ngày thành string YYYY-MM-DD
  const formatDateString = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };
  
  // Format ngày hiển thị
  const formatDisplayDate = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };
  
  // Xử lý chọn ngày từ calendar
  const handleSelectDate = (day) => {
    const selectedDate = formatDateString(day);
    
    if (selectingStart) {
      // Đang chọn ngày bắt đầu
      setStartDate(selectedDate);
      setEndDate(''); // Reset ngày kết thúc
      setSelectingStart(false);
    } else {
      // Đang chọn ngày kết thúc
      const startDateObj = new Date(startDate);
      const selectedDateObj = new Date(selectedDate);
      
      if (selectedDateObj < startDateObj) {
        // Nếu ngày kết thúc < ngày bắt đầu, đổi chỗ
        setEndDate(startDate);
        setStartDate(selectedDate);
      } else {
        setEndDate(selectedDate);
      }
      
      setSelectingStart(true); // Reset về chọn ngày bắt đầu cho lần sau
      setActiveFilter('custom'); // Áp dụng filter
      setShowDatePicker(false); // Đóng calendar
    }
  };
  
  // Xử lý áp dụng filter
  const handleApplyDateFilter = () => {
    if (startDate) {
      setActiveFilter('custom');
      setShowDatePicker(false);
    }
  };
  
  // Xóa filter
  const handleClearDateFilter = () => {
    setStartDate('');
    setEndDate('');
    setActiveFilter('all');
    setSelectingStart(true);
    setShowDatePicker(false);
  };
  
  // Lấy các ngày trong tháng
  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Ngày đầu tiên của tháng
    const firstDay = new Date(year, month, 1);
    // Số ngày trong tháng
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Ngày trong tuần của ngày đầu tiên (0 = Chủ nhật, 1 = Thứ 2, ...)
    let firstDayOfWeek = firstDay.getDay();
    // Đổi 0 (Chủ nhật) thành 7 để phù hợp với thứ tự ngày trong tuần ở Việt Nam
    if (firstDayOfWeek === 0) firstDayOfWeek = 7;
    
    const days = [];
    
    // Thêm ngày tháng trước để lấp đầy tuần đầu tiên
    for (let i = firstDayOfWeek - 1; i > 0; i--) {
      const prevDate = new Date(year, month, 1 - i);
      days.push({
        date: prevDate,
        day: prevDate.getDate(),
        month: prevDate.getMonth(),
        year: prevDate.getFullYear(),
        isCurrentMonth: false
      });
    }
    
    // Thêm các ngày trong tháng hiện tại
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(year, month, i);
      days.push({
        date: currentDate,
        day: i,
        month,
        year,
        isCurrentMonth: true
      });
    }
    
    // Thêm ngày tháng sau để lấp đầy tuần cuối cùng
    const lastDayOfWeek = new Date(year, month, daysInMonth).getDay();
    const daysToAdd = lastDayOfWeek === 0 ? 0 : 7 - lastDayOfWeek;
    
    for (let i = 1; i <= daysToAdd; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({
        date: nextDate,
        day: nextDate.getDate(),
        month: nextDate.getMonth(),
        year: nextDate.getFullYear(),
        isCurrentMonth: false
      });
    }
    
    return days;
  };
  
  // Kiểm tra ngày có phải là hôm nay không
  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };
  
  // Kiểm tra ngày có phải là ngày bắt đầu không
  const isStartDate = (date) => {
    if (!startDate) return false;
    const d = new Date(startDate);
    return date.getDate() === d.getDate() &&
           date.getMonth() === d.getMonth() &&
           date.getFullYear() === d.getFullYear();
  };
  
  // Kiểm tra ngày có phải là ngày kết thúc không
  const isEndDate = (date) => {
    if (!endDate) return false;
    const d = new Date(endDate);
    return date.getDate() === d.getDate() &&
           date.getMonth() === d.getMonth() &&
           date.getFullYear() === d.getFullYear();
  };
  
  // Kiểm tra ngày có nằm trong khoảng không
  const isInRange = (date) => {
    if (!startDate || !endDate) return false;
    const d = formatDateString(date);
    return d >= startDate && d <= endDate;
  };
  
  // Kiểm tra ngày có thể chọn được không
  const isSelectable = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date <= today;
  };
  
  // Chuyển tháng
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  
  // Format ngày hiển thị range
  const formatDisplayDateRange = () => {
    if (!startDate) return 'Tùy chỉnh';
    
    const start = formatDisplayDate(startDate);
    
    if (!endDate) return `Từ ${start}`;
    
    const end = formatDisplayDate(endDate);
    return `${start} - ${end}`;
  };
  
  // Group meals by date
  const groupMealsByDate = () => {
    const groupedMeals = {};
    
    filteredMeals.forEach(meal => {
      if (!groupedMeals[meal.date]) {
        groupedMeals[meal.date] = {
          displayDate: meal.displayDate,
          meals: []
        };
      }
      
      groupedMeals[meal.date].meals.push(meal);
    });
    
    return groupedMeals;
  };
  
  const groupedMeals = groupMealsByDate();
  
  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen py-6 px-4 md:px-6">
      {/* Back button */}
      <button 
        onClick={() => navigate('/schedule/my-eat-schedule')}
        className="mb-6 flex items-center text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400"
      >
        <FaArrowLeft className="mr-2" /> Quay lại lịch ăn uống
      </button>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
          <FaCheckCircle className="mr-2 text-green-600" /> Bữa ăn đã hoàn thành
        </h1>
        
        {/* Search and filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm bữa ăn..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-2 text-sm font-medium rounded-lg border ${
                activeFilter === 'all'
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setActiveFilter('week')}
              className={`px-3 py-2 text-sm font-medium rounded-lg border ${
                activeFilter === 'week'
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
              }`}
            >
              7 ngày
            </button>
            <button
              onClick={() => setActiveFilter('month')}
              className={`px-3 py-2 text-sm font-medium rounded-lg border ${
                activeFilter === 'month'
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
              }`}
            >
              30 ngày
            </button>
            
            {/* Nút tùy chỉnh thời gian */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowDatePicker(!showDatePicker);
                  setSelectingStart(true); // Reset về chọn ngày bắt đầu khi mở calendar
                }}
                className={`px-3 py-2 text-sm font-medium rounded-lg border flex items-center ${
                  activeFilter === 'custom'
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                }`}
              >
                <FaCalendarAlt className="mr-2" />
                {activeFilter === 'custom' ? formatDisplayDateRange() : 'Tùy chỉnh'}
              </button>
              
              {/* Calendar */}
              {showDatePicker && (
                <div 
                  ref={datePickerRef}
                  className="absolute right-0 mt-2 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
                  style={{ width: '320px' }}
                >
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectingStart ? 'Chọn ngày bắt đầu' : 'Chọn ngày kết thúc'}
                    </h4>
                    <button 
                      onClick={() => setShowDatePicker(false)}
                      className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      <FaTimes />
                    </button>
                  </div>
                  
                  {/* Hiển thị khoảng đã chọn */}
                  <div className="mb-3 p-2 bg-gray-100 dark:bg-gray-700 rounded-md text-sm">
                    <div className="flex justify-between">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Từ: </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {startDate ? formatDisplayDate(startDate) : 'Chưa chọn'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Đến: </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {endDate ? formatDisplayDate(endDate) : 'Chưa chọn'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Calendar header */}
                  <div className="flex justify-between items-center mb-2">
                    <button 
                      onClick={prevMonth}
                      className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                      <FaChevronLeft className="text-gray-600 dark:text-gray-400" />
                    </button>
                    
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {currentMonth.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                    </div>
                    
                    <button 
                      onClick={nextMonth}
                      className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                      <FaChevronRight className="text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                  
                  {/* Weekday headers */}
                  <div className="grid grid-cols-7 mb-1">
                    {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => (
                      <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  {/* Calendar grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {getDaysInMonth().map((day, index) => (
                      <button
                        key={index}
                        onClick={() => isSelectable(day.date) && handleSelectDate(day.date)}
                        disabled={!isSelectable(day.date)}
                        className={`
                          h-8 w-8 text-xs font-medium rounded-full flex items-center justify-center
                          ${!day.isCurrentMonth ? 'text-gray-400 dark:text-gray-600' : 'text-gray-800 dark:text-gray-200'}
                          ${isToday(day.date) ? 'bg-blue-100 dark:bg-blue-900/30' : ''}
                          ${isStartDate(day.date) ? 'bg-green-600 text-white' : ''}
                          ${isEndDate(day.date) ? 'bg-green-600 text-white' : ''}
                          ${isInRange(day.date) && !isStartDate(day.date) && !isEndDate(day.date) 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' : ''}
                          ${isSelectable(day.date) 
                            ? 'hover:bg-gray-200 dark:hover:bg-gray-700' 
                            : 'opacity-50 cursor-not-allowed'}
                        `}
                      >
                        {day.day}
                      </button>
                    ))}
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex space-x-2 mt-4">
                    <button
                      onClick={handleApplyDateFilter}
                      disabled={!startDate}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                        startDate 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Áp dụng
                    </button>
                    <button
                      onClick={handleClearDateFilter}
                      className="flex-1 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Hiển thị khoảng thời gian đang lọc */}
        {activeFilter !== 'all' && (
          <div className="mb-4 p-2 bg-green-50 dark:bg-green-900/10 rounded-lg">
            <p className="text-sm text-green-700 dark:text-green-300 flex items-center">
              <FaFilter className="mr-2" />
              {activeFilter === 'week' && 'Đang hiển thị bữa ăn trong 7 ngày qua'}
              {activeFilter === 'month' && 'Đang hiển thị bữa ăn trong 30 ngày qua'}
              {activeFilter === 'custom' && `Đang hiển thị bữa ăn từ ${formatDisplayDateRange()}`}
              
              <button 
                onClick={() => {
                  setActiveFilter('all');
                  setStartDate('');
                  setEndDate('');
                }}
                className="ml-auto text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
              >
                <FaTimes />
              </button>
            </p>
          </div>
        )}
        
        {/* Results */}
        {Object.keys(groupedMeals).length > 0 ? (
          <div className="space-y-6">
            {Object.keys(groupedMeals).sort((a, b) => new Date(b) - new Date(a)).map(date => (
              <div key={date}>
                <div className="flex items-center mb-3">
                  <FaCalendarDay className="text-green-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {groupedMeals[date].displayDate}
                  </h3>
                </div>
                
                <div className="space-y-3">
                  {groupedMeals[date].meals.map(meal => (
                    <div 
                      key={meal.id}
                      className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 rounded-lg p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <span className="inline-block px-2 py-1 text-xs rounded-md mr-2 bg-green-200 dark:bg-green-800/40 text-green-700 dark:text-green-300">
                              {meal.type}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {meal.time}
                            </span>
                          </div>
                          
                          <h4 className="mt-2 font-medium text-green-700 dark:text-green-300">
                            {meal.name}
                          </h4>
                          
                          <div className="mt-1 flex items-center">
                            <span className="text-sm text-green-600 dark:text-green-400">
                              {meal.calories} kcal
                            </span>
                            <span className="ml-2 inline-flex items-center text-xs text-green-600 dark:text-green-400">
                              <FaCheckCircle className="mr-1" /> Hoàn thành
                            </span>
                          </div>
                          
                          {meal.note && (
                            <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800/30 rounded-lg text-sm text-gray-700 dark:text-gray-300">
                              <p className="italic">"{meal.note}"</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 mb-4">
              <FaUtensils className="text-xl" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Không tìm thấy bữa ăn nào</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {searchTerm 
                ? 'Không tìm thấy bữa ăn phù hợp với từ khóa tìm kiếm.' 
                : 'Không có bữa ăn nào đã hoàn thành trong khoảng thời gian đã chọn.'}
            </p>
          </div>
        )}
      </div>
      
      {/* Thống kê tóm tắt */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tổng calo</h3>
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
              <FaUtensils />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {filteredMeals.reduce((sum, meal) => sum + meal.calories, 0).toLocaleString()} kcal
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            từ {filteredMeals.length} bữa ăn đã hoàn thành
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Bữa ăn phổ biến</h3>
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
              <FaCheckCircle />
            </div>
          </div>
          
          <div className="space-y-2">
            {['Sáng', 'Trưa', 'Tối', 'Snack'].map(type => {
              const count = filteredMeals.filter(meal => meal.type === type).length;
              const percentage = filteredMeals.length > 0 ? Math.round((count / filteredMeals.length) * 100) : 0;
              
              return (
                <div key={type}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">{type}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{count} bữa ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                    <div 
                      className={`h-1.5 rounded-full ${
                        type === 'Sáng' ? 'bg-blue-500' :
                        type === 'Trưa' ? 'bg-green-500' :
                        type === 'Tối' ? 'bg-purple-500' : 'bg-yellow-500'
                      }`} 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Xu hướng</h3>
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <FaCalendarDay />
            </div>
          </div>
          
          <div className="flex items-end h-24 mb-2">
            {/* Hiển thị xu hướng 7 ngày gần nhất */}
            {Array.from(new Set(completedMeals.map(meal => meal.date)))
              .sort((a, b) => new Date(a) - new Date(b))
              .slice(-7)
              .map((date, index) => {
                const count = completedMeals.filter(meal => meal.date === date).length;
                const maxCount = 4; // Giả sử tối đa 4 bữa một ngày
                const height = Math.max(10, (count / maxCount) * 100);
                
                return (
                  <div key={date} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-6 bg-blue-500 rounded-t-sm" 
                      style={{ height: `${height}%` }}
                    />
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {date.split('-')[2]}
                    </div>
                  </div>
                );
              })
            }
          </div>
          
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Số bữa ăn đã hoàn thành mỗi ngày
          </p>
        </div>
      </div>
      
      {/* Tips */}
      <div className="bg-green-50 dark:bg-green-900/20 rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-4">
          Mẹo dinh dưỡng
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-green-200 dark:bg-green-800 rounded-full flex items-center justify-center mr-3">
              <FaCheckCircle className="text-green-600 dark:text-green-300" />
            </div>
            <div>
              <h4 className="font-medium text-green-700 dark:text-green-400 text-sm mb-1">Duy trì thói quen tốt</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Tiếp tục duy trì lịch trình ăn uống đều đặn để giúp cơ thể ổn định và tạo thói quen tốt.
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-green-200 dark:bg-green-800 rounded-full flex items-center justify-center mr-3">
              <FaCheckCircle className="text-green-600 dark:text-green-300" />
            </div>
            <div>
              <h4 className="font-medium text-green-700 dark:text-green-400 text-sm mb-1">Đa dạng hóa thực phẩm</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Thử nghiệm các món ăn mới để đảm bảo bạn nhận đủ các chất dinh dưỡng từ nhiều nguồn khác nhau.
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-green-200 dark:bg-green-800 rounded-full flex items-center justify-center mr-3">
              <FaCheckCircle className="text-green-600 dark:text-green-300" />
            </div>
            <div>
              <h4 className="font-medium text-green-700 dark:text-green-400 text-sm mb-1">Theo dõi calo</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Mỗi bữa ăn đều góp phần vào tổng lượng calo hàng ngày, hãy chú ý đến sự cân bằng này.
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-green-200 dark:bg-green-800 rounded-full flex items-center justify-center mr-3">
              <FaCheckCircle className="text-green-600 dark:text-green-300" />
            </div>
            <div>
              <h4 className="font-medium text-green-700 dark:text-green-400 text-sm mb-1">Ghi chú hữu ích</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Tiếp tục ghi lại ghi chú về bữa ăn của bạn để cải thiện chúng trong tương lai.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
  