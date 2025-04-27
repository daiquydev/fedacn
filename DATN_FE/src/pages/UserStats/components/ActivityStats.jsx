import React, { useState, useEffect } from 'react';
import { FaRunning, FaTrophy, FaPercentage, FaCalendarCheck } from 'react-icons/fa';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

const ActivityStats = ({ activitySummary = {}, activityHistory = [] }) => {
  const [processedActivities, setProcessedActivities] = useState([]);
  
  useEffect(() => {
    if (!activityHistory || activityHistory.length === 0) {
      setProcessedActivities([]);
      return;
    }
    
    try {
      // Xử lý ngày tháng và sắp xếp hoạt động
      const processed = activityHistory
        .map(activity => {
          try {
            if (!activity.dateJoined) return null;
            
            const joinedDate = parseISO(activity.dateJoined);
            if (isNaN(joinedDate.getTime())) {
              console.error('Ngày tham gia không hợp lệ:', activity.dateJoined);
              return null;
            }
            
            return {
              ...activity,
              parsedDateJoined: joinedDate
            };
          } catch (err) {
            console.error('Lỗi khi xử lý ngày tham gia:', activity.dateJoined, err);
            return null;
          }
        })
        .filter(activity => activity !== null)
        .sort((a, b) => b.parsedDateJoined - a.parsedDateJoined)
        .slice(0, 5);
      
      setProcessedActivities(processed);
    } catch (err) {
      console.error('Lỗi khi xử lý danh sách hoạt động:', err);
      setProcessedActivities([]);
    }
  }, [activityHistory]);

  // Kiểm tra dữ liệu
  const hasActivityData = processedActivities && processedActivities.length > 0;
  const defaultSummary = {
    totalEvents: 0,
    totalChallenges: 0,
    completionRate: 0,
    streakDays: 0
  };
  
  // Kết hợp dữ liệu mặc định và dữ liệu đầu vào
  const summary = { ...defaultSummary, ...activitySummary };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
      <h3 className="text-lg font-semibold mb-4 dark:text-white">Thống Kê Hoạt Động</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="flex flex-col items-center bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
          <FaRunning className="text-blue-500 text-2xl mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Sự kiện</p>
          <p className="text-xl font-semibold dark:text-white">{summary.totalEvents}</p>
        </div>
        
        <div className="flex flex-col items-center bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
          <FaTrophy className="text-yellow-500 text-2xl mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Thử thách</p>
          <p className="text-xl font-semibold dark:text-white">{summary.totalChallenges}</p>
        </div>
        
        <div className="flex flex-col items-center bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
          <FaPercentage className="text-green-500 text-2xl mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Tỷ lệ hoàn thành</p>
          <p className="text-xl font-semibold dark:text-white">{summary.completionRate}%</p>
        </div>
        
        <div className="flex flex-col items-center bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
          <FaCalendarCheck className="text-purple-500 text-2xl mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Chuỗi ngày hoạt động</p>
          <p className="text-xl font-semibold dark:text-white">{summary.streakDays} ngày</p>
        </div>
      </div>
      
      <h4 className="font-semibold text-md mb-3 dark:text-white">Hoạt Động Gần Đây</h4>
      
      {!hasActivityData ? (
        <div className="py-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">Chưa có hoạt động nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {processedActivities.map((activity) => (
            <div key={activity.id} className="flex items-start border-b border-gray-200 dark:border-gray-700 pb-3 last:border-0">
              <div className={`rounded-full w-8 h-8 flex items-center justify-center mr-3 mt-1 ${
                activity.type === 'event' ? 'bg-blue-100 dark:bg-blue-900' : 'bg-yellow-100 dark:bg-yellow-900'
              }`}>
                {activity.type === 'event' ? (
                  <FaRunning className="text-blue-600 dark:text-blue-300" />
                ) : (
                  <FaTrophy className="text-yellow-600 dark:text-yellow-300" />
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h5 className="font-medium dark:text-white">{activity.name}</h5>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    activity.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 
                    activity.status === 'active' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                  }`}>
                    {activity.status === 'completed' ? 'Hoàn thành' : 
                     activity.status === 'active' ? 'Đang tham gia' : 
                     'Chưa hoàn thành'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {activity.result}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {formatDistanceToNow(activity.parsedDateJoined, { addSuffix: true, locale: vi })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {processedActivities.length > 0 && (
        <div className="mt-4 text-center">
          <button className="text-green-600 dark:text-green-400 font-medium hover:underline">
            Xem tất cả hoạt động
          </button>
        </div>
      )}
    </div>
  );
};

export default ActivityStats; 