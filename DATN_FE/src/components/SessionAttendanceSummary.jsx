import React from 'react';
import { FaClock, FaCalendarCheck, FaUserClock, FaExclamationTriangle } from 'react-icons/fa';
import { BsClockHistory } from 'react-icons/bs';
import moment from 'moment';

/**
 * Component to display attendance summary for a completed session
 * 
 * @param {Object} props
 * @param {Object} props.session - Session data
 * @param {string} props.userId - Current user ID
 */
const SessionAttendanceSummary = ({ session, userId }) => {
  // Get saved attendance data for this session from localStorage
  const getSavedAttendanceData = () => {
    const key = `attendance_${session.sessionId}_${userId}`;
    const savedData = localStorage.getItem(key);
    if (!savedData) return null;
    
    try {
      return JSON.parse(savedData);
    } catch (e) {
      console.error("Error parsing saved attendance data:", e);
      return null;
    }
  };
  
  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours > 0 ? hours + 'h ' : ''}${mins}m`;
  };
  
  const attendanceData = getSavedAttendanceData();
  
  if (!attendanceData || !attendanceData.records || attendanceData.records.length === 0) {
    return (
      <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center mb-3">
          <FaExclamationTriangle className="text-yellow-500 mr-2" />
          <h3 className="text-base font-medium">Không có dữ liệu điểm danh</h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Bạn không tham gia hoặc không có dữ liệu điểm danh cho buổi học này.
        </p>
      </div>
    );
  }
  
  // Process attendance records to calculate statistics
  const records = attendanceData.records;
  const firstCheckIn = records.length > 0 ? moment(records[0].timestamp) : null;
  const lastCheckOut = records.filter(r => r.type === 'check-out').length > 0
    ? moment(records.filter(r => r.type === 'check-out').pop().timestamp)
    : null;
  
  // Calculate the time spent in session and absent time
  const sessionStart = moment(session.sessionDate);
  const sessionEnd = moment(session.sessionDate).add(session.durationHours, 'hours');
  const sessionDuration = session.durationHours * 60; // in minutes
  
  const totalTimePresent = attendanceData.totalTime - attendanceData.absentTime;
  const attendancePercentage = Math.min(100, Math.round((totalTimePresent / sessionDuration) * 100));
  
  // Determine if check-in was on time (within 10 minutes of start)
  const checkInDelay = firstCheckIn ? firstCheckIn.diff(sessionStart, 'minutes') : null;
  const isLate = checkInDelay > 10;
  
  // Determine attendance status
  let attendanceStatus = "Đầy đủ";
  let statusColor = "text-green-500 bg-green-50 dark:bg-green-900/20";
  
  if (attendancePercentage < 50) {
    attendanceStatus = "Vắng";
    statusColor = "text-red-500 bg-red-50 dark:bg-red-900/20";
  } else if (attendancePercentage < 90) {
    attendanceStatus = "Tham gia một phần";
    statusColor = "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20";
  }
  
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-medium flex items-center">
          <FaCalendarCheck className="mr-2 text-blue-500" />
          Điểm danh buổi học
        </h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
          {attendanceStatus}
        </span>
      </div>
      
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Thời gian tham gia</div>
            <div className="font-medium flex items-center">
              <FaClock className="mr-2 text-blue-500" />
              {formatTime(totalTimePresent)}
            </div>
          </div>
          
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tỷ lệ tham gia</div>
            <div className="font-medium flex items-center">
              <FaUserClock className="mr-2 text-blue-500" />
              {attendancePercentage}%
            </div>
          </div>
        </div>
        
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-gray-600 dark:text-gray-400 flex items-center">
              <BsClockHistory className="mr-1.5" /> Bắt đầu buổi học
            </span>
            <span className="font-medium">{sessionStart.format('HH:mm')}</span>
          </div>
          
          <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-gray-600 dark:text-gray-400 flex items-center">
              <BsClockHistory className="mr-1.5" /> Check-in đầu tiên
            </span>
            <span className={`font-medium ${isLate ? 'text-orange-500' : ''}`}>
              {firstCheckIn ? firstCheckIn.format('HH:mm') : 'N/A'} 
              {isLate && firstCheckIn && <span className="ml-1 text-xs">(Muộn {checkInDelay} phút)</span>}
            </span>
          </div>
          
          <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-gray-600 dark:text-gray-400 flex items-center">
              <BsClockHistory className="mr-1.5" /> Check-out cuối cùng
            </span>
            <span className="font-medium">
              {lastCheckOut ? lastCheckOut.format('HH:mm') : 'N/A'}
            </span>
          </div>
          
          <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-gray-600 dark:text-gray-400 flex items-center">
              <BsClockHistory className="mr-1.5" /> Kết thúc buổi học
            </span>
            <span className="font-medium">{sessionEnd.format('HH:mm')}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400 flex items-center">
              <BsClockHistory className="mr-1.5" /> Thời gian vắng
            </span>
            <span className="font-medium">
              {formatTime(attendanceData.absentTime)}
            </span>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-blue-500 h-2.5 rounded-full" 
              style={{ width: `${attendancePercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionAttendanceSummary; 