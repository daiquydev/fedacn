import React from 'react';
import { FaFire, FaWeight, FaCarrot, FaDrumstickBite, FaOilCan } from 'react-icons/fa';
import { GiWaterDrop } from 'react-icons/gi';

const NutritionInfo = ({ nutrition, showDetails = true }) => {
  const {
    calories,
    protein,
    carbs,
    fat,
    fiber,
    water
  } = nutrition;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      {/* Main nutrition stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        <div className="flex items-center space-x-2">
          <FaFire className="text-orange-500 text-xl" />
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Calories</p>
            <p className="font-semibold text-gray-900 dark:text-white">{calories} kcal</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <FaDrumstickBite className="text-red-500 text-xl" />
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Protein</p>
            <p className="font-semibold text-gray-900 dark:text-white">{protein}g</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <FaCarrot className="text-yellow-500 text-xl" />
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Carbs</p>
            <p className="font-semibold text-gray-900 dark:text-white">{carbs}g</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <FaOilCan className="text-blue-500 text-xl" />
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Fat</p>
            <p className="font-semibold text-gray-900 dark:text-white">{fat}g</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <FaWeight className="text-green-500 text-xl" />
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Fiber</p>
            <p className="font-semibold text-gray-900 dark:text-white">{fiber}g</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <GiWaterDrop className="text-blue-500 text-xl" />
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Water</p>
            <p className="font-semibold text-gray-900 dark:text-white">{water}ml</p>
          </div>
        </div>
      </div>

      {/* Detailed breakdown */}
      {showDetails && (
        <div className="mt-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Chi tiết dinh dưỡng</h4>
          <div className="space-y-2">
            {/* Calories breakdown */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">% Calories từ protein</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {Math.round((protein * 4 / calories) * 100)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">% Calories từ carbs</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {Math.round((carbs * 4 / calories) * 100)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">% Calories từ chất béo</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {Math.round((fat * 9 / calories) * 100)}%
              </span>
            </div>

            {/* Progress bars */}
            <div className="mt-4 space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500 dark:text-gray-400">Protein</span>
                  <span className="text-gray-900 dark:text-white">{protein}g / {Math.round(calories * 0.3 / 4)}g</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ width: `${Math.min(100, (protein / (calories * 0.3 / 4)) * 100)}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500 dark:text-gray-400">Carbs</span>
                  <span className="text-gray-900 dark:text-white">{carbs}g / {Math.round(calories * 0.5 / 4)}g</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full" 
                    style={{ width: `${Math.min(100, (carbs / (calories * 0.5 / 4)) * 100)}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500 dark:text-gray-400">Fat</span>
                  <span className="text-gray-900 dark:text-white">{fat}g / {Math.round(calories * 0.2 / 9)}g</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${Math.min(100, (fat / (calories * 0.2 / 9)) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NutritionInfo; 