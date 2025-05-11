import React, { useState, useEffect } from 'react';
import { BsSmartwatch } from 'react-icons/bs';
import { FaSync, FaRunning, FaSwimmer, FaBiking, FaCheck, FaPause, FaPlay, FaStop, FaInfoCircle } from 'react-icons/fa';
import { MdDirectionsWalk, MdFitnessCenter, MdSportsGymnastics, MdMonitorHeart } from 'react-icons/md';
import { GiNightSleep } from 'react-icons/gi';
import moment from 'moment';
import { toast } from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

// Hàm xác định loại dữ liệu từ đồng hồ thông minh cần cho thử thách
const getSmartWatchDataType = (category) => {
  switch (category) {
    case 'running':
      return { 
        icon: <FaRunning className="mr-1" />, 
        text: 'Dữ liệu chạy bộ',
        metrics: ['Quãng đường', 'Nhịp tim', 'Calories'],
        unit: 'km'
      };
    case 'walking':
      return { 
        icon: <MdDirectionsWalk className="mr-1" />, 
        text: 'Dữ liệu đi bộ',
        metrics: ['Số bước chân', 'Quãng đường', 'Calories'],
        unit: 'bước'
      };
    case 'cycling':
      return { 
        icon: <FaBiking className="mr-1" />, 
        text: 'Dữ liệu đạp xe',
        metrics: ['Quãng đường', 'Tốc độ', 'Calories'],
        unit: 'km'
      };
    case 'swimming':
      return { 
        icon: <FaSwimmer className="mr-1" />, 
        text: 'Dữ liệu bơi lội',
        metrics: ['Vòng bơi', 'Quãng đường', 'Calories'],
        unit: 'm'
      };
    case 'gym':
      return { 
        icon: <MdFitnessCenter className="mr-1" />, 
        text: 'Dữ liệu tập gym',
        metrics: ['Thời gian tập', 'Nhịp tim', 'Calories'],
        unit: 'phút'
      };
    case 'hiit':
      return { 
        icon: <MdSportsGymnastics className="mr-1" />, 
        text: 'Dữ liệu HIIT',
        metrics: ['Thời gian tập', 'Nhịp tim', 'Calories'],
        unit: 'phút'
      };
    case 'sleep':
      return { 
        icon: <GiNightSleep className="mr-1" />, 
        text: 'Dữ liệu giấc ngủ',
        metrics: ['Thời gian ngủ', 'Chất lượng', 'Ngủ sâu'],
        unit: 'giờ'
      };
    default:
      return { 
        icon: <MdMonitorHeart className="mr-1" />, 
        text: 'Dữ liệu sức khỏe',
        metrics: ['Hoạt động', 'Calories', 'Nhịp tim'],
        unit: 'phút'
      };
  }
};

// Mock dữ liệu đồng hồ thông minh để giả lập
const mockSmartWatchData = (category, targetValue, startDate, endDate) => {
  const now = moment();
  const start = moment(startDate);
  const end = moment(endDate);
  const totalDays = end.diff(start, 'days');
  const daysPassed = Math.min(now.diff(start, 'days'), totalDays);
  
  if (daysPassed <= 0) return [];
  
  // Tạo dữ liệu giả lập cho các ngày đã qua
  const data = [];
  const dataType = getSmartWatchDataType(category);
  const dailyTarget = targetValue / totalDays;
  
  for (let i = 0; i < daysPassed; i++) {
    const date = moment(startDate).add(i, 'days');
    // Giả lập tiến độ thường tốt vào đầu, hơi chậm ở giữa và tăng tốc vào cuối
    let completionRate;
    if (i < daysPassed * 0.3) {
      // Tiến độ tốt đầu kỳ (80-100%)
      completionRate = 0.8 + Math.random() * 0.2;
    } else if (i < daysPassed * 0.7) {
      // Tiến độ chậm giữa kỳ (60-90%)
      completionRate = 0.6 + Math.random() * 0.3;
    } else {
      // Tiến độ tăng tốc cuối kỳ (70-110%)
      completionRate = 0.7 + Math.random() * 0.4;
    }
    
    const value = dailyTarget * completionRate;
    data.push({
      date: date.format('DD/MM/YYYY'),
      value: parseFloat(value.toFixed(1)),
      target: parseFloat(dailyTarget.toFixed(1)),
      completed: value >= dailyTarget
    });
  }
  
  return data;
};

// Tùy chỉnh tooltip cho biểu đồ
const CustomTooltip = ({ active, payload, label, unit }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <p className="font-medium text-gray-900 dark:text-gray-100">{label}</p>
        <p className="text-green-600 dark:text-green-400">
          <span className="font-medium">Đạt được:</span> {data.value} {unit}
        </p>
        <p className="text-blue-600 dark:text-blue-400">
          <span className="font-medium">Mục tiêu:</span> {data.target} {unit}
        </p>
        {data.completed ? (
          <div className="flex items-center text-green-600 dark:text-green-400 text-sm mt-1">
            <FaCheck className="mr-1" /> Đã đạt mục tiêu
          </div>
        ) : (
          <div className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Chưa đạt mục tiêu
          </div>
        )}
      </div>
    );
  }
  return null;
};

const SmartWatchSync = ({ challenge, onActivityComplete }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [lastSynced, setLastSynced] = useState('2 phút trước');
  const [activityStatus, setActivityStatus] = useState('idle'); // 'idle', 'active', 'paused'
  const [currentSession, setCurrentSession] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timer, setTimer] = useState(null);
  
  // Lấy dữ liệu từ đồng hồ (giả lập)
  const smartWatchData = mockSmartWatchData(
    challenge.category, 
    challenge.targetValue,
    challenge.startDate,
    challenge.endDate
  );
  
  // Tính tổng tiến độ
  const totalCompleted = smartWatchData.reduce((sum, day) => sum + day.value, 0);
  const progressPercentage = Math.min(Math.round((totalCompleted / challenge.targetValue) * 100), 100);
  
  // Tính số ngày hoàn thành mục tiêu
  const daysCompleted = smartWatchData.filter(day => day.completed).length;
  const streakDays = smartWatchData.reduce((streak, day, index) => {
    if (index === 0) return day.completed ? 1 : 0;
    if (!day.completed) return 0;
    return streak + 1;
  }, 0);
  
  // Hàm xử lý đồng bộ dữ liệu từ đồng hồ
  const handleSync = () => {
    setLastSynced('vừa xong');
  };
  
  // Hàm bắt đầu hoạt động mới
  const startActivity = () => {
    if (activityStatus === 'active') return;
    
    // Tạo phiên hoạt động mới
    const newSession = {
      id: Date.now(),
      startTime: new Date(),
      pausedTime: 0,
      category: challenge.category
    };
    
    setCurrentSession(newSession);
    setActivityStatus('active');
    setElapsedTime(0);
    
    // Bắt đầu đếm thời gian
    const intervalId = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    
    setTimer(intervalId);
    
    toast.success('Đã bắt đầu theo dõi hoạt động!');
  };
  
  // Hàm tạm dừng hoạt động
  const pauseActivity = () => {
    if (activityStatus !== 'active') return;
    
    clearInterval(timer);
    setActivityStatus('paused');
    
    // Cập nhật thời gian tạm dừng
    setCurrentSession(prev => ({
      ...prev,
      pausedTime: prev.pausedTime + Date.now() - new Date(prev.startTime).getTime()
    }));
    
    toast.success('Đã tạm dừng hoạt động!');
  };
  
  // Hàm tiếp tục hoạt động
  const resumeActivity = () => {
    if (activityStatus !== 'paused') return;
    
    setActivityStatus('active');
    
    // Cập nhật thời gian bắt đầu lại
    setCurrentSession(prev => ({
      ...prev,
      startTime: new Date()
    }));
    
    // Bắt đầu đếm thời gian lại
    const intervalId = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    
    setTimer(intervalId);
    
    toast.success('Đã tiếp tục hoạt động!');
  };
  
  // Hàm kết thúc hoạt động
  const endActivity = () => {
    if (activityStatus === 'idle') return;
    
    clearInterval(timer);
    
    // Tính toán kết quả hoạt động
    const duration = activityStatus === 'active' 
      ? Date.now() - new Date(currentSession.startTime).getTime() + currentSession.pausedTime
      : currentSession.pausedTime;
    
    // Giả lập tính toán kết quả dựa vào loại hoạt động và thời gian
    let activityValue;
    const durationInMinutes = duration / (1000 * 60);
    
    switch (challenge.category.toLowerCase()) {
      case 'running':
        // Giả sử tốc độ trung bình 8km/h = 133m/phút
        activityValue = parseFloat((durationInMinutes * 133 / 1000).toFixed(2));
        break;
      case 'cycling':
        // Giả sử tốc độ trung bình 15km/h = 250m/phút
        activityValue = parseFloat((durationInMinutes * 250 / 1000).toFixed(2));
        break;
      case 'swimming':
        // Giả sử tốc độ trung bình 2km/h = 33m/phút
        activityValue = parseFloat((durationInMinutes * 33 / 1000).toFixed(2));
        break;
      case 'walking':
        // Giả sử tốc độ trung bình 5km/h = 83m/phút
        activityValue = parseFloat((durationInMinutes * 83 / 1000).toFixed(2));
        break;
      default:
        // Mặc định tính theo số phút
        activityValue = parseFloat(durationInMinutes.toFixed(0));
    }
    
    // Tạo đối tượng dữ liệu hoạt động
    const activityData = {
      id: Date.now(),
      date: new Date().toISOString(),
      value: activityValue,
      unit: challenge.targetUnit,
      duration: formatElapsedTime(elapsedTime),
      durationSeconds: elapsedTime,
      category: challenge.category,
      source: 'smartwatch',
      deviceName: 'Mi Band 7',
      calculatedFrom: {
        startTime: currentSession.startTime,
        endTime: new Date().toISOString(),
        pausedTimeMs: currentSession.pausedTime
      }
    };
    
    // Hiển thị kết quả
    toast.success(`Hoạt động hoàn thành! Bạn đã đạt được ${activityValue} ${challenge.targetUnit}`);
    
    // Reset trạng thái
    setActivityStatus('idle');
    setCurrentSession(null);
    setElapsedTime(0);
    
    // Gọi callback để cập nhật tiến độ thử thách nếu có
    if (typeof onActivityComplete === 'function') {
      onActivityComplete(activityData);
    }
  };
  
  // Định dạng thời gian đã trôi qua
  const formatElapsedTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const dataType = getSmartWatchDataType(challenge.category);
  
  // Dọn dẹp khi component unmount
  useEffect(() => {
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timer]);
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center text-lg font-medium text-gray-800 dark:text-white">
          <BsSmartwatch className="text-blue-500 mr-2" />
          <span>Theo dõi hoạt động với thiết bị đeo</span>
        </div>
        
        <div className="flex items-center">
          <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">
            {isConnected ? 
              <span className="text-green-600 dark:text-green-400">• Đã kết nối</span> : 
              <span className="text-red-600 dark:text-red-400">• Mất kết nối</span>
            }
          </span>
          <button 
            onClick={handleSync}
            className="flex items-center px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition"
          >
            <FaSync className="mr-1" /> Đồng bộ
          </button>
        </div>
      </div>
      
      {/* Hiển thị bảng điều khiển hoạt động khi đang theo dõi hoạt động */}
      {activityStatus !== 'idle' && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800/50">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium text-green-800 dark:text-green-300 flex items-center">
              {dataType.icon} Đang theo dõi hoạt động
            </h3>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Được đồng bộ từ {isConnected ? 'thiết bị đeo' : 'điện thoại'}
            </div>
          </div>
          
          <div className="text-center py-3">
            <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-1">
              {formatElapsedTime(elapsedTime)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Thời gian đang chạy
            </div>
          </div>
          
          <div className="flex justify-center space-x-4 mt-4">
            {activityStatus === 'active' ? (
              <button 
                onClick={pauseActivity}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg flex items-center"
              >
                <FaPause className="mr-2" /> Tạm dừng
              </button>
            ) : (
              <button 
                onClick={resumeActivity}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center"
              >
                <FaPlay className="mr-2" /> Tiếp tục
              </button>
            )}
            
            <button 
              onClick={endActivity}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center"
            >
              <FaStop className="mr-2" /> Kết thúc
            </button>
          </div>
        </div>
      )}
      
      {/* Hiển thị nút bắt đầu hoạt động mới khi không có hoạt động nào đang diễn ra */}
      {activityStatus === 'idle' && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800/50">
          <div className="text-center">
            <button
              onClick={startActivity}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center mx-auto"
            >
              <FaPlay className="mr-2" /> Bắt đầu hoạt động mới
            </button>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Bắt đầu hoạt động để cập nhật tiến độ tự động từ thiết bị đeo
            </p>
          </div>
        </div>
      )}
      
      <div className="flex mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div className="flex-1 text-center">
          <div className="text-gray-500 dark:text-gray-400 text-sm mb-1">Đã hoàn thành</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{progressPercentage}%</div>
        </div>
        <div className="flex-1 text-center">
          <div className="text-gray-500 dark:text-gray-400 text-sm mb-1">Mục tiêu đạt</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {totalCompleted.toFixed(1)}/{challenge.targetValue} {dataType.unit}
          </div>
        </div>
        <div className="flex-1 text-center">
          <div className="text-gray-500 dark:text-gray-400 text-sm mb-1">Streak hiện tại</div>
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{streakDays} ngày</div>
        </div>
      </div>
      
      <div className="border-t border-gray-100 dark:border-gray-700 pt-4 mb-4">
        <div className="text-gray-800 dark:text-white font-medium mb-2 flex items-center justify-between">
          <div className="flex items-center">
            {dataType.icon} Lịch sử hoạt động (Cập nhật lần cuối: {lastSynced})
          </div>
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <FaInfoCircle className="mr-1" /> 
            <span>Mục tiêu hàng ngày: {smartWatchData.length > 0 ? smartWatchData[0].target : 0} {dataType.unit}</span>
          </div>
        </div>
        
        {smartWatchData.length > 0 ? (
          <div className="mt-4" style={{ height: "250px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={smartWatchData}
                margin={{ top: 5, right: 50, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  fontSize={12} 
                  tickMargin={8}
                  stroke="#94a3b8"
                />
                <YAxis 
                  fontSize={12} 
                  tickMargin={8} 
                  stroke="#94a3b8"
                  label={{ value: dataType.unit, angle: -90, position: 'insideLeft', style: { fill: '#64748b', fontSize: 12 } }}
                />
                <Tooltip content={<CustomTooltip unit={dataType.unit} />} />
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span className="text-sm font-medium">{value}</span>}
                />
                <ReferenceLine 
                  y={smartWatchData[0]?.target || 0} 
                  label={{ value: 'Mục tiêu', position: 'right', fontSize: 12, fill: '#64748b' }} 
                  stroke="#059669" 
                  strokeDasharray="3 3" 
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  name="Hoạt động"
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  activeDot={{ r: 6, fill: '#1d4ed8', stroke: '#ffffff' }}
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    return payload.completed ? (
                      <svg x={cx - 6} y={cy - 6} width={12} height={12} fill="#16a34a">
                        <circle cx="6" cy="6" r="5" fill="#16a34a" />
                        <circle cx="6" cy="6" r="3" fill="#ffffff" />
                      </svg>
                    ) : (
                      <circle cx={cx} cy={cy} r={4} fill="#3b82f6" />
                    );
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex justify-center items-center h-40 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">Chưa có dữ liệu hoạt động</p>
          </div>
        )}
        
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          <p>Dữ liệu được thu thập tự động từ thiết bị đeo {isConnected ? (
            <span className="text-green-600 dark:text-green-400">• Đã kết nối</span>
          ) : (
            <span className="text-red-600 dark:text-red-400">• Mất kết nối</span>
          )}</p>
        </div>
      </div>
    </div>
  );
};

export default SmartWatchSync; 