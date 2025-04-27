import React from 'react';
import { FaLightbulb } from 'react-icons/fa';

const RecommendationBox = ({ recommendations = [] }) => {
  if (!Array.isArray(recommendations) || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
      <div className="flex items-center mb-4">
        <FaLightbulb className="text-yellow-500 mr-2 text-xl" />
        <h3 className="text-lg font-semibold dark:text-white">Lời Khuyên Cho Bạn</h3>
      </div>
      
      <div className="space-y-3">
        {recommendations.map((recommendation, index) => (
          <div key={index} className="flex items-start pb-2 last:pb-0">
            <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300 w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5 text-sm font-semibold">
              {index + 1}
            </span>
            <p className="flex-1 text-gray-700 dark:text-gray-300">{recommendation}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendationBox; 