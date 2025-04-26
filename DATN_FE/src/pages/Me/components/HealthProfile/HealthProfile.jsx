import { useState } from 'react'
import { currentAccount } from '../../../../apis/userApi'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import HealthProfileCard from '../HealthProfileCard/HealthProfileCard'
import ModalUpdateHealthProfile from '../ModalUpdateHealthProfile/ModalUpdateHealthProfile'

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

  // Mock data cho thông tin sức khỏe người dùng
  const mockHealthData = {
    gender: 'Nam',
    age: 28,
    height: 175,
    weight: 70,
    activity_level: 'Vận động vừa phải',
    health_goal: 'Duy trì cân nặng',
    target_weight: 70,
    dietary_preferences: 'Ăn chay',
    allergies: 'Không',
    bmi: 22.9,
    bmr: 1700,
    tdee: 2635
  }

  const healthData = userData?.data?.result[0]?.health_profile || mockHealthData

  return (
    <div className="p-4">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Hồ sơ Sức khỏe</h2>
        <button
          onClick={openModalUpdateHealthProfile}
          className="btn btn-sm bg-red-700 hover:bg-red-800 text-white"
        >
          Cập nhật thông tin sức khỏe
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <HealthProfileCard 
          title="Thông tin cơ bản"
          items={[
            { label: 'Giới tính', value: healthData.gender },
            { label: 'Tuổi', value: healthData.age },
            { label: 'Chiều cao', value: `${healthData.height} cm` },
            { label: 'Cân nặng', value: `${healthData.weight} kg` }
          ]}
        />

        <HealthProfileCard 
          title="Hoạt động & Mục tiêu"
          items={[
            { label: 'Mức độ hoạt động', value: healthData.activity_level },
            { label: 'Mục tiêu sức khỏe', value: healthData.health_goal },
            { label: 'Cân nặng mục tiêu', value: `${healthData.target_weight} kg` },
            { label: 'Chế độ ăn', value: healthData.dietary_preferences },
            { label: 'Dị ứng', value: healthData.allergies }
          ]}
        />

        <HealthProfileCard 
          title="Chỉ số sức khỏe"
          items={[
            { 
              label: 'Chỉ số BMI', 
              value: healthData.bmi.toFixed(1), 
              description: getBMICategory(healthData.bmi)
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
              description: `Dựa trên mục tiêu: ${healthData.health_goal}`
            }
          ]}
        />
      </div>

      <div className="mt-6 bg-yellow-50 dark:bg-gray-700 p-4 rounded-lg text-sm text-gray-700 dark:text-gray-200">
        <p className="font-semibold mb-2">Lưu ý:</p>
        <ul className="list-disc list-inside">
          <li>Các thông số được tính toán dựa trên công thức chuẩn nhưng chỉ mang tính tham khảo.</li>
          <li>Để có kết quả chính xác hơn, vui lòng tham khảo ý kiến của chuyên gia dinh dưỡng hoặc bác sĩ.</li>
          <li>Cập nhật thông tin sức khỏe thường xuyên để nhận được đề xuất phù hợp nhất.</li>
        </ul>
      </div>

      {modalUpdateHealthProfile && (
        <ModalUpdateHealthProfile 
          handleCloseModalUpdateHealthProfile={closeModalUpdateHealthProfile} 
          healthProfile={healthData}
        />
      )}
    </div>
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