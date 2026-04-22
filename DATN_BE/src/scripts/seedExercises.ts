import mongoose from 'mongoose'
import { config } from 'dotenv'
config()

import EquipmentModel from '../models/schemas/equipment.schema'
import MuscleGroupModel from '../models/schemas/muscleGroup.schema'
import ExerciseModel from '../models/schemas/exercise.schema'
import { envConfig } from '../constants/config'

// ============================================================================
// EQUIPMENT SEED DATA
// ============================================================================
const equipmentSeed = [
    { name: 'Cơ thể', name_en: 'bodyweight', image_url: '/images/equipment/bodyweight.png', description: 'Không cần thiết bị' },
    { name: 'Tạ tay', name_en: 'dumbbell', image_url: '/images/equipment/dumbbell.png', description: 'Dumbbell' },
    { name: 'Tạ đòn', name_en: 'barbell', image_url: '/images/equipment/barbell.png', description: 'Barbell' },
    { name: 'Tạ ấm', name_en: 'kettlebell', image_url: '/images/equipment/kettlebell.png', description: 'Kettlebell' },
    { name: 'Dây kháng lực', name_en: 'band', image_url: '/images/equipment/band.png', description: 'Resistance Band / Cable' },
    { name: 'Máy / Đĩa tạ', name_en: 'plate', image_url: '/images/equipment/plate.png', description: 'Machine / Plate' },
    { name: 'Xà đơn', name_en: 'pull-up-bar', image_url: '/images/equipment/pull-up-bar.png', description: 'Pull-up bar' },
    { name: 'Ghế tập', name_en: 'bench', image_url: '/images/equipment/bench.png', description: 'Bench' }
]

// ============================================================================
// MUSCLE GROUP SEED DATA (17 groups mapped to react-body-highlighter SVG IDs)
// ============================================================================
const muscleGroupSeed = [
    { name: 'Ngực', name_en: 'chest', body_part_ids: ['chest'], description: 'Cơ ngực trước' },
    { name: 'Bụng', name_en: 'abs', body_part_ids: ['abs'], description: 'Cơ bụng 6 múi' },
    { name: 'Chéo bụng', name_en: 'obliques', body_part_ids: ['obliques'], description: 'Cơ chéo bụng hai bên' },
    { name: 'Bắp tay trước', name_en: 'biceps', body_part_ids: ['biceps'], description: 'Cơ nhị đầu' },
    { name: 'Cẳng tay', name_en: 'forearm', body_part_ids: ['forearm'], description: 'Cơ cẳng tay' },
    { name: 'Vai trước', name_en: 'front-deltoids', body_part_ids: ['front-deltoids'], description: 'Cơ delta trước' },
    { name: 'Đùi trước', name_en: 'quadriceps', body_part_ids: ['quadriceps'], description: 'Cơ tứ đầu đùi' },
    { name: 'Đùi trong', name_en: 'adductor', body_part_ids: ['adductor'], description: 'Cơ khép đùi' },
    { name: 'Cơ thang', name_en: 'trapezius', body_part_ids: ['trapezius'], description: 'Cơ thang lưng trên' },
    { name: 'Lưng trên', name_en: 'upper-back', body_part_ids: ['upper-back'], description: 'Cơ lưng trên' },
    { name: 'Lưng dưới', name_en: 'lower-back', body_part_ids: ['lower-back'], description: 'Cơ lưng dưới' },
    { name: 'Vai sau', name_en: 'back-deltoids', body_part_ids: ['back-deltoids'], description: 'Cơ delta sau' },
    { name: 'Bắp tay sau', name_en: 'triceps', body_part_ids: ['triceps'], description: 'Cơ tam đầu' },
    { name: 'Đùi sau', name_en: 'hamstring', body_part_ids: ['hamstring'], description: 'Cơ đùi sau' },
    { name: 'Bắp chân', name_en: 'calves', body_part_ids: ['calves'], description: 'Cơ bắp chân' },
    { name: 'Mông', name_en: 'gluteal', body_part_ids: ['gluteal'], description: 'Cơ mông' },
    { name: 'Đùi ngoài', name_en: 'abductors', body_part_ids: ['abductors'], description: 'Cơ dạng đùi' }
]

// Helper type for exercise seed data
interface ExerciseSeedData {
    name: string
    name_vi: string
    equipment_keys: string[]
    primary_muscle_keys: string[]
    secondary_muscle_keys: string[]
    category: string
    difficulty: string
    duration_default: number
    rest_time_default: number
    instructions: string[]
    tips: string
    video_url: string
    image_url: string
}

// ============================================================================
// EXERCISE SEED DATA
// ============================================================================
const exerciseSeed: ExerciseSeedData[] = [
    // === CHEST ===
    { name: 'Push-Up', name_vi: 'Chống đẩy', equipment_keys: ['bodyweight'], primary_muscle_keys: ['chest'], secondary_muscle_keys: ['triceps', 'front-deltoids'], category: 'strength', difficulty: 'beginner', duration_default: 30, rest_time_default: 45, instructions: ['Nằm úp, hai tay rộng ngang vai', 'Duỗi thẳng tay đẩy người lên', 'Hạ người xuống từ từ cho ngực gần chạm sàn', 'Đẩy lên mạnh mẽ'], tips: 'Giữ thân người thẳng, không để hông chùng xuống', video_url: 'https://www.youtube.com/watch?v=IODxDxX7oi4', image_url: '' },
    { name: 'Incline Push-Up', name_vi: 'Chống đẩy nghiêng', equipment_keys: ['bodyweight', 'bench'], primary_muscle_keys: ['chest'], secondary_muscle_keys: ['triceps'], category: 'strength', difficulty: 'beginner', duration_default: 30, rest_time_default: 45, instructions: ['Đặt tay lên ghế/bậc cao', 'Chống đẩy như bình thường'], tips: 'Phù hợp cho người mới bắt đầu', video_url: 'https://www.youtube.com/watch?v=sN_cMWtzFAc', image_url: '' },
    { name: 'Dumbbell Bench Press', name_vi: 'Đẩy ngực tạ tay', equipment_keys: ['dumbbell', 'bench'], primary_muscle_keys: ['chest'], secondary_muscle_keys: ['triceps', 'front-deltoids'], category: 'strength', difficulty: 'intermediate', duration_default: 40, rest_time_default: 60, instructions: ['Nằm trên ghế phẳng, tay cầm tạ', 'Đưa tạ lên cao, hai tay thẳng', 'Hạ tạ từ từ xuống ngang ngực', 'Đẩy tạ lên'], tips: 'Giữ khuỷu tay 45 độ so với thân', video_url: 'https://www.youtube.com/watch?v=QsYre__-aro', image_url: '' },
    { name: 'Barbell Bench Press', name_vi: 'Đẩy ngực tạ đòn', equipment_keys: ['barbell', 'bench'], primary_muscle_keys: ['chest'], secondary_muscle_keys: ['triceps', 'front-deltoids'], category: 'strength', difficulty: 'intermediate', duration_default: 40, rest_time_default: 90, instructions: ['Nằm ghế phẳng, nắm thanh tạ rộng ngang vai', 'Hạ tạ xuống ngực', 'Đẩy tạ lên thẳng'], tips: 'Luôn có người hỗ trợ khi tập nặng', video_url: 'https://www.youtube.com/watch?v=vcBig73ojpE', image_url: '' },
    { name: 'Dumbbell Fly', name_vi: 'Bay ngực tạ tay', equipment_keys: ['dumbbell', 'bench'], primary_muscle_keys: ['chest'], secondary_muscle_keys: ['front-deltoids'], category: 'strength', difficulty: 'intermediate', duration_default: 40, rest_time_default: 60, instructions: ['Nằm ghế, tay cầm tạ duỗi thẳng lên trần', 'Mở rộng hai tay ra hai bên', 'Đưa tạ về vị trí ban đầu'], tips: 'Khuỷu tay hơi cong, cảm nhận căng ngực', video_url: 'https://www.youtube.com/watch?v=eozdVDA78K0', image_url: '' },
    { name: 'Cable Crossover', name_vi: 'Kéo cáp chéo ngực', equipment_keys: ['plate'], primary_muscle_keys: ['chest'], secondary_muscle_keys: ['front-deltoids'], category: 'strength', difficulty: 'intermediate', duration_default: 40, rest_time_default: 60, instructions: ['Đứng giữa hai ròng rọc cáp', 'Kéo hai tay chéo nhau trước ngực', 'Quay về từ từ'], tips: 'Giữ tay hơi cong', video_url: 'https://www.youtube.com/watch?v=taI4XduLpTk', image_url: '' },
    { name: 'Chest Dips', name_vi: 'Nhúng ngực', equipment_keys: ['bodyweight', 'pull-up-bar'], primary_muscle_keys: ['chest'], secondary_muscle_keys: ['triceps'], category: 'strength', difficulty: 'intermediate', duration_default: 30, rest_time_default: 60, instructions: ['Bám thanh song song, nghiêng người về phía trước', 'Hạ người xuống cho ngực căng', 'Đẩy lên'], tips: 'Nghiêng người trước 30 độ để tập ngực', video_url: 'https://www.youtube.com/watch?v=2z8JmcrW-As', image_url: '' },
    { name: 'Kettlebell Floor Press', name_vi: 'Đẩy ngực tạ ấm trên sàn', equipment_keys: ['kettlebell'], primary_muscle_keys: ['chest'], secondary_muscle_keys: ['triceps'], category: 'strength', difficulty: 'intermediate', duration_default: 40, rest_time_default: 60, instructions: ['Nằm sàn, cầm tạ ấm', 'Đẩy lên thẳng tay', 'Hạ từ từ cho khuỷu tay chạm sàn'], tips: 'Kiểm soát tốc độ hạ', video_url: 'https://www.youtube.com/watch?v=GFBsavqCH1k', image_url: '' },
    { name: 'Band Push-Up', name_vi: 'Chống đẩy dây kháng lực', equipment_keys: ['band', 'bodyweight'], primary_muscle_keys: ['chest'], secondary_muscle_keys: ['triceps'], category: 'strength', difficulty: 'intermediate', duration_default: 30, rest_time_default: 45, instructions: ['Vòng dây qua lưng, hai đầu dây dưới tay', 'Chống đẩy bình thường với thêm lực kháng'], tips: 'Tăng dần độ căng dây', video_url: 'https://www.youtube.com/watch?v=yORMiQkMoXI', image_url: '' },

    // === BACK ===
    { name: 'Pull-Up', name_vi: 'Kéo xà', equipment_keys: ['pull-up-bar'], primary_muscle_keys: ['upper-back'], secondary_muscle_keys: ['biceps', 'forearm'], category: 'strength', difficulty: 'intermediate', duration_default: 30, rest_time_default: 60, instructions: ['Bám xà, tay rộng hơn vai', 'Kéo người lên cho cằm qua xà', 'Hạ từ từ'], tips: 'Nếu chưa kéo được, dùng dây hỗ trợ', video_url: 'https://www.youtube.com/watch?v=eGo4IYlbE5g', image_url: '' },
    { name: 'Chin-Up', name_vi: 'Kéo xà ngửa tay', equipment_keys: ['pull-up-bar'], primary_muscle_keys: ['upper-back'], secondary_muscle_keys: ['biceps'], category: 'strength', difficulty: 'intermediate', duration_default: 30, rest_time_default: 60, instructions: ['Bám xà, hai tay ngửa hẹp ngang vai', 'Kéo người lên'], tips: 'Tập trung cảm nhận lưng và biceps', video_url: 'https://www.youtube.com/watch?v=D7KaRcUTQeE', image_url: '' },
    { name: 'Barbell Row', name_vi: 'Chèo tạ đòn', equipment_keys: ['barbell'], primary_muscle_keys: ['upper-back'], secondary_muscle_keys: ['biceps', 'lower-back'], category: 'strength', difficulty: 'intermediate', duration_default: 40, rest_time_default: 60, instructions: ['Cúi người 45 độ, nắm tạ đòn', 'Kéo tạ lên bụng', 'Hạ từ từ'], tips: 'Giữ lưng thẳng, không gù', video_url: 'https://www.youtube.com/watch?v=G8l_8chR5BE', image_url: '' },
    { name: 'Dumbbell Row', name_vi: 'Chèo tạ tay', equipment_keys: ['dumbbell', 'bench'], primary_muscle_keys: ['upper-back'], secondary_muscle_keys: ['biceps'], category: 'strength', difficulty: 'beginner', duration_default: 40, rest_time_default: 60, instructions: ['Một tay chống ghế, tay kia cầm tạ', 'Kéo tạ lên ngang hông', 'Hạ từ từ'], tips: 'Siết cơ lưng khi kéo lên', video_url: 'https://www.youtube.com/watch?v=xQNrFHEMhI4', image_url: '' },
    { name: 'Lat Pulldown', name_vi: 'Kéo cáp xổ', equipment_keys: ['plate'], primary_muscle_keys: ['upper-back'], secondary_muscle_keys: ['biceps'], category: 'strength', difficulty: 'beginner', duration_default: 40, rest_time_default: 60, instructions: ['Ngồi máy, nắm thanh rộng', 'Kéo thanh xuống trước ngực', 'Trả từ từ'], tips: 'Không ngả người quá xa', video_url: 'https://www.youtube.com/watch?v=CAwf7n6Luuc', image_url: '' },
    { name: 'Inverted Row', name_vi: 'Chèo ngược cơ thể', equipment_keys: ['bodyweight', 'pull-up-bar'], primary_muscle_keys: ['upper-back'], secondary_muscle_keys: ['biceps', 'forearm'], category: 'strength', difficulty: 'beginner', duration_default: 30, rest_time_default: 45, instructions: ['Bám xà thấp, nằm ngửa dưới xà', 'Kéo ngực lên chạm xà'], tips: 'Giữ thân thẳng', video_url: 'https://www.youtube.com/watch?v=LMSGBaGqoFc', image_url: '' },
    { name: 'Deadlift', name_vi: 'Nâng tạ chết', equipment_keys: ['barbell'], primary_muscle_keys: ['lower-back'], secondary_muscle_keys: ['hamstring', 'gluteal', 'trapezius'], category: 'strength', difficulty: 'intermediate', duration_default: 40, rest_time_default: 120, instructions: ['Đứng rộng ngang hông, nắm tạ đòn', 'Đứng thẳng lên nâng tạ theo người', 'Hạ tạ từ từ theo đường thẳng'], tips: 'QUAN TRỌNG: Giữ lưng thẳng tuyệt đối', video_url: 'https://www.youtube.com/watch?v=wYREokE2oSg', image_url: '' },
    { name: 'Kettlebell Swing', name_vi: 'Xoay tạ ấm', equipment_keys: ['kettlebell'], primary_muscle_keys: ['lower-back'], secondary_muscle_keys: ['gluteal', 'hamstring'], category: 'cardio', difficulty: 'intermediate', duration_default: 30, rest_time_default: 45, instructions: ['Đứng rộng hơn vai, cầm tạ ấm', 'Đung đưa tạ qua chân', 'Đẩy hông mạnh để xoay tạ lên ngang vai'], tips: 'Lực từ hông, không phải tay', video_url: 'https://www.youtube.com/watch?v=sSESeQAir2M', image_url: '' },

    // === SHOULDERS ===
    { name: 'Dumbbell Shoulder Press', name_vi: 'Đẩy vai tạ tay', equipment_keys: ['dumbbell'], primary_muscle_keys: ['front-deltoids'], secondary_muscle_keys: ['triceps', 'trapezius'], category: 'strength', difficulty: 'intermediate', duration_default: 40, rest_time_default: 60, instructions: ['Ngồi/đứng, tạ ngang tai', 'Đẩy tạ lên trên đầu', 'Hạ từ từ về ngang tai'], tips: 'Không khóa khuỷu tay khi đẩy hết', video_url: 'https://www.youtube.com/watch?v=qEwKCR5JCog', image_url: '' },
    { name: 'Barbell Overhead Press', name_vi: 'Đẩy vai tạ đòn', equipment_keys: ['barbell'], primary_muscle_keys: ['front-deltoids'], secondary_muscle_keys: ['triceps', 'trapezius'], category: 'strength', difficulty: 'intermediate', duration_default: 40, rest_time_default: 90, instructions: ['Đứng, tạ ngang vai', 'Đẩy tạ thẳng lên đầu', 'Hạ từ từ'], tips: 'Siết core để ổn định', video_url: 'https://www.youtube.com/watch?v=2yjwXTZQDDI', image_url: '' },
    { name: 'Dumbbell Lateral Raise', name_vi: 'Nâng tạ ngang vai', equipment_keys: ['dumbbell'], primary_muscle_keys: ['front-deltoids'], secondary_muscle_keys: ['trapezius'], category: 'strength', difficulty: 'beginner', duration_default: 40, rest_time_default: 45, instructions: ['Đứng thẳng, tạ hai bên hông', 'Nâng tạ ngang ra hai bên lên ngang vai', 'Hạ từ từ'], tips: 'Tạ nhẹ, nhiều lần lặp', video_url: 'https://www.youtube.com/watch?v=3VcKaXpzqRo', image_url: '' },
    { name: 'Dumbbell Front Raise', name_vi: 'Nâng tạ trước vai', equipment_keys: ['dumbbell'], primary_muscle_keys: ['front-deltoids'], secondary_muscle_keys: [], category: 'strength', difficulty: 'beginner', duration_default: 40, rest_time_default: 45, instructions: ['Đứng, tạ trước đùi', 'Nâng tạ thẳng tay lên trước mặt ngang vai'], tips: 'Không vung tạ', video_url: 'https://www.youtube.com/watch?v=sOoBOGDGFE0', image_url: '' },
    { name: 'Face Pull', name_vi: 'Kéo cáp mặt', equipment_keys: ['band', 'plate'], primary_muscle_keys: ['back-deltoids'], secondary_muscle_keys: ['trapezius', 'upper-back'], category: 'strength', difficulty: 'beginner', duration_default: 40, rest_time_default: 45, instructions: ['Đứng trước dây/cáp cao', 'Kéo về phía mặt, mở rộng khuỷu tay'], tips: 'Tuyệt vời cho sức khỏe vai', video_url: 'https://www.youtube.com/watch?v=rep-qVOkqgk', image_url: '' },
    { name: 'Band Pull-Apart', name_vi: 'Kéo dây kháng lực', equipment_keys: ['band'], primary_muscle_keys: ['back-deltoids'], secondary_muscle_keys: ['upper-back', 'trapezius'], category: 'strength', difficulty: 'beginner', duration_default: 30, rest_time_default: 30, instructions: ['Cầm dây trước ngực, hai tay thẳng', 'Kéo dây ra hai bên'], tips: 'Siết bả vai', video_url: 'https://www.youtube.com/watch?v=FBBvAlKxAJ8', image_url: '' },

    // === ARMS - BICEPS ===
    { name: 'Dumbbell Bicep Curl', name_vi: 'Cuốn tạ tay biceps', equipment_keys: ['dumbbell'], primary_muscle_keys: ['biceps'], secondary_muscle_keys: ['forearm'], category: 'strength', difficulty: 'beginner', duration_default: 40, rest_time_default: 45, instructions: ['Đứng, tạ hai bên hông, lòng bàn tay hướng trước', 'Cuốn tạ lên vai', 'Hạ từ từ'], tips: 'Không vung thân', video_url: 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo', image_url: '' },
    { name: 'Barbell Curl', name_vi: 'Cuốn tạ đòn biceps', equipment_keys: ['barbell'], primary_muscle_keys: ['biceps'], secondary_muscle_keys: ['forearm'], category: 'strength', difficulty: 'beginner', duration_default: 40, rest_time_default: 60, instructions: ['Đứng, nắm tạ đòn rộng ngang vai', 'Cuốn tạ lên', 'Hạ từ từ'], tips: 'Khuỷu tay ép sát thân', video_url: 'https://www.youtube.com/watch?v=LY1V6UbRHFM', image_url: '' },
    { name: 'Hammer Curl', name_vi: 'Cuốn tạ búa', equipment_keys: ['dumbbell'], primary_muscle_keys: ['biceps'], secondary_muscle_keys: ['forearm'], category: 'strength', difficulty: 'beginner', duration_default: 40, rest_time_default: 45, instructions: ['Tạ dọc bên hông', 'Cuốn lên giữ tay dọc'], tips: 'Tập cẳng tay và biceps', video_url: 'https://www.youtube.com/watch?v=TwD-YGVP4Bk', image_url: '' },
    { name: 'Concentration Curl', name_vi: 'Cuốn tạ tập trung', equipment_keys: ['dumbbell'], primary_muscle_keys: ['biceps'], secondary_muscle_keys: [], category: 'strength', difficulty: 'beginner', duration_default: 40, rest_time_default: 45, instructions: ['Ngồi ghế, khuỷu tay tựa đùi trong', 'Cuốn tạ lên'], tips: 'Cô lập biceps tốt nhất', video_url: 'https://www.youtube.com/watch?v=0AUGkch3tzc', image_url: '' },

    // === ARMS - TRICEPS ===
    { name: 'Tricep Dips', name_vi: 'Nhúng tam đầu', equipment_keys: ['bodyweight', 'bench'], primary_muscle_keys: ['triceps'], secondary_muscle_keys: ['chest', 'front-deltoids'], category: 'strength', difficulty: 'beginner', duration_default: 30, rest_time_default: 45, instructions: ['Tay chống ghế phía sau', 'Hạ người xuống', 'Đẩy lên'], tips: 'Giữ thân gần ghế', video_url: 'https://www.youtube.com/watch?v=0326dy_-CzM', image_url: '' },
    { name: 'Overhead Tricep Extension', name_vi: 'Duỗi tam đầu trên đầu', equipment_keys: ['dumbbell'], primary_muscle_keys: ['triceps'], secondary_muscle_keys: [], category: 'strength', difficulty: 'beginner', duration_default: 40, rest_time_default: 45, instructions: ['Cầm tạ hai tay trên đầu', 'Gập khuỷu tay hạ tạ sau đầu', 'Duỗi thẳng tay'], tips: 'Giữ khuỷu tay ép sát đầu', video_url: 'https://www.youtube.com/watch?v=nRiJVZDpdL0', image_url: '' },
    { name: 'Skull Crushers', name_vi: 'Nghiền sọ', equipment_keys: ['barbell', 'bench'], primary_muscle_keys: ['triceps'], secondary_muscle_keys: [], category: 'strength', difficulty: 'intermediate', duration_default: 40, rest_time_default: 60, instructions: ['Nằm ghế, tạ trên trán', 'Gập khuỷu tay hạ tạ về phía trán', 'Duỗi thẳng tay'], tips: 'Kiểm soát trọng lượng', video_url: 'https://www.youtube.com/watch?v=d_KZxkY_0cM', image_url: '' },
    { name: 'Tricep Pushdown', name_vi: 'Đẩy cáp tam đầu', equipment_keys: ['plate'], primary_muscle_keys: ['triceps'], secondary_muscle_keys: [], category: 'strength', difficulty: 'beginner', duration_default: 40, rest_time_default: 45, instructions: ['Đứng trước máy cáp', 'Đẩy thanh xuống bằng khuỷu tay', 'Trả từ từ'], tips: 'Khuỷu tay sát thân', video_url: 'https://www.youtube.com/watch?v=2-LAMcpzODU', image_url: '' },
    { name: 'Diamond Push-Up', name_vi: 'Chống đẩy kim cương', equipment_keys: ['bodyweight'], primary_muscle_keys: ['triceps'], secondary_muscle_keys: ['chest'], category: 'strength', difficulty: 'intermediate', duration_default: 30, rest_time_default: 45, instructions: ['Tay hình kim cương dưới ngực', 'Chống đẩy'], tips: 'Tay gần nhau cho triceps', video_url: 'https://www.youtube.com/watch?v=J0DnG1_S92I', image_url: '' },

    // === LEGS - QUADRICEPS ===
    { name: 'Bodyweight Squat', name_vi: 'Squat cơ thể', equipment_keys: ['bodyweight'], primary_muscle_keys: ['quadriceps'], secondary_muscle_keys: ['gluteal'], category: 'strength', difficulty: 'beginner', duration_default: 30, rest_time_default: 45, instructions: ['Đứng rộng ngang vai', 'Hạ người xuống như ngồi ghế', 'Đứng lên'], tips: 'Đầu gối không vượt quá mũi chân', video_url: 'https://www.youtube.com/watch?v=aclHkVaku9U', image_url: '' },
    { name: 'Barbell Squat', name_vi: 'Squat tạ đòn', equipment_keys: ['barbell'], primary_muscle_keys: ['quadriceps'], secondary_muscle_keys: ['gluteal', 'hamstring', 'lower-back'], category: 'strength', difficulty: 'intermediate', duration_default: 40, rest_time_default: 120, instructions: ['Tạ trên vai, đứng rộng ngang vai', 'Hạ người xuống 90 độ', 'Đứng lên'], tips: 'Giữ ngực ưỡn, lưng thẳng', video_url: 'https://www.youtube.com/watch?v=Dy28eq2PjcM', image_url: '' },
    { name: 'Goblet Squat', name_vi: 'Squat ly', equipment_keys: ['kettlebell', 'dumbbell'], primary_muscle_keys: ['quadriceps'], secondary_muscle_keys: ['gluteal'], category: 'strength', difficulty: 'beginner', duration_default: 40, rest_time_default: 60, instructions: ['Cầm tạ ấm/tạ tay trước ngực', 'Squat xuống'], tips: 'Tốt cho người mới học squat', video_url: 'https://www.youtube.com/watch?v=MxsFDhcyFyE', image_url: '' },
    { name: 'Dumbbell Lunges', name_vi: 'Phổi tạ tay', equipment_keys: ['dumbbell'], primary_muscle_keys: ['quadriceps'], secondary_muscle_keys: ['gluteal', 'hamstring'], category: 'strength', difficulty: 'beginner', duration_default: 40, rest_time_default: 60, instructions: ['Cầm tạ hai bên, bước một chân về phía trước', 'Hạ đầu gối sau xuống gần sàn', 'Đứng lên, đổi chân'], tips: 'Bước xa, không ngắn', video_url: 'https://www.youtube.com/watch?v=D7KaRcUTQeE', image_url: '' },
    { name: 'Bulgarian Split Squat', name_vi: 'Squat Bulgaria', equipment_keys: ['dumbbell', 'bench'], primary_muscle_keys: ['quadriceps'], secondary_muscle_keys: ['gluteal', 'hamstring'], category: 'strength', difficulty: 'intermediate', duration_default: 40, rest_time_default: 60, instructions: ['Chân sau đặt trên ghế', 'Hạ người xuống bằng chân trước', 'Đứng lên'], tips: 'Tập luyện tốt cho cân bằng', video_url: 'https://www.youtube.com/watch?v=2C-uNgKwPLE', image_url: '' },
    { name: 'Wall Sit', name_vi: 'Ngồi tường', equipment_keys: ['bodyweight'], primary_muscle_keys: ['quadriceps'], secondary_muscle_keys: [], category: 'strength', difficulty: 'beginner', duration_default: 45, rest_time_default: 60, instructions: ['Tựa lưng vào tường', 'Hạ người cho đùi song song mặt đất', 'Giữ tư thế'], tips: 'Bài tập isometric tốt', video_url: 'https://www.youtube.com/watch?v=y-wV4Venusw', image_url: '' },
    { name: 'Leg Press', name_vi: 'Đạp chân máy', equipment_keys: ['plate'], primary_muscle_keys: ['quadriceps'], secondary_muscle_keys: ['gluteal', 'hamstring'], category: 'strength', difficulty: 'beginner', duration_default: 40, rest_time_default: 60, instructions: ['Ngồi máy leg press', 'Đạp tấm nặng lên bằng hai chân', 'Hạ từ từ'], tips: 'Không khóa đầu gối', video_url: 'https://www.youtube.com/watch?v=IZxyjW7MPJQ', image_url: '' },
    { name: 'Leg Extension', name_vi: 'Duỗi chân máy', equipment_keys: ['plate'], primary_muscle_keys: ['quadriceps'], secondary_muscle_keys: [], category: 'strength', difficulty: 'beginner', duration_default: 40, rest_time_default: 45, instructions: ['Ngồi máy, đặt chân dưới gối đệm', 'Duỗi thẳng chân', 'Hạ từ từ'], tips: 'Cô lập đùi trước', video_url: 'https://www.youtube.com/watch?v=YyvSfVjQeL0', image_url: '' },

    // === LEGS - HAMSTRING & GLUTES ===
    { name: 'Romanian Deadlift', name_vi: 'Nâng tạ chết Romania', equipment_keys: ['barbell', 'dumbbell'], primary_muscle_keys: ['hamstring'], secondary_muscle_keys: ['gluteal', 'lower-back'], category: 'strength', difficulty: 'intermediate', duration_default: 40, rest_time_default: 90, instructions: ['Đứng, cầm tạ trước đùi', 'Gập hông đẩy mông ra sau', 'Hạ tạ theo ống chân', 'Đứng thẳng lên'], tips: 'Cảm nhận căng đùi sau', video_url: 'https://www.youtube.com/watch?v=JCXUYuzwNrM', image_url: '' },
    { name: 'Hip Thrust', name_vi: 'Đẩy hông', equipment_keys: ['barbell', 'bench'], primary_muscle_keys: ['gluteal'], secondary_muscle_keys: ['hamstring'], category: 'strength', difficulty: 'intermediate', duration_default: 40, rest_time_default: 60, instructions: ['Lưng tựa ghế, tạ trên hông', 'Đẩy hông lên', 'Hạ từ từ'], tips: 'Siết mông ở đỉnh', video_url: 'https://www.youtube.com/watch?v=SEdqd1n0cvg', image_url: '' },
    { name: 'Glute Bridge', name_vi: 'Cầu mông', equipment_keys: ['bodyweight'], primary_muscle_keys: ['gluteal'], secondary_muscle_keys: ['hamstring'], category: 'strength', difficulty: 'beginner', duration_default: 30, rest_time_default: 30, instructions: ['Nằm ngửa, đầu gối co', 'Đẩy hông lên cao', 'Siết mông, hạ từ từ'], tips: 'Giữ 2 giây ở đỉnh', video_url: 'https://www.youtube.com/watch?v=8bbE64NuDTU', image_url: '' },
    { name: 'Leg Curl', name_vi: 'Cuốn chân máy', equipment_keys: ['plate'], primary_muscle_keys: ['hamstring'], secondary_muscle_keys: ['calves'], category: 'strength', difficulty: 'beginner', duration_default: 40, rest_time_default: 45, instructions: ['Nằm sấp trên máy', 'Co chân kéo gối đệm về phía mông', 'Hạ từ từ'], tips: 'Cô lập đùi sau', video_url: 'https://www.youtube.com/watch?v=1Tq3QdYUuHs', image_url: '' },
    { name: 'Step-Up', name_vi: 'Bước lên bục', equipment_keys: ['bodyweight', 'dumbbell', 'bench'], primary_muscle_keys: ['quadriceps'], secondary_muscle_keys: ['gluteal'], category: 'strength', difficulty: 'beginner', duration_default: 40, rest_time_default: 45, instructions: ['Đặt một chân lên bục/ghế', 'Đẩy người đứng lên', 'Hạ chân kia xuống'], tips: 'Bục cao ngang đầu gối', video_url: 'https://www.youtube.com/watch?v=dQqApCGd5Ss', image_url: '' },

    // === CALVES ===
    { name: 'Calf Raise', name_vi: 'Nâng bắp chân', equipment_keys: ['bodyweight', 'dumbbell'], primary_muscle_keys: ['calves'], secondary_muscle_keys: [], category: 'strength', difficulty: 'beginner', duration_default: 40, rest_time_default: 30, instructions: ['Đứng trên mép bậc thang', 'Nâng gót chân lên cao', 'Hạ từ từ dưới mức bậc'], tips: 'Giữ 1 giây ở đỉnh', video_url: 'https://www.youtube.com/watch?v=gwLzBJYoWlI', image_url: '' },
    { name: 'Seated Calf Raise', name_vi: 'Nâng bắp chân ngồi', equipment_keys: ['plate', 'bench'], primary_muscle_keys: ['calves'], secondary_muscle_keys: [], category: 'strength', difficulty: 'beginner', duration_default: 40, rest_time_default: 30, instructions: ['Ngồi, đặt tạ trên đùi', 'Nâng gót chân'], tips: 'Tập cơ dép', video_url: 'https://www.youtube.com/watch?v=JbyjNymZOt0', image_url: '' },

    // === ABS ===
    { name: 'Crunch', name_vi: 'Gập bụng', equipment_keys: ['bodyweight'], primary_muscle_keys: ['abs'], secondary_muscle_keys: [], category: 'strength', difficulty: 'beginner', duration_default: 30, rest_time_default: 30, instructions: ['Nằm ngửa, đầu gối co', 'Cuốn thân lên, vai rời sàn', 'Hạ từ từ'], tips: 'Không kéo cổ', video_url: 'https://www.youtube.com/watch?v=Xyd_fa5zoEU', image_url: '' },
    { name: 'Plank', name_vi: 'Plank giữ', equipment_keys: ['bodyweight'], primary_muscle_keys: ['abs'], secondary_muscle_keys: ['lower-back', 'front-deltoids'], category: 'strength', difficulty: 'beginner', duration_default: 60, rest_time_default: 30, instructions: ['Chống khuỷu tay, thân thẳng', 'Giữ tư thế'], tips: 'Không để hông chùng', video_url: 'https://www.youtube.com/watch?v=pSHjTRCQxIw', image_url: '' },
    { name: 'Hanging Leg Raise', name_vi: 'Nâng chân treo', equipment_keys: ['pull-up-bar'], primary_muscle_keys: ['abs'], secondary_muscle_keys: ['obliques', 'forearm'], category: 'strength', difficulty: 'intermediate', duration_default: 30, rest_time_default: 45, instructions: ['Treo trên xà', 'Nâng chân thẳng lên song song sàn', 'Hạ từ từ'], tips: 'Không đung đưa thân', video_url: 'https://www.youtube.com/watch?v=Pr1ieGZ5atk', image_url: '' },
    { name: 'Russian Twist', name_vi: 'Xoay Nga', equipment_keys: ['bodyweight', 'dumbbell'], primary_muscle_keys: ['obliques'], secondary_muscle_keys: ['abs'], category: 'strength', difficulty: 'beginner', duration_default: 30, rest_time_default: 30, instructions: ['Ngồi, chân nâng khỏi sàn', 'Xoay thân sang hai bên'], tips: 'Thêm tạ để tăng độ khó', video_url: 'https://www.youtube.com/watch?v=wkD8rjkodUI', image_url: '' },
    { name: 'Mountain Climber', name_vi: 'Leo núi', equipment_keys: ['bodyweight'], primary_muscle_keys: ['abs'], secondary_muscle_keys: ['quadriceps', 'front-deltoids'], category: 'cardio', difficulty: 'beginner', duration_default: 30, rest_time_default: 30, instructions: ['Tư thế plank', 'Kéo đầu gối lên ngực luân phiên nhanh'], tips: 'Giữ hông ổn định', video_url: 'https://www.youtube.com/watch?v=nmwgirgXLYM', image_url: '' },
    { name: 'Ab Rollout', name_vi: 'Lăn con lăn bụng', equipment_keys: ['bodyweight'], primary_muscle_keys: ['abs'], secondary_muscle_keys: ['lower-back', 'front-deltoids'], category: 'strength', difficulty: 'intermediate', duration_default: 30, rest_time_default: 45, instructions: ['Quỳ, cầm dụng cụ lăn', 'Lăn ra trước', 'Cuốn thân kéo lại'], tips: 'Siết bụng suốt quá trình', video_url: 'https://www.youtube.com/watch?v=sxMMJCyJKwY', image_url: '' },
    { name: 'Bicycle Crunch', name_vi: 'Gập bụng xe đạp', equipment_keys: ['bodyweight'], primary_muscle_keys: ['abs'], secondary_muscle_keys: ['obliques'], category: 'strength', difficulty: 'beginner', duration_default: 30, rest_time_default: 30, instructions: ['Nằm ngửa, tay sau đầu', 'Kéo gối phải chạm khuỷu trái và ngược lại'], tips: 'Xoay thân, không kéo cổ', video_url: 'https://www.youtube.com/watch?v=9FGilxCbdz8', image_url: '' },
    { name: 'Side Plank', name_vi: 'Plank nghiêng', equipment_keys: ['bodyweight'], primary_muscle_keys: ['obliques'], secondary_muscle_keys: ['abs'], category: 'strength', difficulty: 'beginner', duration_default: 45, rest_time_default: 30, instructions: ['Nằm nghiêng, chống khuỷu tay', 'Nâng hông lên, thân thẳng', 'Giữ tư thế'], tips: 'Không để hông sụp', video_url: 'https://www.youtube.com/watch?v=K2KSCbBQAsY', image_url: '' },

    // === TRAPEZIUS ===
    { name: 'Barbell Shrug', name_vi: 'Nhún vai tạ đòn', equipment_keys: ['barbell'], primary_muscle_keys: ['trapezius'], secondary_muscle_keys: [], category: 'strength', difficulty: 'beginner', duration_default: 40, rest_time_default: 45, instructions: ['Đứng cầm tạ trước đùi', 'Nhún vai lên cao', 'Hạ từ từ'], tips: 'Không xoay vai', video_url: 'https://www.youtube.com/watch?v=NAqCVe2mwzM', image_url: '' },
    { name: 'Dumbbell Shrug', name_vi: 'Nhún vai tạ tay', equipment_keys: ['dumbbell'], primary_muscle_keys: ['trapezius'], secondary_muscle_keys: [], category: 'strength', difficulty: 'beginner', duration_default: 40, rest_time_default: 45, instructions: ['Cầm tạ hai bên hông', 'Nhún vai lên'], tips: 'Giữ 1 giây ở đỉnh', video_url: 'https://www.youtube.com/watch?v=g6qbq4Lf1FI', image_url: '' },

    // === FOREARM ===
    { name: 'Wrist Curl', name_vi: 'Cuốn cổ tay', equipment_keys: ['dumbbell', 'barbell'], primary_muscle_keys: ['forearm'], secondary_muscle_keys: [], category: 'strength', difficulty: 'beginner', duration_default: 40, rest_time_default: 30, instructions: ['Tay đặt trên đùi/ghế, cổ tay buông ngoài mép', 'Cuốn cổ tay lên'], tips: 'Tạ nhẹ, nhiều lần lặp', video_url: 'https://www.youtube.com/watch?v=1q9JJbBjAi8', image_url: '' },
    { name: 'Farmer Walk', name_vi: 'Đi nông dân', equipment_keys: ['dumbbell', 'kettlebell'], primary_muscle_keys: ['forearm'], secondary_muscle_keys: ['trapezius', 'abs'], category: 'strength', difficulty: 'beginner', duration_default: 60, rest_time_default: 60, instructions: ['Cầm tạ nặng hai tay', 'Đi bộ thẳng lưng'], tips: 'Tốt cho sức bám tay', video_url: 'https://www.youtube.com/watch?v=rt17lmnaLSM', image_url: '' },

    // === CARDIO & FULL BODY ===
    { name: 'Burpees', name_vi: 'Burpees', equipment_keys: ['bodyweight'], primary_muscle_keys: ['chest'], secondary_muscle_keys: ['quadriceps', 'abs', 'front-deltoids'], category: 'cardio', difficulty: 'intermediate', duration_default: 30, rest_time_default: 45, instructions: ['Đứng, hạ người xuống squat', 'Đặt tay xuống sàn, nhảy chân ra sau thành plank', 'Chống đẩy 1 cái', 'Nhảy chân về, đứng lên nhảy'], tips: 'Đốt calo cực kỳ hiệu quả', video_url: 'https://www.youtube.com/watch?v=dZgVxmf6jkA', image_url: '' },
    { name: 'Jumping Jack', name_vi: 'Nhảy tách chân', equipment_keys: ['bodyweight'], primary_muscle_keys: ['quadriceps'], secondary_muscle_keys: ['calves', 'front-deltoids'], category: 'cardio', difficulty: 'beginner', duration_default: 30, rest_time_default: 20, instructions: ['Đứng, nhảy tách chân đồng thời vỗ tay trên đầu', 'Nhảy về'], tips: 'Tốt cho khởi động', video_url: 'https://www.youtube.com/watch?v=iSSAk4XCsRA', image_url: '' },
    { name: 'High Knees', name_vi: 'Nâng gối cao', equipment_keys: ['bodyweight'], primary_muscle_keys: ['quadriceps'], secondary_muscle_keys: ['abs', 'calves'], category: 'cardio', difficulty: 'beginner', duration_default: 30, rest_time_default: 20, instructions: ['Chạy tại chỗ, nâng gối cao quá hông'], tips: 'Giữ nhịp nhanh', video_url: 'https://www.youtube.com/watch?v=D0NumyZy95U', image_url: '' },
    { name: 'Jump Squat', name_vi: 'Squat nhảy', equipment_keys: ['bodyweight'], primary_muscle_keys: ['quadriceps'], secondary_muscle_keys: ['gluteal', 'calves'], category: 'plyometrics', difficulty: 'intermediate', duration_default: 30, rest_time_default: 45, instructions: ['Squat xuống', 'Nhảy thật cao', 'Tiếp đất mềm mại quay lại squat'], tips: 'Tiếp đất nhẹ nhàng bằng mũi chân', video_url: 'https://www.youtube.com/watch?v=CVaEhXotL7M', image_url: '' },

    // === STRETCHING ===
    { name: 'Standing Quad Stretch', name_vi: 'Giãn đùi trước đứng', equipment_keys: ['bodyweight'], primary_muscle_keys: ['quadriceps'], secondary_muscle_keys: [], category: 'stretching', difficulty: 'beginner', duration_default: 30, rest_time_default: 15, instructions: ['Đứng 1 chân, kéo gót chân kia chạm mông'], tips: 'Giữ 15-30 giây mỗi bên', video_url: 'https://www.youtube.com/watch?v=DvfFG4mCLaY', image_url: '' },
    { name: 'Chest Stretch', name_vi: 'Giãn ngực', equipment_keys: ['bodyweight'], primary_muscle_keys: ['chest'], secondary_muscle_keys: ['front-deltoids'], category: 'stretching', difficulty: 'beginner', duration_default: 30, rest_time_default: 15, instructions: ['Đặt tay lên tường ngang vai', 'Xoay người ngược lại'], tips: 'Cảm nhận căng ngực', video_url: 'https://www.youtube.com/watch?v=WV4YgCexOGM', image_url: '' },
]

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================
async function seedAll() {
    try {
        console.log('🔗 Connecting to MongoDB...')
        await mongoose.connect(envConfig.mongoURL)
        console.log('✅ Connected!')

        // Drop old exercises indexes
        try {
            await mongoose.connection.db?.collection('exercises').dropIndexes()
        } catch (e) { /* ignore */ }
        try {
            await mongoose.connection.db?.collection('equipment').dropIndexes()
        } catch (e) { /* ignore */ }
        try {
            await mongoose.connection.db?.collection('muscle_groups').dropIndexes()
        } catch (e) { /* ignore */ }

        // 1. Seed Equipment
        console.log('\n📦 Seeding Equipment...')
        await EquipmentModel.deleteMany({})
        const equipmentDocs = await EquipmentModel.insertMany(equipmentSeed)
        console.log(`  ✅ ${equipmentDocs.length} equipment inserted`)

        // 2. Seed Muscle Groups
        console.log('\n💪 Seeding Muscle Groups...')
        await MuscleGroupModel.deleteMany({})
        const muscleDocs = await MuscleGroupModel.insertMany(muscleGroupSeed)
        console.log(`  ✅ ${muscleDocs.length} muscle groups inserted`)

        // Build lookup maps
        const eqMap: Record<string, any> = {}
        equipmentDocs.forEach(doc => { eqMap[doc.name_en] = doc._id })

        const mgMap: Record<string, any> = {}
        muscleDocs.forEach(doc => { mgMap[doc.name_en] = doc._id })

        // ─────────────────────────────────────────────────────────────────────
        // Per-exercise realistic default data
        //
        // Formula in workoutSession.service.ts:
        //   total_kcal = reps × weight × calories_per_unit
        // Therefore:
        //   calories_per_unit (kcal field here) = expected_kcal_per_set / (reps × weight)
        //
        // Weight sources:
        //   • Weighted exercises  → strengthlevel.com, Intermediate level, 70kg bodyweight
        //   • Bodyweight exercises → effective load = % of body weight actually moved
        //       Push-Up/Band Push-Up  ≈ 65% BW = 45kg  (Winter 2009, Biomechanics)
        //       Dip / Tricep Dips     ≈ 75% BW = 50kg
        //       Pull-Up / Chin-Up     ≈ 100% BW = 70kg
        //       Inverted Row          ≈ 75% BW = 50kg
        //       Bodyweight Squat      ≈ 60% BW = 42kg  → 40kg
        //       Glute Bridge/Step-Up  ≈ 50% BW = 35kg
        //       Calf Raise            ≈ 100% BW = 70kg
        //       Crunch/Bicycle        ≈ 30% BW = 21kg  → 20kg
        //       Hanging Leg Raise     ≈ 35% BW = 25kg
        //       Ab Rollout            ≈ 45% BW = 30kg
        //       Plank (isometric)     ≈ 45% BW = 30kg
        //       Side Plank            ≈ 40% BW = 28kg  → 30kg
        //       Mountain Climber      ≈ 55% BW = 38kg  → 40kg
        //       Burpees               ≈ 70% BW = 50kg
        //       Jumping Jack          ≈ 50% BW = 35kg
        //       High Knees            ≈ 50% BW = 35kg
        //       Jump Squat            ≈ 60% BW = 42kg  → 40kg
        //       Wall Sit (isometric)  ≈ 50% BW = 35kg
        //       Band Pull-Apart       → band resistance ≈ 5kg equivalent
        //       Stretch               → body weight held ≈ 30kg
        //
        // kcal/set expected values: Ainsworth Compendium of Physical Activities (2011)
        //   MET × 70kg × time_per_set_hours
        // ─────────────────────────────────────────────────────────────────────
        const exerciseDefaults: Record<string, { sets: number; reps: number; weight: number; kcal: number }> = {
            // === CHEST ===
            // Push-Up: 65% BW=45kg, ~4 kcal/set → 4/(12×45)=0.0074→0.008
            'Push-Up': { sets: 3, reps: 12, weight: 45, kcal: 0.008 },
            // Incline: easier, 55% BW=38kg→35kg, ~3 kcal → 3/(12×35)=0.007
            'Incline Push-Up': { sets: 3, reps: 12, weight: 35, kcal: 0.007 },
            // Dumbbell Bench: 20kg/hand, ~6 kcal → 6/(10×20)=0.030
            'Dumbbell Bench Press': { sets: 4, reps: 10, weight: 20, kcal: 0.030 },
            // Barbell Bench: 60kg, ~9 kcal → 9/(8×60)=0.019→0.019
            'Barbell Bench Press': { sets: 4, reps: 8, weight: 60, kcal: 0.019 },
            // Dumbbell Fly: 12kg/hand, ~4 kcal → 4/(12×12)=0.028
            'Dumbbell Fly': { sets: 3, reps: 12, weight: 12, kcal: 0.028 },
            // Cable Crossover: 15kg each side, ~4 kcal → 4/(12×15)=0.022
            'Cable Crossover': { sets: 4, reps: 12, weight: 15, kcal: 0.022 },
            // Chest Dips: 75% BW=50kg, ~6 kcal → 6/(10×50)=0.012
            'Chest Dips': { sets: 3, reps: 10, weight: 50, kcal: 0.012 },
            // KB Floor Press: 16kg/hand, ~5 kcal → 5/(12×16)=0.026
            'Kettlebell Floor Press': { sets: 3, reps: 12, weight: 16, kcal: 0.026 },
            // Band Push-Up: 65% BW=45kg, ~4 kcal → 4/(10×45)=0.009
            'Band Push-Up': { sets: 3, reps: 10, weight: 45, kcal: 0.009 },

            // === BACK ===
            // Pull-Up: 100% BW=70kg, ~8 kcal → 8/(8×70)=0.014
            'Pull-Up': { sets: 3, reps: 8, weight: 70, kcal: 0.014 },
            // Chin-Up: same
            'Chin-Up': { sets: 3, reps: 8, weight: 70, kcal: 0.014 },
            // Barbell Row: 60kg, ~10 kcal → 10/(10×60)=0.017
            'Barbell Row': { sets: 4, reps: 10, weight: 60, kcal: 0.017 },
            // Dumbbell Row: 20kg/hand, ~7 kcal → 7/(12×20)=0.029
            'Dumbbell Row': { sets: 3, reps: 12, weight: 20, kcal: 0.029 },
            // Lat Pulldown: 50kg, ~8 kcal → 8/(12×50)=0.013
            'Lat Pulldown': { sets: 4, reps: 12, weight: 50, kcal: 0.013 },
            // Inverted Row: 75% BW=50kg, ~6 kcal → 6/(10×50)=0.012
            'Inverted Row': { sets: 3, reps: 10, weight: 50, kcal: 0.012 },
            // Deadlift: 80kg, ~12 kcal → 12/(6×80)=0.025
            'Deadlift': { sets: 4, reps: 6, weight: 80, kcal: 0.025 },
            // KB Swing: 16kg, cardio MET~8, ~12 kcal/set → 12/(20×16)=0.038
            'Kettlebell Swing': { sets: 3, reps: 20, weight: 16, kcal: 0.038 },

            // === SHOULDERS ===
            // DB Shoulder Press: 14kg/hand, ~5 kcal → 5/(10×14)=0.036
            'Dumbbell Shoulder Press': { sets: 4, reps: 10, weight: 14, kcal: 0.036 },
            // Barbell OHP: 40kg, ~8 kcal → 8/(8×40)=0.025
            'Barbell Overhead Press': { sets: 4, reps: 8, weight: 40, kcal: 0.025 },
            // Lateral Raise: 8kg/hand, ~3 kcal → 3/(15×8)=0.025
            'Dumbbell Lateral Raise': { sets: 3, reps: 15, weight: 8, kcal: 0.025 },
            // Front Raise: 8kg/hand, ~3 kcal → 3/(12×8)=0.031
            'Dumbbell Front Raise': { sets: 3, reps: 12, weight: 8, kcal: 0.031 },
            // Face Pull: 20kg, ~4 kcal → 4/(15×20)=0.013
            'Face Pull': { sets: 3, reps: 15, weight: 20, kcal: 0.013 },
            // Band Pull-Apart: band ~5kg equiv, ~2 kcal → 2/(20×5)=0.020
            'Band Pull-Apart': { sets: 3, reps: 20, weight: 5, kcal: 0.020 },

            // === BICEPS ===
            // DB Curl: 12kg/hand, ~3 kcal → 3/(12×12)=0.021
            'Dumbbell Bicep Curl': { sets: 3, reps: 12, weight: 12, kcal: 0.021 },
            // Barbell Curl: 30kg, ~5 kcal → 5/(12×30)=0.014
            'Barbell Curl': { sets: 3, reps: 12, weight: 30, kcal: 0.014 },
            // Hammer Curl: 12kg/hand, ~3 kcal → 3/(12×12)=0.021
            'Hammer Curl': { sets: 3, reps: 12, weight: 12, kcal: 0.021 },
            // Concentration Curl: 10kg, ~2.5 kcal → 2.5/(12×10)=0.021
            'Concentration Curl': { sets: 3, reps: 12, weight: 10, kcal: 0.021 },

            // === TRICEPS ===
            // Tricep Dips: 75% BW=50kg, ~6 kcal → 6/(12×50)=0.010
            'Tricep Dips': { sets: 3, reps: 12, weight: 50, kcal: 0.010 },
            // Overhead Tricep Ext: 20kg, ~4 kcal → 4/(12×20)=0.017
            'Overhead Tricep Extension': { sets: 3, reps: 12, weight: 20, kcal: 0.017 },
            // Skull Crushers: 30kg, ~5 kcal → 5/(10×30)=0.017
            'Skull Crushers': { sets: 4, reps: 10, weight: 30, kcal: 0.017 },
            // Tricep Pushdown: 30kg, ~5 kcal → 5/(15×30)=0.011
            'Tricep Pushdown': { sets: 3, reps: 15, weight: 30, kcal: 0.011 },
            // Diamond Push-Up: 65% BW=45kg, ~4 kcal → 4/(10×45)=0.009
            'Diamond Push-Up': { sets: 3, reps: 10, weight: 45, kcal: 0.009 },

            // === QUADS ===
            // BW Squat: 60% BW=42kg→40kg, ~6 kcal → 6/(15×40)=0.010
            'Bodyweight Squat': { sets: 3, reps: 15, weight: 40, kcal: 0.010 },
            // Barbell Squat: 80kg, ~12 kcal → 12/(8×80)=0.019
            'Barbell Squat': { sets: 4, reps: 8, weight: 80, kcal: 0.019 },
            // Goblet Squat: 20kg, ~7 kcal → 7/(12×20)=0.029
            'Goblet Squat': { sets: 3, reps: 12, weight: 20, kcal: 0.029 },
            // DB Lunges: 16kg/hand, ~7 kcal → 7/(12×16)=0.036
            'Dumbbell Lunges': { sets: 3, reps: 12, weight: 16, kcal: 0.036 },
            // Bulgarian Split Squat: 16kg/hand, ~8 kcal → 8/(10×16)=0.050
            'Bulgarian Split Squat': { sets: 3, reps: 10, weight: 16, kcal: 0.050 },
            // Wall Sit (isometric): 50% BW=35kg, ~2 kcal/set → 2/(1×35)=0.057
            'Wall Sit': { sets: 3, reps: 1, weight: 35, kcal: 0.057 },
            // Leg Press: 100kg, ~9 kcal → 9/(10×100)=0.009
            'Leg Press': { sets: 4, reps: 10, weight: 100, kcal: 0.009 },
            // Leg Extension: 40kg, ~5 kcal → 5/(15×40)=0.008
            'Leg Extension': { sets: 3, reps: 15, weight: 40, kcal: 0.008 },

            // === HAMSTRING & GLUTES ===
            // Romanian Deadlift: 60kg, ~10 kcal → 10/(10×60)=0.017
            'Romanian Deadlift': { sets: 4, reps: 10, weight: 60, kcal: 0.017 },
            // Hip Thrust: 60kg, ~8 kcal → 8/(12×60)=0.011
            'Hip Thrust': { sets: 4, reps: 12, weight: 60, kcal: 0.011 },
            // Glute Bridge: 50% BW=35kg, ~4 kcal → 4/(15×35)=0.008
            'Glute Bridge': { sets: 3, reps: 15, weight: 35, kcal: 0.008 },
            // Leg Curl: 40kg, ~5 kcal → 5/(12×40)=0.010
            'Leg Curl': { sets: 3, reps: 12, weight: 40, kcal: 0.010 },
            // Step-Up: 50% BW=35kg, ~7 kcal → 7/(12×35)=0.017
            'Step-Up': { sets: 3, reps: 12, weight: 35, kcal: 0.017 },

            // === CALVES ===
            // Calf Raise (standing): 100% BW=70kg, ~5 kcal → 5/(20×70)=0.004
            'Calf Raise': { sets: 4, reps: 20, weight: 70, kcal: 0.004 },
            // Seated Calf Raise: 30kg, ~4 kcal → 4/(20×30)=0.007
            'Seated Calf Raise': { sets: 4, reps: 20, weight: 30, kcal: 0.007 },

            // === ABS ===
            // Crunch: 30% BW=21kg→20kg, ~3 kcal → 3/(20×20)=0.008
            'Crunch': { sets: 3, reps: 20, weight: 20, kcal: 0.008 },
            // Plank (isometric): 45% BW=30kg, ~4 kcal → 4/(1×30)=0.133
            'Plank': { sets: 3, reps: 1, weight: 30, kcal: 0.133 },
            // Hanging Leg Raise: 35% BW=25kg, ~6 kcal → 6/(12×25)=0.020
            'Hanging Leg Raise': { sets: 3, reps: 12, weight: 25, kcal: 0.020 },
            // Russian Twist: 5kg weight, ~3 kcal → 3/(20×5)=0.030
            'Russian Twist': { sets: 3, reps: 20, weight: 5, kcal: 0.030 },
            // Mountain Climber: 55% BW=40kg, cardio ~6 kcal → 6/(20×40)=0.008
            'Mountain Climber': { sets: 3, reps: 20, weight: 40, kcal: 0.008 },
            // Ab Rollout: 45% BW=30kg, ~5 kcal → 5/(10×30)=0.017
            'Ab Rollout': { sets: 3, reps: 10, weight: 30, kcal: 0.017 },
            // Bicycle Crunch: 30% BW=20kg, ~3 kcal → 3/(20×20)=0.008
            'Bicycle Crunch': { sets: 3, reps: 20, weight: 20, kcal: 0.008 },
            // Side Plank (isometric): 40% BW=28kg→30kg, ~3 kcal → 3/(1×30)=0.100
            'Side Plank': { sets: 3, reps: 1, weight: 30, kcal: 0.100 },

            // === TRAPEZIUS ===
            // Barbell Shrug: 60kg, ~6 kcal → 6/(15×60)=0.007
            'Barbell Shrug': { sets: 4, reps: 15, weight: 60, kcal: 0.007 },
            // DB Shrug: 20kg/hand, ~4 kcal → 4/(15×20)=0.013
            'Dumbbell Shrug': { sets: 3, reps: 15, weight: 20, kcal: 0.013 },

            // === FOREARM ===
            // Wrist Curl: 10kg, ~2 kcal → 2/(20×10)=0.010
            'Wrist Curl': { sets: 3, reps: 20, weight: 10, kcal: 0.010 },
            // Farmer Walk: 24kg/hand, per walk ~4 kcal → 4/(1×24)=0.167
            'Farmer Walk': { sets: 3, reps: 1, weight: 24, kcal: 0.167 },

            // === CARDIO & FULL BODY ===
            // Burpees: 70% BW=50kg, ~10 kcal/set → 10/(10×50)=0.020
            'Burpees': { sets: 3, reps: 10, weight: 50, kcal: 0.020 },
            // Jumping Jack: 50% BW=35kg, ~6 kcal → 6/(30×35)=0.006
            'Jumping Jack': { sets: 3, reps: 30, weight: 35, kcal: 0.006 },
            // High Knees: 50% BW=35kg, ~6 kcal → 6/(30×35)=0.006
            'High Knees': { sets: 3, reps: 30, weight: 35, kcal: 0.006 },
            // Jump Squat: 60% BW=40kg, explosive ~9 kcal → 9/(10×40)=0.023
            'Jump Squat': { sets: 3, reps: 10, weight: 40, kcal: 0.023 },

            // === STRETCHING ===
            // Stretches: ~30kg body weight involved, ~0.5 kcal → 0.5/(1×30)=0.017
            'Standing Quad Stretch': { sets: 2, reps: 1, weight: 30, kcal: 0.017 },
            'Chest Stretch': { sets: 2, reps: 1, weight: 30, kcal: 0.017 },
        }

        function generateDefaultSets(exerciseName: string, difficulty: string, category: string) {
            const d = exerciseDefaults[exerciseName]
            if (d) {
                return Array.from({ length: d.sets }, (_, i) => ({
                    set_number: i + 1,
                    reps: d.reps,
                    weight: d.weight,
                    weight_unit: 'kg',
                    calories_per_unit: d.kcal
                }))
            }
            // Fallback for any exercise not in the map
            if (category === 'stretching') {
                return [{ set_number: 1, reps: 1, weight: 0, weight_unit: 'kg', calories_per_unit: 0.1 }]
            }
            if (category === 'cardio') {
                return Array.from({ length: 3 }, (_, i) => ({ set_number: i + 1, reps: 20, weight: 0, weight_unit: 'kg', calories_per_unit: 0.4 }))
            }
            const fallback: Record<string, { sets: number; reps: number }> = {
                beginner: { sets: 3, reps: 12 },
                intermediate: { sets: 4, reps: 10 },
                expert: { sets: 5, reps: 8 }
            }
            const c = fallback[difficulty] || fallback.intermediate
            return Array.from({ length: c.sets }, (_, i) => ({
                set_number: i + 1, reps: c.reps, weight: 0, weight_unit: 'kg', calories_per_unit: 0.5
            }))
        }

        // 3. Seed Exercises
        console.log('\n🏋️ Seeding Exercises...')
        await ExerciseModel.deleteMany({})
        const exerciseDocs = exerciseSeed.map(ex => ({
            name: ex.name,
            name_vi: ex.name_vi,
            description: ex.instructions.join('. '),
            instructions: ex.instructions,
            tips: ex.tips,
            equipment: ex.equipment_keys,
            equipment_ids: ex.equipment_keys.map(k => eqMap[k]).filter(Boolean),
            primary_muscles: ex.primary_muscle_keys,
            muscle_group_ids: ex.primary_muscle_keys.map(k => mgMap[k]).filter(Boolean),
            secondary_muscles: ex.secondary_muscle_keys,
            secondary_muscle_ids: ex.secondary_muscle_keys.map(k => mgMap[k]).filter(Boolean),
            image_url: ex.image_url,
            video_url: ex.video_url,
            category: ex.category,
            difficulty: ex.difficulty,
            default_sets: generateDefaultSets(ex.name, ex.difficulty, ex.category),
            // Giá trị seed cũ (30–40) là scale khác — quy về giây/rep hợp lý cho phiên tập
            duration_default: Math.max(1, Math.min(15, Math.round(ex.duration_default / 10))),
            rest_time_default: 0,
            is_active: true
        }))
        const insertedExercises = await ExerciseModel.insertMany(exerciseDocs)
        console.log(`  ✅ ${insertedExercises.length} exercises inserted`)

        // Summary
        console.log('\n' + '='.repeat(50))
        console.log('🎉 SEED COMPLETE!')
        console.log(`  Equipment: ${equipmentDocs.length}`)
        console.log(`  Muscle Groups: ${muscleDocs.length}`)
        console.log(`  Exercises: ${insertedExercises.length}`)
        console.log('='.repeat(50))

        await mongoose.disconnect()
        process.exit(0)
    } catch (error) {
        console.error('❌ Seed failed:', error)
        await mongoose.disconnect()
        process.exit(1)
    }
}

seedAll()

