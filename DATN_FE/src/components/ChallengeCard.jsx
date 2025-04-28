import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaMedal, FaTrophy, FaUsers } from 'react-icons/fa';
import { MdOutlineQueryBuilder } from 'react-icons/md';
import { IoMdFitness } from 'react-icons/io';
import moment from 'moment';
import ParticipantsList from './ParticipantsList';

/**
 * ChallengeCard component for displaying community challenges with participants
 * 
 * @param {Object} props
 * @param {Object} props.challenge - The challenge data to display
 * @param {Array} props.participants - Participants data with follow status
 * @param {Function} props.onJoin - Function to call when user joins the challenge
 */
const ChallengeCard = ({ challenge, participants = [], onJoin }) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate(`/challenge/${challenge.id}`);
  };
  
  const handleJoin = (e) => {
    e.stopPropagation();
    if (onJoin) onJoin(challenge.id);
  };
  
  // Format dates
  const startDate = moment(challenge.startDate);
  const endDate = moment(challenge.endDate);
  const duration = endDate.diff(startDate, 'days');
  
  // Determine challenge status
  const now = moment();
  let statusBadge = null;
  
  if (now.isBefore(startDate)) {
    statusBadge = (
      <div className="absolute top-3 right-3 bg-yellow-100 text-yellow-700 font-medium px-3 py-1 rounded-full text-sm dark:bg-yellow-900/30 dark:text-yellow-400">
        Sắp diễn ra
      </div>
    );
  } else if (now.isAfter(endDate)) {
    statusBadge = (
      <div className="absolute top-3 right-3 bg-gray-100 text-gray-700 font-medium px-3 py-1 rounded-full text-sm dark:bg-gray-700 dark:text-gray-300">
        Đã kết thúc
      </div>
    );
  } else {
    statusBadge = (
      <div className="absolute top-3 right-3 bg-green-100 text-green-700 font-medium px-3 py-1 rounded-full text-sm dark:bg-green-900/30 dark:text-green-400">
        Đang diễn ra
      </div>
    );
  }
  
  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700"
      onClick={handleClick}
    >
      {/* Challenge Image */}
      <div className="relative h-48">
        <img
          src={challenge.image}
          alt={challenge.name}
          className="w-full h-full object-cover"
        />
        
        {/* Category Badge */}
        <div className="absolute top-3 left-3 bg-white dark:bg-gray-900 text-blue-500 font-medium px-3 py-1 rounded-full text-sm flex items-center">
          <IoMdFitness className="mr-1" />
          <span>{challenge.category || 'Thử thách'}</span>
        </div>
        
        {/* Status Badge */}
        {statusBadge}
      </div>
      
      {/* Challenge Details */}
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white line-clamp-2">
          {challenge.name}
        </h3>
        
        <div className="space-y-2 mb-3">
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <FaCalendarAlt className="mr-2" />
            <span>{startDate.format('DD/MM/YYYY')} - {endDate.format('DD/MM/YYYY')}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <MdOutlineQueryBuilder className="mr-2" />
            <span>{duration} ngày</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <FaTrophy className="mr-2" />
            <span>{challenge.targetValue} {challenge.targetUnit}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <FaMedal className="mr-2" />
            <span>{challenge.difficulty || 'Trung bình'}</span>
          </div>
        </div>
        
        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
          {challenge.description}
        </p>
        
        {/* Participants list */}
        <div className="mb-4">
          <ParticipantsList 
            participants={participants} 
            initialLimit={4}
            size="sm"
            title={`${challenge.participants || challenge.participantCount || 0} người tham gia`}
            showCount={false}
          />
        </div>
        
        {/* Join button */}
        <div className="mt-auto pt-2 border-t border-gray-100 dark:border-gray-700">
          {challenge.isJoined ? (
            <button 
              className="w-full py-2 bg-green-50 text-green-600 rounded-md text-sm font-medium flex justify-center items-center cursor-default dark:bg-green-900/20 dark:text-green-400"
            >
              Đã tham gia
            </button>
          ) : (
            <button 
              onClick={handleJoin}
              className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-medium transition-colors"
            >
              Tham gia ngay
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChallengeCard; 