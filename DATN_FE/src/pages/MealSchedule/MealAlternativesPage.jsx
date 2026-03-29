import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaExchangeAlt, FaCheckCircle, FaFilter, FaSearch } from 'react-icons/fa';
import { getDateMealItem, getListMealSchedules } from '../../apis/mealScheduleApi';

export default function MealAlternativesPage() {
  const { date } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dayData, setDayData] = useState(null);
  const [selectedMealType, setSelectedMealType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [calorieRange, setCalorieRange] = useState([0, 1000]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Lấy dữ liệu bữa ăn và món thay thế từ database
  useEffect(() => {
    const fetchMealAlternatives = async () => {
      try {
        setLoading(true);

        // Lấy danh sách thực đơn
        const schedulesRes = await getListMealSchedules({ page: 1, limit: 10 });
        const schedules = schedulesRes?.data?.result?.meal_schedules || schedulesRes?.data?.result || [];
        const activePlan = schedules[0];

        if (activePlan) {
          const planId = activePlan._id || activePlan.id;

          // Lấy meals cho ngày được chọn
          const mealItemsRes = await getDateMealItem({
            meal_schedule_id: planId,
            date: date
          });
          const mealItems = mealItemsRes?.data?.result || [];

          const meals = mealItems.map((item, index) => ({
            id: item._id || `meal-${index}`,
            type: item.meal_type === 0 ? 'Sáng' : item.meal_type === 1 ? 'Trưa' : item.meal_type === 2 ? 'Tối' : 'Snack',
            name: item.meal_name || '',
            calories: item.energy || 0,
            completed: item.is_completed || false,
            time: item.time || '',
            alternatives: (item.alternatives || []).map((alt, altIndex) => ({
              id: alt._id || `alt-${index}-${altIndex}`,
              name: alt.meal_name || alt.name || '',
              calories: alt.energy || alt.calories || 0,
              nutrients: {
                protein: alt.protein || 0,
                carbs: alt.carbs || 0,
                fat: alt.fat || 0
              },
              tags: alt.tags || []
            }))
          }));

          setDayData({ date, meals });
        } else {
          setDayData({ date, meals: [] });
        }

        setLoading(false);
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
        setDayData({ date, meals: [] });
        setLoading(false);
      }
    };

    fetchMealAlternatives();
  }, [date]);
  
  // Format the date from URL param
  const formatDisplayDate = () => {
    if (!date) return '';
    
    const [year, month, day] = date.split('-');
    const dateObj = new Date(year, month - 1, day);
    
    return dateObj.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Filter meals based on selected type, search query, and calorie range
  const getFilteredMeals = () => {
    if (!dayData) return [];
    
    return dayData.meals.filter(meal => {
      // Filter by meal type
      if (selectedMealType !== 'all' && meal.type !== selectedMealType) {
        return false;
      }
      
      return true;
    });
  };
  
  // Filter alternatives based on search query and calorie range
  const getFilteredAlternatives = (alternatives) => {
    if (!alternatives) return [];
    
    return alternatives.filter(alt => {
      // Filter by search query
      if (searchQuery && !alt.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Filter by calorie range
      if (alt.calories < calorieRange[0] || alt.calories > calorieRange[1]) {
        return false;
      }
      
      return true;
    });
  };
  
  // Handle replacing a meal with an alternative
  const handleReplaceMeal = (mealId, alternativeId) => {
    // In a real app, you would call an API to update the meal plan
    // For this demo, we'll just update the local state
    
    const updatedMeals = dayData.meals.map(meal => {
      if (meal.id === mealId) {
        // Find the alternative
        const alternative = meal.alternatives.find(alt => alt.id === alternativeId);
        if (alternative) {
          // Create a new meal with the alternative data but keep the original meal's type and time
          return {
            ...meal,
            name: alternative.name,
            calories: alternative.calories,
            nutrients: alternative.nutrients,
            // Keep the original alternatives array
          };
        }
      }
      return meal;
    });
    
    setDayData({
      ...dayData,
      meals: updatedMeals
    });
    
    // Show success message (in a real app, you might use a toast notification)
    alert('Bữa ăn đã được thay thế thành công!');
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }
  
  const filteredMeals = getFilteredMeals();
  
  return (
    <div className="min-h-screen py-6 px-4 md:px-6">
      {/* Back button */}
      <button 
        onClick={() => navigate(`/schedule/eat-schedule/day/${date}`)}
        className="mb-6 flex items-center text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400"
      >
        <FaArrowLeft className="mr-2" /> Quay lại chi tiết ngày
      </button>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1 flex items-center">
              <FaExchangeAlt className="mr-2 text-green-600" /> Món ăn thay thế
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {formatDisplayDate()}
            </p>
          </div>
          
          <div className="mt-3 md:mt-0">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <FaFilter className="mr-2" /> Lọc món ăn
            </button>
          </div>
        </div>
        
        {/* Filters */}
        {showFilters && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Meal type filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Loại bữa ăn
                </label>
                <select 
                  value={selectedMealType}
                  onChange={(e) => setSelectedMealType(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                >
                  <option value="all">Tất cả các bữa</option>
                  <option value="Sáng">Bữa sáng</option>
                  <option value="Trưa">Bữa trưa</option>
                  <option value="Tối">Bữa tối</option>
                  <option value="Snack">Snack</option>
                </select>
              </div>
              
              {/* Search filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tìm kiếm món ăn
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm món ăn..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              
              {/* Calorie range filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Lượng calo: {calorieRange[0]} - {calorieRange[1]} kcal
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    step="50"
                    value={calorieRange[0]}
                    onChange={(e) => setCalorieRange([parseInt(e.target.value), calorieRange[1]])}
                    className="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400 w-10 text-center">
                    {calorieRange[0]}
                  </span>
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    step="50"
                    value={calorieRange[1]}
                    onChange={(e) => setCalorieRange([calorieRange[0], parseInt(e.target.value)])}
                    className="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400 w-10 text-center">
                    {calorieRange[1]}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 text-right">
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setCalorieRange([0, 1000]);
                  setSelectedMealType('all');
                }}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Đặt lại bộ lọc
              </button>
            </div>
          </div>
        )}
        
        {/* Meal alternatives list */}
        <div className="space-y-8">
          {filteredMeals.length > 0 ? (
            filteredMeals.map((meal) => {
              const filteredAlternatives = getFilteredAlternatives(meal.alternatives);
              
              return (
                <div key={meal.id} className="border-b border-gray-200 dark:border-gray-700 pb-6 mb-6 last:border-b-0 last:mb-0 last:pb-0">
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                      <span className="inline-block px-2 py-1 text-xs rounded-md mr-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        {meal.type}
                      </span>
                      {meal.name}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {meal.calories} kcal · {meal.time}
                    </p>
                  </div>
                  
                  {filteredAlternatives.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredAlternatives.map((alternative) => (
                        <div 
                          key={alternative.id}
                          className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-500 hover:shadow-md transition-all"
                        >
                          <h3 className="font-medium text-gray-800 dark:text-white mb-2">
                            {alternative.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {alternative.calories} kcal
                          </p>
                          
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            <div className="text-center p-1 bg-blue-50 dark:bg-blue-900/20 rounded">
                              <p className="text-xs text-gray-500 dark:text-gray-400">Protein</p>
                              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">{alternative.nutrients.protein}g</p>
                            </div>
                            <div className="text-center p-1 bg-green-50 dark:bg-green-900/20 rounded">
                              <p className="text-xs text-gray-500 dark:text-gray-400">Carbs</p>
                              <p className="text-sm font-medium text-green-600 dark:text-green-400">{alternative.nutrients.carbs}g</p>
                            </div>
                            <div className="text-center p-1 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                              <p className="text-xs text-gray-500 dark:text-gray-400">Chất béo</p>
                              <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">{alternative.nutrients.fat}g</p>
                            </div>
                          </div>
                          
                          {alternative.tags && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {alternative.tags.map((tag, index) => (
                                <span 
                                  key={index}
                                  className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-300 rounded-full"
                                >
                                  {tag === 'vegan' && 'Thuần chay'}
                                  {tag === 'vegetarian' && 'Chay'}
                                  {tag === 'glutenFree' && 'Không gluten'}
                                  {tag === 'dairyFree' && 'Không sữa'}
                                  {tag === 'lowCarb' && 'Ít carb'}
                                  {tag === 'lowFat' && 'Ít chất béo'}
                                  {tag === 'highProtein' && 'Nhiều protein'}
                                  {tag === 'highFiber' && 'Nhiều chất xơ'}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          <button
                            onClick={() => handleReplaceMeal(meal.id, alternative.id)}
                            className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                          >
                            <FaExchangeAlt className="inline mr-1" /> Thay thế
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-gray-500 dark:text-gray-400">
                        Không tìm thấy món ăn thay thế phù hợp với bộ lọc.
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                Không tìm thấy bữa ăn phù hợp với bộ lọc.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 