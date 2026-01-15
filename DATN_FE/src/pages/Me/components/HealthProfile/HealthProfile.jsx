import { useMemo, useState } from 'react'
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

const activityLevelLabelMap = {
  1: 'Ít vận động',
  2: 'Vận động nhẹ',
  3: 'Vận động vừa phải',
  4: 'Vận động nhiều',
  5: 'Vận động rất nhiều'
}

const toNumberOrNull = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const computeBMI = (weight, height) => {
  if (!Number.isFinite(weight) || !Number.isFinite(height) || height === 0) return null
  const heightInMeters = height / 100
  return weight / (heightInMeters * heightInMeters)
}

const formatNumber = (value, digits = 1, fallback = 'Chưa cập nhật') =>
  Number.isFinite(value) ? value.toFixed(digits) : fallback

const displayOrPlaceholder = (value, suffix = '') =>
  Number.isFinite(value) ? `${value}${suffix}` : 'Chưa cập nhật'

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

  const userHealth = userData?.data?.result?.[0]

  const healthData = useMemo(() => {
    const weight = toNumberOrNull(userHealth?.weight)
    const height = toNumberOrNull(userHealth?.height)
    const bmi = toNumberOrNull(userHealth?.BMI) ?? computeBMI(weight, height)

    const activityLevelText =
      userHealth?.activity_level_text || activityLevelLabelMap?.[userHealth?.activity_level] || ''

    return {
      gender: userHealth?.gender || '',
      age: toNumberOrNull(userHealth?.age),
      height,
      weight,
      activity_level: activityLevelText,
      activity_level_value: toNumberOrNull(userHealth?.activity_level),
      health_goal: userHealth?.health_goal || '',
      target_weight: toNumberOrNull(userHealth?.target_weight),
      dietary_preferences: userHealth?.dietary_preferences || '',
      allergies: userHealth?.allergies || '',
      bmi,
      bmr: toNumberOrNull(userHealth?.BMR),
      tdee: toNumberOrNull(userHealth?.TDEE),
      body_fat: toNumberOrNull(userHealth?.body_fat),
      visceral_fat: toNumberOrNull(userHealth?.visceral_fat),
      muscle_mass: toNumberOrNull(userHealth?.muscle_mass),
      bone_mass: toNumberOrNull(userHealth?.bone_mass),
      body_water: toNumberOrNull(userHealth?.body_water),
      metabolic_age: toNumberOrNull(userHealth?.metabolic_age),
      sleep_average: toNumberOrNull(userHealth?.sleep_average),
      water_intake: toNumberOrNull(userHealth?.water_intake),
      steps_average: toNumberOrNull(userHealth?.steps_average),
      heart_rate_resting: toNumberOrNull(userHealth?.heart_rate_resting)
    }
  }, [userHealth])

  // Xác định trạng thái sức khỏe dựa trên BMI
  const getBMIStatus = (bmi) => {
    if (!Number.isFinite(bmi))
      return {
        text: 'Chưa cập nhật',
        color: 'text-gray-500',
        bgColor: 'bg-gray-100 dark:bg-gray-700/40',
        icon: null
      }
    if (bmi < 18.5)
      return {
        text: 'Thiếu cân',
        color: 'text-blue-500',
        bgColor: 'bg-blue-100 dark:bg-blue-900/20',
        icon: <FaArrowDown className="mr-1" />
      }
    if (bmi < 25)
      return {
        text: 'Bình thường',
        color: 'text-green-500',
        bgColor: 'bg-green-100 dark:bg-green-900/20',
        icon: <FaEquals className="mr-1" />
      }
    if (bmi < 30)
      return {
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
    if (healthData.health_goal === 'Duy trì cân nặng' && Number.isFinite(healthData.weight)) {
      return 100
    }

    if (!Number.isFinite(healthData.weight) || !Number.isFinite(healthData.target_weight)) return 0

    const diff = Math.abs(healthData.weight - healthData.target_weight)
    const totalDiff = Math.abs(
      healthData.health_goal === 'Giảm cân'
        ? healthData.weight + 5 - healthData.target_weight
        : healthData.target_weight - (healthData.weight - 5)
    )

    if (!Number.isFinite(totalDiff) || totalDiff === 0) return 0

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
                  {bmiStatus.icon} BMI: {formatNumber(healthData.bmi)}
                </span>
                <span>{getBMICategory(healthData.bmi)}</span>
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Mục tiêu hiện tại: <span className="font-medium">{healthData.health_goal}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                  {Number.isFinite(healthData.weight) ? healthData.weight : '—'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Cân nặng (kg)</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {Number.isFinite(healthData.target_weight) ? healthData.target_weight : '—'}
                </div>
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
              { label: 'Giới tính', value: healthData.gender || 'Chưa cập nhật' },
              { label: 'Tuổi', value: Number.isFinite(healthData.age) ? healthData.age : 'Chưa cập nhật' },
              { label: 'Chiều cao', value: Number.isFinite(healthData.height) ? `${healthData.height} cm` : 'Chưa cập nhật' },
              { label: 'Cân nặng', value: Number.isFinite(healthData.weight) ? `${healthData.weight} kg` : 'Chưa cập nhật' }
            ]}
          />
        </motion.div>

        <motion.div variants={fadeIn}>
          <HealthProfileCard 
            title="Hoạt động & Mục tiêu"
            iconColor="text-purple-500"
            items={[
              { label: 'Mức độ hoạt động', value: healthData.activity_level || 'Chưa cập nhật' },
              { label: 'Mục tiêu sức khỏe', value: healthData.health_goal || 'Chưa cập nhật' },
              { label: 'Cân nặng mục tiêu', value: Number.isFinite(healthData.target_weight) ? `${healthData.target_weight} kg` : 'Chưa cập nhật' },
              { label: 'Chế độ ăn', value: healthData.dietary_preferences || 'Chưa cập nhật' },
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
                value: formatNumber(healthData.bmi), 
                description: getBMICategory(healthData.bmi),
                highlighted: true
              },
              { 
                label: 'Chỉ số BMR', 
                value: Number.isFinite(healthData.bmr) ? `${healthData.bmr.toFixed(0)} calo` : 'Chưa cập nhật', 
                description: 'Lượng calo cơ thể cần khi nghỉ ngơi'
              },
              { 
                label: 'Chỉ số TDEE', 
                value: Number.isFinite(healthData.tdee) ? `${healthData.tdee.toFixed(0)} calo` : 'Chưa cập nhật', 
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
                <span className="font-medium text-gray-800 dark:text-white">{displayOrPlaceholder(healthData.body_fat, '%')}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${Math.min(100, Math.max(0, Number.isFinite(healthData.body_fat) ? healthData.body_fat : 0))}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between items-center mt-4">
                <span className="text-gray-600 dark:text-gray-400">Khối lượng cơ</span>
                <span className="font-medium text-gray-800 dark:text-white">{displayOrPlaceholder(healthData.muscle_mass, ' kg')}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        0,
                        Number.isFinite(healthData.muscle_mass) && Number.isFinite(healthData.weight) && healthData.weight !== 0
                          ? (healthData.muscle_mass / healthData.weight) * 100
                          : 0
                      )
                    )}%`
                  }}
                ></div>
              </div>
              
              <div className="flex justify-between items-center mt-4">
                <span className="text-gray-600 dark:text-gray-400">Mỡ nội tạng</span>
                <span className="font-medium text-gray-800 dark:text-white">{displayOrPlaceholder(healthData.visceral_fat)}</span>
              </div>
              <div className="flex justify-between items-center mt-4">
                <span className="text-gray-600 dark:text-gray-400">Khối lượng xương</span>
                <span className="font-medium text-gray-800 dark:text-white">{displayOrPlaceholder(healthData.bone_mass, ' kg')}</span>
              </div>
              <div className="flex justify-between items-center mt-4">
                <span className="text-gray-600 dark:text-gray-400">Phần trăm nước</span>
                <span className="font-medium text-gray-800 dark:text-white">{displayOrPlaceholder(healthData.body_water, '%')}</span>
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
                <span className="font-medium text-gray-800 dark:text-white">{displayOrPlaceholder(healthData.sleep_average, ' giờ/ngày')}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full"
                  style={{ width: `${Math.min(100, Math.max(0, Number.isFinite(healthData.sleep_average) ? (healthData.sleep_average / 10) * 100 : 0))}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between items-center mt-4">
                <span className="text-gray-600 dark:text-gray-400">Lượng nước uống</span>
                <span className="font-medium text-gray-800 dark:text-white">{displayOrPlaceholder(healthData.water_intake, ' ml/ngày')}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-400 h-2 rounded-full"
                  style={{ width: `${Math.min(100, Math.max(0, Number.isFinite(healthData.water_intake) ? (healthData.water_intake / 3000) * 100 : 0))}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between items-center mt-4">
                <span className="text-gray-600 dark:text-gray-400">Số bước đi trung bình</span>
                <span className="font-medium text-gray-800 dark:text-white">{displayOrPlaceholder(healthData.steps_average, ' bước/ngày')}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${Math.min(100, Math.max(0, Number.isFinite(healthData.steps_average) ? (healthData.steps_average / 10000) * 100 : 0))}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between items-center mt-4">
                <span className="text-gray-600 dark:text-gray-400">Nhịp tim lúc nghỉ</span>
                <span className="font-medium text-gray-800 dark:text-white">{displayOrPlaceholder(healthData.heart_rate_resting, ' nhịp/phút')}</span>
              </div>
              <div className="flex justify-between items-center mt-4">
                <span className="text-gray-600 dark:text-gray-400">Tuổi trao đổi chất</span>
                <span className="font-medium text-gray-800 dark:text-white">{displayOrPlaceholder(healthData.metabolic_age, ' tuổi')}</span>
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
  if (!Number.isFinite(bmi)) return 'Chưa cập nhật'
  if (bmi < 18.5) return 'Thiếu cân'
  if (bmi < 25) return 'Bình thường'
  if (bmi < 30) return 'Thừa cân'
  return 'Béo phì'
}

// Hàm tính lượng calo khuyến nghị dựa trên mục tiêu
function getRecommendedCalories(healthData) {
  if (!Number.isFinite(healthData.tdee)) return 'Chưa cập nhật'

  let calories = healthData.tdee

  if (healthData.health_goal === 'Giảm cân') {
    calories = Math.round(calories - 500)
  } else if (healthData.health_goal === 'Tăng cân' || healthData.health_goal === 'Tăng cơ bắp') {
    calories = Math.round(calories + 500)
  }

  return `${calories} calo`
} 