import { useState, useEffect } from 'react';
import { FaCalendarCheck, FaSignInAlt, FaSignOutAlt, FaHistory, FaExclamationCircle } from 'react-icons/fa';
import { BsClockHistory } from 'react-icons/bs';
import moment from 'moment';
import AttendanceTimeline from './AttendanceTimeline';

/**
 * AttendanceTracker component for tracking user check-in and check-out during video sessions
 * 
 * @param {Object} props
 * @param {Object} props.session - Current session information
 * @param {boolean} props.isActive - Whether the session is currently active
 * @param {string} props.userId - Current user ID
 */
const AttendanceTracker = ({ session, isActive, userId }) => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [totalTime, setTotalTime] = useState(0); // in minutes
  const [absentTime, setAbsentTime] = useState(0); // in minutes
  const [showTimeline, setShowTimeline] = useState(false);
  
  // When the session or isActive state changes, reset attendance state
  useEffect(() => {
    if (session) {
      // Check if there's saved attendance data for this session
      const savedData = localStorage.getItem(`attendance_${session.sessionId}_${userId}`);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setAttendanceRecords(parsedData.records || []);
        setIsCheckedIn(parsedData.isCheckedIn || false);
        setTotalTime(parsedData.totalTime || 0);
        setAbsentTime(parsedData.absentTime || 0);
      } else {
        // Reset state for new session
        setAttendanceRecords([]);
        setIsCheckedIn(false);
        setTotalTime(0);
        setAbsentTime(0);
      }
    }
  }, [session, userId]);

  // Save attendance data to localStorage whenever it changes
  useEffect(() => {
    if (session) {
      localStorage.setItem(`attendance_${session.sessionId}_${userId}`, JSON.stringify({
        records: attendanceRecords,
        isCheckedIn,
        totalTime,
        absentTime
      }));
    }
  }, [attendanceRecords, isCheckedIn, totalTime, absentTime, session, userId]);

  // Update total time calculations every minute if checked in
  useEffect(() => {
    let timer;
    if (isActive && isCheckedIn) {
      timer = setInterval(() => {
        // Update total time (time since first check-in)
        if (attendanceRecords.length > 0) {
          const firstCheckIn = attendanceRecords[0];
          const now = moment();
          const diffMinutes = now.diff(moment(firstCheckIn.timestamp), 'minutes');
          setTotalTime(diffMinutes);
          
          // Calculate absent time (sum of all check-out to check-in intervals)
          let absTime = 0;
          for (let i = 1; i < attendanceRecords.length - 1; i += 2) {
            const checkOut = attendanceRecords[i];
            const checkIn = attendanceRecords[i + 1];
            if (checkOut && checkIn) {
              absTime += moment(checkIn.timestamp).diff(moment(checkOut.timestamp), 'minutes');
            }
          }
          setAbsentTime(absTime);
        }
      }, 60000); // Update every minute
    }
    return () => clearInterval(timer);
  }, [isActive, isCheckedIn, attendanceRecords]);

  const handleCheckIn = () => {
    const timestamp = new Date().toISOString();
    const newRecord = { type: 'check-in', timestamp };
    setAttendanceRecords([...attendanceRecords, newRecord]);
    setIsCheckedIn(true);
  };

  const handleCheckOut = () => {
    const timestamp = new Date().toISOString();
    const newRecord = { type: 'check-out', timestamp };
    setAttendanceRecords([...attendanceRecords, newRecord]);
    setIsCheckedIn(false);
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours > 0 ? hours + 'h ' : ''}${mins}m`;
  };

  const getAttendanceData = () => {
    // Get session start and end times
    const sessionStart = moment(session?.sessionDate);
    const sessionEnd = moment(session?.sessionDate).add(session?.durationHours, 'hours');
    
    // Calculate attendance statistics
    const firstCheckIn = attendanceRecords.length > 0 ? moment(attendanceRecords[0].timestamp) : null;
    const lastCheckOut = attendanceRecords.length > 0 
      ? attendanceRecords.filter(r => r.type === 'check-out').length > 0
        ? moment(attendanceRecords.filter(r => r.type === 'check-out').pop().timestamp)
        : null
      : null;
    
    const attendedDuration = firstCheckIn && lastCheckOut 
      ? lastCheckOut.diff(firstCheckIn, 'minutes') - absentTime
      : isCheckedIn && firstCheckIn
        ? moment().diff(firstCheckIn, 'minutes') - absentTime
        : 0;
        
    const sessionDuration = session?.durationHours * 60 || 0;
    const attendancePercentage = sessionDuration > 0 
      ? Math.min(100, Math.round((attendedDuration / sessionDuration) * 100))
      : 0;
      
    return {
      sessionStart,
      sessionEnd,
      firstCheckIn,
      lastCheckOut,
      attendedDuration,
      sessionDuration,
      attendancePercentage
    };
  };

  // Show warning if session is active but user is not checked in
  const showCheckInWarning = isActive && !isCheckedIn;
  
  // Get attendance data for display
  const attendanceData = getAttendanceData();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <FaCalendarCheck className="mr-2 text-blue-500" />
          Điểm danh buổi học
        </h3>
        <button 
          onClick={() => setShowTimeline(!showTimeline)}
          className="text-blue-500 hover:text-blue-700 text-sm flex items-center"
        >
          <FaHistory className="mr-1" />
          {showTimeline ? "Ẩn biểu đồ" : "Xem biểu đồ"}
        </button>
      </div>

      {/* Session information */}
      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center">
            <BsClockHistory className="mr-1 text-gray-500" /> 
            <span>Bắt đầu: {moment(session?.sessionDate).format('HH:mm')}</span>
          </div>
          <div className="flex items-center">
            <BsClockHistory className="mr-1 text-gray-500" /> 
            <span>Kết thúc: {moment(session?.sessionDate).add(session?.durationHours, 'hours').format('HH:mm')}</span>
          </div>
        </div>
      </div>

      {/* Attendance status and actions */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <div className={`h-3 w-3 rounded-full mr-2 ${isCheckedIn ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <span className="font-medium">{isCheckedIn ? 'Đang tham gia' : 'Chưa tham gia'}</span>
          </div>
          <div className="flex space-x-2">
            {isActive && (
              isCheckedIn ? (
                <button 
                  onClick={handleCheckOut}
                  className="px-3 py-1.5 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-md text-sm flex items-center"
                >
                  <FaSignOutAlt className="mr-1.5" /> Tạm rời khỏi
                </button>
              ) : (
                <button 
                  onClick={handleCheckIn}
                  className="px-3 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded-md text-sm flex items-center"
                >
                  <FaSignInAlt className="mr-1.5" /> {attendanceRecords.length > 0 ? 'Quay lại' : 'Bắt đầu tham gia'}
                </button>
              )
            )}
          </div>
        </div>

        {/* Attendance statistics */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400">Thời gian tham gia</div>
            <div className="font-medium">{formatTime(totalTime - absentTime)}</div>
          </div>
          <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400">Thời gian vắng</div>
            <div className="font-medium">{formatTime(absentTime)}</div>
          </div>
        </div>

        {/* Check-in warning */}
        {showCheckInWarning && (
          <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <div className="flex items-center text-yellow-800 dark:text-yellow-300">
              <FaExclamationCircle className="mr-2" />
              <span className="text-sm">Vui lòng bấm "Bắt đầu tham gia" để điểm danh buổi học</span>
            </div>
          </div>
        )}
      </div>

      {/* Attendance Timeline visualization */}
      {showTimeline && (
        <div className="mt-4 border-t pt-3">
          {attendanceRecords.length > 0 ? (
            <>
              <AttendanceTimeline 
                records={attendanceRecords}
                session={session}
                isCheckedIn={isCheckedIn}
              />
              
              {/* Attendance summary */}
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h5 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">Tóm tắt điểm danh</h5>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Thời điểm check-in đầu tiên:</span>
                    <span className="font-medium">{attendanceData.firstCheckIn ? attendanceData.firstCheckIn.format('HH:mm') : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Thời điểm check-out cuối cùng:</span>
                    <span className="font-medium">{attendanceData.lastCheckOut ? attendanceData.lastCheckOut.format('HH:mm') : isCheckedIn ? 'Chưa check-out' : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Tổng thời gian tham gia:</span>
                    <span className="font-medium">{formatTime(attendanceData.attendedDuration)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Tỷ lệ tham gia:</span>
                    <span className="font-medium">{attendanceData.attendancePercentage}%</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-500 text-center py-4">
              Chưa có dữ liệu điểm danh
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AttendanceTracker; 