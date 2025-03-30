import { useState, useEffect } from 'react';
import { FaChartLine, FaCalendarCheck, FaFire, FaRegCalendarAlt, FaCheckCircle, FaTrophy } from 'react-icons/fa';

export default function MealProgress({ mealPlanId }) {
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState(null);
  const [selectedTab, setSelectedTab] = useState('overview');
  
  // Mô phỏng fetch dữ liệu
  useEffect(() => {
    setTimeout(() => {
      // Mock progress data
      const mockProgressData = {
        overview: {
          planName: 'Thực đơn giảm cân 7 ngày',
          startDate: '2024-01-10T00:00:00Z',
          endDate: '2024-01-16T23:59:59Z',
          completedDays: 4,
          totalDays: 7,
          completionRate: 57,
          totalCaloriesBurned: 4250,
          averageCompletion: 85
        },
        weeklyData: [
          { day: 'CN', date: '10/01', completion: 100, calories: 1430 },
          { day: 'T2', date: '11/01', completion: 90, calories: 1380 },
          { day: 'T3', date: '12/01', completion: 75, calories: 1400 },
          { day: 'T4', date: '13/01', completion: 80, calories: 1410 },
          { day: 'T5', date: '14/01', completion: 0, calories: 1450 },
          { day: 'T6', date: '15/01', completion: 0, calories: 1420 },
          { day: 'T7', date: '16/01', completion: 0, calories: 1400 }
        ],
        achievements: [
          { id: 1, title: 'Ngày đầu tiên', description: 'Hoàn thành ngày đầu tiên của kế hoạch', achieved: true, date: '2024-01-10T20:15:30Z' },
          { id: 2, title: 'Liên tiếp 3 ngày', description: 'Hoàn thành các bữa ăn trong 3 ngày liên tiếp', achieved: true, date: '2024-01-12T21:30:45Z' },
          { id: 3, title: 'Nửa chặng đường', description: 'Hoàn thành một nửa kế hoạch', achieved: false, date: null },
          { id: 4, title: 'Hoàn thành', description: 'Hoàn thành toàn bộ kế hoạch ăn uống', achieved: false, date: null }
        ],
        mealTypeCompletion: {
          Sáng: 90,
          Trưa: 85,
          Tối: 70,
          Snack: 60
        }
      };
      
      setProgressData(mockProgressData);
      setLoading(false);
    }, 800);
  }, [mealPlanId]);
  
  if (loading) {
    return (
      <div className="min-h-[400px] flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md">
      {/* Tab navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setSelectedTab('overview')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              selectedTab === 'overview'
                ? 'text-green-600 dark:text-green-400 border-b-2 border-green-600 dark:border-green-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <FaChartLine className="inline mr-1" /> Tổng quan
          </button>
          <button
            onClick={() => setSelectedTab('daily')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              selectedTab === 'daily'
                ? 'text-green-600 dark:text-green-400 border-b-2 border-green-600 dark:border-green-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <FaCalendarCheck className="inline mr-1" /> Hàng ngày
          </button>
          <button
            onClick={() => setSelectedTab('achievements')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              selectedTab === 'achievements'
                ? 'text-green-600 dark:text-green-400 border-b-2 border-green-600 dark:border-green-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <FaTrophy className="inline mr-1" /> Thành tích
          </button>
        </div>
      </div>
      
      {/* Tab content */}
      <div className="p-4">
        {/* Overview tab */}
        {selectedTab === 'overview' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {progressData.overview.planName}
            </h3>
            
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Tiến độ hoàn thành</span>
                <span className="text-green-600 dark:text-green-400 font-medium">
                  {progressData.overview.completedDays}/{progressData.overview.totalDays} ngày ({progressData.overview.completionRate}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div 
                  className="bg-gradient-to-r from-green-500 to-green-600 h-2.5 rounded-full" 
                  style={{ width: `${progressData.overview.completionRate}%` }}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                <FaRegCalendarAlt className="mx-auto text-green-600 dark:text-green-400 mb-1" />
                <p className="text-xs text-gray-500 dark:text-gray-400">Ngày bắt đầu</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {new Date(progressData.overview.startDate).toLocaleDateString('vi-VN')}
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                <FaCalendarCheck className="mx-auto text-green-600 dark:text-green-400 mb-1" />
                <p className="text-xs text-gray-500 dark:text-gray-400">Ngày kết thúc</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {new Date(progressData.overview.endDate).toLocaleDateString('vi-VN')}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex flex-col items-center">
                  <FaCheckCircle className="text-blue-600 dark:text-blue-400 mb-1" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">Tỷ lệ hoàn thành trung bình</p>
                  <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                    {progressData.overview.averageCompletion}%
                  </p>
                </div>
              </div>
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="flex flex-col items-center">
                  <FaFire className="text-orange-600 dark:text-orange-400 mb-1" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">Tổng calo đã tiêu thụ</p>
                  <p className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                    {progressData.overview.totalCaloriesBurned}
                  </p>
                </div>
              </div>
            </div>
            
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Hoàn thành theo loại bữa ăn
            </h4>
            <div className="space-y-3">
              {Object.entries(progressData.mealTypeCompletion).map(([type, percentage]) => (
                <div key={type}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600 dark:text-gray-400">{type}</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">{percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                    <div 
                      className={`h-1.5 rounded-full ${
                        type === 'Sáng' ? 'bg-yellow-500' :
                        type === 'Trưa' ? 'bg-blue-500' :
                        type === 'Tối' ? 'bg-purple-500' :
                        'bg-green-500'
                      }`} 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Daily progress tab */}
        {selectedTab === 'daily' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Tiến độ hàng ngày
            </h3>
            
            <div className="space-y-4">
              {progressData.weeklyData.map((day, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-12 text-center">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{day.day}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{day.date}</p>
                  </div>
                  <div className="flex-1 mx-3">
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                      <div 
                        className={`h-2.5 rounded-full ${
                          day.completion === 100 
                            ? 'bg-green-600' 
                            : day.completion > 0 
                              ? 'bg-blue-600' 
                              : 'bg-gray-400 dark:bg-gray-600'
                        }`} 
                        style={{ width: `${day.completion}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-20 text-right">
                    <p className={`text-sm font-medium ${
                      day.completion === 100 
                        ? 'text-green-600 dark:text-green-400' 
                        : day.completion > 0 
                          ? 'text-blue-600 dark:text-blue-400' 
                          : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {day.completion}%
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {day.calories} kcal
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Cố gắng duy trì chế độ ăn uống đều đặn mỗi ngày để đạt được hiệu quả tốt nhất!
              </p>
            </div>
          </div>
        )}
        
        {/* Achievements tab */}
        {selectedTab === 'achievements' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Thành tích
            </h3>
            
            <div className="space-y-4">
              {progressData.achievements.map((achievement) => (
                <div 
                  key={achievement.id}
                  className={`p-3 rounded-lg border ${
                    achievement.achieved 
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/30'
                      : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`p-2 rounded-full mr-3 ${
                      achievement.achieved 
                        ? 'bg-green-200 dark:bg-green-800/40 text-green-600 dark:text-green-400'
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                    }`}>
                      <FaTrophy />
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-medium ${
                        achievement.achieved 
                          ? 'text-green-800 dark:text-green-300'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {achievement.title}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {achievement.description}
                      </p>
                      {achievement.achieved && achievement.date && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          Đạt được vào {new Date(achievement.date).toLocaleDateString('vi-VN', { 
                            day: 'numeric', 
                            month: 'numeric',
                            hour: 'numeric',
                            minute: 'numeric'
                          })}
                        </p>
                      )}
                    </div>
                    {achievement.achieved && (
                      <FaCheckCircle className="text-green-600 dark:text-green-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 