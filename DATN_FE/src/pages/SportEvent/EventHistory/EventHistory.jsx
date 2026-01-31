import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  FaRunning, FaCalendarAlt, FaMapMarkerAlt, FaUserFriends, FaFilter, 
  FaMedal, FaTrophy, FaSpinner, FaSort, FaSortUp, FaSortDown, FaCalendarDay, FaTimes 
} from 'react-icons/fa'
import { MdSportsSoccer, MdHistory, MdErrorOutline } from 'react-icons/md'
import moment from 'moment'
import toast from 'react-hot-toast'

export default function EventHistory() {
  const navigate = useNavigate();
  const [pastEvents, setPastEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // --- Filtering State ---
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // --- Sorting State ---
  const [sortConfig, setSortConfig] = useState({ key: 'startDate', direction: 'desc' }); // Default sort by date descending

  useEffect(() => {
    // Fetch past events from API - currently showing empty since all events are in future
    // setPastEvents([])
  }, []);
            time: "02:15:30",
          },
          {
            id: 5,
            name: "City Swimming Gala",
            date: "2024-02-20T13:00:00Z",
            endDate: "2024-02-20T13:25:45Z",
            location: "City Aquatic Center",
            category: "Swimming",
            participants: 68,
            image: "https://images.unsplash.com/photo-1560089000-7433a4ebbd64",
            performance: "Completed",
            ranking: 3,
            totalParticipants: 68,
            achievement: "Bronze Medal",
            time: "00:25:45",
          },
           {
            id: 7, // New ID
            name: "Spring Cycling Tour",
            date: "2024-04-10T09:00:00Z",
            endDate: "2024-04-10T14:30:00Z",
            location: "Countryside Loop",
            category: "Cycling", // New Category
            participants: 120,
            image: "https://images.unsplash.com/photo-1517649763962-0c623066013b",
            performance: "Completed",
            ranking: 15,
            totalParticipants: 120,
            achievement: "Top 25%",
            time: "04:10:00",
          },
          {
            id: 8, // New ID
            name: "Sunset Yoga Session",
            date: "2024-03-05T18:00:00Z",
            endDate: "2024-03-05T19:00:00Z",
            location: "Beach Park",
            category: "Yoga", // New Category
            participants: 35,
            image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b",
            performance: "Completed",
            ranking: null, // No ranking
            totalParticipants: 35,
            achievement: "Participant",
            time: "01:00:00",
          },
           {
            id: 9, // New ID
            name: "Community Football Match",
            date: "2024-01-28T15:00:00Z",
            endDate: "2024-01-28T17:00:00Z",
            location: "Local Sports Field",
            category: "Football", // New Category
            participants: 22,
            image: "https://images.unsplash.com/photo-1553776591-69e37b73b3b0",
            performance: "Completed",
            ranking: 1, // Winning team
            totalParticipants: 2, // Number of teams
            achievement: "Winner",
            time: "02:00:00",
          },
        ];
        // --- End Placeholder ---

        setPastEvents(fetchedEvents);
        
      } catch (err) {
        console.error("Error fetching past events:", err);
        setError("Không thể tải lịch sử sự kiện. Vui lòng thử lại sau.");
        toast.error("Lỗi khi tải lịch sử sự kiện.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPastEvents();
  }, []); 

  const handleEventClick = (eventId) => {
    navigate(`/sport-event/${eventId}`); // Keep navigation to detail page
  };

  // --- Filtering Logic --- 
  const filteredEvents = useMemo(() => {
    return pastEvents.filter(event => {
      // Category filter
      if (filterCategory !== 'all' && event.category.toLowerCase() !== filterCategory.toLowerCase()) {
        return false;
      }
      // Date filter
      const eventDate = moment(event.date);
      if (filterStartDate && eventDate.isBefore(filterStartDate)) {
        return false;
      }
      if (filterEndDate && eventDate.isAfter(moment(filterEndDate).endOf('day'))) { // Check against end of day
        return false;
      }
      return true;
    });
  }, [pastEvents, filterCategory, filterStartDate, filterEndDate]);

  // --- Sorting Logic ---
  const sortedEvents = useMemo(() => {
    let sortableItems = [...filteredEvents];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        // Handle specific data types for sorting
        if (sortConfig.key === 'date' || sortConfig.key === 'endDate') {
          aValue = moment(aValue);
          bValue = moment(bValue);
        } else if (sortConfig.key === 'participants' || sortConfig.key === 'ranking' || sortConfig.key === 'totalParticipants') {
          aValue = aValue ?? -1; // Treat null/undefined ranks as lowest
          bValue = bValue ?? -1;
        } else if (sortConfig.key === 'time') {
          // Convert HH:MM:SS to seconds for comparison
          const timeToSeconds = (timeStr) => {
            if (!timeStr || typeof timeStr !== 'string') return 0;
            const parts = timeStr.split(':').map(Number);
            if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
            if (parts.length === 2) return parts[0] * 60 + parts[1]; // Handle MM:SS if needed
            return 0;
          };
          aValue = timeToSeconds(aValue);
          bValue = timeToSeconds(bValue);
        } else {
          // Default to string comparison (case-insensitive)
          aValue = String(aValue).toLowerCase();
          bValue = String(bValue).toLowerCase();
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredEvents, sortConfig]);

  // --- Unique Categories for Filter Dropdown ---
  const categories = useMemo(() => 
    ['all', ...new Set(pastEvents.map(event => event.category))] // Get categories from all past events
  , [pastEvents]);

  // --- Medal/Achievement Logic ---
  const getMedalIcon = (ranking, totalParticipants, achievement) => {
    if (achievement === "Winner") return <FaTrophy className="text-yellow-500" title="Winner" />;
    if (!ranking || !totalParticipants) return null;
    
    const percentile = (ranking / totalParticipants) * 100;
    
    if (percentile <= 10) {
      return <FaMedal className="text-yellow-500" title={`Top 10% (Hạng ${ranking})`} />;
    } else if (percentile <= 25) {
      return <FaMedal className="text-gray-400" title={`Top 25% (Hạng ${ranking})`} />;
    } else if (percentile <= 50) {
      return <FaMedal className="text-orange-600" title={`Top 50% (Hạng ${ranking})`} />;
    }
    
    return null; // Default for participant or unranked
  };

  // --- Request Sort Function ---
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
       // Optional: Cycle back to ascending or remove sort
       direction = 'asc'; // Cycle back to ascending
       // key = null; // Uncomment to remove sort on third click
    }
    setSortConfig({ key, direction });
  };

  // --- Get Sort Icon Function ---
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <FaSort className="ml-1 text-gray-400 inline" />;
    }
    if (sortConfig.direction === 'asc') {
      return <FaSortUp className="ml-1 text-red-500 inline" />;
    }
    return <FaSortDown className="ml-1 text-red-500 inline" />;
  };
  
  // --- Reset Filters ---
  const resetFilters = () => {
    setFilterCategory('all');
    setFilterStartDate('');
    setFilterEndDate('');
  }

  // --- Render Logic --- 
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center mb-6">
            <MdHistory className="text-green-500 mr-3" size={30} />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Lịch sử tham gia sự kiện</h1>
          </div>
          
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Xem lại các sự kiện thể thao bạn đã tham gia, lọc và sắp xếp để xem lại thành tích.
          </p>

          {/* Filter Controls - Only show if not loading and no error */}
          {!isLoading && !error && (
            <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/30">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                {/* Category Filter */}
                <div>
                  <label htmlFor="filterCategory" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Thể loại</label>
                  <select 
                    id="filterCategory"
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:ring-red-500 focus:border-red-500"
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

                {/* Start Date Filter */}
                <div>
                  <label htmlFor="filterStartDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Từ ngày</label>
                  <input
                    type="date"
                    id="filterStartDate"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                {/* End Date Filter */}
                <div>
                  <label htmlFor="filterEndDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Đến ngày</label>
                  <input
                    type="date"
                    id="filterEndDate"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    min={filterStartDate} // Prevent end date before start date
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                
                {/* Reset Button */}
                 <button 
                  onClick={resetFilters} 
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center justify-center"
                  title="Đặt lại bộ lọc"
                >
                   <FaTimes className="mr-1"/> Đặt lại
                </button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center py-12">
              <FaSpinner className="animate-spin text-4xl text-red-500" />
              <p className="ml-3 text-gray-600 dark:text-gray-400">Đang tải lịch sử sự kiện...</p>
            </div>
          )}

          {/* Error State */}
          {!isLoading && error && (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border border-red-200 dark:border-red-800">
              <MdErrorOutline className="text-5xl text-red-500 mb-4" />
              <p className="text-lg font-semibold text-red-700 dark:text-red-300 mb-2">Đã xảy ra lỗi</p>
              <p className="text-red-600 dark:text-red-400">{error}</p>
              {/* <button onClick={fetchPastEvents} className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Thử lại</button> */}
            </div>
          )}

          {/* Table Section - Only show if not loading and no error */}
          {!isLoading && !error && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => requestSort('name')}>
                      Tên sự kiện {getSortIcon('name')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => requestSort('category')}>
                      Thể loại {getSortIcon('category')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => requestSort('date')}>
                      Ngày {getSortIcon('date')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Địa điểm
                    </th>
                     <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => requestSort('ranking')}>
                      Hạng {getSortIcon('ranking')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => requestSort('time')}>
                      Thời gian {getSortIcon('time')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Thành tích
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                  {sortedEvents.length > 0 ? (
                    sortedEvents.map((event) => (
                      <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer" onClick={() => handleEventClick(event.id)}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {event.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {event.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          <span title={`Bắt đầu: ${moment(event.date).format('DD/MM/YYYY HH:mm')}${event.endDate ? `\nKết thúc: ${moment(event.endDate).format('DD/MM/YYYY HH:mm')}`: ''}`}>
                             {moment(event.date).format('DD/MM/YYYY')} 
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 max-w-xs truncate" title={event.location}>
                          {event.location}
                        </td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                           {event.ranking ? `${event.ranking}/${event.totalParticipants}` : "--"}
                         </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {event.time || "--:--"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                           {getMedalIcon(event.ranking, event.totalParticipants, event.achievement) || event.achievement || 'Tham gia'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    // Empty State Row
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                        Không tìm thấy sự kiện nào phù hợp với bộ lọc của bạn.
                         <button 
                           onClick={resetFilters} 
                           className="ml-2 text-red-500 hover:underline"
                         >
                           Đặt lại bộ lọc?
                         </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 