import React, { useState, useEffect } from 'react';
import { format, parseISO, subMonths, differenceInDays, isAfter } from 'date-fns';
import { vi } from 'date-fns/locale';

const UserProgressChart = ({ healthMetricsHistory = [], activityHistory = [], userProfile }) => {
  const [timeRange, setTimeRange] = useState('3m'); // Mặc định hiển thị 3 tháng
  const [progressData, setProgressData] = useState([]);
  const [trendResult, setTrendResult] = useState({
    weightTrend: 'stable',
    activityTrend: 'stable',
    onTrack: true,
    evaluation: 'normal'
  });

  // Xử lý và tính toán dữ liệu
  useEffect(() => {
    if (!healthMetricsHistory.length && !activityHistory.length) {
      setProgressData([]);
      return;
    }

    try {
      // Tiền xử lý dữ liệu cân nặng
      const processedHealthData = healthMetricsHistory.map(item => {
        try {
          const date = parseISO(item.date);
          if (isNaN(date.getTime())) return null;

          return {
            date,
            formattedDate: format(date, 'dd/MM/yyyy'),
            weightKg: item.weightKg,
            bodyFatPercentage: item.bodyFatPercentage
          };
        } catch (err) {
          return null;
        }
      }).filter(item => item !== null)
        .sort((a, b) => a.date - b.date);
      
      // Tiền xử lý dữ liệu hoạt động
      const processedActivityData = activityHistory.map(item => {
        try {
          const date = parseISO(item.date);
          if (isNaN(date.getTime())) return null;

          return {
            date,
            formattedDate: format(date, 'dd/MM/yyyy'),
            type: item.type,
            completed: item.status === 'completed',
            calories: item.caloriesBurned || 0
          };
        } catch (err) {
          return null;
        }
      }).filter(item => item !== null)
        .sort((a, b) => a.date - b.date);

      // Lọc dữ liệu theo khoảng thời gian
      const now = new Date();
      let startDate;
      
      switch (timeRange) {
        case '1m':
          startDate = subMonths(now, 1);
          break;
        case '3m':
          startDate = subMonths(now, 3);
          break;
        case '6m':
          startDate = subMonths(now, 6);
          break;
        case 'all':
          // Lấy ngày của dữ liệu sớm nhất
          startDate = new Date(Math.min(
            ...(processedHealthData.length ? [processedHealthData[0].date] : [now]),
            ...(processedActivityData.length ? [processedActivityData[0].date] : [now])
          ));
          break;
        default:
          startDate = subMonths(now, 3);
      }

      // Lọc dữ liệu
      const filteredHealthData = processedHealthData.filter(item => isAfter(item.date, startDate));
      const filteredActivityData = processedActivityData.filter(item => isAfter(item.date, startDate));

      // Tạo mảng phân tích
      const combinedData = [];
      
      // Sử dụng dữ liệu cân nặng làm cơ sở (vì thường là dữ liệu chuẩn hơn)
      if (filteredHealthData.length > 0) {
        filteredHealthData.forEach(healthItem => {
          // Tìm tất cả hoạt động cùng ngày
          const matchingActivities = filteredActivityData.filter(
            activityItem => format(activityItem.date, 'yyyy-MM-dd') === format(healthItem.date, 'yyyy-MM-dd')
          );
          
          // Tính tổng calories và số hoạt động hoàn thành
          const totalCalories = matchingActivities.reduce((sum, act) => sum + act.calories, 0);
          const completedActivities = matchingActivities.filter(act => act.completed).length;
          
          combinedData.push({
            date: healthItem.date,
            formattedDate: healthItem.formattedDate,
            weightKg: healthItem.weightKg,
            bodyFatPercentage: healthItem.bodyFatPercentage,
            activitiesCount: matchingActivities.length,
            completedActivities,
            caloriesBurned: totalCalories
          });
        });
      }

      // Thêm ngày có hoạt động nhưng không có dữ liệu cân nặng
      filteredActivityData.forEach(activityItem => {
        // Kiểm tra xem ngày đã có trong combinedData chưa
        const existingDateEntry = combinedData.find(
          item => format(item.date, 'yyyy-MM-dd') === format(activityItem.date, 'yyyy-MM-dd')
        );
        
        if (!existingDateEntry) {
          // Tìm tất cả hoạt động cùng ngày
          const matchingActivities = filteredActivityData.filter(
            act => format(act.date, 'yyyy-MM-dd') === format(activityItem.date, 'yyyy-MM-dd')
          );
          
          // Tìm dữ liệu cân nặng gần nhất trước đó
          const previousHealthData = processedHealthData
            .filter(health => health.date < activityItem.date)
            .sort((a, b) => b.date - a.date)[0];
          
          // Tính tổng calories và số hoạt động hoàn thành
          const totalCalories = matchingActivities.reduce((sum, act) => sum + act.calories, 0);
          const completedActivities = matchingActivities.filter(act => act.completed).length;
          
          combinedData.push({
            date: activityItem.date,
            formattedDate: activityItem.formattedDate,
            weightKg: previousHealthData?.weightKg || null,
            bodyFatPercentage: previousHealthData?.bodyFatPercentage || null,
            activitiesCount: matchingActivities.length,
            completedActivities,
            caloriesBurned: totalCalories
          });
        }
      });

      // Sắp xếp lại theo thứ tự thời gian
      const sortedData = combinedData.sort((a, b) => a.date - b.date);
      setProgressData(sortedData);

      // Phân tích xu hướng
      analyzeUserTrend(sortedData, userProfile);
      
    } catch (error) {
      console.error("Lỗi khi xử lý dữ liệu tiến trình:", error);
      setProgressData([]);
    }
  }, [healthMetricsHistory, activityHistory, timeRange, userProfile]);

  // Phân tích xu hướng của người dùng
  const analyzeUserTrend = (data, profile) => {
    if (!data || data.length < 2 || !profile) {
      setTrendResult({
        weightTrend: 'insufficient-data',
        activityTrend: 'insufficient-data',
        onTrack: false,
        evaluation: 'insufficient-data'
      });
      return;
    }

    // Phân tích xu hướng cân nặng
    const startWeight = data[0].weightKg;
    const endWeight = data[data.length - 1].weightKg;
    const targetWeight = profile?.goal?.targetWeightKg;
    
    let weightTrend = 'stable';
    if (endWeight < startWeight) weightTrend = 'decreasing';
    else if (endWeight > startWeight) weightTrend = 'increasing';

    // Phân tích xu hướng hoạt động
    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));
    
    const avgCompletionFirstHalf = firstHalf.reduce((sum, item) => 
      sum + (item.activitiesCount ? item.completedActivities / item.activitiesCount : 0), 0) / firstHalf.length;
    
    const avgCompletionSecondHalf = secondHalf.reduce((sum, item) => 
      sum + (item.activitiesCount ? item.completedActivities / item.activitiesCount : 0), 0) / secondHalf.length;
    
    let activityTrend = 'stable';
    if (avgCompletionSecondHalf > avgCompletionFirstHalf) activityTrend = 'improving';
    else if (avgCompletionSecondHalf < avgCompletionFirstHalf) activityTrend = 'declining';

    // Xác định người dùng có đang đi đúng hướng không
    let onTrack = false;
    let evaluation = 'normal';
    
    if (profile?.goal?.type === 'weight-loss') {
      onTrack = weightTrend === 'decreasing';
      if (onTrack && activityTrend === 'improving') evaluation = 'excellent';
      else if (onTrack) evaluation = 'good';
      else if (weightTrend === 'increasing') evaluation = 'concern';
      else evaluation = 'normal';
    } else if (profile?.goal?.type === 'weight-gain') {
      onTrack = weightTrend === 'increasing';
      if (onTrack && activityTrend === 'improving') evaluation = 'excellent';
      else if (onTrack) evaluation = 'good';
      else if (weightTrend === 'decreasing') evaluation = 'concern';
      else evaluation = 'normal';
    } else if (profile?.goal?.type === 'maintain') {
      onTrack = weightTrend === 'stable';
      if (onTrack && activityTrend === 'improving') evaluation = 'excellent';
      else if (onTrack) evaluation = 'good';
      else evaluation = 'normal';
    }

    setTrendResult({
      weightTrend,
      activityTrend,
      onTrack,
      evaluation
    });
  };

  // Lấy mô tả xu hướng cân nặng
  const getWeightTrendDescription = () => {
    const { weightTrend } = trendResult;
    const goalType = userProfile?.goal?.type || 'unknown';
    
    switch (weightTrend) {
      case 'decreasing':
        return goalType === 'weight-loss' 
          ? 'Cân nặng đang giảm - đúng hướng mục tiêu' 
          : goalType === 'weight-gain'
            ? 'Cân nặng đang giảm - ngược với mục tiêu tăng cân'
            : 'Cân nặng đang giảm';
      case 'increasing':
        return goalType === 'weight-gain' 
          ? 'Cân nặng đang tăng - đúng hướng mục tiêu' 
          : goalType === 'weight-loss'
            ? 'Cân nặng đang tăng - ngược với mục tiêu giảm cân'
            : 'Cân nặng đang tăng';
      case 'stable':
        return goalType === 'maintain' 
          ? 'Cân nặng ổn định - đúng với mục tiêu duy trì'
          : 'Cân nặng ổn định';
      default:
        return 'Không đủ dữ liệu để phân tích xu hướng cân nặng';
    }
  };

  // Lấy mô tả xu hướng hoạt động
  const getActivityTrendDescription = () => {
    const { activityTrend } = trendResult;
    
    switch (activityTrend) {
      case 'improving':
        return 'Hoạt động đang tăng - tốt cho sức khỏe';
      case 'declining':
        return 'Hoạt động đang giảm - cần cải thiện';
      case 'stable':
        return 'Hoạt động ổn định';
      default:
        return 'Không đủ dữ liệu để phân tích xu hướng hoạt động';
    }
  };

  // Lấy đánh giá tổng thể
  const getOverallEvaluation = () => {
    const { evaluation } = trendResult;
    
    switch (evaluation) {
      case 'excellent':
        return 'Xuất sắc! Tiếp tục giữ vững thành tích này.';
      case 'good':
        return 'Tốt! Bạn đang đi đúng hướng.';
      case 'normal':
        return 'Bình thường. Có thể cải thiện thêm.';
      case 'concern':
        return 'Cần lưu ý! Tiến trình không đúng với mục tiêu đề ra.';
      default:
        return 'Chưa đủ dữ liệu để đánh giá.';
    }
  };

  // Lấy màu tương ứng với đánh giá
  const getEvaluationColor = () => {
    const { evaluation } = trendResult;
    
    switch (evaluation) {
      case 'excellent':
        return 'text-green-600 dark:text-green-400';
      case 'good':
        return 'text-blue-600 dark:text-blue-400';
      case 'normal':
        return 'text-gray-600 dark:text-gray-400';
      case 'concern':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  // Hiển thị khi không có dữ liệu
  if (!progressData || progressData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
        <h3 className="text-lg font-semibold dark:text-white mb-2">Phân Tích Tiến Trình</h3>
        <div className="flex justify-end items-center mb-4">
          <TimeRangeSelector timeRange={timeRange} setTimeRange={setTimeRange} />
        </div>
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">Không có đủ dữ liệu để phân tích</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
      <h3 className="text-lg font-semibold dark:text-white mb-2">Phân Tích Tiến Trình</h3>
      
      <div className="flex justify-end items-center mb-4">
        <TimeRangeSelector timeRange={timeRange} setTimeRange={setTimeRange} />
      </div>
      
      {/* Thông tin tổng hợp */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
        <h4 className="text-md font-medium text-gray-800 dark:text-white mb-3">Xu hướng tổng thể</h4>
        <div className="space-y-2">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <span className="font-medium">Cân nặng:</span> {getWeightTrendDescription()}
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <span className="font-medium">Hoạt động:</span> {getActivityTrendDescription()}
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <span className="font-medium">Mục tiêu:</span> {userProfile?.goal?.type === 'weight-loss' 
              ? 'Giảm cân' 
              : userProfile?.goal?.type === 'weight-gain' 
                ? 'Tăng cân' 
                : 'Duy trì cân nặng'
            }
          </p>
          <p className={`text-sm font-medium ${getEvaluationColor()}`}>
            <span className="font-bold">Đánh giá:</span> {getOverallEvaluation()}
          </p>
        </div>
      </div>
      
      {/* Bảng dữ liệu */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Ngày
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Cân nặng
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Hoạt động hoàn thành
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Calories đã đốt
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {progressData.map((item, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700' : ''}>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {item.formattedDate}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm">
                  {item.weightKg ? (
                    <span className="font-medium text-gray-900 dark:text-white">
                      {item.weightKg} kg
                    </span>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400">--</span>
                  )}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm">
                  {item.activitiesCount ? (
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      item.completedActivities === item.activitiesCount 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : item.completedActivities > 0
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {item.completedActivities}/{item.activitiesCount}
                    </span>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400">Không có</span>
                  )}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {item.caloriesBurned ? `${item.caloriesBurned} kcal` : '--'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Component cho nút chọn khoảng thời gian
const TimeRangeSelector = ({ timeRange, setTimeRange }) => (
  <div className="flex space-x-2">
    <button 
      onClick={() => setTimeRange('1m')}
      className={`px-3 py-1 text-sm rounded ${timeRange === '1m' 
        ? 'bg-green-500 text-white' 
        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
    >
      1 tháng
    </button>
    <button 
      onClick={() => setTimeRange('3m')}
      className={`px-3 py-1 text-sm rounded ${timeRange === '3m' 
        ? 'bg-green-500 text-white' 
        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
    >
      3 tháng
    </button>
    <button 
      onClick={() => setTimeRange('6m')}
      className={`px-3 py-1 text-sm rounded ${timeRange === '6m' 
        ? 'bg-green-500 text-white' 
        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
    >
      6 tháng
    </button>
    <button 
      onClick={() => setTimeRange('all')}
      className={`px-3 py-1 text-sm rounded ${timeRange === 'all' 
        ? 'bg-green-500 text-white' 
        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
    >
      Tất cả
    </button>
  </div>
);

export default UserProgressChart; 