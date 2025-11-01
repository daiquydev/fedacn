import { FaCalendarAlt, FaRegCalendarCheck, FaRegClock, FaEllipsisV, FaTrashAlt, FaEye } from 'react-icons/fa';
import { useState } from 'react';
import { getImageUrl } from '../../../../utils/imageUrl';

export default function MealPlanCard({ mealPlan, onApply, onRemove, onView }) {
  const [showOptions, setShowOptions] = useState(false);
  
  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden transition-all hover:shadow-lg">
      {/* Top section with image */}
      <div className="relative h-48">
        <img 
          src={getImageUrl(mealPlan.image) || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'} 
          alt={mealPlan.title} 
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
        
        {/* Options button */}
        <div className="absolute top-2 right-2">
          <button 
            className="p-2 bg-black/30 hover:bg-black/50 rounded-full text-white"
            onClick={() => setShowOptions(!showOptions)}
          >
            <FaEllipsisV />
          </button>
          
          {/* Dropdown menu */}
          {showOptions && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10">
              <div className="py-1">
                <button 
                  onClick={() => {
                    onView();
                    setShowOptions(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                >
                  <FaEye className="mr-2" /> Xem chi tiết
                </button>
                <button 
                  onClick={() => {
                    onRemove();
                    setShowOptions(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                >
                  <FaTrashAlt className="mr-2" /> Xóa thực đơn
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Title and category */}
        <div className="absolute bottom-0 left-0 p-4">
          <span className="inline-block px-2 py-1 text-xs font-medium bg-green-600 text-white rounded-md mb-2">
            {mealPlan.category}
          </span>
          <h3 className="text-lg font-bold text-white line-clamp-2">
            {mealPlan.title}
          </h3>
        </div>
      </div>
      
      {/* Content section */}
      <div className="p-4">
        <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-3">
          {mealPlan.description}
        </p>
        
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-4 mb-3">
          <div className="flex items-center">
            <FaRegClock className="mr-1" />
            <span>{mealPlan.duration} ngày</span>
          </div>
          <div>
            <span>{mealPlan.calories} kcal/ngày</span>
          </div>
        </div>
        
        {/* Progress or Apply button */}
        {mealPlan.isApplied ? (
          <div className="mb-4">
            <div className="flex justify-between items-center text-sm mb-1">
              <span className="text-gray-700 dark:text-gray-300">Tiến độ</span>
              <span className="font-medium text-blue-600 dark:text-blue-400">{mealPlan.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
              <div 
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full" 
                style={{ width: `${mealPlan.progress}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Bắt đầu: {formatDate(mealPlan.startDate)}</span>
              <span>Kết thúc: {formatDate(mealPlan.endDate)}</span>
            </div>
          </div>
        ) : (
          <button
            onClick={onApply}
            className="w-full py-2 mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center"
          >
            <FaCalendarAlt className="mr-2" /> Áp dụng thực đơn
          </button>
        )}
        
        {/* Bottom info */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center">
            <img 
              src={getImageUrl(mealPlan.author.avatar) || 'https://randomuser.me/api/portraits/men/32.jpg'} 
              alt={mealPlan.author.name} 
              className="w-6 h-6 rounded-full mr-2"
              onError={(e) => {
                e.target.src = 'https://randomuser.me/api/portraits/men/32.jpg';
              }}
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {mealPlan.author.name}
            </span>
          </div>
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <FaRegCalendarCheck className="mr-1" />
            <span>Đã lưu: {formatDate(mealPlan.savedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
} 