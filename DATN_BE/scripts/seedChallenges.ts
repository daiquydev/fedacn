/**
 * Seed thử thách demo: đủ 3 loại (ăn uống, ngoài trời, thể dục),
 * mỗi môn/danh mục × 3 visibility: public | friends | private.
 *
 * Chạy: npx ts-node -r tsconfig-paths/register ./scripts/seedChallenges.ts
 * Xóa bản seed cũ: SEED_CHALLENGES_REPLACE=1 (cuối description có ‖fedacn-seed‖ hoặc tiêu đề cũ [FedACN Seed])
 *
 * Người tạo: ngẫu nhiên một trong hai email (ít nhất một tài khoản phải tồn tại trong DB).
 *   quy.tranquil@gmail.com | phamquocdung04@gmail.com
 */
import mongoose from 'mongoose'
import { config } from 'dotenv'
import path from 'path'

import ChallengeModel from '../src/models/schemas/challenge.schema'
import UserModel from '../src/models/schemas/user.schema'
import ExerciseModel from '../src/models/schemas/exercise.schema'
import SportCategoryModel from '../src/models/schemas/sportCategory.schema'

config({ path: path.join(__dirname, '../.env') })

const MONGODB_URL = process.env.MONGODB_URL || ''
const REPLACE = process.env.SEED_CHALLENGES_REPLACE === '1' || process.env.SEED_CHALLENGES_REPLACE === 'true'

/** Marker ẩn để REPLACE xóa đúng bản seed, không cần prefix trên tiêu đề */
const SEED_MARKER = '\n\n‖fedacn-seed‖'

const CREATOR_EMAILS = ['quy.tranquil@gmail.com', 'phamquocdung04@gmail.com'] as const

type Visibility = 'public' | 'friends' | 'private'

type Difficulty = 'easy' | 'medium' | 'hard'

function appendSeedMarker(text: string): string {
  return text.trimEnd() + SEED_MARKER
}

/** Tháng 4/2026 theo giờ Việt Nam (UTC+7) */
function april2026RangeVN() {
  return {
    start_date: new Date('2026-03-31T17:00:00.000Z'),
    end_date: new Date('2026-04-30T16:59:59.999Z')
  }
}

function visibilityToPublicFlag(v: Visibility): boolean {
  return v !== 'private'
}

function pickCreatorEmail(): string {
  return CREATOR_EMAILS[Math.floor(Math.random() * CREATOR_EMAILS.length)]
}

/** Ảnh cover: URL đầy đủ (FE getImageUrl giữ nguyên https) */
const IMG = {
  run: 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=1400&q=85',
  bike: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=1400&q=85',
  walk: 'https://images.unsplash.com/photo-1510020553968-60b3e6745184?w=1400&q=85',
  hike: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1400&q=85',
  trail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=85',
  skate: 'https://images.unsplash.com/photo-1547347298-4074fc3086f0?w=1400&q=85',
  marathon: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=1400&q=85',
  salad: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1400&q=85',
  mealprep: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=1400&q=85',
  veggies: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=1400&q=85',
  vegan: 'https://images.unsplash.com/photo-1511690743698-d9d0f2aea9e5?w=1400&q=85',
  breakfast: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=1400&q=85',
  gym: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1400&q=85',
  yoga: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1400&q=85',
  hiit: 'https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?w=1400&q=85',
  swim: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=1400&q=85',
  dance: 'https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?w=1400&q=85',
  stretch: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1400&q=85',
  meditate: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1400&q=85',
  cardio: 'https://images.unsplash.com/photo-1434682881908-b43d0467a798?w=1400&q=85',
  scale: 'https://images.unsplash.com/photo-1581579188871-45c05d6a90d3?w=1400&q=85',
  fruit: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=1400&q=85'
} as const

type OutdoorCopy = {
  image: string
  goalKm: number
  difficulty: Difficulty
  public: { title: string; body: string }
  friends: { title: string; body: string }
  private: { title: string; body: string }
}

const OUTDOOR_COPY: Record<string, OutdoorCopy> = {
  'Chạy bộ': {
    image: IMG.run,
    goalKm: 5,
    difficulty: 'medium',
    public: {
      title: 'Tháng 4: 5km mỗi ngày — cùng cộng đồng “bật mode năng lượng”',
      body: 'Không cần pace khủng, chỉ cần ra đường đều đặn. Check-in km + ảnh tập nếu có — mình cùng nhau kéo nhịp cardio sau Tết Nguyên Đán. Tip: khởi động 5 phút, giày êm chân, tránh nắng gắt giữa trưa.'
    },
    friends: {
      title: 'Rủ hội chạy: thử thách 5km/ngày suốt tháng 4',
      body: 'Tạo nhóm nhỏ trong bạn bè, ai miss buổi thì hôn nhẹ một ly nước ép (tự nguyện!). Mục tiêu: duy trì nhịp tim vừa phải, không bon chen leaderboard — quan trọng là lên giường mỗi tối biết mình đã cử động.'
    },
    private: {
      title: 'Cá nhân: 30 ngày chạy bộ — chỉ mình tôi và đôi giày',
      body: 'Journal ngắn sau mỗi buổi: cảm giác gối, nhịp thở, tâm trạng. 5km/ngày có thể chia 2 slot sáng/tối nếu bận — miễn tổng trong ngày đạt.'
    }
  },
  'Đạp xe': {
    image: IMG.bike,
    goalKm: 15,
    difficulty: 'medium',
    public: {
      title: 'Pedal April: 15km đạp xe mỗi ngày — gió mát, đùi săn',
      body: 'Phù hợp đi làm, đạp quanh hồ hoặc long đồng hồ cuối tuần. Nhớ bật đèn và mũ bảo hiểm; log km + thời gian để ước lượng calo cho đúng app.'
    },
    friends: {
      title: 'Team đạp: 15km/ngày — ai “bonk” cuối tuần được tag meme',
      body: 'Lịch gợi ý: 3 ngày đạp nhẹ đi làm + 2 ngày cuối tuần đạp dài. Share strava / ảnh cua cà phê sau ride — vui là chính.'
    },
    private: {
      title: 'Thử thách đạp xe cá nhân — 15km/ngày, không cần khoe',
      body: 'Theo dõi tiến độ cho riêng bạn. Nếu trời mưa: máy đạp trong nhà tính quy đổi tương đương (ghi chú trong notes).'
    }
  },
  'Đi bộ': {
    image: IMG.walk,
    goalKm: 6,
    difficulty: 'easy',
    public: {
      title: 'Walk 6km/ngày — “đi bộ là thuốc” cho tháng 4',
      body: 'Nghe podcast, đi sau bữa trưa để hạ đường huyết nhẹ. Không cần liên tục — cộng dồn bước trong ngày cũng được nếu app đồng bộ.'
    },
    friends: {
      title: 'Hẹn bạn bè đi bộ: 6km/ngày, vừa tám vừa đốt calo',
      body: 'Cuối tuần rủ nhau công viên; ngày thường tự đi nhưng khoe ảnh sunset. Ai đạt streak 1 tuần được tự thưởng trà sữa size M (ừ thì… vẫn đi bộ!).'
    },
    private: {
      title: 'Im lặng và đi: 6km mỗi ngày cho clear đầu óc',
      body: 'Ưu tiên giấc ngủ + đi bộ tối. Mục tiêu mental health ngang cardio — không so sánh với ai.'
    }
  },
  'Đi bộ đường dài': {
    image: IMG.hike,
    goalKm: 8,
    difficulty: 'hard',
    public: {
      title: 'Hiking nhẹ: 8km quãng đường dài mỗi ngày (hoặc gom cuối tuần)',
      body: 'Leo dốc nhẹ, balo 5–8% trọng lượng cơ thể. Mang đủ nước + snack muối kali. Nếu không leo núi hàng ngày: gom 2 ngày cuối tuần nhưng vẫn log đủ trung bình/ngày theo tuần — linh hoạt trong tháng 4.'
    },
    friends: {
      title: 'Crew trekking: 8km/ngày — tháng 4 tranh thủ trời mát',
      body: 'Chia sẻ định vị, đồ bảo hộ, first-aid mini. Chụp panorama là bắt buộc (đùa — nhưng có thì vui hơn).'
    },
    private: {
      title: 'Solo hiker: thử thách quãng dài 8km/ngày — nhật ký im lặng',
      body: 'Tập nhịp thở khi lên dốc. Nếu đau gối: giảm km xuống 5 và báo trong notes — không ai đánh giá.'
    }
  },
  'Chạy trail': {
    image: IMG.trail,
    goalKm: 4,
    difficulty: 'hard',
    public: {
      title: 'Trail April: 4km off-road mỗi ngày — bùn, dốc và endorphin',
      body: 'Giày trail + gậy nếu cần. Tránh đường trơn sau mưa; ưu tiên an toàn hơn PR. Check-in kèm độ dốc cảm nhận được là hay.'
    },
    friends: {
      title: 'Hội chạy đất: 4km trail/ngày — ngã thì cười, không drama',
      body: 'Rủ đúng người thích leo cọc tìm. Chia sẻ tọa độ đường chạy đẹp; cảnh báo chó nhà và đoạn trơn.'
    },
    private: {
      title: 'Trail riêng tư: 4km/ngày — chỉ mình tôi và con dốc',
      body: 'Tập nhìn chân 3 bước phía trước. Nếu hôm nào chỉ chạy road: ghi rõ để khỏi “ảo trail”.'
    }
  },
  'Trượt patin': {
    image: IMG.skate,
    goalKm: 5,
    difficulty: 'medium',
    public: {
      title: 'Roll tháng 4: 5km patin/inline mỗi ngày',
      body: 'Mũ + bảo vệ cổ tay là must. Sân flat tốt cho newbie; vòng hồ lý tưởng buổi tối. Log km tương đương quãng trượt thực tế.'
    },
    friends: {
      title: 'Crew patin: 5km/ngày — nhạc lo-fi và vài cú ngã “để đời”',
      body: 'Quay slow-mo ngã hài hước (optional). Hỗ trợ nhau chỉnh frame boot cho đỡ phồng chân.'
    },
    private: {
      title: 'Patin một mình: 5km/ngày, tập cân bằng không khán giả',
      body: 'Focus kỹ thuật: đẩy hông, gót chân, hãm chữ V. Tháng 4 mục tiêu là ổn định, không trick nguy hiểm.'
    }
  },
  'Chạy bộ đường dài': {
    image: IMG.marathon,
    goalKm: 10,
    difficulty: 'hard',
    public: {
      title: 'Base build tháng 4: 10km chạy bộ đường dài mỗi ngày (advanced)',
      body: 'Dành cho runner đã quen 5km+. Chia easy run + strides nhẹ; nghe cơ thể — đau căng cơ thì giảm 20% quãng. Hydrate có điện giải nếu >60 phút.'
    },
    friends: {
      title: 'Nhóm long run: 10km/ngày — pacing cho nhau, không drop ai',
      body: 'Mỗi tuần 1 buổi “coffee jog” chậm rãi. Share playlist BPM 160–170 cho tempo vừa.'
    },
    private: {
      title: 'Long run cá nhân: 10km/ngày — nhật ký runner introvert',
      body: 'Ghi chú nhịp tim trung bình nếu có đồng hồ. Mục tiêu là nền tảng, không bon chen sub3.'
    }
  }
}

function outdoorFallback(catName: string, kcal: number): OutdoorCopy {
  return {
    image: IMG.cardio,
    goalKm: 5,
    difficulty: 'medium',
    public: {
      title: `Tháng 4 năng động: ${catName} — 5km mỗi ngày (công khai)`,
      body: `Thử thách ${catName.toLowerCase()} trong 30 ngày. ~${kcal} kcal/km ước tính; chỉnh theo cảm nhận cơ thể. Mang nước, tránh nắng gắt.`
    },
    friends: {
      title: `Rủ team: ${catName} 5km/ngày suốt tháng 4`,
      body: 'Không cạnh tranh sát nút — ai miss buổi thì bù vào ngày hôm sau. Chia ảnh hoàng hôn là đủ vui.'
    },
    private: {
      title: `Cá nhân: ${catName} 5km/ngày — chỉ mình tôi biết`,
      body: 'Theo dõi tiến độ kín. Nếu mưa bão: chuyển indoor tương đương (ghi chú rõ).'
    }
  }
}

const NUTRITION_THEMES: Array<{
  category: string
  image: string
  goal_value: number
  difficulty: Difficulty
  public: { title: string; body: string }
  friends: { title: string; body: string }
  private: { title: string; body: string }
  emoji: string
}> = [
  {
    category: 'Ăn sạch',
    image: IMG.salad,
    goal_value: 3,
    difficulty: 'medium',
    emoji: '🥗',
    public: {
      title: 'Challenge “bếp nhà thắng delivery” — 3 bữa log/ngày',
      body: 'Ưu tiên rau, đạm lean, tinh bột hợp lý. Chụp đĩa ăn + ghi chú cảm giác no 7/10. Tháng 4 mình ăn để khỏe chứ không để stress đếm macro từng gram.'
    },
    friends: {
      title: 'Nhóm bạn: 3 bữa “sạch” có chủ đích — không toxic diet',
      body: 'Share meal prep Chủ nhật; thứ 3–5 rotate công thức. Ai ăn ngoài thì chọn quán minh bạch calo — không ai cấm phở, chỉ cần log thật.'
    },
    private: {
      title: 'Riêng tư: reset ăn uống — 3 bữa log/ngày, không khoe story',
      body: 'Mục tiêu là nhất quán, không perfect. Nếu có tiệc: log luôn, ghi “flex day” trong notes — không xóa để tự lừa dối.'
    }
  },
  {
    category: 'Giảm cân',
    image: IMG.scale,
    goal_value: 3,
    difficulty: 'hard',
    emoji: '📉',
    public: {
      title: 'Cut nhẹ tháng 4: deficit thông minh — 3 bữa check-in/ngày',
      body: 'Không bỏ bữa sáng để “tiết kiệm calo”. Ưu tiên protein + chất xơ để đỡ thèm. Cân mỗi sáng sau khi đi vệ sinh — nhưng chỉ lấy trend tuần, không ám ảnh +/-0.1kg.'
    },
    friends: {
      title: 'Squad giảm cân lành mạnh: cùng log 3 bữa, không body shame',
      body: 'Khoe món low-cal ngon thay vì khoe số cân. Thách nhau uống đủ 2L nước — dễ hơn thách nhịn carb.'
    },
    private: {
      title: 'Hành trình cá nhân: giảm cân khoa học — chỉ mình tôi thấy số liệu',
      body: 'Ghi sleep + stress trong notes khi thèm ăn đêm. Một tuần cho phép 1 bữa mind-free nhưng vẫn chụp ảnh để nhận thức portion.'
    }
  },
  {
    category: 'Detox nhẹ',
    image: IMG.veggies,
    goal_value: 3,
    difficulty: 'easy',
    emoji: '🍋',
    public: {
      title: 'Detox kiểu “bác sĩ không cấm”: nhiều nước, ít chiên — 3 bữa log',
      body: 'Không nhịn tinh bột cực đoan. Tăng trà không đường, rau xanh, trái cây whole fruit. Tránh juice ép sẵn sugar bomb.'
    },
    friends: {
      title: 'Hội detox nhẹ: smoothie xanh không biến thành competition khổ',
      body: 'Chia recipe 15 phút; ai làm được prep 2 ngày được tự hào (không cần trophy).'
    },
    private: {
      title: 'Detox riêng: reset sau Tết — log 3 bữa, không flex Instagram',
      body: 'Theo dõi da + tiêu hóa trong notes. Nếu chóng mặt: tăng muối và carb phức hợp — health > aesthetic.'
    }
  },
  {
    category: 'Chay',
    image: IMG.vegan,
    goal_value: 3,
    difficulty: 'medium',
    emoji: '🌱',
    public: {
      title: 'Ăn chay có kế hoạch — đủ đạm, đủ B12 (supplement) — 3 bữa/ngày',
      body: 'Đậu, đậu hũ, tempeh, sữa đậu không đường. Tránh chay giả nhiều dầu. Log để đảm bảo không chỉ ăn rau + cơm trắng.'
    },
    friends: {
      title: 'Nhóm chay flexitarian: 3 bữa log — thử món mới mỗi tuần',
      body: 'Sunday cook-along qua voice chat; share chợ online mua được gì. Không moralize người ăn mặn.'
    },
    private: {
      title: 'Chay cá nhân: 30 ngày tháng 4 — nhật ký dinh dưỡng kín',
      body: 'Ghi lại khi nào thiếu protein (mệt, đói sớm). Điều chỉnh khẩu phần đậu cho đủ no 4h.'
    }
  },
  {
    category: 'Ít đường',
    image: IMG.fruit,
    goal_value: 3,
    difficulty: 'medium',
    emoji: '🍯',
    public: {
      title: 'Sugar-aware April: cắt đồ ngọt thừa — 3 bữa log có “đường ẩn”',
      body: 'Đọc nhãn sữa chua, sốt cà chua, đồ uống “healthy”. Trà sữa 30% đường vẫn được nhưng log thật — minh bạch là win.'
    },
    friends: {
      title: 'Team bỏ nước ngọt có ga: thách nhau 21 ngày đầu strict',
      body: 'Ai sneak thì mời trà đá chanh team (vui). Share substitute: soda chanh, cold brew không đường.'
    },
    private: {
      title: 'Giảm đường một mình: log 3 bữa — không áp lựi social',
      body: 'Ghi craving lúc mấy giờ — thường là stress không phải đói. Thử 10 squat hoặc trà ấm trước khi mở app đặt đồ.'
    }
  },
  {
    category: 'Tăng cơ',
    image: IMG.mealprep,
    goal_value: 4,
    difficulty: 'hard',
    emoji: '💪',
    public: {
      title: 'Bulk sạch mini tháng 4: 4 bữa log/ngày (pre + post workout)',
      body: 'Protein chia đều các bữa; carb quanh buổi tập. Không cần shake 5 lần — ưu tiên thực phẩm whole. Ngủ đủ 7h = miễn phí gain.'
    },
    friends: {
      title: 'Hội gym-bếp: 4 bữa log — chia recipe đạm cao dễ mang đi làm',
      body: 'Sunday meal prep chung list Costco/chợ. Khoe PR gym kèm ảnh cơm hộp là combo chuẩn.'
    },
    private: {
      title: 'Lean gain cá nhân: 4 bữa/ngày — data chỉ cho tôi',
      body: 'Theo dõi cân nặng + mirror check tuần. Nếu tăng quá nhanh: giảm 200kcal snack đêm.'
    }
  },
  {
    category: 'Cân bằng',
    image: IMG.breakfast,
    goal_value: 3,
    difficulty: 'easy',
    emoji: '⚖️',
    public: {
      title: 'Đĩa cân bằng Harvard-style — 3 bữa log, không cân đong',
      body: '1/2 rau, 1/4 đạm, 1/4 tinh bột + chất béo lành. Áp dụng được ở cơm tấm, phở (linh hoạt) — quan trọng là nhận thức phần ăn.'
    },
    friends: {
      title: 'Cùng bạn ăn đủ nhóm chất — challenge ảnh đĩa ăn màu sắc',
      body: 'Rainbow plate challenge: ít nhất 3 màu rau mỗi bữa. Không toxic “sạch hoàn hảo”.'
    },
    private: {
      title: 'Ăn cân bằng riêng tư: 3 bữa log để không bị judge “ăn ít quá / nhiều quá”',
      body: 'Ghi mood trước và sau bữa. Mục tiêu là ổn định năng lượng cả ngày.'
    }
  }
]

const EXTRA_NUTRITION: Array<{
  goal_type: string
  goal_value: number
  goal_unit: string
  nutrition_sub_type: 'free' | 'time_window'
  time_window_start?: string | null
  time_window_end?: string | null
  image: string
  difficulty: Difficulty
  public: { title: string; body: string }
  friends: { title: string; body: string }
  private: { title: string; body: string }
  emoji: string
}> = [
  {
    goal_type: 'kcal_target',
    goal_value: 2000,
    goal_unit: 'kcal/ngày',
    nutrition_sub_type: 'free',
    image: IMG.mealprep,
    difficulty: 'medium',
    emoji: '🔥',
    public: {
      title: 'Mục tiêu 2000 kcal/ngày — linh hoạt macro, cứng calo',
      body: 'Dùng app hoặc ước lượng tay (palm protein, fist carb, thumb fat). Không nhịn để “dồn tối”. Public để cộng đồng học hỏi tips ăn vặt lành.'
    },
    friends: {
      title: 'Team 2000 kcal: chia menu rotate — không flex số đo',
      body: 'Mỗi người 1 món healthy signature; share trong group chat. Weekend có 1 bữa +200kcal không sao.'
    },
    private: {
      title: 'Cut/TDEE cá nhân ~2000 kcal — chỉ mình tôi và spreadsheet',
      body: 'Ghi lại khi nào đói ảo. Điều chỉnh +100kcal nếu tập nặng — data riêng, không áp lực.'
    }
  },
  {
    goal_type: 'days_completed',
    goal_value: 1,
    goal_unit: 'ngày',
    nutrition_sub_type: 'free',
    image: IMG.salad,
    difficulty: 'easy',
    emoji: '✅',
    public: {
      title: '“Ngày chuẩn dinh dưỡng” — mỗi ngày đạt 1 check hoàn thành có ý thức',
      body: 'Định nghĩa “chuẩn” của bạn: đủ 3 bữa + 2L nước + ít đồ siêu chế biến. Log 1 lần khi đạt — minh bạch, không sống ảo.'
    },
    friends: {
      title: 'Cùng nhắc nhau: 1 check-in “ngày đẹp” mỗi ngày',
      body: 'Không so điểm — chỉ react emoji khi bạn log. Streak tình bạn > streak ăn kiêng.'
    },
    private: {
      title: 'Nhật ký ăn uống: 1 dấu mỗi ngày đạt chuẩn tự đặt',
      body: 'Viết 1 dòng cảm nhận: năng lượng, tiêu hóa, giấc ngủ. Không public.'
    }
  },
  {
    goal_type: 'meals_logged',
    goal_value: 2,
    goal_unit: 'bữa',
    nutrition_sub_type: 'time_window',
    time_window_start: '07:00',
    time_window_end: '10:00',
    image: IMG.breakfast,
    difficulty: 'medium',
    emoji: '⏰',
    public: {
      title: 'Breakfast club Sài Gòn online: 2 bữa log trong khung 7h–10h (giờ VN)',
      body: 'Phù hợp người làm ca sớm hoặc intermittent nhẹ. Sáng ăn đủ protein để khỏi “crash” 11h. Check-in ngoài khung = không tính — fair cho mọi người.'
    },
    friends: {
      title: 'Hẹn sáng với bạn bè: 2 check-in trước 10h — ảnh cà phê + bữa chính',
      body: 'Voice note “món gì hôm nay” 15s — vui và không toxic. Ai trễ thì tự roast nhẹ.'
    },
    private: {
      title: 'Khung sáng riêng: 2 bữa log 7h–10h để ổn định nhịp sinh học',
      body: 'Không khoe; chỉ theo dõi cortisol + đói giả. Nếu làm đêm: dịch khung +2h và ghi chú trong log.'
    }
  }
]

const INDOOR_IMAGE: Record<string, string> = {
  Yoga: IMG.yoga,
  'Gym / Fitness': IMG.gym,
  Pilates: IMG.stretch,
  Zumba: IMG.dance,
  HIIT: IMG.hiit,
  Kickboxing: IMG.cardio,
  'Dance / Aerobics': IMG.dance,
  Stretching: IMG.stretch,
  Meditation: IMG.meditate,
  'Bơi lội': IMG.swim,
  Cardio: IMG.cardio,
  Bodyweight: IMG.gym
}

function indoorCopy(
  catName: string,
  exNameVi: string,
  v: Visibility
): { title: string; body: string } {
  if (v === 'public') {
    return {
      title: `Tháng 4 săn form: ${catName} — hoàn thành “${exNameVi}” mỗi ngày`,
      body: `Chương trình cộng đồng 30 ngày. Mỗi ngày 1 round bài chủ đạo, tập trung kỹ thuật > số rep. Khởi động 8 phút, hạ nhiệt 5 phút. Hashtag vibe: #Thang4KhongBienBat.`
    }
  }
  if (v === 'friends') {
    return {
      title: `Rủ hội ${catName}: mỗi ngày một hiệp ${exNameVi}`,
      body: `Ai skip thì post meme tự chế. Share tips giãn cơ, nhạc playlist — gym bro nhưng wholesome. Bài chọn đủ nhẹ để duy trì streak.`
    }
  }
  return {
    title: `Training kín: ${catName} + ${exNameVi} hàng ngày — không cần khoe PR`,
    body: `Nhật ký riêng: form, đau nhức, giấc ngủ. Nếu mệt: giảm rep 20% nhưng vẫn vào phòng/ thảm để giữ thói quen.`
  }
}

async function main() {
  if (!MONGODB_URL) {
    console.error('Thiếu MONGODB_URL trong .env')
    process.exit(1)
  }

  await mongoose.connect(MONGODB_URL)
  console.log('Đã kết nối MongoDB')

  const emailPick = pickCreatorEmail()
  const findByEmail = (e: string) =>
    UserModel.findOne({ email: new RegExp(`^${e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }).select(
      '_id email'
    )
  let user = await findByEmail(emailPick.trim())
  if (!user) {
    const other = CREATOR_EMAILS.find((x) => x !== emailPick)!
    user = await findByEmail(other.trim())
  }
  if (!user) {
    console.error(
      `Không tìm thấy user với email ${CREATOR_EMAILS.join(' hoặc ')}. Đăng ký hoặc cập nhật email trong DB.`
    )
    process.exit(1)
  }

  const creatorId = user._id as mongoose.Types.ObjectId
  console.log('Creator:', user.email, String(creatorId))

  if (REPLACE) {
    const del = await ChallengeModel.deleteMany({
      $or: [{ description: /\n\n‖fedacn-seed‖$/ }, { title: /^\[FedACN Seed\]/ }]
    })
    console.log(`Đã xóa ${del.deletedCount} thử thách seed cũ (marker mới hoặc tiêu đề [FedACN Seed])`)
  }

  const { start_date, end_date } = april2026RangeVN()

  const base = {
    creator_id: creatorId,
    start_date,
    end_date,
    status: 'active' as const,
    is_deleted: false,
    participants_count: 0,
    linked_meal_plan_id: null
  }

  const outdoorCats = await SportCategoryModel.find({
    type: 'Ngoài trời',
    isDeleted: { $ne: true }
  })
    .sort({ name: 1 })
    .lean()

  const indoorCats = await SportCategoryModel.find({
    type: 'Trong nhà',
    isDeleted: { $ne: true }
  })
    .sort({ name: 1 })
    .lean()

  if (outdoorCats.length === 0) {
    console.warn('Không có danh mục Ngoài trời — chạy scripts/seedSportCategories.mjs trước.')
  }
  if (indoorCats.length === 0) {
    console.warn('Không có danh mục Trong nhà.')
  }

  const exercises = await ExerciseModel.find({}).sort({ name_vi: 1 }).lean()
  if (exercises.length === 0) {
    console.warn('Không có bài tập — chạy npm run seed:exercises trước; bỏ qua thử thách fitness.')
  }

  const docs: Record<string, unknown>[] = []
  const visibilities: Visibility[] = ['public', 'friends', 'private']

  for (const cat of outdoorCats) {
    const kcal = cat.kcal_per_unit ?? 0
    const copy = OUTDOOR_COPY[cat.name] || outdoorFallback(cat.name, kcal)
    for (const v of visibilities) {
      const block = copy[v]
      docs.push({
        ...base,
        title: block.title,
        description: appendSeedMarker(block.body),
        image: copy.image,
        challenge_type: 'outdoor_activity',
        category: cat.name,
        kcal_per_unit: kcal,
        goal_type: 'daily_km',
        goal_value: copy.goalKm,
        goal_unit: 'km',
        visibility: v,
        is_public: visibilityToPublicFlag(v),
        badge_emoji: '🏃',
        difficulty: copy.difficulty,
        nutrition_sub_type: 'free',
        time_window_start: null,
        time_window_end: null,
        exercises: []
      })
    }
  }

  for (const theme of NUTRITION_THEMES) {
    for (const v of visibilities) {
      const block = theme[v]
      docs.push({
        ...base,
        title: block.title,
        description: appendSeedMarker(block.body),
        image: theme.image,
        challenge_type: 'nutrition',
        category: theme.category,
        kcal_per_unit: 0,
        goal_type: 'meals_logged',
        goal_value: theme.goal_value,
        goal_unit: 'bữa',
        visibility: v,
        is_public: visibilityToPublicFlag(v),
        badge_emoji: theme.emoji,
        difficulty: theme.difficulty,
        nutrition_sub_type: 'free',
        time_window_start: null,
        time_window_end: null,
        exercises: []
      })
    }
  }

  for (const row of EXTRA_NUTRITION) {
    for (const v of visibilities) {
      const block = row[v]
      docs.push({
        ...base,
        title: block.title,
        description: appendSeedMarker(block.body),
        image: row.image,
        challenge_type: 'nutrition',
        category: 'Theo dõi dinh dưỡng',
        kcal_per_unit: 0,
        goal_type: row.goal_type,
        goal_value: row.goal_value,
        goal_unit: row.goal_unit,
        visibility: v,
        is_public: visibilityToPublicFlag(v),
        badge_emoji: row.emoji,
        difficulty: row.difficulty,
        nutrition_sub_type: row.nutrition_sub_type,
        time_window_start: row.nutrition_sub_type === 'time_window' ? row.time_window_start ?? null : null,
        time_window_end: row.nutrition_sub_type === 'time_window' ? row.time_window_end ?? null : null,
        exercises: []
      })
    }
  }

  let exIndex = 0
  for (const cat of indoorCats) {
    const ex = exercises[exIndex % exercises.length]
    exIndex++
    if (!ex) break
    const cover = INDOOR_IMAGE[cat.name] || IMG.gym
    for (const v of visibilities) {
      const block = indoorCopy(cat.name, ex.name_vi, v)
      docs.push({
        ...base,
        title: block.title,
        description: appendSeedMarker(block.body),
        image: cover,
        challenge_type: 'fitness',
        category: cat.name,
        kcal_per_unit: cat.kcal_per_unit ?? 0,
        goal_type: 'exercises_completed',
        goal_value: 1,
        goal_unit: 'bài tập',
        visibility: v,
        is_public: visibilityToPublicFlag(v),
        badge_emoji: '🏋️',
        difficulty: 'medium',
        nutrition_sub_type: 'free',
        time_window_start: null,
        time_window_end: null,
        exercises: [
          {
            exercise_id: ex._id,
            exercise_name: ex.name_vi,
            sets: [{ set_number: 1, reps: 12, weight: 0, calories_per_unit: 10 }]
          }
        ]
      })
    }
  }

  if (docs.length === 0) {
    console.log('Không có document nào để chèn.')
    await mongoose.disconnect()
    return
  }

  const inserted = await ChallengeModel.insertMany(docs)
  console.log(`Đã chèn ${inserted.length} thử thách (tháng 4/2026, ảnh cover + nội dung chi tiết).`)

  await mongoose.disconnect()
  console.log('Đã ngắt kết nối.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
