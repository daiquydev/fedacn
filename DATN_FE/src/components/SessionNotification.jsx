import React, { useState, useEffect } from 'react';
import { FaBell, FaVideo, FaCalendarCheck, FaExternalLinkAlt, FaTimes } from 'react-icons/fa';
import { BsClockHistory } from 'react-icons/bs';
import moment from 'moment';

/**
 * SessionNotification component - Shows notifications for upcoming sessions
 * 
 * @param {Object} props
 * @param {Object} props.session - The upcoming session
 * @param {Function} props.onJoinSession - Function to call when user clicks join button
 * @param {Function} props.onDismiss - Function to call when user dismisses notification
 */
const SessionNotification = ({ session, onJoinSession, onDismiss }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [showNotification, setShowNotification] = useState(true);
  
  // Calculate time left until session start
  useEffect(() => {
    const updateTimeLeft = () => {
      if (!session) return;
      
      const now = moment();
      const sessionStart = moment(session.sessionDate);
      const diff = sessionStart.diff(now);
      
      // If session has already started
      if (diff <= 0) {
        const sessionEnd = moment(session.sessionDate).add(session.durationHours, 'hours');
        if (now.isBefore(sessionEnd)) {
          setTimeLeft('Đang diễn ra');
        } else {
          setTimeLeft('Đã kết thúc');
          // Auto dismiss after session ends
          setTimeout(() => {
            setShowNotification(false);
            if (onDismiss) onDismiss();
          }, 5000);
        }
        return;
      }
      
      // Calculate minutes or hours left
      const minutesLeft = Math.floor(diff / 60000);
      if (minutesLeft < 60) {
        setTimeLeft(`${minutesLeft} phút nữa`);
      } else {
        const hoursLeft = Math.floor(minutesLeft / 60);
        const remainingMinutes = minutesLeft % 60;
        setTimeLeft(`${hoursLeft}h ${remainingMinutes > 0 ? remainingMinutes + 'm' : ''} nữa`);
      }
    };
    
    updateTimeLeft(); // Initial update
    const interval = setInterval(updateTimeLeft, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [session, onDismiss]);
  
  // Don't render if no session or notification was dismissed
  if (!session || !showNotification) return null;
  
  const sessionStart = moment(session.sessionDate).format('HH:mm');
  const sessionDate = moment(session.sessionDate).format('DD/MM/YYYY');
  const isActive = timeLeft === 'Đang diễn ra';
  
  const handleDismiss = () => {
    setShowNotification(false);
    if (onDismiss) onDismiss();
  };
  
  return (
    <div className={`fixed bottom-4 right-4 w-80 z-50 shadow-lg rounded-lg overflow-hidden transition-all ${isActive ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800' : 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800'}`}>
      <div className="px-4 py-3 flex justify-between items-center border-b border-blue-100 dark:border-blue-800">
        <div className="flex items-center">
          <FaBell className={`mr-2 ${isActive ? 'text-green-500' : 'text-blue-500'}`} />
          <span className="font-medium">{isActive ? 'Buổi học đang diễn ra' : 'Nhắc nhở buổi học'}</span>
        </div>
        <button 
          onClick={handleDismiss}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <FaTimes />
        </button>
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">
          {session.topic || 'Buổi học trực tuyến'}
        </h3>
        
        <div className="mt-2 space-y-2 text-sm">
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <BsClockHistory className="mr-2" />
            <span>Thời gian: {sessionStart} ({session.durationHours}h)</span>
          </div>
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <FaCalendarCheck className="mr-2" />
            <span>Ngày: {sessionDate}</span>
          </div>
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <FaVideo className="mr-2" />
            <span>Hình thức: Trực tuyến</span>
          </div>
        </div>
        
        <div className={`mt-3 text-center py-2 rounded-md font-medium ${isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'}`}>
          {isActive ? 'Đang diễn ra' : `Bắt đầu sau: ${timeLeft}`}
        </div>
        
        <div className="mt-3 flex justify-between">
          <button 
            onClick={handleDismiss}
            className="px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded text-sm dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            Nhắc lại sau
          </button>
          
          <button 
            onClick={onJoinSession}
            className={`px-3 py-1.5 rounded text-sm flex items-center ${isActive ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
          >
            <FaExternalLinkAlt className="mr-1.5" />
            {isActive ? 'Tham gia ngay' : 'Xem chi tiết'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionNotification; 