import { useState, useRef, useEffect, useCallback } from 'react';
import { FaCheck, FaRegEdit, FaRegStickyNote, FaEllipsisV, FaExchangeAlt } from 'react-icons/fa';
import MealNoteModal from './MealNoteModal';
import { createPortal } from 'react-dom';

export default function MealCard({ meal, onComplete, onEdit, onAddNote, showActions = true }) {
  const [showMenu, setShowMenu] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [selectedMealId, setSelectedMealId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuButtonRef = useRef(null);
  const menuRef = useRef(null);

  // Tính toán vị trí menu
  const updateMenuPosition = useCallback(() => {
    if (showMenu && menuButtonRef.current) {
      const buttonRect = menuButtonRef.current.getBoundingClientRect();
      const menuWidth = 192; // w-48 = 12rem = 192px
      const menuHeight = menuRef.current?.offsetHeight || 0;
      
      // Tính toán vị trí ban đầu
      let top = buttonRect.bottom + window.scrollY;
      let left = buttonRect.right - menuWidth;

      // Kiểm tra và điều chỉnh nếu menu vượt ra khỏi viewport
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Điều chỉnh vị trí ngang
      if (left < 0) {
        left = buttonRect.left;
      } else if (left + menuWidth > viewportWidth) {
        left = viewportWidth - menuWidth - 16; // 16px padding
      }

      // Điều chỉnh vị trí dọc
      if (top + menuHeight > window.scrollY + viewportHeight) {
        top = buttonRect.top + window.scrollY - menuHeight;
      }

      setMenuPosition({ top, left });
    }
  }, [showMenu]);

  // Cập nhật vị trí khi menu được hiển thị
  useEffect(() => {
    if (showMenu) {
      updateMenuPosition();
      // Thêm event listener cho scroll và resize
      window.addEventListener('scroll', updateMenuPosition);
      window.addEventListener('resize', updateMenuPosition);
    }

    return () => {
      window.removeEventListener('scroll', updateMenuPosition);
      window.removeEventListener('resize', updateMenuPosition);
    };
  }, [showMenu, updateMenuPosition]);

  // Handle clicking the complete button
  const handleComplete = () => {
    if (!meal.completed && onComplete) {
      onComplete(meal.id);
    }
  };
  
  const handleAddNote = (mealId) => {
    setSelectedMealId(mealId);
    setIsNoteModalOpen(true);
  };
  
  const handleSaveNote = (note) => {
    if (selectedMealId) {
      onAddNote(selectedMealId, note);
    }
    setIsNoteModalOpen(false);
    setSelectedMealId(null);
  };
  
  return (
    <>
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
              <div className="ml-2">
                <button
                  ref={menuButtonRef}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                  }}
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 
                    text-gray-500 dark:text-gray-400 transition-colors"
                >
                  <FaEllipsisV />
                </button>
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
              onClick={() => handleAddNote(meal.id)}
              className="flex-1 py-1.5 bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-800/40 text-yellow-700 dark:text-yellow-300 rounded-lg text-sm transition-colors"
            >
              <FaRegStickyNote className="inline mr-1" /> Ghi chú
            </button>
          </div>
        )}
      </div>
      
      {/* Menu Portal */}
      {showMenu && createPortal(
        <>
          <div 
            className="fixed inset-0 z-[999] bg-transparent"
            onClick={() => setShowMenu(false)}
          />
          <div 
            ref={menuRef}
            className="fixed z-[1000] w-48 rounded-lg shadow-lg bg-white dark:bg-gray-800 
              ring-1 ring-black ring-opacity-5 overflow-hidden"
            style={{ 
              top: `${menuPosition.top}px`, 
              left: `${menuPosition.left}px`,
              transform: 'translate3d(0, 0, 0)', // Tối ưu performance
            }}
          >
            <div 
              className="py-1 divide-y divide-gray-100 dark:divide-gray-700"
              role="menu" 
              aria-orientation="vertical"
            >
              {!meal.completed && (
                <button
                  onClick={() => {
                    handleComplete();
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 
                    hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center transition-colors"
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
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 
                  hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center transition-colors"
              >
                <FaRegEdit className="mr-2 text-blue-600 dark:text-blue-500" />
                Chỉnh sửa bữa ăn
              </button>
              <button
                onClick={() => {
                  handleAddNote(meal.id);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 
                  hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center transition-colors"
              >
                <FaRegStickyNote className="mr-2 text-yellow-600 dark:text-yellow-500" />
                {meal.note ? 'Sửa ghi chú' : 'Thêm ghi chú'}
              </button>
              <button
                onClick={() => {
                  // Xử lý xem món thay thế
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 
                  hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center transition-colors"
              >
                <FaExchangeAlt className="mr-2 text-purple-600 dark:text-purple-500" />
                Xem món thay thế
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
      
      <MealNoteModal 
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        onSaveNote={handleSaveNote}
        initialNote={meal.note}
      />
    </>
  );
} 