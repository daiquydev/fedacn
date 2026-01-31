import SportEventModel from '~/models/schemas/sportEvent.schema'
import { Types } from 'mongoose'

const sportEventsData = [
  {
    name: "Thử thách chạy sáng 10K",
    description: "Tham gia cùng chúng tôi trong thử thách chạy sáng 10K. Một cơ hội tuyệt vời để rèn luyện sức khỏe và gặp gỡ những người yêu thích chạy bộ.",
    detailedDescription: "Thử thách chạy sáng 10K là một sự kiện chạy bộ hàng năm được tổ chức để khuyến khích cộng đồng rèn luyện sức khỏe. Sự kiện này phù hợp cho cả những người chạy chuyên nghiệp và người mới bắt đầu. Chúng tôi sẽ chuẩn bị các trạm hỗ trợ dọc đường chạy, nước uống miễn phí, và các HLV chuyên nghiệp sẽ hỗ trợ bạn.",
    category: "Chạy bộ",
    startDate: new Date("2025-06-01T06:00:00Z"),
    endDate: new Date("2025-06-01T08:00:00Z"),
    location: "Công viên Tây Hồ, Hà Nội",
    address: "Công viên Tây Hồ, Phường Thục Lâm, Quận Tây Hồ, Hà Nội",
    distance: "10km (Dành cho người bắt đầu)",
    maxParticipants: 500,
    image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=500&h=400",
    eventType: "offline",
    participants: 0,
    participants_ids: [],
    organizer: "Câu lạc bộ Chạy bộ Hà Nội",
    requirements: "Mang giày chạy bộ phù hợp, quần áo thoải mái, nước uống đủ, khăn lau mồ hôi",
    benefits: "Huy hiệu hoàn thành, áo kỷ niệm, ăn nhẹ sau sự kiện"
  },
  {
    name: "Lớp Yoga online buổi sáng",
    description: "Tham gia lớp yoga online với những giáo viên chuyên nghiệp. Phù hợp cho người mới bắt đầu.",
    detailedDescription: "Lớp yoga online buổi sáng được dẫn dắt bởi các giáo viên yoga chứng chỉ quốc tế. Chúng tôi tập trung vào sự kết hợp giữa các tư thế yoga truyền thống và thiền tập. Mỗi buổi học kéo dài 60 phút, bao gồm 10 phút khởi động, 40 phút tập yoga, và 10 phút thả lỏng cuối buổi.",
    category: "Yoga",
    startDate: new Date("2025-06-02T07:00:00Z"),
    endDate: new Date("2025-06-02T08:00:00Z"),
    location: "Trực tuyến - Zoom",
    address: "Link Zoom sẽ được gửi qua email sau khi đăng ký",
    distance: "Trực tuyến (không xác định)",
    maxParticipants: 100,
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500&h=400",
    eventType: "online",
    participants: 0,
    participants_ids: [],
    organizer: "Yoga Center Namaste",
    requirements: "Chuẩn bị thảm yoga, không ăn vào 1-2 giờ trước lớp, mặc quần áo thoải mái",
    benefits: "Cảm giác thư giãn, cải thiện dẻo dai, giảm stress"
  },
  {
    name: "Đạp xe phượt mộc châu",
    description: "Chuyến đạp xe phượt 2 ngày 1 đêm tới mộc châu. Mỗi người chuẩn bị đồ ăn, nước và xe đạp của mình.",
    detailedDescription: "Chuyến phượt bằng xe đạp tới Mộc Châu kéo dài 2 ngày 1 đêm. Chúng tôi sẽ đi qua những cung đường đẹp, chiêm ngưỡng cảnh đồng hồng, và thác nước tuyệt đẹp. Đây là cơ hội tuyệt vời để khám phá thiên nhiên và gặp gỡ những người có cùng sở thích.",
    category: "Đạp xe",
    startDate: new Date("2025-06-07T06:00:00Z"),
    endDate: new Date("2025-06-08T18:00:00Z"),
    location: "Điểm tập trung: Hà Nội",
    address: "Điểm tập trung: Công viên Thống Nhất lúc 6:00 sáng, ngày 7/6/2025",
    distance: "Tổng cộng 90km (Ngày 1: 45km, Ngày 2: 45km)",
    maxParticipants: 50,
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=400",
    eventType: "offline",
    participants: 0,
    participants_ids: [],
    organizer: "Cycling Club Adventure Việt Nam",
    requirements: "Xe đạp địa hình trong tình trạng tốt, đồ ăn và nước uống, áo phao bảo vệ, dụng cụ sơ cứu cơ bản",
    benefits: "Huy hiệu khám phá, bảng xếp hạng top tốc độ, ăn tối đặc biệt tại Mộc Châu"
  },
  {
    name: "Bơi lội cạnh tranh 50m",
    description: "Cuộc thi bơi lội cạnh tranh 50m tự do. Dành cho tất cả các trình độ.",
    detailedDescription: "Cuộc thi bơi lội 50m tự do được tổ chức bởi hiệp hội bơi lội chuyên nghiệp. Sự kiện này không chỉ là một cuộc thi mà còn là cơ hội để bạn kiểm tra kỹ năng bơi lội của mình. Có các giáo viên bơi lội sẽ theo dõi kỹ thuật bơi lội của bạn và đưa ra những lời khuyên hữu ích.",
    category: "Bơi lội",
    startDate: new Date("2025-06-10T09:00:00Z"),
    endDate: new Date("2025-06-10T12:00:00Z"),
    location: "Bể bơi Quốc gia Mỹ Đình",
    address: "Bể bơi Quốc gia Mỹ Đình, Đại lộ Thăng Long, Quận Tây Hồ, Hà Nội",
    distance: "50m (đơn vị tính)",
    maxParticipants: 200,
    image: "https://images.unsplash.com/photo-1576610616656-f087ee265718?w=500&h=400",
    eventType: "offline",
    participants: 0,
    participants_ids: [],
    organizer: "Hiệp hội Bơi lội Hà Nội",
    requirements: "Biết bơi cơ bản, mang đồ bơi chuẩn chỉnh, mũ bơi, kính bơi",
    benefits: "Huy chương theo thứ hạng, chứng chỉ tham gia, nước uống miễn phí"
  },
  {
    name: "Fitness Group Workout",
    description: "Buổi tập fitness nhóm với các động tác kết hợp cardio và strength training.",
    detailedDescription: "Buổi tập fitness nhóm được thiết kế để kết hợp các bài tập cardio và strength training. Chúng tôi sẽ tập trung vào việc xây dựng cơ bắp, cải thiện sức bền, và tăng cường sức khỏe tim mạch. Các HLV chuyên nghiệp sẽ hướng dẫn bạn từng bước và đảm bảo bạn thực hiện các bài tập đúng cách.",
    category: "Fitness",
    startDate: new Date("2025-06-03T18:00:00Z"),
    endDate: new Date("2025-06-03T19:00:00Z"),
    location: "Phòng tập Gold Gym - Cầu Giấy",
    address: "Phòng tập Gold Gym, 123 Đường Cầu Giấy, Quận Cầu Giấy, Hà Nội",
    distance: "Không xác định (dựa trên bài tập)",
    maxParticipants: 30,
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&h=400",
    eventType: "offline",
    participants: 0,
    participants_ids: [],
    organizer: "Gold Gym Hà Nội",
    requirements: "Mang giày tập luyện, quần áo thể thao, khăn lau mồ hôi, nước uống",
    benefits: "Tập luyện cùng HLV chuyên nghiệp, đo body fat miễn phí, khuyến mãi membership"
  },
  {
    name: "Bóng rổ giao hữu",
    description: "Trận đấu bóng rổ giao hữu giữa các đội. Ai cũng có thể tham gia.",
    detailedDescription: "Trận đấu bóng rổ giao hữu được tổ chức để tạo cơ hội cho những người yêu thích bóng rổ có thể gặp nhau và chơi. Đây là một sự kiện vui vẻ, không cạnh tranh quá mức, nhưng vẫn đầy tinh thần thể thao. Các cầu thủ mới bắt đầu và cư thủ giàu kinh nghiệm đều được chào đón.",
    category: "Bóng rổ",
    startDate: new Date("2025-06-05T19:00:00Z"),
    endDate: new Date("2025-06-05T21:00:00Z"),
    location: "Sân bóng rổ công viên Thủ Lệ",
    address: "Sân bóng rổ công viên Thủ Lệ, Đường Thủ Lệ, Quận Ba Đình, Hà Nội",
    distance: "Sân tiêu chuẩn 15x28m",
    maxParticipants: 60,
    image: "https://images.unsplash.com/photo-1546519638-68711109d298?w=500&h=400",
    eventType: "offline",
    participants: 0,
    participants_ids: [],
    organizer: "Câu lạc bộ Bóng rổ Hà Nội",
    requirements: "Giày thể thao bóng rổ, quần áo thể thao, bóng rổ của chính mình (tùy chọn)",
    benefits: "Trải nghiệm chơi bóng rổ trong không khí vui vẻ, ăn nhẹ sau trận"
  },
  {
    name: "Cầu lông buổi chiều",
    description: "Hoạt động cầu lông thường xuyên vào chiều thứ 3 và thứ 5 hàng tuần.",
    detailedDescription: "Hoạt động cầu lông buổi chiều là một hoạt động định kỳ vào mỗi chiều thứ 3 và thứ 5 hàng tuần. Đây là cơ hội tuyệt vời để bạn rèn luyện kỹ năng cầu lông, tăng cường sức khỏe, và gặp gỡ những người có cùng sở thích. Các ván đấu được tổ chức theo luật cầu lông chính thức, nhưng với tinh thần vui vẻ và thân thiện.",
    category: "Cầu lông",
    startDate: new Date("2025-06-04T16:00:00Z"),
    endDate: new Date("2025-06-04T17:30:00Z"),
    location: "Câu lạc bộ Cầu lông Thanh Xuân",
    address: "Câu lạc bộ Cầu lông Thanh Xuân, 456 Đường Thanh Xuân, Quận Thanh Xuân, Hà Nội",
    distance: "Sân cầu lông tiêu chuẩn 17x8.17m",
    maxParticipants: 24,
    image: "https://images.unsplash.com/photo-1553531088-f352bff5ef6e?w=500&h=400",
    eventType: "offline",
    participants: 0,
    participants_ids: [],
    organizer: "Câu lạc bộ Cầu lông Thanh Xuân",
    requirements: "Giày cầu lông, quần áo thoải mái, vợt cầu lông của chính mình",
    benefits: "Rèn luyện kỹ năng, khoảng thời gian tập luyện có cấu trúc, nước uống và nước ngọt miễn phí"
  },
  {
    name: "Marathon Hà Nội 2025",
    description: "Cuộc chạy marathon dài 42km qua các con đường chính của Hà Nội. Sự kiện thế niên kỳ.",
    detailedDescription: "Marathon Hà Nội 2025 là sự kiện chạy bộ lớn nhất trong năm, với đường chạy 42km qua các điểm nổi tiếng của Hà Nội. Sự kiện này thu hút hơn 5000 người chạy từ khắp nơi. Có các trạm hỗ trợ mỗi 2-3km, đội cứu hộ sẽ theo dõi toàn bộ quá trình, và các huy chương sẽ được trao cho những người hoàn thành cuộc chạy.",
    category: "Chạy bộ",
    startDate: new Date("2025-08-15T05:00:00Z"),
    endDate: new Date("2025-08-15T12:00:00Z"),
    location: "Điểm xuất phát: Hồ Gươm, Hà Nội",
    address: "Điểm xuất phát: Hồ Gươm (Hoan Kiếm), Hoàn Kiếm, Hà Nội",
    distance: "42km (Full Marathon)",
    maxParticipants: 5000,
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&h=400",
    eventType: "offline",
    participants: 0,
    participants_ids: [],
    organizer: "Hiệp hội Marathon Hà Nội",
    requirements: "Giày chạy marathon, quần áo chuyên dụng, nước uống, bảng số dán trên áo, ID bảo hiểm",
    benefits: "Huy chương hoàn thành, áo kỷ niệm, ảnh chuyên nghiệp, bữa ăn nhẹ sau cuộc chạy"
  }
]

export const seedSportEventsData = async () => {
  try {
    const count = await SportEventModel.countDocuments()
    
    // Only seed if collection is empty
    if (count === 0) {
      console.log('🏃 Seeding sport events...')
      
      // Use a default admin user ID - in production you'd get a real user
      const adminUserId = new Types.ObjectId('507f1f77bcf86cd799439011') // Placeholder ID
      
      const eventsToInsert = sportEventsData.map(event => ({
        ...event,
        createdBy: adminUserId
      }))
      
      await SportEventModel.insertMany(eventsToInsert)
      console.log(`✅ Successfully seeded ${eventsToInsert.length} sport events`)
    } else {
      console.log(`ℹ️ Sport events collection already has ${count} documents, skipping seed`)
    }
  } catch (error) {
    console.error('❌ Error seeding sport events:', error)
  }
}
