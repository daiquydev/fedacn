import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaRunning, FaCalendarAlt, FaMapMarkerAlt, FaUserFriends, FaFilter, FaSearch } from 'react-icons/fa'
import { MdSportsSoccer, MdDirectionsRun } from 'react-icons/md'
import { IoIosFitness } from 'react-icons/io'
import moment from 'moment'

// Mock data for upcoming events
const mockEvents = [
  {
    id: 1,
    name: "Summer Marathon 2024",
    date: "2024-06-15T07:00:00Z",
    location: "City Park",
    category: "Running",
    participants: 215,
    maxParticipants: 500,
    image: "https://images.unsplash.com/photo-1530549387789-4c1017266635",
    isJoined: false,
    description: "Tham gia cuộc thi chạy marathon mùa hè hấp dẫn với nhiều phần thưởng và sự kiện đồng hành. Phù hợp với mọi cấp độ người chạy."
  },
  {
    id: 2,
    name: "Cycling Tour",
    date: "2024-07-10T08:30:00Z",
    location: "Countryside Route",
    category: "Cycling",
    participants: 78,
    maxParticipants: 150,
    image: "https://images.unsplash.com/photo-1517649763962-0c623066013b",
    isJoined: true,
    description: "Khám phá những cung đường đẹp nhất với cộng đồng đam mê xe đạp. Tour kéo dài 35km qua những khung cảnh tuyệt đẹp."
  },
  {
    id: 3,
    name: "Yoga in the Park",
    date: "2024-05-25T16:00:00Z",
    location: "Harmony Garden",
    category: "Yoga",
    participants: 45,
    maxParticipants: 60,
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b",
    isJoined: false,
    description: "Tham gia buổi yoga ngoài trời cùng các huấn luyện viên chuyên nghiệp. Phù hợp cho mọi cấp độ từ người mới bắt đầu đến nâng cao."
  },
  {
    id: 7,
    name: "Basketball Tournament",
    date: "2024-08-05T14:00:00Z",
    location: "City Sports Center",
    category: "Basketball",
    participants: 120,
    maxParticipants: 200,
    image: "https://images.unsplash.com/photo-1546519638-68e109498ffc",
    isJoined: false,
    description: "Giải đấu bóng rổ hàng năm với các đội từ nhiều khu vực. Đăng ký theo đội hoặc cá nhân để được xếp vào đội."
  },
  {
    id: 8,
    name: "Swimming Challenge",
    date: "2024-07-20T09:00:00Z",
    location: "Olympic Pool",
    category: "Swimming",
    participants: 55,
    maxParticipants: 100,
    image: "https://images.unsplash.com/photo-1530549387789-4c1017266635",
    isJoined: false,
    description: "Thử thách bơi với nhiều cự ly khác nhau. Có huấn luyện viên hỗ trợ và nhiều giải thưởng hấp dẫn."
  },
  {
    id: 9,
    name: "Trail Running Adventure",
    date: "2024-09-12T07:30:00Z",
    location: "Mountain Trails",
    category: "Running",
    participants: 89,
    maxParticipants: 150,
    image: "https://images.unsplash.com/photo-1483721310020-03333e577078",
    isJoined: false,
    description: "Trải nghiệm chạy bộ địa hình với độ cao và thử thách đa dạng. Phù hợp cho người có kinh nghiệm chạy địa hình."
  }
];

export default function SportEvent() {
  const navigate = useNavigate();
  const [events, setEvents] = useState(mockEvents);
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleEventClick = (eventId) => {
    navigate(`/sport-event/${eventId}`);
  };

  const handleJoinEvent = (eventId, e) => {
    e.stopPropagation(); // Prevent the click from bubbling up to the card
    
    // Update the event's joined status in the state
    setEvents(prevEvents => 
      prevEvents.map(event => 
        event.id === eventId 
          ? { ...event, isJoined: true, participants: event.participants + 1 }
          : event
      )
    );
    
    // After a short delay, navigate to MyEvents page
    setTimeout(() => {
      navigate('/sport-event/my-events', { state: { joinedEvent: eventId } });
    }, 1000);
  };

  // Filter events based on category and search query
  const filteredEvents = events.filter(event => {
    const matchesCategory = filterCategory === 'all' || event.category.toLowerCase() === filterCategory.toLowerCase();
    const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          event.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          event.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Extract unique categories for the filter dropdown
  const categories = ['all', ...new Set(events.map(event => event.category))];

  // Group events by month
  const eventsByMonth = filteredEvents.reduce((acc, event) => {
    const month = moment(event.date).format('MMMM YYYY');
    if (!acc[month]) {
      acc[month] = [];
    }
    acc[month].push(event);
    return acc;
  }, {});

  // Sort months chronologically
  const sortedMonths = Object.keys(eventsByMonth).sort((a, b) => {
    return moment(a, 'MMMM YYYY').diff(moment(b, 'MMMM YYYY'));
  });

  const getCategoryIcon = (category) => {
    switch(category.toLowerCase()) {
      case 'running':
        return <FaRunning className="text-green-500" />;
      case 'cycling':
        return <MdDirectionsRun className="text-green-500" />;
      case 'yoga':
        return <IoIosFitness className="text-green-500" />;
      case 'basketball':
        return <MdSportsSoccer className="text-green-500" />;
      case 'swimming':
        return <IoIosFitness className="text-green-500" />;
      default:
        return <MdSportsSoccer className="text-green-500" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-8">
        <div className="p-6">
          <div className="flex items-center mb-6">
            <MdSportsSoccer className="text-green-500 mr-3" size={30} />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sự kiện thể thao</h1>
          </div>
          
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Tham gia các sự kiện thể thao cùng cộng đồng NutriCommunity để cải thiện sức khỏe và kết nối với những người có cùng đam mê!
          </p>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div className="flex items-center">
              <FaFilter className="mr-2 text-green-500" />
              <span className="mr-2 text-gray-700 dark:text-gray-300">Lọc theo:</span>
              <select 
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'Tất cả' : category}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="relative flex-grow max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Tìm kiếm sự kiện..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {filteredEvents.length > 0 ? (
            sortedMonths.map(month => (
              <div key={month} className="mb-8">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  {month}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {eventsByMonth[month].map(event => (
                    <div 
                      key={event.id} 
                      className={`bg-white dark:bg-gray-900 border ${event.isJoined ? 'border-green-500' : 'border-gray-200 dark:border-gray-700'} rounded-lg shadow-md overflow-hidden cursor-pointer transform transition-transform hover:scale-105`}
                      onClick={() => handleEventClick(event.id)}
                    >
                      <div className="relative h-40">
                        <img 
                          src={event.image} 
                          alt={event.name} 
                          className="w-full h-full object-cover"
                        />
                        {event.isJoined && (
                          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs py-1 px-2 rounded-full">
                            Đã tham gia
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                          {getCategoryIcon(event.category)}
                          <span className="ml-2">{event.name}</span>
                        </h3>
                        <div className="flex items-center text-gray-600 dark:text-gray-300 mb-1">
                          <FaCalendarAlt className="mr-2 text-green-500" />
                          {moment(event.date).format('DD/MM/YYYY - HH:mm')}
                        </div>
                        <div className="flex items-center text-gray-600 dark:text-gray-300 mb-1">
                          <FaMapMarkerAlt className="mr-2 text-green-500" />
                          {event.location}
                        </div>
                        <div className="flex items-center text-gray-600 dark:text-gray-300 mb-1">
                          <FaUserFriends className="mr-2 text-green-500" />
                          {event.participants}/{event.maxParticipants} người tham gia
                        </div>
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                            <div 
                              className="bg-green-500 h-2.5 rounded-full" 
                              style={{ width: `${(event.participants / event.maxParticipants) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mt-3 line-clamp-2">
                          {event.description}
                        </p>
                        <div className="mt-4">
                          <button 
                            className={`w-full py-2 px-4 rounded-md transition-colors ${
                              event.isJoined
                                ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                : 'bg-green-500 text-white hover:bg-green-600'
                            }`}
                            onClick={(e) => event.isJoined ? null : handleJoinEvent(event.id, e)}
                          >
                            {event.isJoined ? 'Đã tham gia' : 'Tham gia ngay'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                Không tìm thấy sự kiện nào phù hợp với bộ lọc hoặc tìm kiếm hiện tại.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 