import NutritionInfo from '../NutritionInfo/NutritionInfo';

{/* Daily meal plan */}
<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
    Thực đơn ngày {moment(mealPlan.startDate).add(selectedDay, 'days').format('DD/MM/YYYY')}
  </h3>
  
  {/* Daily nutrition summary */}
  <div className="mb-6">
    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Tổng quan dinh dưỡng</h4>
    <NutritionInfo 
      nutrition={{
        calories: mealPlan.meals[selectedDay].reduce((sum, meal) => sum + meal.calories, 0),
        protein: mealPlan.meals[selectedDay].reduce((sum, meal) => sum + meal.protein, 0),
        carbs: mealPlan.meals[selectedDay].reduce((sum, meal) => sum + meal.carbs, 0),
        fat: mealPlan.meals[selectedDay].reduce((sum, meal) => sum + meal.fat, 0),
        fiber: mealPlan.meals[selectedDay].reduce((sum, meal) => sum + meal.fiber, 0),
        water: mealPlan.meals[selectedDay].reduce((sum, meal) => sum + meal.water, 0)
      }}
    />
  </div>

  {/* Individual meals */}
  <div className="space-y-6">
    {mealPlan.meals[selectedDay].map((meal, index) => (
      <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0">
        <div className="flex items-center justify-between mb-3">
          <h5 className="text-lg font-medium text-gray-900 dark:text-white">
            {meal.type === 'breakfast' ? 'Bữa sáng' : 
             meal.type === 'lunch' ? 'Bữa trưa' : 
             meal.type === 'dinner' ? 'Bữa tối' : 'Bữa phụ'}
          </h5>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {meal.time}
          </span>
        </div>
        
        {/* Meal items */}
        <div className="space-y-2 mb-4">
          {meal.items.map((item, itemIndex) => (
            <div key={itemIndex} className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">{item}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">{item.portion}</span>
            </div>
          ))}
        </div>

        {/* Meal nutrition info */}
        <div className="mt-4">
          <NutritionInfo 
            nutrition={{
              calories: meal.calories,
              protein: meal.protein,
              carbs: meal.carbs,
              fat: meal.fat,
              fiber: meal.fiber,
              water: meal.water
            }}
            showDetails={false}
          />
        </div>
      </div>
    ))}
  </div>
</div> 