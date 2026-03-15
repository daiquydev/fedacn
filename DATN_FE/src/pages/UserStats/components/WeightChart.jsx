import React, { useState, useEffect } from 'react';
import { format, subDays, subMonths, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

const TIME_RANGES = [
  { key: '7d', label: '7 ngày' },
  { key: '14d', label: '14 ngày' },
  { key: '30d', label: '30 ngày' },
  { key: '1m', label: '1 tháng' },
  { key: '3m', label: '3 tháng' },
  { key: '6m', label: '6 tháng' },
  { key: 'all', label: 'Tất cả' },
];

const WeightChart = ({ healthMetricsHistory, targetWeight }) => {
  const [timeRange, setTimeRange] = useState('30d');
  const [chartData, setChartData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!healthMetricsHistory || healthMetricsHistory.length === 0) {
      setChartData([]);
      return;
    }

    try {
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

      const sortedData = processedData.sort((a, b) => a.parsedDate - b.parsedDate);
      setChartData(sortedData);
      setError(null);
    } catch (err) {
      console.error('Lỗi khi xử lý dữ liệu:', err);
      setError('Có lỗi khi xử lý dữ liệu');
      setChartData([]);
    }
  }, [healthMetricsHistory]);

  // Filter data by time range
  const filteredData = (() => {
    if (timeRange === 'all' || !chartData || chartData.length === 0) {
      return chartData;
    }

    const now = new Date();
    let startDate;
    
    switch (timeRange) {
      case '7d':
        startDate = subDays(now, 7);
        break;
      case '14d':
        startDate = subDays(now, 14);
        break;
      case '30d':
        startDate = subDays(now, 30);
        break;
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

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
        <h3 className="text-lg font-semibold dark:text-white">Tiến Trình Cân Nặng</h3>
        <div className="h-40 flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!healthMetricsHistory || healthMetricsHistory.length === 0 || chartData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
        <h3 className="text-lg font-semibold dark:text-white">Tiến Trình Cân Nặng</h3>
        <div className="h-40 flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">Không có dữ liệu cân nặng</p>
        </div>
      </div>
    );
  }

  if (!filteredData || filteredData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <h3 className="text-lg font-semibold dark:text-white">Tiến Trình Cân Nặng</h3>
          <RenderTimeRangeButtons timeRange={timeRange} setTimeRange={setTimeRange} />
        </div>
        <div className="h-40 flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">Không có dữ liệu trong khoảng thời gian đã chọn</p>
        </div>
      </div>
    );
  }

  const minWeight = Math.min(...filteredData.map(item => item.weightKg));
  const maxWeight = Math.max(...filteredData.map(item => item.weightKg));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <h3 className="text-lg font-semibold dark:text-white">Tiến Trình Cân Nặng</h3>
        <RenderTimeRangeButtons timeRange={timeRange} setTimeRange={setTimeRange} />
      </div>
      
      <div className="overflow-auto" style={{ maxHeight: '400px' }}>
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

// Time range selector with horizontal scroll on mobile
const RenderTimeRangeButtons = ({ timeRange, setTimeRange }) => (
  <div className="flex gap-1.5 overflow-x-auto scrollbar-thin pb-1 flex-shrink-0">
    {TIME_RANGES.map(({ key, label }) => (
      <button
        key={key}
        onClick={() => setTimeRange(key)}
        className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap transition-colors ${
          timeRange === key 
            ? 'bg-green-500 text-white shadow-sm' 
            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
        }`}
      >
        {label}
      </button>
    ))}
  </div>
);

// Simple table-based weight display
const SimpleWeightChart = ({ data, targetWeight, minWeight, maxWeight }) => {
  if (!data || data.length === 0) return <p>Không có dữ liệu</p>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
          <tr>
            <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Ngày
            </th>
            <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Cân nặng (kg)
            </th>
            <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Tình trạng
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {data.map((item, index) => (
            <tr key={index} className={index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700/50' : ''}>
              <td className="px-4 py-2.5 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {item.formattedDate}
              </td>
              <td className="px-4 py-2.5 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">
                {item.weightKg}
              </td>
              <td className="px-4 py-2.5 whitespace-nowrap">
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
      
      {/* Summary */}
      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tóm tắt:</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-white dark:bg-gray-800 p-2.5 rounded-md shadow-sm">
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Cân nặng thấp nhất</p>
            <p className="text-base font-bold text-gray-900 dark:text-white">{minWeight} kg</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-2.5 rounded-md shadow-sm">
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Cân nặng cao nhất</p>
            <p className="text-base font-bold text-gray-900 dark:text-white">{maxWeight} kg</p>
          </div>
          {targetWeight && (
            <div className="bg-white dark:bg-gray-800 p-2.5 rounded-md shadow-sm">
              <p className="text-[10px] text-gray-500 dark:text-gray-400">Mục tiêu</p>
              <p className="text-base font-bold text-gray-900 dark:text-white">{targetWeight} kg</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeightChart; 