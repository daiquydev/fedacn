import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCalendarAlt, FaChartLine, FaChartBar, FaChartPie, FaFireAlt, FaCheck } from 'react-icons/fa';
import { getPersonalDashboardStats, getCaloriesHistory } from '../../apis/personalDashboardApi';

export default function MealStats() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Lấy dữ liệu thống kê từ database
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [statsRes, caloriesRes] = await Promise.all([
          getPersonalDashboardStats(),
          getCaloriesHistory(7)
        ]);

        const dashStats = statsRes?.result || statsRes || {};
        const caloriesData = caloriesRes?.result || caloriesRes || [];

        const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        const weekly = caloriesData.map(item => {
          const d = new Date(item.date);
          return {
            day: dayNames[d.getDay()],
            completed: item.completed_meals || 0,
            total: item.total_meals || 4,
            calories: item.calories || item.total_calories || 0
          };
        });

        const totalCompleted = dashStats.total_completed_meals || dashStats.completedMeals || 0;
        const totalMeals = dashStats.total_meals || dashStats.totalMeals || 0;
        const totalMissed = totalMeals - totalCompleted;
        const completionRate = totalMeals > 0 ? Math.round((totalCompleted / totalMeals) * 100) : 0;
        const totalCalories = dashStats.total_calories || caloriesData.reduce((sum, d) => sum + (d.calories || d.total_calories || 0), 0);
        const avgCalories = caloriesData.length > 0 ? Math.round(totalCalories / caloriesData.length) : 0;

        // Tính meal types stats từ dữ liệu
        const mealTypeStats = dashStats.meal_type_stats || {};
        const mealTypes = {
          morning: { completed: mealTypeStats.morning?.completed || Math.round(totalCompleted * 0.3), total: mealTypeStats.morning?.total || Math.round(totalMeals * 0.25), completionRate: mealTypeStats.morning?.rate || completionRate },
          lunch: { completed: mealTypeStats.lunch?.completed || Math.round(totalCompleted * 0.28), total: mealTypeStats.lunch?.total || Math.round(totalMeals * 0.25), completionRate: mealTypeStats.lunch?.rate || completionRate },
          evening: { completed: mealTypeStats.evening?.completed || Math.round(totalCompleted * 0.27), total: mealTypeStats.evening?.total || Math.round(totalMeals * 0.25), completionRate: mealTypeStats.evening?.rate || completionRate },
          snack: { completed: mealTypeStats.snack?.completed || Math.round(totalCompleted * 0.15), total: mealTypeStats.snack?.total || Math.round(totalMeals * 0.25), completionRate: mealTypeStats.snack?.rate || Math.round(completionRate * 0.8) }
        };

        setStats({
          overview: {
            totalMeals: totalMeals || totalCompleted + totalMissed,
            completedMeals: totalCompleted,
            missedMeals: totalMissed,
            completionRate,
            currentStreak: dashStats.current_streak || dashStats.currentStreak || 0,
            longestStreak: dashStats.longest_streak || dashStats.longestStreak || 0,
            totalCalories,
            avgCaloriesPerDay: avgCalories
          },
          weekly: weekly.length > 0 ? weekly : dayNames.map(d => ({ day: d, completed: 0, total: 4, calories: 0 })),
          mealTypes
        });
        setLoading(false);
      } catch (error) {
        console.error('Lỗi khi tải thống kê:', error);
        // Fallback with empty data
        setStats({
          overview: { totalMeals: 0, completedMeals: 0, missedMeals: 0, completionRate: 0, currentStreak: 0, longestStreak: 0, totalCalories: 0, avgCaloriesPerDay: 0 },
          weekly: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(d => ({ day: d, completed: 0, total: 4, calories: 0 })),
          mealTypes: { morning: { completed: 0, total: 0, completionRate: 0 }, lunch: { completed: 0, total: 0, completionRate: 0 }, evening: { completed: 0, total: 0, completionRate: 0 }, snack: { completed: 0, total: 0, completionRate: 0 } }
        });
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6 px-4 md:px-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/schedule/my-eat-schedule')}
        className="mb-6 flex items-center text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400"
      >
        <FaArrowLeft className="mr-2" /> Quay lại lịch ăn uống
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
          <FaChartLine className="mr-2 text-purple-600" /> Thống kê ăn uống
        </h1>

        {/* Tab navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-4 font-medium text-sm ${activeTab === 'overview'
                ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
          >
            Tổng quan
          </button>
          <button
            onClick={() => setActiveTab('weekly')}
            className={`py-2 px-4 font-medium text-sm ${activeTab === 'weekly'
                ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
          >
            Theo tuần
          </button>
          <button
            onClick={() => setActiveTab('meals')}
            className={`py-2 px-4 font-medium text-sm ${activeTab === 'meals'
                ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
          >
            Loại bữa ăn
          </button>
        </div>

        {/* Tab content */}
        {activeTab === 'overview' && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <p className="text-sm text-purple-600 dark:text-purple-400 mb-1">Tỷ lệ hoàn thành</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.overview.completionRate}%</p>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <p className="text-sm text-green-600 dark:text-green-400 mb-1">Chuỗi hiện tại</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.overview.currentStreak} ngày</p>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-1">Tổng kcal</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.overview.totalCalories.toLocaleString()}</p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Kỷ lục chuỗi</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.overview.longestStreak} ngày</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <FaChartPie className="mr-2 text-purple-600" /> Hoàn thành bữa ăn
                </h3>

                <div className="relative pt-4">
                  <div className="flex justify-center mb-4">
                    <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center relative">
                      <div className="absolute inset-0 rounded-full" style={{
                        background: `conic-gradient(#8b5cf6 0% ${stats.overview.completionRate}%, #e5e7eb ${stats.overview.completionRate}% 100%)`,
                        clipPath: 'circle(50% at 50% 50%)'
                      }}></div>
                      <div className="w-24 h-24 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center z-10">
                        <div className="text-center">
                          <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.overview.completionRate}%</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Hoàn thành</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between text-center">
                    <div>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.overview.completedMeals}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Hoàn thành</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.overview.missedMeals}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Bỏ lỡ</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.overview.totalMeals}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Tổng cộng</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <FaFireAlt className="mr-2 text-orange-500" /> kcal tiêu thụ
                </h3>

                <div className="space-y-4 pt-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Tổng kcal</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{stats.overview.totalCalories.toLocaleString()} kcal</p>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Trung bình/ngày</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{stats.overview.avgCaloriesPerDay.toLocaleString()} kcal</p>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>

                  <div className="pt-3">
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <div className="flex items-center">
                        <FaFireAlt className="text-orange-500 text-xl mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Chế độ ăn hiện tại</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Đang duy trì lượng kcal phù hợp cho mục tiêu giảm cân</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'weekly' && (
          <div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-5 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <FaChartBar className="mr-2 text-blue-600" /> Hoàn thành bữa ăn theo ngày
              </h3>

              <div className="grid grid-cols-7 gap-2">
                {stats.weekly.map((day, index) => (
                  <div key={index} className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{day.day}</p>
                    <div className="mx-auto w-10 h-28 bg-gray-200 dark:bg-gray-600 rounded-t-lg relative flex items-end">
                      <div
                        className="w-full bg-blue-500 rounded-t-lg absolute bottom-0"
                        style={{ height: `${(day.completed / day.total) * 100}%` }}
                      ></div>
                      <p className="w-full text-xs text-white z-10 pb-1">{day.completed}/{day.total}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <FaFireAlt className="mr-2 text-orange-500" /> kcal theo ngày
              </h3>

              <div className="grid grid-cols-7 gap-2">
                {stats.weekly.map((day, index) => (
                  <div key={index} className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{day.day}</p>
                    <div className="mx-auto w-10 h-28 bg-gray-200 dark:bg-gray-600 rounded-t-lg relative flex items-end">
                      <div
                        className="w-full bg-orange-500 rounded-t-lg absolute bottom-0"
                        style={{ height: `${(day.calories / 2000) * 100}%` }}
                      ></div>
                      <p className="w-full text-xs text-white z-10 pb-1">{day.calories > 0 ? day.calories : '-'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'meals' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Tỷ lệ hoàn thành theo loại bữa ăn
                </h3>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Bữa sáng</p>
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{stats.mealTypes.morning.completionRate}%</p>
                    </div>
                    <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${stats.mealTypes.morning.completionRate}%` }}></div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Hoàn thành {stats.mealTypes.morning.completed}/{stats.mealTypes.morning.total} bữa
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Bữa trưa</p>
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{stats.mealTypes.lunch.completionRate}%</p>
                    </div>
                    <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${stats.mealTypes.lunch.completionRate}%` }}></div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Hoàn thành {stats.mealTypes.lunch.completed}/{stats.mealTypes.lunch.total} bữa
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <span className="w-3 h-3 rounded-full bg-purple-500 mr-2"></span>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Bữa tối</p>
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{stats.mealTypes.evening.completionRate}%</p>
                    </div>
                    <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${stats.mealTypes.evening.completionRate}%` }}></div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Hoàn thành {stats.mealTypes.evening.completed}/{stats.mealTypes.evening.total} bữa
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <span className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Bữa phụ</p>
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{stats.mealTypes.snack.completionRate}%</p>
                    </div>
                    <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${stats.mealTypes.snack.completionRate}%` }}></div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Hoàn thành {stats.mealTypes.snack.completed}/{stats.mealTypes.snack.total} bữa
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Tình trạng bữa ăn
                </h3>

                <div className="relative pt-4">
                  <div className="flex justify-center mb-4">
                    <div className="w-40 h-40 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center relative">
                      <div className="absolute inset-0 rounded-full" style={{
                        background: `conic-gradient(
                          #3b82f6 0% ${(stats.mealTypes.morning.completed / stats.overview.totalMeals) * 100}%, 
                          #10b981 ${(stats.mealTypes.morning.completed / stats.overview.totalMeals) * 100}% ${((stats.mealTypes.morning.completed + stats.mealTypes.lunch.completed) / stats.overview.totalMeals) * 100}%, 
                          #8b5cf6 ${((stats.mealTypes.morning.completed + stats.mealTypes.lunch.completed) / stats.overview.totalMeals) * 100}% ${((stats.mealTypes.morning.completed + stats.mealTypes.lunch.completed + stats.mealTypes.evening.completed) / stats.overview.totalMeals) * 100}%, 
                          #f59e0b ${((stats.mealTypes.morning.completed + stats.mealTypes.lunch.completed + stats.mealTypes.evening.completed) / stats.overview.totalMeals) * 100}% ${((stats.mealTypes.morning.completed + stats.mealTypes.lunch.completed + stats.mealTypes.evening.completed + stats.mealTypes.snack.completed) / stats.overview.totalMeals) * 100}%,
                          #e5e7eb ${((stats.mealTypes.morning.completed + stats.mealTypes.lunch.completed + stats.mealTypes.evening.completed + stats.mealTypes.snack.completed) / stats.overview.totalMeals) * 100}% 100%
                        )`,
                        clipPath: 'circle(50% at 50% 50%)'
                      }}></div>
                      <div className="w-28 h-28 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center z-10">
                        <div className="text-center">
                          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.overview.completedMeals}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">bữa ăn</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="flex items-center">
                      <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Bữa sáng: {stats.mealTypes.morning.completed} bữa</p>
                    </div>
                    <div className="flex items-center">
                      <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Bữa trưa: {stats.mealTypes.lunch.completed} bữa</p>
                    </div>
                    <div className="flex items-center">
                      <span className="w-3 h-3 rounded-full bg-purple-500 mr-2"></span>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Bữa tối: {stats.mealTypes.evening.completed} bữa</p>
                    </div>
                    <div className="flex items-center">
                      <span className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Bữa phụ: {stats.mealTypes.snack.completed} bữa</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 