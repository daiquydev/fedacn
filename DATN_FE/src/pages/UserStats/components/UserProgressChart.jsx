import React, { useState, useEffect, useRef } from 'react';
import { format, parseISO, subMonths, startOfMonth, endOfMonth, isAfter, isBefore, isWithinInterval } from 'date-fns';
import { vi } from 'date-fns/locale';
import { 
  FaChartLine, 
  FaChartBar, 
  FaChartPie, 
  FaWeight, 
  FaRunning, 
  FaCalendarAlt, 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaInfoCircle,
  FaTable,
  FaEye,
  FaEyeSlash,
  FaArrowRight,
  FaArrowDown,
  FaArrowUp,
  FaMinus
} from 'react-icons/fa';

// Định nghĩa các biến màu sắc cho chủ đề nhất quán
const CHART_COLORS = {
  primary: '#10b981', // Xanh lá
  secondary: '#3b82f6', // Xanh dương
  accent: '#f59e0b', // Cam
  danger: '#ef4444', // Đỏ
  warning: '#f59e0b', // Vàng
  success: '#10b981', // Xanh lá
  info: '#3b82f6', // Xanh dương
  neutral: '#6b7280', // Xám
  background: {
    light: '#ffffff',
    dark: '#1f2937'
  },
  text: {
    light: '#1f2937',
    dark: '#f3f4f6'
  },
  gridLines: {
    light: '#e5e7eb',
    dark: '#374151'
  }
};

// Hàm tạo animation
const createKeyframes = (name, frames) => {
  // Kiểm tra xem keyframes đã tồn tại chưa
  if (!document.querySelector(`style[data-keyframes="${name}"]`)) {
    const style = document.createElement('style');
    style.setAttribute('data-keyframes', name);
    style.textContent = `@keyframes ${name} { ${frames} }`;
    document.head.appendChild(style);
  }
};

const UserProgressChart = ({ healthMetricsHistory = [], activityHistory = [], userProfile }) => {
  const [timeRange, setTimeRange] = useState('3m'); // Mặc định hiển thị 3 tháng
  const [progressData, setProgressData] = useState([]);
  const [trendResult, setTrendResult] = useState({
    weightTrend: 'stable',
    activityTrend: 'stable',
    onTrack: true,
    evaluation: 'normal'
  });
  const [showDetailTable, setShowDetailTable] = useState(false);
  const [customDateRange, setCustomDateRange] = useState({
    startDate: format(subMonths(new Date(), 3), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });
  const [activeChart, setActiveChart] = useState('line'); // 'line', 'column', 'pie'
  
  // Định nghĩa các animation cho component
  useEffect(() => {
    // Tạo các keyframes animation cho toàn bộ ứng dụng
    createKeyframes('pulseScale', '0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); }');
    createKeyframes('fadeIn', '0% { opacity: 0; } 100% { opacity: 1; }');
    createKeyframes('slideUp', '0% { transform: translateY(20px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; }');
    createKeyframes('slideRight', '0% { transform: translateX(-20px); opacity: 0; } 100% { transform: translateX(0); opacity: 1; }');
    createKeyframes('strokeAnimation', '0% { stroke-dashoffset: 1000; } 100% { stroke-dashoffset: 0; }');
    createKeyframes('grow', '0% { height: 0; } 100% { height: 100%; }');
  }, []);

  // Xử lý thay đổi khoảng thời gian tùy chỉnh
  const handleDateRangeChange = (event, type) => {
    setCustomDateRange(prev => ({
      ...prev,
      [type]: event.target.value
    }));
    
    // Khi thay đổi date range, tự động chuyển sang chế độ tùy chỉnh
    setTimeRange('custom');
  };

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
      let endDate = now;
      
      if (timeRange === 'custom') {
        startDate = parseISO(customDateRange.startDate);
        endDate = parseISO(customDateRange.endDate);
      } else {
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
      }

      // Lọc dữ liệu theo khoảng thời gian đã chọn
      const filteredHealthData = processedHealthData.filter(item => 
        isWithinInterval(item.date, { start: startDate, end: endDate })
      );
      
      const filteredActivityData = processedActivityData.filter(item => 
        isWithinInterval(item.date, { start: startDate, end: endDate })
      );

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
  }, [timeRange, customDateRange, healthMetricsHistory, activityHistory]);

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

  // Lấy icon xu hướng
  const getWeightTrendIcon = () => {
    const { weightTrend } = trendResult;
    const goalType = userProfile?.goal?.type || 'unknown';
    
    if (weightTrend === 'decreasing') {
      return goalType === 'weight-loss' 
        ? <FaArrowDown className="text-green-500" /> 
        : goalType === 'weight-gain'
          ? <FaArrowDown className="text-red-500" />
          : <FaArrowDown className="text-blue-500" />;
    } else if (weightTrend === 'increasing') {
      return goalType === 'weight-gain' 
        ? <FaArrowUp className="text-green-500" /> 
        : goalType === 'weight-loss'
          ? <FaArrowUp className="text-red-500" />
          : <FaArrowUp className="text-blue-500" />;
    } else {
      return goalType === 'maintain' 
        ? <FaMinus className="text-green-500" />
        : <FaMinus className="text-blue-500" />;
    }
  };
  
  const getActivityTrendIcon = () => {
    const { activityTrend } = trendResult;
    
    switch (activityTrend) {
      case 'improving':
        return <FaArrowUp className="text-green-500" />;
      case 'declining':
        return <FaArrowDown className="text-red-500" />;
      case 'stable':
        return <FaMinus className="text-blue-500" />;
      default:
        return <FaInfoCircle className="text-gray-500" />;
    }
  };
  
  const getEvaluationIcon = () => {
    const { evaluation } = trendResult;
    
    switch (evaluation) {
      case 'excellent':
        return <FaCheckCircle className="text-green-500" />;
      case 'good':
        return <FaCheckCircle className="text-blue-500" />;
      case 'normal':
        return <FaInfoCircle className="text-gray-500" />;
      case 'concern':
        return <FaExclamationTriangle className="text-red-500" />;
      default:
        return <FaInfoCircle className="text-gray-500" />;
    }
  };

  // Component biểu đồ đường sử dụng SVG
  const SimpleLineChart = ({ data }) => {
    if (!data || data.length < 2) return <p className="text-center text-gray-500">Không đủ dữ liệu để hiển thị biểu đồ</p>;
    
    const padding = { top: 20, right: 20, bottom: 30, left: 40 };
    const chartWidth = 800;
    const chartHeight = 300;
    const innerWidth = chartWidth - padding.left - padding.right;
    const innerHeight = chartHeight - padding.top - padding.bottom;
    
    // Lọc dữ liệu có cân nặng
    const weightData = data.filter(d => d.weightKg !== null && d.weightKg !== undefined);
    
    // Tính toán giá trị min và max
    const minWeight = Math.min(...weightData.map(d => d.weightKg));
    const maxWeight = Math.max(...weightData.map(d => d.weightKg));
    const targetWeight = userProfile?.goal?.targetWeightKg;
    
    // Thêm một khoảng đệm để biểu đồ không bị sát biên
    const yMin = Math.max(0, minWeight - 2); 
    const yMax = maxWeight + 2;
    
    // Vẽ các điểm dữ liệu
    const points = weightData.map((d, i) => {
      const x = (i / (weightData.length - 1)) * innerWidth + padding.left;
      // Đảo ngược trục y
      const y = innerHeight - (((d.weightKg - yMin) / (yMax - yMin)) * innerHeight) + padding.top;
      return { x, y, data: d };
    });
    
    // Tạo đường nối giữa các điểm
    const linePath = points.map((point, i) => 
      i === 0 ? `M ${point.x},${point.y}` : `L ${point.x},${point.y}`
    ).join(' ');
    
    // Tính toán vị trí cho đường mục tiêu (nếu có)
    const targetY = targetWeight
      ? innerHeight - (((targetWeight - yMin) / (yMax - yMin)) * innerHeight) + padding.top
      : null;
    
    // Tính tỷ lệ hoàn thành hoạt động
    const activityCompletionData = data.map(d => ({
      date: d.date,
      formattedDate: d.formattedDate,
      completionRate: d.activitiesCount ? (d.completedActivities / d.activitiesCount) : 0
    }));
    
    // Vẽ điểm biểu diễn tỷ lệ hoàn thành
    const activityPoints = activityCompletionData.map((d, i) => {
      const x = (i / (activityCompletionData.length - 1)) * innerWidth + padding.left;
      // Đảo ngược trục y và biến đổi tỷ lệ 0-1 thành vị trí trên biểu đồ
      const y = innerHeight - (d.completionRate * innerHeight * 0.7) + padding.top; // 0.7 để không bị chồng lên với đường cân nặng
      return { x, y, data: d };
    });
    
    // Tạo đường nối cho hoạt động
    const activityLinePath = activityPoints.map((point, i) => 
      i === 0 ? `M ${point.x},${point.y}` : `L ${point.x},${point.y}`
    ).join(' ');

    return (
      <div className="overflow-x-auto">
        <svg width={chartWidth} height={chartHeight} className="mx-auto">
          {/* Trục y */}
          <line 
            x1={padding.left} 
            y1={padding.top} 
            x2={padding.left} 
            y2={chartHeight - padding.bottom} 
            stroke="#cbd5e0" 
            strokeWidth="1" 
          />
          
          {/* Trục x */}
          <line 
            x1={padding.left} 
            y1={chartHeight - padding.bottom} 
            x2={chartWidth - padding.right} 
            y2={chartHeight - padding.bottom} 
            stroke="#cbd5e0" 
            strokeWidth="1" 
          />
          
          {/* Đường kẻ ngang */}
          {[0, 0.25, 0.5, 0.75, 1].map((tick, i) => {
            const y = innerHeight - (tick * innerHeight) + padding.top;
            return (
              <g key={i}>
                <line 
                  x1={padding.left} 
                  y1={y} 
                  x2={chartWidth - padding.right} 
                  y2={y} 
                  stroke="#e2e8f0" 
                  strokeWidth="1" 
                  strokeDasharray="5,5" 
                />
                <text 
                  x={padding.left - 5} 
                  y={y + 5} 
                  textAnchor="end" 
                  fontSize="12" 
                  fill="#718096"
                >
                  {Math.round(yMin + tick * (yMax - yMin))}
                </text>
              </g>
            );
          })}
          
          {/* Nhãn x */}
          {points.filter((_, i) => i % Math.max(1, Math.floor(points.length / 7)) === 0).map((point, i) => (
            <g key={i}>
              <line 
                x1={point.x} 
                y1={chartHeight - padding.bottom} 
                x2={point.x} 
                y2={chartHeight - padding.bottom + 5} 
                stroke="#cbd5e0" 
                strokeWidth="1" 
              />
              <text 
                x={point.x} 
                y={chartHeight - padding.bottom + 20} 
                textAnchor="middle" 
                fontSize="12" 
                fill="#718096"
              >
                {format(point.data.date, 'dd/MM')}
              </text>
            </g>
          ))}
          
          {/* Đường mục tiêu */}
          {targetY && (
            <>
              <line
                x1={padding.left}
                y1={targetY}
                x2={chartWidth - padding.right- 80}
                y2={targetY}
                stroke="#f56565"
                strokeWidth="1"
                strokeDasharray="5,5"
              />
              <text
                x={chartWidth - padding.right - 80}
                y={targetY + 5}
                textAnchor="start"
                fontSize="12"
                fill="#f56565"
              >
                Mục tiêu: {targetWeight} kg
              </text>
            </>
          )}
          
          {/* Đường cân nặng */}
          <path 
            d={linePath} 
            fill="none" 
            stroke="#10b981" 
            strokeWidth="2" 
          />
          
          {/* Các điểm dữ liệu cân nặng */}
          {points.map((point, i) => (
            <g key={i}>
              <circle 
                cx={point.x} 
                cy={point.y} 
                r="4" 
                fill="#10b981" 
                stroke="white" 
                strokeWidth="2" 
              />
              <title>{`${point.data.formattedDate}: ${point.data.weightKg} kg`}</title>
            </g>
          ))}
          
          {/* Đường tỷ lệ hoàn thành hoạt động */}
          <path 
            d={activityLinePath} 
            fill="none" 
            stroke="#3182ce" 
            strokeWidth="2" 
            strokeDasharray="5,5" 
          />
          
          {/* Các điểm dữ liệu hoạt động */}
          {activityPoints.map((point, i) => (
            <g key={i}>
              <circle 
                cx={point.x} 
                cy={point.y} 
                r="3" 
                fill="#3182ce" 
                stroke="white" 
                strokeWidth="2" 
              />
              <title>{`${point.data.formattedDate}: Hoàn thành ${Math.round(point.data.completionRate * 100)}%`}</title>
            </g>
          ))}
          
          {/* Chú thích */}
          <g transform={`translate(${padding.left + 20}, ${padding.top + 20})`}>
            <circle cx="0" cy="0" r="4" fill="#10b981" />
            <text x="10" y="5" fontSize="12" fill="#718096">Cân nặng (kg)</text>
            
            <circle cx="0" cy="20" r="4" fill="#3182ce" />
            <text x="10" y="25" fontSize="12" fill="#718096">Tỷ lệ hoàn thành hoạt động</text>
          </g>
        </svg>
      </div>
    );
  };

  // Biểu đồ cột hiển thị calories đã đốt
  const CaloriesColumnChart = ({ data }) => {
    if (!data || data.length === 0) return <p className="text-center text-gray-500">Không có dữ liệu calories</p>;
    
    // Lọc dữ liệu có calories
    const caloriesData = data.filter(d => d.caloriesBurned > 0);
    
    if (caloriesData.length === 0) return <p className="text-center text-gray-500">Không có dữ liệu calories</p>;
    
    const padding = { top: 20, right: 20, bottom: 50, left: 40 };
    const chartWidth = 800;
    const chartHeight = 300;
    const innerWidth = chartWidth - padding.left - padding.right;
    const innerHeight = chartHeight - padding.top - padding.bottom;
    
    // Tính toán giá trị max để thiết lập thang đo
    const maxCalories = Math.max(...caloriesData.map(d => d.caloriesBurned));
    
    // Chiều rộng của mỗi cột
    const barWidth = Math.max(10, Math.min(30, innerWidth / caloriesData.length - 5));
    
    // Khoảng cách giữa các cột
    const barSpacing = innerWidth / caloriesData.length;
    
    return (
      <div className="overflow-x-auto">
        <svg width={chartWidth} height={chartHeight} className="mx-auto">
          {/* Trục y */}
          <line 
            x1={padding.left} 
            y1={padding.top} 
            x2={padding.left} 
            y2={chartHeight - padding.bottom} 
            stroke="#cbd5e0" 
            strokeWidth="1" 
          />
          
          {/* Trục x */}
          <line 
            x1={padding.left} 
            y1={chartHeight - padding.bottom} 
            x2={chartWidth - padding.right} 
            y2={chartHeight - padding.bottom} 
            stroke="#cbd5e0" 
            strokeWidth="1" 
          />
          
          {/* Đường kẻ ngang */}
          {[0, 0.25, 0.5, 0.75, 1].map((tick, i) => {
            const y = innerHeight - (tick * innerHeight) + padding.top;
            return (
              <g key={i}>
                <line 
                  x1={padding.left} 
                  y1={y} 
                  x2={chartWidth - padding.right} 
                  y2={y} 
                  stroke="#e2e8f0" 
                  strokeWidth="1" 
                  strokeDasharray="5,5" 
                />
                <text 
                  x={padding.left - 5} 
                  y={y + 5} 
                  textAnchor="end" 
                  fontSize="12" 
                  fill="#718096"
                >
                  {Math.round(tick * maxCalories)}
                </text>
              </g>
            );
          })}
          
          {/* Các cột dữ liệu */}
          {caloriesData.map((d, i) => {
            const x = i * barSpacing + padding.left;
            const barHeight = (d.caloriesBurned / maxCalories) * innerHeight;
            const y = innerHeight - barHeight + padding.top;
            
            return (
              <g key={i}>
                <rect 
                  x={x - barWidth/2} 
                  y={y} 
                  width={barWidth} 
                  height={barHeight} 
                  fill="#ed8936" 
                  opacity="0.8" 
                  rx="2"
                >
                  <title>{`${d.formattedDate}: ${d.caloriesBurned} kcal`}</title>
                </rect>
                
                {/* Hiển thị giá trị trên cột */}
                {d.caloriesBurned > maxCalories * 0.1 && (
                  <text 
                    x={x} 
                    y={y - 5} 
                    textAnchor="middle" 
                    fontSize="10" 
                    fill="#718096"
                  >
                    {d.caloriesBurned}
                  </text>
                )}
                
                {/* Nhãn trục x */}
                {i % Math.max(1, Math.floor(caloriesData.length / 10)) === 0 && (
                  <text 
                    x={x} 
                    y={chartHeight - padding.bottom + 20} 
                    textAnchor="middle" 
                    fontSize="10" 
                    fill="#718096"
                    transform={`rotate(45, ${x}, ${chartHeight - padding.bottom + 20})`}
                  >
                    {format(d.date, 'dd/MM')}
                  </text>
                )}
              </g>
            );
          })}
          
          {/* Tiêu đề trục */}
          <text 
            x={chartWidth / 2} 
            y={chartHeight - 5} 
            textAnchor="middle" 
            fontSize="12" 
            fill="#718096"
          >
            Ngày
          </text>
          
          <text 
            x={-chartHeight/2} 
            y={15} 
            textAnchor="middle" 
            fontSize="12"
            fill="#718096"
            transform="rotate(-90)"
          >
            Calories (kcal)
          </text>
        </svg>
      </div>
    );
  };

  // Biểu đồ tròn hiển thị tỷ lệ hoàn thành mục tiêu
  const ProgressCircleChart = ({ data, userProfile }) => {
    if (!data || data.length === 0 || !userProfile?.goal) {
      return <p className="text-center text-gray-500">Không có dữ liệu mục tiêu</p>;
    }
    
    const chartWidth = 300;
    const chartHeight = 300;
    const centerX = chartWidth / 2;
    const centerY = chartHeight / 2;
    const radius = Math.min(centerX, centerY) - 40;
    
    // Tính toán phần trăm tiến độ
    let progressPercent = 0;
    let statusText = "";
    const targetWeight = userProfile.goal.targetWeightKg;
    const currentWeight = data[data.length - 1]?.weightKg;
    const startWeight = userProfile.startingWeightKg || data[0]?.weightKg;
    
    if (targetWeight && currentWeight && startWeight) {
      if (userProfile.goal.type === 'weight-loss') {
        // Mục tiêu giảm cân
        const totalToLose = startWeight - targetWeight;
        const lost = startWeight - currentWeight;
        progressPercent = totalToLose <= 0 ? 0 : Math.min(100, Math.max(0, (lost / totalToLose) * 100));
        statusText = `Đã giảm ${lost.toFixed(1)}kg / Mục tiêu ${totalToLose.toFixed(1)}kg`;
      } else if (userProfile.goal.type === 'weight-gain') {
        // Mục tiêu tăng cân
        const totalToGain = targetWeight - startWeight;
        const gained = currentWeight - startWeight;
        progressPercent = totalToGain <= 0 ? 0 : Math.min(100, Math.max(0, (gained / totalToGain) * 100));
        statusText = `Đã tăng ${gained.toFixed(1)}kg / Mục tiêu ${totalToGain.toFixed(1)}kg`;
      } else {
        // Mục tiêu duy trì
        const deviation = Math.abs(currentWeight - targetWeight);
        // Cho phép sai số 2% 
        const allowedDeviation = targetWeight * 0.02;
        progressPercent = deviation <= allowedDeviation ? 100 : Math.max(0, 100 - (deviation / targetWeight) * 100);
        statusText = `Duy trì ở ${currentWeight.toFixed(1)}kg / Mục tiêu ${targetWeight.toFixed(1)}kg`;
      }
    }
    
    // Tính toán các thông số của đường tròn
    const circumference = 2 * Math.PI * radius;
    const progressOffset = circumference - (progressPercent / 100) * circumference;
    const startAngle = -90; // Bắt đầu từ đỉnh đường tròn
    
    // Màu sắc dựa trên tiến độ
    let progressColor = "#10b981"; // Mặc định xanh lá
    if (progressPercent < 30) {
      progressColor = "#ef4444"; // Đỏ khi tiến độ thấp
    } else if (progressPercent < 70) {
      progressColor = "#f59e0b"; // Vàng khi tiến độ trung bình
    }
    
    return (
      <div className="flex flex-col items-center justify-center">
        <svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
          {/* Vòng tròn nền */}
          <circle 
            cx={centerX} 
            cy={centerY} 
            r={radius} 
            fill="none" 
            stroke="#e2e8f0" 
            strokeWidth="15" 
          />
          
          {/* Vòng tròn tiến độ */}
          <circle
            cx={centerX}
            cy={centerY}
            r={radius}
            fill="none"
            stroke={progressColor}
            strokeWidth="15"
            strokeDasharray={circumference}
            strokeDashoffset={progressOffset}
            strokeLinecap="round"
            transform={`rotate(${startAngle} ${centerX} ${centerY})`}
          />
          
          {/* Phần trăm ở giữa */}
          <text
            x={centerX}
            y={centerY}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="36"
            fontWeight="bold"
            fill="#4a5568"
          >
            {Math.round(progressPercent)}%
          </text>
          
          {/* Mô tả mục tiêu */}
          <text
            x={centerX}
            y={centerY + 30}
            textAnchor="middle"
            fontSize="14"
            fill="#718096"
          >
            {statusText}
          </text>
        </svg>
        
        <div className="text-center mt-4">
          <h4 className="text-lg font-medium text-gray-800 dark:text-white">Tiến độ mục tiêu</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {userProfile.goal.type === 'weight-loss' 
              ? 'Mục tiêu giảm cân' 
              : userProfile.goal.type === 'weight-gain'
                ? 'Mục tiêu tăng cân'
                : 'Mục tiêu duy trì cân nặng'
            }
          </p>
        </div>
      </div>
    );
  };

  // Hiển thị khi không có dữ liệu
  if (!progressData || progressData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 animate-[fadeIn_0.5s_ease-in-out]">
        <div className="flex items-center mb-4">
          <FaChartLine className="text-blue-500 mr-3 text-xl" />
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Phân Tích Tiến Trình</h3>
        </div>
        
        <div className="mb-4">
          <DateRangeSelector 
            timeRange={timeRange}
            setTimeRange={setTimeRange}
            customDateRange={customDateRange}
            handleDateRangeChange={handleDateRangeChange}
          />
        </div>
        
        <div className="h-64 flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-700 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
          <FaInfoCircle className="text-blue-500 text-4xl mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">Không có đủ dữ liệu để phân tích</p>
          <p className="text-center text-gray-500 dark:text-gray-400 max-w-md">
            Hãy thử chọn một khoảng thời gian khác hoặc thêm thông tin cân nặng và hoạt động để xem phân tích chi tiết.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 animate-[fadeIn_0.5s_ease-in-out]">
      <div className="flex items-center mb-5">
        <FaChartLine className="text-blue-500 mr-3 text-2xl" />
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Phân Tích Tiến Trình</h3>
      </div>
      
      {/* Date Selector */}
      <DateRangeSelector 
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        customDateRange={customDateRange}
        handleDateRangeChange={handleDateRangeChange}
      />
      
      {/* Thông tin tổng hợp */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 mb-5 animate-[slideUp_0.5s_ease-in-out]">
        <div className="flex items-center mb-4">
          <FaInfoCircle className="text-blue-500 mr-2 text-xl" />
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white">Xu hướng tổng thể</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 p-4 rounded-lg shadow-sm">
            <div className="flex items-center mb-2">
              <FaWeight className="text-blue-500 mr-2" />
              <h5 className="text-md font-medium text-gray-800 dark:text-white">Cân nặng</h5>
            </div>
            <div className="flex items-center">
              {getWeightTrendIcon()}
              <p className="ml-2 text-sm text-gray-700 dark:text-gray-300">{getWeightTrendDescription()}</p>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 p-4 rounded-lg shadow-sm">
            <div className="flex items-center mb-2">
              <FaRunning className="text-green-500 mr-2" />
              <h5 className="text-md font-medium text-gray-800 dark:text-white">Hoạt động</h5>
            </div>
            <div className="flex items-center">
              {getActivityTrendIcon()}
              <p className="ml-2 text-sm text-gray-700 dark:text-gray-300">{getActivityTrendDescription()}</p>
            </div>
          </div>
        </div>
        
        <div className="mt-4 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {getEvaluationIcon()}
              <h5 className="ml-2 text-md font-medium text-gray-800 dark:text-white">Đánh giá tổng thể</h5>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getEvaluationColor()}`}>
              {trendResult.onTrack ? 'Đúng hướng' : 'Cần điều chỉnh'}
            </div>
          </div>
          <p className={`mt-2 text-sm font-medium ${getEvaluationColor()}`}>
            {getOverallEvaluation()}
          </p>
        </div>
      </div>
      
      {/* Chọn kiểu biểu đồ */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-5">
        <div className="flex items-center mb-3">
          <FaChartLine className="text-blue-500 mr-2" />
          <h4 className="text-md font-medium text-gray-800 dark:text-white">Chọn loại biểu đồ</h4>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setActiveChart('line')}
            className={`flex-1 min-w-[120px] px-4 py-3 text-sm rounded-md flex items-center justify-center transition-all duration-300 ${
              activeChart === 'line' 
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md transform scale-105' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <FaChartLine className={`mr-2 ${activeChart === 'line' ? 'text-white' : 'text-blue-500'}`} />
            <span>Tiến trình</span>
          </button>
          
          <button
            onClick={() => setActiveChart('column')}
            className={`flex-1 min-w-[120px] px-4 py-3 text-sm rounded-md flex items-center justify-center transition-all duration-300 ${
              activeChart === 'column' 
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md transform scale-105' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <FaChartBar className={`mr-2 ${activeChart === 'column' ? 'text-white' : 'text-orange-500'}`} />
            <span>Calories</span>
          </button>
          
          <button
            onClick={() => setActiveChart('pie')}
            className={`flex-1 min-w-[120px] px-4 py-3 text-sm rounded-md flex items-center justify-center transition-all duration-300 ${
              activeChart === 'pie' 
                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md transform scale-105' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <FaChartPie className={`mr-2 ${activeChart === 'pie' ? 'text-white' : 'text-green-500'}`} />
            <span>Mục tiêu</span>
          </button>
        </div>
      </div>
      
      {/* Hiển thị biểu đồ dựa vào lựa chọn */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6 overflow-x-auto animate-[fadeIn_0.5s_ease-in-out]">
        <h4 className="text-md font-medium text-gray-800 dark:text-white mb-4 flex items-center">
          {activeChart === 'line' && <FaChartLine className="text-blue-500 mr-2" />}
          {activeChart === 'column' && <FaChartBar className="text-orange-500 mr-2" />}
          {activeChart === 'pie' && <FaChartPie className="text-green-500 mr-2" />}
          {activeChart === 'line' 
            ? 'Biểu đồ tiến trình cân nặng và hoạt động' 
            : activeChart === 'column'
              ? 'Biểu đồ calories đã đốt'
              : 'Tiến độ mục tiêu cân nặng'
          }
        </h4>
        
        <div className={`transition-all duration-500 ${activeChart === 'line' ? 'opacity-100' : 'opacity-0 hidden'}`}>
          {activeChart === 'line' && <SimpleLineChart data={progressData} />}
        </div>
        
        <div className={`transition-all duration-500 ${activeChart === 'column' ? 'opacity-100' : 'opacity-0 hidden'}`}>
          {activeChart === 'column' && <CaloriesColumnChart data={progressData} />}
        </div>
        
        <div className={`transition-all duration-500 ${activeChart === 'pie' ? 'opacity-100' : 'opacity-0 hidden'}`}>
          {activeChart === 'pie' && <ProgressCircleChart data={progressData} userProfile={userProfile} />}
        </div>
      </div>
      
      {/* Nút hiển thị dữ liệu chi tiết */}
      <div className="mb-4">
        <button
          onClick={() => setShowDetailTable(!showDetailTable)}
          className={`w-full px-4 py-3 rounded-md transition-all duration-300 flex items-center justify-center ${
            showDetailTable 
              ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800' 
              : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800'
          }`}
        >
          {showDetailTable ? (
            <>
              <FaEyeSlash className="mr-2" />
              <span>Ẩn dữ liệu chi tiết</span>
            </>
          ) : (
            <>
              <FaEye className="mr-2" />
              <span>Xem dữ liệu chi tiết</span>
            </>
          )}
        </button>
      </div>
      
      {/* Bảng dữ liệu */}
      {showDetailTable && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 overflow-x-auto animate-[slideUp_0.3s_ease-in-out]">
          <div className="flex items-center mb-4">
            <FaTable className="text-blue-500 mr-2" />
            <h4 className="text-md font-medium text-gray-800 dark:text-white">Dữ liệu chi tiết</h4>
          </div>
          
          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Ngày
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Cân nặng
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Hoạt động
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Calories
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {progressData.map((item, index) => (
                  <tr 
                    key={index} 
                    className={`${index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700' : ''} hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-150`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {item.formattedDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.weightKg ? (
                        <div className="flex items-center">
                          <FaWeight className="text-blue-500 mr-2" size={14} />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {item.weightKg} kg
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">--</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.activitiesCount ? (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          item.completedActivities === item.activitiesCount 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : item.completedActivities > 0
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          <FaRunning className="mr-1" size={12} />
                          {item.completedActivities}/{item.activitiesCount}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">Không có</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.caloriesBurned ? (
                        <div className="flex items-center">
                          <div className="relative w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                              style={{ width: `${Math.min(100, item.caloriesBurned / 10)}%` }}
                            ></div>
                          </div>
                          <span className="ml-2 text-sm text-gray-900 dark:text-white">
                            {item.caloriesBurned} kcal
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">--</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// Component cho chọn thời gian
const DateRangeSelector = ({ timeRange, setTimeRange, customDateRange, handleDateRangeChange }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-4 transition-all duration-300 hover:shadow-md">
    <div className="flex items-center mb-3">
      <FaCalendarAlt className="text-blue-500 mr-2" />
      <h4 className="text-md font-medium text-gray-800 dark:text-white">Chọn khoảng thời gian</h4>
    </div>
    
    <div className="flex flex-wrap items-center gap-2 mb-3">
      <button 
        onClick={() => setTimeRange('1m')}
        className={`px-4 py-2 text-sm rounded-md transition-all duration-200 flex items-center ${timeRange === '1m' 
          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md transform scale-105' 
          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
      >
        <span className="mr-1">1 tháng</span>
      </button>
      <button 
        onClick={() => setTimeRange('3m')}
        className={`px-4 py-2 text-sm rounded-md transition-all duration-200 flex items-center ${timeRange === '3m' 
          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md transform scale-105' 
          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
      >
        <span className="mr-1">3 tháng</span>
      </button>
      <button 
        onClick={() => setTimeRange('6m')}
        className={`px-4 py-2 text-sm rounded-md transition-all duration-200 flex items-center ${timeRange === '6m' 
          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md transform scale-105' 
          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
      >
        <span className="mr-1">6 tháng</span>
      </button>
      <button 
        onClick={() => setTimeRange('all')}
        className={`px-4 py-2 text-sm rounded-md transition-all duration-200 flex items-center ${timeRange === 'all' 
          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md transform scale-105' 
          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
      >
        <span className="mr-1">Tất cả</span>
      </button>
      <button 
        onClick={() => setTimeRange('custom')}
        className={`px-4 py-2 text-sm rounded-md transition-all duration-200 flex items-center ${timeRange === 'custom' 
          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md transform scale-105' 
          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
      >
        <span className="mr-1">Tùy chỉnh</span>
      </button>
    </div>
    
    {timeRange === 'custom' && (
      <div className="flex flex-wrap gap-4 mb-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-md animate-[fadeIn_0.3s_ease-in-out]">
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="startDate" className="block text-sm text-gray-600 dark:text-gray-400 mb-1 flex items-center">
            <FaArrowRight className="text-green-500 mr-1" /> Từ ngày:
          </label>
          <input
            type="date"
            id="startDate"
            value={customDateRange.startDate}
            onChange={(e) => handleDateRangeChange(e, 'startDate')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100 dark:bg-gray-700 
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="endDate" className="block text-sm text-gray-600 dark:text-gray-400 mb-1 flex items-center">
            <FaArrowRight className="text-red-500 mr-1" /> Đến ngày:
          </label>
          <input
            type="date"
            id="endDate"
            value={customDateRange.endDate}
            onChange={(e) => handleDateRangeChange(e, 'endDate')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100 dark:bg-gray-700
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          />
        </div>
      </div>
    )}
  </div>
);

export default UserProgressChart; 