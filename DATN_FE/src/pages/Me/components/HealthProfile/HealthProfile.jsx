import { useState } from 'react'
import { motion } from 'framer-motion'
import { currentAccount } from '../../../../apis/userApi'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import HealthProfileCard from '../HealthProfileCard/HealthProfileCard'
import ModalUpdateHealthProfile from '../ModalUpdateHealthProfile/ModalUpdateHealthProfile'
import { FaHeartPulse, FaArrowUp, FaArrowDown, FaEquals, FaChartLine } from 'react-icons/fa6'

const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4 }
  }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

// Mock data chi tiết cho thông tin sức khỏe người dùng
const mockHealthData = {
  // Thông tin cơ bản
  gender: 'Nam',
  age: 28,
  height: 175,
  weight: 70,
  
  // Hoạt động & mục tiêu
  activity_level: 'Vận động vừa phải',
  health_goal: 'Duy trì cân nặng',
  target_weight: 70,
  dietary_preferences: 'Ăn chay',
  allergies: 'Không',
  
  // Chỉ số sức khỏe cơ bản
  bmi: 22.9,
  bmr: 1700,
  tdee: 2635,
  
  // Chỉ số sức khỏe nâng cao
  body_fat: 18.5,         // Phần trăm mỡ cơ thể
  visceral_fat: 7,         // Mỡ nội tạng
  muscle_mass: 55.6,       // Khối lượng cơ (kg)
  bone_mass: 3.2,          // Khối lượng xương (kg)
  body_water: 55,          // Phần trăm nước trong cơ thể
  metabolic_age: 26,       // Tuổi trao đổi chất
  
  // Lịch sử và theo dõi
  history: [
    { date: '2023-11-01', weight: 72.5, bmi: 23.7 },
    { date: '2023-12-01', weight: 71.3, bmi: 23.3 },
    { date: '2024-01-01', weight: 70.8, bmi: 23.1 },
    { date: '2024-02-01', weight: 70.2, bmi: 22.9 },
    { date: '2024-03-01', weight: 70.0, bmi: 22.9 }
  ],
  
  // Thông tin bổ sung
  sleep_average: 7.5,      // Giờ ngủ trung bình
  water_intake: 2000,      // ml nước uống hàng ngày
  steps_average: 8500,     // Số bước đi trung bình
  heart_rate_resting: 68   // Nhịp tim lúc nghỉ
}

export default function HealthProfile() {
  const [modalUpdateHealthProfile, setModalUpdateHealthProfile] = useState(false)

  const openModalUpdateHealthProfile = () => {
    setModalUpdateHealthProfile(true)
  }

  const closeModalUpdateHealthProfile = () => {
    setModalUpdateHealthProfile(false)
  }

  const { data: userData } = useQuery({
    queryKey: ['me'],
    queryFn: () => {
      return currentAccount()
    },
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5
  })

  // Luôn sử dụng mockdata cho phần chi tiết chỉ số sức khỏe
  // Chỉ lấy dữ liệu cơ bản từ API nếu có
  const userBasicHealthData = userData?.data?.result[0]?.health_profile
  
  // Kết hợp dữ liệu từ API (nếu có) và mockdata, ưu tiên dữ liệu từ API cho thông tin cơ bản
  const healthData = {
    ...mockHealthData,
    ...(userBasicHealthData ? {
      gender: userBasicHealthData.gender || mockHealthData.gender,
      age: userBasicHealthData.age || mockHealthData.age,
      height: userBasicHealthData.height || mockHealthData.height,
      weight: userBasicHealthData.weight || mockHealthData.weight,
      activity_level: userBasicHealthData.activity_level || mockHealthData.activity_level,
      health_goal: userBasicHealthData.health_goal || mockHealthData.health_goal,
      target_weight: userBasicHealthData.target_weight || mockHealthData.target_weight
    } : {})
  }

  // Xác định trạng thái sức khỏe dựa trên BMI
  const getBMIStatus = (bmi) => {
    if (bmi < 18.5) return { 
      text: 'Thiếu cân', 
      color: 'text-blue-500',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      icon: <FaArrowDown className="mr-1" />
    }
    if (bmi < 25) return { 
      text: 'Bình thường', 
      color: 'text-green-500',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      icon: <FaEquals className="mr-1" />
    }
    if (bmi < 30) return { 
      text: 'Thừa cân', 
      color: 'text-orange-500',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      icon: <FaArrowUp className="mr-1" />
    }
    return { 
      text: 'Béo phì', 
      color: 'text-red-500',
      bgColor: 'bg-red-100 dark:bg-red-900/20',
      icon: <FaArrowUp className="mr-1" />
    }
  }

  const bmiStatus = getBMIStatus(healthData.bmi)

  // Tính phần trăm hoàn thành mục tiêu
  const goalProgress = () => {
    if (healthData.health_goal === 'Duy trì cân nặng') {
      return 100
    }
    
    const diff = Math.abs(healthData.weight - healthData.target_weight)
    const totalDiff = Math.abs(healthData.health_goal === 'Giảm cân' ? 
      healthData.weight + 5 - healthData.target_weight : 
      healthData.target_weight - (healthData.weight - 5))
      
    return Math.min(100, Math.max(0, (1 - diff / totalDiff) * 100))
  }

  return (
    <motion.div 
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="p-6"
    >
      {/* Health summary */}
      <motion.div 
        variants={fadeIn}
        className="mb-8 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/20 rounded-xl overflow-hidden shadow-sm"
      >
        <div className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                Tổng quan sức khỏe
              </h3>
              <div className="flex items-center justify-center md:justify-start text-sm text-gray-600 dark:text-gray-300 mb-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full ${bmiStatus.bgColor} ${bmiStatus.color} text-xs font-medium mr-2`}>
                  {bmiStatus.icon} BMI: {healthData.bmi.toFixed(1)}
                </span>
                <span>{getBMICategory(healthData.bmi)}</span>
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Mục tiêu hiện tại: <span className="font-medium">{healthData.health_goal}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{healthData.weight}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Cân nặng (kg)</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{healthData.target_weight}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Mục tiêu (kg)</div>
              </div>
              
              <div className="relative w-24 h-24">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#E2E8F0"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#4F46E5"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${goalProgress()}, 100`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{Math.round(goalProgress())}%</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Tiến độ</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="flex justify-between items-center mb-6">
        <motion.h2 
          variants={fadeIn}
          className="text-xl font-bold text-gray-800 dark:text-white flex items-center"
        >
          <FaChartLine className="mr-2 text-red-600" /> 
          Chi tiết chỉ số sức khỏe
        </motion.h2>
        
        <motion.button
          variants={fadeIn}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={openModalUpdateHealthProfile}
          className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
        >
          Cập nhật thông tin
        </motion.button>
      </div>

      <motion.div 
        variants={staggerContainer}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <motion.div variants={fadeIn}>
          <HealthProfileCard 
            title="Thông tin cơ bản"
            iconColor="text-blue-500"
            items={[
              { label: 'Giới tính', value: healthData.gender },
              { label: 'Tuổi', value: healthData.age },
              { label: 'Chiều cao', value: `${healthData.height} cm` },
              { label: 'Cân nặng', value: `${healthData.weight} kg` }
            ]}
          />
        </motion.div>

        <motion.div variants={fadeIn}>
          <HealthProfileCard 
            title="Hoạt động & Mục tiêu"
            iconColor="text-purple-500"
            items={[
              { label: 'Mức độ hoạt động', value: healthData.activity_level },
              { label: 'Mục tiêu sức khỏe', value: healthData.health_goal },
              { label: 'Cân nặng mục tiêu', value: `${healthData.target_weight} kg` },
              { label: 'Chế độ ăn', value: healthData.dietary_preferences },
              { label: 'Dị ứng', value: healthData.allergies || 'Không có' }
            ]}
          />
        </motion.div>

        <motion.div variants={fadeIn}>
          <HealthProfileCard 
            title="Chỉ số sức khỏe"
            iconColor="text-green-500"
            items={[
              { 
                label: 'Chỉ số BMI', 
                value: healthData.bmi.toFixed(1), 
                description: getBMICategory(healthData.bmi),
                highlighted: true
              },
              { 
                label: 'Chỉ số BMR', 
                value: `${healthData.bmr.toFixed(0)} calo`, 
                description: 'Lượng calo cơ thể cần khi nghỉ ngơi'
              },
              { 
                label: 'Chỉ số TDEE', 
                value: `${healthData.tdee.toFixed(0)} calo`, 
                description: 'Lượng calo đốt cháy hàng ngày'
              },
              { 
                label: 'Khuyến nghị calo', 
                value: getRecommendedCalories(healthData),
                description: `Dựa trên mục tiêu: ${healthData.health_goal}`,
                highlighted: true
              }
            ]}
          />
        </motion.div>
      </motion.div>

      {/* Thêm phần hiển thị các chỉ số nâng cao từ mockdata */}
      <motion.div 
        variants={fadeIn}
        className="mt-8"
      >
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center">
          <FaHeartPulse className="mr-2 text-red-600" /> 
          Chỉ số sức khỏe nâng cao
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div 
            variants={fadeIn}
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Thành phần cơ thể</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Phần trăm mỡ cơ thể</span>
                <span className="font-medium text-gray-800 dark:text-white">{healthData.body_fat}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${healthData.body_fat}%` }}></div>
              </div>
              
              <div className="flex justify-between items-center mt-4">
                <span className="text-gray-600 dark:text-gray-400">Khối lượng cơ</span>
                <span className="font-medium text-gray-800 dark:text-white">{healthData.muscle_mass} kg</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: `${(healthData.muscle_mass / healthData.weight) * 100}%` }}></div>
              </div>
              
              <div className="flex justify-between items-center mt-4">
                <span className="text-gray-600 dark:text-gray-400">Mỡ nội tạng</span>
                <span className="font-medium text-gray-800 dark:text-white">{healthData.visceral_fat}</span>
              </div>
              <div className="flex justify-between items-center mt-4">
                <span className="text-gray-600 dark:text-gray-400">Khối lượng xương</span>
                <span className="font-medium text-gray-800 dark:text-white">{healthData.bone_mass} kg</span>
              </div>
              <div className="flex justify-between items-center mt-4">
                <span className="text-gray-600 dark:text-gray-400">Phần trăm nước</span>
                <span className="font-medium text-gray-800 dark:text-white">{healthData.body_water}%</span>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            variants={fadeIn}
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Hoạt động hàng ngày</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Thời gian ngủ</span>
                <span className="font-medium text-gray-800 dark:text-white">{healthData.sleep_average} giờ/ngày</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${(healthData.sleep_average / 10) * 100}%` }}></div>
              </div>
              
              <div className="flex justify-between items-center mt-4">
                <span className="text-gray-600 dark:text-gray-400">Lượng nước uống</span>
                <span className="font-medium text-gray-800 dark:text-white">{healthData.water_intake} ml/ngày</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-blue-400 h-2 rounded-full" style={{ width: `${(healthData.water_intake / 3000) * 100}%` }}></div>
              </div>
              
              <div className="flex justify-between items-center mt-4">
                <span className="text-gray-600 dark:text-gray-400">Số bước đi trung bình</span>
                <span className="font-medium text-gray-800 dark:text-white">{healthData.steps_average} bước/ngày</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(healthData.steps_average / 10000) * 100}%` }}></div>
              </div>
              
              <div className="flex justify-between items-center mt-4">
                <span className="text-gray-600 dark:text-gray-400">Nhịp tim lúc nghỉ</span>
                <span className="font-medium text-gray-800 dark:text-white">{healthData.heart_rate_resting} nhịp/phút</span>
              </div>
              <div className="flex justify-between items-center mt-4">
                <span className="text-gray-600 dark:text-gray-400">Tuổi trao đổi chất</span>
                <span className="font-medium text-gray-800 dark:text-white">{healthData.metabolic_age} tuổi</span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <motion.div 
        variants={fadeIn}
        className="mt-8 bg-yellow-50 dark:bg-gray-700 p-4 rounded-lg border-l-4 border-yellow-400 dark:border-yellow-600"
      >
        <div className="flex">
          <div className="flex-shrink-0">
            <FaHeartPulse className="h-5 w-5 text-yellow-500" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Lưu ý về sức khỏe</h3>
            <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-200">
              <ul className="list-disc pl-5 space-y-1">
                <li>Các thông số được tính toán dựa trên công thức chuẩn nhưng chỉ mang tính tham khảo.</li>
                <li>Để có kết quả chính xác hơn, vui lòng tham khảo ý kiến của chuyên gia dinh dưỡng hoặc bác sĩ.</li>
                <li>Cập nhật thông tin sức khỏe thường xuyên để nhận được đề xuất phù hợp nhất.</li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>

      {modalUpdateHealthProfile && (
        <ModalUpdateHealthProfile 
          handleCloseModalUpdateHealthProfile={closeModalUpdateHealthProfile} 
          healthProfile={healthData}
        />
      )}
    </motion.div>
  )
}

// Hàm xác định phân loại BMI
function getBMICategory(bmi) {
  if (bmi < 18.5) return 'Thiếu cân'
  if (bmi < 25) return 'Bình thường'
  if (bmi < 30) return 'Thừa cân'
  return 'Béo phì'
}

// Hàm tính lượng calo khuyến nghị dựa trên mục tiêu
function getRecommendedCalories(healthData) {
  let calories = healthData.tdee
  
  if (healthData.health_goal === 'Giảm cân') {
    calories = Math.round(calories - 500)
  } else if (healthData.health_goal === 'Tăng cân' || healthData.health_goal === 'Tăng cơ bắp') {
    calories = Math.round(calories + 500)
  }
  
  return `${calories} calo`
} 