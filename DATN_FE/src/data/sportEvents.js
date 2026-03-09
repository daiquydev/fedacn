import moment from 'moment';

export const allSportEvents = [
  {
    id: 1,
    name: "Thử thách chạy sáng 10K",
    createdAt: "2024-03-19T08:00:00Z",
    startDate: "2025-03-01T08:00:00Z",
    endDate: "2025-04-30T23:59:59Z",
    date: "2025-03-01T08:00:00Z", // Consistency with list view
    creator: {
      id: 1,
      name: "Nguyễn Văn An",
      avatar: "",
      role: 1,
      username: "nguyenvanan"
    },
    views: 1250, // Updated views
    saves: 48,   // Updated saves
    likes: 95,   // Updated likes
    posts: 25,   // Updated posts
    participants: 215, // From list view
    maxParticipants: 500, // From list view
    backgroundImage: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5",
    image: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5", // Consistency with list view
    description: "Tham gia cùng chúng tôi cho buổi chạy sáng đầy năng lượng! Sự kiện này hoàn hảo cho cả người mới bắt đầu và người chạy có kinh nghiệm. Hãy cùng nhau đạt được mục tiêu thể dục của chúng ta! Trong thử thách này, bạn sẽ theo dõi khoảng cách chạy hàng ngày của mình và thi đấu với những người khác đồng thời hỗ trợ sự tiến bộ của nhau. Cập nhật thường xuyên và chia sẻ cộng đồng sẽ giúp mọi người luôn có động lực.",
    video: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    category: "Chạy bộ",
    location: "Công viên Trung tâm",
    progress: 75, // Specific to user's progress, might need separate handling later
    isLiked: false,
    isJoined: false, // From list view
    eventType: "offline",
    targetValue: 100,
    targetUnit: "km",
    difficulty: "Trung bình",
    // Add mock daily progress for the current user for this event
    userDailyProgress: [
      { date: '2025-03-01T10:00:00Z', value: 5, unit: 'km', calories: 350, distance: 5, time: '00:35:10' },
      { date: '2025-03-02T09:30:00Z', value: 3, unit: 'km', calories: 210, distance: 3, time: '00:22:05' },
      { date: '2025-03-03T18:15:00Z', value: 4.5, unit: 'km', calories: 315, distance: 4.5, time: '00:31:45' },
      { date: '2025-03-04T07:00:00Z', value: 6, unit: 'km', calories: 420, distance: 6, time: '00:42:00' },
      { date: '2025-03-05T19:00:00Z', value: 3.5, unit: 'km', calories: 245, distance: 3.5, time: '00:25:30' },
      { date: '2025-03-06T08:20:00Z', value: 7, unit: 'km', calories: 490, distance: 7, time: '00:48:55' },
      { date: '2025-03-07T17:45:00Z', value: 4, unit: 'km', calories: 280, distance: 4, time: '00:29:15' },
    ],
    rules: [
      "Chạy ít nhất 3km mỗi ngày",
      "Tải lên ảnh chụp màn hình từ ứng dụng theo dõi",
      "Hoàn thành trong thời gian quy định",
      "Chia sẻ tiến độ của bạn hàng tuần",
      "Hỗ trợ những người tham gia khác"
    ],
    rewards: [
      "Huy hiệu Marathon Đồng",
      "10 điểm thành tích",
      "Cơ hội nhận quà từ nhà tài trợ",
      "Chứng chỉ hoàn thành"
    ],
    sponsors: [
      { name: "RunTech Shoes", logo: "https://placeholder.com/sponsor1.png" },
      { name: "HealthDrink", logo: "https://placeholder.com/sponsor2.png" }
    ],
    organizers: [
      { name: "Câu lạc bộ Cộng đồng Thể dục", contact: "fitness@community.com" }
    ],
    faqs: [
      { question: "Tôi nên sử dụng ứng dụng theo dõi nào?", answer: "Bạn có thể sử dụng bất kỳ ứng dụng theo dõi nào như Strava, Nike Run Club hoặc Garmin. Chỉ cần đảm bảo nó hiển thị khoảng cách và thời gian của bạn." },
      { question: "Tôi có thể tham gia sau khi sự kiện đã bắt đầu không?", answer: "Có, bạn có thể tham gia bất cứ lúc nào, nhưng mục tiêu sẽ vẫn giữ nguyên." }
    ]
  },
  {
    id: 2,
    name: "Hội thảo Yoga Trực tuyến (5 Buổi)",
    createdAt: "2024-03-15T09:00:00Z",
    startDate: "2025-03-10T17:00:00Z",
    endDate: "2025-03-14T18:30:00Z",
    date: "2025-03-10T17:00:00Z",
    creator: {
      id: 2,
      name: "Phạm Thu Trang",
      avatar: "",
      role: 1,
      username: "phamthutrang"
    },
    views: 850,
    saves: 32,
    likes: 67,
    posts: 15,
    participants: 32, // From list view mock data
    maxParticipants: 100, // From list view mock data
    backgroundImage: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b",
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b", // Consistency with list view
    description: "Tham gia chuỗi 5 hội thảo yoga trực tuyến của chúng tôi được thiết kế cho tất cả các cấp độ kinh nghiệm. Học các tư thế và kỹ thuật mới trong khi kết nối với những người đam mê khác! Phiên học tương tác này sẽ được hướng dẫn bởi các giáo viên yoga có chứng nhận, những người sẽ hướng dẫn bạn thông qua một loạt các tư thế và cung cấp phản hồi cá nhân.",
    video: "https://www.youtube.com/embed/v7AYKMP6rOE",
    category: "Yoga",
    location: "Trực tuyến",
    progress: 40,
    isLiked: false,
    isJoined: true,
    eventType: "online",
    targetValue: 5,
    targetUnit: "buổi",
    difficulty: "Người mới",
    sessions: [
      { sessionId: 1, sessionDate: "2025-03-10T17:00:00Z", durationHours: 1.5, topic: "Giới thiệu và Tư thế cơ bản", isCompleted: true },
      { sessionId: 2, sessionDate: "2025-03-11T17:00:00Z", durationHours: 1.5, topic: "Luồng Chào mặt trời", isCompleted: true },
      { sessionId: 3, sessionDate: "2025-03-12T17:00:00Z", durationHours: 1.5, topic: "Tư thế thăng bằng", isCompleted: false },
      { sessionId: 4, sessionDate: "2025-03-13T17:00:00Z", durationHours: 1.5, topic: "Mở khớp háng", isCompleted: false },
      { sessionId: 5, sessionDate: "2025-03-14T17:00:00Z", durationHours: 1.5, topic: "Thư giãn và Thiền", isCompleted: false },
    ],
    rules: [
      "Đúng giờ tham gia buổi học",
      "Chuẩn bị sẵn thảm yoga",
      "Bật camera nếu có thể",
      "Mặc quần áo thoải mái",
      "Tìm một không gian yên tĩnh với đủ chỗ để di chuyển"
    ],
    rewards: [
      "Huy hiệu Yoga Người mới",
      "5 điểm thành tích",
      "Phiếu giảm giá cho hội thảo tiếp theo",
      "Chứng chỉ tham gia kỹ thuật số"
    ],
    organizers: [
      { name: "Trung tâm Wellness", contact: "wellness@center.com" }
    ],
    videoCallUrl: "https://meet.jit.si/FitConnect-LiveYogaWorkshop",
    faqs: [
      { question: "Tôi có cần kinh nghiệm về yoga không?", answer: "Không, hội thảo này được thiết kế cho tất cả các cấp độ, bao gồm cả người mới bắt đầu." },
      { question: "Tôi cần những thiết bị gì?", answer: "Chỉ cần một thảm yoga và quần áo thoải mái. Tùy chọn, bạn có thể muốn có một khối yoga và dây đai gần đó." },
      { question: "Buổi học có được ghi lại không?", answer: "Có, bản ghi sẽ có sẵn cho người tham gia trong 7 ngày sau buổi học trực tiếp." }
    ]
  },
  {
    id: 3,
    name: "Tour đạp xe cuối tuần",
    createdAt: "2024-04-01T10:00:00Z",
    startDate: "2025-07-10T08:30:00Z",
    endDate: "2025-07-10T12:30:00Z",
    date: "2025-07-10T08:30:00Z",
    creator: { id: 3, name: "Lê Minh Hải", avatar: "", role: 0, username: "leminhhai" },
    views: 980,
    saves: 55,
    likes: 110,
    posts: 30,
    participants: 78,
    maxParticipants: 150,
    backgroundImage: "https://images.unsplash.com/photo-1517649763962-0c623066013b",
    image: "https://images.unsplash.com/photo-1517649763962-0c623066013b",
    description: "Khám phá những cung đường đẹp nhất vùng ngoại ô với cộng đồng đam mê xe đạp. Tour kéo dài 35km qua những khung cảnh thiên nhiên tuyệt đẹp và không khí trong lành.",
    category: "Đạp xe",
    location: "Cung đường ngoại ô",
    progress: 0,
    isLiked: true,
    isJoined: true,
    eventType: "offline",
    targetValue: 35,
    targetUnit: "km",
    difficulty: "Dễ",
    rules: ["Mang theo mũ bảo hiểm và nước uống", "Tuân thủ luật giao thông", "Giữ khoảng cách an toàn"],
    rewards: ["Huy hiệu Người đạp xe", "Nước uống miễn phí tại điểm dừng"],
    organizers: [{ name: "Câu lạc bộ Xe đạp Thành phố", contact: "contact@citycycling.org" }],
    faqs: [
      { question: "Loại xe đạp nào phù hợp?", answer: "Mọi loại xe đạp đều phù hợp, nhưng xe đạp đường trường hoặc hybrid sẽ thoải mái nhất." },
      { question: "Có điểm dừng nghỉ không?", answer: "Có, chúng tôi sẽ có một điểm dừng nghỉ giữa chặng." }
    ]
  },
  {
    id: 4,
    name: "Yoga ngoài trời đón bình minh",
    createdAt: "2024-04-05T06:00:00Z",
    startDate: "2025-05-25T05:30:00Z",
    endDate: "2025-05-25T07:00:00Z",
    date: "2025-05-25T05:30:00Z",
    creator: { id: 4, name: "Trần Thanh Mai", avatar: "", role: 1, username: "tranthanhmai" },
    views: 720,
    saves: 28,
    likes: 80,
    posts: 18,
    participants: 45,
    maxParticipants: 60,
    backgroundImage: "https://images.unsplash.com/photo-1591291621060-10d275a5f138", // Different image
    image: "https://images.unsplash.com/photo-1591291621060-10d275a5f138",
    description: "Chào đón ngày mới với buổi tập yoga nhẹ nhàng ngoài trời. Tận hưởng không khí trong lành và năng lượng tích cực từ thiên nhiên. Phù hợp cho mọi cấp độ.",
    category: "Yoga",
    location: "Vườn Hòa Bình",
    progress: 0,
    isLiked: false,
    isJoined: false,
    eventType: "offline",
    targetValue: 1,
    targetUnit: "buổi",
    difficulty: "Dễ",
    rules: ["Mang theo thảm tập", "Đến sớm 10 phút để chuẩn bị", "Giữ im lặng trong quá trình tập"],
    rewards: ["Trà thảo dược miễn phí", "Cảm giác thư thái"],
    organizers: [{ name: "Yoga Cộng Đồng", contact: "yoga@community.info" }],
    faqs: [
      { question: "Nếu trời mưa thì sao?", answer: "Sự kiện sẽ bị hủy nếu thời tiết xấu, chúng tôi sẽ thông báo trước." }
    ]
  },
  {
    id: 5,
    name: "Thử thách Fitness Trực tuyến",
    createdAt: "2024-04-10T19:00:00Z",
    startDate: "2025-04-14T11:30:00Z",
    endDate: "2025-04-14T12:30:00Z",
    date: "2025-04-14T11:30:00Z",
    creator: { id: 5, name: "Hoàng Minh Khang", avatar: "", role: 1, username: "hoangminhkhang" },
    views: 1100,
    saves: 60,
    likes: 150,
    posts: 40,
    participants: 65,
    maxParticipants: 150,
    backgroundImage: "https://images.unsplash.com/photo-1518310383802-640c2de311b6",
    image: "https://images.unsplash.com/photo-1518310383802-640c2de311b6",
    description: "Tham gia buổi tập thể dục trực tuyến cường độ cao cùng cộng đồng. Đốt cháy calo và tăng cường sức mạnh với các bài tập đa dạng dưới sự hướng dẫn của huấn luyện viên chuyên nghiệp.",
    category: "Fitness",
    location: "Trực tuyến",
    progress: 0,
    isLiked: false,
    isJoined: false,
    eventType: "online",
    targetValue: 1,
    targetUnit: "buổi",
    difficulty: "Trung bình",
    rules: ["Chuẩn bị không gian tập luyện", "Có sẵn khăn và nước", "Tham gia đúng giờ"],
    rewards: ["Video ghi lại buổi tập", "Kế hoạch tập luyện cá nhân"],
    organizers: [{ name: "FitOnline Club", contact: "support@fitonline.club" }],
    videoCallUrl: "https://meet.jit.si/FitConnect-FitnessChallenge",
    nextSessionTime: "2025-04-14T11:30:00Z",
    faqs: [
      { question: "Tôi có cần dụng cụ không?", answer: "Một số bài tập có thể cần tạ tay nhẹ hoặc dây kháng lực, nhưng hầu hết có thể thực hiện chỉ với trọng lượng cơ thể." }
    ]
  },
  {
    id: 7, // ID 7 was missing in detail, adding consistency
    name: "Giải Bóng rổ Cộng đồng",
    createdAt: "2024-04-12T14:00:00Z",
    startDate: "2025-08-05T14:00:00Z",
    endDate: "2025-08-07T18:00:00Z",
    date: "2025-08-05T14:00:00Z",
    creator: { id: 6, name: "Vũ Bảo Lâm", avatar: "", role: 0, username: "vubaolam" },
    views: 1500,
    saves: 70,
    likes: 180,
    posts: 55,
    participants: 120,
    maxParticipants: 200,
    backgroundImage: "https://images.unsplash.com/photo-1546519638-68e109498ffc",
    image: "https://images.unsplash.com/photo-1546519638-68e109498ffc",
    description: "Giải đấu bóng rổ thường niên sôi động dành cho các đội trong khu vực. Đăng ký theo đội hoặc cá nhân để được ghép đội. Thể hiện kỹ năng và tinh thần đồng đội!",
    category: "Bóng rổ",
    location: "Trung tâm Thể thao Thành phố",
    progress: 0,
    isLiked: false,
    isJoined: false,
    eventType: "offline",
    targetValue: 1,
    targetUnit: "giải đấu",
    difficulty: "Khó",
    rules: ["Đăng ký đúng hạn", "Tuân thủ luật thi đấu FIBA", "Tinh thần thể thao cao thượng"],
    rewards: ["Cúp vô địch", "Huy chương Vàng, Bạc, Đồng", "Giải thưởng từ nhà tài trợ"],
    organizers: [{ name: "Liên đoàn Bóng rổ Thành phố", contact: "basketball@citysports.gov" }],
    faqs: [
      { question: "Lệ phí tham gia là bao nhiêu?", answer: "Vui lòng xem chi tiết trong thông báo giải đấu." }
    ]
  },
  {
    id: 8,
    name: "Thử thách Bơi lội Mùa hè",
    createdAt: "2024-04-15T09:00:00Z",
    startDate: "2025-07-20T09:00:00Z",
    endDate: "2025-07-20T12:00:00Z",
    date: "2025-07-20T09:00:00Z",
    creator: { id: 7, name: "Đặng Thu Hà", avatar: "", role: 0, username: "dangthuha" },
    views: 880,
    saves: 42,
    likes: 90,
    posts: 22,
    participants: 55,
    maxParticipants: 100,
    backgroundImage: "https://images.unsplash.com/photo-1530549387789-4c1017266635", // Image inconsistency fixed
    image: "https://images.unsplash.com/photo-1530549387789-4c1017266635",
    description: "Giải nhiệt mùa hè với thử thách bơi lội tại hồ bơi tiêu chuẩn Olympic. Tham gia các cự ly khác nhau phù hợp với trình độ của bạn. Có huấn luyện viên hỗ trợ và giám sát an toàn.",
    category: "Bơi lội",
    location: "Hồ bơi Olympic",
    progress: 0,
    isLiked: false,
    isJoined: false,
    eventType: "offline",
    targetValue: 1.5,
    targetUnit: "km", // Example target
    difficulty: "Trung bình",
    rules: ["Đăng ký trước", "Sử dụng đồ bơi phù hợp", "Tuân thủ quy định của hồ bơi"],
    rewards: ["Huy chương hoàn thành", "Voucher giảm giá đồ bơi", "Nước tăng lực"],
    organizers: [{ name: "Câu lạc bộ Bơi lội", contact: "swimclub@email.com" }],
    faqs: [
      { question: "Có phòng thay đồ không?", answer: "Có, hồ bơi có đầy đủ phòng thay đồ và tủ khóa." }
    ]
  },
  {
    id: 9,
    name: "Chạy địa hình Khám phá Núi",
    createdAt: "2024-04-18T07:30:00Z",
    startDate: "2025-09-12T07:30:00Z",
    endDate: "2025-09-12T11:30:00Z",
    date: "2025-09-12T07:30:00Z",
    creator: { id: 8, name: "Phan Quốc Bảo", avatar: "", role: 0, username: "phanquocbao" },
    views: 1350,
    saves: 80,
    likes: 210,
    posts: 60,
    participants: 89,
    maxParticipants: 150,
    backgroundImage: "https://images.unsplash.com/photo-1483721310020-03333e577078",
    image: "https://images.unsplash.com/photo-1483721310020-03333e577078",
    description: "Trải nghiệm chạy bộ địa hình đầy thử thách với những con dốc và khung cảnh núi non hùng vĩ. Sự kiện này dành cho những người chạy có kinh nghiệm và yêu thích khám phá thiên nhiên.",
    category: "Chạy bộ",
    location: "Cung đường Mòn Núi",
    progress: 0,
    isLiked: false,
    isJoined: false,
    eventType: "offline",
    targetValue: 15, // Example target
    targetUnit: "km",
    difficulty: "Khó",
    rules: ["Trang bị giày chạy địa hình", "Mang đủ nước và đồ ăn nhẹ", "Nghiên cứu kỹ cung đường"],
    rewards: ["Huy hiệu Chinh phục Núi", "Áo thun kỷ niệm", "Ảnh chụp chuyên nghiệp"],
    organizers: [{ name: "Nhóm Trail Runners Việt Nam", contact: "info@trailrun.vn" }],
    faqs: [
      { question: "Có trạm tiếp nước không?", answer: "Có các trạm tiếp nước và kiểm tra y tế dọc đường chạy." }
    ]
  }
];

// Dữ liệu mock cho bảng xếp hạng (Giữ nguyên vì không yêu cầu thay đổi)
export const mockLeaderboard = {
  participants: [
    { rank: 1, name: "Nguyễn Thị Hương", calories: 450, time: "45:30", distance: 8.5, avatar: "", isFollowed: true, progress: 85 },
    { rank: 2, name: "Trần Văn Minh", calories: 420, time: "46:15", distance: 8.2, avatar: "", isFollowed: false, progress: 78 },
    { rank: 3, name: "Phạm Thu Trang", calories: 400, time: "47:00", distance: 8.0, avatar: "", isFollowed: true, progress: 76, isCurrentUser: true },
    { rank: 4, name: "Lê Văn Đức", calories: 380, time: "47:30", distance: 7.8, avatar: "", isFollowed: false, progress: 72 },
    { rank: 5, name: "Hoàng Thu Thảo", calories: 375, time: "48:00", distance: 7.5, avatar: "", isFollowed: false, progress: 68 },
    { rank: 6, name: "Ngô Thanh Tùng", calories: 360, time: "48:45", distance: 7.2, avatar: "", isFollowed: false, progress: 65 },
    { rank: 7, name: "Vũ Hồng Nhung", calories: 350, time: "49:15", distance: 7.0, avatar: "", isFollowed: true, progress: 62 },
    { rank: 8, name: "Đỗ Minh Quân", calories: 340, time: "50:00", distance: 6.8, avatar: "", isFollowed: false, progress: 59 }
  ],
  totalParticipants: 156, // Note: This might need dynamic calculation based on the event's actual participant list
  totalCaloriesBurned: 45600 // This should also be dynamic based on the event
};

// Dữ liệu mock cho bài đăng (Giữ nguyên vì không yêu cầu thay đổi)
export const mockPosts = [
  {
    _id: '1',
    content: 'Vừa hoàn thành 5K đầu tiên trong sự kiện này! Cảm thấy thật tuyệt vời 🏃‍♂️',
    createdAt: '2024-03-19T10:00:00Z',
    user: { _id: '1', name: 'Nguyễn Văn An', avatar: '', role: 1 },
    like_count: 24, comment_count: 5, share_count: 2, is_like: false, status: 0,
    images: [
      'https://images.unsplash.com/photo-1552674605-db6ffd4facb5',
      'https://images.unsplash.com/photo-1571008887538-b36bb32f4571'
    ]
  },
  {
    _id: '2',
    content: 'Không khí tại sự kiện thật tuyệt vời! Mọi người đều rất nhiệt tình hỗ trợ 🎉',
    createdAt: '2024-03-19T09:30:00Z',
    user: { _id: '2', name: 'Nguyễn Thị Hương', avatar: '', role: 0 },
    like_count: 18, comment_count: 3, share_count: 1, is_like: false, status: 0,
    images: []
  }
];

// Dữ liệu mock giả lập người đang tham gia phiên trực tuyến hiện tại
export const mockLiveSessionParticipants = [
  { rank: 1, name: "Nguyễn Thị Hương", avatar: "", isFollowed: true, progress: 85 }, // User follows this person
  { rank: 4, name: "Lê Văn Đức", avatar: "", isFollowed: false, progress: 72 },
  { rank: 7, name: "Vũ Hồng Nhung", avatar: "", isFollowed: true, progress: 62 }, // User follows this person
  { rank: 8, name: "Đỗ Minh Quân", avatar: "", isFollowed: false, progress: 59 },
  { rank: 10, name: "Người Lạ 1", avatar: "", isFollowed: false, progress: 50 },
  { rank: 12, name: "Người Lạ 2", avatar: "", isFollowed: false, progress: 45 },
]; 