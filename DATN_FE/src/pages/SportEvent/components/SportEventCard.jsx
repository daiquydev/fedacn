import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMapMarkerAlt, FaCalendarAlt, FaClock, FaPlus } from 'react-icons/fa';
import { MdVideocam, MdCheckCircle, MdSportsScore } from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { BsClockHistory, BsCalendarCheck } from 'react-icons/bs';
import moment from 'moment';
import ParticipantsList from '../../../components/ParticipantsList';
import { getImageUrl } from '../../../utils/imageUrl';
import useravatar from '../../../assets/images/useravatar.jpg';

/**
 * Sport Event Card
 *
 * @param {Object} props.event
 * @param {Function} props.onJoin
 * @param {Boolean} props.isJoining
 * @param {Set}    props.friendIds     - Set of friend IDs (mutual follow)
 * @param {Set}    props.connectedIds  - Set of all connected IDs (friends + followings + followers)
 */
const SportEventCard = ({ event, onJoin, isJoining, friendIds = new Set(), connectedIds = new Set(), CategoryIcon }) => {
  const navigate = useNavigate();

  // Map participants_ids to ParticipantsList format
  const eventParticipants = (event.participants_ids || []).map(p => ({
    id: p._id || p,
    name: p.name || 'Người dùng',
    avatar: p.avatar ? getImageUrl(p.avatar) : useravatar,
  }));

  const handleClick = () => navigate(`/sport-event/${event._id}`);
  const handleJoin = (e) => { e.stopPropagation(); if (onJoin) onJoin(event._id); };

  const isOnline = event.eventType === 'Trong nhà';
  const eventDate = moment(event.startDate);
  const isEnded = event.endDate && moment().startOf('day').isAfter(moment(event.endDate).endOf('day'));
  const isNotStarted = event.startDate && moment().startOf('day').isBefore(moment(event.startDate).startOf('day'));

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700 flex flex-col h-full"
      onClick={handleClick}
    >
      {/* Event Image */}
      <div className="relative h-48">
        <img src={event.image} alt={event.name} className="w-full h-full object-cover" />

        {/* Type Badge */}
        <div className="absolute top-3 left-3 bg-white dark:bg-gray-900 text-blue-500 font-medium px-3 py-1 rounded-full text-sm flex items-center">
          {isOnline ? (
            <><MdVideocam className="mr-1" /><span>Trong nhà</span></>
          ) : (
            <><FaMapMarkerAlt className="mr-1" /><span>Ngoài trời</span></>
          )}
        </div>

        {/* Count Badge */}
        <div className="absolute top-3 right-3 bg-white dark:bg-gray-900 text-red-500 font-medium px-3 py-1 rounded-full text-sm">
          {event.participants}/{event.maxParticipants} người
        </div>

        {/* Status Badge */}
        <div className={`absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${
          isEnded
            ? 'bg-gray-800/70 text-gray-300'
            : isNotStarted
              ? 'bg-amber-500/80 text-white'
              : 'bg-emerald-500/80 text-white'
        }`}>
          {isEnded ? (
            <><BsClockHistory className="text-[10px]" /> Đã kết thúc</>
          ) : isNotStarted ? (
            <><BsCalendarCheck className="text-[10px]" /> Sắp diễn ra</>
          ) : (
            <><span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Đang diễn ra</>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white line-clamp-2">{event.name}</h3>

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
            {isOnline ? <MdVideocam className="mr-2" /> : <FaMapMarkerAlt className="mr-2" />}
            <span className="truncate">{event.location}</span>
          </div>
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            {CategoryIcon ? <CategoryIcon className="mr-2" /> : <MdSportsScore className="mr-2" />}
            <span>{event.category}</span>
            {event.difficulty && (() => {
              const map = { easy: '😊 Dễ', medium: '💪 TB', hard: '🔥 Khó', expert: '🏆 Pro' }
              const colors = { easy: 'bg-green-100 text-green-600', medium: 'bg-yellow-100 text-yellow-600', hard: 'bg-orange-100 text-orange-600', expert: 'bg-red-100 text-red-600' }
              return <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${colors[event.difficulty] || ''}`}>{map[event.difficulty] || event.difficulty}</span>
            })()}
          </div>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">{event.description}</p>

        {/* Participants avatars with social rings */}
        {eventParticipants.length > 0 && (
          <div className="mb-4" onClick={(e) => e.stopPropagation()}>
            <ParticipantsList
              participants={eventParticipants}
              initialLimit={4}
              size="sm"
              title={null}
              showCount={false}
              friendIds={friendIds}
              connectedIds={connectedIds}
            />
          </div>
        )}

        {/* Join Button */}
        <div className="mt-auto pt-2 border-t border-gray-100 dark:border-gray-700">
          {event.isJoined ? (
            <button
              onClick={(e) => e.stopPropagation()}
              className="w-full py-2 bg-green-50 text-green-600 rounded-md text-sm font-bold flex justify-center items-center cursor-default dark:bg-green-900/20 dark:text-green-400 gap-2"
            >
              <MdCheckCircle /> Đã tham gia
            </button>
          ) : isEnded ? (
            <button onClick={(e) => e.stopPropagation()} className="w-full py-2 bg-gray-200 text-gray-500 rounded-md text-sm font-bold flex justify-center items-center cursor-default dark:bg-gray-700 dark:text-gray-400 gap-2">
              Sự kiện đã kết thúc
            </button>
          ) : isNotStarted ? (
            <button onClick={(e) => e.stopPropagation()} className="w-full py-2 bg-gray-200 text-gray-500 rounded-md text-sm font-bold flex justify-center items-center cursor-default dark:bg-gray-700 dark:text-gray-400 gap-2">
              Sự kiện chưa bắt đầu
            </button>
          ) : (event.maxParticipants > 0 && event.participants >= event.maxParticipants) ? (
            <button onClick={(e) => e.stopPropagation()} className="w-full py-2 bg-gray-200 text-gray-500 rounded-md text-sm font-bold flex justify-center items-center cursor-default dark:bg-gray-700 dark:text-gray-400 gap-2">
              Đã đầy chỗ
            </button>
          ) : (
            <button
              onClick={handleJoin}
              disabled={isJoining}
              className="w-full py-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {isJoining ? <AiOutlineLoading3Quarters className="animate-spin" /> : <FaPlus className="text-xs" />}
              Tham gia ngay
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SportEventCard;