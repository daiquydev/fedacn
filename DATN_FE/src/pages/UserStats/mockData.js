// Dữ liệu người dùng cơ bản và mục tiêu
export const userProfile = {
  userId: 'user123',
  name: 'Nguyễn Tuấn Khanh',
  goal: {
    type: 'lose_weight', // 'maintain_weight', 'gain_weight', 'gain_muscle', 'eat_healthier', 'improve_fitness'
    targetWeightKg: 70,
    startWeightKg: 80,
    startDate: '2024-10-01',
    // Có thể thêm mục tiêu thời gian: targetDate: '2024-04-01'
  },
  currentWeightKg: 77.5, // Cân nặng mới nhất
};

// Lịch sử cập nhật chỉ số (cần nhiều điểm dữ liệu cho biểu đồ)
export const healthMetricsHistory = [
  { date: '2024-10-01', weightKg: 80.0, bodyFatPercentage: 25.2 },
  { date: '2024-10-08', weightKg: 79.5, bodyFatPercentage: 25.1 },
  { date: '2024-10-15', weightKg: 79.0, bodyFatPercentage: 24.9 },
  { date: '2024-10-22', weightKg: 78.8, bodyFatPercentage: 24.7 },
  { date: '2024-10-29', weightKg: 78.5, bodyFatPercentage: 24.6 },
  { date: '2024-11-05', weightKg: 78.3, bodyFatPercentage: 24.4 },
  { date: '2024-11-12', weightKg: 78.0, bodyFatPercentage: 24.3 },
  { date: '2024-11-19', weightKg: 77.8, bodyFatPercentage: 24.1 },
  { date: '2024-11-26', weightKg: 77.5, bodyFatPercentage: 24.0 },
  { date: '2024-12-03', weightKg: 77.0, bodyFatPercentage: 23.8 },
  { date: '2024-12-10', weightKg: 76.8, bodyFatPercentage: 23.6 },
  { date: '2024-12-17', weightKg: 76.5, bodyFatPercentage: 23.5 },
  { date: '2024-12-24', weightKg: 76.2, bodyFatPercentage: 23.4 },
  { date: '2024-12-31', weightKg: 76.0, bodyFatPercentage: 23.3 },
  { date: '2025-01-07', weightKg: 75.7, bodyFatPercentage: 23.1 },
  { date: '2025-01-14', weightKg: 75.5, bodyFatPercentage: 23.0 },
  { date: '2025-01-21', weightKg: 75.3, bodyFatPercentage: 22.9 },
  { date: '2025-01-28', weightKg: 75.0, bodyFatPercentage: 22.8 },
  { date: '2025-02-04', weightKg: 77.0, bodyFatPercentage: 23.0 }, // Tăng trở lại do kỳ nghỉ
  { date: '2025-02-11', weightKg: 76.5, bodyFatPercentage: 22.9 },
  { date: '2025-02-18', weightKg: 76.0, bodyFatPercentage: 22.8 },
  { date: '2025-02-25', weightKg: 75.5, bodyFatPercentage: 22.7 },
  { date: '2025-03-03', weightKg: 75.0, bodyFatPercentage: 22.6 },
  { date: '2025-03-10', weightKg: 74.5, bodyFatPercentage: 22.5 },
  { date: '2025-03-17', weightKg: 74.0, bodyFatPercentage: 22.4 },
  { date: '2025-03-24', weightKg: 73.5, bodyFatPercentage: 22.3 },
  { date: '2025-03-31', weightKg: 73.0, bodyFatPercentage: 22.2 },
  { date: '2025-04-07', weightKg: 72.5, bodyFatPercentage: 22.1 },
  { date: '2025-04-14', weightKg: 72.0, bodyFatPercentage: 22.0 },
  { date: '2025-04-21', weightKg: 71.5, bodyFatPercentage: 21.8 },
  { date: '2025-04-28', weightKg: 71.0, bodyFatPercentage: 21.7 },
  { date: '2025-05-05', weightKg: 70.5, bodyFatPercentage: 21.6 },
  { date: '2025-05-12', weightKg: 70.0, bodyFatPercentage: 21.5 }, // Đạt mục tiêu!
  { date: '2025-05-19', weightKg: 69.5, bodyFatPercentage: 21.4 } // Vượt mục tiêu!
];

// Lịch sử tham gia hoạt động
export const activityHistory = [
  {
    id: 'act123',
    type: 'event', // 'event' hoặc 'challenge'
    name: 'Chạy bộ ủng hộ quỹ từ thiện',
    dateJoined: '2025-04-10',
    dateCompleted: '2025-04-10',
    status: 'completed', // 'active', 'completed', 'failed'
    result: 'Hoàn thành 5km'
  },
  {
    id: 'act122',
    type: 'challenge',
    name: '30 ngày tập Plank',
    dateJoined: '2025-04-10',
    dateCompleted: '2025-04-15',
    status: 'completed',
    result: 'Đạt 2 phút plank'
  },
  {
    id: 'act121',
    type: 'event',
    name: 'Giải chạy Marathon TP.HCM',
    dateJoined: '2025-04-05',
    dateCompleted: '2025-04-05',
    status: 'completed',
    result: 'Hoàn thành 10km'
  },
  {
    id: 'act120',
    type: 'challenge',
    name: 'Thử thách 7 ngày ăn chay',
    dateJoined: '2025-04-20',
    dateCompleted: '2025-04-27',
    status: 'completed',
    result: 'Hoàn thành 7/7 ngày'
  },
  {
    id: 'act119',
    type: 'challenge',
    name: 'Uống đủ 2L nước mỗi ngày',
    dateJoined: '2025-04-01',
    dateCompleted: '2025-04-30',
    status: 'completed',
    result: 'Hoàn thành 28/30 ngày'
  },
  {
    id: 'act118',
    type: 'event',
    name: 'Yoga trong công viên',
    dateJoined: '2025-04-15',
    dateCompleted: '2025-04-15',
    status: 'completed',
    result: 'Tham gia buổi tập 90 phút'
  },
  {
    id: 'act117',
    type: 'challenge',
    name: '21 ngày tập cardio',
    dateJoined: '2025-04-10',
    dateCompleted: null,
    status: 'failed', 
    result: 'Hoàn thành 15/21 ngày'
  },
  {
    id: 'act116',
    type: 'event',
    name: 'Hội thảo Dinh dưỡng thể thao',
    dateJoined: '2025-04-05',
    dateCompleted: '2025-04-05',
    status: 'completed',
    result: 'Tham gia đầy đủ'
  },
  {
    id: 'act115',
    type: 'challenge',
    name: 'Không đồ ngọt 14 ngày',
    dateJoined: '2025-04-15',
    dateCompleted: '2025-04-29',
    status: 'completed',
    result: 'Hoàn thành trọn vẹn'
  },
  {
    id: 'act114',
    type: 'event',
    name: 'Đạp xe gây quỹ',
    dateJoined: '2025-04-20',
    dateCompleted: '2025-04-20',
    status: 'completed',
    result: 'Hoàn thành 20km'
  }
];

// Tính toán tóm tắt (có thể tính từ history hoặc chuẩn bị sẵn)
export const activitySummary = {
  totalEvents: 4,
  totalChallenges: 6,
  completionRate: 90, // Tỷ lệ % hoàn thành thử thách
  streakDays: 15, // Số ngày liên tục hoạt động
  caloriesBurnedLastWeek: 3500, // Calo đã đốt trong tuần qua
  caloriesConsumedLastWeek: 14000, // Calo đã nạp trong tuần qua (nếu có dữ liệu)
};

// Trạng thái tổng quan (logic tính toán dựa trên so sánh mục tiêu và trend)
// Ví dụ: Mục tiêu giảm cân, cân nặng đang giảm -> 'on_track'
// Ví dụ: Mục tiêu giảm cân, cân nặng đi ngang/tăng -> 'needs_attention'
export const overallStatus = 'on_track'; // Hoặc 'needs_attention'

// Dữ liệu mock đầy đủ cho component
export const mockDashboardData = {
  userProfile,
  healthMetricsHistory,
  activityHistory,
  activitySummary,
  overallStatus,
  recommendations: [
    "Tuyệt vời! Cân nặng của bạn đang giảm dần đều, hãy tiếp tục duy trì việc tham gia các thử thách đi bộ nhé.",
    "Thử thách tiếp theo: Hãy thử 7 ngày không ăn sau 7 giờ tối để giảm cân hiệu quả hơn."
  ]
}; 