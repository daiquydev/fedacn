import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaRunning, FaCalendarAlt, FaMapMarkerAlt, FaUserFriends, FaFilter, FaCheckCircle, FaTimes, FaArrowLeft } from 'react-icons/fa';
import { MdSportsSoccer, MdDirectionsRun, MdFitnessCenter } from 'react-icons/md';
import { IoIosFitness } from 'react-icons/io';
import moment from 'moment';
import toast from 'react-hot-toast';
import { getJoinedEvents } from '../../../apis/sportEventApi';

const getCategoryIcon = (category) => {
  switch(category?.toLowerCase()) {
    case 'chạy bộ':
      return <FaRunning className="text-green-500" />;
    case 'đạp xe':
      return <MdDirectionsRun className="text-green-500" />;
    case 'yoga':
      return <IoIosFitness className="text-green-500" />;
    case 'bóng rổ':
      return <MdSportsSoccer className="text-green-500" />;
    case 'bơi lội':
    case 'fitness':
      return <MdFitnessCenter className="text-green-500" />;
    default:
      return <MdSportsSoccer className="text-green-500" />;
  }
};

export default function JoinedEvents() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [joinedEvents, setJoinedEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [showConfirmLeave, setShowConfirmLeave] = useState(false);
  const [eventToLeave, setEventToLeave] = useState(null);

  useEffect(() => {
    fetchJoinedEvents();
  }, []);

  const fetchJoinedEvents = async () => {
    try {
      setLoading(true);
      const response = await getJoinedEvents({ page: 1, limit: 50 });
      const { events = [] } = response.data?.result || {};
      setJoinedEvents(events);
    } catch (error) {
      console.error('Error fetching joined events:', error);
      toast.error('Không thể tải danh sách sự kiện đã tham gia');
    } finally {
      setLoading(false);
    }
  }
    }
  }, [location.state, navigate]);

  const handleEventClick = (eventId) => {
    navigate(`/sport-event/${eventId}`);
  };

  const confirmLeaveEvent = (event, e) => {
    e.stopPropagation();
    setEventToLeave(event);
    setShowConfirmLeave(true);
  };

  const handleLeaveEvent = () => {
    if (!eventToLeave) return;

    console.log(`Leaving event ${eventToLeave.id}...`);

    const eventIndex = allSportEvents.findIndex(e => e.id === eventToLeave.id);
    if (eventIndex !== -1) {
      allSportEvents[eventIndex] = {
        ...allSportEvents[eventIndex],
        isJoined: false,
        participants: Math.max(0, (allSportEvents[eventIndex].participants || 0) - 1)
      };
    }

    setJoinedEvents(prevEvents => prevEvents.filter(event => event.id !== eventToLeave.id));

    toast.success(`Đã rời khỏi sự kiện: ${eventToLeave.name}`);
    setShowConfirmLeave(false);
    setEventToLeave(null);
  };

  const filteredEvents = joinedEvents.filter(event => 
    filterCategory === 'all' || event.category.toLowerCase() === filterCategory.toLowerCase()
  );

  const categories = ['all', ...new Set(joinedEvents.map(event => event.category))];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
          <button onClick={() => navigate(-1)} className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <FaArrowLeft />
          </button>
          <h1 className="text-2xl font-bold">Sự kiện Đang Tham gia</h1> 
      </div>

      {joinedEvents.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <p className="text-lg text-gray-600 dark:text-gray-400">Bạn chưa tham gia sự kiện nào.</p>
          <button 
            onClick={() => navigate('/sport-event')}
            className="mt-6 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            Xem Danh sách Sự kiện
          </button>
        </div>
      ) : (
        <>
          <div className="mb-6 flex justify-end">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-800"
            >
              <option value="all">Tất cả Thể loại</option>
              {categories.filter(cat => cat !== 'all').map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map(event => (
              <div
                key={event.id}
                onClick={() => handleEventClick(event.id)}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
              >
                <div className="relative h-48">
                  <img
                    src={event.image}
                    alt={event.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-white dark:bg-gray-900 text-red-500 font-medium px-3 py-1 rounded-full text-sm">
                    {event.participants}/{event.maxParticipants} người
                  </div>
                   <div className="absolute top-3 left-3 bg-white dark:bg-gray-900 text-green-500 font-medium px-3 py-1 rounded-full text-sm flex items-center">
                      <FaCheckCircle className="mr-1" />
                      Đang tham gia
                    </div>
                </div>
                
                <div className="p-4">
                  <div className="flex items-center mb-2">
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-xs font-medium mr-2">
                      {event.category}
                    </span>
                    {getCategoryIcon(event.category)}
                  </div>
                  
                  <h3 className="text-lg font-semibold mb-2 truncate">{event.name}</h3>
                  
                  <div className="flex items-center text-gray-600 dark:text-gray-400 mb-2">
                    <FaCalendarAlt className="mr-2" />
                    <span>{moment(event.date).format('ddd, D/M/YYYY • HH:mm')}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600 dark:text-gray-400 mb-3">
                    <FaMapMarkerAlt className="mr-2" />
                    <span className="truncate">{event.location}</span>
                  </div>

                  {event.progress !== undefined && (
                     <div className="mb-4">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Tiến độ: {event.progress}%
                          </span>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {Math.round(event.progress * event.targetValue / 100)}/{event.targetValue} {event.targetUnit}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                          <div 
                            className="bg-green-500 h-2.5 rounded-full" 
                            style={{ width: `${event.progress}%` }}
                          ></div>
                        </div>
                      </div>
                  )}
                  
                  <button
                    className="w-full px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition font-medium"
                    onClick={(e) => confirmLeaveEvent(event, e)}
                  >
                    Rời khỏi sự kiện
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {showConfirmLeave && eventToLeave && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Xác nhận Rời khỏi Sự kiện</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Bạn có chắc chắn muốn rời khỏi sự kiện "<span className="font-medium">{eventToLeave.name}</span>" không?
            </p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setShowConfirmLeave(false)} 
                className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Hủy
              </button>
              <button 
                onClick={handleLeaveEvent} 
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Xác nhận Rời
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 