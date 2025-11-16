import { FaClock, FaFireAlt, FaLeaf, FaFish, FaOilCan, FaUtensils, FaInfoCircle } from 'react-icons/fa'
import { GiWheat } from 'react-icons/gi'
import { getImageUrl } from '../../../../utils/imageUrl'

export default function DayMealPlan({ day, onViewCooking }) {
  // Calculate total nutrition for the day
  const totalNutrition = day.meals.reduce(
    (acc, meal) => {
      return {
        calories: acc.calories + (meal.calories || 0),
        protein: acc.protein + (meal.protein || 0),
        carbs: acc.carbs + (meal.carbs || 0),
        fat: acc.fat + (meal.fat || 0)
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // Return a color based on the meal type
  const getMealTypeColor = (type) => {
    const typeColors = {
      'Sáng': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'Trưa': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Tối': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Snack': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    };
    
    return typeColors[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  };

  return (
    <div>
      {/* Daily nutrition summary */}
      <div className="bg-gray-50 dark:bg-gray-750 p-4 rounded-lg mb-6">
        <h3 className="text-md font-medium text-gray-800 dark:text-white mb-2">
          Tổng dinh dưỡng Ngày {day.day}
        </h3>
        <div className="grid grid-cols-4 gap-2">
          <div className="flex items-center">
            <FaFireAlt className="text-red-500 mr-2" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Calories</p>
              <p className="font-medium text-gray-800 dark:text-white">{totalNutrition.calories} kcal</p>
            </div>
          </div>
          <div className="flex items-center">
            <FaFish className="text-blue-500 mr-2" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Protein</p>
              <p className="font-medium text-gray-800 dark:text-white">{totalNutrition.protein}g</p>
            </div>
          </div>
          <div className="flex items-center">
            <GiWheat className="text-amber-500 mr-2" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Carbs</p>
              <p className="font-medium text-gray-800 dark:text-white">{totalNutrition.carbs}g</p>
            </div>
          </div>
          <div className="flex items-center">
            <FaOilCan className="text-yellow-500 mr-2" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Chất béo</p>
              <p className="font-medium text-gray-800 dark:text-white">{totalNutrition.fat}g</p>
            </div>
          </div>
        </div>
      </div>

      {/* List of meals */}
      <div className="space-y-4">
        {day.meals.map((meal, index) => (
          <div key={index} className="bg-white dark:bg-gray-750 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* Meal header */}
            <div className={`px-4 py-2 flex justify-between items-center ${getMealTypeColor(meal.type)}`}>
              <span className="font-medium">{meal.type}</span>
              <div className="flex items-center text-xs">
                <FaClock className="mr-1" />
                {meal.type === 'Sáng' && '6:00 - 8:00'}
                {meal.type === 'Trưa' && '12:00 - 13:30'}
                {meal.type === 'Tối' && '18:00 - 19:30'}
                {meal.type === 'Snack' && '10:00 or 16:00'}
              </div>
            </div>
            
            {/* Meal content */}
            <div className="p-4">
              {/* Thêm layout với hình ảnh */}
              <div className="flex flex-col md:flex-row gap-4">
                {/* Hiển thị hình ảnh nếu có */}
                {meal.image && (
                  <div className="w-full md:w-1/3 h-48 rounded-lg overflow-hidden">
                    <img 
                      src={getImageUrl(meal.image) || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'} 
                      alt={meal.content} 
                      className="w-full h-full object-cover transition-transform hover:scale-105"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c';
                      }}
                    />
                  </div>
                )}
                
                <div className="w-full md:w-2/3">
                  <p className="text-gray-800 dark:text-gray-200 mb-3">
                    {meal.content}
                  </p>
                  
                  {/* Nutrition info */}
                  <div className="grid grid-cols-4 gap-2 mt-2 mb-3">
                    <div className="flex flex-col text-center p-1 rounded-md bg-gray-50 dark:bg-gray-800">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Calories</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{meal.calories} kcal</span>
                    </div>
                    <div className="flex flex-col text-center p-1 rounded-md bg-gray-50 dark:bg-gray-800">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Protein</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{meal.protein}g</span>
                    </div>
                    <div className="flex flex-col text-center p-1 rounded-md bg-gray-50 dark:bg-gray-800">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Carbs</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{meal.carbs}g</span>
                    </div>
                    <div className="flex flex-col text-center p-1 rounded-md bg-gray-50 dark:bg-gray-800">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Chất béo</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{meal.fat}g</span>
                    </div>
                  </div>
                  
                  {/* Thêm nút xem cách chế biến nhỏ hơn */}
                  {meal.hasCooking && (
                    <button
                      onClick={() => onViewCooking(meal)}
                      className="inline-flex items-center text-xs font-medium text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                    >
                      <FaInfoCircle className="mr-1" />
                      Xem cách chế biến
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 