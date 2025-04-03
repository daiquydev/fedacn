import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaRunning, FaCalendarAlt, FaMapMarkerAlt, FaUserFriends, FaFilter, FaSearch, 
  FaPlusCircle, FaTimes, FaImage, FaUpload } from 'react-icons/fa'
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
  
  // State cho modal tạo sự kiện mới
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    name: '',
    date: '',
    time: '',
    location: '',
    category: '',
    maxParticipants: '',
    image: '',
    description: ''
  });
  const [imagePreview, setImagePreview] = useState('');
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

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

  // Hàm xử lý tạo sự kiện mới
  const handleCreateEvent = (e) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = {};
    if (!newEvent.name.trim()) validationErrors.name = 'Vui lòng nhập tên sự kiện';
    if (!newEvent.date) validationErrors.date = 'Vui lòng chọn ngày';
    if (!newEvent.time) validationErrors.time = 'Vui lòng chọn giờ';
    if (!newEvent.location.trim()) validationErrors.location = 'Vui lòng nhập địa điểm';
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
    const newEventObj = {
      id: Date.now(), // Tạo ID ngẫu nhiên
      name: newEvent.name,
      date: dateTime,
      location: newEvent.location,
      category: newEvent.category,
      participants: 0,
      maxParticipants: parseInt(newEvent.maxParticipants),
      image: newEvent.image,
      isJoined: false,
      description: newEvent.description
    };
    
    // Thêm sự kiện mới vào danh sách
    setEvents([...events, newEventObj]);
    
    // Reset form và đóng modal
    setNewEvent({
      name: '',
      date: '',
      time: '',
      location: '',
      category: '',
      maxParticipants: '',
      image: '',
      description: ''
    });
    setImagePreview('');
    setShowCreateModal(false);
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-8">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <MdSportsSoccer className="text-green-500 mr-3" size={30} />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sự kiện thể thao</h1>
            </div>
            
            {/* Nút tạo sự kiện mới */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors"
            >
              <FaPlusCircle className="mr-2" />
              Tạo sự kiện mới
            </button>
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
      
      {/* Modal tạo sự kiện mới */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                  <FaPlusCircle className="mr-2 text-green-500" />
                  Tạo sự kiện mới
                </h2>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <FaTimes size={24} />
                </button>
              </div>
              
              <form onSubmit={handleCreateEvent}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Tên sự kiện */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tên sự kiện *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={newEvent.name}
                      onChange={handleInputChange}
                      className={`w-full p-2 border ${errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                      placeholder="Nhập tên sự kiện"
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                  </div>
                  
                  {/* Ngày */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Ngày *
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={newEvent.date}
                      onChange={handleInputChange}
                      min={moment().format('YYYY-MM-DD')}
                      className={`w-full p-2 border ${errors.date ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                    />
                    {errors.date && <p className="mt-1 text-sm text-red-500">{errors.date}</p>}
                  </div>
                  
                  {/* Giờ */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Giờ *
                    </label>
                    <input
                      type="time"
                      name="time"
                      value={newEvent.time}
                      onChange={handleInputChange}
                      className={`w-full p-2 border ${errors.time ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                    />
                    {errors.time && <p className="mt-1 text-sm text-red-500">{errors.time}</p>}
                  </div>
                  
                  {/* Địa điểm */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Địa điểm *
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={newEvent.location}
                      onChange={handleInputChange}
                      className={`w-full p-2 border ${errors.location ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                      placeholder="Nhập địa điểm tổ chức"
                    />
                    {errors.location && <p className="mt-1 text-sm text-red-500">{errors.location}</p>}
                  </div>
                  
                  {/* Thể loại */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Thể loại *
                    </label>
                    <select
                      name="category"
                      value={newEvent.category}
                      onChange={handleInputChange}
                      className={`w-full p-2 border ${errors.category ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                    >
                      <option value="">Chọn thể loại</option>
                      {['Running', 'Cycling', 'Yoga', 'Basketball', 'Swimming'].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    {errors.category && <p className="mt-1 text-sm text-red-500">{errors.category}</p>}
                  </div>
                  
                  {/* Số người tham gia tối đa */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Số người tham gia tối đa *
                    </label>
                    <input
                      type="number"
                      name="maxParticipants"
                      value={newEvent.maxParticipants}
                      onChange={handleInputChange}
                      min="1"
                      className={`w-full p-2 border ${errors.maxParticipants ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                      placeholder="Ví dụ: 50"
                    />
                    {errors.maxParticipants && <p className="mt-1 text-sm text-red-500">{errors.maxParticipants}</p>}
                  </div>
                  
                  {/* Hình ảnh */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Hình ảnh *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        name="image"
                        value={newEvent.image}
                        onChange={handleImageChange}
                        className={`flex-1 p-2 border ${errors.image ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                        placeholder="Nhập URL hình ảnh"
                      />
                      <button
                        type="button"
                        onClick={handleUploadClick}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
                      >
                        <FaUpload className="mr-2" /> Tải lên
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                    {errors.image && <p className="mt-1 text-sm text-red-500">{errors.image}</p>}
                    
                    {/* Image preview */}
                    {imagePreview && (
                      <div className="mt-3">
                        <div className="relative w-full h-40">
                          <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="w-full h-full object-cover rounded-md border border-gray-300 dark:border-gray-600"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Mô tả */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Mô tả *
                    </label>
                    <textarea
                      name="description"
                      value={newEvent.description}
                      onChange={handleInputChange}
                      rows="4"
                      className={`w-full p-2 border ${errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                      placeholder="Mô tả chi tiết về sự kiện"
                    ></textarea>
                    {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                  >
                    Tạo sự kiện
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 