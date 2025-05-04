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

// Mock meal plans data với chi tiết bổ sung
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
      { 
        name: 'Bánh mì nguyên cám', 
        calories: 200,
        ingredients: ['Bánh mì nguyên cám', 'Bơ thực vật', 'Mật ong'],
        instructions: 'Nướng bánh mì, sau đó phết bơ và mật ong lên trên.',
        time: '10 phút',
        nutrition: {
          protein: '6g',
          carbs: '35g',
          fat: '4g'
        },
        benefits: ['Giàu chất xơ', 'Cung cấp năng lượng lâu', 'Tốt cho tiêu hóa']
      },
      { 
        name: 'Trứng luộc', 
        calories: 70,
        ingredients: ['Trứng gà'],
        instructions: 'Luộc trứng trong 7 phút với nước sôi.',
        time: '10 phút',
        nutrition: {
          protein: '6g',
          carbs: '0g',
          fat: '5g'
        },
        benefits: ['Giàu protein', 'Dễ hấp thụ', 'Chứa vitamin D']
      },
      { 
        name: 'Sữa chua', 
        calories: 120,
        ingredients: ['Sữa chua không đường', 'Mật ong (tùy chọn)', 'Hoa quả tươi (tùy chọn)'],
        instructions: 'Đổ sữa chua ra bát, thêm mật ong và hoa quả tươi nếu muốn.',
        time: '5 phút',
        nutrition: {
          protein: '5g',
          carbs: '7g',
          fat: '3g'
        },
        benefits: ['Tốt cho đường ruột', 'Cung cấp calcium', 'Tăng cường miễn dịch']
      }
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
      { 
        name: 'Cơm gạo lứt', 
        calories: 150,
        ingredients: ['Gạo lứt', 'Nước', 'Muối (tùy chọn)'],
        instructions: 'Vo gạo lứt, nấu với tỷ lệ 1:2 (gạo:nước) trong 25-30 phút.',
        time: '35 phút',
        nutrition: {
          protein: '3g',
          carbs: '25g',
          fat: '1g'
        },
        benefits: ['Giàu chất xơ', 'Giảm cholesterol', 'Điều hòa đường huyết']
      },
      { 
        name: 'Ức gà nướng', 
        calories: 200,
        ingredients: ['Ức gà', 'Muối', 'Tiêu', 'Dầu olive'],
        instructions: 'Ướp ức gà với gia vị, sau đó nướng trong lò ở 200°C trong 20 phút.',
        time: '30 phút',
        nutrition: {
          protein: '25g',
          carbs: '0g',
          fat: '3g'
        },
        benefits: ['Giàu protein nạc', 'Ít chất béo', 'Thúc đẩy tăng cơ']
      },
      { 
        name: 'Salad rau củ', 
        calories: 80,
        ingredients: ['Xà lách', 'Cà chua', 'Dưa chuột', 'Dầu olive', 'Giấm'],
        instructions: 'Rửa sạch rau củ, cắt nhỏ và trộn đều với dầu olive và giấm.',
        time: '15 phút',
        nutrition: {
          protein: '2g',
          carbs: '10g',
          fat: '5g'
        },
        benefits: ['Giàu vitamin và khoáng chất', 'Chứa chất chống oxy hóa', 'Hỗ trợ giảm cân']
      }
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
      { 
        name: 'Súp rau củ', 
        calories: 100,
        ingredients: ['Cà rốt', 'Khoai tây', 'Hành tây', 'Cần tây', 'Nước dùng gà'],
        instructions: 'Cắt nhỏ rau củ, đun với nước dùng khoảng 20 phút đến khi rau mềm.',
        time: '25 phút',
        nutrition: {
          protein: '3g',
          carbs: '15g',
          fat: '2g'
        },
        benefits: ['Dễ tiêu hóa', 'Giàu vitamin', 'Ấm bụng']
      },
      { 
        name: 'Cá hồi nướng', 
        calories: 250,
        ingredients: ['Cá hồi phi lê', 'Chanh', 'Thì là', 'Dầu olive', 'Muối biển'],
        instructions: 'Ướp cá với chanh, thì là, và gia vị. Nướng ở 180°C trong 15 phút.',
        time: '20 phút',
        nutrition: {
          protein: '22g',
          carbs: '0g',
          fat: '15g'
        },
        benefits: ['Giàu omega-3', 'Tốt cho tim mạch', 'Tốt cho não bộ']
      },
      { 
        name: 'Rau xào', 
        calories: 70,
        ingredients: ['Bông cải xanh', 'Ớt chuông', 'Hành tỏi', 'Dầu olive', 'Nước tương ít muối'],
        instructions: 'Xào rau với tỏi trong chảo nóng, thêm chút nước tương và đảo đều.',
        time: '10 phút',
        nutrition: {
          protein: '3g',
          carbs: '8g',
          fat: '3g'
        },
        benefits: ['Giàu chất chống oxy hóa', 'Cung cấp chất xơ', 'Tốt cho tiêu hóa']
      }
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
      { 
        name: 'Sinh tố protein', 
        calories: 300,
        ingredients: ['Chuối', 'Whey protein', 'Sữa hạnh nhân', 'Bơ', 'Hạt chia'],
        instructions: 'Cho tất cả nguyên liệu vào máy xay và xay đều khoảng 1 phút.',
        time: '5 phút',
        nutrition: {
          protein: '20g',
          carbs: '30g',
          fat: '10g'
        },
        benefits: ['Nhanh chóng bổ sung năng lượng', 'Hỗ trợ phục hồi cơ bắp', 'Giàu dinh dưỡng']
      },
      { 
        name: 'Yến mạch', 
        calories: 150,
        ingredients: ['Yến mạch', 'Sữa hoặc nước', 'Mật ong', 'Quế'],
        instructions: 'Đun yến mạch với sữa trong 3-5 phút, thêm mật ong và quế.',
        time: '10 phút',
        nutrition: {
          protein: '5g',
          carbs: '27g',
          fat: '3g'
        },
        benefits: ['Giàu chất xơ', 'Hỗ trợ giảm cholesterol', 'Năng lượng lâu dài']
      },
      { 
        name: 'Hoa quả tươi', 
        calories: 80,
        ingredients: ['Táo', 'Dâu tây', 'Việt quất', 'Kiwi'],
        instructions: 'Rửa sạch và cắt nhỏ trái cây, trộn đều và ăn kèm.',
        time: '5 phút',
        nutrition: {
          protein: '1g',
          carbs: '20g',
          fat: '0g'
        },
        benefits: ['Giàu vitamin C', 'Chứa chất chống oxy hóa', 'Cung cấp chất xơ tự nhiên']
      }
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
      { 
        name: 'Cơm gạo lứt', 
        calories: 150,
        ingredients: ['Gạo lứt', 'Nước', 'Muối (tùy chọn)'],
        instructions: 'Vo gạo lứt, nấu với tỷ lệ 1:2 (gạo:nước) trong 25-30 phút.',
        time: '35 phút',
        nutrition: {
          protein: '3g',
          carbs: '25g',
          fat: '1g'
        },
        benefits: ['Giàu chất xơ', 'Giảm cholesterol', 'Điều hòa đường huyết']
      },
      { 
        name: 'Thịt bò xào', 
        calories: 220,
        ingredients: ['Thịt bò thăn', 'Ớt chuông', 'Hành tây', 'Nước tương', 'Dầu mè'],
        instructions: 'Xào thịt bò với rau trong chảo nóng khoảng 5-7 phút.',
        time: '15 phút',
        nutrition: {
          protein: '25g',
          carbs: '8g',
          fat: '10g'
        },
        benefits: ['Giàu sắt và kẽm', 'Bổ sung protein chất lượng cao', 'Tốt cho sức khỏe cơ bắp']
      },
      { 
        name: 'Canh rau', 
        calories: 50,
        ingredients: ['Rau cải', 'Nấm', 'Đậu phụ', 'Nước dùng rau củ'],
        instructions: 'Đun sôi nước dùng, thêm rau và đậu phụ, nấu khoảng 10 phút.',
        time: '15 phút',
        nutrition: {
          protein: '4g',
          carbs: '5g',
          fat: '1g'
        },
        benefits: ['Dễ tiêu hóa', 'Nhiều chất xơ', 'Giàu vitamin']
      }
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
      { 
        name: 'Salad gà', 
        calories: 250,
        ingredients: ['Ức gà nướng', 'Rau xà lách', 'Cà chua bi', 'Dưa chuột', 'Sốt dầu giấm'],
        instructions: 'Trộn các nguyên liệu, thêm sốt và đảo đều trước khi ăn.',
        time: '15 phút',
        nutrition: {
          protein: '25g',
          carbs: '10g',
          fat: '12g'
        },
        benefits: ['Giàu protein, ít carb', 'Nhiều chất xơ', 'Tốt cho giảm cân']
      },
      { 
        name: 'Bánh mì nguyên cám', 
        calories: 100,
        ingredients: ['Bánh mì nguyên cám', 'Bơ thực vật (tùy chọn)'],
        instructions: 'Nướng nhẹ bánh mì để giòn, có thể phết chút bơ.',
        time: '5 phút',
        nutrition: {
          protein: '3g',
          carbs: '15g',
          fat: '2g'
        },
        benefits: ['Giàu chất xơ', 'Cung cấp năng lượng lâu', 'Tốt cho tiêu hóa']
      },
      { 
        name: 'Sữa chua', 
        calories: 120,
        ingredients: ['Sữa chua không đường', 'Mật ong (tùy chọn)', 'Hoa quả tươi (tùy chọn)'],
        instructions: 'Đổ sữa chua ra bát, thêm mật ong và hoa quả tươi nếu muốn.',
        time: '5 phút',
        nutrition: {
          protein: '5g',
          carbs: '7g',
          fat: '3g'
        },
        benefits: ['Tốt cho đường ruột', 'Cung cấp calcium', 'Tăng cường miễn dịch']
      }
    ]
  },
  {
    id: 'm7',
    title: 'Thực đơn Eat Clean 7 ngày',
    description: 'Thực đơn Eat Clean giúp thanh lọc cơ thể trong 7 ngày.',
    startDate: '2025-04-01T00:00:00',
    endDate: '2025-04-07T23:59:59',
    mealPlans: [
      {
        day: 'Ngày 1',
        meals: [
          {
            mealType: 'Sáng',
            foods: [
              { 
                name: 'Sinh tố xanh', 
                calories: 180,
                ingredients: ['Rau bina', 'Chuối', 'Sữa hạnh nhân', 'Mật ong'],
                instructions: 'Xay tất cả nguyên liệu trong máy xay sinh tố.',
                time: '5 phút',
                nutrition: {
                  protein: '3g',
                  carbs: '30g',
                  fat: '2g'
                },
                benefits: ['Giàu vitamin', 'Hỗ trợ thanh lọc', 'Dễ tiêu hóa']
              }
            ]
          },
          {
            mealType: 'Trưa',
            foods: [
              { 
                name: 'Salad protein', 
                calories: 320,
                ingredients: ['Trứng luộc', 'Quinoa', 'Cà chua', 'Bơ', 'Rau xanh đa dạng'],
                instructions: 'Trộn đều tất cả nguyên liệu với sốt chanh dầu olive.',
                time: '15 phút',
                nutrition: {
                  protein: '15g',
                  carbs: '25g',
                  fat: '15g'
                },
                benefits: ['Cân bằng dinh dưỡng', 'Giàu chất xơ', 'Không chất bảo quản']
              }
            ]
          },
          {
            mealType: 'Tối',
            foods: [
              { 
                name: 'Cá nướng và rau hấp', 
                calories: 280,
                ingredients: ['Cá phi lê', 'Bông cải xanh', 'Cà rốt', 'Hành tây', 'Gia vị tự nhiên'],
                instructions: 'Nướng cá với gia vị, hấp rau riêng và ăn kèm.',
                time: '25 phút',
                nutrition: {
                  protein: '25g',
                  carbs: '15g',
                  fat: '10g'
                },
                benefits: ['Ít dầu mỡ', 'Đầy đủ dưỡng chất', 'Dễ tiêu hóa buổi tối']
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'm9',
    title: 'Thực đơn Keto 30 ngày',
    description: 'Thực đơn Keto giúp đốt mỡ hiệu quả trong 30 ngày.',
    startDate: '2025-05-01T00:00:00',
    endDate: '2025-05-30T23:59:59',
    mealPlans: [
      {
        day: 'Ngày 1',
        meals: [
          {
            mealType: 'Sáng',
            foods: [
              { 
                name: 'Trứng và bơ', 
                calories: 350,
                ingredients: ['Trứng', 'Bơ', 'Phô mai', 'Rau bina'],
                instructions: 'Chiên trứng với bơ, thêm phô mai và rau bina.',
                time: '10 phút',
                nutrition: {
                  protein: '15g',
                  carbs: '3g',
                  fat: '30g'
                },
                benefits: ['Giàu chất béo lành mạnh', 'Ít carb', 'Năng lượng lâu dài']
              }
            ]
          },
          {
            mealType: 'Trưa',
            foods: [
              { 
                name: 'Salad thịt bò', 
                calories: 450,
                ingredients: ['Thịt bò xào', 'Rau xanh', 'Quả bơ', 'Dầu olive', 'Giấm táo'],
                instructions: 'Trộn thịt bò đã xào chín với rau và bơ, thêm dầu olive và giấm.',
                time: '15 phút',
                nutrition: {
                  protein: '25g',
                  carbs: '5g',
                  fat: '35g'
                },
                benefits: ['Tỷ lệ chất béo cao', 'Ít carb', 'Thúc đẩy ketosis']
              }
            ]
          },
          {
            mealType: 'Tối',
            foods: [
              { 
                name: 'Cá hồi sốt bơ', 
                calories: 400,
                ingredients: ['Cá hồi', 'Bơ', 'Chanh', 'Rau củ chế biến ít carb'],
                instructions: 'Nướng cá hồi, làm sốt bơ chanh và phục vụ với rau củ.',
                time: '20 phút',
                nutrition: {
                  protein: '30g',
                  carbs: '4g',
                  fat: '28g'
                },
                benefits: ['Giàu omega-3', 'Phù hợp keto', 'Tốt cho não bộ']
              }
            ]
          }
        ]
      }
    ]
  }
] 