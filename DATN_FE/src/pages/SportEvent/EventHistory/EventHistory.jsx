import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { FaRunning, FaCalendarAlt, FaMapMarkerAlt, FaUserFriends, FaFilter, FaMedal, FaTrophy, FaInfoCircle } from 'react-icons/fa'
import { MdSportsSoccer, MdHistory } from 'react-icons/md'
import moment from 'moment'
import toast from 'react-hot-toast'

// Mock data for past events
const mockPastEvents = [
  {
    id: 4,
    name: "Winter Marathon",
    date: "2024-01-15T07:00:00Z",
    location: "Downtown Route",
    category: "Running",
    participants: 312,
    image: "https://images.unsplash.com/photo-1540539234-c14a20fb7c7b",
    performance: "Completed",
    ranking: 54,
    totalParticipants: 312,
    achievement: "Finisher",
    time: "02:15:30",
    completionDate: "2024-01-15T10:15:30Z"
  },
  {
    id: 5,
    name: "Swimming Competition",
    date: "2024-02-20T13:00:00Z",
    location: "City Aquatic Center",
    category: "Swimming",
    participants: 68,
    image: "https://images.unsplash.com/photo-1560089000-7433a4ebbd64",
    performance: "Completed",
    ranking: 12,
    totalParticipants: 68,
    achievement: "Bronze Medal",
    time: "00:25:45",
    completionDate: "2024-02-20T13:25:45Z"
  },
  {
    id: 6,
    name: "Mountain Trail Hike",
    date: "2024-03-10T08:30:00Z",
    location: "Blue Mountain",
    category: "Hiking",
    participants: 45,
    image: "https://images.unsplash.com/photo-1551632811-561732d1e306",
    performance: "Completed",
    ranking: 25,
    totalParticipants: 45,
    achievement: "Participant",
    time: "03:45:20",
    completionDate: "2024-03-10T12:15:20Z"
  }
];

export default function EventHistory() {
  const navigate = useNavigate();
  const location = useLocation();
  const [pastEvents, setPastEvents] = useState(mockPastEvents);
  const [filterCategory, setFilterCategory] = useState('all');
  const [showLeaveNotification, setShowLeaveNotification] = useState(false);
  const [justLeftEventId, setJustLeftEventId] = useState(null);

  useEffect(() => {
    // Check if we've navigated here after leaving an event
    if (location.state?.leftEvent) {
      const eventId = location.state.leftEvent;
      setJustLeftEventId(eventId);
      setShowLeaveNotification(true);
      
      // Get event details from one of our mock event lists
      // In a real app, this would be an API call to get the event details
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
        }
      ];
      
      const eventFromMock = mockJoinedEvents.find(e => e.id === eventId) || 
                            mockPastEvents.find(e => e.id === eventId);
      
      if (eventFromMock) {
        // Add the event to past events with a new structure
        const newPastEvent = {
          id: eventFromMock.id,
          name: eventFromMock.name,
          date: eventFromMock.date,
          location: eventFromMock.location,
          category: eventFromMock.category,
          participants: eventFromMock.participants || 0,
          image: eventFromMock.image,
          performance: "Left Early",
          ranking: null,
          totalParticipants: eventFromMock.maxParticipants || eventFromMock.totalParticipants || 100,
          achievement: "Participant",
          time: "--:--:--",
          completionDate: new Date().toISOString()
        };
        
        // Check if this event is already in past events
        const eventExists = pastEvents.some(e => e.id === newPastEvent.id);
        if (!eventExists) {
          setPastEvents(prev => [newPastEvent, ...prev]);
        }
      }
      
      // Show toast notification
      toast.success('Sự kiện đã được chuyển vào lịch sử', {
        icon: <FaInfoCircle className="text-blue-500" />,
        duration: 3000
      });
      
      // Clear the state after displaying
      setTimeout(() => {
        setShowLeaveNotification(false);
        setJustLeftEventId(null);
        
        // Clean up the navigation state
        window.history.replaceState({}, document.title);
      }, 3000);
    }
  }, [location.state, pastEvents]);

  const handleEventClick = (eventId) => {
    navigate(`/sport-event/${eventId}`);
  };

  const filteredEvents = filterCategory === 'all' 
    ? pastEvents 
    : pastEvents.filter(event => event.category.toLowerCase() === filterCategory.toLowerCase());

  const categories = ['all', ...new Set(pastEvents.map(event => event.category))];

  const getMedalIcon = (ranking, totalParticipants) => {
    if (!ranking) return null;
    
    const percentile = (ranking / totalParticipants) * 100;
    
    if (percentile <= 10) {
      return <FaMedal className="text-yellow-500" title="Top 10%" />;
    } else if (percentile <= 25) {
      return <FaMedal className="text-gray-400" title="Top 25%" />;
    } else if (percentile <= 50) {
      return <FaMedal className="text-orange-600" title="Top 50%" />;
    }
    
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {showLeaveNotification && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4 rounded-md">
          <div className="flex items-center">
            <FaInfoCircle className="text-blue-500 mr-2" />
            <p className="text-blue-700">Bạn đã rời khỏi sự kiện và nó đã được chuyển vào lịch sử tham gia.</p>
          </div>
        </div>
      )}
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-8">
        <div className="p-6">
          <div className="flex items-center mb-6">
            <MdHistory className="text-green-500 mr-3" size={30} />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Lịch sử tham gia sự kiện</h1>
          </div>
          
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Danh sách các sự kiện thể thao bạn đã tham gia trước đây, bao gồm thành tích và kết quả của bạn.
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
                  className={`bg-white dark:bg-gray-900 border ${justLeftEventId === event.id ? 'border-blue-500' : 'border-gray-200 dark:border-gray-700'} rounded-lg shadow-md overflow-hidden cursor-pointer transform transition-transform hover:scale-105 ${justLeftEventId === event.id ? 'animate-pulse' : ''}`}
                  onClick={() => handleEventClick(event.id)}
                >
                  <div className="relative h-40">
                    <img 
                      src={event.image} 
                      alt={event.name} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-gray-700 text-white text-xs py-1 px-2 rounded-full">
                      {event.performance === "Left Early" ? "Đã rời" : "Đã kết thúc"}
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
                      {event.participants} người tham gia
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center text-gray-700 dark:text-gray-300">
                          <FaTrophy className="mr-2 text-green-500" />
                          <span>Thành tích:</span>
                        </div>
                        <div className="flex items-center">
                          {getMedalIcon(event.ranking, event.totalParticipants)}
                          <span className="ml-1 font-semibold text-gray-900 dark:text-white">
                            {event.achievement}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Xếp hạng:</span> {event.ranking ? `${event.ranking}/${event.totalParticipants}` : "--"}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Thời gian:</span> {event.time}
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {event.performance === "Left Early" 
                          ? "Đã rời vào: " 
                          : "Hoàn thành vào: "
                        }
                        {moment(event.completionDate).format('DD/MM/YYYY')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                Không tìm thấy sự kiện nào trong lịch sử của bạn.
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