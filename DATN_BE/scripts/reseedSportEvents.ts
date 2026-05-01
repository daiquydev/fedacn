/**
 * Script: Xóa data sport events cũ và tạo sự kiện mới cho từng danh mục thể thao
 * Chạy: npm run seed:sport-events
 */
import mongoose from 'mongoose'
import { config } from 'dotenv'
import path from 'path'
import SportEventModel from '../src/models/schemas/sportEvent.schema'
import SportCategoryModel from '../src/models/schemas/sportCategory.schema'
import UserModel from '../src/models/schemas/user.schema'

config({ path: path.join(__dirname, '../.env') })

const MONGODB_URI = process.env.MONGODB_URL || 'mongodb+srv://yugi:yugi01@datn.zqrquqt.mongodb.net/test?retryWrites=true&w=majority'

const CREATOR_EMAILS = ['user1@gmail.com', 'quy.tranquil@gmail.com', 'phamquocdung04@gmail.com']

// Ảnh bìa theo danh mục
const IMAGES: Record<string, string> = {
  'Chạy bộ': 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=1200&q=80',
  'Chạy bộ đường dài': 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=1200&q=80',
  'Chạy trail': 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1200&q=80',
  'Đạp xe': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80',
  'Đi bộ': 'https://images.unsplash.com/photo-1510020553968-60b3e6745184?w=1200&q=80',
  'Đi bộ đường dài': 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&q=80',
  'Bơi lội': 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=1200&q=80',
  'Bóng đá': 'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=1200&q=80',
  'Bóng rổ': 'https://images.unsplash.com/photo-1546519638-68711109d298?w=1200&q=80',
  'Cầu lông': 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1200&q=80',
  'Bóng chuyền': 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=1200&q=80',
  'Tennis': 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1200&q=80',
  'Cầu lông bãi biển': 'https://images.unsplash.com/photo-1619954391327-d23e1533f0e4?w=1200&q=80',
  'Trượt patin': 'https://images.unsplash.com/photo-1547347298-4074fc3086f0?w=1200&q=80',
  'Yoga': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&q=80',
  'Gym / Fitness': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=80',
  'Pilates': 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200&q=80',
  'HIIT': 'https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?w=1200&q=80',
  'Zumba': 'https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?w=1200&q=80',
  'Kickboxing': 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=1200&q=80',
  'Dance / Aerobics': 'https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?w=1200&q=80',
  'Stretching': 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&q=80',
  'Thiền': 'https://images.unsplash.com/photo-1474418397713-7ede21d49118?w=1200&q=80',
  'Cardio': 'https://images.unsplash.com/photo-1434682881908-b43d0467a798?w=1200&q=80',
  'DEFAULT': 'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=1200&q=80'
}

// Địa điểm ngoài trời theo danh mục
const OUTDOOR_LOCATIONS: Record<string, string[]> = {
  'Chạy bộ': ['Hồ Tây, Hà Nội', 'Công viên 23/9, TP.HCM', 'Bờ hồ Hoàn Kiếm, Hà Nội'],
  'Chạy bộ đường dài': ['Hồ Tây, Hà Nội', 'Đường Phạm Văn Đồng, TP.HCM', 'Hồ Xuân Hương, Đà Lạt'],
  'Chạy trail': ['Núi Bà Đen, Tây Ninh', 'Bạch Mã, Huế', 'Sơn Trà, Đà Nẵng'],
  'Đạp xe': ['Đường ven biển Mỹ Khê, Đà Nẵng', 'Ven sông Sài Gòn, TP.HCM', 'Hồ Tây, Hà Nội'],
  'Đi bộ': ['Phố cổ Hội An, Quảng Nam', 'Hồ Gươm, Hà Nội', 'Bờ kè Nhiêu Lộc, TP.HCM'],
  'Đi bộ đường dài': ['Fansipan, Lào Cai', 'Ta Năng - Phan Dũng, Bình Thuận', 'Núi Chứa Chan, Đồng Nai'],
  'Bơi lội': ['Bể bơi Mỹ Đình, Hà Nội', 'Bãi biển Mỹ Khê, Đà Nẵng', 'Bãi biển Vũng Tàu'],
  'Bóng đá': ['Sân Mỹ Đình, Hà Nội', 'Sân Thống Nhất, TP.HCM', 'Sân vận động Chi Lăng, Đà Nẵng'],
  'Bóng rổ': ['Sân bóng rổ công viên Thủ Lệ, Hà Nội', 'Nhà thi đấu Phú Thọ, TP.HCM', 'Sân bóng rổ Đà Nẵng'],
  'Cầu lông': ['Cung thể thao Quần Ngựa, Hà Nội', 'Nhà thi đấu Tinh Võ, TP.HCM', 'Sân cầu lông Thanh Xuân, Hà Nội'],
  'Bóng chuyền': ['Bãi biển Đà Nẵng', 'Sân vận động Hoa Lư, TP.HCM', 'Sân bóng chuyền bãi biển Nha Trang'],
  'Tennis': ['Sân tennis Hồ Tây, Hà Nội', 'Sân tennis Làng Đại học, TP.HCM', 'Sân tennis Đà Nẵng'],
  'Trượt patin': ['Công viên Yên Sở, Hà Nội', 'Nhà Văn hóa Thanh niên, TP.HCM', 'Công viên APEC, Đà Nẵng'],
  'DEFAULT': ['Sân vận động quốc gia, Hà Nội', 'Nhà thi đấu Phan Đình Phùng, TP.HCM', 'Trung tâm thể thao Đà Nẵng']
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/** Trả về Date ngẫu nhiên trong khoảng [from, to] */
function randomDate(from: Date, to: Date): Date {
  return new Date(from.getTime() + Math.random() * (to.getTime() - from.getTime()))
}

/** Tạo cấu hình sự kiện (start, end, createdAt) ngẫu nhiên */
function buildEventDates() {
  const aprilStart = new Date('2026-04-01T00:00:00+07:00')
  const juneEnd = new Date('2026-06-30T23:59:59+07:00')
  const now = new Date('2026-04-30T14:46:00+07:00') // thời điểm hiện tại

  const startDate = randomDate(aprilStart, juneEnd)
  const durationHours = randomInt(2, 72)
  const endDate = new Date(startDate.getTime() + durationHours * 3600 * 1000)

  // createdAt: giữa tháng 3 đến trước startDate
  const marchMid = new Date('2026-03-15T00:00:00+07:00')
  const createdAtMax = startDate < now ? startDate : now
  const createdAt = randomDate(marchMid, createdAtMax)

  return { startDate, endDate, createdAt }
}

// Tên + mô tả theo danh mục
const EVENT_CONTENT: Record<string, { names: string[]; desc: string }> = {
  'Chạy bộ': {
    names: ['Giải chạy bộ vì cộng đồng', 'Chạy bộ buổi sáng 5K', 'Cuộc chạy marathon mini', 'Fun Run tháng 5', 'Night Run Hà Nội'],
    desc: 'Sự kiện chạy bộ dành cho tất cả mọi người, từ người mới bắt đầu đến vận động viên chuyên nghiệp. Hãy cùng nhau rèn luyện sức khỏe và kết nối cộng đồng yêu thích chạy bộ!'
  },
  'Chạy bộ đường dài': {
    names: ['Long Run cuối tuần', 'Thử thách chạy đường dài 21K', 'Chạy marathon 42K'],
    desc: 'Thử thách bản thân với cự ly dài, rèn luyện sức bền và tinh thần. Phù hợp với những ai muốn nâng cao thể lực và chinh phục giới hạn của bản thân.'
  },
  'Chạy trail': {
    names: ['Trail Running Sơn Trà', 'Chinh phục núi rừng Bạch Mã', 'Trail Marathon Núi Bà Đen'],
    desc: 'Khám phá thiên nhiên hoang dã qua những cung đường trail độc đáo. Trải nghiệm cảm giác chinh phục những địa hình khó với hệ sinh thái phong phú.'
  },
  'Đạp xe': {
    names: ['Đạp xe ven biển Đà Nẵng', 'Tour đạp xe Hồ Tây', 'Giải đua xe đạp mở rộng', 'Đạp xe xuyên thành phố'],
    desc: 'Khám phá thành phố và thiên nhiên trên yên xe đạp. Sự kiện thú vị cho những tay đua nghiệp dư và chuyên nghiệp muốn trải nghiệm cung đường đẹp.'
  },
  'Đi bộ': {
    names: ['Đi bộ phố cổ Hội An', 'Walking tour Hà Nội', 'Đi bộ vì sức khỏe cộng đồng'],
    desc: 'Cùng nhau đi bộ khám phá những góc đẹp của thành phố, vừa rèn luyện sức khỏe vừa thưởng ngoạn cảnh quan. Phù hợp với mọi lứa tuổi và thể trạng.'
  },
  'Đi bộ đường dài': {
    names: ['Trekking Fansipan 3 ngày', 'Chinh phục Ta Năng - Phan Dũng', 'Leo núi Chứa Chan'],
    desc: 'Hành trình trekking đầy thử thách qua những cung đường núi rừng hùng vĩ. Kết nối với thiên nhiên và khám phá bản thân qua những bước chân dài.'
  },
  'Bơi lội': {
    names: ['Cuộc đua bơi lội 50m tự do', 'Giải bơi mở rộng mùa hè', 'Bơi biển Vũng Tàu', 'Open Water Swimming'],
    desc: 'Cuộc thi bơi lội dành cho mọi trình độ, từ người mới học đến vận động viên chuyên nghiệp. Hãy thể hiện kỹ năng bơi lội và chinh phục làn nước!'
  },
  'Bóng đá': {
    names: ['Giải bóng đá giao hữu mùa hè', 'Cúp bóng đá thanh niên', 'Futsal nội bộ cuối tuần'],
    desc: 'Giải đấu bóng đá giao hữu sôi động, nơi mọi tập thể có thể đăng ký tham gia. Tinh thần thể thao, đồng đội và niềm vui là điều quan trọng nhất!'
  },
  'Bóng rổ': {
    names: ['Giải bóng rổ 3x3 mở rộng', 'Basketball 5v5 giao hữu', 'Streetball Cup mùa hè'],
    desc: 'Sân chơi bóng rổ sôi động dành cho tất cả mọi người yêu thích bộ môn này. Cùng nhau tranh tài, học hỏi và xây dựng tinh thần đồng đội.'
  },
  'Cầu lông': {
    names: ['Giải cầu lông giao hữu tháng 5', 'Cầu lông đôi nam nữ mở rộng', 'Badminton Cup 2026'],
    desc: 'Giải đấu cầu lông thân thiện dành cho người chơi phong trào. Thi đấu đơn và đôi theo thể thức vòng tròn tính điểm. Ai cũng có thể tham gia!'
  },
  'Bóng chuyền': {
    names: ['Beach Volleyball mùa hè', 'Giải bóng chuyền bãi biển Nha Trang', 'Cúp bóng chuyền giao hữu'],
    desc: 'Sự kiện bóng chuyền bãi biển hấp dẫn dưới ánh nắng mùa hè. Thi đấu trong không khí vui vẻ, thoải mái và đầy năng lượng!'
  },
  'Tennis': {
    names: ['Giải tennis mở rộng mùa hè', 'Tennis doubles giao hữu', 'Open Tennis 2026'],
    desc: 'Giải đấu tennis dành cho tay vợt nghiệp dư và bán chuyên. Thi đấu đơn và đôi theo bảng đấu hấp dẫn, cơ hội kết nối với cộng đồng tennis.'
  },
  'Trượt patin': {
    names: ['Patin Night Roll Hà Nội', 'Roller Skate Festival', 'Trượt patin công viên cuối tuần'],
    desc: 'Buổi trượt patin vui nhộn dành cho cả gia đình và bạn bè. Từ người mới tập đến skater chuyên nghiệp đều có thể tham gia và thể hiện kỹ năng!'
  },
  'Yoga': {
    names: ['Lớp Yoga buổi sáng', 'Yoga giảm stress cuối tuần', 'Yoga flow cho người mới', 'Morning Yoga trực tuyến'],
    desc: 'Buổi tập yoga giúp cân bằng tâm trí và thể chất. Phù hợp cho người mới bắt đầu và người đã có kinh nghiệm. Mang theo thảm yoga và trang phục thoải mái!'
  },
  'Gym / Fitness': {
    names: ['Buổi tập Fitness nhóm', 'Group Workout toàn thân', 'Strength Training cùng HLV'],
    desc: 'Buổi tập fitness nhóm kết hợp cardio và strength training dưới sự hướng dẫn của huấn luyện viên chuyên nghiệp. Nâng cao thể lực và học kỹ thuật đúng chuẩn.'
  },
  'Pilates': {
    names: ['Lớp Pilates cho người mới', 'Pilates core workout', 'Pilates Reformer workshop'],
    desc: 'Lớp Pilates chú trọng cơ core và sự linh hoạt của cơ thể. Huấn luyện viên sẽ hỗ trợ điều chỉnh tư thế giúp bạn tập đúng và an toàn.'
  },
  'HIIT': {
    names: ['HIIT Cardio Blast', 'High Intensity Interval Training nhóm', 'HIIT challenge 30 phút'],
    desc: 'Buổi tập HIIT cường độ cao đốt cháy calo tối đa trong thời gian ngắn. Phù hợp cho người muốn giảm mỡ và tăng sức bền tim mạch.'
  },
  'Zumba': {
    names: ['Zumba Party cuối tuần', 'Lớp Zumba sôi động', 'Zumba Fitness cộng đồng'],
    desc: 'Lớp nhảy Zumba sôi động kết hợp âm nhạc Latin và các động tác thể dục vui nhộn. Vừa tập vừa vui, đốt calo mà không nhàm chán!'
  },
  'Kickboxing': {
    names: ['Lớp Kickboxing nhập môn', 'Cardio Kickboxing nhóm', 'Kickboxing fitness workshop'],
    desc: 'Lớp kickboxing kết hợp kỹ thuật võ thuật và cardio, giúp tăng sức mạnh, sự linh hoạt và khả năng tự vệ. Không cần kinh nghiệm trước!'
  },
  'Dance / Aerobics': {
    names: ['Lớp Aerobics buổi sáng', 'Dance Fitness vui nhộn', 'Aerobic Dance Party'],
    desc: 'Lớp aerobics kết hợp các điệu nhảy sôi động, giúp rèn luyện tim mạch và đốt calo hiệu quả. Tham gia để vận động, vui vẻ và kết bạn mới!'
  },
  'Stretching': {
    names: ['Lớp giãn cơ toàn thân', 'Mobility & Flexibility workshop', 'Stretching buổi tối thư giãn'],
    desc: 'Buổi tập giãn cơ giúp tăng tính linh hoạt và phục hồi cơ thể. Thích hợp sau buổi tập nặng hoặc cho người muốn cải thiện độ dẻo dai.'
  },
  'Thiền': {
    names: ['Buổi thiền buổi sáng', 'Meditation & Mindfulness online', 'Thiền định giảm stress'],
    desc: 'Buổi thiền định giúp thanh lọc tâm trí, giảm căng thẳng và tìm lại sự cân bằng nội tâm. Phù hợp cho người mới bắt đầu và người đã có kinh nghiệm thiền.'
  },
  'Cardio': {
    names: ['Lớp Cardio đốt mỡ', 'Cardio tổng hợp nhóm', 'Step Cardio buổi sáng'],
    desc: 'Buổi tập cardio đa dạng giúp tăng cường sức bền tim mạch và đốt cháy calo hiệu quả. Kết hợp nhiều bài tập khác nhau để không nhàm chán.'
  }
}

function buildEventForCategory(
  categoryName: string,
  eventType: 'Trong nhà' | 'Ngoài trời',
  creatorId: mongoose.Types.ObjectId,
  index: number,
  userIds: mongoose.Types.ObjectId[]
) {
  const content = EVENT_CONTENT[categoryName] || {
    names: [`Sự kiện ${categoryName} #${index + 1}`, `${categoryName} cộng đồng`, `Giải ${categoryName} mở rộng`],
    desc: `Sự kiện ${categoryName} thú vị dành cho tất cả mọi người yêu thích bộ môn này. Hãy tham gia để rèn luyện sức khỏe và kết nối cộng đồng!`
  }

  const { startDate, endDate, createdAt } = buildEventDates()

  const nameList = content.names
  const name = nameList[index % nameList.length]

  let location = ''
  if (eventType === 'Ngoài trời') {
    const locs = OUTDOOR_LOCATIONS[categoryName] || OUTDOOR_LOCATIONS['DEFAULT']
    location = locs[index % locs.length]
  }

  const image = IMAGES[categoryName] || IMAGES['DEFAULT']
  const maxParticipants = eventType === 'Ngoài trời' ? randomInt(50, 500) : randomInt(20, 100)

  let targetValue = 0;
  let targetUnit = '';
  if (eventType === 'Ngoài trời') {
    targetValue = randomInt(5, 50);
    targetUnit = 'km';
  } else {
    targetValue = randomInt(30, 120);
    targetUnit = 'phút';
  }

  return {
    name,
    description: content.desc,
    category: categoryName,
    startDate,
    endDate,
    location,
    maxParticipants,
    participants: userIds.length,
    participants_ids: userIds,
    targetValue,
    targetUnit,
    image,
    eventType,
    createdBy: creatorId,
    createdAt,
    updatedAt: createdAt
  }
}

async function run() {
  try {
    console.log('🔌 Đang kết nối MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Kết nối thành công!')

    // Lookup creators
    const creators: mongoose.Types.ObjectId[] = []
    for (const email of CREATOR_EMAILS) {
      const u = await (UserModel as any).findOne({ email }).select('_id email').lean()
      if (u) {
        creators.push(u._id as mongoose.Types.ObjectId)
        console.log(`✅ Tìm thấy user: ${email}`)
      } else {
        console.warn(`⚠️  Không tìm thấy user: ${email}`)
      }
    }
    if (creators.length === 0) {
      console.error('❌ Không tìm thấy user nào trong danh sách. Hủy seed.')
      process.exit(1)
    }

    // Load all sport categories
    const categories = await SportCategoryModel.find({ isDeleted: { $ne: true } }).lean()
    if (categories.length === 0) {
      console.error('❌ Không có danh mục thể thao nào trong DB!')
      process.exit(1)
    }
    console.log(`📋 Tìm thấy ${categories.length} danh mục thể thao.`)

    // Load all active users
    const allUsers = await UserModel.find({ isDeleted: { $ne: true } }).select('_id').lean()
    const allUserIds = allUsers.map(u => u._id as mongoose.Types.ObjectId)
    console.log(`👥 Tìm thấy ${allUserIds.length} users để thêm vào sự kiện.`)

    // Xóa toàn bộ events cũ và các activity tracking liên quan
    console.log('🗑️  Xóa toàn bộ sport events và data tracking cũ...')
    await SportEventModel.deleteMany({})
    await mongoose.model('activity_tracking', new mongoose.Schema({}, {strict: false})).deleteMany({})
    await mongoose.model('sport_event_progress', new mongoose.Schema({}, {strict: false})).deleteMany({})

    // Tạo sự kiện cho từng danh mục (2-3 sự kiện mỗi danh mục)
    const eventsToInsert: any[] = []

    for (const cat of categories) {
      const eventType = cat.type // 'Trong nhà' | 'Ngoài trời'
      const count = randomInt(2, 3)
      for (let i = 0; i < count; i++) {
        const creator = creators[Math.floor(Math.random() * creators.length)]
        const evt = buildEventForCategory(cat.name, eventType, creator, i, allUserIds)
        eventsToInsert.push(evt)
      }
    }

    // Chèn vào DB với createdAt tùy chỉnh
    await SportEventModel.collection.insertMany(eventsToInsert)

    const now = new Date('2026-04-30T14:46:00+07:00')
    const upcoming = eventsToInsert.filter(e => e.startDate > now).length
    const ongoing = eventsToInsert.filter(e => e.startDate <= now && e.endDate >= now).length
    const ended = eventsToInsert.filter(e => e.endDate < now).length

    console.log(`✅ Đã tạo ${eventsToInsert.length} sự kiện thể thao!`)
    console.log(`   📅 Sắp diễn ra: ${upcoming}`)
    console.log(`   🟢 Đang diễn ra: ${ongoing}`)
    console.log(`   ⏹️  Đã kết thúc: ${ended}`)

    await mongoose.disconnect()
    console.log('🔌 Đã ngắt kết nối MongoDB.')
    process.exit(0)
  } catch (err) {
    console.error('❌ Lỗi:', err)
    await mongoose.disconnect()
    process.exit(1)
  }
}

run()
