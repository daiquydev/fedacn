import React, { useState, useEffect } from 'react';
import { format, subMonths, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

// Tạo component WeightChart đơn giản hơn, không sử dụng Recharts
const WeightChart = ({ healthMetricsHistory, targetWeight }) => {
  const [timeRange, setTimeRange] = useState('all');
  const [chartData, setChartData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!healthMetricsHistory || healthMetricsHistory.length === 0) {
      setChartData([]);
      return;
    }

    try {
      // Xử lý dữ liệu và chuyển đổi ngày
      const processedData = healthMetricsHistory.map(item => {
        try {
          const date = parseISO(item.date);
          if (isNaN(date.getTime())) {
            console.error('Ngày không hợp lệ:', item.date);
            return null;
          }
          return {
            ...item,
            parsedDate: date,
            formattedDate: format(date, 'dd/MM/yyyy')
          };
        } catch (err) {
          console.error('Lỗi khi xử lý ngày:', item.date, err);
          return null;
        }
      }).filter(item => item !== null);

      // Sắp xếp dữ liệu theo thứ tự thời gian
      const sortedData = processedData.sort((a, b) => a.parsedDate - b.parsedDate);
      setChartData(sortedData);
      setError(null);
    } catch (err) {
      console.error('Lỗi khi xử lý dữ liệu:', err);
      setError('Có lỗi khi xử lý dữ liệu');
      setChartData([]);
    }
  }, [healthMetricsHistory]);

  // Lọc dữ liệu theo khoảng thời gian
  const filteredData = (() => {
    if (timeRange === 'all' || !chartData || chartData.length === 0) {
      return chartData;
    }

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
      default:
        return chartData;
    }
    
    return chartData.filter(item => item.parsedDate >= startDate);
  })();

  // Kiểm tra lỗi
  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
        <h3 className="text-lg font-semibold dark:text-white">Tiến Trình Cân Nặng</h3>
        <div className="h-80 flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  // Kiểm tra không có dữ liệu
  if (!healthMetricsHistory || healthMetricsHistory.length === 0 || chartData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
        <h3 className="text-lg font-semibold dark:text-white">Tiến Trình Cân Nặng</h3>
        <div className="h-80 flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">Không có dữ liệu cân nặng</p>
        </div>
      </div>
    );
  }

  // Kiểm tra dữ liệu lọc
  if (!filteredData || filteredData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold dark:text-white">Tiến Trình Cân Nặng</h3>
          <RenderTimeRangeButtons timeRange={timeRange} setTimeRange={setTimeRange} />
        </div>
        <div className="h-80 flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">Không có dữ liệu trong khoảng thời gian đã chọn</p>
        </div>
      </div>
    );
  }

  // Tìm min và max để hiển thị trên bảng
  const minWeight = Math.min(...filteredData.map(item => item.weightKg));
  const maxWeight = Math.max(...filteredData.map(item => item.weightKg));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold dark:text-white">Tiến Trình Cân Nặng</h3>
        <RenderTimeRangeButtons timeRange={timeRange} setTimeRange={setTimeRange} />
      </div>
      
      <div className="h-80 overflow-auto">
        <SimpleWeightChart 
          data={filteredData} 
          targetWeight={targetWeight}
          minWeight={minWeight}
          maxWeight={maxWeight}
        />
      </div>
    </div>
  );
};

// Component nút chọn khoảng thời gian
const RenderTimeRangeButtons = ({ timeRange, setTimeRange }) => (
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

// Component bảng dữ liệu đơn giản thay thế biểu đồ
const SimpleWeightChart = ({ data, targetWeight, minWeight, maxWeight }) => {
  if (!data || data.length === 0) return <p>Không có dữ liệu</p>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Ngày
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Cân nặng (kg)
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Tình trạng
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {data.map((item, index) => (
            <tr key={index} className={index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700' : ''}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {item.formattedDate}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">
                {item.weightKg}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {targetWeight && (
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    item.weightKg > targetWeight 
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                      : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  }`}>
                    {item.weightKg > targetWeight 
                      ? `${(item.weightKg - targetWeight).toFixed(1)}kg trên mục tiêu` 
                      : item.weightKg < targetWeight 
                        ? `${(targetWeight - item.weightKg).toFixed(1)}kg dưới mục tiêu`
                        : 'Đạt mục tiêu'}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Hiển thị tóm tắt */}
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tóm tắt:</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 p-3 rounded-md shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400">Cân nặng thấp nhất</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{minWeight} kg</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded-md shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400">Cân nặng cao nhất</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{maxWeight} kg</p>
          </div>
          {targetWeight && (
            <div className="bg-white dark:bg-gray-800 p-3 rounded-md shadow-sm">
              <p className="text-xs text-gray-500 dark:text-gray-400">Mục tiêu</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{targetWeight} kg</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeightChart; 