import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { FaRunning, FaCalendarAlt, FaMapMarkerAlt, FaUserFriends, FaFilter, FaCheckCircle, FaTimes } from 'react-icons/fa'
import { MdSportsSoccer } from 'react-icons/md'
import moment from 'moment'
import toast from 'react-hot-toast'

// Mock data for active events
const mockJoinedEvents = [
  {
    id: 1,
    name: "10K Morning Run Challenge",
    date: "2024-03-25T08:00:00Z",
    location: "Central Park Track",
    category: "Running",
    participants: 156,
    maxParticipants: 200,
    image: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5",
    isJoined: true,
    joinDate: "2024-03-18T10:30:00Z"
  },
  {
    id: 2,
    name: "Yoga in the Park",
    date: "2024-04-02T17:30:00Z",
    location: "Riverside Park",
    category: "Yoga",
    participants: 42,
    maxParticipants: 50,
    image: "https://images.unsplash.com/photo-1588286840104-8957b019727f",
    isJoined: true,
    joinDate: "2024-03-15T14:20:00Z"
  },
  {
    id: 7,
    name: "Community Basketball Tournament",
    date: "2024-04-10T15:00:00Z",
    location: "City Sports Center",
    category: "Basketball",
    participants: 68,
    maxParticipants: 80,
    image: "https://images.unsplash.com/photo-1546519638-68e109acd27d",
    isJoined: true,
    joinDate: "2024-03-20T09:15:00Z"
  }
];

export default function MyEvents() {
  const navigate = useNavigate();
  const location = useLocation();
  const [joinedEvents, setJoinedEvents] = useState(mockJoinedEvents);
  const [filterCategory, setFilterCategory] = useState('all');
  const [showJoinNotification, setShowJoinNotification] = useState(false);
  const [justJoinedEventId, setJustJoinedEventId] = useState(null);

  useEffect(() => {
    // Check if we've navigated here after joining an event
    if (location.state?.joinedEvent) {
      const eventId = location.state.joinedEvent;
      setJustJoinedEventId(eventId);
      setShowJoinNotification(true);
      
      // Show toast notification
      toast.success('Đã tham gia sự kiện thành công!', {
        icon: <FaCheckCircle className="text-green-500" />,
        duration: 3000
      });
      
      // Clear the state after displaying
      setTimeout(() => {
        setShowJoinNotification(false);
        setJustJoinedEventId(null);
        
        // Clean up the navigation state
        window.history.replaceState({}, document.title);
      }, 3000);
    }
  }, [location.state]);

  const handleEventClick = (eventId) => {
    navigate(`/sport-event/${eventId}`);
  };

  const handleLeaveEvent = (eventId, e) => {
    e.stopPropagation(); // Prevent the card click event
    
    // Remove from joined events
    setJoinedEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
    
    // Show notification
    toast.success('Đã rời khỏi sự kiện. Chuyển hướng đến lịch sử sự kiện...', {
      icon: <FaTimes className="text-blue-500" />,
      duration: 2000
    });
    
    // After a delay, navigate to history page
    setTimeout(() => {
      navigate('/sport-event/history', { state: { leftEvent: eventId } });
    }, 2000);
  };

  const filteredEvents = filterCategory === 'all' 
    ? joinedEvents 
    : joinedEvents.filter(event => event.category.toLowerCase() === filterCategory.toLowerCase());

  const categories = ['all', ...new Set(joinedEvents.map(event => event.category))];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {showJoinNotification && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4 rounded-md">
          <div className="flex items-center">
            <FaCheckCircle className="text-green-500 mr-2" />
            <p className="text-green-700">Bạn đã tham gia sự kiện thành công!</p>
          </div>
        </div>
      )}
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-8">
        <div className="p-6">
          <div className="flex items-center mb-6">
            <MdSportsSoccer className="text-green-500 mr-3" size={30} />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sự kiện đã tham gia</h1>
          </div>
          
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Danh sách các sự kiện thể thao bạn đã đăng ký tham gia. Theo dõi thông tin cập nhật và các hoạt động sắp tới.
          </p>
          
          <div className="flex items-center justify-between mb-6">
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
            <div className="text-gray-700 dark:text-gray-300">
              Tổng số: {filteredEvents.length} sự kiện
            </div>
          </div>

          {filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map(event => (
                <div 
                  key={event.id} 
                  className={`bg-white dark:bg-gray-900 border ${justJoinedEventId === event.id ? 'border-green-500' : 'border-gray-200 dark:border-gray-700'} rounded-lg shadow-md overflow-hidden cursor-pointer transform transition-transform hover:scale-105 ${justJoinedEventId === event.id ? 'animate-pulse' : ''}`}
                  onClick={() => handleEventClick(event.id)}
                >
                  <div className="relative h-40">
                    <img 
                      src={event.image} 
                      alt={event.name} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs py-1 px-2 rounded-full">
                      Đã tham gia
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {event.name}
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
                      <FaRunning className="mr-2 text-green-500" />
                      {event.category}
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-300 mb-2">
                      <FaUserFriends className="mr-2 text-green-500" />
                      {event.participants}/{event.maxParticipants} người tham gia
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 mb-3">
                      Đã tham gia vào: {moment(event.joinDate).format('DD/MM/YYYY')}
                    </div>
                    
                    <button 
                      className="w-full py-2 px-4 rounded-md bg-blue-100 text-blue-600 hover:bg-blue-200 border border-blue-300 transition-colors mt-2"
                      onClick={(e) => handleLeaveEvent(event.id, e)}
                    >
                      Rời khỏi sự kiện
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                Bạn chưa tham gia sự kiện nào.
              </p>
              <button
                className="mt-4 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
                onClick={() => navigate('/sport-event')}
              >
                Khám phá sự kiện
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 