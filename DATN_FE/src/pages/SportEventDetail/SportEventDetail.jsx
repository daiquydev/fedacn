import { useState, useRef, useEffect } from 'react'
import { AiFillHeart, AiOutlineLoading3Quarters } from 'react-icons/ai'
import { CiHeart } from 'react-icons/ci'
import { FaCheckCircle, FaUserFriends, FaMedal, FaSort, FaSortUp, FaSortDown, FaSearch, FaTimes, FaImage, FaCalendarAlt, FaMapMarkerAlt, FaTrophy, FaUserCircle, FaUsers, FaRunning } from 'react-icons/fa'
import { MdPublic, MdVideocam, MdOutlineHistoryEdu, MdErrorOutline, MdCheckCircle } from 'react-icons/md'
import moment from 'moment'
import useravatar from '../../assets/images/useravatar.jpg'
import { RiGitRepositoryPrivateFill } from 'react-icons/ri'
import { PiShareFatLight } from 'react-icons/pi'
import { LiaComments } from 'react-icons/lia'
import Comments from '../../pages/Home/components/Comments'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { BsClockHistory, BsCalendarCheck } from 'react-icons/bs'
import { allSportEvents, mockLeaderboard, mockPosts, mockLiveSessionParticipants } from '../../data/sportEvents'
import toast from 'react-hot-toast'

export default function SportEventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showJoinedToast, setShowJoinedToast] = useState(false);

  useEffect(() => {
    const eventId = parseInt(id, 10);
    const foundEvent = allSportEvents.find(e => e.id === eventId);
    
    if (foundEvent) {
      setEvent(foundEvent);
      setIsLiked(foundEvent.isLiked || false);
      setLikeCount(foundEvent.likes || 0);
      if (location.state?.justJoined) {
        setShowJoinedToast(true);
        navigate(location.pathname, { replace: true, state: {} });
      }
    } else {
      setError("Sự kiện không tồn tại.");
    }
    setIsLoading(false);
  }, [id, location.state, navigate]);

  useEffect(() => {
    if (showJoinedToast) {
      toast.success("Bạn đã tham gia sự kiện thành công!");
      setShowJoinedToast(false);
    }
  }, [showJoinedToast]);

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [sortField, setSortField] = useState('rank');
  const [sortDirection, setSortDirection] = useState('asc');
  const [participants, setParticipants] = useState(mockLeaderboard.participants);
  const [searchTerm, setSearchTerm] = useState('');
  const [posts, setPosts] = useState(mockPosts);
  const [activeTab, setActiveTab] = useState('details');
  const [newPost, setNewPost] = useState({ content: '', images: [] });
  const [isPostSubmitting, setIsPostSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [showSessionNotification, setShowSessionNotification] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);

  // --- State for Progress Update ---
  const [progressUpdate, setProgressUpdate] = useState({ 
    value: '', 
    distance: '', 
    time: '', // Format: HH:MM or HH:MM:SS
    calories: '', 
    notes: '' 
  });
  const [isProgressSubmitting, setIsProgressSubmitting] = useState(false);
  const [progressError, setProgressError] = useState(null);
  const [progressSuccess, setProgressSuccess] = useState(false);
  // --- End Progress Update State ---

  // --- Logic to find the next upcoming session --- 
  const findNextSession = () => {
    if (!event || !Array.isArray(event.sessions)) {
      return null;
    }
    // Simulate current time (or use real time with moment())
    // For testing the multi-session logic, let's assume it's before the 3rd session
    const now = moment('2025-03-12T16:00:00Z'); 
    
    // Find the first session that hasn't ended yet
    const upcomingSession = event.sessions
      .sort((a, b) => moment(a.sessionDate).diff(moment(b.sessionDate))) // Sort sessions by date
      .find(session => {
        const sessionEnd = moment(session.sessionDate).add(session.durationHours, 'hours');
        return now.isBefore(sessionEnd);
      });
      
    return upcomingSession;
  }
  const nextSession = findNextSession();
  
  // --- Recalculate isSessionActive based on the *next* session --- 
  useEffect(() => {
    if (nextSession) {
      // Simulate current time (or use real time with moment())
      // const now = moment(); 
      const now = moment('2025-03-12T17:30:00Z'); // Simulate being IN the 3rd session
      const sessionStart = moment(nextSession.sessionDate);
      const sessionEnd = moment(nextSession.sessionDate).add(nextSession.durationHours, 'hours');

      if (now.isBetween(sessionStart, sessionEnd)) {
        setIsSessionActive(true);
      } else {
        setIsSessionActive(false);
      }
    } else {
      setIsSessionActive(false); // No upcoming sessions
    }
    // Remove event dependency as we use nextSession now
  }, [nextSession]); 

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1)
  }

  const handleSort = (field) => {
    const isAsc = sortField === field && sortDirection === 'asc'
    const direction = isAsc ? 'desc' : 'asc'
    
    const sortedParticipants = [...participants].sort((a, b) => {
      if (field === 'time') {
        const timeToMinutes = (timeStr) => {
          const [min, sec] = timeStr.split(':').map(Number)
          return min + sec / 60
        }
        const timeA = timeToMinutes(a.time)
        const timeB = timeToMinutes(b.time)
        return direction === 'asc' ? timeA - timeB : timeB - timeA
      }
      
      return direction === 'asc' 
        ? a[field] - b[field]
        : b[field] - a[field]
    })

    setParticipants(sortedParticipants)
    setSortField(field)
    setSortDirection(direction)
  }

  const getSortIcon = (field) => {
    if (sortField !== field) return <FaSort className="text-gray-400" />
    return sortDirection === 'asc' ? 
      <FaSortUp className="text-red-500" /> : 
      <FaSortDown className="text-red-500" />
  }

  const filteredParticipants = participants.filter(participant =>
    participant.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handlePostLike = (postId) => {
    setPosts(posts.map(post => {
      if (post._id === postId) {
        const newIsLike = !post.is_like
        return {
          ...post,
          is_like: newIsLike,
          like_count: newIsLike ? post.like_count + 1 : post.like_count - 1
        }
      }
      return post
    }))
  }

  const handleCreatePost = () => {
    if (!newPost.content.trim()) return;
    
    setIsPostSubmitting(true);
    
    setTimeout(() => {
      const newPostObj = {
        _id: `temp-${Date.now()}`,
        content: newPost.content,
        createdAt: new Date().toISOString(),
        user: {
          _id: '1',
          name: 'Current User',
          avatar: '',
          role: 0
        },
        like_count: 0,
        comment_count: 0,
        share_count: 0,
        is_like: false,
        status: 0,
        images: newPost.images
      };
      
      setPosts([newPostObj, ...posts]);
      setNewPost({ content: '', images: [] });
      setIsPostSubmitting(false);
    }, 1000);
  };
  
  const handlePostImageUpload = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newImages = Array.from(e.target.files).map(() => 
        'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=800&h=600'
      );
      
      setNewPost({
        ...newPost,
        images: [...newPost.images, ...newImages].slice(0, 4)
      });
    }
  };
  
  const removeImage = (index) => {
    setNewPost({
      ...newPost,
      images: newPost.images.filter((_, i) => i !== index)
    });
  };

  const handleShareProgress = () => {
    const progressText = `Tôi vừa đạt được ${Math.round(event.progress * event.targetValue / 100)}/${event.targetValue} ${event.targetUnit} trong sự kiện "${event.name}"! 💪 #NutriCommunity #${event.category.replace(/\s+/g, '')}`;
    
    setNewPost({ content: progressText, images: [] });
    setActiveTab('posts');
  };

  const handleJoinOnDetail = () => {
    if (!event) return;

    console.log(`Joining event ${event.id}...`);
    
    setEvent(prevEvent => ({
      ...prevEvent,
      isJoined: true,
      participants: (prevEvent.participants || 0) + 1
    }));

    toast.success("Tham gia sự kiện thành công!");

    const eventIndex = allSportEvents.findIndex(e => e.id === event.id);
    if (eventIndex !== -1) {
      allSportEvents[eventIndex] = {
        ...allSportEvents[eventIndex],
        isJoined: true,
        participants: (allSportEvents[eventIndex].participants || 0) + 1
      };
    }
  };

  // Filter followed users currently in the live session
  const followedInSession = mockLiveSessionParticipants.filter(p => p.isFollowed);

  // --- Handle Progress Input Change ---
  const handleProgressInputChange = (e) => {
    const { name, value } = e.target;
    setProgressUpdate(prev => ({ ...prev, [name]: value }));
    // Clear error/success on input change
    setProgressError(null);
    setProgressSuccess(false);
  };

  // --- Handle Progress Update Submission ---
  const handleUpdateProgress = async (e) => {
    e.preventDefault();
    setIsProgressSubmitting(true);
    setProgressError(null);
    setProgressSuccess(false);

    // Basic Validation (add more as needed)
    if (!progressUpdate.value || isNaN(parseFloat(progressUpdate.value)) || parseFloat(progressUpdate.value) <= 0) {
      setProgressError(`Vui lòng nhập giá trị hợp lệ cho ${event.targetUnit}.`);
      setIsProgressSubmitting(false);
      return;
    }
    // Add validation for time format if needed

    try {
      // --- Placeholder API Call ---
      console.log("Submitting progress update:", progressUpdate);
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
      // On success:
      // 1. Get the updated event data (or simulate it)
      // 2. Update the event state
      // 3. Add to the userDailyProgress list
      // 4. Reset the form

      const newProgressEntry = {
        date: new Date().toISOString(),
        value: parseFloat(progressUpdate.value),
        unit: event.targetUnit,
        distance: progressUpdate.distance ? parseFloat(progressUpdate.distance) : null,
        time: progressUpdate.time || null,
        calories: progressUpdate.calories ? parseInt(progressUpdate.calories, 10) : null,
        notes: progressUpdate.notes || null
      };

      // Simulate updating event state
      setEvent(prevEvent => ({
        ...prevEvent,
        // Update overall progress if applicable (logic depends on event type/goals)
        progress: Math.min(100, (prevEvent.progress || 0) + (parseFloat(progressUpdate.value) / prevEvent.targetValue * 100)), 
        userDailyProgress: [
          newProgressEntry,
          ...(prevEvent.userDailyProgress || [])
        ]
      }));
      
      setProgressUpdate({ value: '', distance: '', time: '', calories: '', notes: '' }); // Reset form
      setProgressSuccess(true);
      toast.success("Cập nhật tiến độ thành công!");
      // Optionally hide success message after a delay
      setTimeout(() => setProgressSuccess(false), 3000);

    } catch (err) {
      console.error("Error updating progress:", err);
      setProgressError("Không thể cập nhật tiến độ. Vui lòng thử lại.");
      toast.error("Lỗi cập nhật tiến độ.");
    } finally {
      setIsProgressSubmitting(false);
    }
  };
  // --- End Progress Update Logic ---

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <h1 className="text-2xl font-bold text-red-500">Lỗi</h1>
        <p className="mt-4 text-gray-600 dark:text-gray-400">{error}</p>
        <button 
          onClick={() => navigate('/sport-event')}
          className="mt-6 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
        >
          Quay lại Danh sách Sự kiện
        </button>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="relative h-96">
          <img
            src={event.backgroundImage || event.image}
            alt={event.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
            <h1 className="text-4xl font-bold text-white mb-2">{event.name}</h1>
            <div className="flex items-center text-white/90 space-x-2">
              <span>{moment(event.createdAt).format('dddd, D MMMM, YYYY [lúc] HH:mm')}</span>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-wrap items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
            <div className="flex items-center mb-4 md:mb-0">
              <img
                src={event.creator.avatar || useravatar}
                alt=""
                className="h-10 w-10 rounded-full mr-4"
              />
              <div>
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  {event.creator.name}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Người tổ chức
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center">
                <div className="text-gray-500 dark:text-gray-400 mr-6">
                  <div className="flex items-center">
                    <MdPublic className="mr-1" />
                    <span>{event.views} lượt xem</span>
                  </div>
                </div>
                
                <div className="text-gray-500 dark:text-gray-400 mr-6">
                  <div className="flex items-center">
                    <FaUserFriends className="mr-1" />
                    <span>{event.participants !== undefined ? event.participants : mockLeaderboard.totalParticipants} người tham gia</span>
                  </div>
                </div>
                
                <button 
                  onClick={handleLike}
                  className={`flex items-center ${isLiked ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  {isLiked ? <AiFillHeart className="mr-1" /> : <CiHeart className="mr-1" />}
                  <span>{likeCount}</span>
                </button>
              </div>
              
              {event.isJoined ? (
                  <button 
                    className="text-gray-700 bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg px-5 py-2 text-center inline-flex items-center dark:bg-gray-700 dark:text-gray-300 dark:focus:ring-gray-600 cursor-default"
                    disabled
                  >
                    <FaCheckCircle className="mr-2" /> Đã tham gia
                  </button>
                ) : (
                  <button 
                    onClick={handleJoinOnDetail}
                    className="text-white bg-red-500 hover:bg-red-600 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg px-5 py-2 text-center inline-flex items-center dark:bg-red-500 dark:hover:bg-red-600 dark:focus:ring-red-700"
                  >
                    Tham gia ngay
                  </button>
              )}
            </div>
          </div>

          <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('details')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'details'
                    ? 'border-red-500 text-red-500'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Chi tiết
              </button>
              <button
                onClick={() => setActiveTab('participants')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'participants'
                    ? 'border-red-500 text-red-500'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Người tham gia
              </button>
              <button
                onClick={() => setActiveTab('posts')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'posts'
                    ? 'border-red-500 text-red-500'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Bài đăng cộng đồng
              </button>
              {event.eventType === 'online' && (
                <button
                  onClick={() => setActiveTab('sessions')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'sessions'
                      ? 'border-red-500 text-red-500'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Buổi học trực tiếp
                </button>
              )}
            </nav>
          </div>

          {activeTab === 'sessions' && event.eventType === 'online' && (
            <div className="space-y-6">
              {/* Section for the NEXT upcoming session */} 
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-6">
                  {nextSession ? "Buổi học trực tiếp sắp tới" : "Tất cả buổi học đã kết thúc"}
                </h2>
                
                {nextSession ? (
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 mb-6">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Buổi {nextSession.sessionId}: {nextSession.topic || event.name}</h3>
                      <div className="space-y-2 text-gray-700 dark:text-gray-300">
                        <div className="flex items-center">
                          <FaCalendarAlt className="mr-2 text-red-500" />
                          <span>{moment(nextSession.sessionDate).format('dddd, D MMMM, YYYY')}</span>
                        </div>
                        <div className="flex items-center">
                          <BsClockHistory className="mr-2 text-red-500" />
                          <span>{moment(nextSession.sessionDate).format('HH:mm')} - {moment(nextSession.sessionDate).add(nextSession.durationHours, 'hours').format('HH:mm')}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 md:mt-0">
                      {isSessionActive ? (
                        <button
                          onClick={() => setShowVideoCall(true)}
                          className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                        >
                          Tham gia ngay
                        </button>
                      ) : (
                        <div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 text-center">
                            {/* Check if session is upcoming vs already passed but not active */}
                            {moment().isBefore(moment(nextSession.sessionDate)) ? 
                              `Bắt đầu trong ${moment(nextSession.sessionDate).fromNow()}` : 
                              'Buổi học chưa bắt đầu'
                            }
                          </div>
                          <button
                            disabled
                            className="px-6 py-3 bg-gray-200 text-gray-500 rounded-lg cursor-not-allowed dark:bg-gray-700 dark:text-gray-400"
                          >
                            Chưa đến giờ
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                   <p className="text-center text-gray-600 dark:text-gray-400">Không có buổi học nào sắp diễn ra.</p>
                )}

                {/* Display followed users in session - Keep this as is */} 
                {followedInSession.length > 0 && (
                  <div className="mt-4 mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                    <div className="flex items-center text-blue-700 dark:text-blue-300 mb-2">
                      <FaUsers className="mr-2" />
                      <span className="font-medium">Có {followedInSession.length} người bạn theo dõi đang tham gia:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {followedInSession.map(participant => (
                        <img 
                          key={participant.rank} // Use a unique key
                          src={participant.avatar || useravatar}
                          alt={participant.name}
                          title={participant.name} // Show name on hover
                          className="w-8 h-8 rounded-full border-2 border-blue-300"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Section for Session History - NEW */} 
              {Array.isArray(event.sessions) && event.sessions.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                  <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <span className="bg-purple-500 w-2 h-6 mr-2 rounded-sm"></span>
                    Lịch sử các Buổi học
                  </h2>
                  <ul className="space-y-4 max-h-72 overflow-y-auto pr-2">
                    {event.sessions
                      .sort((a, b) => moment(a.sessionDate).diff(moment(b.sessionDate))) // Sort by date ascending
                      .map((session) => {
                        // Determine status text outside the JSX for clarity
                        let statusText = 'Chưa diễn ra';
                        let statusColorClass = "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300";
                        if (session.isCompleted) {
                          statusText = 'Đã hoàn thành';
                          statusColorClass = "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
                        } else if (nextSession && session.sessionId === nextSession.sessionId) {
                          statusText = 'Sắp diễn ra';
                          statusColorClass = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"; // Yellow for upcoming
                        } else if (moment().isAfter(moment(session.sessionDate))) {
                           // Check if it was the *next* session but now time has passed the start time
                           // And it's not marked completed yet - could be missed or in progress if `isSessionActive` logic applied here
                           if(nextSession && session.sessionId === nextSession.sessionId && !isSessionActive) {
                              statusText = 'Đã bỏ lỡ'; // Or "Đã qua"?
                              statusColorClass = "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"; // Red for missed
                           } else if (isSessionActive && nextSession && session.sessionId === nextSession.sessionId) {
                              // This case is unlikely here as the main block handles active session
                              statusText = 'Đang diễn ra'; 
                              statusColorClass = "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
                           } else if (moment().isAfter(moment(session.sessionDate).add(session.durationHours, 'hours'))) {
                             // If current time is past the session end time
                             statusText = 'Chưa diễn ra'; // Or simply "Đã qua"?
                             statusColorClass = "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 italic";
                           }
                        }

                        return (
                          <li key={session.sessionId} className={`p-4 rounded-lg border ${session.isCompleted ? 'border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/20' : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50'}`}>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                              <div>
                                <h3 className={`font-semibold text-lg mb-1 ${session.isCompleted ? 'text-green-700 dark:text-green-300' : 'text-gray-800 dark:text-gray-200'}`}>
                                  Buổi {session.sessionId}: {session.topic || 'Chủ đề chung'}
                                </h3>
                                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-4 flex-wrap">
                                  <span className="flex items-center whitespace-nowrap"><FaCalendarAlt className="mr-1" /> {moment(session.sessionDate).format('DD/MM/YYYY')}</span>
                                  <span className="flex items-center whitespace-nowrap"><BsClockHistory className="mr-1" /> {moment(session.sessionDate).format('HH:mm')} ({session.durationHours}h)</span>
                                </div>
                              </div>
                              <div className="mt-3 sm:mt-0 flex-shrink-0">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColorClass}`}>
                                  {session.isCompleted && <FaCheckCircle className="mr-1.5" />} 
                                  {statusText}
                                </span>
                              </div>
                            </div>
                          </li>
                        );
                      })
                    }
                  </ul>
                </div>
              )}
              
              {showVideoCall && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Phiên học trực tiếp</h2>
                    <button
                      onClick={() => setShowVideoCall(false)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                      <FaTimes />
                    </button>
                  </div>
                  
                  <div className="aspect-w-16 aspect-h-9">
                    <iframe
                      src={event.videoCallUrl}
                      allow="camera; microphone; display-capture; autoplay; clipboard-write; encrypted-media"
                      allowFullScreen
                      className="w-full h-[500px] rounded-lg border-0"
                    ></iframe>
                  </div>
                  
                  <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <h3 className="font-medium text-yellow-800 dark:text-yellow-300 mb-2">Lưu ý:</h3>
                    <ul className="list-disc list-inside space-y-1 text-yellow-700 dark:text-yellow-400">
                      <li>Vui lòng cho phép trình duyệt truy cập camera và micro của bạn</li>
                      <li>Đảm bảo bạn có kết nối internet ổn định</li>
                      <li>Nếu bạn gặp vấn đề, hãy thử tải lại trang</li>
                    </ul>
                  </div>
                </div>
              )}
              
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Những gì bạn cần chuẩn bị</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <h3 className="font-medium text-lg mb-2 text-red-500">Trước buổi học</h3>
                    <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                      <li className="flex items-start">
                        <FaCheckCircle className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                        <span>Kiểm tra kết nối internet của bạn</span>
                      </li>
                      <li className="flex items-start">
                        <FaCheckCircle className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                        <span>Chuẩn bị không gian đủ rộng cho các động tác</span>
                      </li>
                      <li className="flex items-start">
                        <FaCheckCircle className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                        <span>Có sẵn thảm tập và các dụng cụ cần thiết</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <h3 className="font-medium text-lg mb-2 text-red-500">Trong buổi học</h3>
                    <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                      <li className="flex items-start">
                        <FaCheckCircle className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                        <span>Đảm bảo camera được đặt ở vị trí phù hợp</span>
                      </li>
                      <li className="flex items-start">
                        <FaCheckCircle className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                        <span>Tắt micro khi không nói chuyện</span>
                      </li>
                      <li className="flex items-start">
                        <FaCheckCircle className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                        <span>Đặt câu hỏi trong phần chat nếu cần</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <h3 className="font-medium text-lg mb-2 text-red-500">Sau buổi học</h3>
                    <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                      <li className="flex items-start">
                        <FaCheckCircle className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                        <span>Chia sẻ phản hồi với giáo viên</span>
                      </li>
                      <li className="flex items-start">
                        <FaCheckCircle className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                        <span>Đăng bài về trải nghiệm của bạn</span>
                      </li>
                      <li className="flex items-start">
                        <FaCheckCircle className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                        <span>Xem lại bản ghi nếu bạn cần ôn tập</span>
                      </li>
                    </ul>
                  </div>
              </div>
              </div>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="space-y-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <span className="bg-red-500 w-2 h-6 mr-2 rounded-sm"></span>
                  Về sự kiện này
                </h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {event.description}
                </p>
                
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center">
                    <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full mr-3">
                      <FaCalendarAlt className="text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Thời gian</p>
                      <p className="font-medium">{moment(event.startDate).format('DD/MM')} - {moment(event.endDate).format('DD/MM/YYYY')}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full mr-3">
                      <FaMapMarkerAlt className="text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Địa điểm</p>
                      <p className="font-medium">{event.location}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full mr-3">
                      <FaTrophy className="text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Mục tiêu</p>
                      <p className="font-medium">{event.targetValue} {event.targetUnit}</p>
                    </div>
                  </div>
                </div>

                {/* Overall Progress Bar - Moved here for better context */}
                <div className="mt-8 mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    Tiến độ Tổng cộng
                  </h3>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {Math.round(event.progress || 0)}% hoàn thành
                    </span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {Math.round((event.progress || 0) * event.targetValue / 100)}/{event.targetValue} {event.targetUnit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div 
                      className="bg-green-500 h-2.5 rounded-full transition-all duration-500 ease-out" 
                      style={{ width: `${event.progress || 0}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* Share Progress Button */}
                <div className="mt-6 flex justify-center">
                  <button 
                    onClick={handleShareProgress} 
                    className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center shadow-md hover:shadow-lg"
                  >
                    <PiShareFatLight className="mr-2" />
                    Chia sẻ Tiến độ
                  </button>
                </div>
              </div>
              
              {/* Progress Update Section (Conditional) */}
              {event.eventType === 'offline' && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                  <h2 className="text-xl font-semibold mb-6 flex items-center">
                    <span className="bg-blue-500 w-2 h-6 mr-2 rounded-sm"></span>
                    Cập nhật Tiến độ Hôm nay
                  </h2>
                  
                  <form onSubmit={handleUpdateProgress} className="space-y-4">
                    {/* Main Value Input (Based on Target Unit) */}
                    <div>
                      <label htmlFor="progressValue" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        {`Số ${event.targetUnit} hoàn thành`}
                      </label>
                      <input
                        type="number"
                        id="progressValue"
                        name="value"
                        value={progressUpdate.value}
                        onChange={handleProgressInputChange}
                        placeholder={`Nhập số ${event.targetUnit}`}
                        min="0" // Allow 0 if needed, adjust validation accordingly
                        step="any" // Allow decimals if appropriate for the unit
                        className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                      />
                    </div>

                    {/* Optional Fields Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Distance */}
                      <div>
                        <label htmlFor="progressDistance" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Khoảng cách (km)</label>
                        <input
                          type="number"
                          id="progressDistance"
                          name="distance"
                          value={progressUpdate.distance}
                          onChange={handleProgressInputChange}
                          placeholder="VD: 5.5"
                          min="0"
                          step="0.1"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      {/* Time */}
                      <div>
                        <label htmlFor="progressTime" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Thời gian (HH:MM:SS)</label>
                        <input
                          type="text" // Use text to allow flexible format, validation needed
                          id="progressTime"
                          name="time"
                          value={progressUpdate.time}
                          onChange={handleProgressInputChange}
                          placeholder="VD: 01:15:30"
                          pattern="^\d{1,2}:\d{2}(:\d{2})?$" // Basic pattern, refine if needed
                          title="Nhập theo định dạng HH:MM hoặc HH:MM:SS"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      {/* Calories */}
                       <div>
                        <label htmlFor="progressCalories" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Calories (kcal)</label>
                        <input
                          type="number"
                          id="progressCalories"
                          name="calories"
                          value={progressUpdate.calories}
                          onChange={handleProgressInputChange}
                          placeholder="VD: 350"
                          min="0"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label htmlFor="progressNotes" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Ghi chú (Tùy chọn)</label>
                      <textarea
                        id="progressNotes"
                        name="notes"
                        rows="2"
                        value={progressUpdate.notes}
                        onChange={handleProgressInputChange}
                        placeholder="Thêm ghi chú về buổi tập..."
                        className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      ></textarea>
                    </div>

                    {/* Submit Button and Feedback */}
                    <div className="flex items-center justify-end space-x-4 pt-2">
                      {progressError && (
                        <p className="text-sm text-red-500 flex items-center">
                          <MdErrorOutline className="mr-1"/> {progressError}
                        </p>
                      )}
                      {progressSuccess && (
                        <p className="text-sm text-green-500 flex items-center">
                          <MdCheckCircle className="mr-1"/> Đã cập nhật!
                        </p>
                      )}
                      <button 
                        type="submit"
                        disabled={isProgressSubmitting}
                        className={`px-6 py-2 rounded-lg text-white transition flex items-center justify-center min-w-[120px] ${isProgressSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
                      >
                        {isProgressSubmitting ? (
                           <AiOutlineLoading3Quarters className="animate-spin mr-2" />
                        ) : (
                           <FaCheckCircle className="mr-2" />
                        )}
                        {isProgressSubmitting ? 'Đang lưu...' : 'Lưu tiến độ'}
                      </button>
                    </div>
                  </form>
                </div>
              )} 
              {/* End Progress Update Section */} 

              {/* Daily Progress History */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <span className="bg-cyan-500 w-2 h-6 mr-2 rounded-sm"></span>
                  Lịch sử Tiến độ Hàng ngày
                </h2>
                <ul className="space-y-4 max-h-60 overflow-y-auto pr-2">
                  {Array.isArray(event.userDailyProgress) && 
                    event.userDailyProgress
                    .sort((a, b) => moment(b.date).diff(moment(a.date)))
                    .map((progress, index) => (
                      <li key={index} className={`p-4 rounded-lg border ${progress.calories ? 'border-cyan-200 bg-cyan-50 dark:border-cyan-700 dark:bg-cyan-900/20' : 'border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/20'}`}>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                          {/* Date and Time Info */}
                          <div className="flex items-center mb-2 sm:mb-0">
                            <div className={`p-2 rounded-full mr-3 ${progress.calories ? 'bg-cyan-100 dark:bg-cyan-900/30' : 'bg-gray-100 dark:bg-gray-900/30'}`}>
                              <BsCalendarCheck className={progress.calories ? 'text-cyan-500' : 'text-gray-500'} />
                            </div>
                            <div>
                              <p className="font-medium text-gray-700 dark:text-gray-300">{moment(progress.date).format('dddd, DD/MM/YYYY')}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{moment(progress.date).format('HH:mm')}</p>
                            </div>
                          </div>
                          {/* Progress Value */}
                          <div className="text-right flex-shrink-0">
                            <p className={`font-semibold text-lg ${progress.calories ? 'text-cyan-600 dark:text-cyan-400' : 'text-gray-700 dark:text-gray-300'}`}>
                              +{progress.value} {progress.unit}
                            </p>
                          </div>
                        </div>
                        {/* Additional Details for Offline Events */}
                        {event.eventType === 'offline' && (progress.calories || progress.distance || progress.time) && (
                          <div className="mt-3 pt-3 border-t border-cyan-100 dark:border-cyan-800 flex flex-wrap gap-x-4 gap-y-1 text-sm text-cyan-700 dark:text-cyan-300">
                            {progress.distance && <span className="flex items-center"><FaRunning className="mr-1" /> {progress.distance} km</span>}
                            {progress.time && <span className="flex items-center"><BsClockHistory className="mr-1" /> {progress.time}</span>}
                            {progress.calories && <span className="flex items-center"><AiFillHeart className="mr-1 text-red-500" /> {progress.calories} kcal</span>}
                          </div>
                        )}
                      </li>
                    ))
                  }
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                  <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <span className="bg-orange-500 w-2 h-6 mr-2 rounded-sm"></span>
                    Quy tắc sự kiện
                  </h2>
                  <ul className="space-y-2">
                    {event.rules.map((rule, index) => (
                      <li key={index} className="flex items-start">
                        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-orange-100 text-orange-500 dark:bg-orange-900/30 mr-2 mt-0.5">
                          {index + 1}
                        </span>
                        <span className="text-gray-700 dark:text-gray-300">{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                  <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <span className="bg-pink-500 w-2 h-6 mr-2 rounded-sm"></span>
                    Phần thưởng
                  </h2>
                  <ul className="space-y-2">
                    {event.rewards.map((reward, index) => (
                      <li key={index} className="flex items-center">
                        <div className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-pink-100 dark:bg-pink-900/30 mr-2 text-pink-500">
                          🏆
                        </div>
                        <span className="text-gray-700 dark:text-gray-300">{reward}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                  </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <span className="bg-indigo-500 w-2 h-6 mr-2 rounded-sm"></span>
                  Thông tin thêm
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-lg mb-2">Chi tiết sự kiện</h3>
                    <ul className="space-y-2">
                      <li className="flex items-center text-gray-700 dark:text-gray-300">
                        <span className="font-medium w-32">Thể loại:</span> {event.category}
                      </li>
                      <li className="flex items-center text-gray-700 dark:text-gray-300">
                        <span className="font-medium w-32">Loại sự kiện:</span> {event.eventType === "online" ? "Sự kiện trực tuyến" : "Sự kiện Trực tiếp"}
                      </li>
                      <li className="flex items-center text-gray-700 dark:text-gray-300">
                        <span className="font-medium w-32">Độ khó:</span> {event.difficulty || "Không xác định"}
                      </li>
                      <li className="flex items-center text-gray-700 dark:text-gray-300">
                        <span className="font-medium w-32">Người tham gia:</span> {event.participants !== undefined ? event.participants : mockLeaderboard.totalParticipants}
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-lg mb-2">Nhà tổ chức</h3>
                    <ul className="space-y-2">
                      {event.organizers.map((organizer, index) => (
                        <li key={index} className="text-gray-700 dark:text-gray-300">
                          <div className="font-medium">{organizer.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{organizer.contact}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <span className="bg-teal-500 w-2 h-6 mr-2 rounded-sm"></span>
                  Câu hỏi thường gặp
                </h2>
                
                <div className="space-y-4">
                  {event.faqs.map((faq, index) => (
                    <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0 last:pb-0">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2">{faq.question}</h3>
                      <p className="text-gray-700 dark:text-gray-300">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'participants' && (
              <div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                  <div className="mb-4 sm:mb-0">
                    <h2 className="text-xl font-semibold">Người tham gia</h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      Tổng số: {event.participants !== undefined ? event.participants : mockLeaderboard.totalParticipants} | 
                      <span className="text-blue-500 ml-1">
                        {participants.filter(p => p.isFollowed).length} người đang theo dõi
                      </span>
                    </p>
                  </div>
                  
                  <div className="w-full sm:w-auto">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Tìm người tham gia..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                      <FaSearch className="absolute left-3 top-3 text-gray-400" />
                    </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th 
                          scope="col" 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort('rank')}
                        >
                          <div className="flex items-center">
                            Thứ hạng {getSortIcon('rank')}
                          </div>
                          </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Tên
                          </th>
                        {event.eventType !== 'online' && (
                          <>
                            <th 
                              scope="col" 
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                              onClick={() => handleSort('calories')}
                            >
                              <div className="flex items-center">
                                Calories {getSortIcon('calories')}
                            </div>
                          </th>
                            <th 
                              scope="col" 
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                              onClick={() => handleSort('distance')}
                            >
                              <div className="flex items-center">
                                Khoảng cách {getSortIcon('distance')}
                            </div>
                          </th>
                          </>
                        )}
                        <th 
                          scope="col" 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort('time')}
                        >
                          <div className="flex items-center">
                            Thời gian {getSortIcon('time')}
                            </div>
                          </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Tiến độ
                          </th>
                        </tr>
                      </thead>
                    <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                      {participants
                        .filter(participant => 
                          participant.name.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((participant) => (
                          <tr 
                            key={participant.rank}
                            className={`${participant.isCurrentUser ? 'bg-green-50 dark:bg-green-900/30 font-semibold' : participant.isFollowed ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {participant.rank <= 3 && !participant.isCurrentUser ? (
                                  <div className={`
                                    flex items-center justify-center w-8 h-8 rounded-full mr-2
                                    ${participant.rank === 1 ? 'bg-yellow-100 text-yellow-600' : 
                                      participant.rank === 2 ? 'bg-gray-100 text-gray-600' : 
                                      'bg-orange-100 text-orange-600'}
                                    dark:bg-opacity-20
                                  `}>
                                    <FaMedal />
                                  </div>
                                ) : (
                                  <div className={`w-8 h-8 flex items-center justify-center mr-2 ${participant.isCurrentUser ? 'text-green-600 dark:text-green-400' : ''}`}>
                                    {participant.isCurrentUser ? <FaUserCircle size={20} /> : participant.rank}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-10 w-10 flex-shrink-0">
                                <img
                                    className="h-10 w-10 rounded-full"
                                  src={participant.avatar || useravatar}
                                    alt=""
                                />
                                </div>
                                <div className="ml-4">
                                  <div className={`text-sm ${participant.isCurrentUser ? 'text-green-700 dark:text-green-300 font-bold' : participant.isFollowed ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-900 dark:text-white font-medium'}`}>
                                  {participant.name}
                                    {participant.isCurrentUser ? (
                                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                        Bạn
                                      </span>
                                    ) : participant.isFollowed && (
                                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                        Đang theo dõi
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            {event.eventType !== 'online' && (
                              <>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm ${participant.isCurrentUser ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                  {participant.calories} kcal
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm ${participant.isCurrentUser ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                  {participant.distance} km
                            </td>
                              </>
                            )}
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${participant.isCurrentUser ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                              {participant.time}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className={`w-full rounded-full h-2.5 mr-2 w-24 ${participant.isCurrentUser ? 'bg-green-100 dark:bg-green-700' : 'bg-gray-200 dark:bg-gray-700'}`}>
                                  <div 
                                    className={`${participant.isCurrentUser ? 'bg-green-500' : 'bg-green-500'} h-2.5 rounded-full`} 
                                    style={{ width: `${participant.progress}%` }}
                                  ></div>
                                </div>
                                <span className={`text-sm ${participant.isCurrentUser ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                  {participant.progress}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))
                      }
                      </tbody>
                    </table>
                </div>
                  </div>

              {event.eventType !== 'online' && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                  <h2 className="text-xl font-semibold mb-4">Tổng số calories đã đốt</h2>
                  <div className="flex items-center text-3xl font-bold text-red-500">
                    {mockLeaderboard.totalCaloriesBurned.toLocaleString()} <span className="ml-2 text-gray-500 text-lg font-normal">kcal</span>
                  </div>
                </div>
              )}
                      </div>
          )}

          {activeTab === 'posts' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
                <div className="mb-4">
                  <textarea
                    placeholder={[
                      "Chia sẻ thành tích hôm nay của bạn!",
                      "Cảm nghĩ của bạn về buổi tập/chặng đường vừa qua?",
                      "Một khoảnh khắc đáng nhớ trong sự kiện? Chia sẻ ngay!",
                      "Bạn có lời khuyên nào cho các thành viên khác không?"
                    ][Math.floor(Math.random() * 4)]}
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 p-3 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    rows={3}
                  />
                        </div>
                
                {newPost.images.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {newPost.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={image} 
                          alt={`Preview ${index}`} 
                          className="w-20 h-20 object-cover rounded-lg border border-gray-300"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <FaTimes size={10} />
                        </button>
                      </div>
                    ))}
                    </div>
                )}
                
                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => fileInputRef.current.click()}
                      className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                      <FaImage className="mr-1" />
                      <span>Hình ảnh</span>
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePostImageUpload}
                      className="hidden"
                      accept="image/*"
                      multiple
                    />
                  </div>
                  
                  <button
                    onClick={handleCreatePost}
                    disabled={!newPost.content.trim() && newPost.images.length === 0}
                    className={`px-4 py-2 rounded-lg ${
                      !newPost.content.trim() && newPost.images.length === 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                        : 'bg-red-500 text-white hover:bg-red-600 transition'
                    }`}
                  >
                    {isPostSubmitting ? 'Đang đăng...' : 'Đăng'}
                  </button>
                </div>
              </div>
              
              <h2 className="text-xl font-semibold">Bài đăng cộng đồng</h2>
              
              {posts.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
                  <p className="text-gray-500 dark:text-gray-400">Chưa có bài đăng nào. Hãy là người đầu tiên chia sẻ trải nghiệm của bạn!</p>
            </div>
              ) : (
                posts.map((post) => (
                  <div key={post._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
                    <div className="flex items-start mb-4">
                      <img
                        src={post.user.avatar || useravatar}
                        alt=""
                        className="h-10 w-10 rounded-full mr-3"
                      />
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {post.user.name}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                          {moment(post.createdAt).fromNow()}
                        </p>
                  </div>
                </div>

                    <p className="text-gray-700 dark:text-gray-300 mb-4">{post.content}</p>

                {post.images.length > 0 && (
                      <div className={`mb-4 grid ${
                        post.images.length === 1 ? 'grid-cols-1' : 
                        post.images.length === 2 ? 'grid-cols-2' : 
                        'grid-cols-2 md:grid-cols-3'
                      } gap-2`}>
                    {post.images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                            alt={`Post image ${index}`} 
                            className={`rounded-lg w-full ${
                              post.images.length === 1 ? 'max-h-96 object-contain' : 'h-48 object-cover'
                            }`}
                      />
                    ))}
                  </div>
                )}

                    <div className="flex justify-between text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <button
                      onClick={() => handlePostLike(post._id)}
                        className="flex items-center"
                    >
                      {post.is_like ? (
                          <AiFillHeart className="mr-1 text-red-500" />
                      ) : (
                          <CiHeart className="mr-1" />
                      )}
                        <span>{post.like_count} Thích</span>
                    </button>
                      
                      <button className="flex items-center">
                        <LiaComments className="mr-1" />
                        <span>{post.comment_count} Bình luận</span>
                    </button>
                      
                      <button className="flex items-center">
                        <PiShareFatLight className="mr-1" />
                        <span>{post.share_count} Chia sẻ</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
                </div>
          )}
        </div>
      </div>
    </div>
  )
} 