// Mock events data cho lịch
export const mockEvents = [
  {
    id: 'e1',
    title: 'Giải chạy Marathon Hà Nội',
    description: 'Giải chạy Marathon thường niên tại Hà Nội, các cự ly 5km, 10km, 21km và 42km.',
    startDate: '2025-03-10T00:00:00',
    endDate: '2025-03-10T23:59:59',
    startTime: '05:30',
    endTime: '12:00',
    location: 'Công viên Thống Nhất, Hà Nội',
    status: 'upcoming'
  },
  {
    id: 'e2',
    title: 'Giải bóng đá phủi',
    description: 'Giải bóng đá phủi cuối tuần cho cộng đồng người yêu thể thao.',
    startDate: '2025-03-15T00:00:00',
    endDate: '2025-03-15T23:59:59',
    startTime: '15:00',
    endTime: '18:00',
    location: 'Sân bóng Mỹ Đình, Hà Nội',
    status: 'upcoming'
  },
  {
    id: 'e3',
    title: 'Yoga ngoài trời',
    description: 'Buổi tập yoga ngoài trời cho cộng đồng.',
    startDate: '2025-03-22T00:00:00',
    endDate: '2025-03-22T23:59:59',
    startTime: '06:00',
    endTime: '07:30',
    location: 'Công viên Yên Sở, Hà Nội',
    status: 'upcoming'
  },
  {
    id: 'e4',
    title: 'Tour đạp xe Hồ Tây',
    description: 'Tour đạp xe quanh Hồ Tây khám phá các điểm đến thú vị.',
    startDate: '2025-04-05T00:00:00',
    endDate: '2025-04-05T23:59:59',
    startTime: '08:00',
    endTime: '11:00',
    location: 'Hồ Tây, Hà Nội',
    status: 'upcoming'
  },
  {
    id: 'e5',
    title: 'Giải bơi Mùa hè',
    description: 'Giải bơi mùa hè dành cho mọi lứa tuổi.',
    startDate: '2025-04-18T00:00:00',
    endDate: '2025-04-18T23:59:59',
    startTime: '09:00',
    endTime: '16:00',
    location: 'Hồ bơi Olympia, Hà Nội',
    status: 'upcoming'
  },
  {
    id: 'e6',
    title: 'Chạy bộ cộng đồng',
    description: 'Hoạt động chạy bộ cộng đồng hàng tuần.',
    startDate: '2025-04-25T00:00:00',
    endDate: '2025-04-25T23:59:59',
    startTime: '05:30',
    endTime: '07:00',
    location: 'Công viên Thống Nhất, Hà Nội',
    status: 'upcoming'
  },
  {
    id: 'e7',
    title: 'Giải Tennis Hà Nội Mở rộng',
    description: 'Giải tennis thường niên quy tụ các tay vợt hàng đầu.',
    startDate: '2025-05-08T00:00:00',
    endDate: '2025-05-12T23:59:59',
    startTime: '08:00',
    endTime: '18:00',
    location: 'Trung tâm Tennis Mỹ Đình',
    status: 'upcoming'
  },
  {
    id: 'e8',
    title: 'Chạy bộ gây quỹ từ thiện',
    description: 'Sự kiện chạy bộ gây quỹ cho trẻ em khó khăn.',
    startDate: '2025-05-15T00:00:00',
    endDate: '2025-05-15T23:59:59',
    startTime: '09:00',
    endTime: '10:00',
    location: 'Công viên Hòa Bình, Hà Nội',
    status: 'upcoming'
  },
  {
    id: 'e9',
    title: 'Hội thao công ty',
    description: 'Hội thao thường niên của công ty với nhiều môn thể thao.',
    startDate: '2025-05-22T00:00:00',
    endDate: '2025-05-23T23:59:59',
    startTime: '08:00',
    endTime: '17:00',
    location: 'Trung tâm Thể thao Quận 1, TP. HCM',
    status: 'upcoming'
  }
]

// Mock challenges data
export const mockChallenges = [
  {
    id: 'c1',
    title: 'Thử thách 10,000 bước mỗi ngày',
    description: 'Duy trì 10,000 bước đi mỗi ngày trong 7 ngày.',
    startDate: '2025-03-01T00:00:00',
    endDate: '2025-03-07T23:59:59',
    status: 'ongoing'
  },
  {
    id: 'c2',
    title: 'Thử thách Plank 14 ngày',
    description: 'Thực hiện động tác plank mỗi ngày, tăng dần thời gian từ 30 giây đến 5 phút.',
    startDate: '2025-03-15T00:00:00',
    endDate: '2025-03-29T23:59:59',
    status: 'ongoing'
  },
  {
    id: 'c3',
    title: 'Thử thách tập chạy 5km',
    description: 'Tập luyện để có thể chạy 5km liên tục không nghỉ trong 1 tuần.',
    startDate: '2025-04-01T00:00:00',
    endDate: '2025-04-07T23:59:59',
    status: 'ongoing'
  },
  {
    id: 'c4',
    title: 'Thử thách uống đủ nước',
    description: 'Uống ít nhất 2 lít nước mỗi ngày trong 10 ngày.',
    startDate: '2025-04-10T00:00:00',
    endDate: '2025-04-20T23:59:59',
    status: 'ongoing'
  },
]

// Mock meal plans data
export const mockMealPlans = [
  {
    id: 'm1',
    title: 'Bữa sáng',
    description: 'Bữa sáng dinh dưỡng, cân bằng các chất.',
    startDate: '2025-03-05T00:00:00',
    endDate: '2025-03-05T23:59:59',
    mealType: 'sáng',
    startTime: '07:00',
    endTime: '08:00',
    foods: [
      { name: 'Bánh mì nguyên cám', calories: 200 },
      { name: 'Trứng luộc', calories: 70 },
      { name: 'Sữa chua', calories: 120 }
    ]
  },
  {
    id: 'm2',
    title: 'Bữa trưa',
    description: 'Bữa trưa giàu protein, ít carb.',
    startDate: '2025-03-05T00:00:00',
    endDate: '2025-03-05T23:59:59',
    mealType: 'trưa',
    startTime: '12:00',
    endTime: '13:00',
    foods: [
      { name: 'Cơm gạo lứt', calories: 150 },
      { name: 'Ức gà nướng', calories: 200 },
      { name: 'Salad rau củ', calories: 80 }
    ]
  },
  {
    id: 'm3',
    title: 'Bữa tối',
    description: 'Bữa tối nhẹ nhàng, dễ tiêu hóa.',
    startDate: '2025-03-05T00:00:00',
    endDate: '2025-03-05T23:59:59',
    mealType: 'tối',
    startTime: '19:00',
    endTime: '20:00',
    foods: [
      { name: 'Súp rau củ', calories: 100 },
      { name: 'Cá hồi nướng', calories: 250 },
      { name: 'Rau xào', calories: 70 }
    ]
  },
  {
    id: 'm4',
    title: 'Bữa sáng',
    description: 'Bữa sáng giàu protein.',
    startDate: '2025-03-10T00:00:00',
    endDate: '2025-03-10T23:59:59',
    mealType: 'sáng',
    startTime: '07:00',
    endTime: '08:00',
    foods: [
      { name: 'Sinh tố protein', calories: 300 },
      { name: 'Yến mạch', calories: 150 },
      { name: 'Hoa quả tươi', calories: 80 }
    ]
  },
  {
    id: 'm5',
    title: 'Bữa trưa',
    description: 'Bữa trưa cân bằng dinh dưỡng.',
    startDate: '2025-03-10T00:00:00',
    endDate: '2025-03-10T23:59:59',
    mealType: 'trưa',
    startTime: '12:00',
    endTime: '13:00',
    foods: [
      { name: 'Cơm gạo lứt', calories: 150 },
      { name: 'Thịt bò xào', calories: 220 },
      { name: 'Canh rau', calories: 50 }
    ]
  },
  {
    id: 'm6',
    title: 'Bữa tối',
    description: 'Bữa tối nhẹ nhàng.',
    startDate: '2025-03-10T00:00:00',
    endDate: '2025-03-10T23:59:59',
    mealType: 'tối',
    startTime: '19:00',
    endTime: '20:00',
    foods: [
      { name: 'Salad gà', calories: 250 },
      { name: 'Bánh mì nguyên cám', calories: 100 },
      { name: 'Sữa chua', calories: 120 }
    ]
  },
  {
    id: 'm7',
    title: 'Thực đơn Eat Clean 7 ngày',
    description: 'Thực đơn Eat Clean giúp thanh lọc cơ thể trong 7 ngày.',
    startDate: '2025-04-01T00:00:00',
    endDate: '2025-04-07T23:59:59'
  },
  // {
  //   id: 'm8',
  //   title: 'Thực đơn tăng cơ giảm mỡ',
  //   description: 'Thực đơn tăng cơ giảm mỡ trong 14 ngày.',
  //   startDate: '2025-04-15T00:00:00',
  //   endDate: '2025-04-29T23:59:59'
  // },
  {
    id: 'm9',
    title: 'Thực đơn Keto 30 ngày',
    description: 'Thực đơn Keto giúp đốt mỡ hiệu quả trong 30 ngày.',
    startDate: '2025-05-01T00:00:00',
    endDate: '2025-05-30T23:59:59'
  }
] 