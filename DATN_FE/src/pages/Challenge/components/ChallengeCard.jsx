import React from 'react';
import { Link } from 'react-router-dom';
import { FaUsers, FaCalendarAlt, FaCheck } from 'react-icons/fa';
import moment from 'moment';
import { getCategoryIcon } from './ChallengeUtils';

const ChallengeCard = ({ challenge, categoryIcon, periodicLabel }) => {
  // Calculate days left
  const today = moment();
  const endDate = moment(challenge.endDate);
  const rawDaysLeft = endDate.diff(today, 'days');
  const daysLeft = rawDaysLeft < 0 ? 0 : rawDaysLeft;

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
        
        {periodicLabel && (
          <div className="absolute top-0 right-0 m-3">
            <span className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm font-medium">
              {periodicLabel}
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
              {challenge.status === 'ongoing'
                ? `Còn ${daysLeft} ngày`
                : challenge.status === 'upcoming'
                ? `Bắt đầu sau ${moment(challenge.startDate).diff(today, 'days')} ngày`
                : 'Đã kết thúc'}
            </span>
          </div>
        </div>
        
        {/* 
          XÓA HOÀN TOÀN PHẦN NÀY NẾU KHÔNG ĐÃ THAM GIA 
          Chỉ hiển thị khi challenge.isJoined là true 
        */}
        {challenge.isJoined === true && challenge.status !== 'upcoming' && (
          <div className="mb-3">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div
                className="bg-green-600 h-2.5 rounded-full"
                style={{ width: `${challenge.progress}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-1 text-sm text-gray-600 dark:text-gray-400">
              <span>Tiến độ</span>
              <span>{challenge.progress}%</span>
            </div>
          </div>
        )}
        
        <div>
          {challenge.status === 'ongoing' ? (
            challenge.isJoined ? (
              <span className="w-full block text-center py-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-md font-medium">
                <FaCheck className="inline mr-1" /> Đang tham gia
              </span>
            ) : (
              <button className="w-full py-2 bg-green-600 hover:bg-gray-700 text-white rounded-md transition">
                Tham gia ngay
              </button>
            )
          ) : challenge.status === 'upcoming' ? (
            <span className="w-full block text-center py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-md font-medium">
              Sắp diễn ra
            </span>
          ) : (
            <span className="w-full block text-center py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md font-medium">
              Đã kết thúc
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ChallengeCard; 