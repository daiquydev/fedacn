import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCalendarDay, FaCheckCircle, FaUtensils, FaPlusCircle, FaEdit, FaExchangeAlt } from 'react-icons/fa';
import MealCard from './components/MealCard';
import EditMealModal from './components/EditMealModal';
import MealNoteModal from './components/MealNoteModal';
import { getDateMealItem, getListMealSchedules } from '../../apis/mealScheduleApi';

export default function DayMealScheduleDetail() {
  const { date } = useParams(); // Format: YYYY-MM-DD
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dayData, setDayData] = useState(null);
  const [mealPlan, setMealPlan] = useState(null);
  
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [alternativesModalOpen, setAlternativesModalOpen] = useState(false);
  
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
  
  const isToday = () => {
    if (!date) return false;
    const [year, month, day] = date.split('-');
    const dateObj = new Date(year, month - 1, day);
    const today = new Date();
    return dateObj.getDate() === today.getDate() &&
      dateObj.getMonth() === today.getMonth() &&
      dateObj.getFullYear() === today.getFullYear();
  };
  
  // Lấy dữ liệu bữa ăn từ database
  useEffect(() => {
    const fetchDayData = async () => {
      try {
        setLoading(true);

        // Lấy danh sách thực đơn để tìm meal plan hiện tại
        const schedulesRes = await getListMealSchedules({ page: 1, limit: 10 });
        const schedules = schedulesRes?.data?.result?.meal_schedules || schedulesRes?.data?.result || [];
        const activePlan = schedules[0]; // Lấy plan đầu tiên

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
            note: item.note || '',
            nutrients: {
              protein: item.protein || 0,
              carbs: item.carbs || 0,
              fat: item.fat || 0
            },
            alternatives: []
          }));

          const completedCount = meals.filter(m => m.completed).length;
          const completion = meals.length > 0 ? Math.round((completedCount / meals.length) * 100) : 0;

          setDayData({
            date: date,
            isComplete: completion === 100,
            completion: completion,
            mealPlanId: planId,
            dayNumber: 1,
            meals: meals
          });

          const startDate = activePlan.start_date || activePlan.startDate;
          const endDate = activePlan.end_date || activePlan.endDate;
          const start = new Date(startDate);
          const end = new Date(endDate);
          const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

          setMealPlan({
            id: planId,
            title: activePlan.name || activePlan.title || 'Thực đơn',
            image: activePlan.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
            startDate: startDate,
            endDate: endDate,
            duration: totalDays,
            progress: 0,
            completedDays: 0,
            totalDays: totalDays,
            totalCalories: meals.reduce((sum, m) => sum + m.calories, 0)
          });
        } else {
          // Không có meal plan
          setDayData({ date, isComplete: false, completion: 0, mealPlanId: null, dayNumber: 0, meals: [] });
          setMealPlan({ id: null, title: 'Chưa có thực đơn', image: '', startDate: '', endDate: '', duration: 0, progress: 0, completedDays: 0, totalDays: 0, totalCalories: 0 });
        }

        setLoading(false);
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu ngày:', error);
        setDayData({ date, isComplete: false, completion: 0, mealPlanId: null, dayNumber: 0, meals: [] });
        setMealPlan({ id: null, title: 'Lỗi tải dữ liệu', image: '', startDate: '', endDate: '', duration: 0, progress: 0, completedDays: 0, totalDays: 0, totalCalories: 0 });
        setLoading(false);
      }
    };

    fetchDayData();
  }, [date]);
  
  // Handle marking a meal as complete
  const handleCompleteMeal = (mealId) => {
    setDayData(prevData => ({
      ...prevData,
      meals: prevData.meals.map(meal => 
        meal.id === mealId ? { ...meal, completed: true } : meal
      )
    }));
    
    // Recalculate completion percentage
    const updatedMeals = dayData.meals.map(meal => 
      meal.id === mealId ? { ...meal, completed: true } : meal
    );
    const completedCount = updatedMeals.filter(meal => meal.completed).length;
    const newCompletion = Math.round((completedCount / updatedMeals.length) * 100);
    
    setDayData(prevData => ({
      ...prevData,
      completion: newCompletion,
      isComplete: newCompletion === 100
    }));
  };
  
  // Handle editing a meal
  const handleEditMeal = (mealId) => {
    const meal = dayData.meals.find(m => m.id === mealId);
    setSelectedMeal(meal);
    setEditModalOpen(true);
  };
  
  // Handle adding a note to a meal
  const handleAddNote = (mealId) => {
    const meal = dayData.meals.find(m => m.id === mealId);
    setSelectedMeal(meal);
    setNoteModalOpen(true);
  };
  
  // Handle saving edited meal
  const handleSaveEditedMeal = (updatedMeal) => {
    setDayData(prevData => ({
      ...prevData,
      meals: prevData.meals.map(meal => 
        meal.id === updatedMeal.id ? updatedMeal : meal
      )
    }));
    setEditModalOpen(false);
  };
  
  // Handle saving meal note
  const handleSaveNote = (mealId, note) => {
    setDayData(prevData => ({
      ...prevData,
      meals: prevData.meals.map(meal => 
        meal.id === mealId ? { ...meal, note: note } : meal
      )
    }));
  };
  
  // Get total calories for completed and remaining meals
  const getTotalCalories = () => {
    if (!dayData) return { completed: 0, remaining: 0, total: 0 };
    
    const completedCalories = dayData.meals
      .filter(meal => meal.completed)
      .reduce((sum, meal) => sum + meal.calories, 0);
    
    const remainingCalories = dayData.meals
      .filter(meal => !meal.completed)
      .reduce((sum, meal) => sum + meal.calories, 0);
    
    const totalCalories = completedCalories + remainingCalories;
    
    return { completed: completedCalories, remaining: remainingCalories, total: totalCalories };
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }
  
  const calories = getTotalCalories();
  
  return (
    <div className="min-h-screen py-6 px-4 md:px-6">
      {/* Back button */}
      <button 
        onClick={() => navigate('/schedule/my-eat-schedule')}
        className="mb-6 flex items-center text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400"
      >
        <FaArrowLeft className="mr-2" /> Quay lại lịch thực đơn
      </button>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content - 2/3 width on desktop */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1 flex items-center">
                  <FaCalendarDay className="mr-2 text-green-600" /> {formatDisplayDate()}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Ngày {dayData.dayNumber} của {mealPlan.title}
                </p>
              </div>
              
              {dayData.isComplete ? (
                <div className="mt-2 sm:mt-0 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-lg flex items-center">
                  <FaCheckCircle className="mr-2" /> Hoàn thành
                </div>
              ) : isToday() ? (
                <div className="mt-2 sm:mt-0 px-3 py-1
                .5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-lg">
                  Hôm nay
                </div>
              ) : null}
            </div>
            
            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Tiến độ hoàn thành</span>
                <span className="font-medium text-green-600 dark:text-green-400">{dayData.completion}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div 
                  className="bg-gradient-to-r from-green-500 to-green-600 h-2.5 rounded-full" 
                  style={{ width: `${dayData.completion}%` }}
                />
              </div>
            </div>
            
            {/* Meals List */}
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FaUtensils className="mr-2 text-green-600" /> Các bữa ăn
            </h2>
            
            <div className="space-y-4 mb-6 relative">
              {dayData.meals.map((meal) => (
                <MealCard 
                  key={meal.id} 
                  meal={meal} 
                  onComplete={handleCompleteMeal}
                  onEdit={handleEditMeal}
                  onAddNote={handleAddNote}
                  showActions={isToday()}
                />
              ))}
            </div>
            
            {/* Add custom meal button */}
            {isToday() && (
              <button
                onClick={() => {
                  setSelectedMeal(null); // For creating a new meal
                  setEditModalOpen(true);
                }}
                className="w-full py-2.5 border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-lg hover:border-green-500 hover:text-green-600 dark:hover:border-green-400 dark:hover:text-green-400 transition-colors flex items-center justify-center"
              >
                <FaPlusCircle className="mr-2" /> Thêm bữa ăn tùy chỉnh
              </button>
            )}
          </div>
        </div>
        
        {/* Sidebar - 1/3 width on desktop */}
        <div className="lg:col-span-1 space-y-6">
          {/* Diet Plan Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex items-center mb-4">
              <img 
                src={mealPlan.image} 
                alt={mealPlan.title} 
                className="w-12 h-12 rounded-full object-cover mr-3"
              />
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white line-clamp-1">{mealPlan.title}</h3>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(mealPlan.startDate).toLocaleDateString('vi-VN')} - {new Date(mealPlan.endDate).toLocaleDateString('vi-VN')}
                </div>
              </div>
            </div>
            
            {/* Nutrition data */}
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tổng quan dinh dưỡng</h4>
                <div className="grid grid-cols-3 gap-2 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Đã ăn</p>
                    <p className="text-base font-semibold text-green-600 dark:text-green-400">{calories.completed}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">kcal</p>
                  </div>
                  <div className="text-center border-x border-gray-200 dark:border-gray-600">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Còn lại</p>
                    <p className="text-base font-semibold text-blue-600 dark:text-blue-400">{calories.remaining}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">kcal</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Tổng</p>
                    <p className="text-base font-semibold text-gray-800 dark:text-gray-200">{calories.total}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">kcal</p>
                  </div>
                </div>
              </div>
              
              {/* Nutrient distribution */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phân bổ dưỡng chất</h4>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Protein</span>
                      <span className="font-medium text-blue-600 dark:text-blue-400">25%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                      <div className="bg-blue-600 h-1.5 rounded-full w-1/4" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Carbs</span>
                      <span className="font-medium text-green-600 dark:text-green-400">40%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                      <div className="bg-green-600 h-1.5 rounded-full w-2/5" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Chất béo</span>
                      <span className="font-medium text-yellow-600 dark:text-yellow-400">35%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                      <div className="bg-yellow-500 h-1.5 rounded-full w-[35%]" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Quick actions */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Thao tác nhanh</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => navigate(`/schedule/eat-schedule/alternatives/${date}`)}
                    className="w-full py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors flex items-center justify-center"
                  >
                    <FaExchangeAlt className="mr-2" /> Xem món thay thế
                  </button>
                  <button
                    onClick={() => navigate(`/schedule/eat-schedule/edit/${date}`)}
                    className="w-full py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-800/30 transition-colors flex items-center justify-center"
                  >
                    <FaEdit className="mr-2" /> Chỉnh sửa lịch ăn
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Tips card */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-400 mb-3">
              Mẹo cho hôm nay
            </h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
                <span className="text-blue-800 dark:text-blue-300 text-sm">Uống ít nhất 2 lít nước trong cả ngày</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
                <span className="text-blue-800 dark:text-blue-300 text-sm">Ăn chậm và nhai kỹ để tăng cảm giác no</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
                <span className="text-blue-800 dark:text-blue-300 text-sm">Tránh ăn vặt giữa các bữa ăn chính</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
                <span className="text-blue-800 dark:text-blue-300 text-sm">Thực hiện 20-30 phút tập thể dục vừa phải</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Edit Meal Modal */}
      {editModalOpen && (
        <EditMealModal
          meal={selectedMeal}
          onClose={() => setEditModalOpen(false)}
          onSave={handleSaveEditedMeal}
          isNew={!selectedMeal}
        />
      )}
      
      {/* Note Modal */}
      {noteModalOpen && selectedMeal && (
        <MealNoteModal
          isOpen={noteModalOpen}
          onClose={() => setNoteModalOpen(false)}
          onSaveNote={(note) => {
            handleSaveNote(selectedMeal.id, note);
            setNoteModalOpen(false);
          }}
          initialNote={selectedMeal.note}
        />
      )}
    </div>
  );
} 