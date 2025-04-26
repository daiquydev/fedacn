import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { queryClient } from '../../../../main'
import { updateHealthProfile } from '../../../../apis/userApi'
import ModalLayout from '../../../../layouts/ModalLayout'
import Input from '../../../../components/InputComponents/Input'
import Loading from '../../../../components/GlobalComponents/Loading'
import { schemaHealthProfile } from '../../../../utils/rules'

export default function ModalUpdateHealthProfile({ handleCloseModalUpdateHealthProfile, healthProfile }) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schemaHealthProfile),
    defaultValues: {
      gender: '',
      age: '',
      height: '',
      weight: '',
      activity_level: '',
      health_goal: '',
      target_weight: '',
      dietary_preferences: '',
      allergies: ''
    }
  })

  // Theo dõi giá trị của health_goal để hiển thị/ẩn trường cân nặng mục tiêu
  const healthGoal = watch('health_goal')
  const showTargetWeight = healthGoal === 'Giảm cân' || healthGoal === 'Tăng cân'

  // Set giá trị mặc định từ thông tin sức khỏe hiện có
  useEffect(() => {
    if (healthProfile) {
      setValue('gender', healthProfile.gender || '')
      setValue('age', healthProfile.age || '')
      setValue('height', healthProfile.height || '')
      setValue('weight', healthProfile.weight || '')
      setValue('activity_level', healthProfile.activity_level || '')
      setValue('health_goal', healthProfile.health_goal || '')
      setValue('target_weight', healthProfile.target_weight || '')
      setValue('dietary_preferences', healthProfile.dietary_preferences || '')
      setValue('allergies', healthProfile.allergies || '')
    }
  }, [healthProfile, setValue])

  // Mutation để cập nhật thông tin sức khỏe
  const updateHealthProfileMutation = useMutation({
    mutationFn: (body) => updateHealthProfile(body)
  })

  // Hàm tính BMI
  const calculateBMI = (weight, height) => {
    const heightInMeters = height / 100
    return weight / (heightInMeters * heightInMeters)
  }

  // Hàm tính BMR theo công thức Mifflin-St Jeor
  const calculateBMR = (gender, weight, height, age) => {
    if (gender === 'Nam') {
      return 10 * weight + 6.25 * height - 5 * age + 5
    } else {
      return 10 * weight + 6.25 * height - 5 * age - 161
    }
  }

  // Hàm tính TDEE dựa trên BMR và mức độ hoạt động
  const calculateTDEE = (bmr, activityLevel) => {
    const activityFactors = {
      'Ít vận động': 1.2,
      'Vận động nhẹ': 1.375,
      'Vận động vừa phải': 1.55,
      'Vận động nhiều': 1.725,
      'Vận động rất nhiều': 1.9
    }
    return bmr * activityFactors[activityLevel]
  }

  // Xử lý submit form
  const onSubmit = handleSubmit((data) => {
    // Tính toán các chỉ số sức khỏe
    const bmi = calculateBMI(data.weight, data.height)
    const bmr = calculateBMR(data.gender, data.weight, data.height, data.age)
    const tdee = calculateTDEE(bmr, data.activity_level)

    // Thêm các chỉ số vào data
    const healthData = {
      ...data,
      bmi,
      bmr,
      tdee
    }

    updateHealthProfileMutation.mutate(healthData, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ['me']
        })
        toast.success('Cập nhật thông tin sức khỏe thành công')
        handleCloseModalUpdateHealthProfile()
      },
      onError: (error) => {
        toast.error('Có lỗi xảy ra khi cập nhật thông tin sức khỏe')
        console.error(error)
      }
    })
  })

  return (
    <ModalLayout
      closeModal={handleCloseModalUpdateHealthProfile}
      className='modal-content max-h-[90vh] overflow-y-auto min-w-[360px] md:min-w-[500px] bg-white dark:bg-gray-800'
    >
      <div className="relative w-full max-w-2xl">
        <div className="">
          <div className="flex justify-between">
            <div className="px-3 py-1"></div>
            <h3 className="mb-2 font-medium text-lg md:text-xl text-black dark:text-white">
              Cập nhật thông tin sức khỏe
            </h3>
            <div className="text-2xl font-semibold">
              <span
                onClick={handleCloseModalUpdateHealthProfile}
                className="hover:bg-slate-100 transition-all dark:hover:bg-slate-700 cursor-pointer rounded-full px-3 py-1"
              >
                &times;
              </span>
            </div>
          </div>

          <div className="border dark:border-gray-600 border-red-200"></div>
          
          <form noValidate onSubmit={onSubmit} className="p-4">
            <div className="mb-6">
              <h4 className="text-sm uppercase font-semibold text-gray-600 dark:text-gray-300 mb-3">Thông tin cơ bản</h4>
              
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-200 text-sm font-medium mb-1">
                  Giới tính sinh học <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center text-gray-700 dark:text-white">
                    <input
                      type="radio"
                      value="Nam"
                      {...register('gender')}
                      className="mr-2 accent-red-600"
                    />
                    Nam
                  </label>
                  <label className="flex items-center text-gray-700 dark:text-white">
                    <input
                      type="radio"
                      value="Nữ"
                      {...register('gender')}
                      className="mr-2 accent-red-600"
                    />
                    Nữ
                  </label>
                </div>
                {errors.gender && (
                  <p className="text-red-500 text-xs mt-1">{errors.gender.message}</p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">
                  Thông tin này cần thiết để áp dụng công thức tính toán chỉ số BMR/TDEE chính xác hơn
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  title="Tuổi"
                  type="number"
                  name="age"
                  id="age"
                  register={register}
                  errors={errors.age}
                  placeholder="Nhập tuổi"
                />
                
                <Input
                  title="Chiều cao (cm)"
                  type="number"
                  name="height"
                  id="height"
                  register={register}
                  errors={errors.height}
                  placeholder="Nhập chiều cao"
                />
                
                <Input
                  title="Cân nặng (kg)"
                  type="number"
                  name="weight"
                  id="weight"
                  register={register}
                  errors={errors.weight}
                  placeholder="Nhập cân nặng"
                />
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-sm uppercase font-semibold text-gray-600 dark:text-gray-300 mb-3">Hoạt động & Mục tiêu</h4>
              
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-200 text-sm font-medium mb-1">
                  Mức độ hoạt động thể chất hàng ngày <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('activity_level')}
                  className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Chọn mức độ hoạt động</option>
                  <option value="Ít vận động">Ít vận động (Công việc văn phòng, không/rất ít tập thể dục)</option>
                  <option value="Vận động nhẹ">Vận động nhẹ (Tập thể dục nhẹ 1-3 ngày/tuần)</option>
                  <option value="Vận động vừa phải">Vận động vừa phải (Tập thể dục cường độ vừa 3-5 ngày/tuần)</option>
                  <option value="Vận động nhiều">Vận động nhiều (Tập thể dục cường độ cao 6-7 ngày/tuần)</option>
                  <option value="Vận động rất nhiều">Vận động rất nhiều (Công việc thể chất nặng hoặc VĐV chuyên nghiệp)</option>
                </select>
                {errors.activity_level && (
                  <p className="text-red-500 text-xs mt-1">{errors.activity_level.message}</p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-200 text-sm font-medium mb-1">
                  Mục tiêu sức khỏe <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('health_goal')}
                  className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Chọn mục tiêu</option>
                  <option value="Giảm cân">Giảm cân</option>
                  <option value="Duy trì cân nặng">Duy trì cân nặng</option>
                  <option value="Tăng cân">Tăng cân</option>
                  <option value="Tăng cơ bắp">Tăng cơ bắp</option>
                  <option value="Ăn uống lành mạnh hơn">Ăn uống lành mạnh hơn</option>
                  <option value="Cải thiện thể lực">Cải thiện thể lực</option>
                </select>
                {errors.health_goal && (
                  <p className="text-red-500 text-xs mt-1">{errors.health_goal.message}</p>
                )}
              </div>

              {showTargetWeight && (
                <Input
                  title="Cân nặng mục tiêu (kg)"
                  type="number"
                  name="target_weight"
                  id="target_weight"
                  register={register}
                  errors={errors.target_weight}
                  placeholder="Nhập cân nặng mục tiêu"
                />
              )}
            </div>

            <div className="mb-6">
              <h4 className="text-sm uppercase font-semibold text-gray-600 dark:text-gray-300 mb-3">Sở thích & Hạn chế ăn uống (Tùy chọn)</h4>
              
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-200 text-sm font-medium mb-1">
                  Chế độ ăn kiêng đặc biệt
                </label>
                <select
                  {...register('dietary_preferences')}
                  className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Không có</option>
                  <option value="Ăn chay">Ăn chay (Vegetarian)</option>
                  <option value="Ăn thuần chay">Ăn thuần chay (Vegan)</option>
                  <option value="Keto">Keto</option>
                  <option value="Low-carb">Low-carb</option>
                  <option value="Paleo">Paleo</option>
                  <option value="Không Gluten">Không Gluten</option>
                  <option value="Không Lactose">Không Lactose</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-200 text-sm font-medium mb-1">
                  Thực phẩm dị ứng hoặc không thích
                </label>
                <textarea
                  {...register('allergies')}
                  className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 dark:text-white"
                  placeholder="Nhập các thực phẩm dị ứng hoặc không thích (cách nhau bằng dấu phẩy)"
                  rows="3"
                ></textarea>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-gray-700 p-3 rounded-lg mb-4">
              <p className="text-sm text-gray-700 dark:text-gray-200">
                <span className="font-semibold">Lưu ý:</span> Các thông tin này được sử dụng để tính toán các chỉ số sức khỏe và đề xuất phù hợp với bạn. 
                Dữ liệu của bạn được bảo mật và chỉ được sử dụng để cá nhân hóa trải nghiệm của bạn.
              </p>
            </div>

            <div className="flex justify-center">
              {updateHealthProfileMutation.isPending ? (
                <button disabled className="block btn btn-sm md:w-auto bg-red-800 hover:bg-red-700">
                  <Loading classNameSpin="inline w-5 h-5 text-gray-200 animate-spin dark:text-gray-600 fill-red-600" />
                </button>
              ) : (
                <button type="submit" className="btn btn-sm text-white hover:bg-red-900 bg-red-800">
                  Lưu thông tin sức khỏe
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </ModalLayout>
  )
} 