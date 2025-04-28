import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaRunning, FaCalendarAlt, FaMapMarkerAlt, FaUserFriends, FaFilter, FaSearch, 
  FaPlusCircle, FaTimes, FaImage, FaUpload, FaVideo } from 'react-icons/fa'
import { MdSportsSoccer, MdDirectionsRun, MdVideocam, MdLocationOn } from 'react-icons/md'
import { IoIosFitness } from 'react-icons/io'
import moment from 'moment'
import { allSportEvents } from '../../data/sportEvents' // Import data from central file
import SportEventCard from './components/SportEventCard'
import useravatar from '../../assets/images/useravatar.jpg'

// Remove internal mockEvents
// const mockEvents = [...]; 

export default function SportEvent() {
  const navigate = useNavigate();
  const [events, setEvents] = useState(allSportEvents); // Use imported data
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterEventType, setFilterEventType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // State cho modal tạo sự kiện mới
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    name: '',
    date: '',
    time: '',
    endDate: '',
    endTime: '',
    location: '',
    category: '',
    maxParticipants: '',
    image: '',
    description: '',
    eventType: 'offline'
  });
  const [imagePreview, setImagePreview] = useState('');
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  const handleEventClick = (eventId) => {
    navigate(`/sport-event/${eventId}`);
  };

  const handleJoinEvent = (eventId, e) => {
    e.stopPropagation(); // Prevent the click from bubbling up to the card
    
    // Update the event's joined status in the local state (for immediate UI feedback)
    setEvents(prevEvents => 
      prevEvents.map(event => 
        event.id === eventId 
          ? { ...event, isJoined: true, participants: (event.participants || 0) + 1 } // Ensure participants is a number
          : event
      )
    );
    
    // Navigate immediately to the detail page with a state flag
    navigate(`/sport-event/${eventId}`, { state: { justJoined: true } });
    
    // Remove the delayed navigation to MyEvents
    // setTimeout(() => {
    //   navigate('/sport-event/my-events', { state: { joinedEvent: eventId } });
    // }, 1000);
  };

  // Filter events based on category, event type, and search query
  const filteredEvents = events.filter(event => {
    const matchesCategory = filterCategory === 'all' || event.category.toLowerCase() === filterCategory.toLowerCase();
    const matchesEventType = filterEventType === 'all' || event.eventType === filterEventType;
    const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          event.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          event.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesEventType && matchesSearch;
  });

  // Extract unique categories for the filter dropdown
  const categories = ['all', ...new Set(events.map(event => event.category))];

  // Group events by month
  const eventsByMonth = filteredEvents.reduce((acc, event) => {
    const month = moment(event.date).format('MMMM YYYY'); // Use 'date' field for consistency
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
      case 'chạy bộ': // Updated category name
        return <FaRunning className="text-green-500" />;
      case 'đạp xe': // Updated category name
        return <MdDirectionsRun className="text-green-500" />;
      case 'yoga':
        return <IoIosFitness className="text-green-500" />;
      case 'bóng rổ': // Updated category name
        return <MdSportsSoccer className="text-green-500" />;
      case 'bơi lội': // Updated category name
        return <IoIosFitness className="text-green-500" />;
      case 'fitness': // Added fitness category
        return <IoIosFitness className="text-green-500" />; // Use fitness icon
      default:
        return <MdSportsSoccer className="text-green-500" />;
    }
  };

  // Hàm xử lý tạo sự kiện mới
  const handleCreateEvent = (e) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = {};
    if (!newEvent.name.trim()) validationErrors.name = 'Vui lòng nhập tên sự kiện';
    if (!newEvent.date) validationErrors.date = 'Vui lòng chọn ngày bắt đầu';
    if (!newEvent.time) validationErrors.time = 'Vui lòng chọn giờ bắt đầu';
    
    // Validate end date/time for ALL types
    if (!newEvent.endDate) validationErrors.endDate = 'Vui lòng chọn ngày kết thúc';
    if (!newEvent.endTime) validationErrors.endTime = 'Vui lòng chọn giờ kết thúc';

    // Validate location only for offline events
    if (newEvent.eventType === 'offline' && !newEvent.location.trim()) {
      validationErrors.location = 'Vui lòng nhập địa điểm';
    }
    // Validate platform only for online events
    if (newEvent.eventType === 'online' && !newEvent.location.trim()) {
      validationErrors.location = 'Vui lòng nhập nền tảng'; // Assuming location field is used for platform too
    }
    
    if (!newEvent.category) validationErrors.category = 'Vui lòng chọn thể loại';
    if (!newEvent.maxParticipants || newEvent.maxParticipants <= 0) {
      validationErrors.maxParticipants = 'Vui lòng nhập số người tham gia hợp lệ';
    }
    if (!newEvent.image.trim()) validationErrors.image = 'Vui lòng nhập URL hình ảnh';
    if (!newEvent.description.trim()) validationErrors.description = 'Vui lòng nhập mô tả sự kiện';
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    // Tạo sự kiện mới
    const dateTime = `${newEvent.date}T${newEvent.time}:00Z`;
    const endDateTime = `${newEvent.endDate}T${newEvent.endTime}:00Z`; // Always create endDateTime
    const newEventObj = {
      id: Date.now(), // Tạo ID ngẫu nhiên
      name: newEvent.name,
      date: dateTime,
      endDate: endDateTime,
      location: newEvent.location,
      category: newEvent.category,
      participants: 0,
      maxParticipants: parseInt(newEvent.maxParticipants),
      image: newEvent.image,
      description: newEvent.description,
      isJoined: false,
      eventType: newEvent.eventType,
      videoCallUrl: newEvent.eventType === 'online' ? `https://meet.jit.si/NutriCommunity-${newEvent.name.replace(/\s+/g, '-')}` : ''
    };
    
    // Thêm sự kiện mới vào danh sách
    setEvents([...events, newEventObj]);
    
    // Đóng modal và reset form
    setShowCreateModal(false);
    setNewEvent({
      name: '',
      date: '',
      time: '',
      endDate: '',
      endTime: '',
      location: '',
      category: '',
      maxParticipants: '',
      image: '',
      description: '',
      eventType: 'offline'
    });
    setImagePreview('');
    setErrors({});
  };
  
  // Hàm xử lý thay đổi input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEvent({
      ...newEvent,
      [name]: value
    });
    
    // Xóa lỗi khi người dùng nhập
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };
  
  // Hàm xử lý preview image
  const handleImageChange = (e) => {
    const value = e.target.value;
    setNewEvent({
      ...newEvent,
      image: value
    });
    
    if (value.trim() && (value.startsWith('http://') || value.startsWith('https://'))) {
      setImagePreview(value);
    } else {
      setImagePreview('');
    }
    
    if (errors.image) {
      setErrors({
        ...errors,
        image: null
      });
    }
  };
  
  // Simulated upload image
  const handleUploadClick = () => {
    fileInputRef.current.click();
  };
  
  const handleFileChange = (e) => {
    // Giả lập tải file lên và nhận URL
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onloadend = () => {
        // Thông thường sẽ upload lên server và nhận URL thật
        // Ở đây giả lập với một URL từ Unsplash
        const imageUrl = "https://images.unsplash.com/photo-1603988363607-e1e4a66962c6";
        setNewEvent({
          ...newEvent,
          image: imageUrl
        });
        setImagePreview(imageUrl);
        
        if (errors.image) {
          setErrors({
            ...errors,
            image: null
          });
        }
      };
      
      reader.readAsDataURL(file);
    }
  };

  // Sample mock participants with follow status
  const getMockParticipantsForEvent = (eventId) => {
    // In a real application, this would come from an API
    // This is sample data to demonstrate the functionality
    const followedUsers = [1, 3, 5, 7]; // User IDs that the current user follows
    
    // Generate random participants for each event
    const baseParticipants = [
      { id: 1, name: "Nguyễn Văn A", avatar: "", isFollowed: followedUsers.includes(1) },
      { id: 2, name: "Trần Thị B", avatar: "", isFollowed: followedUsers.includes(2) },
      { id: 3, name: "Lê Văn C", avatar: "", isFollowed: followedUsers.includes(3) },
      { id: 4, name: "Phạm Thị D", avatar: "", isFollowed: followedUsers.includes(4) },
      { id: 5, name: "Hoàng Văn E", avatar: "", isFollowed: followedUsers.includes(5) },
      { id: 6, name: "Ngô Thị F", avatar: "", isFollowed: followedUsers.includes(6) },
      { id: 7, name: "Đặng Văn G", avatar: "", isFollowed: followedUsers.includes(7) },
    ];
    
    // Use event ID to deterministically select random participants
    const seed = eventId % 100;
    const count = (seed % 5) + 2; // 2-6 participants
    const selected = [];
    
    for (let i = 0; i < count; i++) {
      const index = (seed + i) % baseParticipants.length;
      selected.push(baseParticipants[index]);
    }
    
    return selected;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">Sự kiện Thể thao</h1>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm sự kiện..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            />
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
          
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white appearance-none"
            style={{backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundPosition: "right 0.5rem center", backgroundSize: "1.5em 1.5em", backgroundRepeat: "no-repeat"}}
          >
            <option value="all">Tất cả Thể loại</option>
            {categories.filter(cat => cat !== 'all').map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <select
            value={filterEventType}
            onChange={(e) => setFilterEventType(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white appearance-none"
            style={{backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundPosition: "right 0.5rem center", backgroundSize: "1.5em 1.5em", backgroundRepeat: "no-repeat"}}
          >
            <option value="all">Tất cả Loại sự kiện</option>
            <option value="offline">Sự kiện Trực tiếp</option>
            <option value="online">Sự kiện Trực tuyến</option>
          </select>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            <FaPlusCircle className="mr-2" />
            Tạo sự kiện
          </button>
        </div>
      </div>
      
      {sortedMonths.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-gray-600">Không tìm thấy sự kiện nào phù hợp.</p>
        </div>
      ) : (
        sortedMonths.map(month => (
          <div key={month} className="mb-10">
            <h2 className="text-xl font-semibold mb-4">{moment(month, 'MMMM YYYY').format('Tháng M, YYYY')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {eventsByMonth[month].map(event => (
                <SportEventCard
                  key={event.id}
                  event={event}
                  participants={getMockParticipantsForEvent(event.id)}
                  onJoin={(eventId) => handleJoinEvent(eventId, new Event('click'))}
                />
              ))}
            </div>
          </div>
        ))
      )}
      
      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Tạo Sự kiện Thể thao Mới</h2>
              <button onClick={() => {
                setShowCreateModal(false)
                setErrors({})
                setNewEvent({
                  name: '',
                  date: '',
                  time: '',
                  endDate: '',
                  endTime: '',
                  location: '',
                  category: '',
                  maxParticipants: '',
                  image: '',
                  description: '',
                  eventType: 'offline'
                })
                setImagePreview('')
              }} className="text-gray-500 hover:text-gray-700">
                <FaTimes size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateEvent} className="space-y-6">
              {/* Form fields... updated with Vietnamese labels and placeholders */}
              <div>
                <label htmlFor="eventName" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Tên sự kiện</label>
                <input
                  type="text"
                  id="eventName"
                  name="name"
                  value={newEvent.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>
              
              {/* Event Type Selection */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Loại sự kiện</label>
                <div className="flex gap-4">
                  <label className="flex items-center text-gray-700 dark:text-gray-200">
                    <input 
                      type="radio" 
                      name="eventType"
                      value="offline"
                      checked={newEvent.eventType === 'offline'}
                      onChange={handleInputChange}
                      className="mr-2 text-red-500 focus:ring-red-500"
                    />
                    Trực tiếp
                  </label>
                  <label className="flex items-center text-gray-700 dark:text-gray-200">
                    <input 
                      type="radio" 
                      name="eventType"
                      value="online"
                      checked={newEvent.eventType === 'online'}
                      onChange={handleInputChange}
                      className="mr-2 text-red-500 focus:ring-red-500"
                    />
                    Trực tuyến
                  </label>
                </div>
              </div>
              
              {/* Dates and Times */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="eventDate" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Ngày bắt đầu</label>
                  <input
                    type="date"
                    id="eventDate"
                    name="date"
                    value={newEvent.date}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  />
                  {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
                </div>
                <div>
                  <label htmlFor="eventTime" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Giờ bắt đầu</label>
                  <input
                    type="time"
                    id="eventTime"
                    name="time"
                    value={newEvent.time}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  />
                  {errors.time && <p className="text-red-500 text-sm mt-1">{errors.time}</p>}
                </div>
                
                {/* End Date/Time - Now shown for ALL event types */}
                <>
                  <div>
                    <label htmlFor="eventEndDate" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Ngày kết thúc</label>
                    <input
                      type="date"
                      id="eventEndDate"
                      name="endDate"
                      value={newEvent.endDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                    />
                    {errors.endDate && <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>}
                  </div>
                  <div>
                    <label htmlFor="eventEndTime" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Giờ kết thúc</label>
                    <input
                      type="time"
                      id="eventEndTime"
                      name="endTime"
                      value={newEvent.endTime}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                    />
                    {errors.endTime && <p className="text-red-500 text-sm mt-1">{errors.endTime}</p>}
                  </div>
                </>
              </div>

              {/* Location (for offline) or Platform (for online) */}
              <div>
                <label htmlFor="eventLocation" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">
                  {newEvent.eventType === 'offline' ? 'Địa điểm' : 'Nền tảng (VD: Zoom, Google Meet)'}
                </label>
                <input
                  type="text"
                  id="eventLocation"
                  name="location"
                  value={newEvent.location}
                  onChange={handleInputChange}
                  placeholder={newEvent.eventType === 'offline' ? 'VD: Công viên Thống Nhất' : 'VD: Google Meet'}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                />
                {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
              </div>
              
              {/* Category and Max Participants */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="eventCategory" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Thể loại</label>
                  <select
                    id="eventCategory"
                    name="category"
                    value={newEvent.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white appearance-none"
                    style={{backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundPosition: "right 0.5rem center", backgroundSize: "1.5em 1.5em", backgroundRepeat: "no-repeat"}}
                  >
                    <option value="">Chọn thể loại</option>
                    {categories.filter(cat => cat !== 'all').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
                </div>
                <div>
                  <label htmlFor="maxParticipants" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Số người tham gia tối đa</label>
                  <input
                    type="number"
                    id="maxParticipants"
                    name="maxParticipants"
                    value={newEvent.maxParticipants}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  />
                  {errors.maxParticipants && <p className="text-red-500 text-sm mt-1">{errors.maxParticipants}</p>}
                </div>
              </div>
              
              {/* Image URL and Preview */}
              <div>
                <label htmlFor="eventImage" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">URL Hình ảnh bìa</label>
                <div className="flex items-center gap-4">
                  <input
                    type="text"
                    id="eventImage"
                    name="image"
                    placeholder="Dán URL hình ảnh vào đây"
                    value={newEvent.image}
                    onChange={handleImageChange} 
                    className="flex-grow px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  />
                  <button 
                    type="button"
                    onClick={handleUploadClick} 
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 bg-white dark:bg-gray-700"
                  >
                    <FaUpload />
                  </button>
                  <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                  />
                </div>
                {errors.image && <p className="text-red-500 text-sm mt-1">{errors.image}</p>}
                {imagePreview && (
                  <div className="mt-4">
                    <img src={imagePreview} alt="Xem trước hình ảnh" className="max-h-40 rounded-lg object-cover" />
                  </div>
                )}
              </div>
              
              {/* Description */}
              <div>
                <label htmlFor="eventDescription" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Mô tả sự kiện</label>
                <textarea
                  id="eventDescription"
                  name="description"
                  value={newEvent.description}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Cung cấp thông tin chi tiết về sự kiện..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                ></textarea>
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
              </div>
              
              <div className="flex justify-end space-x-4 pt-6">
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)} 
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 bg-white dark:bg-gray-800"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Tạo sự kiện
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
} 