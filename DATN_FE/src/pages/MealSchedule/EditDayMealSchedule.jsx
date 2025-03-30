import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaTrash, FaPlus, FaSave, FaTimes } from 'react-icons/fa';

const EditDayMealSchedule = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dayData, setDayData] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);

  useEffect(() => {
    // Fetch day data
    setLoading(false);
    setDayData({
      meals: [
        { id: 1, name: 'Bữa sáng', type: 'Sáng', time: '07:00', calories: 400, nutrients: { protein: 20, carbs: 30, fat: 10 } },
        { id: 2, name: 'Bữa trưa', type: 'Trưa', time: '12:00', calories: 600, nutrients: { protein: 30, carbs: 40, fat: 20 } },
        { id: 3, name: 'Bữa tối', type: 'Tối', time: '18:00', calories: 500, nutrients: { protein: 25, carbs: 35, fat: 15 } }
      ]
    });
  }, []);

  const handleEditMeal = (id) => {
    setSelectedMeal(dayData.meals.find(meal => meal.id === id));
    setEditModalOpen(true);
  };

  const handleDeleteMeal = (id) => {
    setDayData(prevData => ({
      ...prevData,
      meals: prevData.meals.filter(meal => meal.id !== id)
    }));
    setUnsavedChanges(true);
  };

  const handleAddMeal = () => {
    setSelectedMeal(null);
    setEditModalOpen(true);
  };

  const handleSaveEditedMeal = (meal) => {
    setDayData(prevData => ({
      ...prevData,
      meals: prevData.meals.map(m => m.id === meal.id ? meal : m)
    }));
    setUnsavedChanges(false);
    setEditModalOpen(false);
  };

  const handleSaveNewMeal = (meal) => {
    setDayData(prevData => ({
      ...prevData,
      meals: [...prevData.meals, meal]
    }));
    setUnsavedChanges(false);
    setEditModalOpen(false);
  };

  const handleSaveChanges = () => {
    // Save changes to server
    console.log('Saving changes:', dayData);
    setUnsavedChanges(false);
  };

  const handleCancelChanges = () => {
    if (unsavedChanges) {
      if (window.confirm('Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn hủy bỏ các thay đổi?')) {
        navigate(`/schedule/eat-schedule/day/${dayData.date}`);
      }
    } else {
      navigate(`/schedule/eat-schedule/day/${dayData.date}`);
    }
  };

  const calculateNutrition = () => {
    if (!dayData || !dayData.meals || dayData.meals.length === 0) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }
    
    const totalCalories = dayData.meals.reduce((sum, meal) => sum + meal.calories, 0);
    const totalProtein = dayData.meals.reduce((sum, meal) => sum + meal.nutrients.protein, 0);
    const totalCarbs = dayData.meals.reduce((sum, meal) => sum + meal.nutrients.carbs, 0);
    const totalFat = dayData.meals.reduce((sum, meal) => sum + meal.nutrients.fat, 0);
    
    return { calories: totalCalories, protein: totalProtein, carbs: totalCarbs, fat: totalFat };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }
  
  const nutrition = calculateNutrition();

  return (
    <div className="min-h-screen py-6 px-4 md:px-6">
      <button 
        onClick={handleCancelChanges}
        className="mb-6 flex items-center text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400"
      >
        <FaArrowLeft className="mr-2" /> Quay lại chi tiết ngày
      </button>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1 flex items-center">
              <FaEdit className="mr-2 text-green-600" /> Chỉnh sửa lịch ăn
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {dayData.date}
            </p>
          </div>
        </div>
        
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Tổng quan dinh dưỡng</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg text-center shadow-sm">
              <p className="text-sm text-gray-500 dark:text-gray-400">Tổng calo</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">{nutrition.calories}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">kcal</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg text-center shadow-sm">
              <p className="text-sm text-gray-500 dark:text-gray-400">Protein</p>
              <p className="text-xl font-semibold text-blue-600 dark:text-blue-400">{nutrition.protein}g</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {Math.round((nutrition.protein * 4 / nutrition.calories) * 100)}%
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg text-center shadow-sm">
              <p className="text-sm text-gray-500 dark:text-gray-400">Carbs</p>
              <p className="text-xl font-semibold text-green-600 dark:text-green-400">{nutrition.carbs}g</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {Math.round((nutrition.carbs * 4 / nutrition.calories) * 100)}%
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg text-center shadow-sm">
              <p className="text-sm text-gray-500 dark:text-gray-400">Chất béo</p>
              <p className="text-xl font-semibold text-yellow-600 dark:text-yellow-400">{nutrition.fat}g</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {Math.round((nutrition.fat * 9 / nutrition.calories) * 100)}%
              </p>
            </div>
          </div>
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          Danh sách bữa ăn
        </h2>
        
        <div className="space-y-4 mb-6">
          {dayData.meals.map((meal) => (
            <div 
              key={meal.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="inline-block px-2 py-1 text-xs rounded-md mr-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                      {meal.type}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {meal.time}
                    </span>
                  </div>
                  
                  <h3 className="mt-2 font-medium text-gray-900 dark:text-white">
                    {meal.name}
                  </h3>
                  
                  <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {meal.calories} kcal · {meal.nutrients.protein}g protein · {meal.nutrients.carbs}g carbs · {meal.nutrients.fat}g chất béo
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditMeal(meal.id)}
                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full"
                    aria-label="Chỉnh sửa"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDeleteMeal(meal.id)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
                    aria-label="Xóa"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <button
          onClick={handleAddMeal}
          className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-lg hover:border-green-500 hover:text-green-600 dark:hover:border-green-400 dark:hover:text-green-400 transition-colors flex items-center justify-center mb-6"
        >
          <FaPlus className="mr-2" /> Thêm bữa ăn mới
        </button>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleSaveChanges}
            className={`flex-1 py-3 rounded-lg font-medium flex items-center justify-center ${
              unsavedChanges
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
            disabled={!unsavedChanges}
          >
            <FaSave className="mr-2" /> Lưu thay đổi
          </button>
          <button
            onClick={handleCancelChanges}
            className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium flex items-center justify-center"
          >
            <FaTimes className="mr-2" /> Hủy bỏ
          </button>
        </div>
      </div>
      
      {editModalOpen && (
        <EditMealModal
          meal={selectedMeal}
          onClose={() => setEditModalOpen(false)}
          onSave={selectedMeal ? handleSaveEditedMeal : handleSaveNewMeal}
          isNew={!selectedMeal}
        />
      )}
    </div>
  );
};

export default EditDayMealSchedule; 