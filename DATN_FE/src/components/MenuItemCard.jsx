import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUtensils, FaClock, FaStar, FaUsers } from 'react-icons/fa';
import { BiTimeFive } from 'react-icons/bi';
import { MdRestaurantMenu } from 'react-icons/md';
import ParticipantsList from './ParticipantsList';

/**
 * MenuItemCard component for displaying meal items with participants
 * 
 * @param {Object} props
 * @param {Object} props.item - The menu item data to display
 * @param {Array} props.participants - Participants data with follow status
 * @param {Function} props.onSave - Optional function to call when user saves the menu item
 */
const MenuItemCard = ({ item, participants = [], onSave }) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate(`/menu/${item.id}`);
  };
  
  const handleSave = (e) => {
    e.stopPropagation();
    if (onSave) onSave(item.id);
  };
  
  // Calculate ratings
  const rating = item.rating || 4.5;
  const totalReviews = item.reviews || 120;
  
  // Sample dummy participants data with follow status
  const getDummyParticipants = (item) => {
    // Generate random participant data based on item ID for demo
    const seed = parseInt(item.id) || 0;
    const count = (seed % 3) + 3; // 3-5 participants
    
    // Hardcoded followed users (in a real app, this would come from user's follow list)
    const followedIds = [1, 3, 5, 7];
    
    const participants = [];
    for (let i = 0; i < count; i++) {
      const id = ((seed + i) % 10) + 1;
      participants.push({
        id,
        name: `Người dùng ${id}`,
        avatar: "", // Empty for default avatar
        isFollowed: followedIds.includes(id)
      });
    }
    
    return participants;
  };
  
  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700"
      onClick={handleClick}
    >
      {/* Menu Item Image */}
      <div className="relative h-48">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover"
        />
        
        {/* Category Badge */}
        <div className="absolute top-3 left-3 bg-white dark:bg-gray-900 text-green-500 font-medium px-3 py-1 rounded-full text-sm flex items-center">
          <FaUtensils className="mr-1" />
          <span>{item.category || 'Món ăn'}</span>
        </div>
        
        {/* Time Badge */}
        <div className="absolute top-3 right-3 bg-white dark:bg-gray-900 text-blue-500 font-medium px-3 py-1 rounded-full text-sm flex items-center">
          <BiTimeFive className="mr-1" />
          <span>{item.prepTime || '30 phút'}</span>
        </div>
      </div>
      
      {/* Menu Item Details */}
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">
          {item.name}
        </h3>
        
        {/* Nutrition & Ratings */}
        <div className="flex justify-between items-center mb-3">
          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
            <MdRestaurantMenu className="mr-1" />
            <span>{item.calories || '350'} calo</span>
          </div>
          
          <div className="flex items-center">
            <FaStar className="text-yellow-400 mr-1" />
            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
              {rating} ({totalReviews})
            </span>
          </div>
        </div>
        
        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
          {item.description || 'Một món ăn bổ dưỡng và dễ chế biến, phù hợp với mọi chế độ ăn uống.'}
        </p>
        
        {/* Participants List */}
        <div className="mb-4">
          <ParticipantsList 
            participants={participants.length > 0 ? participants : getDummyParticipants(item)} 
            initialLimit={3}
            size="sm"
            title="Người đã thử"
          />
        </div>
        
        {/* Save Button */}
        <div className="mt-auto pt-2 border-t border-gray-100 dark:border-gray-700">
          {item.isSaved ? (
            <button 
              onClick={handleSave}
              className="w-full py-2 bg-green-50 text-green-600 rounded-md text-sm font-medium flex justify-center items-center space-x-2 dark:bg-green-900/20 dark:text-green-400"
            >
              <span>Đã lưu vào bộ sưu tập</span>
            </button>
          ) : (
            <button 
              onClick={handleSave}
              className="w-full py-2 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm font-medium transition-colors flex justify-center items-center space-x-2"
            >
              <span>Lưu món ăn này</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuItemCard; 