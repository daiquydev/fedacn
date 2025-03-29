import React from 'react';
import { FaRunning, FaBiking, FaSwimmer, FaDumbbell, FaTrophy } from 'react-icons/fa';
import { MdDirectionsWalk, MdSportsGymnastics } from 'react-icons/md';
import { GiMuscleUp } from 'react-icons/gi';

// Hàm lấy biểu tượng cho từng loại thử thách
export const getCategoryIcon = (category) => {
  switch (category) {
    case 'running':
      return <FaRunning className="mr-2" />;
    case 'cycling':
      return <FaBiking className="mr-2" />;
    case 'swimming':
      return <FaSwimmer className="mr-2" />;
    case 'gym':
      return <FaDumbbell className="mr-2" />;
    case 'hiit':
      return <MdSportsGymnastics className="mr-2" />;
    case 'walking':
      return <MdDirectionsWalk className="mr-2" />;
    case 'strength':
      return <GiMuscleUp className="mr-2" />;
    default:
      return <FaTrophy className="mr-2" />;
  }
};

// Hàm lấy nhãn cho thử thách định kỳ
export const getPeriodicLabel = (challenge) => {
  if (!challenge.isPeriodic) return null;
  
  switch (challenge.periodicType) {
    case 'weekly':
      return 'Hàng tuần';
    case 'monthly':
      return 'Hàng tháng';
    default:
      return 'Định kỳ';
  }
};

// Hàm định dạng thời gian
export const formatDuration = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 7) {
    return `${diffDays} ngày`;
  } else if (diffDays <= 30) {
    const weeks = Math.ceil(diffDays / 7);
    return `${weeks} tuần`;
  } else {
    const months = Math.ceil(diffDays / 30);
    return `${months} tháng`;
  }
};

// Hàm tính streak days
export const calculateStreakDays = (activities) => {
  if (!activities || activities.length === 0) return 0;
  
  // Sắp xếp các hoạt động theo ngày
  const sortedActivities = [...activities].sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );
  
  let currentStreak = 1;
  let maxStreak = 1;
  
  for (let i = 1; i < sortedActivities.length; i++) {
    const prevDate = new Date(sortedActivities[i-1].date);
    const currDate = new Date(sortedActivities[i].date);
    
    // Kiểm tra xem ngày hiện tại có liên tiếp với ngày trước đó không
    const diffDays = Math.round((currDate - prevDate) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else if (diffDays > 1) {
      currentStreak = 1;
    }
  }
  
  return maxStreak;
}; 