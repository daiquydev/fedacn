import React from 'react';
import { FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

const QuickSummary = ({ userProfile, overallStatus }) => {
  // Kiểm tra dữ liệu đầu vào
  if (!userProfile || !userProfile.goal) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
        <h3 className="text-lg font-semibold mb-4 dark:text-white">Tóm Tắt Nhanh</h3>
        <div className="py-4 text-center">
          <p className="text-gray-500 dark:text-gray-400">Không có dữ liệu tóm tắt</p>
        </div>
      </div>
    );
  }

  // Mapping mục tiêu sang văn bản tiếng Việt
  const goalTypeMapping = {
    lose_weight: 'Giảm cân',
    maintain_weight: 'Duy trì cân nặng',
    gain_weight: 'Tăng cân',
    gain_muscle: 'Tăng cơ',
    eat_healthier: 'Ăn uống lành mạnh hơn',
    improve_fitness: 'Nâng cao thể lực'
  };

  // Tính toán sự thay đổi cân nặng
  const weightChange = userProfile.startWeightKg - userProfile.currentWeightKg;
  const weightChangeText = weightChange >= 0 
    ? `Đã giảm: ${weightChange.toFixed(1)}kg` 
    : `Đã tăng: ${Math.abs(weightChange).toFixed(1)}kg`;
  
  // Chiều dài còn lại để đạt mục tiêu
  const remainingWeight = Math.abs(userProfile.currentWeightKg - userProfile.targetWeightKg).toFixed(1);
  const remainingText = userProfile.goal.type === 'lose_weight'
    ? `Còn ${remainingWeight}kg để đạt mục tiêu`
    : userProfile.goal.type === 'gain_weight'
      ? `Còn ${remainingWeight}kg để đạt mục tiêu`
      : 'Đang duy trì cân nặng';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
      <h3 className="text-lg font-semibold mb-4 dark:text-white">Tóm Tắt Nhanh</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Mục tiêu hiện tại</p>
          <p className="font-medium dark:text-white">{goalTypeMapping[userProfile.goal.type] || 'Không xác định'}</p>
          {userProfile.goal.type !== 'maintain_weight' && userProfile.targetWeightKg && (
            <p className="font-medium dark:text-white">
              Mục tiêu: {userProfile.targetWeightKg}kg
            </p>
          )}
        </div>
        
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Trạng thái</p>
          <div className="flex items-center">
            {overallStatus === 'on_track' ? (
              <>
                <FaCheckCircle className="text-green-500 mr-2" />
                <span className="text-green-600 dark:text-green-400 font-medium">Đang đi đúng hướng</span>
              </>
            ) : (
              <>
                <FaExclamationTriangle className="text-yellow-500 mr-2" />
                <span className="text-yellow-600 dark:text-yellow-400 font-medium">Cần chú ý điều chỉnh</span>
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Thay đổi cân nặng</p>
            <p className={`font-medium ${weightChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {weightChangeText}
            </p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Tiến độ</p>
            <p className="font-medium dark:text-white">{remainingText}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickSummary; 