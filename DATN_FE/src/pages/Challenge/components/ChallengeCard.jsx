import React from 'react';
import { Link } from 'react-router-dom';
import { FaUsers, FaCalendarAlt, FaCheck, FaTrophy, FaRegClock, FaSync, FaRunning, FaSwimmer, FaBiking, FaMedal } from 'react-icons/fa';
import { MdDirectionsWalk, MdFitnessCenter, MdSportsGymnastics, MdMonitorHeart } from 'react-icons/md';
import { GiNightSleep } from 'react-icons/gi';
import { BsSmartwatch } from 'react-icons/bs';
import moment from 'moment';
import { getCategoryIcon, getStatusColor } from './ChallengeUtils';
import ParticipantsList from '../../../components/ParticipantsList';
import useravatar from '../../../assets/images/useravatar.jpg';

// Sử dụng ngày giả lập từ file Challenge.jsx
const SIMULATED_CURRENT_DATE = new Date('2025-03-12T17:00:00');

// Sample dummy participants data with follow status
const getDummyParticipants = (challenge) => {
  // Ensure the number of participants matches the challenge.participants count
  const participantsCount = challenge.participants || 0;
  
  // If no participants, return empty array
  if (participantsCount === 0) {
    return [];
  }
  
  // Generate up to 10 participants maximum (for UI purposes)
  const count = Math.min(participantsCount, 10);
  
  // Hardcoded followed users (in a real app, this would come from user's follow list)
  const followedIds = [1, 3, 5, 7];
  
  const participants = [];
  const seed = parseInt(challenge.id) || 0;
  
  for (let i = 0; i < count; i++) {
    const id = ((seed + i) % participantsCount) + 1;
    participants.push({
      id,
      name: `Người tham gia ${id}`,
      avatar: "", // Empty for default avatar
      isFollowed: followedIds.includes(id)
    });
  }
  
  return participants;
};

// Hàm xác định loại dữ liệu từ đồng hồ thông minh cần cho thử thách
const getSmartWatchDataType = (category) => {
  switch (category) {
    case 'running':
      return { 
        icon: <FaRunning className="mr-1" />, 
        text: 'Dữ liệu chạy bộ',
        metrics: ['Quãng đường', 'Nhịp tim', 'Calories']
      };
    case 'walking':
      return { 
        icon: <MdDirectionsWalk className="mr-1" />, 
        text: 'Dữ liệu đi bộ',
        metrics: ['Số bước chân', 'Quãng đường', 'Calories'] 
      };
    case 'cycling':
      return { 
        icon: <FaBiking className="mr-1" />, 
        text: 'Dữ liệu đạp xe',
        metrics: ['Quãng đường', 'Tốc độ', 'Calories'] 
      };
    case 'swimming':
      return { 
        icon: <FaSwimmer className="mr-1" />, 
        text: 'Dữ liệu bơi lội',
        metrics: ['Vòng bơi', 'Quãng đường', 'Calories'] 
      };
    case 'gym':
      return { 
        icon: <MdFitnessCenter className="mr-1" />, 
        text: 'Dữ liệu tập gym',
        metrics: ['Thời gian tập', 'Nhịp tim', 'Calories'] 
      };
    case 'hiit':
      return { 
        icon: <MdSportsGymnastics className="mr-1" />, 
        text: 'Dữ liệu HIIT',
        metrics: ['Thời gian tập', 'Nhịp tim', 'Calories'] 
      };
    case 'sleep':
      return { 
        icon: <GiNightSleep className="mr-1" />, 
        text: 'Dữ liệu giấc ngủ',
        metrics: ['Thời gian ngủ', 'Chất lượng', 'Ngủ sâu'] 
      };
    default:
      return { 
        icon: <MdMonitorHeart className="mr-1" />, 
        text: 'Dữ liệu sức khỏe',
        metrics: ['Hoạt động', 'Calories', 'Nhịp tim'] 
      };
  }
};

const ChallengeCard = ({ challenge, categoryIcon, periodicLabel }) => {
  // Calculate days left using simulated date
  const today = moment(SIMULATED_CURRENT_DATE);
  const startDate = moment(challenge.startDate);
  const endDate = moment(challenge.endDate);
  const rawDaysLeft = endDate.diff(today, 'days');
  const daysLeft = rawDaysLeft < 0 ? 0 : rawDaysLeft;

  // Use pre-calculated status (or calculate if not provided)
  const calculatedStatus = challenge.calculatedStatus || (() => {
    if (today.isBefore(startDate)) {
      return 'upcoming';
    } else if (today.isAfter(endDate)) {
      return 'completed';
    } else {
      return 'ongoing';
    }
  })();

  // Calculate progress bar percentage
  let progressBarWidth = 0;
  if (calculatedStatus === 'ongoing') {
    const totalDays = endDate.diff(startDate, 'days');
    const daysPassed = today.diff(startDate, 'days');
    progressBarWidth = Math.min(Math.max((daysPassed / totalDays) * 100, 0), 100);
  } else if (calculatedStatus === 'completed') {
    progressBarWidth = 100;
  }

  // Generate participants data for the challenge
  const participants = getDummyParticipants(challenge);

  return (
    <Link
      to={`/challenge/${challenge.id}`}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={challenge.image}
          alt={challenge.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-0 left-0 m-3">
          <span className="px-3 py-1 bg-white dark:bg-gray-800 text-green-600 rounded-full text-sm font-medium flex items-center">
            {categoryIcon} {challenge.category.charAt(0).toUpperCase() + challenge.category.slice(1)}
          </span>
        </div>
        
        {/* Status Badge */}
        <div className="absolute top-0 right-0 m-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(calculatedStatus)}`}>
            {calculatedStatus === 'upcoming' ? 'Sắp diễn ra' : 
             calculatedStatus === 'ongoing' ? 'Đang diễn ra' : 'Đã kết thúc'}
          </span>
        </div>
        
        {/* Smartwatch Connected Badge - if challenge is joined and has sync */}
        {challenge.isJoined && challenge.status !== 'upcoming' && (
          <div className="absolute bottom-3 right-3">
            <span className="px-3 py-1 bg-blue-500 dark:bg-blue-600 text-white rounded-full text-xs font-medium flex items-center">
              <BsSmartwatch className="mr-1" /> Đã kết nối
            </span>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
          <h3 className="text-white text-lg font-bold">{challenge.title}</h3>
        </div>
      </div>
      
      <div className="p-4">
        <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{challenge.description}</p>
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <FaUsers className="mr-1" />
            <span>{challenge.participants} người tham gia</span>
          </div>
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <FaCalendarAlt className="mr-1" />
            <span>
              {calculatedStatus === 'ongoing'
                ? `Còn ${daysLeft} ngày`
                : calculatedStatus === 'upcoming'
                ? `Bắt đầu sau ${moment(challenge.startDate).diff(today, 'days')} ngày`
                : 'Đã kết thúc'}
            </span>
          </div>
        </div>
        
        {/* 
          XÓA HOÀN TOÀN PHẦN NÀY NẾU KHÔNG ĐÃ THAM GIA 
          Chỉ hiển thị khi challenge.isJoined là true 
        */}
        {challenge.isJoined === true && calculatedStatus !== 'upcoming' && (
          <div className="mb-3">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div
                className="bg-green-600 h-2.5 rounded-full"
                style={{ width: `${challenge.progress}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-1 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center">
                <BsSmartwatch className="text-blue-500 mr-1" /> Tiến độ tự động
              </span>
              <span>{challenge.progress}%</span>
            </div>
          </div>
        )}
        
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
            <FaCalendarAlt className="mr-2" />
            <span>{moment(challenge.startDate).format('DD/MM/YYYY')} - {moment(challenge.endDate).format('DD/MM/YYYY')}</span>
          </div>
          
          <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
            <FaRegClock className="mr-2" />
            <span>{moment(challenge.endDate).diff(moment(challenge.startDate), 'days')} ngày</span>
          </div>
          
          {challenge.isPeriodic && (
            <div className="flex items-center text-blue-500 dark:text-blue-400 text-sm">
              <FaTrophy className="mr-2" />
              <span>{challenge.periodicType === 'monthly' ? 'Hàng tháng' : 'Hàng tuần'}</span>
            </div>
          )}
        </div>
        
        {/* Progress Bar for ongoing challenges */}
        {calculatedStatus === 'ongoing' && (
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600 dark:text-gray-300">Tiến độ</span>
              <span className="font-medium text-blue-600 dark:text-blue-400">{Math.round(progressBarWidth)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
              <div 
                className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full" 
                style={{ width: `${progressBarWidth}%` }}
              />
            </div>
          </div>
        )}
        
        {/* Participants list */}
        <div className="mb-4">
          <ParticipantsList 
            participants={participants}
            initialLimit={4}
            size="sm"
            title={`${challenge.participants} người tham gia`}
            showCount={false}
          />
        </div>
        
        <div>
          {calculatedStatus === 'ongoing' ? (
            challenge.isJoined ? (
              <span className="w-full block text-center py-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-md font-medium">
                <FaCheck className="inline mr-1" /> Đã kết nối theo dõi
              </span>
            ) : (
              <button className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition flex items-center justify-center">
                <BsSmartwatch className="mr-1" /> Tham gia & kết nối đồng hồ
              </button>
            )
          ) : calculatedStatus === 'upcoming' ? (
            <span className="w-full block text-center py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-md font-medium">
              Sắp diễn ra
            </span>
          ) : (
            <span className="w-full block text-center py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md font-medium">
              Đã kết thúc
            </span>
          )}
        </div>
        
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <FaTrophy className="mr-2" />
          <span>{challenge.targetValue} {challenge.targetUnit}</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <FaMedal className="mr-2" />
          <span>{challenge.difficulty || 'Trung bình'}</span>
        </div>
        
        {/* Smartwatch data connection indicator */}
        <div className="flex items-center text-sm text-blue-500 dark:text-blue-400">
          <BsSmartwatch className="mr-2" />
          <span>Tiến độ tự động từ đồng hồ</span>
        </div>
        
        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
          {challenge.description}
        </p>
        
        {/* Data metrics tracked */}
        {challenge.status === 'ongoing' && challenge.isJoined && (
          <div className="mb-3 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg border border-blue-100 dark:border-blue-800">
            <div className="flex items-center text-xs text-blue-700 dark:text-blue-300 mb-1">
              <FaSync className="mr-1 animate-spin" />
              <span>Đồng bộ dữ liệu {getSmartWatchDataType(challenge.category).text}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {getSmartWatchDataType(challenge.category).metrics.map((metric, index) => (
                <span key={index} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded text-xs">
                  {metric}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Link>
  );
};

export default ChallengeCard; 