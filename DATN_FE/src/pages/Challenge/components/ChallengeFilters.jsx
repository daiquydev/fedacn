import React from 'react';
import { FaSort, FaFire, FaClock, FaCalendarAlt } from 'react-icons/fa';

const ChallengeFilters = ({
  selectedCategory,
  setSelectedCategory,
  selectedStatus,
  setSelectedStatus,
  selectedType,
  setSelectedType,
  sortBy,
  setSortBy
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Trạng thái
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="ongoing">Đang diễn ra</option>
            <option value="upcoming">Sắp diễn ra</option>
            <option value="completed">Đã kết thúc</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Loại thử thách
          </label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="all">Tất cả các loại</option>
            <option value="regular">Thử thách thường</option>
            <option value="periodic">Thử thách định kỳ</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Sắp xếp theo
          </label>
          <div className="flex space-x-2">
            <button
              onClick={() => setSortBy('popular')}
              className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md ${
                sortBy === 'popular'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <FaFire className="mr-1" /> Phổ biến
            </button>
            <button
              onClick={() => setSortBy('newest')}
              className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md ${
                sortBy === 'newest'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <FaCalendarAlt className="mr-1" /> Mới nhất
            </button>
            <button
              onClick={() => setSortBy('endingSoon')}
              className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md ${
                sortBy === 'endingSoon'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <FaClock className="mr-1" /> Sắp kết thúc
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengeFilters; 