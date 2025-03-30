import { useState } from 'react';
import { FaCheck, FaRegEdit, FaRegStickyNote, FaEllipsisV, FaExchangeAlt } from 'react-icons/fa';

export default function MealCard({ meal, onComplete, onEdit, onAddNote, showActions = true }) {
  const [showMenu, setShowMenu] = useState(false);
  
  // Handle clicking the complete button
  const handleComplete = () => {
    if (!meal.completed && onComplete) {
      onComplete(meal.id);
    }
  };
  
  return (
    <div 
      className={`rounded-xl overflow-hidden ${
        meal.completed 
          ? 'bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30'
          : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700'
      }`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center">
              <span 
                className={`inline-block px-2 py-1 text-xs rounded-md mr-2 ${
                  meal.completed
                    ? 'bg-green-200 dark:bg-green-800/40 text-green-700 dark:text-green-300'
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                }`}
              >
                {meal.type}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {meal.time}
              </span>
            </div>
            
            <h3 className={`mt-2 font-medium ${
              meal.completed
                ? 'text-green-700 dark:text-green-300'
                : 'text-gray-900 dark:text-white'
            }`}>
              {meal.name}
            </h3>
            
            <div className="mt-1 flex items-center">
              <span className={`text-sm ${
                meal.completed
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                {meal.calories} kcal
              </span>
              {meal.completed && (
                <span className="ml-2 inline-flex items-center text-xs text-green-600 dark:text-green-400">
                  <FaCheck className="mr-1" /> Đã hoàn thành
                </span>
              )}
            </div>
            
            {meal.note && (
              <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800/30 rounded-lg text-sm text-gray-700 dark:text-gray-300">
                <p className="italic">"{meal.note}"</p>
              </div>
            )}
          </div>
          
          {showActions && (
            <div className="relative ml-2">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
              >
                <FaEllipsisV />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 shadow-lg rounded-lg py-1 z-10 border border-gray-200 dark:border-gray-700">
                  {!meal.completed && (
                    <button
                      onClick={() => {
                        handleComplete();
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                    >
                      <FaCheck className="mr-2 text-green-600 dark:text-green-500" />
                      Đánh dấu đã hoàn thành
                    </button>
                  )}
                  <button
                    onClick={() => {
                      onEdit(meal.id);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  >
                    <FaRegEdit className="mr-2 text-blue-600 dark:text-blue-500" />
                    Chỉnh sửa bữa ăn
                  </button>
                  <button
                    onClick={() => {
                      onAddNote(meal.id);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  >
                    <FaRegStickyNote className="mr-2 text-yellow-600 dark:text-yellow-500" />
                    {meal.note ? 'Sửa ghi chú' : 'Thêm ghi chú'}
                  </button>
                  <button
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  >
                    <FaExchangeAlt className="mr-2 text-purple-600 dark:text-purple-500" />
                    Xem món thay thế
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Action buttons at the bottom */}
      {showActions && !meal.completed && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700 flex justify-between">
          <button
            onClick={handleComplete}
            className="flex-1 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors mr-2"
          >
            <FaCheck className="inline mr-1" /> Hoàn thành
          </button>
          <button
            onClick={() => onAddNote(meal.id)}
            className="flex-1 py-1.5 bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-800/40 text-yellow-700 dark:text-yellow-300 rounded-lg text-sm transition-colors"
          >
            <FaRegStickyNote className="inline mr-1" /> Ghi chú
          </button>
        </div>
      )}
    </div>
  );
} 