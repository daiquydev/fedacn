import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserFriends, FaChevronDown, FaChevronUp, FaUserCircle } from 'react-icons/fa';
import useravatar from '../assets/images/useravatar.jpg';

/**
 * Participant avatar list with expandable functionality
 * Shows avatars of participants with emphasis on followed users
 * 
 * @param {Object} props
 * @param {Array} props.participants - List of participants with name, avatar, id, and isFollowed properties
 * @param {Number} props.initialLimit - Number of avatars to show initially (default: 3)
 * @param {String} props.title - Optional title for the component
 * @param {String} props.size - Size of avatars (sm, md, lg) - default: md
 * @param {Boolean} props.showCount - Whether to show the total count (default: true)
 */
const ParticipantsList = ({ 
  participants = [], 
  initialLimit = 3, 
  title = "Người tham gia", 
  size = "md",
  showCount = true
}) => {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  
  // Return early if there are no participants
  if (!participants.length) {
    return null;
  }
  
  // Get followed participants and sort them to the front
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.isFollowed && !b.isFollowed) return -1;
    if (!a.isFollowed && b.isFollowed) return 1;
    return 0;
  });
  
  // Determine how many to show
  const visibleParticipants = expanded 
    ? sortedParticipants 
    : sortedParticipants.slice(0, initialLimit);
  
  const remainingCount = sortedParticipants.length - visibleParticipants.length;
  
  // Handle avatar size classes
  const sizeClasses = {
    sm: {
      avatar: "w-6 h-6",
      container: "space-x-1",
      margin: "-ml-1",
      badge: "w-2 h-2 -right-0.5 -top-0.5",
      badgeText: "text-[8px]",
    },
    md: {
      avatar: "w-8 h-8",
      container: "space-x-1.5",
      margin: "-ml-2",
      badge: "w-3 h-3 -right-0.5 -top-0.5",
      badgeText: "text-[10px]",
    },
    lg: {
      avatar: "w-10 h-10",
      container: "space-x-2",
      margin: "-ml-3",
      badge: "w-3.5 h-3.5 right-0 top-0",
      badgeText: "text-xs",
    }
  }[size] || sizeClasses.md;
  
  // Navigate to user profile
  const goToProfile = (userId) => {
    navigate(`/profile/${userId}`);
  };
  
  return (
    <div className="inline-flex flex-col">
      {title && (
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
          <FaUserFriends className="mr-1.5" />
          <span>{title}</span>
          {showCount && <span className="ml-1">({participants.length})</span>}
        </div>
      )}
      
      <div className="flex items-center">
        <div className={`flex ${sizeClasses.container}`}>
          {visibleParticipants.map((participant, index) => (
            <div 
              key={participant.id || index} 
              className={`relative ${index > 0 ? sizeClasses.margin : ''}`}
              onClick={() => goToProfile(participant.id)}
            >
              <div className="relative group cursor-pointer">
                <img 
                  src={participant.avatar || useravatar} 
                  alt={participant.name} 
                  className={`${sizeClasses.avatar} rounded-full object-cover border-2 ${participant.isFollowed ? 'border-blue-400 dark:border-blue-500' : 'border-gray-200 dark:border-gray-700'}`}
                />
                
                {/* Follow status indicator */}
                {participant.isFollowed && (
                  <div className={`absolute ${sizeClasses.badge} bg-blue-500 border border-white dark:border-gray-800 rounded-full`}></div>
                )}
                
                {/* Online status indicator */}
                {participant.isOnline && (
                  <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800`}></div>
                )}
                
                {/* Hover tooltip with name */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-1 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                  {participant.name}
                  {participant.isFollowed && (
                    <span className="ml-1 text-blue-300">• Đang theo dõi</span>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {/* Show remaining count if not expanded */}
          {!expanded && remainingCount > 0 && (
            <div 
              className={`${sizeClasses.avatar} rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center cursor-pointer text-gray-600 dark:text-gray-300 ${sizeClasses.margin}`}
              onClick={() => setExpanded(true)}
            >
              <span className={sizeClasses.badgeText}>+{remainingCount}</span>
            </div>
          )}
        </div>
        
        {/* Toggle expand/collapse if more than initialLimit */}
        {participants.length > initialLimit && (
          <button 
            className="ml-2 text-xs text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 flex items-center"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                <FaChevronUp className="mr-1" />
                Thu gọn
              </>
            ) : (
              <>
                <FaChevronDown className="mr-1" />
                Xem thêm
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default ParticipantsList; 