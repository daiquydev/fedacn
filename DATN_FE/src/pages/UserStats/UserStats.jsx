import React, { useState, useEffect, Suspense, useRef } from 'react';
import { getPersonalDashboardStats, getCaloriesHistory, getNutritionTrend } from '../../apis/personalDashboardApi';
import { FaChartLine } from 'react-icons/fa';

// Sử dụng lazy loading đơn giản hơn cho các components
import QuickSummary from './components/QuickSummary';
import WeightChart from './components/WeightChart';
import ActivityStats from './components/ActivityStats';
import RecommendationBox from './components/RecommendationBox';
import UserProgressChart from './components/UserProgressChart';

// Component để hiển thị khi đang tải
const LoadingComponent = () => (
  <div className="flex items-center justify-center h-64">
    <p className="text-gray-500 dark:text-gray-400">Đang tải...</p>
  </div>
);

// Component chứa các components con để tránh lỗi React hooks
const DashboardContent = ({ dashboardData }) => {
  const { 
    userProfile, 
    healthMetricsHistory, 
    activityHistory, 
    activitySummary, 
    overallStatus,
    recommendations
  } = dashboardData;

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Biểu đồ tiến trình tổng hợp */}
      <UserProgressChart
        healthMetricsHistory={healthMetricsHistory || []}
        activityHistory={activityHistory || []}
        userProfile={userProfile}
      />
    
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {userProfile && (
            <QuickSummary 
              userProfile={userProfile} 
              overallStatus={overallStatus} 
            />
          )}
          <WeightChart 
            healthMetricsHistory={healthMetricsHistory || []} 
            targetWeight={userProfile?.goal?.targetWeightKg} 
          />
        </div>
        
        <div className="lg:col-span-1">
          <RecommendationBox recommendations={recommendations || []} />
          <ActivityStats 
            activitySummary={activitySummary || {}} 
            activityHistory={activityHistory || []} 
          />
        </div>
      </div>
    </div>
  );
};

// ErrorBoundary đơn giản
class ErrorHandler extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error in component:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <h3 className="text-red-800 font-medium">Có lỗi xảy ra</h3>
          <p className="text-red-600">Xin vui lòng thử lại sau.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

const UserStats = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const containerRef = useRef(null);

  // Xử lý AudioContext howler warning bằng cách kích hoạt khi người dùng tương tác
  useEffect(() => {
    const handleUserInteraction = () => {
      if (window.Howler && window.Howler.ctx && window.Howler.ctx.state !== 'running') {
        try {
          window.Howler.ctx.resume().then(() => {
            console.log('AudioContext đã được kích hoạt');
          });
        } catch (e) {
          console.error('Không thể kích hoạt AudioContext:', e);
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('click', handleUserInteraction);
      container.addEventListener('touchstart', handleUserInteraction);
    }

    return () => {
      if (container) {
        container.removeEventListener('click', handleUserInteraction);
        container.removeEventListener('touchstart', handleUserInteraction);
      }
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Gọi API thực để lấy dữ liệu dashboard
        const [statsRes, caloriesRes, nutritionRes] = await Promise.all([
          getPersonalDashboardStats(),
          getCaloriesHistory(30),
          getNutritionTrend(7)
        ]);

        const stats = statsRes?.result || statsRes || {};
        const caloriesHistory = caloriesRes?.result || caloriesRes || [];
        const nutritionTrend = nutritionRes?.result || nutritionRes || [];

        // Map API data to dashboard format expected by child components
        const dashboardResult = {
          userProfile: stats.userProfile || stats.user_profile || {
            name: stats.name || '',
            weight: stats.weight || 0,
            height: stats.height || 0,
            bmi: stats.bmi || 0,
            goal: stats.goal || {}
          },
          healthMetricsHistory: caloriesHistory.map ? caloriesHistory.map(item => ({
            date: item.date,
            weight: item.weight || 0,
            calories: item.calories || item.total_calories || 0,
            protein: item.protein || 0,
            carbs: item.carbs || 0,
            fat: item.fat || 0
          })) : [],
          activityHistory: nutritionTrend.map ? nutritionTrend.map(item => ({
            date: item.date,
            steps: item.steps || 0,
            calories: item.calories_burned || item.calories || 0,
            duration: item.duration || 0,
            type: item.type || ''
          })) : [],
          activitySummary: stats.activitySummary || stats.activity_summary || {
            totalWorkouts: stats.total_workouts || 0,
            totalCaloriesBurned: stats.total_calories_burned || 0,
            totalDuration: stats.total_duration || 0,
            averageCalories: stats.avg_calories || 0
          },
          overallStatus: stats.overallStatus || stats.overall_status || {
            status: 'good',
            message: 'Tiếp tục duy trì!'
          },
          recommendations: stats.recommendations || []
        };

        setDashboardData(dashboardResult);
        setIsLoading(false);
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div ref={containerRef} className="container px-4 py-6 mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <FaChartLine className="text-green-500 text-2xl mr-3" />
          <h2 className="text-2xl font-bold dark:text-white">Thống Kê Tiến Trình</h2>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500 dark:text-gray-400">Đang tải dữ liệu...</p>
        </div>
      ) : !dashboardData ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500 dark:text-gray-400">Không thể tải dữ liệu. Vui lòng thử lại sau.</p>
        </div>
      ) : (
        <ErrorHandler>
          <DashboardContent dashboardData={dashboardData} />
        </ErrorHandler>
      )}
    </div>
  );
};

export default UserStats; 