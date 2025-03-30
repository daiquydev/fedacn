import { useState, useEffect } from 'react';
import { FaTimes, FaUtensils, FaRegClock, FaFireAlt, FaAppleAlt, FaDrumstickBite, FaBreadSlice } from 'react-icons/fa';

export default function EditMealModal({ meal, onClose, onSave, isNew = false }) {
  const [formData, setFormData] = useState({
    id: isNew ? Date.now() : meal?.id,
    type: meal?.type || 'Sáng',
    name: meal?.name || '',
    calories: meal?.calories || 0,
    time: meal?.time || '',
    completed: meal?.completed || false,
    nutrients: meal?.nutrients || {
      protein: 0,
      carbs: 0,
      fat: 0
    }
  });
  
  // Meal type options
  const mealTypeOptions = ['Sáng', 'Trưa', 'Tối', 'Snack', 'Khác'];
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    if (name === 'calories' || name.startsWith('nutrients.')) {
      // Handle numeric inputs
      const numberValue = value === '' ? 0 : Number(value);
      
      if (name.startsWith('nutrients.')) {
        const nutrientName = name.split('.')[1];
        setFormData(prev => ({
          ...prev,
          nutrients: {
            ...prev.nutrients,
            [nutrientName]: numberValue
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: numberValue
        }));
      }
    } else {
      // Handle other inputs
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Handle save
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {isNew ? 'Thêm bữa ăn mới' : 'Chỉnh sửa bữa ăn'}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <FaTimes size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Meal Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Loại bữa ăn
            </label>
            <div className="grid grid-cols-5 gap-2">
              {mealTypeOptions.map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`py-2 px-1 rounded-lg text-center text-sm ${
                    formData.type === type
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, type }))}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          
          {/* Meal Name */}
          <div>
            <label htmlFor="mealName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tên món ăn
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaUtensils className="text-gray-400" />
              </div>
              <input
                id="mealName"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Nhập tên món ăn"
                className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
          </div>
          
          {/* Time */}
          <div>
            <label htmlFor="mealTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Thời gian
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaRegClock className="text-gray-400" />
              </div>
              <input
                id="mealTime"
                name="time"
                type="text"
                value={formData.time}
                onChange={handleChange}
                placeholder="VD: 7:00 - 8:00"
                className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          
          {/* Calories */}
          <div>
            <label htmlFor="calories" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Lượng calo
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaFireAlt className="text-gray-400" />
              </div>
              <input
                id="calories"
                name="calories"
                type="number"
                min="0"
                step="1"
                value={formData.calories}
                onChange={handleChange}
                placeholder="Lượng calo (kcal)"
                className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
          </div>
          
          {/* Nutrients */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Dưỡng chất</h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="protein" className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Protein (g)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    <FaDrumstickBite className="text-gray-400 w-3 h-3" />
                  </div>
                  <input
                    id="protein"
                    name="nutrients.protein"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.nutrients.protein}
                    onChange={handleChange}
                    className="block w-full pl-7 pr-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="carbs" className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Carbs (g)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    <FaBreadSlice className="text-gray-400 w-3 h-3" />
                  </div>
                  <input
                    id="carbs"
                    name="nutrients.carbs"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.nutrients.carbs}
                    onChange={handleChange}
                    className="block w-full pl-7 pr-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="fat" className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Chất béo (g)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    <FaAppleAlt className="text-gray-400 w-3 h-3" />
                  </div>
                  <input
                    id="fat"
                    name="nutrients.fat"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.nutrients.fat}
                    onChange={handleChange}
                    className="block w-full pl-7 pr-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                {isNew ? 'Thêm bữa ăn' : 'Lưu thay đổi'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium transition-colors"
              >
                Hủy
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 