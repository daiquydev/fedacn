import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  FaRunning, FaCalendarAlt, FaMapMarkerAlt, FaUserFriends, FaClock, FaInfoCircle, FaCheck, 
  FaArrowLeft, FaMedal, FaTrophy, FaStar, FaChartLine, FaChevronDown, FaChevronUp, FaStopwatch, 
  FaExclamationTriangle, FaBiking, FaSwimmer, FaDumbbell, FaAward
} from 'react-icons/fa'
import { MdSportsSoccer, MdLeaderboard } from 'react-icons/md'
import moment from 'moment'
import { getSportEvent, joinSportEvent, leaveSportEvent } from '../../../apis/sportEventApi'
import toast from 'react-hot-toast'

export default function EventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isJoining, setIsJoining] = useState(false)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(true)
  const [showAllParticipants, setShowAllParticipants] = useState(false)

  useEffect(() => {
    fetchEventDetail()
  }, [id])

  const fetchEventDetail = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('🔍 Fetching event with ID:', id)
      
      const response = await getSportEvent(id)
      console.log('📦 Full Response:', response)
      console.log('📦 Response keys:', Object.keys(response))
      console.log('📦 Response.data:', response.data)
      console.log('📦 Response.data?.result:', response.data?.result)
      
      let eventData = response.data?.result
      
      // Fallback if result doesn't exist
      if (!eventData) {
        console.warn('⚠️ No result in response, checking direct response')
        eventData = response.result || response.data
      }
      
      console.log('📍 EventData:', eventData)
      console.log('📍 EventData._id:', eventData?._id)
      
      if (!eventData || !eventData._id) {
        setError('Sự kiện không tồn tại.')
        toast.error('Sự kiện không tồn tại')
        return
      }
      
      setEvent(eventData)
    } catch (error) {
      console.error('Error fetching event:', error)
      setError('Sự kiện không tồn tại.')
      toast.error('Lỗi khi tải sự kiện')
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    try {
      setIsJoining(true)
      const response = await joinSportEvent(id)
      const updatedEvent = response.data?.result
      
      setEvent(updatedEvent)
      toast.success('Bạn đã tham gia sự kiện!')
    } catch (error) {
      console.error('Error joining event:', error)
      toast.error(error.response?.data?.message || 'Lỗi khi tham gia sự kiện')
    } finally {
      setIsJoining(false)
    }
  }

  const handleLeave = async () => {
    try {
      setIsJoining(true)
      const response = await leaveSportEvent(id)
      const updatedEvent = response.data?.result
      
      setEvent(updatedEvent)
      toast.success('Bạn đã rời khỏi sự kiện!')
      setShowLeaveConfirm(false)
    } catch (error) {
      console.error('Error leaving event:', error)
      toast.error(error.response?.data?.message || 'Lỗi khi rời khỏi sự kiện')
    } finally {
      setIsJoining(false)
    }
  }

  const getCategoryIcon = (category) => {
    if (!category) return <MdSportsSoccer className="text-green-500 text-2xl" />
    
    switch(category.toLowerCase()) {
      case 'chạy bộ':
      case 'running':
        return <FaRunning className="text-green-500 text-2xl" />
      case 'đạp xe':
      case 'cycling':
        return <FaBiking className="text-green-500 text-2xl" />
      case 'bơi lội':
      case 'swimming':
        return <FaSwimmer className="text-green-500 text-2xl" />
      case 'fitness':
        return <FaDumbbell className="text-green-500 text-2xl" />
      case 'yoga':
        return <FaRunning className="text-green-500 text-2xl" />
      default:
        return <MdSportsSoccer className="text-green-500 text-2xl" />
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button 
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center text-green-500 hover:text-green-600 transition-colors"
        >
          <FaArrowLeft className="mr-2" />
          Quay lại
        </button>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="text-center">
            <FaExclamationTriangle className="text-5xl text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              {error || 'Sự kiện không tồn tại'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Sự kiện bạn đang tìm kiếm không được tìm thấy hoặc đã bị xóa.
            </p>
            <button 
              className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
              onClick={() => navigate('/sport-event')}
            >
              Xem danh sách sự kiện
            </button>
          </div>
        </div>
      </div>
    )
  }

  const isParticipant = event.participants_ids?.some(p => p._id === localStorage.getItem('user_id')) || false
  const isEventInPast = new Date(event.endDate) < new Date()
  const isEventStarted = new Date(event.startDate) <= new Date()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <button 
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center text-green-500 hover:text-green-600 transition-colors font-medium"
      >
        <FaArrowLeft className="mr-2" />
        Quay lại
      </button>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content */}
        <div className="flex-1">
          {/* Event Image & Header */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-6">
            <div className="relative h-80 md:h-96 bg-gray-200 dark:bg-gray-700">
              {event.image && (
                <img 
                  src={event.image} 
                  alt={event.name}
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/60"></div>
              
              {/* Event Category Badge */}
              <div className="absolute top-4 left-4 bg-white/90 dark:bg-gray-800/90 rounded-full px-4 py-2 flex items-center">
                {getCategoryIcon(event.category)}
                <span className="ml-2 font-medium text-gray-900 dark:text-white">{event.category}</span>
              </div>

              {/* Event Status Badge */}
              <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-800/90 rounded-full px-4 py-2 flex items-center">
                <span className={`font-medium ${isEventInPast ? 'text-red-600' : 'text-green-600'}`}>
                  {isEventInPast ? 'Đã kết thúc' : 'Sắp diễn ra'}
                </span>
              </div>

              {/* Event Title */}
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h1 className="text-3xl md:text-4xl font-bold mb-3">{event.name}</h1>
                <p className="text-white/90 line-clamp-2">{event.description}</p>
              </div>
            </div>

            {/* Event Info Bar */}
            <div className="border-b border-gray-200 dark:border-gray-700 p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ngày bắt đầu</div>
                  <div className="flex items-center text-gray-900 dark:text-white font-medium">
                    <FaCalendarAlt className="mr-2 text-green-500 flex-shrink-0" />
                    {moment(event.startDate).format('DD/MM/YYYY')}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Thời gian</div>
                  <div className="flex items-center text-gray-900 dark:text-white font-medium">
                    <FaClock className="mr-2 text-green-500 flex-shrink-0" />
                    {moment(event.startDate).format('HH:mm')}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Địa điểm</div>
                  <div className="flex items-center text-gray-900 dark:text-white font-medium truncate">
                    <FaMapMarkerAlt className="mr-2 text-green-500 flex-shrink-0" />
                    <span className="truncate">{event.location}</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Người tham gia</div>
                  <div className="flex items-center text-gray-900 dark:text-white font-medium">
                    <FaUserFriends className="mr-2 text-green-500 flex-shrink-0" />
                    {event.participants}/{event.maxParticipants}
                  </div>
                </div>
              </div>
            </div>

            {/* Join/Leave Button */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              {isEventInPast ? (
                <div className="text-center py-4">
                  <p className="text-gray-500 dark:text-gray-400">Sự kiện này đã kết thúc</p>
                </div>
              ) : isParticipant ? (
                <button
                  onClick={() => setShowLeaveConfirm(true)}
                  disabled={isJoining}
                  className="w-full px-6 py-3 bg-red-100 text-red-600 rounded-lg font-medium hover:bg-red-200 transition-colors disabled:opacity-50"
                >
                  {isJoining ? 'Đang xử lý...' : 'Rời khỏi sự kiện'}
                </button>
              ) : (
                <button
                  onClick={handleJoin}
                  disabled={isJoining}
                  className="w-full px-6 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  <FaCheck className="mr-2" />
                  {isJoining ? 'Đang tham gia...' : 'Tham gia sự kiện'}
                </button>
              )}
            </div>

            {/* Event Details */}
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Mô tả chi tiết</h2>
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-6">
                  {event.description}
                </p>
              </div>

              {/* Requirements & Benefits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 mb-8">
                {/* Requirements */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-3 flex items-center">
                    <FaInfoCircle className="mr-2" />
                    Yêu cầu tham gia
                  </h3>
                  <p className="text-blue-800 dark:text-blue-200">
                    {event.requirements || 'Không có yêu cầu đặc biệt'}
                  </p>
                </div>

                {/* Benefits */}
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-900 dark:text-green-300 mb-3 flex items-center">
                    <FaAward className="mr-2" />
                    Quyền lợi
                  </h3>
                  <p className="text-green-800 dark:text-green-200">
                    {event.benefits || 'Không có phần thưởng'}
                  </p>
                </div>
              </div>

              {/* Event Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                {/* Organizer Info */}
                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <FaInfoCircle className="mr-2 text-green-500" />
                    Thông tin sự kiện
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Loại sự kiện</div>
                      <div className="font-medium text-gray-900 dark:text-white capitalize">
                        {event.eventType === 'online' ? 'Trực tuyến' : 'Trực tiếp'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Số người tối đa</div>
                      <div className="font-medium text-gray-900 dark:text-white">{event.maxParticipants} người</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Người tổ chức</div>
                      <div className="flex items-center mt-1">
                        {event.createdBy?.avatar && (
                          <img 
                            src={event.createdBy.avatar} 
                            alt={event.createdBy.name}
                            className="w-8 h-8 rounded-full mr-2"
                          />
                        )}
                        <span className="font-medium text-gray-900 dark:text-white">
                          {event.createdBy?.name || 'Ẩn danh'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Participants Info */}
                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <FaUserFriends className="mr-2 text-green-500" />
                    Người tham gia ({event.participants})
                  </h3>
                  
                  {event.participants_ids && event.participants_ids.length > 0 ? (
                    <div className="space-y-2">
                      {(showAllParticipants ? event.participants_ids : event.participants_ids.slice(0, 5)).map((participant) => (
                        <div key={participant._id} className="flex items-center">
                          {participant.avatar && (
                            <img 
                              src={participant.avatar} 
                              alt={participant.name}
                              className="w-8 h-8 rounded-full mr-2"
                            />
                          )}
                          <span className="text-gray-700 dark:text-gray-300 text-sm">{participant.name}</span>
                        </div>
                      ))}
                      {event.participants_ids.length > 5 && (
                        <button 
                          onClick={() => setShowAllParticipants(!showAllParticipants)}
                          className="text-green-500 hover:text-green-600 text-sm pt-2 font-medium"
                        >
                          {showAllParticipants ? 'Ẩn' : `+${event.participants_ids.length - 5} người khác`}
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Chưa có người tham gia</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Event Stats & Leaderboard */}
        <div className="lg:w-80">
          <div className="sticky top-4 space-y-4">
            {/* Participation Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Thống kê tham gia</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Người đã tham gia</span>
                  <span className="text-2xl font-bold text-green-500">{event.participants}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Chỗ còn trống</span>
                  <span className="text-2xl font-bold text-blue-500">{event.maxParticipants - event.participants}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mt-4">
                  <div 
                    className="bg-green-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${(event.participants / event.maxParticipants) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Event Time Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Thời gian chi tiết</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Bắt đầu</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {moment(event.startDate).format('DD/MM/YYYY HH:mm')}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Kết thúc</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {moment(event.endDate).format('DD/MM/YYYY HH:mm')}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Thời lượng</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {moment.duration(moment(event.endDate).diff(moment(event.startDate))).asHours().toFixed(1)} giờ
                  </div>
                </div>
              </div>
            </div>

            {/* Leaderboard (Mock data - will be updated later) */}
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
                <div className="p-4 max-h-96 overflow-y-auto">
                  {!isEventStarted ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <FaChartLine className="mx-auto text-4xl mb-3 text-gray-300 dark:text-gray-600" />
                      <p>Bảng xếp hạng sẽ được mở<br/>khi sự kiện bắt đầu</p>
                      <p className="mt-2 text-sm">
                        {moment(event.startDate).format('DD/MM/YYYY HH:mm')}
                      </p>
                    </div>
                  ) : event.participants_ids && event.participants_ids.length > 0 ? (
                    <div className="space-y-2">
                      {event.participants_ids.slice(0, 5).map((participant, index) => (
                        <div key={participant._id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                          <div className="flex items-center">
                            <div className="w-6 h-6 flex items-center justify-center mr-2">
                              {index === 0 && <FaTrophy className="text-yellow-500 text-lg" />}
                              {index === 1 && <FaMedal className="text-gray-400 text-lg" />}
                              {index === 2 && <FaMedal className="text-amber-600 text-lg" />}
                              {index >= 3 && <span className="text-sm font-bold text-gray-600 dark:text-gray-300">{index + 1}</span>}
                            </div>
                            <img 
                              src={participant.avatar || 'https://via.placeholder.com/32'} 
                              alt={participant.name}
                              className="w-6 h-6 rounded-full mr-2"
                            />
                            <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{participant.name}</span>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">#{index + 1}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                      <p className="text-sm">Chưa có người tham gia</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Leave Confirmation Dialog */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full">
              <FaExclamationTriangle className="text-red-600 text-xl" />
            </div>
            
            <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center mb-2">
              Rời khỏi sự kiện?
            </h3>
            
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              Bạn có chắc chắn muốn rời khỏi sự kiện "<strong>{event.name}</strong>" không?
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Hủy
              </button>
              
              <button
                onClick={handleLeave}
                disabled={isJoining}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isJoining ? 'Đang xử lý...' : 'Rời khỏi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
