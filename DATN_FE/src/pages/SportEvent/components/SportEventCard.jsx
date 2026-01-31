import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMapMarkerAlt, FaRunning, FaCalendarAlt, FaClock, FaPlus } from 'react-icons/fa';
import { MdVideocam, MdCheckCircle } from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import moment from 'moment';
import ParticipantsList from '../../../components/ParticipantsList';

/**
 * Sport Event Card component for displaying event details with participants
 * 
 * @param {Object} props
 * @param {Object} props.event - The event data to display
 * @param {Array} props.participants - Participants data with follow status
 * @param {Function} props.onJoin - Function to call when user joins the event
 * @param {Boolean} props.isJoining - Whether the join mutation is in progress
 */
const SportEventCard = ({ event, participants = [], onJoin, isJoining }) => {
  const navigate = useNavigate();
  
  // Use participants from API or fallback to event.participants_ids data
  const eventParticipants = event.participants_ids?.map(p => ({
    id: p._id,
    name: p.name,
    avatar: p.avatar,
    isFollowed: false
  })) || [];
  
  const handleClick = () => {
    navigate(`/sport-event/${event._id}`);
  };
  
  const handleJoin = (e) => {
    e.stopPropagation(); // Prevent triggering card click
    if (onJoin) onJoin(event._id);
  };
  
  const isOnline = event.eventType === 'online';
  const eventDate = moment(event.startDate);
  
  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700"
      onClick={handleClick}
    >
      {/* Event Image */}
      <div className="relative h-48">
        <img
          src={event.image}
          alt={event.name}
          className="w-full h-full object-cover"
        />
        {/* Event Type Badge */}
        <div className="absolute top-3 left-3 bg-white dark:bg-gray-900 text-blue-500 font-medium px-3 py-1 rounded-full text-sm flex items-center">
          {isOnline ? (
            <>
              <MdVideocam className="mr-1" />
              <span>Trực tuyến</span>
            </>
          ) : (
            <>
              <FaMapMarkerAlt className="mr-1" />
              <span>Trực tiếp</span>
            </>
          )}
        </div>
        
        {/* Participants Count Badge */}
        <div className="absolute top-3 right-3 bg-white dark:bg-gray-900 text-red-500 font-medium px-3 py-1 rounded-full text-sm">
          {event.participants}/{event.maxParticipants} người tham gia
        </div>
      </div>
      
      {/* Event Details */}
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white line-clamp-2">
          {event.name}
        </h3>
        
        <div className="space-y-2 mb-3">
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <FaCalendarAlt className="mr-2" />
            <span>{eventDate.format('DD/MM/YYYY')}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <FaClock className="mr-2" />
            <span>{eventDate.format('HH:mm')}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            {isOnline ? (
              <MdVideocam className="mr-2" />
            ) : (
              <FaMapMarkerAlt className="mr-2" />
            )}
            <span className="truncate">{event.location}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <FaRunning className="mr-2" />
            <span>{event.category}</span>
          </div>
        </div>
        
        {/* Event Description */}
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
          {event.description}
        </p>
        
        {/* Participants list */}
        <div className="mb-4">
          <ParticipantsList 
            participants={eventParticipants} 
            initialLimit={4}
            size="sm"
          />
        </div>
        
        {/* Join button */}
        <div className="mt-auto pt-2 border-t border-gray-100 dark:border-gray-700">
          {event.isJoined ? (
            <button 
              className="w-full py-2 bg-green-50 text-green-600 rounded-md text-sm font-bold flex justify-center items-center cursor-default dark:bg-green-900/20 dark:text-green-400 gap-2"
            >
              <MdCheckCircle />
              Đã tham gia
            </button>
          ) : (
            <button 
              onClick={handleJoin}
              disabled={isJoining || event.participants >= event.maxParticipants}
              className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {isJoining ? (
                <AiOutlineLoading3Quarters className="animate-spin" />
              ) : (
                <FaPlus className="text-xs" />
              )}
              {event.participants >= event.maxParticipants ? 'Đã đầy chỗ' : 'Tham gia ngay'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SportEventCard; 