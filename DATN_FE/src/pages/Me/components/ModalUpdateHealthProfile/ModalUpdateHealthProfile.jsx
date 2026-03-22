import { useSafeMutation } from '../../../../hooks/useSafeMutation'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { queryClient } from '../../../../main'
import { updateHealthProfile } from '../../../../apis/userApi'
import ModalLayout from '../../../../layouts/ModalLayout'
import Input from '../../../../components/InputComponents/Input'
import Loading from '../../../../components/GlobalComponents/Loading'
import { schemaHealthProfile } from '../../../../utils/rules'
import { FaHeartbeat } from 'react-icons/fa'

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

  const healthGoal = watch('health_goal')
  const showTargetWeight = healthGoal === 'Giảm cân' || healthGoal === 'Tăng cân'

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

  const updateHealthProfileMutation = useSafeMutation({
    mutationFn: (body) => updateHealthProfile(body)
  })

  const calculateBMI = (weight, height) => {
    const heightInMeters = height / 100
    return weight / (heightInMeters * heightInMeters)
  }

  const calculateBMR = (gender, weight, height, age) => {
    if (gender === 'Nam') {
      return 10 * weight + 6.25 * height - 5 * age + 5
    } else {
      return 10 * weight + 6.25 * height - 5 * age - 161
    }
  }

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

  const onSubmit = handleSubmit((data) => {
    const bmi = calculateBMI(data.weight, data.height)
    const bmr = calculateBMR(data.gender, data.weight, data.height, data.age)
    const tdee = calculateTDEE(bmr, data.activity_level)

    const healthData = { ...data, bmi, bmr, tdee }

    updateHealthProfileMutation.mutate(healthData, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['me'] })
        queryClient.invalidateQueries({ queryKey: ['meStats'] })
        toast.success('Cập nhật thông tin sức khỏe thành công')
        handleCloseModalUpdateHealthProfile()
      },
      onError: () => {
        toast.error('Có lỗi xảy ra khi cập nhật thông tin sức khỏe')
      }
    })
  })

  return (
    <ModalLayout closeModal={handleCloseModalUpdateHealthProfile} title='Cập nhật thông tin sức khỏe' icon={FaHeartbeat} size='lg'>
      <form noValidate onSubmit={onSubmit} className='p-5'>
        <div className='mb-6'>
          <h4 className='text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 mb-3 tracking-wider'>Thông tin cơ bản</h4>

          <div className='mb-4'>
            <label className='block text-gray-700 dark:text-gray-200 text-sm font-medium mb-2'>
              Giới tính sinh học <span className='text-red-500'>*</span>
            </label>
            <div className='flex gap-4'>
              <label className='flex items-center gap-2 text-gray-700 dark:text-white cursor-pointer px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors'>
                <input type='radio' value='Nam' {...register('gender')} className='accent-emerald-600' />
                Nam
              </label>
              <label className='flex items-center gap-2 text-gray-700 dark:text-white cursor-pointer px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors'>
                <input type='radio' value='Nữ' {...register('gender')} className='accent-emerald-600' />
                Nữ
              </label>
            </div>
            {errors.gender && <p className='text-red-500 text-xs mt-1'>{errors.gender.message}</p>}
            <p className='text-xs text-gray-400 dark:text-gray-500 mt-1'>
              Cần thiết để tính toán BMR/TDEE chính xác
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <Input title='Tuổi' type='number' name='age' id='age' register={register} errors={errors.age} placeholder='Tuổi' />
            <Input title='Chiều cao (cm)' type='number' name='height' id='height' register={register} errors={errors.height} placeholder='cm' />
            <Input title='Cân nặng (kg)' type='number' name='weight' id='weight' register={register} errors={errors.weight} placeholder='kg' />
          </div>
        </div>

        <div className='mb-6'>
          <h4 className='text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 mb-3 tracking-wider'>Hoạt động & Mục tiêu</h4>

          <div className='mb-4'>
            <label className='block text-gray-700 dark:text-gray-200 text-sm font-medium mb-1'>
              Mức độ hoạt động <span className='text-red-500'>*</span>
            </label>
            <select
              {...register('activity_level')}
              className='w-full p-2.5 border rounded-xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all'
            >
              <option value=''>Chọn mức độ</option>
              <option value='Ít vận động'>Ít vận động</option>
              <option value='Vận động nhẹ'>Vận động nhẹ (1-3 ngày/tuần)</option>
              <option value='Vận động vừa phải'>Vận động vừa phải (3-5 ngày/tuần)</option>
              <option value='Vận động nhiều'>Vận động nhiều (6-7 ngày/tuần)</option>
              <option value='Vận động rất nhiều'>Vận động rất nhiều (VĐV chuyên nghiệp)</option>
            </select>
            {errors.activity_level && <p className='text-red-500 text-xs mt-1'>{errors.activity_level.message}</p>}
          </div>

          <div className='mb-4'>
            <label className='block text-gray-700 dark:text-gray-200 text-sm font-medium mb-1'>
              Mục tiêu sức khỏe <span className='text-red-500'>*</span>
            </label>
            <select
              {...register('health_goal')}
              className='w-full p-2.5 border rounded-xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all'
            >
              <option value=''>Chọn mục tiêu</option>
              <option value='Giảm cân'>Giảm cân</option>
              <option value='Duy trì cân nặng'>Duy trì cân nặng</option>
              <option value='Tăng cân'>Tăng cân</option>
              <option value='Tăng cơ bắp'>Tăng cơ bắp</option>
              <option value='Cải thiện thể lực'>Cải thiện thể lực</option>
            </select>
            {errors.health_goal && <p className='text-red-500 text-xs mt-1'>{errors.health_goal.message}</p>}
          </div>

          {showTargetWeight && (
            <Input title='Cân nặng mục tiêu (kg)' type='number' name='target_weight' id='target_weight' register={register} errors={errors.target_weight} placeholder='kg' />
          )}
        </div>

        <div className='bg-amber-50 dark:bg-amber-900/10 p-3.5 rounded-xl mb-5 border border-amber-200/50 dark:border-amber-800/30'>
          <p className='text-xs text-amber-700 dark:text-amber-300'>
            <span className='font-semibold'>Lưu ý:</span> Thông tin được sử dụng để tính toán chỉ số sức khỏe và đề xuất phù hợp. Dữ liệu được bảo mật.
          </p>
        </div>

        <button
          type='submit'
          disabled={updateHealthProfileMutation.isPending}
          className='w-full py-3 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2'
        >
          {updateHealthProfileMutation.isPending ? (
            <Loading className='' classNameSpin='inline w-5 h-5 text-gray-200 animate-spin fill-white' />
          ) : (
            'Lưu thông tin sức khỏe'
          )}
        </button>
      </form>
    </ModalLayout>
  )
}