import React from 'react';
import { FaSignInAlt, FaSignOutAlt, FaCalendarAlt } from 'react-icons/fa';
import { BsClockHistory } from 'react-icons/bs';
import moment from 'moment';

/**
 * Component to display a timeline visualization of attendance records
 * 
 * @param {Object} props
 * @param {Array} props.records - Attendance records with timestamp and type
 * @param {Object} props.session - Session information
 * @param {boolean} props.isCheckedIn - Whether the user is currently checked in
 */
const AttendanceTimeline = ({ records, session, isCheckedIn }) => {
  if (!session) return null;
  
  // Session start and end times
  const sessionStart = moment(session.sessionDate);
  const sessionEnd = moment(session.sessionDate).add(session.durationHours, 'hours');
  
  // Total session duration in minutes for timeline width calculations
  const sessionDuration = session.durationHours * 60;
  
  // Calculate position percentage for a timestamp
  const getPositionPercentage = (timestamp) => {
    const time = moment(timestamp);
    if (time.isBefore(sessionStart)) return 0;
    if (time.isAfter(sessionEnd)) return 100;
    
    const minutesFromStart = time.diff(sessionStart, 'minutes');
    return Math.min(100, Math.max(0, (minutesFromStart / sessionDuration) * 100));
  };
  
  // Current time position percentage
  const nowPercentage = getPositionPercentage(new Date());
  
  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium mb-3">Biểu đồ thời gian tham gia</h4>
      
      <div className="relative mt-6 mb-8">
        {/* Timeline base */}
        <div className="absolute left-0 right-0 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        
        {/* Session start marker */}
        <div className="absolute left-0 bottom-3" style={{ transform: 'translateX(-50%)' }}>
          <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
            <FaCalendarAlt className="text-white text-[10px]" />
          </div>
          <div className="absolute whitespace-nowrap text-xs -left-8 mt-1 text-gray-600 dark:text-gray-400">
            {sessionStart.format('HH:mm')}
          </div>
        </div>
        
        {/* Session end marker */}
        <div className="absolute right-0 bottom-3" style={{ transform: 'translateX(50%)' }}>
          <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
            <FaCalendarAlt className="text-white text-[10px]" />
          </div>
          <div className="absolute whitespace-nowrap text-xs -right-8 mt-1 text-gray-600 dark:text-gray-400">
            {sessionEnd.format('HH:mm')}
          </div>
        </div>
        
        {/* Current time marker (if within session time) */}
        {nowPercentage > 0 && nowPercentage < 100 && (
          <div 
            className="absolute top-0 bottom-0" 
            style={{ left: `${nowPercentage}%`, transform: 'translateX(-50%)' }}
          >
            <div className="absolute w-3 h-8 bg-green-500 opacity-30 rounded-sm" style={{ top: '-10px' }}></div>
            <div className="absolute w-0.5 h-12 bg-green-500" style={{ top: '-14px' }}></div>
            <div className="absolute whitespace-nowrap text-xs -translate-x-1/2 -top-6 text-green-600 dark:text-green-400 font-medium">
              Hiện tại
            </div>
          </div>
        )}
        
        {/* Attendance segments */}
        {records.length > 0 && 
          records.reduce((segments, record, index, array) => {
            // Only process check-in records that have a corresponding check-out
            if (record.type === 'check-in') {
              const checkOutIndex = array.findIndex((r, i) => 
                i > index && r.type === 'check-out'
              );
              
              if (checkOutIndex !== -1) {
                const checkOut = array[checkOutIndex];
                const startPercent = getPositionPercentage(record.timestamp);
                const endPercent = getPositionPercentage(checkOut.timestamp);
                
                segments.push(
                  <div 
                    key={index}
                    className="absolute h-1.5 bg-green-500 rounded-full"
                    style={{ 
                      left: `${startPercent}%`, 
                      width: `${endPercent - startPercent}%` 
                    }}
                  ></div>
                );
              }
              // If this is the last check-in without a check-out and user is checked in
              else if (index === array.length - 1 && isCheckedIn) {
                const startPercent = getPositionPercentage(record.timestamp);
                const endPercent = nowPercentage < 100 ? nowPercentage : 100;
                
                segments.push(
                  <div 
                    key={index}
                    className="absolute h-1.5 bg-green-500 rounded-full"
                    style={{ 
                      left: `${startPercent}%`, 
                      width: `${endPercent - startPercent}%` 
                    }}
                  ></div>
                );
              }
            }
            
            return segments;
          }, [])
        }
        
        {/* Check-in markers */}
        {records.map((record, index) => {
          const positionPercent = getPositionPercentage(record.timestamp);
          if (positionPercent < 0 || positionPercent > 100) return null;
          
          return (
            <div 
              key={`marker-${index}`}
              className="absolute bottom-3" 
              style={{ 
                left: `${positionPercent}%`,
                transform: 'translateX(-50%)'
              }}
            >
              <div className={`w-4 h-4 ${record.type === 'check-in' ? 'bg-green-500' : 'bg-orange-500'} rounded-full flex items-center justify-center`}>
                {record.type === 'check-in' ? 
                  <FaSignInAlt className="text-white text-[10px]" /> : 
                  <FaSignOutAlt className="text-white text-[10px]" />
                }
              </div>
              <div className={`absolute whitespace-nowrap text-xs mt-5 transform -translate-x-1/2 ${record.type === 'check-in' ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                {moment(record.timestamp).format('HH:mm')}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-4 justify-center text-xs text-gray-600 dark:text-gray-400 mt-8">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-1.5"></div>
          Thời gian có mặt
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-full mr-1.5"></div>
          Thời gian vắng mặt
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded-full mr-1.5"></div>
          Giờ bắt đầu/kết thúc
        </div>
        <div className="flex items-center">
          <FaSignInAlt className="text-green-500 w-3 h-3 mr-1.5" />
          Check-in
        </div>
        <div className="flex items-center">
          <FaSignOutAlt className="text-orange-500 w-3 h-3 mr-1.5" />
          Check-out
        </div>
      </div>
    </div>
  );
};

export default AttendanceTimeline; 