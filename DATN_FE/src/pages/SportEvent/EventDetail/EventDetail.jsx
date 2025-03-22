import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FaRunning, FaCalendarAlt, FaMapMarkerAlt, FaUserFriends, FaClock, FaInfoCircle, FaCheck, FaArrowLeft, FaMedal, FaTrophy, FaStar, FaChartLine, FaChevronDown, FaChevronUp, FaStopwatch } from 'react-icons/fa'
import { MdDirectionsRun, MdSportsSoccer, MdLeaderboard } from 'react-icons/md'
import { IoIosFitness } from 'react-icons/io'
import moment from 'moment'

// Mock events data to simulate fetching data
const mockEvents = [
  {
    id: 1,
    name: "Spring Marathon 2025",
    date: "2025-03-21T05:00:00Z",
    endDate: "2025-03-21T12:00:00Z",
    location: "City Park",
    address: "123 Park Avenue, Downtown",
    category: "Running",
    participants: 215,
    maxParticipants: 500,
    image: "https://images.unsplash.com/photo-1530549387789-4c1017266635",
    isJoined: false,
    description: "Tham gia cuộc thi chạy marathon mùa xuân hấp dẫn với nhiều phần thưởng và sự kiện đồng hành. Phù hợp với mọi cấp độ người chạy.",
    organizer: "NutriCommunity Running Club",
    distance: "42km (Full Marathon), 21km (Half Marathon), 10km, 5km",
    requirements: "Điền đầy đủ thông tin sức khỏe, mang giày thể thao phù hợp và trang phục thoáng mát",
    benefits: "Áo thun sự kiện, huy chương hoàn thành, nước uống và đồ ăn nhẹ trên đường chạy",
    detailedDescription: `
Sự kiện Marathon Mùa xuân 2025 là một trong những giải marathon lớn nhất năm, thu hút cả vận động viên chuyên nghiệp và người mới bắt đầu. Sự kiện được tổ chức tại Công viên Thành phố với 4 cự ly khác nhau để phù hợp với mọi cấp độ:

- Marathon (42km): Thử thách đỉnh cao cho những người chạy kinh nghiệm
- Bán Marathon (21km): Cự ly trung bình cho người đã có kinh nghiệm
- 10km: Phù hợp cho cả người mới và người có kinh nghiệm
- 5km: Lý tưởng cho người mới bắt đầu hoặc muốn tham gia cùng gia đình

Lộ trình chạy sẽ đi qua những cảnh quan đẹp nhất của thành phố, với nhiều trạm tiếp nước và hỗ trợ y tế dọc đường.

Lịch trình sự kiện:
- 5:00 AM: Mở cổng đón người tham gia
- 6:30 AM: Khởi động cùng huấn luyện viên
- 7:00 AM: Xuất phát Marathon đầy đủ
- 7:30 AM: Xuất phát Bán Marathon
- 8:00 AM: Xuất phát 10km
- 8:30 AM: Xuất phát 5km
- 12:00 PM: Lễ trao giải và kết thúc sự kiện

Tham gia ngay để kết nối với cộng đồng yêu thích chạy bộ và nhận được nhiều phần quà hấp dẫn từ các nhà tài trợ!
    `,
    joinedParticipants: [
      { id: 101, name: "Nguyễn Văn A", avatar: "https://randomuser.me/api/portraits/men/32.jpg", rank: 1, score: 95, time: "00:42:15", achievements: ["Tốc độ tốt nhất", "Hoàn thành sớm"] },
      { id: 102, name: "Trần Thị B", avatar: "https://randomuser.me/api/portraits/women/44.jpg", rank: 2, score: 87, time: "00:45:30", achievements: ["Năng lượng tốt"] },
      { id: 103, name: "Lê Văn C", avatar: "https://randomuser.me/api/portraits/men/62.jpg", rank: 3, score: 82, time: "00:47:22", achievements: ["Bền bỉ"] },
      { id: 104, name: "Phạm Thị D", avatar: "https://randomuser.me/api/portraits/women/58.jpg", rank: 4, score: 78, time: "00:49:15", achievements: ["Kỹ thuật tốt"] },
      { id: 105, name: "Hoàng Văn E", avatar: "https://randomuser.me/api/portraits/men/4.jpg", rank: 5, score: 73, time: "00:52:40", achievements: ["Tiến bộ tốt"] },
      { id: 106, name: "Vũ Thị F", avatar: "https://randomuser.me/api/portraits/women/67.jpg", rank: 6, score: 71, time: "00:54:18", achievements: ["Nỗ lực cao"] },
      { id: 107, name: "Đặng Văn G", avatar: "https://randomuser.me/api/portraits/men/36.jpg", rank: 7, score: 68, time: "00:56:45", achievements: ["Kiên trì"] },
      { id: 108, name: "Ngô Thị H", avatar: "https://randomuser.me/api/portraits/women/23.jpg", rank: 8, score: 65, time: "00:58:22", achievements: ["Tinh thần tốt"] }
    ]
  },
  {
    id: 2,
    name: "Spring Cycling Tour",
    date: "2025-03-28T08:00:00Z",
    endDate: "2025-03-28T16:00:00Z",
    location: "Countryside Route",
    address: "Start Point: Green Valley Resort, Highway 21",
    category: "Cycling",
    participants: 78,
    maxParticipants: 150,
    image: "https://images.unsplash.com/photo-1517649763962-0c623066013b",
    isJoined: true,
    description: "Khám phá những cung đường đẹp nhất với cộng đồng đam mê xe đạp. Tour kéo dài 35km qua những khung cảnh tuyệt đẹp.",
    organizer: "Green Cyclists Association",
    distance: "35km (chính), 15km (ngắn)",
    requirements: "Xe đạp riêng hoặc thuê tại sự kiện, mũ bảo hiểm bắt buộc, bình nước cá nhân",
    benefits: "Áo thun sự kiện, bữa trưa picnic, chứng nhận hoàn thành",
    detailedDescription: `
Tour đạp xe qua vùng nông thôn là cơ hội tuyệt vời để khám phá vẻ đẹp của thiên nhiên và tận hưởng không khí trong lành. Sự kiện này phù hợp cho người từ trung cấp trở lên, với hai lựa chọn:

- Lộ trình chính 35km: Đi qua những cánh đồng, làng mạc truyền thống và khu rừng nhỏ
- Lộ trình ngắn 15km: Phù hợp cho gia đình và người mới bắt đầu

Dọc đường sẽ có điểm dừng chân, trạm tiếp nước và hỗ trợ kỹ thuật. Bữa trưa picnic sẽ được tổ chức tại điểm ngắm cảnh đẹp nhất của lộ trình.

Lịch trình:
- 8:00 AM: Check-in và kiểm tra xe đạp
- 8:30 AM: Bắt đầu xuất phát theo nhóm
- 12:00 PM: Bữa trưa picnic tại điểm ngắm cảnh
- 4:00 PM: Về đích và lễ trao chứng nhận

Với mỗi người tham gia, chúng tôi sẽ đóng góp 5% phí đăng ký vào quỹ trồng cây xanh cho cộng đồng địa phương.
    `,
    joinedParticipants: [
      { id: 106, name: "Đỗ Văn F", avatar: "https://randomuser.me/api/portraits/men/22.jpg", rank: 1, score: 92, time: "01:45:30", achievements: ["Tốc độ cao", "Kỹ thuật xuất sắc"] },
      { id: 107, name: "Ngô Thị G", avatar: "https://randomuser.me/api/portraits/women/24.jpg", rank: 2, score: 85, time: "01:52:15", achievements: ["Kiểm soát tốt"] },
      { id: 108, name: "Vũ Văn H", avatar: "https://randomuser.me/api/portraits/men/42.jpg", rank: 3, score: 79, time: "01:58:40", achievements: ["Bền bỉ"] },
      { id: 109, name: "Phạm Minh I", avatar: "https://randomuser.me/api/portraits/men/28.jpg", rank: 4, score: 76, time: "02:03:22", achievements: ["Tiến bộ tốt"] },
      { id: 110, name: "Lê Thu J", avatar: "https://randomuser.me/api/portraits/women/48.jpg", rank: 5, score: 70, time: "02:10:15", achievements: ["Nỗ lực cao"] }
    ]
  },
  {
    id: 3,
    name: "Yoga in the Park",
    date: "2025-03-15T08:30:00Z",
    endDate: "2025-03-15T11:00:00Z",
    location: "Sunrise Park",
    address: "45 Garden Street, East District",
    category: "Yoga",
    participants: 42,
    maxParticipants: 60,
    image: "https://images.unsplash.com/photo-1588286840104-8957b019727f",
    isJoined: false,
    description: "Buổi tập yoga ngoài trời, kết nối với thiên nhiên và cải thiện sức khỏe thể chất và tinh thần. Phù hợp cho mọi trình độ.",
    organizer: "Harmony Yoga Studio",
    distance: "N/A",
    requirements: "Thảm yoga (có thể thuê tại sự kiện), trang phục thoải mái, chai nước",
    benefits: "Hướng dẫn từ giáo viên chuyên nghiệp, trà thảo mộc sau buổi tập, tài liệu hướng dẫn yoga tại nhà",
    detailedDescription: `
Buổi tập Yoga trong Công viên là cơ hội tuyệt vời để kết nối với thiên nhiên và cải thiện sức khỏe của bạn. Sự kiện này phù hợp cho mọi trình độ, từ người mới bắt đầu đến người đã có kinh nghiệm.

Buổi tập sẽ bao gồm:
- Khởi động và giãn cơ nhẹ nhàng
- Các tư thế yoga cơ bản và trung cấp (có hướng dẫn điều chỉnh cho người mới)
- Thực hành hơi thở và thiền định
- Thư giãn sâu kết thúc buổi tập

Giáo viên hướng dẫn là các chuyên gia với hơn 10 năm kinh nghiệm, sẽ giúp bạn điều chỉnh tư thế và đảm bảo bạn tập luyện an toàn, hiệu quả.

Lịch trình:
- 8:30 AM: Check-in và chuẩn bị
- 9:00 AM: Bắt đầu buổi tập
- 10:45 AM: Thư giãn và kết thúc
- 11:00 AM: Trà thảo mộc và giao lưu

Hãy tham gia để khởi đầu ngày cuối tuần với nguồn năng lượng tích cực và sự bình an!
    `,
    joinedParticipants: [
      { id: 109, name: "Lý Thị I", avatar: "https://randomuser.me/api/portraits/women/32.jpg", rank: 1, score: 96, time: "02:00:00", achievements: ["Tư thế hoàn hảo", "Kỹ thuật thở tốt"] },
      { id: 110, name: "Đinh Văn K", avatar: "https://randomuser.me/api/portraits/men/45.jpg", rank: 2, score: 90, time: "02:00:00", achievements: ["Tập trung cao"] },
      { id: 111, name: "Mai Thị L", avatar: "https://randomuser.me/api/portraits/women/62.jpg", rank: 3, score: 87, time: "02:00:00", achievements: ["Tiến bộ nhanh"] },
      { id: 112, name: "Trần Văn M", avatar: "https://randomuser.me/api/portraits/men/52.jpg", rank: 4, score: 82, time: "02:00:00", achievements: ["Cân bằng tốt"] },
      { id: 113, name: "Hoàng Thị N", avatar: "https://randomuser.me/api/portraits/women/56.jpg", rank: 5, score: 78, time: "02:00:00", achievements: ["Kiên trì"] }
    ]
  }
];

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAllParticipants, setShowAllParticipants] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(true);

  useEffect(() => {
    // Simulate API call with a delay
    const timer = setTimeout(() => {
      const foundEvent = mockEvents.find(e => e.id === parseInt(id));
      if (foundEvent) {
        setEvent(foundEvent);
      } else {
        setError('Không tìm thấy sự kiện');
      }
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [id]);

  const toggleJoin = () => {
    if (event) {
      if (!event.isJoined) {
        // User is joining the event
        setEvent(prev => ({
          ...prev,
          isJoined: true,
          participants: prev.participants + 1
        }));
        
        // After a short delay, navigate to MyEvents page
        setTimeout(() => {
          navigate('/sport-event/my-events', { state: { joinedEvent: event.id } });
        }, 1000);
      } else {
        // User is leaving the event
        setEvent(prev => ({
          ...prev,
          isJoined: false,
          participants: prev.participants - 1
        }));
        
        // After a short delay, navigate to History page
        setTimeout(() => {
          navigate('/sport-event/history', { state: { leftEvent: event.id } });
        }, 1000);
      }
    }
  };

  const getCategoryIcon = (category) => {
    switch(category?.toLowerCase()) {
      case 'running':
        return <FaRunning className="text-green-500 text-2xl" />;
      case 'cycling':
        return <MdDirectionsRun className="text-green-500 text-2xl" />;
      case 'yoga':
        return <IoIosFitness className="text-green-500 text-2xl" />;
      default:
        return <MdSportsSoccer className="text-green-500 text-2xl" />;
    }
  };

  const goBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="text-center">
            <div className="text-red-500 text-2xl mb-4"><FaInfoCircle /></div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{error}</h2>
            <button 
              className="mt-4 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
              onClick={goBack}
            >
              Quay lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!event) return null;

  const isEventInPast = new Date(event.endDate) < new Date();
  const isEventStarted = new Date(event.date) <= new Date();
  const displayedParticipants = showAllParticipants 
    ? event.joinedParticipants 
    : event.joinedParticipants?.slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button 
        onClick={goBack}
        className="mb-4 flex items-center text-green-500 hover:text-green-600 transition-colors"
      >
        <FaArrowLeft className="mr-2" />
        Quay lại
      </button>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:flex-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-8">
            <div className="relative h-80 md:h-96">
              <img 
                src={event.image} 
                alt={event.name} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <div className="flex items-center mb-2">
                  {getCategoryIcon(event.category)}
                  <span className="ml-2 bg-green-500 text-white text-xs py-1 px-2 rounded-full">
                    {event.category}
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{event.name}</h1>
                <div className="flex items-center text-white text-opacity-90 mb-1">
                  <FaCalendarAlt className="mr-2" />
                  {moment(event.date).format('DD/MM/YYYY - HH:mm')}
                </div>
                <div className="flex items-center text-white text-opacity-90">
                  <FaMapMarkerAlt className="mr-2" />
                  {event.location}
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div className="flex items-center">
                  <div className="mr-6">
                    <div className="text-gray-500 dark:text-gray-400 text-sm mb-1">Thời gian bắt đầu</div>
                    <div className="flex items-center text-gray-900 dark:text-white">
                      <FaClock className="mr-2 text-green-500" />
                      {moment(event.date).format('HH:mm')}
                    </div>
                  </div>
                  <div className="mr-6">
                    <div className="text-gray-500 dark:text-gray-400 text-sm mb-1">Thời gian kết thúc</div>
                    <div className="flex items-center text-gray-900 dark:text-white">
                      <FaClock className="mr-2 text-green-500" />
                      {moment(event.endDate).format('HH:mm')}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 dark:text-gray-400 text-sm mb-1">Tham gia</div>
                    <div className="flex items-center text-gray-900 dark:text-white">
                      <FaUserFriends className="mr-2 text-green-500" />
                      {event.participants}/{event.maxParticipants}
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={toggleJoin}
                  className={`px-6 py-2 rounded-md font-medium transition-colors ${
                    isEventInPast
                      ? 'bg-gray-300 text-gray-700 cursor-not-allowed'
                      : event.isJoined
                        ? 'bg-blue-100 text-blue-600 hover:bg-blue-200 border border-blue-300'
                        : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                  disabled={isEventInPast}
                >
                  {isEventInPast 
                    ? 'Đã kết thúc' 
                    : event.isJoined 
                      ? 'Hủy tham gia' 
                      : 'Tham gia sự kiện'
                  }
                </button>
              </div>

              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Giới thiệu sự kiện</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {event.description}
                </p>
                <div className="whitespace-pre-line text-gray-700 dark:text-gray-300">
                  {event.detailedDescription}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Thông tin sự kiện</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2 mt-0.5"><FaInfoCircle /></span>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Đơn vị tổ chức:</span>
                        <span className="ml-2 text-gray-600 dark:text-gray-400">{event.organizer}</span>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2 mt-0.5"><FaMapMarkerAlt /></span>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Địa chỉ:</span>
                        <span className="ml-2 text-gray-600 dark:text-gray-400">{event.address}</span>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2 mt-0.5"><FaRunning /></span>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Quãng đường:</span>
                        <span className="ml-2 text-gray-600 dark:text-gray-400">{event.distance}</span>
                      </div>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Yêu cầu & Quyền lợi</h3>
                  <div className="mb-3">
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Yêu cầu tham gia:</h4>
                    <p className="text-gray-600 dark:text-gray-400">{event.requirements}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Quyền lợi:</h4>
                    <p className="text-gray-600 dark:text-gray-400">{event.benefits}</p>
                  </div>
                </div>
              </div>

              {event.joinedParticipants && event.joinedParticipants.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Người tham gia ({event.joinedParticipants.length})
                  </h2>
                  <div className="flex flex-wrap gap-4 mb-3">
                    {displayedParticipants.map(participant => (
                      <div key={participant.id} className="flex items-center">
                        <img 
                          src={participant.avatar} 
                          alt={participant.name} 
                          className="w-10 h-10 rounded-full mr-2"
                        />
                        <span className="text-gray-700 dark:text-gray-300">{participant.name}</span>
                      </div>
                    ))}
                  </div>
                  {event.joinedParticipants.length > 5 && (
                    <button 
                      className="text-green-500 hover:text-green-600 transition-colors text-sm flex items-center"
                      onClick={() => setShowAllParticipants(!showAllParticipants)}
                    >
                      {showAllParticipants ? 'Hiển thị ít hơn' : `Xem thêm ${event.joinedParticipants.length - 5} người tham gia khác`}
                    </button>
                  )}
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <button 
                    onClick={goBack}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Quay lại
                  </button>
                  
                  {!isEventInPast && (
                    <button 
                      onClick={toggleJoin}
                      className={`px-6 py-2 rounded-md font-medium transition-colors ${
                        event.isJoined
                          ? 'bg-blue-100 text-blue-600 hover:bg-blue-200 border border-blue-300'
                          : 'bg-green-500 text-white hover:bg-green-600'
                      }`}
                    >
                      {event.isJoined 
                        ? <span className="flex items-center"><FaCheck className="mr-2" /> Đã tham gia</span>
                        : 'Tham gia ngay'
                      }
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:w-80 w-full">
          <div className="sticky top-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div 
                className="bg-gradient-to-r from-green-500 to-green-600 p-4 flex justify-between items-center cursor-pointer"
                onClick={() => setShowLeaderboard(!showLeaderboard)}
              >
                <div className="flex items-center text-white">
                  <MdLeaderboard className="text-xl mr-2" />
                  <h3 className="text-lg font-semibold">Bảng xếp hạng</h3>
                </div>
                <div className="text-white">
                  {showLeaderboard ? <FaChevronUp /> : <FaChevronDown />}
                </div>
              </div>

              {showLeaderboard && (
                <div className="p-4">
                  {!isEventStarted ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <FaChartLine className="mx-auto text-4xl mb-3 text-gray-300 dark:text-gray-600" />
                      <p>Bảng xếp hạng sẽ được mở<br/>khi sự kiện bắt đầu</p>
                      <p className="mt-2 text-sm">
                        {moment(event.date).format('DD/MM/YYYY HH:mm')}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-center mb-4 text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 pb-2">
                        <span className="w-10 font-medium">Hạng</span>
                        <span className="flex-1 font-medium">Người tham gia</span>
                        <span className="w-16 text-right font-medium">Điểm</span>
                      </div>
                      
                      <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-1">
                        {event.joinedParticipants?.sort((a, b) => a.rank - b.rank).map((participant, index) => (
                          <div key={participant.id} className="flex items-center">
                            <div className="w-10 flex-shrink-0">
                              {participant.rank === 1 ? (
                                <FaTrophy className="text-yellow-500 text-lg" />
                              ) : participant.rank === 2 ? (
                                <FaMedal className="text-gray-400 text-lg" />
                              ) : participant.rank === 3 ? (
                                <FaMedal className="text-amber-600 text-lg" />
                              ) : (
                                <span className="text-gray-500 dark:text-gray-400 font-medium">{participant.rank}</span>
                              )}
                            </div>
                            <div className="flex items-center flex-1 min-w-0">
                              <img 
                                src={participant.avatar} 
                                alt={participant.name} 
                                className="w-8 h-8 rounded-full mr-2 flex-shrink-0"
                              />
                              <div className="min-w-0 overflow-hidden">
                                <div className="text-gray-900 dark:text-white text-sm font-medium truncate">{participant.name}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                  <FaStopwatch className="mr-1 flex-shrink-0" />
                                  <span className="truncate">{participant.time}</span>
                                </div>
                              </div>
                            </div>
                            <div className="w-16 text-right flex-shrink-0">
                              <div className="text-gray-900 dark:text-white font-medium">{participant.score}</div>
                              {participant.achievements && participant.achievements.length > 0 && (
                                <div className="flex justify-end">
                                  <div className="relative group">
                                    <FaStar className="text-yellow-500 ml-1 cursor-pointer" />
                                    <div className="absolute right-0 bottom-full mb-2 w-max z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                      <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 shadow-lg">
                                        {participant.achievements.join(', ')}
                                        <div className="absolute right-1 top-full w-2 h-2 bg-gray-800 transform rotate-45"></div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="text-gray-700 dark:text-gray-300 font-medium mb-2">Thành tích nổi bật</h4>
                        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          {event.joinedParticipants.filter(p => p.achievements?.length > 0).slice(0, 3).map(participant => (
                            <div key={`achievement-${participant.id}`} className="flex items-start">
                              <FaStar className="text-yellow-500 mt-0.5 mr-1 flex-shrink-0" />
                              <div className="min-w-0">
                                <div className="truncate">
                                  <span className="font-medium">{participant.name}:</span> {participant.achievements.join(', ')}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 