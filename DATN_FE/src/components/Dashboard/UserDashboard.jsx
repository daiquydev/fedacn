import { useState, useEffect, useRef, createRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaTrophy, FaRegCalendarAlt, FaUtensils, FaArrowRight, FaRegClock, FaChevronRight, FaChevronLeft } from 'react-icons/fa';
import { MdUpdate, MdDashboard } from 'react-icons/md';
import moment from 'moment';
import 'moment/locale/vi';
import { useQuery } from '@tanstack/react-query';
import { getProfile } from '../../apis/userApi';
// Thêm các import khác nếu cần
// import { getChallenges } from 'src/apis/challengeApi'; 
// import { getEvents } from 'src/apis/eventApi';
// import { getDiets } from 'src/apis/dietApi';

const UserDashboard = () => {
  const navigate = useNavigate();
  
  // Truy vấn dữ liệu người dùng
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => getProfile(),
    retry: 1,
    onError: (error) => {
      console.error("Lỗi khi tải thông tin người dùng:", error);
    }
  });
  
  // TODO: Thay thế mock data bằng API calls thực tế
  // Ví dụ: 
  // const { data: challengesData } = useQuery({
  //   queryKey: ['userChallenges'],
  //   queryFn: () => getChallenges({ joined: true, limit: 5 })
  // });
  
  // Mock data cho demo - đã mở rộng để có nhiều mục hơn
  const mockChallenges = [
    {
      _id: '1',
      title: 'Chạy 100km trong 30 ngày',
      progress: 65,
      endDate: moment().add(10, 'days').toISOString(),
      image: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8'
    },
    {
      _id: '2',
      title: 'Tập luyện 20 phút mỗi ngày',
      progress: 45,
      endDate: moment().add(15, 'days').toISOString(),
      image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438'
    },
    {
      _id: '3',
      title: 'Đạp xe 200km trong tháng',
      progress: 80,
      endDate: moment().add(5, 'days').toISOString(),
      image: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182'
    },
    {
      _id: '4',
      title: 'Uống đủ 2L nước mỗi ngày',
      progress: 30,
      endDate: moment().add(20, 'days').toISOString(),
      image: 'https://images.unsplash.com/photo-1544148103-0773bf10d330'
    }
  ];

  const mockEvents = [
    {
      _id: '1',
      title: 'Marathon Hồ Gươm',
      eventDate: moment().add(5, 'days').toISOString(),
      image: 'https://images2.thanhnien.vn/thumb_w/686/528068263637045248/2024/8/25/tbm7637-17245883933481176972446-0-646-1600-1846-crop-1724588660716339719111.jpg'
    },
    {
      _id: '2',
      title: 'Giải chạy VnExpress Marathon',
      eventDate: moment().add(12, 'days').toISOString(),
      image: 'https://images.unsplash.com/photo-1530549387789-4c1017266635'
    },
    {
      _id: '3',
      title: 'Giải đạp xe Đà Lạt',
      eventDate: moment().add(20, 'days').toISOString(),
      image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b'
    },
    {
      _id: '4',
      title: 'Giải bơi lội Phú Quốc',
      eventDate: moment().add(15, 'days').toISOString(),
      image: 'https://images.unsplash.com/photo-1530549387789-4c1017266635'
    },
    {
      _id: '5',
      title: 'Fitness Challenge Hà Nội',
      eventDate: moment().add(8, 'days').toISOString(),
      image: 'https://images.unsplash.com/photo-1434596922112-19c563067271'
    }
  ];

  const mockDiets = [
    {
      _id: '1',
      title: 'Chế độ ăn Clean Eating',
      startDate: moment().subtract(3, 'days').toISOString(),
      endDate: moment().add(18, 'days').toISOString(),
      image: 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2'
    },
    {
      _id: '2',
      title: 'Chế độ Low Carb cho người tập luyện',
      startDate: moment().subtract(5, 'days').toISOString(),
      endDate: moment().add(25, 'days').toISOString(),
      image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061'
    },
    {
      _id: '3',
      title: 'Thực đơn giàu protein',
      startDate: moment().subtract(1, 'days').toISOString(),
      endDate: moment().add(30, 'days').toISOString(),
      image: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435'
    }
  ];

  // Kiểm tra xem có dữ liệu nào để hiển thị không
  const hasActiveData = mockChallenges.length > 0 || mockEvents.length > 0 || mockDiets.length > 0;

  return (
    <div className="w-full shadow-lg bg-white rounded-xl dark:bg-color-primary dark:border-none overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-700 dark:to-indigo-800 py-4 px-5">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <MdDashboard className="mr-2 text-xl" /> 
          Hoạt động của bạn
        </h3>
      </div>

      <div className="p-5">
        {hasActiveData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Thử thách đang tham gia */}
            <DashboardCardSlider 
              title="Thử thách đang tham gia"
              icon={<FaTrophy className="text-yellow-500" />}
              footerLink="/challenge/my-challenges"
              footerText="Xem tất cả thử thách"
              gradientFrom="from-yellow-50"
              gradientTo="to-orange-50"
              darkGradientFrom="dark:from-gray-800"
              darkGradientTo="dark:to-gray-900"
              borderColor="border-yellow-200"
              darkBorderColor="dark:border-yellow-900"
              hoverColor="group-hover:text-yellow-600"
              footerColor="text-yellow-600"
              footerHoverColor="hover:text-yellow-700"
              darkFooterColor="dark:text-yellow-400"
              darkHoverFooterColor="dark:hover:text-yellow-300"
              items={mockChallenges}
              renderItem={(challenge, isActive) => (
                <div key={challenge._id} className={`relative transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0 absolute top-0 left-0 right-0'}`}>
                  <div className="flex gap-3 items-center mb-3">
                    <div 
                      className="w-12 h-12 rounded-full bg-cover bg-center border-2 border-yellow-300 dark:border-yellow-600" 
                      style={{backgroundImage: `url(${challenge.image})`}}
                    />
                    <div className="flex-grow overflow-hidden">
                      <h5 className="font-medium text-gray-800 dark:text-white line-clamp-1 group-hover:text-yellow-600 transition-colors duration-200">{challenge.title}</h5>
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <FaRegClock className="mr-1" />
                        <span>{moment(challenge.endDate).locale('vi').fromNow()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 dark:text-gray-300">Tiến độ</span>
                      <span className="font-medium text-yellow-600 dark:text-yellow-400">{challenge.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                      <div 
                        className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-2 rounded-full" 
                        style={{ width: `${challenge.progress}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-3">
                    <button 
                      onClick={() => navigate(`/challenge/${challenge._id}`)}
                      className="text-xs text-gray-600 hover:text-yellow-600 dark:text-gray-300 dark:hover:text-yellow-400 flex items-center transition-colors"
                    >
                      Xem chi tiết <FaChevronRight className="ml-1 w-2.5 h-2.5" />
                    </button>
                    <button 
                      onClick={() => navigate(`/challenge/${challenge._id}?action=update`)}
                      className="text-xs bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white px-2.5 py-1.5 rounded-md flex items-center transition-colors"
                    >
                      <MdUpdate className="mr-1" /> Cập nhật
                    </button>
                  </div>
                </div>
              )}
            />

            {/* Sự kiện sắp tới */}
            <DashboardCardSlider 
              title="Sự kiện sắp tới"
              icon={<FaRegCalendarAlt className="text-red-500" />}
              footerLink="/sport-event/my-events"
              footerText="Xem tất cả sự kiện"
              gradientFrom="from-red-50"
              gradientTo="to-pink-50"
              darkGradientFrom="dark:from-gray-800"
              darkGradientTo="dark:to-gray-900"
              borderColor="border-red-200"
              darkBorderColor="dark:border-red-900"
              hoverColor="group-hover:text-red-600"
              footerColor="text-red-600"
              footerHoverColor="hover:text-red-700"
              darkFooterColor="dark:text-red-400"
              darkHoverFooterColor="dark:hover:text-red-300"
              items={mockEvents}
              renderItem={(event, isActive) => (
                <div key={event._id} className={`flex flex-col h-full transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0 absolute top-0 left-0 right-0'}`}>
                  <div className="flex gap-3 items-center mb-3">
                    <div 
                      className="w-12 h-12 rounded-full bg-cover bg-center border-2 border-red-300 dark:border-red-700" 
                      style={{backgroundImage: `url(${event.image})`}}
                    />
                    <div className="flex-grow overflow-hidden">
                      <h5 className="font-medium text-gray-800 dark:text-white line-clamp-1 group-hover:text-red-600 transition-colors duration-200">
                        {event.title}
                      </h5>
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <FaRegCalendarAlt className="mr-1" />
                        <span>{moment(event.eventDate).locale('vi').format('DD/MM/YYYY')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-grow mb-4">
                    <div className="inline-flex px-2 py-1 bg-red-100 dark:bg-red-900/30 rounded text-xs text-red-600 dark:text-red-400">
                      {moment(event.eventDate).diff(moment(), 'days')} ngày nữa
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <button 
                      onClick={() => navigate(`/sport-event/${event._id}`)}
                      className="text-xs bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-1.5 rounded-md flex items-center transition-colors"
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              )}
            />

            {/* Thực đơn đang áp dụng */}
            <DashboardCardSlider 
              title="Thực đơn đang áp dụng"
              icon={<FaUtensils className="text-green-500" />}
              footerLink="/schedule/my-eat-schedule"
              footerText="Xem tất cả thực đơn"
              gradientFrom="from-green-50"
              gradientTo="to-emerald-50"
              darkGradientFrom="dark:from-gray-800"
              darkGradientTo="dark:to-gray-900"
              borderColor="border-green-200"
              darkBorderColor="dark:border-green-900"
              hoverColor="group-hover:text-green-600"
              footerColor="text-green-600"
              footerHoverColor="hover:text-green-700"
              darkFooterColor="dark:text-green-400"
              darkHoverFooterColor="dark:hover:text-green-300"
              items={mockDiets}
              renderItem={(diet, isActive) => (
                <div key={diet._id} className={`flex flex-col h-full transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0 absolute top-0 left-0 right-0'}`}>
                  <div className="flex gap-3 items-center mb-3">
                    <div 
                      className="w-12 h-12 rounded-full bg-cover bg-center border-2 border-green-300 dark:border-green-700" 
                      style={{backgroundImage: `url(${diet.image})`}}
                    />
                    <div className="flex-grow overflow-hidden">
                      <h5 className="font-medium text-gray-800 dark:text-white line-clamp-1 group-hover:text-green-600 transition-colors duration-200">
                        {diet.title}
                      </h5>
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <FaRegCalendarAlt className="mr-1" />
                        <span>Ngày {moment(diet.startDate).locale('vi').format('DD/MM')} - {moment(diet.endDate).locale('vi').format('DD/MM/YYYY')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-grow mb-4">
                    <div className="inline-flex px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded text-xs text-green-600 dark:text-green-400">
                      Còn {moment(diet.endDate).diff(moment(), 'days')} ngày
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <button 
                      onClick={() => navigate(`/meal-plan/${diet._id}`)}
                      className="text-xs bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-3 py-1.5 rounded-md flex items-center transition-colors"
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              )}
            />
          </div>
        ) : (
          // Trạng thái khi chưa có dữ liệu
          <div className="py-8">
            <div className="text-center max-w-2xl mx-auto">
              <div className="inline-flex p-4 rounded-full bg-blue-50 dark:bg-blue-900/20 mb-4">
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">
                Bắt đầu hành trình của bạn!
              </h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-6 max-w-md mx-auto">
                Tham gia các thử thách, sự kiện hoặc áp dụng thực đơn mới để theo dõi tiến trình của bạn tại đây.
              </p>
              
              <div className="flex flex-wrap gap-3 justify-center">
                <Link 
                  to="/challenge"
                  className="flex items-center justify-center gap-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
                >
                  <FaTrophy className="w-4 h-4" />
                  <span>Khám phá thử thách</span>
                </Link>
                <Link 
                  to="/schedule/my-eat-schedule"
                  className="flex items-center justify-center gap-1 px-4 py-2.5 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 transition-all shadow-md hover:shadow-lg"
                >
                  <FaUtensils className="w-4 h-4" />
                  <span>Xem thực đơn</span>
                </Link>
                <Link 
                  to="/sport-event"
                  className="flex items-center justify-center gap-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg hover:from-red-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg"
                >
                  <FaRegCalendarAlt className="w-4 h-4" />
                  <span>Tham gia sự kiện</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Tạo component con cho mỗi card có tính năng slide tự động
const DashboardCardSlider = ({ 
  title, 
  icon, 
  items = [], 
  renderItem,
  footerLink, 
  footerText,
  gradientFrom = "from-gray-50",
  gradientTo = "to-white",
  darkGradientFrom = "dark:from-gray-800",
  darkGradientTo = "dark:to-gray-900",
  borderColor = "border-gray-100",
  darkBorderColor = "dark:border-gray-700",
  hoverColor = "group-hover:text-blue-600",
  footerColor = "text-blue-600",
  footerHoverColor = "hover:text-blue-800",
  darkFooterColor = "dark:text-blue-400", 
  darkHoverFooterColor = "dark:hover:text-blue-300",
  slideDuration = 5000, // Thời gian mỗi slide (mặc định 5 giây)
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [cardHeight, setCardHeight] = useState('auto');
  const itemRefs = useRef([]);
  const autoPlayRef = useRef(null);
  const slideContainerRef = useRef(null);

  // Khởi tạo mảng refs cho mỗi item
  useEffect(() => {
    itemRefs.current = Array(items.length).fill().map((_, i) => itemRefs.current[i] || createRef());
  }, [items.length]);

  // Tính toán chiều cao tối đa của các items để card có kích thước cố định
  useEffect(() => {
    if (items.length === 0) return;

    const calculateMaxHeight = () => {
      // Kiểm tra refs trước khi sử dụng
      if (!itemRefs.current || itemRefs.current.length === 0) return 0;

      // Đặt tất cả các items về visible để đo - kiểm tra null trước khi truy cập
      itemRefs.current.forEach((ref, index) => {
        if (ref && ref.current) {
          ref.current.style.opacity = "1";
          ref.current.style.position = "relative";
        }
      });
      
      // Đo chiều cao
      let maxHeight = 0;
      itemRefs.current.forEach(ref => {
        if (ref && ref.current) {
          const height = ref.current.offsetHeight;
          maxHeight = Math.max(maxHeight, height);
        }
      });

      // Đặt lại các items không phải current về ẩn
      itemRefs.current.forEach((ref, index) => {
        if (ref && ref.current && index !== currentIndex) {
          ref.current.style.opacity = "0";
          ref.current.style.position = "absolute";
        }
      });

      // Thêm padding để tránh chặt cụt nội dung
      return maxHeight > 0 ? maxHeight + 4 : 200; // Giá trị mặc định nếu không thể tính
    };

    // Cần timeout để đảm bảo DOM đã render
    const timer = setTimeout(() => {
      const maxItemHeight = calculateMaxHeight();
      if (maxItemHeight > 0) {
        setCardHeight(`${maxItemHeight}px`);
      }
    }, 100);

    // Tính lại kích thước khi cửa sổ thay đổi kích thước
    const handleResize = () => {
      const newMaxHeight = calculateMaxHeight();
      if (newMaxHeight > 0) {
        setCardHeight(`${newMaxHeight}px`);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [items.length, currentIndex]);

  // Xử lý tự động chuyển slide
  useEffect(() => {
    if (items.length <= 1) return;
    
    if (isAutoPlaying) {
      autoPlayRef.current = setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
      }, slideDuration);
    }
    
    return () => {
      if (autoPlayRef.current) {
        clearTimeout(autoPlayRef.current);
      }
    };
  }, [currentIndex, isAutoPlaying, items.length, slideDuration]);

  // Pause auto-play when hover
  const handleMouseEnter = () => {
    setIsAutoPlaying(false);
  };

  const handleMouseLeave = () => {
    setIsAutoPlaying(true);
  };

  // Navigation handlers
  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + items.length) % items.length);
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  return (
    <div 
      className={`bg-gradient-to-br ${gradientFrom} ${gradientTo} ${darkGradientFrom} ${darkGradientTo} p-4 rounded-xl border ${borderColor} ${darkBorderColor} hover:shadow-lg transition-all duration-300 group h-full flex flex-col`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="text-lg">{icon}</div>
          <h4 className="font-semibold text-gray-800 dark:text-gray-100">{title}</h4>
        </div>
        {items.length > 1 && (
          <div className="flex gap-1">
            <button 
              onClick={goToPrevious}
              className="p-1 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-colors"
            >
              <FaChevronLeft className="w-3 h-3" />
            </button>
            <button 
              onClick={goToNext}
              className="p-1 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-colors"
            >
              <FaChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
      
      <div 
        ref={slideContainerRef} 
        className="flex-grow mb-3 relative" 
        style={{ height: cardHeight, minHeight: '150px' }}
      >
        {items.length > 0 ? (
          items.map((item, index) => {
            const isActive = index === currentIndex;
            // Kiểm tra itemRefs trước khi truy cập
            const ref = itemRefs.current && index < itemRefs.current.length ? itemRefs.current[index] : null;
            
            return (
              <div 
                key={index} 
                ref={ref} 
                className={`w-full transition-all duration-300 ${
                  isActive 
                    ? 'opacity-100 relative z-10' 
                    : 'opacity-0 absolute top-0 left-0 right-0 z-0'
                }`}
              >
                {renderItem(item, isActive)}
              </div>
            );
          })
        ) : (
          <div className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
            Chưa có {title.toLowerCase()}
          </div>
        )}
      </div>
      
      {/* Slide indicators */}
      {items.length > 1 && (
        <div className="flex justify-center gap-1.5 my-2">
          {items.map((_, index) => (
            <button 
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'bg-gray-600 dark:bg-gray-300 w-3' 
                  : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
      
      <div className="pt-2 border-t border-gray-200 dark:border-gray-700 mt-auto">
        <Link 
          to={footerLink}
          className={`text-sm ${footerColor} ${footerHoverColor} ${darkFooterColor} ${darkHoverFooterColor} font-medium flex items-center justify-center transition-colors`}
        >
          {footerText} <FaArrowRight className="ml-1 w-3 h-3" />
        </Link>
      </div>
    </div>
  );
};

export default UserDashboard; 